// Builds lab/stroke-options: comps T1, T2, W1, W2, D1, D2, K1 (400x200, 30 fps, 1 s) with one shape layer each:
// path (50,100)->(350,100), white stroke 20 px, butt cap. Taper Length Units: 1 = Percent (Start/End Length),
// 2 = Pixels (StartWidthPx/EndWidthPx). Wave Units: 1 = Pixels (Wavelength), 2 = Cycles.
(function () {
    if (!app.project.file || app.project.file.name !== "stroke_options.aep") throw new Error("wrong project");
    var D = app.project.file.parent.fsName + "/";
    for (var p = app.project.numItems; p >= 1; p--) if (app.project.item(p).name === "probe") app.project.item(p).remove();
    if (app.project.numItems > 0) throw new Error("project not empty");
    var out = { ae: app.version, notes: ["Taper Length Units: 1 = Percent (ADBE Vector Taper Start/End Length), 2 = Pixels (ADBE Vector Taper StartWidthPx/EndWidthPx; the inactive pair is hidden and refuses setValue).",
        "Wave Units: 1 = Pixels (Wavelength), 2 = Cycles (Cycles).", "Line Cap 1 = Butt."], comps: {} };
    function comp(n) { for (var i = 1; i <= app.project.numItems; i++) { var it = app.project.item(i); if (it instanceof CompItem && it.name === n) return it; } return null; }
    function S(n) { return comp(n).layer("stroke").property("ADBE Root Vectors Group").property("Line").property("ADBE Vectors Group").property("ADBE Vector Graphic - Stroke"); }
    function setp(n, grp, mn, v) { S(n).property(grp).property(mn).setValue(v); }
    function build(n) {
        app.project.items.addComp(n, 400, 200, 1, 1, 30);
        var L = comp(n).layers.addShape(); L.name = "stroke";
        var g = comp(n).layer("stroke").property("ADBE Root Vectors Group").addProperty("ADBE Vector Group"); g.name = "Line";
        var cs = comp(n).layer("stroke").property("ADBE Root Vectors Group").property("Line").property("ADBE Vectors Group");
        cs.addProperty("ADBE Vector Shape - Group");
        cs = comp(n).layer("stroke").property("ADBE Root Vectors Group").property("Line").property("ADBE Vectors Group");
        cs.addProperty("ADBE Vector Graphic - Stroke");
        var sh = new Shape(); sh.vertices = [[50, 100], [350, 100]]; sh.inTangents = [[0, 0], [0, 0]]; sh.outTangents = [[0, 0], [0, 0]]; sh.closed = false;
        comp(n).layer("stroke").property("ADBE Root Vectors Group").property("Line").property("ADBE Vectors Group").property("ADBE Vector Shape - Group").property("ADBE Vector Shape").setValue(sh);
        S(n).property("ADBE Vector Stroke Color").setValue([1, 1, 1, 1]);
        S(n).property("ADBE Vector Stroke Width").setValue(20);
        S(n).property("ADBE Vector Stroke Line Cap").setValue(1);
        comp(n).layer("stroke").property("ADBE Transform Group").property("ADBE Anchor Point").setValue([0, 0]);
        comp(n).layer("stroke").property("ADBE Transform Group").property("ADBE Position").setValue([0, 0]);
    }
    var TP = "ADBE Vector Stroke Taper", WV = "ADBE Vector Stroke Wave", DS = "ADBE Vector Stroke Dashes";
    function taperT1(n) {
        setp(n, TP, "ADBE Vector Taper Length Units", 1);
        setp(n, TP, "ADBE Vector Taper Start Length", 30); setp(n, TP, "ADBE Vector Taper End Length", 20);
        setp(n, TP, "ADBE Vector Taper Start Width", 0); setp(n, TP, "ADBE Vector Taper End Width", 50);
        setp(n, TP, "ADBE Vector Taper Start Ease", 25); setp(n, TP, "ADBE Vector Taper End Ease", 40);
    }
    build("T1"); taperT1("T1");
    build("T2");
    setp("T2", TP, "ADBE Vector Taper Length Units", 2);
    setp("T2", TP, "ADBE Vector Taper StartWidthPx", 60); setp("T2", TP, "ADBE Vector Taper EndWidthPx", 90);
    setp("T2", TP, "ADBE Vector Taper Start Width", 10); setp("T2", TP, "ADBE Vector Taper End Width", 0);
    setp("T2", TP, "ADBE Vector Taper Start Ease", 0); setp("T2", TP, "ADBE Vector Taper End Ease", 0);
    build("W1");
    setp("W1", WV, "ADBE Vector Taper Wave Amount", 40); setp("W1", WV, "ADBE Vector Taper Wave Units", 2);
    setp("W1", WV, "ADBE Vector Taper Wave Cycles", 5); setp("W1", WV, "ADBE Vector Taper Wave Phase", 30);
    build("W2");
    setp("W2", WV, "ADBE Vector Taper Wave Amount", 60); setp("W2", WV, "ADBE Vector Taper Wave Units", 1);
    setp("W2", WV, "ADBE Vector Taper Wavelength", 50); setp("W2", WV, "ADBE Vector Taper Wave Phase", 0);
    build("D1");
    S("D1").property(DS).addProperty("ADBE Vector Stroke Dash 1"); S("D1").property(DS).addProperty("ADBE Vector Stroke Gap 1"); S("D1").property(DS).addProperty("ADBE Vector Stroke Offset");
    setp("D1", DS, "ADBE Vector Stroke Dash 1", 30); setp("D1", DS, "ADBE Vector Stroke Gap 1", 20); setp("D1", DS, "ADBE Vector Stroke Offset", 10);
    build("D2");
    var dm = ["ADBE Vector Stroke Dash 1", "ADBE Vector Stroke Gap 1", "ADBE Vector Stroke Dash 2", "ADBE Vector Stroke Gap 2", "ADBE Vector Stroke Offset"];
    for (var a = 0; a < dm.length; a++) S("D2").property(DS).addProperty(dm[a]);
    setp("D2", DS, "ADBE Vector Stroke Dash 1", 30); setp("D2", DS, "ADBE Vector Stroke Gap 1", 10);
    setp("D2", DS, "ADBE Vector Stroke Dash 2", 15); setp("D2", DS, "ADBE Vector Stroke Gap 2", 5); setp("D2", DS, "ADBE Vector Stroke Offset", 0);
    build("K1"); taperT1("K1");
    var kp = S("K1").property(TP).property("ADBE Vector Taper Start Length");
    kp.setValueAtTime(0, 0); kp = S("K1").property(TP).property("ADBE Vector Taper Start Length"); kp.setValueAtTime(1, 50);
    kp = S("K1").property(TP).property("ADBE Vector Taper Start Length");
    for (var k = 1; k <= kp.numKeys; k++) kp.setInterpolationTypeAtKey(k, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);
    function dump(p) {
        var r = [];
        for (var i = 1; i <= p.numProperties; i++) {
            var q = p.property(i), e = { matchName: q.matchName, name: q.name };
            if (q.propertyType === PropertyType.PROPERTY) {
                try { e.value = q.value; } catch (x) { e.value = null; }
                e.numKeys = q.numKeys;
                if (q.numKeys) { e.keys = []; for (var k2 = 1; k2 <= q.numKeys; k2++) e.keys.push({ t: q.keyTime(k2), v: q.keyValue(k2), inInterp: q.keyInInterpolationType(k2), outInterp: q.keyOutInterpolationType(k2) }); e.valueAt0_5 = q.valueAtTime(0.5, false); }
            } else e.children = dump(q);
            r.push(e);
        }
        return r;
    }
    var names = ["T1", "T2", "W1", "W2", "D1", "D2", "K1"];
    for (var j = 0; j < names.length; j++) out.comps[names[j]] = { id: comp(names[j]).id, stroke: dump(S(names[j])) };
    app.project.save();
    var f = new File(D + "stroke_options.json"); f.encoding = "UTF-8"; f.open("w"); f.write(JSON.stringify(out, null, 1)); f.close();
    var ids = []; for (var m = 0; m < names.length; m++) ids.push([names[m], out.comps[names[m]].id]);
    return ids;
})();
