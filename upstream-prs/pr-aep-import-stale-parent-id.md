Branch: fix/aep-import-stale-parent-id (based on upstream main 67942cda), one commit.

# .aep import: a parent id that names no layer means no parent

## What was wrong

A layer's `ldta` can hold a parent id that matches no layer in its composition. This happens when the parent was deleted, or when the id is a value with the high bit set (`0x80000000`). After Effects 26.5 shows such a layer with no parent. The import did the same, but reported each one as a lost parent link ("has a layer that does not exist as its parent"), so a clean project came in with parent-link losses and needed `allow_losses`.

## Change

- `crates/aep/src/import/build.rs` (`resolve_parents`): an id that names no layer leaves the layer without a parent, silently. A parent that exists in the file but was not imported is still reported, because that link is really lost.

## Tests

- `import::synthetic::a_parent_id_that_names_no_layer_is_no_parent`: on the committed `synthetic.aep`, it sets each layer's parent id to `0x80000000` and to `999`. Each layer has no parent and there are no parent-link losses. It fails without the change.
- `cargo test -p effectcraft-aep` passes, including `parent_loops_are_dropped`.

## Checked against After Effects

In After Effects 26.5, layers whose parent id was `0x80000000`, or the id of a layer that had been deleted, have `parent == null`.
