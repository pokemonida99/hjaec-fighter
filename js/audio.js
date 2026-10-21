// 合成音效與晶片風配樂（全部原創，WebAudio 即時產生）
'use strict';
const Audio2 = (() => {
  let ac = null, master, sfxBus, musBus, noiseBuf, unlocked = false;
  let song = null, step = 0, nextT = 0, timer = null;
  const muted = { v: Store.get('mute', false) };
  let quiet = false;   // 示範模式不出聲

  function init() {
    if (ac) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ac = new AC();
    master = ac.createGain(); master.gain.value = muted.v ? 0 : 0.8; master.connect(ac.destination);
    sfxBus = ac.createGain(); sfxBus.gain.value = 0.55; sfxBus.connect(master);
    musBus = ac.createGain(); musBus.gain.value = 0.22; musBus.connect(master);
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  function unlock() {
    init();
    if (!ac) return;
    if (ac.state !== 'running') ac.resume();
    if (!unlocked) {          // iPhone：在使用者手勢裡播一個無聲 buffer
      const b = ac.createBufferSource(); b.buffer = ac.createBuffer(1, 1, 22050); b.connect(ac.destination); b.start(0);
      unlocked = true;
    }
  }
  const ok = () => ac && ac.state === 'running';

  function tone(type, f0, f1, dur, vol, bus = sfxBus, t = ac.currentTime, duty) {
    const o = ac.createOscillator(), g = ac.createGain();
    if (type === 'pulse') {
      // 用兩個鋸齒波相減做脈衝波（25% duty）
      o.type = 'sawtooth';
      const o2 = ac.createOscillator(); o2.type = 'sawtooth';
      const inv = ac.createGain(); inv.gain.value = -1;
      const dl = ac.createDelay(); dl.delayTime.value = (duty || 0.25) / f0;
      o2.frequency.setValueAtTime(f0, t);
      if (f1 !== f0) o2.frequency.exponentialRampToValueAtTime(f1, t + dur);
      o2.connect(inv); inv.connect(dl); dl.connect(g);
      o2.start(t); o2.stop(t + dur + 0.02);
    } else o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(f1, 1), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    o.connect(g); g.connect(bus);
    o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(dur, vol, fType, f0, f1, bus = sfxBus, t = ac.currentTime, q = 1) {
    const s = ac.createBufferSource(); s.buffer = noiseBuf;
    s.playbackRate.value = 1;
    const f = ac.createBiquadFilter(); f.type = fType; f.Q.value = q;
    f.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = ac.createGain();
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    s.connect(f); f.connect(g); g.connect(bus);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  }

  const SFX = {
    whiff() { noise(0.09, 0.25, 'bandpass', 2400, 900, sfxBus, undefined, 1.5); },
    hit() { tone('sine', 150, 45, 0.16, 0.9); noise(0.12, 0.6, 'lowpass', 3000, 400); },
    hitBig() { tone('sine', 120, 35, 0.3, 1); noise(0.25, 0.8, 'lowpass', 4000, 200); tone('square', 90, 40, 0.18, 0.18); },
    scrub() { noise(0.14, 0.35, 'highpass', 5000, 2500); },
    splash() { noise(0.25, 0.4, 'bandpass', 1800, 600, sfxBus, undefined, 0.8); },
    proj() { tone('pulse', 220, 880, 0.22, 0.25); noise(0.3, 0.25, 'bandpass', 800, 4000); },
    rise() { tone('sawtooth', 160, 900, 0.35, 0.18); noise(0.35, 0.3, 'bandpass', 600, 5000, sfxBus, undefined, 2); },
    rush() { noise(0.06, 0.3, 'bandpass', 3000, 1500, sfxBus, undefined, 2); },
    sparkle() { const t = ac.currentTime; [1568, 2093, 2637, 3136].forEach((f, i) => tone('triangle', f, f, 0.12, 0.12, sfxBus, t + i * 0.045)); },
    pop() { tone('sine', 600, 1400, 0.08, 0.35); },
    squish() { tone('sine', 300, 80, 0.15, 0.5); noise(0.1, 0.3, 'lowpass', 900, 200); },
    coo() { const t = ac.currentTime; tone('sine', 420, 340, 0.12, 0.2, sfxBus, t); tone('sine', 400, 330, 0.16, 0.2, sfxBus, t + 0.14); },
    flap() { noise(0.2, 0.35, 'bandpass', 1200, 2400, sfxBus, undefined, 3); },
    poop() { tone('sine', 900, 200, 0.18, 0.25); },
    plop() { noise(0.12, 0.45, 'lowpass', 1200, 150); tone('sine', 220, 90, 0.1, 0.4); },
    hurt() { tone('square', 300, 120, 0.2, 0.15); noise(0.15, 0.4, 'lowpass', 2000, 300); },
    blip() { tone('pulse', 880, 880, 0.06, 0.18); },
    confirm() { const t = ac.currentTime; tone('pulse', 660, 660, 0.08, 0.2, sfxBus, t); tone('pulse', 990, 990, 0.14, 0.2, sfxBus, t + 0.08); },
    tick() { tone('square', 1300, 1300, 0.03, 0.08); },
    timeTick() { tone('square', 1000, 1000, 0.05, 0.12); },
    gong() { tone('triangle', 196, 190, 1.2, 0.5); tone('triangle', 392, 380, 0.9, 0.25); noise(0.6, 0.3, 'lowpass', 1500, 100); },
    superStart() {
      const t = ac.currentTime;
      noise(0.8, 0.5, 'bandpass', 300, 6000, sfxBus, t, 1);
      [262, 330, 392, 523].forEach((f, i) => tone('pulse', f, f, 0.5, 0.14, sfxBus, t + i * 0.06));
    },
    perfect() {
      const t = ac.currentTime;
      [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => tone('pulse', f, f, 0.22, 0.17, sfxBus, t + i * 0.08));
      [2093, 2637, 3136].forEach((f, i) => tone('triangle', f, f, 0.3, 0.1, sfxBus, t + 0.5 + i * 0.07));
    },
    ready() { tone('pulse', 440, 440, 0.25, 0.2); },
    go() { const t = ac.currentTime; tone('pulse', 523, 523, 0.1, 0.22, sfxBus, t); tone('pulse', 784, 784, 0.35, 0.22, sfxBus, t + 0.1); noise(0.4, 0.3, 'highpass', 3000, 6000, sfxBus, t); },
    stamp() { tone('sine', 110, 40, 0.35, 1); noise(0.2, 0.6, 'lowpass', 2500, 200); },
    honk() { const t = ac.currentTime; tone('square', 370, 370, 0.16, 0.16, sfxBus, t); tone('square', 466, 466, 0.16, 0.12, sfxBus, t); tone('square', 370, 370, 0.32, 0.16, sfxBus, t + 0.2); tone('square', 466, 466, 0.32, 0.12, sfxBus, t + 0.2); },
    lights() { const t = ac.currentTime; tone('square', 1200, 1200, 0.04, 0.12, sfxBus, t); tone('square', 1600, 1600, 0.06, 0.12, sfxBus, t + 0.06); },
    rain() { noise(2.5, 0.25, 'highpass', 3000, 5000); },
    letter() { tone('pulse', 1200, 1200, 0.04, 0.15); },
    // 開場、選角、結局
    whoosh() { noise(0.35, 0.45, 'bandpass', 400, 4000, sfxBus, undefined, 1.2); },
    whoosh2() { noise(0.28, 0.35, 'bandpass', 600, 5000, sfxBus, undefined, 1.6); },
    impact() { tone('sine', 90, 35, 0.4, 1); noise(0.3, 0.6, 'lowpass', 3000, 150); tone('square', 60, 40, 0.15, 0.15); },
    cursor() { const t = ac.currentTime; tone('pulse', 1046, 1046, 0.04, 0.14, sfxBus, t); tone('pulse', 1568, 1568, 0.05, 0.1, sfxBus, t + 0.04); },
    decide() { const t = ac.currentTime; [523, 659, 784, 1047].forEach((f, i) => tone('pulse', f, f, 0.18, 0.18, sfxBus, t + i * 0.05)); noise(0.5, 0.3, 'highpass', 4000, 8000, sfxBus, t); },
    rocket() { tone('sine', 400, 1800, 0.5, 0.12); noise(0.5, 0.15, 'highpass', 3000, 7000); },
    firework() { tone('sine', 120, 40, 0.4, 0.7); noise(0.7, 0.5, 'lowpass', 6000, 300); const t = ac.currentTime; for (let i = 0; i < 6; i++) noise(0.05, 0.25, 'highpass', 6000, 6000, sfxBus, t + 0.2 + i * 0.07); },
    // 選角時每個角色的代表音
    ch_boss() { const t = ac.currentTime; [65, 98, 131].forEach(f => tone('sawtooth', f, f, 0.5, 0.14, sfxBus, t)); noise(0.4, 0.3, 'lowpass', 800, 100, sfxBus, t); },
    ch_sailor() { const t = ac.currentTime; tone('sine', 1500, 2100, 0.15, 0.2, sfxBus, t); tone('sine', 1500, 2100, 0.2, 0.2, sfxBus, t + 0.18); },
    ch_hong() { const t = ac.currentTime; noise(0.12, 0.4, 'highpass', 5000, 7000, sfxBus, t); noise(0.18, 0.4, 'highpass', 5000, 7000, sfxBus, t + 0.16); },
    ch_fen() { noise(0.08, 0.7, 'bandpass', 2500, 5000, sfxBus, undefined, 3); tone('square', 1800, 600, 0.06, 0.1); },
    ch_kuri() { const t = ac.currentTime; [2093, 2637, 3136].forEach((f, i) => tone('triangle', f, f, 0.2, 0.12, sfxBus, t + i * 0.06)); },
    ch_rin() { const t = ac.currentTime; for (let i = 0; i < 4; i++) tone('square', i % 2 ? 1250 : 1000, i % 2 ? 1250 : 1000, 0.05, 0.08, sfxBus, t + i * 0.05); },
    ch_leo() { tone('sine', 80, 30, 0.35, 1); noise(0.2, 0.4, 'lowpass', 600, 80); },
    ch_momo() { const t = ac.currentTime; tone('sine', 700, 1400, 0.12, 0.2, sfxBus, t); tone('triangle', 1760, 1760, 0.2, 0.1, sfxBus, t + 0.12); },
  };

  // ---------- 配樂：簡易步進音序器 ----------
  const NOTE = n => {
    const m = /^([A-G])(#?)(\d)$/.exec(n);
    const base = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]] + (m[2] ? 1 : 0);
    return 440 * Math.pow(2, (base + (+m[3] + 1) * 12 - 69) / 12);
  };
  const parse = s => s.trim().split(/\s+/).map(x => x === '.' ? null : x === '-' ? '-' : x);

  // 原創配樂，一格 = 十六分音符。lead 主旋律／lead2 和聲／arp 和弦琶音（每段一個和弦）／bass／drum
  // drum：k 大鼓 s 小鼓 h 閉鈸 o 開鈸 c 銅鈸
  const SONGS = {
    // 開場動畫（約 7 秒，跟畫面事件對拍）
    opening: {
      bpm: 132, len: 64, once: true,
      lead: parse(`
        C5 . . . . . . . G4 . C5 . E5 . G5 .  C6 . . . G5 . . . A5 . . . G5 . . .
        F5 . A5 . C6 . A5 . G5 . B5 . D6 . B5 .  C6 . . . . . . . . . . . . . . .`),
      lead2: parse(`
        G4 . . . . . . . E4 . G4 . C5 . E5 .  E5 . . . E5 . . . F5 . . . E5 . . .
        C5 . F5 . A5 . F5 . D5 . G5 . B5 . G5 .  E5 . . . . . . . . . . . . . . .`),
      arp: ['C4 E4 G4', 'A3 C4 E4', 'F3 A3 C4', 'C4 E4 G4'],
      bass: parse(`
        C2 . . . . . . . G2 . . . G2 . . .  A2 . . . E2 . . . F2 . . . G2 . . .
        F2 . F2 . F2 . F2 . G2 . G2 . G2 . G2 .  C2 . . . . . . . . . . . . . . .`),
      drum: 'c.......k...s.s.k...s...k...s...k.k.s.k.k.k.sssscc..............',
    },
    title: {
      bpm: 112, len: 64,
      lead: parse(`
        E5 . . . D5 . C5 . D5 . . . E5 . G5 .  A5 . . . G5 . E5 . D5 . . . . . . .
        C5 . . . D5 . E5 . G5 . . . E5 . D5 .  E5 . . . . . . . . . . . . . . .`),
      lead2: parse(`
        C5 . . . B4 . A4 . B4 . . . C5 . E5 .  F5 . . . E5 . C5 . A4 . . . . . . .
        E4 . . . G4 . C5 . E5 . . . C5 . B4 .  G#4 . . . . . . . . . . . . . . .`),
      arp: ['A3 C4 E4', 'F3 A3 C4', 'C4 E4 G4', 'E3 G#3 B3'],
      bass: parse(`
        A2 . . . A3 . . . A2 . . . A3 . . .  F2 . . . F3 . . . F2 . . . F3 . . .
        C3 . . . C4 . . . G2 . . . G3 . . .  E2 . . . E3 . . . E2 . . . G#2 . . .`),
      drum: 'k...h...s...h...k...h...s...h.h.',
    },
    // 選角：輕快的 C 大調
    select: {
      bpm: 126, len: 64,
      lead: parse(`
        E5 . G5 . C6 . G5 . A5 . G5 . E5 . D5 .  C5 . E5 . A5 . E5 . G5 . E5 . C5 . . .
        F5 . A5 . C6 . A5 . G5 . F5 . E5 . F5 .  G5 . . . D5 . G5 . B5 . A5 . G5 . . .`),
      lead2: parse(`
        C5 . . . E5 . . . F5 . . . C5 . . .  A4 . . . C5 . . . E5 . . . A4 . . .
        A4 . . . C5 . . . E5 . . . C5 . . .  B4 . . . . . D5 . G5 . . . D5 . . .`),
      arp: ['C4 E4 G4', 'A3 C4 E4', 'F3 A3 C4', 'G3 B3 D4'],
      bass: parse(`
        C3 . . C3 . . G2 . C3 . . C3 . . G2 .  A2 . . A2 . . E2 . A2 . . A2 . . E2 .
        F2 . . F2 . . C3 . F2 . . F2 . . C3 .  G2 . . G2 . . D3 . G2 . . G2 B2 . D3 .`),
      drum: 'k..hs.h.k.khs.ho',
    },
    // 第一關：車庫（A 小調搖滾）
    fight1: {
      bpm: 152, len: 128,
      lead: parse(`
        A4 . C5 . E5 . A5 . G5 . E5 . D5 . E5 .  F5 . E5 . C5 . A4 . C5 . D5 . E5 . . .
        D5 . B4 . G4 . B4 . D5 . G5 . F5 . D5 .  E5 . . . G#4 . B4 . E5 . . . . . . .
        A5 . . . G5 . . . E5 . . . C5 . D5 .  E5 . F5 . E5 . D5 . C5 . . . A4 . . .
        B4 . C5 . D5 . . . G5 . F5 . E5 . D5 .  E5 . . . . . . . E5 . F#5 . G#5 . B5 .`),
      lead2: parse(`
        E4 . . . C5 . . . E5 . . . B4 . . .  C5 . . . A4 . . . F4 . . . C5 . . .
        B4 . . . G4 . . . B4 . . . D5 . . .  B4 . . . E4 . . . G#4 . . . . . . .
        E5 . . . D5 . . . C5 . . . A4 . . .  C5 . . . C5 . . . A4 . . . F4 . . .
        G4 . . . B4 . . . D5 . . . B4 . . .  G#4 . . . . . . . B4 . D5 . E5 . G#5 .`),
      arp: ['A3 C4 E4', 'F3 A3 C4', 'G3 B3 D4', 'E3 G#3 B3', 'A3 C4 E4', 'F3 A3 D4', 'G3 B3 D4', 'E3 G#3 B3'],
      bass: parse(`
        A2 . A3 . A2 . A3 . A2 . A3 . A2 . A3 .  F2 . F3 . F2 . F3 . F2 . F3 . F2 . F3 .
        G2 . G3 . G2 . G3 . G2 . G3 . G2 . G3 .  E2 . E3 . E2 . E3 . E2 . E3 . E2 . E3 .
        A2 . A3 . A2 . A3 . C3 . C4 . C3 . C4 .  F2 . F3 . F2 . F3 . D3 . D4 . D3 . D4 .
        G2 . G3 . G2 . G3 . B2 . B3 . B2 . B3 .  E2 . E3 . E2 . E3 . E2 . E3 . G#2 . G#3 .`),
      drum: 'k.h.s.h.k.k.s.h.k.h.s.h.k.h.s.ss',
    },
    // 第二關：夕陽洗車站（E 小調律動）
    fight2: {
      bpm: 140, len: 64,
      lead: parse(`
        E5 . . B4 . E5 . G5 . F#5 . E5 . D5 . B4  C5 . . . E5 . G5 . A5 . G5 . E5 . . .
        D5 . . A4 . D5 . F#5 . E5 . D5 . C5 . A4  B4 . D#5 . F#5 . B5 . A5 . F#5 . D#5 . B4 .`),
      lead2: parse(`
        B4 . . . . . . . D5 . . . B4 . . .  G4 . . . . . . . E5 . . . C5 . . .
        A4 . . . . . . . C5 . . . A4 . . .  F#4 . . . B4 . . . D#5 . . . B4 . . .`),
      arp: ['E4 G4 B4', 'C4 E4 G4', 'D4 F#4 A4', 'B3 D#4 F#4'],
      bass: parse(`
        E2 . E3 . E2 . E3 . E2 . E3 . E2 . D3 .  C2 . C3 . C2 . C3 . C2 . C3 . C2 . B2 .
        D2 . D3 . D2 . D3 . D2 . D3 . D2 . C3 .  B1 . B2 . B1 . B2 . B1 . B2 . A2 . F#2 .`),
      drum: 'k.h.s.hkk.h.s.ho',
    },
    // 最終關：夜晚街頭（D 小調高速）
    fight3: {
      bpm: 160, len: 64,
      lead: parse(`
        D5 . F5 . A5 . D6 . C6 . A5 . F5 . A5 .  A#5 . . . A5 . F5 . D5 . F5 . A5 . . .
        G5 . E5 . C5 . E5 . G5 . C6 . A#5 . G5 .  A5 . . . C#5 . E5 . A5 . . . G5 . E5 .`),
      lead2: parse(`
        A4 . . . D5 . . . F5 . . . D5 . . .  F5 . . . D5 . . . A#4 . . . D5 . . .
        E5 . . . C5 . . . E5 . . . G5 . . .  E5 . . . A4 . . . C#5 . . . E5 . . .`),
      arp: ['D4 F4 A4', 'A#3 D4 F4', 'C4 E4 G4', 'A3 C#4 E4'],
      bass: parse(`
        D2 D2 D3 D2 D2 D3 D2 D3 D2 D2 D3 D2 D2 D3 D2 D3  A#1 A#1 A#2 A#1 A#1 A#2 A#1 A#2 A#1 A#1 A#2 A#1 A#1 A#2 A#1 A#2
        C2 C2 C3 C2 C2 C3 C2 C3 C2 C2 C3 C2 C2 C3 C2 C3  A1 A1 A2 A1 A1 A2 A1 A2 A1 A1 A2 A1 A1 A2 C#2 E2`),
      drum: 'k.hsk.hsk.hsk.ss',
    },
    hurry: {
      bpm: 176, len: 64,
      lead: parse(`
        A5 . E5 . A5 . E5 . G5 . E5 . G5 . E5 .  F5 . C5 . F5 . C5 . E5 . B4 . E5 . B4 .
        D5 . A4 . D5 . A4 . C5 . A4 . C5 . A4 .  B4 . G#4 . B4 . E5 . G#5 . . . B5 . . .`),
      arp: ['A3 C4 E4', 'F3 A3 C4', 'D4 F4 A4', 'E3 G#3 B3'],
      bass: parse(`
        A2 A3 A2 A3 A2 A3 A2 A3 A2 A3 A2 A3 A2 A3 A2 A3  F2 F3 F2 F3 F2 F3 F2 F3 F2 F3 F2 F3 F2 F3 F2 F3
        D3 D4 D3 D4 D3 D4 D3 D4 D3 D4 D3 D4 D3 D4 D3 D4  E2 E3 E2 E3 E2 E3 E2 E3 E2 E3 E2 E3 E2 E3 E2 E3`),
      drum: 'k.s.k.s.k.s.k.sskks.k.s.k.s.ksss',
    },
    result: {
      bpm: 120, len: 32, once: true,
      lead: parse(`C5 . E5 . G5 . C6 . . . G5 . C6 . . .  D6 . . . B5 . . . C6 . . . . . . .`),
      lead2: parse(`G4 . C5 . E5 . G5 . . . E5 . G5 . . .  B5 . . . G5 . . . E5 . . . . . . .`),
      bass: parse(`C3 . . . C3 . . . E3 . . . E3 . . .  G2 . . . G2 . . . C3 . . . . . . .`),
      drum: 'k.......k.......k...s...k.s.s.c.',
    },
    // 結局：溫暖的 C 大調，比較長
    ending: {
      bpm: 104, len: 128,
      lead: parse(`
        C5 . . . E5 . . . G5 . . . A5 . G5 .  F5 . . . E5 . . . D5 . . . . . . .
        E5 . . . G5 . . . C6 . . . B5 . A5 .  G5 . . . . . . . . . E5 . F5 . G5 .
        A5 . . . G5 . . . F5 . . . E5 . D5 .  E5 . . . C5 . . . A4 . . . C5 . . .
        D5 . . . E5 . F5 . G5 . . . D6 . B5 .  C6 . . . . . . . . . . . . . . .`),
      lead2: parse(`
        E4 . . . G4 . . . C5 . . . C5 . . .  A4 . . . C5 . . . A4 . . . . . . .
        C5 . . . E5 . . . E5 . . . D5 . C5 .  B4 . . . . . . . . . C5 . D5 . E5 .
        F5 . . . E5 . . . C5 . . . C5 . B4 .  C5 . . . A4 . . . F4 . . . A4 . . .
        B4 . . . C5 . D5 . D5 . . . F5 . D5 .  E5 . . . . . . . . . . . . . . .`),
      arp: ['C4 E4 G4', 'F3 A3 C4', 'D4 F4 A4', 'G3 B3 D4', 'C4 E4 G4', 'E3 G#3 B3', 'A3 C4 E4', 'G3 B3 D4',
            'F3 A3 C4', 'C4 E4 G4', 'A3 C4 E4', 'F3 A3 C4', 'D4 F4 A4', 'G3 B3 D4', 'C4 E4 G4', 'C4 E4 G4'],
      bass: parse(`
        C3 . G3 . C3 . G3 . F2 . C3 . F2 . C3 .  D3 . A3 . D3 . A3 . G2 . D3 . G2 . D3 .
        C3 . G3 . C3 . G3 . E2 . B2 . E2 . B2 .  A2 . E3 . A2 . E3 . G2 . D3 . G2 . D3 .
        F2 . C3 . F2 . C3 . C3 . G3 . C3 . G3 .  A2 . E3 . A2 . E3 . F2 . C3 . F2 . C3 .
        D3 . A3 . D3 . A3 . G2 . D3 . G2 . D3 .  C3 . G3 . C3 . G3 . C3 . . . . . . .`),
      drum: 'k...h...s...h...k...h...s...h.o.',
    },
  };

  function schedule() {
    if (!song || !ok()) return;
    const spb = 60 / song.bpm / 4;
    while (nextT < ac.currentTime + 0.12) {
      const i = step % song.len;
      const ln = song.lead[i], bs = song.bass[i % song.bass.length], dr = song.drum[i % song.drum.length];
      const dur = arr => { let d = 1; while (arr[(i + d) % song.len] === null && d < 8) d++; return d; };
      if (ln && ln !== '-') tone('pulse', NOTE(ln), NOTE(ln), spb * dur(song.lead) * 0.95, 0.2, musBus, nextT, 0.25);
      if (song.lead2) { const l2 = song.lead2[i]; if (l2 && l2 !== '-') tone('pulse', NOTE(l2), NOTE(l2), spb * dur(song.lead2) * 0.9, 0.09, musBus, nextT, 0.5); }
      if (song.arp) {                      // 和弦琶音：每格輪流彈和弦裡的一個音
        const seg = song.len / song.arp.length, ch = song.arp[Math.floor(i / seg)].split(' ');
        const n = ch[i % ch.length];
        tone('pulse', NOTE(n) * 2, NOTE(n) * 2, spb * 0.8, 0.045, musBus, nextT, 0.125);
      }
      if (bs && bs !== '-') tone('triangle', NOTE(bs), NOTE(bs), spb * 1.8, 0.55, musBus, nextT);
      if (dr === 'k') { tone('sine', 140, 45, 0.12, 0.9, musBus, nextT); }
      else if (dr === 's') { noise(0.1, 0.45, 'bandpass', 1800, 1200, musBus, nextT, 0.7); tone('triangle', 220, 160, 0.06, 0.2, musBus, nextT); }
      else if (dr === 'h') noise(0.03, 0.2, 'highpass', 8000, 8000, musBus, nextT);
      else if (dr === 'o') noise(0.18, 0.18, 'highpass', 7000, 7000, musBus, nextT);
      else if (dr === 'c') noise(1.0, 0.35, 'highpass', 5000, 3000, musBus, nextT);
      nextT += spb; step++;
      if (song.once && step >= song.len) { song = null; return; }
    }
  }
  function play(name) {
    init();
    if (!ac) return;
    if (song && song.name === name) return;
    song = Object.assign({ name }, SONGS[name]);
    step = 0; nextT = ac.currentTime + 0.05;
    if (!timer) timer = setInterval(schedule, 30);
  }
  function stop() { song = null; }
  function ding(level) { if (!ok() || quiet) return; const f = 880 * Math.pow(2, Math.min(level, 19) / 12); tone('triangle', f, f, 0.18, 0.16); tone('triangle', f * 2, f * 2, 0.12, 0.06, sfxBus, ac.currentTime + 0.04); }
  function sfx(name) { if (quiet) return; if (ok() && SFX[name]) try { SFX[name](); } catch (e) { console.warn('sfx', name, e); } }
  function toggleMute() {
    muted.v = !muted.v; Store.set('mute', muted.v);
    if (master) master.gain.value = muted.v ? 0 : 0.8;
    return muted.v;
  }
  return { unlock, play, stop, sfx, ding, toggleMute, get muted() { return muted.v; }, set quiet(v) { quiet = v; if (musBus) musBus.gain.value = v ? 0 : 0.22; } };
})();
