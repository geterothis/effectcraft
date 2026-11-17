# EffectCraft .aep test corpus

Real After Effects projects built by script in AE 26.5 (2026) to test EffectCraft's .aep import/export.

Layout: `aep/ae2026_v26/` projects, `media/` footage they reference (keep the relative layout), `reference/` AE renders, `build/` generator scripts, `manifest.json` machine-readable list.

## Feature files

| File | Main comp | What it tests | aerender, s |
|---|---|---|---|
| `01_solids_nulls_adjustment.aep` | `None` | Solids (incl. PAR 2), null parent with rotation keys, adjustment layer with a mask limiting Hue/Saturation + Gaussian Blur, disabled/guide/shy/locked/draft layers, trimmed in/out, label+comment, purple comp background. | 12.2 |
| `02_shapes_basic.aep` | `shapes_basic` | rect/ellipse/star/polygon/bezier path; fill + stroke, joins, caps; dashes; linear & radial gradient fill (default white-black colors); gradient stroke; nested groups with transform & opacity; even-odd fill rule; animated rect size | 12.2 |
| `03_shapes_modifiers.aep` | `shapes_modifiers` | repeater (animated offset); trim paths (animated end/offset); offset paths; twist; zig zag; pucker & bloat; wiggle paths (roughen); merge paths + round corners; wiggle transform | 12.3 |
| `04_text.aep` | `text` | point text fonts Arial-Bold/Georgia/Times/Impact/Verdana; stroke over fill, tracking, all caps, justification; paragraph box text, leading; animator range selector (position/opacity); animator wiggly selector (scale/rotation/fill); expression selector + tracking + blur; text on mask path, first margin keys; source text hold keyframes; per-character 3D flag | 14.8 |
| `05_footage_images.aep` | `footage_images` | PNG with alpha; JPG; PNG radial soft alpha; PSD as merged footage; PSD imported as composition (layers); PNG sequence conformed to 12fps, loop 3 | 12.9 |
| `06_footage_video_audio.aep` | `footage_video_audio` | H.264 MP4 1280x720 30fps (embedded AAC, audio switched off); 25fps clip in 30fps comp, startTime 0.5; ProRes 4444 with alpha; WAV stereo 48k with audio level fades; MP3 44.1k starting at 1s | 17.6 |
| `07_precomps_nesting.aep` | `precomps_nesting` | 3-level nesting; precomp at different fps (25) and size; precomp instance with negative start time; collapse transformations scaled 400% (vector stays sharp); time stretch 200% on precomp layer | 12.2 |
| `08_masks.aep` | `masks` | mask modes add/subtract/intersect/difference/lighten/darken/none; feather, expansion, opacity, inverted; animated mask path (square->circle); rotobezier open mask driving Stroke effect | 13.7 |
| `09_track_mattes.aep` | `track_mattes` | alpha / alpha inverted matte (text matte); luma / luma inverted matte (image matte); one matte shared by two layers, matte not adjacent, animated | 14.8 |
| `10_blend_modes.aep` | `blend_modes` | 31 blend modes over photo: NORMAL,DISSOLVE,DARKEN,MULTIPLY,COLOR_BURN,CLASSIC_COLOR_BURN,LINEAR_BURN,DARKER_COLOR,ADD,LIGHTEN,SCREEN,COLOR_DODGE,CLASSIC_COLOR_DODGE,LINEAR_DODGE,LIGHTER_COLOR,OVERLAY,SOFT_LIGHT,HARD_LIGHT,LINEAR_LIGHT,VIVID_LIGHT,PIN_LIGHT,HARD_MIX,DIFFERENCE,CLASSIC_DIFFERENCE,EXCLUSION,SUBTRACT,DIVIDE,HUE,SATURATION,COLOR,LUMINOSITY; preserve transparency (T switch) in precomp | 13.7 |
| `11_3d_camera_lights.aep` | `threed_camera_lights` | Classic 3D renderer; 3D solids/footage/text, orientation vs rotation; two-node camera with DOF, animated position; spot (shadows), point, ambient, parallel lights; casts/accepts shadows material options; one-node camera with Z rotation (2nd comp) | 14.8 |
| `12_keyframes_easing.aep` | `keyframes_easing` | linear, easy ease 33%, ease 80%, hold; custom speed/influence; auto-bezier, continuous; spatial bezier tangents + roving key + auto-orient along path; separated X/Y dimensions; 3-dim scale ease; mixed in-linear/out-bezier key | 12.0 |
| `13_expressions.aep` | `expressions` | wiggle with seedRandom; loopOut cycle / pingpong; time-driven rotation; linear() from slider; color/checkbox/point/angle expression controls; valueAtTime layer reference; posterizeTime; lookAt via atan2; sourceText expression; expression on effect parameter; index + hslToRgb; ease() function; JavaScript engine expressions (project default) | 13.2 |
| `14a_effects_blur_color.aep` | `effects_blur_color` | gaussian_blur; fast_box_blur; directional_blur; radial_blur_zoom; glow; hue_saturation; brightness_contrast; levels_gamma; curves_default; exposure; tint; tritone; fill; invert; black_white; vibrance; posterize; noise; sharpen; unsharp_mask | 27.5 |
| `14b_effects_distort_generate.aep` | `effects_distort_generate` | transform; corner_pin; mirror; offset; motion_tile; wave_warp; turbulent_displace; bulge; twirl; polar_coordinates; gradient_ramp_radial; four_color_gradient; fractal_noise_anim; checkerboard; grid; cell_pattern; cc_bend_it; cc_radial_fast_blur; cc_vignette | 22.4 |
| `14c_effects_stylize_transition.aep` | `effects_stylize_transition` | drop_shadow; simple_choker; echo; find_edges; mosaic; emboss; venetian_blinds; linear_wipe_anim; radial_wipe; stroke_on_mask; color_key; linear_color_key; set_channels; minimax; roughen_edges; scatter; strobe_light; block_dissolve | 22.9 |
| `15_time_remap.aep` | `time_remap` | time remap reverse + hold freeze; eased speed ramp; time stretch -100% (reverse) and 50%; time remap slow-mo on video with frame mix blending | 20.1 |
| `16_parenting.aep` | `parenting` | 3-level chain with anchors and rotation; parent with non-uniform scale animation; negative scale parent (mirror); 2D child of 3D parent; text layer parented to animated layer | 15.5 |
| `17_essential_graphics.aep` | `essential_graphics` | Essential Properties on precomp: Title Text, Badge Color, Badge Scale, Icon Opacity, Icon Rotation; 3 instances: defaults, static overrides (text/color/scale/opacity/rotation), keyframed overrides; motionGraphicsTemplateName | 14.7 |
| `18_markers_comp_settings.aep` | `markers_comp_settings` | 29.97 drop-frame, start timecode 01:00:00;00; work area; comp motion blur (shutter 270/-135) per-layer on/off; comp markers with duration/chapter/url/label; layer marker with comment + parameters; non-square PAR 4:3 at 23.976; odd size 333x777 at 60fps | 13.4 |
| `20_kitchen_sink.aep` | `kitchen_sink` | combined: blurred plate, inverted feathered mask multiply vignette, 3D precomp card with text animator + trim path + drop shadow, camera dolly, repeater sparks with glow (add mode), audio, null parent with expression | 26.4 |
| `21_project_16bpc.aep` | `project_16bpc` | project 16 bpc; smooth ramp (banding); exposure + glow | 17.6 |
| `22_project_32bpc_linear.aep` | `project_32bpc_linear` | project 32 bpc float; linear blending / linearized working space (if supported); overbright exposure + glow, add blend | 18.1 |
| `23_project_structure.aep` | `project_structure` | nested project folders; renamed + unused footage; item labels and comments; placeholder (missing footage) item; proxy set but disabled on precomp; auto Solids folder | 9.8 |

## Effects sweep (338 built-in effects, default parameters)

| File | Category | Effects | aerender, s |
|---|---|---|---|
| `fx_all_3D_Channel.aep` | 3D Channel | 8 | 12.6 |
| `fx_all_Audio.aep` | Audio | 13 | 12.4 |
| `fx_all_Blur_Sharpen.aep` | Blur & Sharpen | 16 | 17.1 |
| `fx_all_Boris_FX_Mocha.aep` | Boris FX Mocha | 1 | 13.2 |
| `fx_all_Channel.aep` | Channel | 13 | 10.7 |
| `fx_all_Color_Correction.aep` | Color Correction | 40 | 14.0 |
| `fx_all_Distort.aep` | Distort | 37 | 16.1 |
| `fx_all_Expression_Controls.aep` | Expression Controls | 8 | 12.2 |
| `fx_all_Generate.aep` | Generate | 26 | 12.9 |
| `fx_all_Immersive_Video.aep` | Immersive Video | 12 | 11.1 |
| `fx_all_Keying.aep` | Keying | 11 | 13.8 |
| `fx_all_Matte.aep` | Matte | 4 | 12.8 |
| `fx_all_Noise_Grain.aep` | Noise & Grain | 13 | 16.4 |
| `fx_all_Obsolete.aep` | Obsolete | 10 | 12.3 |
| `fx_all_Obsolete_hidden.aep` | _Obsolete | 39 | 15.5 |
| `fx_all_Perspective.aep` | Perspective | 10 | 12.5 |
| `fx_all_Simulation.aep` | Simulation | 18 | 31.1 |
| `fx_all_Stylize.aep` | Stylize | 25 | 12.4 |
| `fx_all_Text.aep` | Text | 2 | 10.3 |
| `fx_all_Time.aep` | Time | 8 | 17.5 |
| `fx_all_Transition.aep` | Transition | 17 | 12.4 |
| `fx_all_Utility.aep` | Utility | 7 | 12.1 |

Effects that could not be applied by script (they open a modal dialog on apply): Basic Text (ADBE Basic Text2), Path Text (ADBE Path Text), Numbers (ADBE Numbers2). Their comps exist without the effect.

## Notes

- Not included: AE 2024/2025 are not installed on the build PC (only leftover folders), and AE 2026 'Save a Copy As 25.x/24.x' crashes the windowless AE instance.
- `19_layer_styles` is missing: Layer Styles can only be applied through the menu, which crashes windowless AE.
- Gradient fills/strokes keep AE's default white-black ramp (gradient colors are not scriptable).
- Warp Stabilizer / Rolling Shutter Repair / Camera Shake Deblur render an 'analyzing' state with default settings.
- Reference PNGs are straight RGB+alpha, 8 bpc (16/32 bpc projects are rendered at 8 bpc too).
