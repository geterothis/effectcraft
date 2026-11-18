Title: aep import: a camera's Blur Level

Branch: geterothis:fix/aep-import-camera-blur-level (based on upstream main cd9ee1e4, one commit)

## What

The importer reports a camera's Blur Level as "not imported" and keeps 100 %. After Effects 2026 stores it as `ADBE Camera Blur Level` in percent, like EffectCraft's `blurLevel`. In a lab project, 50 is stored as 50, and After Effects blurs that camera half as much as the same camera at 100.

## Change

- `import/camera.rs`: Blur Level joins the Camera Options table. The special case that skipped a stored 100 is no longer needed and is removed.
- Docs: aep-format (camera depth of field row) and aep-import (Cameras and lights; `transform_properties` no longer names Blur Level).

## Tests

- New `export::objects::a_camera_blur_level_is_read_back`: a camera with Blur Level 50 exports and imports again without a loss, and comes back with 50. Without the change, the import is refused with "ADBE Camera Blur Level not imported".
- `cargo test -p effectcraft-aep` (90 + 419 passed), clippy (`-D warnings`) and fmt pass. I did not run the full `cargo xtask ci`.
