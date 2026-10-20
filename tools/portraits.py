# 從使用者提供的角色設定圖裁出臉部，縮成像素頭像（遊戲內用）
import sys, base64, io
from PIL import Image, ImageEnhance
SRC = 'assets/sheet%d.jpg'
BOX = {1: (40, 90, 500, 550), 2: (25, 40, 365, 380), 3: (10, 75, 490, 555), 4: (40, 0, 470, 430)}
SIZE = 64

def is_bg(c):
    r, g, b = c[:3]
    return min(r, g, b) > 200 and max(r, g, b) - min(r, g, b) < 30

def clear_bg(im):
    # 從四邊往內 flood fill，把白底/灰底變透明
    w, h = im.size; px = im.load(); seen = set()
    stack = [(x, y) for x in range(w) for y in (0, h-1)] + [(x, y) for y in range(h) for x in (0, w-1)]
    while stack:
        x, y = stack.pop()
        if (x, y) in seen or not (0 <= x < w and 0 <= y < h): continue
        seen.add((x, y))
        if not is_bg(px[x, y]): continue
        px[x, y] = (0, 0, 0, 0)
        stack += [(x+1, y), (x-1, y), (x, y+1), (x, y-1)]
out_js = ['// 由 tools/portraits.py 產生，勿手改', 'window.PORTRAITS = {']
prev = Image.new('RGBA', (SIZE*4*4, SIZE*4), (120,0,0,255))
for i in range(1, 5):
    im = Image.open(SRC % i).convert('RGB').crop(BOX[i])
    im = ImageEnhance.Contrast(im).enhance(1.15)
    im = ImageEnhance.Color(im).enhance(1.2)
    sm = im.resize((SIZE, SIZE), Image.LANCZOS)
    q = sm.quantize(colors=40, method=Image.Quantize.MAXCOVERAGE, dither=Image.Dither.NONE).convert('RGBA')
    clear_bg(q)
    q.save('assets/portrait%d.png' % i)
    big = q.resize((SIZE*4, SIZE*4), Image.NEAREST); prev.paste(big, ((i-1)*SIZE*4, 0), big)
    b = io.BytesIO(); q.save(b, 'PNG')
    out_js.append('  %d: "data:image/png;base64,%s",' % (i, base64.b64encode(b.getvalue()).decode()))
out_js.append('};')
open('js/portraits.js', 'w').write('\n'.join(out_js) + '\n')
prev.save(sys.argv[1] if len(sys.argv) > 1 else 'portraits_preview.png')
