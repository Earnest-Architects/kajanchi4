/* api.js — ComfyUI(server.py経由)との通信: アップロード → /prompt → /history をポーリング → /view */
(function(A){
  async function upload(file){
    const ext = (file.name.split('.').pop() || 'png').toLowerCase();
    const name = `web_${Date.now()}_${Math.random().toString(36).slice(2,6)}.${ext}`;
    const fd = new FormData(); fd.append('image', file, name); fd.append('overwrite', 'true');
    const r = await fetch(A.server.base()+'/upload/image', {method:'POST', body:fd, headers:A.server.hdr()});
    if(r.status === 401) throw new Error('アクセスキーが違います。');
    if(!r.ok) throw new Error('画像のアップロードに失敗しました ('+r.status+')');
    const j = await r.json();
    return j.subfolder ? j.subfolder+'/'+j.name : j.name;
  }
  // img1: File / img2: File|null / onStage('upload'|'queue'|'gen') / onTick(秒)
  async function runEdit({img1, img2, prompt, onStage, onTick}){
    const {WORKFLOW, NODE} = A, S = A.server;
    onStage('upload');
    const [n1, n2] = await Promise.all([upload(img1), img2 ? upload(img2) : null]);
    const wf = structuredClone(WORKFLOW);
    wf[NODE.img1].inputs.image = n1;
    if(n2){
      wf[NODE.img2].inputs.image = n2;
    }else{
      // 画像2なし: Load Image 2 を外し、それを参照する入力を削除(プロンプトのみで画像1を編集)
      for(const n of Object.values(wf))
        for(const [k, v] of Object.entries(n.inputs))
          if(Array.isArray(v) && v[0] === NODE.img2) delete n.inputs[k];
      delete wf[NODE.img2];
    }
    wf[NODE.enc].inputs.prompt = prompt;
    wf[NODE.enc].inputs.negative_prompt = '';
    wf[NODE.sampler].inputs.seed = Math.floor(Math.random()*1e15);
    onStage('queue');
    const r = await fetch(S.base()+'/prompt', {method:'POST', headers:S.hdr({'Content-Type':'application/json'}),
      body: JSON.stringify({prompt: wf, client_id: 'web-'+Date.now()})});
    const j = await r.json().catch(() => ({}));
    if(r.status === 401) throw new Error('アクセスキーが違います。');
    if(!r.ok){
      const ne = j.node_errors ? Object.values(j.node_errors).map(n => n.errors.map(e => e.message+(e.details ? ': '+e.details : '')).join('; ')).join(' | ') : '';
      throw new Error((j.error && j.error.message || 'ワークフローが拒否されました') + (ne ? ' - '+ne : ''));
    }
    const id = j.prompt_id, t0 = Date.now();
    onStage('gen');
    for(;;){
      await A.sleep(1200);
      onTick && onTick(Math.round((Date.now()-t0)/1000));
      const h = await (await fetch(S.base()+'/history/'+id, {headers:S.hdr()})).json();
      const e = h[id];
      if(!e) continue;
      if(e.status && e.status.status_str === 'error') throw new Error('ComfyUIで実行エラーが発生しました。ログを確認してください。');
      if(e.outputs && Object.keys(e.outputs).length){
        let imgs = (e.outputs[NODE.save] || {}).images;
        if(!imgs) for(const o of Object.values(e.outputs)){ if(o.images && o.images.some(i => i.type === 'output')){ imgs = o.images.filter(i => i.type === 'output'); break; } }
        if(!imgs || !imgs.length) throw new Error('完了しましたが、結果画像がありません。');
        const i = imgs[0];
        const url = S.base()+'/view?filename='+encodeURIComponent(i.filename)+'&subfolder='+encodeURIComponent(i.subfolder || '')+'&type='+i.type;
        return {blob: await (await fetch(url, {headers:S.hdr()})).blob(), name: i.filename};
      }
    }
  }
  A.api = {upload, runEdit};
})(window.AI);
