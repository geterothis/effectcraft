# Round 2: camera Position storage and DOF scale (ONE headless AE instance, sequential)

Findings so far: in `lab_c3d.aep` none of the 23 cameras has an `ADBE Position` record (only zero `Position_0/1/2`),
so EffectCraft imports them at the point of interest (z = 0). With the camera moved to (w/2, h/2, -1000) by hand,
EffectCraft's geometry matches After Effects exactly, and its blur at Aperture A matches After Effects at about 9.4 x A
(AE a80 ~ EC a8; AE a400 ~ EC a42.5).

1. `corpus/build/lab_campos.jsx` (new empty project, `LAB_OUT` = `roundtrip/campos`): it saves, reopens and writes
   `lab_campos.json` itself. No render.
2. `corpus/build/lab_dof2.jsx` (new empty project, `LAB_OUT` = `roundtrip/dof2`): then render its queue with ONE
   aerender. Commit the `.aep` (saved in place, copy it to `roundtrip/dof2/lab_dof2.aep`), the PNGs and `lab_dof2.json`.
