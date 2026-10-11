import sys
import numpy as np
from PIL import Image
from scipy import ndimage

src, out_dir = sys.argv[1], sys.argv[2]
im = Image.open(src).convert("RGBA")
W, H = 2828, 4000                      # 2x the 1414x2000 "display" grid used for coordinates
k = W / 1414
im = im.resize((W, H), Image.LANCZOS)
a = np.asarray(im).astype(np.int16)
r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]

def box(x0, y0, x1, y1):
    m = np.zeros((H, W), bool)
    m[int(y0 * k):int(y1 * k), int(x0 * k):int(x1 * k)] = True
    return m

# only the top "バース人材" lettering is removed; "集まれ！" at the bottom stays part of the art
text_zone = box(80, 160, 1180, 448)
keep_zone = box(330, 1440, 1270, 1850)
white = (r >= 250) & (g >= 250) & (b >= 250)
crimson = ((r > 190) & (g < 70) & (b < 110)) | ((r > 110) & (r <= 220) & (g < 50) & (b < 85))
text = text_zone & (white | crimson) & (al > 0)

keep = (al > 24) & ~text
# remove thin anti-aliased fringes left over from the glyphs
keep = ndimage.binary_opening(keep, iterations=2)
lab, n = ndimage.label(keep)
sizes = ndimage.sum(keep, lab, range(1, n + 1))
main_id = int(np.argmax(sizes)) + 1
# keep the character plus every glyph piece of "集まれ！" (some strokes are separate islands)
ids = {main_id} | {int(i) for i in np.unique(lab[keep_zone & keep]) if i}
main = np.isin(lab, list(ids))
main = ndimage.binary_closing(main, iterations=2) & (al > 0) & ~text
out = np.asarray(im).copy()
out[..., 3] = np.where(main, out[..., 3], 0)
# the artist's signature (bottom-left) is white in the poster; make it ink so it reads on paper
sig = box(195, 1740, 505, 1990) & (r > 238) & (g > 238) & (b > 238)
out[sig, 0], out[sig, 1], out[sig, 2] = 23, 22, 20
sprite = Image.fromarray(out)
sprite.save(f"{out_dir}/cut_full_uncropped.png")
sprite = sprite.crop(sprite.getbbox())
sprite.save(f"{out_dir}/cut_full.png")
print("components", n, "sprite", sprite.size)
