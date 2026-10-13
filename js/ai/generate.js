/* generate.js — 生成フローの司令塔: 赤マーク合成 → API → 進捗 → 比較表示 → 履歴保存 */
(function(A){
  const $ = A.$;
  // 赤マークがあるときだけ、Qwenへ追加指示を付ける(入力欄の文字は変えない)
  const MARK_HINT = '. Only edit the areas marked in red in image 1. Remove the red marks completely in the result. Keep everything else unchanged.';
  A.generate = async () => {
    const btn = $('#go'), prompt = $('#pos').value.trim(), files = A.state.files;
    if(!files[1]) return A.setStatus('画像1(360キャプチャ)がありません。右上の画像アイコンから選んでください。', true);
    if(!prompt) return A.setStatus('プロンプトを入力してください。', true);
    btn.disabled = true;
    const t0 = Date.now(), orig = files[1]; // origは常に「マークなしの元画像」
    A.progress.start();
    try{
      let src1 = orig, send = prompt;
      if(A.paint.hasMarks()){ src1 = await A.paint.compose(); send = prompt.replace(/[\s.。!！]+$/, '') + MARK_HINT; }
      A.setStatus('画像をアップロード中…');
      const res = await A.api.runEdit({
        img1: src1, img2: files[2], prompt: send,
        onStage: k => { A.progress.stage(k); A.setStatus({upload:'画像をアップロード中…', queue:'ComfyUIに送信中…', gen:'生成中…'}[k]); },
        onTick: () => A.setStatus('生成中… '+Math.round((Date.now()-t0)/1000)+' 秒')
      });
      const dur = Date.now()-t0; A.progress.learn(dur);
      await A.progress.complete();
      const id = Date.now().toString(36)+Math.random().toString(36).slice(2,6);
      A.viewer.showCompare(res.blob, res.name, orig, id);
      A.progress.stop(true);
      A.setStatus(Math.round(dur/1000)+' 秒で完了しました。');
      A.history.save({id, ts:Date.now(), prompt, name:res.name, result:res.blob, original:orig});
    }catch(err){
      A.setStatus(err.message.includes('Failed to fetch') ? 'PCに接続できません。'+A.server.mixedHint()+' 右上の設定アイコンから接続テストを行ってください。' : err.message, true);
    }finally{ A.progress.stop(); btn.disabled = false; }
  };
})(window.AI);
