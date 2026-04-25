state.versioning = state.versioning || { selectedVersionId: null, compareVersionId: null };

function versionStorageKey(){
  const clip = typeof getSelectedClip === 'function' ? getSelectedClip() : null;
  return `lves.versions.${slugify(clip?.shortTitle || clip?.title || 'default')}`;
}
function readVersions(){
  try { return JSON.parse(localStorage.getItem(versionStorageKey()) || '[]'); } catch { return []; }
}
function writeVersions(items){
  try { localStorage.setItem(versionStorageKey(), JSON.stringify((items || []).slice(0, 25))); } catch {}
}
function snapshotClipForVersion(clip){
  return JSON.parse(JSON.stringify({
    title: clip.title,
    shortTitle: clip.shortTitle,
    duration: clip.duration,
    message: clip.message,
    objective: clip.objective,
    sourceMode: clip.sourceMode,
    sourceUrl: clip.sourceUrl,
    demoStyleLabel: clip.demoStyleLabel,
    recommendedFormat: clip.recommendedFormat,
    shots: clip.shots || [],
    shorts: clip.shorts || [],
    keyframes: clip.keyframes || [],
    translations: clip.translations || [],
    aiSummary: clip.aiSummary || '',
    aiVoiceover: clip.aiVoiceover || ''
  }));
}
function ensureVersioningUI(){
  const right = document.getElementById('studioInspectorMount');
  if(right && !document.getElementById('versioningPanel')){
    const panel = document.createElement('div');
    panel.id = 'versioningPanel';
    panel.className = 'studio-inspector-card micro-fade-up';
    right.appendChild(panel);
  }
}
function currentClipVersionLabel(){
  const clip = typeof getSelectedClip === 'function' ? getSelectedClip() : null;
  if(!clip) return 'draft';
  return `${clip.shortTitle || clip.title || 'clip'} · ${(clip.shots || []).length} shots`;
}
function saveCurrentVersion(manualName){
  const clip = typeof getSelectedClip === 'function' ? getSelectedClip() : null;
  if(!clip) return;
  const versions = readVersions();
  const version = {
    id: `v-${Date.now()}`,
    name: manualName || `${currentClipVersionLabel()} · ${new Date().toLocaleString()}`,
    createdAt: new Date().toISOString(),
    snapshot: snapshotClipForVersion(clip)
  };
  writeVersions([version, ...versions]);
  state.versioning.selectedVersionId = version.id;
  renderVersioningPanel();
  toast(state.lang === 'ro' ? 'Versiune salvată local.' : 'Version saved locally.', 'ok');
}
function restoreVersion(versionId){
  const clip = typeof getSelectedClip === 'function' ? getSelectedClip() : null;
  if(!clip) return;
  const version = readVersions().find((v)=>v.id === versionId);
  if(!version) return;
  Object.assign(clip, JSON.parse(JSON.stringify(version.snapshot)));
  if(clip.aiPlanJson) clip.aiPlanJson.shots = clip.shots;
  if(typeof renderAll === 'function') renderAll();
  if(typeof setActiveView === 'function') setActiveView('timeline');
  toast(state.lang === 'ro' ? 'Versiune restaurată.' : 'Version restored.', 'ok');
}
function deleteVersion(versionId){
  const next = readVersions().filter((v)=>v.id !== versionId);
  writeVersions(next);
  if(state.versioning.selectedVersionId === versionId) state.versioning.selectedVersionId = next[0]?.id || null;
  if(state.versioning.compareVersionId === versionId) state.versioning.compareVersionId = null;
  renderVersioningPanel();
}
function compareSummary(current, other){
  const currentShots = current?.shots || [];
  const otherShots = other?.shots || [];
  const currentShorts = current?.shorts || [];
  const otherShorts = other?.shorts || [];
  const lines = [
    `${state.lang === 'ro' ? 'Shot-uri curente' : 'Current shots'}: ${currentShots.length}`,
    `${state.lang === 'ro' ? 'Shot-uri versiune' : 'Version shots'}: ${otherShots.length}`,
    `${state.lang === 'ro' ? 'Shorts curente' : 'Current shorts'}: ${currentShorts.length}`,
    `${state.lang === 'ro' ? 'Shorts versiune' : 'Version shorts'}: ${otherShorts.length}`,
    `${state.lang === 'ro' ? 'Mesaj curent' : 'Current message'}: ${current?.message || '-'}`,
    `${state.lang === 'ro' ? 'Mesaj versiune' : 'Version message'}: ${other?.message || '-'}`
  ];
  const changedActions = [];
  const max = Math.max(currentShots.length, otherShots.length);
  for(let i=0;i<max;i++){
    const a = currentShots[i]?.action || '';
    const b = otherShots[i]?.action || '';
    if(a !== b) changedActions.push(`#${i+1} ${state.lang==='ro' ? 'diferit' : 'changed'}\n- ${a || '—'}\n+ ${b || '—'}`);
  }
  if(changedActions.length) lines.push('', changedActions.slice(0, 6).join('\n\n'));
  return lines.join('\n');
}
function renderVersioningPanel(){
  ensureVersioningUI();
  const panel = document.getElementById('versioningPanel');
  const clip = typeof getSelectedClip === 'function' ? getSelectedClip() : null;
  if(!panel) return;
  if(!clip){
    panel.innerHTML = `<h4>${state.lang==='ro'?'Versioning':'Versioning'}</h4><p class="hint">${state.lang==='ro'?'Generează un clip pentru a activa versiunile locale.':'Generate a clip to enable local versions.'}</p>`;
    return;
  }
  const versions = readVersions();
  const compare = versions.find((v)=>v.id === state.versioning.compareVersionId) || null;
  panel.innerHTML = `
    <h4>${state.lang==='ro'?'Versioning & save states':'Versioning & save states'}</h4>
    <div class="actions">
      <button class="btn btn-secondary" id="saveVersionBtn" type="button">${state.lang==='ro'?'Salvează versiune':'Save version'}</button>
      <button class="btn btn-secondary" id="quickSaveVersionBtn" type="button">${state.lang==='ro'?'Quick save':'Quick save'}</button>
    </div>
    <div class="field">
      <label>${state.lang==='ro'?'Comparație cu versiunea':'Compare with version'}</label>
      <select id="compareVersionSelect"><option value="">${state.lang==='ro'?'Alege versiunea':'Choose version'}</option>${versions.map((v)=>`<option value="${v.id}" ${state.versioning.compareVersionId===v.id?'selected':''}>${escapeHtml(v.name)}</option>`).join('')}</select>
    </div>
    <div class="output-box">${compare ? escapeHtml(compareSummary(snapshotClipForVersion(clip), compare.snapshot)) : escapeHtml(state.lang==='ro' ? 'Alege o versiune pentru compare.' : 'Choose a version to compare.')}</div>
    <div class="studio-stack">${versions.length ? versions.map((v)=>`<article class="variant-card"><strong>${escapeHtml(v.name)}</strong><div class="pill-row"><span class="pill">${escapeHtml(new Date(v.createdAt).toLocaleString())}</span></div><div class="actions"><button class="btn btn-secondary" data-restore-version="${v.id}" type="button">${state.lang==='ro'?'Restore':'Restore'}</button><button class="btn btn-secondary" data-compare-version="${v.id}" type="button">${state.lang==='ro'?'Compare':'Compare'}</button><button class="btn btn-danger" data-delete-version="${v.id}" type="button">${state.lang==='ro'?'Delete':'Delete'}</button></div></article>`).join('') : `<p class="hint">${state.lang==='ro'?'Nu există încă versiuni salvate.' : 'No saved versions yet.'}</p>`}</div>
  `;
  document.getElementById('saveVersionBtn')?.addEventListener('click', ()=>{
    const name = prompt(state.lang==='ro' ? 'Nume versiune:' : 'Version name:', `${currentClipVersionLabel()} · manual`);
    if(name == null) return;
    saveCurrentVersion(name);
  });
  document.getElementById('quickSaveVersionBtn')?.addEventListener('click', ()=> saveCurrentVersion());
  document.getElementById('compareVersionSelect')?.addEventListener('change', (e)=>{
    state.versioning.compareVersionId = e.target.value || null;
    renderVersioningPanel();
  });
  panel.querySelectorAll('[data-restore-version]').forEach((btn)=> btn.addEventListener('click', ()=> restoreVersion(btn.dataset.restoreVersion)));
  panel.querySelectorAll('[data-compare-version]').forEach((btn)=> btn.addEventListener('click', ()=>{ state.versioning.compareVersionId = btn.dataset.compareVersion; renderVersioningPanel(); }));
  panel.querySelectorAll('[data-delete-version]').forEach((btn)=> btn.addEventListener('click', ()=> deleteVersion(btn.dataset.deleteVersion)));
}

if(typeof renderSelectedClip === 'function'){
  const __origRenderSelectedClipVersioning = renderSelectedClip;
  renderSelectedClip = function(){
    __origRenderSelectedClipVersioning();
    renderVersioningPanel();
  };
}
if(typeof studioRenderInspector === 'function'){
  const __origStudioRenderInspectorVersioning = studioRenderInspector;
  studioRenderInspector = function(){
    __origStudioRenderInspectorVersioning();
    renderVersioningPanel();
  };
}
