Title: aep export: separated X, Y and Z Position are written

Branch: geterothis:fix/aep-export-separate-dimensions (one commit on main 67942cda)

## Problem

When a layer's Position has Separate Dimensions on, EffectCraft keeps the values and keys in `positionX`, `positionY` and `positionZ`. The exporter did not write them. It reported them under `transform_properties` and wrote only the combined Position, which goes stale once the dimensions are separated. After Effects then opened the layer in the wrong place, with no per-axis animation.

## Cause and fix

After Effects 2026 stores a separated Position like this:
- The values and keys go in `ADBE Position_0`, `_1` and `_2`. These are one-dimensional records.
- The combined `ADBE Position` record's `tdsb` is `0x803`.

The importer already reads this layout (upstream #3684 imports it the same way).

- `export/template.rs`: record specs for `ADBE Position_0/1/2`.
- `export/plan.rs`:
  - X, Y and Z Position are planned like the other Transform properties, with their value or their keys.
  - A dimension at 0 is still written.
  - The combined Position is written as a static value made from X, Y and Z, not from the stale combined value.
- `export/emit.rs`: the combined record gets `tdsb` `0x803` when the dimensions are separated.
- `docs/aep-export.md`: the Transform row.

## Tests

- New `export::separate_dimensions::separated_position_is_written_as_x_y_and_z`. The project has a stale combined Position [10, 10], X 300, Y keyed 40 → 200, and Z 0. The test checks:
  - no `transform_properties` loss;
  - `tdsb` `0x803` on `ADBE Position`;
  - X 300;
  - Y with 2 keys;
  - Z 0.

  It fails without the change.
- `cargo test -p effectcraft-aep`, `cargo clippy -p effectcraft-aep --all-targets -- -D warnings` and `cargo fmt --check` pass locally. I did not run the full `cargo xtask ci`.
- After Effects 26.5 (fresh process), with an export of that project:
  - It opens without warnings, and `dimensionsSeparated` is true.
  - X Position is 300.
  - Y Position has 2 keys: 40 at 0 s, 120 at 0.5 s, 200 at 1 s.
  - Z Position is 0, and frames 0, 12 and 25 render as expected.
- After Effects saves the project, provided the solid header fix is applied (separate PR, "aep export: write the solid opti header After Effects needs to save the project"). The saved copy imports back into EffectCraft with the same X, Y and Z values and keys.
