# Round 3: DOF constant (ONE headless AE instance, sequential)

lab_dof2 result: After Effects' Classic 3D DOF is a box blur (linear alpha ramps) whose full width is
Aperture x |d - focus| / d / 9 in comp pixels, the same for widths 600 / 1200 / 1920 and zoom 1000 / 2000.
EffectCraft uses Aperture x |d - focus| / d, so it blurs 9x more. Every lab_dof2 comp was 300 px high and had
focus = zoom, so this round varies those.

`corpus/build/lab_dof3.jsx` (new empty project, `LAB_OUT` = `roundtrip/dof3`), then render its queue with ONE
aerender. Commit the PNGs, `lab_dof3.json` and a copy of the `.aep` as `roundtrip/dof3/lab_dof3.aep`.
