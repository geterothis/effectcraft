// Builds lab/tile-center: Motion Tile on a 400x200 solid (4-Color Gradient source) in comps of other sizes.
// Each case has a unique Tile Width (41..45) so its binary instance can be matched.
(function () {
    if (!app.project.file || app.project.file.name !== "tile_center.aep" || app.project.numItems > 0) throw new Error("wrong project");
    var D = app.project.file.parent.fsName + "/";
    function comp(n) { for (var i = 1; i <= app.project.numItems; i++) { var it = app.project.item(i); if (it instanceof CompItem && it.name === n) return it; } return null; }
    // name, comp w, comp h, layer scale, layer position (null = centre), tile center (null = default), tile width
    var V = [["A_600x900_default", 600, 900, 100, null, null, 41],
             ["B_600x900_set", 600, 900, 100, null, [300, 50], 42],
             ["C_300x300_default", 300, 300, 100, null, null, 43],
             ["D_300x300_scaled_offset_default", 300, 300, 50, [100, 200], null, 44],
             ["E_300x300_scaled_offset_set", 300, 300, 50, [100, 200], [100, 150], 45]];
    var out = { ae: app.version, source: "solid 400x200 + 4-Color Gradient, then Motion Tile (Output 200x200)", cases: [] };
    for (var i = 0; i < V.length; i++) {
        var v = V[i], n = v[0];
        app.project.items.addComp(n, v[1], v[2], 1, 1, 25);
        var L = comp(n).layers.addSolid([0.5, 0.5, 0.5], "src", 400, 200, 1); L.name = "src";
        var fx = function () { return comp(n).layer("src").property("ADBE Effect Parade"); };
        fx().addProperty("ADBE 4ColorGradient");
        fx().property("ADBE 4ColorGradient").property("ADBE 4ColorGradient-0002").setValue([1, 0.9, 0.1]);
        fx().property("ADBE 4ColorGradient").property("ADBE 4ColorGradient-0004").setValue([0.1, 0.8, 0.2]);
        fx().property("ADBE 4ColorGradient").property("ADBE 4ColorGradient-0006").setValue([0.9, 0.1, 0.6]);
        fx().property("ADBE 4ColorGradient").property("ADBE 4ColorGradient-0008").setValue([0.1, 0.3, 1]);
        fx().addProperty("ADBE Tile");
        var T = function () { return fx().property("ADBE Tile"); };
        T().property("ADBE Tile-0002").setValue(v[6]);
        T().property("ADBE Tile-0003").setValue(50);
        T().property("ADBE Tile-0004").setValue(200);
        T().property("ADBE Tile-0005").setValue(200);
        T().property("ADBE Tile-0006").setValue(1);
        if (v[5]) T().property("ADBE Tile-0001").setValue(v[5]);
        var tg = comp(n).layer("src").property("ADBE Transform Group");
        tg.property("ADBE Scale").setValue([v[3], v[3]]);
        if (v[4]) tg.property("ADBE Position").setValue(v[4]);
        var tc = T().property("ADBE Tile-0001");
        out.cases.push({ comp: n, compId: comp(n).id, compSize: [v[1], v[2]], layerSize: [400, 200], layerScale: tg.property("ADBE Scale").value,
            layerPosition: tg.property("ADBE Position").value, anchor: tg.property("ADBE Anchor Point").value,
            tileCenterSet: v[5] ? v[5] : "default", tileCenterValue: tc.value, tileWidthTag: v[6], frame: n + "_f0.png" });
    }
    app.project.save();
    var f = new File(D + "tile_center.json"); f.encoding = "UTF-8"; f.open("w"); f.write(JSON.stringify(out, null, 1)); f.close();
    var r = []; for (var k = 0; k < out.cases.length; k++) r.push([out.cases[k].comp, out.cases[k].compId, out.cases[k].tileCenterValue]);
    return r;
})();
