Branch: fix/motion-tile-phase (based on upstream main 67942cda), one commit.

# Motion Tile: Phase offsets every other column, not each one further

## What was wrong

Motion Tile's Phase moved each column of tiles by Phase once more than the column before it (`ty += phase * floor(tx)`), so the output was a staircase. After Effects 26.5 moves only every other column. The column holding the centre tile stays in place, and the odd columns on both sides move by the same amount, against the axis. With Horizontal Phase Shift on, the same applies to rows.

## Change

- `crates/effects/src/stylize2.rs`: the CPU path shifts by `-phase` only where the tile index along the other axis is odd.
- `crates/gpu/src/shaders/fx_stylize.wgsl`: the same on the GPU path.

## Tests

- `stylize2::tests::motion_tile_phase_shifts_every_other_column`: tiles half the layer wide, Phase 90. The centre column is unchanged, and both neighbours move down a quarter tile. It fails without the change, because the right neighbour moved up.
- `effectcraft-gpu` `tiles_kaleida_repetile` compares the GPU with the CPU for Motion Tile with Phase, with and without Horizontal Phase Shift. It passes on llvmpipe.

## Checked against After Effects

These are After Effects 26.5 renders of a 320×180 4-Color Gradient layer at 15 % with Motion Tile (Tile Width/Height 50, Output 550 %), compared over the layer's opaque pixels. Before the change, a Phase 30 render with Tile Height 100 showed the staircase: the peak of the pattern moved 2 to 3 px further in each column, while in After Effects it alternates between two heights.

| Case | max | mean |
|---|---|---|
| Phase 30 | 17 | 0.62 |
| Phase 30, Horizontal Phase Shift | 24 | 0.85 |
| Phase 270 | 17 | 0.64 |
| Phase 30, Mirror Edges, Horizontal Phase Shift | 5 | 0.40 |
| Phase 30, Tile Center off centre | 17 | 0.69 |

The remaining differences are resampling at tile edges.
