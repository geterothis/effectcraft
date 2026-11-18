Branch: fix/aep-import-motion-tile (based on upstream main 67942cda), one commit.

# .aep import: Motion Tile, Shift Channels and Emboss

## What was wrong

`ADBE Tile`, `ADBE Shift Channels` and `ADBE Emboss` had no row in the import effect table, so the three effects were dropped when an .aep was imported. EffectCraft has all three effects. A zoom transition built on Motion Tile (Output 550 % with Mirror Edges) showed a black border around the scaled frame instead of mirrored copies.

## Change

- `crates/aep/src/container/effect_map.rs`: one row per effect, mapping every parameter to `ec.stylize.motiontile`, `ec.channel.shiftchannels` and `ec.stylize.emboss`:
  - sliders are checked against After Effects' valid maximum;
  - points are converted to layer pixels;
  - Shift Channels' four menus are mapped by item name (10 items, Full Off last).
- `docs/aep-import.md`: the table row and the test list.

## Tests

`crates/aep/tests/it/import/effects_tile_shift_emboss.rs` builds each effect into `synthetic.aep` with the definitions After Effects 26.5 writes, and checks the set values and the defaults. Without the change, each test fails: the effect is reported as unmapped and not imported. `effects.rs`'s count of mapped effects goes from 67 to 70.

## Checked against After Effects

An .aep saved by After Effects 26.5 has one 320×180 4-Color Gradient layer per effect. EffectCraft imports it with no losses. The frames rendered by EffectCraft were compared with After Effects' frames:

- Shift Channels (Red from Green, Blue Full Off): max difference 1 of 255.
- Motion Tile: the output rectangle is the same pixel for pixel (Output 550 %, layer at 15 %). The tiles match too (mean difference under 1 in five cases) once a separate render fix for Phase is applied (fix/motion-tile-phase).
- Emboss: the values arrive as stored. The rendered relief differs from After Effects by up to 21 of 255. That is EffectCraft's Emboss renderer, not the import, and is not part of this PR.
