// Builds camlight_keys.aep: keys on camera and light options, and the light options EffectCraft
// does not write yet. Run in a new empty project; writes next to this script.
(function () {
    var here = File($.fileName).parent;
    var out = { comps: {} };
    function opt(layer, group, mn) { return layer.property(group).property(mn); }
    function keys(p, list) {
        // list: [time, value, kind] with kind "lin" | "bez" | "hold"
        for (var i = 0; i < list.length; i++) p.setValueAtTime(list[i][0], list[i][1]);
        for (var k = 1; k <= p.numKeys; k++) {
            var kind = list[k - 1][2];
            var t = kind === "hold" ? KeyframeInterpolationType.HOLD : kind === "bez" ? KeyframeInterpolationType.BEZIER : KeyframeInterpolationType.LINEAR;
            try { p.setInterpolationTypeAtKey(k, t, t); } catch (e) {}
            if (kind === "bez") {
                try {
                    var d = p.value instanceof Array ? p.value.length : 1;
                    var e1 = [], e2 = [];
                    for (var j = 0; j < (p.propertyValueType === PropertyValueType.COLOR ? 1 : d); j++) { e1.push(new KeyframeEase(0, 33.3)); e2.push(new KeyframeEase(0, 75)); }
                    p.setTemporalEaseAtKey(k, e1, e2);
                } catch (e) {}
            }
        }
    }
    function dump(p) {
        var r = { matchName: p.matchName, name: p.name, value: p.value, keys: [] };
        for (var k = 1; k <= p.numKeys; k++) {
            var e = {};
            try { e.inEase = p.keyInTemporalEase(k)[0]; e.outEase = p.keyOutTemporalEase(k)[0]; } catch (x) {}
            r.keys.push({ time: p.keyTime(k), value: p.keyValue(k), inType: p.keyInInterpolationType(k), outType: p.keyOutInterpolationType(k),
                inSpeed: e.inEase ? e.inEase.speed : null, inInfl: e.inEase ? e.inEase.influence : null,
                outSpeed: e.outEase ? e.outEase.speed : null, outInfl: e.outEase ? e.outEase.influence : null });
        }
        return r;
    }
    function wall(c, name) {
        var s = c.layers.addSolid([0.8, 0.8, 0.8], name, 1920, 1080, 1);
        s.threeDLayer = true;
        try { s.property("ADBE Material Options Group").property("ADBE Accepts Shadows").setValue(1); } catch (e) {}
        return s;
    }

    // Comp K: keys.
    var K = app.project.items.addComp("K", 1920, 1080, 1, 2, 30);
    wall(K, "wall");
    var box = K.layers.addSolid([0.9, 0.2, 0.2], "box", 400, 400, 1);
    box.threeDLayer = true;
    box.property("ADBE Transform Group").property("ADBE Position").setValue([960, 540, -300]);
    try { box.property("ADBE Material Options Group").property("ADBE Casts Shadows").setValue(1); } catch (e) {}
    var cam = K.layers.addCamera("cam", [960, 540]);
    var CO = "ADBE Camera Options Group";
    keys(opt(cam, CO, "ADBE Camera Zoom"), [[0, 2666.7, "lin"], [0.5, 1800, "bez"], [1, 3000, "hold"], [1.5, 2200, "lin"]]);
    keys(opt(cam, CO, "ADBE Camera Depth of Field"), [[0, 0, "hold"], [0.5, 1, "hold"], [1.5, 0, "hold"]]);
    keys(opt(cam, CO, "ADBE Camera Focus Distance"), [[0, 2666.7, "lin"], [1, 2000, "bez"]]);
    keys(opt(cam, CO, "ADBE Camera Aperture"), [[0, 25.3, "lin"], [1, 120, "lin"]]);
    keys(opt(cam, CO, "ADBE Camera Blur Level"), [[0, 100, "lin"], [1, 250, "hold"]]);
    var spot = K.layers.addLight("spot", [960, 540]);
    spot.lightType = LightType.SPOT;
    var LO = "ADBE Light Options Group";
    keys(opt(spot, LO, "ADBE Light Intensity"), [[0, 100, "lin"], [0.5, 180, "bez"], [1, 60, "hold"]]);
    keys(opt(spot, LO, "ADBE Light Color"), [[0, [1, 1, 1], "lin"], [1, [1, 0.5, 0.2], "lin"]]);
    keys(opt(spot, LO, "ADBE Light Cone Angle"), [[0, 90, "lin"], [1, 45, "lin"]]);
    keys(opt(spot, LO, "ADBE Light Cone Feather 2"), [[0, 50, "lin"], [1, 10, "lin"]]);
    var point = K.layers.addLight("point", [400, 300]);
    point.lightType = LightType.POINT;
    keys(opt(point, LO, "ADBE Light Intensity"), [[0, 40, "lin"], [1.5, 120, "lin"]]);

    // Comp S: static options EffectCraft reports as not sampled.
    var S = app.project.items.addComp("S", 1920, 1080, 1, 2, 30);
    wall(S, "wall");
    var box2 = S.layers.addSolid([0.2, 0.4, 0.9], "box", 400, 400, 1);
    box2.threeDLayer = true;
    box2.property("ADBE Transform Group").property("ADBE Position").setValue([960, 540, -300]);
    try { box2.property("ADBE Material Options Group").property("ADBE Casts Shadows").setValue(1); } catch (e) {}
    S.layers.addCamera("cam", [960, 540]);
    var par = S.layers.addLight("parallel", [960, 540]); par.lightType = LightType.PARALLEL;
    try { opt(par, LO, "ADBE Light Intensity").setValue(70); } catch (e) {}
    var amb = S.layers.addLight("ambient", [960, 540]); amb.lightType = LightType.AMBIENT;
    try { opt(amb, LO, "ADBE Light Intensity").setValue(25); } catch (e) {}
    var sp2 = S.layers.addLight("spot shadows", [700, 400]); sp2.lightType = LightType.SPOT;
    try { opt(sp2, LO, "ADBE Casts Shadows").setValue(1); } catch (e) { out.castsShadowsError = String(e); }
    try { opt(sp2, LO, "ADBE Light Shadow Darkness").setValue(60); } catch (e) { out.darknessError = String(e); }
    try { opt(sp2, LO, "ADBE Light Shadow Diffusion").setValue(20); } catch (e) { out.diffusionError = String(e); }
    var pt2 = S.layers.addLight("point falloff", [1300, 400]); pt2.lightType = LightType.POINT;
    try { opt(pt2, LO, "ADBE Light Falloff Type").setValue(2); } catch (e) { out.falloffError = String(e); }
    try { opt(pt2, LO, "ADBE Light Falloff Start").setValue(300); } catch (e) { out.radiusError = String(e); }
    try { opt(pt2, LO, "ADBE Light Falloff Distance").setValue(800); } catch (e) { out.distanceError = String(e); }

    var comps = [K, S];
    for (var c = 0; c < comps.length; c++) {
        var C = comps[c], L = [];
        for (var i = 1; i <= C.numLayers; i++) {
            var l = C.layer(i), e = { name: l.name, props: [] };
            try { e.lightType = l.lightType; } catch (x) {}
            var g = l.property(l instanceof CameraLayer ? CO : LO);
            if (g) for (var j = 1; j <= g.numProperties; j++) { try { e.props.push(dump(g.property(j))); } catch (x) {} }
            L.push(e);
        }
        out.comps[C.name] = L;
    }
    var f = File(here.fsName + "/camlight_keys.json");
    f.open("w"); f.write(out.toSource ? out.toSource() : String(out)); f.close();
    app.project.save(File(here.fsName + "/camlight_keys.aep"));
})();
