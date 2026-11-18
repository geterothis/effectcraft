# Lab job: Essential Graphics controls and Essential Properties overrides

ONE headless After Effects 2026 instance, sequential, light load. Queue after lab/camlight-keys.

Purpose: EffectCraft's .aep importer does not read Essential Graphics controls or the Essential
Properties (overrides) of precomposition layers, so templated projects (resizes) render every
instance with the master's values. We need After Effects-authored files to see how it stores them.

Please run `essential_props.jsx` in a new empty project. It builds comp `M` with five Essential
Graphics controls (a Fill colour, Source Text, a checkbox, a slider, a Position) and comp `R` with two
instances of `M`. It saves `essential_props_plain.aep` (no overrides), then overrides every control
on the second instance (the slider with two keys) and saves `essential_props.aep` and
`essential_props.json` (override names, matchNames and values; `errors` lists any step that failed).
Also render frame 0 and frame 30 of `R` from `essential_props.aep` as PNG (`R_00000.png`,
`R_00030.png`). Commit everything here on test-corpus.
