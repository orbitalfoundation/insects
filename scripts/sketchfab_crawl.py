# Find WELL-LABELLED rigged insect models per base type. For each candidate we range-fetch
# only the glTF JSON header (first ~1MB, not the whole mesh) and score its skeleton's joint
# names for insect anatomy (leg/head/abdomen/antenna/wing/...). The best-scoring model per
# type is a ready-made per-component reference like the honeybee sculpt.
import json, re, urllib.parse, urllib.request

TOK = open("/home/anselm/3dgen/.sf_token").read().strip()
TYPES = ["honey bee", "bumblebee", "wasp", "ant", "beetle", "ladybug", "housefly", "mosquito",
         "dragonfly", "butterfly", "moth", "praying mantis", "grasshopper", "cricket",
         "cockroach", "cicada", "spider", "scorpion"]
ANAT = {"head": r"head", "thorax": r"thorax|prothorax", "abdomen": r"abdom", "leg": r"leg|coxa|femur|tibia|tarsus",
        "antenna": r"antenn", "wing": r"wing|elytr", "mandible": r"mandib|labrum|palp|proboscis", "eye": r"eye"}

def api(path, params):
    url = "https://api.sketchfab.com/v3/" + path + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"Authorization": "Token " + TOK})
    return json.load(urllib.request.urlopen(req, timeout=25))

def glb_json_header(url, cap=1_500_000):
    req = urllib.request.Request(url, headers={"Range": f"bytes=0-{cap}"})
    buf = urllib.request.urlopen(req, timeout=30).read()
    if buf[:4] != b"glTF": return None
    import struct
    ln, ty = struct.unpack_from("<II", buf, 12)
    if ty != 0x4E4F534A: return None
    data = buf[20:20 + ln]
    if len(data) < ln: return None            # JSON truncated by the range cap
    return json.loads(data)

def score(js):
    nodes = js.get("nodes", [])
    names = [(n.get("name") or "").lower() for n in nodes]
    joints = set()
    for s in js.get("skins", []):
        for j in s.get("joints", []):
            if j < len(names): joints.add(names[j])
    pool = joints if joints else set(names)     # fall back to node names if no skin
    hits = {k: sum(1 for nm in pool if re.search(rx, nm)) for k, rx in ANAT.items()}
    cats = sum(1 for k in hits if hits[k] > 0)
    return cats, len(pool), hits

print(f"{'type':<15} {'score':<6} {'joints':<7} matched anatomy")
for t in TYPES:
    try:
        d = api("search", {"type": "models", "q": t, "downloadable": "true", "animated": "true",
                           "sort_by": "-likeCount", "count": 24})
        best = None
        for m in d.get("results", []):
            if (m.get("faceCount") or 0) > 400000: continue
            nm = m["name"].lower()
            if any(w in nm for w in ["transformer", "dragon", "car ", "girl", "gun", "robot", "manga"]): continue
            try:
                dl = api(f"models/{m['uid']}/download", {})
                url = (dl.get("glb") or {}).get("url")
                if not url: continue
                js = glb_json_header(url)
                if not js: continue
                cats, nj, hits = score(js)
                if best is None or cats > best[0]:
                    best = (cats, nj, hits, m)
                if cats >= 6: break            # good enough, stop early
            except Exception:
                continue
        if best:
            cats, nj, hits, m = best
            got = ",".join(k for k in ANAT if hits[k] > 0)
            print(f"{t:<15} {cats}/8    {nj:<7} {got:<45} {m['uid']}  {m['name'][:30]}")
        else:
            print(f"{t:<15} —      (no rigged insect model found in top hits)")
    except Exception as e:
        print(f"{t:<15} ERROR {e}")
