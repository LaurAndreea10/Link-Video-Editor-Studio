import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { chromium } from 'playwright';
import { runAutomation, ensureOutputDirs, getJobPaths } from './src/runner.js';
import { presets } from './src/presets.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;

await ensureOutputDirs();

app.use(express.json({ limit: '10mb' }));
app.use('/output', express.static(path.join(__dirname, 'output')));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (_req, res) => {
  res.status(200).json({ ok: true });
});

app.get('/api/health', async (_req, res) => {
  res.json({ ok: true, presets: presets.length });
});

app.get('/api/presets', (_req, res) => {
  res.json({ presets });
});

function strip(value = '') {
  return String(value).replace(/\s+/g, ' ').trim();
}

function absoluteUrl(value) {
  try {
    return new URL(value).toString();
  } catch {
    return null;
  }
}

function buildCandidateShots(pageAnalysis) {
  const shots = [];
  if (pageAnalysis.headings?.length) {
    shots.push({ type: 'intro', reason: 'Există heading principal potrivit pentru hook vizual.' });
  }
  if ((pageAnalysis.cards?.length || 0) >= 2) {
    shots.push({ type: 'kpi-overview', reason: 'Există carduri/metrici care pot arăta valoare rapid.' });
  }
  if (pageAnalysis.tables?.length) {
    shots.push({ type: 'data-navigation', reason: 'Tabelele sugerează navigare în date reale.' });
  }
  if (pageAnalysis.forms?.length) {
    shots.push({ type: 'input-flow', reason: 'Formularele indică flux de lucru activ.' });
  }
  if ((pageAnalysis.navItems?.length || 0) >= 3) {
    shots.push({ type: 'navigation-flow', reason: 'Navigarea bogată permite demo de arhitectură.' });
  }
  return shots;
}

async function analyzePage(url) {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
    const analysis = await page.evaluate(() => {
      const clean = (text = '') => text.replace(/\s+/g, ' ').trim();
      const pickText = (selector, limit = 20) =>
        Array.from(document.querySelectorAll(selector))
          .map((el) => clean(el.innerText || el.textContent || ''))
          .filter(Boolean)
          .slice(0, limit);

      const pickInteractive = (limit = 40) =>
        Array.from(document.querySelectorAll("button, a, input, select, textarea, [role='button'], [onclick]"))
          .map((el) => {
            const text = clean(el.innerText || el.textContent || el.getAttribute('aria-label') || '');
            const tag = el.tagName.toLowerCase();
            return {
              tag,
              text,
              id: el.id || '',
              className: typeof el.className === 'string' ? el.className : '',
              href: el.getAttribute('href') || ''
            };
          })
          .filter((item) => item.text || item.id || item.href)
          .slice(0, limit);

      const sections = Array.from(document.querySelectorAll('main section, section, article, [data-section], .section, .card, .panel'))
        .map((el, index) => {
          const heading = el.querySelector('h1,h2,h3,h4');
          return {
            index,
            heading: heading ? clean(heading.textContent || '') : '',
            textSample: clean(el.textContent || '').slice(0, 220),
            classes: typeof el.className === 'string' ? el.className : ''
          };
        })
        .filter((item) => item.heading || item.textSample)
        .slice(0, 30);

      const forms = Array.from(document.forms).map((form, index) => ({
        index,
        inputs: Array.from(form.querySelectorAll('input, select, textarea')).map((el) => ({
          type: el.getAttribute('type') || el.tagName.toLowerCase(),
          name: el.getAttribute('name') || '',
          placeholder: el.getAttribute('placeholder') || '',
          label: el.getAttribute('aria-label') || ''
        })).slice(0, 15)
      })).slice(0, 10);

      const tables = Array.from(document.querySelectorAll('table')).map((table, index) => ({
        index,
        headers: Array.from(table.querySelectorAll('th')).map((th) => clean(th.textContent || '')).slice(0, 10),
        rows: table.querySelectorAll('tr').length
      })).slice(0, 10);

      const cards = Array.from(document.querySelectorAll(".card, [class*='card'], .kpi, [class*='metric'], [class*='stat']"))
        .map((el) => ({ text: clean(el.textContent || '').slice(0, 160) }))
        .filter((item) => item.text)
        .slice(0, 20);

      return {
        title: document.title || '',
        url: location.href,
        headings: pickText('h1, h2, h3', 30),
        buttons: pickText('button', 25),
        links: pickText('a', 30),
        navItems: pickText("nav a, aside a, [role='navigation'] a", 20),
        interactive: pickInteractive(),
        sections,
        forms,
        tables,
        cards,
        bodySample: clean(document.body?.innerText || '').slice(0, 5000)
      };
    });
    return analysis;
  } finally {
    await browser.close();
  }
}

async function callLLM({ pageAnalysis, url, productName, objective, duration, candidateShots }) {
  if (!process.env.LLM_API_URL || !process.env.LLM_API_KEY) {
    throw new Error('Missing LLM_API_URL or LLM_API_KEY in environment.');
  }

  const system = `
You are a senior product demo director.
Return ONLY valid JSON and no markdown.
Use the actual page structure to propose shots.
Do not hallucinate unsupported features.
`;

  const input = {
    input: { url, productName, objective, duration },
    pageAnalysis,
    candidateShots,
    outputSchema: {
      visualMessage: 'string',
      preroll: ['string'],
      shots: [{ time: '00:00 - 00:04', action: 'string', purpose: 'string', selectorHint: 'string', reason: 'string' }],
      descriptions: { recruiter: 'string', portfolio: 'string', social: 'string', technical: 'string' },
      voiceover: 'string',
      summary: 'string',
      planJson: {
        version: 1,
        productName: 'string',
        url: 'string',
        objective: 'string',
        duration: 40,
        visualMessage: 'string',
        preroll: ['string'],
        shots: []
      }
    }
  };

  const response = await fetch(process.env.LLM_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.LLM_API_KEY}`
    },
    body: JSON.stringify({ system, input })
  });

  if (!response.ok) {
    throw new Error(`LLM failed (${response.status}): ${await response.text()}`);
  }
  return response.json();
}

app.post('/api/generate-demo', async (req, res) => {
  try {
    const { url, productName, objective, duration } = req.body || {};
    const cleanUrl = absoluteUrl(url);
    if (!cleanUrl) {
      res.status(400).json({ ok: false, error: 'URL invalid' });
      return;
    }

    const pageAnalysis = await analyzePage(cleanUrl);
    const candidateShots = buildCandidateShots(pageAnalysis);
    const aiResult = await callLLM({
      pageAnalysis,
      candidateShots,
      url: cleanUrl,
      productName: strip(productName || 'Produs fără nume'),
      objective: strip(objective || 'Demo premium pentru sales'),
      duration: Number(duration || 40)
    });

    res.status(200).json({
      ok: true,
      input: {
        url: cleanUrl,
        productName: strip(productName || 'Produs fără nume'),
        objective: strip(objective || 'Demo premium pentru sales'),
        duration: Number(duration || 40)
      },
      pageAnalysis,
      candidateShots,
      ...aiResult
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

app.post('/api/render', async (req, res) => {
  try {
    const jobId = uuidv4();
    const payload = req.body || {};

    const config = {
      ...payload,
      jobId
    };

    const paths = getJobPaths(jobId);
    await fs.mkdir(paths.baseDir, { recursive: true });
    await fs.writeFile(paths.requestJson, JSON.stringify(config, null, 2), 'utf8');

    res.json({
      ok: true,
      jobId,
      status: 'queued',
      requestPath: paths.requestJson,
      statusUrl: `/api/render/${jobId}`,
      outputBaseUrl: `/output/${jobId}`
    });

    runAutomation(config).catch(async (error) => {
      const failStatus = {
        ok: false,
        jobId,
        state: 'failed',
        error: error instanceof Error ? error.message : String(error)
      };
      await fs.writeFile(paths.statusJson, JSON.stringify(failStatus, null, 2), 'utf8');
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

app.get('/api/render/:jobId', async (req, res) => {
  const { jobId } = req.params;
  const paths = getJobPaths(jobId);
  if (!existsSync(paths.statusJson)) {
    return res.status(404).json({ ok: false, error: 'Job not found or not started yet.' });
  }
  const raw = await fs.readFile(paths.statusJson, 'utf8');
  res.type('application/json').send(raw);
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
