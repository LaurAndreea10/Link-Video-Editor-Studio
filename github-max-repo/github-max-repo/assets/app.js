const optionSets = {
  outputMode: ["Simple", "Advanced", "Advanced+"],
  recordingFormat: ["mp4", "mkv", "mov", "flv", "ts", "m3u8"],
  encoder: ["x264", "NVENC (NVIDIA)", "AMF (AMD)", "QuickSync (Intel)", "Apple VT H264"],
  rateControl: ["CRF", "CQP", "CBR", "VBR", "ABR", "Lossless"],
  crf: ["14", "16", "18", "20", "22", "23", "24", "26", "28"],
  keyframeInterval: ["1", "2", "3", "4", "5"],
  preset: ["ultrafast", "superfast", "veryfast", "faster", "fast", "medium", "slow", "slower", "veryslow"],
  profile: ["baseline", "main", "high", "high10", "high422", "high444"],
  tune: ["none", "film", "animation", "grain", "stillimage", "fastdecode", "zerolatency"],
  canvasResolution: ["1920x1080", "1600x900", "1366x768", "1280x720", "1080x1920"],
  outputResolution: ["1280x720", "1920x1080", "1600x900", "854x480", "1080x1920"],
  fps: ["24", "25", "30", "50", "60"],
  audio: ["mute complet (fără audio source)", "desktop audio", "mic only", "desktop + mic"],
  finalFps: ["24", "25", "30"]
};

const defaults = {
  outputMode: "Advanced+",
  recordingFormat: "mp4",
  encoder: "x264",
  rateControl: "CRF",
  crf: "18",
  keyframeInterval: "2",
  preset: "veryfast",
  profile: "high",
  tune: "none",
  canvasResolution: "1920x1080",
  outputResolution: "1280x720",
  fps: "30",
  audio: "mute complet (fără audio source)",
  finalFps: "24"
};

const directionRules = [
  "Niciodată mai mult de 3 acțiuni pe secundă — ochiul nu le prinde.",
  "Pauză 0.5s după fiecare acțiune majoră, ca recruiterul să prindă schimbarea.",
  "Niciodată scroll rapid — 200px pe secundă maxim.",
  "Niciodată nu închide modaluri imediat — stai 1–2s pe ele.",
  "Dacă apare ezitare, refilmezi complet; nu repari prin editare.",
  "Evită dark/light toggle, Settings și Export dacă nu aduc valoare vizuală.",
  "Nu scrie texte lungi în formulare sau generatoare — consumă secunde fără payoff vizual."
];

const storageKey = "link-video-editor-studio:v2";
const state = {
  clips: [],
  selectedClipId: null,
  activeView: "timeline"
};

const $ = (id) => document.getElementById(id);
const preview = $("sitePreview");
const previewNote = $("previewNote");

function escapeHtml(str) {
  const value = String(str == null ? "" : str);
  return value.replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
}

function createId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") return window.crypto.randomUUID();
  return `clip-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function slugify(str) {
  return String(str || "clip").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "clip";
}

function toast(message) {
  previewNote.classList.remove("hidden");
  previewNote.textContent = message;
}

function downloadFile(filename, content, mime) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mime || "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => toast("Conținutul a fost copiat în clipboard.")).catch(() => toast("Nu am putut copia automat."));
}

function populateConfigGrid() {
  const grid = $("configGrid");
  grid.innerHTML = Object.keys(optionSets).map((key) => `
    <div class="field">
      <label for="${key}">${key}</label>
      <select id="${key}"></select>
    </div>
  `).join("");

  Object.keys(optionSets).forEach((key) => {
    const el = $(key);
    el.innerHTML = optionSets[key].map((value) => `<option value="${escapeHtml(value)}" ${value === defaults[key] ? "selected" : ""}>${escapeHtml(value)}</option>`).join("");
    el.addEventListener("change", () => {
      renderSelectedClip();
      persistState();
    });
  });
}

function renderDirectionRules() {
  $("directionRules").innerHTML = directionRules.map((rule) => `<span class="chip">${escapeHtml(rule)}</span>`).join("");
}

function formatConfig() {
  const config = {};
  Object.keys(optionSets).forEach((key) => config[key] = $(key).value);
  return config;
}

function buildGenericPreroll(url) {
  return [
    `Deschide URL-ul ${url || "specificat"}.`,
    "Așteaptă să dispară skeleton-urile, loading state-ul sau animațiile de intrare.",
    "Asigură-te că există date demo vizibile pe primul ecran.",
    "Poziționează-te pe view-ul principal cu elementele cele mai animate sau valoroase în cadru."
  ];
}

function buildGenericShots(title, duration, url) {
  const max = duration || 40;
  const chunk = Math.max(4, Math.floor(max / 8));
  return [
    { time: `00:00 – 00:0${Math.min(chunk, 9)}`, action: "Ține ecranul principal în cadru fără interacțiuni.", purpose: "Prima impresie: claritate și polish vizual." },
    { time: `00:0${Math.min(chunk, 9)} – 00:${String(Math.min(chunk * 2, 59)).padStart(2, "0")}`, action: "Hover pe o componentă relevantă pentru a dezvălui interactivitate.", purpose: "Produsul nu este static." },
    { time: `00:${String(Math.min(chunk * 2, 59)).padStart(2, "0")} – 00:${String(Math.min(chunk * 3, 59)).padStart(2, "0")}`, action: `Pe ${title}, intră în zona principală a produsului pornind de la ${url}.`, purpose: "Arăți structura produsului." },
    { time: `00:${String(Math.min(chunk * 3, 59)).padStart(2, "0")} – 00:${String(Math.min(chunk * 4, 59)).padStart(2, "0")}`, action: "Deschide un detail panel, card sau modal și rămâi 1–2 secunde.", purpose: "Bogăție de informație, fără aglomerație." },
    { time: `00:${String(Math.min(chunk * 4, 59)).padStart(2, "0")} – 00:${String(Math.min(chunk * 5, 59)).padStart(2, "0")}`, action: "Execută o acțiune de bază: schimbare status, drag and drop, save sau navigare asistată.", purpose: "Core workflow." },
    { time: `00:${String(Math.min(chunk * 5, 59)).padStart(2, "0")} – 00:${String(Math.min(chunk * 6, 59)).padStart(2, "0")}`, action: "Arată o funcție diferențiatoare: generator, preview, insight, automatizare sau export contextual.", purpose: "Moment de memorabilitate." },
    { time: `00:${String(Math.min(chunk * 6, 59)).padStart(2, "0")} – 00:${String(Math.min(chunk * 7, 59)).padStart(2, "0")}`, action: "Revenire scurtă la overview sau dashboard.", purpose: "Coerență narativă." },
    { time: `00:${String(Math.min(chunk * 7, 59)).padStart(2, "0")} – 00:${String(max).padStart(2, "0")}`, action: "Închidere curată pe ecranul cel mai valoros vizual.", purpose: "Final clar pentru recruiter sau viewer." }
  ];
}

function createClipFromInputs() {
  const title = $("projectName").value.trim() || "Clip nou generat";
  const url = $("projectUrl").value.trim();
  const message = $("visualMessage").value.trim() || "Produsul este fluid, coerent și vizual convingător într-un demo scurt.";
  const duration = Number($("duration").value || 40);
  return {
    id: createId(),
    title: `CLIP CUSTOM — ${title}`,
    shortTitle: title,
    url,
    message,
    duration,
    preroll: buildGenericPreroll(url),
    avoid: [
      "Nu deschide zone secundare care nu livrează payoff vizual.",
      "Nu face scroll rapid și nu umple formulare cu text lung.",
      "Nu închide modalele instant; stai 1–2 secunde pe ele."
    ],
    shots: buildGenericShots(title, duration, url)
  };
}

function generateDescriptions(clip, config) {
  const recruiter = `Demo-ul pentru ${clip.shortTitle} comunică un produs matur, cu fluxuri clare și interacțiuni dense, dar ușor de urmărit. Videoul este construit pentru recruteri sau clienți care trebuie să înțeleagă rapid ce face produsul, fără voice-over și fără text on-screen.`;
  const portfolio = `${clip.shortTitle} este prezentat printr-un demo silențios, orientat pe valoarea vizuală a produsului: navigare fluidă, interacțiuni scurte, accent pe ecranul principal și un fir logic care duce de la overview la payoff. Captura este planificată la ${config.canvasResolution}, downscale în ${config.outputResolution}, ${config.fps} FPS la înregistrare și ${config.finalFps} FPS la encode final.`;
  const social = `Silent product reel pentru ${clip.shortTitle}: overview clar, interacțiuni rapide dar lizibile, focus pe features reale și un final cu payoff vizual. Ideal pentru portofoliu, outreach sau landing pages.`;
  const technical = `Config recomandat: Output ${config.outputMode}, format ${config.recordingFormat}, encoder ${config.encoder}, rate control ${config.rateControl}, CRF ${config.crf}, keyframe ${config.keyframeInterval}, preset ${config.preset}, profile ${config.profile}, tune ${config.tune}, audio ${config.audio}.`;
  return [
    `1) Descriere recruiter\n${recruiter}`,
    `2) Descriere portofoliu\n${portfolio}`,
    `3) Descriere social\n${social}`,
    `4) Notă tehnică\n${technical}`
  ].join("\n\n");
}

function generateSummary(clip, config) {
  const prerollText = clip.preroll.map((x, i) => `${i + 1}. ${x}`).join("\n");
  const avoidText = clip.avoid.map((x, i) => `${i + 1}. ${x}`).join("\n");
  const flow = clip.shots.map((s, i) => `${i + 1}. ${s.time} — ${s.action} → ${s.purpose}`).join("\n");
  return [
    `PROIECT: ${clip.title}`,
    `URL: ${clip.url}`,
    `DURATĂ: ${clip.duration} secunde`,
    `MESAJ VIZUAL: ${clip.message}`,
    "",
    "PRE-ROLL",
    prerollText,
    "",
    "SHOT LIST",
    flow,
    "",
    "DE EVITAT",
    avoidText,
    "",
    "CONFIG CAPTURĂ",
    ...Object.keys(config).map((k) => `- ${k}: ${config[k]}`),
    "",
    "REGIE",
    ...directionRules.map((rule) => `- ${rule}`),
    "",
    "NARAȚIUNE REZULTAT",
    `${clip.shortTitle} trebuie să pară un produs coerent, sigur pe el și ușor de urmărit, fără să sacrifice profunzimea funcțională.`
  ].join("\n");
}

function generateVoiceover(clip) {
  const intro = `Acesta este ${clip.shortTitle}. În doar ${clip.duration} de secunde, demo-ul construiește ideea că produsul este clar, fluid și bine gândit.`;
  const middle = clip.shots.map((shot, index) => `Secvența ${index + 1}: ${shot.purpose} ${shot.action}`).join(" ");
  const outro = "Finalul lasă în cadru payoff-ul principal și confirmă că produsul rezolvă mai multe etape din același flux, fără fragmentare.";
  return `${intro}\n\n${middle}\n\n${outro}`;
}

function generateSlides(clip) {
  return [
    { title: "Hook vizual", bullets: [`Produs: ${clip.shortTitle}`, `Durată demo: ${clip.duration} secunde`, `Promisiune: ${clip.message}`] },
    { title: "Pre-roll", bullets: clip.preroll },
    { title: "Povestea clipului", bullets: clip.shots.slice(0, 3).map((s) => `${s.time}: ${s.purpose}`) },
    { title: "Momentul central", bullets: clip.shots.slice(3, 6).map((s) => `${s.time}: ${s.action}`) },
    { title: "Payoff și final", bullets: clip.shots.slice(-2).map((s) => `${s.time}: ${s.purpose}`) },
    { title: "Ce evităm", bullets: clip.avoid }
  ];
}

function generateExport(clip, config, slides, descriptions, summary) {
  const [w, h] = String(config.outputResolution || "1280x720").split("x");
  return [
    "# Encode final sugerat",
    `ffmpeg -i input.${config.recordingFormat} -vf "fps=${config.finalFps},scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2" -c:v libx264 -profile:v high -crf ${config.crf} -pix_fmt yuv420p -movflags +faststart output-final.mp4`,
    "",
    "=== JSON PREVIEW ===",
    JSON.stringify({ clip, config, slides, descriptions, summary }, null, 2)
  ].join("\n");
}

function parseTimecodeToSeconds(rangeStart) {
  const cleaned = String(rangeStart || "00:00").trim();
  const parts = cleaned.split(":").map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
}

function parseShotRangeStart(timeRange) {
  return String(timeRange || "00:00 – 00:04").split("–")[0].trim();
}

function inferActionsFromShot(shot) {
  const text = `${shot.action} ${shot.purpose}`.toLowerCase();
  const actions = [];
  if (text.includes("stai pe") || text.includes("fără interacțiuni") || text.includes("ține ecranul")) actions.push({ type: "wait", ms: 1500 });
  if (text.includes("hover")) { actions.push({ type: "hover", selector: "[data-demo-hover], .card, button, [role='button']" }); actions.push({ type: "wait", ms: 1200 }); }
  if (text.includes("command palette") || text.includes("cmd + k") || text.includes("ctrl")) {
    actions.push({ type: "pressCombo", keys: ["ControlOrMeta", "K"] });
    actions.push({ type: "wait", ms: 1000 });
    actions.push({ type: "type", selector: "input, textarea, [contenteditable='true']", text: "clien", delay: 160 });
    actions.push({ type: "press", key: "Enter" });
    actions.push({ type: "wait", ms: 1200 });
  }
  if (text.includes("click")) { actions.push({ type: "click", selector: "button, [role='button'], a, .btn, .card" }); actions.push({ type: "wait", ms: 1200 }); }
  if (text.includes("drag") || text.includes("mută un deal")) { actions.push({ type: "drag", from: ".kanban-card, [draggable='true'], .deal-card", to: ".kanban-column:nth-child(2), .column:nth-child(2), .dropzone:nth-child(2)" }); actions.push({ type: "wait", ms: 1200 }); }
  if (text.includes("scroll")) { actions.push({ type: "scrollBy", x: 0, y: 180, steps: 18, delay: 55 }); actions.push({ type: "wait", ms: 1000 }); }
  if (text.includes("formular") || text.includes("booking") || text.includes("input scurt")) { actions.push({ type: "fillSmart", selector: "input[type='text'], input:not([type]), textarea", text: "Demo scurt" }); actions.push({ type: "wait", ms: 700 }); }
  if (text.includes("print") || text.includes("pdf")) { actions.push({ type: "click", selector: "button, [role='button'], a" }); actions.push({ type: "wait", ms: 1500 }); actions.push({ type: "press", key: "Escape" }); }
  if (text.includes("apasă p")) actions.push({ type: "press", key: "p" }, { type: "wait", ms: 1200 });
  if (text.includes("apasă b")) actions.push({ type: "press", key: "b" }, { type: "wait", ms: 1200 });
  if (text.includes("apasă a")) actions.push({ type: "press", key: "a" }, { type: "wait", ms: 1200 });
  if (!actions.length) actions.push({ type: "wait", ms: 1500 });
  return actions;
}

function buildAutomationPlan(clip, config) {
  return {
    meta: {
      title: clip.title,
      shortTitle: clip.shortTitle,
      url: clip.url,
      duration: clip.duration,
      generatedAt: new Date().toISOString()
    },
    config,
    preroll: clip.preroll,
    avoid: clip.avoid,
    shots: clip.shots.map((shot, index) => ({
      index: index + 1,
      time: shot.time,
      timeStart: parseTimecodeToSeconds(parseShotRangeStart(shot.time)),
      action: shot.action,
      purpose: shot.purpose,
      actions: inferActionsFromShot(shot)
    }))
  };
}

function getRunnerTemplate() {
  return `import fs from "fs";
import path from "path";
import { chromium } from "playwright";
import { execFile } from "child_process";
import { promisify } from "util";
const execFileAsync = promisify(execFile);
const plan = JSON.parse(fs.readFileSync("./plan.json", "utf8"));
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function ensureDir(dir) { await fs.promises.mkdir(dir, { recursive: true }); }
async function findFirst(page, selectors) {
  const list = selectors.split(",").map((s) => s.trim()).filter(Boolean);
  for (const selector of list) {
    const locator = page.locator(selector).first();
    if (await locator.count()) return locator;
  }
  return null;
}
async function doAction(page, action) {
  switch (action.type) {
    case "wait": await sleep(action.ms || 1000); return;
    case "hover": { const el = await findFirst(page, action.selector); if (el) await el.hover({ force: true }); await sleep(400); return; }
    case "click": { const el = await findFirst(page, action.selector); if (el) await el.click({ force: true }); await sleep(400); return; }
    case "press": await page.keyboard.press(action.key); await sleep(300); return;
    case "pressCombo": if (action.keys?.length === 2) await page.keyboard.press(\`${action.keys[0]}+${action.keys[1]}\`); await sleep(300); return;
    case "type": { const el = await findFirst(page, action.selector); if (el) { await el.click({ force: true }); await el.fill(""); await el.type(action.text || "", { delay: action.delay || 120 }); } return; }
    case "fillSmart": { const el = await findFirst(page, action.selector); if (el) { await el.click({ force: true }); await el.fill(action.text || "Demo"); } return; }
    case "scrollBy": { const steps = action.steps || 10; const totalY = action.y || 120; const stepY = totalY / steps; for (let i = 0; i < steps; i++) { await page.mouse.wheel(action.x || 0, stepY); await sleep(action.delay || 60); } return; }
    case "drag": { const from = await findFirst(page, action.from); const to = await findFirst(page, action.to); if (from && to) await from.dragTo(to, { force: true }); await sleep(500); return; }
    default: await sleep(800); return;
  }
}
async function transcode(inputPath, outputPath, fps, crf, resolution) {
  const [w, h] = String(resolution || "1280x720").split("x");
  await execFileAsync("ffmpeg", ["-y", "-i", inputPath, "-vf", \`fps=${fps},scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2\`, "-c:v", "libx264", "-profile:v", "high", "-crf", String(crf || 18), "-pix_fmt", "yuv420p", "-movflags", "+faststart", outputPath]);
}
async function main() {
  const outDir = path.resolve("./output");
  await ensureDir(outDir);
  const [w, h] = String(plan.config.canvasResolution || "1920x1080").split("x").map(Number);
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: w || 1920, height: h || 1080 }, recordVideo: { dir: outDir, size: { width: w || 1920, height: h || 1080 } } });
  const page = await context.newPage();
  await page.goto(plan.meta.url, { waitUntil: "networkidle" });
  await sleep(2500);
  for (const shot of plan.shots) { for (const action of shot.actions) await doAction(page, action); await sleep(500); }
  const video = page.video();
  await context.close();
  await browser.close();
  const rawPath = await video.path();
  const finalPath = path.join(outDir, "final.mp4");
  await transcode(rawPath, finalPath, plan.config.finalFps || 24, plan.config.crf || 18, plan.config.outputResolution || "1280x720");
  console.log("Gata:", finalPath);
}
main().catch((err) => { console.error(err); process.exit(1); });`;
}

function getPackageJsonTemplate() {
  return JSON.stringify({
    name: "link-video-editor-automation-pack",
    version: "1.0.0",
    private: true,
    type: "module",
    scripts: { start: "node runner.mjs" },
    dependencies: { playwright: "^1.53.0" }
  }, null, 2);
}

function getReadmeTemplate(clip) {
  return `# Automation Pack\n\n## Ce face\n- deschide URL-ul\n- rulează shot-urile automat\n- înregistrează video cu Playwright\n- exportă MP4 final cu FFmpeg\n\n## Cerințe\n- Node.js 18+\n- FFmpeg instalat și disponibil în PATH\n\n## Instalare\n\
\
\
 npm install\n npx playwright install chromium\n\n## Rulare\n\
 npm start\n\n## Output\n\
 output/final.mp4\n\n## Proiect\n- ${clip.title}\n- ${clip.url}\n`;
}

function buildReportHtml() {
  const clip = getSelectedClip();
  if (!clip) return "<h1>Niciun clip selectat</h1>";
  const config = formatConfig();
  const slides = generateSlides(clip);
  const descriptions = generateDescriptions(clip, config);
  const summary = generateSummary(clip, config);
  const voiceover = generateVoiceover(clip);
  return `<!DOCTYPE html><html lang="ro"><head><meta charset="UTF-8"><title>Raport ${escapeHtml(clip.shortTitle)}</title><style>body{font-family:Inter,Arial,sans-serif;max-width:1100px;margin:0 auto;padding:32px;line-height:1.55;color:#111827}.card{border:1px solid #e5e7eb;border-radius:16px;padding:18px;margin:0 0 18px;background:#fff}h1,h2,h3{margin-top:0}code,pre{background:#f3f4f6;border-radius:12px;padding:14px;display:block;white-space:pre-wrap}ul{line-height:1.6}.badge{display:inline-block;padding:6px 10px;border-radius:999px;background:#eef2ff;color:#1d4ed8;font-size:12px;font-weight:700}</style></head><body><h1>${escapeHtml(clip.title)}</h1><p><span class="badge">${clip.duration}s</span></p><div class="card"><h2>Mesaj vizual</h2><p>${escapeHtml(clip.message)}</p></div><div class="card"><h2>Pre-roll</h2><ul>${clip.preroll.map((x) => `<li>${escapeHtml(x)}</li>`).join("")}</ul></div><div class="card"><h2>Shot list</h2>${clip.shots.map((s) => `<p><strong>${escapeHtml(s.time)}</strong><br>${escapeHtml(s.action)}<br><em>${escapeHtml(s.purpose)}</em></p>`).join("")}</div><div class="card"><h2>Slides</h2>${slides.map((slide, i) => `<h3>Slide ${i + 1}: ${escapeHtml(slide.title)}</h3><ul>${slide.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}</ul>`).join("")}</div><div class="card"><h2>Descrieri automate</h2><pre>${escapeHtml(descriptions)}</pre></div><div class="card"><h2>Voice-over</h2><pre>${escapeHtml(voiceover)}</pre></div><div class="card"><h2>Sumar</h2><pre>${escapeHtml(summary)}</pre></div><div class="card"><h2>Config</h2><pre>${escapeHtml(JSON.stringify(config, null, 2))}</pre></div></body></html>`;
}

async function exportPptx(clip, config) {
  if (typeof PptxGenJS === "undefined") return toast("Biblioteca PPTX nu s-a încărcat.");
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "ChatGPT";
  pptx.subject = clip.shortTitle;
  pptx.title = `${clip.shortTitle} - Demo Plan`;
  const slides = generateSlides(clip);
  const bg = "0B1020", card = "172347", text = "EEF3FF", muted = "A5B2D6", accent = "7C9CFF";
  const addTitle = (slide, title, subtitle) => { slide.addText(title, { x: .5, y: .35, w: 11.8, h: .6, fontSize: 24, bold: true, color: text }); if (subtitle) slide.addText(subtitle, { x: .5, y: .92, w: 11.5, h: .4, fontSize: 10, color: muted }); };
  let s = pptx.addSlide(); s.background = { color: bg }; addTitle(s, clip.title, clip.url); s.addText(clip.message, { x: .5, y: 1.5, w: 12.1, h: 1.1, fontSize: 18, color: text }); s.addShape(pptx.ShapeType.roundRect, { x: .5, y: 2.9, w: 3, h: .6, rectRadius: .08, fill: { color: accent }, line: { color: accent } }); s.addText(`${clip.duration} sec · Silent product demo`, { x: .72, y: 3.08, w: 2.7, h: .2, fontSize: 12, color: "061229", bold: true });
  s = pptx.addSlide(); s.background = { color: bg }; addTitle(s, "Pre-roll", "Pregătire înainte de recording"); s.addText(clip.preroll.map((x) => ({ text: x, options: { bullet: { indent: 16 } } })), { x: .8, y: 1.3, w: 11.2, h: 4.8, fontSize: 18, color: text, breakLine: true });
  clip.shots.forEach((shot, index) => { const slide = pptx.addSlide(); slide.background = { color: bg }; addTitle(slide, `Shot ${index + 1}`, shot.time); slide.addShape(pptx.ShapeType.roundRect, { x: .6, y: 1.5, w: 11.3, h: 4.6, rectRadius: .08, fill: { color: card }, line: { color: accent, transparency: 55, pt: 1 } }); slide.addText(shot.action, { x: .95, y: 1.95, w: 10.6, h: 1.2, fontSize: 24, bold: true, color: text }); slide.addText(shot.purpose, { x: .95, y: 3.3, w: 10.2, h: .9, fontSize: 18, color: muted, italic: true }); });
  slides.forEach((item) => { const slide = pptx.addSlide(); slide.background = { color: bg }; addTitle(slide, item.title, "Deck generat automat"); slide.addText(item.bullets.map((x) => ({ text: x, options: { bullet: { indent: 14 } } })), { x: .85, y: 1.35, w: 11, h: 4.9, fontSize: 20, color: text, breakLine: true }); });
  s = pptx.addSlide(); s.background = { color: bg }; addTitle(s, "Config tehnic", "Setările de captură și encode final"); s.addText(Object.keys(config).map((k) => ({ text: `${k}: ${config[k]}`, options: { bullet: { indent: 14 } } })), { x: .85, y: 1.35, w: 11, h: 4.9, fontSize: 18, color: text, breakLine: true });
  await pptx.writeFile({ fileName: `${slugify(clip.shortTitle)}-demo-plan.pptx` });
  toast("PPTX generat.");
}

async function downloadAutomationPack() {
  const clip = getSelectedClip();
  if (!clip) return toast("Nu există un clip selectat.");
  if (typeof JSZip === "undefined") return toast("Biblioteca JSZip nu s-a încărcat.");
  const config = formatConfig();
  const zip = new JSZip();
  zip.file("plan.json", JSON.stringify(buildAutomationPlan(clip, config), null, 2));
  zip.file("runner.mjs", getRunnerTemplate());
  zip.file("package.json", getPackageJsonTemplate());
  zip.file("README.md", getReadmeTemplate(clip));
  zip.file("encode-final.txt", generateExport(clip, config, generateSlides(clip), generateDescriptions(clip, config), generateSummary(clip, config)));
  const blob = await zip.generateAsync({ type: "blob" });
  downloadFile(`${slugify(clip.shortTitle)}-automation-pack.zip`, blob, "application/zip");
  toast("Automation Pack generat.");
}

function buildCliCommands() {
  return ["npm install", "npx playwright install chromium", "node runner.mjs"].join("\n");
}

function buildShareLink() {
  const clip = getSelectedClip();
  const params = new URLSearchParams();
  if (clip?.id) params.set("preset", clip.id);
  if (clip?.url) params.set("url", clip.url);
  if (clip?.shortTitle) params.set("title", clip.shortTitle);
  if (clip?.duration) params.set("duration", clip.duration);
  return `${location.origin}${location.pathname}?${params.toString()}`;
}

function getSelectedClip() {
  return state.clips.find((clip) => clip.id === state.selectedClipId) || null;
}

function updateStats(slides, descriptions) {
  const selected = getSelectedClip();
  const totalShots = state.clips.reduce((sum, clip) => sum + clip.shots.length, 0);
  $("statShots").textContent = totalShots;
  $("statSlides").textContent = slides ? slides.length : (selected ? generateSlides(selected).length : 0);
  $("statDescriptions").textContent = descriptions ? descriptions.split("\n\n").length : (selected ? 4 : 0);
  $("statClips").textContent = state.clips.length;
}

function renderClipTabs() {
  $("clipTabs").innerHTML = state.clips.map((clip, index) => `<button class="tab ${clip.id === state.selectedClipId ? "active" : ""}" data-clip-id="${clip.id}">${index + 1}. ${escapeHtml(clip.shortTitle)}</button>`).join("") || `<span class="hint">Niciun clip generat încă.</span>`;
}

function renderClipList() {
  $("clipList").innerHTML = state.clips.map((clip) => `
    <article class="clip-card ${clip.id === state.selectedClipId ? "active" : ""}" data-clip-id="${clip.id}">
      <div class="clip-head">
        <div>
          <div class="clip-title">${escapeHtml(clip.title)}</div>
          <div class="clip-meta">${clip.duration}s · ${escapeHtml(clip.url)}</div>
        </div>
        <span class="badge">${clip.shots.length} shot-uri</span>
      </div>
      <div class="pill-row">
        <span class="pill">Pre-roll: ${clip.preroll.length}</span>
        <span class="pill">Slides: 6</span>
        <span class="pill">Automation Pack</span>
      </div>
      <p class="hint">${escapeHtml(clip.message)}</p>
    </article>
  `).join("");
}

function renderSelectedClip() {
  const clip = getSelectedClip();
  if (!clip) {
    $("timeline").innerHTML = `<div class="preview-note">Nu există încă un clip selectat.</div>`;
    $("slides").innerHTML = "";
    $("descriptions").textContent = "";
    $("summary").textContent = "";
    $("voiceover").textContent = "";
    $("exportBox").textContent = "";
    preview.classList.add("hidden");
    previewNote.classList.remove("hidden");
    previewNote.textContent = "Adaugă un proiect sau încarcă preseturile pentru a genera materialele.";
    updateStats(null, "");
    persistState();
    return;
  }

  const config = formatConfig();
  const slides = generateSlides(clip);
  const descriptions = generateDescriptions(clip, config);
  const summary = generateSummary(clip, config);
  const voiceover = generateVoiceover(clip);
  const exportText = generateExport(clip, config, slides, descriptions, summary);

  $("timeline").innerHTML = [
    `<div class="preview-note"><strong>Pre-roll</strong><br>${clip.preroll.map((item, i) => `${i + 1}. ${escapeHtml(item)}`).join("<br>")}</div>`,
    ...clip.shots.map((shot) => `
      <article class="shot">
        <div><span class="time">${escapeHtml(shot.time)}</span></div>
        <div>
          <h4>${escapeHtml(shot.action)}</h4>
          <p>${escapeHtml(shot.purpose)}</p>
        </div>
      </article>
    `)
  ].join("");

  $("slides").innerHTML = slides.map((slide, index) => `
    <article class="slide">
      <span class="slide-num">Slide ${index + 1}</span>
      <h4>${escapeHtml(slide.title)}</h4>
      <ul>${slide.bullets.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
    </article>
  `).join("");

  $("descriptions").textContent = descriptions;
  $("summary").textContent = summary;
  $("voiceover").textContent = voiceover;
  $("exportBox").textContent = exportText;

  if (clip.url) {
    preview.classList.remove("hidden");
    previewNote.classList.remove("hidden");
    previewNote.innerHTML = `Preview-ul depinde de politica site-ului țintă. Dacă pagina blochează iframe, deschide-o direct în tab nou: <a href="${escapeHtml(clip.url)}" target="_blank" rel="noreferrer">${escapeHtml(clip.url)}</a>.`;
    preview.src = clip.url;
  } else {
    preview.classList.add("hidden");
    previewNote.classList.remove("hidden");
    previewNote.textContent = "Acest clip nu are URL setat pentru preview.";
  }

  updateStats(slides, descriptions);
  persistState();
}

function setActiveView(view) {
  state.activeView = view;
  document.querySelectorAll("[data-view]").forEach((btn) => btn.classList.toggle("active", btn.dataset.view === view));
  document.querySelectorAll(".view-block").forEach((block) => block.classList.add("hidden"));
  const target = document.getElementById(`view-${view}`);
  if (target) target.classList.remove("hidden");
  persistState();
}

function renderAll() {
  renderClipTabs();
  renderClipList();
  renderSelectedClip();
}

function persistState() {
  const payload = {
    clips: state.clips,
    selectedClipId: state.selectedClipId,
    activeView: state.activeView,
    fields: {
      projectUrl: $("projectUrl").value,
      projectName: $("projectName").value,
      visualMessage: $("visualMessage").value,
      duration: $("duration").value
    },
    config: formatConfig()
  };
  localStorage.setItem(storageKey, JSON.stringify(payload));
  $("storageStatus").textContent = `Ultima salvare locală: ${new Date().toLocaleString("ro-RO")}`;
}

function hydrateFromStorage() {
  const raw = localStorage.getItem(storageKey);
  if (!raw) return;
  try {
    const saved = JSON.parse(raw);
    state.clips = Array.isArray(saved.clips) ? saved.clips : [];
    state.selectedClipId = saved.selectedClipId || null;
    state.activeView = saved.activeView || "timeline";
    const fields = saved.fields || {};
    $("projectUrl").value = fields.projectUrl || "";
    $("projectName").value = fields.projectName || "";
    $("visualMessage").value = fields.visualMessage || "";
    $("duration").value = fields.duration || "40";
    const savedConfig = saved.config || {};
    Object.keys(optionSets).forEach((key) => { if (savedConfig[key] && $(key)) $(key).value = savedConfig[key]; });
  } catch {
    localStorage.removeItem(storageKey);
  }
}

async function loadPresets() {
  const response = await fetch("./assets/presets.json");
  if (!response.ok) throw new Error("Nu am putut încărca preseturile.");
  const data = await response.json();
  return data.map((clip) => ({ ...clip, id: clip.id || createId() }));
}

function applyQueryParams() {
  const params = new URLSearchParams(location.search);
  const preset = params.get("preset");
  const title = params.get("title");
  const url = params.get("url");
  const duration = params.get("duration");
  if (title) $("projectName").value = title;
  if (url) $("projectUrl").value = url;
  if (duration) $("duration").value = duration;
  if (preset && state.clips.length) {
    const match = state.clips.find((clip) => clip.id === preset);
    if (match) state.selectedClipId = match.id;
  }
}

function attachEvents() {
  $("generateBtn").addEventListener("click", () => {
    const url = $("projectUrl").value.trim();
    if (!url) return toast("Adaugă mai întâi un link valid pentru a genera clipul.");
    const clip = createClipFromInputs();
    state.clips.unshift(clip);
    state.selectedClipId = clip.id;
    renderAll();
  });

  $("loadPresetBtn").addEventListener("click", async () => {
    state.clips = await loadPresets();
    state.selectedClipId = state.clips[0]?.id || null;
    renderAll();
    toast("Preseturile au fost încărcate din JSON.");
  });

  $("copySummaryBtn").addEventListener("click", () => {
    const clip = getSelectedClip();
    if (!clip) return toast("Nu există un clip selectat.");
    copyToClipboard(generateSummary(clip, formatConfig()));
  });

  $("downloadJsonBtn").addEventListener("click", () => {
    const clip = getSelectedClip();
    if (!clip) return toast("Nu există date de exportat.");
    const config = formatConfig();
    const payload = { clip, config, slides: generateSlides(clip), descriptions: generateDescriptions(clip, config), summary: generateSummary(clip, config), voiceover: generateVoiceover(clip) };
    downloadFile(`${slugify(clip.shortTitle)}-video-plan.json`, JSON.stringify(payload, null, 2), "application/json;charset=utf-8");
  });

  $("downloadPptxBtn").addEventListener("click", async () => {
    const clip = getSelectedClip();
    if (!clip) return toast("Nu există deck de exportat.");
    await exportPptx(clip, formatConfig());
  });

  $("downloadHtmlBtn").addEventListener("click", () => {
    const clip = getSelectedClip();
    if (!clip) return toast("Nu există raport de exportat.");
    downloadFile(`${slugify(clip.shortTitle)}-raport.html`, buildReportHtml(), "text/html;charset=utf-8");
  });

  $("downloadAutomationBtn").addEventListener("click", downloadAutomationPack);
  $("copyCliBtn").addEventListener("click", () => copyToClipboard(buildCliCommands()));
  $("shareLinkBtn").addEventListener("click", () => copyToClipboard(buildShareLink()));

  $("resetBtn").addEventListener("click", () => {
    localStorage.removeItem(storageKey);
    location.href = location.pathname;
  });

  ["projectUrl", "projectName", "visualMessage", "duration"].forEach((id) => {
    $(id).addEventListener("input", persistState);
    $(id).addEventListener("change", persistState);
  });

  document.addEventListener("click", (e) => {
    const clipButton = e.target.closest("[data-clip-id]");
    if (clipButton) {
      state.selectedClipId = clipButton.dataset.clipId;
      renderAll();
    }
    const viewButton = e.target.closest("[data-view]");
    if (viewButton) setActiveView(viewButton.dataset.view);
  });
}

async function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    try { await navigator.serviceWorker.register("./service-worker.js"); }
    catch { /* ignore */ }
  }
}

async function bootstrap() {
  populateConfigGrid();
  renderDirectionRules();
  attachEvents();
  state.clips = await loadPresets();
  state.selectedClipId = state.clips[0]?.id || null;
  hydrateFromStorage();
  applyQueryParams();
  renderAll();
  setActiveView(state.activeView || "timeline");
  registerServiceWorker();
}

bootstrap().catch((error) => {
  console.error(error);
  toast("A apărut o eroare la inițializare.");
});
