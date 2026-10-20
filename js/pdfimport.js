/* ---- import equipment specs from a datasheet PDF (read in the browser, nothing is uploaded) ---- */
const PDFJS_VER='3.11.174';
let pdfLibP=null;
function loadPdfJs(){
  if(typeof window!=='undefined'&&window.pdfjsLib)return Promise.resolve(window.pdfjsLib);
  if(pdfLibP)return pdfLibP;
  const tryLoad=src=>new Promise((res,rej)=>{const s=document.createElement('script');s.src=src;s.onload=res;s.onerror=()=>rej(new Error(src));document.head.appendChild(s)});
  pdfLibP=(async()=>{
    for(const b of ['vendor/','https://cdn.jsdelivr.net/npm/pdfjs-dist@'+PDFJS_VER+'/build/']){
      try{await tryLoad(b+'pdf.min.js');if(!window.pdfjsLib)continue;window.pdfjsLib.GlobalWorkerOptions.workerSrc=b+'pdf.worker.min.js';return window.pdfjsLib}catch(e){}
    }
    pdfLibP=null;throw new Error('lib');
  })();
  return pdfLibP;
}
/* text items -> lines; far-apart items are separated by two spaces so table cells can be split */
function dsGroupLines(items,tol,gapMin){
  tol=tol||3;gapMin=gapMin||12;
  items.sort((a,b)=>b.y-a.y||a.x-b.x);
  const rows=[];
  items.forEach(it=>{const r=rows.find(r=>Math.abs(r.y-it.y)<=tol);if(r)r.it.push(it);else rows.push({y:it.y,it:[it]})});
  rows.sort((a,b)=>b.y-a.y);
  return rows.map(r=>{
    r.it.sort((a,b)=>a.x-b.x);let s='',end=null;
    r.it.forEach(i=>{if(end!==null){const gap=i.x-end;s+=gap>gapMin?'  ':(gap>1&&!/\s$/.test(s)&&!/^\s/.test(i.s)?' ':'')}s+=i.s;end=i.x+(i.w||0)});
    return s.replace(/\s+$/,'');
  }).filter(l=>l.trim());
}
async function pdfToLines(buf){
  const lib=await loadPdfJs(),doc=await lib.getDocument({data:new Uint8Array(buf.slice(0))}).promise,out=[];
  for(let p=1;p<=Math.min(doc.numPages,15);p++){
    const pg=await doc.getPage(p),tc=await pg.getTextContent();
    out.push(...dsGroupLines(tc.items.filter(i=>i.str&&i.str.trim()).map(i=>({s:i.str,x:i.transform[4],y:i.transform[5],w:i.width}))));
  }
  return out.map(dsNorm);
}

const dsNorm=t=>String(t).replace(/[₀-₉]/g,c=>String(c.charCodeAt(0)-8320)).replace(/\t/g,'  ').replace(/[–−]/g,'-');
/* ---- OCR for scanned (image-only) PDFs ---- */
let tessP=null;
function loadTesseract(){
  if(tessP)return tessP;
  const cdn='https://cdn.jsdelivr.net/npm/';
  const abs=u=>new URL(u,document.baseURI).href;
  const sets=[
    {js:'vendor/ocr/tesseract.min.js',cfg:{workerPath:abs('vendor/ocr/worker.min.js'),corePath:abs('vendor/ocr/'),langPath:abs('vendor/ocr/')}},
    {js:cdn+'tesseract.js@5.1.1/dist/tesseract.min.js',cfg:{workerPath:cdn+'tesseract.js@5.1.1/dist/worker.min.js',corePath:cdn+'tesseract.js-core@5.1.1',langPath:cdn+'@tesseract.js-data/eng/4.0.0_best_int'}}
  ];
  tessP=(async()=>{
    for(const st of sets){
      try{
        if(!window.Tesseract)await new Promise((res,rej)=>{const e=document.createElement('script');e.src=st.js;e.onload=res;e.onerror=()=>rej();document.head.appendChild(e)});
        if(window.Tesseract)return{T:window.Tesseract,cfg:st.cfg};
      }catch(e){}
    }
    tessP=null;throw new Error('ocrlib');
  })();
  return tessP;
}
async function ocrLines(buf,onProg){
  const lib=await loadPdfJs(),doc=await lib.getDocument({data:new Uint8Array(buf.slice(0))}).promise,{T,cfg}=await loadTesseract();
  const worker=await T.createWorker('eng',1,Object.assign({logger:m=>{if(onProg&&m.status==='recognizing text')onProg(m.progress)}},cfg));
  const out=[];
  try{
    for(let p=1;p<=Math.min(doc.numPages,3);p++){
      const pg=await doc.getPage(p),vp=pg.getViewport({scale:2.2}),cv=document.createElement('canvas');
      cv.width=Math.round(vp.width);cv.height=Math.round(vp.height);
      const ctx=cv.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,cv.width,cv.height);
      await pg.render({canvasContext:ctx,viewport:vp}).promise;
      const {data}=await worker.recognize(cv);
      const items=(data.words||[]).filter(w=>w.text&&w.text.trim()&&w.confidence>25).map(w=>({s:w.text,x:w.bbox.x0,y:-(w.bbox.y0+w.bbox.y1)/2,w:w.bbox.x1-w.bbox.x0}));
      out.push(...dsGroupLines(items,12,45));
    }
  }finally{await worker.terminate()}
  return out.map(dsNorm);
}

/* ---- parsing ---- */
function dsNums(s){
  const t=String(s).replace(/(\d)\s*[-–~]\s*(?=\d)/g,'$1 ').replace(/−/g,'-'),out=[];
  t.replace(/(?<![\w.])[-+]?\d+(?:\.\d+)?/g,m=>{out.push(parseFloat(m))});return out;
}
const dsKw=l=>/\(\s*kw\s*\)|\bkw\b/i.test(l)?1000:1;
function dsRows(lines){
  const P=lines.map(l=>{
    let c=l.split(/\s{2,}/).map(x=>x.trim()).filter(Boolean);
    if(c.length===1){const m=/^([^:：]{3,60})[:：]\s*(.+)$/.exec(c[0]);if(m)c=[m[1],m[2]]}
    /* label and first number separated by a single space */
    if(c.length&&c[0]){const m=/^(.*[A-Za-z)\]:])\s+([-+<>≤≥~]?\d[\d.,+\-\/%±]*(?:°C|℃|°)?(?:\/?(?:°C|K))?(?:\s?(?:V|A|W|kW|Wp|Ah|kWh))?)$/.exec(c[0]);if(m&&m[1].length>=3&&!/\b(to|of|at|than|and|or|by|for|with|up)$/i.test(m[1]))c=[m[1],m[2],...c.slice(1)]}
    return{c,raw:l,skip:false};
  });
  const valOnly=p=>p.c.length>0&&p.c.every(x=>/^[<>~≤≥]?[-+]?\d/.test(x));
  const labOnly=p=>p.c.length===1&&/[A-Za-z]/.test(p.c[0])&&!/\d/.test(p.c[0].replace(/\([^)]*\)/g,''));
  const unit=p=>/\([^)]*\)\s*$|\/\s*$|:\s*$/.test(p.c[0]);
  /* a label and its numbers can land on neighbouring lines when the table cell is vertically centred */
  P.forEach((p,i)=>{
    if(!valOnly(p))return;
    const pv=P[i-1],nx=P[i+1],pl=pv&&!pv.skip&&labOnly(pv),nl=nx&&labOnly(nx);
    let t=null;
    if(pl&&nl)t=unit(nx)&&!unit(pv)?nx:(unit(pv)?pv:null);else if(pl&&unit(pv))t=pv;else if(nl&&unit(nx))t=nx;
    if(t){t.c.push(...p.c);t.raw=t.raw+' | '+p.raw;p.skip=true}
  });
  return P.filter(p=>!p.skip&&p.c[0]).map(p=>({label:p.c[0]||'',vals:p.c.slice(1),raw:p.raw})).filter(r=>r.vals.length&&r.vals.some(v=>/\d/.test(v)));
}
const DS_SPECS={
  inverters:[
    {k:'mppt',re:/(mppt|mpp).*(range)|operating.*volt.*range|dc.*volt.*range/,not:/full|rated|max\./},
    {k:'vmax',re:/max.*(pv|dc|input).*volt/,not:/mppt|start|current|rang|power|short|output|batt|\bac\b/},
    {k:'start',re:/start.?up|starting.*volt|start.*volt/,not:/current|power|batt/},
    {k:'imax',re:/max.*(operating|input|dc|pv).*current|input current per/,not:/short|isc|output|\bac\b|batt|charg/},
    {k:'isc',re:/short.?circuit/,not:/\bac\b|output|protect/},
    {k:'pac',re:/rated.*(ac|output).*power|nominal.*ac.*power|rated.*power.*\bac\b|ac.*rated.*power|rated output/,not:/apparent|max|\bdc\b|input|batt|backup|eps|peak|reactive|current|voltage|frequen|protect/},
    {k:'pacAlt',re:/max.*(ac)?.*output.*(apparent)?.*power|max.*ac.*power/,not:/dc|input|batt|backup|eps|peak|current/},
    {k:'pvRec',re:/max.*(pv|dc).*(input)?.*power|recommended.*pv|max.*dc.*power/,not:/\bac\b|output|batt|current|voltage/},
    {k:'eff',re:/max.*effic/,not:/mppt/},
    {k:'bvr',re:/batt.*volt|bat.*volt.*range/,not:/current|charg|discharg|power/},
    {k:'bchg',re:/max.*charg.*power|charg.*power/,not:/current|\(a\)/},
    {k:'bdis',re:/max.*discharg.*power|discharg.*power/,not:/current|\(a\)/},
    {k:'backupKw',re:/(backup|back-up|eps|off.?grid).*(rated)?.*power|rated.*(backup|eps)/,not:/voltage|current|switch|time|frequen/},
    {k:'trk',re:/no\.?\s*of\s*mpp|number of mppt|mppt.*(number|quantity)/}
  ],
  panels:[
    {k:'pmax',re:/maximum power|\bpmax\b|rated power|peak power|nominal.*max.*power/,not:/temp|toler|volt|current|noct|gain|coef/},
    {k:'voc',re:/open.?circuit volt|\bvoc\b/,not:/temp|coef|max/},
    {k:'vmp',re:/volt.*(at|@).*max.*power|\bvmpp?\b|max.*power.*volt|optimum operating volt/,not:/temp|coef/},
    {k:'isc',re:/short.?circuit current|\biscs?\b/,not:/temp|coef/},
    {k:'imp',re:/current.*(at|@).*max.*power|\bimpp?\b|max.*power.*current|optimum operating current/,not:/temp|coef/},
    {k:'kVoc',re:/temp.*coef.*voc|voc.*temp|coef.*\bvoc\b/},
    {k:'kPmax',re:/temp.*coef.*(pmax|power|p\s*max)|(pmax|power).*temp.*coef/},
    {k:'kIsc',re:/temp.*coef.*isc|isc.*temp|coef.*\bisc\b/},
    {k:'noct',re:/\bnoct\b|nominal operating cell/}
  ],
  batteries:[
    {k:'vah',re:/volt.*capacity|capacity.*volt/},
    {k:'v',re:/nominal.*volt|rated.*volt|^voltage/,not:/charge|cut|\bmax|\bmin\b|float|range|capacity/},
    {k:'ah',re:/(rated|nominal|battery)?.*capacity.*\(?\bah\b|capacity.*\(ah\)/,not:/kwh/},
    {k:'kwh',re:/energy|capacity.*kwh|usable.*kwh/},
    {k:'dod',re:/depth of discharge|\bdod\b/},
    {k:'rt',re:/round.?trip|charge.*effic|efficiency/},
    {k:'maxChg',re:/(max|continuous)[^/]*(?<!dis)charge[^/]*current/,not:/discharg|peak|pulse|recommend|\bsec\b/},
    {k:'bisc',re:/short.?circuit/,not:/protect/},
    {k:'maxA',re:/(max|continuous)[^/]*discharge[^/]*current/,not:/peak|pulse|\bsec\b|recommend/}
  ]
};
const DS_BRANDS=[['deye','Deye'],['solis','Solis'],['ginlong','Solis'],['growatt','Growatt'],['huawei','Huawei'],['sungrow','Sungrow'],['longi','LONGi'],['jinko','JinkoSolar'],['trina','Trina Solar'],['canadian solar','Canadian Solar'],['ja solar','JA Solar'],['risen','Risen'],['aiko','AIKO'],['victron','Victron'],['sma ','SMA'],['fronius','Fronius'],['goodwe','GoodWe'],['sofar','SOFAR'],['invt','INVT'],['pylontech','Pylontech'],['byd','BYD'],['dyness','Dyness'],['felicity','Felicity'],['sigenergy','Sigenergy'],['srne','SRNE'],['must ','Must'],['hoymiles','Hoymiles'],['enphase','Enphase'],['tsun','TSUN'],['sunsynk','Sunsynk'],['lg energy','LG'],['tesla','Tesla'],['seplos','Seplos']];
function dsKind(txt){
  const t=txt.toLowerCase(),c=re=>(t.match(re)||[]).length;
  const inv=c(/mppt|inverter|ac output|grid connection|anti-islanding|island protection/g)*2+c(/\bmppt\b/g);
  const pan=c(/\bstc\b|solar cell|module|bifacial|\bvoc\b|pmax|noct|mono(crystalline)?|perc|topcon|hjt/g)*2;
  const bat=c(/lifepo4|lfp|cycle life|\bbms\b|kwh|depth of discharge|\bdod\b|nominal capacity|battery type|nominal battery|state of charge/g)*2;
  const m=Math.max(inv,pan,bat);
  if(!m)return'inverters';
  return m===inv?'inverters':m===pan?'panels':'batteries';
}
const DS_BRANDS_RE=/\b(deye|solis|ginlong|growatt|huawei|sungrow|longi|jinko(solar)?|trina( solar)?|canadian solar|ja solar|risen|aiko|victron|sma|fronius|goodwe|sofar|invt|pylontech|byd|dyness|felicity|srne|hoymiles|enphase|tsun|sunsynk|tesla)\b/ig;
function dsModels(lines,kind){
  const get=l=>l.split(/\s{2,}/).map(x=>x.trim()).filter(Boolean);
  const tok=c=>c.length&&c.length<=6&&c.every(x=>!/\s/.test(x)&&x.length>=2&&/[A-Za-z0-9]/.test(x));
  const find=re=>lines.findIndex(l=>re.test(l));
  let ix=find(/^\s*(model|module type|product model)\b\s*([:：]|\s{2,}|$)/i);
  if(ix<0)ix=find(/^\s*type\s+\S+\s+\S+/i);
  let cands=[];
  if(ix>=0){
    let inl=get(lines[ix]).slice(1);
    if(inl.length===1&&/\s/.test(inl[0])&&inl[0].split(/\s+/).every(x=>/\d/.test(x)&&/[A-Za-z]/.test(x)))inl=inl[0].split(/\s+/);
    const rows=[];
    if(inl.length)rows.push(inl);
    for(let j=Math.max(0,ix-1);j<=Math.min(lines.length-1,ix+2);j++){
      if(j===ix)continue;
      const c=get(lines[j]);if(tok(c))rows.push(c);
    }
    const base=rows.find(r=>r.some(x=>/\d/.test(x)&&/[A-Za-z]/.test(x)&&!/^[-_/]/.test(x)))||(inl.length&&inl.every(x=>x.length>=3&&x.length<=40&&/[A-Za-z]/.test(x))?inl:null);
    if(base){
      const out=base.slice();
      rows.forEach(r=>{if(r!==base)r.forEach((x,i)=>{if(i<out.length&&/^[-_/]/.test(x))out[i]+=x})});
      cands=out.filter(x=>/[A-Za-z]/.test(x)&&(/\d/.test(x)||base===inl));
    }
  }
  if(!cands.length){
    const head=lines.slice(0,25).join('\n');
    const m=/\b([A-Z][A-Z0-9]*-[A-Z]*)(\d{2,4})\/(\d{2,4})([A-Z0-9-]*)/.exec(head);
    if(m)cands=[m[1]+m[2]+m[4],m[1]+m[3]+m[4]];
    else{const m2=/\b[A-Z][A-Za-z0-9]*[-][A-Za-z0-9-]*\d[A-Za-z0-9-]*\b/.exec(head);if(m2)cands=[m2[0]];
      else{
        const t=(lines[0]||'').replace(/\b(battery|module|inverter|datasheet|data sheet|specifications?|series|solar|energy storage|lithium|bifacial|mono|n-type|p-type|hybrid)\b/ig,' ').replace(DS_BRANDS_RE,' ').replace(/\s+/g,' ').trim();
        if(t&&/\d/.test(t))cands=[t.slice(0,40)];
      }}
  }
  return cands;
}
function dsParse(lines,forceKind){
  const text=lines.join('\n'),kind=(forceKind&&forceKind!=='auto')?forceKind:dsKind(text);
  const rows=dsRows(lines),specs=DS_SPECS[kind];
  let models=dsModels(lines,kind);
  const low=text.toLowerCase();
  let brand='',bn=0;{const bt=lines.filter(l=>!/compatib|supported|works with/i.test(l)).join('\n').toLowerCase();for(const [k,v] of DS_BRANDS){const n=bt.split(k).length-1;if(n>bn){bn=n;brand=v}}}
  /* first matching row for each key */
  const hit={};
  specs.forEach(sp=>{
    for(const r of rows){
      const lb=r.label.toLowerCase();
      if(sp.re.test(lb)&&!(sp.not&&sp.not.test(lb))&&r.vals.some(v=>dsNums(v).length)){hit[sp.k]=r;break}
    }
  });
  /* panels: several power classes in one table -> one candidate per class */
  let n=Math.max(1,models.length);
  if(kind==='panels'&&hit.pmax){
    const pv=hit.pmax.vals.map(v=>dsNums(v)[0]).filter(x=>x>50);
    if(models.length===pv.length&&pv.length>=2){n=models.length}
    else if(pv.length>=3&&pv.every((x,i)=>i===0||x>=pv[i-1])){
      const base=models[0]||(lines.find(l=>/[A-Za-z]+[-\s]?[A-Za-z0-9]*\d/.test(l))||'').split(/\s{2,}/)[0].slice(0,30);
      models=pv.map(p=>`${base} ${p} W`.trim());n=models.length;
    }
  }
  const trk=hit.trk?dsNums(hit.trk.vals[0])[0]:0;
  const cands=[];
  for(let i=0;i<n;i++){
    const raw={},src={};
    const val=(k)=>{const r=hit[k];if(!r)return null;const cell=r.vals.length>=n&&n>1?r.vals[i]:r.vals[0];const nu=dsNums(cell);return nu.length?{n:nu,r,lab:r.label}:null};
    const put=(key,v,r)=>{if(v!=null&&isFinite(v)){raw[key]=Math.round(v*1000)/1000;src[key]=r.raw.trim().slice(0,120)}};
    const g=(k,pickfn)=>{const o=val(k);if(!o)return;put(k,pickfn(o.n,o.lab),o.r)};
    if(kind==='inverters'){
      const m=val('mppt');if(m&&m.n.length>=2){put('lo',Math.min(m.n[0],m.n[1]),m.r);put('hi',Math.max(m.n[0],m.n[1]),m.r)}
      g('vmax',a=>a[0]);g('start',a=>a[0]);g('imax',a=>a[0]);g('isc',a=>a[0]);
      g('pac',(a,l)=>a[0]*dsKw(l));
      if(raw.pac==null){const o=val('pacAlt');if(o)put('pac',o.n[0]*dsKw(o.lab),o.r)}
      g('pvRec',(a,l)=>Math.max(...a)*dsKw(l));
      g('eff',a=>a.find(x=>x>50&&x<=100)||a[0]);
      const b=val('bvr');if(b&&b.n.length>=2){put('bvMin',Math.min(b.n[0],b.n[1]),b.r);put('bvMax',Math.max(b.n[0],b.n[1]),b.r)}
      const kwOf=(x,l)=>/\(\s*kw\s*\)/i.test(l)?x:/\(\s*w\s*\)/i.test(l)?x/1000:(x>100?x/1000:x);
      g('bchg',(a,l)=>kwOf(a[0],l));g('bdis',(a,l)=>kwOf(a[0],l));g('backupKw',(a,l)=>kwOf(a[0],l));
      raw.phase=/three[- ]?phase|3[- ]?phase|3w\s*\/\s*n|\b3p\b|l1.{0,20}l2.{0,20}l3|380\s*v.{0,6}ac|400\s*vac|380\s*\/\s*220|220\s*v?\s*ac\s*\/\s*380/i.test(text)?'3':'1';
      if(raw.phase==='3'&&/asymmetric|unbalanced/i.test(text))raw.asym='1';
      raw.type=/hybrid|battery|\bbms\b|energy storage|backup/i.test(text)&&(raw.bvMin||/hybrid|backup|eps/i.test(text))?'hybrid':(/off.?grid/i.test(text)&&!/grid.?tie|on.?grid|utility-interactive|grid connection/i.test(text)?'off-grid':'on-grid');
      const notes=[];
      if(trk>2)notes.push(`มี ${trk} MPPT (ตัวจำลองใช้ได้ 2 MPPT) ค่าต่อ MPPT`);
      if(/micro\s?inverter/i.test(text))notes.push('ไมโครอินเวอร์เตอร์');
      raw.note=(notes.join(' · ')+(notes.length?' · ':'')+'นำเข้าจาก PDF ตรวจกับ datasheet ก่อนใช้').trim();
    }else if(kind==='panels'){
      g('pmax',a=>a[0]);g('voc',a=>a[0]);g('vmp',a=>a[0]);g('isc',a=>a[0]);g('imp',a=>a[0]);
      g('kVoc',a=>a[0]);g('kPmax',a=>a[0]);g('kIsc',a=>a[0]);g('noct',a=>a[0]);
      ['kVoc','kPmax','kIsc'].forEach(k=>{if(raw[k]!=null&&Math.abs(raw[k])>5)delete raw[k]});
      if(raw.pmax==null){const mm=/(\d{3})\s?w/i.exec(models[i]||'');if(mm)raw.pmax=+mm[1]}
      raw.note='นำเข้าจาก PDF ตรวจกับ datasheet ก่อนใช้ (ค่าที่ STC)';
    }else{
      const va=val('vah');if(va&&va.n.length>=2){put('v',va.n[0],va.r);put('ah',va.n[1],va.r)}
      g('v',a=>a[0]);g('ah',a=>a[0]);
      const kw=val('kwh');if(kw)put('kwh',kw.n[0]*(/\bwh\b/i.test(kw.lab)&&!/kwh/i.test(kw.lab)?.001:1),kw.r);
      g('dod',a=>a.find(x=>x>0&&x<=100)||a[0]);g('rt',a=>a.find(x=>x>50&&x<=100)||a[0]);
      raw.chem=/lifepo|lfp|lithium iron/i.test(text)?'LiFePO4':/nmc|li-ion|lithium-ion|ncm/i.test(text)?'Li-ion':/lead|agm|\bgel\b/i.test(text)?'Lead':'Other';
      {const o=val('maxA');if(o)put('maxDis',o.n[0],o.r);const sc=val('bisc');if(sc)put('isc',sc.n[0],sc.r);const mc=val('maxChg');if(mc)put('maxChg',mc.n[0],mc.r)}
      const ma=val('maxA');if(ma&&raw.ah){const c=ma.n[0]/raw.ah;if(c>0&&c<=5){raw.maxC=Math.round(c*100)/100;src.maxC=ma.r.raw.trim().slice(0,120)}}
      raw.note='นำเข้าจาก PDF ตรวจกับ datasheet ก่อนใช้';
    }
    raw.brand=brand;raw.model=models[i]||'';
    cands.push({raw,src});
  }
  return{kind,brand,cands,rows:rows.length};
}

/* ---- review UI ---- */
function pdfFieldHTML(kind,ci,f,c){
  const [k,label,ty,def,opts]=f,v=c.raw[k],found=v!=null&&v!==''&&c.src[k],req=SCHEMA[kind].req.includes(k);
  const val=v!=null?v:(ty==='n'?'':def);
  let inp;
  if(ty==='s')inp=`<select data-pf="${k}">${(opts||[]).map(o=>`<option value="${esc(o[0])}"${String(o[0])===String(val)?' selected':''}>${esc(o[1])}</option>`).join('')}</select>`;
  else inp=`<input data-pf="${k}" type="${ty==='n'?'number':'text'}"${ty==='n'?' step="any" inputmode="decimal"':''} value="${esc(val)}">`;
  return`<label class="pff ${found?'found':(req&&(val===''||val==null)?'miss':'')}" ${found?`title="${esc('พบในไฟล์: '+c.src[k])}"`:''}>${esc(label)}${found?' <i>พบใน PDF</i>':(req&&(val===''||val==null)?' <i>ไม่พบ กรอกเอง</i>':'')}${inp}</label>`;
}
function pdfReviewHTML(res,fname){
  const kind=res.kind,sc=SCHEMA[kind];
  return`<div class="pdfhead"><b>${esc(fname)}</b> · ตรวจพบเป็น <b>${esc(sc.title)}</b> · ${res.cands.length} รุ่น · อ่านได้ ${res.rows} แถวที่มีตัวเลข
    <label class="pfk">ชนิด<select id="pdfkind2">${KIND_ORDER.map(k=>`<option value="${k}"${k===kind?' selected':''}>${esc(SCHEMA[k].title)}</option>`).join('')}</select></label></div>
    <p class="hint tight">ตรวจค่าทุกช่องก่อนเพิ่ม ช่องสีเหลืองคือค่าที่หาไม่พบ ต้องกรอกเอง การอ่าน PDF เป็นการเดาจากข้อความในตาราง อาจผิดได้โดยเฉพาะ PDF ที่มีหลายคอลัมน์</p>`
    +res.cands.map((c,ci)=>`<div class="pdfcand" data-ci="${ci}"><label class="chk"><input type="checkbox" data-pc checked> เพิ่มรุ่น <b>${esc(c.raw.model||'(ไม่พบชื่อรุ่น)')}</b></label><div class="pfgrid">${sc.fields.filter(f=>f[0]!=='note'||true).filter(f=>!(f[5]==='hyb'&&c.raw.type==='on-grid')).map(f=>pdfFieldHTML(kind,ci,f,c)).join('')}</div></div>`).join('')
    +`<div class="eqact"><button class="btn pri" id="pdfadd">เพิ่มเข้าแคตตาล็อก</button><button class="btn" id="pdfcancel">ยกเลิก</button><span class="eqmsg" id="pdfmsg2" role="status"></span></div>`;
}
let PDFSTATE=null;
async function pdfPick(file){
  const msg=document.getElementById('pdfmsg'),rev=document.getElementById('pdfrev');
  rev.hidden=true;msg.className='eqmsg';
  if(!file)return;
  if(file.size>15*1024*1024){msg.className='eqmsg err';msg.textContent='ไฟล์ใหญ่เกิน 15 MB';return}
  msg.textContent='กำลังอ่าน '+file.name+' …';
  try{
    const buf=await file.arrayBuffer();let lines=await pdfToLines(buf),ocr=false;
    if(lines.join('').replace(/\s/g,'').length<80){
      /* image-only PDF: read it with OCR (runs in the browser) */
      msg.textContent='PDF นี้เป็นภาพ กำลังทำ OCR อ่านตัวอักษร (ครั้งแรกอาจใช้เวลาครึ่งนาที) …';
      lines=await ocrLines(buf,p=>{msg.textContent='PDF นี้เป็นภาพ กำลังทำ OCR … '+Math.round(p*100)+'%'});ocr=true;
      if(lines.join('').replace(/\s/g,'').length<40){msg.className='eqmsg err';msg.textContent='OCR อ่านตัวอักษรจากภาพไม่ได้ ลองใช้ภาพที่ชัดขึ้น หรือวางข้อความด้านล่างแทน';return}
    }
    PDFSTATE={lines,name:file.name};
    pdfShow();
    msg.className='eqmsg ok';msg.textContent=(ocr?'อ่านจากภาพด้วย OCR แล้ว ตัวเลขอาจเพี้ยน ตรวจให้ดี · ':'อ่านไฟล์แล้ว · ')+'ตรวจค่าด้านล่างแล้วกด "เพิ่มเข้าแคตตาล็อก"';
  }catch(e){
    try{console.warn('pdf import',e)}catch(_){}
    msg.className='eqmsg err';
    msg.textContent=e&&e.message==='lib'?'โหลดตัวอ่าน PDF ไม่ได้ ต้องมีโฟลเดอร์ vendor หรืออินเทอร์เน็ต':e&&e.message==='ocrlib'?'โหลดตัว OCR ไม่ได้ (ต้องเปิดผ่านเว็บ ไม่ใช่เปิดไฟล์ตรงๆ หรือมีอินเทอร์เน็ต) ลองวางข้อความด้านล่างแทน':'อ่าน PDF ไม่ได้ ไฟล์อาจเสียหรือมีรหัสผ่าน';
  }
}
function pdfShow(forceKind){
  const rev=document.getElementById('pdfrev'),res=dsParse(PDFSTATE.lines,forceKind||document.getElementById('pdfkind').value);
  PDFSTATE.res=res;rev.innerHTML=pdfReviewHTML(res,PDFSTATE.name);rev.hidden=false;
}
function pdfAdd(){
  const res=PDFSTATE&&PDFSTATE.res;if(!res)return;
  const kind=res.kind,msg=document.getElementById('pdfmsg2');let added=0,updated=0;const bad=[];let last=null;
  document.querySelectorAll('#pdfrev .pdfcand').forEach(card=>{
    if(!card.querySelector('[data-pc]').checked)return;
    const raw={};card.querySelectorAll('[data-pf]').forEach(i=>raw[i.dataset.pf]=i.value);
    const {item,why}=normalizeItem(kind,raw);
    if(why.length){bad.push((raw.model||'?')+': '+why.join(', '));return}
    const ix=CAT[kind].findIndex(x=>x.id===item.id);
    if(ix>=0){CAT[kind][ix]=item;updated++}else{CAT[kind].push(item);added++}
    last=item;
  });
  if(bad.length&&!added&&!updated){msg.className='eqmsg err';msg.textContent='ยังขาดค่า: '+bad.join(' | ');return}
  if(last)ACT[ACTKEY[kind]]=last.id;
  onCatalogChange();
  document.getElementById('pdfrev').hidden=true;PDFSTATE=null;document.getElementById('pdffile').value='';
  const m=document.getElementById('pdfmsg');m.className='eqmsg ok';
  m.textContent=`เพิ่มใหม่ ${added} · แทนที่ ${updated}${bad.length?' · ข้าม '+bad.length+' รุ่นที่ขาดค่า':''} · เลือกรุ่นล่าสุดเป็นรุ่นที่ใช้จำลองแล้ว`;
}
function pdfFromText(){
  const t=document.getElementById('pdftxt').value,msg=document.getElementById('pdfmsg');
  const lines=dsNorm(t).replace(/\r/g,'').split('\n').map(l=>l.replace(/\s+$/,'')).filter(l=>l.trim());
  if(lines.length<3){msg.className='eqmsg err';msg.textContent='วางข้อความ datasheet อย่างน้อยไม่กี่บรรทัดก่อน';return}
  PDFSTATE={lines,name:'ข้อความที่วาง'};pdfShow();msg.className='eqmsg ok';msg.textContent='อ่านข้อความแล้ว ตรวจค่าด้านล่าง';
}
function initPdfImport(){
  const f=document.getElementById('pdffile');if(!f)return;
  f.addEventListener('change',()=>pdfPick(f.files[0]));
  document.getElementById('pdftxtgo').addEventListener('click',pdfFromText);
  document.getElementById('pdfkind').addEventListener('change',()=>{if(PDFSTATE)pdfShow()});
  document.getElementById('pdfrev').addEventListener('click',e=>{
    if(e.target.id==='pdfadd'&&TEACH.on)pdfAdd();
    if(e.target.id==='pdfcancel'){document.getElementById('pdfrev').hidden=true;PDFSTATE=null;f.value=''}
  });
  document.getElementById('pdfrev').addEventListener('change',e=>{if(e.target.id==='pdfkind2'&&PDFSTATE)pdfShow(e.target.value)});
}
