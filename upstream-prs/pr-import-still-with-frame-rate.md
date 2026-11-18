Title: aep import: an image with a stored frame rate is a still

Branch: geterothis:fix/aep-import-still-with-frame-rate (based on upstream main cd9ee1e4)

## Problem

`footage_kind` named video and audio extensions, but not image ones. Any other file was decided by what the item stores: a native frame rate made it a clip. In a real After Effects 2026 project, two single JPEG stills store a frame rate. They were imported as video footage, and the .aep export then dropped them and their layers: "footage '….jpg': Video footage of type '.jpg' is not exported (no prototype)", and "footage layer whose footage is not exported".

## Change

- `import/build.rs` `footage_kind`: png, jpg, jpeg, tif, tiff, tga, exr, psd, bmp, ai, eps and pdf are stills whatever rate is stored. Sequences are decided before this function, as before. Animated formats (gif, webp) are left to the stored rate.
- `docs/aep-import.md`: the change line.

## Tests

- New `export::footage::a_still_with_a_stored_frame_rate_stays_a_still`: three stills (`.jpg`, `.PNG`, `.tif`) are exported, their items' native frame rate (`sspc@56`) is set to 25, and the file is imported and exported again. Without the change the three arrive as video and the export drops them. With it they are stills and are exported without a loss.
- The `footage_kind` unit test adds a `.JPG` with rate 25.
- `cargo test -p effectcraft-aep` (419 + 90 passed), clippy (`-D warnings`) and fmt pass for the crate. I did not run the full `cargo xtask ci`.
- The real project that showed this is private, so it is not attached. Its export report lines are quoted above.
