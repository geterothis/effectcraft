Title: render: Preserve Transparency keeps the alpha below

Branch: geterothis:fix/render-preserve-transparency-atop (based on upstream main cd9ee1e4, two commits)
Compare: https://github.com/storytold/effectcraft/compare/main...geterothis:effectcraft:fix/render-preserve-transparency-atop

## What

A layer with Preserve Transparency on raises the alpha of semi-transparent pixels below it. After Effects keeps that alpha. In an After Effects 2026 lab render, an opaque layer with Preserve Transparency over a 30 % background comes out in the layer's colour at alpha 77 (30 %). EffectCraft gives 131 (51 %), with the layer's colour mixed with the background.

The cause: the renderer multiplies the layer by the alpha below and then lays the result over the canvas. For an opaque layer over alpha `a`, that gives `a + a(1 - a)`, not `a`. The fix blends the layer onto the colour below as if that were opaque, with the layer's blend mode and opacity, and keeps the colour of that blend at the alpha below. The alpha below is kept in every mode, so a stencil or silhouette mode, which only changes alpha, leaves the pixel below as it is. Where nothing lies below, or the blend leaves nothing, the pixel stays as it is.

## Change

- `color/src/blend.rs`: new `blend_pixel_preserve` (exported from the crate).
- `raster/src/lib.rs`: `Image::blend_from_preserve`. It shares its loop with `blend_from` through a private `blend_with`.
- `render/src/layers.rs` (`composite_iso_with`, the 2D path): uses `blend_from_preserve` instead of multiplying the isolated layer by the alpha below.
- `render/src/three_d/compose.rs` (Classic 3D): uses `blend_pixel_preserve` for a plane with Preserve Transparency, instead of multiplying its opacity by the alpha below.
- GPU, to keep matching the CPU:
  - `kernels.wgsl`: new `opaque` kernel. `preserve` now keeps the blended colour at the alpha below, keeps a transparent pixel below as it is, and quantises the result at 8 and 16 bpc.
  - `ops.rs`: new `opaque` op. `preserve` is documented as the second step and takes the quantisation levels.
  - `context.rs`: registers `opaque`.
  - `walk.rs` (`composite_iso_with`): opaque, then `blend_full` without quantisation, then `preserve`, which quantises once (as the CPU path does).
  - `classic3d.wgsl`: the same rule as the CPU's Classic 3D.

## Tests

- New render tests in `render/src/tests.rs`:
  - `preserve_transparency_keeps_the_alpha_below`: 2D and with both layers 3D. An opaque red layer over a 30 % blue background gives `[0.3, 0, 0, 0.3]`, and nothing where no pixels lie below.
  - `preserve_transparency_mixes_by_the_layer_opacity`: a 50 % layer over a 40 % background gives `[0.2, 0, 0.2, 0.4]`.
- Both fail without the change: the 2D case gives `[0.3, 0, 0.21, 0.51]`. With only `compose.rs` reverted, the 3D case gives the same wrong value.
- New unit test `preserve_keeps_the_alpha_below` in `color` (Normal, Multiply, nothing below).
- New unit test `preserve_keeps_the_alpha_below_in_stencil_and_silhouette_modes` in `color`: Stencil Alpha, Silhouette Alpha, Stencil Luma and Silhouette Luma leave the pixel below as it is (with the first commit alone, Stencil Alpha over alpha 0.3 with a 0.5 source gave alpha 0.15).
- New GPU test `preserve_transparency_rounds_once_at_8_bpc`: red at 30 % over black at alpha 128/255 gives red 38/255 on the GPU, as on the CPU. With the first commit alone the GPU gave 39/255, because it rounded the blend before applying the alpha below.
- `cargo test -p effectcraft-color -p effectcraft-raster -p effectcraft-render`: all passed on the first commit. After the second, the Preserve Transparency tests of `color` and `render` and the whole `effectcraft-gpu` suite were run again.
- `cargo test -p effectcraft-gpu` with `EFFECTCRAFT_REQUIRE_GPU=1` on lavapipe (Mesa software Vulkan): 323 passed, and 1 failed only because no OpenGL adapter exists on that machine (`opengl_adapters_get_cpu_compositing_at_once`). The GPU-vs-CPU test `masks_mattes_and_preserve_transparency` fails when only the GPU part of this change is reverted, so the GPU and CPU paths change together.
- Clippy (`-D warnings`) on the changed crates and `cargo fmt --check` are clean.
- I did not run the full `cargo xtask ci` and did not test on a hardware GPU.

The second commit answers the CodeRabbit review (alpha in stencil and silhouette modes, and the double rounding on the GPU). How After Effects itself combines Stencil or Silhouette with Preserve Transparency was not checked in a lab render.
