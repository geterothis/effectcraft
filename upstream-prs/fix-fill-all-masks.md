Branch: geterothis:effectcraft:fix/fill-all-masks (2 commits, ad4b8f9a and the review fix 64b4b667, on upstream main 67942cda; not stacked)
Compare: https://github.com/storytold/effectcraft/compare/main...geterothis:effectcraft:fix/fill-all-masks

Title: Fill: All Masks on a layer without masks fills nothing

Body:
## What

With Fill's All Masks on and no masks on the layer, After Effects 2026 leaves the layer as it was, with or without Invert and at any Opacity. EffectCraft filled the whole layer instead, and at Opacity 0 the layer disappeared. An After Effects project with that setting therefore rendered differently after import.

- `effects` `fill`: with All Masks on and no masks, the layer is returned unchanged. Fill's doc comment says so.
- `gpu` `effects.rs`: Fill with All Masks on is left to the CPU, as Fill Mask / All Masks with masks already are.

Fill without masks otherwise already matched After Effects (Opacity sets the layer's alpha, Invert fills the transparent areas). I checked that against 12 small comps rendered by After Effects 2026: the ten without All Masks match the existing behaviour, and the two with All Masks show the untouched layer.

## Tests

- `effects` `fill_all_masks_without_masks_leaves_the_layer`: All Masks alone, and All Masks with Invert at Opacity 0, leave the pixels unchanged. Fails without the change.
- `gpu` `fill_all_masks_without_masks_matches_cpu`: a GPU frame with that Fill matches the CPU frame with no pixel over the 32 bpc tolerance. Fails without the `gpu` change.
- `cargo test -p effectcraft-effects` passes. `cargo test -p effectcraft-gpu` passes on lavapipe except `opengl_adapters_get_cpu_compositing_at_once`, which needs an OpenGL adapter the machine doesn't have. `cargo clippy --all-targets -D warnings` (effects, gpu) and `cargo fmt` are clean. I didn't run the full `cargo xtask ci`.
