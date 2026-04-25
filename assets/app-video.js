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
  outputMode: 'Advanced+', recordingFormat: 'mp4', encoder: 'x264', rateControl: 'CRF', crf: '18',
  keyframeInterval: '2', preset: 'veryfast', profile: 'high', tune: 'none', canvasResolution: '1920x1080',
  outputResolution: '1280x720', fps: '30', audio: 'mute complet (fără audio source)', finalFps: '24'
};

const STORAGE_KEY = 'lves-video-v1';
const state = {
  lang: 'ro',
  presets: null,
  clips: [],
  selectedClipId: null,
  activeView: 'timeline',
  pendingVideoFile: null,
  pendingVideoMeta: null,
  pendingVideoThumbs: []
};

const copy = {
  ro: {
    appName: 'Link Video Editor Studio',
    tagline: 'Studio static pentru demo planning, shorts, keyframes și traduceri.',
    introKicker: 'Multilingual video + demo workspace',
    introTitle: 'Din link sau video atașat la plan, shorts și traduceri.',
    introBody: 'Poți lucra pe produse web sau pe video: creezi shorts, extragi cadre cheie și pregătești texte localizate într-o interfață static-first pentru GitHub Pages.',
    primaryInput: 'Input principal', mediaInput: 'Sursă media', config: 'Config', actions: 'Acțiuni', readiness: 'Readiness',
    projectUrl: 'Link proiect / pagină', projectName: 'Nume produs / video', visualMessage: 'Mesaj vizual / hook',
    duration: 'Durată', style: 'Style', mediaMode: 'Tip sursă', pageMode: 'Pagină web', videoUrlMode: 'Video din link', videoFileMode: 'Video atașat',
    pageModeDesc: 'Pentru demo-uri de produs din URL.', videoUrlModeDesc: 'Pentru clipuri găzduite online.', videoFileModeDesc: 'Pentru fișiere locale încărcate în browser.',
    videoUrl: 'Link video', videoFile: 'Fișier video', videoNote: 'Pentru fișiere locale putem citi durata și putem genera miniaturi de cadre cheie direct în browser. Pentru linkuri remote, extragerea reală de cadre depinde de CORS; dacă nu este permisă, generezi în continuare timestamp-uri și planuri.',
    languageTargets: 'Limbi pentru traduceri', shortsCount: 'Număr shorts', keyframeCount: 'Număr cadre cheie', clipTabs: 'Clipuri și preseturi', output: 'Output',
    timeline: 'Timeline', shorts: 'Shorts', keyframes: 'Cadre cheie', translations: 'Traduceri', slides: 'Slides', summary: 'Sumar', export: 'Export',
    generate: 'Generează workspace', loadPresets: 'Încarcă preseturile', shareLink: 'Copiază link shareable', copySummary: 'Copiază sumarul',
    downloadJson: 'Descarcă JSON', downloadPptx: 'Descarcă PPTX', downloadHtml: 'Descarcă HTML', downloadPack: 'Descarcă Automation Pack',
    copyCli: 'Copiază comenzi CLI', reset: 'Reset', previewHint: 'Adaugă un proiect, un link video sau un fișier video pentru a genera materialele.',
    clips: 'Clipuri', shots: 'Shot-uri', slidesStat: 'Slides', keyframesStat: 'Cadre', emptyClip: 'Niciun clip. Începe cu un URL, un link video, un upload sau cu preseturile.',
    emptyOutput: 'Nu există încă un clip selectat. Generează un workspace sau încarcă preseturile.',
    readinessLow: 'Completează sursa, numele și hook-ul principal.', readinessMid: 'Baza este bună. Mai poți rafina contextul sau limba.', readinessHigh: 'Input foarte bun pentru generare și export.',
    localOnlyHint: 'GitHub Pages rămâne static. Pentru procesare media grea și export automat, folosește Automation Pack sau workflow-urile GitHub Actions.',
    mediaPreview: 'Preview media', pagePreview: 'Preview pagină', keyframeRemote: 'Pentru linkuri video remote, cadrele-cheie reale depind de CORS. Timestamp-urile sunt generate oricum.',
    sampleExamples: 'Examples', visualProof: 'Visual proof', language: 'Limbă', attached: 'Atașat', linked: 'Din link', webpage: 'Pagină',
    generated: 'Generat', selected: 'Selectat', noPreview: 'Preview indisponibil pentru această sursă.',
    timelineIntro: 'Planul de bază al demo-ului / video-ului.', shortsIntro: 'Shorts sugerate pe baza sursei și a hook-ului.', keyframesIntro: 'Cadre cheie reale pentru upload sau timestamp-uri pentru surse remote.', translationsIntro: 'Texte localizate pentru hook, caption și CTA.',
    exportIntro: 'Manifest export și pași de procesare.',
    preRoll: 'Pre-roll', processing: 'Procesare', sourceLabel: 'Sursă', statusCopied: 'Conținut copiat în clipboard.', statusCopyFail: 'Copierea automată a eșuat.',
    statusGenerated: 'Workspace generat.', statusNeedSource: 'Adaugă mai întâi un link sau un video.', statusPack: 'Automation Pack generat.',
    ro: 'Română', en: 'English', es: 'Spaniolă', fr: 'Franceză', de: 'Germană',
    samplePlan: 'Plan demo', caption: 'Caption', cta: 'CTA',
    frameExtractionUnavailable: 'Nu s-au putut extrage miniaturi reale; afișez timestamp-uri recomandate.'
  },
  en: {
    appName: 'Link Video Editor Studio',
    tagline: 'Static studio for demo planning, shorts, keyframes and translations.',
    introKicker: 'Multilingual video + demo workspace',
    introTitle: 'From link or uploaded video to plan, shorts and translations.',
    introBody: 'Work with web products or video sources: build shorts, extract keyframes and prepare localized copy in a static-first GitHub Pages workspace.',
    primaryInput: 'Primary input', mediaInput: 'Media source', config: 'Config', actions: 'Actions', readiness: 'Readiness',
    projectUrl: 'Project / page link', projectName: 'Product / video name', visualMessage: 'Visual message / hook',
    duration: 'Duration', style: 'Style', mediaMode: 'Source type', pageMode: 'Web page', videoUrlMode: 'Video from link', videoFileMode: 'Uploaded video',
    pageModeDesc: 'For product demos from a URL.', videoUrlModeDesc: 'For externally hosted clips.', videoFileModeDesc: 'For local files uploaded in the browser.',
    videoUrl: 'Video URL', videoFile: 'Video file', videoNote: 'For local files we can read duration and generate real keyframe thumbnails in-browser. For remote links, real frame extraction depends on CORS; if blocked, timestamp plans still work.',
    languageTargets: 'Translation languages', shortsCount: 'Shorts count', keyframeCount: 'Keyframe count', clipTabs: 'Clips and presets', output: 'Output',
    timeline: 'Timeline', shorts: 'Shorts', keyframes: 'Keyframes', translations: 'Translations', slides: 'Slides', summary: 'Summary', export: 'Export',
    generate: 'Generate workspace', loadPresets: 'Load presets', shareLink: 'Copy shareable link', copySummary: 'Copy summary',
    downloadJson: 'Download JSON', downloadPptx: 'Download PPTX', downloadHtml: 'Download HTML', downloadPack: 'Download Automation Pack',
    copyCli: 'Copy CLI commands', reset: 'Reset', previewHint: 'Add a project, a video link or a video file to generate assets.',
    clips: 'Clips', shots: 'Shots', slidesStat: 'Slides', keyframesStat: 'Frames', emptyClip: 'No clips yet. Start with a URL, video link, upload or presets.',
    emptyOutput: 'No selected clip yet. Generate a workspace or load presets.',
    readinessLow: 'Add a source, a name and a clear hook.', readinessMid: 'Good base. You can still refine the context or translation setup.', readinessHigh: 'Very strong input for generation and export.',
    localOnlyHint: 'GitHub Pages stays static. For heavy media processing and automated exports, use the Automation Pack or GitHub Actions workflows.',
    mediaPreview: 'Media preview', pagePreview: 'Page preview', keyframeRemote: 'For remote video links, real keyframes depend on CORS. Timestamps are still generated.',
    sampleExamples: 'Examples', visualProof: 'Visual proof', language: 'Language', attached: 'Attached', linked: 'Linked', webpage: 'Page',
    generated: 'Generated', selected: 'Selected', noPreview: 'Preview unavailable for this source.',
    timelineIntro: 'Base plan for the demo or video.', shortsIntro: 'Suggested shorts based on the source and hook.', keyframesIntro: 'Real keyframes for uploads or recommended timestamps for remote sources.', translationsIntro: 'Localized hook, caption and CTA copy.',
    exportIntro: 'Export manifest and processing steps.',
    preRoll: 'Pre-roll', processing: 'Processing', sourceLabel: 'Source', statusCopied: 'Copied to clipboard.', statusCopyFail: 'Automatic copy failed.',
    statusGenerated: 'Workspace generated.', statusNeedSource: 'Add a link or a video first.', statusPack: 'Automation Pack generated.',
    ro: 'Romanian', en: 'English', es: 'Spanish', fr: 'French', de: 'German',
    samplePlan: 'Demo plan', caption: 'Caption', cta: 'CTA',
    frameExtractionUnavailable: 'Real thumbnails could not be extracted; showing recommended timestamps instead.'
  }
};

const langNames = { ro: { ro: 'Română', en: 'English', es: 'Español', fr: 'Français', de: 'Deutsch' }, en: { ro: 'Romanian', en: 'English', es: 'Spanish', fr: 'French', de: 'German' } };
const translationTemplates = {
  ro: ({ title, message }) => ({ title, caption: `${title} pe scurt: ${message}`, cta: 'Vezi versiunea completă / continuă fluxul.' }),
  en: ({ title, message }) => ({ title, caption: `${title} in one short: ${message}`, cta: 'Watch the full version / continue the flow.' }),
  es: ({ title, message }) => ({ title, caption: `${title} en un short: ${message}`, cta: 'Mira la versión completa / continúa el flujo.' }),
  fr: ({ title, message }) => ({ title, caption: `${title} en format court : ${message}`, cta: 'Voir la version complète / continuer le flux.' }),
  de: ({ title, message }) => ({ title, caption: `${title} in einem Short: ${message}`, cta: 'Vollversion ansehen / Flow fortsetzen.' })
};

const $ = (id) => document.getElementById(id);
const t = (key) => copy[state.lang][key] || key;

function escapeHtml(v = '') { return String(v).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m])); }
function createId() { return crypto?.randomUUID?.() || `clip-${Date.now()}-${Math.random().toString(16).slice(2)}`; }
function slugify(str = 'clip') { return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'clip'; }
function downloadFile(filename, content, mime = 'text/plain;charset=utf-8') { const blob = content instanceof Blob ? content : new Blob([content], { type: mime }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
function toast(message) { const note = $('previewNote'); if (note) note.textContent = message; }
function copyText(text) { navigator.clipboard?.writeText(text).then(() => toast(t('statusCopied'))).catch(() => toast(t('statusCopyFail'))); }
function secToTime(sec) { const s = Math.max(0, Math.round(sec)); const mm = String(Math.floor(s / 60)).padStart(2, '0'); const ss = String(s % 60).padStart(2, '0'); return `${mm}:${ss}`; }
function parseDuration(value) { const n = Number(value); return Number.isFinite(n) ? n : 0; }
function getFieldValues() {
  return {
    projectUrl: $('projectUrl')?.value.trim() || '', projectName: $('projectName')?.value.trim() || '', visualMessage: $('visualMessage')?.value.trim() || '',
    duration: $('duration')?.value || '40', style: $('styleTemplate')?.value || '', mediaMode: document.querySelector('input[name="mediaMode"]:checked')?.value || 'page',
    videoUrl: $('videoUrl')?.value.trim() || '', shortsCount: Number($('shortsCount')?.value || 3), keyframeCount: Number($('keyframeCount')?.value || 4),
    translationTargets: Array.from(document.querySelectorAll('input[name="translationTargets"]:checked')).map((x) => x.value)
  };
}
function getPrimarySource(values = getFieldValues()) {
  if (values.mediaMode === 'video-file' && state.pendingVideoFile) return { type: 'video-file', label: t('attached'), url: state.pendingVideoMeta?.objectUrl || '', fileName: state.pendingVideoFile.name };
  if (values.mediaMode === 'video-url' && values.videoUrl) return { type: 'video-url', label: t('linked'), url: values.videoUrl };
  if (values.projectUrl) return { type: 'page', label: t('webpage'), url: values.projectUrl };
  return null;
}
function buildReadiness() {
  const values = getFieldValues();
  let score = 0;
  const source = getPrimarySource(values);
  if (source?.url) score += 30;
  if ((values.projectName || state.pendingVideoFile?.name || '').length >= 3) score += 20;
  if (values.visualMessage.length >= 16) score += 20;
  if (values.translationTargets.length) score += 15;
  if (values.style) score += 15;
  const text = score >= 85 ? t('readinessHigh') : score >= 55 ? t('readinessMid') : t('readinessLow');
  return { score, text };
}
function renderShell() {
  app.innerHTML = `
  <div class="app-shell">
    <aside class="sidebar panel">
      <div class="brand-row">
        <div class="logo"></div>
        <div>
          <h1>${t('appName')}</h1>
          <p class="muted small">${t('tagline')}</p>
        </div>
      </div>
      <div class="lang-switch"><span class="muted small">${t('language')}</span><button class="lang-btn ${state.lang === 'ro' ? 'active' : ''}" data-lang="ro">RO</button><button class="lang-btn ${state.lang === 'en' ? 'active' : ''}" data-lang="en">EN</button></div>

      <section class="section">
        <div class="section-head"><h2>${t('primaryInput')}</h2><span class="badge success">GitHub Pages</span></div>
        <div class="field"><label for="projectUrl">${t('projectUrl')}</label><input id="projectUrl" type="url" placeholder="https://example.com/demo" /></div>
        <div class="field"><label for="projectName">${t('projectName')}</label><input id="projectName" type="text" placeholder="Alpis Fusion CRM Premium" /></div>
        <div class="field"><label for="visualMessage">${t('visualMessage')}</label><textarea id="visualMessage" placeholder="Fast hook, clear payoff, one-screen story."></textarea></div>
        <div class="grid-2"><div class="field"><label for="duration">${t('duration')}</label><select id="duration"><option value="20">20</option><option value="30">30</option><option value="35">35</option><option value="40" selected>40</option><option value="45">45</option><option value="60">60</option></select></div><div class="field"><label for="styleTemplate">${t('style')}</label><select id="styleTemplate"></select></div></div>
      </section>

      <section class="section">
        <div class="section-head"><h2>${t('mediaInput')}</h2><span class="badge">Video</span></div>
        <div class="media-mode-grid">
          <label class="mode-card"><input type="radio" name="mediaMode" value="page" checked hidden><strong>${t('pageMode')}</strong><span class="muted small">${t('pageModeDesc')}</span></label>
          <label class="mode-card"><input type="radio" name="mediaMode" value="video-url" hidden><strong>${t('videoUrlMode')}</strong><span class="muted small">${t('videoUrlModeDesc')}</span></label>
          <label class="mode-card"><input type="radio" name="mediaMode" value="video-file" hidden><strong>${t('videoFileMode')}</strong><span class="muted small">${t('videoFileModeDesc')}</span></label>
        </div>
        <div class="field"><label for="videoUrl">${t('videoUrl')}</label><input id="videoUrl" type="url" placeholder="https://example.com/video.mp4" /></div>
        <div class="field"><label for="videoFile">${t('videoFile')}</label><div class="upload-box"><input id="videoFile" type="file" accept="video/*" /></div></div>
        <div class="field"><label>${t('languageTargets')}</label><div class="check-grid">${['ro', 'en', 'es', 'fr', 'de'].map((lang) => `<label class="check-chip"><input type="checkbox" name="translationTargets" value="${lang}" ${lang === 'en' ? 'checked' : ''}> <span>${escapeHtml(langNames[state.lang][lang])}</span></label>`).join('')}</div></div>
        <div class="grid-2"><div class="field"><label for="shortsCount">${t('shortsCount')}</label><select id="shortsCount"><option value="2">2</option><option value="3" selected>3</option><option value="4">4</option><option value="5">5</option></select></div><div class="field"><label for="keyframeCount">${t('keyframeCount')}</label><select id="keyframeCount"><option value="3">3</option><option value="4" selected>4</option><option value="6">6</option><option value="8">8</option></select></div></div>
        <div class="section-note">${t('videoNote')}</div>
      </section>

      <section class="section"><div class="section-head"><h2>${t('config')}</h2><span class="badge">Quality</span></div><div class="grid-2 small-grid" id="configGrid"></div></section>
      <section class="section"><div class="section-head"><h2>${t('readiness')}</h2><span class="badge warn">Static-first</span></div><div class="score-card"><div class="score-value" id="readinessValue">0</div><div><strong>${t('readiness')}</strong><p class="muted small" id="readinessText">${t('readinessLow')}</p></div></div><div class="section-note">${t('localOnlyHint')}</div><div class="chips" id="directionRules"></div></section>
      <section class="section"><div class="section-head"><h2>${t('actions')}</h2><span class="badge">Generate</span></div><div class="action-stack"><button class="btn btn-primary" id="generateBtn">${t('generate')}</button><button class="btn btn-secondary" id="loadPresetBtn">${t('loadPresets')}</button><button class="btn btn-secondary" id="shareLinkBtn">${t('shareLink')}</button><button class="btn btn-secondary" id="copySummaryBtn">${t('copySummary')}</button><button class="btn btn-secondary" id="downloadJsonBtn">${t('downloadJson')}</button><button class="btn btn-secondary" id="downloadPptxBtn">${t('downloadPptx')}</button><button class="btn btn-secondary" id="downloadHtmlBtn">${t('downloadHtml')}</button><button class="btn btn-secondary" id="downloadAutomationBtn">${t('downloadPack')}</button><button class="btn btn-secondary" id="copyCliBtn">${t('copyCli')}</button><button class="btn btn-danger" id="resetBtn">${t('reset')}</button></div></section>
    </aside>

    <main class="main-content">
      <section class="hero panel">
        <div class="split-hero">
          <div class="hero-box"><div class="kicker">${t('introKicker')}</div><h2>${t('introTitle')}</h2><p class="muted">${t('introBody')}</p></div>
          <div class="hero-box"><div class="mono-mini">${t('processing')}</div><div class="stack"><span class="media-pill">${t('pageMode')}</span><span class="media-pill">${t('videoUrlMode')}</span><span class="media-pill">${t('videoFileMode')}</span></div></div>
        </div>
        <div class="kpi-grid"><div class="stat-card"><div class="stat-k" id="statClips">0</div><div class="muted">${t('clips')}</div></div><div class="stat-card"><div class="stat-k" id="statShots">0</div><div class="muted">${t('shots')}</div></div><div class="stat-card"><div class="stat-k" id="statSlides">0</div><div class="muted">${t('slidesStat')}</div></div><div class="stat-card"><div class="stat-k" id="statKeyframes">0</div><div class="muted">${t('keyframesStat')}</div></div></div>
      </section>

      <section class="content-grid">
        <section class="panel content-panel"><div class="toolbar"><div><h3>${t('clipTabs')}</h3><p class="muted small">${t('sampleExamples')}</p></div><div class="tabs" id="clipTabs"></div></div><div class="clip-list" id="clipList"></div></section>
        <section class="panel content-panel">
          <div class="toolbar"><div><h3>${t('output')}</h3><p class="muted small" id="viewIntro">${t('timelineIntro')}</p></div><div class="tabs" id="viewTabs"><button class="tab active" data-view="timeline">${t('timeline')}</button><button class="tab" data-view="shorts">${t('shorts')}</button><button class="tab" data-view="keyframes">${t('keyframes')}</button><button class="tab" data-view="translations">${t('translations')}</button><button class="tab" data-view="slides">${t('slides')}</button><button class="tab" data-view="summary">${t('summary')}</button><button class="tab" data-view="export">${t('export')}</button></div></div>
          <div class="preview-stack"><div class="preview-note" id="previewNote">${t('previewHint')}</div><div id="mediaPreviewWrap"></div></div>
          <div id="view-timeline" class="view-block"><div class="timeline" id="timeline"></div></div>
          <div id="view-shorts" class="view-block hidden"><div class="stack" id="shortsList"></div></div>
          <div id="view-keyframes" class="view-block hidden"><div class="frame-grid" id="keyframes"></div></div>
          <div id="view-translations" class="view-block hidden"><div class="stack" id="translations"></div></div>
          <div id="view-slides" class="view-block hidden"><div class="slide-grid" id="slides"></div></div>
          <div id="view-summary" class="view-block hidden"><pre class="output-box" id="summary"></pre></div>
          <div id="view-export" class="view-block hidden"><pre class="output-box mono" id="exportBox"></pre></div>
        </section>
      </section>

      <section class="gallery-grid"><article class="panel card-panel"><h3>${t('visualProof')}</h3><div class="thumb-grid"><img src="./docs/screenshots/overview.svg" alt="Overview mock" /><img src="./docs/screenshots/timeline.svg" alt="Timeline mock" /><img src="./docs/screenshots/export.svg" alt="Export mock" /></div></article><article class="panel card-panel"><h3>${t('sampleExamples')}</h3><ul class="clean-list"><li><a href="./examples/sample-plan.json">sample-plan.json</a></li><li><a href="./examples/sample-report.html">sample-report.html</a></li><li><a href="./examples/sample-voiceover.txt">sample-voiceover.txt</a></li></ul></article></section>
    </main>
  </div>`;
}
function renderConfig() { $('configGrid').innerHTML = Object.entries(optionSets).map(([key, values]) => `<div class="field"><label for="${key}">${escapeHtml(key)}</label><select id="${key}">${values.map((v) => `<option ${defaults[key] === v ? 'selected' : ''}>${escapeHtml(v)}</option>`).join('')}</select></div>`).join(''); }
function getVideoDurationSeconds(values) { return Math.max(10, state.pendingVideoMeta?.duration || parseDuration(values.duration)); }
function buildTimelineForSource(name, source, values) {
  if (source?.type === 'page') return [
    { time: '00:00 – 00:04', action: state.lang === 'ro' ? 'Ține dashboard-ul sau hero-ul în cadru.' : 'Hold the dashboard or hero section in frame.', purpose: state.lang === 'ro' ? 'Prima impresie.' : 'First impression.' },
    { time: '00:04 – 00:10', action: state.lang === 'ro' ? `Intră în fluxul principal pentru ${name}.` : `Move into the main flow for ${name}.`, purpose: state.lang === 'ro' ? 'Structură de produs.' : 'Product structure.' },
    { time: '00:10 – 00:18', action: state.lang === 'ro' ? 'Arată o acțiune reprezentativă și o pauză scurtă.' : 'Show one representative action and a short pause.', purpose: state.lang === 'ro' ? 'Core workflow.' : 'Core workflow.' }
  ];
  const d = getVideoDurationSeconds(values);
  const chunk = d / Math.max(3, values.shortsCount);
  return Array.from({ length: Math.max(3, values.shortsCount) }).map((_, i) => ({ time: `${secToTime(i * chunk)} – ${secToTime((i + 1) * chunk)}`, action: state.lang === 'ro' ? `Segment ${i + 1}: hook + highlight vizual.` : `Segment ${i + 1}: hook + visual highlight.`, purpose: state.lang === 'ro' ? 'Material pentru short și reel.' : 'Short / reel material.' }));
}
function buildShortsPlan(name, source, values) {
  const total = values.shortsCount;
  const dur = getVideoDurationSeconds(values);
  const seg = Math.max(6, Math.round(dur / total));
  return Array.from({ length: total }).map((_, i) => ({ id: createId(), title: `${name} — Short ${i + 1}`, hook: values.visualMessage || (state.lang === 'ro' ? 'Hook vizual clar în primele 2 secunde.' : 'Clear visual hook in the first 2 seconds.'), start: secToTime(i * seg), end: secToTime(Math.min(dur, (i + 1) * seg)), format: i % 2 === 0 ? '9:16' : '1:1', focus: source?.type === 'page' ? (state.lang === 'ro' ? 'Moment UI / workflow' : 'UI / workflow moment') : (state.lang === 'ro' ? 'Moment video / beat' : 'Video / beat moment') }));
}
function buildKeyframeTimestamps(values) {
  const count = values.keyframeCount;
  const dur = getVideoDurationSeconds(values);
  return Array.from({ length: count }).map((_, i) => Math.max(0.5, (dur / (count + 1)) * (i + 1)));
}
function buildTranslations(name, message, values) {
  return values.translationTargets.map((lang) => ({ lang, label: langNames[state.lang][lang] || lang, ...translationTemplates[lang]({ title: name, message }) }));
}
async function extractLocalKeyframes(file, timestamps) {
  if (!file) return [];
  const objectUrl = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.src = objectUrl;
  video.muted = true;
  video.playsInline = true;
  await new Promise((resolve, reject) => { video.onloadedmetadata = () => resolve(); video.onerror = reject; });
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const width = 320; const height = Math.round(width / (video.videoWidth / video.videoHeight || 16 / 9));
  canvas.width = width; canvas.height = height;
  const frames = [];
  for (const ts of timestamps) {
    await new Promise((resolve) => {
      const handler = () => {
        try { ctx.drawImage(video, 0, 0, width, height); frames.push({ timestamp: ts, image: canvas.toDataURL('image/jpeg', 0.82), real: true }); } catch { frames.push({ timestamp: ts, image: '', real: false }); }
        resolve();
      };
      video.currentTime = Math.min(Math.max(0.1, ts), Math.max(0.2, video.duration - 0.2));
      video.onseeked = handler;
    });
  }
  URL.revokeObjectURL(objectUrl);
  return frames;
}
function createClipBase(values) {
  const source = getPrimarySource(values);
  const name = values.projectName || state.pendingVideoFile?.name?.replace(/\.[^.]+$/, '') || 'Generated workspace';
  const message = values.visualMessage || (state.lang === 'ro' ? 'Hook clar, payoff rapid, export pregătit pentru social și review.' : 'Clear hook, fast payoff, export-ready for social and review.');
  return { id: createId(), title: name, shortTitle: name, message, source, duration: Number(values.duration || 40), timeline: buildTimelineForSource(name, source, values), shorts: buildShortsPlan(name, source, values), translations: buildTranslations(name, message, values), timestamps: buildKeyframeTimestamps(values), videoMeta: state.pendingVideoMeta || null, config: formatConfig() };
}
function buildSummary(clip) {
  return [
    `${t('sourceLabel')}: ${clip.source?.label || '-'}`,
    `${t('projectName')}: ${clip.shortTitle}`,
    `${t('visualMessage')}: ${clip.message}`,
    '',
    t('timeline'),
    ...clip.timeline.map((shot, i) => `${i + 1}. ${shot.time} — ${shot.action} → ${shot.purpose}`),
    '',
    t('shorts'),
    ...clip.shorts.map((item) => `- ${item.title}: ${item.start}–${item.end} · ${item.format} · ${item.focus}`),
    '',
    t('translations'),
    ...clip.translations.map((item) => `- ${item.label}: ${item.caption}`)
  ].join('\n');
}
function buildExportManifest(clip) {
  return JSON.stringify({
    meta: { title: clip.title, source: clip.source, generatedAt: new Date().toISOString(), lang: state.lang },
    config: clip.config,
    timeline: clip.timeline,
    shorts: clip.shorts,
    keyframes: clip.keyframes?.map((f) => ({ timestamp: f.timestamp, time: secToTime(f.timestamp), real: !!f.real })) || clip.timestamps.map((ts) => ({ timestamp: ts, time: secToTime(ts), real: false })),
    translations: clip.translations
  }, null, 2);
}
async function generateWorkspace() {
  const values = getFieldValues();
  const source = getPrimarySource(values);
  if (!source) { toast(t('statusNeedSource')); return; }
  let clip = createClipBase(values);
  if (source.type === 'video-file' && state.pendingVideoFile) {
    try {
      const frames = await extractLocalKeyframes(state.pendingVideoFile, clip.timestamps);
      clip.keyframes = frames;
    } catch {
      clip.keyframes = clip.timestamps.map((ts) => ({ timestamp: ts, image: '', real: false }));
    }
  } else {
    clip.keyframes = clip.timestamps.map((ts) => ({ timestamp: ts, image: '', real: false }));
  }
  state.clips.unshift(clip);
  state.selectedClipId = clip.id;
  saveState();
  renderAll();
  toast(t('statusGenerated'));
}
function getSelectedClip() { return state.clips.find((clip) => clip.id === state.selectedClipId) || null; }
function renderClipTabs() { $('clipTabs').innerHTML = state.clips.map((clip, i) => `<button class="tab ${clip.id === state.selectedClipId ? 'active' : ''}" data-clip-id="${clip.id}">${i + 1}. ${escapeHtml(clip.shortTitle)}</button>`).join('') || `<span class="muted small">${t('emptyClip')}</span>`; }
function renderClipList() {
  if (!state.clips.length) { $('clipList').innerHTML = `<article class="clip-card"><strong>${t('emptyClip')}</strong><p class="muted small">${t('previewHint')}</p></article>`; return; }
  $('clipList').innerHTML = state.clips.map((clip) => `<article class="clip-card ${clip.id === state.selectedClipId ? 'active' : ''}" data-clip-id="${clip.id}" tabindex="0"><strong>${escapeHtml(clip.title)}</strong><div class="toolbar-actions"><span class="media-pill">${escapeHtml(clip.source?.label || '-')}</span><span class="media-pill">${clip.shorts.length} ${t('shorts')}</span><span class="media-pill">${clip.keyframes?.length || clip.timestamps?.length || 0} ${t('keyframes')}</span></div><p class="muted small">${escapeHtml(clip.message)}</p></article>`).join('');
}
function renderMediaPreview(clip) {
  const wrap = $('mediaPreviewWrap');
  if (!clip?.source?.url) { wrap.innerHTML = `<div class="section-note">${t('noPreview')}</div>`; return; }
  if (clip.source.type === 'page') wrap.innerHTML = `<div class="section-note">${t('pagePreview')}</div><iframe class="preview" title="page preview" src="${escapeHtml(clip.source.url)}"></iframe>`;
  else wrap.innerHTML = `<div class="section-note">${t('mediaPreview')}</div><video class="video-preview" src="${escapeHtml(clip.source.url)}" controls playsinline></video>`;
}
function renderTimeline(clip) { $('timeline').innerHTML = [`<div class="preview-note"><strong>${t('preRoll')}</strong><br>${t('timelineIntro')}</div>`, ...clip.timeline.map((shot) => `<article class="shot"><strong>${escapeHtml(shot.time)}</strong><div>${escapeHtml(shot.action)}<br><span class="muted small">${escapeHtml(shot.purpose)}</span></div></article>`)].join(''); }
function renderShorts(clip) { $('shortsList').innerHTML = [`<div class="section-note">${t('shortsIntro')}</div>`, ...clip.shorts.map((item) => `<article class="short-card"><strong>${escapeHtml(item.title)}</strong><div class="toolbar-actions"><span class="media-pill">${escapeHtml(item.start)} → ${escapeHtml(item.end)}</span><span class="media-pill">${escapeHtml(item.format)}</span><span class="media-pill">${escapeHtml(item.focus)}</span></div><pre>${escapeHtml(item.hook)}</pre></article>`)].join(''); }
function renderKeyframes(clip) { $('keyframes').innerHTML = [`<div class="section-note">${t('keyframesIntro')} ${clip.source?.type === 'video-url' ? t('keyframeRemote') : ''}</div>`, ...clip.keyframes.map((frame) => `<article class="frame-card">${frame.image ? `<img src="${frame.image}" alt="Keyframe ${secToTime(frame.timestamp)}" />` : ''}<strong>${secToTime(frame.timestamp)}</strong><span class="muted small">${frame.real ? t('generated') : t('frameExtractionUnavailable')}</span></article>`)].join(''); }
function renderTranslations(clip) { $('translations').innerHTML = [`<div class="section-note">${t('translationsIntro')}</div>`, ...clip.translations.map((item) => `<article class="translation-card"><strong>${escapeHtml(item.label)}</strong><pre>${t('samplePlan')}: ${escapeHtml(item.title)}\n${t('caption')}: ${escapeHtml(item.caption)}\n${t('cta')}: ${escapeHtml(item.cta)}</pre></article>`)].join(''); }
function renderSlides(clip) { $('slides').innerHTML = [{ title: t('timeline'), bullets: clip.timeline.slice(0, 3).map((s) => `${s.time}: ${s.purpose}`) }, { title: t('shorts'), bullets: clip.shorts.map((s) => `${s.start}-${s.end}: ${s.focus}`) }, { title: t('translations'), bullets: clip.translations.map((tr) => `${tr.label}: ${tr.caption}`) }].map((slide, i) => `<article class="slide"><strong>Slide ${i + 1}: ${escapeHtml(slide.title)}</strong><ul>${slide.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join('')}</ul></article>`).join(''); }
function renderSelectedClip() {
  const clip = getSelectedClip();
  if (!clip) { $('timeline').innerHTML = `<div class="preview-note">${t('emptyOutput')}</div>`; $('shortsList').innerHTML = ''; $('keyframes').innerHTML = ''; $('translations').innerHTML = ''; $('slides').innerHTML = ''; $('summary').textContent = ''; $('exportBox').textContent = ''; $('mediaPreviewWrap').innerHTML = ''; $('previewNote').textContent = t('previewHint'); updateStats(); return; }
  renderMediaPreview(clip); renderTimeline(clip); renderShorts(clip); renderKeyframes(clip); renderTranslations(clip); renderSlides(clip); $('summary').textContent = buildSummary(clip); $('exportBox').textContent = buildExportManifest(clip); updateStats(clip);
}
function updateStats(selected = null) { $('statClips').textContent = state.clips.length; $('statShots').textContent = state.clips.reduce((sum, c) => sum + (c.timeline?.length || 0), 0); $('statSlides').textContent = selected ? 3 : 0; $('statKeyframes').textContent = state.clips.reduce((sum, c) => sum + (c.keyframes?.length || c.timestamps?.length || 0), 0); }
function updateViewIntro() { const introMap = { timeline: t('timelineIntro'), shorts: t('shortsIntro'), keyframes: t('keyframesIntro'), translations: t('translationsIntro'), slides: t('sampleExamples'), summary: t('timelineIntro'), export: t('exportIntro') }; $('viewIntro').textContent = introMap[state.activeView] || t('timelineIntro'); }
function setActiveView(view) { state.activeView = view; document.querySelectorAll('[data-view]').forEach((btn) => btn.classList.toggle('active', btn.dataset.view === view)); document.querySelectorAll('.view-block').forEach((block) => block.classList.add('hidden')); document.getElementById(`view-${view}`)?.classList.remove('hidden'); updateViewIntro(); saveState(); }
function renderModeCards() { const mode = getFieldValues().mediaMode; document.querySelectorAll('.mode-card').forEach((card) => card.classList.toggle('active', card.querySelector('input')?.value === mode)); }
function saveState() { const values = getFieldValues(); localStorage.setItem(STORAGE_KEY, JSON.stringify({ lang: state.lang, activeView: state.activeView, selectedClipId: state.selectedClipId, clips: state.clips, fields: { ...values, hasFile: !!state.pendingVideoFile } })); }
function restoreState() { const raw = localStorage.getItem(STORAGE_KEY); if (!raw) return; try { const data = JSON.parse(raw); state.lang = data.lang || 'ro'; state.activeView = data.activeView || 'timeline'; state.clips = data.clips || []; state.selectedClipId = data.selectedClipId || state.clips[0]?.id || null; state._restoredFields = data.fields || {}; } catch {} }
function applyRestoredFields() { const f = state._restoredFields || {}; $('projectUrl').value = f.projectUrl || ''; $('projectName').value = f.projectName || ''; $('visualMessage').value = f.visualMessage || ''; $('duration').value = f.duration || '40'; $('videoUrl').value = f.videoUrl || ''; $('styleTemplate').value = f.style || $('styleTemplate').value; document.querySelector(`input[name="mediaMode"][value="${f.mediaMode || 'page'}"]`)?.click(); ['ro','en','es','fr','de'].forEach((lang) => { const el = document.querySelector(`input[name="translationTargets"][value="${lang}"]`); if (el) el.checked = (f.translationTargets || ['en']).includes(lang); }); $('shortsCount').value = String(f.shortsCount || 3); $('keyframeCount').value = String(f.keyframeCount || 4); }
function buildShareableUrl() { const values = getFieldValues(); const params = new URLSearchParams({ lang: state.lang, projectUrl: values.projectUrl, projectName: values.projectName, visualMessage: values.visualMessage, duration: values.duration, style: values.style, mediaMode: values.mediaMode, videoUrl: values.videoUrl, shortsCount: String(values.shortsCount), keyframeCount: String(values.keyframeCount), translationTargets: values.translationTargets.join(',') }); return `${location.origin}${location.pathname}?${params.toString()}`; }
function applyQueryState() { const params = new URLSearchParams(location.search); if (!params.toString()) return; if (params.get('lang')) state.lang = params.get('lang'); }
function applyQueryFields() { const params = new URLSearchParams(location.search); const map = [['projectUrl','projectUrl'],['projectName','projectName'],['visualMessage','visualMessage'],['duration','duration'],['style','style'],['videoUrl','videoUrl']]; map.forEach(([param,id]) => { if (params.get(param)) $(id).value = params.get(param); }); if (params.get('mediaMode')) document.querySelector(`input[name="mediaMode"][value="${params.get('mediaMode')}"]`)?.click(); if (params.get('shortsCount')) $('shortsCount').value = params.get('shortsCount'); if (params.get('keyframeCount')) $('keyframeCount').value = params.get('keyframeCount'); if (params.get('translationTargets')) { const selected = params.get('translationTargets').split(','); document.querySelectorAll('input[name="translationTargets"]').forEach((el) => { el.checked = selected.includes(el.value); }); } }
function readVideoMeta(file) { return new Promise((resolve, reject) => { const objectUrl = URL.createObjectURL(file); const video = document.createElement('video'); video.preload = 'metadata'; video.src = objectUrl; video.onloadedmetadata = () => resolve({ duration: video.duration, objectUrl, width: video.videoWidth, height: video.videoHeight, fileName: file.name }); video.onerror = reject; }); }
async function handleVideoFileChange(event) { const file = event.target.files?.[0] || null; state.pendingVideoFile = file; state.pendingVideoMeta = null; if (!file) { saveState(); return; } try { state.pendingVideoMeta = await readVideoMeta(file); if (!$('projectName').value.trim()) $('projectName').value = file.name.replace(/\.[^.]+$/, ''); toast(`${t('attached')}: ${file.name}`); } catch { toast(t('frameExtractionUnavailable')); } saveState(); updateReadinessView(); }
function updateReadinessView() { const result = buildReadiness(); $('readinessValue').textContent = result.score; $('readinessText').textContent = result.text; }
function renderDirectionRules() { $('directionRules').innerHTML = (state.presets?.directionRules || []).map((rule) => `<span>${escapeHtml(rule)}</span>`).join(''); }
function renderAll() { renderModeCards(); renderDirectionRules(); renderClipTabs(); renderClipList(); renderSelectedClip(); updateReadinessView(); setActiveView(state.activeView || 'timeline'); }
function buildReportHtml() { const clip = getSelectedClip(); if (!clip) return '<h1>No clip</h1>'; return `<!DOCTYPE html><html lang="${state.lang}"><head><meta charset="UTF-8"><title>${escapeHtml(clip.shortTitle)}</title></head><body><h1>${escapeHtml(clip.shortTitle)}</h1><pre>${escapeHtml(buildSummary(clip))}</pre></body></html>`; }
async function exportPptx(clip) { if (typeof PptxGenJS === 'undefined') return toast('PPTX unavailable.'); const pptx = new PptxGenJS(); pptx.layout = 'LAYOUT_WIDE'; const slide = pptx.addSlide(); slide.background = { color: '0B1020' }; slide.addText(clip.shortTitle, { x: .5, y: .5, w: 12, h: .5, fontSize: 24, bold: true, color: 'EEF3FF' }); slide.addText(buildSummary(clip), { x: .5, y: 1.3, w: 12, h: 5, fontSize: 12, color: 'A5B2D6' }); await pptx.writeFile({ fileName: `${slugify(clip.shortTitle)}-workspace.pptx` }); }
function getRunnerTemplate() { return `import fs from 'fs';\nconst plan = JSON.parse(fs.readFileSync('./plan.json','utf8'));\nconsole.log('Use this plan with local FFmpeg / Playwright processing', plan.meta || plan);`; }
async function downloadAutomationPack() { const clip = getSelectedClip(); if (!clip) return toast(t('statusNeedSource')); const zip = new JSZip(); zip.file('plan.json', buildExportManifest(clip)); zip.file('runner.mjs', getRunnerTemplate()); zip.file('README.md', '# Automation Pack\n\nThis package contains the generated manifest for shorts, keyframes and translations.'); const blob = await zip.generateAsync({ type: 'blob' }); downloadFile(`${slugify(clip.shortTitle)}-automation-pack.zip`, blob, 'application/zip'); toast(t('statusPack')); }
function attachEvents() {
  document.addEventListener('click', (event) => {
    const langBtn = event.target.closest('[data-lang]'); if (langBtn) { state.lang = langBtn.dataset.lang; saveState(); init(); return; }
    const clipBtn = event.target.closest('[data-clip-id]'); if (clipBtn) { state.selectedClipId = clipBtn.dataset.clipId; saveState(); renderAll(); }
    const viewBtn = event.target.closest('[data-view]'); if (viewBtn) setActiveView(viewBtn.dataset.view);
  });
  ['projectUrl','projectName','visualMessage','videoUrl'].forEach((id) => $(id).addEventListener('input', () => { updateReadinessView(); saveState(); }));
  ['duration','styleTemplate','shortsCount','keyframeCount'].forEach((id) => $(id).addEventListener('change', () => { updateReadinessView(); saveState(); }));
  document.querySelectorAll('input[name="mediaMode"]').forEach((el) => el.addEventListener('change', () => { renderModeCards(); updateReadinessView(); saveState(); }));
  document.querySelectorAll('input[name="translationTargets"]').forEach((el) => el.addEventListener('change', () => { updateReadinessView(); saveState(); }));
  $('videoFile').addEventListener('change', handleVideoFileChange);
  $('generateBtn').addEventListener('click', generateWorkspace);
  $('loadPresetBtn').addEventListener('click', () => { state.clips = JSON.parse(JSON.stringify(state.presets.clips || [])).map((clip) => ({ ...clip, source: { type: 'page', label: t('webpage'), url: clip.url }, timeline: clip.shots || clip.timeline || [], shorts: buildShortsPlan(clip.shortTitle || clip.title, { type: 'page' }, { shortsCount: 3, duration: clip.duration || 40, visualMessage: clip.message || '', translationTargets: ['en'] }), timestamps: buildKeyframeTimestamps({ keyframeCount: 4, duration: clip.duration || 40 }), keyframes: buildKeyframeTimestamps({ keyframeCount: 4, duration: clip.duration || 40 }).map((ts) => ({ timestamp: ts, image: '', real: false })), translations: buildTranslations(clip.shortTitle || clip.title, clip.message || '', { translationTargets: ['en', 'ro'] }), config: formatConfig() })); state.selectedClipId = state.clips[0]?.id || state.clips[0]?.title; if (state.clips[0] && !state.clips[0].id) state.clips = state.clips.map((c) => ({ ...c, id: createId() })); saveState(); renderAll(); });
  $('shareLinkBtn').addEventListener('click', () => copyText(buildShareableUrl()));
  $('copySummaryBtn').addEventListener('click', () => { const clip = getSelectedClip(); if (clip) copyText(buildSummary(clip)); });
  $('downloadJsonBtn').addEventListener('click', () => { const clip = getSelectedClip(); if (!clip) return toast(t('statusNeedSource')); downloadFile(`${slugify(clip.shortTitle)}-workspace.json`, buildExportManifest(clip), 'application/json;charset=utf-8'); });
  $('downloadPptxBtn').addEventListener('click', () => { const clip = getSelectedClip(); if (clip) exportPptx(clip); });
  $('downloadHtmlBtn').addEventListener('click', () => { const clip = getSelectedClip(); if (clip) downloadFile(`${slugify(clip.shortTitle)}-workspace.html`, buildReportHtml(), 'text/html;charset=utf-8'); });
  $('downloadAutomationBtn').addEventListener('click', downloadAutomationPack);
  $('copyCliBtn').addEventListener('click', () => copyText('npm install\nnode runner.mjs'));
  $('resetBtn').addEventListener('click', () => { localStorage.removeItem(STORAGE_KEY); if (state.pendingVideoMeta?.objectUrl) URL.revokeObjectURL(state.pendingVideoMeta.objectUrl); location.href = location.pathname; });
}
async function init() {
  restoreState(); applyQueryState(); renderShell(); renderConfig();
  const presets = await fetch('./assets/presets.json').then((r) => r.json()); state.presets = presets;
  $('styleTemplate').innerHTML = presets.styles.map((style) => `<option>${escapeHtml(style)}</option>`).join('');
  applyRestoredFields(); applyQueryFields(); attachEvents(); if ('serviceWorker' in navigator) navigator.serviceWorker.register('./service-worker.js').catch(() => {}); renderAll();
}
init();
