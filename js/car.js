// 髒車：側面像素車＋逐像素污垢（打到哪裡就乾淨到哪裡）
'use strict';
// 零件代碼
const P_BODY = 1, P_GLASS = 2, P_TIRE = 3, P_RIM = 4, P_HEAD = 5, P_TAIL = 6, P_TRIM = 7, P_SEAM = 8;
// 污垢種類
const D_MUD = 1, D_DUST = 2, D_SPOT = 3, D_FILM = 4, D_TAR = 5, D_POOP = 6;
const DIRT = {
  [D_MUD]: { name: '泥巴', c: ['#8a6440', '#6b4a2b', '#4c3219'], res: 1.0 },
  [D_DUST]: { name: '灰塵', c: ['#b8a688', '#a08a6a', '#86704f'], res: 1.35 },
  [D_SPOT]: { name: '水斑', c: ['#b9b2a2', '#cdc6b6', '#ddd6c8'], res: 0.8 },
  [D_FILM]: { name: '油膜', c: ['#9c8f72', '#8a7c5c', '#6e6046'], res: 0.85 },
  [D_TAR]: { name: '柏油', c: ['#3a2c2a', '#231a19', '#120c0c'], res: 0.5 },
  [D_POOP]: { name: '鳥屎', c: ['#e6e2d4', '#f4f1e6', '#ffffff'], res: 0.9 },
};

for (const d of Object.values(DIRT)) d.rgb = d.c.map(hex2rgb);   // 預先轉好，重畫時不用每像素解析字串

const CAR_TYPES = {
  sedan: {
    name: '紅色轎車', w: 156, h: 52, color: '#cf1f2a', wheels: [[30, 41, 10], [122, 41, 10]],
    body: [[3, 44], [1, 36], [2, 30], [6, 27], [18, 25], [46, 22], [52, 21], [70, 7], [76, 5], [110, 5], [116, 7], [134, 20], [150, 22], [154, 26], [155, 34], [153, 44]],
    glass: [[[55, 21], [71, 9], [90, 9], [90, 21]], [[94, 9], [110, 9], [114, 10], [129, 21], [94, 21]]],
    trim: [[[1, 37], [14, 37], [14, 44], [3, 44]], [[144, 37], [155, 37], [153, 44], [144, 44]], [[1, 31], [5, 31], [5, 35], [1, 35]]],
    head: [[2, 28], [11, 27], [11, 30], [2, 31]], tail: [[149, 23], [155, 25], [155, 30], [149, 30]],
    seams: [58, 92], handles: [[62, 26], [97, 26]], mirror: [52, 17, 5, 4], belt: 22,
  },
  suv: {
    name: '珍珠白休旅', w: 160, h: 60, color: '#e9ecef', wheels: [[32, 47, 12], [128, 47, 12]],
    body: [[2, 50], [1, 40], [3, 33], [8, 30], [30, 28], [40, 27], [52, 8], [56, 6], [150, 6], [156, 8], [159, 14], [159, 48], [156, 51]],
    glass: [[[44, 27], [56, 10], [76, 10], [76, 27]], [[80, 10], [112, 10], [112, 27], [80, 27]], [[116, 10], [150, 10], [153, 14], [153, 27], [116, 27]]],
    trim: [[[1, 42], [16, 42], [16, 51], [2, 51]], [[146, 42], [159, 42], [159, 50], [146, 50]], [[58, 3], [148, 3], [148, 6], [58, 6]], [[2, 34], [6, 34], [6, 39], [2, 39]]],
    head: [[3, 31], [14, 30], [14, 35], [3, 36]], tail: [[155, 15], [159, 15], [159, 27], [155, 27]],
    seams: [78, 114], handles: [[82, 31], [118, 31]], mirror: [40, 22, 5, 4], belt: 28,
  },
  sports: {
    name: '曜石黑跑車', w: 164, h: 44, color: '#1c1d24', wheels: [[32, 33, 10], [130, 33, 10]],
    body: [[3, 38], [1, 30], [4, 25], [30, 21], [56, 18], [72, 8], [80, 6], [100, 6], [118, 9], [142, 17], [160, 19], [163, 24], [163, 32], [158, 38]],
    glass: [[[63, 18], [77, 10], [97, 9], [97, 18]], [[101, 9], [114, 11], [130, 18], [101, 18]]],
    trim: [[[146, 12], [162, 12], [162, 14], [146, 14]], [[152, 14], [155, 14], [155, 18], [152, 18]], [[42, 27], [56, 25], [56, 30], [44, 31]], [[1, 32], [12, 32], [12, 38], [3, 38]]],
    head: [[3, 25], [16, 23], [16, 26], [3, 27]], tail: [[158, 20], [163, 21], [163, 25], [158, 25]],
    seams: [60, 99], handles: [[86, 22]], mirror: [60, 15, 5, 3], belt: 18,
  },
};

// 車子放大到跟角色比例相稱
const CAR_SCALE = 1.4;
for (const T of Object.values(CAR_TYPES)) {
  const k = CAR_SCALE, sp = pts => pts.map(([x, y]) => [x * k, y * k]);
  T.w = Math.round(T.w * k); T.h = Math.round(T.h * k);
  T.body = sp(T.body); T.glass = T.glass.map(sp); T.trim = T.trim.map(sp);
  T.head = sp(T.head); T.tail = sp(T.tail);
  T.wheels = T.wheels.map(([x, y, r]) => [x * k, y * k, r * k]);
  T.seams = T.seams.map(x => Math.round(x * k));
  T.handles = T.handles.map(([x, y]) => [Math.round(x * k), Math.round(y * k)]);
  T.mirror = T.mirror.map(v => Math.round(v * k));
  T.belt = Math.round(T.belt * k);
}

function rasterMask(w, h, draw) {
  const [c, g] = mkCanvas(w, h);
  g.fillStyle = '#fff'; g.strokeStyle = '#fff';
  draw(g);
  const d = g.getImageData(0, 0, w, h).data, m = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) m[i] = d[i * 4 + 3] > 127 ? 1 : 0;
  return m;
}
const pathPoly = (g, pts) => { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fill(); };
const pathCircle = (g, x, y, r) => { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); };

// 簡易 value noise
function makeNoise(seed) {
  const hash = (x, y) => { let n = x * 374761393 + y * 668265263 + seed * 2147483647; n = (n ^ (n >> 13)) * 1274126177; return ((n ^ (n >> 16)) & 0xffff) / 0xffff; };
  return (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const s = t => t * t * (3 - 2 * t);
    const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
    return lerp(lerp(a, b, s(xf)), lerp(c, d, s(xf)), s(yf));
  };
}

class Car {
  constructor(typeKey, dirtCfg) {
    const T = this.T = CAR_TYPES[typeKey];
    const w = this.w = T.w, h = this.h = T.h;
    this.x = W - w - 46;
    this.y = GY - h;
    this.bounce = 0; this.bv = 0; this.shake = 0; this.shine = 0;
    // ---- 零件 ----
    const part = this.part = new Uint8Array(w * h);
    const put = (mask, code) => { for (let i = 0; i < w * h; i++) if (mask[i]) part[i] = code; };
    const body = rasterMask(w, h, g => {
      pathPoly(g, T.body);
      g.fillRect(T.mirror[0], T.mirror[1], T.mirror[2], T.mirror[3]);
      g.globalCompositeOperation = 'destination-out';
      T.wheels.forEach(([x, y, r]) => pathCircle(g, x, y, r + 2.5));
    });
    put(body, P_BODY);
    T.glass.forEach(gp => put(rasterMask(w, h, g => pathPoly(g, gp)), P_GLASS));
    T.trim.forEach(tp => put(rasterMask(w, h, g => pathPoly(g, tp)), P_TRIM));
    put(rasterMask(w, h, g => pathPoly(g, T.head)), P_HEAD);
    put(rasterMask(w, h, g => pathPoly(g, T.tail)), P_TAIL);
    T.wheels.forEach(([x, y, r]) => {
      put(rasterMask(w, h, g => pathCircle(g, x, y, r)), P_TIRE);
      put(rasterMask(w, h, g => pathCircle(g, x, y, r * 0.55)), P_RIM);
    });
    // 車門縫
    T.seams.forEach(sx => { for (let y = T.belt + 1; y < h; y++) if (part[y * w + sx] === P_BODY) part[y * w + sx] = P_SEAM; });
    T.handles.forEach(([hx, hy]) => { for (let x = hx; x < hx + 6; x++) for (const yy of [hy, hy + 1]) if (part[yy * w + x] === P_BODY) part[yy * w + x] = P_TRIM; });

    // 每欄最高點（當平台）
    this.top = new Int16Array(w);
    for (let x = 0; x < w; x++) {
      let t = h;
      for (let y = 0; y < h; y++) if (part[y * w + x]) { t = y; break; }
      this.top[x] = t;
    }
    this.buildBase();
    this.buildDirt(dirtCfg || {});
    this.buildMaskCanvas();
  }

  buildBase() {
    const { w, h, part, T } = this;
    const [c, g] = mkCanvas(w, h);
    const id = g.createImageData(w, h), d = id.data;
    const bodyC = hex2rgb(T.color);
    const set = (i, rgb) => { d[i * 4] = rgb[0]; d[i * 4 + 1] = rgb[1]; d[i * 4 + 2] = rgb[2]; d[i * 4 + 3] = 255; };
    const mul = (rgb, f) => rgb.map(v => clamp(Math.round(f > 1 ? v + (255 - v) * (f - 1) : v * f), 0, 255));
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x, p = part[i];
      if (!p) continue;
      const edge = x === 0 || y === 0 || x === w - 1 || y === h - 1 || !part[i - 1] || !part[i + 1] || !part[i - w] || !part[i + w];
      if (edge && p !== P_GLASS) { set(i, [12, 12, 16]); continue; }
      if (p === P_BODY) {
        let f = 1;
        const fromTop = y - this.top[x];
        if (fromTop <= 1) f = 1.55;
        else if (fromTop <= 3) f = 1.25;
        if (Math.abs(y - (T.belt + 3)) <= 0) f = 1.4;            // 腰線高光
        if (y > h * 0.72) f *= 0.72;
        if (y > h * 0.8) f *= 0.85;
        if (((x + y * 0.7) % 70) < 5 && y < h * 0.7) f *= 1.18;  // 斜向反光
        set(i, mul(bodyC, f));
      } else if (p === P_SEAM) set(i, mul(bodyC, 0.55));
      else if (p === P_GLASS) {
        let rgb = [38, 52, 74];
        if (edge) rgb = [20, 22, 30];
        else if (((x - y * 1.2) % 22 + 22) % 22 < 3) rgb = [140, 170, 200];
        else if (y < this.top[x] + 6) rgb = [58, 76, 102];
        set(i, rgb);
      } else if (p === P_TIRE) {
        set(i, (x + y) % 5 === 0 ? [36, 36, 40] : [22, 22, 26]);
      } else if (p === P_RIM) {
        const wh = T.wheels.find(([wx, , wr]) => Math.abs(wx - x) < wr + 2);
        const a = Math.atan2(y - wh[1], x - wh[0]), r = Math.hypot(y - wh[1], x - wh[0]);
        let rgb = (Math.floor((a + Math.PI) / (Math.PI / 5)) % 2) ? [200, 205, 214] : [130, 136, 148];
        if (r < 1.6) rgb = [60, 60, 66];
        set(i, rgb);
      } else if (p === P_HEAD) set(i, [255, 246, 196]);
      else if (p === P_TAIL) set(i, [255, 48, 48]);
      else if (p === P_TRIM) set(i, [30, 30, 34]);
    }
    g.putImageData(id, 0, 0);
    this.base = c;
    this.baseData = id;
  }

  buildDirt(cfg) {
    const { w, h, part } = this;
    const amt = this.amt = new Float32Array(w * h), kind = this.kind = new Uint8Array(w * h);
    const n1 = makeNoise(rndi(1, 9999)), n2 = makeNoise(rndi(1, 9999));
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x, p = part[i];
      if (!p) continue;
      if (p === P_GLASS) {
        amt[i] = (cfg.film || 0.6) * (0.65 + 0.5 * n1(x / 7, y / 5)); kind[i] = D_FILM;
        continue;
      }
      let a = (cfg.dust || 0.5) * (0.45 + 0.7 * n1(x / 11, y / 9)), k = D_DUST;
      const low = clamp((y / h - 0.4) / 0.5, 0, 1);
      const m = (cfg.mud || 1) * low * (0.4 + 1.1 * n2(x / 7, y / 5));
      if (m > 0.35 && m > a) { a = m; k = D_MUD; }
      amt[i] = Math.min(a, 1.8); kind[i] = k;
    }
    // 水斑：小圓圈
    for (let s = 0; s < (cfg.spots || 0); s++) {
      const cx = rndi(4, w - 5), cy = rndi(4, Math.floor(h * 0.7)), r = rnd(1.5, 2.6);
      for (let y = cy - 4; y <= cy + 4; y++) for (let x = cx - 4; x <= cx + 4; x++) {
        const dd = Math.hypot(x - cx, y - cy);
        if (dd <= r + 0.5 && dd >= r - 0.8) this.setDirt(x, y, D_SPOT, 1.0, P_BODY);
      }
    }
    // 柏油點
    for (let s = 0; s < (cfg.tar || 0); s++) {
      const cx = rndi(4, w - 5), cy = rndi(Math.floor(h * 0.55), h - 4), r = rnd(1, 2.6);
      for (let y = cy - 3; y <= cy + 3; y++) for (let x = cx - 3; x <= cx + 3; x++)
        if (Math.hypot(x - cx, (y - cy) * 1.3) <= r) this.setDirt(x, y, D_TAR, 1.7);
    }
    // 鳥屎
    for (let s = 0; s < (cfg.poop || 0); s++) this.splat(rndi(10, w - 10), true);
    this.total0 = 0;
    for (let i = 0; i < w * h; i++) this.total0 += amt[i];
    this.remain = this.total0;
    this.dirtDirty = true;
    const [dc, dg] = mkCanvas(w, h);
    this.dirtC = dc; this.dirtG = dg; this.dirtImg = dg.createImageData(w, h);
  }
  setDirt(x, y, k, a, only) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = y * this.w + x, p = this.part[i];
    if (!p || (only && p !== only)) return;
    if (this.amt[i] < a || this.kind[i] !== k) {
      const old = this.amt[i];
      this.amt[i] = Math.max(a, old * 0.5); this.kind[i] = k;
      if (this.remain != null) this.remain += this.amt[i] - old;
    }
  }
  // 在 local x 的車頂落一坨鳥屎
  splat(lx, quiet) {
    const ty = this.top[clamp(lx, 0, this.w - 1)];
    if (ty >= this.h) return;
    for (let y = ty - 1; y <= ty + 5; y++) for (let x = lx - 4; x <= lx + 4; x++) {
      const dd = Math.hypot(x - lx, (y - ty - 1) * 1.2);
      if (dd <= 3.2 + Math.random() * 0.8 || (Math.abs(x - lx) <= 1 && y < ty + 5 + Math.random() * 3)) this.setDirt(x, y, D_POOP, 1.5);
    }
    this.dirtDirty = true;
    if (!quiet) { this.bv -= 0.6; }
  }
  buildMaskCanvas() {
    const { w, h, part } = this;
    const [c, g] = mkCanvas(w, h);
    const id = g.createImageData(w, h);
    for (let i = 0; i < w * h; i++) if (part[i] === P_BODY || part[i] === P_GLASS || part[i] === P_SEAM) { id.data[i * 4 + 3] = 255; id.data[i * 4] = id.data[i * 4 + 1] = id.data[i * 4 + 2] = 255; }
    g.putImageData(id, 0, 0);
    this.maskC = c;
    [this.shineC, this.shineG] = mkCanvas(w, h);
  }

  get clean() { return clamp(1 - this.remain / this.total0, 0, 1); }
  get left() { return this.x; }
  get right() { return this.x + this.w; }
  // 世界座標 x 處的車頂高度（沒有車回傳地面）
  topAt(wx) {
    const lx = Math.floor(wx - this.x);
    if (lx < 0 || lx >= this.w) return GY;
    const t = this.top[lx];
    return t >= this.h ? GY : this.y + t;
  }
  topSpan(x0, x1) {
    let m = GY;
    for (let x = Math.floor(x0); x <= Math.ceil(x1); x += 2) m = Math.min(m, this.topAt(x));
    return m;
  }
  hasPixel(wx, wy) {
    const lx = Math.floor(wx - this.x), ly = Math.floor(wy - this.y);
    return lx >= 0 && ly >= 0 && lx < this.w && ly < this.h && this.part[ly * this.w + lx] > 0;
  }

  // 清潔：rect 世界座標，回傳 {removed, bits:[[x,y,col]...]}
  cleanRect(rx, ry, rw, rh, power, glassBonus = 1) {
    const x0 = Math.max(0, Math.floor(rx - this.x)), x1 = Math.min(this.w - 1, Math.ceil(rx + rw - this.x));
    const y0 = Math.max(0, Math.floor(ry - this.y)), y1 = Math.min(this.h - 1, Math.ceil(ry + rh - this.y));
    return this._clean(x0, y0, x1, y1, power, glassBonus, (x, y) => {
      const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
      const dx = Math.abs(x - cx) / ((x1 - x0) / 2 + 1), dy = Math.abs(y - cy) / ((y1 - y0) / 2 + 1);
      return 1 - 0.45 * Math.max(dx, dy);
    });
  }
  cleanCircle(wx, wy, r, power, glassBonus = 1) {
    const cx = wx - this.x, cy = wy - this.y;
    const x0 = Math.max(0, Math.floor(cx - r)), x1 = Math.min(this.w - 1, Math.ceil(cx + r));
    const y0 = Math.max(0, Math.floor(cy - r)), y1 = Math.min(this.h - 1, Math.ceil(cy + r));
    return this._clean(x0, y0, x1, y1, power, glassBonus, (x, y) => {
      const d = Math.hypot(x - cx, y - cy) / r;
      return d > 1 ? 0 : 1 - 0.5 * d;
    });
  }
  _clean(x0, y0, x1, y1, power, glassBonus, fall) {
    let removed = 0; const bits = [];
    if (x1 < x0 || y1 < y0) return { removed, bits, touched: false };
    let touched = false;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const i = y * this.w + x;
      if (!this.part[i]) continue;
      const f = fall(x, y);
      if (f <= 0) continue;
      touched = true;
      const a = this.amt[i];
      if (a <= 0) continue;
      const k = this.kind[i];
      let r = power * f * DIRT[k].res * (this.part[i] === P_GLASS ? glassBonus : 1);
      let na = a - r;
      if (na < 0.1) na = 0;
      this.amt[i] = na;
      removed += a - na;
      if (bits.length < 14 && Math.random() < 0.18) bits.push([this.x + x, this.y + y, DIRT[k].c[1]]);
    }
    if (removed > 0) { this.remain = Math.max(0, this.remain - removed); this.dirtDirty = true; }
    return { removed, bits, touched };
  }
  // 全車一起清（超必殺、完美收尾）
  cleanAll(power) {
    let removed = 0;
    for (let i = 0; i < this.amt.length; i++) {
      const a = this.amt[i]; if (!a) continue;
      let na = a - power * DIRT[this.kind[i]].res; if (na < 0.1) na = 0;
      this.amt[i] = na; removed += a - na;
    }
    this.remain = Math.max(0, this.remain - removed); this.dirtDirty = true;
    return removed;
  }
  // 隨機一個乾淨的車身像素（閃光用）
  randomCleanPixel() {
    for (let t = 0; t < 12; t++) {
      const x = rndi(0, this.w - 1), y = rndi(0, this.h - 1), i = y * this.w + x;
      if ((this.part[i] === P_BODY || this.part[i] === P_GLASS) && this.amt[i] === 0) return [this.x + x, this.y + y];
    }
    return null;
  }

  hit(force) { this.bv += force; this.shake = Math.max(this.shake, 6); }

  update() {
    // 彈簧晃動
    this.bv += -this.bounce * 0.25; this.bv *= 0.78; this.bounce += this.bv;
    if (this.shake > 0) this.shake--;
    if (this.shine > 0) this.shine++;
  }

  redrawDirt() {
    const { w, h } = this, d = this.dirtImg.data;
    for (let i = 0; i < w * h; i++) {
      const a = this.amt[i], o = i * 4;
      if (a <= 0) { d[o + 3] = 0; continue; }
      const x = i % w, y = (i / w) | 0;
      const lv = a < 0.35 ? 0 : a < 0.8 ? 1 : 2;
      if (lv === 0 && (x + y) & 1) { d[o + 3] = 0; continue; }
      const rgb = DIRT[this.kind[i]].rgb[this.kind[i] === D_SPOT || this.kind[i] === D_POOP ? lv : 2 - lv];
      d[o] = rgb[0]; d[o + 1] = rgb[1]; d[o + 2] = rgb[2];
      d[o + 3] = lv === 0 ? 170 : lv === 1 ? 215 : 255;
    }
    this.dirtG.putImageData(this.dirtImg, 0, 0);
    this.dirtDirty = false;
  }

  draw(t, reflect = true) {
    if (this.dirtDirty) this.redrawDirt();
    const sx = this.shake ? (this.shake % 2 ? 1 : -1) : 0;
    const by = Math.round(clamp(this.bounce, -3, 3));
    const x = this.x + sx, y = this.y + by;
    // 地面陰影＋倒影
    ctx.fillStyle = 'rgba(0,0,0,.45)';
    ctx.fillRect(this.x + 6, GY - 1, this.w - 12, 3);
    if (reflect) {
      ctx.save();
      ctx.globalAlpha = 0.16 + this.clean * 0.14;
      ctx.translate(x, GY * 2 + 1);
      ctx.scale(1, -1);
      ctx.drawImage(this.base, 0, 0);
      ctx.drawImage(this.dirtC, 0, 0);
      ctx.restore();
    }
    ctx.drawImage(this.base, x, y);
    ctx.drawImage(this.dirtC, x, y);
    // 完美光澤：斜向亮帶掃過
    const sh = this.shine > 0 ? this.shine : (this.clean > 0.6 ? (t % 240) : -1);
    if (sh >= 0) {
      const g = this.shineG;
      g.clearRect(0, 0, this.w, this.h);
      g.globalCompositeOperation = 'source-over';
      g.drawImage(this.maskC, 0, 0);
      g.globalCompositeOperation = 'source-in';
      const p = this.shine > 0 ? (sh * 4) % (this.w + 120) - 60 : sh * 1.6 - 60;
      g.fillStyle = this.shine > 0 ? 'rgba(255,255,255,.75)' : `rgba(255,255,255,${(this.clean - 0.6) * 0.9})`;
      g.beginPath(); g.moveTo(p, 0); g.lineTo(p + 10, 0); g.lineTo(p - 10, this.h); g.lineTo(p - 20, this.h); g.fill();
      g.beginPath(); g.moveTo(p + 16, 0); g.lineTo(p + 19, 0); g.lineTo(p - 1, this.h); g.lineTo(p - 4, this.h); g.fill();
      ctx.drawImage(this.shineC, x, y);
    }
  }
}
