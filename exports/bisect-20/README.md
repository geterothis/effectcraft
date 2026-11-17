# Bisect: why 20_kitchen_sink.effectcraft.aep is "damaged"

Each `20_no_<comp>_<n>_<layer>.aep` is the same export with one layer removed in EffectCraft before exporting. `20_control_all_layers.aep` keeps every layer (should fail like the original export).
For each file, record only: opens in AE 2026 yes/no, and the error text. Write the result to `roundtrip/bisect-20.json`.
