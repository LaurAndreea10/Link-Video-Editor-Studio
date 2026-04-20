# Link Video Automation

Aplicație completă HTML + Node.js + Playwright + FFmpeg pentru demo-uri automate de produs.

## Ce face

1. Primește un link și o listă de shot-uri.
2. Deschide pagina cu Playwright.
3. Rulează shot-urile automat.
4. Înregistrează video nativ din browser prin `recordVideo`.
5. Convertește fișierul rezultat în MP4 cu FFmpeg.

## Cerințe

- Node.js 20+
- FFmpeg instalat și disponibil în PATH
- Chromium pentru Playwright

## Instalare

```bash
npm install
npm run install:browsers
```

## Pornire

```bash
npm start
```

Deschide apoi:

```bash
http://localhost:3000
```

## Deploy pe Render (Web Service)

Repo-ul include acum configurare minimă pentru Render:

- `Dockerfile` bazat pe imaginea Playwright + instalare `ffmpeg`
- `render.yaml` pentru Web Service Docker
- endpoint de health check la `GET /health`

Pași rapizi:

1. În Render: **New → Web Service**
2. Conectezi repo-ul GitHub
3. Render detectează `render.yaml` + Docker runtime
4. Opțional setezi `Health Check Path` la `/health`

> Notă: GitHub Pages nu poate rula backend Node/Playwright/FFmpeg. Aplicația trebuie hostată ca Web Service.

## Flux

- UI-ul din `public/index.html` trimite payload-ul la `POST /api/render`
- `server.js` pornește jobul
- `src/runner.js` execută automatizarea și transcodarea
- fișierele rezultate apar în `output/<jobId>/`

## Format shots JSON

### wait
```json
{ "type": "wait", "ms": 1500 }
```

### click
```json
{ "type": "click", "selector": "button", "textContains": "Tasks", "timeoutMs": 6000 }
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

## Note importante

- Playwright înregistrează contextul browserului în format video brut, apoi FFmpeg produce MP4 final.
- Pentru site-uri diferite, selectorii trebuie adaptați. Preseturile sunt orientative.
- Unele site-uri pot avea animații sau încărcări care cer timpi mai mari de așteptare.
- Dacă ai placă Nvidia și vrei encode hardware, poți schimba funcția `transcodeToMp4` astfel încât să folosească `h264_nvenc`.

## Fișiere generate

În `output/<jobId>/`:

- `request.json`
- `status.json`
- `automation.log`
- `capture.webm`
- `final.mp4`
