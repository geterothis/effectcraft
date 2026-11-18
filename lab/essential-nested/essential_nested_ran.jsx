// Builds essential_nested.aep: an Anchor Point control on a null and on a solid, and Essential
// Properties passed up through a nested precomposition. Run in a new empty project; writes next
// to this script. Re-fetches objects by name after each change (AE invalidates references).
(function () {
    var here = File($.fileName).parent;
    var out = { errors: [] };
    function err(w, e) { out.errors.push(w + ": " + String(e)); }
    function comp(name) { for (var i = 1; i <= app.project.numItems; i++) { var it = app.project.item(i); if (it instanceof CompItem && it.name === name) return it; } return null; }
    function add(prop, c, name) { try { prop.addToMotionGraphicsTemplateAs(c, name); } catch (e) { err("add " + name, e); } }

    // Inner: a solid with Position and Scale controls, a null and a solid with Anchor Point controls.
    var inner = app.project.items.addComp("Inner", 640, 360, 1, 2, 30);
    inner.layers.addSolid([0.9, 0.3, 0.1], "box", 120, 80, 1);
    inner.layers.addNull(); inner.layer(1).name = "ctrl";
    inner.layers.addSolid([0.1, 0.7, 0.3], "pivot", 200, 100, 1);
    inner = comp("Inner");
    add(inner.layer("box").property("ADBE Transform Group").property("ADBE Position"), inner, "Box position");
    inner = comp("Inner");
    add(inner.layer("box").property("ADBE Transform Group").property("ADBE Scale"), inner, "Box scale");
    inner = comp("Inner");
    add(inner.layer("ctrl").property("ADBE Transform Group").property("ADBE Anchor Point"), inner, "Null anchor");
    inner = comp("Inner");
    add(inner.layer("pivot").property("ADBE Transform Group").property("ADBE Anchor Point"), inner, "Pivot anchor");

    // Mid: Inner nested; its instance's Essential Properties added to Mid's own controls.
    var mid = app.project.items.addComp("Mid", 640, 360, 1, 2, 30);
    mid.layers.add(comp("Inner")); mid.layer(1).name = "inner";
    mid = comp("Mid");
    var ov = mid.layer("inner").property("ADBE Layer Overrides");
    out.midOverrides = [];
    if (ov) {
        var n = ov.numProperties, names = [];
        for (var i = 1; i <= n; i++) names.push(ov.property(i).name);
        // AE 26: an instance's override property cannot be added to the parent's Essential Graphics
        // (canAddToMotionGraphicsTemplate = false, addToMotionGraphicsTemplateAs is a silent no-op).
        // What does work (and what AE's UI produces for a nested control): add the nested layer's own
        // property inside Inner directly to Mid's template.
        var src = { "Box position": ["box", "ADBE Position"], "Box scale": ["box", "ADBE Scale"], "Null anchor": ["ctrl", "ADBE Anchor Point"], "Pivot anchor": ["pivot", "ADBE Anchor Point"] };
        for (var j = 0; j < names.length; j++) {
            mid = comp("Mid");
            var p = mid.layer("inner").property("ADBE Layer Overrides").property(names[j]);
            out.midOverrides.push({ name: names[j], matchName: p.matchName, canAddOverrideToMid: p.canAddToMotionGraphicsTemplate(mid) });
            var sp = comp("Inner").layer(src[names[j]][0]).property("ADBE Transform Group").property(src[names[j]][1]);
            add(sp, comp("Mid"), "Mid " + names[j]);
        }
    } else err("Mid overrides", "missing");

    // Top: two instances of Mid, the second overriding every control.
    var top = app.project.items.addComp("Top", 640, 360, 1, 2, 30);
    top.layers.add(comp("Mid")); top.layer(1).name = "mid default";
    top.layers.add(comp("Mid")); top.layer(1).name = "mid overridden";
    app.project.save(File(here.fsName + "/essential_nested_plain.aep"));
    top = comp("Top");
    var tov = top.layer("mid overridden").property("ADBE Layer Overrides");
    var vals = { "Mid Box position": [100, 250], "Mid Box scale": [50, 150], "Mid Null anchor": [30, 40], "Mid Pivot anchor": [20, 10] };
    out.topOverrides = [];
    if (tov) {
        for (var k = 1; k <= tov.numProperties; k++) {
            var q = tov.property(k);
            out.topOverrides.push({ name: q.name, matchName: q.matchName });
            if (vals[q.name]) { try { q.setValue(q.value.length === 3 ? vals[q.name].concat([0]) : vals[q.name]); } catch (e) { err("set " + q.name, e); } }
        }
    } else err("Top overrides", "missing");
    // Inner's own instance in Mid also overrides Pivot anchor directly (a one-level override).
    mid = comp("Mid");
    try { var po = mid.layer("inner").property("ADBE Layer Overrides").property("Pivot anchor"); po.setValue([50, 25, 0]); } catch (e) { err("Mid pivot override", e); }
    var f = File(here.fsName + "/essential_nested.json");
    f.open("w"); f.write(out.toSource ? out.toSource() : String(out)); f.close();
    app.project.save(File(here.fsName + "/essential_nested.aep"));
})();
