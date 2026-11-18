# Lab job: keys on camera and light options; parallel / ambient lights, shadows, falloff

ONE headless After Effects 2026 instance, sequential, light load.

Purpose: the EffectCraft .aep exporter writes only the static value of keyed camera options (Zoom,
Depth of Field, Focus Distance, Aperture, Blur Level) and light options (Intensity, Colour, Cone
Angle / Feather), and drops parallel and ambient lights, Casts Shadows, shadow darkness / diffusion
and falloff ("not sampled"). We need After Effects-authored files to see how it stores them.

Please run `camlight_keys.jsx` in a new empty project. It builds comp `K` (a camera and a spot and a
point light with keyed options, linear / bezier / hold) and comp `S` (parallel and ambient lights, a
spot light that casts shadows, a point light with smooth falloff), then saves `camlight_keys.aep` and
`camlight_keys.json` (values, keys and ease as After Effects reports them) next to the script.
Also render PNG frames 0, 15, 30 and 45 of `K` and frame 0 of `S` (`K_00000.png` ...) for the later
read-back comparison. If a matchName is not found, the JSON names it (`...Error`); say which.
Commit everything here on test-corpus.
