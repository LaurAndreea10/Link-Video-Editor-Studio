🎬 LINK VIDEO EDITOR STUDIO

A browser-based product demo studio that turns any public URL into a complete silent-video plan — shot list, pre-roll, deck, descriptions, voice-over and export-ready assets — all in a single static page.

Show Image
Show Image
Show Image
Show Image

✨ Overview
Link Video Editor Studio is a web-based silent product demo planner built to transform a single URL into a premium demo plan with pre-roll, shot list, slide deck, auto-generated descriptions, voice-over draft and export packages — ready for portfolio, outreach or local video production.
The goal of the project is to make the journey from “here is my product” to “here is a demo plan someone can actually film” as short, clean and visual as possible — without any backend or paid service.

🧩 Project Origin
Link Video Editor Studio started from a real need: turning existing browser products — CRMs, SaaS tools, interactive experiences — into short, elegant silent-video demos that could be used in portfolios, on LinkedIn, in outreach and in recruiter conversations.
Early iterations experimented with:

static demo planning
manually written shot lists
local captures using screen recorders
ad-hoc exports for LinkedIn, portfolio and outreach

🔗 Products used as inspiration and test cases

Alpis Fusion CRM Premium
ClientFlow SaaS
Alpis Impact Path

🛠️ What happened next
Instead of staying as separate manual exercises, these ideas were:

unified into a single static studio
extended with a deterministic Mock mode generator
upgraded with an optional Real AI mode powered by the Anthropic API
expanded with demo reel playback, Playwright runner export and style templates
prepared for GitHub Pages deployment with zero hosting cost


🚀 Core Features
🎯 Single-URL demo planning

paste any public product URL
automatic URL analysis with product-type detection
instant generation of a full plan: pre-roll, shot list, slides, descriptions, voice-over and export
three preset examples always available for reference

🎨 6 demo style templates

🪟 SaaS Clean — calm rhythm, functional clarity, show don’t tell
🚀 Launch Teaser — tempo, hook in 2s, mystery → reveal → payoff
📊 Investor Deck — problem → solution → proof, data and authority
📱 Social Reel — micro-hook, text on-screen, 20–30s, vertical-ready
🧭 Tutorial Walkthrough — didactic, first → then → finally
🏛️ Enterprise Polished — slow, authoritative, reliability and scale

Each style changes the voice-over, the descriptions, the shot archetypes and the direction rules.
🧠 Dual generation modes

🎭 Mock mode — deterministic, instant, free, seeded from URL + style
✨ Real AI mode — direct browser call to Anthropic API using your own key
no backend required, no third party services, no hidden costs

📋 Readiness score

live 0–100 score based on 5 quality checks
valid URL, product name, objective quality, duration appropriateness, style–type match
contextual micro-copy for every warning
helps the user arrive at a well-formed input before generation

▶️ Auto-play demo reel

built-in silent reel that walks through multiple clips
per-clip and total progress bars
live shot highlighting on the timeline
keyboard shortcuts: Space, Arrow Right, Escape
pause, resume, skip, stop controls

💾 Exports

plan JSON for repo commits
HTML report
automation pack JSON
Playwright runner .mjs — self-contained script that captures real .webm videos locally
copy to clipboard for summaries and CLI commands

🧭 Onboarding 1 → 2 → 3

visual progress strip at the top of the hero
Step 1 — add URL
Step 2 — pick style and duration
Step 3 — generate and export
the active step is highlighted, completed steps marked with ✓

🔐 Trust-first design

API key stored locally in the browser only
no backend ever required
GitHub Pages compatible
runs locally with zero setup
Mock mode is always free


🌟 Vision
Link Video Editor Studio is not just a one-shot demo generator. It is designed as a modular demo planning studio that can grow with:

more style templates
richer URL analysis
deeper integrations with the Anthropic API
shot-level editing and regeneration
a library of saved projects
additional export formats (Notion brief, markdown for repos, client handoff PDF, social captions)
future collaboration with real video automation


📁 Project Structure
Link-Video-Editor-Studio/
├── index.html
├── README.md
└── assets/            (optional, screenshots and badges)
The exact structure may evolve over time, but the direction is clear: stay static, stay single-file where possible, keep the studio portable on GitHub Pages.

🔥 Planned Improvements
🧱 1. Shot list editing

drag and drop reorder
inline duration editing
mark shots as must keep or remove
regenerate a single shot without redoing the whole plan
automatic recomputation of timecodes

📚 2. Local project library

persistent projects in localStorage
generation history
duplicate a project
favorite exports
quick switch between saved clips

🔍 3. Deeper URL analysis

heading extraction
CTA detection
section-level mapping
USP extraction
auto-fill for product name and objective

⚖️ 4. Mock vs Real AI compare

generate with both modes in one click
visual diff between outputs
approximate cost estimate for the real call
side-by-side view for decision making

🎥 5. In-app storyboard preview

animated storyboard inside the preview panel
fallback visual preview when MP4 capture is not possible
tighter link between the promise of a “video demo” and what the user sees in the browser

📤 6. Use-case-oriented exports

Notion-ready brief
markdown ready to commit to a repo
client handoff PDF
social caption pack
shot checklist CSV

🧼 7. Richer empty states

mock cards that show what an ideal output looks like
visual preview of a generated plan
micro-copy of the form “here is what you get after generation”

🧠 8. Smarter AI prompts

two-pass generation: structural analysis, then narrative direction
better handling of locked or private pages
fallback plans when the URL does not yield a rich structure

📱 9. Mobile polish

denser sidebar
collapsible panels
better tap targets
vertical-first stat row

🗃️ 10. Automation Pack improvements

downloadable Playwright project scaffold
pre-configured FFmpeg conversion commands
optional CI hook for repeatable captures
safer timeout and fallback handling

🧩 11. More style templates

Changelog reel
Documentation tour
Comparison reel (before vs after)
Open-source project showcase
Case study walkthrough

🌐 12. Accessibility and localization

full keyboard navigation
improved ARIA labels
optional English interface
improved color contrast in trust strip and onboarding


🛠️ Tech Direction
The project is evolving around:

HTML / CSS / JavaScript as the main baseline
single-file deployability on GitHub Pages
a deterministic mock generator for zero-cost usage
direct browser calls to the Anthropic API in Real AI mode
a Playwright runner emitted from the app for real local video capture
progressive modularization and cleaner long-term maintainability


▶️ Running Locally
Simple option
Open index.html directly in your browser.
Recommended option
Run a local server:
npx serve .
or
python -m http.server 8080
Then open:
http://localhost:8080
Real AI mode (optional)

open the studio
switch the mode toggle from 🎭 Mock to ✨ AI real
paste your Anthropic API key
pick a model (Claude Opus 4.7, Sonnet 4.6 or Haiku 4.5)
fill URL, product name, objective, duration
press Generează demo-ul

The key is stored only in your browser (localStorage) and is sent directly to api.anthropic.com with no intermediate server.
Local video capture (optional)

press Descarcă runner Playwright in the studio
save run-demos.mjs next to a fresh folder
run:

npm init -y
npm install playwright
npx playwright install chromium
node run-demos.mjs

the captured .webm files appear in ./recordings/
convert to MP4 with FFmpeg:

ffmpeg -i recordings/<slug>.webm -c:v libx264 -crf 18 recordings/<slug>.mp4

🧪 Current Status
Link Video Editor Studio is currently in active development.
Main focus areas include:

stabilizing the single-file static build
expanding the library of style templates
polishing the demo reel playback
improving the readiness score heuristics
upgrading the Playwright runner output


📌 Roadmap

 single static page hosted on GitHub Pages
 preset examples with 3 reference clips
 Mock mode with deterministic generator
 Real AI mode with direct Anthropic API calls
 6 demo style templates
 readiness score with contextual micro-copy
 onboarding 1 → 2 → 3 strip
 auto-play demo reel
 Playwright runner export
 trust strip with transparent messaging
 shot list inline editing
 local project library with localStorage
 Mock vs Real AI visual diff
 use-case-oriented exports (Notion, markdown, PDF)
 animated storyboard preview
 English interface
 accessibility audit pass


🤝 Contribution
This project is currently being developed as a personal and experimental product studio, but it is structured with future extensibility in mind.
The long-term goal is to make the codebase easier to expand, refactor and polish into a stronger standalone demo planning tool.

📜 Credits & Inspiration
Link Video Editor Studio was built from the real need to turn existing products into clear silent-video demos, then expanded into a unified planning studio with styles, modes and exports.
Huge credit goes to the iterative process itself: every prompt, every test input, every rewired preview and every shot-list heuristic that shaped the current direction of the project. 💜

🏁 Long-Term Goal
The long-term vision for Link Video Editor Studio is to become a complete demo planning tool that is:

fast to use
clean to expand
technically stronger over time
visually premium
ready for shot-level editing, real-time AI diffing and a full project library
