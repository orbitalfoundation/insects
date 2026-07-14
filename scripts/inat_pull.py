# Pull REAL, research-grade, species-labelled insect photos from iNaturalist (open API,
# CC-licensed) — the reference anchor for the CLIP realism oracle. Far better than generated
# art: real images, correct species, and what CLIP was trained on. Output: /tmp/inat/<sp>/*.jpg
import json, os, time, urllib.parse, urllib.request

# our roster → iNaturalist taxon
TAXA = {
    "honeybee": "Apis mellifera", "bumblebee": "Bombus", "jewel_beetle": "Buprestidae",
    "ladybird": "Coccinella septempunctata", "mantis": "Mantis religiosa",
    "dragonfly": "Anisoptera", "housefly": "Musca domestica", "mosquito": "Culicidae",
}
PER = 24
UA = {"User-Agent": "parametric-insects-research/1.0 (CLIP reference set)"}

def get(url):
    return json.load(urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30))

os.makedirs("/tmp/inat", exist_ok=True)
print(f"{'species':<14} taxon                       photos")
for sp, taxon in TAXA.items():
    outdir = f"/tmp/inat/{sp}"; os.makedirs(outdir, exist_ok=True)
    q = urllib.parse.urlencode({
        "taxon_name": taxon, "quality_grade": "research", "photos": "true",
        "photo_license": "cc0,cc-by,cc-by-nc,cc-by-sa", "per_page": 60,
        "order_by": "votes", "order": "desc",
    })
    try:
        d = get("https://api.inaturalist.org/v1/observations?" + q)
    except Exception as e:
        print(f"{sp:<14} {taxon:<26} ERROR {e}"); continue
    n = 0
    for obs in d.get("results", []):
        for ph in obs.get("photos", []):
            if n >= PER: break
            url = (ph.get("url") or "").replace("square", "medium")
            if not url: continue
            try:
                data = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30).read()
                open(f"{outdir}/{n:02d}.jpg", "wb").write(data); n += 1
            except Exception:
                continue
        if n >= PER: break
    print(f"{sp:<14} {taxon:<26} {n}")
    time.sleep(1)  # be polite to the API
print("\nreal reference photos in /tmp/inat/<species>/")
