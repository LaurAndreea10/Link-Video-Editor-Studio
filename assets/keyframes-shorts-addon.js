function getNarrativeRoleAddon(index,total){
  if(index===0) return state.lang==='ro' ? 'Hook' : 'Hook';
  if(index===total-1) return state.lang==='ro' ? 'Payoff' : 'Payoff';
  if(index===1) return state.lang==='ro' ? 'Context' : 'Context';
  if(index===total-2) return state.lang==='ro' ? 'Proof' : 'Proof';
  return state.lang==='ro' ? 'Middle beat' : 'Middle beat';
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

if(typeof renderShorts === 'function'){
  const __origRenderShortsAddon = renderShorts;
  renderShorts = function(clip){
    __origRenderShortsAddon(clip);
    ensureShortsActionsAddon();
    const stack = document.getElementById('shorts');
    if(!stack || !clip) return;
    const enriched = enrichShortsAddon(clip);
    stack.innerHTML = enriched.map((item)=>`<article class="short-card"><strong>${escapeHtml(item.title)}</strong><div class="pill-row"><span class="pill">${escapeHtml(item.range)}</span><span class="pill">${escapeHtml(item.format)}</span></div><div class="output-box">Hook: ${escapeHtml(item.hook)}\n\nMiddle: ${escapeHtml(item.middle)}\n\nPayoff: ${escapeHtml(item.payoff)}\n\nText: ${escapeHtml(item.recommendedTextOnScreen)}</div></article>`).join('');
  };
}

if(typeof renderKeyframes === 'function'){
  const __origRenderKeyframesAddon = renderKeyframes;
  renderKeyframes = function(clip){
    __origRenderKeyframesAddon(clip);
    ensureKeyframesActionsAddon();
    const grid = document.getElementById('keyframes');
    if(!grid || !clip) return;
    const enriched = enrichKeyframesAddon(clip);
    grid.innerHTML = enriched.map((frame)=>`<article class="frame-card">${frame.image?`<img src="${frame.image}" alt="frame ${escapeHtml(frame.label||'')}">`:''}<strong>${escapeHtml(frame.label||'')}</strong><div class="pill-row"><span class="pill">${escapeHtml(frame.role)}</span></div><p class="hint">${escapeHtml(frame.narrative || '')}</p><div class="output-box">Overlay: ${escapeHtml(frame.suggestedOverlay || '')}</div></article>`).join('');
  };
}

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
      JSON.stringify(buildKeyframesExportAddon(clip), null, 2)
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
      '- captions.json (if available)',
      '- *.srt (if available)'
    ].join('\n'));
    zip.file('runner.mjs', "import fs from 'fs';\nconst plan = JSON.parse(fs.readFileSync('./plan.json','utf8'));\nconst shorts = JSON.parse(fs.readFileSync('./shorts.json','utf8'));\nconst keyframes = JSON.parse(fs.readFileSync('./keyframes.json','utf8'));\nconsole.log(plan.clip?.title || plan);\nconsole.log(shorts.shorts?.length || 0, keyframes.keyframes?.length || 0);\n");
    const blob = await zip.generateAsync({ type: 'blob' });
    downloadFile(`${slugify(clip.shortTitle)}-automation-pack.zip`, blob, 'application/zip');
    toast(t('automationDownloaded'), 'ok');
  };
}
