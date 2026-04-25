# Contributing

Thanks for improving Link Video Editor Studio.

## Contribution principles
- keep the app static-first
- avoid adding backend assumptions to the Pages experience
- prefer JSON-driven presets over hardcoded demo content
- keep exports deterministic in Mock mode
- document any workflow or UI change in README when it affects users

## Local workflow
1. Run the app locally with a static server.
2. Test preset loading.
3. Test at least one export path.
4. If you touch GitHub Actions, keep workflows manual when side effects are expensive.

## Pull requests
Please include:
- what changed
- why it changed
- how it was tested
- screenshots or output samples for UI/export changes

## Good first contribution areas
- accessibility labels
- empty-state polish
- additional presets
- export templates
- workflow docs
