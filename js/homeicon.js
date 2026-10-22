// ---------- 主畫面圖示：四款可選 ----------
// 放在 <head>，設定寫在 script 標籤的 data-*。選好的款式存在 localStorage，
// 每次載入就換掉 apple-touch-icon 與 manifest，iPhone「分享 → 加入主畫面」時會用選好的那張。
// 圖檔：icons/icon<n>-180.png（iPhone）、-192／-512（Android），manifest<n>.webmanifest
const HomeIcon = (() => {
  const cfg = document.currentScript.dataset;
  const KEY = cfg.key || 'homeicon';
  const NAMES = (cfg.names || '1,2,3,4').split(',');
  const BASE = cfg.base || 'icons/';
  const N = NAMES.length;
  const get = () => {
    let i = 1;
    try { i = parseInt(localStorage.getItem(KEY), 10) || 1; } catch (e) {}
    return i >= 1 && i <= N ? i : 1;
  };
  const link = rel => {
    let el = document.querySelector(`link[rel="${rel}"]`);
    if (!el) { el = document.createElement('link'); el.rel = rel; document.head.appendChild(el); }
    return el;
  };
  function apply(i) {
    link('apple-touch-icon').href = `${BASE}icon${i}-180.png`;
    link('manifest').href = `${BASE}manifest${i}.webmanifest`;
  }
  apply(get());

  let box = null;
  function open() {
    if (box) return;
    const accent = cfg.accent || '#c81e28', bg = cfg.bg || '#160006', font = cfg.font || "'PingFang TC', sans-serif";
    box = document.createElement('div');
    box.setAttribute('style', `position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;
      background:rgba(0,0,0,.7);font-family:${font};color:#eee;touch-action:none`);
    const cur = get();
    box.innerHTML = `<div style="background:${bg};border:3px solid ${accent};border-radius:10px;padding:16px 16px 14px;width:min(340px,88vw);box-sizing:border-box">
      <div style="font-size:18px;color:#ffd040;margin-bottom:10px">主畫面圖示</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">${NAMES.map((nm, k) => `
        <button data-hi="${k + 1}" style="font:inherit;color:#eee;background:none;border:0;padding:0;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:6px">
          <img src="${BASE}icon${k + 1}-180.png" alt="" draggable="false" style="width:96px;height:96px;border-radius:22px;display:block;box-sizing:border-box;border:3px solid transparent">
          <span style="font-size:13px"></span></button>`).join('')}</div>
      <p style="font-size:12px;line-height:1.7;color:#c8c8d4;margin:12px 0 0">選好後，iPhone 用 Safari 按「分享」→「加入主畫面」；Android 用 Chrome 按「⋮」→「加到主畫面」。已經加過的，要先刪掉舊圖示再加一次才會換。</p>
      <div style="text-align:right;margin-top:10px"><button data-close style="font:inherit;color:#fff;background:${accent};border:0;border-radius:4px;padding:5px 18px;cursor:pointer">完成</button></div></div>`;
    const mark = sel => box.querySelectorAll('[data-hi]').forEach(b => {
      const on = +b.dataset.hi === sel;
      b.querySelector('img').style.borderColor = on ? '#ffd040' : 'transparent';
      b.querySelector('span').textContent = (on ? '✔ ' : '') + NAMES[b.dataset.hi - 1];
      b.querySelector('span').style.color = on ? '#ffd040' : '#eee';
    });
    mark(cur);
    box.addEventListener('click', e => {
      const b = e.target.closest('[data-hi]');
      if (b) {
        const i = +b.dataset.hi;
        try { localStorage.setItem(KEY, i); } catch (err) {}
        apply(i); mark(i);
      } else if (e.target.closest('[data-close]') || e.target === box) close();
    });
    box.addEventListener('keydown', e => e.stopPropagation());
    document.body.appendChild(box);
  }
  function close() { if (box) { box.remove(); box = null; } }
  return { open, close, get };
})();
