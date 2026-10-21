/* ---- circuit analysis ---- */
function shortInfo(wires){
  const keys=[];st.panels.forEach(p=>keys.push(p.id+':p',p.id+':n'));mpKeys().forEach(k=>keys.push(k));
  const par={};keys.forEach(k=>par[k]=k);
  const find=k=>{while(par[k]!==k){par[k]=par[par[k]];k=par[k]}return k};
  wires.forEach(w=>{if(w.a in par&&w.b in par){const ra=find(w.a),rb=find(w.b);if(ra!==rb)par[ra]=rb}});
  const E=st.panels.map(p=>({id:p.id,u:find(p.id+':n'),v:find(p.id+':p')}));
  const reach=(a,b)=>{const seen=new Set([a]),stack=[a];while(stack.length){const x=stack.pop();if(x===b)return true;E.forEach(e=>{if(e.u===x&&!seen.has(e.v)){seen.add(e.v);stack.push(e.v)}})}return false};
  const cyc=new Set(),self=[];
  E.forEach(e=>{if(e.u===e.v){cyc.add(e.id);self.push(e.id)}else if(reach(e.v,e.u))cyc.add(e.id)});
  const inv=mpKs().filter(k=>find(`i${k}:p`)===find(`i${k}:n`));
  return{cyc,self,inv};
}
function shortWires(si){
  const out=new Set();
  if(!si.cyc.size&&!si.inv.length)return out;
  const base=si.cyc.size+si.inv.length;
  st.wires.forEach((w,i)=>{const r=shortInfo(st.wires.filter((_,j)=>j!==i));if(r.cyc.size+r.inv.length<base)out.add(i)});
  if(!out.size){
    const touches=k=>k[0]==='i'?si.inv.includes(+k[1]):si.cyc.has(+k.split(':')[0]);
    st.wires.forEach((w,i)=>{if(touches(w.a)||touches(w.b))out.add(i)});
  }
  return out;
}
function analyze(){
  const I=curInv(),dc=st.tmin-25,dh=st.thot-25;
  const evOf=P=>({vocC:P.voc*(1+P.kVoc/100*dc),vmpC:P.vmp*(1+P.kVoc/100*dc),vmpH:P.vmp*(1+P.kPmax/100*dh),iscH:P.isc*(1+P.kIsc/100*dh)}),ev=evOf(PV);
  const keys=[];st.panels.forEach(p=>keys.push(p.id+':p',p.id+':n'));mpKeys().forEach(k=>keys.push(k));
  const par={};keys.forEach(k=>par[k]=k);
  const find=k=>{while(par[k]!==k){par[k]=par[par[k]];k=par[k]}return k};
  st.wires.forEach(w=>{if(w.a in par&&w.b in par){const ra=find(w.a),rb=find(w.b);if(ra!==rb)par[ra]=rb}});
  const single=(P,e)=>({n:1,ns:1,mp:1,voc:e.vocC,vmpC:e.vmpC,vmpH:e.vmpH,imp:P.imp,isc:e.iscH,pv:P});
  const all=st.panels.map(p=>({from:find(p.id+':n'),to:find(p.id+':p'),id:p.id}));
  const shorted=all.filter(e=>e.from===e.to).map(e=>e.id);
  const edges=all.filter(e=>e.from!==e.to);
  /* which MPPT each panel is wired to (same circuit as that input); its size comes from that MPPT's panel choice */
  const grp={};const gf=k=>{while(grp[k]!==undefined&&grp[k]!==k)k=grp[k];return k};
  keys.forEach(k=>grp[find(k)]=find(k));all.forEach(e=>{const a=gf(e.from),b=gf(e.to);if(a!==b)grp[a]=b});
  const pk={};st.panels.forEach(p=>{const g=gf(find(p.id+':n'));const k=mpKs().find(k=>gf(find(`i${k}:p`))===g||gf(find(`i${k}:n`))===g);if(k)pk[p.id]=k});
  const res=mpKs().map(k=>{const P=mpPV(k),e=evOf(P);return evalMppt(k,edges.map(x=>Object.assign({},x,{blk:single(P,e)})),find,I,e)});
  const si=shortInfo(st.wires),sw=shortWires(si);
  const sys=[];
  const used=res.reduce((a,r)=>a+(r.blk?r.blk.n:0),0),pvW=res.reduce((a,r)=>a+(r.blk?r.blk.n*r.blk.pv.pmax:0),0);
  const active=res.filter(r=>r.status!=='idle');
  si.self.forEach(id=>sys.push({lvl:'err',t:`ชอต: แผง #${id} ถูกลัดวงจร เพราะขั้ว + และ − ของแผงเดียวกันต่อถึงกัน ลบสายที่มีสัญลักษณ์ฟ้าแลบออก`}));
  const loop=[...si.cyc].filter(id=>!si.self.includes(id));
  if(loop.length)sys.push({lvl:'err',t:`ชอต: แผง ${loop.map(i=>'#'+i).join(', ')} ต่อวนเป็นวงจรลัด (วงปิดแบบอนุกรม หรือขนานกลับขั้ว) ลบสายที่มีสัญลักษณ์ฟ้าแลบออก`});
  if(active.length){
    const loose=st.panels.length-used-si.cyc.size;
    if(loose>0&&active.every(r=>r.status==='ok'))sys.push({lvl:'warn',t:`มี ${loose} แผงที่ยังไม่ได้ต่อเข้าวงจรของอินเวอร์เตอร์`});
    if(used>0){
      const pv=pvW,ratio=pv/I.pac;
      if(pv>I.pvRec)sys.push({lvl:'warn',t:`กำลัง DC ${f(pv/1000,2)} kWp เกินกำลังที่ผู้ผลิตแนะนำ ${I.pvRec/1000} kW`});
      else sys.push({lvl:'ok',t:`กำลัง DC ${f(pv/1000,2)} kWp ไม่เกินที่แนะนำ ${I.pvRec/1000} kW`});
      if(ratio<0.8)sys.push({lvl:'warn',t:`DC/AC ${f(ratio,2)} ต่ำ อินเวอร์เตอร์ใช้ไม่เต็มกำลัง`});
      else sys.push({lvl:'ok',t:`DC/AC ${f(ratio,2)} เทียบกับ AC ${I.pac/1000} kW`});
    }
  }
  if(isMicro(I)&&used>0){const U=microU(I);sys.push({lvl:'ok',t:`ระบบไมโคร ${U} ตัว (ผังนี้คือ 1 ตัว ทุกตัวต่อแผงแบบเดียวกัน): ${U*used} แผง · ${f(U*pvW/1000,2)} kWp · AC รวม ${f(U*I.pac/1000,2)} kW · วางแผนสาย AC ที่เมนู 03`})}
  const items=[...res.flatMap(r=>r.ck),...sys];
  const cnt={err:0,warn:0,ok:0};items.forEach(c=>cnt[c.lvl]++);
  const lvl=!active.length&&!si.cyc.size?'idle':cnt.err?'err':cnt.warn?'warn':'ok';
  return{I,ev,evOf,res,sys,used,cnt,lvl,shorted,si,sw,pk,pv:pvW,ratio:pvW/I.pac};
}

function evalMppt(k,edges,find,I,ev){
  const touched=st.wires.some(w=>w.a.startsWith(`i${k}:`)||w.b.startsWith(`i${k}:`));
  if(!touched)return{k,status:'idle',lvl:'idle',short:'ยังไม่ต่อสาย',ck:[]};
  const A=find(`i${k}:p`),B=find(`i${k}:n`),ck=[];
  const fin=(status,lvl,short,msg,extra)=>{if(msg)ck.push({lvl,t:msg});return Object.assign({k,status,lvl,short,ck},extra||{})};
  if(A===B)return fin('short','err','ลัดวงจร','ขั้ว + และ − ของ MPPT นี้ต่อถึงกัน (ลัดวงจร) ตรวจสายที่ขั้วอินเวอร์เตอร์');
  const r=reduce(edges,A,B,ck);
  if(r.status==='empty')return fin('empty','warn','ต่อไม่ครบ','ยังไม่ครบวงจร ต้องมีสายต่อจากแผงถึงทั้งขั้ว + และขั้ว − ของ DC'+k);
  if(r.status==='reversed')return fin('reversed','err','ขั้วกลับ',`ขั้วกลับ: ขั้ว + ของแผงไปเข้า DC${k}− และขั้ว − ไปเข้า DC${k}+ สลับสายสองเส้นที่อินเวอร์เตอร์`);
  if(r.status==='clash')return fin('clash','err','ขั้วชนกัน',`พบ ${r.sign} ในสายอนุกรม แรงดันของสองแผงหักล้างกัน ต่อ + ของแผงหนึ่งเข้า − ของอีกแผงแทน`);
  if(r.status==='prev')return fin('prev','err','ขนานกลับขั้ว','มีแผงหรือสตริงที่ต่อขนานกันแต่กลับขั้ว เกิดไฟลัดวงจรระหว่างกัน');
  if(r.status==='complex')return fin('complex','err','ต่อซับซ้อน','การต่อไม่ใช่อนุกรมหรือขนานแบบธรรมดา เช่นมีสายไขว้ระหว่างสตริง ให้ต่ออนุกรมในแต่ละสตริงให้เสร็จก่อน แล้วค่อยขนานสตริง');
  const b=r.blk;
  if(b.voc>I.vmax)ck.push({lvl:'err',t:`Voc ที่ ${st.tmin}°C = ${f(b.voc)} V เกิน ${I.vmax} V ของอินเวอร์เตอร์ ต่ออนุกรมได้ไม่เกิน ${Math.floor(I.vmax/ev.vocC)} แผง`});
  else if(b.voc>I.vmax*0.95)ck.push({lvl:'warn',t:`Voc ที่ ${st.tmin}°C = ${f(b.voc)} V ใกล้ขีดจำกัด ${I.vmax} V`});
  else ck.push({lvl:'ok',t:`Voc ที่ ${st.tmin}°C = ${f(b.voc)} V ต่ำกว่า ${I.vmax} V`});
  if(b.vmpC>I.hi)ck.push({lvl:'err',t:`Vmp ตอนเย็นสุด ${f(b.vmpC)} V เกินช่วง MPPT สูงสุด ${I.hi} V`});
  else if(b.vmpH<I.lo)ck.push({lvl:'err',t:`Vmp ที่เซลล์ ${st.thot}°C = ${f(b.vmpH)} V ต่ำกว่า MPPT ต่ำสุด ${I.lo} V ต้องมีอย่างน้อย ${Math.ceil(I.lo/ev.vmpH)} แผงอนุกรม`});
  else if(b.vmpH<I.lo+Math.min(25,(I.hi-I.lo)*0.1))ck.push({lvl:'warn',t:`Vmp ตอนร้อน ${f(b.vmpH)} V ใกล้ขอบล่างของ MPPT (${I.lo} V)`});
  else ck.push({lvl:'ok',t:`Vmp ${f(b.vmpH)}–${f(b.vmpC)} V อยู่ในช่วง MPPT ${I.lo}–${I.hi} V`});
  if(b.isc>I.isc)ck.push({lvl:'err',t:`Isc รวม ${f(b.isc,1)} A เกิน ${I.isc} A ของอินพุต`});
  if(b.imp>I.imax)ck.push({lvl:'warn',t:`Imp รวม ${f(b.imp,1)} A เกิน ${I.imax} A กระแสจะถูกจำกัด สูญเสียราว ${f((1-I.imax/b.imp)*100)}% ตอนแดดเต็ม`});
  else ck.push({lvl:'ok',t:`Imp รวม ${f(b.imp,1)} A ไม่เกิน ${I.imax} A`});
  if(b.mp>1)ck.push({lvl:'warn',t:`ขนาน ${b.mp} สตริงเข้าอินพุตเดียว ต้องใช้ตัวต่อ Y หรือคอมบายเนอร์ ตรวจดาต้าชีตว่าอินพุตนี้รับได้กี่สตริง (หลายรุ่นรับ 1 สตริงต่ออินพุต)`});
  const lvl=ck.some(c=>c.lvl==='err')?'err':ck.some(c=>c.lvl==='warn')?'warn':'ok';
  ck.sort((a,b)=>RANK[a.lvl]-RANK[b.lvl]);
  return{k,status:'ok',lvl,short:`${b.ns}S${b.mp}P`,blk:b,ck};
}

function ser(a,b,ck){
  if(a.mp!==b.mp)ck.push({lvl:'warn',t:`ต่ออนุกรมระหว่างกลุ่มที่ขนานไม่เท่ากัน (${a.mp}P กับ ${b.mp}P) กระแสถูกจำกัดตามกลุ่มที่น้อยกว่า`});
  return{pv:a.pv,n:a.n+b.n,ns:a.ns+b.ns,mp:Math.min(a.mp,b.mp),voc:a.voc+b.voc,vmpC:a.vmpC+b.vmpC,vmpH:a.vmpH+b.vmpH,imp:Math.min(a.imp,b.imp),isc:Math.min(a.isc,b.isc)};
}
function paral(a,b,ck){
  if(a.ns!==b.ns)ck.push({lvl:'err',t:`สองสาขาที่ขนานกันมีจำนวนแผงอนุกรมไม่เท่ากัน (${a.ns} กับ ${b.ns} แผง) แรงดันไม่ตรงกัน สาขาที่แรงดันต่ำจะถูกป้อนย้อน`});
  return{pv:a.pv,n:a.n+b.n,ns:Math.min(a.ns,b.ns),mp:a.mp+b.mp,voc:Math.max(a.voc,b.voc),vmpC:Math.max(a.vmpC,b.vmpC),vmpH:Math.min(a.vmpH,b.vmpH),imp:a.imp+b.imp,isc:a.isc+b.isc};
}
function reduce(edges0,A,B,ck){
  const seen=new Set([A]);let grow=true;
  while(grow){grow=false;edges0.forEach(e=>{if(seen.has(e.from)!==seen.has(e.to)){seen.add(e.from);seen.add(e.to);grow=true}})}
  if(!seen.has(B))return{status:'empty'};
  let E=edges0.filter(e=>seen.has(e.from)).map(e=>({from:e.from,to:e.to,blk:e.blk}));
  let changed=true,guard=0;
  while(changed&&guard++<1000){
    changed=false;
    outer:for(let i=0;i<E.length;i++)for(let j=i+1;j<E.length;j++){
      const a=E[i],b=E[j];
      if(a.from===b.from&&a.to===b.to){E[i]={from:a.from,to:a.to,blk:paral(a.blk,b.blk,ck)};E.splice(j,1);changed=true;break outer}
      if(a.from===b.to&&a.to===b.from)return{status:'prev'};
    }
    if(changed)continue;
    const deg=new Map();E.forEach(e=>{deg.set(e.from,(deg.get(e.from)||0)+1);deg.set(e.to,(deg.get(e.to)||0)+1)});
    for(const [n,d] of deg){
      if(d===1&&n!==A&&n!==B){E.splice(E.findIndex(e=>e.from===n||e.to===n),1);changed=true;break}
    }
    if(changed)continue;
    for(const [n,d] of deg){
      if(d===2&&n!==A&&n!==B){
        const idx=[];E.forEach((e,i)=>{if(e.from===n||e.to===n)idx.push(i)});
        const x=E[idx[0]],y=E[idx[1]];let first,second;
        if(x.to===n&&y.from===n){first=x;second=y}
        else if(y.to===n&&x.from===n){first=y;second=x}
        else return{status:'clash',sign:x.to===n?'+ ต่อ +':'− ต่อ −'};
        const m={from:first.from,to:second.to,blk:ser(first.blk,second.blk,ck)};
        E=E.filter((_,i)=>!idx.includes(i));
        if(m.from!==m.to)E.push(m);
        changed=true;break;
      }
    }
  }
  if(E.length===0)return{status:'empty'};
  if(E.length===1){
    const e=E[0];
    if(e.from===B&&e.to===A)return{status:'ok',blk:e.blk};
    if(e.from===A&&e.to===B)return{status:'reversed'};
  }
  return{status:'complex'};
}
