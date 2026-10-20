// 共用：畫布、像素文字、輸入、小工具
'use strict';
const W = 384, H = 216, GY = 198;            // 內部解析度、地面高度
const cv = document.getElementById('game');
const ctx = cv.getContext('2d');
ctx.imageSmoothingEnabled = false;

const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const rnd = (a, b) => a + Math.random() * (b - a);
const rndi = (a, b) => Math.floor(rnd(a, b + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const rectHit = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

function mkCanvas(w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d', { willReadFrequently: true }); g.imageSmoothingEnabled = false;
  return [c, g];
}
function hex2rgb(h) {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function shade(h, f) {           // f<1 變暗, f>1 變亮
  const [r, g, b] = hex2rgb(h);
  const m = v => clamp(Math.round(f > 1 ? v + (255 - v) * (f - 1) : v * f), 0, 255);
  return '#' + [m(r), m(g), m(b)].map(v => v.toString(16).padStart(2, '0')).join('');
}

// 把有半透明鋸齒的圖層二值化，維持像素感
function binarize(g, w, h, th = 110) {
  const id = g.getImageData(0, 0, w, h), d = id.data;
  for (let i = 3; i < d.length; i += 4) d[i] = d[i] > th ? 255 : 0;
  g.putImageData(id, 0, 0);
}
// 在不透明像素外圍描一圈邊
function outline(g, w, h, col = '#000') {
  const id = g.getImageData(0, 0, w, h), d = id.data, [r, gg, b] = hex2rgb(col);
  const src = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) src[i] = d[i * 4 + 3] > 0 ? 1 : 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x;
    if (src[i]) continue;
    if ((x > 0 && src[i - 1]) || (x < w - 1 && src[i + 1]) || (y > 0 && src[i - w]) || (y < h - 1 && src[i + w])) {
      d[i * 4] = r; d[i * 4 + 1] = gg; d[i * 4 + 2] = b; d[i * 4 + 3] = 255;
    }
  }
  g.putImageData(id, 0, 0);
}
// 產生單色剪影（受擊閃白、殘影用）
function silhouette(src, col) {
  const [c, g] = mkCanvas(src.width, src.height);
  g.drawImage(src, 0, 0);
  g.globalCompositeOperation = 'source-in';
  g.fillStyle = col; g.fillRect(0, 0, c.width, c.height);
  return c;
}

// ---------- 像素文字（俐方體11號，二值化後快取） ----------
const FONT = "12px Cubic, 'PingFang TC', sans-serif";
const textCache = new Map();
function textBitmap(str, col, opt) {
  const key = str + '|' + col + '|' + (opt.o || '') + '|' + (opt.grad || '');
  let c = textCache.get(key);
  if (c) return c;
  const [m, mg] = mkCanvas(4, 4);
  mg.font = FONT;
  const tw = Math.ceil(mg.measureText(str).width) + 4, th = 16;
  const [t, tg] = mkCanvas(tw, th);
  tg.font = FONT; tg.textBaseline = 'top'; tg.fillStyle = '#fff';
  tg.fillText(str, 2, 2);
  const id = tg.getImageData(0, 0, tw, th), d = id.data;
  const g1 = opt.grad ? hex2rgb(opt.grad[0]) : null, g2 = opt.grad ? hex2rgb(opt.grad[1]) : null;
  const base = hex2rgb(col);
  for (let y = 0; y < th; y++) for (let x = 0; x < tw; x++) {
    const i = (y * tw + x) * 4;
    if (d[i + 3] > 120) {
      let rgb = base;
      if (g1) { const k = clamp((y - 3) / 10, 0, 1); rgb = [0, 1, 2].map(j => Math.round(lerp(g1[j], g2[j], k))); }
      d[i] = rgb[0]; d[i + 1] = rgb[1]; d[i + 2] = rgb[2]; d[i + 3] = 255;
    } else d[i + 3] = 0;
  }
  tg.putImageData(id, 0, 0);
  if (opt.o) outline(tg, tw, th, opt.o);
  textCache.set(key, t);
  return t;
}
// text(字串, x, y, {c 顏色, s 放大倍數, a 對齊 'l'|'c'|'r', o 描邊色, grad [上色, 下色]})
function text(str, x, y, opt = {}) {
  str = String(str);
  const s = opt.s || 1, bmp = textBitmap(str, opt.c || '#fff', opt);
  const w = (bmp.width - 4) * s;
  let dx = x - 2 * s;
  if (opt.a === 'c') dx -= w / 2; else if (opt.a === 'r') dx -= w;
  ctx.drawImage(bmp, Math.round(dx), Math.round(y - 2 * s), bmp.width * s, bmp.height * s);
  return w;
}
function textW(str, s = 1) { return (textBitmap(String(str), '#fff', {}).width - 4) * s; }

// ---------- 輸入：鍵盤 / 觸控 / 手把 ----------
const KEYMAP = {
  ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down', KeyJ: 'p', KeyZ: 'p', KeyK: 'k', KeyX: 'k',
  KeyL: 's1', KeyC: 's1', KeyI: 's2', KeyV: 's2', KeyO: 'sup', KeyB: 'sup', Space: 'sup',
  Enter: 'start', Escape: 'pause', KeyP: 'pause',
};
const BTNS = ['left', 'right', 'up', 'down', 'p', 'k', 's1', 's2', 'sup', 'start', 'pause'];
const Input = {
  key: {}, touch: {}, pad: {}, held: {}, prev: {}, pressed: {}, hist: [], frame: 0, anyPressed: false,
  update() {
    this.frame++;
    this.pollPad();
    this.anyPressed = false;
    for (const b of BTNS) {
      const h = !!(this.key[b] || this.touch[b] || this.pad[b]);
      this.pressed[b] = h && !this.prev[b];
      if (this.pressed[b]) {
        this.anyPressed = true;
        if (b === 'left' || b === 'right' || b === 'up' || b === 'down') this.hist.push({ d: b, f: this.frame });
      }
      this.held[b] = h; this.prev[b] = h;
    }
    if (this.hist.length > 12) this.hist.splice(0, this.hist.length - 12);
  },
  // 指令偵測：seq 例 ['down','down']，fwd/back 依面向換算，window 幀數內
  motion(seq, face, win = 22) {
    const map = d => d === 'fwd' ? (face > 0 ? 'right' : 'left') : d === 'back' ? (face > 0 ? 'left' : 'right') : d;
    const want = seq.map(map);
    const h = this.hist.filter(e => this.frame - e.f <= win);
    let j = want.length - 1;
    for (let i = h.length - 1; i >= 0 && j >= 0; i--) if (h[i].d === want[j]) j--;
    return j < 0;
  },
  pollPad() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const p = pads && [...pads].find(x => x);
    const s = {};
    if (p) {
      const b = i => p.buttons[i] && p.buttons[i].pressed, ax = p.axes || [];
      s.left = b(14) || ax[0] < -0.5; s.right = b(15) || ax[0] > 0.5;
      s.up = b(12) || ax[1] < -0.5; s.down = b(13) || ax[1] > 0.5;
      s.p = b(0); s.k = b(1); s.s1 = b(2); s.s2 = b(3); s.sup = b(5) || b(7); s.start = b(9); s.pause = b(8);
    }
    this.pad = s;
  },
};
addEventListener('keydown', e => {
  const b = KEYMAP[e.code];
  if (b) { Input.key[b] = true; e.preventDefault(); }
  Audio2.unlock();
});
addEventListener('keyup', e => { const b = KEYMAP[e.code]; if (b) Input.key[b] = false; });
addEventListener('blur', () => { Input.key = {}; Input.touch = {}; });

// 觸控
const isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
if (isTouch) document.body.classList.add('touch');
(function setupTouch() {
  const pad = document.getElementById('pad'), knob = document.getElementById('knob');
  let padId = null;
  const setDir = (e) => {
    const r = pad.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    const dist = Math.hypot(dx, dy), dead = 16;
    const t = Input.touch;
    t.left = dx < -dead && Math.abs(dx) > Math.abs(dy) * 0.45;
    t.right = dx > dead && Math.abs(dx) > Math.abs(dy) * 0.45;
    t.up = dy < -dead && Math.abs(dy) > Math.abs(dx) * 0.45;
    t.down = dy > dead && Math.abs(dy) > Math.abs(dx) * 0.45;
    const k = Math.min(dist, 40) / (dist || 1);
    knob.style.transform = `translate(${dx * k}px,${dy * k}px)`;
  };
  const clearDir = () => { Object.assign(Input.touch, { left: false, right: false, up: false, down: false }); knob.style.transform = ''; };
  pad.addEventListener('pointerdown', e => { padId = e.pointerId; pad.setPointerCapture(e.pointerId); setDir(e); e.preventDefault(); });
  pad.addEventListener('pointermove', e => { if (e.pointerId === padId) setDir(e); });
  const up = e => { if (e.pointerId === padId) { padId = null; clearDir(); } };
  pad.addEventListener('pointerup', up); pad.addEventListener('pointercancel', up);
  document.querySelectorAll('[data-b]').forEach(el => {
    const b = el.dataset.b;
    el.addEventListener('pointerdown', e => { Input.touch[b] = true; el.classList.add('on'); e.preventDefault(); });
    const off = () => { Input.touch[b] = false; el.classList.remove('on'); };
    el.addEventListener('pointerup', e => { off(); Audio2.unlock(); });
    el.addEventListener('pointercancel', off); el.addEventListener('pointerleave', off);
  });
  // 點畫面 = START（選單用）
  cv.addEventListener('pointerdown', e => {
    e.preventDefault();
    if (typeof G !== 'undefined' && G.scene === 'play' && !G.paused) return;   // 遊戲中點畫面不暫停
    Input.touch.start = true;
  });
  cv.addEventListener('pointerup', () => { Input.touch.start = false; Audio2.unlock(); });
  document.addEventListener('touchend', () => Audio2.unlock(), { passive: true });
  document.addEventListener('click', () => Audio2.unlock());
})();

// 畫面縮放：盡量整數倍，保持像素銳利
function fit() {
  const vw = innerWidth, vh = innerHeight;
  const portrait = vh > vw;
  document.body.classList.toggle('portrait', portrait && isTouch);
  let s = Math.min(vw / W, (portrait && isTouch ? vh * 0.55 : vh) / H);
  if (s >= 2) s = Math.floor(s * 2) / 2;
  cv.style.width = Math.floor(W * s) + 'px';
  cv.style.height = Math.floor(H * s) + 'px';
  document.documentElement.style.setProperty('--cvh', Math.floor(H * s) + 'px');
}
addEventListener('resize', fit); fit();

// 最高分
const Store = {
  get(k, d) { try { const v = localStorage.getItem('hjaec_' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('hjaec_' + k, JSON.stringify(v)); } catch (e) { /* 無痕模式 */ } },
};
