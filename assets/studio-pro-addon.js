state.timelineEditor = state.timelineEditor || { selectedShotIndex: 0, multiSelected: [] };

function studioSelectedIndexes(){
  const arr = Array.isArray(state.timelineEditor.multiSelected) ? state.timelineEditor.multiSelected : [];
  return [...new Set(arr)].sort((a,b)=>a-b);
}
function studioSetSelectedIndexes(indexes){
  state.timelineEditor.multiSelected = [...new Set((indexes||[]).filter((x)=>Number.isInteger(x) && x >= 0))].sort((a,b)=>a-b);
}
function studioGetClip(){ return typeof getSelectedClip === 'function' ? getSelectedClip() : null; }
function studioGetShot(index){ const clip = studioGetClip(); return clip?.shots?.[index] || null; }
function studioSyncSelection(){
  const clip = studioGetClip();
  if(!clip?.shots?.length){ studioSetSelectedIndexes([]); state.timelineEditor.selectedShotIndex = 0; return; }
  const idx = Math.max(0, Math.min(state.timelineEditor.selectedShotIndex || 0, clip.shots.length - 1));
  state.timelineEditor.selectedShotIndex = idx;
  const sel = studioSelectedIndexes().filter((i)=>i < clip.shots.length);
  studioSetSelectedIndexes(sel.length ? sel : [idx]);
}
function studioWrapLayout(){
  const workbench = document.querySelector('.workbench');
  if(!workbench) return;
  workbench.classList.add('studio-pro-grid');
  if(!document.getElementById('studioInspectorColumn')){
    const pane = document.createElement('section');
    pane.className = 'panel pane studio-pro-right';
    pane.id = 'studioInspectorColumn';
    pane.innerHTML = '<div id="studioInspectorMount" class="studio-stack"></div>';
    workbench.appendChild(pane);
  }
}
function studioEnsureTabs(){
  const tabs = document.querySelector('.pane .tabs:last-child');
  if(!tabs) return;
  if(!tabs.querySelector('[data-view="export-center"]')){
    const btn = document.createElement('button');
    btn.className = 'tab';
    btn.dataset.view = 'export-center';
    btn.textContent = state.lang === 'ro' ? 'Export Center' : 'Export Center';
    tabs.appendChild(btn);
  }
}
function studioEnsureViews(){
  studioEnsureTabs();
  const exportView = document.getElementById('view-export');
  if(exportView && !document.getElementById('view-export-center')){
    const block = document.createElement('div');
    block.id = 'view-export-center';
    block.className = 'view-block hidden';
    block.innerHTML = '<div class="export-center-grid" id="exportCenterGrid"></div>';
    exportView.insertAdjacentElement('afterend', block);
  }
}
function studioDurations(clip){
  return (clip?.shots || []).map((shot)=>{
    if(Number.isFinite(shot?.timingOverride) && shot.timingOverride > 0) return Math.max(2, Number(shot.timingOverride));
    const parts = String(shot?.time || '00:00 – 00:04').split('–').map((x)=>x.trim());
    const parse = (s)=>{ const p=s.split(':').map(Number); return p.length===2? p[0]*60+p[1] : 0; };
    const start=parse(parts[0]||'00:00'), end=parse(parts[1]||'00:04');
    return Math.max(2, end-start || 4);
  });
}
function studioRetiming(clip){
  if(!clip?.shots?.length) return;
  const durations = studioDurations(clip);
  const total = Math.max(clip.duration || durations.reduce((a,b)=>a+b,0), 2 * durations.length);
  const current = durations.reduce((a,b)=>a+b,0) || 1;
  let scaled = durations.map((d)=>Math.max(2, Math.round(d * total / current)));
  let diff = total - scaled.reduce((a,b)=>a+b,0);
  scaled[scaled.length - 1] = Math.max(2, scaled[scaled.length - 1] + diff);
  let cursor = 0;
  clip.shots = clip.shots.map((shot, index)=>{
    const start = cursor;
    const end = cursor + scaled[index];
    cursor = end;
    return { ...shot, time: `${String(Math.floor(start/60)).padStart(2,'0')}:${String(start%60).padStart(2,'0')} – ${String(Math.floor(end/60)).padStart(2,'0')}:${String(end%60).padStart(2,'0')}` };
  });
  if(clip.aiPlanJson) clip.aiPlanJson.shots = clip.shots;
}
function studioMutateShots(mutator){
  const clip = studioGetClip();
  if(!clip?.shots?.length) return;
  const shots = clip.shots.map((s)=>({ ...s }));
  mutator(shots, clip);
  clip.shots = shots;
  studioRetiming(clip);
  if(typeof renderAll === 'function') renderAll();
  if(typeof setActiveView === 'function') setActiveView('timeline');
}
function studioToggleSelection(index, checked){
  const current = studioSelectedIndexes();
  const next = checked ? [...current, index] : current.filter((x)=>x!==index);
  studioSetSelectedIndexes(next);
  if(next.length) state.timelineEditor.selectedShotIndex = next[0];
  studioRenderInspector();
  studioDecorateTimeline();
}
function studioDecorateTimeline(){
  const timeline = document.getElementById('timeline');
  const clip = studioGetClip();
  if(!timeline || !clip?.shots?.length) return;
  const shots = [...timeline.querySelectorAll('.shot')];
  const selected = studioSelectedIndexes();
  shots.forEach((node, index)=>{
    if(!node.parentElement?.classList.contains('timeline-shot-row')){
      const row = document.createElement('div');
      row.className = 'timeline-shot-row';
      const select = document.createElement('div');
      select.className = 'timeline-select';
      select.innerHTML = `<input type="checkbox" data-shot-select="${index}">`;
      node.parentNode.insertBefore(row, node);
      row.appendChild(select);
      row.appendChild(node);
    }
    node.classList.toggle('is-active', index === state.timelineEditor.selectedShotIndex);
    node.classList.toggle('is-selected', selected.includes(index));
    node.draggable = true;
    node.dataset.shotIndex = String(index);
  });
  timeline.querySelectorAll('[data-shot-select]').forEach((el)=>{
    const index = Number(el.getAttribute('data-shot-select'));
    el.checked = selected.includes(index);
    el.onchange = (e)=> studioToggleSelection(index, e.target.checked);
  });
  timeline.querySelectorAll('.shot').forEach((node)=>{
    const index = Number(node.dataset.shotIndex);
    node.onclick = ()=>{ state.timelineEditor.selectedShotIndex = index; studioSetSelectedIndexes([index]); studioRenderInspector(); studioDecorateTimeline(); };
    node.ondragstart = ()=>{ node.classList.add('dragging'); node.dataTransfer?.setData('text/plain', String(index)); };
    node.ondragend = ()=> node.classList.remove('dragging');
    node.ondragover = (e)=> e.preventDefault();
    node.ondrop = (e)=>{
      e.preventDefault();
      const from = Number(e.dataTransfer?.getData('text/plain'));
      const to = index;
      if(Number.isNaN(from) || from === to) return;
      studioMutateShots((shots)=>{
        const [moved] = shots.splice(from,1);
        shots.splice(to,0,moved);
        state.timelineEditor.selectedShotIndex = to;
        studioSetSelectedIndexes([to]);
      });
    };
  });
}
function studioBulkActionsBar(){
  const timeline = document.getElementById('timeline');
  if(!timeline) return;
  document.getElementById('studioBulkActions')?.remove();
  const selected = studioSelectedIndexes();
  if(!selected.length) return;
  const bar = document.createElement('div');
  bar.id = 'studioBulkActions';
  bar.className = 'studio-inspector-card timeline-editor-pro';
  bar.innerHTML = `
    <div class="bulk-actions">
      <button class="btn btn-secondary" id="bulkFavoriteBtn" type="button">${state.lang==='ro'?'Favorite':'Favorite'} (${selected.length})</button>
      <button class="btn btn-secondary" id="bulkLockBtn" type="button">${state.lang==='ro'?'Lock':'Lock'} (${selected.length})</button>
      <button class="btn btn-secondary" id="bulkTagBtn" type="button">${state.lang==='ro'?'Tag':'Tag'} (${selected.length})</button>
      <button class="btn btn-danger" id="bulkDeleteBtn" type="button">${state.lang==='ro'?'Delete':'Delete'} (${selected.length})</button>
    </div>
    <div class="timeline-help">${state.lang==='ro'?'Drag & drop pentru reorder. Checkbox pentru multi-select. Durata se controlează din inspector, per shot.':'Drag & drop to reorder. Use checkboxes for multi-select. Control duration per shot from the inspector.'}</div>
  `;
  timeline.prepend(bar);
  document.getElementById('bulkFavoriteBtn').onclick = ()=> studioMutateShots((shots)=> selected.forEach((i)=> shots[i] = { ...shots[i], favorite: true }));
  document.getElementById('bulkLockBtn').onclick = ()=> studioMutateShots((shots)=> selected.forEach((i)=> shots[i] = { ...shots[i], locked: true }));
  document.getElementById('bulkTagBtn').onclick = ()=>{ const tag = prompt(state.lang==='ro'?'Tag pentru shot-urile selectate:':'Tag for selected shots:','priority'); if(tag==null) return; studioMutateShots((shots)=> selected.forEach((i)=> shots[i] = { ...shots[i], tag })); };
  document.getElementById('bulkDeleteBtn').onclick = ()=> studioMutateShots((shots)=>{ const keep = shots.filter((_,i)=> !selected.includes(i)); shots.splice(0, shots.length, ...keep); studioSetSelectedIndexes([0]); state.timelineEditor.selectedShotIndex = 0; });
}
function studioSplitShot(){
  const idx = state.timelineEditor.selectedShotIndex;
  studioMutateShots((shots)=>{
    const shot = shots[idx]; if(!shot) return;
    const first = { ...shot, action: `${shot.action} · A`, notes: (shot.notes||'') + ' | split A' };
    const second = { ...shot, action: `${shot.action} · B`, notes: (shot.notes||'') + ' | split B' };
    const override = Math.max(2, Math.round((Number(shot.timingOverride)||4)/2));
    first.timingOverride = override; second.timingOverride = override;
    shots.splice(idx,1,first,second);
    studioSetSelectedIndexes([idx, idx+1]);
  });
}
function studioMergeShots(){
  const selected = studioSelectedIndexes();
  if(selected.length < 2) return;
  studioMutateShots((shots)=>{
    const parts = selected.map((i)=> shots[i]).filter(Boolean);
    const merged = {
      ...parts[0],
      action: parts.map((s)=>s.action).join(' → '),
      purpose: parts.map((s)=>s.purpose).join(' · '),
      notes: parts.map((s)=>s.notes).filter(Boolean).join(' | '),
      timingOverride: parts.reduce((sum,s)=> sum + Math.max(2, Number(s.timingOverride)||4), 0)
    };
    const start = selected[0];
    const remaining = shots.filter((_,i)=> !selected.includes(i));
    remaining.splice(start,0,merged);
    shots.splice(0, shots.length, ...remaining);
    studioSetSelectedIndexes([start]); state.timelineEditor.selectedShotIndex = start;
  });
}
function studioRegenerateSelected(){
  const clip = studioGetClip();
  const idx = state.timelineEditor.selectedShotIndex;
  const shot = clip?.shots?.[idx];
  if(!shot) return;
  if(shot.locked){ toast(state.lang==='ro'?'Shot-ul este blocat.':'Shot is locked.','err'); return; }
  const hookPool = clip.hookVariants?.length ? clip.hookVariants : [clip.message, clip.objective, clip.aiSummary].filter(Boolean);
  const nextHook = hookPool[idx % Math.max(1, hookPool.length)] || clip.message || 'Readable product hook';
  studioMutateShots((shots)=>{
    shots[idx] = {
      ...shots[idx],
      action: `${state.lang==='ro'?'Arată un nou unghi vizual și o micro-interacțiune lizibilă.':'Show a new visual angle and one readable micro-interaction.'} ${nextHook}`,
      purpose: state.lang==='ro' ? 'Shot regenerat local pentru varietate și claritate.' : 'Shot locally regenerated for variety and clarity.',
      selectorHint: shots[idx].selectorHint || 'main, .panel, .card',
      notes: state.lang==='ro' ? 'Regenerat din studio mode.' : 'Regenerated from studio mode.'
    };
  });
}
function studioRenderInspector(){
  studioWrapLayout(); studioEnsureViews(); studioSyncSelection();
  const mount = document.getElementById('studioInspectorMount');
  const clip = studioGetClip();
  if(!mount) return;
  if(!clip?.shots?.length){
    mount.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🎛️</div><h4>${state.lang==='ro'?'Inspector indisponibil':'Inspector unavailable'}</h4><p>${state.lang==='ro'?'Generează un clip pentru a activa studio mode.':'Generate a clip to activate studio mode.'}</p></div>`;
    return;
  }
  const idx = state.timelineEditor.selectedShotIndex;
  const shot = clip.shots[idx];
  mount.innerHTML = `
    <div class="studio-inspector-card">
      <h4>${state.lang==='ro'?'Shot Inspector Pro':'Shot Inspector Pro'}</h4>
      <div class="inspector-meta">
        <span class="pill">#${idx+1}</span>
        <span class="pill">${escapeHtml(shot.time||'')}</span>
        <span class="pill">${shot.locked?'🔒':'🔓'}</span>
        <span class="pill">${shot.favorite?'★':'☆'}</span>
        <span class="pill">${escapeHtml(shot.tag||'untagged')}</span>
      </div>
      <div class="inspector-grid">
        <div class="field"><label>Action</label><textarea id="proShotAction">${escapeHtml(shot.action||'')}</textarea></div>
        <div class="field"><label>Purpose</label><textarea id="proShotPurpose">${escapeHtml(shot.purpose||'')}</textarea></div>
        <div class="field"><label>Selector</label><input id="proShotSelector" type="text" value="${escapeHtml(shot.selectorHint||'')}" /></div>
        <div class="field"><label>Notes</label><textarea id="proShotNotes">${escapeHtml(shot.notes||'')}</textarea></div>
        <div class="timing-grid">
          <div class="field"><label>${state.lang==='ro'?'Timing override (sec)':'Timing override (sec)'}</label><input id="proShotTiming" type="number" min="2" value="${escapeHtml(String(shot.timingOverride||''))}" /></div>
          <div class="field"><label>${state.lang==='ro'?'Tag':'Tag'}</label><input id="proShotTag" type="text" value="${escapeHtml(shot.tag||'')}" /></div>
        </div>
      </div>
      <div class="actions">
        <button class="btn btn-secondary" id="proShotSaveBtn" type="button">${state.lang==='ro'?'Save':'Save'}</button>
        <button class="btn btn-secondary" id="proShotLockBtn" type="button">${shot.locked?(state.lang==='ro'?'Unlock':'Unlock'):(state.lang==='ro'?'Lock':'Lock')}</button>
        <button class="btn btn-secondary" id="proShotFavBtn" type="button">${shot.favorite?(state.lang==='ro'?'Unfavorite':'Unfavorite'):(state.lang==='ro'?'Favorite':'Favorite')}</button>
        <button class="btn btn-secondary" id="proShotDuplicateBtn" type="button">${state.lang==='ro'?'Duplicate':'Duplicate'}</button>
        <button class="btn btn-secondary" id="proShotSplitBtn" type="button">${state.lang==='ro'?'Split':'Split'}</button>
        <button class="btn btn-secondary" id="proShotMergeBtn" type="button">${state.lang==='ro'?'Merge':'Merge'}</button>
        <button class="btn btn-secondary" id="proShotRegenBtn" type="button">${state.lang==='ro'?'Regenerate':'Regenerate'}</button>
      </div>
    </div>
    <div class="studio-inspector-card">
      <h4>${state.lang==='ro'?'AI Variants':'AI Variants'}</h4>
      <div class="hook-variants">${(clip.hookVariants||[]).map((v,i)=>`<div class="variant-card"><strong>Hook ${i+1}</strong>${escapeHtml(v)}</div>`).join('') || `<div class="variant-card">${escapeHtml(clip.message||'')}</div>`}</div>
      <div class="cta-variants">${(clip.ctaVariants||[]).map((v,i)=>`<div class="variant-card"><strong>CTA ${i+1}</strong>${escapeHtml(v)}</div>`).join('') || `<div class="variant-card">${escapeHtml((clip.translations||[])[0]?.cta || 'Watch the full version.')}</div>`}</div>
    </div>
    <div class="sticky-note">${state.lang==='ro'?'Studio mode: 3 coloane active, drag & drop în timeline, inspector sticky, export center dedicat.':'Studio mode: 3 active columns, drag & drop timeline, sticky inspector, dedicated export center.'}</div>
  `;
  document.getElementById('proShotSaveBtn').onclick = ()=> studioMutateShots((shots)=>{
    shots[idx] = { ...shots[idx], action: document.getElementById('proShotAction').value, purpose: document.getElementById('proShotPurpose').value, selectorHint: document.getElementById('proShotSelector').value, notes: document.getElementById('proShotNotes').value, tag: document.getElementById('proShotTag').value, timingOverride: Number(document.getElementById('proShotTiming').value) || undefined };
  });
  document.getElementById('proShotLockBtn').onclick = ()=> studioMutateShots((shots)=> shots[idx] = { ...shots[idx], locked: !shots[idx].locked });
  document.getElementById('proShotFavBtn').onclick = ()=> studioMutateShots((shots)=> shots[idx] = { ...shots[idx], favorite: !shots[idx].favorite });
  document.getElementById('proShotDuplicateBtn').onclick = ()=> studioMutateShots((shots)=>{ shots.splice(idx+1,0,{ ...shots[idx], notes: `${shots[idx].notes||''} | duplicated` }); state.timelineEditor.selectedShotIndex = idx+1; studioSetSelectedIndexes([idx+1]); });
  document.getElementById('proShotSplitBtn').onclick = ()=> studioSplitShot();
  document.getElementById('proShotMergeBtn').onclick = ()=> studioMergeShots();
  document.getElementById('proShotRegenBtn').onclick = ()=> studioRegenerateSelected();
}
function studioPackageBuilder(type, clip){
  const captionsPayload = typeof buildCaptionExportPayloadAddon === 'function' ? buildCaptionExportPayloadAddon(clip) : null;
  const plan = clip.aiPlanJson || { clip };
  const payload = {
    platform: type,
    plan,
    shorts: clip.shortVariants || clip.shorts || [],
    keyframes: clip.keyframes || [],
    captions: captionsPayload,
    reports: { summary: clip.aiSummary || clip.message || '', voiceover: clip.aiVoiceover || '' }
  };
  return payload;
}
async function studioDownloadPackage(type){
  const clip = studioGetClip();
  if(!clip){ toast(t('noClip'),'err'); return; }
  const zip = new JSZip();
  const slug = slugify(clip.shortTitle || clip.title || 'package');
  const pkg = studioPackageBuilder(type, clip);
  zip.file(`plans/${slug}.${type}.plan.json`, JSON.stringify(pkg.plan, null, 2));
  zip.file(`shorts/${slug}.${type}.shorts.json`, JSON.stringify(pkg.shorts, null, 2));
  zip.file(`keyframes/${slug}.${type}.keyframes.json`, JSON.stringify(pkg.keyframes, null, 2));
  if(pkg.captions){
    zip.file(`captions/${slug}.${type}.captions.json`, JSON.stringify(pkg.captions, null, 2));
    Object.entries(pkg.captions.srt || {}).forEach(([lang,srt])=> zip.file(`captions/${lang}/${slug}.${type}.${lang}.srt`, srt));
  }
  zip.file(`reports/${slug}.${type}.summary.txt`, clip.aiSummary || clip.message || '');
  zip.file(`reports/${slug}.${type}.voiceover.txt`, clip.aiVoiceover || '');
  const blob = await zip.generateAsync({ type:'blob' });
  downloadFile(`${slug}-${type}-export.zip`, blob, 'application/zip');
  toast((state.lang==='ro'?'Pachet export descărcat: ':'Export package downloaded: ')+type, 'ok');
}
function studioRenderExportCenter(){
  studioEnsureViews();
  const grid = document.getElementById('exportCenterGrid');
  const clip = studioGetClip();
  if(!grid) return;
  if(!clip){
    grid.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📦</div><h4>${state.lang==='ro'?'Export Center indisponibil':'Export Center unavailable'}</h4><p>${state.lang==='ro'?'Generează un clip pentru pachete dedicate LinkedIn, Instagram, TikTok și portfolio.':'Generate a clip for dedicated LinkedIn, Instagram, TikTok and portfolio packages.'}</p></div>`;
    return;
  }
  const packs = [
    { key:'linkedin', icon:'💼', label:'LinkedIn', note:'16:9 / recruiter-ready' },
    { key:'instagram', icon:'📸', label:'Instagram', note:'9:16 / social reel' },
    { key:'tiktok', icon:'🎵', label:'TikTok', note:'9:16 / fast hook' },
    { key:'portfolio', icon:'🧩', label: state.lang==='ro'?'Portfolio':'Portfolio', note:'report + assets' }
  ];
  grid.innerHTML = packs.map((pack)=>`<article class="export-pack-card"><div class="pill-row"><span class="pill">${pack.icon}</span><span class="pill">${pack.note}</span></div><strong>${pack.label}</strong><p class="hint">${state.lang==='ro'?'Pachet ZIP structurat pe plans / captions / shorts / keyframes / reports.':'Structured ZIP package with plans / captions / shorts / keyframes / reports.'}</p><button class="btn btn-secondary" data-export-pack="${pack.key}" type="button">${state.lang==='ro'?'Descarcă pachet':'Download package'}</button></article>`).join('');
  grid.querySelectorAll('[data-export-pack]').forEach((btn)=> btn.onclick = ()=> studioDownloadPackage(btn.dataset.exportPack));
}
function studioSourcePrompt(mode, inputs){
  const common = `Product: ${inputs.productName||'Untitled'}\nObjective: ${inputs.objective||'Premium demo'}\nDuration: ${inputs.duration}s\nStyle: ${state.demoStyle||'SaaS Clean'}\nNeed: 3 hook variants, 3 short variants, CTA variants per platform.`;
  if(mode === 'page') return `Build a page-driven product demo plan. Focus on UI hierarchy, hover, detail panels, and flow transitions.\n${common}`;
  if(mode === 'video-url') return `Build a demo plan from an existing video link. Focus on strong segment selection, captions, key moments, and reframing into shorts.\n${common}`;
  return `Build a demo plan from an uploaded video. Focus on frame selection, chaptering, keyframes, hooks, short-form recuts, and captions.\n${common}`;
}
if(typeof generateRealWorkspace === 'function'){
  const __origGenerateRealWorkspaceStudio = generateRealWorkspace;
  generateRealWorkspace = async function(inputs){
    try {
      const plan = await __origGenerateRealWorkspaceStudio(inputs);
      const hooks = [
        state.lang==='ro' ? `Hook 1: ${inputs.productName||'Produsul'} livrează claritate instant.` : `Hook 1: ${inputs.productName||'The product'} delivers instant clarity.`,
        state.lang==='ro' ? `Hook 2: Un singur flow, fără fragmentare.` : 'Hook 2: One continuous flow, no fragmentation.',
        state.lang==='ro' ? `Hook 3: Payoff vizual în primele secunde.` : 'Hook 3: Visual payoff in the first seconds.'
      ];
      const ctas = {
        linkedin:[state.lang==='ro'?'Vezi demo-ul complet pentru context și execuție.':'Watch the full demo for context and execution.', state.lang==='ro'?'Ideal pentru recruteri și parteneri.':'Ideal for recruiters and partners.'],
        instagram:[state.lang==='ro'?'Swipe pentru varianta completă.':'Open the full version.', state.lang==='ro'?'Mai mult în demo-ul complet.':'More in the full demo.'],
        tiktok:[state.lang==='ro'?'Partea full e în profil / repo.':'Full version in profile / repo.', state.lang==='ro'?'Vezi flow-ul complet.':'Watch the full flow.'],
        portfolio:[state.lang==='ro'?'Deschide studiul de caz complet.':'Open the full case study.', state.lang==='ro'?'Vezi breakdown-ul complet.':'See the full breakdown.']
      };
      const shorts = Array.from({length:3}, (_,i)=>({ title:`Variant ${i+1}`, angle:[state.sourceMode,'hook','payoff'][i] || 'hook', script: studioSourcePrompt(state.sourceMode, inputs) }));
      return { ...plan, promptMode: state.sourceMode, hookVariants: hooks, ctaVariants: ctas, shortVariants: shorts };
    } catch (error) {
      throw error;
    }
  };
}
if(typeof generateMockWorkspace === 'function'){
  const __origGenerateMockWorkspaceStudio = generateMockWorkspace;
  generateMockWorkspace = function(inputs){
    const plan = __origGenerateMockWorkspaceStudio(inputs);
    return { ...plan,
      promptMode: state.sourceMode,
      hookVariants:[
        state.lang==='ro'?'Hook 1: claritate imediată.':'Hook 1: immediate clarity.',
        state.lang==='ro'?'Hook 2: profunzime fără zgomot.':'Hook 2: depth without noise.',
        state.lang==='ro'?'Hook 3: payoff vizual controlat.':'Hook 3: controlled visual payoff.'
      ],
      ctaVariants:{
        linkedin:[state.lang==='ro'?'Vezi varianta completă pentru context.':'Watch the full version for context.'],
        instagram:[state.lang==='ro'?'Intră pe varianta completă.':'Open the full version.'],
        tiktok:[state.lang==='ro'?'Vezi tot flow-ul în demo-ul complet.':'See the full flow in the full demo.'],
        portfolio:[state.lang==='ro'?'Deschide studiul de caz.':'Open the case study.']
      },
      shortVariants:[
        { title:'Hook-first', angle:'hook' },
        { title:'Benefit-first', angle:'benefit' },
        { title:'Payoff-first', angle:'payoff' }
      ]
    };
  };
}
if(typeof buildClipFromPlan === 'function'){
  const __origBuildClipFromPlanStudio = buildClipFromPlan;
  buildClipFromPlan = function(plan, inputs){
    const clip = __origBuildClipFromPlanStudio(plan, inputs);
    clip.hookVariants = plan.hookVariants || [];
    clip.ctaVariants = plan.ctaVariants || {};
    clip.shortVariants = plan.shortVariants || clip.shorts || [];
    clip.promptMode = plan.promptMode || state.sourceMode;
    clip.demoStyleLabel = clip.demoStyleLabel || state.demoStyle || 'SaaS Clean';
    clip.recommendedFormat = ['instagram','tiktok','upload'].includes(state.sourceMode) ? '9:16' : '16:9';
    return clip;
  };
}
if(typeof renderSelectedClip === 'function'){
  const __origRenderSelectedClipStudio = renderSelectedClip;
  renderSelectedClip = function(){
    __origRenderSelectedClipStudio();
    studioWrapLayout(); studioEnsureViews(); studioSyncSelection(); studioRenderInspector(); studioDecorateTimeline(); studioBulkActionsBar();
    if(state.activeView === 'export-center') studioRenderExportCenter();
  };
}
if(typeof setActiveView === 'function'){
  const __origSetActiveViewStudio = setActiveView;
  setActiveView = function(view){
    __origSetActiveViewStudio(view);
    if(view === 'export-center') studioRenderExportCenter();
    if(view === 'timeline'){ studioRenderInspector(); studioDecorateTimeline(); studioBulkActionsBar(); }
  };
}
(function(){
  const init = ()=>{ studioWrapLayout(); studioEnsureViews(); if(state.activeView==='export-center') studioRenderExportCenter(); };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init, { once:true }); else init();
})();