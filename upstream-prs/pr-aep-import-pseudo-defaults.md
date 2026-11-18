Branch: fix/aep-import-pseudo-defaults (based on upstream main 67942cda), one commit.

# .aep import: a pseudo effect without value records takes the second default

## What was wrong

A float slider's `pard` stores its default twice: a double at byte 56 and a float at byte 120. A colour's stores it at bytes 56 and 60. In Slider Control and Color Control the two are equal. In a pseudo effect saved from a preset they can differ. When an instance has no value record for the parameter, After Effects 26.5 shows the second value, and the import used the first. The imported effect then started from different values than After Effects shows, and expressions reading those parameters returned different numbers.

## Change

- `crates/aep/src/import/placeholder.rs`: `definition_default` reads the float at byte 120 for a float slider and the ARGB at byte 60 for a colour. A parameter without a value record uses it, and falls back to `pard_default` (byte 56) for every other kind, or when the second value is missing or not finite.

## Tests

- `import::placeholders::a_pseudo_effect_without_records_takes_the_second_default`: a pseudo effect whose slider holds 40 at byte 56 and 65 at byte 120, and whose colour holds green at 56 and blue at 60, with no value records. It imports 65 and blue, and fails without the change.
- The test helper `fx_inject::pard` now writes both slots, as After Effects does, with `TwoNumbers` and `TwoColors` for the case where they differ.
- `cargo test -p effectcraft-aep --test it import::` passes.

## Checked against After Effects

A pseudo effect from a preset holding different values in the two slots, with no value records, shows the second value of each slider and colour in After Effects 26.5. The test uses synthetic values.
