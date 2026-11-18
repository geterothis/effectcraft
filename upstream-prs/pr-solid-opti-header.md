# aep export: write the solid opti header After Effects needs to save the project

Branch: `fix/aep-export-solid-opti-header` (one commit on main)

## Problem

After Effects 2026 opens and renders a project exported from EffectCraft, but it **crashes when it saves that project** if the project contains a solid. Null and adjustment layers count, because their source is a solid too. The crash happens on plain File ▸ Save and on Save As, even with no changes.

Found with After Effects 26.5 on minimal exports:

| export | save in AE |
|---|---|
| empty project | saves |
| one composition | saves |
| composition + text layer | saves |
| composition + shape layer | saves |
| composition + solid | **crash** |
| composition + solid + camera + light | **crash** |
| a real project with solids, nulls and adjustment layers | **crash** |

AE's partial save file stops right after the composition item, where it would write the solid item next.

## Cause

The exporter wrote a solid's `opti` as `Soli` followed by zeros. Every solid that After Effects saves stores `00 09` at bytes 4 and 5, and the chunk's own size (282) as a big-endian `u16` at byte 8. File footage items already get these header bytes (`KindSpec::opti`); only the solid item was missing them.

Bisect on the solid export, in After Effects 26.5:
- with only these header bytes set: saves;
- with only the missing `LIST mnfo` added: still crashes;
- with both: saves.

## Fix

`base::solid_item` writes the header bytes (`SOLID_OPTI_HEADER`). The colour and name that `emit` writes from byte 10 on are unchanged. `docs/aep-export.md` gets rule R54.

## Tests

- New `export::base::tests::a_solid_carries_the_opti_header_after_effects_needs_to_save`. It fails without the fix (bytes 4..10 are zero).
- `cargo test -p effectcraft-aep` (with the corpus fixtures), `cargo clippy -p effectcraft-aep --all-targets -D warnings` and `cargo fmt --check` pass locally. I did not run the full `cargo xtask ci`.
- After Effects 26.5: the solid export with exactly these bytes opens, renders and saves.
