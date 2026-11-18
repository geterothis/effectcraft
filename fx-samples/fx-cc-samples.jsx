// EffectCraft .aep samples for six CC effects, with settings EffectCraft's effects support (the
// generic fx-nondefault samples used options EffectCraft lacks: Kaleida's Can Meas and Floating
// Center, RepeTile's Blend Borders, Slant's Set Color, Ripple Pulse's bump map) and Effect Opacity
// left at 100 %.
// Output (next to this script, folder "fx-cc-out"): fx-cc-01.aep, fx-cc-01.json (the values as
// scripting reads them back, same format as fx-nondefault-NN.json) and fx-cc-01-<n>.png (frame 0).
// Safe: works only in a new project it creates and closes without touching your open project.
(function () {
    var W = 1920, H = 1080;
    // matchName -> values by parameter index (1-based, as effect.property(i)).
    var SAMPLES = [
        ["CC Slant", { 1: 30, 2: 0, 3: 80, 4: [960, 900], 5: 0 }],
        ["CC Lens", { 1: [960, 540], 2: 60, 3: 50 }],
        ["CC Kaleida", { 1: [960, 540], 2: 30, 3: 1, 4: 20, 5: 0 }],
        ["CC Griddler", { 1: 80, 2: 60, 3: 15, 4: 10, 5: 1 }],
        ["CC RepeTile", { 1: 200, 2: 200, 3: 200, 4: 200, 5: 4, 6: 0 }],
        ["CC Ripple Pulse", { 1: [960, 540], 2: 100, 3: 1, 4: 200, 5: 0 }]
    ];
    var outDir = new Folder(File($.fileName).parent.fsName + "/fx-cc-out");
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
        var mn = SAMPLES[n][0], vals = SAMPLES[n][1];
        var entry = { matchName: mn, params: [] };
        try {
            var comp = app.project.items.addComp("fx|" + mn, W, H, 1, 2, 25);
            var L = comp.layers.addSolid([1, 0, 0], "L", W, H, 1);
            // The same test pattern as the fx-nondefault samples: a ramp over the red solid.
            var G = L.property("ADBE Effect Parade").addProperty("ADBE Ramp");
            G.property(1).setValue([0, 0]); G.property(3).setValue([W, H]);
            var inst = L.property("ADBE Effect Parade").addProperty(mn);
            entry.displayName = inst.name;
            for (var i = 1; i <= inst.numProperties; i++) {
                var p = inst.property(i);
                if (p.propertyType !== PropertyType.PROPERTY) continue;
                var r = { idx: String(i), matchName: p.matchName, name: p.name };
                try { r["default"] = p.value; } catch (e0) {}
                if (vals[i] !== undefined) { try { p.setValue(vals[i]); r.set = vals[i]; } catch (e1) { r.error = String(e1); } }
                try { r.value = p.value; } catch (e2) {}
                entry.params.push(r);
            }
            var png = "fx-cc-01-" + (n + 1) + ".png";
            try { comp.saveFrameToPng(0, new File(outDir.fsName + "/" + png)); entry.png = png; } catch (er) { entry.renderError = String(er); }
        } catch (err) { entry.error = String(err); }
        manifest.push(entry);
    }
    app.project.save(new File(outDir.fsName + "/fx-cc-01.aep"));
    var f = new File(outDir.fsName + "/fx-cc-01.json");
    f.encoding = "UTF-8"; f.open("w"); f.write(js({ ae: app.version, effects: manifest })); f.close();
    app.project.close(CloseOptions.DO_NOT_SAVE_CHANGES);
    app.endSuppressDialogs(false);
})();
