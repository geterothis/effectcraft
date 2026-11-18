Branch: fix/expr-pseudo-param-match-name (based on upstream main 67942cda), one commit.

# Expressions: read an imported pseudo effect's parameter by its match name

## What was wrong

Since #3450, an effect with no EffectCraft counterpart (for example a pseudo effect of expression controls) is imported as a placeholder that holds its parameters. Expressions find the placeholder by its name and by its match name (`effect("Pseudo/0.25")`), and its parameters by their names.

Presets usually address a pseudo effect's parameters by match name instead:

```
option = thisComp.layer("Settings").effect("Tile")("Pseudo/Duc8e4ac45tLu-0001");
```

A pseudo parameter's match name (`Pseudo/…-0001`) is no property path segment, so the placeholder keeps it as `param1`. The lookup failed with `Property "Pseudo/Duc8e4ac45tLu-0001" not found in "Tile"`. In a project built from a transition pack, this left 14 expressions erroring in one comp, among them Motion Tile's Output Width, Emboss Relief and Transform's Shutter Angle, so the transition rendered wrong.

## Change

`crates/expr/src/host.rs`: when a name is `<effect id>-NNNN` and the group is a placeholder whose effect id is `<effect id>`, the name finds the child `param<NNNN>`. This lookup runs after the existing ones, so it never shadows a parameter found by name.

## Tests

`tests::an_unknown_effects_parameters_are_read_by_name` now also reads the parameters by match name, through the effect's name and through its match name. A number that does not exist, or another effect's prefix, is still an error. It fails without the change.
