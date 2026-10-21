# 車子與背景圖：GPT 原圖 → 遊戲尺寸，輸出 js/art_data.js
# 用法：python3 tools/stage_art.py [預覽圖輸出路徑]
import sys, io, base64, json
from PIL import Image

CAR_W = {'sedan': 246, 'suv': 238, 'sports': 252, 'ev': 240}
BGS = ['garage', 'sunset', 'night', 'pad']
W, H = 384, 216


def url(im):
    b = io.BytesIO(); im.save(b, 'PNG'); return 'data:image/png;base64,' + base64.b64encode(b.getvalue()).decode()


def is_mag(r, g, b):
    return r > 130 and b > 130 and g < 120


def car(key):
    im = Image.open(f'work/art/car_{key}.png').convert('RGBA')
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if is_mag(r, g, b): px[x, y] = (0, 0, 0, 0)
    im = im.crop(im.getbbox())
    w = CAR_W[key]; h = round(im.height * w / im.width)
    sm = im.resize((w, h), Image.LANCZOS); p = sm.load()
    for y in range(h):
        for x in range(w):
            r, g, b, a = p[x, y]
            p[x, y] = (0, 0, 0, 0) if a < 140 or is_mag(r, g, b) else (r, g, b, 255)
    return sm.crop(sm.getbbox())


def bg(key):
    im = Image.open(f'work/art/bg_{key}.png').convert('RGB')
    tw = im.width; th = round(tw * H / W)
    if th > im.height: th = im.height; tw = round(th * W / H)
    x0 = (im.width - tw) // 2; y0 = im.height - th          # 保留底部地面
    im = im.crop((x0, y0, x0 + tw, y0 + th)).resize((W, H), Image.LANCZOS)
    return im.quantize(colors=96, method=Image.Quantize.MAXCOVERAGE, dither=Image.Dither.NONE).convert('RGB')


def products():
    # 開場動畫用的四瓶商品：去洋紅底，依空白欄切成四個，最高約 72px
    im = Image.open('work/art/products.png').convert('RGBA'); px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if is_mag(r, g, b): px[x, y] = (0, 0, 0, 0)
    cols = [any(px[x, y][3] for y in range(0, im.height, 2)) for x in range(im.width)]
    runs, start = [], None
    for x, c in enumerate(cols + [False]):
        if c and start is None: start = x
        if not c and start is not None:
            if x - start > 20: runs.append((start, x))
            start = None
    items = [im.crop((a, 0, b, im.height)).crop(im.crop((a, 0, b, im.height)).getbbox()) for a, b in runs]
    k = 72 / max(i.height for i in items)
    out = []
    for it in items:
        sm = it.resize((max(1, round(it.width * k)), max(1, round(it.height * k))), Image.LANCZOS); p2 = sm.load()
        for y in range(sm.height):
            for x in range(sm.width):
                r, g, b, a = p2[x, y]
                p2[x, y] = (0, 0, 0, 0) if a < 140 or is_mag(r, g, b) else (r, g, b, 255)
        out.append(sm)
    return out


prods = products()
print('products', [p.size for p in prods])
cars = {k: car(k) for k in CAR_W}
bgs = {k: bg(k) for k in BGS}
for k, v in cars.items(): print('car', k, v.size)
open('js/art_data.js', 'w').write('// 由 tools/stage_art.py 產生，勿手改\nwindow.CAR_ART = ' + json.dumps({k: url(v) for k, v in cars.items()}) +
                                  ';\nwindow.BG_ART = ' + json.dumps({k: url(v) for k, v in bgs.items()}) +
                                  ';\nwindow.PRODUCT_ART = ' + json.dumps([url(p) for p in prods]) + ';\n')
if len(sys.argv) > 1:
    out = Image.new('RGB', (W * 3, H * 2), (255, 0, 255))
    for i, k in enumerate(BGS): out.paste(bgs[k], (i * W, 0))
    x = 0
    for k, v in cars.items(): out.paste(v, (x, H + 40), v); x += v.width + 10
    out.resize((out.width * 2, out.height * 2), Image.NEAREST).save(sys.argv[1])
