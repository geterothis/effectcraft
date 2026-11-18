Title: aep import: Separate Dimensions arrive as X, Y and Z Position

Branch: geterothis:fix/aep-import-separate-dimensions (one commit on main cd9ee1e4).

## Problem

When a layer's Position has Separate Dimensions on, After Effects keeps the values (and keys) in `ADBE Position_0/1/2`, and the `ADBE Position` record's `tdsb` has bit `0x800` (After Effects 2026 writes `0x803`; an After Effects sample with one 2D and one 3D separated layer and one that is not). The importer listed these records in `IGNORED`. It reported them under `transform_properties` as soon as they held a value, and the layer stayed at the stale combined Position stored in `ADBE Position`. So it stood in the wrong place and lost its per-axis animation.

## Change

- `import/props.rs`: `import_separated_position` runs after `import_transform` when Position has the `0x800` bit. It inserts `positionX`, `positionY` and `positionZ` (Z three-D only) after `position`, the properties `prop.separateDimensions` makes. Each gets its static value, or its keys (`Kind::Number`) and expression. The renderer already reads Position from them. `report_other_properties` no longer reports those records on a separated Position. If the transform group already has `positionX` or has no `position`, the dimensions are reported instead.
- `import/build.rs`: the call.
- `import/report.rs`, `docs/aep-import.md`.

## Tests

- New `import::separate_dimensions::separated_position_dimensions_are_imported`: an exported one-layer project is patched to set Position's `tdsb` to `0x803` and X / Y to 33 / 44. The import gives `positionX` 33 and `positionY` 44, then `positionZ` (three-D only), right after `position`, with no `ADBE Position_` loss. It fails without the change.
- New `import::separate_dimensions::a_position_that_is_not_separated_stays_one_property`.
- `cargo test -p effectcraft-aep` (420 + 90 passed), clippy (`-D warnings`) and fmt pass for the crate. I did not run the full `cargo xtask ci`.
- After Effects 2026 sample through `effectcraft-cli`, with no losses:
  - layer A (2D): X keyed 10 → 90 linear, Y 40;
  - layer B (3D): X 20, Y keyed 0 → 50 bezier (influence 75 %), Z keyed 0 → -100 linear.

  Every value, key time, interpolation and ease matches After Effects' readback.

Export of separated dimensions is not part of this PR: the exporter still reports keyed X / Y / Z Position under `transform_properties`.
