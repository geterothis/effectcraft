Title: aep export: write a 3D layer's X / Y Rotation and Orientation

Branch: geterothis:fix/aep-export-3d-rotation (one commit on main cd9ee1e4).

Supersedes #3851 (which only reports a static X / Y Rotation as a loss). Close #3851 when this one is opened.

## Problem

The `.aep` exporter didn't write a 3D layer's X Rotation, Y Rotation or Orientation. The layer kept the inert default records, so After Effects showed the layer unrotated. Orientation was reported under `transform_properties`. X / Y Rotation weren't even reported, because `is_non_default_extra` matched `rotation_x` / `x_rotation` while the project's ids are `rotationX` / `rotationY` (the bug #3851 reports).

## Change

- `export/plan.rs`: `PropKind` gains `RotationX`, `RotationY` and `Orientation`. They are planned like the five Transform properties (static value, keys, eases, expression) for a 3D layer, a camera or a light. `ALL` stays the five whose prototypes the template holds, and `prototype()` maps X / Y Rotation to Rotation's. On a 2D layer they have no effect in After Effects, so nothing changes there: a set Orientation is still reported.
- `export/emit.rs`:
  - X / Y Rotation are written from Rotation's record prototype under their own match names.
  - `build_orientation` writes Orientation as After Effects 2026 does in the lab sample. That is an `otst` with a `tdbs` (class `0x00060007`; `tdb4` byte 5 7 / 6, byte 79 1 / 0 for static / keyed) and an `otky` with one `otda` (three big-endian degrees) per key. The static degrees also go little-endian into the `tdbs` `cdat`. Keyed Orientation uses 80-byte records (the spatial layout with one component, flags 0x0001, the ease at 24..56).
  - A match name missing from the layer's Transform group gets a proper `tdmn` instead of an empty one.
- `export/template.rs`: the prototype match covers the new kinds.
- `export/report.rs`, `docs/aep-export.md`: what is written and what is still reported.

## Tests

- New `export::objects::a_3d_layers_x_y_rotation_and_orientation_are_written`: a 3D layer with X 30, Y -45, Orientation [10, 20, 30], and one with X and Orientation keyed at 0 s and 1 s. The export is lossless and the reimport gives the same values and linear keys. It fails without the change.
- New `export::objects::a_2d_layers_orientation_is_not_written`: on a 2D layer, Orientation is still reported and not written.
- `cargo test -p effectcraft-aep` (420 + 90 passed), clippy (`-D warnings`) and fmt pass for the crate. The external fixture corpus wasn't available, so the fixture tests (for example `camera_fixtures_come_back_without_a_loss` with 537, X Rotation 30) didn't run here. I did not run the full `cargo xtask ci`.
- After Effects 2026 lab project (static X 30 / Y -45 / Z 10 / Orientation [10, 20, 30] on one 3D solid; X and Orientation keyed linear on another), imported into EffectCraft and exported:
  - After Effects opens the export with no dialog.
  - Its readback matches the original exactly.
  - Orientation at 0.25 / 0.5 / 0.75 s ([0, 22.5, 0], [0, 45, 0], [0, 67.5, 0]) and X Rotation at 0.5 s (45) match.
  - Frames 0, 12 and 25 are pixel-identical to the original project's.
