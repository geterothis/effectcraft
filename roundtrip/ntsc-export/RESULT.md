# ntsc_ec.aep read back in AE 26.5 (headless station), 2026-11-18

1. Opens with no dialog. All 4 footage items are found (`footageMissing: false`) at the original `lab\ntsc-footage\*.mp4` paths.
2. Timing matches the original exactly (`ntsc_ec_readback.json` vs `ntsc_orig_readback.json`):
   - item frameRate / conform / native / duration:
     - t23976: 23.976 / 0 / 23.976 / 3.003
     - t2997: 29.97 / 0 / 29.97 / 3.003
     - t25: 25 / 0 / 25 / 3.0
     - t25_conformed_29.97: 29.97 / 29.97 / 25 / 2.5025
   - every comp's frameRate, duration and layerOut are the same as in the original.
   - Interpretation fields reachable from ExtendScript are all identical (alpha, fields, pulldown, loop, pixel aspect). So are the layer quality, sampling and transforms.
3. **Pixels differ.** See `ntsc_frame_diff.json`: frame 45 of C_t2997 and frame 36 of C_t23976 have max diff 128, about 6.2k of 57.6k px.
   - Only the edges of static colour bars change, and flat colours are identical. Row 20, x 39–41: original `[90,0,0] [255,0,0]`, EC `[45,0,0] [211,18,19]`. The EC file decodes with soft or bleeding chroma at edges.
   - It is the same source frame (static bars differ) and each side renders deterministically (repeat renders give diff 0).
   - **The cause is project-level, not the footage record.** Re-linking the item with `replace()` changes nothing. A fresh `importFile` of the same mp4 into ntsc_ec.aep renders exactly like the EC frames: `frames/ec_project_fresh_import_C_t2997_f45.png`, diff 0 vs EC, 128 vs original.
   - Tested and ruled out (changing them in the original does not change its frame):
     - `lutInterpolationMethod`: the EC file drops it, so it reads 0; the original has 1.
     - `gpuAccelType`: EC 1816 SOFTWARE, original 1813.
   - Project-level chunks that differ: see `project_chunk_diff.txt`.
     - `LRdr/Rhed` is all zeros in EC.
     - `gpuG/Utf8` is missing.
     - The tail of `nnhd` / `nhed` (`355fa740 000000d3 355f0000`) is zeroed in EC.
     - Smaller ones: `head`, `svap`, `sfnm/sfid`, `wsnm` "Default", `LSIf/AFsi`, and the `<?xp` XMP block (4221 → 358 bytes).
   - One of these most likely carries the decode / colour setting. The `nnhd` tail and `LRdr/Rhed` are the first suspects.

Renders: ae-harness plugin AEGP render, 8 bpc, straight alpha.
