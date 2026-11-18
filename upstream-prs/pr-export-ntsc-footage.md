Title: aep: write and read 23.976 and 29.97 fps clips with their fractional rate

Branch: geterothis:fix/aep-export-ntsc-footage (one commit on main cd9ee1e4).

## Problem

- Export: a clip at 23.976 or 29.97 fps was dropped from the `.aep` with "only whole rates are sampled" (`footage_items`), and so were the layers that showed it.
- Import: `sspc` stores the native rate as 16.16 fixed point at byte 58, and the importer read only the whole part (the `u32` at 56). A 29.97 clip came in at 29 fps and a 23.976 one at 23 fps, so its duration and the frames shown were wrong. A clip conformed to 29.97 was read the same way.

## Change

Byte layout from an After Effects 2026 sample with 23.976, 29.97, 25 and 25-conformed-to-29.97 clips:

- the rates at `sspc@58` (native) and `@148` / `@152` (conformed / effective) are 16.16 fixed point; 29.97 is `001d f852`;
- a 23.976 or 29.97 clip counts its time in 2997ths of a second (`sspc@50` = 2997), 125 or 100 units per frame; its duration is stored in those units (90 frames at 29.97 = 9000 / 2997).

Code:

- `export/footage.rs`: `clip_rate` gives the stored form of a rate (time scale, units per frame, 16.16 value). Whole rates are written as before; 23.976 and 29.97 (and 59.94 / 119.88, not sampled) are written in 2997ths. `FootagePlan` gains `rate` (16.16), and `conform` is 16.16 too. A native rate that is NTSC is no longer reported for a conformed clip.
- `import/build.rs`: `sspc_rate` reads a 16.16 rate and maps After Effects' stored value of 23.976 / 29.97 / 59.94 / 119.88 to the exact `FrameRate` (30000/1001, …). An NTSC clip's duration snaps to whole frames at that rate. A conformed clip reads its conform rate at 148 the same way.
- `docs/aep-export.md`, `docs/aep-format.md`, `docs/aep-import.md`: the layout and what is written.

## Tests

- New `export::footage::ntsc_clips_are_written_as_after_effects_stores_them`: 23.976 and 29.97 clips and a 25 fps clip conformed to 29.97 are exported. The test checks the `sspc` bytes against the sample's (time scale, duration units, 16.16 rates) and that the reimport gives the same rates and durations. It fails without the change, because the clips are dropped.
- The existing test that expected an NTSC clip to be dropped now uses a 25/2 fps clip, which is still not written.
- `cargo test -p effectcraft-aep`, clippy (`-D warnings`) and fmt pass for the crate. I did not run the full `cargo xtask ci`.
- After Effects 2026: the sample project was imported into EffectCraft and exported.
  - After Effects opens the export with no dialog and finds all four clips.
  - Every item's frame rate, conform rate, native rate and duration (23.976 / 3.003 s, 29.97 / 3.003 s, 25 / 3 s, 29.97 conformed from 25 / 2.5025 s) and every composition's rate, duration and layer out point match the original.
  - Pixels matched once the project renderer was also written (a separate PR, "aep: write and read the project renderer"). Without it, After Effects opens any exported project as Software Only, whatever the clip rate.
