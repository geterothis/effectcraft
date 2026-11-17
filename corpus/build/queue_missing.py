"""Make a per-render-queue-item job queue for fx-samples PNGs that are still missing.
python queue_missing.py <queue_dir>   (-> <queue_dir>/jobs.json)
RQ item order in each fx-nondefault-NN.aep = order of effects with a "png" field in fx-nondefault-NN.json.
"""
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "fx-samples-out")
q = sys.argv[1]
os.makedirs(q, exist_ok=True)
jobs = []
for name in sorted(os.listdir(OUT)):
    if not (name.startswith("fx-nondefault-") and name.endswith(".json")):
        continue
    tag = name[len("fx-nondefault-"):-5]
    data = json.load(open(os.path.join(OUT, name), encoding="utf-8"))
    rq = 0
    for e in data["effects"]:
        if not e.get("png"):
            continue
        rq += 1
        base = e["png"][:-4]
        if os.path.exists(os.path.join(OUT, base + "_00000.png")) or os.path.exists(os.path.join(OUT, e["png"])):
            continue
        jobs.append({"id": "%s-rq%02d" % (tag, rq), "project": os.path.join(OUT, "fx-nondefault-%s.aep" % tag),
                     "rqindex": rq, "matchName": e["matchName"]})
json.dump(jobs, open(os.path.join(q, "jobs.json"), "w", encoding="utf-8"), indent=1)
print(len(jobs), "missing")
