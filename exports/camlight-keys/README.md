# Lab job: camera and light option keys written by EffectCraft (fix/aep-export-camera-light-keys, c01a3403)

ONE headless After Effects 2026 instance, sequential, light load. No Save As needed (this branch does
not have the solid opti-header fix #3882).

## 1. `camlight_keys.effectcraft.aep` (built in code)

Comp `C` (1920x1080, 25 fps, 4 s): layer 1 `Spot` (spot light), layer 2 `Cam` (two-node camera).
Before the fix every key below was dropped and only the static value was written.

For each property listed, print `numKeys`, and per key `keyTime`, `keyValue`,
`keyInInterpolationType`, `keyOutInterpolationType`, `keyInTemporalEase` / `keyOutTemporalEase`
(speed, influence); also `valueAtTime(0.5)`. Put it in `roundtrip/camlight-keys/result.json`.

Expected:
- Cam Zoom: 0 s 2666.7 (linear), 1 s 1800 (bezier in / out; out ease speed -50, influence 75 %),
  2 s 3000 (in hold). valueAtTime(0.5) is not linear (the second key eases in).
- Cam Depth of Field: 0 s off, 1 s on, both hold.
- Cam Aperture: 0 s 25.3, 2 s 120 (linear); valueAtTime(0.5) = 48.975.
- Cam Blur Level: 0 s 100, 1 s 250 (linear); valueAtTime(0.5) = 175.
- Spot Intensity: 0 s 100, 1 s 180 (linear); valueAtTime(0.5) = 140.
- Spot Color: 0 s [1, 1, 1], 2 s [1, 0.5, 0.2] (linear); valueAtTime(0.5) = [1, 0.875, 0.8].
- Spot Cone Angle: 0 s 90, 2 s 45 (linear); valueAtTime(0.5) = 78.75.

## 2. `camlight_keys.ae_ec_ae.aep` (lab/camlight-keys/camlight_keys.aep through EffectCraft)

Please open it and render comp `K` frames 0, 15, 30, 45 and comp `S` frame 0 as PNG into
`roundtrip/camlight-keys/` (`K_00000.png` ...), and print the same key dump for comp `K` (cam Zoom,
Focus Distance, Aperture; spot Intensity, Color, Cone Angle, Cone Feather; point Intensity).
Compare the frames with `lab/camlight-keys/K_*.png`.

Known and expected on this branch (not part of the fix): EffectCraft's importer does not read Depth of
Field keys or Blur Level, so `cam` comes back with Depth of Field static and Blur Level 100; frames 15
and later may differ by depth of field. Comp `S` loses the parallel and ambient lights and Casts
Shadows (reported, "not sampled").
