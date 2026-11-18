Branch: geterothis:effectcraft:feat/effect-opacity (1 commit, 9efb9496, on upstream main cd9ee1e4; not stacked)
Compare: https://github.com/storytold/effectcraft/compare/main...geterothis:effectcraft:feat/effect-opacity
Status: DRAFT until the After Effects read-back (test-corpus exports/effect-opacity/) is in.

Title: Effect Opacity on every effect, with .aep import and export

Body:
## What

After Effects blends each effect's result with its input by Compositing Options ▸ Effect Opacity. EffectCraft had no such setting, so an effect set below 100 % in After Effects rendered at full strength after import, and the value was dropped on export.

- `effects`: `instantiate` gives every new instance an Effect Opacity property (`effectOpacity`, 0..100, default 100). `blend_with_input` blends the result with the input over the union of both frames, so the input stays visible where the effect moved pixels. A project saved before this has no property and renders as before.
- `render`: `run_effect_stack` blends by Effect Opacity on the CPU path and skips an effect at 0 %. An effect below 100 % is left out of the GPU run and runs on the CPU.
- `.aep` import: `ADBE Effect Mask Opacity` in the value group's `ADBE Effect Built In Params` group (value, keys, expression) goes to `effectOpacity`.
- `.aep` export: the same record, written only when the value is not 100 % or it is keyed or has an expression, in the layout After Effects 26.5 writes (fixed slider, percent in `cdat`, `tdum` 0, `tduM` 100). `report_unmapped` no longer reports it.
- Docs: aep-import.md and aep-export.md mention it.

## Tests

- `render` `tests/effect_opacity.rs`: a new effect has Effect Opacity 100; Fill blends with its input by the setting; Transform at 50 % keeps the input where the effect moved the pixels.
- `aep` `tests/it/export/effect_opacity.rs`: 37 % is written inside Compositing Options before its end with After Effects' `tdb4` header and imported back; 100 % writes no record; keys and an expression come back. The first and third fail without the `aep` change. `export::effects` now counts four properties on the Tint (its three plus Effect Opacity).
- `cargo test` for effects, render, engine, aep and project passes with the pinned corpus. gpu passes on lavapipe except `opengl_adapters_get_cpu_compositing_at_once`, which needs an OpenGL adapter the machine doesn't have. `cargo clippy --all-targets -D warnings` (effects, render, aep, ui-egui) and `cargo fmt` are clean. I didn't run the full `cargo xtask ci`.
- Against After Effects' frames of 63 effects saved at Effect Opacity 37 %: with the setting now imported, 48 render within 1.5/255 mean without modelling the opacity. The rest differ for reasons in those effects, not in the blend.
