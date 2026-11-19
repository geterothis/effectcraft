# eg_export.aep in AE 26.5 (headless station, fresh process), 2026-11-19

1. **Opens:** no dialog, no warnings. Items: Main, Pre, Solids folder, Box solid.
2. **Pre:** the Essential Graphics template is named "Card", with 5 controllers in this order: Box opacity, Box rotation, Box position, Box scale, Title. Values: Box opacity 80, rotation 15, position [320,180], scale [100,100], Title "HELLO". The "Note" comment is absent, as intended.
3. **Main** (1280×720): both instances list 5 Essential Properties entries.
   - A: Box opacity 25, Box rotation 15, Box position [320,180,0], Box scale [100,100,100], Title "BYE".
   - B: 80, 15, [320,180,0], [100,100,100], "HELLO".
   - ExtendScript cannot tell an overridden entry from one that follows the comp, so only the values were checked. Each entry's `essentialPropertySource` resolves to the right Pre property.
4. **Frames:** `Main_f0.png`, `Pre_f0.png`, and A and B rendered alone (`Main_f0_only_A.png`: box at 25 % with "BYE"; `Main_f0_only_B.png`: box at 80 % with "HELLO"). Note that A and B sit at the same position [640,360] in Main, so in the full Main frame they overlap. Renderer: ae-harness plugin AEGP render, 8 bpc.
5. **Save a copy: AE crashes every time.** It crashed on 5 of 5 tries, each in a fresh process (`app.project.save(File)`); `roundtrip_ae.aep` could not be produced.
   - Bisect: it still crashes after deleting Main, and after deleting Main and Pre (only the Box solid left). After deleting every item, the project saves fine. So **the Box solid footage item** is the trigger.
   - The solid's `opti` chunk differs from an AE-written one in the 6 bytes after "Soli":
     - EC: `536f6c69 0000 00000000 3f800000 00000000 3f000000 3f800000 426f78…`
     - AE: `536f6c69 0009 0000011a 3f800000 3f000000 3f000000 3f000000 6267…` (from lab/emboss)
   - This is the same "solid opti header" save crash found earlier. `sepdim_export.aep` has the same zero header (`536f6c69 0000 00000000 …`), so saving it will probably crash too. That was not tested.
