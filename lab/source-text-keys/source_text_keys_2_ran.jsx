// Two more Source Text samples to see how After Effects shares text documents between layers.
// a) source_text_one_layer.aep: ONE text layer with keys "A1" (0 s) -> "A2" (1 s).
// b) source_text_two_layers.aep: layer "P" keyed "P1" (0 s) -> "P2" (1 s) -> "P3" (2 s), created
//    first; layer "Q" keyed "Q1" (0 s) -> "Q2" (1.5 s), created second.
// Each in its own new project (the harness opens an empty project per part if needed).
(function () {
    var dir = (typeof OUT_DIR !== "undefined") ? OUT_DIR : File($.fileName).parent.fsName;
    var PART = ($.global.PART !== undefined) ? $.global.PART : "a"; // the local var shadowed the global PART (always "a")
    var comp = app.project.items.addComp("C", 640, 360, 1, 3, 25);
    function keyed(name, keys) {
        var l = comp.layers.addText(name);
        var st = l.property("ADBE Text Properties").property("ADBE Text Document");
        for (var i = 0; i < keys.length; i++) { var d = st.value; d.text = keys[i][1]; st.setValueAtTime(keys[i][0], d); }
        return l;
    }
    if (PART === "a") {
        keyed("A", [[0, "A1"], [1, "A2"]]);
        app.project.save(new File(dir + "/source_text_one_layer.aep"));
    } else {
        keyed("P", [[0, "P1"], [1, "P2"], [2, "P3"]]);
        keyed("Q", [[0, "Q1"], [1.5, "Q2"]]);
        app.project.save(new File(dir + "/source_text_two_layers.aep"));
    }
})();
