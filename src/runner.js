import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { chromium } from 'playwright';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..');
const OUTPUT_ROOT = path.join(ROOT, 'output');

export function getJobPaths(jobId) {
  const baseDir = path.join(OUTPUT_ROOT, jobId);
  return {
    baseDir,
    requestJson: path.join(baseDir, 'request.json'),
    statusJson: path.join(baseDir, 'status.json'),
    rawVideoDir: path.join(baseDir, 'raw-video'),
    rawVideoWebm: path.join(baseDir, 'capture.webm'),
    finalVideoMp4: path.join(baseDir, 'final.mp4'),
    logTxt: path.join(baseDir, 'automation.log')
  };
}

export async function ensureOutputDirs() {
  await fs.mkdir(OUTPUT_ROOT, { recursive: true });
}

async function updateStatus(jobId, patch) {
  const paths = getJobPaths(jobId);
  let existing = {};
  if (existsSync(paths.statusJson)) {
    existing = JSON.parse(await fs.readFile(paths.statusJson, 'utf8'));
  }
  const next = { ...existing, ...patch, updatedAt: new Date().toISOString() };
  await fs.writeFile(paths.statusJson, JSON.stringify(next, null, 2), 'utf8');
}

async function appendLog(jobId, message) {
  const paths = getJobPaths(jobId);
  await fs.appendFile(paths.logTxt, `[${new Date().toISOString()}] ${message}\n`, 'utf8');
}

function parseResolution(text, fallback) {
  if (!text || !/^\d+x\d+$/i.test(text)) return fallback;
  const [width, height] = text.split('x').map(Number);
  return { width, height };
}

function ffmpegPath() {
  return process.env.FFMPEG_PATH || 'ffmpeg';
}

async function transcodeToMp4(inputPath, outputPath, options) {
  const fpsFinal = Number(options.fpsFinal || 24);
  const crf = Number(options.crf || 18);
  const resolution = options.outputResolution || '1280x720';
  const [w, h] = resolution.split('x').map(Number);

  const args = [
    '-y',
    '-i', inputPath,
    '-an',
    '-vf', `fps=${fpsFinal},scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2`,
    '-c:v', 'libx264',
    '-preset', options.preset || 'veryfast',
    '-crf', String(crf),
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    outputPath
  ];

  await new Promise((resolve, reject) => {
    const proc = spawn(ffmpegPath(), args, { stdio: 'pipe' });
    let stderr = '';
    proc.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
    proc.on('error', reject);
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg failed with exit code ${code}\n${stderr}`));
    });
  });
}

async function wait(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function findLocator(page, step) {
  const timeout = step.timeoutMs || 5000;
  if (step.textContains) {
    const locator = page.locator(step.selector || 'button, a, [role="button"], [role="tab"]').filter({ hasText: step.textContains }).first();
    await locator.waitFor({ state: 'visible', timeout });
    return locator;
  }
  const locator = page.locator(step.selector).first();
  await locator.waitFor({ state: 'visible', timeout });
  return locator;
}

async function runStep(page, step, jobId) {
  await appendLog(jobId, `Running step: ${JSON.stringify(step)}`);
  switch (step.type) {
    case 'wait':
      await wait(step.ms || 1000);
      return;
    case 'click': {
      const locator = await findLocator(page, step);
      await locator.click({ timeout: step.timeoutMs || 5000 });
      return;
    }
    case 'hover': {
      const locator = await findLocator(page, step);
      await locator.hover({ timeout: step.timeoutMs || 5000 });
      return;
    }
    case 'type': {
      const locator = await findLocator(page, step);
      await locator.click();
      await locator.fill('');
      await locator.type(step.text || '', { delay: step.delay || 100 });
      return;
    }
    case 'press': {
      await page.keyboard.press(step.keys);
      return;
    }
    case 'drag': {
      const source = await findLocator(page, { selector: step.source, timeoutMs: step.timeoutMs });
      const target = await findLocator(page, { selector: step.target, timeoutMs: step.timeoutMs });
      await source.dragTo(target);
      return;
    }
    case 'scroll': {
      const pixels = Number(step.pixels || 300);
      const speed = Math.max(50, Number(step.speedPxPerSecond || 200));
      const totalMs = Math.round((Math.abs(pixels) / speed) * 1000);
      const direction = pixels >= 0 ? 1 : -1;
      const steps = Math.max(5, Math.round(totalMs / 50));
      const delta = Math.abs(pixels) / steps;
      for (let i = 0; i < steps; i += 1) {
        await page.mouse.wheel(0, delta * direction);
        await wait(50);
      }
      return;
    }
    case 'fillSmart': {
      const fields = page.locator('input:not([type="hidden"]), textarea');
      const count = await fields.count();
      const values = step.values || [];
      for (let i = 0; i < Math.min(count, values.length); i += 1) {
        await fields.nth(i).click();
        await fields.nth(i).fill('');
        await fields.nth(i).type(values[i], { delay: 90 });
        await wait(200);
      }
      return;
    }
    case 'evaluate': {
      await page.evaluate(step.script);
      return;
    }
    default:
      throw new Error(`Unsupported step type: ${step.type}`);
  }
}

export async function runAutomation(config) {
  const jobId = config.jobId;
  const paths = getJobPaths(jobId);
  await fs.mkdir(paths.baseDir, { recursive: true });
  await fs.mkdir(paths.rawVideoDir, { recursive: true });

  await updateStatus(jobId, {
    ok: true,
    jobId,
    state: 'starting',
    progress: 2,
    message: 'Launching browser'
  });

  const viewport = config.viewport || parseResolution(config.output?.outputResolution, { width: 1280, height: 720 }) || { width: 1280, height: 720 };
  const output = {
    outputResolution: config.output?.outputResolution || '1280x720',
    fpsFinal: config.output?.fpsFinal || 24,
    crf: config.output?.crf || 18,
    preset: config.output?.preset || 'veryfast'
  };

  const browser = await chromium.launch({
    headless: process.env.HEADLESS !== 'false',
    args: ['--start-maximized']
  });

  const context = await browser.newContext({
    viewport,
    recordVideo: {
      dir: paths.rawVideoDir,
      size: viewport
    },
    colorScheme: 'dark'
  });

  const page = await context.newPage();
  page.setDefaultTimeout(10000);

  try {
    await updateStatus(jobId, { state: 'navigating', progress: 8, message: 'Opening target URL' });
    await page.goto(config.url, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await appendLog(jobId, `Loaded ${config.url}`);

    const shots = Array.isArray(config.shots) ? config.shots : [];
    if (shots.length === 0) {
      throw new Error('No shots provided.');
    }

    for (let i = 0; i < shots.length; i += 1) {
      const progress = 10 + Math.round((i / shots.length) * 65);
      await updateStatus(jobId, {
        state: 'recording',
        progress,
        currentStep: i + 1,
        totalSteps: shots.length,
        message: shots[i].note || shots[i].type
      });
      await runStep(page, shots[i], jobId);
      if (shots[i].type !== 'wait') {
        await wait(500);
      }
    }

    await updateStatus(jobId, { state: 'finalizing-capture', progress: 80, message: 'Closing browser context' });
    const video = page.video();
    await context.close();
    const rawPath = await video.path();
    await fs.copyFile(rawPath, paths.rawVideoWebm);
    await browser.close();

    await updateStatus(jobId, { state: 'transcoding', progress: 88, message: 'Converting to MP4 with FFmpeg' });
    await transcodeToMp4(paths.rawVideoWebm, paths.finalVideoMp4, output);

    await updateStatus(jobId, {
      ok: true,
      jobId,
      state: 'completed',
      progress: 100,
      message: 'MP4 exported',
      files: {
        requestJson: `/output/${jobId}/request.json`,
        statusJson: `/output/${jobId}/status.json`,
        rawVideoWebm: `/output/${jobId}/capture.webm`,
        finalVideoMp4: `/output/${jobId}/final.mp4`,
        logTxt: `/output/${jobId}/automation.log`
      }
    });
  } catch (error) {
    await appendLog(jobId, `ERROR: ${error instanceof Error ? error.stack || error.message : String(error)}`);
    try { await context.close(); } catch {}
    try { await browser.close(); } catch {}
    throw error;
  }
}
