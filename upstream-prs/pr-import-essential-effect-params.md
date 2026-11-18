Title: aep import: Essential Properties on effect parameters, Anchor Point and nested compositions

Branch: geterothis:fix/aep-import-essential-effect-params. HELD: stacked on the Essential Properties import (dfca78f7), which is stacked on #3853. This PR's change is only the last three commits (0fa94c9c, f21804f0, 182fad5b).

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

## Second commit (f21804f0): nested compositions, Anchor Point, per-control pairing

Seen in a real (private) After Effects 2026 resize template: 8 of 19 controls were reported with "its layer was not imported", one Anchor Point control as not supported, and every instance's override list was dropped ("12 override values for 19 controls"). Its anonymised structure, and an After Effects 2026 lab project built the same way (Inner → Mid → Top), show:

- `CPrp`'s `CCId` is the item id of the composition that holds the layer `CLId`. A control added from a nested composition's layer names that layer in the inner composition. The control drives the Essential Property of the instance that shows it, which needs the inner composition's own control for the same property.
- A panel group (`CTyp` 10, `StVc`, `CSGe`, no `CPrp`) is listed in an instance's `OvG2` but has no entry of its own at the top of the override group (see the third commit for where its controls' entries are).
- An Anchor Point control (`CTyp` 5) and its overrides are stored like the layer's Anchor Point record.

Change:
- `import/build.rs`: controls are resolved in rounds, one per nesting level (at most 16). A target in another composition resolves to the Essential Property of the instance here whose composition's control drives it. The groups are synced after each round, and once more after the overrides, so an outer instance that follows its composition shows the inner override. Panel groups are not reported.
- `import/essential.rs`: `Target.comp` (`CCId`); overrides pair per `tdmn` entry and skip panel groups; an entry with an unknown record is reported per control instead of dropping the list; Anchor Point resolves with the layer's own unit (camera and light still reported).
- Docs: `aep-import.md`, `aep-format.md` 3.12c (`CCId`, `CTyp` values, panel groups).

Tests: new `a_control_passed_up_from_a_nested_instance_drives_its_essential_property` and `an_anchor_point_control_takes_the_layers_unit`, plus a panel group test (renamed and extended in the third commit). They fail without the change. `what_cannot_be_imported_is_reported` no longer expects a loss for a panel group. `cargo test -p effectcraft-aep` (426 + 91 passed), clippy and fmt pass.

After Effects lab (`essential_nested.aep`): no Essential Graphics loss. Mid's four controls and every override of both levels arrive. With the renderer fix in fix/essential-nested-control-render, EffectCraft's frames of Mid and Top are identical to After Effects' (0 % of pixels differ, transparency flattened on black).

## Third commit (182fad5b): nested compositions without controls, panel group overrides

The same template still lost 8 controls ("its layer is in a nested composition whose instance here does not pass it on") and every instance's overrides ("13 override values for 18 controls"). Its anonymised structure and a second After Effects 2026 lab project (`essential_direct.aep`: Mid's controls name layers in Inner and in Deep, two levels down, and neither has controls of its own) show:

- A template control can name a layer at any depth of nesting directly. The nested compositions then have no controls, and their instances have no overrides.
- A panel group's entry in an instance's override group is `tdmn "ADBE Layer Overrides Group"` and a `LIST tdgp` holding the entries of the controls in the group. In the template's `CIF3`, those controls follow the group, listed flat.

Change:
- `import/build.rs`: when no instance here passes the property on, a control with the outer control's name is added to the nested composition that holds the layer, and to each composition between it and this one, one level per round, so the property is passed up the usual way. Every instance on the way is driven (the first as the main property, the others as links). Added controls are not counted in `imported.essentialProperties`. A control waits while one of its targets may still resolve, and the last round takes what resolved. The instance-override import and the installation of the controls moved to their own functions.
- `import/essential.rs`: `override_entries` reads a panel group's nested `tdgp` in its place, at most 16 deep.
- Docs: `aep-import.md`, `aep-format.md` 3.12c.

Tests: new `a_control_on_a_nested_layer_is_passed_up_when_the_nested_composition_has_no_controls`, and `a_panel_comment_has_no_override_entry` became `a_panel_group_holds_the_entries_of_its_controls` (Opacity inside the group, Scale after it). Both fail without the change. `cargo test -p effectcraft-aep` (427 + 91 passed), clippy (`-D warnings`) and fmt pass for the crate. I did not run the full `cargo xtask ci`.

After Effects lab (`essential_direct.aep`): no Essential Graphics loss, and every override of the three Top instances arrives. With the renderer fix in fix/essential-nested-control-render, EffectCraft's Mid frame is identical to After Effects'. Top matches in every overridden position, scale, anchor and opacity. The only differences are one edge row of a scaled solid and two 2-pixel white columns that After Effects draws beside the bar, which are unrelated to Essential Properties.
