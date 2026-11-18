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

## Part 2: which stored field After Effects needs (after the footageMissing result)

Three copies of the export, each with fields copied into the six layer items from After Effects'
own items (`lab/psd-layers/psd_layers_zeroed.aep`):
- `psd_layers.effectcraft.v1_opti_header.aep`: `opti` bytes 12..49 (the Photoshop header block:
  signature, channels, document size, depth, mode).
- `psd_layers.effectcraft.v2_opti_dims_only.aep`: only `opti` 32..39 (the document size).
- `psd_layers.effectcraft.v3_opti_header_and_sspc.aep`: v1 plus `sspc` 63, 64, 65, 73, 79, 201, 212.

For each, open it (no Save As) and print `footageMissing` of every footage item; render frame 0 of
both layer comps for the first variant whose layer items are all found
(`<variant>_cropped.png`, `<variant>_document.png`) and compare with the originals. Results in
`roundtrip/psd-layer/variants.json`.

## Part 3

v1-v3 did not help. After Effects' layer items also store the layer's name in the first `Utf8` of
`Pin` (the export leaves it empty). Two more copies of the export:
- `psd_layers.effectcraft.v4_pin_name.aep`: that `Utf8` set to the layer name.
- `psd_layers.effectcraft.v5_pin_name_and_mtime.aep`: v4 plus `sspc` 118..121 copied from After
  Effects' items (looks like the file's modification time).
Same as part 2: `footageMissing` per item, render the first variant whose layer items resolve and
compare with the originals. Results in `roundtrip/psd-layer/variants2.json`.
