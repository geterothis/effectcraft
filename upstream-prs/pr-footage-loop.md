# aep import: Interpret Footage loop count

Branch: `fix/aep-import-footage-loop` (one commit on main)

## Problem

An After Effects footage item set to loop (Interpret Footage ▸ Loop, e.g. 3 times) imported with `loop_count` 1. The importer then ends a sequence or clip layer at its source's end, unless the item loops, so the layer was cut short too. In the corpus project `05_footage_images`, a 2 s image sequence looped 3 times sits on a 3 s layer. After Effects shows it until the end; EffectCraft dropped it at 2 s.

## Cause

The loop count was not decoded. It is the big-endian `u16` at byte 128 of the item's `sspc`. In the corpus it is 3 on the looped sequence and 1 on every one of the other 226 footage and solid items (stills, Photoshop layers, jpeg, sequences, clips, WAV, solids), all saved by After Effects 2026.

## Fix

`import_footage` reads it into `Footage::loop_count`. A missing record or 0 counts as one play. The existing `end_at_source` already keeps the out point of a looped item. The docs get the field (aep-format, footage table) and the import row.

The export still writes the default loop count and reports a different one, as before. Writing it is a separate change.

## Tests

- New `import::synthetic::a_looped_sequence_keeps_its_loop_count` on the committed `synthetic.aep`: 1 unchanged, 3 with byte 128 set to 3, 1 for 0. It fails without the fix.
- `cargo test -p effectcraft-aep` (with the corpus fixtures), `cargo clippy -p effectcraft-aep --all-targets -D warnings` and `cargo fmt --check` pass locally. I did not run the full `cargo xtask ci`, and I did not re-render corpus 05 with this branch alone.
