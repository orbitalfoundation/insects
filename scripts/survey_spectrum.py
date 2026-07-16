# Survey Sketchfab across our insect spectrum for the BEST rigged/labelled reference per type.
# For each candidate: range-fetch just the glTF header, extract the skeleton, and score
#   completeness (anatomy families present), label quality (named joints), and whether it
#   matches the bee rig signature (root_jnt/body_jnt/head_Jnt). Answers: which model per
#   insect, and how common the convention is.
import json, re, struct, urllib.parse, urllib.request

TOK = open("/home/anselm/3dgen/.sf_token").read().strip()
# spectrum → search terms
TYPES = {
    "jewel_beetle": ["jewel beetle", "buprestid beetle", "beetle insect"],
    "ladybug":      ["ladybug", "ladybird beetle", "coccinella"],
    "mantis":       ["praying mantis", "mantis insect"],
    "dragonfly":    ["dragonfly", "dragonfly insect"],
    "housefly":     ["housefly", "fly insect musca"],
    "mosquito":     ["mosquito", "mosquito insect"],
}
# specific models the human pointed at
EXPLICIT = {
    "mantis":    ["2d03c2e919da4e909ec4c8b28d2d4e0d", "cad591b4682c45098dfadba67a1cf46b"],
    "ladybug":   ["d0be6863dd674bfaa93ded924dab6613"],
    "dragonfly": ["1eca30fd3090463a97eae137237abe83"],
}
ANAT = {"head": r"head", "thorax": r"thorax|prothorax|\bbody_jnt", "abdomen": r"abdom",
        "leg": r"leg|coxa|femur|tibia|tarsus", "antenna": r"antenn", "wing": r"wing|elytr",
        "mandible": r"mandib|labrum|palp|proboscis|mouth", "eye": r"eye"}
BADNAME = ["transformer", "dragon ", "car ", "girl", "gun", "robot", "manga", "minecraft", "lego", "cannon"]

def api(path, params):
    url = "https://api.sketchfab.com/v3/" + path + ("?" + urllib.parse.urlencode(params) if params else "")
    return json.load(urllib.request.urlopen(urllib.request.Request(url, headers={"Authorization": "Token " + TOK}), timeout=25))

def header(uid):
    try:
        dl = api(f"models/{uid}/download", None)
        url = (dl.get("glb") or {}).get("url")
        if not url: return None
        buf = urllib.request.urlopen(urllib.request.Request(url, headers={"Range": "bytes=0-1600000"}), timeout=30).read()
        if buf[:4] != b"glTF": return None
        ln, ty = struct.unpack_from("<II", buf, 12)
        if ty != 0x4E4F534A or len(buf) < 20 + ln: return None
        return json.loads(buf[20:20 + ln])
    except Exception:
        return None

def score(js):
    nodes = js.get("nodes", [])
    names = [(n.get("name") or "").lower() for n in nodes]
    joints = set()
    for s in js.get("skins", []):
        for j in s.get("joints", []):
            if j < len(names) and names[j]: joints.add(names[j])
    pool = joints if joints else set(n for n in names if n)
    fams = {k: sum(1 for nm in pool if re.search(rx, nm)) for k, rx in ANAT.items()}
    cats = sum(1 for k in fams if fams[k] > 0)
    labeled = sum(1 for nm in pool if any(re.search(rx, nm) for rx in ANAT.values()))
    lblq = labeled / max(len(pool), 1)
    beeTmpl = all(any(re.search(sig, nm) for nm in pool) for sig in [r"root_jnt", r"body_jnt", r"head_jnt"])
    return {"cats": cats, "joints": len(pool), "lblq": round(lblq, 2), "fams": [k for k in ANAT if fams[k] > 0], "bee": beeTmpl}

def candidates(terms):
    seen, out = set(), []
    for t in terms:
        try:
            for m in api("search", {"type": "models", "q": t, "downloadable": "true", "animated": "true",
                                     "sort_by": "-likeCount", "count": 24}).get("results", []):
                if m["uid"] in seen: continue
                if (m.get("faceCount") or 0) > 800000: continue
                if any(b in m["name"].lower() for b in BADNAME): continue
                seen.add(m["uid"]); out.append(m)
        except Exception: pass
    return out

print(f"{'type':<13} {'best uid':<34} {'cats':<5} {'joints':<7} {'lblq':<5} {'bee?':<5} author / name")
allbest = {}
for tkey, terms in TYPES.items():
    cands = candidates(terms)
    # put explicit ones first
    exp = EXPLICIT.get(tkey, [])
    order = [{"uid": u, "name": "(linked)", "user": {"username": "?"}} for u in exp] + cands
    best = None; tried = 0
    for m in order:
        if tried >= 14 and best and best[1]["cats"] >= 5: break
        js = header(m["uid"]); tried += 1
        if not js: continue
        s = score(js)
        key = (s["cats"], s["joints"] if s["joints"] < 300 else 300, s["lblq"])
        if best is None or key > best[0]:
            # fetch author/name if linked
            nm = m.get("name"); au = m.get("user", {}).get("username")
            if nm == "(linked)":
                try: info = api(f"models/{m['uid']}", None); nm = info.get("name"); au = info.get("user", {}).get("username")
                except Exception: pass
            best = (key, s, m["uid"], nm, au)
    if best:
        _, s, uid, nm, au = best; allbest[tkey] = best
        print(f"{tkey:<13} {uid:<34} {s['cats']}/8   {str(s['joints']):<7} {str(s['lblq']):<5} {('YES' if s['bee'] else 'no'):<5} {au} / {str(nm)[:26]}")
        print(f"              families: {', '.join(s['fams'])}")
    else:
        print(f"{tkey:<13} (no rigged candidate found)")
print("\nbee-template shared across types?", sum(1 for b in allbest.values() if b[1]['bee']), "/", len(allbest))
