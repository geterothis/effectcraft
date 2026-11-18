Title: aep export: write keys on camera and light options

Branch: geterothis:fix/aep-export-camera-light-keys (based on upstream main cd9ee1e4)

## Problem

The .aep exporter wrote only the static value of a camera's or light's options. Keys on Zoom, Depth of Field, Focus Distance, Aperture and Blur Level, and on a light's Intensity, Colour, Cone Angle and Cone Feather, were dropped with "keys or an expression on the camera's … (the static value is written)". A camera zoom or focus pull, or a light fading in, came out static in After Effects.

## What After Effects stores

Checked with a project saved by After Effects 2026 (26.5) with keys on all of these options (linear, bezier and hold):

- A keyed option record is the static record with `tdb4` byte 5 losing its static bit (`0x01`), byte 68 set to 1, and byte 79 cleared (only the colour's static record sets it). The key list takes the place of `cdat`.
- One-component options use 48-byte plain keys in the units shown. The ease speed is in shown units per second. Depth of Field keys are held.
- The light colour uses 152-byte colour keys, `[A, R, G, B]` 0..255.

## Change

- `export/camlight.rs`: `CameraPlan` and `LightPlan` carry the keys of their options. They are planned in the layer's time base, like shape and text animator keys (`plan_camera_keys`, `plan_light_keys`), and written in the keyed form above. A light option that is keyed is written even when its static value is the default. Depth of Field keys are written held. Bezier ease on a colour key is written linear and reported, as on effect colours.
- Expressions on these options are still reported (their keys or static value are written).
- `export/plan.rs`: plans the keys once the layer's time base is known.
- `docs/aep-export.md`: the change line and the `cameras` / `lights` row.

## Tests

- New `export::objects::keys_on_camera_and_light_options_are_written`: a camera and a spot light with keys on seven options export without a loss. The file's key times, values and interpolation are checked, and the importer reads the keys back. It fails without the change (seven losses, no keys).
- `cargo test -p effectcraft-aep` (419 + 90 passed), clippy (`-D warnings`) and fmt pass for the crate. I did not run the full `cargo xtask ci`.
- After Effects 2026 (26.5) read-back:
  - A file built from the test project matches every key value, interpolation and `valueAtTime`. One difference is After Effects' own: the Zoom key before a key with hold in comes back with out speed 0 (that segment is held).
  - After Effects' own keyed project, imported into EffectCraft and exported again, comes back with the same keys. Frames 0 and 45 render identically to the original. Frames 15 and 30 differ only by depth of field, because EffectCraft's importer does not read Depth of Field keys or Blur Level on this base (not part of this change). The only ease differences are on the last key's outgoing side, which no interpolation uses.

## Not matched

- Expressions on camera and light options, iris and highlight settings, parallel and ambient lights, falloff and shadows are still reported, as before.
