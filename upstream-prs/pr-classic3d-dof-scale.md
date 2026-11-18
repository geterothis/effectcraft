Title: render: Classic 3D depth of field blurs as wide as After Effects

Branch: geterothis:fix/render-classic3d-dof-scale (based on upstream main cd9ee1e4)

## Problem

Classic 3D depth of field came out about nine times blurrier than in After Effects 2026, and the blur did not change with the camera's zoom against its focus distance. On corpus `11_3d_camera_lights` the out-of-focus layers were smeared where After Effects shows only a slight blur.

## What After Effects does (measured)

Two lab projects were rendered by After Effects 26.5 (frame 0, Fast Rectangle iris, a white 3D square on black, the camera straight on). Each edge of an out-of-focus square ramps linearly, so the blur is a box. Its full width on the image is

`Aperture · |depth − focus| / depth · (zoom / focus) / 9`

- Zoom = focus = 1000, the square at depth 2000, Aperture 400: 22.2 px. It is the same at comp widths 600, 1200 and 1920 and heights 300, 600 and 1080, and halves with Aperture 200.
- Zoom 2000 (focus 2000): the width doubles with the zoom.
- Zoom 1000, focus 1500: 7.2 px. Zoom 1500, focus 1000: 47.1 px. The formula gives 7.4 and 44.4, within 6 %.
- Blur Level 50 % gives 0.476 of the width and 25 % gives 0.23. EffectCraft already scales the blur by Blur Level.

EffectCraft used the circle of confusion `Aperture · |depth − focus| / depth` as the blur diameter. That is 200 px in the first case against After Effects' 22.2.

## Change

- `three_d/compose.rs` `dof_radii_at`: the blur diameter on the image plane is the circle of confusion × zoom / focus / 9 (new `CLASSIC_DOF_DIVISOR`). Half of it is the radius, converted to layer pixels as before. Advanced 3D depth of field is not changed.
- The existing depth-of-field tests use larger apertures so they still blur by the amounts they test. The huge-aperture cases still reach the radius cap.

## Tests

- New `three_d::tests::dof_blur_width_matches_after_effects`: the three zoom / focus cases above, within 8 % + 1.5 px of After Effects' ramps. It fails without the change (137.5 px against 22.2).
- `cargo test -p effectcraft-render` (428 passed), the GPU `tests::three_d` parity tests (lavapipe, `EFFECTCRAFT_REQUIRE_GPU=1`), the engine `three_d` tests, clippy (`-D warnings`) and fmt pass for the touched crate. I did not run the full `cargo xtask ci`.

## Not matched

With the focus away from the zoom the width is off by 3-6 %; `(zoom / focus)^1.11` fits better but I did not want to fit an exponent to two points. Blur Level is slightly below linear (0.476 at 50 %).
