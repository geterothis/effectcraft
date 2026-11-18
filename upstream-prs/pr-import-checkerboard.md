Branch: fix/aep-import-checkerboard (based on upstream main 67942cda), two commits.

# .aep import: Checkerboard

## What was wrong

`ADBE Checkerboard` had no row in the import effect table. EffectCraft has Checkerboard (`ec.generate.checkerboard`), but an imported Checkerboard arrived as a placeholder that renders nothing.

## Change

- `crates/aep/src/container/effect_map.rs`: a row mapping every parameter, the same way as Grid's: points in layer pixels, sliders checked against After Effects' valid maximum (4000, 400, 100), and Size From and Blending Mode by item name with Grid's item lists. Parameters 6 and 9 are the Feather twirl-down markers.
- Size From defaults to Width Slider (After Effects index 2). After Effects writes no value record for Size From at its fresh default. A file with three Checkerboards set to Width Slider has no Size From record in any of them. Only one instance has its own definitions; the others borrow them, and those fell back to Corner Point, drawing cells as big as the corner offset.
- `docs/aep-import.md`: the table row and the test list.

## Tests

`crates/aep/tests/it/import/effects_checkerboard.rs`, with Checkerboard built into `synthetic.aep` with the definitions After Effects 26.5 writes:
- the set values;
- the defaults;
- Size From with no record and a default slot of 0. This one fails with Corner Point when the row's default is 1.

Without the row, all three fail because the effect is not imported. `effects.rs`'s count of mapped effects goes from 67 to 68.

## Checked against After Effects

An After Effects 26.5 file has three 320×180 layers, each with 4-Color Gradient, then Checkerboard (Width Slider, Width 40, Opacity 35, Normal), then one more effect. It imports with no losses. Rendered with this branch and with the Motion Tile and Shift Channels import, two layers match After Effects' frames:
- Motion Tile: mean difference 1.3 of 255;
- Shift Channels: mean difference 0.83, max 31 on cell edges.

Without the Size From default, those two layers drew 25.6×14.4 cells instead of 40×40.
