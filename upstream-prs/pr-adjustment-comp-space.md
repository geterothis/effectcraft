Title: Adjustment layers: effects take the comp as the layer, and .aep effect points on them are fractions of the comp

Branch: geterothis:fix/adjustment-layer-space (one commit on main 67942cda)

## Problem

An adjustment layer smaller than its comp rendered its effects differently from After Effects. The common case is a 1920x1080 adjustment layer in a 1920x1920 comp, often stretched by a parent null to fill the comp.

- Motion Tile tiled a 1920x1080 tile taken from the comp's top 1080 rows. Its tiles were fractions of the layer's size.
- An imported Tile Center landed 420 px off in this case.

## What After Effects does

Checked in After Effects 26.5 with lab renders, each in a fresh process. The comp is 1920x1920 over a vertical gradient with a grid. On top is a 1920x1080 adjustment layer with Motion Tile (Tile Center [960, 540], tiles 50 %, mirror on). Variants:

| | adjustment layer |
|---|---|
| A | default transform (centred) |
| B | Position [960, 700] |
| C | Scale 50 % |
| D | Rotation 30° |
| E | Output Width/Height 200 % |
| F | parented to a 100x100 null scaled [1920, 1920] to fill the comp |
| G | as F, Tile Center [960, 960], Output Width 550 % |

The findings:

- **Every variant tiles the comp identically.** Where any two cover the same pixels, A, B, C, D and F are equal pixel for pixel. The tiles are 960x960, which is 50 % of the comp, not of the layer, centred at comp [960, 540]. Only the result is clipped to the layer: E looks like A.
- **The stored point is a fraction of the comp.** Tile Center 540 on that 1920x1080 adjustment layer is stored as 540 / 1920 = 0.28125, whatever the layer's transform. `tdb4@24` still holds the layer's aspect (16 / 9).

## Change

- `render/pipeline.rs`: an adjustment layer's effect stack takes the comp it is drawn onto as `EffectCtx::layer_size`, instead of its effect bounds. For a layer drawn through a collapsed precomp, that is the outermost comp. The CPU and GPU paths both go through `run_effect_stack`.
- `render/layers.rs`: `canvas_comp_size`.
- `aep/import/build.rs`: an adjustment layer's effect points are fractions of the comp size.
- `aep/export/plan.rs`: when writing an adjustment layer's effect points, they are divided by the comp size; `tdb4@24` keeps the source aspect.
- Docs: `architecture.md` (rendering), `aep-format.md` (the point row), `aep-import.md`, `aep-export.md` (R24).

## Tests

- New `render::tests::an_adjustment_layers_effects_take_the_comp_as_the_layer`. Motion Tile on a 200x50 adjustment layer in a 200x100 comp matches the comp-sized layer's result inside the band, and the comp is untouched outside it. Fails without the change.
- New `import::effects_quickwins::an_adjustment_layers_effect_points_are_fractions_of_its_comp`. The injected effect's layer is switched to an adjustment layer, and the point becomes fraction × comp size. Fails without the change.
- New `export::effects::an_adjustment_layers_effect_points_are_fractions_of_its_comp`. A Gradient Ramp Start [960, 540] on a 1920x1080 adjustment layer in a 1920x1920 comp is stored as [0.5, 0.28125] and reads back as [960, 540]. Fails without the change.
- `cargo test -p effectcraft-render -p effectcraft-aep` passes. So does `cargo test -p effectcraft-gpu adjust`. `cargo clippy -p effectcraft-render -p effectcraft-aep -p effectcraft-gpu --all-targets -- -D warnings` and `cargo fmt --check` pass. I did not run the full `cargo xtask ci`.
- Rendered the A–G lab project's frame 0 in EffectCraft and compared with After Effects' frame. The Motion Tile import came from the separate Motion Tile import PR. Mean absolute difference per channel (0–255):

  | | A | B | C | D | E | F | G |
  |---|---|---|---|---|---|---|---|
  | before | 31.6 | 26.9 | 13.1 | 29.3 | 31.6 | 39.5 | 37.6 |
  | after | 2.8 | 2.6 | 2.7 | 2.8 | 2.8 | 2.7 | 2.7 |

  The remaining difference is text and grid antialiasing.
