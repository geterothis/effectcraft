// Builds lab/expr-clamp: comp X 100x100 with C1 (Tint amount expr 150), C2 (Gaussian Blur blurriness expr -20),
// C3 (Slider expr 2000000), O (Opacity expr 150). Records value / valueAtTime(0) and expression errors.
(function () {
    if (!app.project.file || app.project.file.name !== "expr_clamp.aep" || app.project.numItems > 0) throw new Error("wrong project");
    var D = app.project.file.parent.fsName + "/";
    var c = app.project.items.addComp("X", 100, 100, 1, 1, 25);
    function C() { for (var i = 1; i <= app.project.numItems; i++) { var it = app.project.item(i); if (it instanceof CompItem && it.name === "X") return it; } return null; }
    var cases = [["O", [0.2, 0.6, 1], null, null, "150"], ["C3", [0.5, 0.5, 0.5], "ADBE Slider Control", "ADBE Slider Control-0001", "2000000"],
                 ["C2", [1, 0.8, 0.1], "ADBE Gaussian Blur 2", "ADBE Gaussian Blur 2-0001", "-20"], ["C1", [0.9, 0.2, 0.2], "ADBE Tint", "ADBE Tint-0003", "150"]];
    var out = { ae: app.version, comp: { w: 100, h: 100, fps: 25, duration: 1 }, layers: [], notes: [] };
    for (var i = 0; i < cases.length; i++) {
        var k = cases[i];
        var L = C().layers.addSolid(k[1], k[0], 100, 100, 1); L.name = k[0];
        if (k[0] === "O") { C().layer("O").property("ADBE Transform Group").property("ADBE Opacity").setValue(50); }
        else { C().layer(k[0]).property("ADBE Transform Group").property("ADBE Scale").setValue([60, 60]); }
        var p;
        if (k[2]) { C().layer(k[0]).property("ADBE Effect Parade").addProperty(k[2]); p = C().layer(k[0]).property("ADBE Effect Parade").property(k[2]).property(k[3]); }
        else p = C().layer(k[0]).property("ADBE Transform Group").property("ADBE Opacity");
        p.expression = k[4];
    }
    // place layers apart so all are visible
    var pos = { "C1": [25, 25], "C2": [75, 25], "C3": [25, 75] };
    for (var n in pos) { if (pos.hasOwnProperty(n)) C().layer(n).property("ADBE Transform Group").property("ADBE Position").setValue(pos[n]); }
    for (var j = 0; j < cases.length; j++) {
        var q = cases[j], pp;
        if (q[2]) pp = C().layer(q[0]).property("ADBE Effect Parade").property(q[2]).property(q[3]);
        else pp = C().layer(q[0]).property("ADBE Transform Group").property("ADBE Opacity");
        var vt = pp.valueAtTime(0, false), pre = pp.valueAtTime(0, true);
        out.layers.push({ layer: q[0], effect: q[2], property: pp.name, matchName: pp.matchName, expression: q[4],
            valueAtTime0: vt, preExpressionValue: pre, value: pp.value, expressionError: pp.expressionError,
            hasMax: pp.hasMax, hasMin: pp.hasMin, maxValue: pp.hasMax ? pp.maxValue : null, minValue: pp.hasMin ? pp.minValue : null });
    }
    app.project.save();
    var f = new File(D + "expr_clamp.json"); f.encoding = "UTF-8"; f.open("w"); f.write(JSON.stringify(out, null, 1)); f.close();
    return out;
})();
