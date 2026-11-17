// EffectCraft .aep test corpus builder (ES3 ExtendScript, AE 24.x .. 26.x).
// Every builder fills the CURRENT (empty) project and returns
// {main: "<comp to render>", refs: [comp names for single-frame refs], tests: [...]}.
// Warnings (a property that could not be set in this AE version) go to CORPUS.warnings.

var CORPUS = { warnings: [] };

(function () {
    var W = 960, H = 540, FPS = 30, DUR = 3;

    function warn(msg) { CORPUS.warnings.push(msg); }

    function folder(name) { return app.project.items.addFolder(name); }

    function comp(name, w, h, dur, fps, par) {
        return app.project.items.addComp(name, w || W, h || H, par || 1, dur || DUR, fps || FPS);
    }

    function imp(path, asComp) {
        var f = new File(path);
        if (!f.exists) { throw new Error("missing media " + path); }
        var io = new ImportOptions(f);
        if (asComp) { io.importAs = ImportAsType.COMP; }
        return app.project.importFile(io);
    }

    function impSeq(path) {
        var io = new ImportOptions(new File(path));
        io.sequence = true;
        io.forceAlphabetical = true;
        return app.project.importFile(io);
    }

    // set property by matchName or name path: P(group, "a", "b", ...)
    function P(group) {
        var p = group;
        for (var i = 1; i < arguments.length; i++) {
            if (!p) { return null; }
            p = p.property(arguments[i]);
        }
        return p;
    }

    function S(group, name, value, label) {
        try {
            var p = group.property(name);
            if (!p) { warn((label || "") + " no property " + name); return null; }
            p.setValue(value);
            return p;
        } catch (e) {
            warn((label || "") + " set " + name + ": " + e.toString());
            return null;
        }
    }

    function keys(prop, list, interp) {
        // list: [[t, v], ...]
        for (var i = 0; i < list.length; i++) { prop.setValueAtTime(list[i][0], list[i][1]); }
        if (interp) {
            for (var k = 1; k <= prop.numKeys; k++) { prop.setInterpolationTypeAtKey(k, interp, interp); }
        }
        return prop;
    }

    function easeAll(prop, influence) {
        var dims = 1;
        if (prop.propertyValueType === PropertyValueType.TwoD) { dims = 2; }
        if (prop.propertyValueType === PropertyValueType.ThreeD) { dims = 3; }
        if (prop.propertyValueType === PropertyValueType.TwoD_SPATIAL ||
            prop.propertyValueType === PropertyValueType.ThreeD_SPATIAL) { dims = 1; }
        for (var k = 1; k <= prop.numKeys; k++) {
            var e = [];
            for (var d = 0; d < dims; d++) { e.push(new KeyframeEase(0, influence)); }
            prop.setTemporalEaseAtKey(k, e, e);
        }
    }

    function tr(layer) { return layer.property("ADBE Transform Group"); }

    function bg(c, color, name) {
        var l = c.layers.addSolid(color || [0.12, 0.12, 0.14], name || "BG", c.width, c.height, 1);
        l.moveToEnd();
        return l;
    }

    // ---------- shape helpers ----------
    function shapeLayer(c, name) {
        var l = c.layers.addShape();
        l.name = name;
        return l;
    }
    function group(parentVectors, name) {
        var g = parentVectors.addProperty("ADBE Vector Group");
        g.name = name;
        return g;
    }
    function contents(g) { return g.property("ADBE Vectors Group"); }
    function rootVec(l) { return l.property("ADBE Root Vectors Group"); }
    function gpos(g, v) { S(g.property("ADBE Vector Transform Group"), "ADBE Vector Position", v, g.name); }
    function fill(vec, color) {
        var f = vec.addProperty("ADBE Vector Graphic - Fill");
        S(f, "ADBE Vector Fill Color", color);
        return f;
    }
    function stroke(vec, color, width) {
        var s = vec.addProperty("ADBE Vector Graphic - Stroke");
        S(s, "ADBE Vector Stroke Color", color);
        S(s, "ADBE Vector Stroke Width", width);
        return s;
    }
    function rect(vec, size, round) {
        var r = vec.addProperty("ADBE Vector Shape - Rect");
        S(r, "ADBE Vector Rect Size", size);
        if (round) { S(r, "ADBE Vector Rect Roundness", round); }
        return r;
    }
    function ellipse(vec, size) {
        var e = vec.addProperty("ADBE Vector Shape - Ellipse");
        S(e, "ADBE Vector Ellipse Size", size);
        return e;
    }
    function star(vec, type, pts, outer, inner) {
        var s = vec.addProperty("ADBE Vector Shape - Star");
        S(s, "ADBE Vector Star Type", type);
        S(s, "ADBE Vector Star Points", pts);
        S(s, "ADBE Vector Star Outer Radius", outer);
        if (type === 1) { S(s, "ADBE Vector Star Inner Radius", inner); }
        return s;
    }
    function pathShape(verts, inT, outT, closed) {
        var sh = new Shape();
        sh.vertices = verts;
        if (inT) { sh.inTangents = inT; }
        if (outT) { sh.outTangents = outT; }
        sh.closed = closed;
        return sh;
    }
    function path(vec, shape) {
        var p = vec.addProperty("ADBE Vector Shape - Group");
        p.property("ADBE Vector Shape").setValue(shape);
        return p;
    }
    function addMod(vec, matchName, label) {
        try { return vec.addProperty(matchName); } catch (e) { warn(label + " add " + matchName + ": " + e.toString()); return null; }
    }

    // ---------- text helper ----------
    function textLayer(c, str, font, size, color, pos, just) {
        var l = c.layers.addText(str);
        var sp = l.property("ADBE Text Properties").property("ADBE Text Document");
        var td = sp.value;
        td.resetCharStyle();
        try { td.font = font; } catch (e) { warn("font " + font + ": " + e.toString()); }
        td.fontSize = size;
        td.applyFill = true;
        td.fillColor = color;
        td.justification = just || ParagraphJustification.CENTER_JUSTIFY;
        sp.setValue(td);
        if (pos) { tr(l).property("ADBE Position").setValue(pos); }
        return l;
    }

    function fx(layer, matchName, params, label) {
        var parade = layer.property("ADBE Effect Parade");
        if (!parade.canAddProperty(matchName)) { warn((label || "") + " effect not available: " + matchName); return null; }
        var e = parade.addProperty(matchName);
        if (params) {
            for (var k in params) {
                if (params.hasOwnProperty(k)) { S(e, k, params[k], matchName); }
            }
        }
        return e;
    }

    var B = {};

    // 01 -----------------------------------------------------------------
    B.solids_nulls_adjustment = function (M) {
        var c = comp("solids_nulls_adjustment");
        bg(c, [0.1, 0.1, 0.12]);
        var red = c.layers.addSolid([0.9, 0.2, 0.2], "Solid_red_400x300", 400, 300, 1);
        tr(red).property("ADBE Position").setValue([300, 270]);
        var blue = c.layers.addSolid([0.2, 0.4, 0.95], "Solid_blue_half_opacity", 300, 300, 1);
        tr(blue).property("ADBE Position").setValue([620, 270]);
        tr(blue).property("ADBE Opacity").setValue(50);
        var odd = c.layers.addSolid([0.95, 0.85, 0.2], "Solid_nonsquare_par2", 100, 100, 2);
        tr(odd).property("ADBE Position").setValue([480, 460]);
        var n = c.layers.addNull(DUR);
        n.name = "NULL_ctrl";
        tr(n).property("ADBE Position").setValue([480, 270]);
        keys(tr(n).property("ADBE Rotate Z"), [[0, 0], [3, 30]]);
        red.parent = n;
        var adj = c.layers.addSolid([1, 1, 1], "ADJ_hue_blur", W, H, 1);
        adj.adjustmentLayer = true;
        fx(adj, "ADBE HUE SATURATION", { "Master Hue": 60 }, "adj");
        fx(adj, "ADBE Gaussian Blur 2", { "Blurriness": 4 }, "adj");
        var am = adj.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
        am.property("ADBE Mask Shape").setValue(pathShape([[480, 0], [960, 0], [960, 540], [480, 540]], null, null, true));
        // switches
        var off = c.layers.addSolid([0, 1, 0], "Solid_disabled_should_not_render", W, H, 1);
        off.enabled = false;
        var guide = c.layers.addSolid([1, 0, 1], "Solid_guide_layer_not_rendered", 200, 200, 1);
        guide.guideLayer = true;
        var shy = c.layers.addSolid([0.3, 0.9, 0.9], "Solid_shy_trimmed_1s_to_2s", 160, 90, 1);
        shy.shy = true;
        shy.inPoint = 1;
        shy.outPoint = 2;
        tr(shy).property("ADBE Position").setValue([820, 80]);
        shy.label = 9;
        shy.comment = "shy layer, label 9, visible only 1s..2s";
        var lockd = c.layers.addSolid([1, 0.5, 0], "Solid_locked_rot45", 80, 80, 1);
        tr(lockd).property("ADBE Position").setValue([120, 80]);
        tr(lockd).property("ADBE Rotate Z").setValue(45);
        lockd.locked = true;
        var sol = c.layers.addSolid([0.5, 0.5, 0.5], "Solid_solo_off_quality_draft", 60, 60, 1);
        sol.quality = LayerQuality.DRAFT;
        tr(sol).property("ADBE Position").setValue([900, 500]);
        c.bgColor = [0.2, 0.0, 0.2];
        return { main: c.name, refs: [], tests: ["solid layers incl. non-square PAR", "null parent with rotation keys", "adjustment layer with masked effects", "disabled/guide/shy/locked/draft switches", "in/out trim", "layer label + comment", "comp background color"] };
    };

    // 02 -----------------------------------------------------------------
    B.shapes_basic = function (M) {
        var c = comp("shapes_basic");
        bg(c);
        var l = shapeLayer(c, "SHAPES_primitives");
        var rv = rootVec(l);
        var g1 = group(rv, "rect_round_fill_stroke");
        rect(contents(g1), [200, 120], 24);
        stroke(contents(g1), [1, 1, 1], 6);
        fill(contents(g1), [0.9, 0.3, 0.3]);
        gpos(g1, [-330, -150]);
        var g2 = group(rv, "ellipse_fill");
        ellipse(contents(g2), [160, 160]);
        fill(contents(g2), [0.3, 0.8, 0.4]);
        gpos(g2, [-100, -150]);
        var g3 = group(rv, "star_5");
        star(contents(g3), 1, 5, 90, 40);
        fill(contents(g3), [1, 0.85, 0.2]);
        gpos(g3, [120, -150]);
        var g4 = group(rv, "polygon_6_stroke_only");
        star(contents(g4), 2, 6, 80, 0);
        var s4 = stroke(contents(g4), [0.3, 0.6, 1], 10);
        S(s4, "ADBE Vector Stroke Line Join", 2);
        gpos(g4, [330, -150]);
        var g5 = group(rv, "bezier_path_open_dashed");
        path(contents(g5), pathShape([[-150, 0], [0, -60], [150, 0]], [[0, 0], [-60, 0], [0, 0]], [[0, 0], [60, 0], [0, 0]], false));
        var s5 = stroke(contents(g5), [1, 0.5, 0.9], 8);
        S(s5, "ADBE Vector Stroke Line Cap", 2);
        try {
            var d = s5.property("ADBE Vector Stroke Dashes");
            d.addProperty("ADBE Vector Stroke Dash 1").setValue(20);
            d.addProperty("ADBE Vector Stroke Gap 1").setValue(12);
        } catch (e) { warn("dashes: " + e.toString()); }
        gpos(g5, [-300, 80]);
        var g6 = group(rv, "linear_gradient_fill");
        rect(contents(g6), [220, 140], 0);
        var gf = addMod(contents(g6), "ADBE Vector Graphic - G-Fill", "gfill");
        if (gf) {
            S(gf, "ADBE Vector Grad Type", 1);
            S(gf, "ADBE Vector Grad Start Pt", [-110, 0]);
            S(gf, "ADBE Vector Grad End Pt", [110, 0]);
        }
        gpos(g6, [0, 80]);
        var g7 = group(rv, "radial_gradient_fill_gradient_stroke");
        ellipse(contents(g7), [180, 180]);
        var gs = addMod(contents(g7), "ADBE Vector Graphic - G-Stroke", "gstroke");
        if (gs) { S(gs, "ADBE Vector Stroke Width", 14); }
        var gf2 = addMod(contents(g7), "ADBE Vector Graphic - G-Fill", "gfill2");
        if (gf2) {
            S(gf2, "ADBE Vector Grad Type", 2);
            S(gf2, "ADBE Vector Grad Start Pt", [0, 0]);
            S(gf2, "ADBE Vector Grad End Pt", [90, 0]);
        }
        gpos(g7, [300, 80]);
        // nested group with its own transform + animated rect size
        var g8 = group(rv, "nested_group_anim");
        var inner = group(contents(g8), "inner");
        var r8 = rect(contents(inner), [60, 60], 0);
        keys(r8.property("ADBE Vector Rect Size"), [[0, [40, 40]], [1.5, [140, 40]], [3, [40, 40]]]);
        fill(contents(inner), [0.2, 0.9, 0.9]);
        S(g8.property("ADBE Vector Transform Group"), "ADBE Vector Rotation", 20);
        S(g8.property("ADBE Vector Transform Group"), "ADBE Vector Group Opacity", 70);
        gpos(g8, [0, 220]);
        // fill rule + stroke over fill order
        var g9 = group(rv, "even_odd_fill_two_paths");
        ellipse(contents(g9), [140, 140]);
        ellipse(contents(g9), [70, 70]);
        var f9 = fill(contents(g9), [0.8, 0.5, 1]);
        S(f9, "ADBE Vector Fill Rule", 2);
        gpos(g9, [-330, 220]);
        return { main: c.name, refs: [], tests: ["rect/ellipse/star/polygon/bezier path", "fill + stroke, joins, caps", "dashes", "linear & radial gradient fill (default white-black colors)", "gradient stroke", "nested groups with transform & opacity", "even-odd fill rule", "animated rect size"] };
    };

    // 03 -----------------------------------------------------------------
    B.shapes_modifiers = function (M) {
        var c = comp("shapes_modifiers");
        bg(c);
        function cell(name, x, y, build) {
            var l = shapeLayer(c, name);
            tr(l).property("ADBE Position").setValue([x, y]);
            var g = group(rootVec(l), "g");
            build(contents(g), l);
            return l;
        }
        cell("MOD_repeater", 160, 140, function (v) {
            rect(v, [30, 30], 4);
            fill(v, [1, 0.4, 0.3]);
            var r = addMod(v, "ADBE Vector Filter - Repeater", "repeater");
            if (r) {
                S(r, "ADBE Vector Repeater Copies", 6);
                var rt = r.property("ADBE Vector Repeater Transform");
                S(rt, "ADBE Vector Repeater Position", [0, 0]);
                S(rt, "ADBE Vector Repeater Rotation", 60);
                S(rt, "ADBE Vector Repeater Anchor", [0, 50]);
                S(rt, "ADBE Vector Repeater Opacity 2", 20);
                keys(r.property("ADBE Vector Repeater Offset"), [[0, 0], [3, 3]]);
            }
        });
        cell("MOD_trim_paths_anim", 400, 140, function (v) {
            ellipse(v, [160, 160]);
            stroke(v, [0.3, 0.9, 1], 12);
            var t = addMod(v, "ADBE Vector Filter - Trim", "trim");
            if (t) {
                keys(t.property("ADBE Vector Trim End"), [[0, 0], [2, 100]]);
                keys(t.property("ADBE Vector Trim Offset"), [[0, 0], [3, 180]]);
            }
        });
        cell("MOD_offset_paths", 640, 140, function (v) {
            star(v, 1, 5, 60, 30);
            stroke(v, [1, 1, 0.3], 4);
            var o = addMod(v, "ADBE Vector Filter - Offset", "offset");
            if (o) { keys(o.property("ADBE Vector Offset Amount"), [[0, 0], [3, 20]]); }
        });
        cell("MOD_twist", 860, 140, function (v) {
            rect(v, [120, 120], 0);
            fill(v, [0.6, 0.4, 1]);
            var t = addMod(v, "ADBE Vector Filter - Twist", "twist");
            if (t) { S(t, "ADBE Vector Twist Angle", 120); }
        });
        cell("MOD_zigzag", 160, 380, function (v) {
            ellipse(v, [150, 150]);
            stroke(v, [0.4, 1, 0.5], 4);
            var z = addMod(v, "ADBE Vector Filter - Zigzag", "zigzag");
            if (z) { S(z, "ADBE Vector Zigzag Size", 10); S(z, "ADBE Vector Zigzag Detail", 6); }
        });
        cell("MOD_pucker_bloat", 400, 380, function (v) {
            star(v, 2, 6, 80, 0);
            fill(v, [1, 0.6, 0.2]);
            var pb = addMod(v, "ADBE Vector Filter - PB", "pb");
            if (pb) { keys(pb.property("ADBE Vector PuckerBloat Amount"), [[0, -60], [3, 60]]); }
        });
        cell("MOD_wiggle_paths_roughen", 640, 380, function (v) {
            rect(v, [140, 140], 0);
            stroke(v, [1, 0.3, 0.6], 4);
            var w = addMod(v, "ADBE Vector Filter - Roughen", "roughen");
            if (w) { S(w, "ADBE Vector Roughen Size", 8); S(w, "ADBE Vector Roughen Detail", 10); }
        });
        cell("MOD_merge_round_corners", 860, 380, function (v) {
            var r1 = rect(v, [100, 100], 0);
            var e1 = ellipse(v, [100, 100]);
            S(e1.property("ADBE Vector Ellipse Position") ? e1 : e1, "ADBE Vector Ellipse Position", [40, 40]);
            var m = addMod(v, "ADBE Vector Filter - Merge", "merge");
            if (m) { S(m, "ADBE Vector Merge Type", 2); }
            var rc = addMod(v, "ADBE Vector Filter - RC", "roundcorners");
            if (rc) { S(rc, "ADBE Vector RoundCorner Radius", 15); }
            fill(v, [0.3, 0.7, 1]);
        });
        cell("MOD_wiggle_transform", 480, 270, function (v) {
            rect(v, [40, 40], 0);
            fill(v, [1, 1, 1]);
            addMod(v, "ADBE Vector Filter - Wiggler", "wiggler");
        });
        return { main: c.name, refs: [], tests: ["repeater (animated offset)", "trim paths (animated end/offset)", "offset paths", "twist", "zig zag", "pucker & bloat", "wiggle paths (roughen)", "merge paths + round corners", "wiggle transform"] };
    };

    // 04 -----------------------------------------------------------------
    B.text = function (M) {
        var c = comp("text");
        bg(c);
        textLayer(c, "Arial Bold 64", "Arial-BoldMT", 64, [1, 1, 1], [480, 70]);
        var t2 = textLayer(c, "Georgia stroke + tracking", "Georgia", 44, [1, 0.8, 0.2], [480, 140]);
        var sp = t2.property("ADBE Text Properties").property("ADBE Text Document");
        var td = sp.value;
        td.applyStroke = true; td.strokeColor = [0.6, 0, 0.2]; td.strokeWidth = 3; td.strokeOverFill = true; td.tracking = 80;
        sp.setValue(td);
        var t3 = textLayer(c, "Times New Roman, ALL CAPS left", "TimesNewRomanPSMT", 36, [0.6, 0.9, 1], [40, 200], ParagraphJustification.LEFT_JUSTIFY);
        sp = t3.property("ADBE Text Properties").property("ADBE Text Document");
        td = sp.value; try { td.fontCapsOption = FontCapsOption.FONT_ALL_CAPS; } catch (ec) { warn("all caps: " + ec); } sp.setValue(td);
        // paragraph (box) text
        var box = c.layers.addBoxText([420, 160], "Paragraph box text in Verdana that wraps over several lines, justified, leading 34.");
        box.name = "TEXT_box_paragraph";
        var bsp = box.property("ADBE Text Properties").property("ADBE Text Document");
        var btd = bsp.value;
        try { btd.font = "Verdana"; } catch (e) { warn("Verdana: " + e); }
        btd.fontSize = 24; btd.fillColor = [0.9, 0.9, 0.9]; btd.leading = 34; btd.autoLeading = false;
        btd.justification = ParagraphJustification.FULL_JUSTIFY_LASTLINE_LEFT;
        bsp.setValue(btd);
        tr(box).property("ADBE Position").setValue([260, 330]);
        // animator: position + opacity, range selector
        var a1 = textLayer(c, "ANIMATOR RANGE", "Impact", 56, [0.4, 1, 0.5], [720, 280]);
        var tp = a1.property("ADBE Text Properties");
        var an = tp.property("ADBE Text Animators").addProperty("ADBE Text Animator");
        an.name = "Anim_pos_opacity";
        var ap = an.property("ADBE Text Animator Properties");
        ap.addProperty("ADBE Text Position 3D").setValue([0, -60, 0]);
        ap.addProperty("ADBE Text Opacity").setValue(0);
        var sel = an.property("ADBE Text Selectors").addProperty("ADBE Text Selector");
        keys(sel.property("ADBE Text Percent Offset"), [[0, -100], [2, 100]]);
        // animator 2: scale + rotation + fill color, wiggly selector
        var a2 = textLayer(c, "Wiggly Selector", "Arial-BoldMT", 48, [1, 1, 1], [720, 380]);
        var an2 = a2.property("ADBE Text Properties").property("ADBE Text Animators").addProperty("ADBE Text Animator");
        an2.name = "Anim_scale_rot_color";
        var ap2 = an2.property("ADBE Text Animator Properties");
        ap2.addProperty("ADBE Text Scale 3D").setValue([150, 150, 100]);
        ap2.addProperty("ADBE Text Rotation").setValue(25);
        ap2.addProperty("ADBE Text Fill Color").setValue([1, 0.2, 0.2]);
        var ws = an2.property("ADBE Text Selectors").addProperty("ADBE Text Wiggly Selector");
        try { ws.property("ADBE Text Wiggly Random Seed").setValue(7); } catch (e2) { warn("wiggly seed: " + e2); }
        // animator 3: tracking + blur via expression selector
        var a3 = textLayer(c, "expression selector", "Georgia", 40, [0.8, 0.7, 1], [720, 470]);
        var an3 = a3.property("ADBE Text Properties").property("ADBE Text Animators").addProperty("ADBE Text Animator");
        an3.name = "Anim_tracking_expr";
        var ap3 = an3.property("ADBE Text Animator Properties");
        ap3.addProperty("ADBE Text Tracking Amount").setValue(20);
        try { ap3.addProperty("ADBE Text Blur").setValue([4, 4]); } catch (e3) { warn("text blur: " + e3); }
        var es = an3.property("ADBE Text Selectors").addProperty("ADBE Text Expressible Selector");
        es.property("ADBE Text Expressible Amount").expression = "selectorValue * (textIndex % 2)";
        // text on path
        var tpL = textLayer(c, "Text on a mask path", "Arial-BoldMT", 28, [1, 0.6, 0.3], [0, 0], ParagraphJustification.LEFT_JUSTIFY);
        tr(tpL).property("ADBE Position").setValue([0, 0]);
        var m = tpL.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
        m.property("ADBE Mask Shape").setValue(pathShape([[40, 520], [240, 420], [440, 520]], [[0, 0], [-80, 0], [0, 0]], [[0, 0], [80, 0], [0, 0]], false));
        m.maskMode = MaskMode.NONE;
        try {
            P(tpL, "ADBE Text Properties", "ADBE Text Path Options", "ADBE Text Path").setValue(1);
            keys(P(tpL, "ADBE Text Properties", "ADBE Text Path Options", "ADBE Text First Margin"), [[0, 0], [3, 120]]);
        } catch (e4) { warn("text path: " + e4); }
        // source text keyframes (hold)
        var st = textLayer(c, "KEY A", "Arial-BoldMT", 30, [1, 1, 0], [880, 30]);
        st.name = "TEXT_sourcetext_keys";
        var stp = st.property("ADBE Text Properties").property("ADBE Text Document");
        var d1 = stp.value; d1.text = "KEY A"; stp.setValueAtTime(0, d1);
        var d2 = stp.value; d2.text = "KEY B"; stp.setValueAtTime(1.5, d2);
        // per-character 3D
        try { a1.threeDPerChar = true; } catch (e5) { warn("per-char 3D: " + e5); }
        return { main: c.name, refs: [], tests: ["point text fonts Arial-Bold/Georgia/Times/Impact/Verdana", "stroke over fill, tracking, all caps, justification", "paragraph box text, leading", "animator range selector (position/opacity)", "animator wiggly selector (scale/rotation/fill)", "expression selector + tracking + blur", "text on mask path, first margin keys", "source text hold keyframes", "per-character 3D flag"] };
    };

    // 05 -----------------------------------------------------------------
    B.footage_images = function (M) {
        var c = comp("footage_images");
        bg(c, [0.25, 0.25, 0.28]);
        var png = imp(M + "/grid_rgba.png");
        var jpg = imp(M + "/plate_1280x720.jpg");
        var soft = imp(M + "/soft_alpha.png");
        var psdMerged = imp(M + "/layered.psd");
        var psdComp = imp(M + "/layered.psd", true);
        var seq = impSeq(M + "/seq/spin_0000.png");
        seq.mainSource.conformFrameRate = 12;
        try { seq.mainSource.loop = 3; } catch (e) { warn("seq loop: " + e); }
        var lj = c.layers.add(jpg);
        tr(lj).property("ADBE Scale").setValue([30, 30]);
        tr(lj).property("ADBE Position").setValue([800, 420]);
        var lp = c.layers.add(png);
        tr(lp).property("ADBE Position").setValue([180, 160]);
        tr(lp).property("ADBE Scale").setValue([50, 50]);
        var ls = c.layers.add(soft);
        tr(ls).property("ADBE Position").setValue([480, 160]);
        var lm = c.layers.add(psdMerged);
        tr(lm).property("ADBE Position").setValue([780, 160]);
        tr(lm).property("ADBE Scale").setValue([40, 40]);
        var lc = c.layers.add(psdComp);
        tr(lc).property("ADBE Position").setValue([220, 400]);
        tr(lc).property("ADBE Scale").setValue([45, 45]);
        var lq = c.layers.add(seq);
        tr(lq).property("ADBE Position").setValue([560, 400]);
        tr(lq).property("ADBE Scale").setValue([60, 60]);
        lq.outPoint = DUR;
        return { main: c.name, refs: [], tests: ["PNG with alpha", "JPG", "PNG radial soft alpha", "PSD as merged footage", "PSD imported as composition (layers)", "PNG sequence conformed to 12fps, loop 3"] };
    };

    // 06 -----------------------------------------------------------------
    B.footage_video_audio = function (M) {
        var c = comp("footage_video_audio", W, H, 4);
        bg(c);
        var mp4 = imp(M + "/testsrc_720p30_h264_aac.mp4");
        var mp425 = imp(M + "/testsrc_360p25_h264.mp4");
        var prores = imp(M + "/wipe_alpha_prores4444.mov");
        var wav = imp(M + "/chord_stereo_48k.wav");
        var mp3 = imp(M + "/sweep_44k.mp3");
        var lv = c.layers.add(mp4);
        tr(lv).property("ADBE Scale").setValue([50, 50]);
        tr(lv).property("ADBE Position").setValue([250, 150]);
        var l25 = c.layers.add(mp425);
        tr(l25).property("ADBE Position").setValue([710, 150]);
        tr(l25).property("ADBE Scale").setValue([70, 70]);
        l25.startTime = 0.5;
        var lpr = c.layers.add(prores);
        tr(lpr).property("ADBE Position").setValue([480, 400]);
        tr(lpr).property("ADBE Scale").setValue([80, 80]);
        var la = c.layers.add(wav);
        la.startTime = 0;
        var lev = la.property("ADBE Audio Group").property("ADBE Audio Levels");
        keys(lev, [[0, [-48, -48]], [1, [0, 0]], [3.5, [0, 0]], [4, [-48, -48]]]);
        var l3 = c.layers.add(mp3);
        l3.startTime = 1;
        l3.audioEnabled = true;
        lv.audioEnabled = false;
        return { main: c.name, refs: [], tests: ["H.264 MP4 1280x720 30fps (embedded AAC, audio switched off)", "25fps clip in 30fps comp, startTime 0.5", "ProRes 4444 with alpha", "WAV stereo 48k with audio level fades", "MP3 44.1k starting at 1s"] };
    };

    // 07 -----------------------------------------------------------------
    B.precomps_nesting = function (M) {
        var deep = comp("pre_L3_deep", 300, 300, 3);
        var ds = deep.layers.addSolid([1, 0.3, 0.2], "L3_square", 100, 100, 1);
        keys(tr(ds).property("ADBE Rotate Z"), [[0, 0], [3, 360]]);
        var mid = comp("pre_L2_mid_25fps", 600, 400, 4, 25);
        bg(mid, [0.2, 0.2, 0.5], "L2_bg");
        var dl = mid.layers.add(deep);
        tr(dl).property("ADBE Position").setValue([150, 200]);
        var dl2 = mid.layers.add(deep);
        tr(dl2).property("ADBE Position").setValue([450, 200]);
        dl2.startTime = -1;
        dl2.name = "L3_instance_offset_-1s";
        var top = comp("pre_L1_collapse_src", W, H, 3);
        var sh = shapeLayer(top, "L1_vector_star");
        var g = group(rootVec(sh), "s");
        star(contents(g), 1, 5, 40, 18);
        fill(contents(g), [1, 1, 0.3]);
        tr(sh).property("ADBE Position").setValue([200, 200]);
        var c = comp("precomps_nesting");
        bg(c);
        var ml = c.layers.add(mid);
        tr(ml).property("ADBE Position").setValue([330, 270]);
        tr(ml).property("ADBE Scale").setValue([80, 80]);
        var cl = c.layers.add(top);
        cl.collapseTransformation = true;
        tr(cl).property("ADBE Scale").setValue([400, 400]);
        tr(cl).property("ADBE Position").setValue([1740, 400]);
        cl.name = "L1_collapsed_scaled_400";
        var sl = c.layers.add(deep);
        sl.stretch = 200;
        tr(sl).property("ADBE Position").setValue([820, 430]);
        sl.name = "L3_direct_stretch_200";
        return { main: c.name, refs: ["pre_L2_mid_25fps"], tests: ["3-level nesting", "precomp at different fps (25) and size", "precomp instance with negative start time", "collapse transformations scaled 400% (vector stays sharp)", "time stretch 200% on precomp layer"] };
    };

    // 08 -----------------------------------------------------------------
    B.masks = function (M) {
        var c = comp("masks");
        bg(c, [0.05, 0.05, 0.05]);
        var plate = imp(M + "/plate_1280x720.jpg");
        function maskedLayer(name, x, y, build) {
            var l = c.layers.add(plate);
            l.name = name;
            tr(l).property("ADBE Scale").setValue([22, 22]);
            tr(l).property("ADBE Position").setValue([x, y]);
            build(l.property("ADBE Mask Parade"));
            return l;
        }
        var sq = [[340, 160], [940, 160], [940, 560], [340, 560]];
        var circle = (function () {
            var k = 0.5523, cx = 640, cy = 360, r = 260;
            return pathShape([[cx, cy - r], [cx + r, cy], [cx, cy + r], [cx - r, cy]],
                [[-r * k, 0], [0, -r * k], [r * k, 0], [0, r * k]],
                [[r * k, 0], [0, r * k], [-r * k, 0], [0, -r * k]], true);
        })();
        maskedLayer("MASK_add_feather", 160, 140, function (mp) {
            var m = mp.addProperty("ADBE Mask Atom");
            m.property("ADBE Mask Shape").setValue(circle);
            m.property("ADBE Mask Feather").setValue([80, 80]);
        });
        maskedLayer("MASK_subtract", 400, 140, function (mp) {
            var a = mp.addProperty("ADBE Mask Atom");
            a.property("ADBE Mask Shape").setValue(pathShape([[0, 0], [1280, 0], [1280, 720], [0, 720]], null, null, true));
            var m = mp.addProperty("ADBE Mask Atom");
            m.property("ADBE Mask Shape").setValue(circle);
            m.maskMode = MaskMode.SUBTRACT;
        });
        maskedLayer("MASK_intersect", 640, 140, function (mp) {
            var a = mp.addProperty("ADBE Mask Atom");
            a.property("ADBE Mask Shape").setValue(pathShape(sq, null, null, true));
            var m = mp.addProperty("ADBE Mask Atom");
            m.property("ADBE Mask Shape").setValue(circle);
            m.maskMode = MaskMode.INTERSECT;
        });
        maskedLayer("MASK_difference", 860, 140, function (mp) {
            var a = mp.addProperty("ADBE Mask Atom");
            a.property("ADBE Mask Shape").setValue(pathShape(sq, null, null, true));
            var m = mp.addProperty("ADBE Mask Atom");
            m.property("ADBE Mask Shape").setValue(circle);
            m.maskMode = MaskMode.DIFFERENCE;
        });
        maskedLayer("MASK_inverted_expansion", 160, 400, function (mp) {
            var m = mp.addProperty("ADBE Mask Atom");
            m.property("ADBE Mask Shape").setValue(circle);
            m.inverted = true;
            m.property("ADBE Mask Offset").setValue(-60);
        });
        maskedLayer("MASK_opacity_lighten_darken", 400, 400, function (mp) {
            var a = mp.addProperty("ADBE Mask Atom");
            a.property("ADBE Mask Shape").setValue(pathShape(sq, null, null, true));
            a.property("ADBE Mask Opacity").setValue(50);
            var m = mp.addProperty("ADBE Mask Atom");
            m.property("ADBE Mask Shape").setValue(circle);
            m.maskMode = MaskMode.LIGHTEN;
            var d = mp.addProperty("ADBE Mask Atom");
            d.property("ADBE Mask Shape").setValue(pathShape([[0, 300], [1280, 300], [1280, 420], [0, 420]], null, null, true));
            d.maskMode = MaskMode.DARKEN;
        });
        maskedLayer("MASK_animated_path", 640, 400, function (mp) {
            var m = mp.addProperty("ADBE Mask Atom");
            var ms = m.property("ADBE Mask Shape");
            ms.setValueAtTime(0, pathShape(sq, null, null, true));
            ms.setValueAtTime(3, circle);
        });
        maskedLayer("MASK_rotobezier_open_stroke_fx", 860, 400, function (mp) {
            var m = mp.addProperty("ADBE Mask Atom");
            m.property("ADBE Mask Shape").setValue(pathShape([[200, 600], [500, 150], [800, 600], [1100, 150]], null, null, false));
            m.rotoBezier = true;
            m.maskMode = MaskMode.NONE;
        });
        var strokeLayer = c.layer("MASK_rotobezier_open_stroke_fx");
        var se = fx(strokeLayer, "ADBE Stroke", { "Brush Size": 30 }, "stroke");
        if (se) {
            S(se, "Color", [1, 1, 0]);
            keys(se.property("End"), [[0, 0], [3, 100]]);
        }
        // feathered variable-width mask feather is not scriptable: skipped
        return { main: c.name, refs: [], tests: ["mask modes add/subtract/intersect/difference/lighten/darken/none", "feather, expansion, opacity, inverted", "animated mask path (square->circle)", "rotobezier open mask driving Stroke effect"] };
    };

    // 09 -----------------------------------------------------------------
    B.track_mattes = function (M) {
        var c = comp("track_mattes");
        bg(c, [0.1, 0.1, 0.1]);
        var plate = imp(M + "/plate_1280x720.jpg");
        var lumaImg = imp(M + "/luma_matte.png");
        function pair(name, x, y, type, matteKind) {
            var fill = c.layers.add(plate);
            fill.name = name + "_FILL";
            tr(fill).property("ADBE Scale").setValue([35, 35]);
            tr(fill).property("ADBE Position").setValue([x, y]);
            var matte;
            if (matteKind === "luma") {
                matte = c.layers.add(lumaImg);
                tr(matte).property("ADBE Scale").setValue([35, 35]);
            } else {
                matte = textLayer(c, "MATTE", "Impact", 110, [1, 1, 1], null);
                tr(matte).property("ADBE Opacity").setValue(100);
            }
            matte.name = name + "_MATTE";
            tr(matte).property("ADBE Position").setValue([x, y + (matteKind === "luma" ? 0 : 40)]);
            fill.moveAfter(matte);
            fill.setTrackMatte(matte, type);
            return [fill, matte];
        }
        pair("TM_alpha", 240, 140, TrackMatteType.ALPHA, "alpha");
        pair("TM_alpha_inverted", 720, 140, TrackMatteType.ALPHA_INVERTED, "alpha");
        pair("TM_luma", 240, 400, TrackMatteType.LUMA, "luma");
        pair("TM_luma_inverted", 720, 400, TrackMatteType.LUMA_INVERTED, "luma");
        // matte shared by two fills, matte NOT directly above (AE 23+ any-layer matte), animated
        var shared = shapeLayer(c, "TM_shared_matte_anim");
        var g = group(rootVec(shared), "m");
        ellipse(contents(g), [180, 180]);
        fill(contents(g), [1, 1, 1]);
        keys(tr(shared).property("ADBE Position"), [[0, [380, 270]], [3, [580, 270]]]);
        var f1 = c.layers.addSolid([1, 0.3, 0.3], "TM_shared_fill_red", 300, 300, 1);
        tr(f1).property("ADBE Position").setValue([430, 270]);
        var f2 = c.layers.addSolid([0.3, 0.5, 1], "TM_shared_fill_blue", 300, 300, 1);
        tr(f2).property("ADBE Position").setValue([530, 270]);
        f1.setTrackMatte(shared, TrackMatteType.ALPHA);
        f2.setTrackMatte(shared, TrackMatteType.ALPHA);
        shared.moveToBeginning();
        return { main: c.name, refs: [], tests: ["alpha / alpha inverted matte (text matte)", "luma / luma inverted matte (image matte)", "one matte shared by two layers, matte not adjacent, animated"] };
    };

    // 10 -----------------------------------------------------------------
    B.blend_modes = function (M) {
        var c = comp("blend_modes", W, H, 1);
        var plate = imp(M + "/plate_1280x720.jpg");
        var base = c.layers.add(plate);
        base.name = "BASE_plate";
        tr(base).property("ADBE Scale").setValue([75, 75]);
        base.moveToEnd();
        var modes = ["NORMAL", "DISSOLVE", "DARKEN", "MULTIPLY", "COLOR_BURN", "CLASSIC_COLOR_BURN", "LINEAR_BURN", "DARKER_COLOR",
            "ADD", "LIGHTEN", "SCREEN", "COLOR_DODGE", "CLASSIC_COLOR_DODGE", "LINEAR_DODGE", "LIGHTER_COLOR",
            "OVERLAY", "SOFT_LIGHT", "HARD_LIGHT", "LINEAR_LIGHT", "VIVID_LIGHT", "PIN_LIGHT", "HARD_MIX",
            "DIFFERENCE", "CLASSIC_DIFFERENCE", "EXCLUSION", "SUBTRACT", "DIVIDE",
            "HUE", "SATURATION", "COLOR", "LUMINOSITY", "STENCIL_ALPHA", "SILHOUETTE_LUMA", "ALPHA_ADD", "LUMINESCENT_PREMUL"];
        var cols = 7, cw = W / cols, ch = H / 5;
        var used = [];
        for (var i = 0; i < 31; i++) {
            var m = modes[i];
            if (BlendingMode[m] === undefined) { warn("blend mode missing " + m); continue; }
            var l = shapeLayer(c, "BM_" + m);
            var g = group(rootVec(l), "sw");
            rect(contents(g), [cw - 10, ch - 10], 0);
            var gf = addMod(contents(g), "ADBE Vector Graphic - G-Fill", "bm");
            if (gf) { S(gf, "ADBE Vector Grad Start Pt", [-(cw / 2), 0]); S(gf, "ADBE Vector Grad End Pt", [cw / 2, 0]); }
            fill(contents(g), [0.9, 0.3, 0.6]);
            S(contents(g).property("ADBE Vector Graphic - Fill"), "ADBE Vector Fill Opacity", 60);
            tr(l).property("ADBE Position").setValue([cw * (i % cols) + cw / 2, ch * Math.floor(i / cols) + ch / 2]);
            l.blendingMode = BlendingMode[m];
            used.push(m);
        }
        // preserve transparency + stencil/silhouette in a precomp with transparent bg
        var pc = comp("blend_stencil_precomp", 400, 200, 1);
        var s1 = pc.layers.addSolid([0.2, 0.8, 0.3], "under", 400, 200, 1);
        var mask = s1.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
        mask.property("ADBE Mask Shape").setValue(pathShape([[50, 20], [350, 20], [200, 180]], null, null, true));
        var s2 = pc.layers.addSolid([1, 0.9, 0.1], "preserve_transparency_stripe", 400, 60, 1);
        s2.preserveTransparency = true;
        var pl = c.layers.add(pc);
        tr(pl).property("ADBE Position").setValue([cw * 3 + cw / 2 + 2 * cw, ch * 4 + ch / 2]);
        tr(pl).property("ADBE Scale").setValue([40, 40]);
        return { main: c.name, refs: [], tests: ["31 blend modes over photo: " + used.join(","), "preserve transparency (T switch) in precomp"] };
    };

    // 11 -----------------------------------------------------------------
    B.threed_camera_lights = function (M) {
        var c = comp("threed_camera_lights");
        c.renderer = "ADBE Advanced 3d";
        bg(c, [0.05, 0.05, 0.08], "BG_2D");
        var floor = c.layers.addSolid([0.6, 0.6, 0.65], "FLOOR_3D", 1600, 1600, 1);
        floor.threeDLayer = true;
        tr(floor).property("ADBE Position").setValue([480, 420, 300]);
        tr(floor).property("ADBE Orientation").setValue([90, 0, 0]);
        var mo = floor.property("ADBE Material Options Group");
        S(mo, "ADBE Accepts Shadows", 1);
        var card = imp(M + "/grid_rgba.png");
        var cl = c.layers.add(card);
        cl.name = "CARD_3D_casts_shadow";
        cl.threeDLayer = true;
        tr(cl).property("ADBE Position").setValue([480, 270, 300]);
        tr(cl).property("ADBE Scale").setValue([50, 50, 50]);
        keys(tr(cl).property("ADBE Rotate Y"), [[0, -30], [3, 30]]);
        S(cl.property("ADBE Material Options Group"), "ADBE Casts Shadows", 1);
        var c2 = c.layers.addSolid([0.9, 0.3, 0.2], "BOX_side_3D_xrot", 200, 200, 1);
        c2.threeDLayer = true;
        tr(c2).property("ADBE Position").setValue([200, 300, 500]);
        tr(c2).property("ADBE Rotate X").setValue(30);
        tr(c2).property("ADBE Orientation").setValue([0, 45, 0]);
        S(c2.property("ADBE Material Options Group"), "ADBE Casts Shadows", 1);
        var t3 = textLayer(c, "3D TEXT", "Arial-BoldMT", 70, [0.4, 0.9, 1], null);
        t3.threeDLayer = true;
        tr(t3).property("ADBE Position").setValue([760, 200, 100]);
        var cam = c.layers.addCamera("CAM_two_node_dof", [480, 270]);
        try { cam.autoOrient = AutoOrientType.CAMERA_OR_POINT_OF_INTEREST; } catch (e) { warn("cam autoOrient: " + e); }
        keys(tr(cam).property("ADBE Position"), [[0, [300, 150, -700]], [3, [700, 150, -700]]]);
        tr(cam).property("ADBE Anchor Point").setValue([480, 300, 300]);
        var co = cam.property("ADBE Camera Options Group");
        S(co, "ADBE Camera Zoom", 900);
        S(co, "ADBE Camera Depth of Field", 1);
        S(co, "ADBE Camera Focus Distance", 820);
        S(co, "ADBE Camera Aperture", 40);
        var spot = c.layers.addLight("LIGHT_spot_shadows", [480, 270]);
        spot.lightType = LightType.SPOT;
        tr(spot).property("ADBE Position").setValue([300, -100, 0]);
        tr(spot).property("ADBE Anchor Point").setValue([480, 300, 300]);
        var lo = spot.property("ADBE Light Options Group");
        S(lo, "ADBE Light Intensity", 120);
        S(lo, "ADBE Light Color", [1, 0.95, 0.8]);
        S(lo, "ADBE Light Cone Angle", 70);
        S(lo, "ADBE Light Cone Feather 2", 40);
        S(lo, "ADBE Casts Shadows", 1);
        S(lo, "ADBE Light Shadow Darkness", 70);
        S(lo, "ADBE Light Shadow Diffusion", 10);
        var pt = c.layers.addLight("LIGHT_point_blue", [480, 270]);
        pt.lightType = LightType.POINT;
        tr(pt).property("ADBE Position").setValue([800, 200, 100]);
        S(pt.property("ADBE Light Options Group"), "ADBE Light Color", [0.3, 0.5, 1]);
        S(pt.property("ADBE Light Options Group"), "ADBE Light Intensity", 60);
        var amb = c.layers.addLight("LIGHT_ambient", [480, 270]);
        amb.lightType = LightType.AMBIENT;
        S(amb.property("ADBE Light Options Group"), "ADBE Light Intensity", 20);
        var par = c.layers.addLight("LIGHT_parallel", [480, 270]);
        par.lightType = LightType.PARALLEL;
        S(par.property("ADBE Light Options Group"), "ADBE Light Intensity", 30);
        // second comp: one-node camera, orthographic-ish long lens, 3D precomp collapsed
        var c2c = comp("threed_one_node_camera");
        bg(c2c);
        var cube = shapeLayer(c2c, "SHAPE_3D");
        var g = group(rootVec(cube), "r");
        rect(contents(g), [200, 200], 20);
        fill(contents(g), [1, 0.7, 0.2]);
        cube.threeDLayer = true;
        keys(tr(cube).property("ADBE Rotate Y"), [[0, 0], [3, 90]]);
        tr(cube).property("ADBE Position").setValue([480, 270, 0]);
        var cam1 = c2c.layers.addCamera("CAM_one_node", [480, 270]);
        cam1.autoOrient = AutoOrientType.NO_AUTO_ORIENT;
        tr(cam1).property("ADBE Position").setValue([480, 270, -1000]);
        keys(tr(cam1).property("ADBE Rotate Z"), [[0, 0], [3, 20]]);
        return { main: c.name, refs: ["threed_one_node_camera"], tests: ["Classic 3D renderer", "3D solids/footage/text, orientation vs rotation", "two-node camera with DOF, animated position", "spot (shadows), point, ambient, parallel lights", "casts/accepts shadows material options", "one-node camera with Z rotation (2nd comp)"] };
    };

    // 12 -----------------------------------------------------------------
    B.keyframes_easing = function (M) {
        var c = comp("keyframes_easing", W, H, 4);
        bg(c);
        var names = ["LINEAR", "EASY_EASE_33", "EASE_IN_OUT_80", "HOLD", "CUSTOM_SPEED", "AUTO_BEZIER", "CONTINUOUS"];
        for (var i = 0; i < names.length; i++) {
            var y = 50 + i * 62;
            var l = shapeLayer(c, "KEY_" + names[i]);
            var g = group(rootVec(l), "dot");
            ellipse(contents(g), [36, 36]);
            fill(contents(g), [0.3 + i * 0.1, 0.8 - i * 0.08, 1 - i * 0.1]);
            var pos = tr(l).property("ADBE Position");
            pos.setValueAtTime(0, [80, y]);
            pos.setValueAtTime(1.5, [480, y]);
            pos.setValueAtTime(3, [880, y]);
            var lab = textLayer(c, names[i], "ArialMT", 16, [0.7, 0.7, 0.7], [8, y + 6], ParagraphJustification.LEFT_JUSTIFY);
            var k;
            if (names[i] === "LINEAR") {
                for (k = 1; k <= 3; k++) { pos.setInterpolationTypeAtKey(k, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR); }
            } else if (names[i] === "EASY_EASE_33") {
                easeAll(pos, 33.33);
            } else if (names[i] === "EASE_IN_OUT_80") {
                easeAll(pos, 80);
            } else if (names[i] === "HOLD") {
                for (k = 1; k <= 3; k++) { pos.setInterpolationTypeAtKey(k, KeyframeInterpolationType.HOLD, KeyframeInterpolationType.HOLD); }
            } else if (names[i] === "CUSTOM_SPEED") {
                pos.setTemporalEaseAtKey(1, [new KeyframeEase(0, 10)], [new KeyframeEase(600, 60)]);
                pos.setTemporalEaseAtKey(2, [new KeyframeEase(100, 90)], [new KeyframeEase(100, 20)]);
                pos.setTemporalEaseAtKey(3, [new KeyframeEase(0, 75)], [new KeyframeEase(0, 75)]);
            } else if (names[i] === "AUTO_BEZIER") {
                for (k = 1; k <= 3; k++) { pos.setTemporalAutoBezierAtKey(k, true); }
            } else if (names[i] === "CONTINUOUS") {
                pos.setValueAtTime(0.75, [200, y - 20]);
                for (k = 1; k <= pos.numKeys; k++) { pos.setTemporalContinuousAtKey(k, true); }
            }
        }
        // spatial bezier arc + roving middle key
        var arc = shapeLayer(c, "KEY_spatial_arc_roving");
        var ga = group(rootVec(arc), "sq");
        rect(contents(ga), [30, 30], 0);
        fill(contents(ga), [1, 1, 1]);
        var ap = tr(arc).property("ADBE Position");
        ap.setValueAtTime(0, [100, 500]);
        ap.setValueAtTime(1, [480, 470]);
        ap.setValueAtTime(3.5, [860, 500]);
        ap.setSpatialTangentsAtKey(1, [0, 0, 0], [100, -200, 0]);
        ap.setSpatialTangentsAtKey(2, [-150, 0, 0], [150, 0, 0]);
        ap.setSpatialTangentsAtKey(3, [-100, -200, 0], [0, 0, 0]);
        ap.setRovingAtKey(2, true);
        tr(arc).property("ADBE Rotate Z").expression = "";
        arc.autoOrient = AutoOrientType.ALONG_PATH;
        // separated dimensions with different eases, scale ease 3-dim, opacity linear
        var sep = shapeLayer(c, "KEY_separate_dims_scale_opacity");
        var gs = group(rootVec(sep), "sq");
        rect(contents(gs), [50, 50], 8);
        fill(contents(gs), [1, 0.4, 0.2]);
        var sp = tr(sep).property("ADBE Position");
        sp.dimensionsSeparated = true;
        var px = tr(sep).property("ADBE Position_0"), py = tr(sep).property("ADBE Position_1");
        keys(px, [[0, 760], [4, 900]], KeyframeInterpolationType.LINEAR);
        keys(py, [[0, 120], [2, 300], [4, 120]]);
        easeAll(py, 70);
        var sc = tr(sep).property("ADBE Scale");
        keys(sc, [[0, [100, 100]], [2, [200, 50]], [4, [100, 100]]]);
        easeAll(sc, 50);
        keys(tr(sep).property("ADBE Opacity"), [[0, 100], [4, 20]], KeyframeInterpolationType.LINEAR);
        // in linear / out bezier mix
        var mix = tr(arc).property("ADBE Scale");
        keys(mix, [[0, [100, 100]], [2, [160, 160]], [4, [100, 100]]]);
        mix.setInterpolationTypeAtKey(2, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.BEZIER);
        return { main: c.name, refs: [], tests: ["linear, easy ease 33%, ease 80%, hold", "custom speed/influence", "auto-bezier, continuous", "spatial bezier tangents + roving key + auto-orient along path", "separated X/Y dimensions", "3-dim scale ease", "mixed in-linear/out-bezier key"] };
    };

    // 13 -----------------------------------------------------------------
    B.expressions = function (M) {
        var c = comp("expressions");
        bg(c);
        var ctrl = c.layers.addNull(DUR);
        ctrl.name = "CTRL";
        var sl = fx(ctrl, "ADBE Slider Control", null, "slider");
        sl.name = "Amount";
        keys(sl.property("ADBE Slider Control-0001"), [[0, 0], [3, 100]]);
        var cc = fx(ctrl, "ADBE Color Control", null, "color");
        cc.name = "Tint";
        cc.property("ADBE Color Control-0001").setValue([1, 0.3, 0.5]);
        var cb = fx(ctrl, "ADBE Checkbox Control", null, "cb");
        cb.name = "Toggle";
        cb.property("ADBE Checkbox Control-0001").setValue(1);
        var ptc = fx(ctrl, "ADBE Point Control", null, "pt");
        ptc.name = "Target";
        ptc.property("ADBE Point Control-0001").setValue([700, 400]);
        var ang = fx(ctrl, "ADBE Angle Control", null, "ang");
        ang.name = "Spin";
        ang.property("ADBE Angle Control-0001").setValue(45);
        function dot(name, x, y, color) {
            var l = shapeLayer(c, name);
            var g = group(rootVec(l), "d");
            rect(contents(g), [50, 50], 10);
            fill(contents(g), color || [1, 1, 1]);
            tr(l).property("ADBE Position").setValue([x, y]);
            return l;
        }
        var w = dot("EXP_wiggle_seeded", 120, 100);
        tr(w).property("ADBE Position").expression = "seedRandom(3, true);\nwiggle(2, 40)";
        var lc = dot("EXP_loopOut_cycle", 300, 100);
        keys(tr(lc).property("ADBE Rotate Z"), [[0, 0], [0.5, 90]]);
        tr(lc).property("ADBE Rotate Z").expression = "loopOut(\"cycle\")";
        var lp = dot("EXP_loopOut_pingpong", 480, 100);
        keys(tr(lp).property("ADBE Position"), [[0, [440, 100]], [0.5, [520, 100]]]);
        tr(lp).property("ADBE Position").expression = "loopOut(\"pingpong\")";
        var tm = dot("EXP_time_rotation", 660, 100);
        tr(tm).property("ADBE Rotate Z").expression = "time * 120";
        var li = dot("EXP_linear_slider", 120, 260);
        tr(li).property("ADBE Scale").expression = "var a = thisComp.layer(\"CTRL\").effect(\"Amount\")(\"Slider\");\nvar s = linear(a, 0, 100, 50, 200);\n[s, s]";
        var col = dot("EXP_color_from_control", 300, 260);
        P(col, "ADBE Root Vectors Group", "d", "ADBE Vectors Group", "ADBE Vector Graphic - Fill", "ADBE Vector Fill Color").expression = "thisComp.layer(\"CTRL\").effect(\"Tint\")(\"Color\")";
        var vt = dot("EXP_valueAtTime_follow", 480, 260, [0.5, 1, 0.5]);
        tr(vt).property("ADBE Position").expression = "var p = thisComp.layer(\"EXP_wiggle_seeded\").transform.position.valueAtTime(time - 0.3);\np + [360, 160]";
        var cbx = dot("EXP_checkbox_opacity", 660, 260);
        tr(cbx).property("ADBE Opacity").expression = "thisComp.layer(\"CTRL\").effect(\"Toggle\")(\"Checkbox\") == 1 ? 100 : 0";
        var pz = dot("EXP_posterizeTime_angle", 840, 260);
        tr(pz).property("ADBE Rotate Z").expression = "posterizeTime(4);\nthisComp.layer(\"CTRL\").effect(\"Spin\")(\"Angle\") + time * 90";
        var lk = dot("EXP_lookAt_point_control", 840, 100, [1, 0.8, 0.2]);
        tr(lk).property("ADBE Rotate Z").expression = "var t = thisComp.layer(\"CTRL\").effect(\"Target\")(\"Point\");\nvar v = t - transform.position;\nradiansToDegrees(Math.atan2(v[1], v[0]))";
        var txt = textLayer(c, "x", "Arial-BoldMT", 40, [1, 1, 1], [480, 420]);
        txt.name = "EXP_sourceText";
        txt.property("ADBE Text Properties").property("ADBE Text Document").expression = "\"Amount: \" + Math.round(thisComp.layer(\"CTRL\").effect(\"Amount\")(\"Slider\")) + \"  t=\" + time.toFixed(2)";
        var fxl = dot("EXP_on_effect_param", 120, 420, [0.3, 0.6, 1]);
        var gb = fx(fxl, "ADBE Gaussian Blur 2", null, "blur");
        if (gb) { gb.property("ADBE Gaussian Blur 2-0001").expression = "Math.abs(Math.sin(time * 3)) * 20"; }
        var ix = dot("EXP_index_based_hue", 300, 420);
        P(ix, "ADBE Root Vectors Group", "d", "ADBE Vectors Group", "ADBE Vector Graphic - Fill", "ADBE Vector Fill Color").expression = "hslToRgb([((index * 0.13) + time * 0.2) % 1, 0.8, 0.5, 1])";
        var en = dot("EXP_ease_function", 840, 420);
        tr(en).property("ADBE Position").expression = "var x = ease(time, 0, 3, 700, 920);\n[x, value[1]]";
        return { main: c.name, refs: [], tests: ["wiggle with seedRandom", "loopOut cycle / pingpong", "time-driven rotation", "linear() from slider", "color/checkbox/point/angle expression controls", "valueAtTime layer reference", "posterizeTime", "lookAt via atan2", "sourceText expression", "expression on effect parameter", "index + hslToRgb", "ease() function", "JavaScript engine expressions (project default)"] };
    };

    // 14 effects ---------------------------------------------------------
    function effectGrid(title, list, M) {
        var plate = imp(M + "/plate_1280x720.jpg");
        var grid = imp(M + "/grid_rgba.png");
        var tw = 480, th = 270;
        var made = [];
        var cs = [];
        for (var i = 0; i < list.length; i++) {
            var e = list[i];
            var c = comp("fx_" + e.name, tw, th, 2);
            var src;
            if (e.src === "grid") {
                bg(c, [0.15, 0.15, 0.2]);
                src = c.layers.add(grid);
                tr(src).property("ADBE Scale").setValue([45, 45]);
                if (e.move) { keys(tr(src).property("ADBE Position"), [[0, [140, 135]], [2, [340, 135]]]); }
            } else if (e.src === "solid") {
                src = c.layers.addSolid([0.5, 0.5, 0.5], "src_solid", tw, th, 1);
            } else {
                src = c.layers.add(plate);
                tr(src).property("ADBE Scale").setValue([37.5, 37.5]);
            }
            src.name = "SRC_" + e.name;
            if (e.mask) {
                var mk = src.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
                var sc = e.src === "grid" ? 1 : 1;
                mk.property("ADBE Mask Shape").setValue(pathShape([[200, 150], [1080, 150], [1080, 570], [200, 570]], null, null, true));
                mk.maskMode = MaskMode.NONE;
            }
            var ef = fx(src, e.mn, e.p, e.name);
            if (ef && e.k) {
                for (var kn in e.k) {
                    if (e.k.hasOwnProperty(kn)) {
                        try { keys(ef.property(kn), e.k[kn]); } catch (ke) { warn(e.name + " key " + kn + ": " + ke); }
                    }
                }
            }
            if (ef && e.after) { try { e.after(ef, src, c); } catch (ae) { warn(e.name + " after: " + ae); } }
            made.push(e.name + (ef ? "" : " (MISSING)"));
            cs.push(c);
        }
        var cols = 4, rows = Math.ceil(cs.length / cols);
        var main = comp(title, 1920, Math.max(1, rows) * 270, 2);
        bg(main, [0, 0, 0]);
        for (var j = 0; j < cs.length; j++) {
            var l = main.layers.add(cs[j]);
            tr(l).property("ADBE Position").setValue([(j % cols) * 480 + 240, Math.floor(j / cols) * 270 + 135]);
            var lab = textLayer(main, cs[j].name, "Arial-BoldMT", 18, [1, 1, 0.3], [(j % cols) * 480 + 8, Math.floor(j / cols) * 270 + 22], ParagraphJustification.LEFT_JUSTIFY);
        }
        var refs = [];
        for (var r = 0; r < cs.length; r++) { refs.push(cs[r].name); }
        return { main: main.name, refs: refs, tests: made };
    }

    B.effects_blur_color = function (M) {
        return effectGrid("effects_blur_color", [
            { name: "gaussian_blur", mn: "ADBE Gaussian Blur 2", p: { "Blurriness": 12 } },
            { name: "fast_box_blur", mn: "ADBE Box Blur2", p: { "Blur Radius": 10, "Iterations": 3 } },
            { name: "directional_blur", mn: "ADBE Motion Blur", p: { "Direction": 45, "Blur Length": 25 } },
            { name: "radial_blur_zoom", mn: "ADBE Radial Blur", p: { "Amount": 30, "Type": 2 } },
            { name: "glow", mn: "ADBE Glo2", src: "grid", p: { "Glow Threshold": 30, "Glow Radius": 30, "Glow Intensity": 1.5 } },
            { name: "hue_saturation", mn: "ADBE HUE SATURATION", p: { "Master Hue": 120, "Master Saturation": 30 } },
            { name: "brightness_contrast", mn: "ADBE Brightness & Contrast 2", p: { "Brightness": 30, "Contrast": 40 } },
            { name: "levels_gamma", mn: "ADBE Easy Levels2", p: { "Gamma": 1.8 } },
            { name: "curves_default", mn: "ADBE CurvesCustom" },
            { name: "exposure", mn: "ADBE Exposure2", p: { "Exposure": 1 } },
            { name: "tint", mn: "ADBE Tint", p: { "Map Black To": [0, 0, 0.4], "Map White To": [1, 0.9, 0.6] } },
            { name: "tritone", mn: "ADBE Tritone" },
            { name: "fill", mn: "ADBE Fill", src: "grid", p: { "Color": [1, 0, 0.5] } },
            { name: "invert", mn: "ADBE Invert" },
            { name: "black_white", mn: "ADBE Black&White" },
            { name: "vibrance", mn: "ADBE Vibrance", p: { "Vibrance": 60 } },
            { name: "posterize", mn: "ADBE Posterize", p: { "Level": 4 } },
            { name: "noise", mn: "ADBE Noise", p: { "Amount of Noise": 30 } },
            { name: "sharpen", mn: "ADBE Sharpen", p: { "Sharpen Amount": 60 } },
            { name: "unsharp_mask", mn: "ADBE Unsharp Mask2", p: { "Amount": 150 } }
        ], M);
    };

    B.effects_distort_generate = function (M) {
        return effectGrid("effects_distort_generate", [
            { name: "transform", mn: "ADBE Geometry2", p: { "Scale Height": 70, "Skew": 20, "Rotation": 15 } },
            { name: "corner_pin", mn: "ADBE Corner Pin", p: { "Upper Left": [200, 100], "Lower Right": [1100, 600] } },
            { name: "mirror", mn: "ADBE Mirror", p: { "Reflection Angle": 30 } },
            { name: "offset", mn: "ADBE Offset", p: { "Shift Center To": [940, 360] } },
            { name: "motion_tile", mn: "ADBE Tile", src: "grid", p: { "Output Width": 300, "Output Height": 300, "Mirror Edges": 1 } },
            { name: "wave_warp", mn: "ADBE Wave Warp", p: { "Wave Height": 20, "Wave Width": 80 } },
            { name: "turbulent_displace", mn: "ADBE Turbulent Displace", p: { "Amount": 60, "Size": 80 } },
            { name: "bulge", mn: "ADBE Bulge", p: { "Horizontal Radius": 300, "Vertical Radius": 300, "Bulge Height": 2 } },
            { name: "twirl", mn: "ADBE Twirl", p: { "Angle": 180, "Twirl Radius": 40 } },
            { name: "polar_coordinates", mn: "ADBE Polar Coordinates", p: { "Interpolation": 1 } },
            { name: "gradient_ramp_radial", mn: "ADBE Ramp", src: "solid", p: { "Start of Ramp": [240, 135], "End of Ramp": [480, 270], "Ramp Shape": 2, "Start Color": [1, 0.8, 0.2], "End Color": [0.1, 0, 0.4] } },
            { name: "four_color_gradient", mn: "ADBE 4ColorGradient", src: "solid" },
            { name: "fractal_noise_anim", mn: "ADBE Fractal Noise", src: "solid", p: { "Contrast": 150 }, k: { "Evolution": [[0, 0], [2, 360]] } },
            { name: "checkerboard", mn: "ADBE Checkerboard", src: "solid" },
            { name: "grid", mn: "ADBE Grid", src: "solid" },
            { name: "cell_pattern", mn: "ADBE Cell Pattern", src: "solid" },
            { name: "cc_bend_it", mn: "CC Bend It", src: "grid" },
            { name: "cc_radial_fast_blur", mn: "CC Radial Fast Blur", p: { "Amount": 60 } },
            { name: "cc_vignette", mn: "CC Vignette", p: { "Amount": 80 } }
        ], M);
    };

    B.effects_stylize_transition = function (M) {
        return effectGrid("effects_stylize_transition", [
            { name: "drop_shadow", mn: "ADBE Drop Shadow", src: "grid", p: { "Distance": 20, "Softness": 15, "Opacity": 70 } },
            { name: "simple_choker", mn: "ADBE Simple Choker", src: "grid", p: { "Choke Matte": 8 } },
            { name: "echo", mn: "ADBE Echo", src: "grid", move: true, p: { "Echo Time (seconds)": -0.1, "Number Of Echoes": 4 } },
            { name: "find_edges", mn: "ADBE Find Edges" },
            { name: "mosaic", mn: "ADBE Mosaic", p: { "Horizontal Blocks": 24, "Vertical Blocks": 14 } },
            { name: "emboss", mn: "ADBE Emboss" },
            { name: "venetian_blinds", mn: "ADBE Venetian Blinds", p: { "Transition Completion": 40 } },
            { name: "linear_wipe_anim", mn: "ADBE Linear Wipe", p: { "Feather": 40 }, k: { "Transition Completion": [[0, 0], [2, 100]] } },
            { name: "radial_wipe", mn: "ADBE Radial Wipe", p: { "Transition Completion": 60 } },
            { name: "stroke_on_mask", mn: "ADBE Stroke", mask: true, p: { "Brush Size": 12, "Color": [0, 1, 0.5] }, k: { "End": [[0, 0], [2, 100]] } },
            { name: "color_key", mn: "ADBE Color Key", src: "grid", p: { "Key Color": [0.9, 0.24, 0.24], "Color Tolerance": 40 } },
            { name: "linear_color_key", mn: "ADBE Linear Color Key2", src: "grid" },
            { name: "set_channels", mn: "ADBE Set Channels" },
            { name: "minimax", mn: "ADBE Minimax", src: "grid", p: { "Radius": 6 } },
            { name: "roughen_edges", mn: "ADBE Roughen Edges", src: "grid" },
            { name: "scatter", mn: "ADBE Scatter", p: { "Scatter Amount": 40 } },
            { name: "strobe_light", mn: "ADBE Strobe" },
            { name: "block_dissolve", mn: "ADBE Block Dissolve", p: { "Transition Completion": 50 } }
        ], M);
    };

    // 15 -----------------------------------------------------------------
    B.time_remap = function (M) {
        var c = comp("time_remap", W, H, 4);
        bg(c);
        var clock = comp("pre_clock_counter", 400, 200, 4);
        bg(clock, [0.2, 0.25, 0.3], "clock_bg");
        var ct = textLayer(clock, "0", "Arial-BoldMT", 90, [1, 1, 1], [200, 130]);
        ct.property("ADBE Text Properties").property("ADBE Text Document").expression = "timeToFrames(time).toString()";
        var hand = clock.layers.addSolid([1, 0.3, 0.2], "hand", 8, 80, 1);
        tr(hand).property("ADBE Anchor Point").setValue([4, 80]);
        tr(hand).property("ADBE Position").setValue([60, 100]);
        keys(tr(hand).property("ADBE Rotate Z"), [[0, 0], [4, 360]], KeyframeInterpolationType.LINEAR);
        function inst(name, x, y) {
            var l = c.layers.add(clock);
            l.name = name;
            tr(l).property("ADBE Position").setValue([x, y]);
            tr(l).property("ADBE Scale").setValue([90, 90]);
            return l;
        }
        var a = inst("TR_reverse_freeze", 240, 130);
        a.timeRemapEnabled = true;
        var trp = a.property("ADBE Time Remapping");
        keys(trp, [[0, 3], [2, 0], [3, 1], [4, 1]], KeyframeInterpolationType.LINEAR);
        trp.setInterpolationTypeAtKey(3, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.HOLD);
        var b = inst("TR_eased_speed_ramp", 720, 130);
        b.timeRemapEnabled = true;
        var trb = b.property("ADBE Time Remapping");
        keys(trb, [[0, 0], [4, 4]]);
        easeAll(trb, 90);
        var s = inst("STRETCH_reverse_-100", 240, 400);
        s.stretch = -100;
        s.startTime = 4;
        var s2 = inst("STRETCH_50_fast", 720, 400);
        s2.stretch = 50;
        var vid = imp(M + "/testsrc_360p25_h264.mp4");
        var v = c.layers.add(vid);
        v.name = "TR_video_frameblend_slowmo";
        tr(v).property("ADBE Scale").setValue([40, 40]);
        tr(v).property("ADBE Position").setValue([480, 270]);
        v.timeRemapEnabled = true;
        var tv = v.property("ADBE Time Remapping");
        keys(tv, [[0, 0], [4, 1]], KeyframeInterpolationType.LINEAR);
        for (var tk = tv.numKeys; tk >= 1; tk--) { if (tv.keyTime(tk) > 0.01 && tv.keyTime(tk) < 3.99) { tv.removeKey(tk); } }
        v.outPoint = 4;
        try { v.frameBlendingType = FrameBlendingType.FRAME_MIX; } catch (e) { warn("frame blend: " + e); }
        c.frameBlending = true;
        return { main: c.name, refs: [], tests: ["time remap reverse + hold freeze", "eased speed ramp", "time stretch -100% (reverse) and 50%", "time remap slow-mo on video with frame mix blending"] };
    };

    // 16 -----------------------------------------------------------------
    B.parenting = function (M) {
        var c = comp("parenting");
        bg(c);
        function seg(name, w, color, parent, pos, anchor) {
            var l = c.layers.addSolid(color, name, w, 24, 1);
            tr(l).property("ADBE Anchor Point").setValue(anchor || [0, 12]);
            if (parent) { l.parent = parent; }
            tr(l).property("ADBE Position").setValue(pos);
            return l;
        }
        var root = c.layers.addNull(DUR);
        root.name = "ROOT_null_scale_anim";
        tr(root).property("ADBE Position").setValue([200, 270]);
        keys(tr(root).property("ADBE Scale"), [[0, [100, 100]], [3, [80, 120]]]);
        var a = seg("ARM_upper", 200, [1, 0.4, 0.3], root, [0, 0]);
        keys(tr(a).property("ADBE Rotate Z"), [[0, -20], [1.5, 20], [3, -20]]);
        var b = seg("ARM_lower", 160, [0.3, 0.8, 0.4], a, [200, 12]);
        keys(tr(b).property("ADBE Rotate Z"), [[0, 0], [1.5, 60], [3, 0]]);
        var h = seg("HAND", 60, [0.3, 0.5, 1], b, [160, 12]);
        keys(tr(h).property("ADBE Rotate Z"), [[0, 0], [3, 180]]);
        var neg = c.layers.addSolid([1, 0.9, 0.2], "MIRROR_negative_scale_parent", 120, 60, 1);
        tr(neg).property("ADBE Position").setValue([700, 150]);
        tr(neg).property("ADBE Scale").setValue([-100, 100]);
        var nchild = c.layers.addSolid([0.8, 0.3, 0.9], "child_of_mirrored", 40, 40, 1);
        nchild.parent = neg;
        tr(nchild).property("ADBE Position").setValue([110, 0]);
        var p3 = c.layers.addNull(DUR);
        p3.name = "NULL_3D_parent";
        p3.threeDLayer = true;
        tr(p3).property("ADBE Position").setValue([700, 380, 0]);
        keys(tr(p3).property("ADBE Rotate Y"), [[0, 0], [3, 180]]);
        var c3 = c.layers.addSolid([0.2, 0.9, 0.9], "2D_child_of_3D_parent", 140, 80, 1);
        c3.parent = p3;
        tr(c3).property("ADBE Position").setValue([60, 0]);
        var textChild = textLayer(c, "text child", "Arial-BoldMT", 24, [1, 1, 1], [0, 0]);
        textChild.parent = h;
        tr(textChild).property("ADBE Position").setValue([60, -10]);
        return { main: c.name, refs: [], tests: ["3-level chain with anchors and rotation", "parent with non-uniform scale animation", "negative scale parent (mirror)", "2D child of 3D parent", "text layer parented to animated layer"] };
    };

    // 17 -----------------------------------------------------------------
    B.essential_graphics = function (M) {
        var tpl = comp("EGP_badge_template", 400, 200, 3);
        var base = shapeLayer(tpl, "badge_shape");
        var g = group(rootVec(base), "body");
        rect(contents(g), [360, 160], 40);
        var f = fill(contents(g), [0.2, 0.5, 1]);
        tr(base).property("ADBE Position").setValue([200, 100]);
        var t = textLayer(tpl, "TITLE", "Arial-BoldMT", 54, [1, 1, 1], [200, 120]);
        t.name = "badge_text";
        var icon = tpl.layers.addSolid([1, 1, 1], "badge_icon", 40, 40, 1);
        tr(icon).property("ADBE Position").setValue([60, 100]);
        var ok = [];
        function exp(prop, name) {
            try {
                var r = prop.addToMotionGraphicsTemplateAs(tpl, name);
                ok.push(name + (r ? "" : "(false)"));
            } catch (e) { warn("EGP add " + name + ": " + e); }
        }
        exp(t.property("ADBE Text Properties").property("ADBE Text Document"), "Title Text");
        exp(f.property("ADBE Vector Fill Color"), "Badge Color");
        exp(tr(base).property("ADBE Scale"), "Badge Scale");
        exp(tr(icon).property("ADBE Opacity"), "Icon Opacity");
        exp(tr(icon).property("ADBE Rotate Z"), "Icon Rotation");
        try { tpl.motionGraphicsTemplateName = "Badge"; } catch (e2) { warn("mgt name: " + e2); }
        var c = comp("essential_graphics");
        bg(c);
        var vals = [
            { name: "Badge_default", pos: [480, 110] },
            { name: "Badge_override_red_text", pos: [480, 270], text: "OVERRIDE", color: [1, 0.2, 0.3], scale: [80, 80], op: 30, rot: 45 },
            { name: "Badge_override_keyframed", pos: [480, 430], text: "KEYED", color: [0.2, 0.9, 0.4], animScale: true }
        ];
        for (var i = 0; i < vals.length; i++) {
            var v = vals[i];
            var l = c.layers.add(tpl);
            l.name = v.name;
            tr(l).property("ADBE Position").setValue(v.pos);
            var ov = l.property("ADBE Layer Overrides");
            if (!ov) { warn("no overrides group on " + v.name); continue; }
            try {
                if (v.text) {
                    var tp = ov.property("Title Text");
                    var td = tp.value; td.text = v.text; tp.setValue(td);
                }
                if (v.color) { ov.property("Badge Color").setValue(v.color); }
                if (v.scale) { ov.property("Badge Scale").setValue(v.scale); }
                if (v.op !== undefined) { ov.property("Icon Opacity").setValue(v.op); }
                if (v.rot !== undefined) { ov.property("Icon Rotation").setValue(v.rot); }
                if (v.animScale) { keys(ov.property("Badge Scale"), [[0, [60, 60]], [3, [120, 120]]]); keys(ov.property("Icon Rotation"), [[0, 0], [3, 360]]); }
            } catch (e3) { warn("override " + v.name + ": " + e3); }
        }
        return { main: c.name, refs: ["EGP_badge_template"], tests: ["Essential Properties on precomp: " + ok.join(", "), "3 instances: defaults, static overrides (text/color/scale/opacity/rotation), keyframed overrides", "motionGraphicsTemplateName"] };
    };

    // 18 -----------------------------------------------------------------
    B.markers_comp_settings = function (M) {
        var c = comp("markers_comp_settings", W, H, 3, 29.97);
        c.dropFrame = true;
        c.displayStartTime = 3600;
        c.workAreaStart = 0.5;
        c.workAreaDuration = 2;
        c.motionBlur = true;
        c.shutterAngle = 270;
        c.shutterPhase = -135;
        bg(c);
        var mv = c.layers.addSolid([1, 0.5, 0.2], "MB_fast_motion_blur_on", 80, 80, 1);
        mv.motionBlur = true;
        keys(tr(mv).property("ADBE Position"), [[0, [100, 200]], [1, [860, 200]], [2, [100, 300]], [3, [860, 300]]], KeyframeInterpolationType.LINEAR);
        var mv2 = c.layers.addSolid([0.3, 0.6, 1], "MB_off_same_motion", 80, 80, 1);
        keys(tr(mv2).property("ADBE Position"), [[0, [100, 420]], [1, [860, 420]], [2, [100, 480]], [3, [860, 480]]], KeyframeInterpolationType.LINEAR);
        var m1 = new MarkerValue("comp marker 1");
        c.markerProperty.setValueAtTime(0.5, m1);
        var m2 = new MarkerValue("chapter + duration");
        m2.duration = 1;
        m2.chapter = "Chapter A";
        m2.url = "https://example.com";
        m2.label = 3;
        c.markerProperty.setValueAtTime(1.5, m2);
        var lm = new MarkerValue("layer marker");
        lm.duration = 0.5;
        lm.comment = "layer marker with duration";
        var params = {}; params.key = "value";
        try { lm.setParameters(params); } catch (e) { warn("marker params: " + e); }
        mv.property("ADBE Marker").setValueAtTime(1, lm);
        // second comp with non-square pixels and 23.976
        var c2 = comp("comp_par_anamorphic_23976", 1440, 1080, 2, 23.976, 4 / 3);
        bg(c2, [0.1, 0.2, 0.1]);
        var circ = shapeLayer(c2, "circle_should_look_round");
        var g = group(rootVec(circ), "c");
        ellipse(contents(g), [600, 800]);
        stroke(contents(g), [1, 1, 1], 20);
        tr(circ).property("ADBE Position").setValue([720, 540]);
        var c3 = comp("comp_odd_size_60fps", 333, 777, 1, 60);
        bg(c3, [0.4, 0.1, 0.1]);
        var sq = c3.layers.addSolid([1, 1, 1], "spinner", 50, 50, 1);
        keys(tr(sq).property("ADBE Rotate Z"), [[0, 0], [1, 360]], KeyframeInterpolationType.LINEAR);
        return { main: c.name, refs: ["comp_par_anamorphic_23976", "comp_odd_size_60fps"], tests: ["29.97 drop-frame, start timecode 01:00:00;00", "work area", "comp motion blur (shutter 270/-135) per-layer on/off", "comp markers with duration/chapter/url/label", "layer marker with comment + parameters", "non-square PAR 4:3 at 23.976", "odd size 333x777 at 60fps"] };
    };

    // 19 -----------------------------------------------------------------
    B.layer_styles = function (M) {
        var c = comp("layer_styles");
        bg(c, [0.85, 0.85, 0.88]);
        var styles = ["Drop Shadow", "Inner Shadow", "Outer Glow", "Inner Glow", "Bevel and Emboss", "Satin", "Color Overlay", "Gradient Overlay", "Stroke"];
        var made = [];
        for (var i = 0; i < styles.length; i++) {
            var l = shapeLayer(c, "LS_" + styles[i].replace(/ /g, "_"));
            var g = group(rootVec(l), "r");
            rect(contents(g), [180, 120], 20);
            fill(contents(g), [0.3, 0.55, 0.95]);
            tr(l).property("ADBE Position").setValue([160 + (i % 3) * 320, 100 + Math.floor(i / 3) * 170]);
            for (var j = 1; j <= c.numLayers; j++) { c.layer(j).selected = false; }
            l.selected = true;
            c.openInViewer();
            var id = app.findMenuCommandId(styles[i]);
            if (id) {
                app.executeCommand(id);
                var ls = l.property("ADBE Layer Styles");
                var on = false;
                if (ls) {
                    for (var k = 1; k <= ls.numProperties; k++) {
                        var p = ls.property(k);
                        if (p.canSetEnabled && p.enabled && p.matchName !== "ADBE Blend Options Group") { on = true; }
                    }
                }
                made.push(styles[i] + (on ? "" : "(not applied)"));
            } else {
                warn("menu not found " + styles[i]);
            }
        }
        return { main: c.name, refs: [], tests: ["layer styles via menu: " + made.join(", ")] };
    };

    // 20 -----------------------------------------------------------------
    B.kitchen_sink = function (M) {
        var c = comp("kitchen_sink", 1280, 720, 5);
        var plate = imp(M + "/plate_1280x720.jpg");
        var bgL = c.layers.add(plate);
        bgL.name = "BG_plate_blurred";
        fx(bgL, "ADBE Gaussian Blur 2", { "Blurriness": 15 }, "ks");
        var vig = c.layers.addSolid([0, 0, 0], "VIGNETTE_mask_feather_multiply", 1280, 720, 1);
        var vm = vig.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
        vm.property("ADBE Mask Shape").setValue(pathShape([[160, 90], [1120, 90], [1120, 630], [160, 630]], null, null, true));
        vm.inverted = true;
        vm.property("ADBE Mask Feather").setValue([200, 200]);
        vig.blendingMode = BlendingMode.MULTIPLY;
        var card = comp("ks_card", 500, 300, 5);
        var cardShape = shapeLayer(card, "card_bg");
        var g = group(rootVec(cardShape), "r");
        rect(contents(g), [480, 280], 30);
        fill(contents(g), [1, 1, 1]);
        tr(cardShape).property("ADBE Position").setValue([250, 150]);
        var ttl = textLayer(card, "Kitchen Sink", "Georgia", 56, [0.1, 0.1, 0.2], [250, 140]);
        var an = ttl.property("ADBE Text Properties").property("ADBE Text Animators").addProperty("ADBE Text Animator");
        an.property("ADBE Text Animator Properties").addProperty("ADBE Text Opacity").setValue(0);
        keys(an.property("ADBE Text Selectors").addProperty("ADBE Text Selector").property("ADBE Text Percent Start"), [[0.5, 0], [2, 100]]);
        var line = shapeLayer(card, "underline_trim");
        var lg = group(rootVec(line), "l");
        path(contents(lg), pathShape([[60, 200], [440, 200]], null, null, false));
        stroke(contents(lg), [1, 0.4, 0.2], 8);
        var tp = addMod(contents(lg), "ADBE Vector Filter - Trim", "ks trim");
        if (tp) { keys(tp.property("ADBE Vector Trim End"), [[1, 0], [2.5, 100]]); easeAll(tp.property("ADBE Vector Trim End"), 70); }
        var cl = c.layers.add(card);
        cl.name = "CARD_3D_precomp";
        cl.threeDLayer = true;
        keys(tr(cl).property("ADBE Rotate Y"), [[0, -60], [2, 0]]);
        easeAll(tr(cl).property("ADBE Rotate Y"), 80);
        tr(cl).property("ADBE Position").setValue([640, 360, 0]);
        fx(cl, "ADBE Drop Shadow", { "Distance": 15, "Softness": 30, "Opacity": 50 }, "ks");
        var cam = c.layers.addCamera("CAM", [640, 360]);
        keys(tr(cam).property("ADBE Position"), [[0, [640, 360, -1600]], [5, [640, 360, -1300]]]);
        var spark = shapeLayer(c, "SPARKS_repeater_glow_add");
        var sg = group(rootVec(spark), "s");
        star(contents(sg), 1, 4, 20, 6);
        fill(contents(sg), [1, 0.9, 0.5]);
        var rp = addMod(contents(sg), "ADBE Vector Filter - Repeater", "ks rep");
        if (rp) {
            S(rp, "ADBE Vector Repeater Copies", 12);
            S(rp.property("ADBE Vector Repeater Transform"), "ADBE Vector Repeater Position", [0, 0]);
            S(rp.property("ADBE Vector Repeater Transform"), "ADBE Vector Repeater Rotation", 30);
            S(rp.property("ADBE Vector Repeater Transform"), "ADBE Vector Repeater Anchor", [0, 200]);
        }
        tr(spark).property("ADBE Position").setValue([640, 360]);
        tr(spark).property("ADBE Rotate Z").expression = "time * 30";
        fx(spark, "ADBE Glo2", { "Glow Radius": 25 }, "ks");
        spark.blendingMode = BlendingMode.ADD;
        var aud = imp(M + "/chord_stereo_48k.wav");
        c.layers.add(aud);
        var ctrl = c.layers.addNull(5);
        ctrl.name = "CTRL_parent";
        cl.parent = ctrl;
        tr(ctrl).property("ADBE Position").expression = "value + [0, Math.sin(time * 2) * 10]";
        return { main: c.name, refs: [], tests: ["combined: blurred plate, inverted feathered mask multiply vignette, 3D precomp card with text animator + trim path + drop shadow, camera dolly, repeater sparks with glow (add mode), audio, null parent with expression"] };
    };

    // 21/22 project bit depth --------------------------------------------
    function bitDepthComp(name, M) {
        var c = comp(name);
        var ramp = c.layers.addSolid([0, 0, 0], "RAMP_banding_test", W, H, 1);
        fx(ramp, "ADBE Ramp", { "Start of Ramp": [0, 270], "End of Ramp": [960, 270], "Start Color": [0.1, 0.1, 0.15], "End Color": [0.25, 0.2, 0.3] }, name);
        var hot = c.layers.addSolid([1, 0.6, 0.2], "HOT_glow_over_white", 200, 200, 1);
        fx(hot, "ADBE Exposure2", { "Exposure": 2 }, name);
        fx(hot, "ADBE Glo2", { "Glow Radius": 60, "Glow Intensity": 2 }, name);
        var tx = textLayer(c, name, "Arial-BoldMT", 40, [1, 1, 1], [480, 470]);
        var add = c.layers.addSolid([0.8, 0.8, 0.8], "ADD_overlap", 300, 200, 1);
        add.blendingMode = BlendingMode.ADD;
        tr(add).property("ADBE Position").setValue([600, 270]);
        return c;
    }
    B.project_16bpc = function (M) {
        app.project.bitsPerChannel = 16;
        var c = bitDepthComp("project_16bpc", M);
        return { main: c.name, refs: [], tests: ["project 16 bpc", "smooth ramp (banding)", "exposure + glow"] };
    };
    B.project_32bpc_linear = function (M) {
        app.project.bitsPerChannel = 32;
        try { app.project.linearBlending = true; } catch (e) { warn("linearBlending: " + e); }
        try { app.project.workingSpace = "sRGB IEC61966-2.1"; } catch (e2) { warn("workingSpace: " + e2); }
        try { app.project.linearizeWorkingSpace = true; } catch (e3) { warn("linearize: " + e3); }
        var c = bitDepthComp("project_32bpc_linear", M);
        return { main: c.name, refs: [], tests: ["project 32 bpc float", "linear blending / linearized working space (if supported)", "overbright exposure + glow, add blend"] };
    };

    // 23 project organisation --------------------------------------------
    B.project_structure = function (M) {
        var fComps = folder("01_Comps");
        var fPre = folder("02_Precomps");
        var fMedia = folder("03_Media");
        var fSub = folder("Images");
        fSub.parentFolder = fMedia;
        var png = imp(M + "/grid_rgba.png");
        png.parentFolder = fSub;
        png.label = 11;
        png.comment = "footage comment";
        var unused = imp(M + "/soft_alpha.png");
        unused.parentFolder = fSub;
        unused.name = "soft_alpha_UNUSED_renamed";
        var solidsFolder = null;
        var pre = comp("struct_precomp", 400, 400, 2);
        pre.parentFolder = fPre;
        pre.layers.add(png);
        var placeholder = app.project.importPlaceholder("missing_placeholder", 640, 360, 30, 2);
        placeholder.parentFolder = fMedia;
        var main = comp("project_structure", W, H, 2);
        main.parentFolder = fComps;
        main.comment = "main comp comment";
        bg(main);
        var l = main.layers.add(pre);
        var ph = main.layers.add(placeholder);
        tr(ph).property("ADBE Scale").setValue([30, 30]);
        tr(ph).property("ADBE Position").setValue([800, 400]);
        // proxy on precomp
        try { pre.setProxy(new File(M + "/plate_1280x720.jpg")); pre.useProxy = false; } catch (e) { warn("proxy: " + e); }
        try { main.layers.addSolid([1, 1, 1], "solid_in_solids_folder", 50, 50, 1); } catch (e2) {}
        try { app.project.expressionEngine = "javascript-1.0"; } catch (e3) { warn("expr engine: " + e3); }
        return { main: main.name, refs: [], tests: ["nested project folders", "renamed + unused footage", "item labels and comments", "placeholder (missing footage) item", "proxy set but disabled on precomp", "auto Solids folder"] };
    };

    CORPUS.B = B;
    CORPUS.order = [
        ["01_solids_nulls_adjustment", "solids_nulls_adjustment"],
        ["02_shapes_basic", "shapes_basic"],
        ["03_shapes_modifiers", "shapes_modifiers"],
        ["04_text", "text"],
        ["05_footage_images", "footage_images"],
        ["06_footage_video_audio", "footage_video_audio"],
        ["07_precomps_nesting", "precomps_nesting"],
        ["08_masks", "masks"],
        ["09_track_mattes", "track_mattes"],
        ["10_blend_modes", "blend_modes"],
        ["11_3d_camera_lights", "threed_camera_lights"],
        ["12_keyframes_easing", "keyframes_easing"],
        ["13_expressions", "expressions"],
        ["14a_effects_blur_color", "effects_blur_color"],
        ["14b_effects_distort_generate", "effects_distort_generate"],
        ["14c_effects_stylize_transition", "effects_stylize_transition"],
        ["15_time_remap", "time_remap"],
        ["16_parenting", "parenting"],
        ["17_essential_graphics", "essential_graphics"],
        ["18_markers_comp_settings", "markers_comp_settings"],
        ["19_layer_styles", "layer_styles"],
        ["20_kitchen_sink", "kitchen_sink"],
        ["21_project_16bpc", "project_16bpc"],
        ["22_project_32bpc_linear", "project_32bpc_linear"],
        ["23_project_structure", "project_structure"]
    ];

    CORPUS.build = function (key, mediaDir) {
        CORPUS.warnings = [];
        var info = B[key](mediaDir);
        info.warnings = CORPUS.warnings;
        info.aeVersion = app.version;
        return info;
    };

    CORPUS.findComp = function (name) {
        for (var i = 1; i <= app.project.numItems; i++) {
            var it = app.project.item(i);
            if (it instanceof CompItem && it.name === name) { return it; }
        }
        return null;
    };

    // Reference renders: full PNG sequence + H.264 of main comp, one PNG frame (t=1s) per ref comp.
    // AE 26 forbids setSettings Format: use a PNG-sequence output template (this PC: "PSD_to_PNG_Export")
    CORPUS.pngTemplate = function (om) {
        var names = ["PSD_to_PNG_Export", "PNG Sequence", "PNG Sequence with Alpha"];
        for (var i = 0; i < names.length; i++) {
            try {
                om.applyTemplate(names[i]);
                if (om.getSettings(GetSettingsFormat.STRING)["Format"] === "PNG Sequence") { return names[i]; }
            } catch (e) { }
        }
        throw new Error("no PNG sequence output template");
    };

    CORPUS.queueRefs = function (info, outDir) {
        var rq = app.project.renderQueue;
        while (rq.numItems > 0) { rq.item(1).remove(); }
        new Folder(outDir).create();
        var main = CORPUS.findComp(info.main);
        var it = rq.items.add(main);
        it.applyTemplate("Best Settings");
        it.timeSpanStart = 0;
        it.timeSpanDuration = main.duration;
        var om = it.outputModule(1);
        CORPUS.pngTemplate(om);
        var seqDir = outDir + "/" + main.name + "_png";
        new Folder(seqDir).create();
        om.file = new File(seqDir + "/" + main.name + "_[#####].png");
        var it2 = rq.items.add(main);
        it2.applyTemplate("Best Settings");
        it2.timeSpanStart = 0;
        it2.timeSpanDuration = main.duration;
        var om2 = it2.outputModule(1);
        om2.applyTemplate("H.264 - Match Render Settings - 15 Mbps");
        om2.file = new File(outDir + "/" + main.name + ".mp4");
        for (var r = 0; r < info.refs.length; r++) {
            var rc = CORPUS.findComp(info.refs[r]);
            if (!rc) { continue; }
            var ri = rq.items.add(rc);
            ri.applyTemplate("Best Settings");
            ri.timeSpanStart = Math.min(1, rc.duration - rc.frameDuration);
            ri.timeSpanDuration = rc.frameDuration;
            var rom = ri.outputModule(1);
            CORPUS.pngTemplate(rom);
            rom.file = new File(outDir + "/" + rc.name + "_t1s_[#####].png");
        }
        return rq.numItems;
    };
})();
