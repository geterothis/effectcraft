// Builds lab/stroke-wave: 18 comps 500x200, 30 fps, 1 s; shape line (50,100)->(450,100), stroke 40, butt cap, Wave on.
// Wave Units: 1 = Pixels (Wavelength), 2 = Cycles (Cycles).
(function () {
    if (!app.project.file || app.project.file.name !== "stroke_wave.aep" || app.project.numItems > 0) throw new Error("wrong project");
    var D = app.project.file.parent.fsName + "/";
    var out = { ae: app.version, notes: ["Line (50,100)->(450,100) in a 500x200 comp, white stroke 40 px, Line Cap 1 = Butt, no taper.", "Wave Units: 1 = Pixels (Wavelength 100), 2 = Cycles (Cycles 4)."], comps: [] };
    function comp(n) { for (var i = 1; i <= app.project.numItems; i++) { var it = app.project.item(i); if (it instanceof CompItem && it.name === n) return it; } return null; }
    function S(n) { return comp(n).layer("stroke").property("ADBE Root Vectors Group").property("Line").property("ADBE Vectors Group").property("ADBE Vector Graphic - Stroke"); }
    var units = [[1, "px100"], [2, "cyc4"]], phases = [0, 90, 180], amounts = [25, 50, 100];
    for (var u = 0; u < units.length; u++) for (var p = 0; p < phases.length; p++) for (var a = 0; a < amounts.length; a++) {
        var n = units[u][1] + "_ph" + phases[p] + "_amt" + amounts[a];
        app.project.items.addComp(n, 500, 200, 1, 1, 30);
        var L = comp(n).layers.addShape(); L.name = "stroke";
        var g = comp(n).layer("stroke").property("ADBE Root Vectors Group").addProperty("ADBE Vector Group"); g.name = "Line";
        comp(n).layer("stroke").property("ADBE Root Vectors Group").property("Line").property("ADBE Vectors Group").addProperty("ADBE Vector Shape - Group");
        comp(n).layer("stroke").property("ADBE Root Vectors Group").property("Line").property("ADBE Vectors Group").addProperty("ADBE Vector Graphic - Stroke");
        var sh = new Shape(); sh.vertices = [[50, 100], [450, 100]]; sh.inTangents = [[0, 0], [0, 0]]; sh.outTangents = [[0, 0], [0, 0]]; sh.closed = false;
        comp(n).layer("stroke").property("ADBE Root Vectors Group").property("Line").property("ADBE Vectors Group").property("ADBE Vector Shape - Group").property("ADBE Vector Shape").setValue(sh);
        comp(n).layer("stroke").property("ADBE Transform Group").property("ADBE Anchor Point").setValue([0, 0]);
        comp(n).layer("stroke").property("ADBE Transform Group").property("ADBE Position").setValue([0, 0]);
        S(n).property("ADBE Vector Stroke Color").setValue([1, 1, 1, 1]);
        S(n).property("ADBE Vector Stroke Width").setValue(40);
        S(n).property("ADBE Vector Stroke Line Cap").setValue(1);
        var W = function () { return S(n).property("ADBE Vector Stroke Wave"); };
        W().property("ADBE Vector Taper Wave Amount").setValue(amounts[a]);
        W().property("ADBE Vector Taper Wave Units").setValue(units[u][0]);
        if (units[u][0] === 1) W().property("ADBE Vector Taper Wavelength").setValue(100); else W().property("ADBE Vector Taper Wave Cycles").setValue(4);
        W().property("ADBE Vector Taper Wave Phase").setValue(phases[p]);
        var prm = {}; for (var j = 1; j <= W().numProperties; j++) { var q = W().property(j); prm[q.matchName] = { name: q.name, value: q.value }; }
        out.comps.push({ comp: n, id: comp(n).id, strokeWidth: 40, lineCap: 1, wave: prm, frame: n + "_f0.png" });
    }
    app.project.save();
    var f = new File(D + "stroke_wave.json"); f.encoding = "UTF-8"; f.open("w"); f.write(JSON.stringify(out, null, 1)); f.close();
    var ids = []; for (var k = 0; k < out.comps.length; k++) ids.push(out.comps[k].id);
    return ids;
})();
