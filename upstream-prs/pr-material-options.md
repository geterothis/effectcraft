Title: aep import: Material Options and light shadow settings

Branch: geterothis:fix/aep-import-material-options (based on upstream main cd9ee1e4, one commit)
Compare: https://github.com/storytold/effectcraft/compare/main...geterothis:effectcraft:fix/aep-import-material-options

## What

The importer never reads a layer's Material Options. A 3D layer set to Casts Shadows On in After Effects comes in with Casts Shadows Off, so a scene lit with shadows renders without them. The report only says, in a general limitation line, that 3D material options are not decoded. The Shadow Darkness and Shadow Diffusion of a light are reported as not imported.

I made a lab file in After Effects 2026 with one Material Options property set on each layer, and a spot light with Casts Shadows, Shadow Darkness 70 and Shadow Diffusion 10. Each set property is a record of state 1 under `ADBE Material Options Group`:

- Casts Shadows and Accepts Shadows: 0 Off, 1 On, 2 Only. These are 0-based, unlike an effect popup.
- Accepts Lights: 0.0 when off.
- Light Transmission, Ambient, Diffuse, Specular, Shininess and Metal coefficients: plain percent. Ambient was also keyed.
- The light's `ADBE Light Shadow Darkness` and `ADBE Light Shadow Diffusion`: plain numbers.

The other properties of the group (Shadow Color, Appears in Reflections, the reflection and transparency values) are default-state records on every layer and are skipped, as before.

## Change

- `import/props.rs`: new `Kind::Enum(n)` for a popup stored 0-based. A value outside `0..n` is rejected (default kept, reported as damaged data). It has no ease, like the other popups.
- `import/camera.rs`: a `MATERIAL` table and `import_material_options`, using the same loop as the camera and light options. Shadow Darkness and Shadow Diffusion are added to the `LIGHT` table. Keys on an `Enum` property are reported as not sampled, as for a checkbox.
- `import/build.rs`: the camera, light and material option calls move into a helper `import_options`, which also imports the Material Options of every layer that has them in EffectCraft. The helper keeps `build_layers` under clippy's cognitive complexity limit.
- `import/report.rs`: "3D material options" is removed from the limitation line, and from the report unit test's expected JSON.
- `docs/aep-format.md` (3.12): rows for the light shadow settings and for Material Options.
- `docs/aep-import.md`: a Material Options row, the light shadow settings in the Cameras and lights row, and the limitation text updated.

## Tests

New `tests/it/import/material_options.rs`:

- `material_options_are_imported` writes the nine properties into the default-state records of `synthetic.aep` and checks every layer's values. It also checks that nothing is reported and that the limitation line is gone.
- `a_casts_shadows_value_out_of_range_keeps_the_default` stores 3 and checks that the default stays and that a damaged-data loss is reported.
- `the_shadow_darkness_and_diffusion_of_a_light_are_imported` uses corpus case 254 (spot light), with two of its default-state light records renamed to Shadow Darkness and Shadow Diffusion. The case stores neither, because After Effects writes them only when they are set.

All three fail without the source change. With `EFFECTCRAFT_AEP_FIXTURES_REQUIRED=1` and the pinned corpus, `cargo test -p effectcraft-aep` gives 90 + 421 passed, 0 failed. Clippy (`-D warnings`) and `cargo fmt --check` are clean. I did not run the full `cargo xtask ci`.

## Checked against After Effects 2026

The lab values come straight from the After Effects file. On a real test project (a spot light with shadows, two 3D layers set to Casts Shadows On, a floor, camera with depth of field), I rendered 7 frames with the EffectCraft CLI and compared them with After Effects' renders. With the imported Casts Shadows the shadows of those layers now appear, as in After Effects. The mean difference per frame went from 13.2–14.0 to 11.6–13.0 (of 255), and the pixels more than 24 levels off from 17–20 % to 15–19 %.
