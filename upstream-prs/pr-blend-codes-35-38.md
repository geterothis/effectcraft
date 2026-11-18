Title: aep: Lighter Color, Darker Color, Subtract and Divide blend modes in both directions

Branch: geterothis:fix/aep-blend-codes-35-38 (based on upstream main cd9ee1e4, one commit)
Compare: https://github.com/storytold/effectcraft/compare/main...geterothis:effectcraft:fix/aep-blend-codes-35-38

## What

Layers in Lighter Color, Darker Color, Subtract or Divide mode lost their mode in both directions:
- Import reported "blend mode code 35..38" and gave the layer Normal.
- Export reported the mode and wrote Normal.

EffectCraft renders all four modes. Only the codes were missing from the tables (the comment said "codes above 34 (not sampled)").

The codes come from an After Effects 2026 project whose 31 layers were each set to a blend mode by name with the scripting API (`layer.blendingMode = BlendingMode.SUBTRACT` and so on). The file stores Lighter Color as 35, Darker Color as 36, Subtract as 37 and Divide as 38 in `ldta` byte 99.

## Change

- `import/build.rs` `blend_code`: 35 Lighter Color, 36 Darker Color, 37 Subtract, 38 Divide. The comment says where the codes come from.
- `export/plan.rs` `blend_code`: the same four codes.
- `docs/aep-format.md` (the blend mode row of 3.1) and `docs/aep-import.md` (`blend_modes` lists the codes still reported, 0, 1, 3, 21, 22 and above 38, and says that cameras and lights are not counted) are updated.

## Tests

- `import/blend_modes.rs` `the_codes_of_907_map_to_their_modes`: codes 35-38 are written into 906's top layer and import losslessly as the four modes. `unsampled_and_ambiguous_codes_stay_reported` now uses 39 in place of 35.
- New `export/built.rs` test `the_newer_blend_modes_are_written_with_their_codes`: four layers in these modes export losslessly. The file holds codes 35-38, and they import back as the same modes. Without the change, the export reports four losses and writes Normal.
- `cargo test -p effectcraft-aep` with the corpus (`EFFECTCRAFT_AEP_FIXTURES_REQUIRED=1`): all passed. Clippy (`-D warnings`) and `cargo fmt --check` are clean.
- That 31-mode project (not in the upstream corpus), imported and rendered with the CLI against the After Effects 2026 render (3 frames): the four cells match. The mean difference over the frame falls from 10.0 to 1.2 of 255 (with the Preserve Transparency fix of #3872 also applied), and pixels more than 24 off fall from 7.8 % to 0.4 %.
- I did not run the full `cargo xtask ci`.

Not changed: code 3, which After Effects writes for both Dissolve and Dancing Dissolve, stays reported.
