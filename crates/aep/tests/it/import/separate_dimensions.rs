//! Separate Dimensions: a Position whose `tdsb` has bit `0x800` keeps its value in X, Y and Z
//! Position (`ADBE Position_0/1/2`). Built from an exported one-layer project (no external files;
//! the values are made up, the bit is the one After Effects 2026 writes: `0x803` separated, `1`
//! not).

use std::sync::Arc;

use effectcraft_aep::export::{ExportOptions, export};
use effectcraft_aep::import::{ImportOptions, ImportResult, LossCategory, import};
use effectcraft_aep::{Body, Chunk, parse, write};
use effectcraft_color::Label;
use effectcraft_keyframe::Value;
use effectcraft_project::{Comp, ItemKind, LayerSource, Project, Solid, build};
use effectcraft_time::{FrameRate, Tick};

/// One comp `C` with one solid layer `L` at Position `[100, 200]`, exported.
fn exported() -> Vec<u8> {
    let mut p = Project::default();
    let mut comp = Comp::new(640, 360, FrameRate::new(25, 1), Tick::from_seconds_f64(2.0));
    let s = p.add_item("S", Label::Red, None, ItemKind::Solid(Solid { color: [1.0, 0.0, 0.0], width: 640, height: 360, pixel_aspect: 1.0 }));
    let mut l = build::layer(&mut p, &comp, "L", LayerSource::Solid { item: s }, (640, 360), None);
    l.name = "L".into();
    if let Some(pos) = l.props.prop_mut("transform/position") {
        pos.value = Value::Vec3([100.0, 200.0, 0.0]);
    }
    comp.layers.push(l);
    p.add_item("C", Label::None, None, ItemKind::Comp(Arc::new(comp)));
    export(&p, &ExportOptions { allow_losses: true }).unwrap().bytes
}

/// Calls `f` with every record and the match name stored before it.
fn visit(chunks: &mut [Chunk<'_>], f: &mut dyn FnMut(&str, &mut Chunk<'_>)) {
    let mut name = String::new();
    for c in chunks {
        if let Body::Data(d) = &c.body
            && c.id == *b"tdmn"
        {
            name = String::from_utf8_lossy(d).trim_end_matches('\0').to_string();
            continue;
        }
        if c.is_list(b"tdbs") {
            f(&name, c);
        }
        visit(c.children_mut(), f);
    }
}

/// Sets a record's state (`tdsb`) and, when given, the first number of its `cdat`.
fn set(record: &mut Chunk<'_>, state: u32, value: Option<f64>) {
    for r in record.children_mut() {
        let Body::Data(d) = &mut r.body else { continue };
        let d = d.to_mut();
        match (&r.id, value) {
            (b"tdsb", _) => d.copy_from_slice(&state.to_be_bytes()),
            (b"cdat", Some(v)) => d[..8].copy_from_slice(&v.to_be_bytes()),
            _ => {}
        }
    }
}

/// [`exported`] with its Position separated into X 33 and Y 44.
fn separated() -> Vec<u8> {
    let bytes = exported();
    let mut file = parse(&bytes).unwrap();
    let mut patched = 0;
    visit(&mut file.chunks, &mut |name, c| match name {
        "ADBE Position" => {
            set(c, 0x803, None);
            patched += 1;
        }
        "ADBE Position_0" => set(c, 1, Some(33.0)),
        "ADBE Position_1" => set(c, 1, Some(44.0)),
        _ => {}
    });
    assert!(patched > 0, "the synthetic project has a Position");
    write(&file).unwrap()
}

fn import_all(bytes: &[u8]) -> (Project, ImportResult) {
    let mut project = Project::default();
    let none = |_: &str| false;
    let r = import(&mut project, bytes, &ImportOptions { allow_losses: true, ..ImportOptions::new(&none) }).unwrap();
    (project, r)
}

/// The dimensions arrive as X/Y/Z Position after Position (they were dropped and reported), so
/// the layer renders where After Effects puts it.
#[test]
fn separated_position_dimensions_are_imported() {
    let (p, r) = import_all(&separated());
    let mut seen = 0;
    for (_, c) in p.comps() {
        for l in &c.layers {
            let tr = l.props.sub("transform").unwrap();
            let x = tr.get("positionX").unwrap_or_else(|| panic!("{}: no X Position", l.name));
            assert_eq!(x.value, Value::Scalar(33.0), "{}", l.name);
            assert_eq!(tr.get("positionY").map(|p| p.value.clone()), Some(Value::Scalar(44.0)), "{}", l.name);
            let z = tr.get("positionZ").unwrap_or_else(|| panic!("{}: no Z Position", l.name));
            assert!(z.three_d_only);
            let order: Vec<&str> = tr.children.iter().map(|c| c.match_id()).collect();
            let at = order.iter().position(|m| *m == "position").unwrap();
            assert_eq!(order.get(at + 1..at + 4), Some(&["positionX", "positionY", "positionZ"][..]), "{}", l.name);
            seen += 1;
        }
    }
    assert_eq!(seen, 1);
    let dims: Vec<String> = r
        .report
        .losses
        .iter()
        .filter(|l| l.category == LossCategory::TransformProperties)
        .flat_map(|l| l.details.clone())
        .filter(|d| d.contains("ADBE Position_"))
        .collect();
    assert!(dims.is_empty(), "{dims:?}");
}

/// A Position that is not separated (lab layer C: `tdsb` 1) gets no X/Y/Z Position, whatever its
/// dimension records hold.
#[test]
fn a_position_that_is_not_separated_stays_one_property() {
    let bytes = exported();
    let mut file = parse(&bytes).unwrap();
    visit(&mut file.chunks, &mut |name, c| {
        if name == "ADBE Position_0" {
            set(c, 3, Some(33.0));
        }
    });
    let (p, _) = import_all(&write(&file).unwrap());
    for (_, c) in p.comps() {
        for l in &c.layers {
            assert!(l.props.prop("transform/positionX").is_none(), "{}", l.name);
        }
    }
}
