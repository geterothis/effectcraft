# Bisect: why the fx_invert comp of 14a crashes aerender

Render the comp `fx_invert` (a few frames) in each file and record renders yes/no + error text in `roundtrip/bisect-14a-b.json`.
- `14a_invert_with_sdat.aep`: the 14a export with the original file's Invert sequence data (`sdat`) copied into both Invert entries.
- `14a_invert_with_ae_param_defs.aep`: the 14a export with the original's Invert parameter definitions (`parT`: names, popup items) copied in, no `sdat`.
- `14a_invert_with_sdat_and_param_defs.aep`: both.
- `14a_only_fx_invert.aep`: a fresh EffectCraft export of only the fx_invert comp (all other comps deleted before export).
