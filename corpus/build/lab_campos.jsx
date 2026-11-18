// Lab: where After Effects 2026 stores a camera's Position (lab_c3d stores no "ADBE Position" record for
// its cameras, only zero Position_0/1/2, yet renders them at (w/2, h/2, -1000)).
// Convention as lab_c3d.jsx: empty project, LAB_OUT set, $.evalFile() this script; it fills the project,
// saves it as LAB_OUT/lab_campos.aep, closes it, reopens it and writes LAB_OUT/lab_campos.json with each
// camera's read-back Position, Point of Interest, Zoom and autoOrient. No renders needed.
(function () {
    var outDir = new Folder(LAB_OUT); if (!outDir.exists) { outDir.create(); }
    function tr(l) { return l.property("ADBE Transform Group"); }
    function zoom(l, z) { l.property("ADBE Camera Options Group").property("ADBE Camera Zoom").setValue(z); }
    // name, centre point (POI), one-node?, position to set (null = leave), zoom to set (null = leave), order
    var cases = [
        ["c1_as_lab", [200, 100], true, [200, 100, -1000], 1000, "pos_then_zoom"],
        ["c2_offset", [200, 100], true, [50, 30, -700], 1000, "pos_then_zoom"],
        ["c3_zoom800", [200, 100], true, [200, 100, -1000], 800, "pos_then_zoom"],
        ["c4_poi_off_centre", [100, 50], true, [100, 50, -1000], 1000, "pos_then_zoom"],
        ["c5_zoom_then_pos", [200, 100], true, [200, 100, -1000], 1000, "zoom_then_pos"],
        ["c6_two_node", [200, 100], false, [200, 100, -1000], 1000, "pos_then_zoom"],
        ["c7_untouched", [200, 100], true, null, null, "none"],
        ["c8_zoom_only", [200, 100], true, null, 1000, "zoom_only"]
    ];
    for (var i = 0; i < cases.length; i++) {
        var k = cases[i];
        var c = app.project.items.addComp(k[0], 400, 200, 1, 1, 25);
        c.renderer = "ADBE Advanced 3d";
        var cam = c.layers.addCamera("CAM", k[1]);
        if (k[2]) { cam.autoOrient = AutoOrientType.NO_AUTO_ORIENT; }
        if (k[5] === "zoom_then_pos") { zoom(cam, k[4]); tr(cam).property("ADBE Position").setValue(k[3]); }
        else {
            if (k[3]) { tr(cam).property("ADBE Position").setValue(k[3]); }
            if (k[4]) { zoom(cam, k[4]); }
        }
    }
    var f = new File(LAB_OUT + "/lab_campos.aep");
    app.project.save(f);
    app.project.close(CloseOptions.DO_NOT_SAVE_CHANGES);
    var p = app.open(f), out = [];
    for (var j = 1; j <= p.numItems; j++) {
        var it = p.item(j); if (!(it instanceof CompItem)) { continue; }
        var l = it.layer("CAM");
        out.push('{"comp":"' + it.name + '","position":[' + tr(l).property("ADBE Position").value + '],"poi":[' +
            tr(l).property("ADBE Anchor Point").value + '],"zoom":' + l.property("ADBE Camera Options Group").property("ADBE Camera Zoom").value +
            ',"autoOrient":' + l.autoOrient + '}');
    }
    var o = new File(LAB_OUT + "/lab_campos.json"); o.encoding = "UTF-8"; o.open("w");
    o.write('{"ae":"' + app.version + '","cameras":[' + out.join(",") + ']}'); o.close();
})();
