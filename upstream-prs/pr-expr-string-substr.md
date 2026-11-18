Title: Expressions: String.prototype.substr

Branch: geterothis:fix/expr-string-substr (one commit on main 67942cda).

## Problem

The expression engine (boa) is built without Annex B, so `String.prototype.substr` doesn't exist and `'ab}'.substr(-1)` throws "not a callable function". After Effects has `substr` in both of its expression engines (JavaScript and Legacy ExtendScript). Published expressions use it: a widely used marker-remap script reads the last character of a marker comment with `comment.substr(-1)`. In EffectCraft such an expression fails and the property falls back to its value.

The ExtendScript prelude already defines `substr` (`crates/script/src/prelude.js`). The expression prelude didn't.

## Change

- `crates/expr/src/prelude.js`: defines `String.prototype.substr(start, length)` with its legacy semantics: start clamped, a negative start counted from the end, length not end index, `NaN` start 0, a non-positive length giving `""`. It is non-enumerable and defined at the top of the prelude, before the hardening that freezes the built-in prototypes. The body is the same as the scripting prelude's.

## Tests

- New `tests::string_substr_takes_a_start_and_a_length`: `'ab}'.substr(-1)` is `}`, plus positive and negative starts, a missing length, a start before the beginning, a negative length, a start past the end and a `NaN` start. It also checks that `substr` is not enumerable. It fails without the change.
- `cargo test -p effectcraft-expr` passes (176 passed, 1 ignored). I did not run the full `cargo xtask ci`.
- After Effects 26.5: on sliders, `"ab}".substr(-1)=="}" ? 1 : 0` and `"abcdef".substr(-3,2)=="de" ? 1 : 0` both read 1, with no error, in the JavaScript and the Legacy ExtendScript engines.
