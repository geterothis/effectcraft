// Builds lab/adj-tile-chain: comps H-K (1920x1920). BG gradient+grid, TOP text, 1920x1080 adjustment layer stretched by a
// 100x100 null (as variant F of adj-motion-tile) carrying a chain of Motion Tile / Transform effects.
(function () {
    if (!app.project.file || app.project.file.name !== "adj_tile_chain.aep" || app.project.numItems > 0) throw new Error("wrong project");
    var D = app.project.file.parent.fsName + "/";
    var out = { ae: app.version, errors: [], comps: {} };
    function comp(n) { for (var i = 1; i <= app.project.numItems; i++) { var it = app.project.item(i); if (it instanceof CompItem && it.name === n) return it; } return null; }
    function byName(fx, nm) { for (var i = 1; i <= fx.numProperties; i++) if (fx.property(i).name === nm) return fx.property(i); return null; }
    // name, second tile?, uniform, scaleH, scaleW
    var V = [["H_tile_transform30", false, 1, 30, 30], ["I_tile_tile_transform30", true, 1, 30, 30],
             ["J_tile_tile_transformH30_W100", true, 0, 30, 100], ["K_tile_tile_transform100", true, 1, 100, 100]];
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
        try { byName(BF().property("ADBE Grid"), "Blending Mode").setValue(2); } catch (e) { out.errors.push(n + " grid: " + e); }
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
        var FX = function () { return comp(n).layer("ADJ_tile").property("ADBE Effect Parade"); };
        // effect 1: Motion Tile, center [960,960], Output W 550
        FX().addProperty("ADBE Tile");
        var t1 = function () { return FX().property(1); };
        t1().property("ADBE Tile-0001").setValue([960, 960]); t1().property("ADBE Tile-0004").setValue(550); t1().property("ADBE Tile-0006").setValue(1);
        if (v[1]) {
            FX().addProperty("ADBE Tile");
            var t2 = function () { return FX().property(2); };
            t2().property("ADBE Tile-0005").setValue(550); t2().property("ADBE Tile-0006").setValue(1);
        }
        FX().addProperty("ADBE Geometry2");
        var G = function () { return FX().property(FX().numProperties); };
        try {
            byName(G(), "Uniform Scale").setValue(v[2]);
            if (v[2] === 1) { (byName(G(), "Scale") || byName(G(), "Scale Height")).setValue(v[3]); }
            else { byName(G(), "Scale Height").setValue(v[3]); byName(G(), "Scale Width").setValue(v[4]); }
        } catch (e) { out.errors.push(n + " transform: " + e); }
        var chain = [];
        for (var e2 = 1; e2 <= FX().numProperties; e2++) {
            var f = FX().property(e2), prm = [];
            for (var j = 1; j <= f.numProperties; j++) { var p = f.property(j); if (p.propertyType !== PropertyType.PROPERTY) continue; var val = null; try { val = p.value; } catch (x) {} prm.push({ name: p.name, matchName: p.matchName, value: val }); }
            chain.push({ index: e2, name: f.name, matchName: f.matchName, params: prm });
        }
        out.comps[n] = { id: comp(n).id, size: [1920, 1920], frame: n + "_f0.png",
            nullLayer: { size: [100, 100], anchor: [50, 50], position: [960, 960], scale: [1920, 1920] },
            adjustment: { size: [1920, 1080], parent: "NULL_stretch", anchor: at.property("ADBE Anchor Point").value, position: at.property("ADBE Position").value, scale: at.property("ADBE Scale").value, effects: chain } };
    }
    app.project.save();
    var fo = new File(D + "adj_tile_chain.json"); fo.encoding = "UTF-8"; fo.open("w"); fo.write(JSON.stringify(out, null, 1)); fo.close();
    var r = []; for (var k in out.comps) if (out.comps.hasOwnProperty(k)) r.push([k, out.comps[k].id]);
    return { errors: out.errors, ids: r };
})();
