// Adds comps F and G to adj_motion_tile.aep: the 1920x1080 adjustment layer parented to a 100x100 null scaled 1920%.
(function () {
    if (!app.project.file || app.project.file.name !== "adj_motion_tile.aep") throw new Error("wrong project");
    var D = app.project.file.parent.fsName + "/";
    var errs = [], res = {};
    function comp(n) { for (var i = 1; i <= app.project.numItems; i++) { var it = app.project.item(i); if (it instanceof CompItem && it.name === n) return it; } return null; }
    function byName(fx, nm) { for (var i = 1; i <= fx.numProperties; i++) if (fx.property(i).name === nm) return fx.property(i); return null; }
    if (comp("F_null_stretch") || comp("G_null_stretch_c960_out550")) throw new Error("F/G already exist");
    var V = [["F_null_stretch", [960, 540], 100], ["G_null_stretch_c960_out550", [960, 960], 550]];
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
        try { byName(BF().property("ADBE Grid"), "Blending Mode").setValue(2); } catch (e) { errs.push(n + " grid: " + e); }
        var t = comp(n).layers.addText("TOP"); t.name = "TOP";
        var td = comp(n).layer("TOP").property("ADBE Text Properties").property("ADBE Text Document"), tv = td.value;
        tv.fontSize = 160; tv.applyFill = true; tv.fillColor = [1, 1, 1]; tv.justification = ParagraphJustification.CENTER_JUSTIFY; td.setValue(tv);
        comp(n).layer("TOP").property("ADBE Transform Group").property("ADBE Position").setValue([960, 200]);
        var nl = comp(n).layers.addNull(); nl.name = "NULL_stretch";
        var nt = comp(n).layer("NULL_stretch").property("ADBE Transform Group");
        nt.property("ADBE Anchor Point").setValue([50, 50]); nt.property("ADBE Position").setValue([960, 960]); nt.property("ADBE Scale").setValue([1920, 1920]);
        var adj = comp(n).layers.addSolid([1, 1, 1], "ADJ_tile", 1920, 1080, 1); adj.name = "ADJ_tile";
        comp(n).layer("ADJ_tile").adjustmentLayer = true;
        comp(n).layer("ADJ_tile").parent = comp(n).layer("NULL_stretch");
        var at = comp(n).layer("ADJ_tile").property("ADBE Transform Group");
        at.property("ADBE Anchor Point").setValue([960, 540]); at.property("ADBE Position").setValue([50, 50]); at.property("ADBE Scale").setValue([5.208, 9.259]);
        comp(n).layer("ADJ_tile").property("ADBE Effect Parade").addProperty("ADBE Tile");
        var T = function () { return comp(n).layer("ADJ_tile").property("ADBE Effect Parade").property("ADBE Tile"); };
        T().property("ADBE Tile-0001").setValue(v[1]);
        T().property("ADBE Tile-0002").setValue(50);
        T().property("ADBE Tile-0003").setValue(50);
        T().property("ADBE Tile-0004").setValue(v[2]);
        T().property("ADBE Tile-0005").setValue(100);
        T().property("ADBE Tile-0006").setValue(1);
        var tile = {}; for (var j = 1; j <= T().numProperties; j++) { var p = T().property(j); if (p.propertyType === PropertyType.PROPERTY) tile[p.name] = p.value; }
        res[n] = { id: comp(n).id, nullLayer: { size: [100, 100], anchor: nt.property("ADBE Anchor Point").value, position: nt.property("ADBE Position").value, scale: nt.property("ADBE Scale").value },
                   adjustment: { size: [1920, 1080], parent: "NULL_stretch", anchor: at.property("ADBE Anchor Point").value, position: at.property("ADBE Position").value, scale: at.property("ADBE Scale").value, motionTile: tile },
                   frame: n + "_f0.png" };
    }
    app.project.save();
    var f = new File(D + "adj_motion_tile.json"); f.encoding = "UTF-8"; f.open("r"); var o = JSON.parse(f.read()); f.close();
    for (var k in res) if (res.hasOwnProperty(k)) o.comps[k] = res[k];
    f.open("w"); f.write(JSON.stringify(o, null, 1)); f.close();
    return { errors: errs, F: res["F_null_stretch"].id, G: res["G_null_stretch_c960_out550"].id };
})();
