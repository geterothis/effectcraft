// fx-samples (non-default parameter samples), adapted from the "Make unsupported effects portable" thread script.
// Changes vs the original:
//  - one project per run: the caller (ae_station new) creates the empty fx-nondefault-NN.aep, this script fills chunk
//    FXS_FILE and saves in place (app.newProject()/project.close() crash windowless AE);
//  - only built-in effects (Adobe / Cycore CC / Keylight / Mocha / Immersive), third-party plugins are left out;
//  - effects that open a modal dialog on apply are skipped (Numbers, Basic Text, Path Text, Apply Color LUT);
//  - frame 0 PNGs are queued in the render queue and rendered by aerender afterwards (see header of RENDER block);
//  - the effect list is sorted by category + matchName so chunk numbers are stable between runs.
// Inputs (globals set before $.evalFile): FXS_FILE (1-based chunk), FXS_OUT (output folder path).
(function () {
    var RENDER = true;
    var PER_FILE = 25;
    var SKIP = { "ADBE SubspaceStabilizer": 1, "ADBE 3D Tracker": 1, "ADBE FreePin3": 1, "ADBE Roto V2": 1,
        "ADBE Refine Edge": 1, "ADBE Cineware": 1, "ADBE Content Aware Fill": 1, "ADBE Ellipse Mask": 1,
        "ADBE Mocha AE": 1, "ADBE Rolling Shutter": 1, "ADBE Morph Cut": 1, "ADBE Face Track": 1,
        "ADBE Numbers2": 1, "ADBE Basic Text2": 1, "ADBE Path Text": 1, "ADBE Apply Color LUT2": 1, "ADBE Apply Color LUT": 1 };
    var VENDORS = ["ADBE", "CC ", "CS ", "CSRainfall", "CSSnowfall", "Keylight", "APC", "Mettle", "mochaAECC",
        "Cryptomatte", "EXtractoR", "IDentifier", "ISL", "VISINF", "Pseudo/ADBE"];
    var outDir = new Folder(FXS_OUT);
    if (!outDir.exists) { outDir.create(); }
    function q(s) { return '"' + String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/[\r\n\t]/g, " ") + '"'; }
    function js(v) {
        if (v === null || v === undefined) { return "null"; }
        if (v instanceof Array) { var a = []; for (var i = 0; i < v.length; i++) { a.push(js(v[i])); } return "[" + a.join(",") + "]"; }
        if (typeof v === "number") { return isFinite(v) ? String(v) : "null"; }
        if (typeof v === "boolean") { return v ? "true" : "false"; }
        if (typeof v === "object") { var o = []; for (var k in v) { o.push(q(k) + ":" + js(v[k])); } return "{" + o.join(",") + "}"; }
        return q(v);
    }
    function clamp(v, p) { if (p.hasMin && v < p.minValue) { v = p.minValue; } if (p.hasMax && v > p.maxValue) { v = p.maxValue; } return v; }
    function pick(p, w, h) {
        var t = p.propertyValueType, d = p.value;
        if (t === PropertyValueType.COLOR) { return [0.2, 0.4, 0.6, 1]; }
        if (t === PropertyValueType.TwoD_SPATIAL || t === PropertyValueType.TwoD) { return [w * 0.25, h * 0.75]; }
        if (t === PropertyValueType.ThreeD_SPATIAL || t === PropertyValueType.ThreeD) { return [w * 0.25, h * 0.75, 100]; }
        if (t !== PropertyValueType.OneD) { return null; }
        var dd = false; try { dd = p.isDropdownEffect; } catch (e) {}
        if (dd) { var n = 0; try { n = p.propertyParameters.length; } catch (e2) {} return d === 2 ? 1 : (n >= 2 || n === 0 ? 2 : null); }
        if (p.hasMin && p.hasMax && p.minValue === 0 && p.maxValue === 1 && (d === 0 || d === 1)) { return 1 - d; }
        var v;
        if (p.hasMin && p.hasMax && (p.maxValue - p.minValue) <= 1000) { v = p.minValue + (p.maxValue - p.minValue) * 0.37; }
        else { v = (d === 0 ? 3.25 : d * 0.5 + 1.25); }
        v = clamp(v, p);
        if (Math.abs(v - d) < 1e-6) { v = clamp(d + (p.hasMax && d + 1 > p.maxValue ? -1 : 1), p); }
        return v;
    }
    function walk(group, w, h, rows, prefix) {
        for (var i = 1; i <= group.numProperties; i++) {
            var p = group.property(i);
            if (p.propertyType === PropertyType.PROPERTY) {
                var r = { idx: prefix + i, matchName: p.matchName, name: p.name, type: String(p.propertyValueType) };
                try { r.min = p.hasMin ? p.minValue : null; r.max = p.hasMax ? p.maxValue : null; } catch (e0) {}
                try { r.isDropdown = p.isDropdownEffect; } catch (e1) {}
                if (p.propertyValueType === PropertyValueType.NO_VALUE || p.propertyValueType === PropertyValueType.CUSTOM_VALUE ||
                    p.propertyValueType === PropertyValueType.LAYER_INDEX || p.propertyValueType === PropertyValueType.MASK_INDEX) {
                    r.skipped = true; rows.push(r); continue;
                }
                try { r["default"] = p.value; } catch (e2) {}
                var v = null; try { v = pick(p, w, h); } catch (e3) {}
                if (v !== null) { try { p.setValue(v); r.set = v; } catch (e4) { r.error = String(e4); } }
                try { r.value = p.value; } catch (e5) {}
                rows.push(r);
            } else { walk(p, w, h, rows, prefix + i + "."); }
        }
    }
    function pngTemplate(om) {
        var names = ["PSD_to_PNG_Export", "PNG Sequence"];
        for (var i = 0; i < names.length; i++) {
            try { om.applyTemplate(names[i]); if (om.getSettings(GetSettingsFormat.STRING)["Format"] === "PNG Sequence") { return; } } catch (e) {}
        }
        throw new Error("no PNG sequence output template");
    }
    function builtIn(mn) { for (var i = 0; i < VENDORS.length; i++) { if (mn.indexOf(VENDORS[i]) === 0) { return true; } } return false; }
    var list = [];
    for (var i = 0; i < app.effects.length; i++) {
        var e = app.effects[i];
        if (SKIP[e.matchName] || !e.category || !builtIn(e.matchName)) { continue; }
        list.push({ matchName: e.matchName, displayName: e.displayName, category: e.category });
    }
    list.sort(function (a, b) { var x = a.category + "|" + a.matchName, y = b.category + "|" + b.matchName; return x < y ? -1 : (x > y ? 1 : 0); });
    var total = Math.ceil(list.length / PER_FILE);
    var fileNo = FXS_FILE;
    var tag = (fileNo < 10 ? "0" : "") + fileNo;
    var log = new File(outDir.fsName + "/progress.log");
    function note(t) { log.open("a"); log.writeln(t); log.close(); }
    app.beginSuppressDialogs();
    var manifest = [];
    var s = (fileNo - 1) * PER_FILE;
    for (var k = s; k < Math.min(s + PER_FILE, list.length); k++) {
        var fx = list[k];
        note(tag + " " + k + " " + fx.matchName);
        var entry = { matchName: fx.matchName, displayName: fx.displayName, category: fx.category, params: [] };
        try {
            var comp = app.project.items.addComp("fx|" + fx.matchName, 1920, 1080, 1, 2, 25);
            var L = comp.layers.addSolid([1, 0, 0], "L", 1920, 1080, 1);
            var G = L.property("ADBE Effect Parade").addProperty("ADBE Ramp");
            G.property("ADBE Ramp-0001").setValue([0, 0]);
            G.property("ADBE Ramp-0003").setValue([1920, 1080]);
            var inst = L.property("ADBE Effect Parade").addProperty(fx.matchName);
            entry.instanceName = inst.name;
            walk(inst, 1920, 1080, entry.params, "");
            if (RENDER) {
                // queued for aerender instead of comp.saveFrameToPng: the async in-process render crashed the AE
                // instance (file 02, ADBE Calculations/Channel Combiner range), aerender isolates such crashes
                var png = "fx-nondefault-" + tag + "-" + (k - s + 1);
                try {
                    var rqi = app.project.renderQueue.items.add(comp);
                    rqi.applyTemplate("Best Settings");
                    rqi.timeSpanStart = 0;
                    rqi.timeSpanDuration = comp.frameDuration;
                    pngTemplate(rqi.outputModule(1));
                    rqi.outputModule(1).file = new File(outDir.fsName + "/" + png + "_[#####].png");
                    entry.png = png + ".png";
                } catch (er) { entry.renderError = String(er); }
            }
        } catch (err) { entry.error = String(err); }
        manifest.push(entry);
    }
    app.endSuppressDialogs(false);
    app.project.save();
    var f = new File(outDir.fsName + "/fx-nondefault-" + tag + ".json");
    f.encoding = "UTF-8"; f.open("w"); f.write(js({ ae: app.version, file: fileNo, of: total, effects: manifest })); f.close();
    note("FILE " + tag + " DONE (" + manifest.length + " effects), total files " + total + ", total effects " + list.length);
    return { file: fileNo, of: total, effects: manifest.length, listTotal: list.length };
})();
