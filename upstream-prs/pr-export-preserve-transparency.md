Title: aep export: write Preserve Underlying Transparency

Branch: geterothis:fix/aep-export-preserve-transparency (based on upstream main cd9ee1e4, one commit)
Compare: https://github.com/storytold/effectcraft/compare/main...geterothis:effectcraft:fix/aep-export-preserve-transparency

## What

.aep export reported Preserve Transparency as a lost layer switch and left it off, so the layer drew over transparent areas in After Effects. After Effects 2026 stores the switch in byte 103 of the layer header (`ldta`): 1 when on, 0 when off. #3870 reads that byte on import. This PR writes it.

## Change

- `export/plan.rs`: `LayerPlan.preserve_transparency`. The switch is no longer in the list of unwritten switches.
- `export/emit.rs`: writes `ldta` byte 103.
- `export/report.rs` (`LayerSwitches` doc) and `docs/aep-export.md` no longer list Preserve Transparency.

## Tests

- New `export/built.rs` test `preserve_transparency_is_written_to_the_layer_header`: a layer with the switch on exports losslessly with byte 103 = 1, and the layer below it gets 0. Without the change, the export reports a loss.
- `unwritten_layer_switches_and_off_frame_times_are_reported` no longer sets Preserve Transparency and now expects two switch losses.
- `cargo test -p effectcraft-aep` with the corpus: all passed. Clippy (`-D warnings`) and `cargo fmt --check` are clean.
- I did not run the full `cargo xtask ci`. The read-back of an exported file in After Effects is pending.
