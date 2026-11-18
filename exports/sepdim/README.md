EffectCraft export (branch fix/aep-export-separate-dimensions eeeb9517) of a synthetic project:
comp C 640x360 25 fps 2 s, a 100x100 red solid S with Separate Dimensions on:
X Position 300 (static), Y Position keyed 40 at 0 s -> 200 at 1 s, Z Position 0,
and a stale combined Position [10, 10] that must NOT be used.
Check in AE 2026 (fresh process): S.transform.position.dimensionsSeparated == true,
xPosition 300, yPosition at 0 s = 40, at 0.5 s, at 1 s = 200 (2 keys), zPosition 0;
render frames 0, 12, 25 of C. Report any open warnings.
