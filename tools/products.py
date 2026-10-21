# 官方商品照（紅分子官網 hjaec.com 的商品圖，原檔放 work/official/，只在本機）
# 只裁出瓶子那一塊（避開價格與促銷字），縮成開場用（高 100）與結算用（高 46）兩種尺寸，輸出 js/product_data.js
import sys, io, base64, json
from PIL import Image, ImageEnhance

CROPS = {   # 名稱: (檔名, 裁切框)
    '奈米陶瓷封體鍍膜': ('coating.jpg', (560, 150, 1185, 930)),
    '超效除汙高泡洗車精': ('shampoo.jpg', (440, 40, 985, 990)),
    '炫鑽玻璃鍍膜': ('glass.png', (640, 270, 1060, 1090)),
    '全效環保去汙劑': ('cleaner.jpg', (610, 80, 1070, 1080)),
    '水垢水斑去除劑': ('spot.png', (680, 285, 1220, 960)),
    '玻璃油膜去除劑': ('oilfilm.jpg', (790, 50, 1225, 1180)),
    '全能去污還原膏': ('paste.jpg', (720, 180, 1080, 1160)),
}


def url(im):
    b = io.BytesIO(); im.convert('RGB').save(b, 'JPEG', quality=88); return 'data:image/jpeg;base64,' + base64.b64encode(b.getvalue()).decode()


big, small, prev = {}, {}, []
for name, (f, box) in CROPS.items():
    im = Image.open('work/official/' + f).convert('RGB').crop(box)
    im = ImageEnhance.Sharpness(im).enhance(1.3)
    b = im.resize((round(im.width * 100 / im.height), 100), Image.LANCZOS)
    s = im.resize((round(im.width * 46 / im.height), 46), Image.LANCZOS)
    big[name], small[name] = url(b), url(s)
    prev.append(im.resize((round(im.width * 300 / im.height), 300)))
open('js/product_data.js', 'w').write('// 由 tools/products.py 產生（紅分子官網商品照裁切），勿手改\nwindow.PRODUCT_PHOTO = ' +
                                      json.dumps({'big': big, 'small': small}, ensure_ascii=False) + ';\n')
if len(sys.argv) > 1:
    W = sum(p.width + 10 for p in prev); out = Image.new('RGB', (W, 300), (40, 40, 40)); x = 0
    for p in prev: out.paste(p, (x, 0)); x += p.width + 10
    out.save(sys.argv[1])
