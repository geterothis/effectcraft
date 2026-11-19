Title: AEP import: stroke Dashes, Taper and Wave

Branch: geterothis:fix/aep-import-stroke-options (on main 67942cda)

## Problem

A shape stroke's Dashes, Taper and Wave were not imported. Any .aep that used them reported "stroke dashes/taper/wave not imported" as a loss, and the stroke rendered solid, untapered and straight. Tapered streaks and dashed outlines are common in motion-graphics templates.

## What After Effects writes

Checked in After Effects 26.5, each project in a fresh process:

- **Dashes.** Dash 1 to Gap 3 and Offset are always written, at 10 when unused. Only the ones that hold a value of their own (the "+" button added them, or the user set them) are in use.
- **Taper.** Length Units 1 is Percent and 2 is Pixels. Lengths in percent are in `Start Length` / `End Length`; lengths in pixels are in `StartWidthPx` / `EndWidthPx`, despite the names. Start/End Width default to 0 %, and a default width has no value of its own in the file.
- **Wave.** Units 1 is Pixels (Wavelength) and 2 is Cycles, the same order as EffectCraft's popup. Amount, Wavelength, Cycles and Phase map one to one.

## Change

`crates/aep/src/import/shapes.rs`, `stroke_common`: the loss loop is replaced by `stroke_dashes`, `stroke_taper` and `stroke_wave`.

- Dashes: imports each Dash/Gap pair in use, adding Dash 2/Gap 2 and Dash 3/Gap 3 (`build::EXTRA_DASHES`) before Offset when needed, and Offset when it is set. Unused pairs stay off, since EffectCraft treats Dash 0 as no dashes.
- Taper: presets both widths to 0 (After Effects' default; EffectCraft's is 100), maps the units, and reads the lengths from the pair that matches the units, plus widths and eases.
- Wave: units, amount, wavelength, cycles and phase.

A loss is still reported if the stroke has no matching EffectCraft group.

## Tests

- `import::stroke_options` (3 tests): each builds a shape-layer project, exports it, fills the stroke's Dashes, Taper or Wave group with values the way After Effects stores them, re-imports it and checks the values. They cover dashes in use and unused, taper in percent and in pixels, and a wave. All three fail on main with the loss report.
- `tests/it/export.rs`: `helpers` is now `pub(crate)` so the import tests can build projects with it.
- `cargo test -p effectcraft-aep`: all passed. `cargo clippy -p effectcraft-aep --all-targets -- -D warnings` and `cargo fmt --check` are clean. I did not run the other crates' tests or the full `cargo xtask ci` locally.
- Rendered against After Effects: dashes match; taper is within After Effects' 2 px quantisation. The wave's period matches, but its phase and depth differ from After Effects in the renderer. That is a separate renderer issue and not part of this change.
