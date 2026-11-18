//! Essential Properties: a composition's Essential Graphics controls and the values its precomp
//! layers override.
//!
//! Format (After Effects 26.5, a file made for these tests with five properties on three layers):
//!
//! * The composition item holds `LIST CIFO`, `LIST CIF2` and `LIST CIF3`. Each starts with
//!   `LIST CpS2` (whose first `Utf8` is the template name) and lists the controls as `LIST CCtl`;
//!   `CIF2` and `CIF3` hold all five, `CIFO` three. The fullest list is read.
//! * A `LIST CCtl` holds `LIST CpS2` (first `Utf8`: the control name), a direct `Utf8` with the
//!   control's UUID, `CTyp` (u32: 2 slider, 3 angle, 4 colour, 6 text, 9 scale) and one `LIST CPrp`
//!   per property it drives: `CLId` (u32, the layer id) and a `Utf8` JSON path from the layer, e.g.
//!   `{"0":{"index":4294967295,"matchName":"ADBE Transform Group"},"1":{"index":4294967295,
//!   "matchName":"ADBE Opacity"}}`. `index` is the 0-based place of an indexed item (a shape group,
//!   a fill) and 4294967295 for a named one.
//! * A precomp layer of such a composition has `tdmn "ADBE Layer Overrides"` in its property group,
//!   followed by `LIST OvG2` (one `LIST CPrp` per control, each with the control's UUID in a `Utf8`)
//!   and a `LIST tdgp` with one record per control in the same order: a `tdmn` with the property's
//!   match name, then a `LIST tdbs` (or, for Source Text, a `LIST btds` holding the `tdbs` and the
//!   text document). The record's `tdsb` is 1 when the instance overrides the value and 0 when it
//!   follows the composition. Values are stored as the property stores them (opacity and scale as
//!   fractions, colours as ARGB 0..255), static or keyed.

use effectcraft_project::{Layer, PropGroup, Uid};

use crate::container::Node;
use crate::import::props::Kind;

/// The JSON `index` of a named (not indexed) step.
const NO_INDEX: u64 = 4_294_967_295;
/// Steps of a property path, at most (a path into shape groups nested this deep is not read).
const MAX_STEPS: usize = 64;
/// Controls of one composition, at most.
const MAX_CONTROLS: usize = 4096;

/// One step of a property path: a match name, and the place of an indexed item.
#[derive(Clone, Debug, PartialEq)]
pub(crate) struct Step {
    pub(crate) match_name: String,
    pub(crate) index: Option<u32>,
}

/// A property a control drives: the layer (After Effects id) and the path from it.
#[derive(Clone, Debug, PartialEq)]
pub(crate) struct Target {
    pub(crate) layer: u32,
    pub(crate) path: Vec<Step>,
}

/// One Essential Properties control as the file stores it.
#[derive(Clone, Debug, PartialEq)]
pub(crate) struct Control {
    pub(crate) name: String,
    pub(crate) uuid: String,
    /// `CTyp`.
    pub(crate) kind: u32,
    /// The properties it drives; the first is the main one.
    pub(crate) targets: Vec<Target>,
}

/// A composition's Essential Properties.
#[derive(Clone, Debug, Default, PartialEq)]
pub(crate) struct Template {
    pub(crate) name: String,
    pub(crate) controls: Vec<Control>,
}

/// The `CTyp` of a Scale control.
pub(crate) const CTYP_SCALE: u32 = 9;

fn utf8(n: Node<'_, '_>) -> Option<String> {
    n.is(b"Utf8").then(|| n.bytes().map(|b| String::from_utf8_lossy(b).into_owned())).flatten()
}

fn be_u32(n: Node<'_, '_>) -> Option<u32> {
    let b = n.bytes()?;
    Some(u32::from_be_bytes(b.get(..4)?.try_into().ok()?))
}

/// The first `Utf8` of the `LIST CpS2` among `n`'s children.
fn display_name(n: Node<'_, '_>) -> Option<String> {
    n.child_list(b"CpS2")?.children().find_map(utf8)
}

/// The Essential Properties of a composition item (its chunk); `None` when it has none.
pub(crate) fn read_template(item: Node<'_, '_>) -> Option<Template> {
    let count = |cif: Node<'_, '_>| cif.children().filter(|c| c.is_list(b"CCtl")).count();
    // The fullest list; the newest (CIF3, then CIF2, then CIFO) when two are as full.
    let cif = [b"CIF3", b"CIF2", b"CIFO"].into_iter().filter_map(|t| item.child_list(t)).filter(|c| count(*c) > 0).max_by_key(|c| (count(*c), 0))?;
    let name = display_name(cif).unwrap_or_default();
    let controls = cif.children().filter(|c| c.is_list(b"CCtl")).take(MAX_CONTROLS).map(read_control).collect();
    Some(Template { name, controls })
}

fn read_control(c: Node<'_, '_>) -> Control {
    let targets = c
        .children()
        .filter(|p| p.is_list(b"CPrp"))
        .filter_map(|p| {
            let layer = p.child(b"CLId").and_then(be_u32)?;
            let path = parse_path(&p.children().find_map(utf8)?)?;
            Some(Target { layer, path })
        })
        .collect();
    Control {
        name: display_name(c).unwrap_or_default(),
        uuid: c.children().find_map(utf8).unwrap_or_default(),
        kind: c.child(b"CTyp").and_then(be_u32).unwrap_or(0),
        targets,
    }
}

/// The steps of a JSON property path, in key order (`"0"`, `"1"`…); `None` when it is not one.
pub(crate) fn parse_path(json: &str) -> Option<Vec<Step>> {
    let v: serde_json::Value = serde_json::from_str(json).ok()?;
    let obj = v.as_object()?;
    if obj.is_empty() || obj.len() > MAX_STEPS {
        return None;
    }
    let mut steps = Vec::with_capacity(obj.len());
    for i in 0..obj.len() {
        let s = obj.get(&i.to_string())?;
        let match_name = s.get("matchName")?.as_str()?.to_string();
        let index = match s.get("index").and_then(serde_json::Value::as_u64) {
            None | Some(NO_INDEX) => None,
            Some(n) => Some(u32::try_from(n).ok()?),
        };
        steps.push(Step { match_name, index });
    }
    Some(steps)
}

/// How an override value of a resolved property is read.
#[derive(Clone, Copy, Debug, PartialEq)]
pub(crate) enum Conv {
    Value(Kind),
    /// Source Text: a text document.
    Text,
}

/// The project property a control drives on `layer`; why not when it can't be found.
pub(crate) fn resolve(layer: &Layer, path: &[Step]) -> Result<(Uid, Conv), String> {
    let names: Vec<&str> = path.iter().map(|s| s.match_name.as_str()).collect();
    let found = match names.as_slice() {
        ["ADBE Transform Group", p] => {
            let (id, kind) = match *p {
                "ADBE Position" => ("position", Kind::Position),
                "ADBE Scale" => ("scale", Kind::Scale),
                "ADBE Rotate Z" => ("rotation", Kind::Rotation),
                "ADBE Rotate X" => ("rotationX", Kind::Rotation),
                "ADBE Rotate Y" => ("rotationY", Kind::Rotation),
                "ADBE Opacity" => ("opacity", Kind::Opacity),
                _ => return Err(format!("the Transform property {p} is not supported")),
            };
            layer.props.sub("transform").and_then(|t| t.prop(id)).map(|p| (p.uid, Conv::Value(kind)))
        }
        ["ADBE Text Properties", "ADBE Text Document"] => layer.props.prop("text/sourceText").map(|p| (p.uid, Conv::Text)),
        ["ADBE Root Vectors Group", ..] => return shape_property(layer, path.get(1..).unwrap_or_default()),
        _ => return Err(format!("the property {} is not supported", names.join(" > "))),
    };
    found.ok_or_else(|| "the layer has no such property".to_string())
}

/// The project match id of a shape item's After Effects match name.
fn shape_item(match_name: &str) -> Option<&'static str> {
    Some(match match_name {
        "ADBE Vector Group" => "group",
        "ADBE Vector Shape - Rect" => "rect",
        "ADBE Vector Shape - Ellipse" => "ellipse",
        "ADBE Vector Shape - Star" => "star",
        "ADBE Vector Graphic - Fill" => "fill",
        "ADBE Vector Graphic - Stroke" => "stroke",
        _ => return None,
    })
}

/// The project id and unit of a shape property (as `shapes.rs` imports it).
fn shape_prop(match_name: &str) -> Option<(&'static str, Kind)> {
    Some(match match_name {
        "ADBE Vector Fill Color" | "ADBE Vector Stroke Color" => ("color", Kind::EffectColor),
        "ADBE Vector Fill Opacity" | "ADBE Vector Stroke Opacity" | "ADBE Vector Group Opacity" => ("opacity", Kind::Number),
        "ADBE Vector Stroke Width" => ("width", Kind::Number),
        "ADBE Vector Rotation" => ("rotation", Kind::Number),
        "ADBE Vector Rect Roundness" => ("roundness", Kind::Number),
        "ADBE Vector Position" | "ADBE Vector Rect Position" | "ADBE Vector Ellipse Position" => ("position", Kind::Vec2),
        "ADBE Vector Scale" => ("scale", Kind::Vec2),
        "ADBE Vector Anchor" => ("anchor", Kind::Vec2),
        "ADBE Vector Rect Size" | "ADBE Vector Ellipse Size" => ("size", Kind::Vec2),
        _ => return None,
    })
}

/// A property inside a shape layer's contents, by the steps after `ADBE Root Vectors Group`.
fn shape_property(layer: &Layer, path: &[Step]) -> Result<(Uid, Conv), String> {
    let Some((last, groups)) = path.split_last() else { return Err("the shape path is empty".into()) };
    let mut cur: &PropGroup = layer.props.sub("contents").ok_or("the layer has no shape contents")?;
    // The item the last indexed step reached (its sub-groups are named steps).
    let mut item: Option<&PropGroup> = None;
    for s in groups {
        match (s.match_name.as_str(), s.index) {
            ("ADBE Vectors Group", None) => cur = item.and_then(|g| g.sub("contents")).ok_or("a shape group has no contents")?,
            ("ADBE Vector Transform Group", None) => cur = item.and_then(|g| g.sub("transform")).ok_or("a shape group has no transform")?,
            (m, Some(i)) => {
                let want = shape_item(m).ok_or_else(|| format!("the shape item {m} is not supported"))?;
                // Items the import skips shift the places; the type check catches most of that.
                let g = cur.children.get(i as usize).and_then(|n| n.as_group()).filter(|g| g.match_id == want);
                let g = g.ok_or_else(|| format!("shape item {} ({m}) not found", i.saturating_add(1)))?;
                item = Some(g);
                cur = g;
            }
            (m, None) => return Err(format!("the shape group {m} is not supported")),
        }
    }
    let (id, kind) = shape_prop(&last.match_name).ok_or_else(|| format!("the shape property {} is not supported", last.match_name))?;
    let p = cur.children.iter().filter_map(|n| n.as_prop()).find(|p| p.match_id == id).ok_or("the shape item has no such property")?;
    Ok((p.uid, Conv::Value(kind)))
}

/// One record of a precomp layer's overrides.
#[derive(Clone, Copy, Debug)]
pub(crate) struct OverrideRecord<'f, 'a> {
    /// The record: a `LIST tdbs`, or a `LIST btds` for Source Text.
    pub(crate) record: Node<'f, 'a>,
}

impl<'f, 'a> OverrideRecord<'f, 'a> {
    /// The `tdbs` of the record.
    pub(crate) fn property(&self) -> Option<crate::Property<'f, 'a>> {
        if self.record.is_list(b"btds") { crate::Property::from_chunk(self.record.child_list(b"tdbs")?) } else { crate::Property::from_chunk(self.record) }
    }

    /// Whether the instance overrides the value (`tdsb` 1).
    pub(crate) fn overridden(&self) -> bool {
        self.property().and_then(|p| p.flags()) == Some(1)
    }

    /// Whether a Source Text record is keyed (one text document per key).
    pub(crate) fn text_keyed(&self) -> bool {
        self.property().is_some_and(|p| p.is_animated()) || self.record.descendants().filter(|(_, c)| c.is_list(b"btdk")).count() > 1
    }

    /// The text document of a Source Text record (the first, when keyed).
    pub(crate) fn text(&self) -> Option<crate::TextDocument> {
        crate::TextDocument::parse(self.record.find_list(b"btdk")?.bytes()?)
    }
}

fn until_nul(b: &[u8]) -> &[u8] {
    b.split(|c| *c == 0).next().unwrap_or_default()
}

/// The overrides of a precomp layer (its `LIST Layr`), by control UUID; `None` when it has
/// none, `Some(Err)` when they can't be paired with their controls.
pub(crate) fn read_overrides<'f, 'a>(layer: Node<'f, 'a>) -> Option<Result<Vec<(String, OverrideRecord<'f, 'a>)>, String>> {
    let root = layer.child_list(b"tdgp")?;
    let kids: Vec<Node<'f, 'a>> = root.children().collect();
    let at = kids.iter().position(|c| c.is(b"tdmn") && c.bytes().map(until_nul) == Some(b"ADBE Layer Overrides".as_slice()))?;
    let rest = kids.get(at.saturating_add(1)..).unwrap_or_default();
    // The next `tdmn` starts the next property: the overrides' lists come before it.
    let end = rest.iter().position(|c| c.is(b"tdmn")).unwrap_or(rest.len());
    let own = rest.get(..end).unwrap_or_default();
    let uuids: Vec<String> = own
        .iter()
        .find(|c| c.is_list(b"OvG2"))
        .map(|g| g.children().filter(|c| c.is_list(b"CPrp")).filter_map(|c| c.children().find_map(utf8)).take(MAX_CONTROLS).collect())
        .unwrap_or_default();
    let Some(group) = own.iter().find(|c| c.is_list(b"tdgp")) else { return Some(Ok(vec![])) };
    let mut records = vec![];
    let mut pending_name = false;
    for c in group.children() {
        if c.is(b"tdmn") {
            pending_name = c.bytes().map(until_nul) != Some(b"ADBE Group End".as_slice());
        } else if pending_name && (c.is_list(b"tdbs") || c.is_list(b"btds")) {
            records.push(OverrideRecord { record: c });
            pending_name = false;
        }
    }
    if records.len() != uuids.len() {
        return Some(Err(format!("{} override values for {} controls", records.len(), uuids.len())));
    }
    Some(Ok(uuids.into_iter().zip(records).collect()))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn paths_are_read_in_key_order_with_their_indices() {
        let json = r#"{"1":{"index":0,"matchName":"ADBE Vector Group"},"0":{"index":4294967295,"matchName":"ADBE Root Vectors Group"}}"#;
        let steps = parse_path(json).unwrap();
        assert_eq!(
            steps,
            [Step { match_name: "ADBE Root Vectors Group".into(), index: None }, Step { match_name: "ADBE Vector Group".into(), index: Some(0) }]
        );
        // A gap, a missing match name, an index past u32, and not an object: no path.
        assert_eq!(parse_path(r#"{"0":{"matchName":"a"},"2":{"matchName":"b"}}"#), None);
        assert_eq!(parse_path(r#"{"0":{"index":1}}"#), None);
        assert_eq!(parse_path(r#"{"0":{"index":4294967296,"matchName":"a"}}"#), None);
        assert_eq!(parse_path("[]"), None);
        assert_eq!(parse_path("{"), None);
    }
}
