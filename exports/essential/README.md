EffectCraft export (branch fix/aep-export-essential-graphics 663b4044) of a synthetic project:
- comp Pre 640x360 25 fps 2 s: solid "Box" 200x100 (Opacity 80, Rotation 15), text layer "Title" ("HELLO").
  Essential Graphics template "Card", controls in order: Box opacity (slider), Box rotation (angle),
  Box position (point), Box scale (scale), Title (text). A comment "Note" is intentionally NOT written.
- comp Main 1280x720: two instances of Pre, "A" (top) and "B".
  A overrides Box opacity = 25 and Title = "BYE"; B follows the comp (opacity 80, "HELLO").
Check in AE 2026 (fresh process):
1. The project opens without errors or warnings (report the exact text of any dialog).
2. Pre: Essential Graphics panel shows template "Card" with the 5 controls in that order and their values.
3. Main/A: Essential Properties lists 5 entries; Box opacity = 25 (overridden), Title = "BYE" (overridden), others follow the comp.
   Main/B: all follow the comp (80, "HELLO").
4. Render Main frame 0 and Pre frame 0; A must show the box at 25 % opacity with "BYE", B at 80 % with "HELLO".
5. Save a copy from AE and send it back (exports/essential/roundtrip_ae.aep) so the stored bytes can be compared.

Update 2026-11-19: re-exported with the solid opti header fix (fix/aep-export-solid-opti-header 1ae37d2e) applied
on top (local build test/eg-sepdim-solid: 663b4044 + eeeb9517 + 1ae37d2e). Only the 3 header bytes after "Soli"
changed (now 0009 0000011a). Re-check: open, then app.project.save(File) a copy as roundtrip_ae.aep (fresh process).
