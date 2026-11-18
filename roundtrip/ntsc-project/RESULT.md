# A-D variants in AE 26.5 (headless station), 2026-11-18

None of the four renders like the original. Every variant is pixel-identical to ntsc_ec.aep (diff 0) and differs from the original exactly as before:
- C_t2997 f45: max 128, 10.87% px
- C_t23976 f36: max 131, 10.61% px

So nnhd/nhed tails, LRdr/Rhed and head/svap do not control the soft H.264 edges.
Remaining suspects (from project_chunk_diff.txt): gpuG/Utf8 (missing in EC), wsnm + Utf8 'Default', the XMP block (4221 -> 358 bytes), LSIf/AFsi, sfnm/sfid, PTRE/ftwd (only in orig).
Numbers: variants_diff.json; frames: frames/<variant>_<comp>_f<N>.png.
