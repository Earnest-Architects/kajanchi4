/* viewer.js — ステージ表示: 画像1・比較スライダー・入力パネルの開閉・レイアウト寸法(CSS変数)
   発火イベント: img1:set / img1:load / fit / compare:show / compare:hide */
(function(A){
  const $ = A.$, hero = $('#hero'), cap = $('#cap'), cmp = $('#cmp'), cmpA = $('#cmpA'), cmpB = $('#cmpB');
  const panel = $('.composer'), topbar = $('.top'), acts = $('#acts'), knob = $('#knob');
  let cmpUrls = [], cur = null;

  const boxOf = im => {
    const W = hero.clientWidth, H = hero.clientHeight, r = im.naturalWidth/im.naturalHeight;
    let w = W, h = W/r; if(h > H){ h = H; w = H*r; }
    return {w, h, l:(W-w)/2, t:(H-h)/2};
  };
  const place = (el, b) => Object.assign(el.style, {width:b.w+'px', height:b.h+'px', left:b.l+'px', top:b.t+'px'});
  // 画像の表示領域に合わせる(スライダー・赤ペンcanvasが同じ矩形になる)
  function fit(){
    if(cap.naturalWidth) A.emit('fit', boxOf(cap));
    const ref = (cmpA.complete && cmpA.naturalWidth) ? cmpA : (cap.naturalWidth ? cap : null);
    if(ref) place(cmp, boxOf(ref));
  }
  // --panel-h(入力パネルが占める高さ) / --top-h(上バーの高さ) を更新
  function layout(){
    const hid = panel.classList.contains('hide');
    hero.style.setProperty('--panel-h', hid ? '0px' : Math.max(0, hero.getBoundingClientRect().bottom - panel.getBoundingClientRect().top)+'px');
    hero.style.setProperty('--top-h', Math.max(56, topbar.offsetHeight)+'px');
    hero.classList.toggle('nopanel', hid);
    $('#pnl').setAttribute('aria-pressed', !hid);
  }
  const panelVisible = () => !panel.classList.contains('hide');
  function setPanel(show){ panel.classList.toggle('hide', !show); layout(); }

  cmpA.onload = fit;
  cap.onload = () => { fit(); A.emit('img1:load', cap); };
  addEventListener('resize', () => { fit(); layout(); });
  new ResizeObserver(layout).observe(panel); new ResizeObserver(layout).observe(topbar);
  $('#pnl').onclick = () => setPanel(!panelVisible());

  // 画像1(360キャプチャ)
  function setImg1(f){
    if(!f || !f.type.startsWith('image/')) return;
    hideCompare();
    A.state.files[1] = f;
    const old = cap.src;
    cap.src = URL.createObjectURL(f); cap.style.display = 'block';
    if(old && old.startsWith('blob:')) URL.revokeObjectURL(old);
    $('#capEmpty').style.display = 'none';
    A.emit('img1:set', f);
  }
  $('#chg').onclick = () => $('#f1').click();
  $('#f1').onchange = e => setImg1(e.target.files[0]);

  // 比較スライダー
  function setPos(p){ p = Math.max(0, Math.min(100, p)); cmp.style.setProperty('--pos', p+'%'); knob.setAttribute('aria-valuenow', Math.round(p)); }
  let drag = false;
  const posFrom = e => { const r = cmp.getBoundingClientRect(); setPos((e.clientX-r.left)/r.width*100); };
  cmp.addEventListener('pointerdown', e => { drag = true; cmp.setPointerCapture(e.pointerId); posFrom(e); });
  cmp.addEventListener('pointermove', e => { if(drag) posFrom(e); });
  ['pointerup','pointercancel'].forEach(t => cmp.addEventListener(t, () => { drag = false; }));
  knob.addEventListener('keydown', e => {
    const c = parseFloat(cmp.style.getPropertyValue('--pos')) || 50;
    if(e.key === 'ArrowLeft'){ e.preventDefault(); setPos(c-3); }
    if(e.key === 'ArrowRight'){ e.preventDefault(); setPos(c+3); }
  });

  // res/orig は Blob。id は履歴の識別子(任意)
  function showCompare(res, name, orig, id){
    A.emit('compare:show', {id: id || null});
    cmpUrls.forEach(u => URL.revokeObjectURL(u));
    const ur = URL.createObjectURL(res), uo = URL.createObjectURL(orig);
    cmpUrls = [ur, uo]; cur = {blob:res, name, id:id || null};
    cmpA.src = uo; cmpB.src = ur;
    fit(); setPos(50);
    cmp.style.display = 'block'; cap.style.display = 'none';
    $('#dl').href = ur; $('#dl').download = name; acts.classList.add('show');
    $('#closecmp').hidden = false;
    setPanel(false);
  }
  function hideCompare(){
    cmp.style.display = 'none'; acts.classList.remove('show'); $('#closecmp').hidden = true;
    if(cap.src) cap.style.display = 'block';
    A.emit('compare:hide');
  }
  $('#closecmp').onclick = hideCompare;
  // この結果を画像1にする → 入力パネルを再表示
  $('#use').onclick = () => {
    if(!cur) return;
    const b = cur.blob;
    setImg1(new File([b], cur.name || 'result.png', {type:b.type || 'image/png'}));
    setPanel(true); A.setStatus('');
  };

  // 戻る: 元の360タブへ(開けなければindex.html)
  $('#back').onclick = () => {
    try{
      if(window.opener && !window.opener.closed){
        window.opener.focus(); window.close();
        setTimeout(() => { location.href = 'index.html'; }, 300);
        return;
      }
    }catch(e){}
    location.href = 'index.html';
  };
  // 360ツアーからのキャプチャ受信(handshake)
  if(window.opener){
    addEventListener('message', async e => {
      if(e.source !== window.opener || !e.data || e.data.type !== 'ai-capture') return;
      try{
        const b = await (await fetch(e.data.dataUrl)).blob();
        setImg1(new File([b], 'capture360.jpg', {type:'image/jpeg'}));
      }catch(err){ A.setStatus('360キャプチャの読み込みに失敗しました。', true); }
    });
    window.opener.postMessage({type:'ai-ready'}, '*');
  }
  A.viewer = {setImg1, showCompare, hideCompare, fit, layout, setPanel, panelVisible, isCompare: () => cmp.style.display === 'block'};
})(window.AI);
