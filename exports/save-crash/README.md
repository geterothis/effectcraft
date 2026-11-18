# AE 2026 save crash: bisect

The read-back of exports/blend-codes/10_blend_modes.effectcraft.aep showed: AE opens and renders it, but File > Save crashes AE.
These are minimal EffectCraft exports (same build), from simplest to fuller:

| file | contents |
|---|---|
| s1_empty | empty project |
| s2_comp | one 320x180 comp, no layers |
| s3_solid | comp + one solid |
| s4_text | comp + one text layer |
| s5_shape | comp + one rectangle shape layer |
| s6_3d | comp + solid + two-node camera + spot light |
| s7_corpus01 | corpus 01_solids_nulls_adjustment imported and exported |

AE side, ONE headless AE instance, one file at a time: open, then Save As a copy (`app.project.save(new File(".../roundtrip/save-crash/<name>.resaved.aep"))`).
Record in `roundtrip/save-crash/results.json` per file: opened (yes/no), saved (yes/no/crash), and any error text.
Stop at the first crash only if AE needs a restart; otherwise continue through all seven.

Also, for Dissolve: in a fresh project, make one comp with two solids, one with blendingMode DISSOLVE and one with DANCING_DISSOLVE, and save as `roundtrip/save-crash/dissolve_pair.aep` (the two are both stored as code 3 in ldta byte 99; this shows where AE tells them apart).
