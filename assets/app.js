const app = document.getElementById('app');

const optionSets = {
  outputMode: ['Simple', 'Advanced', 'Advanced+'],
  recordingFormat: ['mp4', 'mkv', 'mov', 'flv', 'ts'],
  encoder: ['x264', 'NVENC (NVIDIA)', 'QuickSync (Intel)'],
  rateControl: ['CRF', 'CBR', 'VBR'],
  crf: ['16', '18', '20', '23'],
  keyframeInterval: ['1', '2', '3', '4'],
  preset: ['veryfast', 'faster', 'fast', 'medium'],
  profile: ['main', 'high'],
  tune: ['none', 'film', 'animation'],
  canvasResolution: ['1920x1080', '1600x900', '1280x720'],
  outputResolution: ['1280x720', '1920x1080', '854x480'],
  fps: ['24', '30', '60'],
  audio: ['mute complet (fără audio source)', 'desktop audio'],
  finalFps: ['24', '30']
};

const defaults = {
  outputMode: 'Advanced+',
  recordingFormat: 'mp4',
  encoder: 'x264',
  rateControl: 'CRF',
  crf: '18',
  keyframeInterval: '2',
  preset: 'veryfast',
  profile: 'high',
  tune: 'none',
  canvasResolution: '1920x1080',
  outputResolution: '1280x720',
  fps: '30',
  audio: 'mute complet (fără audio source)',
  finalFps: '24'
};

const STORAGE_KEY = 'lves-project-v2';
const state = {
  presets: null,
  clips: [],
  selectedClipId: null,
  activeView: 'timeline'
};

const $ = (id) => document.getElementById(id);

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (match) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[match]));
}

function createId() {
  return crypto?.randomUUID?.() || `clip-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function slugify(str = 'clip') {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'clip';
}

function downloadFile(filename, content, mime = 'text/plain;charset=utf-8') {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function toast(message) {
  const note = $('previewNote');
  if (note) note.textContent = message;
}

function copy(text) {
  navigator.clipboard?.writeText(text)
    .then(() => toast('Conținut copiat în clipboard.'))
    .catch(() => toast('Copierea automată a eșuat.'));
}

function getFieldValues() {
  return {
    url: $('projectUrl')?.value.trim() || '',
    name: $('projectName')?.value.trim() || '',
    message: $('visualMessage')?.value.trim() || '',
    duration: $('duration')?.value || '40',
    style: $('styleTemplate')?.value || ''
  };
}

function renderShell() {
  app.innerHTML = `
  <div class="app-shell">
    <aside class="sidebar panel">
      <div class="brand-row">
        <div class="logo"></div>
        <div>
          <h1>Link Video Editor Studio</h1>
          <p class="muted small">GitHub-native static studio pentru demo planning și export.</p>
        </div>
      </div>

      <section class="section">
        <div class="section-head"><h2>Input principal</h2><span class="badge success">Live now</span></div>
        <div class="field"><label for="projectUrl">Link proiect</label><input id="projectUrl" type="url" placeholder="https://exemplu.ro/demo" /></div>
        <div class="field"><label for="projectName">Nume produs</label><input id="projectName" type="text" placeholder="Ex: Alpis Fusion CRM Premium" /></div>
        <div class="field"><label for="visualMessage">Mesaj vizual</label><textarea id="visualMessage" placeholder="Ex: produsul pare integrat, clar și matur."></textarea></div>
        <div class="grid-2">
          <div class="field"><label for="duration">Durată</label><select id="duration"><option value="20">20</option><option value="30">30</option><option value="35">35</option><option value="40" selected>40</option><option value="45">45</option><option value="60">60</option></select></div>
          <div class="field"><label for="styleTemplate">Style</label><select id="styleTemplate"></select></div>
        </div>
      </section>

      <section class="section">
        <div class="section-head"><h2>Config</h2><span class="badge">Quality</span></div>
        <div class="grid-2 small-grid" id="configGrid"></div>
      </section>

      <section class="section">
        <div class="section-head"><h2>Readiness</h2><span class="badge warn">Static-only</span></div>
        <div class="score-card">
          <div class="score-value" id="readinessValue">0</div>
          <div>
            <strong>Readiness score</strong>
            <p class="muted small" id="readinessText">Completează inputurile principale.</p>
          </div>
        </div>
        <div class="chips" id="directionRules"></div>
      </section>

      <section class="section">
        <div class="section-head"><h2>Acțiuni</h2><span class="badge">Generate</span></div>
        <div class="action-stack">
          <button class="btn btn-primary" id="generateBtn">Generează demo-ul</button>
          <button class="btn btn-secondary" id="loadPresetBtn">Încarcă preseturile</button>
          <button class="btn btn-secondary" id="shareLinkBtn">Copiază link shareable</button>
          <button class="btn btn-secondary" id="copySummaryBtn">Copiază sumarul</button>
          <button class="btn btn-secondary" id="downloadJsonBtn">Descarcă JSON</button>
          <button class="btn btn-secondary" id="downloadPptxBtn">Descarcă PPTX</button>
          <button class="btn btn-secondary" id="downloadHtmlBtn">Descarcă HTML</button>
          <button class="btn btn-secondary" id="downloadAutomationBtn">Descarcă Automation Pack</button>
          <button class="btn btn-secondary" id="copyCliBtn">Copiază comenzi CLI</button>
          <button class="btn btn-danger" id="resetBtn">Reset</button>
        </div>
      </section>
    </aside>

    <main class="main-content">
      <section class="hero panel">
        <div class="hero-top">
          <div>
            <div class="kicker">Static-first product demo planning</div>
            <h2>From URL to filmable plan.</h2>
            <p class="muted">Preseturi JSON, autosave, shareable links, sample outputs și exporturi pentru GitHub-native workflow.</p>
          </div>
          <div class="tabs"><a class="tab active" href="./README.md">README</a><a class="tab" href="./examples/sample-plan.json">Example</a></div>
        </div>
        <div class="steps"><div class="step active">1. URL</div><div class="step">2. Style & config</div><div class="step">3. Generate</div></div>
        <div class="stats-grid">
          <div class="stat-card"><div class="stat-k" id="statClips">0</div><div class="muted">Clipuri</div></div>
          <div class="stat-card"><div class="stat-k" id="statShots">0</div><div class="muted">Shot-uri</div></div>
          <div class="stat-card"><div class="stat-k" id="statSlides">0</div><div class="muted">Slides</div></div>
          <div class="stat-card"><div class="stat-k" id="statDescriptions">0</div><div class="muted">Blocuri text</div></div>
        </div>
      </section>

      <section class="content-grid">
        <section class="panel content-panel">
          <div class="toolbar">
            <div>
              <h3>Clipuri și preseturi</h3>
              <p class="muted small">Preseturile vin din JSON.</p>
            </div>
            <div class="tabs" id="clipTabs"></div>
          </div>
          <div class="clip-list" id="clipList"></div>
        </section>

        <section class="panel content-panel">
          <div class="toolbar">
            <div>
              <h3>Output</h3>
              <p class="muted small">Timeline, slides, descrieri și exporturi.</p>
            </div>
            <div class="tabs" id="viewTabs" role="tablist" aria-label="Output views">
              <button class="tab active" role="tab" aria-selected="true" data-view="timeline">Timeline</button>
              <button class="tab" role="tab" aria-selected="false" data-view="slides">Slides</button>
              <button class="tab" role="tab" aria-selected="false" data-view="descriptions">Descrieri</button>
              <button class="tab" role="tab" aria-selected="false" data-view="summary">Sumar</button>
              <button class="tab" role="tab" aria-selected="false" data-view="voiceover">Voice-over</button>
              <button class="tab" role="tab" aria-selected="false" data-view="export">Export</button>
            </div>
          </div>

          <div class="preview-wrap">
            <div class="preview-note" id="previewNote">Adaugă un proiect sau încarcă preseturile.</div>
            <iframe id="sitePreview" class="preview hidden" title="preview"></iframe>
          </div>

          <div id="view-timeline" class="view-block"><div class="timeline" id="timeline"></div></div>
          <div id="view-slides" class="view-block hidden"><div class="slide-grid" id="slides"></div></div>
          <div id="view-descriptions" class="view-block hidden"><pre class="output-box" id="descriptions"></pre></div>
          <div id="view-summary" class="view-block hidden"><pre class="output-box" id="summary"></pre></div>
          <div id="view-voiceover" class="view-block hidden"><pre class="output-box" id="voiceover"></pre></div>
          <div id="view-export" class="view-block hidden"><pre class="output-box mono" id="exportBox"></pre></div>
        </section>
      </section>

      <section class="gallery-grid">
        <article class="panel card-panel"><h3>Visual proof</h3><div class="thumb-grid"><img src="./docs/screenshots/overview.svg" alt="Overview mock" /><img src="./docs/screenshots/timeline.svg" alt="Timeline mock" /><img src="./docs/screenshots/export.svg" alt="Export mock" /></div></article>
        <article class="panel card-panel"><h3>Examples</h3><ul class="clean-list"><li><a href="./examples/sample-plan.json">Sample plan</a></li><li><a href="./examples/sample-report.html">Sample report</a></li><li><a href="./examples/sample-voiceover.txt">Sample voice-over</a></li></ul></article>
      </section>
    </main>
  </div>`;
}

function renderConfig() {
  $('configGrid').innerHTML = Object.entries(optionSets).map(([key, values]) => `
    <div class="field">
      <label for="${key}">${key}</label>
      <select id="${key}">${values.map((value) => `<option ${defaults[key] === value ? 'selected' : ''}>${escapeHtml(value)}</option>`).join('')}</select>
    </div>
  `).join('');
}

function buildGenericShots(title, duration, url) {
  const steps = [
    { time: '00:00 – 00:04', action: 'Ține ecranul principal în cadru.', purpose: 'Prima impresie.' },
    { time: '00:04 – 00:10', action: 'Arată un hover sau o intrare în fluxul principal.', purpose: 'Interactivitate.' },
    { time: '00:10 – 00:18', action: `Intră în zona principală a produsului pornind de la ${url}.`, purpose: 'Structură de produs.' },
    { time: '00:18 – 00:26', action: 'Execută o acțiune reprezentativă.', purpose: 'Core workflow.' },
    { time: '00:26 – 00:40', action: 'Revino la overview și închide curat.', purpose: 'Payoff final.' }
  ];
  return steps.slice(0, Math.max(3, Math.round(duration / 10)));
}

function createClipFromInputs() {
  const { url, name, message, duration } = getFieldValues();
  const title = name || 'Clip nou';
  return {
    id: createId(),
    title: `CLIP CUSTOM — ${title}`,
    shortTitle: title,
    url,
    message: message || 'Produsul este fluid și clar.',
    duration: Number(duration || 40),
    preroll: [`Deschide ${url || 'URL-ul'}.`, 'Așteaptă încărcarea completă.', 'Poziționează-te pe primul ecran util.'],
    avoid: ['Nu scrie texte lungi.', 'Nu intra în zone secundare.'],
    shots: buildGenericShots(title, Number(duration || 40), url)
  };
}

function formatConfig() {
  return Object.fromEntries(Object.keys(optionSets).map((key) => [key, $(key).value]));
}

function generateSlides(clip) {
  return [
    { title: 'Hook vizual', bullets: [`Produs: ${clip.shortTitle}`, `Durată: ${clip.duration} sec`, `Mesaj: ${clip.message}`] },
    { title: 'Pre-roll', bullets: clip.preroll },
    { title: 'Momentul central', bullets: clip.shots.slice(0, 3).map((shot) => `${shot.time}: ${shot.action}`) },
    { title: 'Final', bullets: clip.shots.slice(-2).map((shot) => `${shot.time}: ${shot.purpose}`) },
    { title: 'Ce evităm', bullets: clip.avoid }
  ];
}

function generateDescriptions(clip, config) {
  return [
    `Recruiter\nDemo-ul pentru ${clip.shortTitle} comunică un produs clar și matur.`,
    `Portofoliu\nPlanificarea folosește ${config.canvasResolution} → ${config.outputResolution} și păstrează focusul pe payoff vizual.`,
    `Social\nSilent reel pentru ${clip.shortTitle}, cu hook rapid și final clar.`
  ].join('\n\n');
}

function generateSummary(clip, config) {
  return [
    `PROIECT: ${clip.title}`,
    `URL: ${clip.url}`,
    `DURATĂ: ${clip.duration} sec`,
    `MESAJ: ${clip.message}`,
    '',
    'SHOT LIST',
    ...clip.shots.map((shot, index) => `${index + 1}. ${shot.time} — ${shot.action} → ${shot.purpose}`),
    '',
    'CONFIG',
    ...Object.entries(config).map(([key, value]) => `- ${key}: ${value}`)
  ].join('\n');
}

function generateVoiceover(clip) {
  return `Acesta este ${clip.shortTitle}. Demo-ul urmărește să arate un produs clar, fluid și bine structurat. ${clip.shots.map((shot) => shot.purpose).join(' ')} Finalul confirmă payoff-ul principal.`;
}

function generateExport(clip, config) {
  const [w, h] = config.outputResolution.split('x');
  return [
    `ffmpeg -i input.${config.recordingFormat} -vf "fps=${config.finalFps},scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2" -c:v libx264 -crf ${config.crf} -pix_fmt yuv420p -movflags +faststart output-final.mp4`,
    '',
    JSON.stringify({ clip, config }, null, 2)
  ].join('\n');
}

function getSelectedClip() {
  return state.clips.find((clip) => clip.id === state.selectedClipId) || null;
}

function buildReadinessHints(values) {
  const hints = [];
  if (!values.url) hints.push('Adaugă un URL public pentru produs.');
  if (!values.name) hints.push('Completează numele produsului.');
  if (values.message.length < 18) hints.push('Mesajul vizual poate fi mai specific.');
  if (!values.style) hints.push('Alege un style template pentru consistență.');
  return hints;
}

function updateReadiness() {
  const values = getFieldValues();
  let score = 0;

  if (values.url.startsWith('http')) score += 30;
  if (values.name.length >= 3) score += 20;
  if (values.message.length >= 18) score += 20;
  if (Number(values.duration) >= 20 && Number(values.duration) <= 60) score += 15;
  if (values.style) score += 15;

  const hints = buildReadinessHints(values);
  $('readinessValue').textContent = score;
  $('readinessText').textContent = score >= 85
    ? 'Input foarte bun pentru generare și export.'
    : score >= 60
      ? `Baza este bună. ${hints[0] || 'Mai poți rafina contextul.'}`
      : hints.join(' ') || 'Completează URL, nume și obiectiv.';
}

function updateStats(slides, descriptions) {
  const selected = getSelectedClip();
  $('statClips').textContent = state.clips.length;
  $('statShots').textContent = state.clips.reduce((total, clip) => total + clip.shots.length, 0);
  $('statSlides').textContent = slides ? slides.length : selected ? generateSlides(selected).length : 0;
  $('statDescriptions').textContent = descriptions ? descriptions.split('\n\n').length : 0;
}

function renderClipTabs() {
  $('clipTabs').innerHTML = state.clips.map((clip, index) => `
    <button class="tab ${clip.id === state.selectedClipId ? 'active' : ''}" data-clip-id="${clip.id}">${index + 1}. ${escapeHtml(clip.shortTitle)}</button>
  `).join('') || '<span class="muted small">Niciun clip. Începe cu un URL sau cu preseturile.</span>';
}

function renderClipList() {
  if (!state.clips.length) {
    $('clipList').innerHTML = `
      <article class="clip-card">
        <strong>Empty state</strong>
        <p class="muted small">Încarcă preseturile pentru exemple gata pregătite sau generează un clip custom din URL-ul tău.</p>
      </article>`;
    return;
  }

  $('clipList').innerHTML = state.clips.map((clip) => `
    <article class="clip-card ${clip.id === state.selectedClipId ? 'active' : ''}" data-clip-id="${clip.id}" tabindex="0">
      <strong>${escapeHtml(clip.title)}</strong>
      <div class="muted small">${clip.duration}s · ${escapeHtml(clip.url)}</div>
      <p class="muted small">${escapeHtml(clip.message)}</p>
    </article>
  `).join('');
}

function renderEmptyOutput() {
  $('timeline').innerHTML = `
    <div class="preview-note">Nu există încă un clip selectat. Poți porni de la preseturile existente sau de la un URL custom.</div>
    <article class="clip-card">
      <strong>Pași recomandați</strong>
      <p class="muted small">1. Completează URL-ul și numele produsului.</p>
      <p class="muted small">2. Alege un style template.</p>
      <p class="muted small">3. Apasă „Generează demo-ul” sau „Încarcă preseturile”.</p>
    </article>`;
  $('slides').innerHTML = '';
  $('descriptions').textContent = '';
  $('summary').textContent = '';
  $('voiceover').textContent = '';
  $('exportBox').textContent = '';
  $('sitePreview').classList.add('hidden');
  $('previewNote').textContent = 'Adaugă un proiect sau încarcă preseturile.';
  updateStats(null, '');
}

function renderSelectedClip() {
  const clip = getSelectedClip();
  if (!clip) {
    renderEmptyOutput();
    return;
  }

  const config = formatConfig();
  const slides = generateSlides(clip);
  const descriptions = generateDescriptions(clip, config);
  const summary = generateSummary(clip, config);
  const voiceover = generateVoiceover(clip);
  const exportText = generateExport(clip, config);

  $('timeline').innerHTML = [
    `<div class="preview-note"><strong>Pre-roll</strong><br>${clip.preroll.map((item, index) => `${index + 1}. ${escapeHtml(item)}`).join('<br>')}</div>`,
    ...clip.shots.map((shot) => `
      <article class="shot">
        <strong>${escapeHtml(shot.time)}</strong>
        <div>${escapeHtml(shot.action)}<br><span class="muted small">${escapeHtml(shot.purpose)}</span></div>
      </article>`)
  ].join('');

  $('slides').innerHTML = slides.map((slide, index) => `
    <article class="slide">
      <strong>Slide ${index + 1}: ${escapeHtml(slide.title)}</strong>
      <ul>${slide.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join('')}</ul>
    </article>`).join('');

  $('descriptions').textContent = descriptions;
  $('summary').textContent = summary;
  $('voiceover').textContent = voiceover;
  $('exportBox').textContent = exportText;

  const preview = $('sitePreview');
  const note = $('previewNote');
  if (clip.url) {
    preview.classList.remove('hidden');
    preview.src = clip.url;
    note.innerHTML = `Preview-ul depinde de politica site-ului. Dacă iframe-ul e blocat, deschide direct: <a href="${escapeHtml(clip.url)}" target="_blank" rel="noreferrer">${escapeHtml(clip.url)}</a>.`;
  } else {
    preview.classList.add('hidden');
    note.textContent = 'Acest clip nu are URL setat pentru preview.';
  }

  updateStats(slides, descriptions);
}

function updateViewTabState() {
  document.querySelectorAll('[data-view]').forEach((button) => {
    const active = button.dataset.view === state.activeView;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', active ? 'true' : 'false');
    button.tabIndex = active ? 0 : -1;
  });
}

function setActiveView(view) {
  state.activeView = view;
  updateViewTabState();
  document.querySelectorAll('.view-block').forEach((block) => block.classList.add('hidden'));
  document.getElementById(`view-${view}`)?.classList.remove('hidden');
  saveProject();
}

function buildReportHtml() {
  const clip = getSelectedClip();
  if (!clip) return '<h1>Niciun clip selectat</h1>';
  const config = formatConfig();
  return `<!DOCTYPE html><html lang="ro"><head><meta charset="UTF-8"><title>${escapeHtml(clip.shortTitle)}</title></head><body><h1>${escapeHtml(clip.title)}</h1><pre>${escapeHtml(generateSummary(clip, config))}</pre></body></html>`;
}

function buildAutomationPlan(clip, config) {
  return {
    meta: {
      title: clip.title,
      shortTitle: clip.shortTitle,
      url: clip.url,
      duration: clip.duration,
      generatedAt: new Date().toISOString()
    },
    config,
    shots: clip.shots.map((shot, index) => ({
      index: index + 1,
      time: shot.time,
      action: shot.action,
      purpose: shot.purpose,
      actions: [{ type: 'wait', ms: 1500 }]
    }))
  };
}

function getRunnerTemplate() {
  return `import fs from 'fs';\nimport path from 'path';\nimport { chromium } from 'playwright';\nimport { execFile } from 'child_process';\nimport { promisify } from 'util';\nconst execFileAsync = promisify(execFile);\nconst plan = JSON.parse(fs.readFileSync('./plan.json','utf8'));\nconst sleep=(ms)=>new Promise(r=>setTimeout(r,ms));\nasync function transcode(inputPath,outputPath,fps,crf,resolution){ const [w,h]=String(resolution).split('x'); await execFileAsync('ffmpeg',['-y','-i',inputPath,'-vf',\`fps=\${fps},scale=\${w}:\${h}:force_original_aspect_ratio=decrease,pad=\${w}:\${h}:(ow-iw)/2:(oh-ih)/2\`,'-c:v','libx264','-profile:v','high','-crf',String(crf),'-pix_fmt','yuv420p','-movflags','+faststart',outputPath]); }\nconst outDir=path.resolve('./output'); fs.mkdirSync(outDir,{recursive:true}); const browser=await chromium.launch({headless:false}); const context=await browser.newContext({ viewport:{width:1920,height:1080}, recordVideo:{dir:outDir,size:{width:1920,height:1080}}}); const page=await context.newPage(); await page.goto(plan.meta.url,{waitUntil:'networkidle'}); await sleep(2500); for (const shot of plan.shots){ for (const action of shot.actions){ if(action.type==='wait') await sleep(action.ms||1000); } } const video = page.video(); await context.close(); await browser.close(); const rawPath=await video.path(); await transcode(rawPath,path.join(outDir,'final.mp4'),plan.config.finalFps||24,plan.config.crf||18,plan.config.outputResolution||'1280x720'); console.log('Done');`;
}

async function exportPptx(clip, config) {
  if (typeof PptxGenJS === 'undefined') {
    toast('PPTX lib unavailable.');
    return;
  }
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  const slide = pptx.addSlide();
  slide.background = { color: '0B1020' };
  slide.addText(clip.title, { x: 0.5, y: 0.5, w: 12, h: 0.6, color: 'EEF3FF', fontSize: 24, bold: true });
  slide.addText(clip.message, { x: 0.5, y: 1.3, w: 12, h: 1, color: 'EEF3FF', fontSize: 18 });
  slide.addText(generateSummary(clip, config), { x: 0.5, y: 2.5, w: 12, h: 4, color: 'A5B2D6', fontSize: 12 });
  await pptx.writeFile({ fileName: `${slugify(clip.shortTitle)}-demo-plan.pptx` });
  toast('PPTX generat.');
}

async function downloadAutomationPack() {
  const clip = getSelectedClip();
  if (!clip) {
    toast('Nu există clip selectat.');
    return;
  }
  if (typeof JSZip === 'undefined') {
    toast('JSZip unavailable.');
    return;
  }
  const zip = new JSZip();
  const config = formatConfig();
  zip.file('plan.json', JSON.stringify(buildAutomationPlan(clip, config), null, 2));
  zip.file('runner.mjs', getRunnerTemplate());
  zip.file('package.json', JSON.stringify({ name: 'lves-pack', private: true, type: 'module', scripts: { start: 'node runner.mjs' }, dependencies: { playwright: '^1.53.0' } }, null, 2));
  zip.file('README.md', '# Automation Pack\n\nRun locally with Node.js + FFmpeg.\n\n```bash\nnpm install\nnpx playwright install chromium\nnode runner.mjs\n```');
  const blob = await zip.generateAsync({ type: 'blob' });
  downloadFile(`${slugify(clip.shortTitle)}-automation-pack.zip`, blob, 'application/zip');
}

function saveProject() {
  const payload = {
    fields: getFieldValues(),
    clips: state.clips,
    selectedClipId: state.selectedClipId,
    activeView: state.activeView
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function restoreProject() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    $('projectUrl').value = data.fields?.url || '';
    $('projectName').value = data.fields?.name || '';
    $('visualMessage').value = data.fields?.message || '';
    $('duration').value = data.fields?.duration || '40';
    state.clips = data.clips || [];
    state.selectedClipId = data.selectedClipId || state.clips[0]?.id || null;
    state.activeView = data.activeView || 'timeline';
  } catch {
    toast('Salvarea locală anterioară nu a putut fi restaurată.');
  }
}

function applyShareableState() {
  const params = new URLSearchParams(location.search);
  if (params.get('url')) $('projectUrl').value = params.get('url');
  if (params.get('title')) $('projectName').value = params.get('title');
  if (params.get('message')) $('visualMessage').value = params.get('message');
  if (params.get('duration')) $('duration').value = params.get('duration');
  if (params.get('style')) $('styleTemplate').value = params.get('style');
}

function buildShareableUrl() {
  const values = getFieldValues();
  const params = new URLSearchParams({
    url: values.url,
    title: values.name,
    message: values.message,
    duration: values.duration,
    style: values.style
  });
  return `${location.origin}${location.pathname}?${params.toString()}`;
}

function handleViewTabKeydown(event) {
  const tabs = Array.from(document.querySelectorAll('[data-view]'));
  const currentIndex = tabs.indexOf(event.target);
  if (currentIndex === -1) return;

  if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
    event.preventDefault();
    const direction = event.key === 'ArrowRight' ? 1 : -1;
    const nextIndex = (currentIndex + direction + tabs.length) % tabs.length;
    tabs[nextIndex].focus();
    setActiveView(tabs[nextIndex].dataset.view);
  }
}

function attachEvents() {
  ['projectUrl', 'projectName', 'visualMessage'].forEach((id) => {
    $(id).addEventListener('input', () => {
      updateReadiness();
      saveProject();
    });
  });

  ['duration', 'styleTemplate'].forEach((id) => {
    $(id).addEventListener('change', () => {
      updateReadiness();
      saveProject();
    });
  });

  document.querySelectorAll('select').forEach((select) => {
    select.addEventListener('change', () => {
      updateReadiness();
      renderSelectedClip();
      saveProject();
    });
  });

  $('generateBtn').addEventListener('click', () => {
    if (!$('projectUrl').value.trim()) {
      toast('Adaugă mai întâi un link valid.');
      return;
    }
    const clip = createClipFromInputs();
    state.clips.unshift(clip);
    state.selectedClipId = clip.id;
    saveProject();
    renderAll();
    toast('Clip generat din inputurile curente.');
  });

  $('loadPresetBtn').addEventListener('click', () => {
    state.clips = JSON.parse(JSON.stringify(state.presets.clips));
    state.selectedClipId = state.clips[0]?.id || null;
    saveProject();
    renderAll();
    toast('Preseturi încărcate.');
  });

  $('shareLinkBtn').addEventListener('click', () => copy(buildShareableUrl()));
  $('copySummaryBtn').addEventListener('click', () => {
    const clip = getSelectedClip();
    if (clip) copy(generateSummary(clip, formatConfig()));
  });

  $('downloadJsonBtn').addEventListener('click', () => {
    const clip = getSelectedClip();
    if (!clip) {
      toast('Nu există clip selectat.');
      return;
    }
    const config = formatConfig();
    downloadFile(`${slugify(clip.shortTitle)}-video-plan.json`, JSON.stringify({
      clip,
      config,
      slides: generateSlides(clip),
      descriptions: generateDescriptions(clip, config),
      summary: generateSummary(clip, config),
      voiceover: generateVoiceover(clip)
    }, null, 2), 'application/json;charset=utf-8');
  });

  $('downloadPptxBtn').addEventListener('click', () => {
    const clip = getSelectedClip();
    if (clip) exportPptx(clip, formatConfig());
  });

  $('downloadHtmlBtn').addEventListener('click', () => {
    const clip = getSelectedClip();
    if (clip) downloadFile(`${slugify(clip.shortTitle)}-report.html`, buildReportHtml(), 'text/html;charset=utf-8');
  });

  $('downloadAutomationBtn').addEventListener('click', downloadAutomationPack);
  $('copyCliBtn').addEventListener('click', () => copy('npm install\nnpx playwright install chromium\nnode runner.mjs'));

  $('resetBtn').addEventListener('click', () => {
    localStorage.removeItem(STORAGE_KEY);
    location.href = location.pathname;
  });

  document.addEventListener('click', (event) => {
    const clipButton = event.target.closest('[data-clip-id]');
    if (clipButton) {
      state.selectedClipId = clipButton.dataset.clipId;
      saveProject();
      renderAll();
    }

    const viewButton = event.target.closest('[data-view]');
    if (viewButton) setActiveView(viewButton.dataset.view);
  });

  document.addEventListener('keydown', (event) => {
    const clipCard = event.target.closest?.('[data-clip-id]');
    if (clipCard && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      state.selectedClipId = clipCard.dataset.clipId;
      saveProject();
      renderAll();
    }
  });

  $('viewTabs').addEventListener('keydown', handleViewTabKeydown);
}

function renderAll() {
  $('directionRules').innerHTML = (state.presets?.directionRules || []).map((rule) => `<span>${escapeHtml(rule)}</span>`).join('');
  renderClipTabs();
  renderClipList();
  renderSelectedClip();
  updateReadiness();
  setActiveView(state.activeView || 'timeline');
}

async function init() {
  renderShell();
  renderConfig();

  const presets = await fetch('./assets/presets.json').then((response) => response.json());
  state.presets = presets;
  $('styleTemplate').innerHTML = presets.styles.map((style) => `<option>${escapeHtml(style)}</option>`).join('');

  restoreProject();
  if (getFieldValues().style) $('styleTemplate').value = getFieldValues().style;
  applyShareableState();
  attachEvents();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {});
  }

  renderAll();
}

init();
