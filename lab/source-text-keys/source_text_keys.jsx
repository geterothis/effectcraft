// Builds source_text_keys.aep: a text layer whose Source Text is keyed (text, size, colour change),
// so the EffectCraft reader can learn how After Effects stores Source Text keyframes.
// ONE headless AE 2026 instance. Writes next to this script.
(function () {
    var outDir = (typeof OUT_DIR !== "undefined") ? OUT_DIR : File($.fileName).parent.fsName;
    var comp = app.project.items.addComp("C", 1280, 720, 1, 4, 25);
    var layer = comp.layers.addText("Alpha");
    var st = layer.property("ADBE Text Properties").property("ADBE Text Document");
    function doc(text, size, color, bold) {
        var d = st.value;
        d.text = text; d.fontSize = size; d.fillColor = color; d.applyFill = true;
        return d;
    }
    st.setValueAtTime(0, doc("Alpha", 60, [1, 0, 0], false));
    st.setValueAtTime(1, doc("Beta two", 90, [0, 1, 0], false));
    st.setValueAtTime(2.5, doc("Gamma\rthree lines\rhere", 40, [0, 0, 1], false));
    var rep = [];
    for (var i = 1; i <= st.numKeys; i++) {
        var v = st.keyValue(i);
        rep.push({ t: st.keyTime(i), text: v.text, size: v.fontSize, color: v.fillColor, font: v.font, inI: st.keyInInterpolationType(i), outI: st.keyOutInterpolationType(i) });
    }
    // A second layer: one key only, plus a static text layer for comparison.
    var l2 = comp.layers.addText("Static");
    var l3 = comp.layers.addText("One");
    var st3 = l3.property("ADBE Text Properties").property("ADBE Text Document");
    st3.setValueAtTime(0.5, st3.value);
    app.project.save(new File(outDir + "/source_text_keys.aep"));
    var f = new File(outDir + "/source_text_keys.json");
    f.encoding = "UTF-8"; f.open("w"); f.write(rep.toSource()); f.close();
})();
