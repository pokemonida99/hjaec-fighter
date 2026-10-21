// 三個關卡：場景背景（程式繪製）與關卡設定
'use strict';
const STAGES = [
  {
    key: 'garage', car: 'sedan', music: 'fight1', title: 'ROUND 1', sub: '預洗開打！', time: 45,
    signs: [[195, 29, '紅分子', { s: 2, c: '#ff3a3a', o: '#3a0000' }], [195, 66, 'HJAEC 汽車美容', { c: '#ffffff', o: '#5a0000' }]],
    dirt: { dust: 0.6, mud: 1.1, spots: 18, film: 0.5 },
    blobEvery: 8, blobMax: 1, birdEvery: 0,
    products: [['超效除汙高泡濃縮洗車精', '#e02a2a'], ['水垢水斑去除劑', '#2a9ae0']],
  },
  {
    key: 'sunset', car: 'suv', music: 'fight2', title: 'ROUND 2', sub: '玻璃油膜大作戰', time: 45,
    dirt: { dust: 0.7, mud: 1.2, spots: 22, film: 1.3, poop: 2 },
    blobEvery: 6.5, blobMax: 2, birdEvery: 5.5,
    products: [['玻璃油膜去除劑', '#e0b02a'], ['炫鑽玻璃鍍膜', '#7adcff']],
  },
  {
    key: 'night', car: 'sports', music: 'fight3', title: 'ROUND 3', sub: '頂級鍍膜決戰', time: 50,
    dirt: { dust: 0.8, mud: 1.3, spots: 25, film: 1.1, tar: 26, poop: 4 },
    blobEvery: 5, blobMax: 3, birdEvery: 4.2, rain: 24,   // 剩 24 秒時下雨
    products: [['全能去污還原膏', '#3ac060'], ['奈米陶瓷封體鍍膜', '#e02a2a']],
  },
  {
    key: 'pad', car: 'ev', music: 'fight4', title: 'FINAL ROUND', sub: '飛天電動車', time: 50, fly: true,
    dirt: { dust: 0.8, mud: 1.0, spots: 22, film: 1.2, poop: 3 },
    blobEvery: 5.5, blobMax: 2, birdEvery: 5,
    products: [['炫鑽玻璃鍍膜', '#7adcff'], ['全效環保去汙劑', '#e02a2a']],
  },
];

function px(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); }
function disc(x, y, r, c) {
  ctx.fillStyle = c;
  for (let dy = -r; dy <= r; dy++) { const w = Math.floor(Math.sqrt(r * r - dy * dy)); ctx.fillRect(Math.round(x - w), Math.round(y + dy), w * 2 + 1, 1); }
}
function vgrad(y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([o, c]) => g.addColorStop(o, c));
  return g;
}
// 色帶（復古漸層：一段一段，不平滑）
function bands(y0, y1, cols) {
  const n = cols.length, h = (y1 - y0) / n;
  cols.forEach((c, i) => px(0, y0 + i * h, W, Math.ceil(h) + 1, c));
}
function miniBottle(x, y, cap, body) {
  px(x + 1, y, 3, 2, cap); px(x, y + 2, 5, 9, body || '#1a1a1e'); px(x + 1, y + 5, 3, 3, cap); px(x, y + 2, 1, 9, 'rgba(255,255,255,.25)');
}

const BG = {
  garage() {
    // 牆
    bands(0, 150, ['#1c1c22', '#212128', '#26262e', '#2b2b34', '#303039']);
    for (let y = 12; y < 150; y += 16) px(0, y, W, 1, '#18181d');
    px(0, 84, W, 6, '#c81e28'); px(0, 90, W, 1, '#7a0e14');
    // 招牌
    px(96, 38, 160, 40, '#0c0c0e'); px(96, 38, 160, 2, '#e02a2a'); px(96, 76, 160, 2, '#e02a2a');
    px(96, 38, 2, 40, '#e02a2a'); px(254, 38, 2, 40, '#e02a2a');
    text('紅分子', 108, 46, { s: 2, c: '#ff3a3a', o: '#3a0000' });
    text('HJAEC', 188, 46, { s: 1, c: '#ffffff' });
    text('汽車美容', 188, 60, { s: 1, c: '#d8d8d8' });
    // 左側貨架
    for (const sy of [112, 140]) { px(6, sy, 84, 3, '#5a4a3a'); px(6, sy + 3, 84, 1, '#2a2018'); }
    const caps = ['#e02a2a', '#2a9ae0', '#3ac060', '#e0b02a', '#f0f0f0'];
    for (let i = 0; i < 12; i++) miniBottle(10 + i * 6.6, 101, caps[i % 5]);
    for (let i = 0; i < 10; i++) miniBottle(12 + i * 7.6, 129, caps[(i + 2) % 5], i % 3 ? '#1a1a1e' : '#e8e8e8');
    // 鐵捲門（右）
    px(290, 96, 90, 102, '#3a3c44');
    for (let y = 98; y < 186; y += 4) px(290, y, 90, 1, '#2a2c32');
    px(290, 186, 90, 12, '#f4e2a8'); px(290, 186, 90, 2, '#fff4cc');
    px(288, 92, 94, 5, '#15151a');
    // 吊燈
    for (const lx of [70, 192, 314]) { px(lx, 34, 1, 8, '#111'); px(lx - 7, 42, 15, 4, '#2a2a30'); px(lx - 5, 46, 11, 1, '#fff6c8'); }
    // 地板
    bands(150, GY, ['#34343c', '#3a3a43', '#40404a']);
    px(0, 150, W, 1, '#1a1a1f');
    bands(GY, H, ['#1e1e24', '#222229', '#26262e', '#2a2a32']);
    for (let x = -20; x < W; x += 32) px(x + 10, GY + 4, 18, 1, '#30303a');
    px(0, GY, W, 1, '#c81e28');
  },
  garageFx(t) {
    ctx.fillStyle = 'rgba(255,240,180,.06)';
    for (const lx of [70, 192, 314]) {
      ctx.beginPath(); ctx.moveTo(lx - 5, 47); ctx.lineTo(lx + 5, 47); ctx.lineTo(lx + 40, GY); ctx.lineTo(lx - 40, GY); ctx.fill();
    }
  },
  sunset() {
    bands(0, 140, ['#2a1846', '#3e1d55', '#5e2560', '#86305e', '#b23e58', '#d85848', '#ee7a3c', '#f8a040', '#fcc458']);
    disc(250, 132, 24, '#ffe08a'); disc(250, 132, 20, '#fff2c0');
    // 雲
    for (const [cx, cy, w] of [[40, 40, 70], [150, 26, 50], [300, 54, 80], [210, 80, 60]]) { px(cx, cy, w, 4, '#ff9a6a'); px(cx + 8, cy - 3, w - 20, 3, '#ffb88a'); px(cx + 4, cy + 4, w - 8, 2, '#c85a5a'); }
    // 遠山
    ctx.fillStyle = '#4a2650';
    ctx.beginPath(); ctx.moveTo(0, 140);
    for (let x = 0; x <= W; x += 8) ctx.lineTo(x, 112 + Math.sin(x * 0.03) * 10 + Math.sin(x * 0.11) * 4);
    ctx.lineTo(W, 140); ctx.fill();
    ctx.fillStyle = '#2e1838';
    ctx.beginPath(); ctx.moveTo(0, 145);
    for (let x = 0; x <= W; x += 6) ctx.lineTo(x, 128 + Math.sin(x * 0.05 + 2) * 7);
    ctx.lineTo(W, 145); ctx.fill();
    // 棕櫚樹剪影
    for (const tx of [24, 360]) {
      for (let y = 70; y < 150; y++) px(tx + Math.sin(y * 0.05) * 3, y, 3, 1, '#1a0e1e');
      for (let a = 0; a < 8; a++) for (let i = 0; i < 26; i++) {
        const ang = -Math.PI + 0.25 + a * (Math.PI - 0.5) / 7;
        const fx = tx + 1 + Math.cos(ang) * i, fy = 70 + Math.sin(ang) * i * 0.55 + i * i * 0.03;
        px(fx, fy, i < 18 ? 2 : 1, 2, '#1a0e1e');
        if (i > 4 && i % 3 === 0) px(fx, fy + 2, 1, 3, '#1a0e1e');   // 葉片垂絲
      }
    }
    // 洗車棚
    px(60, 40, 300, 16, '#c81e28'); px(60, 40, 300, 2, '#ff5050'); px(60, 54, 300, 2, '#7a0e14');
    text('紅分子 HJAEC 洗車站', 210, 43, { c: '#ffffff', a: 'c' });
    px(68, 56, 5, 142, '#5a5a66'); px(350, 56, 5, 142, '#5a5a66');
    px(68, 56, 1, 142, '#8a8a96'); px(350, 56, 1, 142, '#8a8a96');
    for (let x = 90; x < 340; x += 34) px(x, 56, 12, 2, '#fff2c0');
    // 地面
    bands(145, GY, ['#4a3a4a', '#544252', '#5e4a5a']);
    bands(GY, H, ['#3a2e3e', '#40334a', '#46384e', '#4c3c52']);
    px(0, GY, W, 1, '#2a1e2e');
    // 水窪
    for (const [x, y, w] of [[20, GY + 6, 40], [320, GY + 9, 50], [180, GY + 13, 30]]) { px(x, y, w, 3, '#e88a5a'); px(x + 4, y, w - 8, 1, '#fcc458'); }
  },
  sunsetFx(t) {
    // 遠方飛鳥
    for (let i = 0; i < 3; i++) {
      const x = (t * 0.3 + i * 140) % (W + 40) - 20, y = 60 + i * 9 + Math.sin(t * 0.05 + i) * 2;
      const f = Math.floor(t / 12 + i) % 2;
      px(x, y, 2, 1, '#2a1030'); px(x + 2, y + (f ? -1 : 1), 1, 1, '#2a1030'); px(x - 1, y + (f ? -1 : 1), 1, 1, '#2a1030');
    }
  },
  night() {
    bands(0, 150, ['#05061a', '#080a22', '#0c0e2c', '#121236', '#1a1640', '#24184a']);
    for (let i = 0; i < 60; i++) px(rndi(0, W), rndi(0, 90), 1, 1, Math.random() < 0.3 ? '#ffffff' : '#7a7aa8');
    disc(330, 30, 10, '#f4f0d8'); disc(334, 27, 9, '#0c0e2c');
    // 遠樓
    for (let x = 0; x < W; x += rndi(18, 30)) {
      const h = rndi(40, 90), w = rndi(16, 26);
      px(x, 150 - h, w, h, '#141632');
      for (let wy = 150 - h + 4; wy < 146; wy += 5) for (let wx = x + 2; wx < x + w - 2; wx += 4)
        if (Math.random() < 0.35) px(wx, wy, 2, 2, Math.random() < 0.8 ? '#e8c860' : '#80c8ff');
    }
    // 近樓
    for (const [x, w, h] of [[0, 70, 110], [300, 84, 120]]) {
      px(x, 150 - h, w, h, '#0a0b1c');
      for (let wy = 150 - h + 6; wy < 146; wy += 8) for (let wx = x + 4; wx < x + w - 4; wx += 8)
        if (Math.random() < 0.5) px(wx, wy, 4, 3, '#3a3418');
    }
    // 招牌底板
    px(12, 102, 46, 20, '#000'); px(318, 50, 52, 18, '#000'); px(150, 40, 84, 22, '#000');
    // 地面（濕柏油）
    bands(150, GY, ['#14141c', '#17171f', '#1a1a24']);
    bands(GY, H, ['#0e0e14', '#101018', '#12121a', '#14141e']);
    for (let x = 0; x < W; x += 40) px(x + 8, GY + 8, 20, 1, '#e0e0e0');
  },
  nightFx(t) {
    const fl = n => (Math.sin(t * 0.13 + n) > -0.85) || (t % 50 < 3);
    if (fl(0)) text('鍍膜', 35, 106, { c: '#ff3a4a', a: 'c', o: '#5a0010' });
    if (fl(2)) text('24H', 344, 53, { c: '#40e8ff', a: 'c', o: '#003a50' });
    if (fl(4)) text('紅分子 HJAEC', 192, 45, { c: '#ff6ab0', a: 'c', o: '#4a0026' });
    // 地面霓虹倒影
    ctx.globalAlpha = 0.25;
    if (fl(0)) px(24, GY + 2, 22, 6, '#ff3a4a');
    if (fl(2)) px(334, GY + 2, 22, 8, '#40e8ff');
    if (fl(4)) px(150, 160, 84, 2, '#ff6ab0');
    ctx.globalAlpha = 1;
  },
};

// GPT 畫的背景圖（tools/stage_art.py 產生 BG_ART）
const BG_IMG = {};
const BGS_READY = Promise.all(Object.entries(window.BG_ART || {}).map(([k, u]) => new Promise(res => {
  const im = new Image(); im.onload = () => { BG_IMG[k] = im; res(); }; im.onerror = () => res(); im.src = u;
})));

// 先畫到主畫布再存成背景圖（text() 只畫在主畫布上）
function buildBG(key) {
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (BG_IMG[key]) {
    ctx.drawImage(BG_IMG[key], 0, 0);
    const st = STAGES.find(x => x.key === key);
    (st && st.signs || []).forEach(([x, y, str, o]) => text(str, x, y, Object.assign({ a: 'c' }, o)));
  } else (BG[key] || BG.night)();
  ctx.restore();
  const [c, g] = mkCanvas(W, H);
  g.drawImage(cv, 0, 0);
  return c;
}
