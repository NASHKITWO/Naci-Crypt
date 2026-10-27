#!/usr/bin/env python3
"""Membuat www/assets2.js (aset tambahan, base64) dari pack yang diunduh.
Pakai: python3 scripts/build-assets2.py <folder-berisi-pack> <DarkDungeon.png>
Folder harus berisi: 'RPG Items 16x16 Pack 1', 'Crystals and Ore 24x24', FREE/1_MiniDungeon_Tileset1_A.png
Butuh Pillow. File hasil ikut di-commit; script ini hanya dijalankan kalau ingin membuat ulang."""
import sys, os, io, json, base64, colorsys
from PIL import Image

root, dark = sys.argv[1], sys.argv[2]
RPG = os.path.join(root, 'RPG Items 16x16 Pack 1')
CRY = os.path.join(root, 'Crystals and Ore 24x24', 'crystals-ore-sheet.png')
MINI = os.path.join(root, 'FREE', '1_MiniDungeon_Tileset1_A.png')

def b64(im):
    b = io.BytesIO(); im.save(b, 'PNG', optimize=True)
    return 'data:image/png;base64,' + base64.b64encode(b.getvalue()).decode()

def hue_shift(im, deg, sat=1.0, val=1.0):
    im = im.convert('RGBA'); px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if not a: continue
            h, s, v = colorsys.rgb_to_hsv(r/255, g/255, b/255)
            h = (h + deg/360) % 1; s = min(1, s*sat); v = min(1, v*val)
            r, g, b = colorsys.hsv_to_rgb(h, s, v); px[x, y] = (int(r*255), int(g*255), int(b*255), a)
    return im

def item(name): return Image.open(os.path.join(RPG, name + '.png')).convert('RGBA')

# tiap senjata punya 5 skin (naik level = skin lebih bagus)
SKINS = {
  'sword': ['sword7', 'sword2', 'sword3', 'sword11', 'sword14'],
  'spear': ['staff33', 'staff20', 'staff19', 'staff22', 'staff34'],
  'axe':   ['staff21', 'staff25', 'staff26', 'staff27', 'staff39'],
  'staff': ['staff13', 'staff14', 'staff16', 'staff15', 'staff6'],
}
cells = []  # (nama, Image)
for w, lst in SKINS.items():
    for i, n in enumerate(lst): cells.append((f'{w}{i+1}', item(n)))
cells += [
  ('nova',    hue_shift(item('orb6'), 22)),          # merah -> oranye
  ('petir',   hue_shift(item('orb7'), -95, 1.05, 1.25)),  # hijau -> kuning
  ('perisai', item('orb3')),
  ('beku',    item('orb2')),
  ('book',    item('book21')),
]
COLS = 8; rows = (len(cells) + COLS - 1)//COLS
atlas = Image.new('RGBA', (COLS*16, rows*16), (0, 0, 0, 0))
for i, (n, im) in enumerate(cells): atlas.alpha_composite(im, ((i % COLS)*16, (i//COLS)*16))
names = [n for n, _ in cells]

out = {
  'images': {
    'dd': b64(Image.open(dark).convert('RGBA')),
    'mini': b64(Image.open(MINI).convert('RGBA')),
    'crys': b64(Image.open(CRY).convert('RGBA')),
    'rpg': b64(atlas),
  },
  'rpg': {'names': names, 'cols': COLS, 'cell': 16},
}
dst = os.path.join(os.path.dirname(__file__), '..', 'www', 'assets2.js')
with open(dst, 'w') as f:
    f.write('/* Aset tambahan (base64): DarkDungeon, Mini Dungeon Tileset, Crystals and Ore 24x24, RPG Items 16x16. Dibuat oleh scripts/build-assets2.py */\n')
    f.write('const ASSETS2 = ' + json.dumps(out) + ';\n')
print('ok', len(names), 'sprite;', os.path.getsize(dst)//1024, 'KB')
