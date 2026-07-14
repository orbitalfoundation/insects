# Survey Sketchfab for RIGGED (skeleton = labelled joints) + downloadable models across the
# base insect types. A rig gives per-component landmarks for free — as the honeybee sculpt did.
import json, sys, urllib.parse, urllib.request

TOK = open("/home/anselm/3dgen/.sf_token").read().strip()
TYPES = ["honey bee", "bumblebee", "wasp", "ant", "beetle", "ladybug", "housefly", "mosquito",
         "dragonfly", "butterfly", "moth", "praying mantis", "grasshopper", "cricket",
         "cockroach", "cicada", "spider", "scorpion", "termite", "flea"]

def api(path, params):
    url = "https://api.sketchfab.com/v3/" + path + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"Authorization": "Token " + TOK})
    return json.load(urllib.request.urlopen(req, timeout=25))

print(f"{'type':<15} {'rigged/dl hits':<14} best candidate (uid  faces  anim  license  name)")
for t in TYPES:
    try:
        # animated=true → has a skeleton; downloadable=true → we can fetch it
        d = api("search", {"type": "models", "q": t, "downloadable": "true",
                           "animated": "true", "sort_by": "-likeCount", "count": 24})
        res = d.get("results", [])
        # prefer modest poly counts (simple, clean) with a real animation/rig
        cand = [m for m in res if (m.get("faceCount") or 0) < 400000]
        cand.sort(key=lambda m: m.get("likeCount", 0), reverse=True)
        best = cand[0] if cand else (res[0] if res else None)
        if best:
            lic = (best.get("license") or {}).get("slug")
            print(f"{t:<15} {len(res):<14} {best['uid']}  fc={best.get('faceCount')}  anim={best.get('animationCount')}  {lic}  {best['name'][:38]}")
        else:
            print(f"{t:<15} {len(res):<14} (none)")
    except Exception as e:
        print(f"{t:<15} ERROR {e}")
