Title: essential: an outer instance's value on a nested instance's Essential Property renders

Branch: geterothis:fix/essential-nested-control-render (two commits on upstream main cd9ee1e4: the fix, then the review follow-up for Font controls and panel groups)

## Problem

A composition's Essential Graphics control can be a property of a nested instance's Essential Properties (`essential.addProperty` with the path `essential/eg<id>` on a precomp layer). When an instance of the outer composition set that control, `with_overrides` wrote the value into the nested instance's Essential Property. But the nested instance renders only the values it lists as overridden, so the value was ignored, and the nested composition rendered with its own value.

## Change

- `project/src/essential.rs` `with_overrides`: when a control's target is a property of a layer's Essential Properties group, it is also marked overridden there, so the nested instance renders it. This holds for a Font control too, and for a property inside a panel group of the nested instance (found by UID anywhere in the group, `mark_nested_override`).

## Tests

- New `engine::tests::essential_more::a_control_on_a_nested_instances_essential_property_renders_its_value`: Title's solid Opacity is a control, Mid nests Title and exposes that instance's Essential Property as its own control, and an instance of Mid sets it to 25. The nested instance takes 25 and counts it as overridden. It fails without the change.
- New `a_control_on_a_nested_instances_grouped_essential_property_renders_its_value`: the same, with Title's control inside a panel group. New `a_font_control_on_a_nested_instances_essential_property_counts_as_overridden`: a Font control on the nested instance's Source Text property sets the font and counts as overridden. Both fail without the follow-up commit.
- `cargo test -p effectcraft-project` (68 passed), the engine's Essential Graphics tests (16 passed), clippy (`-D warnings`) and fmt for both crates. I did not run the full `cargo xtask ci` or the whole engine suite.
- Seen in an After Effects 2026 project with a control passed up through a nested composition (imported with the Essential Properties import work). With this change, EffectCraft's frame of the outer composition is identical to After Effects' frame. Without it, the outer instance's overrides of the nested controls were missing.
