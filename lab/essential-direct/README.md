# Lab job: Essential Properties that drive layers inside nested precompositions directly

ONE headless After Effects 2026 instance, sequential, light load.

Purpose: in a real templated project, the template's controls name a layer inside a nested
precomposition directly (`CCId` = the nested composition, `CLId` = its layer), the nested
compositions have no controls of their own, and their instances have no override group. Some
instances' override groups also hold fewer entries than the template has controls (13 for 18).
This sample builds that pattern, two levels deep, plus one instance made before the last three
controls were added.

Please run `essential_direct.jsx` in a new empty project. It builds `Deep` (a dot), `Inner` (a box,
Deep nested), `Mid` (Inner nested, its own bar; controls: Box position, Bar opacity, Box scale, Dot
position, Dot anchor) and `Top` (`mid early` added after the first two controls and overriding
Dot position only, `mid default`, and `mid overridden` overriding every control). It saves
`essential_direct_plain.aep` (before the overrides), `essential_direct.aep` and
`essential_direct.json` (`errors` lists any step that failed; `added` says whether each control
was accepted).

Also run `python ../../tools/ep_structure.py essential_direct.aep > ep_structure.txt` (the tool now
also maps each override UUID to its control number), render frame 0 of `Top` and of `Mid` as PNG
(`Top_00000.png`, `Mid_00000.png`), and commit everything here on test-corpus.

If AE refuses to add a nested layer's property to Mid's template from the script, try the UI
(Essential Graphics panel with Mid as the primary composition, drag the property from the
timeline after twirling down the nested layer), and note in the JSON which way worked.

Separately, on FM_v_245 (do not commit it or its output), please run the updated
`tools/ep_structure.py` and send back only the anonymised lines for the master composition's
controls and for the instance layers whose override counts differ from the master's control count.
