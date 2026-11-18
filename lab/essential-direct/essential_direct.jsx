// Builds essential_direct.aep: a template whose controls drive layers inside nested
// precompositions directly (CCId = the nested composition), with no controls of their own in
// those precompositions and no override group on their instances. Run in a new empty project;
// writes next to this script. Re-fetches objects by name after each change.
(function () {
    var here = File($.fileName).parent;
    var out = { errors: [], added: [] };
    function err(w, e) { out.errors.push(w + ": " + String(e)); }
    function comp(name) { for (var i = 1; i <= app.project.numItems; i++) { var it = app.project.item(i); if (it instanceof CompItem && it.name === name) return it; } return null; }
    function tr(c, l, m) { return comp(c).layer(l).property("ADBE Transform Group").property(m); }
    function add(c, l, m, name) {
        try { var ok = tr(c, l, m).addToMotionGraphicsTemplateAs(comp("Mid"), name); out.added.push({ name: name, ok: ok }); }
        catch (e) { err("add " + name, e); }
    }

    // Deep: a dot two levels down. Inner: a box and Deep nested. Mid: Inner nested and its own bar.
    var deep = app.project.items.addComp("Deep", 640, 360, 1, 2, 30);
    deep.layers.addSolid([0.2, 0.4, 0.9], "dot", 60, 60, 1);
    var inner = app.project.items.addComp("Inner", 640, 360, 1, 2, 30);
    inner.layers.add(comp("Deep")); inner.layer(1).name = "deep";
    comp("Inner").layers.addSolid([0.9, 0.3, 0.1], "box", 120, 80, 1);
    var mid = app.project.items.addComp("Mid", 640, 360, 1, 2, 30);
    mid.layers.add(comp("Inner")); mid.layer(1).name = "inner";
    comp("Mid").layers.addSolid([0.1, 0.7, 0.3], "bar", 300, 40, 1);

    // The first two controls, then an early instance of Mid, then the rest.
    add("Inner", "box", "ADBE Position", "Box position");
    add("Mid", "bar", "ADBE Opacity", "Bar opacity");
    var top = app.project.items.addComp("Top", 640, 360, 1, 2, 30);
    top.layers.add(comp("Mid")); top.layer(1).name = "mid early";
    add("Inner", "box", "ADBE Scale", "Box scale");
    add("Deep", "dot", "ADBE Position", "Dot position");
    add("Deep", "dot", "ADBE Anchor Point", "Dot anchor");
    comp("Top").layers.add(comp("Mid")); comp("Top").layer(1).name = "mid default";
    comp("Top").layers.add(comp("Mid")); comp("Top").layer(1).name = "mid overridden";
    out.innerHasOverrides = !!comp("Mid").layer("inner").property("ADBE Layer Overrides") && comp("Mid").layer("inner").property("ADBE Layer Overrides").numProperties;
    app.project.save(File(here.fsName + "/essential_direct_plain.aep"));

    var vals = { "Box position": [100, 250], "Bar opacity": 30, "Box scale": [50, 150], "Dot position": [500, 80], "Dot anchor": [10, 20] };
    function setAll(layerName, only) {
        var ov = comp("Top").layer(layerName).property("ADBE Layer Overrides");
        var seen = [];
        if (!ov) { err(layerName, "no overrides"); return seen; }
        for (var k = 1; k <= ov.numProperties; k++) {
            var q = ov.property(k); seen.push(q.name);
            if (vals[q.name] !== undefined && (!only || only === q.name)) {
                try { var v = vals[q.name]; q.setValue(v.length === 2 && q.value.length === 3 ? v.concat([0]) : v); } catch (e) { err("set " + layerName + " " + q.name, e); }
            }
        }
        return seen;
    }
    out.overridden = setAll("mid overridden");
    out.early = setAll("mid early", "Dot position");
    out.defaults = setAll("mid default", "nothing");
    var f = File(here.fsName + "/essential_direct.json");
    f.open("w"); f.write(out.toSource ? out.toSource() : String(out)); f.close();
    app.project.save(File(here.fsName + "/essential_direct.aep"));
})();
