Title: Exposure: no own linear conversion in a linearized working space

Branch: geterothis:fix/exposure-linear-working-space (based on upstream main cd9ee1e4, one commit)
Compare: https://github.com/storytold/effectcraft/compare/main...geterothis:effectcraft:fix/exposure-linear-working-space

## What

In a project with Linearize Working Space on, Exposure applies its own 2.2 conversion to pixels that are already linear, so the result is far too dark. The code comment said this was kept "as before". After Effects does not do it.

I checked this in After Effects 2026: a 32 bpc project with an sRGB working space and Linearize Working Space on, and a solid of linear (1, 0.6, 0.2). I read the values back from a 32-bit float render in the linear working space profile.

| Settings | After Effects | EffectCraft before | EffectCraft with this PR |
|---|---|---|---|
| Exposure +2 | 4.0, 2.4, 0.8 | 1.878, 1.127, 0.376 | 4.0, 2.4, 0.8 |
| Exposure +2, Bypass on | 4.0, 2.4, 0.8 | 4.0, 2.4, 0.8 | 4.0, 2.4, 0.8 |
| Exposure +1, Offset 0.05 | 2.05, 1.25, 0.45 | 1.386, 0.850, 0.364 | 2.05, 1.25, 0.45 |

In a linear working space, Bypass Linear Light Conversion makes no difference in After Effects. The same project with Linearize off renders exactly as EffectCraft does now (8 bpc and 32 bpc, PNG values match), so non-linear projects are unchanged.

## Change

- `effects/src/color_fx.rs`: new `pub fn exposure_bypass(ctx)`. It is true when Bypass is on or `ctx.env.working_linear` is set. Exposure uses it, and its doc comment is updated.
- `effects/src/lib.rs`: exports `exposure_bypass`.
- `gpu/src/effects.rs`: the GPU Exposure takes its bypass flag from `exposure_bypass`, so CPU and GPU agree.
- `docs/effects-parity.md`: a change-log row.

## Tests

- New test `exposure_in_a_linear_working_space_scales_the_linear_values` in `effects/src/color_fx/tests.rs`, with the After Effects values above (Bypass off and on, and Exposure +1 with Offset 0.05). It fails without the change (Bypass off gives `[1.878, 1.127, 0.376]`).
- `cargo test -p effectcraft-effects`: 645 passed.
- `gpu_effects_match_cpu` passes with `EFFECTCRAFT_REQUIRE_GPU=1` on lavapipe (Mesa software Vulkan). That test runs Exposure in a non-linear environment only.
- Clippy (`-D warnings`) on both crates and `cargo fmt --check` are clean.
- I did not run the full `cargo xtask ci` and did not test on a hardware GPU.
