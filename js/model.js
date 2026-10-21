
const W=1200,PW0=96,PH0=52,IX0=1010,MAXP=40,IW=160,IHT=140;
let H=680,PW=PW0,PH=PH0;
/* each MPPT input is its own box (drag and rotate separately so wires to MPPT 1 and 2 do not cross).
   r = side the DC terminals face: 0 left, 1 top, 2 right, 3 bottom; text stays upright */
/* number of MPPT boxes follows the inverter (nmppt, 1–4; string inverters 2, Deye micro 4) */
const nMp=()=>{try{return Math.max(1,Math.min(4,Math.round(+curInv().nmppt||2)))}catch(e){return 2}};
const INV_Y={1:[180],2:[90,270],3:[40,220,400],4:[28,188,348,508]};
const INV0=n=>INV_Y[n||nMp()].map(y=>({x:IX0,y,r:0}));
let INV=INV0(2);
const mpKs=()=>INV.map((_,i)=>i+1);
const mpKeys=()=>mpKs().flatMap(k=>[`i${k}:p`,`i${k}:n`]);
/* inverter changed to one with a different MPPT count: re-lay the boxes, drop wires to inputs that no longer exist */
function syncInvN(){const n=nMp();if(INV.length===n)return false;INV=INV0(n);st.wires=st.wires.filter(w=>[w.a,w.b].every(k=>k[0]!=='i'||+k.slice(1,k.indexOf(':'))<=n));clampInv();return true}
/* panel model per MPPT ('' = the main panel chosen in tab 01) */
let MP_PM={};
function pvOf(id){const p=id&&typeof CAT!=='undefined'&&CAT.panels.find(x=>x.id===id);return p?Object.assign({},p,{name:(p.brand+' '+p.model).trim(),noct:p.noct||43}):PV}
const mpPV=k=>pvOf(MP_PM[k]);
/* microinverters: menu 02 wires ONE unit; MICRO.n identical units make the system (AC side planned in menu 03) */
const isMicro=I=>{try{return String((I||curInv()).micro||'')==='1'}catch(e){return false}};
const MICRO={n:1,br:2,brk:20,cab:4,len:15,cap:true,rcd:true,pe:true};
const microU=I=>isMicro(I)?Math.max(1,MICRO.n|0):1;
const microIac=I=>+I.iac>0?+I.iac:(+I.pac||0)/220;
const ibHz=k=>INV[k-1].r%2===1,ibW=k=>ibHz(k)?IHT:IW,ibH=k=>ibHz(k)?IW:IHT;
function invBlk(k){const b=INV[k-1];return{x:b.x+8,y:b.y+8,w:ibW(k)-16,h:ibH(k)-16}}
function invTerm(k,pos){
  const b=INV[k-1],o=pos?30:110;
  if(!ibHz(k))return{x:b.r===0?b.x:b.x+IW,y:b.y+o};
  return{x:b.x+o,y:b.r===1?b.y:b.y+IW};
}
const INV_DIR=[[-1,0],[0,-1],[1,0],[0,1]];
function clampInv(k){
  if(!k){mpKs().forEach(clampInv);return}
  const b=INV[k-1];b.x=Math.round(Math.max(4,Math.min(W-ibW(k)-30,b.x)));b.y=Math.round(Math.max(28,Math.min(H-ibH(k)-(b.r===1?30:8),b.y)));
}
function rotInv(k){
  if(!k){mpKs().forEach(rotInv);return}
  const b=INV[k-1],cx=b.x+ibW(k)/2,cy=b.y+ibH(k)/2;b.r=(b.r+1)%4;b.x=cx-ibW(k)/2;b.y=cy-ibH(k)/2;clampInv(k);
}
const st={panels:[],wires:[],nextId:1,sel:null,inv:'s',tmin:10,thot:70,armed:null,scale:1};
const f=(x,d=0)=>Number(x).toFixed(d);
const RANK={err:0,warn:1,ok:2};
const LABEL={ok:'ผ่าน',warn:'ควรระวัง',err:'ไม่ผ่าน',idle:'ว่าง'};
const GLYPH={ok:'✓',warn:'!',err:'×'};

/* ---- model ---- */
function slotGeom(){const gx=Math.max(26,46*st.scale),gy=Math.max(34,64*st.scale),cw=PW+gx,ch=PH+gy;return{cw,ch,cols:Math.max(1,Math.floor((IX0-64)/cw))}}
const slot=i=>{const g=slotGeom();return{x:24+(i%g.cols)*g.cw,y:34+Math.floor(i/g.cols)*g.ch}};
const clampScale=s=>Math.max(.35,Math.min(1.5,+s||1));
function applyScale(s){st.scale=clampScale(s);PW=PW0*st.scale;PH=PH0*st.scale}
function setScale(s){
  const c=st.panels.map(p=>[p.x+PW/2,p.y+PH/2]);
  applyScale(s);
  st.panels.forEach((p,i)=>{p.x=c[i][0]-PW/2;p.y=c[i][1]-PH/2;clampPanel(p)});
}
function layoutAll(){INV=INV0();st.panels.forEach((p,i)=>{const s=slot(i);p.sx=i;p.x=s.x;p.y=s.y;p.rot=0});}
function addPanel(){
  if(st.panels.length>=MAXP)return null;
  let i=0;while(st.panels.some(p=>p.sx===i))i++;
  const s=slot(i),id=Math.max(st.nextId,Math.max(0,...st.panels.map(q=>q.id))+1),p={id,x:s.x,y:s.y,sx:i,rot:0};
  st.nextId=id+1;
  st.panels.push(p);return p;
}
function resetWith(n){st.panels=[];st.wires=[];st.nextId=1;st.sel=null;st.armed=null;for(let i=0;i<n;i++)addPanel()}
const wire=(a,b)=>st.wires.push({a,b});
function wireSeries(ids,k){
  wire(`i${k}:n`,`${ids[0]}:n`);
  for(let j=0;j<ids.length-1;j++)wire(`${ids[j]}:p`,`${ids[j+1]}:n`);
  wire(`${ids[ids.length-1]}:p`,`i${k}:p`);
}
const PRESETS={
  s9(){resetWith(9);wireSeries([1,2,3,4,5,6,7,8,9],1)},
  p3(){resetWith(3);[1,2,3].forEach(i=>{wire(`${i}:p`,'i1:p');wire(`${i}:n`,'i1:n')})},
  m22(){resetWith(4);wire('i1:n','1:n');wire('i1:n','3:n');wire('1:p','2:n');wire('3:p','4:n');wire('2:p','i1:p');wire('4:p','i1:p')},
  two(){resetWith(10);wireSeries([1,2,3,4,5],1);wireSeries([6,7,8,9,10],2)},
  one(){resetWith(1)},
  sh(){resetWith(3);wire('i1:n','1:n');wire('1:p','2:n');wire('2:p','i1:p');wire('3:p','3:n')},
  big(){applyScale(.6);resetWith(18);wireSeries([1,2,3,4,5,6,7,8,9],1);wireSeries([10,11,12,13,14,15,16,17,18],2)},
  m4(){applyScale(1);INV=INV0();resetWith(Math.min(4,INV.length));mpKs().forEach(k=>{const p=st.panels[k-1];if(!p)return;p.x=IX0-300;p.y=INV[k-1].y+IHT/2-PH/2;p.sx=100+k;wire(`i${k}:n`,`${k}:n`);wire(`${k}:p`,`i${k}:p`)})},
  bad(){resetWith(3);wire('i1:n','1:n');wire('1:p','2:n');wire('2:p','3:p');wire('3:n','i1:p')}
};

