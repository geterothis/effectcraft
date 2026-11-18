Title: aep import: keep the in and out points of a stretched layer with large time denominators

Branch: geterothis:fix/aep-import-stretched-layer-times (two commits on main cd9ee1e4: the fix, then a test added after review).

## Problem

In a real After Effects 2026 resize template, a clip layer stretched to 83.8 % disappeared from EffectCraft's render, and the import reported "the in or out point is out of range, 0 is used" (damaged data). The layer imported with in and out at 0.

The layer stores start 16050557/524288 s, in and out points over 110729625, and a stretch of 14059307/16777216. `start + offset × stretch` multiplies the three denominators (2^19 × 110729625 × 2^24, about 9.7e20). The exact sum went through craft-libs' `LayerHeader::in_point` / `out_point`, which convert the unreduced product to `i64` before reducing it, so they returned `None`. The value itself is an ordinary time (30.90 s and 35.66 s).

## Change

- `import/build.rs` `absolute`: computes `start + offset × stretch` in `i128` and reduces it with a gcd before converting to `i64`. Each factor is at most 2^32, so the products stay far inside `i128`. A time whose reduced denominator still doesn't fit (as here) is rounded to the nearest tick: whole seconds exactly, the fraction to the tick. The fast path for a shared denominator and a whole stretch, which keeps frames as frames, is unchanged. `None` now means only a zero denominator or a time past the tick range. The function no longer uses `LayerHeader::in_point` / `out_point`.
- `docs/aep-import.md`: the timing paragraph and the change line.

## Tests

- New `import::synthetic::a_stretched_layer_with_large_time_denominators_keeps_its_in_and_out_points`: a layer at 29 s with a stretch of 1431655765/2147483647. Before, both layers of the synthetic project were reported as out of range and set to 0. Now in = 29 s exactly, and the solid's out point is within a tick of `29 + stretch`.
- New `import::synthetic::a_layer_time_with_the_template_values_is_kept`: the template layer's own values, within a tick of the exact times. Unreduced they pass `i64`; reduced they fit.
- New `import::synthetic::a_layer_time_that_reduces_past_i64_is_rounded_to_ticks`: start, in/out and stretch over three different primes near 2^32, so even the reduced denominator (about 2^96) doesn't fit and the round-to-tick branch runs. Within a tick of the exact times.
- All three fail without the change. `cargo test -p effectcraft-aep` (420 + 90 passed), clippy (`-D warnings`) and fmt pass for the crate. I did not run the full `cargo xtask ci`.
- After Effects 2026 lab project (odd stretches of 33.3 % and 77.7 % on a solid, a 25 fps clip and a 25 fps precomposition in a 29.97 fps composition, plus a solid at -77.7 %): every start, in and out point imports within 0.00001 s of After Effects' read-back. The one exception is the reversed solid, at 0.0003 s. No time in the lab overflows, so this change leaves those values as they were. No damaged-data loss.
