//! A small committed text project (`tests/fixtures/text-synthetic.aep`), so the text animator
//! Stroke Opacity and the Source Text expression are checked without the external corpus, on
//! import and through an export and a second import (#3170).
//!
//! The project was made in After Effects 2026 with the working space set to None: one composition
//! `C` (64x48, 25 fps, 2 s) with two text layers. `T` holds `Hi` (Arial, 20 px, a blue 2 px
//! stroke), the Source Text expression `text.sourceText + "!"` (enabled), an animator `Stroke`
//! with Stroke Opacity 40 % and an animator `Keyed` with Stroke Opacity keyed 0 % at 0 s and
//! 100 % at 1 s. `Off` holds `Off` and the Source Text expression `"X"`, disabled. Nothing After
//! Effects wrote was changed.

use effectcraft_aep::import::{ImportOptions, ImportResult, LossCategory, import};
use effectcraft_aep::{AepFile, Body, Chunk, parse, write};
use effectcraft_keyframe::Value;
use effectcraft_project::{Expression, Layer, Project, PropGroup};
use effectcraft_time::{TICKS_PER_SECOND, Tick};

use crate::import::helpers::comp;

const TEXT_SYNTHETIC: &[u8] = include_bytes!("../../fixtures/text-synthetic.aep");

/// Imports `bytes` with losses allowed.
fn run(bytes: &[u8]) -> (Project, ImportResult) {
    let mut project = Project::default();
    let none = |_: &str| false;
    let r = import(&mut project, bytes, &ImportOptions { allow_losses: true, ..ImportOptions::new(&none) }).expect("the project imports");
    (project, r)
}

/// The loss details of `category`.
fn losses(r: &ImportResult, category: LossCategory) -> Vec<String> {
    r.report.losses.iter().filter(|l| l.category == category).flat_map(|l| l.details.clone()).collect()
}

/// The layer `name` of composition `C`.
fn layer<'p>(p: &'p Project, r: &ImportResult, name: &str) -> &'p Layer {
    let (_, c) = comp(p, r, "C");
    c.layers.iter().find(|l| l.name == name).unwrap_or_else(|| panic!("text layer {name}"))
}

/// The text animator `name` of `l`.
fn animator<'l>(l: &'l Layer, name: &str) -> &'l PropGroup {
    l.props.group("text/animators").expect("animators").groups().find(|a| a.name == name).unwrap_or_else(|| panic!("animator {name}"))
}

/// The Source Text of `l`: its stored text and its expression.
fn source_text(l: &Layer) -> (String, Option<Expression>) {
    let p = l.props.prop("text/sourceText").expect("Source Text");
    let Value::Text(doc) = &p.value else { panic!("{:?}", p.value) };
    (doc.text.clone(), p.expr.clone())
}

/// Stroke Opacity 40 % and its keys 0 % / 100 % arrive in percent, without a loss.
#[test]
fn text_animator_stroke_opacity_is_imported_static_and_keyed() {
    let (p, r) = run(TEXT_SYNTHETIC);
    let text = losses(&r, LossCategory::TextLayers);
    assert!(!text.iter().any(|d| d.contains("Stroke Opacity")), "{text:?}");
    let t = layer(&p, &r, "T");
    // Stored as After Effects shows it: percent.
    let st = animator(t, "Stroke").prop("properties/strokeOpacity").expect("strokeOpacity");
    assert_eq!((st.value.clone(), st.keys.len()), (Value::Scalar(40.0), 0));
    let keyed = animator(t, "Keyed").prop("properties/strokeOpacity").expect("strokeOpacity");
    let keys: Vec<_> = keyed.keys.iter().map(|k| (k.time, k.value.clone())).collect();
    assert_eq!(keys, vec![(Tick::ZERO, Value::Scalar(0.0)), (Tick(TICKS_PER_SECOND), Value::Scalar(100.0))]);
}

/// Both Source Text expressions arrive with their enable switch, next to the stored text.
#[test]
fn the_source_text_expression_is_imported_enabled_and_disabled() {
    let (p, r) = run(TEXT_SYNTHETIC);
    let text = losses(&r, LossCategory::TextLayers);
    assert!(!text.iter().any(|d| d.contains("Source Text expression")), "{text:?}");
    // The stored text stays the Source Text value; the expression comes next to it.
    assert_eq!(source_text(layer(&p, &r, "T")), ("Hi".to_string(), Some(Expression { text: "text.sourceText + \"!\"".into(), enabled: true })));
    assert_eq!(source_text(layer(&p, &r, "Off")), ("Off".to_string(), Some(Expression { text: "\"X\"".into(), enabled: false })));
    assert_eq!(r.report.imported.expressions, 2);
}

/// Calls `f` on every chunk below `chunks`, depth-first.
fn visit(chunks: &mut [Chunk<'_>], f: &mut dyn FnMut(&mut Chunk<'_>)) {
    for c in chunks {
        f(c);
        visit(c.children_mut(), f);
    }
}

/// Export and a second import keep the Source Text expressions and Stroke Opacity, unreported.
#[test]
fn stroke_opacity_and_source_text_expressions_survive_export() {
    let (p, r0) = run(TEXT_SYNTHETIC);
    let out = effectcraft_aep::export::export(&p, &effectcraft_aep::export::ExportOptions { allow_losses: true }).expect("export");
    let text: Vec<String> =
        out.report.losses.iter().filter(|l| l.category == effectcraft_aep::export::LossCategory::TextLayers).flat_map(|l| l.details.clone()).collect();
    assert!(!text.iter().any(|d| d.contains("Stroke Opacity") || d.contains("Source Text expression")), "{text:?}");
    assert_eq!(out.report.exported.expressions, 2);
    let (q, r) = run(&out.bytes);
    for name in ["T", "Off"] {
        assert_eq!(source_text(layer(&q, &r, name)), source_text(layer(&p, &r0, name)), "{name}");
    }
    let t = layer(&q, &r, "T");
    assert_eq!(animator(t, "Stroke").prop("properties/strokeOpacity").map(|p| p.value.clone()), Some(Value::Scalar(40.0)));
    let keys: Vec<_> = animator(t, "Keyed").prop("properties/strokeOpacity").expect("strokeOpacity").keys.iter().map(|k| (k.time, k.value.clone())).collect();
    assert_eq!(keys, vec![(Tick::ZERO, Value::Scalar(0.0)), (Tick(TICKS_PER_SECOND), Value::Scalar(100.0))]);
}

/// Guard: an expression whose `tdb4` flags give no state stays reported instead of imported.
#[test]
fn a_source_text_expression_with_unreadable_flags_stays_reported() {
    // `tdb4` byte 120 is 1 on a property with an expression; with 0 the expression's state is
    // unknown, so it is reported instead of imported.
    let mut file: AepFile<'_> = parse(TEXT_SYNTHETIC).expect("parse");
    visit(&mut file.chunks, &mut |c| {
        if !c.is_list(b"btds") {
            return;
        }
        for tdbs in c.children_mut().iter_mut().filter(|c| c.is_list(b"tdbs")) {
            for tdb4 in tdbs.children_mut().iter_mut().filter(|c| c.is(b"tdb4")) {
                if let Body::Data(d) = &mut tdb4.body
                    && let Some(b) = d.to_mut().get_mut(120)
                {
                    *b = 0;
                }
            }
        }
    });
    let (p, r) = run(&write(&file).expect("write"));
    let text = losses(&r, LossCategory::TextLayers);
    assert_eq!(text.iter().filter(|d| d.contains("the Source Text expression is not imported")).count(), 2, "{text:?}");
    assert_eq!(source_text(layer(&p, &r, "T")), ("Hi".to_string(), None));
}

/// The end (one past the closing `>>`) of the dictionary starting at `start` in a `btdk` body,
/// skipping strings (which hold UTF-16 bytes and backslash escapes).
fn dict_end(body: &[u8], start: usize) -> usize {
    let (mut i, mut depth, mut parens) = (start, 0usize, 0usize);
    while i < body.len() {
        let c = body[i];
        if parens > 0 {
            match c {
                b'\\' => i += 1,
                b'(' => parens += 1,
                b')' => parens -= 1,
                _ => {}
            }
        } else if c == b'(' {
            parens = 1;
        } else if body[i..].starts_with(b"<<") {
            depth += 1;
            i += 1;
        } else if body[i..].starts_with(b">>") {
            depth -= 1;
            i += 1;
            if depth == 0 {
                return i + 1;
            }
        }
        i += 1;
    }
    panic!("unclosed dictionary")
}

/// Layer `Off` with keyed Source Text, as After Effects 2026 stores it (lab sample): the key list
/// in the Source Text `tdbs` (16-byte records: the time, then 3 / 3 for hold) and one `btdk` whose
/// `/1/1` holds one document per key. Here: "Off" at 0 s and "End" at 1 s (25600 units: 25 fps x 1024).
fn with_source_text_keys() -> Vec<u8> {
    let mut file: AepFile<'_> = parse(TEXT_SYNTHETIC).expect("parse");
    visit(&mut file.chunks, &mut |layer| {
        if !layer.is_list(b"Layr") || !layer.children().iter().any(|c| c.is(b"Utf8") && c.bytes() == Some(b"Off".as_slice())) {
            return;
        }
        visit(layer.children_mut(), &mut |c| {
            if c.is_list(b"btds") {
                for tdbs in c.children_mut().iter_mut().filter(|k| k.is_list(b"tdbs")) {
                    let mut lhd3 = vec![0u8; 52];
                    lhd3[8..12].copy_from_slice(&2u32.to_be_bytes());
                    lhd3[16..20].copy_from_slice(&16u32.to_be_bytes());
                    let mut ldat = vec![0u8; 32];
                    ldat[4..6].copy_from_slice(&[3, 3]);
                    ldat[16..20].copy_from_slice(&25_600i32.to_be_bytes());
                    ldat[20..22].copy_from_slice(&[3, 3]);
                    if let Body::List { children, .. } = &mut tdbs.body {
                        children.push(Chunk::list(*b"list", vec![Chunk::data(*b"lhd3", lhd3), Chunk::data(*b"ldat", ldat)]));
                    }
                }
            }
            if let Body::OpaqueList { list_type, data } = &mut c.body
                && list_type == b"btdk"
            {
                let body = data.to_vec();
                let off: &[u8] = b"<< /0 << /0 (\xfe\xff\x00O\x00f\x00f\x00\r)";
                let start = body.windows(off.len()).position(|w| w == off).expect("the run of Off");
                let end = dict_end(&body, start);
                let copy: Vec<u8> = body[start..end].to_vec();
                let at = copy.windows(6).position(|w| w == b"\x00O\x00f\x00f").expect("the text");
                let mut copy = copy;
                copy[at..at + 6].copy_from_slice(b"\x00E\x00n\x00d");
                *data = [&body[..end], b" ".as_slice(), &copy, &body[end..]].concat().into();
            }
        });
    });
    write(&file).expect("write")
}

/// Keyed Source Text arrives as hold keys, one text document per key, without a loss.
#[test]
fn source_text_keyframes_are_imported_with_their_documents() {
    let (p, r) = run(&with_source_text_keys());
    let text = losses(&r, LossCategory::TextLayers);
    assert!(!text.iter().any(|d| d.contains("Source Text keyframe")), "{text:?}");
    let st = layer(&p, &r, "Off").props.prop("text/sourceText").expect("Source Text");
    let keys: Vec<(Tick, String, bool)> = st
        .keys
        .iter()
        .map(|k| {
            let Value::Text(d) = &k.value else { panic!("{:?}", k.value) };
            (k.time, d.text.clone(), k.in_interp == effectcraft_keyframe::Interp::Hold && k.out_interp == effectcraft_keyframe::Interp::Hold)
        })
        .collect();
    assert_eq!(keys, [(Tick::ZERO, "Off".to_string(), true), (Tick(TICKS_PER_SECOND), "End".to_string(), true)]);
    // The expression is kept next to the keys, and the other layer is unchanged.
    assert_eq!(st.expr, Some(Expression { text: "\"X\"".into(), enabled: false }));
    assert!(layer(&p, &r, "T").props.prop("text/sourceText").unwrap().keys.is_empty());
}
