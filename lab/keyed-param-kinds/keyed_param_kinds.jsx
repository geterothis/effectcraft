// Builds keyed_param_kinds.aep: keys on effect parameter kinds the EffectCraft exporter does not
// write yet (angle, checkbox, popup, integer slider). Run in ONE headless AE 2026 instance.
// Usage: set OUT_DIR below (or $.global.OUT_DIR) to the folder of this script.
(function () {
    var outDir = (typeof OUT_DIR !== "undefined") ? OUT_DIR : File($.fileName).parent.fsName;
    var proj = app.project;
    var comp = proj.items.addComp("C", 1920, 1080, 1, 4, 25);
    function solid(name) { return comp.layers.addSolid([0.2, 0.3, 0.4], name, 1920, 1080, 1, 4); }
    function key(prop, t, v) { prop.setValueAtTime(t, v); return prop.nearestKeyIndex(t); }
    var report = [];
    function dump(label, prop) {
        var keys = [];
        for (var i = 1; i <= prop.numKeys; i++) {
            var ie = [], oe = [];
            try { ie = prop.keyInTemporalEase(i); oe = prop.keyOutTemporalEase(i); } catch (e) {}
            var ease = function (a) { var r = []; for (var j = 0; j < a.length; j++) r.push([a[j].speed, a[j].influence]); return r; };
            keys.push({ t: prop.keyTime(i), v: prop.keyValue(i), inI: prop.keyInInterpolationType(i), outI: prop.keyOutInterpolationType(i), inEase: ease(ie), outEase: ease(oe) });
        }
        report.push({ label: label, matchName: prop.matchName, type: prop.propertyValueType, keys: keys });
    }

    // Angle: Fractal Noise Evolution, 0 -> 720 deg linear -> 90 deg bezier.
    var l1 = solid("FN");
    var fn = l1.property("ADBE Effect Parade").addProperty("ADBE Fractal Noise");
    var evo = fn.property("Evolution");
    key(evo, 0, 0); var k2 = key(evo, 1, 720); var k3 = key(evo, 2, 90);
    evo.setInterpolationTypeAtKey(k3, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
    evo.setTemporalEaseAtKey(k3, [new KeyframeEase(-100, 50)], [new KeyframeEase(0, 33.33)]);
    // Checkbox: Invert off -> on. Popup: Fractal Type item 1 -> 3.
    var inv = fn.property("Invert"); key(inv, 0, 0); key(inv, 1, 1);
    var ft = fn.property("Fractal Type"); key(ft, 0, 1); key(ft, 2, 3);
    dump("evolution", evo); dump("invert", inv); dump("fractalType", ft);

    // Angle: Directional Blur Direction 0 -> 45 deg.
    var l2 = solid("DB");
    var db = l2.property("ADBE Effect Parade").addProperty("ADBE Motion Blur");
    var dir = db.property("Direction"); key(dir, 0, 0); key(dir, 2, 45);
    dump("direction", dir);

    // Integer slider: Mosaic Horizontal Blocks 10 -> 40.
    var l3 = solid("MO");
    var mo = l3.property("ADBE Effect Parade").addProperty("ADBE Mosaic");
    var hb = mo.property("Horizontal Blocks"); key(hb, 0, 10); key(hb, 1, 40);
    dump("horizontalBlocks", hb);

    proj.save(new File(outDir + "/keyed_param_kinds.aep"));
    var f = new File(outDir + "/keyed_param_kinds.json");
    f.encoding = "UTF-8"; f.open("w"); f.write(report.toSource ? report.toSource() : String(report)); f.close();
})();
