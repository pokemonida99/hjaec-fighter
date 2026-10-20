# 角色頭像：GPT 依使用者設定圖重繪的像素頭像（work/art/p1~4.png），去白底後縮成遊戲用尺寸
# 產生 js/portraits.js：PORTRAITS（64px，選角／HUD）與 PORTRAITS_BIG（112px，超必殺特寫／結局）
import sys, base64, io
from PIL import Image

def is_bg(c):
    r, g, b = c[:3]
    return min(r, g, b) > 228 and max(r, g, b) - min(r, g, b) < 22

def clear_bg(im):
    w, h = im.size; px = im.load(); seen = set()
    # 只從上緣和兩側上半部往內填，避免把碰到底邊的白襯衫也挖掉
    stack = [(x, 0) for x in range(w)] + [(x, y) for y in range(int(h * 0.7)) for x in (0, w - 1)]
    while stack:
        x, y = stack.pop()
        if (x, y) in seen or not (0 <= x < w and 0 <= y < h): continue
        seen.add((x, y))
        if not is_bg(px[x, y]): continue
        px[x, y] = (0, 0, 0, 0)
        stack += [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]

def make(src, size):
    im = Image.open(src).convert('RGBA')
    w, h = im.size; s = min(w, h)
    im = im.crop(((w - s) // 2, 0, (w - s) // 2 + s, s))
    sm = im.resize((size, size), Image.LANCZOS)
    rgb = sm.convert('RGB').quantize(colors=48, method=Image.Quantize.MAXCOVERAGE, dither=Image.Dither.NONE).convert('RGBA')
    clear_bg(rgb)
    return rgb

def b64(im):
    b = io.BytesIO(); im.save(b, 'PNG'); return 'data:image/png;base64,' + base64.b64encode(b.getvalue()).decode()

out = ['// 由 tools/portraits.py 產生，勿手改', 'window.PORTRAITS = {']
big = ['window.PORTRAITS_BIG = {']
prev = Image.new('RGBA', (112 * 4 * 3, 112 * 3), (120, 0, 0, 255))
for i in range(1, 5):
    a, b = make(f'work/art/p{i}.png', 64), make(f'work/art/p{i}.png', 112)
    a.save(f'assets/portrait{i}.png'); b.save(f'assets/portrait{i}_big.png')
    out.append(f'  {i}: "{b64(a)}",'); big.append(f'  {i}: "{b64(b)}",')
    bb = b.resize((336, 336), Image.NEAREST); prev.paste(bb, ((i - 1) * 336, 0), bb)
out.append('};'); big.append('};')
open('js/portraits.js', 'w').write('\n'.join(out + big) + '\n')
if len(sys.argv) > 1: prev.save(sys.argv[1])
