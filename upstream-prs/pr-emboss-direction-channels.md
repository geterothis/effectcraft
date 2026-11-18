Branch: fix/emboss-direction-channels (based on upstream main 67942cda), one commit.

# Emboss: Direction runs clockwise from up, and each channel is embossed on its own

## What was wrong

Emboss had two differences from After Effects 26.5:

- Direction was measured from a different axis. With Direction 0, a white square on grey had its left and right edges lit and its top and bottom edges grey. After Effects darkens the top edge and lightens the bottom one, and leaves the sides grey. Its angle runs clockwise from up, like other After Effects angles.
- The relief was computed from luminance, so the result was always grey. After Effects embosses red, green and blue separately: a red square on blue gets a black/half/blue top edge and a red/half/black bottom edge.

## Change

- `crates/effects/src/misc.rs`: the sampling offset is `(sin θ · relief, −cos θ · relief)`, exposed as `emboss_offset` so the GPU path uses the same value. Each channel is `0.5 + (s(p + d) − s(p − d)) · contrast / 100`, clamped and blended with the original by Blend With Original.
- `crates/effects/src/lib.rs`: re-exports `emboss_offset`.
- `crates/gpu/src/fx_distort.rs` and `crates/gpu/src/shaders/fx_distort.wgsl`: the GPU path uses that offset and the same per-channel formula.

## Tests

- `stylize2::tests::emboss_direction_is_clockwise_from_up_and_channels_are_apart`: a 20 px square in a 40 px image with Relief 3, Contrast 100, Direction 0. It checks a dark top edge, a light bottom edge and grey sides, and the per-channel edges of a red square on blue. It fails without the change, because the top edge comes out grey.
- The `effectcraft-gpu` emboss tests compare the GPU with the CPU. They pass on llvmpipe.

## Checked against After Effects

These are After Effects 26.5 renders of a 200×200 comp holding an 80×80 square in a precomp, with Emboss on the precomp layer. The comparison covers RGB on the opaque pixels.

| Case | Direction | Relief | Contrast | Blend | max | mean |
|---|---|---|---|---|---|---|
| white on grey | 0 | 3 | 100 | 0 | 0 | 0.00 |
| white on grey | 90 | 3 | 100 | 0 | 0 | 0.00 |
| white on grey | 120 | 3 | 100 | 0 | 1 | 0.01 |
| white on grey | 0 | 4.5 | 250 | 0 | 0 | 0.00 |
| red on blue | 120 | 3 | 100 | 0 | 1 | 0.00 |
| red on blue | 120 | 3 | 100 | 30 | 2 | 0.99 |
| white, no background | 0 | 3 | 100 | 0 | 0 | 0.00 |

The square on a transparent background keeps its alpha, as in After Effects.
