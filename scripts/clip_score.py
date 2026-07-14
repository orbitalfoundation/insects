# CLIP oracle experiment. Does a CPU image encoder give a human-free realism/identity signal
# on our renders?  (A) discrimination: is each species render read as the right insect?
# (B) realism gradient: does inflating the eye lower the "honeybee" score?
import glob, os, torch, open_clip
from PIL import Image

CLIPDIR = "/tmp/clip"
REAL_BEE = "/home/anselm/.claude/uploads/3bdba677-a83b-4b46-bc1c-ebad03e37f31/7928dae6-IMG_6243.jpeg"

model, _, preprocess = open_clip.create_model_and_transforms("ViT-B-32", pretrained="openai")
tokenizer = open_clip.get_tokenizer("ViT-B-32")
model.eval()

@torch.no_grad()
def img_embed(path):
    x = preprocess(Image.open(path).convert("RGB")).unsqueeze(0)
    f = model.encode_image(x); return f / f.norm(dim=-1, keepdim=True)

@torch.no_grad()
def txt_embed(t):
    f = model.encode_text(tokenizer([t])); return f / f.norm(dim=-1, keepdim=True)

# ---- (A) DISCRIMINATION ----
LABELS = {
    "honeybee": "a honeybee", "jewel_beetle": "a beetle", "mosquito": "a mosquito",
    "mantis": "a praying mantis", "dragonfly": "a dragonfly", "ladybird": "a ladybug",
    "housefly": "a housefly",
}
prompts = {k: txt_embed("a photo of " + v) for k, v in LABELS.items()}
print("=== (A) DISCRIMINATION — does CLIP read each render as the right insect? ===")
print(f"  {'render':<14} {'top-guess':<14} {'own-label rank':<16} correct?")
correct = 0
for sp in LABELS:
    p = f"{CLIPDIR}/sp_{sp}.png"
    if not os.path.exists(p): continue
    e = img_embed(p)
    sims = {k: float((e @ prompts[k].T)) for k in LABELS}
    ranked = sorted(sims, key=sims.get, reverse=True)
    top = ranked[0]; rank = ranked.index(sp) + 1
    ok = top == sp; correct += ok
    print(f"  {sp:<14} {top:<14} {rank}/{len(LABELS):<14} {'YES' if ok else 'no'}")
print(f"  → {correct}/{len(LABELS)} classified correctly\n")

# ---- (B) REALISM GRADIENT — inflating the eye should LOWER the honeybee score ----
bee_txt = txt_embed("a photo of a honeybee")
real = img_embed(REAL_BEE) if os.path.exists(REAL_BEE) else None
print("=== (B) REALISM GRADIENT — eye scale vs honeybee-ness (1.0 = correct size) ===")
for view in ["oblique", "head"]:
    print(f"  [{view} view]   eye×    sim→'honeybee'   sim→real-photo")
    for f in [0.6, 1.0, 1.6, 2.4]:
        fn = f"{CLIPDIR}/eye_{f}_{view}.png".replace("_1.0_", "_1_")
        if not os.path.exists(fn): fn = f"{CLIPDIR}/eye_{f}_{view}.png"
        if not os.path.exists(fn): print(f"             {f:<6} (missing {fn})"); continue
        e = img_embed(fn)
        st = float(e @ bee_txt.T)
        sr = float(e @ real.T) if real is not None else float("nan")
        mark = " <- correct" if f == 1.0 else (" (oversized)" if f > 1.0 else " (undersized)")
        print(f"             {f:<6} {st:6.3f}          {sr:6.3f}{mark}")
    print()
