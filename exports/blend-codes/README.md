# Blend codes 35-38 + Preserve Transparency export read-back

`10_blend_modes.effectcraft.aep` = corpus 10_blend_modes imported into EffectCraft and exported back
(build with fix/aep-blend-codes-35-38 + fix/aep-export-preserve-transparency).

AE side (ONE headless AE instance only, no parallel renders):
1. Open the file in AE 2026, relink footage to the PC corpus media if asked.
2. For each layer of comp `blend_modes`, record layer name, blendingMode and preserveTransparency
   into `roundtrip/10_blend_modes.layers.json`.
3. Render frames 0, 15, 29 of comp `blend_modes` to `roundtrip/10_blend_modes_f<N>.png`.
These are compared against reference/10_blend_modes and the original corpus layer settings.
