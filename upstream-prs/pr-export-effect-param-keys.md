Title: aep export: write keys on effect angles, checkboxes, popups and integer sliders

Branch: geterothis:fix/aep-export-effect-param-keys (based on upstream main cd9ee1e4)

## Problem

The .aep exporter wrote effect keys only on colours, points and fixed or float sliders. Keys on an angle, checkbox, popup or integer slider were reported as "not written (not sampled)", and only the first key's value was written. An animated Fractal Noise Evolution, a common way to animate noise, came out static in After Effects.

## What After Effects does (measured)

An After Effects 26.5 project has keys on Fractal Noise's Evolution, Invert and Fractal Type, Directional Blur's Direction and Mosaic's Horizontal Blocks. Each parameter stores its keys like a fixed slider's: one-component 48-byte records with the value as After Effects shows it (degrees, a 1-based popup item, 0 or 1 for a checkbox, the integer). A bezier Evolution key carries its ease in degrees per second. After Effects held every checkbox and popup key, on both sides, although the script set them linear.

## Change

- `export/effects.rs`: the early return that wrote only the first key is removed. Angle, integer, popup and checkbox keys use the keyed record of a fixed slider (the static and keyed records differ in the same `tdb4` bytes for all of them). Angles and integer sliders keep their bezier ease. Checkbox and popup keys are written Hold, as After Effects holds them.
- `docs/aep-export.md`: the Effects row lists these keys, and the loss is removed from the `effects` row.

## Tests

- New `export::effects::keys_on_angles_checkboxes_popups_and_integer_sliders_are_written`: Fractal Noise with keyed Evolution (one bezier side), Invert, Fractal Type and Cycle. The test checks the written records (times, values, interpolation, a popup item counted with After Effects' separator) and imports them back. It fails without the change.
- `cargo test -p effectcraft-aep` (419 + 90 passed), clippy (`-D warnings`) and fmt pass for the crate. I did not run the full `cargo xtask ci`.
- Checked in After Effects 26.5: a file exported with this change opens with every key as written. Evolution reads 0 → 720 → 90 with the bezier side at -100 °/s and 50 %. Invert reads off → on and Fractal Type Basic → Turbulent Basic, both Hold. Cycle reads 1 → 40 and Direction 0 → 45, both linear. `valueAtTime` gives 360, 21 and 22.5 where expected.

## Not matched

The importer still drops keys on effect checkboxes ("not decoded"), so the round-trip test does not check Invert after import. That is fixed separately.
