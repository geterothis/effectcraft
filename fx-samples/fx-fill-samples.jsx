// EffectCraft samples for Fill without masks (Opacity and Invert), to settle how After Effects
// treats the layer's own pixels: does Opacity 0 leave the layer as it was, and does Invert keep
// the layer and fill only its transparent areas?
// Output (next to this script, folder "fx-fill-out"): fx-fill-01.aep, fx-fill-01.json (values as
// scripting reads them back, plus each comp's name and layer) and fx-fill-01-<n>.png (frame 0).
// Light: one project, 12 small comps (480x270), one frame each. Works only in a new project it
// creates and closes without touching your open project.
(function () {
    var W = 480, H = 270;
    // [layer, values by Fill parameter index]: 1 Fill Mask, 2 All Masks, 3 Color, 4 Invert,
    // 5 Horizontal Feather, 6 Vertical Feather, 7 Opacity (0..1 in scripting).
    var C = [0.2, 0.4, 0.6];
    var SAMPLES = [
        ["solid", { 3: C, 7: 1 }],
        ["solid", { 3: C, 7: 0.5 }],
        ["solid", { 3: C, 7: 0 }],
        ["solid", { 3: C, 4: 1, 7: 1 }],
        ["solid", { 3: C, 4: 1, 7: 0.5 }],
        ["solid", { 3: C, 2: 1, 4: 1, 7: 0 }],
        ["solid", { 3: C, 2: 1, 7: 1 }],
        ["ellipse", { 3: C, 7: 1 }],
        ["ellipse", { 3: C, 7: 0.5 }],
        ["ellipse", { 3: C, 7: 0 }],
        ["ellipse", { 3: C, 4: 1, 7: 1 }],
        ["ellipse", { 3: C, 4: 1, 7: 0.5 }]
    ];
    var outDir = new Folder(File($.fileName).parent.fsName + "/fx-fill-out");
    if (!outDir.exists) outDir.create();
    function q(s) { return '"' + String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/[\r\n\t]/g, " ") + '"'; }
    function js(v) {
        if (v === null || v === undefined) return "null";
        if (typeof v === "number") return isFinite(v) ? String(v) : "null";
        if (typeof v === "boolean") return v ? "true" : "false";
        if (typeof v === "string") return q(v);
        if (v instanceof Array) { var a = []; for (var i = 0; i < v.length; i++) a.push(js(v[i])); return "[" + a.join(", ") + "]"; }
        var o = []; for (var k in v) if (v.hasOwnProperty(k)) o.push(q(k) + ": " + js(v[k])); return "{" + o.join(", ") + "}";
    }
    app.beginSuppressDialogs();
    app.newProject();
    var manifest = [];
    for (var n = 0; n < SAMPLES.length; n++) {
        var kind = SAMPLES[n][0], vals = SAMPLES[n][1];
        var entry = { matchName: "ADBE Fill", comp: "fill-" + (n + 1), layer: kind, params: [] };
        try {
            var comp = app.project.items.addComp(entry.comp, W, H, 1, 2, 25);
            comp.bgColor = [0, 0, 0];
            var L;
            if (kind === "solid") {
                // A ramp over a red solid, as the fx-nondefault samples.
                L = comp.layers.addSolid([1, 0, 0], "L", W, H, 1);
                var G = L.property("ADBE Effect Parade").addProperty("ADBE Ramp");
                G.property(1).setValue([0, 0]); G.property(3).setValue([W, H]);
            } else {
                // An opaque orange ellipse on a transparent layer (no masks).
                L = comp.layers.addShape(); L.name = "L";
                var grp = L.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
                var e = grp.property("ADBE Vectors Group").addProperty("ADBE Vector Shape - Ellipse");
                e.property("ADBE Vector Ellipse Size").setValue([240, 160]);
                var fl = grp.property("ADBE Vectors Group").addProperty("ADBE Vector Graphic - Fill");
                fl.property("ADBE Vector Fill Color").setValue([1, 0.5, 0]);
                L.property("ADBE Transform Group").property("ADBE Position").setValue([W / 2, H / 2]);
            }
            var inst = L.property("ADBE Effect Parade").addProperty("ADBE Fill");
            for (var i = 1; i <= inst.numProperties; i++) {
                var p = inst.property(i);
                if (p.propertyType !== PropertyType.PROPERTY) continue;
                var r = { idx: String(i), matchName: p.matchName, name: p.name };
                if (vals[i] !== undefined) { try { p.setValue(vals[i]); r.set = vals[i]; } catch (e1) { r.error = String(e1); } }
                try { r.value = p.value; } catch (e2) {}
                entry.params.push(r);
            }
            var png = "fx-fill-01-" + (n + 1) + ".png";
            try { comp.saveFrameToPng(0, new File(outDir.fsName + "/" + png)); entry.png = png; } catch (er) { entry.renderError = String(er); }
        } catch (err) { entry.error = String(err); }
        manifest.push(entry);
    }
    app.project.save(new File(outDir.fsName + "/fx-fill-01.aep"));
    var f = new File(outDir.fsName + "/fx-fill-01.json");
    f.encoding = "UTF-8"; f.open("w"); f.write(js({ ae: app.version, effects: manifest })); f.close();
    app.project.close(CloseOptions.DO_NOT_SAVE_CHANGES);
    app.endSuppressDialogs(false);
})();
