function artifactRepoMetaAddon(){
  const repo = 'LaurAndreea10/Link-Video-Editor-Studio';
  return {
    repo,
    artifactGuideUrl: `https://github.com/${repo}/actions/workflows/render-export.yml`,
    actionsUrl: `https://github.com/${repo}/actions`,
    rawBase: `https://raw.githubusercontent.com/${repo}/main`
  };
}

function artifactStorageKeyAddon(){
  return 'lves.localArtifacts';
}

function readArtifactsAddon(){
  try {
    return JSON.parse(localStorage.getItem(artifactStorageKeyAddon()) || '[]');
  } catch {
    return [];
  }
}

function writeArtifactsAddon(items){
  try {
    localStorage.setItem(artifactStorageKeyAddon(), JSON.stringify(items.slice(0, 18)));
  } catch {}
}

function rememberArtifactFromClipAddon(clip){
  if(!clip) return;
  const current = readArtifactsAddon();
  const item = {
    id: `${slugify(clip.shortTitle)}-${Date.now()}`,
    title: clip.shortTitle || clip.title || 'Artifact',
    style: clip.demoStyleLabel || clip.demoStyle || 'Style',
    format: clip.recommendedFormat || '16:9',
    sourceMode: clip.sourceMode || 'page',
    createdAt: new Date().toISOString(),
    previewUrl: clip.url || clip.sourceUrl || '',
    reportName: `${slugify(clip.shortTitle)}.report.html`,
    teaserName: `${slugify(clip.shortTitle)}.teaser.mp4`,
    manifestName: `${slugify(clip.shortTitle)}.manifest.json`
  };
  const merged = [item, ...current.filter((x)=>x.title !== item.title)].slice(0, 18);
  writeArtifactsAddon(merged);
}

function ensureArtifactsViewAddon(){
  const toolbarTabs = document.querySelector('.pane .tabs:last-child');
  if(toolbarTabs && !toolbarTabs.querySelector('[data-view="artifacts"]')){
    const btn = document.createElement('button');
    btn.className = 'tab';
    btn.dataset.view = 'artifacts';
    btn.textContent = state.lang === 'ro' ? 'Artifacts' : 'Artifacts';
    toolbarTabs.appendChild(btn);
  }
  const jobsView = document.getElementById('view-jobs') || document.getElementById('view-export');
  if(jobsView && !document.getElementById('view-artifacts')){
    const block = document.createElement('div');
    block.id = 'view-artifacts';
    block.className = 'view-block hidden';
    block.innerHTML = '<div class="stack" id="artifactsPanel"></div>';
    jobsView.insertAdjacentElement('afterend', block);
  }
}

function artifactCardAddon(item){
  const repo = artifactRepoMetaAddon();
  const workflowHint = state.lang === 'ro'
    ? 'Poți produce aceste fișiere și din GitHub Actions prin workflow-ul Render Export.'
    : 'You can also produce these files from GitHub Actions via the Render Export workflow.';
  return `
    <article class="translation-card micro-fade-up">
      <strong>${escapeHtml(item.title)}</strong>
      <div class="pill-row">
        <span class="pill">${escapeHtml(item.style)}</span>
        <span class="pill">${escapeHtml(item.format)}</span>
        <span class="pill">${escapeHtml(item.sourceMode)}</span>
      </div>
      <p class="hint">${escapeHtml(new Date(item.createdAt).toLocaleString())}</p>
      <div class="output-box">${escapeHtml(workflowHint)}\n\n${escapeHtml(item.reportName)}\n${escapeHtml(item.teaserName)}\n${escapeHtml(item.manifestName)}</div>
      <div class="actions">
        ${item.previewUrl ? `<a class="btn btn-secondary" href="${item.previewUrl}" target="_blank" rel="noreferrer">${state.lang==='ro' ? 'Deschide sursa' : 'Open source'}</a>` : ''}
        <a class="btn btn-secondary" href="${repo.artifactGuideUrl}" target="_blank" rel="noreferrer">Render Export</a>
      </div>
    </article>
  `;
}

function renderArtifactsAddon(){
  ensureArtifactsViewAddon();
  const panel = document.getElementById('artifactsPanel');
  if(!panel) return;
  const items = readArtifactsAddon();
  if(!items.length){
    panel.innerHTML = createEmptyStateAddon(
      '🗂️',
      state.lang === 'ro' ? 'Niciun artifact local încă' : 'No local artifacts yet',
      state.lang === 'ro'
        ? 'După fiecare generare salvăm o urmă locală a output-urilor ca mini media manager. Pentru artifacte reale rulează workflow-ul Render Export.'
        : 'After each generation we save a local output trace as a mini media manager. For real artifacts, run the Render Export workflow.'
    );
    return;
  }
  panel.innerHTML = `
    <div class="actions" style="margin-bottom:12px">
      <button class="btn btn-secondary" id="clearArtifactsBtn" type="button">${state.lang === 'ro' ? 'Șterge istoricul local' : 'Clear local history'}</button>
      <a class="btn btn-secondary" href="${artifactRepoMetaAddon().actionsUrl}" target="_blank" rel="noreferrer">GitHub Actions</a>
    </div>
    ${items.map(artifactCardAddon).join('')}
  `;
  const clearBtn = document.getElementById('clearArtifactsBtn');
  if(clearBtn){
    clearBtn.addEventListener('click', ()=>{
      writeArtifactsAddon([]);
      renderArtifactsAddon();
      toast(state.lang === 'ro' ? 'Istoricul local a fost șters.' : 'Local history cleared.', 'ok');
    });
  }
  applyRevealStaggerAddon('artifactsPanel');
}

(function bootstrapArtifactsAddon(){
  const init = () => {
    ensureArtifactsViewAddon();
    if(state.activeView === 'artifacts') renderArtifactsAddon();
  };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();

if(typeof buildClipFromPlan === 'function'){
  const __origBuildClipFromPlanArtifactsAddon = buildClipFromPlan;
  buildClipFromPlan = function(plan, inputs){
    const clip = __origBuildClipFromPlanArtifactsAddon(plan, inputs);
    setTimeout(()=>{
      rememberArtifactFromClipAddon(clip);
      if(state.activeView === 'artifacts') renderArtifactsAddon();
    }, 0);
    return clip;
  };
}

if(typeof setActiveView === 'function'){
  const __origSetActiveViewArtifactsAddon = setActiveView;
  setActiveView = function(view){
    __origSetActiveViewArtifactsAddon(view);
    if(view === 'artifacts') renderArtifactsAddon();
  };
}

if(typeof generateExport === 'function'){
  const __origGenerateExportArtifactsAddon = generateExport;
  generateExport = function(clip, config){
    const base = __origGenerateExportArtifactsAddon(clip, config);
    return [
      base,
      '',
      '# ARTIFACT BROWSER',
      JSON.stringify({ localArtifacts: readArtifactsAddon(), repo: artifactRepoMetaAddon() }, null, 2)
    ].join('\n\n');
  };
}
