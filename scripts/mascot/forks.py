# Rebuild the pallet-jack forks hidden under "集まれ！" and composite them under the cut-out mascot.
# Coordinates are in the 1414x2000 "display" grid; the cut-out lives on the 2x grid (2828x4000).
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

sp = sys.argv[1]
full = Image.open(f"{sp}/cut_full_uncropped.png")          # 2828x4000, transparent except mascot
S = 2
def P(pts, dx=0, dy=0):
    return [((x + dx) * S, (y + dy) * S) for x, y in pts]

# fork plate (top face), receding to the lower right; map coords + (300, 1400)
ox, oy = 300, 1400
# plate: long top edge (near-top → tip-top), tip end, long bottom edge back to the housing.
# The near end is pushed up/left so it tucks behind the wheel housing.
top = [(300 + ox, 120 + oy), (765 + ox, 300 + oy), (750 + ox, 408 + oy), (190 + ox, 300 + oy)]
side = [(190 + ox, 300 + oy), (750 + ox, 408 + oy), (747 + ox, 424 + oy), (186 + ox, 316 + oy)]
# thin gap between the two tines
slot = [(262 + ox, 212 + oy), (758 + ox, 352 + oy), (757 + ox, 362 + oy), (255 + ox, 226 + oy)]
shine = [(310 + ox, 136 + oy), (735 + ox, 300 + oy), (733 + ox, 310 + oy), (306 + ox, 147 + oy)]
shine2 = [(245 + ox, 248 + oy), (745 + ox, 378 + oy), (744 + ox, 386 + oy), (242 + ox, 258 + oy)]

W, H = full.size
layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
d = ImageDraw.Draw(layer)
# crimson double offset, like the poster
d.polygon(P(top + side, -16, 6), fill=(168, 23, 58, 255))
d.polygon(P(top + side, -9, 3), fill=(254, 22, 68, 255))
d.polygon(P(side), fill=(178, 58, 30, 255), outline=(70, 22, 10, 255), width=5)
d.polygon(P(top), fill=(226, 83, 47, 255), outline=(70, 22, 10, 255), width=5)
d.polygon(P(shine), fill=(244, 128, 92, 255))
d.polygon(P(shine2), fill=(244, 128, 92, 255))
d.polygon(P(slot), fill=(70, 22, 10, 255))
layer = layer.filter(ImageFilter.SMOOTH)

out = Image.alpha_composite(layer, full)
out = out.crop(out.getbbox())
out.save(f"{sp}/mascot_full.png")
print(out.size)
