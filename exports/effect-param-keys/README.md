# Lab job: keys on angle, checkbox, popup and integer slider effect parameters written by EffectCraft (fix/aep-export-effect-param-keys, 7c127204)

ONE headless After Effects 2026 instance, sequential, light load. No Save As (the branch does not
have the solid opti-header fix #3882).

File: `effect_param_keys.effectcraft.aep`, built in code. Comp `C` (640x360, 25 fps, 4 s), one solid
layer `L` with Fractal Noise and Directional Blur. Before the fix these keys were dropped and only
the first key's value was written.

Please open it and, for each keyed property below, print `numKeys` and for every key `keyTime`,
`keyValue`, `keyInInterpolationType`, `keyOutInterpolationType` and the temporal ease (speed,
influence). Also `valueAtTime(0.5)` and `valueAtTime(1.5)`. Render frame 25 (1 s) and frame 50
(2 s) to PNG if it is cheap. Put the printout (and PNGs) in `roundtrip/effect-param-keys/` on
test-corpus.

Expected:
- Fractal Noise Evolution: 0 s 0°, 1 s 720°, 2 s 90° (linear, the last key's in side bezier with
  speed -100 °/s at 50 %); valueAtTime(0.5) = 360.
- Fractal Noise Invert: 0 s off, 1 s on, both keys Hold.
- Fractal Noise Fractal Type: 0 s Basic (1), 2 s Turbulent Basic (4), both keys Hold.
- Fractal Noise Evolution Options > Cycle (in Revolutions): 0 s 1, 1 s 40, linear; valueAtTime(0.5)
  about 20 or 21 (integer).
- Directional Blur Direction: 0 s 0°, 2 s 45°, linear; valueAtTime(1) = 22.5. Blur Length 20.
