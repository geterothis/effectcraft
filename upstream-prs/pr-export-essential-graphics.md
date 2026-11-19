Title: aep export: Essential Graphics controls and instance overrides

Branch: geterothis:fix/aep-export-essential-graphics (one commit on main 67942cda)

## Problem

The exporter dropped Essential Graphics and reported it under `composition_options`. A composition exported with Essential Properties lost its template in After Effects. Its instances fell back to the composition's values and lost every override, such as a changed title or opacity.

## Change

New `export/essential.rs` writes Essential Graphics as After Effects 26.5 stores it (aep-format.md 3.12c).

In the composition item, before its guides, it writes `LIST CIFO`, `CIF2` and `CIF3`. One control holds:
- its name and a UUID made from the composition and the control;
- `CTyp`, the value and the default;
- Opacity's slider range;
- Scale's lock and dimensions;
- the text control's text, font and size;
- the composition id, layer id and JSON path of each property the control drives.

`CIFO` keeps only slider, checkbox, colour and text controls, as every After Effects sample does.

On each precomp layer of such a composition, it writes `ADBE Layer Overrides` before `ADBE Layer Sets`:
- `OvG2` with the control UUIDs;
- one record per control, with `tdsb` 1 where the instance overrides the value and 0 where it follows the composition;
- the value in the property's stored unit. Source Text is written as a text document.

What is written:
- controls on a layer's Anchor Point, Position, Scale, Rotation and Opacity;
- controls on a text layer's Source Text, including the further properties a control drives.

What is reported under `composition_options` and left out:
- controls on effect parameters or shape properties, and a nested instance's Essential Properties;
- comments, mirrors and Media Replacement;
- a panel group, whose controls are written flat;
- keyframes and expressions on an override. The first key's value is written.

The lists stay consistent between the composition and its instances.

Other changes:
- `export/plan.rs`: `CompPlan.essential` and `LayerPlan.overrides`, and a pass after the children are planned that pairs each instance with its composition's controls.
- `export/emit.rs`: inserts the lists and the overrides.
- `export/text.rs`: `plan_doc` is `pub(crate)` so the Source Text override reuses it.
- `docs/aep-export.md`: an Essential Graphics row and the `composition_options` entry.

## Tests

- New `export::essential::controls_and_overrides_are_written`. The synthetic project is:
  - a composition with a template of five controls (opacity slider, rotation angle, position point, scale, title text) and a comment;
  - two instances, one overriding opacity and the title.

  The test parses the exported bytes and checks:
  - the `CIFO` / `CIF2` / `CIF3` contents and their order;
  - the control types and values;
  - the overrides with their `tdsb` flags;
  - that the comment is reported.

  It fails without the change.
- `cargo test -p effectcraft-aep` (419 passed), `cargo clippy -p effectcraft-aep --all-targets -- -D warnings` and `cargo fmt --check` pass locally. I did not run the full `cargo xtask ci`.
- After Effects 26.5 (fresh process), with an export of that project:
  - It opens with no dialog.
  - The Essential Graphics template keeps its name, with the five controls in order and with their values.
  - Each instance lists the five Essential Properties, and each one's `essentialPropertySource` resolves to the right property of the composition.
  - The instance that overrides shows the box at 25 % with its own title; the other follows the composition (80 %).
  - Frames render as expected.
- After Effects saves the project, provided the solid header fix is applied (separate PR, "aep export: write the solid opti header After Effects needs to save the project"). The copy it saves imports back into EffectCraft the same as the original export.
