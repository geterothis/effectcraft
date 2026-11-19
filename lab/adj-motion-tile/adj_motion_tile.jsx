// Builds lab/adj-motion-tile: comps A-E (1920x1920, 25 fps, 2 s). Bottom: BG solid (Gradient Ramp red->blue + Grid),
// text "TOP"; above: 1920x1080 adjustment layer with Motion Tile.
(function () {
    if (!app.project.file || app.project.file.name !== "adj_motion_tile.aep" || app.project.numItems > 0) throw new Error("wrong project");
    var D = app.project.file.parent.fsName + "/";
    var out = { ae: app.version, errors: [], comps: {} };
    function comp(n) { for (var i = 1; i <= app.project.numItems; i++) { var it = app.project.item(i); if (it instanceof CompItem && it.name === n) return it; } return null; }
    function byName(fx, nm) { for (var i = 1; i <= fx.numProperties; i++) if (fx.property(i).name === nm) return fx.property(i); return null; }
    // name, position, scale, rotation, output
    var V = [["A_default", null, 100, 0, 100], ["B_pos_960_700", [960, 700], 100, 0, 100], ["C_scale_50", null, 50, 0, 100],
             ["D_rot_30", null, 100, 30, 100], ["E_output_200", null, 100, 0, 200]];
    for (var i = 0; i < V.length; i++) {
        var v = V[i], n = v[0];
        app.project.items.addComp(n, 1920, 1920, 1, 2, 25);
        var bg = comp(n).layers.addSolid([0.5, 0.5, 0.5], "BG", 1920, 1920, 1); bg.name = "BG";
        var BF = function () { return comp(n).layer("BG").property("ADBE Effect Parade"); };
        BF().addProperty("ADBE Ramp");
        BF().property("ADBE Ramp").property("ADBE Ramp-0001").setValue([960, 0]);
        BF().property("ADBE Ramp").property("ADBE Ramp-0002").setValue([1, 0, 0]);
        BF().property("ADBE Ramp").property("ADBE Ramp-0003").setValue([960, 1920]);
        BF().property("ADBE Ramp").property("ADBE Ramp-0004").setValue([0, 0, 1]);
        BF().addProperty("ADBE Grid");
        try { byName(BF().property("ADBE Grid"), "Blending Mode").setValue(2); } catch (e) { out.errors.push(n + " grid blend: " + e); }
        var t = comp(n).layers.addText("TOP"); t.name = "TOP";
        var td = comp(n).layer("TOP").property("ADBE Text Properties").property("ADBE Text Document"), tv = td.value;
        tv.fontSize = 160; tv.applyFill = true; tv.fillColor = [1, 1, 1]; tv.justification = ParagraphJustification.CENTER_JUSTIFY; td.setValue(tv);
        comp(n).layer("TOP").property("ADBE Transform Group").property("ADBE Position").setValue([960, 200]);
        var adj = comp(n).layers.addSolid([1, 1, 1], "ADJ_tile", 1920, 1080, 1); adj.name = "ADJ_tile";
        comp(n).layer("ADJ_tile").adjustmentLayer = true;
        var AF = function () { return comp(n).layer("ADJ_tile").property("ADBE Effect Parade"); };
        AF().addProperty("ADBE Tile");
        var T = function () { return AF().property("ADBE Tile"); };
        T().property("ADBE Tile-0001").setValue([960, 540]);
        T().property("ADBE Tile-0002").setValue(50);
        T().property("ADBE Tile-0003").setValue(50);
        T().property("ADBE Tile-0004").setValue(v[4]);
        T().property("ADBE Tile-0005").setValue(v[4]);
        T().property("ADBE Tile-0006").setValue(1);
        var tg = comp(n).layer("ADJ_tile").property("ADBE Transform Group");
        if (v[1]) tg.property("ADBE Position").setValue(v[1]);
        tg.property("ADBE Scale").setValue([v[2], v[2]]);
        tg.property("ADBE Rotate Z").setValue(v[3]);
        var tile = {}; for (var j = 1; j <= T().numProperties; j++) { var p = T().property(j); if (p.propertyType === PropertyType.PROPERTY) tile[p.name] = p.value; }
        out.comps[n] = { id: comp(n).id, adjustment: { size: [1920, 1080], position: tg.property("ADBE Position").value, anchor: tg.property("ADBE Anchor Point").value,
            scale: tg.property("ADBE Scale").value, rotation: tg.property("ADBE Rotate Z").value, motionTile: tile }, frame: n + "_f0.png" };
    }
    app.project.save();
    var f = new File(D + "adj_motion_tile.json"); f.encoding = "UTF-8"; f.open("w"); f.write(JSON.stringify(out, null, 1)); f.close();
    var r = []; for (var k in out.comps) if (out.comps.hasOwnProperty(k)) r.push([k, out.comps[k].id]);
    return { errors: out.errors, ids: r };
})();
