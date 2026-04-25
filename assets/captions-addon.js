function getCaptionStyleProfileAddon(){
  const style = typeof getDemoStyle === 'function' ? getDemoStyle() : null;
  return {
    styleName: style?.name?.[state.lang] || style?.name?.en || state.demoStyle || 'Style',
    tone: style?.tone?.[state.lang] || style?.tone?.en || '',
    hook: style?.hook?.[state.lang] || style?.hook?.en || '',
    shortFormat: style?.shortFormat || style?.format || '16:9'
  };
}

function buildPlatformCaptionsAddon(clip){
  const style = getCaptionStyleProfileAddon();
  const baseName = clip.shortTitle || 'Product';
  const baseObjective = clip.objective || clip.message || style.tone;
  const translations = Array.isArray(clip.translations) ? clip.translations : [];
  const en = translations.find((t)=>t.lang==='en') || { title: baseName, caption: `${baseName}: ${baseObjective}`, cta: 'Watch the full version.' };
  const ro = translations.find((t)=>t.lang==='ro') || { title: baseName, caption: `${baseName}: ${baseObjective}`, cta: 'Vezi versiunea completă.' };
  const opening = clip.shots?.[0]?.purpose || style.hook || baseObjective;
  return {
    linkedin: {
      title: `${baseName} — ${style.styleName}`,
      body: [
        state.lang==='ro' ? `Am construit un demo ${style.styleName} pentru ${baseName}.` : `Built a ${style.styleName} demo for ${baseName}.`,
        state.lang==='ro' ? `Hook: ${opening}` : `Hook: ${opening}`,
        state.lang==='ro' ? `Format recomandat: ${clip.recommendedFormat || style.shortFormat}` : `Recommended format: ${clip.recommendedFormat || style.shortFormat}`,
        '',
        en.caption,
        en.cta
      ].join('\n')
    },
    instagram: {
      title: `${baseName} / ${style.styleName}`,
      body: [
        `${baseName} ✦ ${style.styleName}`,
        state.lang==='ro' ? `Un reel despre ${baseObjective}.` : `A reel about ${baseObjective}.`,
        en.cta,
        '#saas #productdemo #ux #buildinpublic'
      ].join('\n')
    },
    tiktok: {
      title: `${baseName} quick demo`,
      body: [
        state.lang==='ro' ? `POV: găsești un produs care chiar are flow.` : `POV: you found a product that actually flows.`,
        opening,
        en.cta,
        '#demo #saas #startup #product'
      ].join('\n')
    },
    x: {
      title: `${baseName}`,
      body: `${baseName} — ${opening} · ${style.styleName}. ${en.cta}`
    },
    bilingual: {
      title: `${ro.title} / ${en.title}`,
      body: `${ro.caption}\n${ro.cta}\n\n${en.caption}\n${en.cta}`
    }
  };
}

function secondsToSrtTimeAddon(total){
  const ms = Math.max(0, Math.round(total * 1000));
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const millis = ms % 1000;
  return `${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')},${String(millis).padStart(3,'0')}`;
}

function parseTimecodeRangeAddon(range){
  const [startRaw,endRaw] = String(range || '00:00 – 00:03').split('–').map((x)=>x.trim());
  const parsePart = (part)=>{
    const items = part.split(':').map(Number);
    if(items.length===2) return items[0]*60 + items[1];
    if(items.length===3) return items[0]*3600 + items[1]*60 + items[2];
    return 0;
  };
  return { start: parsePart(startRaw), end: parsePart(endRaw) };
}

function buildSrtFromClipAddon(clip, lang){
  const translations = Array.isArray(clip.translations) ? clip.translations : [];
  const tr = translations.find((t)=>t.lang===lang) || translations[0] || { caption: clip.message || clip.objective || clip.shortTitle || 'Demo', cta: '' };
  const shots = Array.isArray(clip.shots) ? clip.shots : [];
  if(!shots.length){
    return `1\n00:00:00,000 --> 00:00:04,000\n${tr.caption}${tr.cta ? `\n${tr.cta}` : ''}`;
  }
  return shots.map((shot,index)=>{
    const { start, end } = parseTimecodeRangeAddon(shot.time);
    const text = index===0
      ? `${tr.caption}`
      : index===shots.length-1 && tr.cta
        ? `${shot.purpose}\n${tr.cta}`
        : `${shot.purpose}`;
    return [
      String(index+1),
      `${secondsToSrtTimeAddon(start)} --> ${secondsToSrtTimeAddon(end)}`,
      text
    ].join('\n');
  }).join('\n\n');
}

function buildCaptionExportPayloadAddon(clip){
  const platforms = buildPlatformCaptionsAddon(clip);
  const translations = Array.isArray(clip.translations) ? clip.translations : [];
  const srt = Object.fromEntries((translations.length ? translations : [{lang:'en'}]).map((tr)=>[tr.lang, buildSrtFromClipAddon(clip, tr.lang)]));
  return { platforms, srt };
}

function ensureTranslationActionsAddon(){
  const wrap = document.getElementById('view-translations');
  const stack = document.getElementById('translations');
  if(!wrap || !stack) return;
  let bar = document.getElementById('translationActionBar');
  if(!bar){
    bar = document.createElement('div');
    bar.id = 'translationActionBar';
    bar.className = 'actions';
    bar.style.marginBottom = '12px';
    bar.innerHTML = `
      <button class="btn btn-secondary" id="downloadCaptionsJsonBtn" type="button">Download captions JSON</button>
      <button class="btn btn-secondary" id="downloadSrtEnBtn" type="button">Download SRT EN</button>
      <button class="btn btn-secondary" id="downloadSrtRoBtn" type="button">Download SRT RO</button>
    `;
    wrap.insertBefore(bar, stack);
    document.getElementById('downloadCaptionsJsonBtn').addEventListener('click', ()=>{
      const clip = getSelectedClip();
      if(!clip){ toast(t('noClip'),'err'); return; }
      downloadFile(`${slugify(clip.shortTitle)}-captions.json`, JSON.stringify(buildCaptionExportPayloadAddon(clip), null, 2), 'application/json;charset=utf-8');
      toast(state.lang==='ro' ? 'Captions JSON descărcat.' : 'Captions JSON downloaded.', 'ok');
    });
    document.getElementById('downloadSrtEnBtn').addEventListener('click', ()=>{
      const clip = getSelectedClip();
      if(!clip){ toast(t('noClip'),'err'); return; }
      downloadFile(`${slugify(clip.shortTitle)}-en.srt`, buildSrtFromClipAddon(clip, 'en'), 'application/x-subrip;charset=utf-8');
      toast('SRT EN downloaded.', 'ok');
    });
    document.getElementById('downloadSrtRoBtn').addEventListener('click', ()=>{
      const clip = getSelectedClip();
      if(!clip){ toast(t('noClip'),'err'); return; }
      downloadFile(`${slugify(clip.shortTitle)}-ro.srt`, buildSrtFromClipAddon(clip, 'ro'), 'application/x-subrip;charset=utf-8');
      toast(state.lang==='ro' ? 'SRT RO descărcat.' : 'SRT RO downloaded.', 'ok');
    });
  }
}

if (typeof renderTranslations === 'function') {
  const __origRenderTranslationsAddon = renderTranslations;
  renderTranslations = function(clip) {
    __origRenderTranslationsAddon(clip);
    ensureTranslationActionsAddon();
    const stack = document.getElementById('translations');
    if(!stack || !clip) return;
    const payload = buildCaptionExportPayloadAddon(clip);
    const platformCards = Object.entries(payload.platforms).map(([platform, data])=>`<article class="translation-card"><strong>${platform.toUpperCase()}</strong><div class="output-box">Title: ${escapeHtml(data.title)}\n\n${escapeHtml(data.body)}</div></article>`).join('');
    stack.insertAdjacentHTML('beforeend', platformCards);
  };
}

if (typeof generateExport === 'function') {
  const __origGenerateExportCaptionsAddon = generateExport;
  generateExport = function(clip, config) {
    const base = __origGenerateExportCaptionsAddon(clip, config);
    return [
      base,
      '',
      '# CAPTIONS & SUBTITLES',
      JSON.stringify(buildCaptionExportPayloadAddon(clip), null, 2)
    ].join('\n\n');
  };
}

if (typeof createAutomationPack === 'function') {
  const __origCreateAutomationPackCaptionsAddon = createAutomationPack;
  createAutomationPack = async function() {
    const clip = getSelectedClip();
    if(!clip){ toast(t('noClip'),'err'); return; }
    const config = formatConfig();
    const exportPayload = typeof buildStyleAwareExportPayloadAddon === 'function'
      ? buildStyleAwareExportPayloadAddon(clip, config)
      : { clip, config };
    const captionsPayload = buildCaptionExportPayloadAddon(clip);
    const zip = new JSZip();
    zip.file('plan.json', JSON.stringify(exportPayload, null, 2));
    zip.file('captions.json', JSON.stringify(captionsPayload, null, 2));
    Object.entries(captionsPayload.srt).forEach(([lang, srt])=>{
      zip.file(`${lang}.srt`, srt);
    });
    zip.file('README.md', [
      `# ${clip.shortTitle} Automation Pack`,
      '',
      'Included files:',
      '- plan.json',
      '- captions.json',
      ...Object.keys(captionsPayload.srt).map((lang)=>`- ${lang}.srt`)
    ].join('\n'));
    zip.file('runner.mjs', "import fs from 'fs';\nconst plan = JSON.parse(fs.readFileSync('./plan.json','utf8'));\nconst captions = JSON.parse(fs.readFileSync('./captions.json','utf8'));\nconsole.log(plan.clip?.title || plan);\nconsole.log(Object.keys(captions.platforms || {}));\n");
    const blob = await zip.generateAsync({ type: 'blob' });
    downloadFile(`${slugify(clip.shortTitle)}-automation-pack.zip`, blob, 'application/zip');
    toast(t('automationDownloaded'), 'ok');
  };
}
