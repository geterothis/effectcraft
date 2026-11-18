# Which project chunk makes H.264 decode differently (ntsc_ec.aep)

Each file is `roundtrip/ntsc-export/ntsc_ec.aep` with only these chunks replaced by the original
AE project's bytes (same lengths, from `project_chunk_diff.txt`):

| file | changed |
|---|---|
| A_nnhd.aep | `nnhd` and `nhed` tails (`355fa740 000000d3 355f0000`) |
| B_rhed.aep | `LRdr/Rhed` |
| C_version.aep | `head` and `svap` (saving AE version) |
| D_all.aep | all of the above |

For each: open, render C_t2997 f45 (and C_t23976 f36) as before, and give the max diff against the
original frames. Wanted: which one renders like the original (diff 0 or near).
If none does, the remaining suspects are `gpuG/Utf8`, `wsnm`/`Utf8` "Default" and the XMP block.
