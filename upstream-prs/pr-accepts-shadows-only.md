Title: render: Classic 3D Accepts Shadows: Only is a white matte with black shadows

Branch: geterothis:fix/render-accepts-shadows-only (based on upstream main cd9ee1e4, one commit)

## What

In Classic 3D, After Effects 2026 draws a layer with Material Options > Accepts Shadows: Only as a shadow matte: white where no shadow falls, black in full shadow, with the layer's own alpha. EffectCraft drew it transparent except for a black shadow, so a tile that is plain white in After Effects disappeared.

I checked this with a lab project rendered by After Effects 26.5 (`aerender`, PNG with alpha). It has a 400×200 (0.2, 0.6, 0.4) solid with Accepts Shadows: Only, a white caster in front with Casts Shadows On, and one light with Casts Shadows on, Darkness 100 and Diffusion 0. Across seven variants:
- the solid renders 255 white with alpha 255 under a white spot at 100 %, an orange spot at 50 %, a point light and a parallel light, at Diffuse 50 and 100 %, and with Accepts Lights off. Its own colour, the light's colour and the intensity don't change it;
- the shadow of the parallel light is 0 (black) with alpha 255;
- at 50 % opacity the alpha is 128 and the colour is still white.

## Change

- `three_d/compose.rs` (`shade_texel`): with Accepts Shadows: Only the texel is `(1 - shadow) × alpha` in every channel with the layer's alpha. The shadows are taken even with Accepts Lights off. Without lights the layer is white.
- `classic3d.wgsl`: the same on the GPU.
- Advanced 3D (the shadow catcher of #1691) is not touched.

## Tests

- New `three_d::tests::accepts_shadows_only_is_a_white_matte_with_black_shadows`: a coloured Only layer with Accepts Lights off under an orange parallel light at 50 %, with an invisible caster. It checks white outside the shadow, black with full alpha inside it, and alpha 0.5 at 50 % opacity. It fails without the change (the lit pixel was transparent).
- `cargo test -p effectcraft-render` (428 passed), `cargo test -p effectcraft-gpu` (323 passed; the `three_d` CPU/GPU parity tests also with `EFFECTCRAFT_REQUIRE_GPU=1` on lavapipe), clippy (`-D warnings`) and fmt pass for the touched crates. I did not run the full `cargo xtask ci`.
