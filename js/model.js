
const W=1200,PW0=96,PH0=52,IX0=1010,MAXP=40,INVY0=90,IW=160,IHT=270;
/* inverter MPPT input box position (draggable); terminals sit on the side facing the middle of the canvas */
let IX=IX0,INVY=INVY0;
/* IROT = side the DC terminals face: 0 left, 1 top, 2 right, 3 bottom (rotated in 90° steps, text stays upright) */
let IROT=0;
const invHz=()=>IROT%2===1,invW=()=>invHz()?IHT:IW,invH=()=>invHz()?IW:IHT;
function invBlk(k){return invHz()?{x:IX+10+(k-1)*130,y:INVY+8,w:120,h:144}:{x:IX+8,y:INVY+10+(k-1)*130,w:144,h:120}}
function invTerm(k,pos){
  const b=invBlk(k),o=pos?22:100;
  if(!invHz())return{x:IROT===0?IX:IX+IW,y:b.y+o};
  return{x:b.x+o,y:IROT===1?INVY:INVY+IW};
}
const INV_DIR=[[-1,0],[0,-1],[1,0],[0,1]];
function clampInv(){IX=Math.round(Math.max(4,Math.min(W-invW()-4,IX)));INVY=Math.round(Math.max(28,Math.min(H-invH()-(IROT===1?30:8),INVY)))}
function rotInv(){const cx=IX+invW()/2,cy=INVY+invH()/2;IROT=(IROT+1)%4;IX=cx-invW()/2;INVY=cy-invH()/2;clampInv()}
let H=680,PW=PW0,PH=PH0;
const mpY=k=>INVY+10+(k-1)*130;
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
function layoutAll(){IX=IX0;INVY=INVY0;IROT=0;st.panels.forEach((p,i)=>{const s=slot(i);p.sx=i;p.x=s.x;p.y=s.y;p.rot=0});}
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
  bad(){resetWith(3);wire('i1:n','1:n');wire('1:p','2:n');wire('2:p','3:p');wire('3:n','i1:p')}
};

