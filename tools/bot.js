// 開發用：在瀏覽器裡注入，跑自動測試與截圖（不會被遊戲載入）
window.snap = async (name, scale = 3) => { const [b, g] = mkCanvas(W * scale, H * scale); g.imageSmoothingEnabled = false; g.drawImage(cv, 0, 0, b.width, b.height); return (await fetch('http://localhost:4211', { method: 'POST', body: name + '|' + b.toDataURL() })).status; };
window.step = (n = 1, draw = true) => { for (let i = 0; i < n; i++) { Input.update(); SCENES[G.scene].update(); G.t++; G.st++; } if (draw) { ctx.setTransform(1, 0, 0, 1, 0, 0); SCENES[G.scene].draw(); } };
window.tap = (b, n = 2) => { Input.key[b] = true; step(n); Input.key[b] = false; step(1); };
window.bot = (chIdx, stIdx, skill = 1, stopAt = 99999, useSuper = true) => {
  Audio2.stop(); G.chIdx = chIdx; P = null; setupStage(stIdx); go('play');
  let target = 0; const marks = {};
  const K = Input.key; const clear = () => { for (const k in K) K[k] = false; };
  const colDirt = () => { let best = -1, bx = 0; for (let x = 0; x < car.w; x += 6) { let s = 0; for (let y = 0; y < car.h; y++) for (let dx = 0; dx < 6 && x + dx < car.w; dx++) s += car.amt[y * car.w + x + dx]; if (s > best) { best = s; bx = x + 3; } } return car.x + bx; };
  let f = 0;
  while (G.scene === 'play' && f < stopAt) {
    clear();
    if (f % 45 === 0) target = colDirt();
    const near = blobs.find(b => Math.abs(b.x - P.x) < 30);
    if (P.st === 'idle' || P.st === 'walk' || P.st === 'crouch') {
      if (P.meter >= 100 && useSuper) K.sup = true;
      else if (near && skill > 0.8) { P.face = near.x > P.x ? 1 : -1; K.down = true; K.k = true; }
      else if (Math.abs(P.x - target) > 12) K[P.x < target ? 'right' : 'left'] = true;
      else {
        const r = Math.random();
        if (Math.random() > skill) { /* 發呆 */ }
        else if (r < 0.3) K.p = true; else if (r < 0.55) K.k = true; else if (r < 0.7) { K.down = true; K.k = true; } else if (r < 0.8) { K.down = true; K.p = true; }
        else if (r < 0.9) K.up = true; else if (r < 0.95) K.s1 = true; else K.s2 = true;
      }
    } else if (P.st === 'jump' && !P.mv && P.vy > -2) K.k = true;
    Input.update(); SCENES[G.scene].update(); G.t++; G.st++; f++;
    if (f % 2 === 0) clear();
    if (f === 900) marks.c15 = car.clean; if (f === 1800) marks.c30 = car.clean;
  }
  clear();
  return { ch: CHARS[chIdx].id, st: stIdx, c15: +(marks.c15 || 1).toFixed(2), c30: +(marks.c30 || 1).toFixed(2), clean: +car.clean.toFixed(3), perfect: R.perfect, left: Math.ceil(R.time / 60), hurt: R.hurt, sup: R.supers };
};
window.sweep = (skills = [0.6, 0.9], sup = true) => { const out = []; for (const sk of skills) for (let s = 0; s < 3; s++) for (let c = 0; c < 4; c++) { const r = bot(c, s, sk, 99999, sup); out.push(sk + ' ' + Object.values(r).join(' ')); } return out.join('\n'); };
'bot ready';
