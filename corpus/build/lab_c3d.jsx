// Lab: Classic 3D lighting + depth of field ground truth (AE 2026).
// Same calling convention as fx_samples_one.jsx: the caller creates an empty project (ae_station new),
// sets LAB_OUT (output folder) and $.evalFile()s this script; it fills the project, queues one frame-0 PNG
// per comp in the render queue and saves in place. Render afterwards with ONE aerender instance.
// Every comp: Classic 3D, 8 bpc, one-node camera at (w/2, h/2, -1000), zoom 1000, so the z = 0 plane maps 1:1.
// Solids are grey 0.5 (128) so nothing clips. Results: LAB_OUT/<comp>_00000.png + lab_c3d.json (the settings).
(function () {
    var outDir = new Folder(LAB_OUT);
    if (!outDir.exists) { outDir.create(); }
    var manifest = [];
    function S(g, mn, v) { g.property(mn).setValue(v); }
    function pngTemplate(om) {
        var names = ["PSD_to_PNG_Export", "PNG Sequence"];
        for (var i = 0; i < names.length; i++) {
            try { om.applyTemplate(names[i]); if (om.getSettings(GetSettingsFormat.STRING)["Format"] === "PNG Sequence") { return; } } catch (e) {}
        }
        throw new Error("no PNG sequence output template");
    }
    function tr(l) { return l.property("ADBE Transform Group"); }
    function mkComp(name, w, h, cam) {
        var c = app.project.items.addComp(name, w, h, 1, 1, 25);
        c.renderer = "ADBE Advanced 3d"; // Classic 3D
        c.bgColor = [0, 0, 0];
        var k = c.layers.addCamera("CAM", [w / 2, h / 2]);
        k.autoOrient = AutoOrientType.NO_AUTO_ORIENT;
        tr(k).property("ADBE Position").setValue([w / 2, h / 2, -1000]);
        var co = k.property("ADBE Camera Options Group");
        S(co, "ADBE Camera Zoom", 1000);
        if (cam) {
            S(co, "ADBE Camera Depth of Field", 1);
            S(co, "ADBE Camera Focus Distance", cam.focus);
            S(co, "ADBE Camera Aperture", cam.aperture);
        }
        return c;
    }
    // a 3D grey solid facing the camera; mat = {amb, diff, spec, shin, metal}
    function plane(c, name, w, h, pos, mat, color, scale) {
        var l = c.layers.addSolid(color || [0.5, 0.5, 0.5], name, w, h, 1);
        l.threeDLayer = true;
        tr(l).property("ADBE Position").setValue(pos);
        if (scale) { tr(l).property("ADBE Scale").setValue([scale, scale, scale]); }
        var mo = l.property("ADBE Material Options Group");
        if (mat) {
            if (mat.amb !== undefined) { S(mo, "ADBE Ambient Coefficient", mat.amb); }
            if (mat.diff !== undefined) { S(mo, "ADBE Diffuse Coefficient", mat.diff); }
            if (mat.spec !== undefined) { S(mo, "ADBE Specular Coefficient", mat.spec); }
            if (mat.shin !== undefined) { S(mo, "ADBE Shininess Coefficient", mat.shin); }
            if (mat.metal !== undefined) { S(mo, "ADBE Metal Coefficient", mat.metal); }
        }
        return l;
    }
    // type: "par", "spot", "point", "amb"; o = {pos, poi, intensity, cone, feather, color}
    function light(c, type, o) {
        var l = c.layers.addLight("L_" + type, [c.width / 2, c.height / 2]);
        l.lightType = { par: LightType.PARALLEL, spot: LightType.SPOT, point: LightType.POINT, amb: LightType.AMBIENT }[type];
        if (o.pos) { tr(l).property("ADBE Position").setValue(o.pos); }
        if (o.poi) { tr(l).property("ADBE Anchor Point").setValue(o.poi); }
        var lo = l.property("ADBE Light Options Group");
        S(lo, "ADBE Light Intensity", o.intensity === undefined ? 100 : o.intensity);
        S(lo, "ADBE Light Color", o.color || [1, 1, 1]);
        if (o.cone !== undefined) { S(lo, "ADBE Light Cone Angle", o.cone); }
        if (o.feather !== undefined) { S(lo, "ADBE Light Cone Feather 2", o.feather); }
        return l;
    }
    function queue(c, spec) {
        var rqi = app.project.renderQueue.items.add(c);
        rqi.applyTemplate("Best Settings");
        rqi.timeSpanStart = 0;
        rqi.timeSpanDuration = c.frameDuration;
        pngTemplate(rqi.outputModule(1));
        rqi.outputModule(1).file = new File(outDir.fsName + "/" + c.name + "_[#####].png");
        spec.comp = c.name;
        manifest.push(spec);
    }
    var W = 400, H = 200, C = [W / 2, H / 2, 0];
    var straight = { pos: [W / 2, H / 2, -1000], poi: C };
    function lit(name, type, lo, mat, note) {
        try {
            var c = mkComp(name, W, H);
            plane(c, "P", W, H, C, mat);
            light(c, type, lo);
            queue(c, { light: type, lightOpts: lo, mat: mat, note: note });
        } catch (e) { manifest.push({ comp: name, error: String(e) }); }
    }
    app.beginSuppressDialogs();
    // parallel light straight at the plane (N.L = 1)
    lit("l01_par_d50_s0", "par", straight, { diff: 50, spec: 0 }, "diffuse only, default diffuse");
    lit("l02_par_d100_s0", "par", straight, { diff: 100, spec: 0 }, "diffuse only");
    lit("l03_par_i50_d100_s0", "par", { pos: straight.pos, poi: C, intensity: 50 }, { diff: 100, spec: 0 }, "intensity 50");
    lit("l04_par_i200_d50_s0", "par", { pos: straight.pos, poi: C, intensity: 200 }, { diff: 50, spec: 0 }, "intensity 200");
    // parallel at 60 degrees from the normal (N.L = 0.5)
    lit("l05_par60_d100_s0", "par", { pos: [W / 2 + 866.025, H / 2, -500], poi: C }, { diff: 100, spec: 0 }, "N.L 0.5");
    // specular only, highlight peak (half vector = normal)
    lit("l06_par_d0_s100_metal100", "par", straight, { diff: 0, spec: 100, shin: 5, metal: 100 }, "specular, metal 100");
    lit("l07_par_d0_s100_metal0", "par", straight, { diff: 0, spec: 100, shin: 5, metal: 0 }, "specular, metal 0");
    lit("l08_par_d0_s50_default", "par", straight, { diff: 0 }, "specular at defaults (50, 5, 100)");
    lit("l09_par_defaults", "par", straight, null, "all material defaults (amb 100, diff 50, spec 50, shin 5, metal 100)");
    // specular off-peak: light at 60 degrees, camera straight on (half vector at 30 degrees)
    lit("l10_par60_d0_s100_shin5", "par", { pos: [W / 2 + 866.025, H / 2, -500], poi: C }, { diff: 0, spec: 100, shin: 5, metal: 0 }, "specular, 30 deg half angle");
    lit("l11_par60_d0_s100_shin40", "par", { pos: [W / 2 + 866.025, H / 2, -500], poi: C }, { diff: 0, spec: 100, shin: 40, metal: 0 }, "specular, shininess 40");
    // ambient
    lit("l12_amb100_mat100", "amb", { intensity: 100 }, { amb: 100 }, "ambient light 100, material ambient 100");
    lit("l13_amb100_mat50", "amb", { intensity: 100 }, { amb: 50 }, "material ambient 50");
    lit("l14_amb20_mat100", "amb", { intensity: 20 }, { amb: 100 }, "ambient light 20");
    // coloured light on a coloured plane
    try {
        var cc = mkComp("l15_par_color", W, H);
        plane(cc, "P", W, H, C, { diff: 100, spec: 0 }, [0.8, 0.4, 0.2]);
        light(cc, "par", { pos: straight.pos, poi: C, color: [0.3, 0.5, 1] });
        queue(cc, { light: "par", plane: [0.8, 0.4, 0.2], lightColor: [0.3, 0.5, 1], mat: { diff: 100, spec: 0 } });
    } catch (e1) { manifest.push({ comp: "l15_par_color", error: String(e1) }); }
    // spot profile: 1200 wide plane, spot 500 px in front, cone 60 (edge at x = 600 +- 289)
    function spotComp(name, cone, feather, mat) {
        try {
            var c = mkComp(name, 1200, 200);
            plane(c, "P", 1200, 200, [600, 100, 0], mat);
            light(c, "spot", { pos: [600, 100, -500], poi: [600, 100, 0], cone: cone, feather: feather });
            queue(c, { light: "spot", cone: cone, feather: feather, mat: mat, note: "read row y=100" });
        } catch (e) { manifest.push({ comp: name, error: String(e) }); }
    }
    spotComp("l16_spot60_f50_d100_s0", 60, 50, { diff: 100, spec: 0 });
    spotComp("l17_spot60_f0_d100_s0", 60, 0, { diff: 100, spec: 0 });
    spotComp("l18_spot60_f100_d100_s0", 60, 100, { diff: 100, spec: 0 });
    // point light: per-pixel direction (N.L falls off across the plane), distance attenuation (None)
    function pointComp(name, z) {
        try {
            var c = mkComp(name, 1200, 200);
            plane(c, "P", 1200, 200, [600, 100, 0], { diff: 100, spec: 0 });
            light(c, "point", { pos: [600, 100, z] });
            queue(c, { light: "point", pos: [600, 100, z], mat: { diff: 100, spec: 0 }, note: "read row y=100" });
        } catch (e) { manifest.push({ comp: name, error: String(e) }); }
    }
    pointComp("l19_point_z300", -300);
    pointComp("l20_point_z3000", -3000);
    // two lights add up (parallel 50 + parallel 50 vs l02)
    try {
        var c2 = mkComp("l21_par_two_halves", W, H);
        plane(c2, "P", W, H, C, { diff: 100, spec: 0 });
        light(c2, "par", { pos: straight.pos, poi: C, intensity: 50 });
        light(c2, "par", { pos: straight.pos, poi: C, intensity: 50 });
        queue(c2, { light: "par x2", intensity: 50, mat: { diff: 100, spec: 0 } });
    } catch (e2) { manifest.push({ comp: "l21_par_two_halves", error: String(e2) }); }
    // depth of field: white 200x200 squares on black at depths 1000 (in focus), 700, 1500, 2000 and a 400x400
    // square at 50 % scale at depth 1500; camera focus 1000, aperture 40 / 80
    function dofComp(name, aperture) {
        try {
            var c = mkComp(name, 1200, 300, { focus: 1000, aperture: aperture });
            var nolight = null;
            // no lights: layers render unlit
            var sq = [["z0_d1000", 120, 0, 200, 100], ["zm300_d700", 360, -300, 200, 100], ["z500_d1500", 600, 500, 200, 100],
                ["z1000_d2000", 840, 1000, 200, 100], ["z500_d1500_400px_s50", 1080, 500, 400, 50]];
            for (var i = 0; i < sq.length; i++) {
                var s = sq[i], d = 1000 + s[2];
                // place each square so its centre projects to (s[1], 150)
                var x = 600 + (s[1] - 600) * d / 1000, y = 150;
                plane(c, s[0], s[3], s[3], [x, y, s[2]], nolight, [1, 1, 1], s[4]);
            }
            queue(c, { dof: true, focus: 1000, aperture: aperture, squares: sq, note: "centres project to (x, 150); measure edge widths" });
        } catch (e) { manifest.push({ comp: name, error: String(e) }); }
    }
    dofComp("d01_dof_a40", 40);
    dofComp("d02_dof_a80", 80);
    app.endSuppressDialogs(false);
    app.project.save();
    function q(s) { return '"' + String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"'; }
    function js(v) {
        if (v === null || v === undefined) { return "null"; }
        if (v instanceof Array) { var a = []; for (var i = 0; i < v.length; i++) { a.push(js(v[i])); } return "[" + a.join(",") + "]"; }
        if (typeof v === "number") { return isFinite(v) ? String(v) : "null"; }
        if (typeof v === "boolean") { return v ? "true" : "false"; }
        if (typeof v === "object") { var o = []; for (var k in v) { o.push(q(k) + ":" + js(v[k])); } return "{" + o.join(",") + "}"; }
        return q(v);
    }
    var f = new File(outDir.fsName + "/lab_c3d.json");
    f.encoding = "UTF-8"; f.open("w"); f.write(js({ ae: app.version, comps: manifest })); f.close();
    return { comps: manifest.length };
})();
