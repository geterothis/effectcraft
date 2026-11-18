Title: aep export: write one layer of a Photoshop file

Branch: geterothis:fix/aep-export-psd-layer (based on upstream main cd9ee1e4, two commits)

## Problem

A footage item that is one layer of a Photoshop file (After Effects' "Import as Footage, choose layer") was not exported: the item and every layer using it were dropped with "one layer of a layered file is not exported". A real After Effects 2026 project (private, not attached) loses two such items and their layers.

## What After Effects stores

Checked with a layered PSD generated for the test (two layers, imported cropped and at the document's size, plus the merged file) and saved by After Effects 2026:

- the layer index (big-endian, -1 for the merged image) at `opti@14` and `sspc@192`;
- `sspc@199`: 0 for a cropped layer, 1 for a layer at the document's size;
- the layer name at `opti@344` and as the item's first `Utf8` after `sspc` in its `Pin`. The `Pin` name is required: without it After Effects opens the project but marks the item as missing footage;
- the layer id (`sspc@188`), the layer bounds (`opti@78..94`) and the byte count (`sspc@209`) may be zero: After Effects reads them from the file.

## Change

- `export/footage.rs`: `FootagePlan` carries an optional `PsdLayerPlan` (index, name, document size). A plain layer of a `.psd` still is planned and written as above. A smart object's embedded file, a placed layer, and an index that does not fit 32 bits are still reported.
- `export/report.rs`, `docs/aep-export.md`: the `FootageItems` description and the change line.

## Tests

- New `export::footage::one_layer_of_a_photoshop_file_is_written`: the exported item stores the index and name in `opti`, the index and size flag in `sspc`, and the name in the `Pin`.
- New `export::footage::a_smart_object_layer_is_reported`.
- `cargo test -p effectcraft-aep` (420 + 90 passed), clippy (`-D warnings`) and fmt pass for the crate. I did not run the full `cargo xtask ci`.
- After Effects 2026 (26.5): the lab project was imported into EffectCraft and exported with this change. After Effects opens the export, all seven footage items resolve, and both test compositions render identically to the After Effects originals (max pixel difference 0).

## Not matched

- Smart-object and placed layers are still reported, as before.
- EffectCraft's own importer reads an exported layer item (zero bounds) back as the merged image, with a reported loss. After Effects → EffectCraft → After Effects keeps the layer.
