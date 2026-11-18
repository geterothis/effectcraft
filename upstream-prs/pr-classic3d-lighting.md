# render: Classic 3D specular exponent and spot feather as After Effects renders them

Branch: `fix/render-classic3d-lighting` (on main)

## Problem

Classic 3D layers lit by lights came out noticeably brighter than in After Effects 2026. On a real project with a spot, point, ambient and parallel light (corpus `11_3d_camera_lights`), the card and the floor were 13-45 % too bright.

## What After Effects does (measured)

A lab of 21 single-light Classic 3D comps was rendered by After Effects 26.5 (frame 0, 8 bpc; one grey 3D solid facing a one-node camera, one variable per comp). EffectCraft's model already matches it for these:
- diffuse = layer colour × Diffuse × light colour × intensity × N·L;
- ambient = Ambient × the ambient lights;
- several lights add up;
- a point light has no distance falloff (falloff None);
- the spot's hard cone edge at feather 0;
- specular at the highlight peak, with Metal mixing the light and layer colours.

Two terms differ:

1. **Specular Shininess is the exponent itself.** A parallel light 60° off the normal with the viewer on the normal puts the half vector 30° off. With Specular 100 % and Metal 0, AE renders 124/255 at Shininess 5 %, which is 0.866^5. At 40 % it renders 1/255, which is 0.866^40. EffectCraft used `256^(shininess)` (1.32 at 5 %), so its highlights were far broader and added light everywhere.
2. **The spot feather falls off over the cosine of the angle, not the angle.** For a spot 500 px in front of a plane with cone 60 and feather 50, the light is full to 15° and gone from 30°. In between it follows a smoothstep in cos(angle): 0.684 at 21.9° and 0.193 at 26.6° in AE, against 0.56 and 0.17 with a smoothstep over the angle. Feather 100 matches the same rule (0.873 at 14.1°).

## Fix

- `Material::exponent` returns the Shininess percentage, at least 1.
- `LightState::attenuation` interpolates the feather between the cosines of the inner and outer angles, divided by that interval itself (it is never empty inside the feather branch, however narrow the cone).
- The same two changes are made in `classic3d.wgsl`, which takes the exponent from `Material::exponent`. In f32 a cosine near 1 rounds to 1, so the shader writes the same smoothstep with 1 − cos: half the squared distance between the unit vectors for the point, and 2·sin²(angle / 2) for the inner and outer angles.

## Results

- AE's `material_options` lab (twelve Material Options variants under a spot): mean difference from 20.2 to 3.5 of 255. The eight lit tiles and the floor I sampled are now identical to AE.
- Corpus `11_3d_camera_lights` frames 0 / 45 / 89: mean difference from about 12 to 0.9 / 1.5 / 1.2. Most of what remains is the depth-of-field blur (looked at separately) and a missing font.

## Tests

- New `three_d::tests::spot_feather_falls_off_over_the_cosine_of_the_angle` and `three_d::tests::specular_shininess_is_the_exponent`, using the lab values (the 40 % highlight is checked against 0.866^40 = 0.00317 on both sides). Both fail without the fix.
- New `three_d::tests::a_very_narrow_spot_still_feathers_over_its_own_cone`: a 0.004° cone at feather 100 leaves under 1 % of the light at 99 % of its half-angle.
- New GPU parity test `tests::three_d::narrow_spot_feather`: a 0.2° spot at feather 100, 30 000 px from the plane, matches the CPU at 8 and 32 bpc. With the cosine form in the shader it fails (4560 of 16000 pixels off, max 0.075).
- `cargo test -p effectcraft-render`, the GPU `tests::three_d` CPU/GPU parity tests (lavapipe, `EFFECTCRAFT_REQUIRE_GPU=1`), the engine `tests::three_d` / `rig3d` tests, clippy (`-D warnings`) and fmt pass for the touched crates. I did not run the full `cargo xtask ci`.
