// 角色資料與像素角色繪製（骨架＋像素頭像，程式即時產生，原創）
'use strict';

// 頭部像素圖（面向右）。'.' 透明；anchor = 脖子底端（接肩膀處）
const HEADS = {
  kuri: { anchor: [10, 18], map: [
    '......bBBBBb....',
    '...bBBBBBBBBBb..',
    '.bBBBBBBBBBBBBb.',
    'bBBBBBBBBBBBBBBb',
    '.bbBBBBBBBBBBbb.',
    '..hhbbbbbbbbbh..',
    '.hHHHHHHHHHHHHh.',
    '.hHHHHHHHHHHHHHh',
    '.hHHHHHHSHHHSHHh',
    '.hHHHHSSSSSSSSS.',
    '.hHHHSGGGSSGGGS.',
    '.hHHHSGEGGGGEGS.',
    '.hHHHSGGGSSGGGS.',
    '.hHHHHsSSSSSSSS.',
    '.hHHHHHsSSSMMSs.',
    '..hHHHH.sSSSSs..',
    '..hhHH...sSSs...',
    '.........sss....',
  ] },
  rin: { anchor: [10, 18], map: [
    '................',
    '......KKKK......',
    '....KKHHHHKK....',
    '...KHHHHHHHHK...',
    '..HHHHHHHHHHHH..',
    '.hHHHHHHHHHHHHH.',
    '.hHHHHHHHHHHHHHh',
    '.hHHHHHHHHHHHHHh',
    '.hHHHHHSSSSSSSHh',
    '.hHHKKSEESSSEESh',
    '.hHKKKSSSSSSSSSh',
    '.hHKKKsSSSSsSSSh',
    '.hHHKHHsSSSSSSHh',
    '.hHHHKHsSSSRRSH.',
    '.hHHHHKKKKKKkHH.',
    '.hhHHHH.sSSSHh..',
    '..hhhh...sSs....',
    '.........sss....',
  ] },
  leo: { anchor: [10, 19], map: [
    '....hHhHHhH.....',
    '..hHHHHHHHHHh...',
    '.hHHHHHHHHHHHh..',
    'hHHHHHHHHHHHHHh.',
    'hHHHHHHHHSSSHHh.',
    'hHHHHHHSSSSSSSh.',
    'hHHHHHSSSSSSSSS.',
    'HhHHHSEEESSEEES.',
    'hHHHSGGGSSGGGGS.',
    'HHHHSGEGGGGEGGS.',
    'hHHHSGGGSSGGGSS.',
    'HhHHHSSSSsSSSSS.',
    'hHHHHDSSSSSSSDS.',
    'HhHHDDDDRRRRDDD.',
    'hHHHHDDDDDDDDDD.',
    'HhHHHHDDDDDDDD..',
    'hHhHHHHDDDDDD...',
    'HhHhHH..sSSs....',
    'hHhHh...sSSs....',
    '.HhH............',
    '.hH.............',
  ] },
  momo: { anchor: [11, 16], map: [
    '......HHHH......',
    '....HHHHHHHH....',
    '...HHHHHHHHHH...',
    '..HHHHHHHHHHHH..',
    '.hHHHHHHHHHHHHH.',
    '.hHHHHHHHHHHHHHh',
    '.hHHHHHHHSHHHSHh',
    '.hHHHHHSSSSSSSSh',
    '.hHHHHSEESSSEESh',
    '.hHHHHSWESSSWESh',
    '.hHHHHSSSSSsSSSh',
    '.hHHHHHsSSSSSSHh',
    '.hHHHHHHsSSRRSH.',
    '.hHHHHHH.sSSSHh.',
    '.hHHHHHH..sSsHh.',
    '.hHHHHHH..sSs.h.',
    '.hHHHHHh........',
    '..hHHHH.........',
    '..hHHh..........',
    '...hh...........',
  ] },
};

// 四位角色（外型取自使用者提供的設定圖；名字、招式皆原創）
const CHARS = [
  {
    id: 'boss', pIdx: 5, name: '巨輪', en: 'GIANT WHEEL', title: '紅分子老闆', fb: 'leo',
    blurb: '紅分子的老闆，親自下場示範什麼叫鍍膜。',
    stats: { spd: 3, pow: 5, jmp: 3 }, speed: 1.3, power: 1.3, jump: 1.0, scale: 1.0,
    fx: { main: '#ff3a3a', sub: '#ffd0d0', glow: '#ff1a1a' },
    sp: { s1: 'torpedo', s2: 'stomp', rush: 'knee' },
    cmd: { proj: '←蓄 →＋拳', rise: '↓蓄 ↑＋腳', rush: '→→＋拳' },
    moves: { proj: '紅分子魚雷', rise: '巨輪踩頭', rush: '雙輪膝擊' },
  },
  {
    id: 'sailor', pIdx: 6, name: '巨輪水手', en: 'SAILOR WHEEL', title: '紅分子老闆（？）', fb: 'leo',
    blurb: '穿上水手服的老闆。不要問，問就是業配。',
    stats: { spd: 2, pow: 4, jmp: 4 }, speed: 1.15, power: 1.2, jump: 1.08, scale: 1.0,
    fx: { main: '#6ac8ff', sub: '#ffffff', glow: '#2a7cff' },
    rushKick: true, moves: { proj: '水手高壓水砲', rise: '海浪漩渦', rush: '水手連環踢' },
  },
  {
    id: 'hong', pIdx: 7, name: '小紅', en: 'HONG', title: '紅分子代言人', fb: 'rin',
    blurb: '速度最快，一瓶鍍膜噴霧走天下。',
    stats: { spd: 5, pow: 2, jmp: 4 }, speed: 1.65, power: 0.9, jump: 1.1, scale: 1.0,
    fx: { main: '#ff7a8a', sub: '#ffffff', glow: '#ff2a4a' },
    moves: { proj: '鍍膜噴霧', rise: '空翻踢', rush: '連環手刀' },
  },
  {
    id: 'fen', pIdx: 8, name: '小芬', en: 'FEN', title: '紅分子代言人', fb: 'momo',
    blurb: '吸水巾一甩，水珠跟髒污一起飛。',
    stats: { spd: 4, pow: 3, jmp: 3 }, speed: 1.45, power: 1.05, jump: 1.0, scale: 1.0,
    fx: { main: '#bfe8ff', sub: '#ffffff', glow: '#40a0ff' },
    rushKick: true, moves: { proj: '吸水巾甩擊', rise: '旋風吸水巾', rush: '長腿連踢' },
  },
  {
    id: 'kuri', pIdx: 1, name: '小葵', en: 'AOI', title: '新銳設計師',
    blurb: '剛進公司的設計師，最受不了車上的水斑。',
    stats: { spd: 3, pow: 3, jmp: 3 }, speed: 1.35, power: 1.0, jump: 1.0, scale: 1.0,
    pal: { B: '#b5713c', b: '#7f4a22', H: '#7a5536', h: '#4f3520', S: '#f6d2b8', s: '#d8a888', G: '#9b7563', E: '#2a1c1c', M: '#c4505a', W: '#fff' },
    body: { top: '#efe4c8', topS: '#c9b791', sleeve: '#e6d9b8', bottom: 'skirt', skirt: '#26346a', dots: ['#d8402c', '#f0b040', '#e86a80'],
      legs: '#f3cdb2', shoes: '#9a5a2a', hand: '#f6d2b8', skirtLen: 9, skirtFlare: 8, knit: true },
    fx: { main: '#8ef0ff', sub: '#ffffff', glow: '#3ab0ff' },
    moves: { proj: '結晶鍍膜波', rise: '炫鑽迴旋', rush: '拋光連掌' },
  },
  {
    id: 'rin', pIdx: 2, name: '小米', en: 'MI', title: '客服人員',
    blurb: '一天接三百通電話，音波比水柱還強。',
    stats: { spd: 5, pow: 2, jmp: 3 }, speed: 1.6, power: 0.85, jump: 1.0, scale: 0.98,
    pal: { K: '#1c1c22', k: '#3a3a44', H: '#25242c', h: '#121117', S: '#f4d3c0', s: '#d6a690', E: '#1a1418', R: '#b8505e', W: '#fff' },
    body: { top: '#7c859e', topS: '#5d6680', sleeve: '#7c859e', trim: '#232c5a', collar: '#dbe6f6', bow: '#232c5a',
      bottom: 'pencil', skirt: '#222a50', legs: '#ecc8b4', shoes: '#141418', hand: '#f4d3c0', skirtLen: 12, skirtFlare: 2 },
    fx: { main: '#ffffff', sub: '#9fd8ff', glow: '#5aa0ff' },
    rushKick: true, moves: { proj: '高泡音波', rise: '客訴迴旋踢', rush: '連環來電' },
  },
  {
    id: 'leo', pIdx: 3, name: '阿傑', en: 'JIE', title: '老鳥設計師',
    blurb: '改過一千次稿，柏油也照樣改掉。',
    stats: { spd: 2, pow: 5, jmp: 2 }, speed: 1.1, power: 1.35, jump: 0.92, scale: 1.07,
    pal: { H: '#8a5228', h: '#5b3418', S: '#e2b48f', s: '#bf8c6a', E: '#2a1a12', G: '#a8844e', D: '#4a2c18', R: '#a86058' },
    body: { top: '#1d1d22', topS: '#0f0f13', sleeve: '#1d1d22', turtle: true, bottom: 'pants', pants: '#2b3d66', pantsS: '#1f2c4c',
      shoes: '#151515', hand: '#e2b48f' },
    fx: { main: '#7dff6a', sub: '#e8ffd0', glow: '#2fb84a' },
    moves: { proj: '去汙重砲', rise: '拋光風車', rush: '重壓清潔' },
  },
  {
    id: 'momo', pIdx: 4, name: 'VIVI', en: 'VIVI', title: '老闆',
    blurb: '設計公司老闆，高跟鞋踢得比誰都高。',
    stats: { spd: 3, pow: 3, jmp: 5 }, speed: 1.4, power: 1.05, jump: 1.18, scale: 1.0,
    pal: { H: '#efd59e', h: '#c4a466', S: '#fadcd0', s: '#e3b2a2', E: '#4a2a20', W: '#fff', R: '#e8607a' },
    body: { top: '#ea4f95', topS: '#b8336f', sleeve: '#ea4f95', shirt: '#fbc2d6', bottom: 'pencil', skirt: '#ea4f95',
      legs: '#f6d2c4', shoes: '#d9b45a', hand: '#fadcd0', skirtLen: 11, skirtFlare: 2, heels: true },
    fx: { main: '#ff8ac4', sub: '#fff0f8', glow: '#ff3c8c' },
    rushKick: true, moves: { proj: '乳蠟愛心彈', rise: '閃亮飛踢', rush: '高跟連踢' },
  },
];
const SUPER_NAME = '紅分子・全車鍍膜';
const DEFAULT_CMD = { proj: '↓↓＋拳', rise: '↓↓＋腳', rush: '→→＋拳' };
const cmdOf = (ch, k) => (ch.cmd && ch.cmd[k]) || DEFAULT_CMD[k];

// ---------- 姿勢（角度單位：度；0 = 朝下，90 = 朝前，180 = 朝上） ----------
// a = [肩, 肘]  l = [髖, 膝]  F 前側 B 後側  lean 前傾  bob 身體下沉
const POSES = {
  idle0: { lean: 6, aF: [50, 85], aB: [28, 95], lF: [16, -10], lB: [-18, -12] },
  idle1: { lean: 8, aF: [46, 90], aB: [24, 100], lF: [18, -16], lB: [-18, -18] },
  walk0: { lean: 8, aF: [50, 85], aB: [28, 95], lF: [26, -14], lB: [-22, -6] },
  walk1: { lean: 8, aF: [48, 85], aB: [30, 95], lF: [6, -40], lB: [-6, -6] },
  walk2: { lean: 8, aF: [50, 85], aB: [28, 95], lF: [-22, -6], lB: [26, -14] },
  walk3: { lean: 8, aF: [52, 85], aB: [26, 95], lF: [-6, -6], lB: [6, -40] },
  crouch: { lean: 22, aF: [60, 80], aB: [36, 95], lF: [72, -125], lB: [38, -128] },
  jump: { lean: 10, aF: [70, 90], aB: [40, 110], lF: [64, -110], lB: [20, -100] },
  fall: { lean: 4, aF: [80, 60], aB: [50, 80], lF: [30, -50], lB: [-10, -30] },
  punch0: { lean: 2, aF: [38, 100], aB: [30, 95], lF: [18, -10], lB: [-20, -10] },
  punch1: { lean: 16, aF: [92, 0], aB: [18, 110], lF: [24, -14], lB: [-22, -4] },
  kick0: { lean: -4, aF: [60, 70], aB: [30, 90], lF: [80, -100], lB: [-6, -4] },
  kick1: { lean: -14, aF: [40, 60], aB: [-20, 60], lF: [96, -4], lB: [-4, -2] },
  cpunch: { lean: 20, aF: [90, 0], aB: [30, 100], lF: [72, -125], lB: [38, -128] },
  ckick0: { lean: 18, aF: [60, 80], aB: [30, 95], lF: [60, -110], lB: [38, -128] },
  ckick1: { lean: 10, aF: [40, 60], aB: [-30, 40], lF: [84, -2], lB: [40, -130] },
  jpunch: { lean: 18, aF: [62, 0], aB: [40, 100], lF: [55, -95], lB: [15, -80] },
  jkick: { lean: -6, aF: [70, 60], aB: [20, 80], lF: [76, 0], lB: [30, -100] },
  throw0: { lean: -12, aF: [205, -40], aB: [40, 80], lF: [28, -6], lB: [-26, -6] },
  throw1: { lean: 6, aF: [140, 10], aB: [20, 60], lF: [28, -10], lB: [-26, -6] },
  throw2: { lean: 26, aF: [78, 0], aB: [-20, 30], lF: [34, -24], lB: [-30, -4] },
  spin: { lean: 0, aF: [92, 0], aB: [-92, 0], lF: [8, -20], lB: [-6, -40] },
  spinK: { lean: -8, aF: [120, 0], aB: [-70, 0], lF: [92, 0], lB: [-10, -30] },
  rush0: { lean: 18, aF: [92, 0], aB: [40, 100], lF: [36, -32], lB: [-34, -4] },
  rush1: { lean: 18, aF: [55, 95], aB: [92, 0], lF: [36, -32], lB: [-34, -4] },
  rushK: { lean: -10, aF: [50, 60], aB: [10, 80], lF: [94, -2], lB: [-8, -6] },
  hurt: { lean: -22, aF: [20, 50], aB: [-10, 40], lF: [12, -14], lB: [-16, -6] },
  yuck: { lean: -8, aF: [150, 100], aB: [140, 110], lF: [10, -8], lB: [-12, -6] },
  win0: { lean: -4, aF: [62, 95], aB: [176, 0], lF: [12, -4], lB: [-12, -4] },
  win1: { lean: -6, aF: [56, 100], aB: [168, 14], lF: [12, -4], lB: [-12, -4], bob: 1 },
  dash: { lean: 34, aF: [96, 0], aB: [-64, 0], lF: [54, -60], lB: [-52, -10] },
  stand: { lean: 0, aF: [8, 10], aB: [-6, 10], lF: [4, -2], lB: [-4, -2] },
};

const SPR_W = 80, SPR_H = 100, OX = 40, OY = 96;
const D2R = Math.PI / 180;
const spriteCache = new Map();

function drawHead(g, ch, x, y) {
  const head = HEADS[ch.id], pal = ch.pal;
  const [ax, ay] = head.anchor;
  head.map.forEach((row, r) => {
    for (let c = 0; c < row.length; c++) {
      const k = row[c];
      if (k === '.') continue;
      g.fillStyle = pal[k] || '#f0f';
      g.fillRect(Math.round(x - ax + c), Math.round(y - ay + r), 1, 1);
    }
  });
}

function limb(g, x1, y1, x2, y2, w, col) {
  g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round';
  g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
}
function poly(g, pts, col) {
  g.fillStyle = col; g.beginPath();
  pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y));
  g.closePath(); g.fill();
}

// 依姿勢產生一張角色圖（面向右）
function buildSprite(ch, pose) {
  const [c, g] = mkCanvas(SPR_W, SPR_H);
  const sc = ch.scale, b = ch.body;
  const TH = 14 * sc, SH = 14 * sc, UA = 10 * sc, FA = 9 * sc, TORSO = 20 * sc;
  const dir = a => [Math.sin(a * D2R), Math.cos(a * D2R)];
  // 腳底落地：取兩腳中較低者
  const drop = l => TH * Math.cos(l[0] * D2R) + SH * Math.cos((l[0] + l[1]) * D2R);
  const hipY = OY - Math.max(drop(pose.lF), drop(pose.lB), 6) - 1;
  const hip = [OX + (pose.bx || 0), hipY + (pose.bob || 0)];
  const lean = pose.lean * D2R;
  const up = [Math.sin(lean), -Math.cos(lean)], perp = [Math.cos(lean), Math.sin(lean)];
  const sh = [hip[0] + up[0] * TORSO, hip[1] + up[1] * TORSO];

  const legPts = (l, off) => {
    const h = [hip[0] + off, hip[1]];
    const d1 = dir(l[0]), k = [h[0] + d1[0] * TH, h[1] + d1[1] * TH];
    const d2 = dir(l[0] + l[1]), f = [k[0] + d2[0] * SH, k[1] + d2[1] * SH];
    return { h, k, f, a2: l[0] + l[1] };
  };
  const armPts = (a, off) => {
    const s = [sh[0] + perp[0] * off, sh[1] + perp[1] * off + 1];
    const d1 = dir(a[0]), e = [s[0] + d1[0] * UA, s[1] + d1[1] * UA];
    const d2 = dir(a[0] + a[1]), hnd = [e[0] + d2[0] * FA, e[1] + d2[1] * FA];
    return { s, e, hnd };
  };
  const drawLeg = (L, back) => {
    const dk = back ? 0.78 : 1;
    const thighCol = b.bottom === 'pants' ? b.pants : b.legs;
    const shinCol = b.bottom === 'pants' ? b.pants : b.legs;
    limb(g, L.h[0], L.h[1], L.k[0], L.k[1], 5.2 * sc, shade(thighCol, dk));
    limb(g, L.k[0], L.k[1], L.f[0], L.f[1], 4.2 * sc, shade(shinCol, dk));
    // 鞋
    const fd = [Math.cos(L.a2 * D2R), -Math.sin(L.a2 * D2R)];
    const sl = b.heels ? 4 : 5;
    limb(g, L.f[0] - fd[0], L.f[1] - fd[1], L.f[0] + fd[0] * sl, L.f[1] + fd[1] * sl, 3.4, shade(b.shoes, dk));
    if (ch.id === 'kuri') limb(g, L.f[0], L.f[1], L.f[0] - Math.sin(L.a2 * D2R) * 4, L.f[1] - Math.cos(L.a2 * D2R) * 4, 4, shade(b.shoes, dk));
  };
  const drawArm = (A, back) => {
    const dk = back ? 0.75 : 1;
    limb(g, A.s[0], A.s[1], A.e[0], A.e[1], 4.4 * sc, shade(b.sleeve, dk));
    limb(g, A.e[0], A.e[1], A.hnd[0], A.hnd[1], 4 * sc, shade(b.sleeve, dk));
    g.fillStyle = shade(b.hand, dk);
    g.fillRect(Math.round(A.hnd[0] - 2), Math.round(A.hnd[1] - 2), 4, 4);
  };

  const LF = legPts(pose.lF, 1.5), LB = legPts(pose.lB, -1.5);
  const AF = armPts(pose.aF, 2), AB = armPts(pose.aB, -2);

  drawArm(AB, true);
  drawLeg(LB, true);
  drawLeg(LF, false);

  // 下半身：裙子／褲頭
  const waist = [hip[0] + up[0] * 3, hip[1] + up[1] * 3];
  if (b.bottom === 'skirt' || b.bottom === 'pencil') {
    const len = b.skirtLen * sc, fl = b.skirtFlare;
    const mid = [(LF.k[0] + LB.k[0]) / 2, (LF.k[1] + LB.k[1]) / 2];
    // 裙擺方向跟著兩腿平均
    let vx = mid[0] - hip[0], vy = mid[1] - hip[1];
    const vl = Math.hypot(vx, vy) || 1; vx /= vl; vy /= vl;
    const end = [hip[0] + vx * len, hip[1] + vy * len];
    const px = -vy, py = vx;
    const spread = Math.min(8, Math.abs(LF.k[0] - LB.k[0]) * 0.5);
    const hw = 5 * sc, ew = (5 + fl * 0.6) * sc + spread;
    poly(g, [[waist[0] - perp[0] * hw, waist[1] - perp[1] * hw], [waist[0] + perp[0] * hw, waist[1] + perp[1] * hw],
      [end[0] + px * ew, end[1] + py * ew], [end[0] - px * ew, end[1] - py * ew]], b.skirt);
  } else {
    poly(g, [[waist[0] - perp[0] * 5, waist[1] - perp[1] * 5], [waist[0] + perp[0] * 5, waist[1] + perp[1] * 5],
      [LF.h[0] + 3, LF.h[1] + 4], [LB.h[0] - 3, LB.h[1] + 4]], b.pants);
  }
  // 軀幹
  const hw = 5 * sc, sw = 6 * sc;
  const torso = [[hip[0] - perp[0] * hw, hip[1] - perp[1] * hw], [hip[0] + perp[0] * hw, hip[1] + perp[1] * hw],
    [sh[0] + perp[0] * sw, sh[1] + perp[1] * sw], [sh[0] - perp[0] * sw, sh[1] - perp[1] * sw]];
  poly(g, torso, b.top);
  // 後側陰影
  poly(g, [torso[0], [hip[0] - perp[0] * (hw - 2), hip[1] - perp[1] * (hw - 2)],
    [sh[0] - perp[0] * (sw - 2), sh[1] - perp[1] * (sw - 2)], torso[3]], b.topS);
  // 前襟：襯衫／領子
  const frontAt = (t, inset) => {
    const p = [lerp(hip[0], sh[0], t), lerp(hip[1], sh[1], t)], w = lerp(hw, sw, t) - inset;
    return [p[0] + perp[0] * w, p[1] + perp[1] * w];
  };
  if (b.shirt) poly(g, [frontAt(0.45, 0), frontAt(1, 0), frontAt(1, 4)], b.shirt);
  if (b.trim) {
    limb(g, ...frontAt(0.05, 1), ...frontAt(1, 1), 1.4, b.trim);
    poly(g, [frontAt(0.7, 0), frontAt(1, 0), frontAt(1, 4.5)], b.collar);
  }
  if (b.knit) {
    g.fillStyle = b.topS;
    for (let t = 0.2; t < 0.95; t += 0.22) { const p = frontAt(t, 2.5), q = frontAt(t, 7); g.fillRect(Math.round(p[0]), Math.round(p[1]), 1, 1); g.fillRect(Math.round(q[0]), Math.round(q[1]), 1, 1); }
  }
  // 頭
  const neck = [sh[0] + up[0] * 1, sh[1] + up[1] * 1];
  drawHead(g, ch, neck[0] + (pose.hx || 0), neck[1] + (pose.hy || 0));
  if (b.turtle) { g.fillStyle = b.top; g.fillRect(Math.round(neck[0]) - 2, Math.round(neck[1]) - 2, 5, 3); }
  if (b.bow) {
    const p = frontAt(0.92, 1.5);
    g.fillStyle = b.bow; g.fillRect(Math.round(p[0]) - 1, Math.round(p[1]), 3, 2);
    g.fillStyle = '#c9d2e6'; g.fillRect(Math.round(p[0]), Math.round(p[1]) + 2, 1, 2);
  }
  drawArm(AF, false);

  binarize(g, SPR_W, SPR_H);
  // 花裙點點（二值化後加，才不會糊）
  if (b.dots) {
    const id = g.getImageData(0, 0, SPR_W, SPR_H), d = id.data, [sr, sg, sb] = hex2rgb(b.skirt);
    let n = 0;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] && Math.abs(d[i] - sr) < 4 && Math.abs(d[i + 1] - sg) < 4 && Math.abs(d[i + 2] - sb) < 4) {
        const px = (i / 4) % SPR_W, py = Math.floor(i / 4 / SPR_W);
        if ((px * 7 + py * 13) % 9 === 0 || (px * 5 + py * 3) % 11 === 0) {
          const [r, gg, bb] = hex2rgb(b.dots[n++ % b.dots.length]);
          d[i] = r; d[i + 1] = gg; d[i + 2] = bb;
        }
      }
    }
    g.putImageData(id, 0, 0);
  }
  outline(g, SPR_W, SPR_H, '#0b0608');
  // 手的位置（給特效用）
  return { c, hand: [AF.hnd[0] - OX, AF.hnd[1] - OY], head: [neck[0] - OX, neck[1] - 8 - OY], foot: [LF.f[0] - OX, LF.f[1] - OY] };
}

// ---------- 圖片動畫格（GPT 畫的動作表切出來的，tools/slice.py 產生 SPRITE_DATA） ----------
// 動作名稱對照：沒有獨立畫的動作借用相近的格
const FRAME_ALIAS = { run0: 'walk0', run1: 'walk1', run2: 'walk2', run3: 'walk3', fall: 'jump', ckick0: 'crouch', jpunch: 'jkick', win1: 'win0', yuck: 'hurt', dash: 'rush0', stand: 'idle0', rushK: 'rush0' };
const FRAMES = {};
const SPRITES_READY = Promise.all(Object.entries(window.SPRITE_DATA || {}).map(([cid, d]) => new Promise(res => {
  const im = new Image();
  im.onload = () => {
    FRAMES[cid] = {};
    for (const [n, [fx, fy, fw, fh, ax]] of Object.entries(d.frames)) {
      const [c, g] = mkCanvas(fw, fh);
      g.drawImage(im, fx, fy, fw, fh, 0, 0, fw, fh);
      FRAMES[cid][n] = { c, ox: ax, oy: fh };
    }
    res();
  };
  im.onerror = () => res();
  im.src = d.img;
})));

function getSprite(ch, name) {
  const fr = FRAMES[ch.id];
  if (fr) { const f = fr[name] || fr[FRAME_ALIAS[name]] || fr.idle0; if (f) return f; }
  // 圖還沒載入時退回程式畫的小人
  const key = ch.id + ':' + name;
  let s = spriteCache.get(key);
  if (!s) { s = buildSprite(ch.fb ? CHARS.find(c => c.id === ch.fb) : ch, POSES[name] || POSES.idle0); s.ox = OX; s.oy = OY; spriteCache.set(key, s); }
  return s;
}
function getSil(ch, name, col) {
  const s = getSprite(ch, name);
  if (!s.sil) s.sil = {};
  if (!s.sil[col]) s.sil[col] = silhouette(s.c, col);
  return s.sil[col];
}
// 畫角色：x,y = 腳底中心；opt.scale 放大（選角、結局用）
function drawChar(ch, name, x, y, face, opt = {}) {
  const s = getSprite(ch, name);
  const img = opt.sil ? getSil(ch, name, opt.sil) : s.c;
  const k = opt.scale || 1;
  ctx.save();
  if (opt.alpha != null) ctx.globalAlpha = opt.alpha;
  ctx.translate(Math.round(x), Math.round(y));
  if (face < 0) ctx.scale(-1, 1);
  ctx.drawImage(img, Math.round(-s.ox * k), Math.round(-s.oy * k), img.width * k, img.height * k);
  ctx.restore();
}

// ---------- 其他像素圖 ----------
function mapCanvas(rows, pal, outlineCol) {
  const w = rows[0].length, h = rows.length, pad = outlineCol ? 1 : 0;
  const [c, g] = mkCanvas(w + pad * 2, h + pad * 2);
  rows.forEach((row, y) => [...row].forEach((k, x) => {
    if (k !== '.') { g.fillStyle = pal[k]; g.fillRect(x + pad, y + pad, 1, 1); }
  }));
  if (outlineCol) outline(g, c.width, c.height, outlineCol);
  return c;
}
const PIGEON_PAL = { G: '#8f95a6', g: '#6b7184', N: '#4f8a7a', P: '#7a5a9a', W: '#d8dbe4', O: '#e89a3a', E: '#111', R: '#c0404a' };
const PIGEON = [
  mapCanvas([
    '....gGGg....',
    '..gGGGGGGg..',
    '.gGGWWGGGNPE',
    'gGGGGGGGGNNO',
    '.gGGGGGGGGg.',
    '...gGGGGg...',
    '....R..R....',
  ], PIGEON_PAL, '#1a1a22'),
  mapCanvas([
    'gG..........',
    '.gGGg.......',
    '..gGGGGGgNPE',
    '.gGGGGGGGNNO',
    'gGGGGGGGGGg.',
    '...gGGGGg...',
    '....R..R....',
  ], PIGEON_PAL, '#1a1a22'),
];
const BLOB_PAL = { M: '#7a5230', m: '#5a3a20', L: '#9a6c40', W: '#fff', E: '#111' };
const BLOB = [
  mapCanvas([
    '....LLLL....',
    '..LLMMMMLL..',
    '.LMMMMMMMML.',
    '.MMWEMMWEMM.',
    'MMMWEMMWEMMm',
    'MMMMMMMMMMMm',
    'mMMMmmmmMMmm',
    '.mmMMMMMMmm.',
  ], BLOB_PAL, '#1e120a'),
  mapCanvas([
    '............',
    '...LLLLLL...',
    '.LLMMMMMMLL.',
    'LMMWEMMWEMML',
    'MMMWEMMWEMMm',
    'MMMMmmmmMMMm',
    'mmMMMMMMMMmm',
    '.mmmmmmmmmm.',
  ], BLOB_PAL, '#1e120a'),
];

// 通用瓶身（不是官方包裝，只是像素示意）
function bottleCanvas(cap, label) {
  const [c, g] = mkCanvas(16, 30);
  g.fillStyle = cap; g.fillRect(5, 0, 6, 5);
  g.fillStyle = '#222'; g.fillRect(6, 5, 4, 2);
  g.fillStyle = '#1a1a1e'; g.fillRect(3, 7, 10, 22); g.fillRect(2, 9, 12, 20);
  g.fillStyle = label; g.fillRect(3, 13, 10, 10);
  g.fillStyle = '#fff'; g.fillRect(4, 16, 8, 1); g.fillRect(4, 19, 6, 1);
  g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(3, 9, 1, 18);
  outline(g, 16, 30, '#000');
  return c;
}
