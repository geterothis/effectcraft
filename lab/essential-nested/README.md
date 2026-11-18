# Lab job: Anchor Point controls and Essential Properties passed through a nested precomposition

ONE headless After Effects 2026 instance, sequential, light load.

Purpose: in a real templated project, EffectCraft's importer reports Position and Scale controls
with "its layer was not imported" (the layers exist) and an Anchor Point control as not supported,
and drops whole override lists ("12 override values for 19 controls"). The suspicion is Essential
Properties added from a nested precomposition's instance. This sample has both cases.

Please run `essential_nested.jsx` in a new empty project. It builds `Inner` (Position, Scale and two
Anchor Point controls), `Mid` (Inner nested, its instance's Essential Properties added to Mid's
controls, and its Pivot anchor overridden directly) and `Top` (two instances of Mid, the second
overriding every control). It saves `essential_nested_plain.aep` (before the overrides),
`essential_nested.aep` and `essential_nested.json` (`errors` lists any step that failed).
Also run `python ../../tools/ep_structure.py essential_nested.aep > ep_structure.txt`, and render
frame 0 of `Top` and of `Mid` as PNG (`Top_00000.png`, `Mid_00000.png`). Commit everything here on
test-corpus.
