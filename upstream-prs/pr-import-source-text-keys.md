Title: aep import: keyed Source Text as hold keys, one document per key

Branch: geterothis:fix/aep-import-source-text-keys (one commit on main cd9ee1e4).

HOLD: needs storytold/craft-libs "aep: read every text document of keyed Source Text" (upstream-prs/craft-libs/). After it merges, add a commit that bumps the `craft-aep` rev in `Cargo.toml` (and `Cargo.lock`) to the merge commit, check it builds, then open this PR with "Needs storytold/craft-libs#N" in the description.

## Problem

Keyed Source Text was reported as a loss ("Source Text keyframes ... not imported"), and the layer showed only its first text for the whole duration. In a real resize template the changing captions stayed on the first one.

## Change

- `import/build.rs`: `import_source_text_keys` reads the Source Text key list and the layer's documents (`Layer::text_documents`, craft-aep). Key i becomes a hold keyframe at its time, with document i as its `Value::Text`, through the same `text_doc` conversion as the static text. A key without a readable document is reported and skipped. The stored text and the expression stay as before.
- `import/text.rs`: Source Text keyframes are no longer reported as a loss.
- `import/report.rs`, `docs/aep-import.md`, `docs/aep-format.md`: wording of the text losses, the Text row, the tests list and the Source Text record.

## Tests

- New `import::text_synthetic::source_text_keyframes_are_imported_with_their_documents`: the committed `text-synthetic.aep`, with layer `Off` given keys at 0 s and 1 s ("Off", "End") as After Effects 2026 stores them. Both arrive as hold keys with their text, the expression stays, and layer `T` is unchanged. It fails without the change (no keys).
- `cargo test -p effectcraft-aep` (419 + 90 passed), clippy (`-D warnings`) and fmt pass, built against the craft-libs change through a local `[patch]`. I did not run the full `cargo xtask ci`.
- After Effects 2026 lab project with Source Text keys at 0, 1 and 2.5 s on one layer and 0.5 s on another: the keys import at those times with the right text. Rendered frames 0, 25 and 70 match After Effects apart from the font, which isn't installed on the test machine.
