state.productivity = state.productivity || { paletteOpen: false, telemetry: {}, selectedCommand: 0 };

function productivityStorageKey(prefix){
  const clip = typeof getSelectedClip === 'function' ? getSelectedClip() : null;
  const slug = slugify(clip?.shortTitle || clip?.title || 'global');
  return `lves.${prefix}.${slug}`;
}
function globalStorageKey(prefix){ return `lves.${prefix}`; }
function readJsonSafe(key, fallback){ try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; } }
function writeJsonSafe(key, value){ try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }
function incTelemetry(name){
  const all = readJsonSafe(globalStorageKey('telemetry'), {});
  all[name] = (all[name] || 0) + 1;
  writeJsonSafe(globalStorageKey('telemetry'), all);
  state.productivity.telemetry = all;
  renderTelemetryPanel();
}
function ensureOverlayRoot(){
  if(document.getElementById('productivityOverlayRoot')) return;
  const root = document.createElement('div');
  root.id = 'productivityOverlayRoot';
  document.body.appendChild(root);
}
function ensureProductivityPanels(){
  const mount = document.getElementById('studioInspectorMount');
  if(mount && !document.getElementById('telemetryPanel')){
    const panel = document.createElement('div');
    panel.id = 'telemetryPanel';
    panel.className = 'studio-inspector-card micro-fade-up';
    mount.appendChild(panel);
  }
  if(mount && !document.getElementById('presetTemplatePanel')){
    const panel = document.createElement('div');
    panel.id = 'presetTemplatePanel';
    panel.className = 'studio-inspector-card micro-fade-up';
    mount.appendChild(panel);
  }
}
function getTemplatePresets(){
  const user = readJsonSafe(globalStorageKey('templates'), []);
  return user;
}
function saveCurrentAsTemplate(){
  const clip = typeof getSelectedClip === 'function' ? getSelectedClip() : null;
  if(!clip) return;
  const name = prompt(state.lang==='ro' ? 'Nume template:' : 'Template name:', `${clip.shortTitle || clip.title || 'Template'} preset`);
  if(name == null) return;
  const templates = getTemplatePresets();
  templates.unshift({
    id: `tpl-${Date.now()}`,
    name,
    createdAt: new Date().toISOString(),
    demoStyleLabel: clip.demoStyleLabel || state.demoStyle,
    sourceMode: clip.sourceMode || state.sourceMode,
    duration: clip.duration,
    objective: clip.objective || '',
    message: clip.message || '',
    shots: (clip.shots || []).map((s)=>({ action:s.action, purpose:s.purpose, selectorHint:s.selectorHint || '', timingOverride:s.timingOverride || null, tag:s.tag || '' }))
  });
  writeJsonSafe(globalStorageKey('templates'), templates.slice(0, 20));
  incTelemetry('save_template');
  renderTemplatePanel();
  toast(state.lang==='ro' ? 'Template salvat.' : 'Template saved.', 'ok');
}
function applyTemplateById(id){
  const clip = typeof getSelectedClip === 'function' ? getSelectedClip() : null;
  const tpl = getTemplatePresets().find((x)=>x.id===id);
  if(!clip || !tpl) return;
  clip.demoStyleLabel = tpl.demoStyleLabel;
  clip.sourceMode = tpl.sourceMode;
  clip.duration = tpl.duration;
  clip.objective = tpl.objective;
  clip.message = tpl.message;
  clip.shots = tpl.shots.map((s, i)=>({
    time: clip.shots?.[i]?.time || `00:0${i} – 00:0${i+1}`,
    action: s.action,
    purpose: s.purpose,
    selectorHint: s.selectorHint,
    timingOverride: s.timingOverride,
    tag: s.tag
  }));
  if(typeof studioRetiming === 'function') studioRetiming(clip);
  if(clip.aiPlanJson) clip.aiPlanJson.shots = clip.shots;
  if(typeof renderAll === 'function') renderAll();
  if(typeof setActiveView === 'function') setActiveView('timeline');
  incTelemetry('apply_template');
  toast(state.lang==='ro' ? 'Template aplicat.' : 'Template applied.', 'ok');
}
function deleteTemplateById(id){
  writeJsonSafe(globalStorageKey('templates'), getTemplatePresets().filter((x)=>x.id!==id));
  renderTemplatePanel();
}
function renderTelemetryPanel(){
  ensureProductivityPanels();
  const panel = document.getElementById('telemetryPanel');
  if(!panel) return;
  state.productivity.telemetry = readJsonSafe(globalStorageKey('telemetry'), {});
  const t = state.productivity.telemetry;
  panel.innerHTML = `
    <h4>${state.lang==='ro' ? 'Local telemetry' : 'Local telemetry'}</h4>
    <div class="pill-row">
      <span class="pill">Generate: ${t.generate || 0}</span>
      <span class="pill">Export: ${t.export || 0}</span>
      <span class="pill">Undo: ${t.undo || 0}</span>
      <span class="pill">Redo: ${t.redo || 0}</span>
    </div>
    <div class="output-box">${escapeHtml([
      `Templates: ${t.save_template || 0}`,
      `Apply template: ${t.apply_template || 0}`,
      `Command palette: ${t.palette || 0}`,
      `Shortcuts: ${t.shortcuts || 0}`
    ].join('\n'))}</div>
  `;
}
function renderTemplatePanel(){
  ensureProductivityPanels();
  const panel = document.getElementById('presetTemplatePanel');
  if(!panel) return;
  const templates = getTemplatePresets();
  panel.innerHTML = `
    <h4>${state.lang==='ro' ? 'Preset templates' : 'Preset templates'}</h4>
    <div class="actions"><button class="btn btn-secondary" id="saveTemplateBtn" type="button">${state.lang==='ro' ? 'Save current as template' : 'Save current as template'}</button></div>
    <div class="studio-stack">
      ${templates.length ? templates.map((tpl)=>`<article class="variant-card"><strong>${escapeHtml(tpl.name)}</strong><div class="pill-row"><span class="pill">${escapeHtml(tpl.demoStyleLabel || '')}</span><span class="pill">${escapeHtml(String(tpl.duration || ''))}s</span></div><div class="actions"><button class="btn btn-secondary" data-apply-template="${tpl.id}" type="button">${state.lang==='ro' ? 'Apply' : 'Apply'}</button><button class="btn btn-danger" data-delete-template="${tpl.id}" type="button">${state.lang==='ro' ? 'Delete' : 'Delete'}</button></div></article>`).join('') : `<p class="hint">${state.lang==='ro' ? 'Nu există template-uri salvate.' : 'No saved templates.'}</p>`}
    </div>
  `;
  document.getElementById('saveTemplateBtn')?.addEventListener('click', saveCurrentAsTemplate);
  panel.querySelectorAll('[data-apply-template]').forEach((btn)=> btn.addEventListener('click', ()=> applyTemplateById(btn.dataset.applyTemplate)));
  panel.querySelectorAll('[data-delete-template]').forEach((btn)=> btn.addEventListener('click', ()=> deleteTemplateById(btn.dataset.deleteTemplate)));
}
function onboardingSeen(){ return !!localStorage.getItem(globalStorageKey('onboarding_seen')); }
function closeOnboarding(){ const el=document.getElementById('onboardingModal'); if(el) el.remove(); localStorage.setItem(globalStorageKey('onboarding_seen'),'1'); }
function showOnboarding(){
  ensureOverlayRoot();
  if(onboardingSeen() || document.getElementById('onboardingModal')) return;
  const root = document.getElementById('productivityOverlayRoot');
  const modal = document.createElement('div');
  modal.id = 'onboardingModal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(4,8,18,.72);backdrop-filter:blur(8px);z-index:120;display:grid;place-items:center;padding:24px';
  modal.innerHTML = `
    <div class="studio-inspector-card" style="max-width:720px;width:min(100%,720px)">
      <h3 style="margin:0">${state.lang==='ro' ? 'Bine ai venit în Studio Mode' : 'Welcome to Studio Mode'}</h3>
      <div class="output-box">${escapeHtml(state.lang==='ro'
        ? '1. Generează sau încarcă un clip.\n2. Reordonează shot-urile cu drag & drop.\n3. Editează shot-ul din inspectorul sticky.\n4. Salvează versiuni și folosește undo/redo.\n5. Exportă pachete dedicate pentru platforme.'
        : '1. Generate or load a clip.\n2. Reorder shots with drag & drop.\n3. Edit the shot from the sticky inspector.\n4. Save versions and use undo/redo.\n5. Export dedicated platform packages.')}</div>
      <div class="actions"><button class="btn btn-primary" id="closeOnboardingBtn" type="button">${state.lang==='ro' ? 'Începe' : 'Start'}</button></div>
    </div>`;
  root.appendChild(modal);
  document.getElementById('closeOnboardingBtn')?.addEventListener('click', closeOnboarding);
}
function commandList(){
  return [
    { label: state.lang==='ro' ? 'Generează demo' : 'Generate demo', run: ()=> document.getElementById('generateBtn')?.click() },
    { label: state.lang==='ro' ? 'Încarcă preseturi' : 'Load presets', run: ()=> document.getElementById('loadPresetBtn')?.click() },
    { label: state.lang==='ro' ? 'Deschide Export Center' : 'Open Export Center', run: ()=> typeof setActiveView==='function' && setActiveView('export-center') },
    { label: state.lang==='ro' ? 'Deschide Timeline' : 'Open Timeline', run: ()=> typeof setActiveView==='function' && setActiveView('timeline') },
    { label: state.lang==='ro' ? 'Quick save version' : 'Quick save version', run: ()=> typeof saveCurrentVersion==='function' && saveCurrentVersion() },
    { label: state.lang==='ro' ? 'Save current as template' : 'Save current as template', run: saveCurrentAsTemplate },
    { label: state.lang==='ro' ? 'Restore autosave' : 'Restore autosave', run: ()=> typeof restoreAutosaveAddon==='function' && restoreAutosaveAddon() }
  ];
}
function closePalette(){ const el=document.getElementById('commandPaletteModal'); if(el) el.remove(); state.productivity.paletteOpen = false; }
function openPalette(){
  ensureOverlayRoot();
  closePalette();
  state.productivity.paletteOpen = true;
  state.productivity.selectedCommand = 0;
  incTelemetry('palette');
  const root = document.getElementById('productivityOverlayRoot');
  const commands = commandList();
  const modal = document.createElement('div');
  modal.id = 'commandPaletteModal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(4,8,18,.56);backdrop-filter:blur(6px);z-index:130;display:grid;place-items:start center;padding-top:10vh';
  modal.innerHTML = `<div class="studio-inspector-card" style="width:min(92vw,760px)"><input id="commandPaletteInput" type="text" placeholder="${state.lang==='ro' ? 'Tastează o comandă…' : 'Type a command…'}" style="width:100%;padding:14px;border-radius:14px;border:1px solid rgba(255,255,255,.08);background:rgba(8,12,24,.92);color:white"><div id="commandPaletteList" class="studio-stack"></div></div>`;
  root.appendChild(modal);
  const render = (query='')=>{
    const list = document.getElementById('commandPaletteList');
    const filtered = commands.filter((c)=> c.label.toLowerCase().includes(query.toLowerCase()));
    state.productivity.filteredCommands = filtered;
    list.innerHTML = filtered.map((c,i)=>`<button class="btn ${i===state.productivity.selectedCommand?'btn-primary':'btn-secondary'}" data-command-index="${i}" type="button">${escapeHtml(c.label)}</button>`).join('') || `<p class="hint">${state.lang==='ro' ? 'Nicio comandă.' : 'No command.'}</p>`;
    list.querySelectorAll('[data-command-index]').forEach((btn)=> btn.addEventListener('click', ()=>{ filtered[Number(btn.dataset.commandIndex)]?.run(); closePalette(); }));
  };
  const input = document.getElementById('commandPaletteInput');
  input.addEventListener('input', ()=>{ state.productivity.selectedCommand = 0; render(input.value); });
  input.addEventListener('keydown', (e)=>{
    const filtered = state.productivity.filteredCommands || commands;
    if(e.key === 'ArrowDown'){ e.preventDefault(); state.productivity.selectedCommand = Math.min(filtered.length-1, state.productivity.selectedCommand + 1); render(input.value); }
    if(e.key === 'ArrowUp'){ e.preventDefault(); state.productivity.selectedCommand = Math.max(0, state.productivity.selectedCommand - 1); render(input.value); }
    if(e.key === 'Enter'){ e.preventDefault(); filtered[state.productivity.selectedCommand]?.run(); closePalette(); }
    if(e.key === 'Escape'){ closePalette(); }
  });
  modal.addEventListener('click', (e)=>{ if(e.target === modal) closePalette(); });
  render('');
  input.focus();
}
function registerShortcuts(){
  if(window.__lvesShortcutsBound) return;
  window.__lvesShortcutsBound = true;
  document.addEventListener('keydown', (e)=>{
    const meta = e.metaKey || e.ctrlKey;
    if(meta && e.key.toLowerCase() === 'k'){ e.preventDefault(); openPalette(); incTelemetry('shortcuts'); }
    if(meta && e.key.toLowerCase() === 'z' && !e.shiftKey){ e.preventDefault(); if(typeof historyUndoAddon==='function') historyUndoAddon(); incTelemetry('undo'); }
    if((meta && e.key.toLowerCase() === 'y') || (meta && e.shiftKey && e.key.toLowerCase() === 'z')){ e.preventDefault(); if(typeof historyRedoAddon==='function') historyRedoAddon(); incTelemetry('redo'); }
    if(meta && e.key.toLowerCase() === 's'){ e.preventDefault(); if(typeof saveCurrentVersion==='function') saveCurrentVersion(); incTelemetry('save_version'); }
    if(e.key === '?' && !meta){ e.preventDefault(); showOnboarding(); incTelemetry('shortcuts'); }
  });
}

if(typeof buildClipFromPlan === 'function'){
  const __origBuildClipFromPlanProductivity = buildClipFromPlan;
  buildClipFromPlan = function(plan, inputs){
    const clip = __origBuildClipFromPlanProductivity(plan, inputs);
    setTimeout(()=>{ incTelemetry('generate'); renderTelemetryPanel(); renderTemplatePanel(); }, 0);
    return clip;
  };
}
if(typeof studioDownloadPackage === 'function'){
  const __origStudioDownloadPackageProductivity = studioDownloadPackage;
  studioDownloadPackage = async function(type){ incTelemetry('export'); return __origStudioDownloadPackageProductivity(type); };
}
if(typeof renderSelectedClip === 'function'){
  const __origRenderSelectedClipProductivity = renderSelectedClip;
  renderSelectedClip = function(){
    __origRenderSelectedClipProductivity();
    renderTelemetryPanel();
    renderTemplatePanel();
  };
}
(function(){
  const init = ()=>{ ensureOverlayRoot(); registerShortcuts(); renderTelemetryPanel(); renderTemplatePanel(); setTimeout(showOnboarding, 250); };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true }); else init();
})();