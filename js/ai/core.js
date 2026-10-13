/* core.js — 共通ユーティリティとイベントバス。他モジュールはここだけに依存する */
window.AI = window.AI || {};
(function(A){
  A.$ = s => document.querySelector(s);
  A.sleep = ms => new Promise(r => setTimeout(r, ms));
  // 画像1/2などの共有状態
  A.state = {files:{1:null, 2:null}};
  // 小さなイベントバス: viewer ⇄ paint ⇄ history を疎結合にする
  const subs = {};
  A.on = (t, fn) => (subs[t] = subs[t] || []).push(fn);
  A.emit = (t, d) => (subs[t] || []).forEach(fn => fn(d));
  A.setStatus = (t, err) => { const s = A.$('#status'); s.textContent = t; s.className = err ? 'err' : ''; };
})(window.AI);
