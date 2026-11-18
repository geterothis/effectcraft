# Effect Opacity read-back (branch feat/effect-opacity, 9efb9496)

Each .aep is an After Effects fx-nondefault sample (Effect Opacity 37 %) imported into EffectCraft
and exported again. `<name>.ec.png` is EffectCraft's frame 0 of comp `fx|<match name>`.

Check in After Effects 2026, per file:
1. It opens without warnings.
2. Layer L ▸ Effects ▸ the effect ▸ Compositing Options ▸ Effect Opacity reads 37 %.
3. Render frame 0 of the comp and compare with `<name>.ec.png` (expected within a few levels).

Write results to readback/effect-opacity.json next to this folder.
