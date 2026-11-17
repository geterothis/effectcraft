// Full sweep of built-in effects: one comp per effect (default parameters),
// all comps of one category tiled in "<category>_contact". ES3, AE 24..26.
// Usage: SWEEP.build(categoryName, mediaDir, logPath) -> info
var SWEEP = {};

(function () {
    var VENDORS = ["ADBE", "CC ", "CS ", "CSRainfall", "CSSnowfall", "Keylight", "APC", "Mettle", "mochaAECC",
        "Cryptomatte", "EXtractoR", "IDentifier", "ISL", "VISINF", "Pseudo/ADBE"];
    SWEEP.CATEGORIES = ["Blur & Sharpen", "Channel", "Color Correction", "Distort", "Expression Controls", "Generate",
        "Keying", "Matte", "Noise & Grain", "Perspective", "Simulation", "Stylize", "Text", "Time", "Transition",
        "Utility", "Audio", "3D Channel", "Immersive Video", "Obsolete", "_Obsolete", "Boris FX Mocha"];

    function builtIn(mn) {
        for (var i = 0; i < VENDORS.length; i++) {
            if (mn.indexOf(VENDORS[i]) === 0) { return true; }
        }
        return false;
    }

    SWEEP.list = function (category) {
        var out = [];
        for (var i = 0; i < app.effects.length; i++) {
            var e = app.effects[i];
            if (e.category === category && builtIn(e.matchName)) {
                out.push({ name: e.displayName, mn: e.matchName });
            }
        }
        out.sort(function (a, b) { return a.name < b.name ? -1 : (a.name > b.name ? 1 : 0); });
        return out;
    };

    function safe(s) { return s.replace(/[^A-Za-z0-9]+/g, "_").replace(/^_+|_+$/g, ""); }

    function log(path, msg) {
        if (!path) { return; }
        var f = new File(path);
        f.encoding = "UTF-8";
        f.open("a");
        f.writeln(msg);
        f.close();
    }

    function sourceComp(M) {
        var src = app.project.items.addComp("SWEEP_SOURCE", 320, 180, 1, 2, 30);
        var plate = app.project.importFile(new ImportOptions(new File(M + "/plate_1280x720.jpg")));
        var grid = app.project.importFile(new ImportOptions(new File(M + "/grid_rgba.png")));
        var p = src.layers.add(plate);
        p.property("ADBE Transform Group").property("ADBE Scale").setValue([25, 25]);
        var g = src.layers.add(grid);
        var gt = g.property("ADBE Transform Group");
        gt.property("ADBE Scale").setValue([20, 20]);
        var pos = gt.property("ADBE Position");
        pos.setValueAtTime(0, [80, 90]);
        pos.setValueAtTime(2, [240, 90]);
        gt.property("ADBE Rotate Z").setValueAtTime(0, 0);
        gt.property("ADBE Rotate Z").setValueAtTime(2, 90);
        return src;
    }

    SWEEP.build = function (category, M, logPath) {
        var list = SWEEP.list(category);
        var src = sourceComp(M);
        var wav = null;
        if (category === "Audio") {
            wav = app.project.importFile(new ImportOptions(new File(M + "/chord_stereo_48k.wav")));
        }
        var folder = app.project.items.addFolder("effects");
        var comps = [], results = [];
        for (var i = 0; i < list.length; i++) {
            var e = list[i];
            var c = app.project.items.addComp("fx_" + safe(e.name), 320, 180, 1, 2, 30);
            c.parentFolder = folder;
            var L = c.layers.add(src);
            L.name = "SRC";
            var target = L;
            if (wav) { target = c.layers.add(wav); target.name = "AUDIO"; }
            log(logPath, "ADD " + category + " | " + e.name + " | " + e.mn);
            var status = "ok";
            try {
                var parade = target.property("ADBE Effect Parade");
                if (!parade.canAddProperty(e.mn)) {
                    status = "cannot-add";
                } else {
                    var fx = parade.addProperty(e.mn);
                    if (!fx) { status = "null"; }
                }
            } catch (err) {
                status = "error: " + err.toString();
            }
            log(logPath, "  -> " + status);
            results.push({ effect: e.name, matchName: e.mn, comp: c.name, status: status });
            comps.push(c);
        }
        var cols = 6, rows = Math.max(1, Math.ceil(comps.length / cols));
        var contact = app.project.items.addComp(safe(category) + "_contact", 1920, rows * 180, 1, 2, 30);
        var bg = contact.layers.addSolid([0, 0, 0], "BG", 1920, rows * 180, 1);
        for (var j = 0; j < comps.length; j++) {
            var l = contact.layers.add(comps[j]);
            l.property("ADBE Transform Group").property("ADBE Position").setValue([(j % cols) * 320 + 160, Math.floor(j / cols) * 180 + 90]);
            var t = contact.layers.addText(comps[j].name.substr(3));
            var sp = t.property("ADBE Text Properties").property("ADBE Text Document");
            var td = sp.value;
            td.fontSize = 14;
            td.fillColor = [1, 1, 0.3];
            td.applyStroke = true;
            td.strokeColor = [0, 0, 0];
            td.strokeWidth = 2;
            td.justification = ParagraphJustification.LEFT_JUSTIFY;
            sp.setValue(td);
            t.property("ADBE Transform Group").property("ADBE Position").setValue([(j % cols) * 320 + 4, Math.floor(j / cols) * 180 + 16]);
        }
        bg.moveToEnd();
        return { main: contact.name, category: category, effects: results, count: results.length };
    };

    // Reference: one PNG frame at t=1s of the contact sheet + H.264 of it.
    SWEEP.queueRefs = function (info, outDir) {
        var rq = app.project.renderQueue;
        while (rq.numItems > 0) { rq.item(1).remove(); }
        new Folder(outDir).create();
        var contact = null;
        for (var i = 1; i <= app.project.numItems; i++) {
            if (app.project.item(i) instanceof CompItem && app.project.item(i).name === info.main) { contact = app.project.item(i); }
        }
        var it = rq.items.add(contact);
        it.applyTemplate("Best Settings");
        it.timeSpanStart = 1;
        it.timeSpanDuration = contact.frameDuration;
        CORPUS.pngTemplate(it.outputModule(1));
        it.outputModule(1).file = new File(outDir + "/" + contact.name + "_t1s_[#####].png");
        var it2 = rq.items.add(contact);
        it2.applyTemplate("Best Settings");
        it2.timeSpanStart = 0;
        it2.timeSpanDuration = contact.duration;
        it2.outputModule(1).applyTemplate("H.264 - Match Render Settings - 15 Mbps");
        it2.outputModule(1).file = new File(outDir + "/" + contact.name + ".mp4");
        return rq.numItems;
    };
})();
