# Lab job: keys on angle, checkbox, popup and integer slider effect parameters

ONE headless After Effects 2026 instance, sequential, light load.

Purpose: the EffectCraft .aep exporter drops keys on these parameter kinds ("not sampled") and
writes only the first key's value. FM_v_245 loses Evolution keys this way. We need an After
Effects-authored file with such keys to see how After Effects stores them.

Please run `keyed_param_kinds.jsx` in a new empty project (it builds comp `C` with three solids:
Fractal Noise with keyed Evolution, Invert and Fractal Type; Directional Blur with keyed Direction;
Mosaic with keyed Horizontal Blocks). It saves `keyed_param_kinds.aep` and `keyed_param_kinds.json`
(the key values, interpolation and ease as After Effects reports them) next to the script.
If `toSource` is missing, write the JSON with any serializer. Commit both files here on test-corpus.
If a property name is not found (localized AE), use the matchName instead and say which.
