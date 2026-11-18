// Lab: what After Effects 2026 draws for a Classic 3D layer with Material Options > Accepts Shadows = Only
// (lab material_options: a lit, unshadowed tile renders flat white 255, alpha 255; EffectCraft draws nothing).
// Convention as lab_c3d.jsx: empty project, LAB_OUT set, $.evalFile(); queues one frame-0 PNG per comp
// (Best Settings, RGB + Alpha) and saves in place; render with ONE aerender afterwards.
// Each comp 400x200, black, Classic 3D, one-node camera at (200, 100, -1000), zoom 1000. A 400x200 grey
// (0.2, 0.6, 0.4) 3D solid "P" at z = 0 with Accepts Shadows = Only; a 120x120 white caster "C" at z = -300,
// left half of the frame, Casts Shadows On; one light at (200, 100, -1000) pointing at (200, 100, 0) with
// Casts Shadows on, Shadow Darkness 100, Diffusion 0.
(function () {
    var outDir = new Folder(LAB_OUT); if (!outDir.exists) { outDir.create(); }
    var manifest = [];
    function tr(l) { return l.property("ADBE Transform Group"); }
    function pngTemplate(om) {
        var names = ["PSD_to_PNG_Export", "PNG Sequence"];
        for (var i = 0; i < names.length; i++) {
            try { om.applyTemplate(names[i]); if (om.getSettings(GetSettingsFormat.STRING)["Format"] === "PNG Sequence") { return; } } catch (e) {}
        }
        throw new Error("no PNG sequence output template");
    }
    // name, light type, intensity, light colour, P opacity, P diffuse, P accepts lights
    var cases = [
        ["a1_spot_i100_white", LightType.SPOT, 100, [1, 1, 1], 100, 50, 1],
        ["a2_spot_i50_orange", LightType.SPOT, 50, [1, 0.5, 0.25], 100, 50, 1],
        ["a3_point_i100", LightType.POINT, 100, [1, 1, 1], 100, 50, 1],
        ["a4_spot_opacity50", LightType.SPOT, 100, [1, 1, 1], 50, 50, 1],
        ["a5_spot_diffuse100", LightType.SPOT, 100, [1, 1, 1], 100, 100, 1],
        ["a6_spot_lights_off", LightType.SPOT, 100, [1, 1, 1], 100, 50, 0],
        ["a7_parallel_i100", LightType.PARALLEL, 100, [1, 1, 1], 100, 50, 1]
    ];
    for (var i = 0; i < cases.length; i++) {
        var k = cases[i];
        try {
            var c = app.project.items.addComp(k[0], 400, 200, 1, 1, 25);
            c.renderer = "ADBE Advanced 3d"; c.bgColor = [0, 0, 0];
            var p = c.layers.addSolid([0.2, 0.6, 0.4], "P", 400, 200, 1); p.threeDLayer = true;
            tr(p).property("ADBE Position").setValue([200, 100, 0]);
            tr(p).property("ADBE Opacity").setValue(k[4]);
            var mo = p.property("ADBE Material Options Group");
            mo.property("ADBE Accepts Shadows").setValue(2); // AE 26 scripting values are 0-based: 0 Off, 1 On, 2 Only (fixed from 3)
            mo.property("ADBE Diffuse Coefficient").setValue(k[5]);
            mo.property("ADBE Accepts Lights").setValue(k[6]);
            var cst = c.layers.addSolid([1, 1, 1], "C", 120, 120, 1); cst.threeDLayer = true;
            tr(cst).property("ADBE Position").setValue([100, 100, -300]);
            cst.property("ADBE Material Options Group").property("ADBE Casts Shadows").setValue(1); // On (0 Off, 1 On, 2 Only; fixed from 2)
            var l = c.layers.addLight("L", [200, 100]);
            l.lightType = k[1];
            tr(l).property("ADBE Position").setValue([200, 100, -1000]);
            var lo = l.property("ADBE Light Options Group");
            lo.property("ADBE Light Intensity").setValue(k[2]);
            lo.property("ADBE Light Color").setValue(k[3]);
            lo.property("ADBE Casts Shadows").setValue(1);
            try { lo.property("ADBE Light Shadow Darkness").setValue(100); lo.property("ADBE Light Shadow Diffusion").setValue(0); } catch (e1) {}
            var cam = c.layers.addCamera("CAM", [200, 100]);
            cam.autoOrient = AutoOrientType.NO_AUTO_ORIENT;
            cam.property("ADBE Camera Options Group").property("ADBE Camera Zoom").setValue(1000);
            tr(cam).property("ADBE Position").setValue([200, 100, -1000]);
            var rqi = app.project.renderQueue.items.add(c);
            rqi.applyTemplate("Best Settings"); rqi.timeSpanStart = 0; rqi.timeSpanDuration = c.frameDuration;
            pngTemplate(rqi.outputModule(1));
            rqi.outputModule(1).file = new File(outDir.fsName + "/" + c.name + "_[#####].png");
            manifest.push('{"comp":"' + c.name + '","accepts":' + mo.property("ADBE Accepts Shadows").value + '}');
        } catch (e) { manifest.push('{"comp":"' + k[0] + '","error":"' + String(e).replace(/"/g, "'") + '"}'); }
    }
    app.project.save();
    var f = new File(outDir.fsName + "/lab_accept_only.json"); f.encoding = "UTF-8"; f.open("w");
    f.write('{"ae":"' + app.version + '","comps":[' + manifest.join(",") + ']}'); f.close();
    return { comps: manifest.length };
})();
