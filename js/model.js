
const W=760,H=440,PW=96,PH=52,IX=585,MAXP=12;
const st={panels:[],wires:[],nextId:1,sel:null,inv:'s',tmin:10,thot:70,armed:null};
const f=(x,d=0)=>Number(x).toFixed(d);
const RANK={err:0,warn:1,ok:2};
const LABEL={ok:'ผ่าน',warn:'ควรระวัง',err:'ไม่ผ่าน',idle:'ว่าง'};
const GLYPH={ok:'✓',warn:'!',err:'×'};

/* ---- model ---- */
const slot=i=>({x:24+(i%4)*136,y:34+Math.floor(i/4)*128});
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
  bad(){resetWith(3);wire('i1:n','1:n');wire('1:p','2:n');wire('2:p','3:p');wire('3:n','i1:p')}
};

