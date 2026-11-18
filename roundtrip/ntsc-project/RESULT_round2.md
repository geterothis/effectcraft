# Round 2 (O1–O7), AE 26.5 headless station, 2026-11-18

**Cause: the missing `gpuG` list.** The original holds `LIST gpuG` → `Utf8` "7ee0ab59-822d-44cc-ac10-16279d041016", 48 bytes at offset 178, a GPU / renderer id. EC does not write it.

The decisive test ran each file in a FRESH AE process:

| file (fresh process) | C_t2997 f45 vs original | vs ntsc_ec |
|---|---|---|
| O1_no_gpuG (original minus gpuG) | max 128, 10.87% px (soft, = EC) | 0 |
| O2_ec_xmp (original + EC XMP, gpuG kept) | 0 (sharp, = original) | 128 |

See `round2_fresh_diff.json` and `frames_round2_fresh/`.

## Watch out: AE caches decoded frames between projects in one process

The first pass rendered O1→O7 in one process, and every one of them came out soft, including the untouched original rendered at the end. O2–O7 share the original's footage records (same file and item ids), so after O1 they were served O1's soft frames. In a fresh process the original and O2 render sharp. Those first-pass numbers were invalid and have been removed.

The A–D files all lack gpuG (they are EC-based), so "soft" was correct for them anyway. The earlier ntsc_ec vs original checks were valid too, because their footage records differ.

The suggested fix for the EC writer: write the `LIST gpuG` / `Utf8` chunk, copied from the source project or with this GUID. Re-test the next export in a fresh AE process.

O3–O6 were not re-run in fresh processes. Each of them keeps gpuG, so they should be sharp like O2. O7 lacks gpuG, so it should be soft. Not verified.
