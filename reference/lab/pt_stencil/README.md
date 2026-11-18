# Preserve Transparency + stencil modes lab (AE 26.5, aerender frame 0, PNG RGBA 8-bit straight)

Comp pt_stencil 400x100. Layer order, top to bottom: pt_normal, pt_stencil_luma, pt_silhouette_alpha, pt_stencil_alpha, BG.
- BG: full-frame solid (0.2, 0.4, 0.6), Opacity 30 %.
- Four 100x100 white solids at Opacity 50 %, all with Preserve Underlying Transparency ON, left to right: Stencil Alpha (blend 5240), Silhouette Alpha (5242), Stencil Luma (5241), Normal (5212, control).

Centre pixel of each quarter (R, G, B, A):

| quarter | RGBA |
|---|---|
| 1 Stencil Alpha | 51, 102, 153, 0 |
| 2 Silhouette Alpha | 51, 102, 153, 0 |
| 3 Stencil Luma | 51, 102, 153, 0 |
| 4 Normal (control) | 255, 255, 255, 0 |

The whole frame ends up fully transparent (alpha 0). Stencil and silhouette layers act on every layer below them, across the full comp, and each one is restricted by its own Preserve Transparency. Normal + PT then has no underlying alpha left at quarter 4. RGB values at alpha 0 are the straight colour AE writes, not visible colour.

## Isolated variant: pt_stencil_iso.aep

Each mode in its own 100x100 precomp (iso_pt_stencil_alpha, iso_pt_silhouette_alpha, iso_pt_stencil_luma, iso_pt_normal). Inside each, from top to bottom: one 50 % white solid with Preserve Underlying Transparency ON in that mode, then a BG solid (0.2, 0.4, 0.6) at 30 %. The four precomps sit side by side in comp pt_stencil_iso (400x100). Render: pt_stencil_iso_00000.png.

| quarter | RGBA |
|---|---|
| 1 Stencil Alpha | 51, 102, 153, 39 |
| 2 Silhouette Alpha | 51, 102, 153, 38 |
| 3 Stencil Luma | 51, 102, 153, 39 |
| 4 Normal (control) | 208, 220, 232, 77 |
