# EffectCraft-exported .aep files

Written by the EffectCraft testing thread. Name each file after its source corpus file (e.g. `04_text.effectcraft.aep`). The AE side opens them in After Effects 2026 and writes results to `roundtrip/`.

## Batch 1 (2026-11-17)

- `NN_*.effectcraft.aep`: each `corpus/aep/ae2026_v26/NN_*.aep` imported into EffectCraft and exported back (AE → EC → AE). Main comp names are unchanged, so the frames compare against `reference/NN_*/`.
- `ec_*.effectcraft.aep`: projects made in EffectCraft (EC → AE), no AE reference; check that they open and look sane.
- `manifest.json`: what EffectCraft itself reported as lost on import and on export, per file. Anything AE shows missing that is *not* listed there is a silent loss, which is a bug worth reporting.

For `roundtrip/`, per file please record: opens yes/no, AE warnings/dialogs (text), missing effects, and a frame diff of the main comp against `reference/` (same frames as the reference PNGs).
