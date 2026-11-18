# Lab job: mask Opacity and Expansion keys written by EffectCraft (fix/aep-export-mask-keys, 1c90e3c0)

ONE headless After Effects 2026 instance, sequential, light load. No Save As needed (this branch
does not have the solid opti-header fix #3882, so saving may crash for that unrelated reason).

File: `mask_keys.effectcraft.aep`, built in code. Comp `C` (1920x1080, 25 fps, 5 s), one red solid
layer `L` with two masks. Before the fix the keys were dropped and only the static value was written.

Please open it and, for each mask of layer `L` (`Fade`, `Linear`), print for `Mask Opacity` and
`Mask Expansion`: `numKeys`, and for every key: `keyTime`, `keyValue`, `keyInInterpolationType`,
`keyOutInterpolationType`, `keyInTemporalEase` / `keyOutTemporalEase` (speed, influence) and
`keyLabel`. Also `valueAtTime(0.5)` for both properties of both masks.
Put the printout in `roundtrip/mask-keys/result.json` on test-corpus.

Expected (EffectCraft values; opacity in percent as AE shows it):
- Fade opacity: 0 s 100 (out bezier, speed -40 %/s, influence 50 %), 1 s 25 (in bezier, speed -10,
  influence 33 %, label 2).
- Fade expansion: 0.5 s 0 (out hold), 1.5 s -10, 2 s 12.5 (linear).
- Linear opacity: 0 s 0, 2 s 100 (linear), so valueAtTime(0.5) = 25.
- Linear expansion: 0 s 20, 2 s -30 (linear), so valueAtTime(0.5) = 7.5.
