Title: aep import: a camera without a Position record stands back from its point of interest by the zoom

Branch: geterothis:fix/aep-import-camera-default-position (based on upstream main cd9ee1e4, one commit)

## What

After Effects 2026 writes no `ADBE Position` record for a camera whose Position is its point of interest moved back by the zoom, which is the usual straight-on camera. Only the zero `Position_0/1/2` records are there. The importer then leaves the camera at the new layer's default, on the plane of its point of interest, so the whole comp renders from the wrong place.

I checked this with a lab project saved by After Effects 2026 and read back after a restart:
- cameras set to `[200, 100, -1000]`, with the point of interest at `[200, 100, 0]` and Zoom 1000, store no record and read back `[200, 100, -1000]`. This holds for one-node and two-node cameras, and whether the zoom or the position is set first;
- `[50, 30, -700]`, or the same Position with Zoom 800, are stored as usual.

A second lab project has 23 such cameras. After Effects renders them at `[w/2, h/2, -1000]`, and EffectCraft placed every one at z = 0. With the Position derived, EffectCraft's frames have the same geometry as After Effects'.

## Change

- `import/camera.rs`: new `import_camera` imports the Camera Options as before, then sets Position to the point of interest minus the zoom along z when the transform has no `ADBE Position` record.
- `import/build.rs` calls it for cameras.
- Docs: aep-format (camera Position, absent) and aep-import (Cameras and lights).

Only sampled with the point of interest at z = 0.

## Tests

- New `export::objects::a_camera_without_a_position_record_stands_back_from_its_point_of_interest_by_the_zoom`: exports a camera, removes its Position record, imports it again and checks the Position. It fails without the change.
- `cargo test -p effectcraft-aep` (90 + 419 passed), clippy (`-D warnings`) and fmt pass. I did not run the full `cargo xtask ci`.
