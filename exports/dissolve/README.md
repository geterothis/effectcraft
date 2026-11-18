# Dissolve / Dancing Dissolve, Preserve Transparency, DOF (one headless AE instance)

Run sequentially in ONE AE instance; keep load light.

1. **Read-back:** open `exports/dissolve/dissolve_pair.effectcraft.aep` (AE's dissolve_pair.aep imported into EffectCraft and exported again).
   Record per layer `blendingMode` (expect one DISSOLVE, one DANCING_DISSOLVE) and whether `app.project.save(new File(".../roundtrip/dissolve/dissolve_pair.resaved.aep"))` works.
2. **Sample:** fresh project, one comp, four solids:
   `pt_dissolve` (DISSOLVE + preserveTransparency), `pt_dancing` (DANCING_DISSOLVE + preserveTransparency),
   `dissolve` (DISSOLVE), `dancing` (DANCING_DISSOLVE). Save as `roundtrip/dissolve/pt_dissolve.aep`.
3. **DOF:** open the lab project used for `reference/lab/c3d` (layer/comp `d02_dof_a80`). Report the camera's
   `depthOfField`, `focusDistance`, `aperture`, `blurLevel`, the comp's renderer and its "draft 3D" / motion-blur switches,
   then render one frame again with the Classic 3D renderer at Full/Best to `roundtrip/dissolve/d02_dof_a80.png`.
   If still sharp, try `comp.draft3d = false` and set the camera layer's `depthOfField` explicitly, then render once more to `d02_dof_a80_b.png`.

Write results to `roundtrip/dissolve/results.json`.
