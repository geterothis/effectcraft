# Lab job: Photoshop layer items written by EffectCraft (fix/aep-export-psd-layer, e210f189)

ONE headless After Effects 2026 instance, sequential, light load. No Save As (the branch does not
have the solid opti-header fix #3882).

`psd_layers.effectcraft.aep` is `lab/psd-layers/psd_layers.aep` (After Effects' own) imported into
EffectCraft and exported again; before the fix the six layer items and their layers were dropped.
The paths point at `lab/psd-layers/layers_200x100.psd` as in the original.

Please open it and print, for every footage item, name, width, height and `footageMissing`; for
both layer comps each layer's name, source name, position and anchor. Render frame 0 of both layer
comps to PNG (`export_cropped.png`, `export_document.png`) and compare with `orig_cropped.png` /
`orig_document.png` from part 2 (max channel difference). Result in
`roundtrip/psd-layer/result.json` with the PNGs.
