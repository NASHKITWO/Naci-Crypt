#!/usr/bin/env python3
"""Membuat www/assets3.js: monster baru (THE_PACK) dan efek pukul (VFX Free Pack) dalam base64.
Pakai: python3 scripts/build-assets3.py <folder THE_PACK> <folder VFX_Free_Pack>
Butuh Pillow. File hasil ikut di-commit; skrip ini hanya dijalankan kalau ingin membuat ulang."""
import sys, os, io, glob, json, base64
from PIL import Image

THE, VFX = sys.argv[1], sys.argv[2]
MON = os.path.join(THE, 'Monsters')
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'www', 'assets3.js')

def frames(folder):
    return [Image.open(f).convert('RGBA') for f in sorted(glob.glob(os.path.join(folder, '*.png')))]

def b64(im):
    b = io.BytesIO(); im.save(b, 'PNG', optimize=True)
    return 'data:image/png;base64,' + base64.b64encode(b.getvalue()).decode()

def bbox_union(ims):
    boxes = [im.getbbox() for im in ims if im.getbbox()]
    return (min(b[0] for b in boxes), min(b[1] for b in boxes), max(b[2] for b in boxes), max(b[3] for b in boxes))

def build_monster(idle_dir, run_dir, death_dir, target_h, flip=False):
    """Potong semua frame ke kotak yang sama (kaki sejajar), skala agar tinggi isi = target_h."""
    groups = {'idle': frames(idle_dir), 'run': frames(run_dir) if run_dir else None, 'death': frames(death_dir)}
    if groups['run'] is None: groups['run'] = groups['idle']
    allf = groups['idle'] + groups['run'] + groups['death']
    x0, y0, x1, y1 = bbox_union(allf)
    cw, ch = x1 - x0, y1 - y0
    s = target_h / ch
    pad = 4
    fw = int(round(cw * s)) + pad * 2
    fh = int(round(ch * s)) + pad
    out = {}
    for name, ims in groups.items():
        sheet = Image.new('RGBA', (fw * len(ims), fh), (0, 0, 0, 0))
        for i, im in enumerate(ims):
            c = im.crop((x0, y0, x1, y1)).resize((int(round(cw * s)), int(round(ch * s))), Image.NEAREST)
            sheet.alpha_composite(c, (i * fw + pad, 0))
        out[name] = {'src': b64(sheet), 'n': len(ims), 'fw': fw, 'fh': fh, 'ay': fh - 2}
    return out

sprites = {
  # monster baru; tinggi isi disesuaikan supaya ukurannya seimbang dengan sprite Pixel Crawler
  'slime':     build_monster(os.path.join(MON, 'Slime', 'Idel and Run'), None, os.path.join(MON, 'Slime', 'Dead'), 26),
  'slimeKing': build_monster(os.path.join(MON, 'KING SLIME', 'idel'), None, os.path.join(MON, 'KING SLIME', 'Dead'), 40),
  'orc2':      build_monster(os.path.join(MON, 'ORC2', 'IDEL'), os.path.join(MON, 'ORC2', 'Run'), os.path.join(MON, 'ORC2', 'DEAD'), 38),
  'tree':      build_monster(os.path.join(MON, 'Tree', 'ground Up'), None, os.path.join(MON, 'Tree', 'ground Up'), 40),
}

# skeleton dasar (Pixel Crawler, Skeleton Crew): sheet sudah rapi, langsung dipakai
SK = os.path.join(os.path.dirname(THE.rstrip('/')), 'PC2', 'Pixel Crawler - Free Pack', 'Entities', 'Mobs', 'Skeleton Crew', 'Skeleton - Base')
def sheet_sprite(folder, anim, fw, fh, ay):
    im = Image.open(os.path.join(folder, anim, anim + '-Sheet.png')).convert('RGBA')
    return {'src': b64(im), 'n': im.width // fw, 'fw': fw, 'fh': fh, 'ay': ay}
if os.path.isdir(SK):
    sprites['skBase'] = {
        'idle': sheet_sprite(SK, 'Idle', 32, 32, 32),
        'run': sheet_sprite(SK, 'Run', 64, 64, 64),
        'death': sheet_sprite(SK, 'Death', 64, 64, 64),
    }

sprites['treeBoss'] = build_monster(os.path.join(MON, 'Tree', 'ground Up'), os.path.join(MON, 'Tree', 'attact'), os.path.join(MON, 'Tree', 'ground Up'), 30)
sprites['kingSlime'] = sprites['slimeKing']
if os.path.isdir(os.path.join(MON, 'ORC2', 'attack')):
    sprites['orc2Atk'] = build_monster(os.path.join(MON, 'ORC2', 'attack'), None, os.path.join(MON, 'ORC2', 'attack'), 38)
sprites['orc2Boss'] = sprites['orc2']  # bos lantai 10 memakai sprite ORC2 (bertombak)  # bos lantai 6 memakai sprite King Slime

# karakter kedua (Body_A, Pixel Crawler): sheet 64 px diperkecil ke 32 px agar sama dengan knight
BA = os.path.join(os.path.dirname(THE.rstrip('/')), 'PC2', 'Pixel Crawler - Free Pack', 'Entities', 'Characters', 'Body_A', 'Animations')
def half_sheet(rel, n, key):
    f = os.path.join(BA, rel)
    im = Image.open(f).convert('RGBA')
    im = im.resize((im.width // 2, im.height // 2), Image.NEAREST)
    return {'src': b64(im), 'n': n, 'fw': 32, 'fh': 32, 'ay': 32}
if os.path.isdir(BA):
    sprites['hero2'] = {
        'idle': half_sheet('Idle_Base/Idle_Side-Sheet.png', 4, 'idle'),
        'run': half_sheet('Run_Base/Run_Side-Sheet.png', 6, 'run'),
        'death': half_sheet('Death_Base/Death_Side-Sheet.png', 8, 'death'),
    }

# efek pukul: frame Effect_SmallHit, diperkecil ke 32 px (pixel art)
hit = frames(os.path.join(VFX, 'Effect_SmallHit', '30fps', 'Frames', 'Effect_SmallHit_1'))
FW = 32
sheet = Image.new('RGBA', (FW * len(hit), FW), (0, 0, 0, 0))
for i, im in enumerate(hit):
    sheet.alpha_composite(im.resize((FW, FW), Image.LANCZOS), (i * FW, 0))
sprites['hitfx'] = {'idle': {'src': b64(sheet), 'n': len(hit), 'fw': FW, 'fh': FW, 'ay': FW // 2}}

# obor animasi (DarkDungeon tidak dipakai lagi untuk nyala): 30 frame 20x29 dari fire_torch_20x29.png
FIRE = os.path.join(os.path.dirname(THE.rstrip('/')), '16x16_Dungeon_tileset', 'fire_torch_20x29.png')
images = {}
if os.path.exists(FIRE):
    ft = Image.open(FIRE).convert('RGBA')
    n = ft.width // 20
    strip = Image.new('RGBA', (20 * n, 29), (0, 0, 0, 0))
    for i in range(n): strip.alpha_composite(ft.crop((i * 20, 0, i * 20 + 20, 29)), (i * 20, 0))
    images['firetorch'] = b64(strip)
    images['firetorch_n'] = n

# ikon HUD dan menu (All_Assets, 26x26)
ICONS = ['sword', 'info', 'settings', 'monsterbook', 'goblet', 'shield', 'crown', 'chest', 'pouch']

ALL = os.path.join(os.path.dirname(THE.rstrip('/')), 'All_Assets')
PORT = os.path.join(ALL, 'dfgui_portraitframe.png')
if os.path.exists(PORT): images['ui_portrait'] = b64(Image.open(PORT).convert('RGBA'))
for ic in ICONS:
    f = os.path.join(ALL, f'dfgui_icon-{ic}.png')
    if os.path.exists(f): images['ui_' + ic] = b64(Image.open(f).convert('RGBA'))

# ledakan untuk musuh elite/boss (VFX Free Pack, Effect_Explosion), 30 frame 48 px
EXP = [f for f in sorted(glob.glob(os.path.join(VFX, 'Effect_Explosion', '30fps', 'Frames', 'Effect_Explosion_1', '*.png')))]
if EXP:
    W = 48
    sh = Image.new('RGBA', (W * len(EXP), W), (0, 0, 0, 0))
    for i, f in enumerate(EXP):
        sh.alpha_composite(Image.open(f).convert('RGBA').resize((W, W), Image.LANCZOS), (i * W, 0))
    sprites['boomfx'] = {'idle': {'src': b64(sh), 'n': len(EXP), 'fw': W, 'fh': W, 'ay': W // 2}}

# dentuman panah/api di dinding (VFX Free Pack, Effect_Impact), 30 frame 32 px
IMP = sorted(glob.glob(os.path.join(VFX, 'Effect_Impact', '30fps', 'Frames', 'Effect_Impact_1', '*.png')))
if IMP:
    W = 32
    sh = Image.new('RGBA', (W * len(IMP), W), (0, 0, 0, 0))
    for i, f in enumerate(IMP):
        sh.alpha_composite(Image.open(f).convert('RGBA').resize((W, W), Image.LANCZOS), (i * W, 0))
    sprites['impfx'] = {'idle': {'src': b64(sh), 'n': len(IMP), 'fw': W, 'fh': W, 'ay': W // 2}}

# ledakan kedua untuk serangan tongkat api (VFX Free Pack, Effect_Explosion2), 30 frame 40 px
EXP2 = sorted(glob.glob(os.path.join(VFX, 'Effect_Explosion2', '30fps', 'Frames', 'Effect_Explosion2_1', '*.png')))
if EXP2:
    W = 40
    sh = Image.new('RGBA', (W * len(EXP2), W), (0, 0, 0, 0))
    for i, f in enumerate(EXP2):
        sh.alpha_composite(Image.open(f).convert('RGBA').resize((W, W), Image.LANCZOS), (i * W, 0))
    sprites['boom2fx'] = {'idle': {'src': b64(sh), 'n': len(EXP2), 'fw': W, 'fh': W, 'ay': W // 2}}

# ikon peta dari dfgui_mapicons.png (sel gulungan peta di baris terakhir)
MAPI = os.path.join(ALL, 'dfgui_mapicons.png')
if os.path.exists(MAPI):
    images['ui_map'] = b64(Image.open(MAPI).convert('RGBA').crop((49, 129, 98, 172)))

# efek sisi VFX Free Pack: pengisian power (Charged), debu bintang (PuffAndStars), perisai listrik (ElectricShield)
def vfx_strip(folder, prefix, W, key, n_max=40):
    fr = sorted(glob.glob(os.path.join(VFX, folder, '30fps', 'Frames', prefix, '*.png')))[:n_max]
    if not fr: return
    sh = Image.new('RGBA', (W * len(fr), W), (0, 0, 0, 0))
    for i, f in enumerate(fr):
        sh.alpha_composite(Image.open(f).convert('RGBA').resize((W, W), Image.LANCZOS), (i * W, 0))
    sprites[key] = {'idle': {'src': b64(sh), 'n': len(fr), 'fw': W, 'fh': W, 'ay': W // 2}}
vfx_strip('Effect_Charged', 'Effect_Charged_1', 48, 'chgfx')
vfx_strip('Effect_PuffAndStars', 'Effect_PuffAndStars_1', 40, 'puffx')
vfx_strip('Effect_ElectricShield', 'Effect_ElectricShield_1', 40, 'shieldfx', 30)

# lantai 4-5 (Slime 2, efek darah, aura roh): monster & efek dari THE_PACK dan VFX Free Pack
sprites['slime2'] = build_monster(os.path.join(MON, 'Slime 2', 'Idel walk'), None, os.path.join(MON, 'Slime 2', 'Dead'), 24)
vfx_strip('Effect_BloodImpact', 'Effect_BloodImpact_1', 32, 'bloodfx', 30)
vfx_strip('Effect_Anima', 'Effect_Anima_1', 40, 'animafx', 30)

# tileset lantai 4-5 (Pixel Crawler Environment/Tilesets): lantai batu bata & tanah gua, dinding batu
PCT = os.path.join(os.path.dirname(THE.rstrip('/')), 'PC2', 'Pixel Crawler - Free Pack', 'Environment', 'Tilesets')
if os.path.isfile(os.path.join(PCT, 'Floors_Tiles.png')):
    images['pcFloors'] = b64(Image.open(os.path.join(PCT, 'Floors_Tiles.png')).convert('RGBA'))
    images['pcWalls'] = b64(Image.open(os.path.join(PCT, 'Wall_Tiles.png')).convert('RGBA'))

# ruang istirahat: lentera (Bonfire_09, 10 frame 32 px) dan landasan (potongan dari Anvil.png)
ST = os.path.join(os.path.dirname(THE.rstrip('/')), 'PC2', 'Pixel Crawler - Free Pack', 'Environment', 'Structures', 'Stations')
if os.path.isfile(os.path.join(ST, 'Bonfire', 'Bonfire_09-Sheet.png')):
    images['bonfire'] = b64(Image.open(os.path.join(ST, 'Bonfire', 'Bonfire_09-Sheet.png')).convert('RGBA'))
    images['bonfire_n'] = 10
if os.path.isfile(os.path.join(ST, 'Alchemy', 'Alchemy_Table_02-Sheet.png')):
    images['alchemy'] = b64(Image.open(os.path.join(ST, 'Alchemy', 'Alchemy_Table_02-Sheet.png')).convert('RGBA'))
if os.path.isfile(os.path.join(ST, 'Workbench', 'Workbench.png')):
    images['workbench'] = b64(Image.open(os.path.join(ST, 'Workbench', 'Workbench.png')).convert('RGBA').crop((0, 256, 33, 292)))  # meja kayu saja dari lembar station
if os.path.isfile(os.path.join(ST, 'Anvil', 'Anvil.png')):
    images['anvil'] = b64(Image.open(os.path.join(ST, 'Anvil', 'Anvil.png')).convert('RGBA').crop((4, 36, 30, 64)))

# tileset kripta (16x16 Dungeon tileset) untuk lantai 3: dikirim utuh, dipilih ubinnya di game.js
CRYPT = os.path.join(os.path.dirname(THE.rstrip('/')), '16x16_Dungeon_tileset', 'Crypt_Diffuse.png')
if os.path.exists(CRYPT):
    images['crypt'] = b64(Image.open(CRYPT).convert('RGBA'))

js = ('/* Aset tambahan (v1.26): monster, efek, obor animasi, tileset kripta, dan ikon HUD. Dibuat oleh scripts/build-assets3.py */\n'
      'Object.assign(ASSETS.sprites, ' + json.dumps(sprites) + ');\n'
      'Object.assign(ASSETS.images, ' + json.dumps({k: v for k, v in images.items() if not k.endswith('_n')}) + ');\n'
      'ASSETS3_FIRE_N = ' + str(images.get('firetorch_n', 0)) + ';\n')
open(OUT, 'w', encoding='utf-8').write(js)
print('ditulis', OUT, round(len(js) / 1e6, 2), 'MB')
