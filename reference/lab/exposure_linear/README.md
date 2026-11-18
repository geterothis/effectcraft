# Exposure linear-light lab (AE 26.5, aerender, frame 0, comp "exposure" 400x100)

Solids left to right, all colour (1, 0.6, 0.2): exp_plus2 (Exposure +2), exp_plus1_offset_0.05 (Exposure +1, Offset 0.05), exp_plus2_bypass_linear (Exposure +2, Bypass Linear Light Conversion on), no_effect.

- `<file>_00000.png`: Best Settings, PNG 8-bit RGB+alpha (output profile = project working space as AE writes it).
- `<file>_00000.exr` (32 bpc files only): there is no OpenEXR output template on this PC, so AE rendered a 32-bit float PSD ("Floating Point+", profile "Working Space - sRGB IEC61966-2.1 (linear)", i.e. LINEAR-light values), converted losslessly to float32 RGB EXR.

Centre pixel of each solid:

| file | exp_plus2 | exp_plus1_offset_0.05 | exp_plus2_bypass_linear | no_effect |
|---|---|---|---|---|
| exposure_lin32 EXR (linear) | 4.0, 2.4, 0.8 | 2.05, 1.25, 0.45 | 4.0, 2.4, 0.8 | 1.0, 0.6, 0.2 |
| exposure_32 EXR (linear) | 4.3251, 1.3125, 0.1164 | 2.1189, 0.6928, 0.1088 | 26.1154, 7.7345, 0.6038 | 1.0, 0.3185, 0.0331 |
| exposure_lin32 PNG | 255,255,231 | 255,255,179 | 255,255,231 | 255,203,124 |
| exposure_32 PNG | 255,255,96 | 255,217,93 | 255,255,204 | 255,153,51 |
| exposure_8 PNG | 255,255,96 | 255,217,93 | 255,255,204 | 255,153,51 |
