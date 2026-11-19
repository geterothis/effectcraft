Title: Time Remap: a remapped precomp time just short of a cut reaches it

Branch: geterothis:fix/time-remap-reaches-cut (one commit on main 67942cda)

## Problem

After Effects keeps Time Remap values as float32 seconds. A remap keyed onto a cut at 0.24 s is stored, and read back, as 0.2399999946 s. When a precomp switches between two nested layers at that cut, EffectCraft drew it at 0.2399999946 s, so it showed the layer before the cut. After Effects shows the layer after it. Templates that time-remap a transition precomp onto a cut marker showed one wrong frame at the cut.

## What After Effects does

Checked in After Effects 26.5, each project in a fresh process. The nested comp has a red solid up to a cut and a green solid from the cut. The outer precomp layer has Time Remap keys 0 → 0, 1/30 s → V and 1 s → 1, all linear. Frame 1 rendered:

| nested comp | cut (as stored) | V | shows |
|---|---|---|---|
| 30 fps | 0.2400065 | 0.24 (reads 0.2399999946), 0.2399999, 0.239999, 0.23999 | green |
| 30 fps | 0.2400065 | 0.23998, 0.23996, 0.23995, 0.23994, 0.23992, 0.2399 | red |
| 60 fps | 0.25 | 0.24999 | green |
| 60 fps | 0.25 | 0.24998, 0.24995, 0.2499 | red |
| 24 fps | 0.25 | 0.24999, 0.24998 | green |
| 24 fps | 0.25 | 0.24995, 0.2499 | red |
| 30 fps | 0.2551107 (off the frame grid) | cut − 1e-5 | green |
| 30 fps | 0.2551107 | cut − 5e-5 | red |

A remapped time short of a nested in point by less than a small fraction of a nested frame still reaches it. The window lies between 1/1666 and 1/1258 of a frame at all three rates. A time stretch that lands just short does not get this slack: stretch 13.8895 %, giving 0.23999 s, shows red.

## Change

`crates/render/src/eval.rs`, `EvalCtx::source_time`: a time-remapped precomp's source time is 1/1500 of the nested comp's frame later (`REMAP_SLACK_PER_FRAME`). That is inside the measured window. Footage and stretched layers are unchanged.

## Tests

- `tests::remap::a_remapped_time_just_short_of_a_cut_reaches_it`: the lab table above as a synthetic render test, covering every rate, both sides of the window and the off-grid cut. It fails on main: 0.2399999946 at a 30 fps cut shows red.
- `cargo test -p effectcraft-render`: 428 passed, 1 ignored. `cargo clippy -p effectcraft-render --all-targets -- -D warnings` and `cargo fmt --check` are clean. I did not run the other crates' tests or the full `cargo xtask ci` locally.
- A real template with this structure rendered the layer after the cut with this change, and the one before it without.
