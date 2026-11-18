Title: aep export: write MP3 audio items

Branch: geterothis:fix/aep-export-mp3-footage (based on upstream main cd9ee1e4)

## Problem

The .aep exporter wrote WAV audio but reported every MP3 footage item as "not written" and dropped its layer. A project that uses an MP3 soundtrack lost the audio on export to After Effects.

## What After Effects does (measured)

In an After Effects 2026 project (corpus `06`), an MP3 footage item is stored like a WAV item. Its `opti` header carries the tag `MP3A` instead of `WAVE`, and the other fields are the same. After Effects reads the file itself on open, so the duration and sample rate the exporter writes only have to be valid.

## Change

- `export/footage.rs`: a new `Mp3` footage kind (tag `MP3A`) for audio with the extension `mp3`. It shares the WAV branch for the duration and the `sspc` record.
- `export/report.rs` and `docs/aep-export.md`: the limitation and the change line now say "WAV and MP3 audio".

## Tests

- `export::footage::every_kind_is_written_with_its_fields` now includes an MP3 item and checks its tag, size and duration. It fails without the change, because the MP3 item is reported as a loss.
- `what_cannot_be_written_is_reported` uses an `.ogg` file as the unsupported audio file.
- `cargo test -p effectcraft-aep`, clippy and fmt pass for the crate. I did not run the full `cargo xtask ci`.
- Checked in After Effects 26.5: corpus `06` was imported into EffectCraft and exported with this change. After Effects opens the export with no relink. `sweep_44k.mp3` is found with audio and a duration of 4 s, and its layer has in 1 s, out 5 s, start 1 s and audio on. Every footage item and layer matches the original project.

## Not matched

Saving that export in After Effects crashed. The crash comes from the solid's `opti` header and is fixed separately in #3882. It is not related to MP3.
