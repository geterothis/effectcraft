Title: aep export: write Mask Opacity and Mask Expansion keys

Branch: geterothis:fix/aep-export-mask-keys (based on upstream main cd9ee1e4)

## Problem

The .aep exporter wrote keys on a mask's Path and Feather, but not on its Opacity or Expansion. It reported "keys on Mask opacity/expansion are not written (no keyed prototype)" and wrote only the static value, so an animated mask fade or grow became static in After Effects.

## Change

- `export/masks.rs`: `plan_feather_keys` becomes `plan_mask_keys`, driven by a small `KeyUnit` (components, stored unit, valid range) for Feather, Opacity and Expansion. Opacity keys are stored as fractions with their ease speeds scaled the same way, which is the inverse of what the importer reads (`Kind::MaskOpacity`). Keyed Opacity and Expansion records are built from the same record specs as the static ones. `keyed_feather` becomes a generic `keyed(proto, dims, keys)` with 8 + 40 × components bytes per key.
- `export/report.rs` and `docs/aep-export.md`: the Masks loss no longer lists these keys, and the Masks row lists them as written.

## Tests

- New `export::masks::opacity_and_expansion_keys_parse_back`: Bezier, Hold and Linear keys with ease and a label. They are parsed back as After Effects stores them (opacity as a fraction) and imported back unchanged. It fails without the change.
- `what_cannot_be_written_is_reported` now expects 4 mask losses instead of 5, because the opacity keys are written. `same_masks` compares ease on Opacity and Expansion too.
- `cargo test -p effectcraft-aep` (419 + 90 passed), clippy (`-D warnings`) and fmt pass for the crate. I did not run the full `cargo xtask ci`.
- Checked in After Effects 26.5: a file exported with this change has two masks with keyed Opacity and Expansion. Every key time, value, interpolation, ease and label reads back as written. For example, Opacity is 100 → 25 with ease -40 %/s at 50 % and -10 at 33 %, label 2, and an Expansion Hold key is followed by linear keys. `valueAtTime(0.5)` is 25 and 7.5 on the linear masks, as expected.
