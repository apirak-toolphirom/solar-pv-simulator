/* ---- Bench: ชุดทดลองวงจร DC 12/24/48 V — แผงอนุกรม/ขนาน, ฟิวส์, เบรกเกอร์, SPD, ชาร์จคอนโทรลเลอร์, แบต, อินเวอร์เตอร์, โหลด, มิเตอร์แคลมป์/โวลต์ ---- */
const BPAN=[
  {id:'b-100',brand:'ตัวอย่าง',model:'12 V 100 W (36 เซลล์)',pmax:100,voc:22.5,vmp:18.5,isc:5.8,imp:5.4,kVoc:-0.30,kIsc:0.05,noct:45},
  {id:'b-330',brand:'ตัวอย่าง',model:'330 W (60 เซลล์)',pmax:330,voc:40.3,vmp:33.1,isc:10.3,imp:9.97,kVoc:-0.29,kIsc:0.05,noct:45},
  {id:'b-450',brand:'ตัวอย่าง',model:'450 W (144 half-cell)',pmax:450,voc:49.6,vmp:41.5,isc:11.5,imp:10.84,kVoc:-0.27,kIsc:0.05,noct:43}
];
const BBAT=[
  {id:'bb-lfp12-100',brand:'ตัวอย่าง',model:'LiFePO4 12.8 V 100 Ah',chem:'LiFePO4',v:12.8,ah:100,dod:90,maxC:0.5,r:0.020},
  {id:'bb-agm12-100',brand:'ตัวอย่าง',model:'AGM ตะกั่วกรด 12 V 100 Ah',chem:'Lead',v:12,ah:100,dod:50,maxC:0.2,r:0.035},
  {id:'bb-lfp24-100',brand:'ตัวอย่าง',model:'LiFePO4 25.6 V 100 Ah',chem:'LiFePO4',v:25.6,ah:100,dod:90,maxC:0.5,r:0.035},
  {id:'bb-lfp48-100',brand:'ตัวอย่าง',model:'LiFePO4 51.2 V 100 Ah',chem:'LiFePO4',v:51.2,ah:100,dod:90,maxC:0.5,r:0.060}
];
const BCTL=[
  {id:'pwm20',name:'PWM 20 A (12/24 V, PV ≤ 50 V)',type:'pwm',imax:20,vocMax:50,sys:[12,24],eff:.98},
  {id:'mppt30',name:'MPPT 30 A (12/24 V, PV ≤ 100 V)',type:'mppt',imax:30,vocMax:100,sys:[12,24],eff:.97},
  {id:'mppt40',name:'MPPT 40 A (12/24/48 V, PV ≤ 150 V)',type:'mppt',imax:40,vocMax:150,sys:[12,24,48],eff:.97},
  {id:'mppt60',name:'MPPT 60 A (12/24/48 V, PV ≤ 150 V)',type:'mppt',imax:60,vocMax:150,sys:[12,24,48],eff:.97},
  {id:'mppt100',name:'MPPT 100 A (24/48 V, PV ≤ 250 V)',type:'mppt',imax:100,vocMax:250,sys:[24,48],eff:.975}
];
const BINV=[
  {id:'i12-1000',name:'Pure sine 12 V 1,000 W',sys:12,pac:1000,surge:2000,eff:.90},
  {id:'i12-2000',name:'Pure sine 12 V 2,000 W',sys:12,pac:2000,surge:4000,eff:.90},
  {id:'i24-2000',name:'Pure sine 24 V 2,000 W',sys:24,pac:2000,surge:4000,eff:.92},
  {id:'i24-3000',name:'Pure sine 24 V 3,000 W',sys:24,pac:3000,surge:6000,eff:.92},
  {id:'i48-3000',name:'Pure sine 48 V 3,000 W',sys:48,pac:3000,surge:6000,eff:.94},
  {id:'i48-5000',name:'Pure sine 48 V 5,000 W',sys:48,pac:5000,surge:10000,eff:.94}
];
const BLOAD=[
  {id:'led-dc',name:'หลอด LED DC 10 W (ตามแรงดันระบบ)',kind:'dc',w:10,pf:1,surge:1,ic:'bulb'},
  {id:'pump-dc',name:'ปั๊มน้ำ DC 100 W',kind:'dc',w:100,pf:1,surge:2.5,ic:'pump'},
  {id:'led-ac',name:'หลอด LED AC 9 W',kind:'ac',w:9,pf:.6,surge:1,ic:'bulb'},
  {id:'fan',name:'พัดลม AC 60 W',kind:'ac',w:60,pf:.9,surge:2,ic:'fan'},
  {id:'pump-ac',name:'ปั๊มน้ำ AC 0.5 HP (≈550 W)',kind:'ac',w:550,pf:.8,surge:3.5,ic:'pump'},
  {id:'air9',name:'แอร์ 9000 BTU อินเวอร์เตอร์ (≈800 W)',kind:'ac',w:800,pf:.85,surge:2,ic:'air'},
  {id:'air12',name:'แอร์ 12000 BTU ธรรมดา (≈1,100 W)',kind:'ac',w:1100,pf:.85,surge:5,ic:'air'}
];
const B_FUSE_PV=[0,6,8,10,12,15,20,25,32],B_BRK_PV=[0,10,16,20,25,32,40,50,63,80,100],B_FUSE_BAT=[0,20,30,40,60,80,100,125,150,200,250,300],B_BRK_BAT=[0,20,32,50,63,80,100,125,160,200,250],B_BRK_AC=[0,6,10,16,20,25,32,40,50,63];
const B_TYPES={
  pf:[['pv','ฟิวส์ gPV 1000 V DC'],['ac','ฟิวส์ทั่วไป AC (ไม่ใช่ DC)']],
  pb:[['dc250','เบรกเกอร์ DC 250 V'],['dc500','เบรกเกอร์ DC 500 V'],['dc1000','เบรกเกอร์ DC 1000 V'],['ac','เบรกเกอร์ AC (ไม่ใช่ DC)']],
  bf:[['anl32','ฟิวส์ ANL 32 V DC'],['t160','ฟิวส์ Class T 160 V DC'],['ac','ฟิวส์ AC ทั่วไป']],
  bb:[['dc250','เบรกเกอร์ DC 250 V'],['dc500','เบรกเกอร์ DC 500 V'],['ac','เบรกเกอร์ AC (ไม่ใช่ DC)']]
};
const B_VRAT={pv:1000,dc250:250,dc500:500,dc1000:1000,anl32:32,t160:160,ac:0};
const B_CAP={pv:20000,dc250:6000,dc500:6000,dc1000:6000,anl32:2000,t160:20000,ac:0};
const B_SCEN=[['none','ปกติ (ไม่มีฟอลต์)'],['bshort','แบตเตอรี่ลัดวงจร'],['rev','ต่อขั้วแบตกลับด้าน'],['pvshort','สตริงแผงลัดวงจร (กระแสย้อน)'],['surge','ฟ้าผ่า/แรงดันเกินเหนี่ยวนำ'],['acshort','ลัดวงจรฝั่ง AC']];
const B_AMP={2.5:30,4:41,6:55,10:76,16:105,25:140,35:174,50:210,70:260,95:320};
const B_MM=[2.5,4,6,10,16,25,35,50,70,95];
const BN={
  sys:12,panel:'b-100',nS:1,nP:2,bat:'bb-lfp12-100',bP:1,ctrl:'mppt30',inv:'i12-1000',invOn:true,
  G:800,Ta:30,soc:60,tmin:10,
  pf:{a:10,t:'pv'},pb:{a:25,t:'dc500'},spd:600,bf:{a:125,t:'t160'},bb:{a:125,t:'dc500'},acb:10,
  cPV:{mm:4,len:10},cB:{mm:25,len:1},
  loads:{'led-dc':{q:3,on:true},'led-ac':{q:2,on:true},'fan':{q:1,on:true}},
  sc:'none',sw:{PVF:1,PVB:1,BF:1,BBK:1,ACB:1,INV:1},
  pos:{},zoom:1,
  m:{A1:{x:0,y:0,wire:'w3',t:.5,type:'dcac',both:false},A2:{x:0,y:0,wire:'w8',t:.5,type:'dcac',both:false},VB:{x:430,y:560},PR:{x:600,y:585,port:'BAT+'},PB:{x:650,y:585,port:'BAT-'}}
};
let BLATCH={},BSOL=null;
const benchPanels=()=>BPAN.concat((typeof CAT!=='undefined'?CAT.panels:[]).filter(p=>!BPAN.some(b=>b.id===p.id)));
const benchBats=()=>BBAT.concat((typeof CAT!=='undefined'?CAT.batteries:[]).filter(p=>!BBAT.some(b=>b.id===p.id)));
const bSel=(list,id)=>list.find(x=>x.id===id)||list[0];
const bInvList=()=>BINV.filter(i=>i.sys===BN.sys);
const bInvSel=()=>BN.inv?BINV.find(i=>i.id===BN.inv&&i.sys===BN.sys)||null:null;
function bCtrlSel(){return bSel(BCTL,BN.ctrl)}
const OCV_LFP=[[0,11.6],[10,12.4],[20,12.9],[40,13.1],[70,13.3],[90,13.4],[100,13.8]],OCV_PB=[[0,11.6],[20,11.9],[50,12.2],[80,12.5],[100,12.8]];
function bInterp(t,x){if(x<=t[0][0])return t[0][1];for(let i=1;i<t.length;i++)if(x<=t[i][0]){const a=t[i-1],b=t[i];return a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0])}return t[t.length-1][1]}
function bBank(){
  const b=bSel(benchBats(),BN.bat),lead=b.chem==='Lead',ns=Math.max(1,Math.round(BN.sys/b.v)),p=Math.max(1,BN.bP|0),V=ns*b.v,Ah=p*b.ah;
  const r1=b.r||(0.02*(b.v/12.8)*(100/b.ah)*(lead?1.8:1)),k=V/(lead?12:12.8),mc=b.maxC||0.5;
  return{b,lead,ns,p,V,Ah,k,R:r1*ns/p,ok:Math.abs(V-BN.sys)/BN.sys<.15,
    maxChg:b.maxChg>0?b.maxChg*p:mc*Ah,maxDis:b.maxDis>0?b.maxDis*p:mc*Ah*2,dod:b.dod||90,
    vabs:k*(lead?14.6:14.4),vfl:k*13.6,lvd:k*(lead?10.8:11.0),ocv:s=>bInterp(lead?OCV_PB:OCV_LFP,s)*k};
}
function bPv(P,G,Ta){
  const noct=P.noct||43,Tc=Ta+(noct-20)/800*G,g=Math.max(G,0)/1000;
  const voc=g>0?P.voc*(1+(P.kVoc||-0.28)/100*(Tc-25))*(1+0.05*Math.log(Math.max(g,.02))):0;
  const isc=P.isc*g*(1+(P.kIsc||0.05)/100*(Tc-25));
  return{Tc,voc:Math.max(0,voc),isc:Math.max(0,isc),vmp:voc>0?P.vmp*voc/P.voc:0,imp:P.isc>0?P.imp*isc/P.isc:0};
}
function bIat(c,V){
  if(c.isc<=0||c.voc<=0)return 0;if(V<=0)return c.isc;if(V>=c.voc)return 0;
  const r=Math.min(.99,Math.max(.5,c.imp/c.isc)),C2=(c.vmp/c.voc-1)/Math.log(1-r),C1=(1-r)*Math.exp(-c.vmp/(C2*c.voc));
  return Math.max(0,c.isc*(1-C1*(Math.exp(V/(C2*c.voc))-1)));
}
function bMpp(c,nS,nP){
  let best={V:0,I:0,P:0};if(c.voc<=0)return best;
  for(let i=1;i<=160;i++){const V=c.voc*nS*i/160,I=nP*bIat(c,V/nS),P=V*I;if(P>best.P)best={V,I,P}}
  return best;
}
const bRcab=c=>0.0175*2*c.len/c.mm;
/* one electrical solution for a given set of opened (tripped / switched-off) devices */
function bCalc(op){
  const S=BN,P=bSel(benchPanels(),S.panel),C=bCtrlSel(),I=bInvSel(),B=bBank();
  const cond=bPv(P,S.G,S.Ta),nS=Math.max(1,S.nS|0),nP=Math.max(1,S.nP|0),Rpv=bRcab(S.cPV),Rbc=bRcab(S.cB);
  const Voc=nS*cond.voc,mp=bMpp(cond,nS,nP),ocv=B.ocv(S.soc);
  const ctrlSys=C.sys.includes(S.sys),dead=Voc>C.vocMax,ctrlOk=ctrlSys&&!dead&&B.ok;
  const pvOn=!op.PVB&&!op.PVF;
  const L=BLOAD.map(d=>({d,q:(S.loads[d.id]||{}).on?Math.max(0,(S.loads[d.id]||{}).q|0):0})).filter(x=>x.q>0);
  const Pdc0=L.filter(x=>x.d.kind==='dc').reduce((a,x)=>a+x.d.w*x.q,0),Pac0=L.filter(x=>x.d.kind==='ac').reduce((a,x)=>a+x.d.w*x.q,0);
  const Iac0=L.filter(x=>x.d.kind==='ac').reduce((a,x)=>a+x.d.w*x.q/(230*x.d.pf),0);
  const run=cut=>{
    let Inet=0,st={};
    const live=!cut&&!op.BF;
    const invRun=!!(I&&S.invOn&&!op.INV&&!op.BBK&&live);
    for(let k=0;k<40;k++){
      const Vt=ocv+Inet*B.R,Vbus=op.BF?B.V:Vt+Inet*Rbc,vb=Math.max(Vbus,B.V*.4);
      const Pdc=live?Pdc0:0,Pac=invRun&&!op.ACB?Pac0:0,Pid=invRun?0.01*I.pac+6:0;
      const Iinv=invRun?(Pac/I.eff+Pid)/vb:0,Idc=Pdc/vb;
      let ic=0,Ia=0;
      if(ctrlOk&&pvOn&&!op.BF){
        if(C.type==='mppt'){
          if(mp.V-mp.I*Rpv>vb+2){const Pout=Math.max(0,mp.P-mp.I*mp.I*Rpv)*C.eff;ic=Pout/vb}
        }else{
          const Va=vb+0.8;ic=nP*bIat(cond,Va/nS)*C.eff;
        }
        const room=Math.max(0,Math.min(B.maxChg,((S.soc>=100?B.vfl:B.vabs)-ocv)/(B.R+Rbc)));
        ic=Math.min(ic,C.imax,Idc+Iinv+room);
      }
      const In=ic-Idc-Iinv;
      Inet+=(In-Inet)*.6;
      st={Vt,Vbus,vb,Pdc,Pac,Pid,Iinv,Idc,ic,Inet:In,invRun};
    }
    st.Vt=ocv+st.Inet*B.R;st.Vbus=op.BF?B.V:st.Vt+st.Inet*Rbc;
    return st;
  };
  let cut=false,note=[],st=run(false);
  if(!op.BF&&(st.Idc>0||st.Iinv>0)&&st.Vbus<B.lvd){cut=true;st=run(true);note.push('lvd')}
  else if(-st.Inet>B.maxDis){cut=true;st=run(true);note.push('bms')}
  const mppt=C.type==='mppt';
  let Ia=0;
  if(ctrlOk&&pvOn&&st.ic>0)Ia=mppt?Math.min(nP*cond.isc,st.ic*st.vb/(Math.max(mp.V-mp.I*Rpv,1)*C.eff)):Math.min(nP*cond.isc,st.ic/C.eff);
  const Vop=(ctrlOk&&pvOn&&st.ic>.01)?(mppt?mp.V:st.vb+.8):Voc;
  const Iac=st.invRun&&!op.ACB?Iac0:0;
  const Pac=st.invRun&&!op.ACB?Pac0:0;
  /* surge: worst single load starting while others run */
  let surgeW=0,surgeLoad=null;
  L.filter(x=>x.d.kind==='ac').forEach(x=>{const s=Pac0-x.d.w+x.d.w*x.d.surge;if(s>surgeW){surgeW=s;surgeLoad=x.d}});
  const v={};
  v['ARR+']=Vop;v['PVF.i']=Vop;v['PVF.o']=op.PVF?0:Vop;v['PVB.i']=v['PVF.o'];v['PVB.o']=op.PVB?0:v['PVB.i'];v['CTRL.pv+']=v['PVB.o'];v['SPD+']=v['PVB.o'];
  v['BAT+']=st.Vt;v['BF.i']=st.Vt;v['BF.o']=op.BF?0:st.Vbus;v['CTRL.b+']=v['BF.o'];v['BBK.i']=v['BF.o'];v['BBK.o']=op.BBK?0:v['BBK.i'];v['INV.d+']=v['BBK.o'];v['DCL+']=v['BF.o'];
  v['INV.L']=st.invRun?230:0;v['ACB.i']=v['INV.L'];v['ACB.o']=op.ACB?0:v['ACB.i'];v['ACL.L']=v['ACB.o'];
  Object.keys(BPORT).forEach(k=>{if(v[k]===undefined)v[k]=0});
  const fl={Ia,Ic:st.ic,Ibat:st.Inet,Iinv:st.Iinv,Idc:st.Idc,Iac,z:0};
  const trips=[];
  const A=(k,i,a,m)=>{if(a>0&&i>m*a&&!op[k])trips.push(k)};
  A('PVF',nP>0?Ia/nP:0,S.pf.a,1.6);A('PVB',Ia,S.pb.a,1.45);A('BF',Math.abs(st.Inet),S.bf.a,1.6);A('BBK',st.Iinv,S.bb.a,1.45);A('ACB',Iac,S.acb,1.45);
  if(I&&st.invRun&&Pac>I.pac*1.1&&!op.INV)trips.push('INV');
  return{op,trips,cond,P,C,I,B,nS,nP,Voc,mp,ocv,ctrlOk,ctrlSys,dead,pvOn,st,cut,note,Ia,Vop,Iac,Pac,Pac0,Pdc0,Iac0,surgeW,surgeLoad,Rpv,Rbc,v,fl,L};
}
function bSolve(){
  const op={};
  Object.keys(BN.sw).forEach(k=>{if(!BN.sw[k])op[k]=1});
  Object.keys(BLATCH).forEach(k=>{op[k]=1});
  let r=bCalc(op);
  for(let i=0;i<6&&r.trips.length;i++){r.trips.forEach(k=>{BLATCH[k]=1;op[k]=1});r=bCalc(op)}
  r.tripped=Object.keys(BLATCH).concat(Object.keys(BN.sw).filter(k=>!BN.sw[k]));
  r.fault=bFault(r);r.checks=bChecks(r);
  return r;
}
const bAmp=mm=>B_AMP[mm]||30;
function bFault(r){
  const S=BN,o=[],sc=S.sc;
  if(sc==='none')return null;
  const add=(l,t)=>o.push([l,t]);
  const bfOk=S.bf.a>0&&!r.op.BF;
  if(sc==='bshort'||sc==='rev'){
    const Ish=r.st.Vt/(r.B.R+0.002);
    add('warn',`กระแสลัดวงจรที่ขั้วแบต ≈ ${f(Ish/1000,1)} kA (แรงดัน ${f(r.st.Vt,1)} V ÷ ความต้านทาน ${f((r.B.R+.002)*1000,0)} mΩ)${sc==='rev'?' — ต่อขั้วกลับด้านทำให้กระแสสูงเท่ากันผ่านตัวควบคุม/อินเวอร์เตอร์':''}`);
    if(!bfOk||S.bf.t==='ac')add('err','ไม่มีฟิวส์แบตเตอรี่ที่ใช้ได้กับ DC: กระแสระดับ kA ไหลต่อเนื่องจนสายร้อนจัดหรือไฟไหม้ แบตลิเธียมให้กระแสลัดวงจรสูงมาก ต้องมีฟิวส์ใกล้ขั้วแบตเสมอ');
    else{
      if(B_VRAT[S.bf.t]<r.B.V*1.25)add('err',`ฟิวส์ชนิดนี้ทนแรงดัน DC ${B_VRAT[S.bf.t]} V ต่ำกว่าแรงดันแบต ${f(r.B.V,0)} V ฟิวส์อาจตัดอาร์กไม่ขาดและลุกไหม้`);
      else if(Ish>B_CAP[S.bf.t])add('err',`กระแสลัดวงจร ${f(Ish/1000,1)} kA เกินความสามารถตัดกระแส (${f(B_CAP[S.bf.t]/1000,0)} kA) ของฟิวส์`);
      else add('ok',`ฟิวส์ ${S.bf.a} A ตัดวงจรได้ทันที (กระแสลัดวงจรเป็น ${f(Ish/S.bf.a,0)} เท่าของพิกัด) และอยู่ในความสามารถตัดกระแส`);
      if(S.bf.a>bAmp(S.cB.mm)*.8)add('warn',`ฟิวส์ ${S.bf.a} A ใหญ่กว่าที่สาย ${S.cB.mm} mm² รับได้ (≈ ${f(bAmp(S.cB.mm)*.8,0)} A) ฟิวส์ต้องป้องกันสายก่อน`);
    }
  }else if(sc==='pvshort'){
    const rev=Math.max(0,(r.nP-1)*r.cond.isc),mf=Math.round(r.P.isc*1.9);
    if(r.nP<2)add('ok',`มีสตริงเดียว: กระแสลัดวงจรเท่ากับ Isc ≈ ${f(r.cond.isc,1)} A ไม่เกินพิกัดแผง ไม่มีกระแสย้อน`);
    else{
      add('warn',`ถ้าสตริงหนึ่งลัดวงจร อีก ${r.nP-1} สตริงจะป้อนกระแสย้อน ≈ ${f(rev,1)} A ผ่านสตริงนั้น (พิกัดฟิวส์อนุกรมของแผงประมาณ ${mf} A)`);
      if(!(S.pf.a>0)||S.pf.t==='ac'){
        if(rev>mf)add('err','ไม่มีฟิวส์สตริง (หรือใช้ฟิวส์ AC): กระแสย้อนเกินที่แผงทนได้ แผงอาจร้อนจัดหรือไหม้ ควรใส่ฟิวส์ gPV ทุกสตริงเมื่อขนาน 3 สตริงขึ้นไป');
        else add('warn','กระแสย้อนยังไม่เกินพิกัดแผง แต่แนะนำฟิวส์สตริงเมื่อขนานตั้งแต่ 3 สตริงขึ้นไป');
      }else if(rev>1.35*S.pf.a)add('ok',`ฟิวส์สตริง ${S.pf.a} A ขาดและตัดสตริงที่ลัดวงจรได้ (กระแสย้อน ${f(rev/S.pf.a,1)} เท่าของพิกัด)`);
      else add('err',`ฟิวส์ ${S.pf.a} A ไม่ขาด เพราะกระแสย้อน ${f(rev,1)} A ต่ำกว่า 1.35 เท่าของพิกัด แต่ก็ยังค้างผ่านสตริงที่เสีย ควรเลือกฟิวส์ให้เล็กลง (1.56×Isc ≈ ${f(1.56*r.P.isc,1)} A ขึ้นไป)`);
    }
  }else if(sc==='surge'){
    const need=1.2*r.nS*bPv(r.P,1000,S.tmin).voc;
    if(!(S.spd>0))add('err','ไม่มี SPD: แรงดันเกินจากฟ้าผ่าเหนี่ยวนำเข้าสายแผงไปยังชาร์จคอนโทรลเลอร์และอินเวอร์เตอร์ โดยตรง อุปกรณ์เสียหายได้');
    else if(S.spd<need)add('err',`SPD มี Uc ${S.spd} V ต่ำกว่าที่ต้องการ ≈ ${f(need,0)} V (1.2 × Voc ที่อุณหภูมิต่ำ) SPD อาจร้อนและเสื่อมเองแม้ไม่มีฟ้าผ่า`);
    else add('ok',`SPD Uc ${S.spd} V ≥ ${f(need,0)} V ใช้ได้: เมื่อมีแรงดันเกิน SPD จะนำกระแสลงกราวด์ก่อนเข้าตัวควบคุม (ต้องต่อสายกราวด์สั้นและตรง)`);
  }else if(sc==='acshort'){
    const I=r.I;
    if(!I)add('warn','ไม่ได้ติดตั้งอินเวอร์เตอร์ จึงไม่มีไฟ AC');
    else{
      const Ik=I.surge*1.2/230,tp=S.acb>0?7*S.acb:Infinity;
      add('warn',`อินเวอร์เตอร์จำกัดกระแสลัดวงจร AC ≈ ${f(Ik,0)} A (ไม่เหมือนไฟกริดที่จ่ายได้หลาย kA)`);
      if(!(S.acb>0))add('err','ไม่มีเบรกเกอร์ AC: ถ้าลัดวงจรจะพึ่งการป้องกันของอินเวอร์เตอร์เท่านั้น และสายโหลดไม่ได้รับการป้องกัน');
      else if(Ik>=tp)add('ok',`เบรกเกอร์ AC ${S.acb} A ทริปทันที (กระแส ${f(Ik,0)} A ≥ 7 × ${S.acb} A)`);
      else add('warn',`เบรกเกอร์ AC ${S.acb} A ไม่ทริปทันที เพราะกระแสลัดวงจร ${f(Ik,0)} A ต่ำกว่า 7 × ${S.acb} = ${tp} A ต้องรอให้อินเวอร์เตอร์ตัดเอง ใช้เบรกเกอร์ขนาดเล็กลงหรือสายสั้นลงเพื่อให้ทริปไว`);
    }
  }
  return{title:(B_SCEN.find(x=>x[0]===sc)||[])[1]||'',items:o};
}
function bChecks(r){
  const S=BN,o=[],add=(l,t)=>o.push([l,t]),{P,C,I,B}=r;
  const vocCold=r.nS*bPv(P,1000,S.tmin).voc,vmpHot=r.nS*bPv(P,1000,S.tmin+55).vmp;
  /* system */
  if(!C.sys.includes(S.sys))add('err',`ตัวควบคุมรุ่นนี้ไม่รองรับระบบ ${S.sys} V (รองรับ ${C.sys.join('/')} V)`);
  if(!B.ok)add('err',`แบตเตอรี่ที่เลือกต่อได้ ${f(B.V,1)} V ไม่ตรงกับระบบ ${S.sys} V`);
  else add('ok',`แบตเตอรี่ ${B.ns} ลูกอนุกรม × ${B.p} ขนาน = ${f(B.V,1)} V ${f(B.Ah,0)} Ah (${f(B.V*B.Ah/1000,2)} kWh)`);
  /* array */
  if(vocCold>C.vocMax)add('err',`Voc ที่อุณหภูมิต่ำ ${S.tmin}°C = ${f(vocCold,0)} V เกินที่ตัวควบคุมรับได้ ${C.vocMax} V ตัวควบคุมจะเสียหาย ลดจำนวนแผงอนุกรม`);
  else if(vocCold>C.vocMax*.9)add('warn',`Voc ที่อุณหภูมิต่ำ ${f(vocCold,0)} V ใกล้ขีดจำกัด ${C.vocMax} V (เหลือไม่ถึง 10%)`);
  else add('ok',`Voc ที่อุณหภูมิต่ำ ${f(vocCold,0)} V ไม่เกินตัวควบคุม ${C.vocMax} V`);
  if(C.type==='mppt'){
    if(vmpHot<B.vabs+3)add('warn',`Vmp ตอนร้อน ≈ ${f(vmpHot,0)} V ใกล้แรงดันชาร์จของแบต ${f(B.vabs,1)} V MPPT อาจชาร์จไม่เข้าตอนแดดร้อน ควรต่ออนุกรมเพิ่ม`);
    else add('ok',`Vmp ตอนร้อน ≈ ${f(vmpHot,0)} V สูงกว่าแรงดันแบต เพียงพอสำหรับ MPPT`);
  }else{
    const vmpSTC=r.nS*P.vmp;
    if(vmpSTC>S.sys*1.8)add('warn',`ตัวควบคุม PWM ดึงแรงดันแผงลงมาเท่าแบต (~${f(B.V+.8,0)} V) แต่แผงอนุกรมนี้ Vmp ${f(vmpSTC,0)} V → ใช้กำลังได้เพียง ≈ ${f((B.V+.8)/vmpSTC*100,0)}% ของที่แผงผลิตได้ ใช้ MPPT หรือแผงที่เหมาะกับ ${S.sys} V`);
    else add('ok','แรงดันแผงเหมาะกับตัวควบคุม PWM');
  }
  const Pstc=r.nS*r.nP*P.pmax;
  if(Pstc>C.imax*B.vabs*1.4&&C.type==='mppt')add('warn',`กำลังแผง ${f(Pstc,0)} W มากกว่าที่ตัวควบคุม ${C.imax} A × ${f(B.vabs,0)} V ≈ ${f(C.imax*B.vabs,0)} W รับได้เกิน 40% จะถูกตัดยอด`);
  if(r.st.ic>=C.imax-.01&&r.Ia>0)add('warn',`กระแสชาร์จถึงขีดจำกัดตัวควบคุม ${C.imax} A แล้ว (ถูกตัดยอด)`);
  if(r.st.ic>B.maxChg)add('warn',`กระแสชาร์จ ${f(r.st.ic,0)} A เกินที่แบตรับได้ ${f(B.maxChg,0)} A`);
  /* protection */
  const iscSTC=r.nP>0?P.isc:0;
  if(r.nP>=3&&!(S.pf.a>0))add('warn','ขนาน 3 สตริงขึ้นไป ควรมีฟิวส์ gPV ทุกสตริง');
  if(S.pf.a>0){
    if(S.pf.t==='ac')add('err','ฟิวส์สตริงเป็นแบบ AC ใช้ตัดกระแส DC ของแผงไม่ได้ ต้องใช้ gPV (DC)');
    else if(S.pf.a<1.56*iscSTC)add('warn',`ฟิวส์สตริง ${S.pf.a} A เล็กกว่า 1.56 × Isc = ${f(1.56*iscSTC,1)} A อาจขาดเองตอนแดดจัด`);
    else if(S.pf.a>Math.round(P.isc*1.9))add('warn',`ฟิวส์สตริง ${S.pf.a} A ใหญ่กว่าฟิวส์สูงสุดที่แผงรับได้ ≈ ${Math.round(P.isc*1.9)} A`);
    else add('ok',`ฟิวส์สตริง ${S.pf.a} A อยู่ในช่วง 1.56×Isc ถึงพิกัดสูงสุดของแผง`);
  }
  const Iarr=r.nP*P.isc;
  if(S.pb.a>0){
    if(S.pb.t==='ac')add('err','เบรกเกอร์ฝั่งแผงเป็นแบบ AC ตัดอาร์ก DC ไม่ได้ อาจไหม้ ต้องใช้เบรกเกอร์ DC');
    else if(B_VRAT[S.pb.t]<vocCold)add('err',`เบรกเกอร์ทนแรงดัน DC ${B_VRAT[S.pb.t]} V ต่ำกว่า Voc ${f(vocCold,0)} V`);
    else if(S.pb.a<1.25*Iarr)add('warn',`เบรกเกอร์ DC ${S.pb.a} A น้อยกว่า 1.25 × Isc รวม = ${f(1.25*Iarr,0)} A อาจทริปเอง`);
    else add('ok',`เบรกเกอร์ DC ฝั่งแผง ${S.pb.a} A / ${B_VRAT[S.pb.t]} V ใช้ได้`);
  }else add('warn','ไม่มีเบรกเกอร์/สวิตช์ DC ฝั่งแผง จะตัดแผงออกเพื่อซ่อมบำรุงไม่ได้');
  if(!(S.spd>0))add('warn','ไม่มี SPD ฝั่ง DC (แนะนำอย่างยิ่งในไทยที่มีฟ้าผ่ามาก)');
  else if(S.spd<1.2*vocCold)add('err',`SPD Uc ${S.spd} V ต่ำกว่า 1.2 × Voc = ${f(1.2*vocCold,0)} V`);
  else add('ok',`SPD Uc ${S.spd} V เหมาะกับ Voc ${f(vocCold,0)} V`);
  const Iinvmax=I?I.pac/(I.eff*B.V*.85):0;
  if(!(S.bf.a>0))add('err','ไม่มีฟิวส์แบตเตอรี่');
  else{
    if(S.bf.t==='ac')add('err','ฟิวส์แบตเตอรี่เป็นแบบ AC ใช้ไม่ได้กับวงจร DC');
    else if(B_VRAT[S.bf.t]<B.V*1.25)add('err',`ฟิวส์แบตทนแรงดัน DC ${B_VRAT[S.bf.t]} V ไม่พอสำหรับระบบ ${f(B.V,0)} V`);
    else if(S.bf.a<1.25*Math.max(Iinvmax*.9,r.st.ic))add('warn',`ฟิวส์แบต ${S.bf.a} A น้อยกว่า 1.25 × กระแสสูงสุด ≈ ${f(1.25*Math.max(Iinvmax*.9,r.st.ic),0)} A`);
    else add('ok',`ฟิวส์แบต ${S.bf.a} A ${B_VRAT[S.bf.t]} V ใช้ได้`);
    if(S.bf.a>bAmp(S.cB.mm)*.8)add('warn',`ฟิวส์แบต ${S.bf.a} A ใหญ่กว่าที่สายแบต ${S.cB.mm} mm² รับได้ (≈ ${f(bAmp(S.cB.mm)*.8,0)} A)`);
  }
  if(I&&S.bb.a>0){
    if(S.bb.t==='ac')add('err','เบรกเกอร์ DC ของอินเวอร์เตอร์เป็นแบบ AC ใช้ไม่ได้');
    else if(S.bb.a<1.25*Iinvmax*.9)add('warn',`เบรกเกอร์ DC อินเวอร์เตอร์ ${S.bb.a} A น้อยกว่ากระแสเต็มพิกัด ≈ ${f(1.25*Iinvmax*.9,0)} A`);
    else add('ok',`เบรกเกอร์ DC อินเวอร์เตอร์ ${S.bb.a} A ใช้ได้`);
  }
  if(I&&S.acb>0){
    const In=I.pac/230;
    if(S.acb<In*1.0)add('warn',`เบรกเกอร์ AC ${S.acb} A น้อยกว่ากระแสเต็มพิกัดอินเวอร์เตอร์ ≈ ${f(In,1)} A`);
    else add('ok',`เบรกเกอร์ AC ${S.acb} A ใช้ได้`);
  }else if(I)add('warn','ไม่มีเบรกเกอร์ AC หลังอินเวอร์เตอร์');
  /* cables */
  const vdPv=r.Ia*r.Rpv/Math.max(r.mp.V,1)*100,vdB=Math.abs(r.st.Inet)*r.Rbc/Math.max(B.V,1)*100;
  if(r.Ia>bAmp(S.cPV.mm))add('err',`สาย PV ${S.cPV.mm} mm² รับได้ ≈ ${bAmp(S.cPV.mm)} A แต่มีกระแส ${f(r.Ia,1)} A`);
  else if(Iarr*1.25>bAmp(S.cPV.mm))add('warn',`สาย PV ${S.cPV.mm} mm² (≈ ${bAmp(S.cPV.mm)} A) น้อยกว่า 1.25 × Isc รวม ${f(Iarr*1.25,0)} A`);
  if(vdPv>3)add(vdPv>5?'err':'warn',`แรงดันตกในสาย PV ${f(vdPv,1)}% (ควร ≤ 3%) เพิ่มขนาดสายหรือลดความยาว`);
  const Ibmax=Math.max(Math.abs(r.st.Inet),Iinvmax*.6);
  if(Ibmax>bAmp(S.cB.mm)*.8)add('warn',`สายแบต ${S.cB.mm} mm² รับต่อเนื่องได้ ≈ ${f(bAmp(S.cB.mm)*.8,0)} A น้อยกว่ากระแสที่ใช้ ≈ ${f(Ibmax,0)} A`);
  if(vdB>2)add(vdB>4?'err':'warn',`แรงดันตกในสายแบต ${f(vdB,1)}% (ควร ≤ 2%) กระแสสูง ระบบ 12 V จะตกมากกว่า 48 V`);
  /* loads */
  if(I){
    if(r.Pac0>I.pac)add('err',`โหลด AC รวม ${f(r.Pac0,0)} W เกินพิกัดอินเวอร์เตอร์ ${I.pac} W`);
    if(r.surgeLoad&&r.surgeW>I.surge)add('warn',`ตอนสตาร์ท ${r.surgeLoad.name} กำลังชั่วขณะ ≈ ${f(r.surgeW,0)} W เกินพีกของอินเวอร์เตอร์ ${I.surge} W อินเวอร์เตอร์อาจตัดทันที`);
  }else if(r.Pac0>0)add('warn','มีโหลด AC แต่ไม่ได้เลือกอินเวอร์เตอร์');
  if(r.note.includes('lvd'))add('err',`แรงดันแบตต่ำกว่า ${f(B.lvd,1)} V ระบบตัดโหลด (LVD) เพื่อป้องกันแบต`);
  if(r.note.includes('bms'))add('err',`กระแสจ่ายเกินที่แบตจ่ายได้ ${f(B.maxDis,0)} A BMS ตัดโหลด`);
  r.tripped.forEach(k=>add('err',({PVF:'ฟิวส์สตริงขาด/ถูกตัด',PVB:'เบรกเกอร์ DC ฝั่งแผงเปิด/ทริป',BF:'ฟิวส์แบตขาด/ถูกตัด',BBK:'เบรกเกอร์ DC อินเวอร์เตอร์เปิด/ทริป',ACB:'เบรกเกอร์ AC เปิด/ทริป',INV:'อินเวอร์เตอร์ปิด (โอเวอร์โหลด/สวิตช์)'})[k]+' — แตะที่อุปกรณ์เพื่อรีเซ็ต/ปิด-เปิด'));
  return o;
}
