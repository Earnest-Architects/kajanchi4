/* composer.js — 下部の入力カード: 画像2(任意)・プロンプト欄の自動伸縮・生成ボタン */
(function(A){
  const $ = A.$, box = $('#d2'), input = box.querySelector('input'), pos = $('#pos');
  const show = f => {
    if(!f || !f.type.startsWith('image/')) return;
    A.state.files[2] = f;
    box.querySelectorAll('img').forEach(i => i.remove());
    const img = new Image(); img.alt = ''; img.src = URL.createObjectURL(f); box.append(img);
    box.classList.add('has');
  };
  box.onclick = () => input.click();
  box.onkeydown = e => { if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); input.click(); } };
  input.onchange = () => show(input.files[0]);
  box.ondragover = e => { e.preventDefault(); box.classList.add('over'); };
  box.ondragleave = () => box.classList.remove('over');
  box.ondrop = e => { e.preventDefault(); box.classList.remove('over'); show(e.dataTransfer.files[0]); };

  const grow = () => { pos.style.height = 'auto'; pos.style.height = Math.min(pos.scrollHeight, innerHeight*.3)+'px'; };
  pos.addEventListener('input', grow);
  pos.addEventListener('keydown', e => { if(e.key === 'Enter' && (e.ctrlKey || e.metaKey)){ e.preventDefault(); A.generate(); } });
  $('#go').onclick = () => A.generate();
})(window.AI);
