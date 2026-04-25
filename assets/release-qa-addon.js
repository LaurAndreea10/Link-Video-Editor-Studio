state.releaseMeta = state.releaseMeta || { version: '0.9.0-beta', changelog: [] };

function releaseStorageKey(name){ return `lves.release.${name}`; }
function readReleaseJson(name, fallback){ try { return JSON.parse(localStorage.getItem(releaseStorageKey(name)) || JSON.stringify(fallback)); } catch { return fallback; } }
function writeReleaseJson(name, value){ try { localStorage.setItem(releaseStorageKey(name), JSON.stringify(value)); } catch {} }

function ensureReleasePanels(){
  const mount = document.getElementById('studioInspectorMount');
  if(mount && !document.getElementById('releasePanel')){
    const panel = document.createElement('div');
    panel.id = 'releasePanel';
    panel.className = 'studio-inspector-card micro-fade-up';
    mount.appendChild(panel);
  }
  const hero = document.querySelector('.hero-top');
  if(hero && !document.getElementById('versionBadgeInline')){
    const badge = document.createElement('div');
    badge.id = 'versionBadgeInline';
    badge.className = 'badge';
    hero.appendChild(badge);
  }
}

function getQAItems(){
  return [
    { id: 'generate', labelRo: 'Generare clip funcțională', labelEn: 'Clip generation works' },
    { id: 'timeline', labelRo: 'Timeline drag & drop', labelEn: 'Timeline drag & drop' },
    { id: 'inspector', labelRo: 'Inspector salvează editările', labelEn: 'Inspector saves edits' },
    { id: 'export', labelRo: 'Export Center descarcă ZIP', labelEn: 'Export Center downloads ZIP' },
    { id: 'autosave', labelRo: 'Autosave și restore', labelEn: 'Autosave and restore' },
    { id: 'shortcuts', labelRo: 'Shortcuts active', labelEn: 'Shortcuts active' }
  ];
}

function getChangelog(){
  return readReleaseJson('changelog', [
    { at: new Date().toISOString(), text: 'Studio mode, export center, versioning, autosave, command palette.' }
  ]);
}

function addChangelogEntry(text){
  const entries = getChangelog();
  entries.unshift({ at: new Date().toISOString(), text });
  writeReleaseJson('changelog', entries.slice(0, 20));
  renderReleasePanel();
}

function bumpVersion(kind){
  const raw = localStorage.getItem(releaseStorageKey('version')) || state.releaseMeta.version || '0.9.0-beta';
  const match = raw.match(/^(\d+)\.(\d+)\.(\d+)(.*)$/);
  if(!match) return raw;
  let major = Number(match[1]), minor = Number(match[2]), patch = Number(match[3]);
  const suffix = match[4] || '-beta';
  if(kind === 'major'){ major += 1; minor = 0; patch = 0; }
  if(kind === 'minor'){ minor += 1; patch = 0; }
  if(kind === 'patch'){ patch += 1; }
  const next = `${major}.${minor}.${patch}${suffix}`;
  localStorage.setItem(releaseStorageKey('version'), next);
  addChangelogEntry(`Version bumped to ${next}`);
  renderReleasePanel();
  return next;
}

function renderReleasePanel(){
  ensureReleasePanels();
  const panel = document.getElementById('releasePanel');
  const badge = document.getElementById('versionBadgeInline');
  if(!panel) return;
  const version = localStorage.getItem(releaseStorageKey('version')) || state.releaseMeta.version || '0.9.0-beta';
  const qa = readReleaseJson('qa', {});
  const changelog = getChangelog();
  if(badge) badge.textContent = `Version ${version}`;
  panel.innerHTML = `
    <h4>${state.lang === 'ro' ? 'Release & QA' : 'Release & QA'}</h4>
    <div class="pill-row"><span class="pill">${state.lang === 'ro' ? 'Versiune' : 'Version'}: ${version}</span><span class="pill">${state.lang === 'ro' ? 'Changelog entries' : 'Changelog entries'}: ${changelog.length}</span></div>
    <div class="actions">
      <button class="btn btn-secondary" id="bumpPatchBtn" type="button">Patch</button>
      <button class="btn btn-secondary" id="bumpMinorBtn" type="button">Minor</button>
      <button class="btn btn-secondary" id="bumpMajorBtn" type="button">Major</button>
      <button class="btn btn-secondary" id="addChangelogBtn" type="button">${state.lang === 'ro' ? 'Adaugă notă' : 'Add note'}</button>
    </div>
    <div class="studio-stack">
      <article class="variant-card">
        <strong>${state.lang === 'ro' ? 'QA checklist' : 'QA checklist'}</strong>
        <div class="studio-stack">${getQAItems().map((item)=>`<label class="translation-chip" style="display:flex;gap:8px;align-items:center"><input type="checkbox" data-qa-item="${item.id}" ${qa[item.id] ? 'checked' : ''}> ${escapeHtml(state.lang === 'ro' ? item.labelRo : item.labelEn)}</label>`).join('')}</div>
      </article>
      <article class="variant-card">
        <strong>${state.lang === 'ro' ? 'Changelog' : 'Changelog'}</strong>
        <div class="output-box">${escapeHtml(changelog.map((entry)=>`${new Date(entry.at).toLocaleString()}\n- ${entry.text}`).join('\n\n'))}</div>
      </article>
    </div>
  `;
  document.getElementById('bumpPatchBtn')?.addEventListener('click', ()=>bumpVersion('patch'));
  document.getElementById('bumpMinorBtn')?.addEventListener('click', ()=>bumpVersion('minor'));
  document.getElementById('bumpMajorBtn')?.addEventListener('click', ()=>bumpVersion('major'));
  document.getElementById('addChangelogBtn')?.addEventListener('click', ()=>{
    const text = prompt(state.lang === 'ro' ? 'Notă changelog:' : 'Changelog note:', 'Polish and QA pass');
    if(text == null || !text.trim()) return;
    addChangelogEntry(text.trim());
  });
  panel.querySelectorAll('[data-qa-item]').forEach((input)=> input.addEventListener('change', (e)=>{
    const next = readReleaseJson('qa', {});
    next[e.target.dataset.qaItem] = !!e.target.checked;
    writeReleaseJson('qa', next);
  }));
}

if(typeof renderSelectedClip === 'function'){
  const __origRenderSelectedClipReleaseAddon = renderSelectedClip;
  renderSelectedClip = function(){
    __origRenderSelectedClipReleaseAddon();
    renderReleasePanel();
  };
}
if(typeof studioRenderInspector === 'function'){
  const __origStudioRenderInspectorReleaseAddon = studioRenderInspector;
  studioRenderInspector = function(){
    __origStudioRenderInspectorReleaseAddon();
    renderReleasePanel();
  };
}
(function(){
  const init = ()=> renderReleasePanel();
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true }); else init();
})();