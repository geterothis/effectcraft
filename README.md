# test-corpus (orphan branch, never merged into main)

Exchange branch for EffectCraft <-> After Effects compatibility tests.

- `corpus/` - real .aep projects built in After Effects 26.5 by script, media they reference, generator scripts, `manifest.json`, `README.md` (what each file tests).
- `reference/` - After Effects renders of each file (PNG every 15th frame + last frame, single-frame refs, H.264), `timings/` aerender wall-clock times and machine specs.
- `exports/` - .aep files saved by EffectCraft (testing thread writes here).
- `roundtrip/` - results of opening `exports/` in After Effects 2026.
