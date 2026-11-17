"""Build manifest.json + README.md for the corpus and stage the publishable copy.

python make_manifest.py              -> writes ../manifest.json, ../README.md
python make_manifest.py --stage DIR  -> also copies a slim copy into DIR (git branch layout):
    DIR/corpus/{aep,media,build,manifest.json,README.md}
    DIR/reference/<id>/  (every 15th PNG frame + last frame, single-frame refs, mp4, info json)
    DIR/reference/timings/
"""
import csv
import glob
import json
import os
import shutil
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AEP = os.path.join(ROOT, "aep", "ae2026_v26")
REF = os.path.join(ROOT, "reference")


def rel(p):
    return os.path.relpath(p, ROOT).replace("\\", "/")


def load(p):
    with open(p, encoding="utf-8-sig") as f:
        return json.load(f)


def timings():
    out = {}
    p = os.path.join(REF, "timings", "aerender_timings.csv")
    if os.path.exists(p):
        with open(p, encoding="utf-8-sig") as f:
            for row in csv.DictReader(f):
                out[row["project"]] = row
    return out


def ref_files(refdir):
    files = []
    for dp, _, fs in os.walk(refdir):
        for f in fs:
            files.append(os.path.join(dp, f))
    return files


FEATURE_NOTES = {
    "01_solids_nulls_adjustment": "Solids (incl. PAR 2), null parent with rotation keys, adjustment layer with a mask limiting Hue/Saturation + Gaussian Blur, disabled/guide/shy/locked/draft layers, trimmed in/out, label+comment, purple comp background.",
    "19_layer_styles": "NOT BUILT: applying Layer Styles needs the Layer > Layer Styles menu, which crashes windowless After Effects.",
}


def main():
    t = timings()
    entries = []
    for aep in sorted(glob.glob(os.path.join(AEP, "*.aep"))):
        tid = os.path.splitext(os.path.basename(aep))[0]
        info_p = os.path.join(REF, tid, "info_ae26.json")
        info = load(info_p) if os.path.exists(info_p) else {}
        refs = sorted(rel(p) for p in ref_files(os.path.join(REF, tid)) if not p.endswith(".json"))
        e = {
            "id": tid,
            "file": rel(aep),
            "size_bytes": os.path.getsize(aep),
            "saved_with": "After Effects 26.5 (2026)",
            "main_comp": info.get("main"),
            "extra_ref_comps": info.get("refs", []),
            "tests": info.get("tests", []),
            "warnings_while_building": info.get("warnings", []),
            "reference": {
                "png_sequence_dir": rel(os.path.join(REF, tid, (info.get("main") or "") + "_png")),
                "mp4": rel(os.path.join(REF, tid, (info.get("main") or "") + ".mp4")),
                "files": len(refs),
            },
            "aerender_seconds_wall": float(t[tid]["seconds_wall"].replace(",", "")) if tid in t else None,
        }
        if tid in FEATURE_NOTES:
            e["note"] = FEATURE_NOTES[tid]
        entries.append(e)

    sweep = []
    for aep in sorted(glob.glob(os.path.join(AEP, "effects_sweep", "*.aep"))):
        tid = os.path.splitext(os.path.basename(aep))[0]
        info_p = os.path.join(REF, "effects_sweep", tid, "info_ae26.json")
        info = load(info_p) if os.path.exists(info_p) else {}
        sweep.append({
            "id": tid,
            "file": rel(aep),
            "size_bytes": os.path.getsize(aep),
            "category": info.get("category"),
            "contact_comp": info.get("main"),
            "effects": info.get("effects", []),
            "reference": {
                "frame_t1s": rel(os.path.join(REF, "effects_sweep", tid, (info.get("main") or "") + "_t1s_00030.png")),
                "mp4": rel(os.path.join(REF, "effects_sweep", tid, (info.get("main") or "") + ".mp4")),
            },
            "aerender_seconds_wall": float(t[tid]["seconds_wall"].replace(",", "")) if tid in t else None,
        })

    media = []
    for dp, _, fs in os.walk(os.path.join(ROOT, "media")):
        for f in sorted(fs):
            p = os.path.join(dp, f)
            media.append({"file": rel(p), "size_bytes": os.path.getsize(p)})

    n_fx = sum(len(s["effects"]) for s in sweep)
    not_ok = [dict(e, file=s["id"]) for s in sweep for e in s["effects"] if e.get("status") != "ok"]
    manifest = {
        "title": "EffectCraft .aep import/export test corpus",
        "built_with": "Adobe After Effects 26.5x89 (ExtendScript, background instance), Windows 11",
        "generator": "build/corpus_lib.jsx (feature files), build/corpus_sweep.jsx (effects sweep), build/make_media.py (media)",
        "path_layout": "Footage is referenced as <root>/media/... from <root>/aep/ae2026_v26/*.aep; keep this relative layout. Absolute path stored in the .aep: D:/AI_ZONE/Commerical/AE_IDEAS/effectcraft-aep-corpus/media/...",
        "older_formats": "Not included: AE 2024/2025 are not installed on the build PC (only leftover folders), and AE 2026 'Save a Copy As 25.x/24.x' crashes the windowless AE instance.",
        "reference_render": "aerender, Best Settings, PNG sequence RGB+alpha of the main comp (every frame, 0-based numbering [#####]) + H.264 15 Mbps; extra comps one PNG frame at t=1s. Times in reference/timings.",
        "feature_files": entries,
        "effects_sweep": {
            "description": "Every built-in effect (Adobe, Cycore CC, Keylight, Mocha, Immersive, obsolete) found in AE 26.5, each on its own 320x180 2 s comp with DEFAULT parameters applied to a shared source precomp (SWEEP_SOURCE: photo plate + moving grid PNG; audio effects on a WAV layer). <Category>_contact tiles them 6 per row.",
            "effect_count": n_fx,
            "not_applied": not_ok,
            "files": sweep,
        },
        "media": media,
    }
    with open(os.path.join(ROOT, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=1, ensure_ascii=False)

    lines = ["# EffectCraft .aep test corpus", "",
             "Real After Effects projects built by script in AE 26.5 (2026) to test EffectCraft's .aep import/export.", "",
             "Layout: `aep/ae2026_v26/` projects, `media/` footage they reference (keep the relative layout), `reference/` AE renders, `build/` generator scripts, `manifest.json` machine-readable list.", "",
             "## Feature files", "", "| File | Main comp | What it tests | aerender, s |", "|---|---|---|---|"]
    for e in entries:
        lines.append("| `%s` | `%s` | %s | %s |" % (os.path.basename(e["file"]), e["main_comp"], "; ".join(e["tests"]) or e.get("note", ""),
                                             "%.1f" % e["aerender_seconds_wall"] if e["aerender_seconds_wall"] else "-"))
    lines += ["", "## Effects sweep (%d built-in effects, default parameters)" % n_fx, "",
              "| File | Category | Effects | aerender, s |", "|---|---|---|---|"]
    for s in sweep:
        lines.append("| `%s` | %s | %d | %s |" % (os.path.basename(s["file"]), s["category"], len(s["effects"]),
                                               "%.1f" % s["aerender_seconds_wall"] if s["aerender_seconds_wall"] else "-"))
    lines += ["", "Effects that could not be applied by script (they open a modal dialog on apply): " +
              (", ".join("%s (%s)" % (e["effect"], e["matchName"]) for e in not_ok) or "none") + ". Their comps exist without the effect.", "",
              "## Notes", "",
              "- " + manifest["older_formats"],
              "- `19_layer_styles` is missing: Layer Styles can only be applied through the menu, which crashes windowless AE.",
              "- Gradient fills/strokes keep AE's default white-black ramp (gradient colors are not scriptable).",
              "- Warp Stabilizer / Rolling Shutter Repair / Camera Shake Deblur render an 'analyzing' state with default settings.",
              "- Reference PNGs are straight RGB+alpha, 8 bpc (16/32 bpc projects are rendered at 8 bpc too).", ""]
    with open(os.path.join(ROOT, "README.md"), "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print("features", len(entries), "sweep files", len(sweep), "effects", n_fx, "not applied", len(not_ok))

    if "--stage" in sys.argv:
        dst = sys.argv[sys.argv.index("--stage") + 1]
        stage(dst)


def copy(src, dst):
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    shutil.copy2(src, dst)


def stage(dst):
    cor = os.path.join(dst, "corpus")
    for dp, dns, fs in os.walk(os.path.join(ROOT, "aep")):
        dns[:] = [d for d in dns if d != "_harness" and not d.endswith(" Logs")]
        for f in fs:
            if f.endswith(".aep"):
                s = os.path.join(dp, f)
                copy(s, os.path.join(cor, os.path.relpath(s, ROOT)))
    for sub in ("media", "build"):
        for dp, dns, fs in os.walk(os.path.join(ROOT, sub)):
            dns[:] = [d for d in dns if d != "__pycache__"]
            for f in fs:
                s = os.path.join(dp, f)
                copy(s, os.path.join(cor, os.path.relpath(s, ROOT)))
    for f in ("manifest.json", "README.md"):
        copy(os.path.join(ROOT, f), os.path.join(cor, f))
    # reference: thin PNG sequences to every 15th frame + last
    for dp, dns, fs in os.walk(REF):
        dns[:] = [d for d in dns if not d.endswith(" Logs")]
        pngs = sorted(f for f in fs if f.endswith(".png"))
        keep = set(pngs)
        if dp.endswith("_png") and len(pngs) > 2:
            keep = set(pngs[::15]) | {pngs[-1]}
        for f in fs:
            if f.endswith(".png") and f not in keep:
                continue
            s = os.path.join(dp, f)
            copy(s, os.path.join(dst, "reference", os.path.relpath(s, REF)))


if __name__ == "__main__":
    main()
