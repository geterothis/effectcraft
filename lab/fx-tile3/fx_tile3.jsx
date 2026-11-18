// Builds lab/fx-tile3: comps P1-P5, Motion Tile phase / mirror / horizontal phase shift / tile center variants.
(function () {
    if (!app.project.file || app.project.file.name !== "fx_tile3.aep" || app.project.numItems > 0) throw new Error("wrong project");
    var D = app.project.file.parent.fsName + "/";
    var out = { ae: app.version, errors: [], source: "solid 320x180 + 4-Color Gradient, layer scale 15%", comps: {} };
    function comp(n) { for (var i = 1; i <= app.project.numItems; i++) { var it = app.project.item(i); if (it instanceof CompItem && it.name === n) return it; } return null; }
    function fx(c, m) { return comp(c).layer("src").property("ADBE Effect Parade").property(m); }
    function setP(c, m, p, v) { try { fx(c, m).property(p).setValue(v); } catch (e) { out.errors.push(String(c) + " " + String(p) + ": " + String(e)); } }
    var V = [["P1", 30, 0, 0, null], ["P2", 30, 0, 1, null], ["P3", 270, 0, 0, null], ["P4", 30, 1, 1, null], ["P5", 30, 0, 0, [100, 60]]];
    for (var i = 0; i < V.length; i++) {
        var n = V[i][0];
        var c = app.project.items.addComp(n, 320, 180, 1, 1, 25);
        var L = c.layers.addSolid([0.5, 0.5, 0.5], "src", 320, 180, 1); L.name = "src";
        comp(n).layer("src").property("ADBE Effect Parade").addProperty("ADBE 4ColorGradient");
        setP(n, "ADBE 4ColorGradient", "ADBE 4ColorGradient-0002", [1, 0.9, 0.1]);
        setP(n, "ADBE 4ColorGradient", "ADBE 4ColorGradient-0004", [0.1, 0.8, 0.2]);
        setP(n, "ADBE 4ColorGradient", "ADBE 4ColorGradient-0006", [0.9, 0.1, 0.6]);
        setP(n, "ADBE 4ColorGradient", "ADBE 4ColorGradient-0008", [0.1, 0.3, 1]);
        comp(n).layer("src").property("ADBE Effect Parade").addProperty("ADBE Tile");
        setP(n, "ADBE Tile", "ADBE Tile-0002", 50);
        setP(n, "ADBE Tile", "ADBE Tile-0003", 50);
        setP(n, "ADBE Tile", "ADBE Tile-0004", 550);
        setP(n, "ADBE Tile", "ADBE Tile-0005", 550);
        setP(n, "ADBE Tile", "ADBE Tile-0006", V[i][2]);
        setP(n, "ADBE Tile", "ADBE Tile-0007", V[i][1]);
        setP(n, "ADBE Tile", "ADBE Tile-0008", V[i][3]);
        if (V[i][4]) setP(n, "ADBE Tile", "ADBE Tile-0001", V[i][4]);
        comp(n).layer("src").property("ADBE Transform Group").property("ADBE Scale").setValue([15, 15]);
        var T = fx(n, "ADBE Tile"), prm = {};
        for (var j = 1; j <= T.numProperties; j++) { var p = T.property(j); if (p.propertyType !== PropertyType.PROPERTY) continue; prm[p.matchName] = { name: p.name, value: p.value }; }
        out.comps[n] = { id: comp(n).id, w: 320, h: 180, fps: 25, duration: 1, layerScale: comp(n).layer("src").property("ADBE Transform Group").property("ADBE Scale").value, motionTile: prm, frame: n + "_f0.png" };
    }
    app.project.save();
    var f = new File(D + "fx_tile3.json"); f.encoding = "UTF-8"; f.open("w"); f.write(JSON.stringify(out, null, 1)); f.close();
    var ids = []; for (var k = 0; k < V.length; k++) ids.push(out.comps[V[k][0]].id);
    return { errors: out.errors, ids: ids };
})();
