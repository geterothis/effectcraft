Title: Motion Tile: a second tile on an adjustment layer keeps the first one's growth

Branch: geterothis:fix/motion-tile-chain-extent (one commit on main 67942cda)

## Problem

Two Motion Tiles on one adjustment layer, the first widening (Output Width 550 %) and the second heightening (Output Height 550 %), should tile the whole widened band into a grid. In EffectCraft the second tile built its frame from the comp rectangle alone. It cut away everything the first tile had grown past the comp's sides. With a Transform effect after them scaling down, the grid was only one comp wide, with empty sides.

## What After Effects does

Checked in After Effects 26.5, each render in a fresh process. The comp is 1920x1920 over a gradient with a grid. A 1920x1080 adjustment layer, parented to a null that stretches it over the comp, carries these effects:

- Motion Tile: Tile Center [960, 960], Output Width 550 %, mirror on.
- A second Motion Tile: Output Height 550 %, mirror on.
- Transform: Scale 30 %.

After Effects fills the whole frame with the tiled grid, so the second tile keeps the first tile's width. With both tiles and Scale 100 %, or with Transform Height 30 % and Width 100 %, the frame matches EffectCraft before and after this change.

## Change

`crates/effects/src/lib.rs`, `motion_tile_frame`, adjustment branch: the frame is now the union of the tile's own grown rectangle and the buffer below. If the union would pass the effect pixel budget (`pixel_budget`), the kept part shrinks evenly towards the tile's own rectangle. That rectangle is never cut. The CPU and GPU paths share this function. An adjustment at 100 % / 100 % keeps the buffer it was given, as before.

## Tests

- `stylize2::tests::a_second_motion_tile_on_an_adjustment_keeps_the_first_ones_growth`: tile 300 % wide, then 300 % high, on a 10x8 adjustment. The second frame is 30x24, and its middle row equals the widened band. It also checks a 1920x1080 chain at the budget. It fails on main: the second frame is 10x24.
- `cargo test -p effectcraft-effects`: 645 passed. `cargo test -p effectcraft-gpu -- tile` passed with llvmpipe Vulkan. `cargo clippy -p effectcraft-effects -p effectcraft-gpu --all-targets -- -D warnings` and `cargo fmt --check` are clean. I did not run the full `cargo xtask ci` locally.
- I imported the lab project and rendered it with a build that also contains #3933 (Motion Tile import) and the adjustment comp-space change. Against the After Effects frame for the two tiles plus Scale 30 %, the mean absolute difference fell from 65.7 to 2.7 (0–255). The two-tiles-at-100 % and Height-30 % variants are unchanged, at 2.4 and 2.8.
