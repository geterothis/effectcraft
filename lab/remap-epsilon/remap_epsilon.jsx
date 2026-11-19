// Builds lab/remap-epsilon: inner comps "cut" (RED 0..0.24, GREEN 0.24..2) and "cut_offgrid" (RED 0..0.25, GREEN 0.25..2),
// outer comps with Time Remap keys 0->0, 1/30->V, 1->1 (linear).
(function () {
    if (!app.project.file || app.project.file.name !== "remap_epsilon.aep" || app.project.numItems > 0) throw new Error("wrong project");
    var D = app.project.file.parent.fsName + "/";
    var out = { ae: app.version, inner: {}, outer: [] };
    function comp(n) { for (var i = 1; i <= app.project.numItems; i++) { var it = app.project.item(i); if (it instanceof CompItem && it.name === n) return it; } return null; }
    function inner(name, cut) {
        app.project.items.addComp(name, 1920, 1080, 1, 2, 30);
        var g = comp(name).layers.addSolid([0, 1, 0], "GREEN", 1920, 1080, 1); g.name = "GREEN";
        var r = comp(name).layers.addSolid([1, 0, 0], "RED", 1920, 1080, 1); r.name = "RED";
        comp(name).layer("RED").inPoint = 0; comp(name).layer("RED").outPoint = cut;
        comp(name).layer("GREEN").inPoint = cut; comp(name).layer("GREEN").outPoint = 2;
        out.inner[name] = { RED: [comp(name).layer("RED").inPoint, comp(name).layer("RED").outPoint], GREEN: [comp(name).layer("GREEN").inPoint, comp(name).layer("GREEN").outPoint] };
    }
    inner("cut", 0.24);
    inner("cut_offgrid", 0.25);
    var V = [["V_0.23999999463558197", 0.23999999463558197, "cut"], ["V_0.2399999", 0.2399999, "cut"], ["V_0.239999", 0.239999, "cut"],
             ["V_0.23999", 0.23999, "cut"], ["V_0.2399", 0.2399, "cut"], ["V_0.24", 0.24, "cut"], ["V_0.2400001", 0.2400001, "cut"],
             ["X_offgrid_V_0.2483", 0.2333 + 0.5 / 30 * 0.9, "cut_offgrid"]];
    for (var i = 0; i < V.length; i++) {
        var n = V[i][0];
        app.project.items.addComp(n, 1920, 1080, 1, 2, 30);
        var L = comp(n).layers.add(comp(V[i][2])); L.name = V[i][2]; L.startTime = 0;
        comp(n).layer(V[i][2]).timeRemapEnabled = true;
        var tr = comp(n).layer(V[i][2]).property("ADBE Time Remapping");
        tr.setValueAtTime(0, 0); tr.setValueAtTime(1 / 30, V[i][1]); tr.setValueAtTime(1, 1);
        tr = comp(n).layer(V[i][2]).property("ADBE Time Remapping");
        for (var kk = tr.numKeys; kk >= 1; kk--) { var kt = tr.keyTime(kk); if (Math.abs(kt) > 1e-6 && Math.abs(kt - 1 / 30) > 1e-6 && Math.abs(kt - 1) > 1e-6) { tr.removeKey(kk); tr = comp(n).layer(V[i][2]).property("ADBE Time Remapping"); } }
        tr = comp(n).layer(V[i][2]).property("ADBE Time Remapping");
        for (var k = 1; k <= tr.numKeys; k++) tr.setInterpolationTypeAtKey(k, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);
        tr = comp(n).layer(V[i][2]).property("ADBE Time Remapping");
        var keys = []; for (var k2 = 1; k2 <= tr.numKeys; k2++) keys.push({ t: tr.keyTime(k2), v: tr.keyValue(k2) });
        out.outer.push({ comp: n, id: comp(n).id, inner: V[i][2], Vset: V[i][1], VreadAt1f: tr.valueAtTime(1 / 30, false), keys: keys, frame: n + "_f1.png" });
    }
    app.project.save();
    var f = new File(D + "remap_epsilon.json"); f.encoding = "UTF-8"; f.open("w"); f.write(JSON.stringify(out, null, 1)); f.close();
    var r = []; for (var j = 0; j < out.outer.length; j++) r.push([out.outer[j].comp, out.outer[j].id, out.outer[j].VreadAt1f]);
    return { inner: out.inner, outer: r };
})();
