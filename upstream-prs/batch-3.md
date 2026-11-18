Branch: geterothis:effectcraft:aep-export/batch-3-cc (1 commit, 16fcb47f, on top of aep-export/batch-2 at 77c53de8)
Compare: https://github.com/storytold/effectcraft/compare/main...geterothis:effectcraft:aep-export/batch-3-cc
Note: use aep-export/batch-3-cc, not the older aep-export/batch-3, which is based on batch-2 before its last commit.

Title: .aep import and export: CC Color Offset, CC Threshold RGB, CC Toner, CC Tiler, CC Grid Wipe, CC Scale Wipe

Body:
> Stacked on #3862 (batch 2), which is stacked on #3854 (batch 1). Until they merge, the diff also shows their commits. This PR's own change is only the last commit, 16fcb47f.

## What

EffectCraft has these six CC effects, but the .aep table did not map them, so import reported them as unsupported and export as an effects loss. This adds a row for each to `container/effect_map.rs` and to `export/fx_defs.rs`. The definitions come from projects After Effects 26.5 saved, listed the same way as batches 1 and 2.

- Conversions: CC's 0..1 sliders (Blend w. Original, Tiler's Scale, Grid Wipe's Completion) are `Percent { valid_max: 1.0 }`, and Threshold RGB's thresholds are a 0..1 fraction of EffectCraft's 0..255. The popups (Color Offset's Overflow, Toner's Tones, Grid Wipe's Shape) map by item name; Toner's Solid has no counterpart. Colours, points, angles and checkboxes use the existing conversions. Toner's parameters are stored out of id order, and the rows follow the stored order.
- Ranges narrower than After Effects' are declared with `pm_limited`: Tiler's Scale (from 1), Grid Wipe's Border (to 100) and Scale Wipe's Stretch (from 0).
- Docs: aep-import.md gets the block's parameter list, and aep-export.md lists the six effects.

## Tests

- `tests/it/export/effect_table.rs` covers the six effects. It changes every mapped parameter, exports, checks the byte-for-byte write-back, imports again and compares. `import::effects` now expects 82 mapped effects (was 76).
- `cargo test -p effectcraft-aep` passes with the pinned corpus. `cargo clippy -p effectcraft-aep --all-targets -D warnings` and `cargo fmt` are clean. I didn't run the full `cargo xtask ci` and am relying on CI for the rest.
- After Effects 26.5 read-back of the exported files: all six open without warnings, and every parameter reads back as set (Compositing Options aside, which EffectCraft writes at their defaults). Color Offset, Threshold RGB, Toner, Tiler and Scale Wipe render within 2/255 of After Effects' frames. Grid Wipe differs only by the sample's Effect Opacity of 37 %.
