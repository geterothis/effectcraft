Title: aep import: Preserve Underlying Transparency

Branch: geterothis:fix/aep-import-preserve-transparency (based on upstream main cd9ee1e4)
Compare: https://github.com/storytold/effectcraft/compare/main...geterothis:effectcraft:fix/aep-import-preserve-transparency

## What

The importer drops the Preserve Underlying Transparency switch without reporting it. A layer that has it on in After Effects comes in with it off. EffectCraft then draws that layer over the transparent areas below it, where After Effects draws it only over the pixels already there.

The switch is bit 0 of byte 103 of the layer header (`ldta`). I checked this in an After Effects 2026 save with the switch on for a solid, shape, text, precomp and 3D layer and off for the others. It is the only `ldta` byte that differs between the layers with it on and off. The byte holds flags: a second After Effects 2026 sample shows that bit 1 marks Dancing Dissolve, so a Dancing Dissolve layer with the switch on stores 3, and one with it off stores 2.

## Change

- `import/build.rs`: sets `preserve_transparency` from bit 0 of `ldta` byte 103.
- `docs/aep-format.md`: new row for byte 103 bit `0x01` in the layer header table (3.1).
- `docs/aep-import.md`: the Layers row lists the switch.

## Tests

- New test `preserve_transparency_is_imported_from_the_layer_header` in `tests/it/import/synthetic.rs`. It checks that the synthetic file imports with the switch off, then sets byte 103 to 1 and checks that every layer comes in with it on, then sets it to 3 (the switch on a Dancing Dissolve layer) and checks the same, then sets it to 2 (Dancing Dissolve alone) and checks that the switch stays off. It fails without the source change.
- `cargo test -p effectcraft-aep` with the pinned corpus: 90 + 419 passed, 0 failed.
- Clippy (`-D warnings`) and `cargo fmt --check` are clean.
- I did not run the full `cargo xtask ci`.

## Checked against After Effects 2026

I imported a lab project (one solid, shape, text, precomp and 3D layer with the switch on, one solid with it off) with this branch and rendered it with the EffectCraft CLI. The layers with the switch on now draw only over the pixels below them, as in After Effects' render of the same frame. Before the change they also covered the transparent areas.

The alpha over semi-transparent pixels still differs from After Effects (for example 131 against 77 over a 30 % background). That comes from how the renderer composites a layer with the switch on, not from the import, and is not part of this PR.
