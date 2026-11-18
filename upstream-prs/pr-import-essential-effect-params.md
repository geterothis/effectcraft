Title: aep import: Essential Properties on effect parameters

Branch: geterothis:fix/aep-import-essential-effect-params. HELD: stacked on the Essential Properties import (dfca78f7), which is stacked on #3853. This PR's change is only the last commit (0fa94c9c).

## Problem

Essential Properties controls on effect parameters were reported as "not supported", and an instance's overrides of them were dropped. Templates usually expose Slider, Checkbox and Colour controls, so every instance rendered with the master's values: the wrong colours and the wrong elements shown or hidden.

## What After Effects stores

Checked with a project saved by After Effects 2026 (26.5) that has controls on a Fill colour, a Slider Control, a Checkbox Control, Position and Source Text, with every control overridden on one instance:

- The control's JSON path is `ADBE Effect Parade` > the effect (its 0-based place on the layer) > the parameter, whose `index` is its `parT` index (Fill Color: `ADBE Fill-0002`, index 3).
- The override record is the parameter's own record: a colour as ARGB 0..255, a slider as stored, a checkbox as 0 / 1, static or keyed.

## Change

- `import/essential.rs` `resolve`: an `ADBE Effect Parade` path finds the effect at its place, checks that the effect type there matches (an effect the import skipped would shift the places), and maps the parameter through the effect table. The table's conversion is used for colours, checkboxes, angles and number sliders. Point, popup and layer parameters are still reported.
- `docs/aep-import.md`, `docs/aep-format.md` 3.12c: the change, and the effect step of the path.

## Tests

- New `import::essential::controls_on_effect_parameters_and_their_overrides_are_imported`. On the committed synthetic project, controls on Glow's Color A and Radius become the composition's controls, and an instance's overrides arrive with the right values. A popup control and an effect at the wrong place are reported. It fails without the change.
- `cargo test -p effectcraft-aep` (423 + 90 passed), clippy (`-D warnings`) and fmt pass for the crate. I did not run the full `cargo xtask ci`.
- The After Effects lab project imports without an Essential Graphics loss. All five overrides arrive, including the slider's two keys. EffectCraft's render of the instance composition matches After Effects' frames 0 and 30: overridden background colour, checkbox-hidden element and overridden text. The only difference is the text font, which is not installed on the test machine.
