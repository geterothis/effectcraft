Repository: storytold/craft-libs

Title: aep: read every text document of keyed Source Text

Branch: geterothis:aep-keyed-source-text-documents (one commit on main 2466fd7ad). The commit is `keyed-source-text.patch` next to this file (`git am` it onto main).

## Problem

A text layer whose Source Text has keyframes stores one `btdk`, whose `/1/1` array holds one text document per key (key i = document i), and one text frame per document in `/0/8/0`. `TextDocument::parse` reads only the first document, so a reader can't get the text of the other keys. EffectCraft reports keyed Source Text as a loss for that reason.

The layout was checked on a project saved by After Effects 2026 with Source Text keys at 0, 1 and 2.5 s (three documents, the third with three lines). Each document's text, style runs and box decode the same way as an unkeyed document.

## Change

- `textdoc.rs`: `TextDocument::parse_all(body) -> Vec<Option<TextDocument>>` returns one entry per element of `/1/1`, in key order, capped at `MAX_TEXT_DOCUMENTS` (65 536). An entry is `None` when that document can't be read. `parse` is now `parse_all`'s first document and returns the same as before. The text box and line orientation of document i come from `/0/8/0[i]`, falling back to `[0]`.
- `Layer::text_documents()`: every document of the layer's `btdk`.
- `lib.rs` exports `MAX_TEXT_DOCUMENTS`.
- `docs/aep-format.md`: the Source Text record row.

## Tests

- New `container::text_fields::every_document_of_keyed_source_text_is_read_in_key_order`: a `btdk` with two documents ("Off", "End") gives both, in order. `parse` still gives the first. It fails without the change (no `parse_all`).
- `cargo test -p craft-aep`, `cargo clippy -p craft-aep --all-targets -- -D warnings` and `cargo fmt --check` pass. I did not run the whole workspace.
- EffectCraft with this change (its PR follows once this is merged) imports the After Effects keys at 0, 1 and 2.5 s with the right text per key. Its renders at frames 0, 25 and 70 match After Effects' text, colours and sizes. The only difference is the font, which isn't installed on the test machine.
