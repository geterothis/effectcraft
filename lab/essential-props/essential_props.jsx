// Builds essential_props.aep (Essential Graphics controls and Essential Properties overrides) and
// essential_props_plain.aep (the same without overrides). Run in a new empty project.
(function () {
    var here = File($.fileName).parent;
    var out = { errors: [] };
    function err(where, e) { out.errors.push(where + ": " + String(e)); }

    var M = app.project.items.addComp("M", 640, 360, 1, 2, 30);
    var bg = M.layers.addSolid([0.2, 0.2, 0.2], "bg", 640, 360, 1);
    var fill = bg.property("ADBE Effect Parade").addProperty("ADBE Fill");
    fill.property("ADBE Fill-0002").setValue([0.1, 0.3, 0.8, 1]);
    var txt = M.layers.addText("Hello");
    txt.name = "title";
    var box = M.layers.addSolid([1, 0.8, 0.1], "box", 100, 100, 1);
    var ctl = box.property("ADBE Effect Parade").addProperty("ADBE Checkbox Control");
    ctl.name = "Show";
    ctl.property(1).setValue(1);
    box.property("ADBE Transform Group").property("ADBE Opacity").expression = 'effect("Show")(1) == 1 ? 100 : 0';
    var sl = box.property("ADBE Effect Parade").addProperty("ADBE Slider Control");
    sl.name = "Size";
    sl.property(1).setValue(100);
    box.property("ADBE Transform Group").property("ADBE Scale").expression = 'var s = effect("Size")(1); [s, s]';

    M.motionGraphicsTemplateName = "Lab template";
    var controls = [
        [fill.property("ADBE Fill-0002"), "Background"],
        [txt.property("ADBE Text Properties").property("ADBE Text Document"), "Title"],
        [ctl.property(1), "Show box"],
        [sl.property(1), "Box size"],
        [box.property("ADBE Transform Group").property("ADBE Position"), "Box position"]
    ];
    for (var i = 0; i < controls.length; i++) {
        try { controls[i][0].addToMotionGraphicsTemplateAs(M, controls[i][1]); }
        catch (e) { try { controls[i][0].addToMotionGraphicsTemplate(M); } catch (e2) { err("add " + controls[i][1], e2); } }
    }

    var R = app.project.items.addComp("R", 640, 360, 1, 2, 30);
    var a = R.layers.add(M); a.name = "instance default";
    var b = R.layers.add(M); b.name = "instance overridden";
    b.property("ADBE Transform Group").property("ADBE Position").setValue([320, 280]);
    a.property("ADBE Transform Group").property("ADBE Position").setValue([320, 80]);
    app.project.save(File(here.fsName + "/essential_props_plain.aep"));

    var ov = b.property("ADBE Layer Overrides");
    out.overrides = [];
    if (!ov) { err("overrides group", "missing"); }
    else {
        for (var j = 1; j <= ov.numProperties; j++) {
            var p = ov.property(j);
            out.overrides.push({ index: j, name: p.name, matchName: p.matchName, value: (function () { try { return p.value; } catch (e) { return null; } })() });
        }
        try { ov.property("Background").setValue([0.9, 0.1, 0.1, 1]); } catch (e) { err("set Background", e); }
        try { var td = ov.property("Title").value; td.text = "Overridden"; ov.property("Title").setValue(td); } catch (e) { err("set Title", e); }
        try { ov.property("Show box").setValue(0); } catch (e) { err("set Show box", e); }
        try { var s = ov.property("Box size"); s.setValueAtTime(0, 50); s.setValueAtTime(1, 150); } catch (e) { err("key Box size", e); }
        try { ov.property("Box position").setValue([100, 100]); } catch (e) { err("set Box position", e); }
        out.after = [];
        for (var k = 1; k <= ov.numProperties; k++) {
            var q = ov.property(k);
            out.after.push({ name: q.name, matchName: q.matchName, numKeys: q.numKeys, value: (function () { try { var v = q.value; return v && v.text !== undefined ? v.text : v; } catch (e) { return null; } })() });
        }
    }
    var f = File(here.fsName + "/essential_props.json");
    f.open("w"); f.write(out.toSource ? out.toSource() : String(out)); f.close();
    app.project.save(File(here.fsName + "/essential_props.aep"));
})();
