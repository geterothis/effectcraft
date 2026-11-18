Title: aep: write and read the project renderer (LIST gpuG)

Branch: geterothis:fix/aep-project-renderer (one commit on main cd9ee1e4).

## Problem

After Effects keeps Project Settings ▸ Video Rendering and Effects ▸ Use in a top-level `LIST gpuG` holding one `Utf8`, the renderer's id. The exporter didn't write it. After Effects opens a project without `gpuG` as Mercury Software Only, so every exported project rendered with the Software renderer, whatever EffectCraft's GPU acceleration setting.

The two renderers don't give the same pixels. In an After Effects 2026 test, an exported project with H.264 colour bars rendered softer chroma at the bar edges than the source project: max diff 128 of 255, about 11 % of pixels. Flat colours were identical. Comparing the two projects chunk by chunk, with a fresh After Effects process per file, isolated `gpuG`:

- the source project with `gpuG` removed renders exactly like the export;
- the export with the source's `gpuG` added renders exactly like the source (diff 0).

## Change

- `import/settings.rs`: the renderer ids After Effects 2026 writes on Windows (from projects saved with each `app.project.gpuAccelType`):
  - CUDA `7ee0ab59-822d-44cc-ac10-16279d041016`, also the new-project default on that machine;
  - OpenCL `be93941a-7488-4117-8a46-7e3596950307`;
  - Software Only `f33089e2-1ede-47c1-8a9e-b232bb1cc1a4`.

  The importer sets `gpu_acceleration` off for Software Only's id or a missing `gpuG`, and on for any other id.
- `export/settings.rs`: `gpuG` is written right after `qtlg`, where After Effects writes it: CUDA's id when GPU acceleration is on, Software Only's when it is off.
- `import.rs`: the `settings` module is `pub(crate)` so the exporter shares the ids.
- `docs/aep-export.md`, `docs/aep-import.md`.

The exporter writes CUDA for GPU acceleration because EffectCraft's setting is a yes/no and CUDA is After Effects' default where it was sampled. I could not test how After Effects opens a CUDA project on a machine without an NVIDIA GPU.

## Tests

- New `export::settings::the_renderer_is_written_and_read_back`: with GPU acceleration on and off, the export holds `gpuG` with the CUDA / Software Only id right after `qtlg`, and the import maps it back. It fails without the change, because there is no `gpuG`.
- `cargo test -p effectcraft-aep` (419 + 90 passed), clippy (`-D warnings`) and fmt pass for the crate. `cargo test -p effectcraft-engine aep` passes. I did not run the full `cargo xtask ci`.
- After Effects 2026, fresh process: the H.264 sample project, imported and exported with this change, opens with no dialog. `gpuAccelType` is CUDA, and the frames are pixel-identical to the source project's (diff 0).
