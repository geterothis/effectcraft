//! Essential Properties and the values precomp layers override, on the committed synthetic
//! project (see `synthetic.rs`) with the chunks After Effects 26.5 writes for them added: controls
//! on composition `C`, and a second composition `Main` holding `C` as a precomp layer that
//! overrides one of them.

use effectcraft_aep::import::{ImportOptions, ImportResult, LossCategory, import};
use effectcraft_aep::{AepFile, Body, Chunk, parse, write};
use effectcraft_keyframe::Value;
use effectcraft_project::essential::{self, ControlType, EgKind};
use effectcraft_project::{GroupKind, LayerSource, Project};

const SYNTHETIC: &[u8] = include_bytes!("../../fixtures/synthetic.aep");
/// The item id of composition `C` and the layer id of its solid layer.
const COMP_C: u32 = 2;
const SOLID_LAYER: u32 = 16;
/// The item id of the added composition `Main`.
const MAIN: u32 = 40;

fn data(id: &[u8; 4], bytes: Vec<u8>) -> Chunk<'static> {
    Chunk::data(*id, bytes)
}

fn utf8(s: &str) -> Chunk<'static> {
    data(b"Utf8", s.as_bytes().to_vec())
}

fn u32be(id: &[u8; 4], v: u32) -> Chunk<'static> {
    data(id, v.to_be_bytes().to_vec())
}

/// A display name list (`LIST CpS2`).
fn names(name: &str) -> Chunk<'static> {
    Chunk::list(*b"CpS2", vec![u32be(b"CsCt", 0x0100_0000), utf8(name), utf8("en_US")])
}

/// A JSON property path from a layer.
fn path(steps: &[(&str, Option<u32>)]) -> String {
    let parts: Vec<String> =
        steps.iter().enumerate().map(|(i, (m, ix))| format!(r#""{i}":{{"index":{},"matchName":"{m}"}}"#, ix.unwrap_or(4_294_967_295))).collect();
    format!("{{{}}}", parts.join(","))
}

/// A control (`LIST CCtl`) driving `json` on layer `layer`.
fn control(name: &str, uuid: &str, ctyp: u32, layer: u32, json: &str) -> Chunk<'static> {
    Chunk::list(
        *b"CCtl",
        vec![
            names(name),
            utf8(uuid),
            u32be(b"CTyp", ctyp),
            u32be(b"CprC", 1),
            Chunk::list(*b"CPrp", vec![u32be(b"CCId", 1), u32be(b"CLId", layer), utf8(json)]),
        ],
    )
}

/// A property record (`LIST tdbs`) in state `tdsb` holding the static value `v`.
fn record(name: &str, tdsb: u32, v: &[f64]) -> Chunk<'static> {
    let mut tdb4 = vec![0u8; 124];
    tdb4[3] = v.len() as u8;
    let mut cdat: Vec<u8> = v.iter().flat_map(|x| x.to_be_bytes()).collect();
    cdat.resize(cdat.len().max(40), 0);
    Chunk::list(*b"tdbs", vec![u32be(b"tdsb", tdsb), data(b"tdsn", name.as_bytes().to_vec()), data(b"tdb4", tdb4), data(b"cdat", cdat)])
}

fn tdmn(name: &str) -> Chunk<'static> {
    let mut b = name.as_bytes().to_vec();
    b.resize(40, 0);
    data(b"tdmn", b)
}

/// The chunks that follow a precomp layer's `tdmn "ADBE Layer Overrides"`: the control UUIDs and
/// one record per control.
fn overrides(entries: &[(&str, &str, Chunk<'static>)]) -> Vec<Chunk<'static>> {
    let ovg2 = Chunk::list(
        *b"OvG2",
        std::iter::once(u32be(b"CprC", entries.len() as u32)).chain(entries.iter().map(|(uuid, _, _)| Chunk::list(*b"CPrp", vec![utf8(uuid)]))).collect(),
    );
    let mut group = vec![u32be(b"tdsb", 1)];
    for (_, match_name, rec) in entries {
        group.push(tdmn(match_name));
        group.push(rec.clone());
    }
    group.push(tdmn("ADBE Group End"));
    vec![tdmn("ADBE Layer Overrides"), ovg2, Chunk::list(*b"tdgp", group)]
}

fn idta_id(item: &Chunk<'_>) -> Option<u32> {
    let d = item.children().iter().find(|c| c.id == *b"idta")?.bytes()?;
    Some(u32::from_be_bytes(d.get(16..20)?.try_into().ok()?))
}

fn set_u32(c: &mut Chunk<'_>, at: usize, v: u32) {
    if let Body::Data(d) = &mut c.body {
        d.to_mut()[at..at + 4].copy_from_slice(&v.to_be_bytes());
    }
}

/// The synthetic project with `controls` on `C` and, when `layer_overrides` is given, a
/// composition `Main` whose solid layer is turned into a precomp layer of `C` carrying them.
fn project(controls: Vec<Chunk<'static>>, layer_overrides: Option<Vec<Chunk<'static>>>) -> Vec<u8> {
    let mut file: AepFile<'_> = parse(SYNTHETIC).unwrap();
    fn walk(chunks: &mut Vec<Chunk<'_>>, controls: &[Chunk<'static>], over: &Option<Vec<Chunk<'static>>>) {
        let at = chunks.iter().position(|c| c.list_type() == Some(*b"Item") && idta_id(c) == Some(COMP_C));
        if let Some(at) = at {
            let mut main = chunks[at].clone();
            if let Body::List { children, .. } = &mut chunks[at].body {
                for c in children.iter_mut() {
                    if let Body::List { list_type, children } = &mut c.body
                        && list_type == b"CIF3"
                    {
                        children.extend(controls.iter().cloned());
                    }
                }
            }
            if let Some(over) = over {
                let Body::List { children, .. } = &mut main.body else { unreachable!() };
                for c in children.iter_mut() {
                    match (c.id, c.list_type()) {
                        (id, _) if id == *b"idta" => set_u32(c, 16, MAIN),
                        (id, _) if id == *b"Utf8" => *c = utf8("Main"),
                        (_, Some(t)) if t == *b"Layr" => {
                            let Body::List { children: layer, .. } = &mut c.body else { continue };
                            let ldta = layer.iter_mut().find(|k| k.id == *b"ldta").unwrap();
                            let id = u32::from_be_bytes(ldta.bytes().unwrap()[0..4].try_into().unwrap());
                            set_u32(ldta, 0, id + 100);
                            if id == SOLID_LAYER {
                                set_u32(ldta, 40, COMP_C);
                                let root = layer.iter_mut().find(|k| k.list_type() == Some(*b"tdgp")).unwrap();
                                let Body::List { children: props, .. } = &mut root.body else { unreachable!() };
                                // Every layer has `tdmn "ADBE Layer Overrides"`, an empty
                                // `LIST OvG2` and an empty `LIST tdgp`; a layer that overrides
                                // has its controls and records in them.
                                let at = props.iter().position(|k| k.id == *b"tdmn" && k.bytes().unwrap().starts_with(b"ADBE Layer Overrides\0")).unwrap();
                                assert_eq!((props[at + 1].list_type(), props[at + 2].list_type()), (Some(*b"OvG2"), Some(*b"tdgp")));
                                props.splice(at..at + 3, over.iter().cloned());
                            }
                        }
                        _ => {}
                    }
                }
                chunks.insert(at + 1, main);
            }
            return;
        }
        for c in chunks.iter_mut() {
            if let Body::List { children, .. } = &mut c.body {
                walk(children, controls, over);
            }
        }
    }
    walk(&mut file.chunks, &controls, &layer_overrides);
    write(&file).unwrap()
}

fn run(bytes: &[u8]) -> (Project, ImportResult) {
    let mut project = Project::default();
    let none = |_: &str| false;
    let r = import(&mut project, bytes, &ImportOptions { allow_losses: true, ..ImportOptions::new(&none) }).unwrap();
    (project, r)
}

fn losses(r: &ImportResult) -> Vec<String> {
    r.report.losses.iter().filter(|l| l.category == LossCategory::EssentialGraphics).flat_map(|l| l.details.clone()).collect()
}

fn comp_named<'p>(p: &'p Project, name: &str) -> &'p effectcraft_project::Comp {
    let id = p.comps().map(|(id, _)| *id).find(|id| p.item(*id).is_some_and(|i| i.name == name)).unwrap_or_else(|| panic!("no comp {name}"));
    p.comp(id).unwrap()
}

const OPACITY: &str = "ac26a805-eae4-4c28-a1ea-d884ccc2e4a3";
const SCALE: &str = "fc0e97e6-264f-4809-90f1-d52ece6c111a";

fn opacity_and_scale() -> Vec<Chunk<'static>> {
    vec![
        control("Box Opacity", OPACITY, 2, SOLID_LAYER, &path(&[("ADBE Transform Group", None), ("ADBE Opacity", None)])),
        control("Box Scale", SCALE, 9, SOLID_LAYER, &path(&[("ADBE Transform Group", None), ("ADBE Scale", None)])),
    ]
}

#[test]
fn controls_become_the_compositions_essential_properties() {
    let (p, r) = run(&project(opacity_and_scale(), None));
    assert_eq!(losses(&r), Vec::<String>::new());
    assert_eq!(r.report.imported.essential_properties, 2);
    let c = comp_named(&p, "C");
    let eg = c.essential.as_ref().expect("Essential Properties");
    let solid = c.layers.iter().find(|l| matches!(l.source, LayerSource::Solid { .. })).unwrap();
    let names: Vec<_> = eg.controls.iter().map(|c| c.name.as_str()).collect();
    assert_eq!(names, ["Box Opacity", "Box Scale"]);
    for (ctl, path) in eg.controls.iter().zip(["transform/opacity", "transform/scale"]) {
        let EgKind::Property { layer, prop, links } = &ctl.kind else { panic!("{ctl:?}") };
        assert_eq!((*layer, *prop), (solid.id, solid.props.prop(path).unwrap().uid), "{}", ctl.name);
        assert!(links.is_empty());
    }
    // A Scale control is the uniform Scale slider.
    assert_eq!(eg.controls[1].as_type, Some(ControlType::Scale));
    assert_eq!(eg.controls[0].as_type, None);
}

#[test]
fn a_precomp_layer_keeps_the_values_it_overrides() {
    // Opacity overridden to 30 % (stored as the fraction 0.3); Scale follows the composition
    // (`tdsb` 0, its stored value is not used).
    let over = overrides(&[(OPACITY, "ADBE Opacity", record("Box Opacity", 1, &[0.3])), (SCALE, "ADBE Scale", record("Box Scale", 0, &[0.5, 0.5, 1.0]))]);
    let (p, r) = run(&project(opacity_and_scale(), Some(over)));
    assert_eq!(losses(&r), Vec::<String>::new());
    let eg = comp_named(&p, "C").essential.clone().unwrap();
    let main = comp_named(&p, "Main");
    let inst = main.layers.iter().find(|l| matches!(l.source, LayerSource::Comp { .. })).expect("the precomp layer");
    let group = essential::group(inst).expect("its Essential Properties");
    let prop = |i: usize| group.children.iter().filter_map(|n| n.as_prop()).find(|p| p.match_id == essential::match_id(eg.controls[i].id)).unwrap();
    assert_eq!(prop(0).value, Value::Scalar(30.0));
    assert_eq!(prop(1).value, Value::Vec3([100.0, 100.0, 100.0]), "not overridden: the composition's value");
    let GroupKind::Essential { overridden } = &group.kind else { panic!() };
    assert_eq!(overridden, &vec![prop(0).uid]);
}

#[test]
fn what_cannot_be_imported_is_reported() {
    let mut controls = opacity_and_scale();
    // An effect parameter (not supported yet), a layer that does not exist, a control without a
    // property, and a shape item on a solid layer.
    controls.push(control("Amount", "u-3", 2, SOLID_LAYER, &path(&[("ADBE Effect Parade", None), ("ADBE Slider Control", Some(0))])));
    controls.push(control("Gone", "u-4", 2, 999, &path(&[("ADBE Transform Group", None), ("ADBE Opacity", None)])));
    controls.push(Chunk::list(*b"CCtl", vec![names("Note"), utf8("u-5"), u32be(b"CTyp", 2)]));
    controls.push(control(
        "Fill",
        "u-6",
        4,
        SOLID_LAYER,
        &path(&[("ADBE Root Vectors Group", None), ("ADBE Vector Graphic - Fill", Some(0)), ("ADBE Vector Fill Color", None)]),
    ));
    // An override of a control whose property is not imported is reported too.
    let over = overrides(&[
        (OPACITY, "ADBE Opacity", record("Box Opacity", 0, &[1.0])),
        (SCALE, "ADBE Scale", record("Box Scale", 0, &[1.0, 1.0, 1.0])),
        ("u-3", "ADBE Slider Control-0001", record("Amount", 1, &[5.0])),
    ]);
    let (p, r) = run(&project(controls, Some(over)));
    let lost = losses(&r);
    assert_eq!(lost.len(), 5, "{lost:#?}");
    for (needle, why) in [
        ("'Amount'", "not supported"),
        ("'Gone'", "its layer was not imported"),
        ("'Note'", "drives no property"),
        ("'Fill'", "no shape contents"),
        ("Main: ", "a control that was not imported"),
    ] {
        assert!(lost.iter().any(|l| l.contains(needle) && l.contains(why)), "{needle} {why}: {lost:#?}");
    }
    assert_eq!(comp_named(&p, "C").essential.as_ref().unwrap().controls.len(), 2, "the two supported controls stay");
}

#[test]
fn a_composition_without_controls_has_no_essential_properties() {
    let (p, r) = run(SYNTHETIC);
    assert_eq!(losses(&r), Vec::<String>::new());
    assert_eq!(r.report.imported.essential_properties, 0);
    assert!(comp_named(&p, "C").essential.is_none());
}
