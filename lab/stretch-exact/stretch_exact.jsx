// Builds lab/stretch-exact: inner "cut" (RED 0..0.5, GREEN 0.5..3, 30 fps) and outer comps with stretched precomp layers.
(function () {
    if (!app.project.file || app.project.file.name !== "stretch_exact.aep" || app.project.numItems > 0) throw new Error("wrong project");
    var D = app.project.file.parent.fsName + "/";
    function comp(n) { for (var i = 1; i <= app.project.numItems; i++) { var it = app.project.item(i); if (it instanceof CompItem && it.name === n) return it; } return null; }
    app.project.items.addComp("cut", 100, 100, 1, 3, 30);
    var g = comp("cut").layers.addSolid([0, 1, 0], "GREEN", 100, 100, 1); g.name = "GREEN";
    var r = comp("cut").layers.addSolid([1, 0, 0], "RED", 100, 100, 1); r.name = "RED";
    comp("cut").layer("RED").inPoint = 0; comp("cut").layer("RED").outPoint = 0.5;
    comp("cut").layer("GREEN").inPoint = 0.5; comp("cut").layer("GREEN").outPoint = 3;
    var out = { ae: app.version, inner: { RED: [comp("cut").layer("RED").inPoint, comp("cut").layer("RED").outPoint], GREEN: [comp("cut").layer("GREEN").inPoint, comp("cut").layer("GREEN").outPoint] }, outer: [] };
    var V = [["S1_500over3", 500 / 3, [24, 25, 26]], ["S2_460over3", 460 / 3, [22, 23, 24]], ["S3_1000over3", 1000 / 3, [49, 50, 51]], ["S0_100_reference", 100, [14, 15, 16]]];
    for (var i = 0; i < V.length; i++) {
        var n = V[i][0];
        app.project.items.addComp(n, 100, 100, 1, 3, 30);
        var L = comp(n).layers.add(comp("cut")); L.name = "cut"; L.startTime = 0;
        comp(n).layer("cut").stretch = V[i][1];
        var l = comp(n).layer("cut"), fr = [];
        for (var k = 0; k < V[i][2].length; k++) { var f = V[i][2][k]; fr.push({ frame: f, t: f / 30, sourceTime_computed: (f / 30 - l.startTime) * 100 / l.stretch }); }
        out.outer.push({ comp: n, id: comp(n).id, layerId: l.id, stretchSet: V[i][1], stretchRead: l.stretch, inPoint: l.inPoint, outPoint: l.outPoint, frames: fr });
    }
    app.project.save();
    var fo = new File(D + "stretch_exact.json"); fo.encoding = "UTF-8"; fo.open("w"); fo.write(JSON.stringify(out, null, 1)); fo.close();
    return out;
})();
