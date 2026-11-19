//! HDR Highlight Compression, Echo, Linear Wipe, Offset and Color Stabilizer (#3110) arrive as
//! EffectCraft's effects of the same name. Each is built into `synthetic.aep` (`fx_inject`) with
//! the definitions After Effects 2026 wrote for it in the importer block of 2026-11-05 (valid
//! ranges, defaults, popup items) and the values of that block's compositions.

use crate::import::fx_inject::{Default, Fx, bytes_with, import_bytes, losses, near, num, other, popup, pt, run, slider, v};
use effectcraft_aep::ParamKind as K;
use effectcraft_aep::import::LossCategory;
use effectcraft_aep::import::{ImportOptions, import};
use effectcraft_aep::{Body, Chunk, parse, write};
use effectcraft_keyframe::Value;
use effectcraft_project::Project;

const ECHO_OPS: &[&str] = &["Add", "Maximum", "Minimum", "Screen", "Composite In Back", "Composite In Front", "Blend"];

/// Echo with the definitions After Effects 2026 wrote and the stored `values`.
fn echo(values: Vec<(usize, f64)>) -> Fx {
    Fx {
        match_name: "ADBE Echo",
        name: "Echo",
        defs: vec![
            slider(K::FloatSlider, "Echo Time (seconds)", -1.0 / 30.0, (-30000.0, 30000.0)),
            slider(K::IntSlider, "Number Of Echoes", 1.0, (0.0, 30000.0)),
            slider(K::FloatSlider, "Starting Intensity", 1.0, (0.0, 1.0)),
            slider(K::FloatSlider, "Decay", 1.0, (0.0, 100.0)),
            popup("Echo Operator", 1, ECHO_OPS),
        ],
        values,
        data: vec![],
        keys: vec![],
    }
}

/// HDR Highlight Compression's Amount, set and default.
#[test]
fn hdr_highlight_compression_amount() {
    let fx = |values| Fx {
        match_name: "ADBE HDR ToneMap",
        name: "HDR Highlight Compression",
        defs: vec![slider(K::FloatSlider, "Amount", 100.0, (0.0, 100.0))],
        values,
        data: vec![],
        keys: vec![],
    };
    // `hdr-01-set-all`: 90; `hdr-00-defaults`: no record, 100.
    for (values, want) in [(vec![(1, 90.0)], 90.0), (vec![], 100.0)] {
        let (g, r) = run(&fx(values), "ec.utility.hdrcompression");
        assert_eq!(losses(&r, LossCategory::Effects, "ADBE HDR ToneMap"), Vec::<String>::new());
        near(&g.expect("imported"), "amount", want);
    }
}

/// Echo's values and operator, set and default.
#[test]
fn echo_values_and_operator() {
    // `echo-01-set-all` (without its Decay 20, below) and `echo-09-pop5-6`.
    let (g, r) = run(&echo(vec![(1, 9.967), (2, 14.0), (3, 0.0), (5, 6.0)]), "ec.time.echo");
    assert_eq!(losses(&r, LossCategory::Effects, "ADBE Echo"), Vec::<String>::new());
    let g = g.expect("imported");
    near(&g, "echoTime", 9.967);
    near(&g, "numberOfEchoes", 14.0);
    near(&g, "startingIntensity", 0.0);
    near(&g, "decay", 1.0);
    assert_eq!(v(&g, "echoOperator"), Value::Enum(5), "Composite In Front");
    // `echo-00-defaults`: one echo a frame back (1/30 s), Add.
    let (g, _) = run(&echo(vec![]), "ec.time.echo");
    let g = g.expect("imported");
    assert!((num(&g, "echoTime") + 1.0 / 30.0).abs() < 1e-6);
    assert_eq!((num(&g, "numberOfEchoes"), v(&g, "echoOperator")), (1.0, Value::Enum(0)));
}

/// Echo values beyond EffectCraft's ranges are imported as stored and reported.
#[test]
fn echo_values_beyond_effectcrafts_range_are_reported() {
    // `echo-03-max`: 30 000 echoes and Decay 100; EffectCraft's Echo uses at most 255 and 1.
    let (g, r) = run(&echo(vec![(2, 30000.0), (4, 100.0)]), "ec.time.echo");
    let found = losses(&r, LossCategory::Effects, "ADBE Echo");
    assert_eq!(found.len(), 2, "{found:?}");
    assert!(found.iter().any(|d| d.contains("Number Of Echoes") && d.contains("0 to 255")), "{found:?}");
    assert!(found.iter().any(|d| d.contains("Decay") && d.contains("0 to 1")), "{found:?}");
    // Kept as stored.
    let g = g.expect("still imported");
    near(&g, "numberOfEchoes", 30000.0);
    near(&g, "decay", 100.0);
}

/// A keyframed Echo parameter keeps its keys as stored and reports the range loss.
#[test]
fn echo_keys_beyond_effectcrafts_range_are_kept_and_reported() {
    // Number Of Echoes keyed 10 -> 30 000: the second key is beyond EffectCraft's 255.
    let mut fx = echo(vec![]);
    fx.keys = vec![(2, vec![(0, 10.0), (1000, 30000.0)])];
    let (g, r) = run(&fx, "ec.time.echo");
    let found = losses(&r, LossCategory::Effects, "ADBE Echo");
    assert_eq!(found.len(), 1, "{found:?}");
    assert!(found[0].contains("Number Of Echoes") && found[0].contains("30000") && found[0].contains("0 to 255"), "{found:?}");
    assert!(losses(&r, LossCategory::DamagedData, "ADBE Echo").is_empty());
    // Both keys arrive with their values.
    let g = g.expect("still imported");
    let keys = &g.prop("numberOfEchoes").expect("numberOfEchoes").keys;
    let values: Vec<Value> = keys.iter().map(|k| k.value.clone()).collect();
    assert_eq!(values, [Value::Scalar(10.0), Value::Scalar(30000.0)]);
}

/// Linear Wipe's values, set and default.
#[test]
fn linear_wipe_values() {
    let fx = |values| Fx {
        match_name: "ADBE Linear Wipe",
        name: "Linear Wipe",
        defs: vec![
            slider(K::FixedSlider, "Transition Completion", 0.0, (0.0, 100.0)),
            other(K::Angle, "Wipe Angle", Default::Number(90.0)),
            slider(K::FixedSlider, "Feather", 0.0, (0.0, 32000.0)),
        ],
        values,
        data: vec![],
        keys: vec![],
    };
    // `linwipe-01-set-all`.
    let (g, r) = run(&fx(vec![(1, 10.0), (2, 77.0), (3, 16.0)]), "ec.transition.linearwipe");
    assert_eq!(losses(&r, LossCategory::Effects, "ADBE Linear Wipe"), Vec::<String>::new());
    let g = g.expect("imported");
    near(&g, "completion", 10.0);
    near(&g, "angle", 77.0);
    near(&g, "feather", 16.0);
    // `linwipe-00-defaults`: the Wipe Angle default 90.
    near(&run(&fx(vec![]), "ec.transition.linearwipe").0.expect("imported"), "angle", 90.0);
}

/// Offset's Blend With Original as a percentage and its centre as a point.
#[test]
fn offset_blend_is_a_fraction_and_the_centre_a_point() {
    let fx = |values| Fx {
        match_name: "ADBE Offset",
        name: "Offset",
        defs: vec![other(K::Point, "Shift Center To", Default::Point(0.5, 0.5)), slider(K::FixedSlider, "Blend With Original", 0.0, (0.0, 1.0))],
        values,
        data: vec![],
        keys: vec![],
    };
    // `offset-02-chk-toggled`: Blend With Original stored 1.0 is 100 %.
    let (g, r) = run(&fx(vec![(2, 1.0)]), "ec.distort.offset");
    assert_eq!(losses(&r, LossCategory::Effects, "ADBE Offset"), Vec::<String>::new());
    let g = g.expect("imported");
    near(&g, "blend", 100.0);
    // The default centre is the layer's centre (synthetic.aep's layer is 8x8).
    pt(&g, "shift", [4.0, 4.0]);
    near(&run(&fx(vec![(2, 0.25)]), "ec.distort.offset").0.expect("imported"), "blend", 25.0);
}

/// Color Stabilizer's points, Sample Size and Stabilize, default and set.
#[test]
fn color_stabilizer_points_sample_size_and_stabilize() {
    let fx = |values| Fx {
        match_name: "ADBE Deflicker",
        name: "Color Stabilizer",
        defs: vec![
            popup("Stabilize", 2, &["Brightness", "Levels", "Curves"]),
            other(K::Point, "Black Point", Default::Point(0.2, 0.5)),
            other(K::Point, "Mid Point", Default::Point(0.5, 0.5)),
            other(K::Point, "White Point", Default::Point(0.8, 0.5)),
            slider(K::FixedSlider, "Sample Size", 3.0, (0.0, 50.0)),
        ],
        values,
        data: vec![],
        keys: vec![],
    };
    // `colstab-00-defaults`: Levels, the points at 20 %, 50 % and 80 % of the width.
    let (g, r) = run(&fx(vec![]), "ec.color.colorstabilizer");
    assert_eq!(losses(&r, LossCategory::Effects, "ADBE Deflicker"), Vec::<String>::new());
    let g = g.expect("imported");
    assert_eq!(v(&g, "stabilize"), Value::Enum(1), "Levels");
    pt(&g, "blackPoint", [1.6, 4.0]);
    pt(&g, "whitePoint", [6.4, 4.0]);
    near(&g, "sampleSize", 3.0);
    // `colstab-03-pop1-3` and `colstab-27-pop5-25`.
    let (g, _) = run(&fx(vec![(1, 3.0), (5, 25.0)]), "ec.color.colorstabilizer");
    let g = g.expect("imported");
    assert_eq!(v(&g, "stabilize"), Value::Enum(2), "Curves");
    near(&g, "sampleSize", 25.0);
}

/// An adjustment layer's effect points are fractions of its comp, not of its own size: After
/// Effects 26.5 stores Motion Tile's Tile Center 540 on a 1920x1080 adjustment layer in a
/// 1920x1920 comp as 540 / 1920 (lab `adj-motion-tile`).
#[test]
fn an_adjustment_layers_effect_points_are_fractions_of_its_comp() {
    let fx = Fx {
        match_name: "ADBE Offset",
        name: "Offset",
        defs: vec![other(K::Point, "Shift Center To", Default::Point(0.25, 0.75)), slider(K::FixedSlider, "Blend With Original", 0.0, (0.0, 1.0))],
        values: vec![],
        data: vec![],
        keys: vec![],
    };
    fn visit(chunks: &mut [Chunk<'_>], f: &mut dyn FnMut(&mut Chunk<'_>)) {
        for c in chunks {
            f(c);
            visit(c.children_mut(), f);
        }
    }
    let plain = bytes_with(&fx);
    let mut file = parse(&plain).unwrap();
    // `ldta` byte 38 bit 0x02: the adjustment switch.
    visit(&mut file.chunks, &mut |c| {
        if c.id == *b"ldta"
            && let Body::Data(d) = &mut c.body
        {
            d.to_mut()[38] |= 0x02;
        }
    });
    let adjusted = write(&file).unwrap();
    let mut project = Project::default();
    let none = |_: &str| false;
    import(&mut project, &adjusted, &ImportOptions { allow_losses: true, ..ImportOptions::new(&none) }).unwrap();
    let (_, comp) = project.comps().find(|(_, c)| c.layers.iter().any(|l| l.switches.adjustment)).expect("an adjustment layer");
    let (w, h) = (f64::from(comp.width), f64::from(comp.height));
    let (g, _) = import_bytes(&adjusted, "ec.distort.offset");
    pt(&g.expect("imported"), "shift", [0.25 * w, 0.75 * h]);
    // On the plain layer (8x8) the same fractions stay fractions of the layer.
    pt(&run(&fx, "ec.distort.offset").0.expect("imported"), "shift", [2.0, 6.0]);
}
