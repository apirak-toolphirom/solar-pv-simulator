/* ---- catalog: panels, inverters, batteries (+ import / export, storage) ---- */
const SCHEMA={
  panels:{
    title:'แผงโซลาร์',one:'แผง',
    fields:[
      ['brand','ยี่ห้อ','t',''],['model','รุ่น','t',''],
      ['pmax','Pmax (W)','n',0],['voc','Voc (V)','n',0],['vmp','Vmp (V)','n',0],['isc','Isc (A)','n',0],['imp','Imp (A)','n',0],
      ['kVoc','สัมประสิทธิ์ Voc (%/°C)','n',-0.25],['kPmax','สัมประสิทธิ์ Pmax (%/°C)','n',-0.30],['kIsc','สัมประสิทธิ์ Isc (%/°C)','n',0.05],
      ['noct','NOCT (°C)','n',43],['note','หมายเหตุ','t','']
    ],
    req:['brand','model','pmax','voc','vmp','isc','imp'],
    alias:{brand:['brand','ยี่ห้อ','manufacturer','maker'],model:['model','รุ่น','name','type'],pmax:['pmax','p','power','watt','w','wp','กำลัง'],voc:['voc'],vmp:['vmp','vmpp'],isc:['isc'],imp:['imp','impp'],
      kVoc:['kvoc','tcvoc','tempcoeffvoc','voctemp'],kPmax:['kpmax','tcpmax','tempcoeffpmax','pmaxtemp','gamma'],kIsc:['kisc','tcisc','iscTemp'],noct:['noct','noct(c)'],note:['note','หมายเหตุ','remark']}
  },
  inverters:{
    title:'อินเวอร์เตอร์',one:'อินเวอร์เตอร์',
    fields:[
      ['brand','ยี่ห้อ','t',''],['model','รุ่น','t',''],
      ['type','ชนิด','s','on-grid',[['on-grid','On-grid'],['hybrid','Hybrid'],['off-grid','Off-grid']]],
      ['pac','กำลัง AC (W)','n',0],['vmax','Vdc สูงสุด (V)','n',0],['lo','MPPT ต่ำสุด (V)','n',0],['hi','MPPT สูงสุด (V)','n',0],['start','แรงดันเริ่มทำงาน (V)','n',0],
      ['imax','กระแสอินพุตต่อ MPPT (A)','n',0],['isc','Isc สูงสุดต่อ MPPT (A)','n',0],['pvRec','PV สูงสุดที่แนะนำ (W)','n',0],['eff','ประสิทธิภาพ (%)','n',97],
      ['bvMin','แรงดันแบต ต่ำสุด (V)','n',0,null,'hyb'],['bvMax','แรงดันแบต สูงสุด (V)','n',0,null,'hyb'],
      ['bchg','ชาร์จแบตสูงสุด (kW)','n',0,null,'hyb'],['bdis','จ่ายจากแบตสูงสุด (kW)','n',0,null,'hyb'],['backupKw','กำลังขาออกโหมด Backup (kW)','n',0,null,'hyb'],
      ['note','หมายเหตุ','t','']
    ],
    req:['brand','model','pac','vmax','lo','hi','start','imax'],
    alias:{brand:['brand','ยี่ห้อ'],model:['model','รุ่น'],type:['type','ชนิด','topology'],pac:['pac','acpower','ratedac','power','กำลัง','ac'],vmax:['vmax','maxdcvoltage','vdcmax','maxvoltage'],lo:['lo','mpptmin','vmppmin','mpptlow'],hi:['hi','mpptmax','vmppmax','mppthigh'],start:['start','startvoltage','vstart'],
      imax:['imax','maxinputcurrent','impptmax','inputcurrent'],isc:['isc','maxisc','iscmax'],pvRec:['pvrec','maxpv','pvmax','maxpvpower'],eff:['eff','efficiency'],
      bvMin:['bvmin','batvmin','batteryvmin'],bvMax:['bvmax','batvmax','batteryvmax'],bchg:['bchg','chargekw','maxcharge'],bdis:['bdis','dischargekw','maxdischarge'],backupKw:['backupkw','epskw','backuppower'],note:['note','หมายเหตุ']}
  },
  batteries:{
    title:'แบตเตอรี่',one:'แบต',
    fields:[
      ['brand','ยี่ห้อ','t',''],['model','รุ่น','t',''],
      ['chem','ชนิดเซลล์','s','LiFePO4',[['LiFePO4','LiFePO4'],['Li-ion','Li-ion (NMC)'],['Lead','ตะกั่วกรด (AGM/Gel)'],['Other','อื่นๆ']]],
      ['v','แรงดันต่อลูก (V)','n',0],['ah','ความจุต่อลูก (Ah)','n',0],['dod','ใช้ได้ (DoD %)','n',90],['rt','ประสิทธิภาพชาร์จ-จ่าย (%)','n',95],['maxC','กระแสสูงสุด (C)','n',0.5],
      ['note','หมายเหตุ','t','']
    ],
    req:['brand','model','v','ah'],
    alias:{brand:['brand','ยี่ห้อ'],model:['model','รุ่น'],chem:['chem','chemistry','ชนิด','type'],v:['v','voltage','nominalvoltage','แรงดัน','vnom'],ah:['ah','capacity','ความจุ'],dod:['dod','depthofdischarge'],rt:['rt','roundtrip','efficiency','eff'],maxC:['maxc','crate','c'],kwh:['kwh','energy','ขนาด'],note:['note','หมายเหตุ']}
  }
};
const KIND_ORDER=['panels','inverters','batteries'];

const DEFAULT_CAT=()=>({
  panels:[{id:'longi-hi-mo-x10-650',brand:'LONGi',model:'Hi-MO X10 650 W',pmax:650,voc:53.9,vmp:44.56,isc:15.29,imp:14.59,kVoc:-0.20,kPmax:-0.26,kIsc:0.05,noct:43,note:'NOCT 43°C เป็นค่าสมมติ ตรวจกับแผ่นข้อมูลจริง'}],
  inverters:[
    {id:'solis-s6-gr1p6k-s',brand:'Solis',model:'S6-GR1P6K-S',type:'on-grid',pac:6000,vmax:550,lo:90,hi:550,start:100,imax:16,isc:22,pvRec:9000,eff:97,note:''},
    {id:'solis-s6-gr1p6k',brand:'Solis',model:'S6-GR1P6K',type:'on-grid',pac:6000,vmax:600,lo:90,hi:520,start:120,imax:14,isc:22,pvRec:9000,eff:97,note:''},
    {id:'example-hybrid-6k',brand:'ตัวอย่าง',model:'Hybrid 6 kW (ค่าสมมติ)',type:'hybrid',pac:6000,vmax:600,lo:90,hi:520,start:120,imax:16,isc:22,pvRec:9000,eff:97,bvMin:40,bvMax:60,bchg:6,bdis:6,backupKw:6,note:'ค่าตัวอย่างเพื่อฝึกใช้ ไม่ใช่รุ่นจริง นำเข้ารุ่นจริงของคุณแทนได้'}
  ],
  batteries:[
    {id:'example-lfp-51v-100ah',brand:'ตัวอย่าง',model:'LiFePO4 51.2 V 100 Ah (ค่าสมมติ)',chem:'LiFePO4',v:51.2,ah:100,dod:90,rt:95,maxC:0.5,note:'ค่าตัวอย่างเพื่อฝึกใช้ ไม่ใช่รุ่นจริง'}
  ]
});
let CAT=DEFAULT_CAT();
const ACT={panel:'longi-hi-mo-x10-650',inv:'solis-s6-gr1p6k-s',bat:'example-lfp-51v-100ah'};
const BANK={s:1,p:1};

const slug=s=>String(s||'').toLowerCase().replace(/[^a-z0-9ก-๙]+/g,'-').replace(/^-|-$/g,'');
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>{const n=typeof v==='number'?v:parseFloat(String(v).replace(/,/g,''));return isFinite(n)?n:NaN};

/* active selections */
const ACTKEY={panels:'panel',inverters:'inv',batteries:'bat'};
function pick(kind){const L=CAT[kind];return L.find(x=>x.id===ACT[ACTKEY[kind]])||L[0]||null}
let PV;
function curPanel(){return pick('panels')||DEFAULT_CAT().panels[0]}
function curInv(){
  const x=pick('inverters')||DEFAULT_CAT().inverters[0];
  return Object.assign({},x,{name:(x.brand+' '+x.model).trim(),eff:x.eff||97});
}
function curBat(){return pick('batteries')}
function applyActive(){const p=curPanel();PV=Object.assign({},p,{name:(p.brand+' '+p.model).trim(),noct:p.noct||43})}
applyActive();
function bankInfo(){
  const b=curBat();if(!b)return null;
  const s=Math.max(1,BANK.s|0),p=Math.max(1,BANK.p|0),V=s*b.v,Ah=p*b.ah,kwh=V*Ah/1000;
  return{b,s,p,n:s*p,V,Ah,kwh,usable:kwh*(b.dod||90)/100,rt:(b.rt||95)/100,maxC:b.maxC||0.5};
}

/* ---- import / export ---- */
function normKind(v){
  const t=String(v||'').toLowerCase().replace(/[^a-z]/g,'');
  if(t.includes('hybrid'))return'hybrid';
  if(t.includes('off'))return'off-grid';
  if(t.includes('grid')||t.includes('on'))return'on-grid';
  return'';
}
function normalizeItem(kind,raw){
  const sc=SCHEMA[kind],o={},why=[];
  const g=k=>{
    if(raw[k]!==undefined&&raw[k]!=='')return raw[k];
    const low={};Object.keys(raw).forEach(q=>low[q.toLowerCase().replace(/[^a-z0-9ก-๙()]/g,'')]=raw[q]);
    for(const a of (sc.alias[k]||[k])){const v=low[a.toLowerCase().replace(/[^a-z0-9ก-๙()]/g,'')];if(v!==undefined&&v!=='')return v}
    return undefined;
  };
  sc.fields.forEach(([k,label,ty,def,opts])=>{
    let v=g(k);
    if(ty==='n'){v=v===undefined?NaN:num(v);o[k]=isNaN(v)?(sc.req.includes(k)?NaN:def):v}
    else if(ty==='s'){
      if(k==='type')v=normKind(v)||def;else{const m=(opts||[]).find(x=>String(x[0]).toLowerCase()===String(v).toLowerCase());v=m?m[0]:def}
      o[k]=v;
    }else o[k]=v==null?def:String(v).trim();
  });
  if(kind==='batteries'&&(isNaN(o.ah)||!o.ah)){const kw=num(g('kwh'));if(!isNaN(kw)&&o.v>0)o.ah=Math.round(kw*1000/o.v*10)/10}
  sc.req.forEach(k=>{const f=sc.fields.find(x=>x[0]===k);if(f[2]==='n'?!(o[k]>0):!o[k])why.push(f[1])});
  if(kind==='panels'&&!why.length&&o.vmp>=o.voc)why.push('Vmp ต้องน้อยกว่า Voc');
  if(kind==='inverters'&&!why.length&&o.lo>=o.hi)why.push('ช่วง MPPT ไม่ถูกต้อง');
  o.id=String(raw.id||'').trim()||slug(o.brand+' '+o.model)||('x'+Date.now());
  return{item:o,why};
}
function parseCSV(text){
  const lines=text.replace(/\r/g,'').split('\n').filter(l=>l.trim());
  if(lines.length<2)return[];
  const d=[',','\t',';'].map(c=>[c,lines[0].split(c).length]).sort((a,b)=>b[1]-a[1])[0][0];
  const split=l=>{const r=[];let c='',q=false;for(let i=0;i<l.length;i++){const ch=l[i];if(q){if(ch==='"'){if(l[i+1]==='"'){c+='"';i++}else q=false}else c+=ch}else if(ch==='"')q=true;else if(ch===d){r.push(c);c=''}else c+=ch}r.push(c);return r.map(x=>x.trim())};
  const head=split(lines[0]);
  return lines.slice(1).map(l=>{const v=split(l),o={};head.forEach((h,i)=>{if(h)o[h]=v[i]});return o});
}
/* returns {added, skipped:[{row,why}], error} and merges into CAT */
function importText(text,kind){
  text=(text||'').trim();
  if(!text)return{error:'ยังไม่มีข้อมูลให้นำเข้า'};
  let groups=[];
  if(text[0]==='{'||text[0]==='['){
    let j;try{j=JSON.parse(text)}catch(e){return{error:'อ่านไฟล์ JSON ไม่ได้: '+e.message}}
    if(Array.isArray(j))groups.push([kind,j]);
    else{
      const ks=KIND_ORDER.filter(k=>Array.isArray(j[k]));
      if(ks.length)ks.forEach(k=>groups.push([k,j[k]]));else groups.push([kind,[j]]);
    }
  }else groups.push([kind,parseCSV(text)]);
  let added=0,updated=0;const skipped=[];
  groups.forEach(([k,rows])=>{
    rows.forEach((r,i)=>{
      if(!r||typeof r!=='object'){skipped.push({row:i+1,why:'รูปแบบแถวไม่ถูกต้อง'});return}
      const {item,why}=normalizeItem(k,r);
      if(why.length){skipped.push({row:`${SCHEMA[k].title} แถว ${i+1}`,why:'ขาดหรือไม่ถูกต้อง: '+why.join(', ')});return}
      const ix=CAT[k].findIndex(x=>x.id===item.id);
      if(ix>=0){CAT[k][ix]=item;updated++}else{CAT[k].push(item);added++}
    });
  });
  if(!added&&!updated&&!skipped.length)return{error:'ไม่พบรายการในข้อมูลที่ใส่'};
  return{added,updated,skipped};
}
const SAMPLE={
  panels:'brand,model,pmax,voc,vmp,isc,imp,kVoc,kPmax,kIsc,noct\nBrandX,ABC-600,600,51.5,43.2,14.9,13.9,-0.25,-0.30,0.05,44',
  inverters:'brand,model,type,pac,vmax,lo,hi,start,imax,isc,eff,bvMin,bvMax,bchg,bdis,backupKw\nBrandY,HY-5K,hybrid,5000,600,90,520,120,16,22,97,40,60,5,5,5',
  batteries:'brand,model,chem,v,ah,dod,rt,maxC\nBrandZ,LFP-5.12,LiFePO4,51.2,100,90,95,0.5'
};
function exportJSON(){return JSON.stringify({panels:CAT.panels,inverters:CAT.inverters,batteries:CAT.batteries},null,1)}

/* ---- catalog UI (equipment tab) ---- */
const EQ={edit:{panels:null,inverters:null,batteries:null}};
function fmtSummary(kind,x){
  if(kind==='panels')return`${x.pmax} W · Voc ${x.voc} V · Vmp ${x.vmp} V · Isc ${x.isc} A`;
  if(kind==='inverters')return`${({'on-grid':'On-grid','hybrid':'Hybrid','off-grid':'Off-grid'})[x.type]||x.type} · ${x.pac/1000} kW · MPPT ${x.lo}–${x.hi} V`+(x.type!=='on-grid'&&x.bvMax?` · แบต ${x.bvMin}–${x.bvMax} V`:'');
  return`${x.chem} · ${x.v} V · ${x.ah} Ah · ${f(x.v*x.ah/1000,2)} kWh`;
}
function eqListHTML(kind){
  const key=ACTKEY[kind],sc=SCHEMA[kind];
  return CAT[kind].map(x=>{
    const on=(pick(kind)||{}).id===x.id;
    return`<li class="eqrow${on?' on':''}"><label class="eqpick"><input type="radio" name="act-${kind}" value="${esc(x.id)}" ${on?'checked':''} data-act="${kind}"><span><b>${esc(x.brand)} ${esc(x.model)}</b><small>${esc(fmtSummary(kind,x))}</small>${x.note?`<small class="nt">${esc(x.note)}</small>`:''}</span></label><span class="eqbtn"><button class="btn sm" data-edit="${kind}" data-id="${esc(x.id)}">แก้ไข</button><button class="btn sm" data-del="${kind}" data-id="${esc(x.id)}" ${CAT[kind].length<2?'disabled':''}>ลบ</button></span></li>`;
  }).join('');
}
function eqFormHTML(kind){
  const sc=SCHEMA[kind],cur=EQ.edit[kind],isNew=!cur;
  const val=k=>{const f0=sc.fields.find(x=>x[0]===k);return cur&&cur[k]!==undefined?cur[k]:f0[3]};
  const cells=sc.fields.map(([k,label,ty,def,opts,grp])=>{
    const req=sc.req.includes(k)?' *':'';
    if(ty==='s')return`<label>${label}<select data-f="${k}">${opts.map(o=>`<option value="${o[0]}" ${o[0]===val(k)?'selected':''}>${o[1]}</option>`).join('')}</select></label>`;
    if(ty==='n')return`<label>${label}${req}<input data-f="${k}" type="number" inputmode="decimal" step="any" value="${val(k)===0&&sc.req.includes(k)?'':val(k)}"></label>`;
    return`<label class="${k==='note'?'wide':''}">${label}${req}<input data-f="${k}" type="text" value="${esc(val(k))}"></label>`;
  }).join('');
  return`<div class="eqform" data-form="${kind}"><div class="eqgrid">${cells}</div><div class="eqact"><button class="btn pri" data-save="${kind}">${isNew?'เพิ่ม'+sc.one+'เข้าแคตตาล็อก':'บันทึกการแก้ไข'}</button>${isNew?'':`<button class="btn" data-cancel="${kind}">ยกเลิก</button>`}<span class="eqmsg" data-fmsg="${kind}" role="status"></span></div></div>`;
}
function bankHTML(){
  const bi=bankInfo(),b=bi&&bi.b;
  if(!b)return'<p class="hint">ยังไม่มีรุ่นแบตเตอรี่ในแคตตาล็อก</p>';
  const warn=[];
  const I=curInv();
  if(I.type!=='on-grid'&&I.bvMax&&(bi.V<I.bvMin||bi.V>I.bvMax))warn.push(`แรงดันชุดแบต ${f(bi.V,1)} V อยู่นอกช่วงแบตของอินเวอร์เตอร์ ${I.bvMin}–${I.bvMax} V`);
  if(I.type==='on-grid')warn.push('อินเวอร์เตอร์ที่เลือกเป็นแบบ On-grid ต่อแบตตรงไม่ได้ เลือกรุ่น Hybrid หรือ Off-grid ที่หัวข้ออินเวอร์เตอร์ก่อนจำลอง Backup');
  return`<div class="row3"><label>ต่ออนุกรม (ลูก)<input id="bk-s" type="number" min="1" max="32" step="1" value="${bi.s}"></label><label>ต่อขนาน (ชุด)<input id="bk-p" type="number" min="1" max="32" step="1" value="${bi.p}"></label></div>
  <dl class="specs bk"><div><dt>จำนวนแบต</dt><dd>${bi.n} ลูก</dd></div><div><dt>แรงดันชุด</dt><dd>${f(bi.V,1)} V</dd></div><div><dt>ความจุชุด</dt><dd>${f(bi.Ah,0)} Ah</dd></div><div><dt>พลังงานรวม</dt><dd>${f(bi.kwh,2)} kWh</dd></div><div><dt>ใช้ได้จริง (DoD ${b.dod}%)</dt><dd>${f(bi.usable,2)} kWh</dd></div><div><dt>กำลังสูงสุดที่แบตรับได้ (${bi.maxC}C)</dt><dd>${f(bi.kwh*bi.maxC,1)} kW</dd></div></dl>`+(warn.length?`<ul class="checks">${warn.map(w=>`<li><span class="b warn">!</span><span>${esc(w)}</span></li>`).join('')}</ul>`:'');
}
function eqRender(kind){
  const host=$('#eq-'+kind);if(!host)return;
  const sc=SCHEMA[kind];
  host.innerHTML=`<div class="panelbox eqbox">
    <ul class="eqlist">${eqListHTML(kind)}</ul>
    ${kind==='batteries'?`<div class="bankbox"><h3>ชุดแบตเตอรี่ที่ใช้จำลอง</h3>${bankHTML()}</div>`:''}
    <details class="eqd"${EQ.edit[kind]?' open':''}><summary>${EQ.edit[kind]?'แก้ไข':'เพิ่ม'}${sc.one}</summary>${eqFormHTML(kind)}</details>
    <details class="eqd"><summary>นำเข้า / ส่งออก</summary>
      <div class="eqimp">
        <p class="hint" style="margin:0">นำเข้าได้จากไฟล์ JSON หรือ CSV (หัวคอลัมน์ภาษาอังกฤษ เช่น ${sc.fields.slice(0,6).map(x=>x[0]).join(', ')}) หรือวางข้อความลงในช่อง ถ้า id ซ้ำจะแทนที่รายการเดิม</p>
        <input type="file" accept=".json,.csv,.txt,text/csv,application/json" data-file="${kind}">
        <textarea data-paste="${kind}" rows="4" spellcheck="false" placeholder="วาง JSON หรือ CSV ที่นี่"></textarea>
        <div class="eqact"><button class="btn pri" data-import="${kind}">นำเข้า</button><button class="btn" data-sample="${kind}">ใส่ตัวอย่างรูปแบบ CSV</button><button class="btn" data-export="${kind}">ส่งออกแคตตาล็อกทั้งหมดเป็น JSON</button><span class="eqmsg" data-imsg="${kind}" role="status"></span></div>
      </div>
    </details>
  </div>`;
}
function eqRenderAll(){KIND_ORDER.forEach(eqRender);fillSelectors()}
function fillSelectors(){
  if(typeof quickSel==='function')quickSel();
  const p=curPanel(),I=curInv();
  const el=$('#cur-equip');
  if(el){
    const bi=bankInfo();
    el.innerHTML=`<span><b>แผง</b> ${esc(PV.name)} · ${PV.pmax} W</span><span><b>อินเวอร์เตอร์</b> ${esc(I.name)} · ${I.pac/1000} kW · ${({'on-grid':'On-grid','hybrid':'Hybrid','off-grid':'Off-grid'})[I.type]}</span><span><b>แบต</b> ${bi?`${bi.n} ลูก · ${f(bi.V,1)} V · ${f(bi.kwh,2)} kWh`:'-'}</span>`;
  }
}
function eqMsg(sel,txt,cls){const m=document.querySelector(sel);if(m){m.className='eqmsg '+(cls||'');m.textContent=txt}}
function onCatalogChange(){
  applyActive();eqRenderAll();
  lastSig='';render();
  if(typeof runSim==='function'&&lastA)runSim();
  if(typeof touch==='function')touch(true);
}
function initCatalogUI(){
  const root=$('#tab-equip');
  root.addEventListener('change',e=>{
    const t=e.target;
    if(t.dataset.act){ACT[ACTKEY[t.dataset.act]]=t.value;onCatalogChange();return}
    if(t.dataset.file){
      const file=t.files[0];if(!file)return;
      const kind=t.dataset.file,rd=new FileReader();
      rd.onload=()=>{document.querySelector(`[data-paste="${kind}"]`).value=String(rd.result||'');eqMsg(`[data-imsg="${kind}"]`,`อ่านไฟล์ ${file.name} แล้ว กด "นำเข้า" เพื่อยืนยัน`,'')};
      rd.onerror=()=>eqMsg(`[data-imsg="${kind}"]`,'อ่านไฟล์ไม่ได้','err');
      rd.readAsText(file);
    }
  });
  root.addEventListener('input',e=>{
    if(e.target.id==='bk-s'||e.target.id==='bk-p'){
      const n=Math.max(1,Math.min(32,parseInt(e.target.value)||1));
      if(e.target.id==='bk-s')BANK.s=n;else BANK.p=n;
      const bk=$('#eq-batteries .bankbox');
      const h=bankHTML();
      /* keep focus: refresh only the readout part */
      const tmp=document.createElement('div');tmp.innerHTML=h;
      const old=bk.querySelectorAll('dl,ul.checks');old.forEach(x=>x.remove());
      tmp.querySelectorAll('dl,ul.checks').forEach(x=>bk.appendChild(x));
      fillSelectors();
      if(typeof backupRun==='function')backupRun();
      if(typeof touch==='function')touch();
    }
  });
  root.addEventListener('click',e=>{
    const t=e.target.closest('button');if(!t)return;
    const d=t.dataset;
    if(d.edit){EQ.edit[d.edit]=CAT[d.edit].find(x=>x.id===d.id)||null;eqRender(d.edit);const dd=document.querySelector(`#eq-${d.edit} details`);if(dd)dd.scrollIntoView({block:'nearest'});return}
    if(d.cancel){EQ.edit[d.cancel]=null;eqRender(d.cancel);return}
    if(d.del){
      if(CAT[d.del].length<2)return;
      CAT[d.del]=CAT[d.del].filter(x=>x.id!==d.id);
      if(EQ.edit[d.del]&&EQ.edit[d.del].id===d.id)EQ.edit[d.del]=null;
      onCatalogChange();return;
    }
    if(d.save){
      const kind=d.save,form=document.querySelector(`[data-form="${kind}"]`),raw={};
      form.querySelectorAll('[data-f]').forEach(i=>raw[i.dataset.f]=i.value);
      if(EQ.edit[kind])raw.id=EQ.edit[kind].id;
      const {item,why}=normalizeItem(kind,raw);
      if(why.length){eqMsg(`[data-fmsg="${kind}"]`,'ต้องกรอก: '+why.join(', '),'err');return}
      if(!EQ.edit[kind]&&CAT[kind].some(x=>x.id===item.id))item.id+='-'+Date.now().toString(36).slice(-4);
      const ix=CAT[kind].findIndex(x=>x.id===item.id);
      if(ix>=0)CAT[kind][ix]=item;else CAT[kind].push(item);
      ACT[ACTKEY[kind]]=item.id;EQ.edit[kind]=null;onCatalogChange();return;
    }
    if(d.import){
      const kind=d.import,txt=document.querySelector(`[data-paste="${kind}"]`).value;
      const r=importText(txt,kind);
      if(r.error){eqMsg(`[data-imsg="${kind}"]`,r.error,'err');return}
      onCatalogChange();
      const sk=r.skipped.length?` · ข้าม ${r.skipped.length} แถว (${r.skipped.slice(0,3).map(s=>s.row+' '+s.why).join('; ')}${r.skipped.length>3?' …':''})`:'';
      eqMsg(`[data-imsg="${kind}"]`,`นำเข้าใหม่ ${r.added} · แทนที่ ${r.updated}${sk}`,r.added||r.updated?'ok':'err');
      return;
    }
    if(d.sample){document.querySelector(`[data-paste="${d.sample}"]`).value=SAMPLE[d.sample];eqMsg(`[data-imsg="${d.sample}"]`,'แก้ค่าตัวอย่างเป็นข้อมูลจริงแล้วกด "นำเข้า"','');return}
    if(d.export){
      const ta=document.querySelector(`[data-paste="${d.export}"]`);ta.value=exportJSON();ta.select();
      let ok=false;try{ok=document.execCommand&&document.execCommand('copy')}catch(_){}
      eqMsg(`[data-imsg="${d.export}"]`,ok?'คัดลอก JSON ของแคตตาล็อกแล้ว นำไปวางเก็บเป็นไฟล์ได้':'แสดง JSON ในช่องแล้ว คัดลอกไปเก็บเป็นไฟล์ได้','ok');
    }
  });
}

/* ---- storage: per-viewer db doc when available, else localStorage ---- */
const Store={db:null,uid:null,ready:false,
  async init(){
    try{
      if(!window.claude||!claude.use)return;
      const [db,user]=await Promise.all([claude.use('db'),claude.use('user')]);
      if(db&&user){const id=await user.id();if(id){this.db=db;this.uid=id}}
    }catch(e){this.db=null}
    this.ready=true;
  },
  path(n){return`data/users/${this.uid}/${n}`},
  async load(n){
    try{
      if(this.db){const s=await this.db.doc(this.path(n)).get();if(s.exists){const d=s.data();if(d&&d.json)return JSON.parse(d.json)}}
    }catch(e){}
    try{const t=localStorage.getItem('pvsim:'+n);if(t)return JSON.parse(t)}catch(e){}
    return null;
  },
  async save(n,obj){
    const json=JSON.stringify(obj);let ok=false;
    try{if(this.db){await this.db.doc(this.path(n)).set({json,t:Date.now()});ok=true}}catch(e){}
    try{localStorage.setItem('pvsim:'+n,json);ok=true}catch(e){}
    return ok;
  },
  async clear(n){
    try{if(this.db)await this.db.doc(this.path(n)).delete()}catch(e){}
    try{localStorage.removeItem('pvsim:'+n)}catch(e){}
  }
};
