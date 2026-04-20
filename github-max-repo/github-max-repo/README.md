# Link Video Editor Studio — GitHub Max Setup

Acest repo este varianta recomandată pentru a duce proiectul la potențial maxim în ecosistemul GitHub:

- **GitHub Pages** pentru aplicația statică
- **GitHub Actions** pentru validare și randare video manuală
- **Artifacts / Releases** pentru output-uri descărcabile
- **Automation Pack** pentru rulare locală cu Playwright + FFmpeg

## Structură

```text
.
├─ index.html
├─ manifest.webmanifest
├─ service-worker.js
├─ assets/
│  ├─ app.css
│  ├─ app.js
│  └─ presets.json
└─ .github/
   └─ workflows/
      ├─ pages.yml
      ├─ validate.yml
      └─ render-video.yml
```

## Ce face aplicația din Pages

- încarcă preseturile din `assets/presets.json`
- salvează workspace-ul automat în `localStorage`
- generează timeline, slides, descrieri, voice-over și exporturi
- generează un `Automation Pack` ZIP pentru rulare locală
- suportă linkuri shareable, de exemplu `?preset=alpis-fusion`
- suportă PWA basic și cache offline pentru fișierele statice

## Activare GitHub Pages

1. Pune fișierele în repo.
2. Mergi la **Settings → Pages**.
3. Alege **GitHub Actions** ca source.
4. Fă push pe branch-ul `main`.
5. Workflow-ul `Deploy Pages` va publica site-ul.

## Workflow-uri

### 1. Validate App
Rulează la push și pull request.
Verifică:
- existența fișierelor
- sintaxa JS
- validitatea `presets.json`

### 2. Deploy Pages
Construiește și publică site-ul static pe GitHub Pages.

### 3. Render Video
Este manual (`workflow_dispatch`).
Primește:
- `clip_url`
- `clip_title`
- `duration`

Apoi:
- instalează Chromium pentru Playwright
- instalează FFmpeg
- rulează captură simplă
- încarcă `output/final.mp4` ca artifact

## Cum folosești Actions pentru video

1. Mergi la tab-ul **Actions**.
2. Deschide workflow-ul **Render Video**.
3. Apasă **Run workflow**.
4. Completează URL-ul și titlul.
5. La final descarci artifactul `rendered-video`.

## Cum folosești Automation Pack

Din aplicația publicată:
- selectezi clipul
- apeși **Descarcă Automation Pack**

Apoi local:

```bash
npm install
npx playwright install chromium
node runner.mjs
```

Ai nevoie de FFmpeg disponibil în PATH.

## De ce această arhitectură

GitHub Pages publică numai fișiere statice. De aceea:
- UI-ul și exporturile locale rulează în Pages
- automatizarea reală și randarea video rulează în GitHub Actions sau local

## Extensii utile

- atașare MP4 în GitHub Releases
- export imagine thumbnail
- export GIF preview
- preseturi separate pe categorii
- workflow care citește `plan.json` din repo sau artifact
