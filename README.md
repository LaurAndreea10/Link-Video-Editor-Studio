# Link Video Automation

Aplicație completă HTML + Node.js + Playwright + FFmpeg pentru demo-uri automate de produs.

## Ce face

1. Primește un link și o listă de shot-uri.
2. Deschide pagina cu Playwright.
3. Rulează shot-urile automat.
4. Înregistrează video nativ din browser prin `recordVideo`.
5. Convertește fișierul rezultat în MP4 cu FFmpeg.

## Arhitectură GitHub în 3 straturi

Repo-ul este pregătit pentru un model „produs GitHub”:

1. **GitHub Pages** — publică aplicația statică din `public/index.html` prin workflow-ul `pages.yml`.
2. **GitHub Actions** — validează aplicația (`validate.yml`), rulează randări manuale Playwright (`render-video.yml`) și creează pachete distribuibile (`release-pack.yml`).
3. **Artifacts / Releases** — output-urile (MP4, ZIP) sunt publicate ca artifacte și, la tag-uri `v*`, ca release assets.

> Limitare importantă: GitHub Pages este static hosting; randarea video rămâne în workflow-uri Actions (nu în browser).

## Cerințe locale

- Node.js 20+
- FFmpeg instalat și disponibil în PATH
- Chromium pentru Playwright

## Instalare

```bash
npm install
npm run install:browsers
```

## Pornire locală

```bash
npm start
```

Deschide apoi:

```bash
http://localhost:3000
```

## Workflow-uri GitHub incluse

- `.github/workflows/pages.yml` — deploy GitHub Pages (push pe `main` + `workflow_dispatch`)
- `.github/workflows/validate.yml` — validare `public/index.html` + sintaxă JavaScript inline
- `.github/workflows/render-video.yml` — randare manuală (`workflow_dispatch`) cu input-uri `clip_url`, `clip_title`, `duration`
- `.github/workflows/release-pack.yml` — generează ZIP și îl publică în Release pentru tag-uri `v*`

## Randare manuală în Actions

1. Deschizi tab-ul **Actions**.
2. Rulezi workflow-ul **Render Video**.
3. Completezi input-urile:
   - `clip_url`
   - `clip_title`
   - `duration`
4. Descarci artifact-ul `rendered-video-<run_id>` din run summary.

## Deploy pe Render (Web Service)

Repo-ul include configurare minimă pentru Render:

- `Dockerfile` bazat pe imaginea Playwright + instalare `ffmpeg`
- `render.yaml` pentru Web Service Docker
- endpoint de health check la `GET /health`

Pași rapizi:

1. În Render: **New → Web Service**
2. Conectezi repo-ul GitHub
3. Render detectează `render.yaml` + Docker runtime
4. Opțional setezi `Health Check Path` la `/health`

## Flux backend (local / Render)

- UI-ul din `public/index.html` trimite payload-ul la `POST /api/render`
- `server.js` pornește jobul
- `src/runner.js` execută automatizarea și transcodarea
- fișierele rezultate apar în `output/<jobId>/`

## Comenzi utile

```bash
npm run validate
```

```bash
npm run render:plan -- output-plan.json custom-job-id
```

## Format shots JSON

### wait
```json
{ "type": "wait", "ms": 1500 }
```

### click
```json
{ "type": "click", "selector": "button", "textContains": "Tasks", "timeoutMs": 6000 }
```

### clickOptional
```json
{ "type": "clickOptional", "selector": ["button", "[role=\"button\"]"], "textContains": ["Skip", "Close"], "timeoutMs": 1200 }
```

### hover
```json
{ "type": "hover", "selector": ".card" }
```

### type
```json
{ "type": "type", "selector": "textarea", "text": "Idee scurtă", "delay": 90 }
```

### press
```json
{ "type": "press", "keys": "Control+K" }
```

### pressAny
```json
{ "type": "pressAny", "keys": ["Control+K", "Meta+K"] }
```

### drag
```json
{ "type": "drag", "source": ".card", "target": ".column:nth-child(2)" }
```

### scroll
```json
{ "type": "scroll", "pixels": 250, "speedPxPerSecond": 180 }
```

### fillSmart
```json
{ "type": "fillSmart", "values": ["Demo Client", "25/05/2026", "10:00"] }
```

### evaluate
```json
{ "type": "evaluate", "script": "window.scrollTo({ top: 0, behavior: 'smooth' })" }
```

## Fișiere generate

În `output/<jobId>/`:

- `request.json`
- `status.json`
- `automation.log`
- `capture.webm`
- `final.mp4`
