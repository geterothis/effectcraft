# Lab job: MP3 footage written by EffectCraft (fix/aep-export-mp3-footage, 0ac72343)

ONE headless After Effects 2026 instance, sequential, light load.

File: `06_footage_video_audio.effectcraft.aep` — corpus 06 imported into EffectCraft and exported
again. Before the fix the MP3 item and its layer were dropped. Its paths point at the corpus media
folder on the PC (`...\effectcraft-aep-corpus\media\`), like the original corpus file.

Please:
1. Open it in AE 2026 (relink to the corpus media folder only if AE reports missing files; say so).
2. For every footage item print: name, file path, `footageMissing`, `hasAudio`, `hasVideo`,
   `duration`, `frameRate`, and for the MP3 item also `mainSource.file.fsName`.
3. For every layer of comp `footage_video_audio` print: name, source name, `hasAudio`, `audioEnabled`,
   `inPoint`, `outPoint`.
4. Do the same for the original `corpus/aep/ae2026_v26/06_footage_video_audio.aep`, so we can compare.
5. Save the opened export as `roundtrip/mp3/06_resaved.aep` (Save As) to confirm AE saves it.
6. Put the printouts in `roundtrip/mp3/result.json` (or .txt) on test-corpus.

Expected: the MP3 item is found (`footageMissing` false), `hasAudio` true, duration 4 s
(AE re-reads the file; the export writes 192 000 / 48 000), same as the original.
