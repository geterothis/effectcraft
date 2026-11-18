// Lab: how After Effects 2026's Classic 3D depth of field scales (lab_c3d d02 blurs about 9-10x less than
// EffectCraft at the same Aperture). Convention as lab_c3d.jsx: empty project, LAB_OUT set, $.evalFile();
// it fills the project, queues one frame-0 PNG per comp (Best Settings), saves in place. Render with ONE
// aerender instance afterwards. Each comp: black, Classic 3D, one-node camera at (w/2, h/2, -zoom) looking
// along +z, focus = zoom, and two white 200x200 3D solids, one at z = +zoom (twice the focus distance) left
// of centre and one at z = -zoom/2 right of centre. Measure the alpha edge widths.
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
    // name, width, height, zoom, aperture, blur level
    var cases = [
        ["f1_w1200_z1000_a400", 1200, 300, 1000, 400, 100],
        ["f2_w1920_z1000_a400", 1920, 300, 1000, 400, 100],
        ["f3_w600_z1000_a400", 600, 300, 1000, 400, 100],
        ["f4_w1200_z2000_a400", 1200, 300, 2000, 400, 100],
        ["f5_w1200_z1000_a400_bl50", 1200, 300, 1000, 400, 50],
        ["f6_w1200_z1000_a200", 1200, 300, 1000, 200, 100]
    ];
    for (var i = 0; i < cases.length; i++) {
        var k = cases[i], w = k[1], h = k[2], z = k[3];
        try {
            var c = app.project.items.addComp(k[0], w, h, 1, 1, 25);
            c.renderer = "ADBE Advanced 3d"; c.bgColor = [0, 0, 0];
            var far = c.layers.addSolid([1, 1, 1], "far", 200, 200, 1); far.threeDLayer = true;
            tr(far).property("ADBE Position").setValue([w / 2 - 250 * 2, h / 2, z]);
            var near = c.layers.addSolid([1, 1, 1], "near", 200, 200, 1); near.threeDLayer = true;
            tr(near).property("ADBE Position").setValue([w / 2 + 125, h / 2, -z / 2]);
            var cam = c.layers.addCamera("CAM", [w / 2, h / 2]);
            cam.autoOrient = AutoOrientType.NO_AUTO_ORIENT;
            var co = cam.property("ADBE Camera Options Group");
            co.property("ADBE Camera Zoom").setValue(z);
            tr(cam).property("ADBE Position").setValue([w / 2, h / 2, -z]);
            co.property("ADBE Camera Depth of Field").setValue(1);
            co.property("ADBE Camera Focus Distance").setValue(z);
            co.property("ADBE Camera Aperture").setValue(k[4]);
            if (k[5] !== 100) { try { co.property("ADBE Camera Blur Level").setValue(k[5]); } catch (eb) { cam.cameraOption.blurLevel.setValue(k[5]); } }
            var rqi = app.project.renderQueue.items.add(c);
            rqi.applyTemplate("Best Settings"); rqi.timeSpanStart = 0; rqi.timeSpanDuration = c.frameDuration;
            pngTemplate(rqi.outputModule(1));
            rqi.outputModule(1).file = new File(outDir.fsName + "/" + c.name + "_[#####].png");
            manifest.push('{"comp":"' + c.name + '","camPos":[' + tr(cam).property("ADBE Position").value + ']}');
        } catch (e) { manifest.push('{"comp":"' + k[0] + '","error":"' + String(e).replace(/"/g, "'") + '"}'); }
    }
    app.project.save();
    var f = new File(outDir.fsName + "/lab_dof2.json"); f.encoding = "UTF-8"; f.open("w");
    f.write('{"ae":"' + app.version + '","comps":[' + manifest.join(",") + ']}'); f.close();
    return { comps: manifest.length };
})();
