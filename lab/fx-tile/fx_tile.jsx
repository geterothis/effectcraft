// Builds lab/fx-tile: comps T (Motion Tile), S (Shift Channels), E (Emboss). Run in the empty fx_tile.aep.
(function () {
    if (!app.project.file || app.project.file.name !== "fx_tile.aep" || app.project.numItems > 0) throw new Error("wrong project");
    var D = app.project.file.parent.fsName + "/";
    var out = { ae: app.version, errors: [], comps: {} };
    function comp(n) { for (var i = 1; i <= app.project.numItems; i++) { var it = app.project.item(i); if (it instanceof CompItem && it.name === n) return it; } return null; }
    function fxOf(c) { return comp(c).layer("src").property("ADBE Effect Parade"); }
    function setP(c, fxMatch, name, v) { try { fxOf(c).property(fxMatch).property(name).setValue(v); } catch (e) { out.errors.push(String(c) + " " + String(name) + ": " + String(e)); } }
    function build(name) {
        var c = app.project.items.addComp(name, 320, 180, 1, 1, 25);
        var L = c.layers.addSolid([0.5, 0.5, 0.5], "src", 320, 180, 1);
        L.name = "src";
        fxOf(name).addProperty("ADBE 4ColorGradient");
        setP(name, "ADBE 4ColorGradient", "ADBE 4ColorGradient-0002", [1, 0.9, 0.1]);
        setP(name, "ADBE 4ColorGradient", "ADBE 4ColorGradient-0004", [0.1, 0.8, 0.2]);
        setP(name, "ADBE 4ColorGradient", "ADBE 4ColorGradient-0006", [0.9, 0.1, 0.6]);
        setP(name, "ADBE 4ColorGradient", "ADBE 4ColorGradient-0008", [0.1, 0.3, 1]);
        fxOf(name).addProperty("ADBE Checkerboard");
        setP(name, "ADBE Checkerboard", "ADBE Checkerboard-0004", 40);
        setP(name, "ADBE Checkerboard", "ADBE Checkerboard-0011", 35);
        return c;
    }
    function dump(cn) {
        var P = fxOf(cn), r = [];
        for (var i = 1; i <= P.numProperties; i++) {
            var f = P.property(i), e = { name: f.name, matchName: f.matchName, params: [] };
            for (var j = 1; j <= f.numProperties; j++) {
                var p = f.property(j);
                if (p.propertyValueType === PropertyValueType.NO_VALUE || p.propertyType !== PropertyType.PROPERTY) continue;
                var v = null; try { v = p.value; } catch (x) { v = "n/a"; }
                e.params.push({ name: p.name, matchName: p.matchName, value: v });
            }
            r.push(e);
        }
        var L = comp(cn).layer("src");
        return { w: comp(cn).width, h: comp(cn).height, fps: comp(cn).frameRate, duration: comp(cn).duration, id: comp(cn).id,
                 layerScale: L.property("ADBE Transform Group").property("ADBE Scale").value, effects: r };
    }
    build("T");
    fxOf("T").addProperty("ADBE Tile");
    setP("T", "ADBE Tile", "ADBE Tile-0002", 50);
    setP("T", "ADBE Tile", "ADBE Tile-0004", 550);
    setP("T", "ADBE Tile", "ADBE Tile-0005", 550);
    setP("T", "ADBE Tile", "ADBE Tile-0006", 1);
    setP("T", "ADBE Tile", "ADBE Tile-0007", 30);
    comp("T").layer("src").property("ADBE Transform Group").property("ADBE Scale").setValue([30, 30]);

    build("S");
    fxOf("S").addProperty("ADBE Shift Channels");
    setP("S", "ADBE Shift Channels", "ADBE Shift Channels-0002", 3);    // menu: Alpha, Red, Green, Blue, Luminance, Hue, Lightness, Saturation, Full On, Half On, Full Off
    setP("S", "ADBE Shift Channels", "ADBE Shift Channels-0004", 11);

    build("E");
    fxOf("E").addProperty("ADBE Emboss");
    setP("E", "ADBE Emboss", "ADBE Emboss-0001", 120);
    setP("E", "ADBE Emboss", "ADBE Emboss-0002", 4.5);
    setP("E", "ADBE Emboss", "ADBE Emboss-0003", 250);
    setP("E", "ADBE Emboss", "ADBE Emboss-0004", 30);

    out.comps.T = dump("T"); out.comps.S = dump("S"); out.comps.E = dump("E");
    app.project.save();
    var f = new File(D + "fx_tile.json"); f.encoding = "UTF-8"; f.open("w"); f.write(JSON.stringify(out, null, 1)); f.close();
    return { errors: out.errors, ids: [out.comps.T.id, out.comps.S.id, out.comps.E.id] };
})();
