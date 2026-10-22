// 遊戲主程式：標題 → 選角 → 三關打亮車 → 結算 → 結局
'use strict';

// ---------- 招式表 ----------
// box = [前方距離, 相對腳底高度, 寬, 高]（面向右）
const NORMALS = {
  jab: { frames: [['punch0', 3], ['punch1', 5], ['punch0', 6]], active: [3, 7], box: [2, -58, 28, 18], pow: 0.9, force: 0.8 },
  kick: { frames: [['kick0', 5], ['kick1', 7], ['kick0', 8]], active: [5, 11], box: [4, -48, 34, 22], pow: 1.0, force: 1.4 },
  cjab: { frames: [['crouch', 2], ['cpunch', 5], ['crouch', 5]], active: [2, 6], box: [0, -36, 32, 32], pow: 1.0, force: 0.8, crouch: true },
  csweep: { frames: [['ckick0', 4], ['ckick1', 8], ['ckick0', 8]], active: [4, 11], box: [0, -26, 44, 26], pow: 1.2, force: 1.2, crouch: true },
  jpunch: { frames: [['jpunch', 16]], active: [2, 14], box: [0, -44, 28, 26], pow: 0.9, force: 1, air: true },
  jkick: { frames: [['jkick', 18]], active: [2, 16], box: [2, -36, 34, 24], pow: 1.0, force: 1.4, air: true },
};

const PROJ = {
  kuri: { vx: 3.2, vy: 0, g: 0, r: 16, pow: 1.5, glass: 2, life: 120, pierce: 1 },
  rin: { vx: 4.6, vy: 0, g: 0, r: 12, pow: 0.7, glass: 1.6, life: 80, pierce: 4 },
  leo: { vx: 2.0, vy: 0, g: 0, r: 22, pow: 1.9, glass: 1.2, life: 160, pierce: 1 },
  momo: { vx: 2.5, vy: -3.4, g: 0.14, r: 16, pow: 1.5, glass: 1.4, life: 160, pierce: 1 },
  sailor: { vx: 5, vy: 0, g: 0, r: 12, pow: 0.55, glass: 1.4, life: 70, pierce: 5, burst: 3 },
  hong: { vx: 1.8, vy: 0, g: 0, r: 22, pow: 0.75, glass: 1.6, life: 50, pierce: 4 },
  fen: { vx: 3.6, vy: 0, g: 0, r: 16, pow: 1.3, glass: 1.2, life: 80, pierce: 2 },
};
const QUOTES = {
  kuri: ['水斑什麼的，', '用橡皮擦擦掉就好。'],
  rin: ['感謝您的來電，', '您的愛車已經亮晶晶了。'],
  leo: ['……', '這版定稿了。'],
  momo: ['這麼亮的車，', '下一季廣告就用它。'],
  boss: ['鍍膜這件事，', '交給紅分子就對了。'],
  sailor: ['水手服很涼，', '車也洗得很亮。'],
  hong: ['噴一下就亮，', '這就是紅分子。'],
  fen: ['吸水巾一擦，', '連鏡子都會嫉妒。'],
};

// ---------- 全域狀態 ----------
// 排行榜（本機）：預設成績是示範用的假名字
const BOARD_DEFAULT = [['HJA', 60000, 0], ['RED', 50000, 1], ['WAX', 40000, 2], ['CAR', 30000, 3], ['GLO', 20000, 0]];
function loadBoard() {
  const b = Store.get('board', null);
  if (Array.isArray(b) && b.length) return b;
  return BOARD_DEFAULT.map(x => x.slice());
}
let BOARD = loadBoard();
// ---------- 版本與更新紀錄（改版時一起更新，標題畫面與桌墊都會顯示） ----------
const VERSION = 'v2.5';
const CHANGELOG = [
  ['v2.5', '手機主畫面圖示可以挑：四款（亮晶晶、巨輪、小葵、飛天車），按桌墊上方的「圖示」選'],
  ['v2.4.1', '手機與電腦都不會被誤觸放大（連點兩下、兩指縮放、Ctrl＋滾輪）', '文字與圖片不能被選取、拖曳，長按不會跳出選單'],
  ['v2.4', '新最終關「飛天電動車」：洗一洗就會起飛，要跳起來打，偶爾降落充電', '走路換成新的連續動作；可以跑步（連按兩下方向，或按住約半秒）', '跑步中按拳直接衝刺連打', '車身下半部更好洗：蹲拳、掃腿範圍加大，泡沫水往下流也會洗到下面', '加上版本號與更新紀錄'],
  ['v2.3', '開場與每關結算改用紅分子官網的官方商品照'],
  ['v2.2.1', '修正 VIVI 粉紅西裝上的暗色雜點'],
  ['v2.2', '開場動畫：品牌、商品、8 位角色、擦亮車子', '重寫配樂：開場、選角、三首戰鬥曲、結局', '選角角色代表音、結局煙火'],
  ['v2.1', '新增紅分子隊：巨輪、巨輪水手、小紅、小芬（排在前面）', '原四人改名小葵、小米、阿傑、VIVI', '巨輪蓄力指令招式；桌墊出招表與暫停選單出招表'],
  ['v2.0', '角色改成逐格動作圖，背景與車子改成繪製像素圖', '髒污與車身明暗混合'],
  ['v1.1', '像素頭像、車燈與輪框反應、最終關下雨與鍍膜', '暫停選單、DEMO PLAY、前五名排行榜'],
  ['v1.0', '首版：三關打亮車、四位角色、原創招式與配樂'],
];

const G = {
  scene: 'boot', t: 0, st: 0, chIdx: 0, stageIdx: 0, total: 0, hi: Math.max(Store.get('hi', 0), BOARD[0][1]),
  hitstop: 0, shake: 0, paused: false, rankHi: -1, demo: false, pi: 0,
};
let P = null, car = null, bg = null, stage = null;
let projs = [], blobs = [], birds = [], poops = [], parts = [], pops = [], decals = [];
let R = null;   // 本關紀錄

// 開場商品：圖是 GPT 畫的示意瓶（tools/stage_art.py → PRODUCT_ART），名稱取自紅分子官網
const PROD = [['奈米陶瓷', '封體鍍膜'], ['超效除汙', '高泡洗車精'], ['炫鑽玻璃', '鍍膜'], ['全效環保', '去汙劑']];
// 官方商品照（紅分子官網，tools/products.py 裁切）：big 高 100 給開場，small 高 46 給結算
const PHOTO = { big: {}, small: {} };
for (const sz of ['big', 'small']) for (const [k, u] of Object.entries((window.PRODUCT_PHOTO || {})[sz] || {})) { const im = new Image(); im.src = u; PHOTO[sz][k] = im; }
const photoOf = (name, sz) => PHOTO[sz][name.replace('濃縮', '')];
const productImg = (window.PRODUCT_ART || []).map(u => { const im = new Image(); im.src = u; return im; });   // 沒有官方照時的備用圖
const portraitImg = {}, portraitBig = {};
for (const k of Object.keys(PORTRAITS_BIG)) { const im = new Image(); im.src = PORTRAITS_BIG[k]; portraitBig[k] = im; }
const portraitSmall = {}, portraitMid = {};
for (const k of Object.keys(PORTRAITS)) {
  const im = new Image(); im.src = PORTRAITS[k]; portraitImg[k] = im;
  im.onload = () => {
    const [c, g] = mkCanvas(26, 26); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    g.drawImage(im, 0, 0, 26, 26); portraitSmall[k] = c;
    const [c2, g2] = mkCanvas(40, 40); g2.imageSmoothingEnabled = true; g2.imageSmoothingQuality = 'high';
    g2.drawImage(im, 0, 0, 40, 40); portraitMid[k] = c2;
  };
}

function go(scene) { G.scene = scene; G.st = 0; SCENES[scene].enter && SCENES[scene].enter(); }

// ---------- 粒子與文字 ----------
function part(o) { parts.push(Object.assign({ vx: 0, vy: 0, g: 0, life: 30, t: 0, type: 'px', col: '#fff', s: 1 }, o)); }
function pop(x, y, str, col = '#fff', s = 1) { pops.push({ x, y, str, col, s, t: 0 }); }
function burst(x, y, col, n = 8, spd = 2) {
  for (let i = 0; i < n; i++) { const a = rnd(0, Math.PI * 2), v = rnd(0.5, spd); part({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 0.5, g: 0.08, life: rndi(14, 26), col }); }
}
function bubbles(x, y, n = 5) {
  for (let i = 0; i < n; i++) part({ x: x + rnd(-6, 6), y: y + rnd(-6, 6), vx: rnd(-0.6, 0.6), vy: rnd(-0.9, -0.2), life: rndi(20, 45), type: 'bubble', s: rndi(1, 2), col: '#ffffff' });
}
function spark(x, y, big) { part({ x, y, life: big ? 10 : 7, type: 'spark', s: big ? 10 : 7, col: '#fff7a0' }); }
function twinkle(x, y, col = '#ffffff') { part({ x, y, life: 22, type: 'star', col }); }

// ---------- 玩家 ----------
function newPlayer(ch) {
  return {
    ch, x: 52, y: GY, vx: 0, vy: 0, face: 1, ground: true, st: 'idle', t: 0, mv: null, mt: 0, hitIds: null,
    inv: 0, meter: 0, combo: 0, comboT: 0, lastDir: 1, spinFace: 1, dashing: 0,
  };
}
const hurtBox = p => {
  const h = p.st === 'crouch' || (p.mv && p.mv.crouch) ? 34 : 58;
  return { x: p.x - 7, y: p.y - h, w: 14, h };
};
function floorAt() { return GY; }   // 角色走在車子前方的地面，不會被車擋
function moveX(p, dx) {
  if (!dx) return true;
  const nx = clamp(p.x + dx, 8, W - 8);
  const okMove = nx !== p.x;
  p.x = nx; return okMove;
}
function startMove(p, name) {
  p.st = 'attack'; p.mv = NORMALS[name]; p.mvName = name; p.mt = 0; p.hit = false;
  Audio2.sfx('whiff');
}
function boxWorld(p, b) {
  const [dx, dy, w, h] = b;
  return { x: p.face > 0 ? p.x + dx : p.x - dx - w, y: p.y + dy, w, h };
}

// 一次攻擊判定：打車、打怪、打鴿子
function strike(p, rect, pow, force, tag) {
  const ch = p.ch;
  let any = false;
  // 怪
  for (const b of blobs) if (!b.dead && rectHit(rect, { x: b.x - 6, y: b.y - 9, w: 12, h: 9 })) { killBlob(b); any = true; }
  for (const bd of birds) if (bd.st === 'fly' && rectHit(rect, { x: bd.x - 7, y: bd.y - 4, w: 14, h: 9 })) { shooBird(bd); any = true; }
  // 車
  const res = car.cleanRect(rect.x, rect.y, rect.w, rect.h, pow * ch.power);
  const by = rect.y + rect.h, cb = car.y + car.h;
  if (res.touched && by < cb) {
    const drip = car.cleanRect(rect.x + 3, by, rect.w - 6, cb - by, pow * ch.power * 0.35);
    res.removed += drip.removed;
    if (drip.removed > 1) for (let i = 0; i < 3; i++) part({ x: rect.x + rnd(4, rect.w - 4), y: by + rnd(0, 6), vy: rnd(0.6, 1.4), life: 22, col: '#bfe8ff' });
  }
  if (res.touched) {
    any = true;
    const cx = clamp(p.face > 0 ? rect.x + rect.w - 6 : rect.x + 6, car.left + 2, car.right - 2);
    const cy = clamp(rect.y + rect.h / 2, car.y + 4, GY - 4);
    car.hit(force);
    spark(cx, cy, force > 1.2);
    res.bits.forEach(([x, y, c]) => part({ x, y, vx: p.face * rnd(0.5, 2.5), vy: rnd(-2.5, -0.5), g: 0.15, life: rndi(20, 40), col: c, s: rndi(1, 2) }));
    if (res.removed > 0.5) bubbles(cx, cy, 3 + Math.min(6, res.removed / 6));
    car.addFoam(cx, cy, force > 1.2 ? 4 : 2);
    buzz(force > 1.2 ? 18 : 10);
    gain(p, res.removed, tag);
    Audio2.sfx(force > 1.2 ? 'hitBig' : 'hit');
    if (res.removed > 2) Audio2.sfx('scrub');
    G.hitstop = ['torpedo', 'rise', 'rush', 'knee', 'stomp'].includes(p.st) ? 1 : force > 1.5 ? 6 : 4;   // 多段技不要卡頓
  }
  return any;
}
function gain(p, removed, tag) {
  p.combo++; p.comboT = 70;
  R.maxCombo = Math.max(R.maxCombo, p.combo);
  const mul = 1 + Math.min(p.combo, 20) * 0.08;
  const pts = Math.round(removed * 2 * mul) + 10;
  R.cleanPts += pts;
  if (P.st !== 'super') p.meter = Math.min(100, p.meter + 1.5 + removed * 0.012);
  if (removed > 60) pop(P.x + P.face * 20, P.y - 66, '+' + pts, '#ffe060');
}

function updatePlayer(p) {
  const ch = p.ch, I = Input, held = I.held, pr = I.pressed;
  p.t++;
  if (p.inv > 0) p.inv--;
  if (p.comboT > 0 && --p.comboT === 0) p.combo = 0;
  const free = p.st === 'idle' || p.st === 'walk' || p.st === 'crouch';
  if (p.ground && free) { if (held.left) p.face = -1; else if (held.right) p.face = 1; }

  // 蓄力：按住一個方向超過 36 格，放開後 10 格內仍有效
  for (const d of ['left', 'right', 'down']) {
    const k = 'c_' + d;
    if (held[d]) p[k] = (p[k] || 0) + 1; else { p[k + 'ok'] = p[k] >= 36 ? 10 : Math.max(0, (p[k + 'ok'] || 0) - 1); p[k] = 0; }
  }
  const charged = d => p['c_' + d] >= 36 || p['c_' + d + 'ok'] > 0;
  const sp = ch.sp || {};
  let chargeDir = 0;
  if (held.right && charged('left')) chargeDir = 1; else if (held.left && charged('right')) chargeDir = -1;
  const wantS1 = pr.s1 || (pr.p && (sp.s1 === 'torpedo' ? chargeDir !== 0 : I.motion(['down', 'down'], p.face)));
  const wantS2 = pr.s2 || (pr.k && (sp.s2 === 'stomp' ? charged('down') && (held.up || I.motion(['up'], p.face, 8)) : I.motion(['down', 'down'], p.face)));
  const wantRush = pr.p && !wantS1 && (I.motion(['fwd', 'fwd'], p.face, 18) || (p.running && !held.down));
  const canAct = free || (p.st === 'jump' && !p.mv);

  if (canAct && pr.sup && p.meter >= 100) { startSuper(p); return; }
  if (free && wantS1 && !projs.some(q => q.own)) {
    if (chargeDir) p.face = chargeDir;
    I.hist.length = 0; p.c_left = p.c_right = p.c_leftok = p.c_rightok = 0;
    if (sp.s1 === 'torpedo') { p.st = 'torpedo'; p.t = 0; p.inv = Math.max(p.inv, 70); Audio2.sfx('superStart'); }
    else { p.st = 'throw'; p.t = 0; }
    return;
  }
  if (canAct && wantS2) { I.hist.length = 0; p.c_down = p.c_downok = 0; if (sp.s2 === 'stomp') startStomp(p); else startRise(p); return; }
  if (free && wantRush) { p.st = sp.rush === 'knee' ? 'knee' : 'rush'; p.t = 0; I.hist.length = 0; Audio2.sfx('rush'); if (p.st === 'knee') kneeHop(p, 0); return; }

  switch (p.st) {
    case 'idle': case 'walk': case 'crouch': {
      if (pr.up) {
        const dir = held.left ? -1 : held.right ? 1 : 0;
        p.vx = dir * 1.7 * (0.85 + ch.speed * 0.15) * (p.running ? 1.5 : 1); p.vy = -5.4 * ch.jump; p.ground = false; p.st = 'jump'; p.mv = null; p.running = false;
        break;
      }
      if (held.down) {
        p.st = 'crouch';
        if (pr.p) startMove(p, 'cjab'); else if (pr.k) startMove(p, 'csweep');
        break;
      }
      if (pr.p) { startMove(p, 'jab'); break; }
      if (pr.k) { startMove(p, 'kick'); break; }
      const dir = held.left ? -1 : held.right ? 1 : 0;
      if (dir) {
        if (dir !== p.walkDir) { p.walkDir = dir; p.walkT = 0; p.running = false; }
        p.walkT++;
        const dname = dir > 0 ? 'right' : 'left';
        if (!p.running && (p.walkT >= 28 || (pr[dname] && I.motion([dname, dname], p.face, 14)))) { p.running = true; Audio2.sfx('whiff'); }
        moveX(p, dir * ch.speed * (p.running ? 1.9 : 1));
        if (p.running && p.t % 8 === 0) part({ x: p.x - dir * 6, y: p.y - 1, vx: -dir * 0.6, vy: -0.4, life: 12, col: '#9a9aa8' });
        p.st = 'walk';
      } else { p.st = 'idle'; p.walkT = 0; p.running = false; p.walkDir = 0; }
      break;
    }
    case 'jump': {
      if (!p.mv && (pr.p || pr.k)) { p.mv = NORMALS[pr.p ? 'jpunch' : 'jkick']; p.mvName = pr.p ? 'jpunch' : 'jkick'; p.mt = 0; p.hit = false; Audio2.sfx('whiff'); }
      if (p.mv) {
        p.mt++;
        const [a0, a1] = p.mv.active;
        if (!p.hit && p.mt >= a0 && p.mt <= a1) { if (strike(p, boxWorld(p, p.mv.box), p.mv.pow, p.mv.force)) p.hit = true; }
        if (p.mt > a1 + 2) p.mv = null;
      }
      break;
    }
    case 'attack': {
      p.mt++;
      const mv = p.mv, [a0, a1] = mv.active;
      if (!p.hit && p.mt >= a0 && p.mt <= a1) { if (strike(p, boxWorld(p, mv.box), mv.pow, mv.force)) p.hit = true; }
      const total = mv.frames.reduce((s, f) => s + f[1], 0);
      // 打中後可接下一招（連打）
      if (p.hit && p.mt > a1 && (pr.p || pr.k)) {
        const c = held.down ? (pr.p ? 'cjab' : 'csweep') : (pr.p ? 'jab' : 'kick');
        startMove(p, c); break;
      }
      if (p.mt >= total) { p.st = mv.crouch && held.down ? 'crouch' : 'idle'; p.mv = null; }
      break;
    }
    case 'throw': {
      const bu = (PROJ[ch.id] || {}).burst || 1;
      if (p.t === 12 || (bu > 1 && (p.t === 17 || p.t === 22))) spawnProj(p);
      if (p.t >= 28) p.st = 'idle';
      break;
    }
    case 'rush': {
      const spd = ch.id === 'leo' ? 0.8 : 1.2;
      moveX(p, p.face * spd);
      if (p.t % 6 === 3) {
        const kick = !!ch.rushKick;
        strike(p, boxWorld(p, kick ? [4, -42, 30, 18] : [4, -54, 26, 26]), ch.id === 'leo' ? 0.75 : 0.5, 0.9);
        Audio2.sfx('rush');
      }
      if (p.t >= 38) p.st = 'idle';
      break;
    }
    case 'rise': {
      if (p.t % 3 === 0) p.spinFace *= -1;
      if (p.t < 26 && p.t % 5 === 1) strike(p, { x: p.x - 16, y: p.y - 64, w: 32, h: 66 }, 0.55, 0.7);
      if (p.t % 2 === 0) part({ x: p.x - p.spinFace * 10, y: p.y - 34 + rnd(-6, 6), vx: -p.spinFace * 0.6, vy: 0.4, life: 18, col: ch.fx.main, s: 2 });
      break;
    }
    case 'torpedo': {       // 巨輪：全身化成紅色魚雷橫飛
      if (p.t === 10) { p.ground = false; p.vy = 0; p.y = GY - 24; Audio2.sfx('rise'); }
      if (p.t > 10) {
        moveX(p, p.face * 4.2);
        if (p.t % 4 === 0) strike(p, { x: p.x - 24, y: p.y - 34, w: 48, h: 32 }, 0.5, 0.9);
        for (let i = 0; i < 2; i++) part({ x: p.x - p.face * rnd(10, 26), y: p.y - 16 + rnd(-10, 10), vx: -p.face * rnd(0.5, 2), life: 16, col: pick(['#ff3a3a', '#ff8a3a', '#ffd0d0']), s: 2 });
        if (p.t > 56 || p.x <= 12 || p.x >= W - 12) { p.st = 'jump'; p.vy = -1.5; p.vx = 0; p.mv = null; p.inv = 10; }
      }
      return;               // 自己控制位置，不走一般物理
    }
    case 'stomp': {         // 巨輪：跳高後垂直踩下
      if (!p.dive && p.vy >= -0.5) { p.dive = true; p.vy = 6.5; p.vx = 0; Audio2.sfx('whiff'); }
      if (p.dive && p.t % 3 === 0) strike(p, { x: p.x - 14, y: p.y - 28, w: 28, h: 32 }, 0.8, 1.2);
      if (p.dive) part({ x: p.x + rnd(-6, 6), y: p.y - 40, vy: -1, life: 10, col: '#ff6a6a' });
      break;
    }
    case 'knee': {          // 巨輪：連續兩次膝擊跳
      if (p.t % 5 === 2) strike(p, boxWorld(p, [0, -56, 30, 34]), 0.55, 1);
      break;
    }
    case 'hurt': case 'yuck': {
      if (p.t >= (p.st === 'hurt' ? 26 : 34)) p.st = 'idle';
      break;
    }
  }

  // 物理
  const air = !p.ground;
  if (air) {
    if (!moveX(p, p.vx)) p.vx = 0;
    p.y += p.vy; p.vy += p.st === 'rise' && p.t < 20 ? 0.18 : 0.3;
    const fy = floorAt(p.x);
    if (p.vy >= 0 && p.y >= fy) {
      p.y = fy; p.ground = true; p.vy = 0; p.vx = 0;
      if (p.st === 'jump' || p.st === 'rise') { p.st = 'idle'; p.mv = null; }
      if (p.st === 'stomp') {
        p.st = 'idle'; p.dive = false;
        strike(p, { x: p.x - 36, y: p.y - 26, w: 72, h: 26 }, 0.7, 2.2);
        G.shake = 10; Audio2.sfx('hitBig'); buzz(50);
        for (let i = 0; i < 16; i++) part({ x: p.x + rnd(-30, 30), y: p.y - 1, vx: rnd(-2.5, 2.5), vy: rnd(-2.5, -0.5), g: 0.12, life: 24, col: pick(['#c8c8d0', '#9a9aa8', '#ff6a6a']) });
      }
      if (p.st === 'knee') { if (++p.hops < 2) kneeHop(p, p.hops); else p.st = 'idle'; }
      if (p.st === 'hurt') p.vx = 0;
      part({ x: p.x - 5, y: p.y, vx: -0.5, vy: -0.3, life: 10, col: '#9a9aa8' }); part({ x: p.x + 5, y: p.y, vx: 0.5, vy: -0.3, life: 10, col: '#9a9aa8' });
    }
  } else {
    if (p.st === 'hurt' && p.t < 10) moveX(p, p.vx);
    const fy = floorAt(p.x);
    if (fy > p.y + 1) { p.ground = false; p.vy = 0; if (!['hurt', 'rise', 'stomp', 'knee'].includes(p.st)) { p.st = 'jump'; p.mv = null; p.vx = 0; } }
    else if (fy < p.y) p.y = fy;
  }
}
function startStomp(p) {
  p.st = 'stomp'; p.t = 0; p.vy = -7.6 * p.ch.jump; p.vx = p.face * 1.8; p.ground = false; p.dive = false; p.inv = Math.max(p.inv, 50); p.mv = null;
  Audio2.sfx('rise');
}
function kneeHop(p, n) {
  p.hops = n; p.vy = -3.8; p.vx = p.face * 2.3; p.ground = false; p.inv = Math.max(p.inv, 20);
  if (n) Audio2.sfx('rush');
}
function startRise(p) {
  p.st = 'rise'; p.t = 0; p.vy = -6.4 * p.ch.jump; p.vx = p.face * 0.7; p.ground = false; p.inv = Math.max(p.inv, 26); p.mv = null;
  Audio2.sfx('rise');
}
function spawnProj(p) {
  const d = PROJ[p.ch.id];
  const y = p.y - 44;
  projs.push({ own: true, id: p.ch.id, ch: p.ch, x: p.x + p.face * 16, y, vx: d.vx * p.face, vy: d.vy, g: d.g, r: d.r, pow: d.pow, glass: d.glass,
    life: d.life, pierce: d.pierce, cd: 0, t: 0, face: p.face });
  Audio2.sfx('proj');
}
function hurtPlayer(p, from, kind) {
  if (p.inv > 0 || p.st === 'super') return;
  p.combo = 0; p.comboT = 0; p.mv = null;
  if (kind === 'yuck') { p.st = 'yuck'; p.t = 0; p.inv = 50; pop(p.x, p.y - 74, '噁！', '#e8ffd0'); Audio2.sfx('hurt'); return; }
  p.st = 'hurt'; p.t = 0; p.inv = 80;
  p.vx = (p.x < from ? -1 : 1) * 1.8;
  if (!p.ground) p.vy = -1.5;
  pop(p.x, p.y - 72, '被弄髒了！', '#ffb070');
  Audio2.sfx('hurt'); G.shake = 6; buzz(60);
  R.hurt++;
}

// ---------- 超必殺 ----------
let SUP = null;
function startSuper(p) {
  p.meter = 0; p.st = 'super'; p.t = 0; p.inv = 999; p.mv = null;
  SUP = { t: 0, ch: p.ch, waveX: p.face > 0 ? car.left - 10 : car.right + 10, dir: p.face };
  if (!p.ground) { p.y = floorAt(p.x); p.ground = true; p.vy = 0; }
  Audio2.sfx('superStart'); buzz(90);
  R.supers++;
}
function updateSuper() {
  const s = SUP; s.t++;
  if (s.t < 56) return;                     // 特寫
  const k = s.t - 56;
  if (k < 52) {
    s.waveX += s.dir * (car.w + 30) / 52;
    const r = car.cleanRect(s.waveX - 6, car.y + car.h * 0.22, 12, car.h * 0.5, 0.45);   // 鍍膜帶：掃過車身中段
    car.markCoat(s.waveX - 6, car.y + car.h * 0.22, 12, car.h * 0.5);
    if (r.removed > 0) { gain(P, r.removed); P.combo = Math.max(P.combo, k); }
    if (k % 4 === 0) { Audio2.sfx('hit'); car.hit(0.6); G.shake = 3; }
    for (let i = 0; i < 3; i++) twinkle(s.waveX + rnd(-8, 8), car.y + rnd(0, car.h), pick([s.ch.fx.main, '#ffffff', '#ff4040']));
  } else if (k === 52) {
    const rm = car.cleanAll(0.03); gain(P, rm);
    Audio2.sfx('sparkle'); G.flash = 12;
    for (let i = 0; i < 30; i++) { const q = car.randomCleanPixel(); if (q) twinkle(q[0], q[1]); }
  } else if (k > 70) { SUP = null; P.st = 'idle'; P.inv = 30; P.meter = 0; }
}
function drawSuper() {
  const s = SUP;
  if (s.t < 56) {
    const k = s.t;
    ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(0, 0, W, H);
    const bandY = 46, bandH = 124;
    const open = Math.min(1, k / 8);
    px(0, bandY + bandH / 2 - (bandH / 2) * open, W, bandH * open, '#b0101a');
    px(0, bandY + bandH / 2 - (bandH / 2) * open, W, 2, '#ffd040');
    px(0, bandY + bandH / 2 + (bandH / 2) * open - 2, W, 2, '#ffd040');
    for (let i = 0; i < 14; i++) {
      const y = bandY + 4 + ((i * 37) % (bandH - 8)), x = W - ((k * 14 + i * 53) % (W + 60));
      px(x, y, 30 + (i % 3) * 10, 1, 'rgba(255,220,220,.6)');
    }
    if (open >= 1) {
      const ix = Math.min(20, -120 + k * 16);
      ctx.drawImage(portraitBig[s.ch.pIdx], ix, bandY + 12);
      const tx = Math.max(140, W + 40 - k * 22);
      text(s.ch.name + '　超必殺', tx, bandY + 30, { c: '#ffd040', o: '#300000' });
      text(SUPER_NAME, tx, bandY + 50, { s: 2, c: '#ffffff', o: '#300000', grad: ['#ffffff', '#ffd040'] });
      text('掃過的地方會鍍上一層膜', tx, bandY + 86, { c: '#ffd0d0', o: '#300000' });
    }
  } else if (s.t - 56 < 52) {
    // 光波
    const x = Math.round(s.waveX);
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(x - 10, car.y - 14, 20, car.h + 16);
    ctx.fillStyle = 'rgba(255,60,60,.55)'; ctx.fillRect(x - 4, car.y - 20, 8, car.h + 22);
    ctx.fillStyle = '#fff'; ctx.fillRect(x - 1, car.y - 24, 2, car.h + 26);
  }
}

// ---------- 飛行道具 ----------
function updateProjs() {
  for (const q of projs) {
    q.t++; q.x += q.vx; q.y += q.vy; q.vy += q.g; q.life--;
    if (q.cd > 0) q.cd--;
    if (q.t % 3 === 0) part({ x: q.x - q.vx * 2, y: q.y + rnd(-3, 3), vx: -q.vx * 0.2, life: 14, col: q.ch.fx.main, type: q.id === 'kuri' ? 'star' : 'px' });
    // 怪與鳥
    for (const b of blobs) if (!b.dead && Math.abs(b.x - q.x) < 10 && Math.abs(b.y - 4 - q.y) < 12) { killBlob(b); if (q.pierce <= 1) q.life = 0; }
    for (const bd of birds) if (bd.st === 'fly' && Math.abs(bd.x - q.x) < 11 && Math.abs(bd.y - q.y) < 10) { shooBird(bd); if (q.pierce <= 1) q.life = 0; }
    // 車
    if (q.cd === 0 && q.life > 0 && (car.hasPixel(q.x, q.y) || car.hasPixel(q.x + Math.sign(q.vx) * 4, q.y))) {
      const r = car.cleanCircle(q.x, q.y, q.r, q.pow * q.ch.power, q.glass);
      gain(P, r.removed);
      car.hit(q.id === 'leo' ? 2.2 : 1);
      Audio2.sfx('splash'); Audio2.sfx('hitBig');
      G.hitstop = 3; G.shake = q.id === 'leo' ? 6 : 3;
      burst(q.x, q.y, q.ch.fx.main, 14, 3); bubbles(q.x, q.y, 10);
      car.addFoam(q.x, q.y, 7); buzz(22);
      r.bits.forEach(([x, y, c]) => part({ x, y, vx: rnd(-2, 2), vy: rnd(-3, -1), g: 0.15, life: 30, col: c, s: 2 }));
      q.pierce--; q.cd = 6;
      if (q.pierce <= 0) q.life = 0;
    }
    if (q.y > GY) { q.life = 0; bubbles(q.x, GY - 2, 6); }
  }
  projs = projs.filter(q => q.life > 0 && q.x > -30 && q.x < W + 30);
}
const HEART = ['.HH.HH.', 'HHHHHHH', 'HHHHHHH', '.HHHHH.', '..HHH..', '...H...'];
function drawProj(q) {
  const t = q.t, x = Math.round(q.x), y = Math.round(q.y);
  if (q.id === 'kuri') {
    const s = 5 + (t % 6 < 3 ? 1 : 0);
    ctx.fillStyle = '#3ab0ff'; ctx.beginPath(); ctx.moveTo(x, y - s - 2); ctx.lineTo(x + s + 2, y); ctx.lineTo(x, y + s + 2); ctx.lineTo(x - s - 2, y); ctx.fill();
    ctx.fillStyle = '#8ef0ff'; ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x + s, y); ctx.lineTo(x, y + s); ctx.lineTo(x - s, y); ctx.fill();
    px(x - 1, y - 2, 2, 4, '#ffffff'); px(x - 2, y - 1, 4, 2, '#ffffff');
  } else if (q.id === 'rin') {
    for (let k = 0; k < 3; k++) {
      const r = 4 + k * 4 + (t % 4), col = k === 0 ? '#ffffff' : k === 1 ? '#bfe4ff' : '#5aa0ff';
      for (let a = -55; a <= 55; a += 12) {
        const rad = a * D2R;
        px(x - q.face * 8 + q.face * Math.cos(rad) * r, y + Math.sin(rad) * r, 2, 2, col);
      }
    }
  } else if (q.id === 'leo') {
    const r = 7 + Math.round(Math.sin(t * 0.4));
    disc(x, y, r + 1, '#0e3a14'); disc(x, y, r, '#2fb84a'); disc(x - 2, y - 2, r - 3, '#7dff6a'); px(x - 3, y - 4, 2, 2, '#e8ffd0');
  } else if (q.id === 'sailor') {        // 高壓水柱
    for (let k = 4; k >= 1; k--) disc(x - q.face * k * 5, y + Math.round(Math.sin(t * 0.6 + k)), 2, k > 2 ? '#bfe8ff' : '#9ad8ff');
    disc(x, y, 5, '#2a7cff'); disc(x, y, 4, '#6ac8ff'); px(x - 2, y - 2, 2, 2, '#ffffff');
  } else if (q.id === 'hong') {          // 鍍膜噴霧：越飛越大的霧
    const r = Math.min(16, 5 + t * 0.35);
    ctx.globalAlpha = 0.55;
    disc(x, y, r, '#ffd6dc'); disc(x - 4, y - 3, Math.max(2, r - 5), '#ffffff'); disc(x + 5, y + 3, Math.max(2, r - 7), '#ffe8ec');
    ctx.globalAlpha = 1;
    for (let k = 0; k < 4; k++) px(x + Math.cos(t * 0.3 + k * 1.6) * r, y + Math.sin(t * 0.3 + k * 1.6) * r * 0.7, 1, 1, '#ffffff');
  } else if (q.id === 'fen') {           // 旋轉吸水巾
    ctx.save(); ctx.translate(x, y); ctx.rotate(t * 0.45);
    ctx.fillStyle = '#7ec8f0'; ctx.fillRect(-9, -3, 18, 6);
    ctx.fillStyle = '#bfe8ff'; ctx.fillRect(-9, -3, 18, 2);
    ctx.fillStyle = '#4a98c8'; for (let k = -8; k < 9; k += 4) ctx.fillRect(k, -3, 1, 6);
    ctx.restore();
  } else {
    const bob = t % 8 < 4 ? 0 : 1;
    HEART.forEach((row, r) => [...row].forEach((c, k) => { if (c === 'H') px(x - 7 + k * 2, y - 6 + r * 2 + bob, 2, 2, r < 2 && k < 3 ? '#ffd0e8' : '#ff4f9a'); }));
  }
}

// ---------- 污泥怪 ----------
function spawnBlob() {
  const wh = pick(car.wheels);
  const x = car.x + wh[0];
  blobs.push({ x, y: GY, vx: 0, vy: -2, t: 0, dead: false, life: 60 * 12, dir: P.x < x ? -1 : 1, ground: false });
  for (let i = 0; i < 6; i++) part({ x: x + rnd(-5, 5), y: GY - 3, vx: rnd(-1, 1), vy: rnd(-2, -0.5), g: 0.15, life: 20, col: '#6b4a2b' });
  Audio2.sfx('squish');
}
function updateBlobs() {
  for (const b of blobs) {
    if (b.dead) continue;
    b.t++; b.life--;
    if (b.ground && b.t % 34 === 0) { b.dir = P.x < b.x ? -1 : 1; b.vx = b.dir * rnd(0.9, 1.4); b.vy = -2.4; b.ground = false; }
    if (!b.ground) {
      b.x += b.vx; b.y += b.vy; b.vy += 0.15;
      if (b.y >= GY) { b.y = GY; b.ground = true; b.vx = 0; }
    }
    b.x = clamp(b.x, 6, W - 6);
    if (b.life <= 0) { b.dead = true; burst(b.x, b.y - 4, '#6b4a2b', 6, 1); }
    if (rectHit(hurtBox(P), { x: b.x - 5, y: b.y - 8, w: 10, h: 8 })) {
      const prevInv = P.inv;
      hurtPlayer(P, b.x);
      if (prevInv === 0 && P.inv > 0) { b.vx = -b.vx; }
    }
  }
  blobs = blobs.filter(b => !b.dead);
}
function killBlob(b) {
  b.dead = true; R.blobs++;
  burst(b.x, b.y - 4, '#7a5230', 12, 2.5); bubbles(b.x, b.y - 4, 6);
  pop(b.x, b.y - 18, '+150', '#ffd080');
  R.bonus += 150; Audio2.sfx('pop'); Audio2.sfx('squish');
}

// ---------- 鴿子 ----------
function spawnBird() {
  const fromL = Math.random() < 0.5;
  birds.push({ x: fromL ? -12 : W + 12, y: rnd(28, 66), vx: (fromL ? 1 : -1) * rnd(0.8, 1.2), vy: 0, st: 'fly', t: 0, drop: rndi(30, 70) });
  Audio2.sfx('coo');
}
function updateBirds() {
  for (const b of birds) {
    b.t++;
    if (b.st === 'fly') {
      b.x += b.vx; b.y += Math.sin(b.t * 0.08) * 0.3;
      if (--b.drop <= 0 && b.x > car.left + 8 && b.x < car.right - 8) {
        poops.push({ x: b.x, y: b.y + 4, vy: 0.5 }); b.drop = rndi(80, 140); Audio2.sfx('poop');
      }
    } else { b.x += b.vx; b.y += b.vy; b.vy -= 0.05; }
  }
  birds = birds.filter(b => b.x > -30 && b.x < W + 30 && b.y > -30);
}
function shooBird(b) {
  b.st = 'flee'; b.vx *= 2.5; b.vy = -2.5; R.birds++;
  for (let i = 0; i < 6; i++) part({ x: b.x, y: b.y, vx: rnd(-1, 1), vy: rnd(-1, 0.5), g: 0.03, life: 50, col: '#c8ccd8', type: 'feather' });
  pop(b.x, b.y - 10, '趕走！+300', '#a0e0ff');
  R.bonus += 300; Audio2.sfx('flap'); Audio2.sfx('coo');
}
function updatePoops() {
  for (const q of poops) {
    q.y += q.vy; q.vy += 0.15;
    if (car.hasPixel(q.x, q.y)) {
      car.splat(Math.round(q.x - car.x)); q.dead = true;
      pop(q.x, q.y - 8, '啪', '#ffffff'); Audio2.sfx('plop');
      burst(q.x, q.y, '#f4f1e6', 5, 1);
    } else if (rectHit(hurtBox(P), { x: q.x - 2, y: q.y - 2, w: 4, h: 4 }) && P.st !== 'rise') {
      q.dead = true; hurtPlayer(P, q.x, 'yuck'); Audio2.sfx('plop');
    } else if (q.y >= GY) { q.dead = true; decals.push({ x: q.x, life: 200 }); Audio2.sfx('plop'); }
  }
  poops = poops.filter(q => !q.dead);
}

// ---------- 繪製 ----------
function drawParticles() {
  for (const p of parts) {
    const k = 1 - p.t / p.life;
    if (p.type === 'px') px(p.x, p.y, p.s, p.s, p.col);
    else if (p.type === 'bubble') {
      const r = p.s;
      if (r <= 1) { px(p.x - 1, p.y, 3, 1, p.col); px(p.x, p.y - 1, 1, 3, p.col); }
      else { px(p.x - 1, p.y - 2, 3, 1, p.col); px(p.x - 1, p.y + 2, 3, 1, p.col); px(p.x - 2, p.y - 1, 1, 3, p.col); px(p.x + 2, p.y - 1, 1, 3, p.col); px(p.x - 1, p.y - 1, 1, 1, '#bfe8ff'); }
    } else if (p.type === 'spark') {
      const L = Math.round(p.s * (0.4 + k));
      px(p.x - L, p.y, L * 2 + 1, 1, p.col); px(p.x, p.y - L, 1, L * 2 + 1, p.col);
      const d = Math.round(L * 0.6);
      for (let i = 1; i <= d; i++) { px(p.x + i, p.y + i, 1, 1, '#fff'); px(p.x - i, p.y - i, 1, 1, '#fff'); px(p.x + i, p.y - i, 1, 1, '#fff'); px(p.x - i, p.y + i, 1, 1, '#fff'); }
      px(p.x - 1, p.y - 1, 3, 3, '#ffffff');
    } else if (p.type === 'star') {
      const L = k > 0.5 ? 2 : 1;
      px(p.x - L, p.y, L * 2 + 1, 1, p.col); px(p.x, p.y - L, 1, L * 2 + 1, p.col);
    } else if (p.type === 'rain') { px(p.x, p.y, 1, 4, '#9ac8ff');
    } else if (p.type === 'feather') { px(p.x, p.y, 2, 1, p.col); px(p.x + 1, p.y - 1, 1, 1, p.col); }
  }
}
function updateParticles() {
  for (const p of parts) { p.t++; p.x += p.vx; p.y += p.vy; p.vy += p.g; if (p.type === 'feather') p.vx = Math.sin(p.t * 0.2) * 0.6; }
  parts = parts.filter(p => p.t < p.life);
  if (parts.length > 500) parts.splice(0, parts.length - 500);
  for (const q of pops) q.t++;
  pops = pops.filter(q => q.t < 50);
}
function drawPops() {
  for (const q of pops) text(q.str, q.x, q.y - Math.min(q.t, 20) * 0.6, { c: q.col, a: 'c', o: '#000', s: q.s });
}

function playerPose(p) {
  const ch = p.ch;
  switch (p.st) {
    case 'idle': return 'idle' + (Math.floor(G.t / 22) % 2);
    case 'walk': return p.running ? 'run' + (Math.floor(p.t / 5) % 4) : 'walk' + (Math.floor(p.t / 8) % 4);
    case 'crouch': return 'crouch';
    case 'jump': return p.mv ? p.mvName : p.vy < 0 ? 'jump' : 'fall';
    case 'attack': {
      let acc = 0;
      for (const [n, d] of p.mv.frames) { acc += d; if (p.mt < acc) return n; }
      return p.mv.frames[p.mv.frames.length - 1][0];
    }
    case 'throw': return p.t < 8 ? 'throw0' : p.t < 12 ? 'throw1' : 'throw2';
    case 'rush': return 'rush' + (Math.floor(p.t / 5) % 2);
    case 'rise': return p.t < 26 ? (Math.floor(p.t / 4) % 2 ? 'spinK' : 'spin') : 'fall';
    case 'torpedo': return p.t < 10 ? 'throw0' : 'throw1';
    case 'stomp': return p.dive ? 'spinK' : 'spin';
    case 'knee': return p.vy < 0 ? 'rush0' : 'rush1';
    case 'hurt': return 'hurt';
    case 'yuck': return 'yuck';
    case 'win': return 'win' + (Math.floor(G.t / 16) % 2);
    case 'super': return SUP && SUP.t > 56 ? 'rush' + (Math.floor(SUP.t / 3) % 2) : 'throw0';
    case 'sad': return 'hurt';
    default: return 'idle0';
  }
}
function drawPlayer(p) {
  // 影子
  const fy = floorAt(p.x);
  const sw = clamp(14 - (fy - p.y) * 0.1, 6, 14);
  ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(Math.round(p.x - sw / 2), fy - 1, Math.round(sw), 2);
  if (p.inv > 0 && p.inv < 900 && !['rise', 'torpedo', 'stomp', 'knee'].includes(p.st) && (G.t >> 1) % 2) return;   // 必殺中的無敵不閃爍
  const pose = playerPose(p);
  const face = p.face;
  if (p.st === 'rush' || p.st === 'rise' || (p.st === 'super' && SUP && SUP.t > 56)) {
    drawChar(p.ch, pose, p.x - p.face * 6, p.y, face, { sil: p.ch.fx.glow, alpha: 0.45 });
  }
  drawChar(p.ch, pose, p.x, p.y - (p.st === 'win' && (G.t >> 4) % 2 ? 1 : 0), face);
}

function drawHUD() {
  // 左：頭像＋分數
  px(4, 4, 30, 30, '#000'); px(5, 5, 28, 28, '#ffd040');
  if (portraitSmall[P.ch.pIdx]) ctx.drawImage(portraitSmall[P.ch.pIdx], 6, 6);
  text(P.ch.name, 38, 5, { c: '#ffffff', o: '#000' });
  text('SCORE', 38, 19, { c: '#ffd040', o: '#000' });
  text(String(G.total + R.cleanPts + R.bonus).padStart(7, '0'), 76, 19, { c: '#ffffff', o: '#000' });
  // 中：計時
  const sec = Math.max(0, Math.ceil(R.time / 60));
  px(W / 2 - 18, 3, 36, 26, '#000'); px(W / 2 - 17, 4, 34, 24, sec <= 10 ? '#5a0008' : '#1a1a22');
  text(String(sec).padStart(2, '0'), W / 2, 6, { s: 2, c: sec <= 10 && G.t % 30 < 15 ? '#ff4040' : '#ffe060', a: 'c', o: '#000' });
  // 右：亮度
  const cl = car.clean;
  text('亮度', 252, 5, { c: '#ffffff', o: '#000' });
  px(282, 6, 98, 10, '#000'); px(283, 7, 96, 8, '#3a0a10');
  const bw = Math.round(96 * cl);
  px(283, 7, bw, 8, cl >= 0.97 ? '#ffffff' : '#ffd040'); px(283, 7, bw, 2, cl >= 0.97 ? '#ffffff' : '#fff2a0');
  px(283 + Math.round(96 * 0.97) - 1, 5, 1, 12, '#ff4040');
  text(Math.floor(cl * 100) + '%', 380, 19, { c: '#ffffff', a: 'r', o: '#000' });
  text(stage.title, 252, 19, { c: '#ff8080', o: '#000' });
  // 下：能量
  const m = P.meter;
  text('紅分子能量', 6, H - 15, { c: '#ff6060', o: '#000' });
  px(68, H - 13, 82, 8, '#000'); px(69, H - 12, 80, 6, '#2a0004');
  px(69, H - 12, Math.round(80 * m / 100), 6, m >= 100 ? (G.t % 10 < 5 ? '#ff2020' : '#ffd040') : '#d0202a');
  if (m >= 100) text('MAX！按「超」', 156, H - 15, { c: G.t % 20 < 10 ? '#ffd040' : '#ffffff', o: '#000' });
  // 連擊
  if (P.combo >= 3 && (G.scene === 'play' || G.scene === 'demo') && !SUP) {
    text(P.combo + ' HIT', 8, 44, { s: 2, c: '#ffd040', o: '#300', grad: ['#ffffff', '#ffb020'] });
    if (P.combo >= 10) text('連擊大爆發！', 8, 72, { c: '#ff8080', o: '#000' });
  }
}

// ---------- 場景 ----------
function drawWorld() {
  ctx.drawImage(bg, 0, 0);
  if (!BG_IMG[stage.key] && BG[stage.key + 'Fx']) BG[stage.key + 'Fx'](G.t);   // 舊的程式背景才有動態效果
  for (const d of decals) { if (d.life > 0) { ctx.globalAlpha = Math.min(1, d.life / 60); px(d.x - 3, GY + 1, 7, 2, '#ecebe2'); px(d.x - 1, GY, 3, 1, '#ffffff'); ctx.globalAlpha = 1; } }
  car.draw(G.t);
  for (const b of blobs) {
    const img = BLOB[Math.floor(b.t / 8) % 2];
    ctx.save(); ctx.translate(Math.round(b.x), Math.round(b.y)); if (b.dir > 0) ctx.scale(-1, 1);
    ctx.drawImage(img, -7, -10); ctx.restore();
  }
  drawPlayer(P);
  for (const q of projs) drawProj(q);
  for (const b of birds) {
    const img = PIGEON[Math.floor(b.t / 6) % 2];
    ctx.save(); ctx.translate(Math.round(b.x), Math.round(b.y)); if (b.vx < 0) ctx.scale(-1, 1);
    if (b.st === 'flee') ctx.rotate(b.t * 0.3);
    ctx.drawImage(img, -7, -5); ctx.restore();
  }
  for (const q of poops) { px(q.x - 1, q.y - 1, 3, 3, '#f4f1e6'); px(q.x, q.y, 1, 1, '#8a8a80'); }
  drawParticles();
  drawPops();
}

// ---------- 里程碑與事件 ----------
function banner(str, col = '#ffffff') { G.banner = { str, col, t: 0 }; }
function checkMilestones() {
  const cl = car.clean;
  while (cl >= R.nextDing && R.nextDing < 0.97) {
    Audio2.ding(Math.round(R.nextDing * 20));
    for (let i = 0; i < 5; i++) { const q = car.randomCleanPixel(); if (q) twinkle(q[0], q[1], '#fff6a0'); }
    R.nextDing += 0.05;
  }
  const M = [
    [0.3, '車身露出原色了！', () => {}],
    [0.6, '車燈亮起來了！', () => { car.lights = true; Audio2.sfx('lights'); }],
    [0.85, '輪框閃閃發亮！', () => { car.rims = true; Audio2.sfx('sparkle'); }],
  ];
  for (const [th, msg, fn] of M) if (cl >= th && !R.ms[th]) { R.ms[th] = true; fn(); banner(msg, '#fff2a0'); }
}
// 飛天電動車：洗到一點點就起飛，偶爾降落充電
function updateFly() {
  const F = R.fly;
  if (!F) return;
  F.t++;
  if (F.ph === 'ground') {
    if (car.clean >= 0.12 || F.t > 360) { F.ph = 'lift'; F.t = 0; banner('飛天電動車起飛了！跳起來打！', '#9ad8ff'); Audio2.sfx('hover'); }
  } else if (F.ph === 'lift') {
    F.alt += (52 + Math.sin(G.t * 0.045) * 8 - F.alt) * 0.04;
    if (F.t > 60 * 9) { F.ph = 'land'; F.t = 0; banner('降落充電中！快打！', '#ffd040'); Audio2.sfx('land'); }
  } else if (F.ph === 'land') {
    F.alt += (0 - F.alt) * 0.08;
    if (F.t > 150) { F.ph = 'lift'; F.t = 0; Audio2.sfx('hover'); }
  }
  car.setAlt(F.alt);
  if (F.alt > 2 && G.t % 2 === 0) for (const [wx, wy, wr] of car.wheels) part({ x: car.x + wx + rnd(-3, 3), y: car.y + wy + wr + 8, vy: rnd(0.8, 1.6), life: 14, col: pick(['#9ad8ff', '#ffffff', '#4ab0ff']) });
}
function updateRain() {
  if (stage.rain && R.time === stage.rain * 60) { R.rainT = 7 * 60; banner('下雨了！鍍膜過的地方不會留水斑', '#9ad8ff'); }
  if (R.rainT > 0) {
    R.rainT--;
    if (R.rainT % 144 === 0 || R.rainT === 7 * 60 - 1) Audio2.sfx('rain');
    for (let i = 0; i < 3; i++) part({ x: rnd(0, W + 40), y: rnd(-10, 40), vx: -1.2, vy: 6, life: 40, type: 'rain' });
    if (R.rainT % 5 === 0) {
      const r = car.rainSpot();
      if (r && r.coated) { burst(r.x, r.y, '#bfe8ff', 3, 1); if (G.t - (R.popT || 0) > 50) { R.popT = G.t; pop(r.x, r.y - 6, '鍍膜彈開！', '#bfe8ff'); } }
    }
  }
}
function drawBanner() {
  const b = G.banner;
  if (!b) return;
  b.t++;
  if (b.t > 110) { G.banner = null; return; }
  const x = W / 2 + (b.t < 10 ? (10 - b.t) * 30 : b.t > 100 ? -(b.t - 100) * 30 : 0);
  const w = textW(b.str) + 24;
  ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(Math.round(x - w / 2), 36, Math.round(w), 16);
  px(x - w / 2, 36, w, 1, '#ff4040'); px(x - w / 2, 51, w, 1, '#ff4040');
  text(b.str, x, 38, { c: b.col, a: 'c', o: '#000' });
}

function setupStage(i) {
  G.stageIdx = i; stage = STAGES[i];
  car = new Car(stage.car, stage.dirt);
  bg = buildBG(stage.key);
  const meter = P ? P.meter : 0;
  P = newPlayer(CHARS[G.chIdx]); P.meter = meter;
  projs = []; blobs = []; birds = []; poops = []; parts = []; pops = []; decals = [];
  R = { time: stage.time * 60, cleanPts: 0, bonus: 0, maxCombo: 0, birds: 0, blobs: 0, hurt: 0, supers: 0, blobT: 60 * 3, birdT: 60 * 2.5, perfect: false, nextDing: 0.05, ms: {}, rainT: 0, fly: stage.fly ? { ph: 'ground', t: 0, alt: 0 } : null };
  G.banner = null;
  SUP = null; G.flash = 0;
}

// ---------- 一格遊戲邏輯（正式遊玩與示範共用） ----------
function tickPlay() {
      if (G.flash > 0) G.flash--;
      if (SUP) { updateSuper(); updateParticles(); car.update(); return; }
      if (G.hitstop > 0) { G.hitstop--; updateParticles(); return; }
      R.time--;
      if (R.time === 600) Audio2.play('hurry');
      if (R.time <= 600 && R.time > 0 && R.time % 60 === 0) Audio2.sfx('timeTick');
      updatePlayer(P);
      updateProjs(); updateBlobs(); updateBirds(); updatePoops(); updateParticles();
      car.update(); checkMilestones(); updateRain(); updateFly();
      decals.forEach(d => d.life--); decals = decals.filter(d => d.life > 0);
      if (--R.blobT <= 0) { if (blobs.length < stage.blobMax) spawnBlob(); R.blobT = Math.round(stage.blobEvery * 60 * rnd(0.8, 1.2)); }
      if (stage.birdEvery && --R.birdT <= 0) { if (birds.filter(b => b.st === 'fly').length < 2) spawnBird(); R.birdT = Math.round(stage.birdEvery * 60 * rnd(0.8, 1.2)); }
      // 乾淨處閃亮
      if (Math.random() < car.clean * 0.35) { const q = car.randomCleanPixel(); if (q) twinkle(q[0], q[1]); }
      if (car.clean >= 0.97) return 'perfect';
      if (R.time <= 0) return 'timeup';
      return '';
}
function drawPlay() {
      ctx.save();
      if (G.shake > 0) { G.shake--; ctx.translate(rndi(-2, 2), rndi(-1, 1)); }
      drawWorld();
      if (R.rainT > 0) { ctx.fillStyle = 'rgba(20,30,60,.22)'; ctx.fillRect(0, 0, W, H); }
      ctx.restore();
      if (SUP) drawSuper();
      if (G.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${G.flash / 14})`; ctx.fillRect(0, 0, W, H); }
      drawHUD();
      if (!SUP) drawBanner();
}

// ---------- 暫停選單 ----------
const PAUSE_ITEMS = () => ['繼續', '出招表', '重新開始這一關', '回到標題', '聲音：' + (Audio2.muted ? '關' : '開')];
function moveLines(ch) {
  return [[cmdOf(ch, 'proj'), ch.moves.proj], [cmdOf(ch, 'rise'), ch.moves.rise], [cmdOf(ch, 'rush'), ch.moves.rush], ['能量滿＋超', SUPER_NAME]];
}
function pauseMenu() {
  const I = Input.pressed, n = PAUSE_ITEMS().length;
  if (I.up) { G.pi = (G.pi + n - 1) % n; Audio2.sfx('blip'); }
  if (I.down) { G.pi = (G.pi + 1) % n; Audio2.sfx('blip'); }
  if (G.moveList) { if (I.p || I.k || I.start || I.pause) { G.moveList = false; Audio2.sfx('blip'); } return; }
  if (I.pause) { G.paused = false; return; }
  if (I.p || I.start) {
    Audio2.sfx('confirm');
    if (G.pi === 0) G.paused = false;
    else if (G.pi === 1) G.moveList = true;
    else if (G.pi === 2) { G.paused = false; const m = P.meter; setupStage(G.stageIdx); P.meter = m; go('intro'); }
    else if (G.pi === 3) { G.paused = false; Audio2.stop(); go('title'); }
    else Audio2.toggleMute();
  }
}
function drawPause() {
  ctx.fillStyle = 'rgba(0,0,0,.65)'; ctx.fillRect(0, 0, W, H);
  if (G.moveList) {           // 出招表（像機台桌墊）
    const ch = P.ch;
    px(24, 24, W - 48, H - 48, '#1a0006'); px(24, 24, W - 48, 2, '#ff3030'); px(24, H - 26, W - 48, 2, '#ff3030');
    if (portraitMid[ch.pIdx]) ctx.drawImage(portraitMid[ch.pIdx], 36, 36);
    text(ch.name + '　出招表', 84, 40, { s: 1, c: '#ffd040', o: '#000' });
    text(ch.title, 84, 56, { c: '#ff8080', o: '#000' });
    moveLines(ch).forEach(([cmd, name], k) => {
      text(cmd, 40, 88 + k * 18, { c: '#9ad8ff', o: '#000' });
      text(name, 150, 88 + k * 18, { c: '#ffffff', o: '#000' });
    });
    text(isTouch ? '「飛彈」「迴旋」鍵可以直接放必殺' : '快捷鍵：L 飛彈　I 迴旋　空白鍵 超必殺', W / 2, 166, { c: '#a0a0b0', a: 'c', o: '#000' });
    text('按任意鍵返回', W / 2, 180, { c: '#ffd040', a: 'c', o: '#000' });
    return;
  }
  text('PAUSE', W / 2, 38, { s: 3, c: '#ffd040', a: 'c', o: '#000', grad: ['#ffffff', '#ffb020'] });
  PAUSE_ITEMS().forEach((it, i) => {
    const on = i === G.pi;
    if (on) px(W / 2 - 70, 88 + i * 18, 140, 16, '#8a0010');
    text((on ? '▶ ' : '　') + it, W / 2, 90 + i * 18, { c: on ? '#ffffff' : '#a0a0b0', a: 'c', o: '#000' });
  });
  text(isTouch ? '搖桿上下選擇，按「拳」確定' : '↑↓ 選擇，J 或 Enter 確定', W / 2, 186, { c: '#9ad8ff', a: 'c', o: '#000' });
}


const SCENES = {
  boot: {
    update() { if (Input.realPressed && G.st > 10) { Audio2.unlock(); go('opening'); } },
    draw() {
      px(0, 0, W, H, '#000');
      text(VERSION, W - 6, 6, { c: '#5a5a6a', a: 'r' });
      text('紅分子 亮車快打', W / 2, 80, { s: 2, c: '#ffd040', a: 'c', o: '#300', grad: ['#ffffff', '#ff8a10'] });
      if (G.t % 60 < 42) text(isTouch ? '點一下畫面開始（開啟音效）' : '按任意鍵開始（開啟音效）', W / 2, 124, { c: '#ffffff', a: 'c' });
      text('HJAEC SHINE BRAWL', W / 2, 190, { c: '#5a5a6a', a: 'c' });
    },
  },

  // 開場動畫：品牌 → 商品 → 角色 → 擦亮車子 → 標題（約 7 秒，跟開場曲對拍）
  opening: {
    enter() {
      Audio2.play('opening'); Audio2.sfx('whoosh');
      this.car = new Car('sedan', { dust: 0.8, mud: 1.3, spots: 14, film: 0.9 });
      this.car.x = Math.round(W / 2 - this.car.w / 2); this.car.y = 180 - this.car.h;
      parts = []; pops = [];
    },
    update() {
      const f = G.st, BAR = 109;
      if (Input.realPressed && f > 8) { go('title'); return; }
      if (f === 60) Audio2.sfx('sparkle');
      for (let k = 0; k < 4; k++) if (f === BAR + k * 27) Audio2.sfx('impact');
      for (let k = 0; k < 8; k++) if (f === BAR * 2 + Math.round(k * 13.6)) Audio2.sfx(k % 2 ? 'whoosh2' : 'whoosh');
      if (f === BAR * 3) Audio2.sfx('whoosh');
      if (f === BAR * 3 + 30) { this.car.cleanAll(99); Audio2.sfx('sparkle'); for (let i = 0; i < 30; i++) { const q = this.car.randomCleanPixel(); if (q) twinkle(q[0], q[1]); } }
      if (f === BAR * 3 + 40) { Audio2.sfx('stamp'); G.shake = 10; }
      if (f > BAR * 3 + 30 && f % 3 === 0) { const q = this.car.randomCleanPixel(); if (q) twinkle(q[0], q[1]); }
      updateParticles();
      if (f >= BAR * 4 + 20) go('title');
    },
    draw() {
      const f = G.st, BAR = 109;
      ctx.save();
      if (G.shake > 0) { G.shake--; ctx.translate(rndi(-3, 3), rndi(-2, 2)); }
      if (f < BAR) {                                   // 1. 品牌
        px(0, 0, W, H, '#000');
        const k = Math.min(1, f / 14);
        px(0, H / 2 - 1, W * k, 2, '#ff2a2a');
        if (f > 10) {
          const s = f < 18 ? 6 - (f - 10) * 0.25 : 4;
          text('紅分子', W / 2, 62 - (s - 4) * 6, { s: Math.round(s), c: '#ff3030', a: 'c', o: '#300', grad: ['#ff8080', '#c80010'] });
        }
        if (f > 40) text('HJAEC 汽車美容　presents', W / 2, 128, { c: '#ffffff', a: 'c' });
        if (f > 56 && f < 92) {                        // 光掃過字
          const x = (f - 56) * 12 - 40;
          ctx.fillStyle = 'rgba(255,255,255,.55)';
          ctx.beginPath(); ctx.moveTo(x, 50); ctx.lineTo(x + 10, 50); ctx.lineTo(x - 10, 115); ctx.lineTo(x - 20, 115); ctx.fill();
        }
      } else if (f < BAR * 2) {                        // 2. 商品
        const g = f - BAR;
        px(0, 0, W, H, '#1a0006');
        for (let i = 0; i < 14; i++) {
          const a = i / 14 * Math.PI * 2 + f * 0.01;
          ctx.fillStyle = i % 2 ? 'rgba(255,40,60,.16)' : 'rgba(255,200,60,.08)';
          ctx.beginPath(); ctx.moveTo(W / 2, 110); ctx.lineTo(W / 2 + Math.cos(a) * 420, 110 + Math.sin(a) * 420); ctx.lineTo(W / 2 + Math.cos(a + 0.22) * 420, 110 + Math.sin(a + 0.22) * 420); ctx.fill();
        }
        text('紅分子 汽車美容系列', W / 2, 14, { c: '#ffd040', a: 'c', o: '#300' });
        PROD.forEach((pr, i) => {
          const t0 = i * 27, gx = 48 + i * 96;
          if (g < t0) return;
          const x = g - t0 < 10 ? gx + (10 - (g - t0)) * 40 : gx;
          const im = photoOf(pr[0] + pr[1], 'big') || productImg[i];
          if (im && im.complete) {
            const ix = Math.round(x - im.width / 2), iy = 146 - im.height;
            px(ix - 2, iy - 2, im.width + 4, im.height + 4, '#ffd040'); px(ix - 1, iy - 1, im.width + 2, im.height + 2, '#000');
            ctx.drawImage(im, ix, iy);
            const sh = (g - t0) * 6 - 20;                // 卡片上掃過一道光
            if (sh < im.width + 20) { ctx.save(); ctx.beginPath(); ctx.rect(ix, iy, im.width, im.height); ctx.clip(); ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.beginPath(); ctx.moveTo(ix + sh, iy); ctx.lineTo(ix + sh + 8, iy); ctx.lineTo(ix + sh - 12, iy + im.height); ctx.lineTo(ix + sh - 20, iy + im.height); ctx.fill(); ctx.restore(); }
          }
          px(x - 30, 150, 60, 2, '#ff3030');
          if (g - t0 > 8) {
            text(pr[0], x, 158, { c: '#ffffff', a: 'c', o: '#000' });
            text(pr[1], x, 172, { c: '#ff9090', a: 'c', o: '#000' });
          }
        });
      } else if (f < BAR * 3) {                        // 3. 角色
        const g = f - BAR * 2;
        px(0, 0, W, H, '#0a0006');
        CHARS.forEach((ch, i) => {
          const t0 = Math.round(i * 13.6);
          if (g < t0) return;
          const x0 = i * 48, slide = Math.max(0, 12 - (g - t0)) * 18;
          ctx.save();
          ctx.beginPath(); ctx.moveTo(x0 + 8, 0); ctx.lineTo(x0 + 56, 0); ctx.lineTo(x0 + 48, H); ctx.lineTo(x0, H); ctx.clip();
          px(x0 - 8, 0, 72, H, i < 4 ? '#3a0008' : '#081a3a');
          const im = portraitBig[ch.pIdx];
          if (im && im.complete) ctx.drawImage(im, x0 - 28, 40 - slide + (i % 2) * 16);
          ctx.restore();
          px(x0, 0, 2, H, '#000');
          text(ch.name, x0 + 26, 176 + (i % 2) * 14, { c: '#ffffff', a: 'c', o: '#000' });
        });
        if (g > 60) text(G.t % 20 < 14 ? '８位洗車戰士　登場！' : '', W / 2, 10, { c: '#ffd040', a: 'c', o: '#000' });
      } else {                                         // 4. 擦亮車子 → 標題
        const g = f - BAR * 3, c = this.car;
        px(0, 0, W, H, '#05050c');
        for (let y = 180; y < H; y += 4) px(0, y, W, 2, '#101018');
        ctx.drawImage(c.base, c.x, c.y);
        const sx = c.x + Math.min(c.w + 20, g * 9) - 10;
        ctx.save(); ctx.beginPath(); ctx.rect(sx, 0, W, H); ctx.clip(); ctx.drawImage(c.dirtC, c.x, c.y); ctx.restore();
        if (g * 9 < c.w + 20) { ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(sx - 3, c.y - 10, 6, c.h + 14); ctx.fillStyle = 'rgba(255,60,60,.6)'; ctx.fillRect(sx - 8, c.y - 6, 4, c.h + 6); }
        if (c.dirtDirty) c.redrawDirt();
        if (g > 40) {
          const s = g < 46 ? 7 - (g - 40) * 0.5 : 4;
          text('亮車快打', W / 2, 30 - (s - 4) * 6, { s: Math.round(s), a: 'c', c: '#ffd040', o: '#5a0000', grad: ['#fff6c0', '#ff8a10'] });
        }
        if (g > 56) text('S H I N E   B R A W L', W / 2, 86, { c: '#ffffff', a: 'c', o: '#5a0000' });
      }
      ctx.restore();
      drawParticles();
      if (f > 10) text(isTouch ? '點一下跳過' : '按任意鍵跳過', W - 4, H - 12, { c: '#5a5a6a', a: 'r' });
    },
  },

  title: {
    enter() { Audio2.play('title'); },
    update() {
      if (Input.pressed.start || Input.pressed.p || Input.pressed.k) { Audio2.unlock(); Audio2.sfx('confirm'); go('select'); return; }
      if (Input.pressed.up) { Audio2.sfx('blip'); go('changes'); return; }
      if (G.st > 60 * 9) { G.rankHi = -1; go('ranking'); }
    },
    draw() {
      px(0, 0, W, H, '#0a0006');
      // 斜紋
      ctx.save(); ctx.globalAlpha = 0.5;
      for (let i = -10; i < 30; i++) {
        const x = i * 24 + (G.t * 0.5) % 24;
        ctx.fillStyle = i % 2 ? '#3a0008' : '#22000a';
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 12, 0); ctx.lineTo(x - 60, H); ctx.lineTo(x - 72, H); ctx.fill();
      }
      ctx.restore();
      // 光芒
      for (let i = 0; i < 12; i++) {
        const a = i / 12 * Math.PI * 2 + G.t * 0.004;
        ctx.fillStyle = i % 2 ? 'rgba(255,60,60,.08)' : 'rgba(255,200,60,.06)';
        ctx.beginPath(); ctx.moveTo(W / 2, 70); ctx.lineTo(W / 2 + Math.cos(a) * 400, 70 + Math.sin(a) * 400); ctx.lineTo(W / 2 + Math.cos(a + 0.26) * 400, 70 + Math.sin(a + 0.26) * 400); ctx.fill();
      }
      text('紅分子 HJAEC 汽車美容 presents', W / 2, 12, { c: '#ff6a6a', a: 'c', o: '#000' });
      const bob = Math.round(Math.sin(G.t * 0.05) * 2);
      text('亮車快打', W / 2, 32 + bob, { s: 4, a: 'c', c: '#ffd040', o: '#5a0000', grad: ['#fff6c0', '#ff8a10'] });
      text('S H I N E   B R A W L', W / 2, 88, { c: '#ffffff', a: 'c', o: '#5a0000' });
      // 四人
      CHARS.forEach((ch, i) => drawChar(ch, 'idle' + (Math.floor((G.t + i * 11) / 22) % 2), 26 + i * 47, 186, i < 4 ? 1 : -1));
      px(0, 186, W, 1, '#ff3a3a');
      if (G.t % 60 < 40) text(isTouch ? '點一下畫面開始' : 'PRESS ENTER 開始', W / 2, 192, { c: '#ffffff', a: 'c', o: '#000' });
      text('HI ' + String(G.hi).padStart(7, '0'), W - 6, 204, { c: '#ffd040', a: 'r', o: '#000' });
      text(VERSION + '　↑ 更新紀錄　M 靜音', 6, 204, { c: '#8a8a9a', o: '#000' });
      text('把髒車打到發亮！', W / 2, 102, { c: '#ffd0d0', a: 'c', o: '#000' });
    },
  },

  select: {
    enter() { this.cur = G.chIdx; this.lock = 0; markMat(this.cur); Audio2.play('select'); },
    update() {
      const I = Input.pressed, n = CHARS.length;
      if (this.lock) { if (++this.lock > 50) { G.total = 0; P = null; setupStage(0); go('intro'); } return; }
      const mv = d => { this.cur = (this.cur + d + n) % n; Audio2.sfx('cursor'); Audio2.sfx('ch_' + CHARS[this.cur].id); markMat(this.cur); };
      if (I.left) mv(-1);
      if (I.right) mv(1);
      if (I.up || I.down) mv(4);
      if (I.p || I.k || I.start) { G.chIdx = this.cur; this.lock = 1; Audio2.stop(); Audio2.sfx('decide'); Audio2.sfx('ch_' + CHARS[this.cur].id); }
    },
    draw() {
      px(0, 0, W, H, '#0c0c14');
      for (let y = 0; y < H; y += 8) px(0, y, W, 1, '#141420');
      for (let x = (G.t * 0.3) % 8; x < W; x += 8) px(x, 0, 1, H, '#141420');
      text('選擇你的洗車戰士', W / 2, 4, { c: '#ffd040', a: 'c', o: '#300', grad: ['#ffffff', '#ffb020'] });
      CHARS.forEach((ch, i) => {
        const x = 10 + i * 46, y = 20, on = i === this.cur;
        px(x - 2, y - 2, 44, 44, on ? (G.t % 16 < 8 || this.lock ? '#ff3030' : '#ffd040') : '#2a2a36');
        ctx.fillStyle = on ? '#4a0a14' : '#1a1a24'; ctx.fillRect(x, y, 40, 40);
        if (portraitMid[ch.pIdx]) ctx.drawImage(portraitMid[ch.pIdx], x, y);
        if (!on) { ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(x, y, 40, 40); }
        if (i === 4) px(x - 4, y - 2, 1, 44, '#5a5a6a');   // 前四位是紅分子隊
      });
      text('紅分子隊', 10 + 46 * 2 - 2, 64, { c: '#ff6060', a: 'c', o: '#000' });
      text('不想上班隊', 10 + 46 * 6 - 2, 64, { c: '#9ad8ff', a: 'c', o: '#000' });
      const ch = CHARS[this.cur];
      const pose = this.lock ? 'win0' : 'idle' + (Math.floor(G.t / 22) % 2);
      drawChar(ch, pose, 56, 212, 1, { scale: 1.5 });
      const ix = 116;
      text(ch.name, ix, 80, { s: 2, c: '#ffffff', o: '#300', grad: ['#ffffff', '#ffd040'] });
      text(ch.title, ix + textW(ch.name, 2) + 8, 90, { c: '#ff8080', o: '#000' });
      text(ch.blurb, ix, 108, { c: '#d8d8e0', o: '#000' });
      [['速度', ch.stats.spd], ['力量', ch.stats.pow], ['跳躍', ch.stats.jmp]].forEach(([n, v], k) => {
        text(n, ix + k * 88, 124, { c: '#ffd040', o: '#000' });
        for (let j = 0; j < 5; j++) px(ix + 26 + k * 88 + j * 9, 126, 7, 7, j < v ? '#ff3a3a' : '#33333f');
      });
      moveLines(ch).forEach(([cmd, name], k) => {
        text(cmd, ix, 142 + k * 14, { c: '#9ad8ff', o: '#000' });
        text(name, ix + 88, 142 + k * 14, { c: '#ffffff', o: '#000' });
      });
    },
  },

  intro: {
    enter() { Audio2.stop(); },
    update() {
      updateParticles(); car.update();
      if (G.st === 10) Audio2.sfx('ready');
      const D = G.stageIdx === 0 ? 100 : 0;   // 第一關多留時間看操作
      if (G.st === 100 + D) { Audio2.sfx('go'); Audio2.play(stage.music || 'fight1'); }
      if (G.st >= 130 + D || (G.st > 30 && G.st < 100 + D - 5 && (Input.pressed.start || Input.pressed.p))) { if (G.st < 100 + D) G.st = 100 + D - 1; else go('play'); }
    },
    draw() {
      drawWorld(); drawHUD();
      const D = G.stageIdx === 0 ? 100 : 0;
      const k = G.st < 100 + D ? Math.min(G.st, 99) : G.st - D;
      if (k < 100) {
        ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(0, 70, W, 70);
        const x = Math.min(W / 2, -100 + k * 12);
        text(stage.title, x, 76, { s: 3, c: '#ffd040', a: 'c', o: '#300', grad: ['#ffffff', '#ff9020'] });
        if (k > 25) text(stage.sub, W / 2, 116, { s: 1, c: '#ffffff', a: 'c', o: '#000' });
        if (k > 45) text(car.T.name + '・目標亮度 97%', W / 2, 128, { c: '#ffb0b0', a: 'c', o: '#000' });
      }
      if (G.stageIdx === 0 && k < 100) {   // 第一關開場顯示操作
        ctx.fillStyle = 'rgba(0,0,0,.7)'; ctx.fillRect(40, 146, W - 80, 34);
        const lines = isTouch
          ? ['左邊搖桿移動／往上跳　拳・腳 攻擊', '「飛彈」「迴旋」直接放必殺　能量滿按「超」']
          : ['方向鍵／WASD 移動　J 拳　K 腳　L 飛彈　I 迴旋', '指令：↓↓+拳　↓↓+腳　→→+拳　能量滿按空白鍵'];
        lines.forEach((l, i) => text(l, W / 2, 149 + i * 15, { c: i ? '#9ad8ff' : '#ffffff', a: 'c' }));
      } else {
        const s = k < 108 ? 5 - (k - 100) * 0.25 : 3;
        text('開洗！', W / 2, 90 - s * 4, { s: Math.round(s), c: '#ff4040', a: 'c', o: '#fff', grad: ['#ffe060', '#ff2020'] });
      }
    },
  },

  play: {
    enter() { G.paused = false; },
    update() {
      if (G.paused) { pauseMenu(); return; }
      if (Input.pressed.pause || (Input.pressed.start && isTouch)) { G.paused = true; G.pi = 0; Audio2.sfx('blip'); return; }
      const st = tickPlay();
      if (st === 'perfect') { R.perfect = true; go('finish'); }
      else if (st === 'timeup') go('finish');
    },
    draw() { drawPlay(); if (G.paused) drawPause(); },
  },


  finish: {
    enter() {
      if (R.perfect) {
        car.cleanAll(99); car.shine = 1;
        Audio2.stop(); Audio2.sfx('perfect');
        for (let i = 0; i < 40; i++) { const q = car.randomCleanPixel(); if (q) twinkle(q[0], q[1]); }
      } else { Audio2.stop(); Audio2.sfx('gong'); }
      P.st = car.clean >= 0.5 ? 'win' : 'sad'; P.mv = null; SUP = null; P.inv = 0;
      if (R.fly) { R.fly.ph = 'end'; }
      if (!P.ground) { P.y = floorAt(P.x); P.ground = true; }
      projs = []; poops = [];
      birds.forEach(b => { if (b.st === 'fly') { b.st = 'flee'; b.vy = -1.5; } });
      blobs.forEach(b => { b.dead = true; burst(b.x, b.y - 4, '#6b4a2b', 6, 1); });
    },
    update() {
      if (R.fly) { R.fly.alt *= 0.9; car.setAlt(R.fly.alt); }
      updateParticles(); updateBirds(); car.update(); blobs = [];
      if (G.st % 3 === 0) { const q = car.randomCleanPixel(); if (q) twinkle(q[0], q[1]); }
      if (G.st > 170 || (G.st > 60 && (Input.pressed.start || Input.pressed.p))) go('result');
    },
    draw() {
      drawWorld(); drawHUD();
      if (R.perfect) {
        const s = G.st < 10 ? 2 : 3;
        text('PERFECT SHINE!', W / 2, 70, { s, c: '#ffffff', a: 'c', o: '#5a0000', grad: ['#ffffff', '#ffd040'] });
        if (G.st > 30) text('紅分子 鍍膜完成', W / 2, 112, { c: '#ffffff', a: 'c', o: '#000' });
      } else text('TIME UP', W / 2, 74, { s: 3, c: '#ff4040', a: 'c', o: '#000', grad: ['#ffe0e0', '#ff3030'] });
    },
  },

  result: {
    enter() {
      Audio2.play('result');
      const cl = car.clean;
      this.rank = R.perfect ? 'S' : cl >= 0.85 ? 'A' : cl >= 0.7 ? 'B' : cl >= 0.5 ? 'C' : 'D';
      const sec = Math.max(0, Math.ceil(R.time / 60));
      this.rows = [
        ['清潔', R.cleanPts],
        ['亮度' + Math.floor(cl * 100) + '%', Math.floor(cl * 100) * 100],
        ['剩餘' + sec + '秒', R.perfect ? sec * 500 : 0],
        ['連擊' + R.maxCombo, R.maxCombo * 100],
        ['鴿子泥怪', R.bonus],
      ];
      this.sum = this.rows.reduce((s, r) => s + r[1], 0);
      G.total += this.sum;
      this.bottles = stage.products.map(([n, c]) => bottleCanvas(c, c));
    },
    update() {
      if (G.st > 10 && G.st < 130 && G.st % 4 === 0) Audio2.sfx('tick');
      if (G.st === 135) Audio2.sfx('stamp');
      if (G.st > 140 && (Input.pressed.start || Input.pressed.p || Input.pressed.k)) {
        Audio2.sfx('confirm');
        if (G.stageIdx < STAGES.length - 1) { setupStage(G.stageIdx + 1); go('intro'); }
        else go('ending');
      }
    },
    draw() {
      px(0, 0, W, H, '#100008');
      for (let i = 0; i < 20; i++) px(0, i * 12 + (G.t * 0.4) % 12, W, 5, '#1a000c');
      text(stage.title + '　結算', W / 2, 6, { c: '#ffd040', a: 'c', o: '#000' });
      // 車
      ctx.save(); ctx.translate(-car.x + 6, -car.y + 22);
      car.draw(G.t, false);
      ctx.restore();
      text(car.T.name, 10, 112, { c: '#ffffff', o: '#000' });
      // 分數
      const k = Math.min(1, G.st / 120), cx0 = 250, cx1 = 378;
      this.rows.forEach(([n, v], i) => {
        if (G.st < i * 12) return;
        text(n, cx0, 22 + i * 14, { c: '#d8d8e0', o: '#000' });
        text(String(Math.round(v * k)), cx1, 22 + i * 14, { c: '#ffffff', a: 'r', o: '#000' });
      });
      px(cx0, 93, cx1 - cx0, 1, '#ff4040');
      text('本關', cx0, 97, { c: '#ffd040', o: '#000' });
      text(String(Math.round(this.sum * k)), cx1, 97, { c: '#ffd040', a: 'r', o: '#000' });
      text('總分 ' + String(G.total - Math.round(this.sum * (1 - k))).padStart(7, '0'), cx1, 113, { c: '#ff8080', a: 'r', o: '#000' });
      // 評價章
      if (G.st > 135) {
        const s = G.st < 141 ? 6 - (G.st - 135) * 0.5 : 3;
        const col = { S: ['#ffffff', '#ffd040'], A: ['#ffe0e0', '#ff4040'], B: ['#e0f0ff', '#40a0ff'], C: ['#e0ffe0', '#40c060'], D: ['#e0e0e0', '#8a8a8a'] }[this.rank];
        text('評價', 120, 112, { c: '#ffffff', o: '#000' });
        text(this.rank, 166, 122 - s * 6, { s: Math.round(s), c: col[1], o: '#000', grad: col, a: 'c' });
      }
      // 產品
      px(0, 140, W, 1, '#5a0010');
      text('本關登場的紅分子好物', 16, 146, { c: '#ff8080', o: '#000' });
      stage.products.forEach(([name], i) => {
        const x = 16 + i * 186, im = photoOf(name, 'small');
        if (im && im.complete) { px(x - 1, 162, im.width + 2, im.height + 2, '#ffd040'); ctx.drawImage(im, x, 163); }
        else ctx.drawImage(this.bottles[i], x, 166);
        text(name, x + (im ? im.width : 16) + 6, 180, { c: '#ffffff', o: '#000' });
      });
      if (G.st > 140 && G.t % 60 < 40) text(G.stageIdx < STAGES.length - 1 ? '按攻擊鍵　下一關' : '按攻擊鍵　看結局', 378, 127, { c: '#ffd040', a: 'r', o: '#000' });
    },
  },

  demo: {
    enter() {
      G.demo = true; Audio2.quiet = true; Audio2.stop();
      this.prevCh = G.chIdx; G.chIdx = rndi(0, 3); P = null;
      setupStage(rndi(0, STAGES.length - 1)); P.meter = 60;
      G.ai = { target: P.x, f: 0 };
    },
    exit(to) {
      G.demo = false; Audio2.quiet = false; Input.ai = {}; G.chIdx = this.prevCh; G.paused = false;
      go(to);
    },
    update() {
      if (Input.realPressed) { this.exit('title'); return; }
      aiThink();
      const st = tickPlay();
      if (st || G.st > 60 * 24) this.exit('opening');
    },
    draw() {
      drawPlay();
      if (G.t % 60 < 40) text('DEMO PLAY', W / 2, 60, { s: 2, c: '#ffffff', a: 'c', o: '#000', grad: ['#ffffff', '#ff8a10'] });
      text(isTouch ? '點一下畫面開始' : 'PRESS ENTER', W / 2, 88, { c: '#ffd040', a: 'c', o: '#000' });
    },
  },

  changes: {
    enter() {
      // 先把更新紀錄排成一行一行（太長自動換行），可以上下捲動
      this.lines = []; this.off = 0;
      for (const [v, ...items] of CHANGELOG) {
        items.forEach((it, k) => {
          let rest = '・' + it, first = true;
          while (rest.length) { this.lines.push([k === 0 && first ? v : '', rest.slice(0, 23)]); rest = rest.slice(23); first = false; if (rest) rest = '　' + rest; }
        });
        this.lines.push(['', '']);
      }
    },
    update() {
      const I = Input.pressed, max = Math.max(0, this.lines.length - 12);
      if (I.down) this.off = Math.min(max, this.off + 3);
      if (I.up) { if (this.off === 0 && G.st > 10) { go('title'); return; } this.off = Math.max(0, this.off - 3); }
      if (G.st > 10 && (I.start || I.p || I.k || I.pause)) { Audio2.sfx('blip'); go('title'); }
    },
    draw() {
      px(0, 0, W, H, '#0a0006');
      text('更新紀錄', W / 2, 6, { s: 2, c: '#ffd040', a: 'c', o: '#300', grad: ['#ffffff', '#ffb020'] });
      this.lines.slice(this.off, this.off + 12).forEach(([v, t], k) => {
        if (v) text(v, 10, 38 + k * 13, { c: '#ff6060', o: '#000' });
        text(t, 58, 38 + k * 13, { c: '#e0e0e8', o: '#000' });
      });
      text('↑↓ 捲動　攻擊鍵返回', W / 2, H - 14, { c: '#9ad8ff', a: 'c', o: '#000' });
    },
  },

  ranking: {
    enter() { if (G.rankHi < 0) Audio2.play('title'); },
    update() {
      if (Input.realPressed && G.st > 20) { go('title'); return; }
      if (G.st > 60 * (G.rankHi >= 0 ? 10 : 6)) go(G.rankHi >= 0 ? 'title' : 'demo');
    },
    draw() {
      px(0, 0, W, H, '#0a0006');
      for (let y = 0; y < H; y += 6) px(0, y + (G.t >> 2) % 6, W, 2, '#160008');
      text('TOP 5　亮車王', W / 2, 14, { s: 2, c: '#ffd040', a: 'c', o: '#300', grad: ['#ffffff', '#ffb020'] });
      text('RANK', 52, 52, { c: '#ff8080' }); text('NAME', 136, 52, { c: '#ff8080' }); text('SCORE', 330, 52, { c: '#ff8080', a: 'r' });
      BOARD.forEach(([n, sc, ci], i) => {
        const y = 72 + i * 24, on = i === G.rankHi;
        if (on && G.t % 20 < 10) return;
        const col = on ? '#ffffff' : i === 0 ? '#ffd040' : '#d8d8e0';
        text(['1ST', '2ND', '3RD', '4TH', '5TH'][i], 52, y, { c: col, o: '#000' });
        if (portraitSmall[CHARS[ci || 0].pIdx]) ctx.drawImage(portraitSmall[CHARS[ci || 0].pIdx], 96, y - 8);
        text(n, 136, y, { s: 1, c: col, o: '#000' });
        text(String(sc).padStart(7, '0'), 330, y, { c: col, a: 'r', o: '#000' });
      });
    },
  },

  entry: {
    enter() {
      this.name = [0, 0, 0]; this.pos = 0; this.done = 0;
      Audio2.play('result');
    },
    update() {
      const I = Input.pressed, L = NAME_CHARS.length;
      if (this.done) { if (++this.done > 50) go('ranking'); return; }
      if (I.up || I.right) { this.name[this.pos] = (this.name[this.pos] + 1) % L; Audio2.sfx('letter'); }
      if (I.down || I.left) { this.name[this.pos] = (this.name[this.pos] + L - 1) % L; Audio2.sfx('letter'); }
      if (I.k && this.pos > 0) { this.pos--; Audio2.sfx('blip'); }
      if (I.p || I.start) {
        Audio2.sfx('confirm');
        if (++this.pos >= 3) {
          const n = this.name.map(i => NAME_CHARS[i]).join('');
          BOARD.push([n, G.total, G.chIdx]);
          BOARD.sort((a, b) => b[1] - a[1]); BOARD = BOARD.slice(0, 5);
          G.rankHi = BOARD.findIndex(r => r[0] === n && r[1] === G.total);
          Store.set('board', BOARD); Store.set('hi', BOARD[0][1]); G.hi = BOARD[0][1];
          this.done = 1;
        }
      }
    },
    draw() {
      px(0, 0, W, H, '#0a0006');
      text('恭喜上榜！請輸入名字', W / 2, 20, { c: '#ffd040', a: 'c', o: '#000' });
      text('總分 ' + String(G.total).padStart(7, '0'), W / 2, 40, { s: 2, c: '#ffffff', a: 'c', o: '#000' });
      ctx.drawImage(portraitImg[CHARS[G.chIdx].pIdx], 40, 84);
      for (let i = 0; i < 3; i++) {
        const x = 170 + i * 44, on = i === this.pos && !this.done;
        px(x - 2, 80, 36, 44, on && G.t % 20 < 12 ? '#ff3030' : '#2a2a36');
        px(x, 82, 32, 40, '#000');
        text(i <= this.pos || this.done ? NAME_CHARS[this.name[i]] : '_', x + 16, 88, { s: 3, c: '#ffffff', a: 'c' });
      }
      text(isTouch ? '搖桿上下換字，拳確定，腳退回' : '↑↓ 換字，J 確定，K 退回', W / 2, 150, { c: '#9ad8ff', a: 'c', o: '#000' });
    },
  },

  ending: {
    enter() {
      Audio2.play('ending');
      this.newHi = G.total > G.hi;
      if (this.newHi) G.hi = G.total;
    },
    update() {
      if (G.st % 6 === 0) part({ x: rnd(0, W), y: -4, vy: rnd(0.4, 1), life: 260, type: 'star', col: pick(['#ffd040', '#ffffff', '#ff6060']) });
      if (G.st % 50 === 20) {        // 煙火：先往上飛，再炸開
        const x = rnd(170, 370), y = rnd(30, 90), col = pick(['#ff4040', '#ffd040', '#6ac8ff', '#ff8ac4', '#7dff6a']);
        part({ x, y: H, vy: -(H - y) / 30, life: 30, col: '#ffffff', s: 1 });
        setTimeout(() => { if (G.scene !== 'ending') return; burst(x, y, col, 26, 2.6); burst(x, y, '#ffffff', 8, 1.2); Audio2.sfx('firework'); }, 500);
        Audio2.sfx('rocket');
      }
      updateParticles();
      if (G.st > 240 && (Input.pressed.start || Input.pressed.p || Input.pressed.k)) {
        Audio2.sfx('confirm');
        if (G.total > BOARD[BOARD.length - 1][1]) go('entry'); else { G.rankHi = -1; go('ranking'); }
      }
    },
    draw() {
      px(0, 0, W, H, '#08000a');
      for (let i = 0; i < 12; i++) {
        const a = i / 12 * Math.PI * 2 + G.t * 0.003;
        ctx.fillStyle = i % 2 ? 'rgba(255,40,60,.10)' : 'rgba(255,200,60,.07)';
        ctx.beginPath(); ctx.moveTo(90, 130); ctx.lineTo(90 + Math.cos(a) * 400, 130 + Math.sin(a) * 400); ctx.lineTo(90 + Math.cos(a + 0.26) * 400, 130 + Math.sin(a + 0.26) * 400); ctx.fill();
      }
      drawParticles();
      const ch = CHARS[G.chIdx];
      px(22, 22, 116, 116, '#ffd040'); px(24, 24, 112, 112, '#3a0010');
      ctx.drawImage(portraitBig[ch.pIdx], 24, 24);
      drawChar(ch, 'win' + (Math.floor(G.t / 16) % 2), 80, 206, 1);
      const lines = [
        ['四台車全部打亮！', '#ffd040', 2],
        [ch.name + '：「' + QUOTES[ch.id][0], '#ffffff', 1],
        ['　' + QUOTES[ch.id][1] + '」', '#ffffff', 1],
        ['', '', 1],
        ['打造乾淨亮眼的外觀', '#ff8080', 1],
        ['紅分子 HJAEC 汽車美容', '#ffffff', 1],
        ['www.hjaec.com', '#9ad8ff', 1],
      ];
      let y = 20;
      lines.forEach(([str, c, sz], i) => {
        if (G.st > 20 + i * 22 && str) text(str, 176, y, { s: sz, c, o: '#000', grad: sz > 1 ? ['#ffffff', '#ffb020'] : null });
        y += sz > 1 ? 32 : 16;
      });
      if (G.st > 190) {
        text('總分 ' + String(G.total).padStart(7, '0'), 176, 162, { s: 1, c: '#ffd040', o: '#000' });
        if (this.newHi && G.t % 30 < 20) text('NEW RECORD!', 290, 162, { c: '#ff4040', o: '#000' });
      }
      if (G.st > 240 && G.t % 60 < 40) text('按任意攻擊鍵回到標題', 176, 196, { c: '#ffffff', o: '#000' });
    },
  },
};

const NAME_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.-';

// 示範模式的電腦玩家：找最髒的那一段車身過去打
function aiThink() {
  const K = Input.ai, A = G.ai;
  for (const k in K) K[k] = false;
  A.f++;
  if (A.f % 2 === 0) return;               // 隔一格放開按鍵，才會產生「按下」
  if (A.f % 45 === 1) {
    let best = -1;
    for (let x = 0; x < car.w; x += 8) {
      let sum = 0;
      for (let y = 0; y < car.h; y += 2) for (let dx = 0; dx < 8 && x + dx < car.w; dx += 2) sum += car.amt[y * car.w + x + dx];
      if (sum > best) { best = sum; A.target = car.x + x + 4; }
    }
  }
  const free = P.st === 'idle' || P.st === 'walk' || P.st === 'crouch';
  const near = blobs.find(b => Math.abs(b.x - P.x) < 28);
  if (free) {
    if (P.meter >= 100) K.sup = true;
    else if (near) { P.face = near.x > P.x ? 1 : -1; K.down = true; K.k = true; }
    else if (Math.abs(P.x - A.target) > 12) K[P.x < A.target ? 'right' : 'left'] = true;
    else {
      const r = Math.random();
      if (r < 0.28) K.p = true; else if (r < 0.5) K.k = true; else if (r < 0.64) { K.down = true; K.k = true; }
      else if (r < 0.74) { K.down = true; K.p = true; } else if (r < 0.86) K.up = true; else if (r < 0.94) K.s1 = true; else K.s2 = true;
    }
  } else if (P.st === 'jump' && !P.mv && P.vy > -2) K.k = true;
}

// ---------- 桌墊：像街機台面印的出招表 ----------
function buildMat() {
  const mat = document.getElementById('mat');
  if (!mat) return;
  const basic = isTouch
    ? ['左搖桿：移動／往上跳／往下蹲', '拳・腳：普通攻擊', '飛彈・迴旋：直接放必殺', '超：能量滿放超必殺', 'START：暫停（有出招表）']
    : ['方向鍵／WASD：移動・↑跳・↓蹲', 'J 拳　K 腳', 'L 飛彈　I 迴旋（快捷）', '空白鍵：超必殺（能量滿）', 'Esc：暫停　M：靜音'];
  let h = `<div class="mat-head">出招表 COMMAND LIST<span><button id="matIcon">圖示</button> <button id="matLog">${VERSION} 更新紀錄</button> <button id="matToggle">收起</button></span></div><div class="mat-body">`;
  h += `<div class="card basic"><div class="nm">基本操作</div><ul>${basic.map(b => `<li>${b}</li>`).join('')}</ul></div>`;
  CHARS.forEach((ch, i) => {
    h += `<div class="card" data-i="${i}"><div class="top"><img src="${PORTRAITS[ch.pIdx]}" alt="" draggable="false"><div class="nm">${ch.name}<small>${ch.title}</small></div></div><ul>` +
      moveLines(ch).map(([c, n]) => `<li><b>${c}</b>${n}</li>`).join('') + `</ul></div>`;
  });
  mat.innerHTML = h + '</div>';
  document.getElementById('matLog').addEventListener('click', () => {
    const d = document.getElementById('logDlg');
    d.querySelector('div').innerHTML = CHANGELOG.map(([v, ...it]) => `<h4>${v}</h4><ul>${it.map(x => `<li>${x}</li>`).join('')}</ul>`).join('');
    d.showModal();
  });
  document.getElementById('matIcon').addEventListener('click', () => HomeIcon.open());
  document.getElementById('matToggle').addEventListener('click', () => {
    document.body.classList.toggle('mat-off'); fit();
    document.getElementById('matToggle').textContent = document.body.classList.contains('mat-off') ? '展開' : '收起';
  });
  fit();
}
function markMat(i) {
  document.querySelectorAll('#mat .card[data-i]').forEach(el => el.classList.toggle('on', +el.dataset.i === i));
  const el = document.querySelector(`#mat .card[data-i="${i}"]`);
  if (el && el.scrollIntoView) el.parentElement.scrollTo({ left: el.offsetLeft - el.parentElement.clientWidth / 2 + el.clientWidth / 2, behavior: 'smooth' });
}
buildMat();

// 靜音鍵
addEventListener('keydown', e => { if (e.code === 'KeyM') Audio2.toggleMute(); });

// ---------- 主迴圈（固定 60fps 邏輯） ----------
let last = performance.now(), acc = 0;
function frame(now) {
  acc += Math.min(100, now - last); last = now;
  while (acc >= 1000 / 60) {
    Input.update();
    SCENES[G.scene].update();
    G.t++; G.st++;
    acc -= 1000 / 60;
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  SCENES[G.scene].draw();
  requestAnimationFrame(frame);
}
const fontReady = document.fonts ? Promise.race([document.fonts.load(FONT), new Promise(r => setTimeout(r, 2500))]) : Promise.resolve();
Promise.all([fontReady, SPRITES_READY, CARS_READY, BGS_READY]).then(() => { textCache.clear(); go('boot'); requestAnimationFrame(frame); });
