Title: aep import: Essential Properties and the values instances override

Branch: geterothis:fix/aep-import-essential-properties (two commits on upstream main cd9ee1e4)
Compare: https://github.com/storytold/effectcraft/compare/main...geterothis:effectcraft:fix/aep-import-essential-properties

Stacked on #3853, this PR's change is only the last commit. Open it after #3853 is merged, or review only the last commit.

## What

An After Effects composition's Essential Properties were not imported (#3853 only reports them). Every precomp layer of such a composition showed the composition's own values instead of the ones it overrides. In the corpus file `17_essential_graphics` (After Effects 2026), three instances of a badge template with different rotation, opacity, scale, colour and title all rendered the same.

## Format

Decoded from that file and recorded in `docs/aep-format.md` 3.12c:

- The composition item holds `LIST CIFO`, `CIF2` and `CIF3`. Each holds the template name and one `LIST CCtl` per control.
- A control holds:
  - its name;
  - a UUID;
  - `CTyp`;
  - one `LIST CPrp` per driven property, which gives the layer id (`CLId`) and a JSON path of match names and indices from the layer.
- Every layer has `tdmn "ADBE Layer Overrides"`, `LIST OvG2` and `LIST tdgp` in its root group.
  - On a precomp layer of a composition with controls, `OvG2` lists the control UUIDs.
  - The `tdgp` holds one property record per control in the same order. `tdsb` is 1 when the instance overrides the value and 0 when it follows the composition.
  - Values are in the property's stored units: static, keyed, or a text document for Source Text.

## Change

- New `crates/aep/src/import/essential.rs`:
  - reads the controls (the fullest `CIF` list) and the JSON paths;
  - resolves a path to the project property:
    - Transform Position, Scale, Rotation X/Y/Z and Opacity;
    - Source Text;
    - shape fill and stroke colour and opacity, stroke width, group transform, rectangle and ellipse size and position, and roundness, checked against the item type at each index;
  - reads a precomp layer's override records by UUID.
- `build.rs`:
  - `build_layers` returns its After Effects layer id map.
  - A third pass sets `Comp::essential`. Control ids are allocated from `next_id`. A Scale control becomes a uniform Scale control, and further `CPrp` entries become links.
  - The pass then runs `essential::sync_project` to build the instances' groups.
  - Finally it writes each overridden value (static via the import `Kind`, keys via `import_keys`, the expression, Source Text via `text_doc`) into the instance's group and marks it overridden.
  - `report_essential_graphics` is removed. Each control that can't be mapped is now reported with its name and the reason: an effect parameter, Anchor Point, Orientation, a missing layer, a shape item not found at its place, or no property. Overrides that can't be paired with an imported control are reported too, and so are Source Text keyframes of an override (the first text is imported).
- `ImportReport.imported.essentialProperties` counts the controls (`serde(default)`).
- `serde_json` moves from dev-dependencies to dependencies of `effectcraft-aep`. It was already in the workspace and already used by `effectcraft-effects` and `effectcraft-keyframe`.
- `docs/aep-import.md` and `docs/aep-format.md` are updated.

## Tests

- New `tests/it/import/essential.rs` on the committed `synthetic.aep`, with the chunks After Effects writes added:
  - controls on `C`, and a second composition holding `C` as a precomp layer that overrides one value.
  - `controls_become_the_compositions_essential_properties`: names, order, the driven layer and property, and Scale shown as Scale.
  - `a_precomp_layer_keeps_the_values_it_overrides`: Opacity overridden to 30 %. Scale is not overridden and keeps the composition's value. Only the overridden one is marked.
  - `what_cannot_be_imported_is_reported`: an effect parameter, a missing layer, a control without a property, a shape path on a solid layer, and an override of an unmapped control.
  - `a_composition_without_controls_has_no_essential_properties`.
- The first three tests fail without the change (no Essential Graphics is imported).
- A unit test for the JSON path reader covers key order, gaps, a missing match name, an index past u32, and malformed JSON.
- The old test `essential_properties_are_reported_not_dropped_silently` from #3853 is removed: its controls drive no property, which is now a per-control report covered above.
- `cargo test -p effectcraft-aep` with the corpus (`EFFECTCRAFT_AEP_FIXTURES_REQUIRED=1`): all passed. Clippy (`-D warnings`) and `cargo fmt --check` are clean.
- Corpus file `17_essential_graphics` (not in the upstream corpus):
  - all 5 controls import with no Essential Graphics loss;
  - the two overriding instances get 4 and 5 overrides, including keyed rotation and scale and the title text;
  - rendered with the CLI against the After Effects 2026 reference (7 frames), the mean difference falls from 21.9 to 2.2 of 255, and pixels more than 24 off fall from 22 % to 2.1 %.
- I did not run the full `cargo xtask ci`.

Not covered yet: controls driving effect parameters (the most common other target), Anchor Point and Orientation, Font controls, Media Replacement, comments and groups in the panel, and .aep export of Essential Properties (export still reports them).
