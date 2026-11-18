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

## Round 2: the original with EC's project chunks (O1–O7)

Each file is `lab/ntsc-footage/ntsc_footage.aep` (the original) with one project-level chunk made
as in `ntsc_ec.aep`:

| file | changed in the original |
|---|---|
| O1_no_gpuG.aep | `gpuG` list removed |
| O2_ec_xmp.aep | XMP trailer replaced by EC's (358 B) |
| O3_ws_default.aep | `wsns`, `wsnm` and the following `Utf8` set to EC's "Default" |
| O4_no_PTRE.aep | `PTRE` list removed |
| O5_ec_AFsi.aep | `LSIf/AFsi` replaced by EC's |
| O6_ec_sfid.aep | `sfnm/sfid` = EC's `19000000` |
| O7_all.aep | all of O1–O6 |

Render C_t2997 f45 and C_t23976 f36 as before; wanted: which of them renders like ntsc_ec.

If O7 still renders like the original, the cause is not a project-level chunk. Then please check the
comp side: in each project make a NEW comp (same settings), add the footage item, and render f45.
If both new comps match each other, the difference is in EC's comp or layer records, not the
project.

## Round 3: gpuG candidates (fresh AE process per file)

- E1_gpuG_7ee0.aep: ntsc_ec.aep + `LIST gpuG / Utf8 "7ee0ab59-822d-44cc-ac10-16279d041016"` after `qtlg`
  (the value in every AE file saved on this PC and in the upstream corpus).
- E2_gpuG_f330.aep: the same with `f33089e2-1ede-47c1-8a9e-b232bb1cc1a4` (the value in the upstream
  test fixtures, saved by another contributor's AE).

Please report for each: dialogs on open, `app.project.gpuAccelType`, and max diff of C_t2997 f45
against the original.

And the mapping: in a new project, set `app.project.gpuAccelType` to each type this PC offers
(CUDA, OpenCL/Vulkan if listed, SOFTWARE), save, and give the `gpuG` GUID of each saved file (or
"no gpuG"). This decides what EffectCraft writes by default.
