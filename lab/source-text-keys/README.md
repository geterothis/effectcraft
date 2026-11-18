# Lab job: Source Text keyframes (AE sample)

ONE headless After Effects 2026 instance, sequential, light load.

EffectCraft does not read or write Source Text keyframes (not sampled). Please run
`source_text_keys.jsx` in a new empty project. It builds comp `C` with a text layer whose Source
Text has three keys (0 s "Alpha" 60 px red, 1 s "Beta two" 90 px green, 2.5 s three lines 40 px
blue), a static text layer and a layer with one Source Text key. It saves `source_text_keys.aep`
and `source_text_keys.json` next to the script. Please also render frames 0, 25 and 70 of `C` to PNG
here (`frame_000.png`, `frame_025.png`, `frame_070.png`). Commit everything here on test-corpus.
