# Bisect round 2: the underline_trim layer of 20_kitchen_sink

All files are the full 20_kitchen_sink export with one change to ks_card/underline_trim:
- `20_control_patched_path_word5_4.aep`: the control file, binary-patched: in the 2-point path's list header, word 5 is set to 4 (what AE writes) instead of 2.
- `20_underline_3_vertices.aep`: the path has 3 points (a midpoint added).
- `20_underline_no_trim.aep`: Trim Paths removed.
- `20_underline_static_end.aep`: Trim Paths End not keyed (static 100).
- `20_underline_ease_filled.aep`: End keys keep their keys, the empty incoming/outgoing ease of the first/last key filled with a default.
Record opens yes/no + error text per file in `roundtrip/bisect-20b.json`.
