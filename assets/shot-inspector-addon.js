state.timelineEditor = state.timelineEditor || { selectedShotIndex: 0 };

function ensureShotInspectorAddon(){
  const timelineView = document.getElementById('view-timeline');
  if(timelineView && !document.getElementById('shotInspectorPanel')){
    const panel = document.createElement('div');
    panel.id = 'shotInspectorPanel';
    panel.className = 'translation-card micro-fade-up';
    panel.style.marginBottom = '12px';
    timelineView.insertBefore(panel, timelineView.firstChild);
  }
}

function getSelectedShotAddon(){
  const clip = getSelectedClip();
  if(!clip || !Array.isArray(clip.shots) || !clip.shots.length) return { clip: null, shot: null, index: -1 };
  const index = Math.max(0, Math.min(state.timelineEditor?.selectedShotIndex || 0, clip.shots.length - 1));
  state.timelineEditor.selectedShotIndex = index;
  return { clip, shot: clip.shots[index], index };
}

function saveShotInspectorMutationAddon(mutator){
  const clip = getSelectedClip();
  if(!clip || !Array.isArray(clip.shots)) return;
  const shots = clip.shots.map((shot)=>({ ...shot }));
  mutator(shots, clip);
  clip.shots = shots;
  if(clip.aiPlanJson) clip.aiPlanJson.shots = shots;
  renderAll();
  setActiveView('timeline');
}

function regenerateSelectedShotAddon(){
  const { clip, shot, index } = getSelectedShotAddon();
  if(!clip || !shot) return;
  saveShotInspectorMutationAddon((shots)=>{
    const prev = shots[index - 1];
    const next = shots[index + 1];
    const vibe = clip.demoStyleLabel || state.demoStyle || 'Studio';
    const sourceMode = clip.sourceMode || state.sourceMode || 'page';
    const actionSeed = [
      state.lang === 'ro' ? 'Arată zona cea mai valoroasă vizual, apoi intră într-un detaliu clar.' : 'Show the visually strongest area, then move into a clear detail.',
      state.lang === 'ro' ? 'Fă o micro-interacțiune lizibilă și lasă payoff-ul în cadru.' : 'Do one readable micro-interaction and leave the payoff in frame.',
      state.lang === 'ro' ? 'Expune o tranziție de stare fără să aglomerezi ecranul.' : 'Expose a state transition without cluttering the screen.'
    ];
    const purposeSeed = [
      state.lang === 'ro' ? 'Claritate funcțională.' : 'Functional clarity.',
      state.lang === 'ro' ? 'Profunzime de produs.' : 'Product depth.',
      state.lang === 'ro' ? 'Payoff vizual controlat.' : 'Controlled visual payoff.'
    ];
    shots[index] = {
      ...shots[index],
      action: `${actionSeed[index % actionSeed.length]} ${state.lang === 'ro' ? `Stil: ${vibe}.` : `Style: ${vibe}.`} ${state.lang === 'ro' ? `Sursă: ${sourceMode}.` : `Source: ${sourceMode}.`}`,
      purpose: purposeSeed[(index + 1) % purposeSeed.length],
      selectorHint: shots[index].selectorHint || prev?.selectorHint || next?.selectorHint || 'main, .panel, .card',
      notes: state.lang === 'ro' ? 'Regenerat local din inspector.' : 'Locally regenerated from inspector.'
    };
  });
  toast(state.lang === 'ro' ? 'Shot regenerat local.' : 'Shot regenerated locally.', 'ok');
}

function renderShotInspectorAddon(){
  ensureShotInspectorAddon();
  const panel = document.getElementById('shotInspectorPanel');
  if(!panel) return;
  const { clip, shot, index } = getSelectedShotAddon();
  if(!clip || !shot){
    panel.innerHTML = `<div class="empty-state micro-fade-up"><div class="empty-state-icon">🎯</div><h4>${state.lang === 'ro' ? 'Inspector indisponibil' : 'Inspector unavailable'}</h4><p>${state.lang === 'ro' ? 'Generează sau selectează un clip pentru a edita shot-urile individual.' : 'Generate or select a clip to edit shots individually.'}</p></div>`;
    return;
  }
  panel.innerHTML = `
    <strong>${state.lang === 'ro' ? 'Shot Inspector' : 'Shot Inspector'}</strong>
    <div class="pill-row">
      <span class="pill">#${index + 1}</span>
      <span class="pill">${escapeHtml(shot.time || '')}</span>
      <span class="pill">${shot.locked ? '🔒 locked' : '🔓 unlocked'}</span>
      <span class="pill">${shot.favorite ? '★ favorite' : '☆ normal'}</span>
    </div>
    <div class="grid-2">
      <div class="field">
        <label>${state.lang === 'ro' ? 'Action' : 'Action'}</label>
        <textarea id="shotInspectorAction">${escapeHtml(shot.action || '')}</textarea>
      </div>
      <div class="field">
        <label>${state.lang === 'ro' ? 'Purpose' : 'Purpose'}</label>
        <textarea id="shotInspectorPurpose">${escapeHtml(shot.purpose || '')}</textarea>
      </div>
      <div class="field">
        <label>${state.lang === 'ro' ? 'Selector hint' : 'Selector hint'}</label>
        <input id="shotInspectorSelector" type="text" value="${escapeHtml(shot.selectorHint || '')}" />
      </div>
      <div class="field">
        <label>${state.lang === 'ro' ? 'Notes' : 'Notes'}</label>
        <textarea id="shotInspectorNotes">${escapeHtml(shot.notes || '')}</textarea>
      </div>
    </div>
    <div class="actions">
      <button class="btn btn-secondary" id="shotInspectorSaveBtn" type="button">${state.lang === 'ro' ? 'Salvează shot' : 'Save shot'}</button>
      <button class="btn btn-secondary" id="shotInspectorLockBtn" type="button">${shot.locked ? (state.lang === 'ro' ? 'Deblochează' : 'Unlock') : (state.lang === 'ro' ? 'Blochează' : 'Lock')}</button>
      <button class="btn btn-secondary" id="shotInspectorFavoriteBtn" type="button">${shot.favorite ? (state.lang === 'ro' ? 'Scoate favorit' : 'Unfavorite') : (state.lang === 'ro' ? 'Marchează favorit' : 'Favorite')}</button>
      <button class="btn btn-secondary" id="shotInspectorRegenerateBtn" type="button">${state.lang === 'ro' ? 'Regenerate selected shot' : 'Regenerate selected shot'}</button>
    </div>
  `;

  document.getElementById('shotInspectorSaveBtn')?.addEventListener('click', ()=>{
    saveShotInspectorMutationAddon((shots)=>{
      shots[index] = {
        ...shots[index],
        action: document.getElementById('shotInspectorAction')?.value || shots[index].action,
        purpose: document.getElementById('shotInspectorPurpose')?.value || shots[index].purpose,
        selectorHint: document.getElementById('shotInspectorSelector')?.value || shots[index].selectorHint,
        notes: document.getElementById('shotInspectorNotes')?.value || ''
      };
    });
    toast(state.lang === 'ro' ? 'Shot salvat.' : 'Shot saved.', 'ok');
  });

  document.getElementById('shotInspectorLockBtn')?.addEventListener('click', ()=>{
    saveShotInspectorMutationAddon((shots)=>{
      shots[index] = { ...shots[index], locked: !shots[index].locked };
    });
  });

  document.getElementById('shotInspectorFavoriteBtn')?.addEventListener('click', ()=>{
    saveShotInspectorMutationAddon((shots)=>{
      shots[index] = { ...shots[index], favorite: !shots[index].favorite };
    });
  });

  document.getElementById('shotInspectorRegenerateBtn')?.addEventListener('click', ()=>{
    if(shot.locked){
      toast(state.lang === 'ro' ? 'Shot-ul este blocat.' : 'Shot is locked.', 'err');
      return;
    }
    regenerateSelectedShotAddon();
  });
}

if(typeof renderTimelineEditorAddon === 'function'){
  const __origRenderTimelineEditorShotInspectorAddon = renderTimelineEditorAddon;
  renderTimelineEditorAddon = function(){
    __origRenderTimelineEditorShotInspectorAddon();
    renderShotInspectorAddon();
  };
}

if(typeof renderSelectedClip === 'function'){
  const __origRenderSelectedClipShotInspectorAddon = renderSelectedClip;
  renderSelectedClip = function(){
    __origRenderSelectedClipShotInspectorAddon();
    renderShotInspectorAddon();
  };
}
