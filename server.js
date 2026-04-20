import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
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

app.get('/api/health', async (_req, res) => {
  res.json({ ok: true, presets: presets.length });
});

app.get('/api/presets', (_req, res) => {
  res.json({ presets });
});

app.post('/api/render', async (req, res) => {
  const jobId = uuidv4();
  const payload = req.body || {};

  const config = {
    ...payload,
    jobId
  };

  const paths = getJobPaths(jobId);
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
  console.log(`Link Video Automation listening on http://localhost:${PORT}`);
});
