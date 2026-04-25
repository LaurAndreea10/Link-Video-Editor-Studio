state.timelineEditor = state.timelineEditor || { selectedShotIndex: 0 };

function ensureCommandCenterAddon(){
  const toolbarTabs = document.querySelector('.pane .tabs:last-child');
  if(toolbarTabs && !toolbarTabs.querySelector('[data-view="command"]')){
    const btn = document.createElement('button');
    btn.className = 'tab';
    btn.dataset.view = 'command';
    btn.textContent = state.lang === 'ro' ? 'Command' : 'Command';
    toolbarTabs.insertBefore(btn, toolbarTabs.firstChild);
  }
  const timelineView = document.getElementById('view-timeline');
  if(timelineView && !document.getElementById('view-command')){
    const block = document.createElement('div');
    block.id = 'view-command';
    block.className = 'view-block hidden';
    block.innerHTML = '<div class="stack" id="commandCenterPanel"></div>';
    timelineView.insertAdjacentElement('beforebegin', block);
  }
}

function commandCenterCardsAddon(){
  const clip = getSelectedClip();
  const artifactItems = typeof readArtifactsAddon === 'function' ? readArtifactsAddon() : [];
  const latestArtifact = artifactItems[0] || null;
  const jobsMeta = typeof jobsRepoMetaAddon === 'function' ? jobsRepoMetaAddon() : null;
  const sourceMode = clip?.sourceMode || state.sourceMode || 'page';
  const style = clip?.demoStyleLabel || state.demoStyle || 'Style';
  const latestShort = clip?.shorts?.[0] || null;
  return [
    {
      icon: '🎛️',
      title: state.lang === 'ro' ? 'Control overview' : 'Control overview',
      body: state.lang === 'ro'
        ? `Mod: ${state.mode} · Sursă: ${sourceMode} · Stil: ${style}`
        : `Mode: ${state.mode} · Source: ${sourceMode} · Style: ${style}`
    },
    {
      icon: '🎬',
      title: state.lang === 'ro' ? 'Ultimul demo' : 'Latest demo',
      body: clip
        ? `${clip.shortTitle} · ${clip.duration}s · ${(clip.shots || []).length} shots`
        : (state.lang === 'ro' ? 'Nu există încă un demo generat.' : 'No generated demo yet.')
    },
    {
      icon: '🗂️',
      title: state.lang === 'ro' ? 'Ultimul artifact' : 'Latest artifact',
      body: latestArtifact
        ? `${latestArtifact.title} · ${latestArtifact.style} · ${latestArtifact.format}`
        : (state.lang === 'ro' ? 'Istoricul local de artifacte este gol.' : 'Local artifact history is empty.')
    },
    {
      icon: '📱',
      title: state.lang === 'ro' ? 'Primary short' : 'Primary short',
      body: latestShort
        ? `${latestShort.title} · ${latestShort.range} · ${latestShort.format}`
        : (state.lang === 'ro' ? 'Short-urile apar după generare.' : 'Shorts appear after generation.')
    },
    {
      icon: '⚙️',
      title: state.lang === 'ro' ? 'Workflow lane' : 'Workflow lane',
      body: jobsMeta
        ? (state.lang === 'ro' ? 'Validate · Pages · Render Export conectate.' : 'Validate · Pages · Render Export connected.')
        : (state.lang === 'ro' ? 'Workflow metadata indisponibile.' : 'Workflow metadata unavailable.')
    }
  ];
}

function renderCommandCenterAddon(){
  ensureCommandCenterAddon();
  const panel = document.getElementById('commandCenterPanel');
  if(!panel) return;
  const clip = getSelectedClip();
  const cards = commandCenterCardsAddon();
  const artifactMeta = typeof artifactRepoMetaAddon === 'function' ? artifactRepoMetaAddon() : null;
  const jobsMeta = typeof jobsRepoMetaAddon === 'function' ? jobsRepoMetaAddon() : null;
  panel.innerHTML = `
    <div class="stat-row reveal-stagger">
      ${cards.map((card)=>`<article class="stat micro-fade-up"><div class="pill-row"><span class="pill">${card.icon}</span></div><div class="k">${escapeHtml(card.title)}</div><div class="l">${escapeHtml(card.body)}</div></article>`).join('')}
    </div>
    <article class="translation-card micro-fade-up">
      <strong>${state.lang === 'ro' ? 'Quick actions' : 'Quick actions'}</strong>
      <div class="actions">
        <button class="btn btn-secondary" id="commandGenerateBtn" type="button">${state.lang === 'ro' ? 'Generează acum' : 'Generate now'}</button>
        <button class="btn btn-secondary" id="commandPresetBtn" type="button">${state.lang === 'ro' ? 'Încarcă preseturi' : 'Load presets'}</button>
        ${artifactMeta ? `<a class="btn btn-secondary" href="${artifactMeta.actionsUrl}" target="_blank" rel="noreferrer">GitHub Actions</a>` : ''}
        ${jobsMeta ? `<a class="btn btn-secondary" href="${jobsMeta.workflowUrl}" target="_blank" rel="noreferrer">Render Export</a>` : ''}
      </div>
    </article>
    <article class="translation-card micro-fade-up">
      <strong>${state.lang === 'ro' ? 'Health snapshot' : 'Health snapshot'}</strong>
      <div class="output-box">${escapeHtml([
        `${state.lang === 'ro' ? 'Mod' : 'Mode'}: ${state.mode}`,
        `${state.lang === 'ro' ? 'Limbă' : 'Language'}: ${state.lang}`,
        `${state.lang === 'ro' ? 'Sursă' : 'Source'}: ${clip?.sourceMode || state.sourceMode}`,
        `${state.lang === 'ro' ? 'Shots' : 'Shots'}: ${(clip?.shots || []).length}`,
        `${state.lang === 'ro' ? 'Shorts' : 'Shorts'}: ${(clip?.shorts || []).length}`,
        `${state.lang === 'ro' ? 'Keyframes' : 'Keyframes'}: ${(clip?.keyframes || []).length}`
      ].join('\n'))}</div>
    </article>
  `;
  document.getElementById('commandGenerateBtn')?.addEventListener('click', ()=>document.getElementById('generateBtn')?.click());
  document.getElementById('commandPresetBtn')?.addEventListener('click', ()=>document.getElementById('loadPresetBtn')?.click());
}

function parseTimecodeToSecondsAddon(rangeStart){
  const cleaned = String(rangeStart || '00:00').trim();
  const parts = cleaned.split(':').map(Number);
  if(parts.length === 2) return parts[0]*60 + parts[1];
  if(parts.length === 3) return parts[0]*3600 + parts[1]*60 + parts[2];
  return 0;
}

function formatSecondsToTimeAddon(seconds){
  const safe = Math.max(0, Math.round(seconds));
  return `${String(Math.floor(safe/60)).padStart(2,'0')}:${String(safe%60).padStart(2,'0')}`;
}

function retimeShotsAddon(shots, totalDuration){
  if(!Array.isArray(shots) || !shots.length) return shots || [];
  const weights = shots.map((shot)=>{
    const [start,end] = String(shot.time || '00:00 – 00:04').split('–').map((x)=>x.trim());
    const s = parseTimecodeToSecondsAddon(start);
    const e = parseTimecodeToSecondsAddon(end);
    return Math.max(2, e - s || 4);
  });
  const sum = weights.reduce((a,b)=>a+b,0) || 1;
  const durations = weights.map((w)=>Math.max(2, Math.round(totalDuration * (w/sum))));
  const diff = totalDuration - durations.reduce((a,b)=>a+b,0);
  durations[durations.length - 1] = Math.max(2, durations[durations.length - 1] + diff);
  let cursor = 0;
  return shots.map((shot, index)=>{
    const end = cursor + durations[index];
    const updated = { ...shot, time: `${formatSecondsToTimeAddon(cursor)} – ${formatSecondsToTimeAddon(end)}` };
    cursor = end;
    return updated;
  });
}

function updateSelectedClipShotsAddon(mutator){
  const clip = getSelectedClip();
  if(!clip || !Array.isArray(clip.shots)) return;
  const shots = clip.shots.map((shot)=>({ ...shot }));
  mutator(shots, clip);
  clip.shots = retimeShotsAddon(shots, clip.duration || 40);
  if(clip.aiPlanJson) clip.aiPlanJson.shots = clip.shots;
  renderAll();
  setActiveView('timeline');
}

function renderTimelineEditorAddon(){
  const clip = getSelectedClip();
  const timeline = document.getElementById('timeline');
  if(!timeline) return;
  const existing = document.getElementById('timelineEditorBar');
  if(existing) existing.remove();
  if(!clip || !Array.isArray(clip.shots) || !clip.shots.length) return;
  state.timelineEditor.selectedShotIndex = Math.min(state.timelineEditor.selectedShotIndex || 0, clip.shots.length - 1);
  const selected = clip.shots[state.timelineEditor.selectedShotIndex];
  const bar = document.createElement('div');
  bar.id = 'timelineEditorBar';
  bar.className = 'translation-card micro-fade-up';
  bar.innerHTML = `
    <strong>${state.lang === 'ro' ? 'Timeline editor' : 'Timeline editor'}</strong>
    <div class="pill-row">
      <span class="pill">${state.lang === 'ro' ? 'Shot selectat' : 'Selected shot'}: ${(state.timelineEditor.selectedShotIndex || 0) + 1}</span>
      <span class="pill">${escapeHtml(selected.time || '')}</span>
    </div>
    <div class="actions">
      <button class="btn btn-secondary" id="shotMoveUpBtn" type="button">↑ ${state.lang === 'ro' ? 'Sus' : 'Up'}</button>
      <button class="btn btn-secondary" id="shotMoveDownBtn" type="button">↓ ${state.lang === 'ro' ? 'Jos' : 'Down'}</button>
      <button class="btn btn-secondary" id="shotShorterBtn" type="button">− ${state.lang === 'ro' ? 'Mai scurt' : 'Shorter'}</button>
      <button class="btn btn-secondary" id="shotLongerBtn" type="button">+ ${state.lang === 'ro' ? 'Mai lung' : 'Longer'}</button>
      <button class="btn btn-secondary" id="shotDuplicateBtn" type="button">${state.lang === 'ro' ? 'Duplică' : 'Duplicate'}</button>
      <button class="btn btn-secondary" id="shotRewriteBtn" type="button">${state.lang === 'ro' ? 'Rescrie text' : 'Rewrite text'}</button>
      <button class="btn btn-danger" id="shotDeleteBtn" type="button">${state.lang === 'ro' ? 'Șterge' : 'Delete'}</button>
    </div>
  `;
  timeline.prepend(bar);

  document.getElementById('shotMoveUpBtn')?.addEventListener('click', ()=>{
    updateSelectedClipShotsAddon((shots)=>{
      const i = state.timelineEditor.selectedShotIndex;
      if(i <= 0) return;
      [shots[i-1], shots[i]] = [shots[i], shots[i-1]];
      state.timelineEditor.selectedShotIndex = i - 1;
    });
  });
  document.getElementById('shotMoveDownBtn')?.addEventListener('click', ()=>{
    updateSelectedClipShotsAddon((shots)=>{
      const i = state.timelineEditor.selectedShotIndex;
      if(i >= shots.length - 1) return;
      [shots[i+1], shots[i]] = [shots[i], shots[i+1]];
      state.timelineEditor.selectedShotIndex = i + 1;
    });
  });
  document.getElementById('shotDuplicateBtn')?.addEventListener('click', ()=>{
    updateSelectedClipShotsAddon((shots)=>{
      const i = state.timelineEditor.selectedShotIndex;
      shots.splice(i + 1, 0, { ...shots[i], action: `${shots[i].action} ${state.lang === 'ro' ? '(dup.)' : '(dup.)'}` });
      state.timelineEditor.selectedShotIndex = i + 1;
    });
  });
  document.getElementById('shotDeleteBtn')?.addEventListener('click', ()=>{
    updateSelectedClipShotsAddon((shots)=>{
      if(shots.length <= 1) return;
      shots.splice(state.timelineEditor.selectedShotIndex, 1);
      state.timelineEditor.selectedShotIndex = Math.max(0, Math.min(state.timelineEditor.selectedShotIndex, shots.length - 1));
    });
  });
  document.getElementById('shotShorterBtn')?.addEventListener('click', ()=>{
    updateSelectedClipShotsAddon((shots)=>{
      const i = state.timelineEditor.selectedShotIndex;
      shots[i].timeBias = (shots[i].timeBias || 0) - 1;
      if(i < shots.length - 1) shots[i+1].timeBias = (shots[i+1].timeBias || 0) + 1;
    });
  });
  document.getElementById('shotLongerBtn')?.addEventListener('click', ()=>{
    updateSelectedClipShotsAddon((shots)=>{
      const i = state.timelineEditor.selectedShotIndex;
      shots[i].timeBias = (shots[i].timeBias || 0) + 1;
      if(i < shots.length - 1) shots[i+1].timeBias = (shots[i+1].timeBias || 0) - 1;
    });
  });
  document.getElementById('shotRewriteBtn')?.addEventListener('click', ()=>{
    const action = prompt(state.lang === 'ro' ? 'Acțiune nouă pentru shot:' : 'New action for shot:', selected.action || '');
    if(action == null) return;
    const purpose = prompt(state.lang === 'ro' ? 'Scop nou pentru shot:' : 'New purpose for shot:', selected.purpose || '');
    if(purpose == null) return;
    updateSelectedClipShotsAddon((shots)=>{
      shots[state.timelineEditor.selectedShotIndex] = { ...shots[state.timelineEditor.selectedShotIndex], action, purpose };
    });
  });

  timeline.querySelectorAll('.shot').forEach((node, index)=>{
    node.style.cursor = 'pointer';
    if(index === state.timelineEditor.selectedShotIndex){
      node.style.borderColor = 'rgba(137,240,213,.65)';
      node.style.boxShadow = 'inset 0 0 0 1px rgba(137,240,213,.25)';
    }
    node.addEventListener('click', ()=>{
      state.timelineEditor.selectedShotIndex = index;
      renderTimelineEditorAddon();
    });
  });
}

const __origRenderSelectedClipCommandAddon = renderSelectedClip;
renderSelectedClip = function(){
  __origRenderSelectedClipCommandAddon();
  ensureCommandCenterAddon();
  renderTimelineEditorAddon();
  if(state.activeView === 'command') renderCommandCenterAddon();
};

(function bootstrapCommandAddon(){
  const init = ()=>{
    ensureCommandCenterAddon();
    if(state.activeView === 'command') renderCommandCenterAddon();
  };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
  else init();
})();

const __origSetActiveViewCommandAddon = setActiveView;
setActiveView = function(view){
  __origSetActiveViewCommandAddon(view);
  if(view === 'command') renderCommandCenterAddon();
  if(view === 'timeline') renderTimelineEditorAddon();
};
