# Exports from branch fix/aep-export-path-list-header (commit 2ce775f4)

- `20_kitchen_sink.fix4.aep`: the kitchen-sink export that AE called damaged, now from the fixed exporter (2-point path, word 5 = 4).
- `lhd3_counts.fix4.aep`: `lab/lhd3_counts.aep` re-exported: paths of 1 to 40 vertices, masks, and Position keys 5 / 9 / 17 (the key-list half of the fix). Its list headers now equal AE's own word for word except the path allocation words 3 and 7.
- `12_keyframes_easing.fix4.aep`: a keyed file, as a regression check.

Per file, record opens yes/no, any warning text, and whether the main comp renders (for 20, compare with reference/20_kitchen_sink; for lhd3_counts, check the Position keys move the nulls as in the original). Write the results to `roundtrip/fix4.json`.
