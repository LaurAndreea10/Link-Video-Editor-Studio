# Planning and Governance

This document turns the roadmap into a lightweight operating model for the repository.

## Working model
The project is intentionally split into two layers:
- **GitHub Pages app** — static-first planning studio
- **Automation / Actions layer** — capture, validation, release and asset distribution

This separation keeps the product honest about what can run in the browser and what must run in automation.

## Suggested label taxonomy
Use these labels to keep issues readable:
- `mvp` — core functionality required for the main user journey
- `ux` — product and interface improvements
- `docs` — README, examples, screenshots, contributor docs
- `accessibility` — keyboard access, semantics, reduced motion, contrast
- `exports` — JSON / HTML / PPTX / automation-pack outputs
- `workflows` — GitHub Actions, Pages deploy, release automation
- `good first issue` — safe entry points for contributors
- `needs design` — concept is known but implementation direction needs review

## Milestone buckets
### Milestone 1 — Stable MVP
Focus:
- Pages app works and is trustworthy
- presets load reliably
- exports work
- validate + Pages workflows stay green

Related issues:
- #18 workflow cleanup

### Milestone 2 — Better planning UX
Focus:
- stronger readiness scoring
- richer empty states
- better state restoration
- mobile and keyboard polish

Related issues:
- #16 app shell polish

### Milestone 3 — Visual credibility
Focus:
- screenshots
- GIF walkthroughs
- better sample outputs
- recruiter-facing proof assets

Related issues:
- #17 visual proof

### Milestone 4 — Repo governance and contributor clarity
Focus:
- labels and milestones applied consistently
- docs point to the right active issues
- project board optional after issue structure stabilizes

Related issues:
- #19 governance bootstrap

## Decision rules
When choosing between implementations:
1. prefer static-first for the public demo
2. keep any real capture path explicit and separate
3. prefer deterministic exports over clever but opaque logic
4. document any workflow change that affects release or Pages behavior
5. add sample outputs whenever a feature would otherwise be hard to verify quickly

## Definition of done
A feature is considered done when:
- the user-facing behavior exists
- README or docs are updated if needed
- a sample output or screenshot exists for major visible changes
- workflow impact is validated when relevant

## Recommended next sequence
1. Finish #18 and verify Actions consistency
2. Finish #17 and complete the visual proof layer
3. Finish #16 to improve the Pages demo experience
4. Apply labels and milestones manually in GitHub

## Notes on GitHub limitations
Some governance steps, such as creating milestone objects and applying custom labels, are best finalized in the GitHub UI if the automation surface is limited. This doc keeps those choices explicit even before they are fully applied in the repository settings.
