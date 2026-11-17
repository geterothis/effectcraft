# fx-samples: built-in effects with NON-default parameters

Made in After Effects 26.5 (2026) with `corpus/build/fx_samples_one.jsx` (the "Make unsupported effects portable" thread's script, adapted).

- `fx-nondefault-NN.aep` - 14 projects, 25 effects each (330 built-in effects: Adobe, Cycore CC, Keylight, Mocha, Immersive). One 1920x1080 2 s 25 fps comp per effect, named `fx|<matchName>`: a red solid with Gradient Ramp, then the effect with every settable parameter moved off its default (rule in the script: colors -> [0.2,0.4,0.6], points -> (25%, 75%), checkboxes flipped, dropdowns -> item 2 (or 1), sliders -> min + 37% of range).
- `fx-nondefault-NN.json` - per effect: matchName, displayName, category, instance name, and per parameter: index path, matchName, name, type, min/max, default, the value set, the value read back, set errors.
- `fx-nondefault-NN-K.png` - frame 0 of comp K of file NN, rendered by aerender (Best Settings, RGB+alpha).
- `progress.log` - build log.

## Changes vs the original script

1. One project per run, created empty by the harness (`app.newProject()` / `project.close()` crash windowless AE).
2. Only built-in effects (third-party plugins on the build PC are left out).
3. Skipped because they open a modal dialog on apply: `ADBE Numbers2`, `ADBE Basic Text2`, `ADBE Path Text`, `ADBE Apply Color LUT2`, `ADBE Apply Color LUT` (plus the original SKIP list).
4. Frame 0 is queued in the render queue and rendered by aerender instead of `comp.saveFrameToPng`: the async in-process render crashed AE (file 02).
5. Effect list sorted by category + matchName, so chunk numbers are stable.

## Problems found

| Effect | File / comp | What happens |
|---|---|---|
| `ADBE Calculations` (Calculations) | 02, comp 17 | Crashes AE: crashed the scripting AE via `saveFrameToPng`, and crashes aerender when rendered alone (reproduced twice). No PNG. |
| `ADBE Mask Prompter 3` | 01 | `addProperty` fails: "blace.ai 0_9_90 not found or could not be initialized" (needs the Blace AI runtime). No comp content. |
| several (files 03, 05, 09, 11, 12) | - | aerender crashed while 4 workers ran in parallel; on retry every PNG rendered. AE renders several comps at once, so the crash is not tied to one effect; treat as load-related. |
