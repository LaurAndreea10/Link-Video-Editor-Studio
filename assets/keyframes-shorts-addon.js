function getNarrativeRoleAddon(index,total){
  if(index===0) return state.lang==='ro' ? 'Hook' : 'Hook';
  if(index===total-1) return state.lang==='ro' ? 'Payoff' : 'Payoff';
  if(index===1) return state.lang==='ro' ? 'Context' : 'Context';
  if(index===total-2) return state.lang==='ro' ? 'Proof' : 'Proof';
  return state.lang==='ro' ? 'Middle beat' : 'Middle beat';
}

function createEmptyStateAddon(icon,title,body){
  return `<div class="empty-state micro-fade-up"><div class="empty-state-icon">${icon}</div><h4>${escapeHtml(title)}</h4><p>${escapeHtml(body)}</p></div>`;
}
function applyRevealStaggerAddon(id){
  const el=document.getElementById(id);
  if(el) el.classList.add('reveal-stagger');
}

function enrichShortsAddon(clip){
  const shorts = Array.isArray(clip.shorts) ? clip.shorts : [];
  return shorts.map((item,index)=>({
    ...item,
    hook: index===0
      ? (clip.shots?.[0]?.purpose || clip.message || clip.objective || '')
      : (state.lang==='ro' ? 'Continuă cu un moment memorabil.' : 'Continue with a memorable beat.'),
    middle: clip.shots?.[Math.min(index+1,(clip.shots?.length||1)-1)]?.purpose || (state.lang==='ro' ? 'Arată beneficiul principal.' : 'Show the core benefit.'),
    payoff: index===shorts.length-1
      ? (clip.translations?.find((t)=>t.lang==='en')?.cta || clip.translations?.[0]?.cta || (state.lang==='ro' ? 'Vezi versiunea completă.' : 'Watch the full version.'))
      : (state.lang==='ro' ? 'Închide cu un payoff clar.' : 'Close on a clear payoff.'),
    recommendedTextOnScreen: index===0
      ? (state.lang==='ro' ? 'Hook scurt pe ecran' : 'Short on-screen hook')
      : (state.lang==='ro' ? 'Benefit + CTA' : 'Benefit + CTA')
  }));
}

function enrichKeyframesAddon(clip){
  const keyframes = Array.isArray(clip.keyframes) ? clip.keyframes : [];
  return keyframes.map((frame,index)=>({
    ...frame,
    role: getNarrativeRoleAddon(index,keyframes.length),
    narrative: clip.shots?.[Math.min(index,(clip.shots?.length||1)-1)]?.purpose || clip.message || '',
    suggestedOverlay: index===0
      ? (state.lang==='ro' ? 'Titlu scurt' : 'Short title')
      : index===keyframes.length-1
        ? (state.lang==='ro' ? 'CTA final' : 'Final CTA')
        : (state.lang==='ro' ? 'Benefit line' : 'Benefit line')
  }));
}

function buildShortsExportAddon(clip){
  return {
    title: clip.shortTitle,
    style: clip.demoStyleLabel || state.demoStyle,
    shorts: enrichShortsAddon(clip)
  };
}

function buildKeyframesExportAddon(clip){
  return {
    title: clip.shortTitle,
    style: clip.demoStyleLabel || state.demoStyle,
    keyframes: enrichKeyframesAddon(clip)
  };
}

function ensureShortsActionsAddon(){
  const wrap = document.getElementById('view-shorts');
  const stack = document.getElementById('shorts');
  if(!wrap || !stack || document.getElementById('shortsActionBar')) return;
  const bar = document.createElement('div');
  bar.id = 'shortsActionBar';
  bar.className = 'actions';
  bar.style.marginBottom = '12px';
  bar.innerHTML = `
    <button class="btn btn-secondary" id="downloadShortsJsonBtn" type="button">Download shorts JSON</button>
  `;
  wrap.insertBefore(bar, stack);
  document.getElementById('downloadShortsJsonBtn').addEventListener('click', ()=>{
    const clip = getSelectedClip();
    if(!clip){ toast(t('noClip'),'err'); return; }
    downloadFile(`${slugify(clip.shortTitle)}-shorts.json`, JSON.stringify(buildShortsExportAddon(clip), null, 2), 'application/json;charset=utf-8');
    toast(state.lang==='ro' ? 'Shorts JSON descărcat.' : 'Shorts JSON downloaded.', 'ok');
  });
}

function ensureKeyframesActionsAddon(){
  const wrap = document.getElementById('view-keyframes');
  const grid = document.getElementById('keyframes');
  if(!wrap || !grid || document.getElementById('keyframesActionBar')) return;
  const bar = document.createElement('div');
  bar.id = 'keyframesActionBar';
  bar.className = 'actions';
  bar.style.marginBottom = '12px';
  bar.innerHTML = `
    <button class="btn btn-secondary" id="downloadKeyframesJsonBtn" type="button">Download keyframes JSON</button>
  `;
  wrap.insertBefore(bar, grid);
  document.getElementById('downloadKeyframesJsonBtn').addEventListener('click', ()=>{
    const clip = getSelectedClip();
    if(!clip){ toast(t('noClip'),'err'); return; }
    downloadFile(`${slugify(clip.shortTitle)}-keyframes.json`, JSON.stringify(buildKeyframesExportAddon(clip), null, 2), 'application/json;charset=utf-8');
    toast(state.lang==='ro' ? 'Keyframes JSON descărcat.' : 'Keyframes JSON downloaded.', 'ok');
  });
}

const __origRenderClipListVisualAddon = renderClipList;
renderClipList = function(){
  __origRenderClipListVisualAddon();
  const clipList = document.getElementById('clipList');
  if(clipList && !state.clips.length){
    clipList.innerHTML = createEmptyStateAddon('✨', state.lang==='ro'?'Workspace curat':'Clean workspace', state.lang==='ro'?'Adaugă un URL, un video link sau un fișier pentru a construi primul demo product-grade.':'Add a URL, video link or file to build the first product-grade demo.');
  }
  applyRevealStaggerAddon('clipList');
};

if(typeof renderShorts === 'function'){
  const __origRenderShortsAddon = renderShorts;
  renderShorts = function(clip){
    __origRenderShortsAddon(clip);
    ensureShortsActionsAddon();
    const stack = document.getElementById('shorts');
    if(!stack) return;
    if(!clip){
      stack.innerHTML = createEmptyStateAddon('📱', state.lang==='ro'?'Shorts indisponibile':'Shorts unavailable', state.lang==='ro'?'Alege o sursă și generează pentru a construi shorts premium.':'Choose a source and generate to build premium shorts.');
      return;
    }
    const enriched = enrichShortsAddon(clip);
    stack.innerHTML = enriched.map((item)=>`<article class="short-card micro-fade-up"><strong>${escapeHtml(item.title)}</strong><div class="pill-row"><span class="pill">${escapeHtml(item.range)}</span><span class="pill">${escapeHtml(item.format)}</span></div><div class="output-box">Hook: ${escapeHtml(item.hook)}\n\nMiddle: ${escapeHtml(item.middle)}\n\nPayoff: ${escapeHtml(item.payoff)}\n\nText: ${escapeHtml(item.recommendedTextOnScreen)}</div></article>`).join('');
    applyRevealStaggerAddon('shorts');
  };
}

if(typeof renderKeyframes === 'function'){
  const __origRenderKeyframesAddon = renderKeyframes;
  renderKeyframes = function(clip){
    __origRenderKeyframesAddon(clip);
    ensureKeyframesActionsAddon();
    const grid = document.getElementById('keyframes');
    if(!grid) return;
    if(!clip){
      grid.innerHTML = createEmptyStateAddon('🖼️', state.lang==='ro'?'Cadre-cheie indisponibile':'Keyframes unavailable', state.lang==='ro'?'După generare vei vedea cadre-cheie, roluri narative și overlay-uri sugerate.':'After generation you will see keyframes, narrative roles and suggested overlays.');
      return;
    }
    const enriched = enrichKeyframesAddon(clip);
    grid.innerHTML = enriched.map((frame)=>`<article class="frame-card micro-fade-up">${frame.image?`<img src="${frame.image}" alt="frame ${escapeHtml(frame.label||'')}">`:''}<strong>${escapeHtml(frame.label||'')}</strong><div class="pill-row"><span class="pill">${escapeHtml(frame.role)}</span></div><p class="hint">${escapeHtml(frame.narrative || '')}</p><div class="output-box">Overlay: ${escapeHtml(frame.suggestedOverlay || '')}</div></article>`).join('');
    applyRevealStaggerAddon('keyframes');
  };
}

if(typeof renderTranslations === 'function'){
  const __origRenderTranslationsVisualAddon = renderTranslations;
  renderTranslations = function(clip){
    __origRenderTranslationsVisualAddon(clip);
    const stack = document.getElementById('translations');
    if(stack && !clip){
      stack.innerHTML = createEmptyStateAddon('🌍', state.lang==='ro'?'Traduceri indisponibile':'Translations unavailable', state.lang==='ro'?'Activează limbile dorite și generează un plan pentru captions și subtitrări.':'Enable languages and generate a plan for captions and subtitles.');
    }
    applyRevealStaggerAddon('translations');
  };
}

function jobsRepoMetaAddon(){
  const repo = 'LaurAndreea10/Link-Video-Editor-Studio';
  return {
    repo,
    actionsUrl: `https://github.com/${repo}/actions`,
    workflowUrl: `https://github.com/${repo}/actions/workflows/render-export.yml`,
    pagesUrl: `https://github.com/${repo}/actions/workflows/pages.yml`,
    validateUrl: `https://github.com/${repo}/actions/workflows/validate.yml`,
    apiRunsUrl: `https://api.github.com/repos/${repo}/actions/runs?per_page=10`
  };
}

function ensureJobsViewAddon(){
  const toolbarTabs = document.querySelector('.pane .tabs:last-child');
  if(toolbarTabs && !toolbarTabs.querySelector('[data-view="jobs"]')){
    const btn = document.createElement('button');
    btn.className = 'tab';
    btn.dataset.view = 'jobs';
    btn.textContent = 'Jobs';
    toolbarTabs.appendChild(btn);
  }
  const exportView = document.getElementById('view-export');
  if(exportView && !document.getElementById('view-jobs')){
    const block = document.createElement('div');
    block.id = 'view-jobs';
    block.className = 'view-block hidden';
    block.innerHTML = '<div class="stack" id="jobsPanel"></div>';
    exportView.insertAdjacentElement('afterend', block);
  }
}

async function fetchJobsAddon(){
  const meta = jobsRepoMetaAddon();
  const response = await fetch(meta.apiRunsUrl, { headers: { Accept: 'application/vnd.github+json' } });
  if(!response.ok) throw new Error(`GitHub API ${response.status}`);
  const data = await response.json();
  return Array.isArray(data.workflow_runs) ? data.workflow_runs : [];
}

function workflowBadgeAddon(status, conclusion){
  const ok = conclusion === 'success';
  const bad = conclusion === 'failure' || conclusion === 'cancelled';
  const label = conclusion || status || 'unknown';
  return `<span class="pill ${ok ? 'ai' : bad ? 'mock' : ''}">${escapeHtml(label)}</span>`;
}

async function renderJobsAddon(){
  ensureJobsViewAddon();
  const panel = document.getElementById('jobsPanel');
  if(!panel) return;
  const meta = jobsRepoMetaAddon();
  panel.innerHTML = createEmptyStateAddon('⚙️', state.lang==='ro' ? 'Se încarcă joburile...' : 'Loading jobs...', state.lang==='ro' ? 'Preluăm ultimele workflow runs din GitHub Actions.' : 'Fetching latest workflow runs from GitHub Actions.');
  try {
    const runs = await fetchJobsAddon();
    const cards = runs.slice(0,8).map((run)=>`<article class="translation-card micro-fade-up"><strong>${escapeHtml(run.name || 'Workflow')}</strong><div class="pill-row"><span class="pill">#${escapeHtml(String(run.run_number || ''))}</span>${workflowBadgeAddon(run.status, run.conclusion)}<span class="pill">${escapeHtml(run.event || '')}</span></div><p class="hint">${escapeHtml(run.display_title || run.head_branch || '')}</p><div class="actions"><a class="btn btn-secondary" href="${run.html_url}" target="_blank" rel="noreferrer">${state.lang==='ro' ? 'Deschide run' : 'Open run'}</a></div></article>`).join('');
    panel.innerHTML = `
      <article class="translation-card micro-fade-up">
        <strong>${state.lang==='ro' ? 'Workflow control center' : 'Workflow control center'}</strong>
        <div class="pill-row">
          <span class="pill">Validate</span>
          <span class="pill">Pages</span>
          <span class="pill">Render Export</span>
        </div>
        <p class="hint">${state.lang==='ro' ? 'Lansează și urmărește workflow-urile direct din GitHub Actions. Tab-ul Jobs îți oferă un panou rapid pentru ultimele execuții și linkuri utile.' : 'Launch and monitor workflows directly from GitHub Actions. The Jobs tab gives you a quick panel for recent executions and useful links.'}</p>
        <div class="actions">
          <a class="btn btn-secondary" href="${meta.actionsUrl}" target="_blank" rel="noreferrer">${state.lang==='ro' ? 'Toate Actions' : 'All Actions'}</a>
          <a class="btn btn-secondary" href="${meta.workflowUrl}" target="_blank" rel="noreferrer">Render Export</a>
          <a class="btn btn-secondary" href="${meta.pagesUrl}" target="_blank" rel="noreferrer">Pages</a>
          <a class="btn btn-secondary" href="${meta.validateUrl}" target="_blank" rel="noreferrer">Validate</a>
        </div>
      </article>
      ${cards || createEmptyStateAddon('📭', state.lang==='ro' ? 'Nicio execuție recentă' : 'No recent runs', state.lang==='ro' ? 'Rulează un workflow din GitHub Actions pentru a-l vedea aici.' : 'Run a workflow from GitHub Actions to see it here.')}
    `;
    applyRevealStaggerAddon('jobsPanel');
  } catch (error) {
    panel.innerHTML = `
      ${createEmptyStateAddon('🛰️', state.lang==='ro' ? 'Nu am putut încărca joburile' : 'Could not load jobs', state.lang==='ro' ? 'Deschide GitHub Actions direct pentru status live sau încearcă din nou după refresh.' : 'Open GitHub Actions directly for live status or try again after a refresh.')}
      <div class="actions">
        <a class="btn btn-secondary" href="${meta.actionsUrl}" target="_blank" rel="noreferrer">${state.lang==='ro' ? 'Deschide Actions' : 'Open Actions'}</a>
      </div>
    `;
  }
}

const __origRenderSelectedClipVisualAddon = renderSelectedClip;
renderSelectedClip = function(){
  __origRenderSelectedClipVisualAddon();
  const clip = getSelectedClip();
  const timeline = document.getElementById('timeline');
  const slides = document.getElementById('slides');
  ensureJobsViewAddon();
  if(!clip){
    if(timeline) timeline.innerHTML = createEmptyStateAddon('🎬', state.lang==='ro'?'Niciun demo selectat':'No demo selected', state.lang==='ro'?'Generează un clip nou sau încarcă un preset pentru a vedea timeline-ul premium.':'Generate a new clip or load a preset to see the premium timeline.');
    if(slides) slides.innerHTML = createEmptyStateAddon('🧩', state.lang==='ro'?'Slide-uri negenerate':'No slides yet', state.lang==='ro'?'Slide-urile apar după prima generare.':'Slides appear after the first generation.');
  }
  ['timeline','slides','shorts','keyframes','translations','jobs'].forEach(applyRevealStaggerAddon);
  document.querySelectorAll('.clip-card,.shot,.slide,.short-card,.frame-card,.translation-card,.stat,.section,.tab').forEach((node)=>node.classList.add('micro-fade-up'));
  if(state.activeView === 'jobs') renderJobsAddon();
};

(function bootstrapJobsAddon(){
  const init = () => {
    ensureJobsViewAddon();
    if(state.activeView === 'jobs') renderJobsAddon();
  };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
  else init();
})();

const __origSetActiveViewJobsAddon = setActiveView;
setActiveView = function(view){
  __origSetActiveViewJobsAddon(view);
  if(view === 'jobs') renderJobsAddon();
};

if(typeof generateExport === 'function'){
  const __origGenerateExportKeyframesAddon = generateExport;
  generateExport = function(clip, config){
    const base = __origGenerateExportKeyframesAddon(clip, config);
    return [
      base,
      '',
      '# SHORTS PAYLOAD',
      JSON.stringify(buildShortsExportAddon(clip), null, 2),
      '',
      '# KEYFRAMES PAYLOAD',
      JSON.stringify(buildKeyframesExportAddon(clip), null, 2),
      '',
      '# GITHUB WORKFLOWS',
      JSON.stringify(jobsRepoMetaAddon(), null, 2)
    ].join('\n\n');
  };
}

if(typeof createAutomationPack === 'function'){
  const __origCreateAutomationPackKeyframesAddon = createAutomationPack;
  createAutomationPack = async function(){
    const clip = getSelectedClip();
    if(!clip){ toast(t('noClip'),'err'); return; }
    const config = formatConfig();
    const zip = new JSZip();
    const basePayload = typeof buildStyleAwareExportPayloadAddon === 'function' ? buildStyleAwareExportPayloadAddon(clip, config) : { clip, config };
    zip.file('plan.json', JSON.stringify(basePayload, null, 2));
    zip.file('shorts.json', JSON.stringify(buildShortsExportAddon(clip), null, 2));
    zip.file('keyframes.json', JSON.stringify(buildKeyframesExportAddon(clip), null, 2));
    zip.file('github-workflows.json', JSON.stringify(jobsRepoMetaAddon(), null, 2));
    if(typeof buildCaptionExportPayloadAddon === 'function'){
      const captions = buildCaptionExportPayloadAddon(clip);
      zip.file('captions.json', JSON.stringify(captions, null, 2));
      Object.entries(captions.srt || {}).forEach(([lang,srt])=>zip.file(`${lang}.srt`, srt));
    }
    zip.file('README.md', [
      `# ${clip.shortTitle} Automation Pack`,
      '',
      'Included files:',
      '- plan.json',
      '- shorts.json',
      '- keyframes.json',
      '- github-workflows.json',
      '- captions.json (if available)',
      '- *.srt (if available)'
    ].join('\n'));
    zip.file('runner.mjs', "import fs from 'fs';\nconst plan = JSON.parse(fs.readFileSync('./plan.json','utf8'));\nconst shorts = JSON.parse(fs.readFileSync('./shorts.json','utf8'));\nconst keyframes = JSON.parse(fs.readFileSync('./keyframes.json','utf8'));\nconsole.log(plan.clip?.title || plan);\nconsole.log(shorts.shorts?.length || 0, keyframes.keyframes?.length || 0);\n");
    const blob = await zip.generateAsync({ type: 'blob' });
    downloadFile(`${slugify(clip.shortTitle)}-automation-pack.zip`, blob, 'application/zip');
    toast(t('automationDownloaded'), 'ok');
  };
}
