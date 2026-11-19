// Builds lab/remap-epsilon2. Inner comps: RED (0..cut) over GREEN (cut..2). Outer comps 30 fps: Time Remap 0->0, 1/30->V, 1->1
// (linear), or (D) a stretched precomp layer without Time Remap.
(function () {
    if (!app.project.file || app.project.file.name !== "remap_epsilon2.aep" || app.project.numItems > 0) throw new Error("wrong project");
    var D = app.project.file.parent.fsName + "/";
    var out = { ae: app.version, inner: {}, outer: [] };
    function comp(n) { for (var i = 1; i <= app.project.numItems; i++) { var it = app.project.item(i); if (it instanceof CompItem && it.name === n) return it; } return null; }
    function inner(name, fps, cut) {
        app.project.items.addComp(name, 1920, 1080, 1, 2, fps);
        var g = comp(name).layers.addSolid([0, 1, 0], "GREEN", 1920, 1080, 1); g.name = "GREEN";
        var r = comp(name).layers.addSolid([1, 0, 0], "RED", 1920, 1080, 1); r.name = "RED";
        comp(name).layer("RED").inPoint = 0; comp(name).layer("RED").outPoint = cut;
        comp(name).layer("GREEN").inPoint = cut; comp(name).layer("GREEN").outPoint = 2;
        out.inner[name] = { fps: fps, cutSet: cut, RED: [comp(name).layer("RED").inPoint, comp(name).layer("RED").outPoint], GREEN: [comp(name).layer("GREEN").inPoint, comp(name).layer("GREEN").outPoint] };
        return comp(name).layer("RED").outPoint;
    }
    inner("cut30_024", 30, 0.24);
    inner("cut60_025", 60, 0.25);
    inner("cut24_025", 24, 0.25);
    var offCut = inner("cut30_off2551", 30, 0.2551);
    function outerTR(n, src, V, group) {
        app.project.items.addComp(n, 1920, 1080, 1, 2, 30);
        var L = comp(n).layers.add(comp(src)); L.name = src; L.startTime = 0;
        comp(n).layer(src).timeRemapEnabled = true;
        var tr = comp(n).layer(src).property("ADBE Time Remapping");
        tr.setValueAtTime(0, 0); tr.setValueAtTime(1 / 30, V); tr.setValueAtTime(1, 1);
        tr = comp(n).layer(src).property("ADBE Time Remapping");
        for (var kk = tr.numKeys; kk >= 1; kk--) { var kt = tr.keyTime(kk); if (Math.abs(kt) > 1e-6 && Math.abs(kt - 1 / 30) > 1e-6 && Math.abs(kt - 1) > 1e-6) { tr.removeKey(kk); tr = comp(n).layer(src).property("ADBE Time Remapping"); } }
        for (var k = 1; k <= tr.numKeys; k++) tr.setInterpolationTypeAtKey(k, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);
        tr = comp(n).layer(src).property("ADBE Time Remapping");
        out.outer.push({ group: group, comp: n, id: comp(n).id, inner: src, Vset: V, VreadAt1f: tr.valueAtTime(1 / 30, false), frame: n + "_f1.png" });
    }
    var A = [0.23998, 0.23996, 0.23995, 0.23994, 0.23992, 0.23990];
    for (var a = 0; a < A.length; a++) outerTR("A30_V" + A[a], "cut30_024", A[a], "A");
    var B = [0.2499, 0.24995, 0.24998, 0.24999];
    for (var b = 0; b < B.length; b++) { outerTR("B60_V" + B[b], "cut60_025", B[b], "B"); outerTR("B24_V" + B[b], "cut24_025", B[b], "B"); }
    outerTR("C_off_cut-1e-5", "cut30_off2551", offCut - 1e-5, "C");
    outerTR("C_off_cut-5e-5", "cut30_off2551", offCut - 5e-5, "C");
    // D: stretch instead of Time Remap
    var dn = "D_stretch_0.23999";
    app.project.items.addComp(dn, 1920, 1080, 1, 2, 30);
    var DL = comp(dn).layers.add(comp("cut30_024")); DL.name = "cut30_024"; DL.startTime = 0;
    comp(dn).layer("cut30_024").stretch = 100 * (1 / 30) / 0.23999;
    var dl = comp(dn).layer("cut30_024");
    out.outer.push({ group: "D", comp: dn, id: comp(dn).id, inner: "cut30_024", stretchSet: 100 * (1 / 30) / 0.23999, stretchRead: dl.stretch,
        sourceTimeAt1f_computed: (1 / 30 - dl.startTime) * 100 / dl.stretch, frame: dn + "_f1.png" });
    app.project.save();
    var f = new File(D + "remap_epsilon2.json"); f.encoding = "UTF-8"; f.open("w"); f.write(JSON.stringify(out, null, 1)); f.close();
    var r = []; for (var j = 0; j < out.outer.length; j++) r.push([out.outer[j].comp, out.outer[j].id]);
    return { inner: out.inner, outer: r };
})();
