// Builds lab/emboss: comps E1-E7 (200x200, 25 fps, 1 s). Each E comp holds one precomp layer "src"
// (background solid + 80x80 square solid centred) with Emboss on it.
(function () {
    if (!app.project.file || app.project.file.name !== "emboss.aep" || app.project.numItems > 0) throw new Error("wrong project");
    var D = app.project.file.parent.fsName + "/";
    var out = { ae: app.version, errors: [], comps: {} };
    function comp(n) { for (var i = 1; i <= app.project.numItems; i++) { var it = app.project.item(i); if (it instanceof CompItem && it.name === n) return it; } return null; }
    var GREY = [0.5, 0.5, 0.5], WHITE = [1, 1, 1], BLUE = [0, 0, 1], RED = [1, 0, 0];
    // name, bg colour (null = transparent), square colour, direction, relief, contrast, blend
    var V = [["E1", GREY, WHITE, 0, 3, 100, 0], ["E2", GREY, WHITE, 90, 3, 100, 0], ["E3", GREY, WHITE, 120, 3, 100, 0],
             ["E4", GREY, WHITE, 0, 4.5, 250, 0], ["E5", BLUE, RED, 120, 3, 100, 0], ["E6", BLUE, RED, 120, 3, 100, 30],
             ["E7", null, WHITE, 0, 3, 100, 0]];
    for (var i = 0; i < V.length; i++) {
        var n = V[i][0], sn = "SRC_" + n;
        var s = app.project.items.addComp(sn, 200, 200, 1, 1, 25);
        if (V[i][1]) { var b = s.layers.addSolid(V[i][1], "bg", 200, 200, 1); b.name = "bg"; }
        var q = comp(sn).layers.addSolid(V[i][2], "square", 80, 80, 1); q.name = "square";
        var c = app.project.items.addComp(n, 200, 200, 1, 1, 25);
        var L = c.layers.add(comp(sn)); L.name = "src";
        comp(n).layer("src").property("ADBE Effect Parade").addProperty("ADBE Emboss");
        var E = function () { return comp(n).layer("src").property("ADBE Effect Parade").property("ADBE Emboss"); };
        try {
            E().property("ADBE Emboss-0001").setValue(V[i][3]);
            E().property("ADBE Emboss-0002").setValue(V[i][4]);
            E().property("ADBE Emboss-0003").setValue(V[i][5]);
            E().property("ADBE Emboss-0004").setValue(V[i][6]);
        } catch (e) { out.errors.push(n + ": " + String(e)); }
        var prm = {};
        for (var j = 1; j <= E().numProperties; j++) { var p = E().property(j); if (p.propertyType !== PropertyType.PROPERTY) continue; prm[p.matchName] = { name: p.name, value: p.value }; }
        out.comps[n] = { id: comp(n).id, w: 200, h: 200, fps: 25, duration: 1,
            source: { precomp: sn, background: V[i][1] ? V[i][1] : "transparent (no background layer)", square: { color: V[i][2], size: [80, 80], center: [100, 100] } },
            emboss: prm, frame: n + "_f0.png" };
    }
    app.project.save();
    var f = new File(D + "emboss.json"); f.encoding = "UTF-8"; f.open("w"); f.write(JSON.stringify(out, null, 1)); f.close();
    var ids = []; for (var k = 0; k < V.length; k++) ids.push(out.comps[V[k][0]].id);
    return { errors: out.errors, ids: ids };
})();
