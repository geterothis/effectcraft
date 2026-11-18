Title: render: Preserve Transparency keeps the alpha below

Branch: geterothis:fix/render-preserve-transparency-atop (based on upstream main cd9ee1e4, two commits)
Compare: https://github.com/storytold/effectcraft/compare/main...geterothis:effectcraft:fix/render-preserve-transparency-atop

## What

A layer with Preserve Transparency on raises the alpha of semi-transparent pixels below it. After Effects keeps that alpha. In an After Effects 2026 lab render, an opaque layer with Preserve Transparency over a 30 % background comes out in the layer's colour at alpha 77 (30 %). EffectCraft gives 131 (51 %), with the layer's colour mixed with the background.

The cause: the renderer multiplies the layer by the alpha below and then lays the result over the canvas. For an opaque layer over alpha `a`, that gives `a + a(1 - a)`, not `a`.

The fix composites the layer as usual, with its blend mode and opacity, and keeps the colour of that composite at the alpha below. Where nothing lies below, the pixel stays as it is. Stencil and silhouette modes are left as they are without the switch. Both rules come from After Effects 2026 lab renders (frame 0, 8-bit RGBA):

- A white layer at 50 % with Preserve Transparency over (0.2, 0.4, 0.6) at 30 % gives (208, 220, 232) at alpha 77. That is the colour of the plain composite at the alpha below.
- The same layer in Stencil Alpha, Silhouette Alpha or Stencil Luma mode leaves alpha 39, 38 and 39 (about 30 % × 50 %), as without the switch.
- A Stencil Alpha layer with Preserve Transparency still clears the alpha where it has no pixels.

## Change

- `color/src/blend.rs`: new `blend_pixel_preserve` (exported from the crate).
- `raster/src/lib.rs`: `Image::blend_from_preserve`. It shares its loop with `blend_from` through a private `blend_with`.
- `render/src/layers.rs` (`composite_iso_with`, the 2D path): uses `blend_from_preserve` instead of multiplying the isolated layer by the alpha below.
- `render/src/three_d/compose.rs` (Classic 3D): uses `blend_pixel_preserve` for a plane with Preserve Transparency, instead of multiplying its opacity by the alpha below.
- GPU, to keep matching the CPU:
  - `kernels.wgsl`: `preserve` takes the composite (unquantised) and the canvas. It keeps the composite's colour at the canvas alpha, uses stencil and silhouette results as they are, keeps a transparent pixel below as it is, and quantises the result at 8 and 16 bpc.
  - `ops.rs`: `preserve` takes the blend mode and the quantisation levels.
  - `walk.rs` (`composite_iso_with`): runs `blend_full` onto the canvas without quantisation, then `preserve`, so the result is quantised once, as the CPU path does.
  - `classic3d.wgsl`: the same rule as the CPU's Classic 3D.

## Tests

- New render tests in `render/src/tests.rs`:
  - `preserve_transparency_keeps_the_alpha_below`: in 2D and with both layers 3D, an opaque red layer over a 30 % blue background gives `[0.3, 0, 0, 0.3]`, and nothing where no pixels lie below. Without the change, the 2D case gives `[0.3, 0, 0.21, 0.51]`. With only `compose.rs` reverted, the 3D case gives the same wrong value.
  - `preserve_transparency_mixes_by_the_layer_opacity`: a red layer at 50 % over a blue background at 40 % gives `[0.286, 0, 0.114, 0.4]`, the composite's colour at the alpha below.
- New unit tests in `color`:
  - `preserve_keeps_the_alpha_below`: Normal, Multiply, and nothing below.
  - `preserve_keeps_the_colour_of_the_plain_composite`: the lab's Normal layer, within one 8-bit level of (208, 220, 232), at alpha 0.3.
  - `preserve_leaves_stencil_and_silhouette_modes_cutting_the_alpha_below`: with the switch on, the four stencil and silhouette modes give the same result as without it. That is 0.15 for a 50 % layer over 0.3, and 0 where the layer has no pixels.
- New GPU test `preserve_transparency_rounds_once_at_8_bpc`: red at 14 % over black at alpha 5/255 gives red 4/255 on the GPU, as on the CPU. If the composite is quantised before the alpha below is applied, it gives 5/255.
- The GPU-vs-CPU test `masks_mattes_and_preserve_transparency` covers the GPU path against the CPU.
- `cargo test -p effectcraft-color -p effectcraft-raster -p effectcraft-render`: all passed.
- `cargo test -p effectcraft-gpu` with `EFFECTCRAFT_REQUIRE_GPU=1` on lavapipe (Mesa software Vulkan): all passed except `opengl_adapters_get_cpu_compositing_at_once`, which fails only because that machine has no OpenGL adapter.
- Clippy (`-D warnings`) on the changed crates and `cargo fmt --check` are clean.
- I did not run the full `cargo xtask ci` and did not test on a hardware GPU.

The second commit answers the CodeRabbit review and corrects the first commit against more lab renders:
- The double rounding on the GPU was real and is fixed.
- The suggestion to keep the alpha below in stencil and silhouette modes does not match After Effects (see the second and third lab results above), so those modes stay as they are.
- A partly transparent layer now keeps the plain composite's colour. The first commit mixed the layer's colour with the colour below by the layer opacity, which gave (153, 178, 204) instead of (208, 220, 232).
