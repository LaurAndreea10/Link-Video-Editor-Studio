const getActiveStyleProfile=()=>({
  key: state.demoStyle,
  name: getDemoStyle().name?.[state.lang] || getDemoStyle().name?.en || state.demoStyle,
  tone: getDemoStyle().tone?.[state.lang] || getDemoStyle().tone?.en || '',
  hook: getDemoStyle().hook?.[state.lang] || getDemoStyle().hook?.en || '',
  format: getDemoStyle().format || '16:9',
  shortFormat: getDemoStyle().shortFormat || getDemoStyle().format || '16:9'
});

function buildStyleAwareExportPayloadAddon(clip, config) {
  const style = getActiveStyleProfile();
  return {
    clip: {
      ...clip,
      demoStyleProfile: style,
    },
    config,
    styleRecommendations: {
      hook: style.hook,
      tone: style.tone,
      recommendedFormat: clip.recommendedFormat || style.format,
      shortFormat: style.shortFormat,
    },
    shorts: clip.shorts || [],
    translations: clip.translations || [],
    keyframes: clip.keyframes || [],
    generatedAt: new Date().toISOString(),
  };
}

if (typeof generateExport === 'function') {
  const __origGenerateExportAddon = generateExport;
  generateExport = function(clip, config) {
    const base = __origGenerateExportAddon(clip, config);
    const payload = buildStyleAwareExportPayloadAddon(clip, config);
    return [
      base,
      '',
      '# STYLE-AWARE EXPORT PAYLOAD',
      JSON.stringify(payload, null, 2)
    ].join('\n');
  };
}

if (typeof generateDescriptions === 'function') {
  const __origGenerateDescriptionsAddon = generateDescriptions;
  generateDescriptions = function(clip) {
    const base = __origGenerateDescriptionsAddon(clip);
    const style = getActiveStyleProfile();
    const extra = state.lang === 'ro'
      ? `5) Stil & format\nStil: ${clip.demoStyleLabel || style.name}\nTon: ${clip.styleTone || style.tone}\nFormat recomandat: ${clip.recommendedFormat || style.format}\nFormat shorts: ${style.shortFormat}`
      : `5) Style & format\nStyle: ${clip.demoStyleLabel || style.name}\nTone: ${clip.styleTone || style.tone}\nRecommended format: ${clip.recommendedFormat || style.format}\nShorts format: ${style.shortFormat}`;
    return [base, extra].join('\n\n');
  };
}

if (typeof createAutomationPack === 'function') {
  createAutomationPack = async function() {
    const clip = getSelectedClip();
    if (!clip) {
      toast(t('noClip'), 'err');
      return;
    }
    const config = formatConfig();
    const payload = buildStyleAwareExportPayloadAddon(clip, config);
    const zip = new JSZip();
    zip.file('plan.json', JSON.stringify(payload, null, 2));
    zip.file('shorts.json', JSON.stringify({
      style: payload.styleRecommendations,
      shorts: clip.shorts || []
    }, null, 2));
    zip.file('translations.json', JSON.stringify({
      style: payload.styleRecommendations,
      translations: clip.translations || []
    }, null, 2));
    zip.file('README.md', [
      `# ${clip.shortTitle} Automation Pack`,
      '',
      `Style: ${payload.clip.demoStyleProfile.name}`,
      `Tone: ${payload.clip.demoStyleProfile.tone}`,
      `Recommended format: ${payload.styleRecommendations.recommendedFormat}`,
      `Shorts format: ${payload.styleRecommendations.shortFormat}`,
      '',
      'Included files:',
      '- plan.json',
      '- shorts.json',
      '- translations.json'
    ].join('\n'));
    zip.file('runner.mjs', "import fs from 'fs';\nconst plan = JSON.parse(fs.readFileSync('./plan.json','utf8'));\nconsole.log(plan.clip?.title || plan);\n");
    const blob = await zip.generateAsync({ type: 'blob' });
    downloadFile(`${slugify(clip.shortTitle)}-automation-pack.zip`, blob, 'application/zip');
    toast(t('automationDownloaded'), 'ok');
  };
}
