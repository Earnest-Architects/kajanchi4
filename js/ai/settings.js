/* settings.js — サーバー接続設定(初期は閉じている)。アドレス正規化・接続テスト */
(function(A){
  const $ = A.$, baseEl = $('#base'), keyEl = $('#key'), set = $('#set'), gear = $('#gear');
  baseEl.value = localStorage.getItem('comfy_base2') || '';
  keyEl.value = localStorage.getItem('comfy_key') || '';
  if(!baseEl.value) baseEl.value = 'https://rinaldi18.sardine-lenok.ts.net'; // 既定(Tailscale)
  // スキーム省略可(*.ts.net は https、100.x や LAN は http を補う)
  function norm(v){
    v = v.trim().replace(/\/+$/, '');
    if(v && !/^https?:\/\//i.test(v)) v = (/^(localhost|127\.|10\.|192\.168\.|100\.\d+\.|172\.(1[6-9]|2\d|3[01])\.)/i.test(v) ? 'http://' : 'https://') + v;
    return v;
  }
  const base = () => norm(baseEl.value);
  const hdr = (h = {}) => keyEl.value ? {...h, 'X-Access-Key': keyEl.value} : h;
  baseEl.onchange = () => { baseEl.value = norm(baseEl.value); localStorage.setItem('comfy_base2', baseEl.value); };
  keyEl.onchange = () => localStorage.setItem('comfy_key', keyEl.value);
  function mixedHint(){
    const b = base();
    if(location.protocol === 'https:' && /^http:\/\//i.test(b) && !/^http:\/\/(localhost|127\.0\.0\.1)/i.test(b))
      return ' このページはHTTPSのため、他のPCへのhttp://アドレスはブロックされます。https(例: Tailscale Serve)を使ってください。';
    return '';
  }
  function open(on){ set.classList.toggle('open', on); gear.setAttribute('aria-pressed', on); }
  gear.onclick = () => open(!set.classList.contains('open'));
  // 外側クリックで閉じる
  document.addEventListener('pointerdown', e => {
    if(set.classList.contains('open') && !set.contains(e.target) && !gear.contains(e.target)) open(false);
  });
  $('#test').onclick = async () => {
    const c = $('#conn'); c.className = ''; c.textContent = '確認中…';
    try{
      const r = await fetch(base()+'/system_stats', {headers:hdr()});
      if(r.status === 401) throw new Error('server.pyにPASSWORDが設定されています。同じキーを「アクセスキー」に入力してください。');
      if(r.status === 502) throw new Error('server.pyは動いていますが、ComfyUIに接続できません。ComfyUIを起動し、start.batのCOMFYのポート(Desktop=8000 / Portable=8188)を確認してください。');
      if(r.status === 429) throw new Error('キーの誤入力が多すぎます。数分待ってください。');
      if(!r.ok) throw new Error('サーバー応答: '+r.status);
      const j = await r.json();
      c.className = 'ok'; c.textContent = 'ComfyUI '+((j.system && j.system.comfyui_version) || '')+' に接続しました。';
    }catch(e){
      c.className = 'bad';
      c.textContent = (e.message.includes('Failed to fetch') || e.name === 'TypeError' ? (base() || 'このサーバー')+' に接続できません。'+mixedHint()+' server.pyが動いているか、アドレスを確認してください。' : e.message);
    }
  };
  A.server = {base, hdr, mixedHint, open};
})(window.AI);
