# aep: Dissolve and Dancing Dissolve blend modes in both directions

Branch: `fix/aep-dissolve-blend-modes` (one commit on main)

## Problem

Layers with Dissolve or Dancing Dissolve imported as Normal (reported as a blend-mode loss), and the exporter wrote both as Normal too. Both modes store blend code 3 at `ldta` byte 99, so the code alone could not tell them apart.

## What After Effects stores

The sample is one comp with two 50 % solids, one in Dissolve and one in Dancing Dissolve, saved by After Effects 26.5 (`dissolve_pair`). Both layers have code 3. Apart from the layer and source ids, their `ldta` differs only in **byte 103**: 0 on the Dissolve layer, 2 on the Dancing Dissolve layer. Corpus `10_blend_modes` (Dissolve only) also has 3 and 0.

## Fix

- Import: code 3 becomes Dancing Dissolve when byte 103 has bit 1 set, otherwise Dissolve (`layer_blend`).
- Export: both are written as code 3, and Dancing Dissolve also sets byte 103 bit 1 (`put_bits`, so other bits of the byte stay as they are).
- Docs: aep-format 3.1, aep-import and aep-export updated.

Note: byte 103 bit 0 is Preserve Underlying Transparency. The open PRs for importing and exporting that switch read and write the whole byte as 1/0. Whichever merges second should treat it as bit 0 so the two flags don't overwrite each other. I'll rebase accordingly.

## Tests

- New `import::blend_modes::code_3_is_dissolve_or_dancing_dissolve_by_the_flag` (906 with the top layer set to code 3, byte 103 = 0 / 2).
- New `export::built::dissolve_and_dancing_dissolve_are_written_with_their_flag` checks bytes 99 / 103 and reads both modes back through the importer.
- `unsampled_and_ambiguous_codes_stay_reported` no longer lists 3 and is renamed `unsampled_codes_stay_reported`. The losses test uses Alpha Add as its unwritable mode instead of Dissolve.
- Both new tests fail without the fix. `cargo test -p effectcraft-aep` with the corpus fixtures (`EFFECTCRAFT_AEP_FIXTURES_REQUIRED=1`), clippy (`-D warnings`) and fmt pass. I did not run the full `cargo xtask ci`.
- Not read back in After Effects yet: an export with both modes (requested).
