import fs from 'node:fs/promises';
import path from 'node:path';
import { ensureOutputDirs, runAutomation } from '../src/runner.js';

const [planPath = 'output-plan.json', jobId = `workflow-${Date.now()}`] = process.argv.slice(2);

const absolutePlanPath = path.resolve(planPath);
const raw = await fs.readFile(absolutePlanPath, 'utf8');
const config = JSON.parse(raw);

await ensureOutputDirs();
await runAutomation({ ...config, jobId });

console.log(`Render completed for job: ${jobId}`);
