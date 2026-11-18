# Round 3: gpuG candidates and the GUID map, AE 26.5 headless, fresh process per file, 2026-11-18

| file | dialogs on open | app.project.gpuAccelType | C_t2997 f45 vs original |
|---|---|---|---|
| E1_gpuG_7ee0.aep | none | 1813 (CUDA) | max 0 (sharp, = original) |
| E2_gpuG_f330.aep | none | 1816 (SOFTWARE) | max 128, 10.87% px (soft, = ntsc_ec) |

## gpuG GUID ↔ gpuAccelType

The map was made on this PC: one new project, the type set, then Save As. The files are in `gpu_map/`.

| gpuAccelType | enum | gpuG Utf8 |
|---|---|---|
| CUDA (also the new-project default here) | 1813 | `7ee0ab59-822d-44cc-ac10-16279d041016` |
| OpenCL | 1812 | `be93941a-7488-4117-8a46-7e3596950307` |
| SOFTWARE (Mercury Software Only) | 1816 | `f33089e2-1ede-47c1-8a9e-b232bb1cc1a4` |

`app.availableGPUAccelTypes` on this PC: 1813, 1812, 1816. Metal (1814) and Vulkan (1815) are not offered, so they are not mapped.

## Conclusions

- A file **without gpuG** opens as SOFTWARE (ntsc_ec reads 1816). The upstream fixtures' f330… is the **Software** GUID, not another machine's GPU.
- The soft H.264 edges come from AE's Software renderer path. The CUDA renderer gives the sharp decode the original was saved with.
- What EffectCraft should write: copy `gpuG` from the source .aep when there is one. For a project created from scratch, write the CUDA GUID `7ee0ab59…` (this PC's default). If that renderer is missing on the target machine, AE should fall back on its own. That fallback is not tested here, since there is no non-CUDA machine.

Frames: `frames_round3/`.
