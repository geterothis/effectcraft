# Round-trip results (EffectCraft export -> After Effects 26.5)

Opened in AE 2026 (background instance, dialogs suppressed); main comp rendered with aerender at every frame and compared with `reference/` at the reference frames (|diff| > 8/255 counted). `ae_structural_diff_vs_original` lists what AE sees missing compared with the original corpus file; anything not in `effectcraft_reported_losses` is a silent loss.

| File | Opens | Render vs reference (worst % px) | Missing in AE (comps / layers / effects) | EffectCraft reported |
|---|---|---|---|---|
| `01_solids_nulls_adjustment.effectcraft.aep` | yes | close (2.14) | 0 / 0 / 0 | 0 |
| `02_shapes_basic.effectcraft.aep` | yes | match (0.13) | 0 / 0 / 0 | 1 |
| `03_shapes_modifiers.effectcraft.aep` | yes | close (3.55) | 0 / 0 / 0 | 1 |
| `04_text.effectcraft.aep` | yes | differs (6.88) | 0 / 0 / 0 | 2 |
| `05_footage_images.effectcraft.aep` | yes | differs (12.54) | 0 / 4 / 0 | 2 |
| `06_footage_video_audio.effectcraft.aep` | yes | close (3.02) | 0 / 1 / 0 | 2 |
| `07_precomps_nesting.effectcraft.aep` | yes | match (0.0) | 0 / 0 / 0 | 0 |
| `08_masks.effectcraft.aep` | yes | close (0.86) | 0 / 0 / 1 | 2 |
| `09_track_mattes.effectcraft.aep` | yes | match (0.0) | 0 / 0 / 0 | 0 |
| `10_blend_modes.effectcraft.aep` | yes | differs (8.21) | 0 / 0 / 0 | 1 |
| `11_3d_camera_lights.effectcraft.aep` | yes | differs (92.14) | 0 / 2 / 0 | 3 |
| `12_keyframes_easing.effectcraft.aep` | yes | close (1.82) | 0 / 0 / 0 | 1 |
| `13_expressions.effectcraft.aep` | yes | match (0.0) | 0 / 0 / 0 | 0 |
| `14a_effects_blur_color.effectcraft.aep` | yes | render failed (None) | 0 / 0 / 4 | 2 |
| `14b_effects_distort_generate.effectcraft.aep` | yes | differs (39.14) | 0 / 0 / 10 | 2 |
| `14c_effects_stylize_transition.effectcraft.aep` | yes | differs (29.82) | 0 / 0 / 12 | 2 |
| `15_time_remap.effectcraft.aep` | yes | close (1.09) | 0 / 0 / 0 | 0 |
| `16_parenting.effectcraft.aep` | yes | match (0.0) | 0 / 0 / 0 | 1 |
| `17_essential_graphics.effectcraft.aep` | yes | differs (23.91) | 0 / 0 / 0 | 0 |
| `18_markers_comp_settings.effectcraft.aep` | yes | close (1.07) | 0 / 0 / 0 | 2 |
| `20_kitchen_sink.effectcraft.aep` | **NO: Error: After Effects error: your project file is apparently damaged (Invalid read length).** | render failed (None) | - | 1 |
| `21_project_16bpc.effectcraft.aep` | yes | match (0.0) | 0 / 0 / 0 | 0 |
| `22_project_32bpc_linear.effectcraft.aep` | yes | match (0.0) | 0 / 0 / 0 | 0 |
| `23_project_structure.effectcraft.aep` | yes | no reference (None) | 0 / 1 / 0 | 2 |
| `ec_alleffects.effectcraft.aep` | yes | no reference (made in EffectCraft) | 0 / 0 / 0 | 0 |
| `ec_title.effectcraft.aep` | yes | no reference (made in EffectCraft) | 0 / 0 / 0 | 0 |

Per-file details: `roundtrip/<id>.json`; compared frames and diff masks: `roundtrip/renders/<id>/`; raw numbers: `roundtrip/render_compare.json`.

## Findings

**Silent losses** (AE sees them missing, EffectCraft did not report them):
- `17_essential_graphics`: all Essential Properties overrides are gone. The 3 badge instances render with the template defaults (blue "TITLE"), instead of red "OVERRIDE" / green keyed "KEYED". EffectCraft reported nothing.
- `20_kitchen_sink`: the export does not open in AE 2026: "your project file is apparently damaged (Invalid read length)". EffectCraft reported only a Y Rotation loss.
- `05_footage_images`: layer `seq` (PNG sequence footage) is missing.
- `14b_effects_distort_generate`: effect `ADBE Offset` missing on `SRC_offset`.
- `14c_effects_stylize_transition`: effects `ADBE Echo` and `ADBE Linear Wipe` missing.
- `23_project_structure`: placeholder layer `missing_placeholder` missing (EffectCraft reports a footage named 'Footage').

**Other results**
- `14a_effects_blur_color`: opens, but aerender fails on the main comp: "An unexpected error occurred while exporting a composition. Error Code: 512" (2 attempts). The original renders fine.
- `11_3d_camera_lights`: Parallel and Ambient lights not written and spot shadows lost (reported), so the render differs on 92 % of pixels.
- `10_blend_modes`: Dissolve, Darker/Lighter Color, Subtract, Divide fall back to Normal (reported).
- `18_markers_comp_settings`: start timecode 01:00:00;00 is kept; compared at the timecode frame numbers, max 1 % px differ (motion blur).
- `23_project_structure`: no reference: the original itself does not render (placeholder footage -> aerender "Error Code: 1").
- In batch-1 read-back (fx-nondefault round-trips): effect Compositing Options are reset (Effect Opacity 37 -> 100, GPU Rendering), and the exported Deflicker comp crashes AE.

**Speed**: 24 exports rendered by 4 parallel aerender 2026 workers in 101 s wall vs 366 s of summed job time (x3.6). Machine: reference/timings/machine.json.
