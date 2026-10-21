# 把 GPT 生的角色動作表（洋紅底、4×2 格）切成一張張動畫格，對齊腳底、縮成遊戲尺寸
# 輸出 js/sprite_data.js：window.SPRITE_DATA = { kuri: { img: dataURL, frames: { idle0: [x, y, w, h, ax] ... } } }
# 用法：python3 tools/slice.py [預覽圖輸出路徑]
import sys, io, base64, json
from PIL import Image, ImageChops, ImageFilter

TARGET_H = 74          # 站姿高度（遊戲像素）
TARGET_BY = {'boss': 80, 'sailor': 80, 'hong': 72, 'fen': 75}
SHEETS = {
    'A': ['idle0', 'idle1', 'walk0', 'walk1', 'walk2', 'walk3', 'crouch', 'jump'],
    'B': ['punch0', 'punch1', 'kick0', 'kick1', 'cpunch', 'ckick1', 'jkick', 'win0'],
    'C': ['throw0', 'throw1', 'throw2', 'spin', 'spinK', 'rush0', 'rush1', 'hurt'],
}
AIR = {'jump', 'jkick', 'spin', 'spinK'}
AIR_BY = {'boss': {'throw1', 'throw2', 'rush0', 'rush1'}, 'hong': {'spin', 'spinK'}}
# 個別修正：某張表 GPT 排序跑掉時，在這裡指定 [格子索引順序]
ORDER_FIX = {}


def bg_mask(im):
    r, g, b = im.split()
    m = ImageChops.multiply(ImageChops.multiply(r.point(lambda v: 255 if v > 130 else 0), b.point(lambda v: 255 if v > 130 else 0)),
                            g.point(lambda v: 255 if v < 120 else 0))
    return m   # 255 = 背景


def components(mask, step=4):
    w, h = mask.size
    sm = mask.resize((w // step, h // step), Image.BOX).point(lambda v: 255 if v > 20 else 0).filter(ImageFilter.MaxFilter(5))
    sw, sh = sm.size
    px = sm.load(); seen = bytearray(sw * sh); comps = []
    for y in range(sh):
        for x in range(sw):
            if px[x, y] and not seen[y * sw + x]:
                st = [(x, y)]; seen[y * sw + x] = 1; pts = []
                while st:
                    cx, cy = st.pop(); pts.append((cx, cy))
                    for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                        if 0 <= nx < sw and 0 <= ny < sh and px[nx, ny] and not seen[ny * sw + nx]:
                            seen[ny * sw + nx] = 1; st.append((nx, ny))
                xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
                comps.append({'n': len(pts), 'box': (min(xs) * step, min(ys) * step, (max(xs) + 1) * step, (max(ys) + 1) * step),
                              'pts': set(pts), 'cx': sum(xs) / len(xs) * step, 'cy': sum(ys) / len(ys) * step})
    comps.sort(key=lambda c: -c['n'])
    if not comps: return [], step
    big = comps[0]['n']
    comps = [c for c in comps if c['n'] > big * 0.12]
    return comps, step


def order(comps):
    ys = sorted(c['cy'] for c in comps)
    mid = (ys[0] + ys[-1]) / 2
    top = sorted([c for c in comps if c['cy'] < mid], key=lambda c: c['cx'])
    bot = sorted([c for c in comps if c['cy'] >= mid], key=lambda c: c['cx'])
    return top + bot


def cut(im, mask, c, step):
    x0, y0, x1, y1 = c['box']
    x0, y0 = max(0, x0 - step), max(0, y0 - step); x1, y1 = min(im.width, x1 + step), min(im.height, y1 + step)
    fr = im.crop((x0, y0, x1, y1)).convert('RGBA')
    bm = mask.crop((x0, y0, x1, y1))
    # 只留這個元件的範圍（避免切到隔壁格）
    sw, sh = (x1 - x0) // step + 2, (y1 - y0) // step + 2
    small = Image.new('L', (sw, sh), 0); sp = small.load()
    for (sx, sy) in c['pts']:
        X, Y = sx - x0 // step, sy - y0 // step
        if 0 <= X < sw and 0 <= Y < sh: sp[X, Y] = 255
    small = small.filter(ImageFilter.MaxFilter(3))
    own = Image.new('L', fr.size, 0)
    own.paste(small.resize((sw * step, sh * step), Image.NEAREST), ((x0 // step) * step - x0, (y0 // step) * step - y0))
    alpha = ImageChops.multiply(ImageChops.invert(bm), own)
    fr.putalpha(alpha)
    bb = fr.getbbox()
    return fr.crop(bb) if bb else fr


def shrink(fr, s):
    w, h = max(1, round(fr.width * s)), max(1, round(fr.height * s))
    sm = fr.resize((w, h), Image.LANCZOS)
    px = sm.load()
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 140 or (r > 150 and b > 150 and g < 120):   # 去掉洋紅毛邊
                px[x, y] = (0, 0, 0, 0)
            else:
                px[x, y] = (r, g, b, 255)
    bb = sm.getbbox()
    return sm.crop(bb) if bb else sm


def anchor_x(fr, air):
    w, h = fr.size; px = fr.load()
    if air:
        xs = [x for y in range(h) for x in range(w) if px[x, y][3]]
        return round(sum(xs) / len(xs)) if xs else w // 2
    rows = max(2, h // 12)
    xs = [x for y in range(h - rows, h) for x in range(w) if px[x, y][3]]
    if not xs: return w // 2
    xs.sort()
    return xs[len(xs) // 2]


def main():
    data = {}; previews = []
    for cid in ['boss', 'sailor', 'hong', 'fen', 'kuri', 'rin', 'leo', 'momo']:
        raw = {}
        for sh, names in SHEETS.items():
            im = Image.open(f'work/art/{cid}_{sh}.png').convert('RGB')
            mask = bg_mask(im)
            comps, step = components(ImageChops.invert(mask))
            comps = order(comps)
            fix = ORDER_FIX.get(f'{cid}_{sh}')
            if fix: comps = [comps[i] for i in fix]
            if len(comps) != len(names):
                print(f'!! {cid}_{sh}: 找到 {len(comps)} 格（應為 {len(names)}）')
            for n, c in zip(names, comps):
                raw[n] = cut(im, mask, c, step)
        s = TARGET_BY.get(cid, TARGET_H) / raw['idle0'].height
        frames = {}
        for n, fr in raw.items():
            sm = shrink(fr, s)
            frames[n] = (sm, anchor_x(sm, n in AIR or n in AIR_BY.get(cid, ())))
        # 打包成一條橫向圖
        W = sum(f.width + 2 for f, _ in frames.values()); H = max(f.height for f, _ in frames.values())
        atlas = Image.new('RGBA', (W, H), (0, 0, 0, 0)); x = 0; meta = {}
        for n, (f, ax) in frames.items():
            atlas.paste(f, (x, 0)); meta[n] = [x, 0, f.width, f.height, ax]; x += f.width + 2
        b = io.BytesIO(); atlas.quantize(colors=255, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE).save(b, 'PNG', optimize=True)   # 調色盤 PNG，檔案小很多
        data[cid] = {'img': 'data:image/png;base64,' + base64.b64encode(b.getvalue()).decode(), 'frames': meta}
        atlas.save(f'work/atlas_{cid}.png')
        # 預覽：每格放大 3 倍，畫腳底基準點
        pv = Image.new('RGBA', (W * 3, (H + 6) * 3), (60, 60, 80, 255))
        big = atlas.resize((W * 3, H * 3), Image.NEAREST); pv.paste(big, (0, 0), big)
        pp = pv.load()
        for n, (fx, fy, fw, fh, ax) in meta.items():
            for d in range(-6, 7):
                X = (fx + ax) * 3 + d
                if 0 <= X < pv.width: pp[X, fh * 3 + 3] = (255, 60, 60, 255)
        previews.append(pv)
        print(cid, 'scale', round(s, 3), 'atlas', W, H)
    open('js/sprite_data.js', 'w').write('// 由 tools/slice.py 產生，勿手改\nwindow.SPRITE_DATA = ' + json.dumps(data) + ';\n')
    if len(sys.argv) > 1:
        PW = max(p.width for p in previews); PH = sum(p.height for p in previews)
        out = Image.new('RGBA', (PW, PH), (40, 40, 50, 255)); y = 0
        for p in previews: out.paste(p, (0, y)); y += p.height
        out.save(sys.argv[1])


main()
