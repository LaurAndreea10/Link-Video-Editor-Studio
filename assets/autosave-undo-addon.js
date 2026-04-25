state.history = state.history || { undoStack: [], redoStack: [], lastSerialized: '', lastClipKey: '' };

function autosaveKeyAddon(){
  const clip = typeof getSelectedClip === 'function' ? getSelectedClip() : null;
  return `lves.autosave.${slugify(clip?.shortTitle || clip?.title || 'default')}`;
}
function serializeClipStateAddon(clip){
  if(!clip) return '';
  return JSON.stringify({
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
  });
}
function parseSerializedClipAddon(serialized){
  try { return JSON.parse(serialized); } catch { return null; }
}
function autosaveWriteAddon(serialized){
  try {
    localStorage.setItem(autosaveKeyAddon(), JSON.stringify({ savedAt: new Date().toISOString(), snapshot: serialized }));
  } catch {}
}
function autosaveReadAddon(){
  try {
    return JSON.parse(localStorage.getItem(autosaveKeyAddon()) || 'null');
  } catch {
    return null;
  }
}
function applySerializedClipAddon(serialized){
  const clip = typeof getSelectedClip === 'function' ? getSelectedClip() : null;
  const parsed = parseSerializedClipAddon(serialized);
  if(!clip || !parsed) return;
  Object.assign(clip, JSON.parse(JSON.stringify(parsed)));
  if(clip.aiPlanJson) clip.aiPlanJson.shots = clip.shots;
  if(typeof renderAll === 'function') renderAll();
  if(typeof setActiveView === 'function') setActiveView('timeline');
}
function resetHistoryForClipAddon(){
  const clip = typeof getSelectedClip === 'function' ? getSelectedClip() : null;
  const clipKey = slugify(clip?.shortTitle || clip?.title || 'default');
  if(state.history.lastClipKey !== clipKey){
    state.history.undoStack = [];
    state.history.redoStack = [];
    state.history.lastSerialized = serializeClipStateAddon(clip);
    state.history.lastClipKey = clipKey;
  }
}
function captureHistoryAddon(){
  const clip = typeof getSelectedClip === 'function' ? getSelectedClip() : null;
  if(!clip) return;
  resetHistoryForClipAddon();
  const current = serializeClipStateAddon(clip);
  if(!state.history.lastSerialized){
    state.history.lastSerialized = current;
    autosaveWriteAddon(current);
    return;
  }
  if(current !== state.history.lastSerialized){
    state.history.undoStack.unshift(state.history.lastSerialized);
    state.history.undoStack = state.history.undoStack.slice(0, 60);
    state.history.redoStack = [];
    state.history.lastSerialized = current;
    autosaveWriteAddon(current);
  }
}
function historyUndoAddon(){
  const clip = typeof getSelectedClip === 'function' ? getSelectedClip() : null;
  if(!clip || !state.history.undoStack.length) return;
  const current = serializeClipStateAddon(clip);
  const prev = state.history.undoStack.shift();
  state.history.redoStack.unshift(current);
  applySerializedClipAddon(prev);
  state.history.lastSerialized = prev;
  autosaveWriteAddon(prev);
  renderAutosavePanelAddon();
}
function historyRedoAddon(){
  const clip = typeof getSelectedClip === 'function' ? getSelectedClip() : null;
  if(!clip || !state.history.redoStack.length) return;
  const current = serializeClipStateAddon(clip);
  const next = state.history.redoStack.shift();
  state.history.undoStack.unshift(current);
  applySerializedClipAddon(next);
  state.history.lastSerialized = next;
  autosaveWriteAddon(next);
  renderAutosavePanelAddon();
}
function restoreAutosaveAddon(){
  const saved = autosaveReadAddon();
  if(!saved?.snapshot) return;
  applySerializedClipAddon(saved.snapshot);
  state.history.lastSerialized = saved.snapshot;
  renderAutosavePanelAddon();
  toast(state.lang === 'ro' ? 'Autosave restaurat.' : 'Autosave restored.', 'ok');
}
function ensureAutosavePanelAddon(){
  const mount = document.getElementById('studioInspectorMount');
  if(mount && !document.getElementById('autosavePanel')){
    const panel = document.createElement('div');
    panel.id = 'autosavePanel';
    panel.className = 'studio-inspector-card micro-fade-up';
    mount.appendChild(panel);
  }
}
function renderAutosavePanelAddon(){
  ensureAutosavePanelAddon();
  const panel = document.getElementById('autosavePanel');
  const clip = typeof getSelectedClip === 'function' ? getSelectedClip() : null;
  if(!panel) return;
  if(!clip){
    panel.innerHTML = `<h4>${state.lang === 'ro' ? 'Autosave & history' : 'Autosave & history'}</h4><p class="hint">${state.lang === 'ro' ? 'Generează un clip pentru undo, redo și autosave.' : 'Generate a clip for undo, redo and autosave.'}</p>`;
    return;
  }
  resetHistoryForClipAddon();
  const saved = autosaveReadAddon();
  panel.innerHTML = `
    <h4>${state.lang === 'ro' ? 'Autosave & undo/redo' : 'Autosave & undo/redo'}</h4>
    <div class="pill-row">
      <span class="pill">Undo: ${state.history.undoStack.length}</span>
      <span class="pill">Redo: ${state.history.redoStack.length}</span>
      <span class="pill">${saved?.savedAt ? escapeHtml(new Date(saved.savedAt).toLocaleString()) : (state.lang === 'ro' ? 'fără autosave' : 'no autosave')}</span>
    </div>
    <div class="actions">
      <button class="btn btn-secondary" id="undoBtn" type="button" ${state.history.undoStack.length ? '' : 'disabled'}>${state.lang === 'ro' ? 'Undo' : 'Undo'}</button>
      <button class="btn btn-secondary" id="redoBtn" type="button" ${state.history.redoStack.length ? '' : 'disabled'}>${state.lang === 'ro' ? 'Redo' : 'Redo'}</button>
      <button class="btn btn-secondary" id="restoreAutosaveBtn" type="button" ${saved?.snapshot ? '' : 'disabled'}>${state.lang === 'ro' ? 'Restore autosave' : 'Restore autosave'}</button>
    </div>
    <div class="sticky-note">${state.lang === 'ro' ? 'Editorul salvează local ultima stare a clipului selectat și păstrează istoric pentru undo/redo.' : 'The editor locally saves the latest selected clip state and keeps history for undo/redo.'}</div>
  `;
  document.getElementById('undoBtn')?.addEventListener('click', historyUndoAddon);
  document.getElementById('redoBtn')?.addEventListener('click', historyRedoAddon);
  document.getElementById('restoreAutosaveBtn')?.addEventListener('click', restoreAutosaveAddon);
}

if(typeof renderSelectedClip === 'function'){
  const __origRenderSelectedClipAutosaveAddon = renderSelectedClip;
  renderSelectedClip = function(){
    __origRenderSelectedClipAutosaveAddon();
    captureHistoryAddon();
    renderAutosavePanelAddon();
  };
}
if(typeof studioRenderInspector === 'function'){
  const __origStudioRenderInspectorAutosaveAddon = studioRenderInspector;
  studioRenderInspector = function(){
    __origStudioRenderInspectorAutosaveAddon();
    renderAutosavePanelAddon();
  };
}
if(typeof buildClipFromPlan === 'function'){
  const __origBuildClipFromPlanAutosaveAddon = buildClipFromPlan;
  buildClipFromPlan = function(plan, inputs){
    const clip = __origBuildClipFromPlanAutosaveAddon(plan, inputs);
    setTimeout(()=>{
      state.history.lastClipKey = '';
      resetHistoryForClipAddon();
      captureHistoryAddon();
      renderAutosavePanelAddon();
    }, 0);
    return clip;
  };
}
