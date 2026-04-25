import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const root = process.cwd();
const inputPath = process.argv[2] || process.env.PLAN_PATH || 'output-plan.json';
const outputDir = path.resolve(process.argv[3] || process.env.OUTPUT_DIR || 'workflow-output');

function log(message) {
  console.log(`[render-export] ${message}`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function slugify(value) {
  return String(value || 'plan').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'plan';
}

function parseDuration(plan) {
  return Number(plan?.clip?.duration || plan?.duration || 12) || 12;
}

function pickSource(plan) {
  return plan?.clip?.sourceUrl || plan?.clip?.url || plan?.sourceUrl || plan?.url || '';
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function writeJson(file, data) {
  await fs.writeFile(file, JSON.stringify(data, null, 2), 'utf8');
}

async function createReportHtml(plan, destination) {
  const clip = plan.clip || plan;
  const shots = Array.isArray(clip.shots) ? clip.shots : [];
  const shorts = Array.isArray(plan.shorts || clip.shorts) ? (plan.shorts || clip.shorts) : [];
  const keyframes = Array.isArray(plan.keyframes || clip.keyframes) ? (plan.keyframes || clip.keyframes) : [];
  const translations = Array.isArray(plan.translations || clip.translations) ? (plan.translations || clip.translations) : [];
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${clip.shortTitle || clip.title || 'Render Report'}</title>
<style>
body{font-family:Inter,Arial,sans-serif;background:#0b1020;color:#edf3ff;max-width:1100px;margin:0 auto;padding:32px;line-height:1.6}
.card{background:#121a31;border:1px solid rgba(255,255,255,.08);border-radius:18px;padding:18px;margin:0 0 18px}
small{color:#9eb0d8}.pill{display:inline-block;padding:6px 10px;border-radius:999px;background:#1d294d;border:1px solid rgba(255,255,255,.08);margin-right:8px}pre{white-space:pre-wrap;background:#0a1328;border-radius:14px;padding:14px;border:1px solid rgba(255,255,255,.08)}
</style>
</head>
<body>
<h1>${clip.title || clip.shortTitle || 'Render report'}</h1>
<div class="card"><span class="pill">${clip.demoStyleLabel || clip.demoStyle || 'style'}</span><span class="pill">${clip.recommendedFormat || plan?.styleRecommendations?.recommendedFormat || '16:9'}</span><span class="pill">${parseDuration(plan)}s</span></div>
<div class="card"><h2>Summary</h2><p>${clip.aiSummary || plan.summary || clip.message || ''}</p></div>
<div class="card"><h2>Shots</h2>${shots.map((shot) => `<p><strong>${shot.time || ''}</strong><br>${shot.action || ''}<br><small>${shot.purpose || ''}</small></p>`).join('')}</div>
<div class="card"><h2>Shorts</h2><pre>${JSON.stringify(shorts, null, 2)}</pre></div>
<div class="card"><h2>Keyframes</h2><pre>${JSON.stringify(keyframes, null, 2)}</pre></div>
<div class="card"><h2>Translations</h2><pre>${JSON.stringify(translations, null, 2)}</pre></div>
</body>
</html>`;
  await fs.writeFile(destination, html, 'utf8');
}

async function capturePreview(plan, destination) {
  const source = pickSource(plan);
  if (!source) return null;
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  try {
    if (/\.mp4($|\?)/i.test(source) || /\.webm($|\?)/i.test(source)) {
      await page.setContent(`<html><body style="margin:0;background:#000;display:grid;place-items:center;height:100vh"><video src="${source}" controls autoplay muted playsinline style="max-width:100%;max-height:100%"></video></body></html>`);
      await sleep(1800);
    } else {
      await page.goto(source, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForLoadState('networkidle', { timeout: 12000 }).catch(() => {});
      await sleep(1200);
    }
    await page.screenshot({ path: destination, fullPage: false });
    return destination;
  } finally {
    await browser.close();
  }
}

function ffmpeg(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn('ffmpeg', args, { stdio: 'pipe' });
    let stderr = '';
    proc.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
    proc.on('close', (code) => code === 0 ? resolve() : reject(new Error(stderr || `ffmpeg exit ${code}`)));
    proc.on('error', reject);
  });
}

async function maybeRenderTeaser(plan, previewPath, destination) {
  if (!previewPath || !existsSync(previewPath)) return null;
  const duration = Math.max(6, Math.min(20, parseDuration(plan)));
  const format = plan?.styleRecommendations?.recommendedFormat || plan?.clip?.recommendedFormat || '16:9';
  const target = format === '9:16' ? { w: 1080, h: 1920 } : { w: 1280, h: 720 };
  const filter = `scale=${target.w}:${target.h}:force_original_aspect_ratio=decrease,pad=${target.w}:${target.h}:(ow-iw)/2:(oh-ih)/2,zoompan=z='min(zoom+0.0008,1.08)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=${target.w}x${target.h},fps=24`;
  await ffmpeg(['-y', '-loop', '1', '-i', previewPath, '-t', String(duration), '-an', '-vf', filter, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', destination]);
  return destination;
}

async function main() {
  await ensureDir(outputDir);
  const raw = await fs.readFile(path.resolve(root, inputPath), 'utf8');
  const plan = JSON.parse(raw);
  const name = slugify(plan?.clip?.shortTitle || plan?.clip?.title || path.basename(inputPath, path.extname(inputPath)));

  const normalizedPath = path.join(outputDir, `${name}.normalized.json`);
  const reportPath = path.join(outputDir, `${name}.report.html`);
  const previewPath = path.join(outputDir, `${name}.preview.png`);
  const teaserPath = path.join(outputDir, `${name}.teaser.mp4`);

  await writeJson(normalizedPath, plan);
  await createReportHtml(plan, reportPath);
  log(`Report written to ${reportPath}`);

  const preview = await capturePreview(plan, previewPath).catch((error) => {
    log(`Preview capture skipped: ${error.message}`);
    return null;
  });

  if (preview) {
    log(`Preview captured at ${preview}`);
    await maybeRenderTeaser(plan, preview, teaserPath).catch((error) => {
      log(`Teaser render skipped: ${error.message}`);
    });
  }

  const manifest = {
    inputPath,
    generatedAt: new Date().toISOString(),
    files: {
      normalizedPath,
      reportPath,
      previewPath: existsSync(previewPath) ? previewPath : null,
      teaserPath: existsSync(teaserPath) ? teaserPath : null
    }
  };
  await writeJson(path.join(outputDir, `${name}.manifest.json`), manifest);
  log('Done.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
