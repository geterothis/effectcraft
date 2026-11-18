// Imports layers_200x100.psd (generated, 3 layers) three ways and saves psd_layers.aep, so the
// EffectCraft exporter can learn how After Effects stores one layer of a Photoshop file.
// ONE headless AE 2026 instance. Writes next to this script.
(function () {
    var dir = (typeof OUT_DIR !== "undefined") ? OUT_DIR : File($.fileName).parent.fsName;
    var psd = new File(dir + "/layers_200x100.psd");
    var rep = { items: [] };
    function imp(asType, label) {
        var o = new ImportOptions(psd);
        try { o.importAs = asType; } catch (e) { rep[label] = "importAs failed: " + e; return; }
        try { var it = app.project.importFile(o); rep[label] = it ? it.name : null; } catch (e2) { rep[label] = "import failed: " + e2; }
    }
    imp(ImportAsType.FOOTAGE, "merged");
    imp(ImportAsType.COMP_CROPPED_LAYERS, "croppedLayers"); // ExtendScript enum name (COMPOSITION_CROPPED_LAYERS does not exist)
    imp(ImportAsType.COMP, "documentLayers"); // ExtendScript enum name (COMPOSITION does not exist)
    for (var i = 1; i <= app.project.numItems; i++) {
        var it = app.project.item(i);
        var e = { index: i, name: it.name, type: it.typeName, parent: it.parentFolder ? it.parentFolder.name : null };
        if (it instanceof FootageItem) { e.w = it.width; e.h = it.height; e.file = it.mainSource.file ? it.mainSource.file.name : null; e.alpha = String(it.mainSource.alphaMode); }
        if (it instanceof CompItem) {
            e.w = it.width; e.h = it.height; e.layers = [];
            for (var j = 1; j <= it.numLayers; j++) {
                var l = it.layer(j);
                e.layers.push({ name: l.name, src: l.source ? l.source.name : null, pos: l.property("ADBE Transform Group").property("ADBE Position").value, anchor: l.property("ADBE Transform Group").property("ADBE Anchor Point").value });
            }
        }
        rep.items.push(e);
    }
    app.project.save(new File(dir + "/psd_layers.aep"));
    var f = new File(dir + "/psd_layers.json"); f.encoding = "UTF-8"; f.open("w"); f.write(rep.toSource()); f.close();
})();
