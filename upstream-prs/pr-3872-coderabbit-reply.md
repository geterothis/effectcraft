Reply to the CodeRabbit comment on crates/color/src/blend.rs (blend_pixel_preserve, stencil and silhouette alpha):

Checked against After Effects 2026 lab renders (frame 0, 8-bit RGBA). The setup is a white layer at 50 % with Preserve Transparency over a background at 30 % alpha. In Stencil Alpha, Silhouette Alpha and Stencil Luma modes it leaves alpha 39, 38 and 39 of 255. That is about 30 % × 50 %, the same as without the switch, not the 30 % below. In a second render, a Stencil Alpha layer with Preserve Transparency still cleared the alpha of the rest of the comp, where it has no pixels. So stencil and silhouette modes keep their plain result. The second commit records this in `preserve_leaves_stencil_and_silhouette_modes_cutting_the_alpha_below`. For the other modes, the result keeps the alpha below, with the colour of the plain composite (the lab's Normal layer gives (208, 220, 232) at alpha 77).

Reply to the CodeRabbit comment on crates/gpu/src/walk.rs (double quantisation):

Confirmed and fixed in the second commit. `blend_full` now runs without quantisation, and `preserve` quantises once, after the alpha below is applied. The new GPU test `preserve_transparency_rounds_once_at_8_bpc` gives 4/255 with the fix and 5/255 without it.
