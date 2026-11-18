Title: aep import: read keys on effect checkboxes

Branch: geterothis:fix/aep-import-checkbox-keys (based on upstream main cd9ee1e4)

## Problem

The importer dropped every key on an effect checkbox ("the keyframes of parameter … are not imported (not decoded), default used"). The checkbox then kept its default for the whole layer. For example, a Fractal Noise whose Invert switches on at 1 s stayed off. The same happened to checkboxes of placeholder effects ("not kept").

## What After Effects does (measured)

In an After Effects 26.5 project with Fractal Noise's Invert keyed off at 0 s and on at 1 s, the record holds one-component 48-byte keys, like a slider's, with the value 0.0 or 1.0. Both sides of every key are Hold: After Effects holds checkbox keys on its own, even when a script sets them linear.

## Change

- `import/effects.rs` and `import/placeholder.rs`: the early return for keyed checkboxes is removed. The keys go through `import_keys` like any other parameter's: `Kind::EffectBool` already turns a value into `Value::Bool`, and `ease_decoded` already gives checkboxes no ease.
- `docs/aep-import.md`: the change line, and the Exposure Bypass note.

## Tests

- New `import::checkbox_keys`: a mapped checkbox (Fractal Noise's Invert) and a placeholder checkbox (CC Cylinder's Wire). Each has two held keys built into `synthetic.aep` with `fx_inject`, laid out as After Effects wrote them. Both tests fail without the change.
- `cargo test -p effectcraft-aep` (420 + 90 passed), clippy (`-D warnings`) and fmt pass for the crate. I did not run the full `cargo xtask ci`.
- Imported the After Effects-saved project locally (not committed): Invert arrives as off → on, both keys Hold, with no loss reported.
