/* ---- site & shadow analysis: houses, trees, neighbouring buildings and zones on a plan; sun path, shadows, sun hours ----
   Coordinates in metres: x = east, y = north, origin = middle of our lot. rot = clockwise rotation in plan (degrees).
   Shadows on a plane at height z0 are the convex hull of each solid's vertices projected along the sun ray, which is exact for convex solids. */
const SITE={objs:[],nextId:1,lot:{w:20,d:30},view:50,date:'',h:15,mode:'shadow',period:'day',win:'all',sel:null,play:0};
const SI_KIND={laundry:'ลานซักล้าง / ตากผ้า',pool:'สระว่ายน้ำ',garden:'สวน / ปลูกต้นไม้',parking:'ที่จอดรถ',bedroom:'ห้องนอน',living:'ห้องนั่งเล่น',kitchen:'ครัว'};
const SI_ROOM={bedroom:1,living:1,kitchen:1};
const SI_TYPE={house:'บ้าน',bldg:'ตึกข้างเคียง',tree:'ต้นไม้',zone:'โซน'};
const SI_WIN={all:['ทั้งวัน',0,24],am:['เช้า (ก่อนเที่ยง)',0,12],pm:['บ่าย (หลังเที่ยง)',12,24],pm2:['บ่ายแรง 13:00–17:00',13,17]};
const SI_PER={day:'วันที่เลือก',summer:'ฤดูร้อน (มี.ค.–พ.ค.)',rainy:'ฤดูฝน (มิ.ย.–ต.ค.)',winter:'ฤดูหนาว (พ.ย.–ก.พ.)',year:'ทั้งปี'};
const SI_PER_M={summer:[3,4,5],rainy:[6,7,8,9,10],winter:[11,12,1,2],year:[1,2,3,4,5,6,7,8,9,10,11,12]};
const SI_EL_MIN=3*Math.PI/180;/* below 3 degrees the direct beam is ignored */

function siExample(){
  SITE.objs=[];SITE.nextId=1;SITE.lot={w:20,d:30};
  const A=o=>{o.id=SITE.nextId++;SITE.objs.push(o)};
  A({t:'house',name:'บ้าน',x:0,y:2,w:12,d:8,rot:0,h:3,roof:'gable',rh:2.5});
  A({t:'zone',kind:'bedroom',name:'ห้องนอน 1 (ฝั่งตะวันตก)',x:-3.5,y:3.5,w:5,d:5,rot:0});
  A({t:'zone',kind:'bedroom',name:'ห้องนอน 2 (ฝั่งตะวันออก)',x:3.5,y:3.5,w:5,d:5,rot:0});
  A({t:'zone',kind:'living',name:'ห้องนั่งเล่น',x:0,y:-0.5,w:12,d:3,rot:0});
  A({t:'zone',kind:'laundry',name:'ลานซักล้าง',x:6,y:-8,w:4,d:3,rot:0});
  A({t:'zone',kind:'pool',name:'สระว่ายน้ำ',x:-4,y:-9,w:6,d:3,rot:0});
  A({t:'zone',kind:'garden',name:'สวนหลังบ้าน',x:0,y:11,w:12,d:4,rot:0});
  A({t:'tree',name:'มะม่วง',x:-7,y:-5,r:3,h:8,ch:2.5});
  A({t:'bldg',name:'ตึกข้างบ้าน (ตะวันตก)',x:-17,y:2,w:8,d:16,rot:0,h:12});
  SITE.sel=null;
}
const siDeg=d=>d*Math.PI/180;
function siRect(o,ox,oy){
  const r=siDeg(o.rot||0),c=Math.cos(r),s=Math.sin(r),hw=o.w/2,hd=o.d/2;
  return[[-hw,-hd],[hw,-hd],[hw,hd],[-hw,hd]].map(([lx,ly])=>[(ox??o.x)+lx*c+ly*s,(oy??o.y)-lx*s+ly*c]);
}
function siLocal(o,x,y){const r=siDeg(o.rot||0),c=Math.cos(r),s=Math.sin(r),dx=x-o.x,dy=y-o.y;return[dx*c-dy*s,dx*s+dy*c]}
function siWorld(o,lx,ly){const r=siDeg(o.rot||0),c=Math.cos(r),s=Math.sin(r);return[o.x+lx*c+ly*s,o.y-lx*s+ly*c]}
/* solid as horizontal sections (convex); zones cast no shadow */
function siLevels(o){
  if(o.t==='tree'){const c=[];for(let k=0;k<12;k++){const a=k/12*2*Math.PI;c.push([o.x+o.r*Math.cos(a),o.y+o.r*Math.sin(a)])}return{lv:[{z:Math.min(o.ch,o.h-0.1),p:c},{z:o.h,p:c}],wall:0}}
  if(o.t==='house'||o.t==='bldg'){
    const R=siRect(o),lv=[{z:0,p:R},{z:o.h,p:R}];
    if(o.t==='house'&&o.roof==='gable'&&o.rh>0){const L=o.w>=o.d,a=L?[[-o.w/2,0],[o.w/2,0]]:[[0,-o.d/2],[0,o.d/2]];lv.push({z:o.h+o.rh,p:a.map(([lx,ly])=>siWorld(o,lx,ly))})}
    return{lv,wall:o.h};
  }
  return null;
}
function siHull(P){
  if(P.length<3)return P;
  P=P.slice().sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
  const cr=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]),lo=[],up=[];
  for(const p of P){while(lo.length>=2&&cr(lo[lo.length-2],lo[lo.length-1],p)<=0)lo.pop();lo.push(p)}
  for(let i=P.length-1;i>=0;i--){const p=P[i];while(up.length>=2&&cr(up[up.length-2],up[up.length-1],p)<=0)up.pop();up.push(p)}
  return lo.slice(0,-1).concat(up.slice(0,-1));
}
/* shadow of object o on the horizontal plane at height z0 for sun (az, el) */
function siShadow(o,sun,z0){
  const L=siLevels(o);if(!L||sun.el<SI_EL_MIN)return null;
  const t=1/Math.tan(sun.el),ux=-Math.sin(sun.az)*t,uy=-Math.cos(sun.az)*t,pts=[];
  L.lv.forEach(l=>{if(l.z<z0)return;const k=l.z-z0;l.p.forEach(p=>pts.push([p[0]+ux*k,p[1]+uy*k]))});
  if(L.wall>z0&&z0>0)L.lv[0].p.forEach(p=>pts.push(p));
  if(pts.length<3)return null;
  const h=siHull(pts);let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;h.forEach(p=>{x0=Math.min(x0,p[0]);x1=Math.max(x1,p[0]);y0=Math.min(y0,p[1]);y1=Math.max(y1,p[1])});
  return{id:o.id,p:h,b:[x0,y0,x1,y1]};
}
function siIn(x,y,S){
  if(x<S.b[0]||x>S.b[2]||y<S.b[1]||y>S.b[3])return false;
  const p=S.p;let c=false;
  for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])c=!c}
  return c;
}
function siSun(doy,h){const p=solarPos(SIM.lat,SIM.lon,doy,h,SIM.tz);return{az:p.az,el:Math.PI/2-p.zen}}
function siYear(){const y=+(SITE.date||'2026').slice(0,4);return isFinite(y)?y:2026}
function siDays(){
  if(SITE.period==='day')return[dayOfYear(SITE.date)];
  return SI_PER_M[SITE.period].map(m=>dayOfYear(`${siYear()}-${pad2(m)}-15`));
}
/* every analysis step: 30 minutes, sampled at :15 and :45, only inside the chosen time window */
function siSteps(){
  const w=SI_WIN[SITE.win],out=[];
  siDays().forEach(doy=>{for(let h=0.25;h<24;h+=0.5){if(h<w[1]||h>=w[2])continue;const s=siSun(doy,h);if(s.el>=SI_EL_MIN)out.push(s)}});
  return{steps:out,nd:siDays().length};
}
const siCasters=()=>SITE.objs.filter(o=>o.t!=='zone');
const siOurs=o=>Math.abs(o.x)<=SITE.lot.w/2&&Math.abs(o.y)<=SITE.lot.d/2;
const siHouseOf=z=>SITE.objs.find(o=>o.t==='house'&&(()=>{const l=siLocal(o,z.x,z.y);return Math.abs(l[0])<=o.w/2+.01&&Math.abs(l[1])<=o.d/2+.01})());

/* ---- analysis ---- */
function siAnalyse(){
  const {steps,nd}=siSteps(),dt=0.5/nd,C=siCasters();
  /* sun-hours grid over the view */
  const N=56,V=SITE.view,cs=V/N,hours=new Float32Array(N*N),shade=new Uint8Array(N*N);
  steps.forEach(sun=>{
    shade.fill(0);
    C.forEach(o=>{const S=siShadow(o,sun,0);if(!S)return;
      const i0=Math.max(0,Math.floor((S.b[0]+V/2)/cs)),i1=Math.min(N-1,Math.floor((S.b[2]+V/2)/cs)),j0=Math.max(0,Math.floor((V/2-S.b[3])/cs)),j1=Math.min(N-1,Math.floor((V/2-S.b[1])/cs));
      for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const k=j*N+i;if(!shade[k]&&siIn(-V/2+(i+.5)*cs,V/2-(j+.5)*cs,S))shade[k]=1}});
    for(let k=0;k<N*N;k++)if(!shade[k])hours[k]+=dt;
  });
  /* zones */
  const zones=SITE.objs.filter(o=>o.t==='zone').map(z=>{
    const room=SI_ROOM[z.kind],res={z,room:!!room,am:0,pm:0,pm2:0,all:0,walls:[]};
    let samples=[];
    if(room){
      const H=siHouseOf(z);res.house=H;
      if(H){
        const c=siRect(z).map(p=>siLocal(H,p[0],p[1])),xs=c.map(p=>p[0]),ys=c.map(p=>p[1]),lx0=Math.min(...xs),lx1=Math.max(...xs),ly0=Math.min(...ys),ly1=Math.max(...ys),tol=.6;
        [[0,ly1>=H.d/2-tol,'n'],[90,lx1>=H.w/2-tol,'e'],[180,ly0<=-H.d/2+tol,'s'],[270,lx0<=-H.w/2+tol,'w']].forEach(([a,on])=>{
          if(!on)return;const nAz=((H.rot||0)+a)%360;res.walls.push(nAz);
          for(let k=0;k<3;k++){const f=(k+.5)/3;let lx,ly;
            if(a===0||a===180){lx=Math.max(lx0,-H.w/2)+(Math.min(lx1,H.w/2)-Math.max(lx0,-H.w/2))*f;ly=a===0?H.d/2+.05:-H.d/2-.05}
            else{ly=Math.max(ly0,-H.d/2)+(Math.min(ly1,H.d/2)-Math.max(ly0,-H.d/2))*f;lx=a===90?H.w/2+.05:-H.w/2-.05}
            const w=siWorld(H,lx,ly);samples.push({x:w[0],y:w[1],z:1.5,n:siDeg(nAz),self:H.id})}
        });
      }
    }else{for(let a=0;a<3;a++)for(let b=0;b<3;b++){const w=siWorld(z,(a-1)/3*z.w,(b-1)/3*z.d);samples.push({x:w[0],y:w[1],z:0})}}
    res.n=samples.length;
    if(samples.length){
      const all=siAllSteps();
      all.forEach(({sun,h,nd2})=>{
        const zs=new Map();let lit=0;
        samples.forEach(p=>{
          if(p.n!=null&&Math.cos(sun.az-p.n)<=0)return;
          let key=p.z,Sh=zs.get(key);if(!Sh){Sh=C.map(o=>siShadow(o,sun,p.z)).filter(Boolean);zs.set(key,Sh)}
          if(!Sh.some(S=>S.id!==p.self&&siIn(p.x,p.y,S)))lit++;
        });
        const v=lit/samples.length*0.5/nd2;
        res.all+=v;if(h<12)res.am+=v;else res.pm+=v;if(h>=13&&h<17)res.pm2+=v;
      });
    }
    return res;
  });
  /* house walls */
  const walls=[];
  SITE.objs.filter(o=>o.t==='house').forEach(H=>{
    [0,90,180,270].forEach(a=>{
      const nAz=((H.rot||0)+a)%360,n=siDeg(nAz),r={H,nAz,am:0,pm:0,pm2:0,all:0,blk:0};
      const pts=[];for(let k=0;k<4;k++){const f=(k+.5)/4;let lx,ly;if(a===0||a===180){lx=-H.w/2+H.w*f;ly=a===0?H.d/2+.05:-H.d/2-.05}else{ly=-H.d/2+H.d*f;lx=a===90?H.w/2+.05:-H.w/2-.05}pts.push(siWorld(H,lx,ly))}
      siAllSteps().forEach(({sun,h,nd2})=>{
        if(Math.cos(sun.az-n)<=0)return;
        const Sh=C.filter(o=>o.id!==H.id).map(o=>siShadow(o,sun,1.5)).filter(Boolean);
        const lit=pts.filter(p=>!Sh.some(S=>siIn(p[0],p[1],S))).length/pts.length,v=0.5/nd2;
        r.all+=lit*v;r.blk+=(1-lit)*v;if(h<12)r.am+=lit*v;else r.pm+=lit*v;if(h>=13&&h<17)r.pm2+=lit*v;
      });
      walls.push(r);
    });
  });
  /* neighbours: strips just outside each side of our lot (shaded by our objects), our lot shaded by outside objects */
  const Lw=SITE.lot.w/2,Ld=SITE.lot.d/2,ours=C.filter(siOurs),outs=C.filter(o=>!siOurs(o));
  const sides=[['เหนือ',(t)=>[-Lw+t*2*Lw,Ld+1.5]],['ตะวันออก',(t)=>[Lw+1.5,-Ld+t*2*Ld]],['ใต้',(t)=>[-Lw+t*2*Lw,-Ld-1.5]],['ตะวันตก',(t)=>[-Lw-1.5,-Ld+t*2*Ld]]].map(([nm,fn])=>({nm,pts:[...Array(8)].map((_,k)=>fn((k+.5)/8)),h:0,max:0}));
  const lotPts=[];for(let a=0;a<8;a++)for(let b=0;b<8;b++)lotPts.push([-Lw+(a+.5)/8*2*Lw,-Ld+(b+.5)/8*2*Ld]);
  let lotOut=0,lotSun=0;
  steps.forEach(sun=>{
    const So=ours.map(o=>siShadow(o,sun,0)).filter(Boolean),Sx=outs.map(o=>siShadow(o,sun,0)).filter(Boolean);
    sides.forEach(s=>{const fr=s.pts.filter(p=>So.some(S=>siIn(p[0],p[1],S))).length/s.pts.length;s.h+=fr*dt;s.max=Math.max(s.max,fr)});
    lotPts.forEach(p=>{lotSun+=dt;if(Sx.some(S=>siIn(p[0],p[1],S)))lotOut+=dt});
  });
  return{N,V,cs,hours,zones,walls,sides,lotOut:lotSun>0?lotOut/lotSun:0,lotOutH:lotOut/lotPts.length,nOut:outs.length};
}
/* all sun-up steps of the period regardless of window (zones and walls split into morning/afternoon themselves) */
function siAllSteps(){
  if(siAllSteps.k===SITE.period+SITE.date+SIM.lat+SIM.lon)return siAllSteps.v;
  const out=[],days=siDays();
  days.forEach(doy=>{for(let h=0.25;h<24;h+=0.5){const s=siSun(doy,h);if(s.el>=SI_EL_MIN)out.push({sun:s,h,nd2:days.length})}});
  siAllSteps.k=SITE.period+SITE.date+SIM.lat+SIM.lon;siAllSteps.v=out;return out;
}

/* ---- drawing ---- */
const SI_PX=600;
const siK=()=>SI_PX/SITE.view;
const siP=(x,y)=>[SI_PX/2+x*siK(),SI_PX/2-y*siK()];
const siPts=P=>P.map(p=>siP(p[0],p[1]).map(v=>v.toFixed(1)).join(',')).join(' ');
function siMix(a,b,t){const h=c=>{c=c.trim();if(c.startsWith('#')){c=c.slice(1);if(c.length===3)c=c.split('').map(x=>x+x).join('');return[0,2,4].map(i=>parseInt(c.slice(i,i+2),16))}const m=c.match(/\d+/g);return m?m.slice(0,3).map(Number):[128,128,128]};const A=h(a),B=h(b);return`rgb(${A.map((v,i)=>Math.round(v+(B[i]-v)*t)).join(',')})`}
let siLast=null;
function siDraw(){
  const svg=document.getElementById('siplan');if(!svg)return;
  const K=siK(),V=SITE.view,cs=getComputedStyle(document.documentElement);
  let s='';
  /* heat map or shadows */
  if(SITE.mode==='hours'&&siLast){
    const A=siLast,mx=Math.max(0.01,...A.hours),c0=cs.getPropertyValue('--surface')||'#f8fafb',c1=cs.getPropertyValue('--accent')||'#d98200',px=A.cs*K;
    for(let j=0;j<A.N;j++)for(let i=0;i<A.N;i++){const v=A.hours[j*A.N+i];s+=`<rect x="${(i*px).toFixed(1)}" y="${(j*px).toFixed(1)}" width="${(px+.6).toFixed(1)}" height="${(px+.6).toFixed(1)}" fill="${siMix(c0,c1,Math.min(1,v/mx))}"/>`}
    document.getElementById('silegmax').textContent=f(mx,1)+' ชม.';
  }
  for(let m=-V/2;m<=V/2+1e-6;m+=5){const p=siP(m,0)[0],q=siP(0,m)[1];s+=`<line x1="${p}" x2="${p}" y1="0" y2="${SI_PX}" class="sigl${Math.abs(m)<1e-6?' ax0':''}"/><line y1="${q}" y2="${q}" x1="0" x2="${SI_PX}" class="sigl${Math.abs(m)<1e-6?' ax0':''}"/>`}
  /* our lot */
  {const a=siP(-SITE.lot.w/2,SITE.lot.d/2);s+=`<rect x="${a[0]}" y="${a[1]}" width="${SITE.lot.w*K}" height="${SITE.lot.d*K}" class="silot"/><text x="${a[0]+4}" y="${a[1]-5}" class="silab">ที่ดินของเรา ${SITE.lot.w}×${SITE.lot.d} ม.</text>`}
  /* outdoor zones under everything, rooms are drawn on top of their house */
  const zoneSvg=o=>`<g data-si="${o.id}" class="sio zone k-${o.kind}${SITE.sel===o.id?' sel':''}"><polygon points="${siPts(siRect(o))}"/><text x="${siP(o.x,o.y)[0]}" y="${siP(o.x,o.y)[1]+4}" text-anchor="middle" class="silab">${esc(o.name)}</text></g>`;
  SITE.objs.filter(o=>o.t==='zone'&&!SI_ROOM[o.kind]).forEach(o=>{s+=zoneSvg(o)});
  /* shadows at the chosen time */
  const doy=dayOfYear(SITE.date),sun=siSun(doy,SITE.h);
  if(SITE.mode==='shadow'&&sun.el>=SI_EL_MIN){
    siCasters().forEach(o=>{const S=siShadow(o,sun,0);if(S)s+=`<polygon points="${siPts(S.p)}" class="sishd"/>`});
  }
  /* solids */
  SITE.objs.filter(o=>o.t!=='zone').forEach(o=>{
    const sel=SITE.sel===o.id?' sel':'';
    if(o.t==='tree'){const c=siP(o.x,o.y);s+=`<g data-si="${o.id}" class="sio tree${sel}"><circle cx="${c[0]}" cy="${c[1]}" r="${o.r*K}"/><circle cx="${c[0]}" cy="${c[1]}" r="2.5" class="trunk"/><text x="${c[0]}" y="${c[1]+o.r*K+12}" text-anchor="middle" class="silab">${esc(o.name)} ${o.h} ม.</text></g>`;return}
    const R=siRect(o),c=siP(o.x,o.y);
    let ridge='';if(o.t==='house'&&o.roof==='gable'){const L=o.w>=o.d,a=siWorld(o,L?-o.w/2:0,L?0:-o.d/2),b=siWorld(o,L?o.w/2:0,L?0:o.d/2),pa=siP(...a),pb=siP(...b);ridge=`<line x1="${pa[0]}" y1="${pa[1]}" x2="${pb[0]}" y2="${pb[1]}" class="ridge"/>`}
    s+=`<g data-si="${o.id}" class="sio ${o.t}${sel}"><polygon points="${siPts(R)}"/>${ridge}${o.t==='house'?`<text x="${siP(...siWorld(o,0,-o.d/2))[0]}" y="${siP(...siWorld(o,0,-o.d/2))[1]-5}" text-anchor="middle" class="silab b">${esc(o.name)} · สูง ${o.h}${o.roof==='gable'?'+'+o.rh:''} ม.</text>`:`<text x="${c[0]}" y="${c[1]-4}" text-anchor="middle" class="silab b">${esc(o.name)}</text><text x="${c[0]}" y="${c[1]+10}" text-anchor="middle" class="silab">สูง ${o.h} ม.</text>`}</g>`;
  });
  SITE.objs.filter(o=>o.t==='zone'&&SI_ROOM[o.kind]).forEach(o=>{s+=zoneSvg(o)});
  /* north arrow and sun direction */
  s+=`<g class="sinorth" transform="translate(${SI_PX-34} 40)"><path d="M0 -24L9 6L0 0L-9 6Z"/><text y="22" text-anchor="middle" class="silab b">N</text></g>`;
  if(SITE.mode==='shadow'){
    if(sun.el>=SI_EL_MIN){const r=SI_PX*.46,c=SI_PX/2,x=c+Math.sin(sun.az)*r,y=c-Math.cos(sun.az)*r;s+=`<line x1="${c}" y1="${c}" x2="${x}" y2="${y}" class="siray"/><circle cx="${x}" cy="${y}" r="10" class="sisun"/>`}
    else s+=`<text x="12" y="22" class="silab b">ดวงอาทิตย์ยังไม่ขึ้น / ตกแล้ว (หรือเงยต่ำกว่า 3°)</text>`;
  }
  s+=`<text x="10" y="${SI_PX-10}" class="silab">ช่องตาราง 5 ม. · มองจากด้านบน ทิศเหนืออยู่ด้านบน</text>`;
  svg.innerHTML=s;
  const st=document.getElementById('sisunv');
  if(st)st.textContent=sun.el>=0?`ดวงอาทิตย์ ทิศ ${f(sun.az*180/Math.PI,0)}° (${dirName(sun.az*180/Math.PI)}) เงย ${f(sun.el*180/Math.PI,0)}°`+(sun.el>=SI_EL_MIN?` · เงาของวัตถุสูง 1 ม. ยาว ${f(1/Math.tan(sun.el),1)} ม.`:''):'กลางคืน';
}
/* polar sun path: centre = overhead, rim = horizon */
function siSunPath(){
  const host=document.getElementById('sipath');if(!host)return;
  const W=320,c=W/2,R=128,P=(az,el)=>[c+Math.sin(az)*R*(1-el/(Math.PI/2)),c-Math.cos(az)*R*(1-el/(Math.PI/2))],y=siYear();
  let s=`<circle cx="${c}" cy="${c}" r="${R}" class="sigl"/>`;
  [30,60].forEach(e=>s+=`<circle cx="${c}" cy="${c}" r="${R*(1-e/90)}" class="sigl" stroke-dasharray="3 4"/><text x="${c+4}" y="${c-R*(1-e/90)+12}" class="silab">${e}°</text>`);
  [['เหนือ',0],['ตะวันออก',90],['ใต้',180],['ตะวันตก',270]].forEach(([n,a])=>{const p=P(siDeg(a),-0.16);s+=`<text x="${p[0]}" y="${p[1]+4}" text-anchor="middle" class="silab">${n}</text>`});
  const curve=(ds,cls,lab)=>{const doy=dayOfYear(ds),pts=[];for(let h=4;h<=20;h+=0.1){const q=siSun(doy,h);if(q.el>0)pts.push(P(q.az,q.el))}
    if(pts.length<2)return'';const m=pts[Math.floor(pts.length/2)];return`<path d="M${pts.map(p=>p[0].toFixed(1)+' '+p[1].toFixed(1)).join('L')}" class="spc ${cls}"/><text x="${m[0]}" y="${m[1]-6}" text-anchor="middle" class="silab ${cls}">${lab}</text>`};
  s+=curve(`${y}-06-21`,'jun','21 มิ.ย.')+curve(`${y}-03-21`,'eq','21 มี.ค. / 23 ก.ย.')+curve(`${y}-12-21`,'dec','21 ธ.ค.');
  const doy=dayOfYear(SITE.date),pts=[];for(let h=5;h<=19;h++){const q=siSun(doy,h);if(q.el>0){const p=P(q.az,q.el);pts.push(`<circle cx="${p[0]}" cy="${p[1]}" r="2.5" class="sihd"/><text x="${p[0]+5}" y="${p[1]+3}" class="silab">${h}</text>`)}}
  s+=curve(SITE.date,'cur','')+pts.join('');
  const q=siSun(doy,SITE.h);if(q.el>0){const p=P(q.az,q.el);s+=`<circle cx="${p[0]}" cy="${p[1]}" r="8" class="sisun"/>`}
  host.innerHTML=`<svg viewBox="-34 0 ${W+68} ${W}" role="img" aria-label="เส้นทางดวงอาทิตย์ทั้งปีที่ตำแหน่งนี้">${s}</svg>`;
}
function siTables(){
  const A=siLast;if(!A)return;
  const h=v=>f(v,1),pill=(l,t)=>`<span class="pill ${l}">${l==='ok'?'✓':l==='warn'?'!':'×'} ${t}</span>`;
  const rec=r=>{
    const k=r.z.kind;
    if(r.room&&!r.house)return['warn','วางห้องไว้ในบ้านก่อน (ต้องอยู่ในกรอบบ้าน)'];
    if(r.room&&!r.walls.length)return['ok','ห้องอยู่ด้านใน ไม่มีผนังรับแดดตรง'];
    if(k==='laundry')return r.all>=4?['ok','แดดดี เหมาะตากผ้า']:r.all>=2?['warn','แดดพอใช้']:['err','แดดน้อย ผ้าแห้งช้า'];
    if(k==='pool')return r.pm2<=1?['ok','ไม่โดนแดดบ่ายแรงมาก']:r.pm2<=2.5?['warn','โดนแดดบ่ายบางส่วน']:['err','โดนแดดบ่ายแรง ควรมีร่มเงา'];
    if(k==='garden')return r.all>=4?['ok','แดดพอสำหรับพืชส่วนใหญ่']:r.all>=2?['warn','แดดรำไร เหมาะพืชชอบร่ม']:['err','ร่มมาก เหมาะพืชในร่ม'];
    if(k==='parking')return r.pm2<=1?['ok','ร่มช่วงบ่าย']:['warn','รถโดนแดดบ่าย'];
    if(k==='bedroom')return r.pm2<=.5?['ok','ผนังไม่โดนแดดบ่าย']:r.pm2<=1.5?['warn','โดนแดดบ่ายบ้าง']:['err','ผนังโดนแดดบ่าย ห้องร้อนตอนเย็น ควรมีชายคาหรือต้นไม้บัง'];
    return r.pm2<=1.5?['ok','แดดบ่ายไม่มาก']:['warn','โดนแดดบ่าย'];
  };
  const per=SI_PER[SITE.period]+(SITE.period==='day'?' '+SITE.date:'');
  document.getElementById('siper').textContent=per;
  document.getElementById('sizones').innerHTML=A.zones.length?`<thead><tr><th>โซน</th><th>วัด</th><th>เช้า</th><th>บ่าย</th><th>บ่ายแรง 13–17</th><th>ทั้งวัน</th><th>ผล</th></tr></thead><tbody>`+A.zones.map(r=>{const[l,t]=rec(r);
    return`<tr><td>${esc(r.z.name)}<small>${SI_KIND[r.z.kind]}</small></td><td class="sm">${r.room?(r.walls.length?'ผนัง '+r.walls.map(a=>dirName(a)).join(', '):'—'):'พื้น'}</td><td>${h(r.am)}</td><td>${h(r.pm)}</td><td>${h(r.pm2)}</td><td>${h(r.all)}</td><td>${pill(l,t)}</td></tr>`}).join('')+'</tbody>'
    :'<tbody><tr><td class="empty">ยังไม่มีโซน กด "+ โซน" แล้ววางบนผัง</td></tr></tbody>';
  document.getElementById('siwalls').innerHTML=A.walls.length?`<thead><tr><th>บ้าน / ผนังหันไปทาง</th><th>เช้า</th><th>บ่าย</th><th>บ่ายแรง 13–17</th><th>ทั้งวัน</th><th>ถูกบัง</th></tr></thead><tbody>`+A.walls.map(r=>
    `<tr><td>${esc(r.H.name)} · ${dirName(r.nAz)} (${f(r.nAz,0)}°)</td><td>${h(r.am)}</td><td>${h(r.pm)}</td><td>${h(r.pm2)}</td><td>${h(r.all)}</td><td>${h(r.blk)}</td></tr>`).join('')+'</tbody>'
    :'<tbody><tr><td class="empty">ยังไม่มีบ้านบนผัง</td></tr></tbody>';
  document.getElementById('sinbr').innerHTML=`<thead><tr><th>ด้านของที่ดิน</th><th>เงาของเราตกออกนอกที่ดิน (เฉลี่ย ชม./วัน)</th><th>ช่วงที่บังมากสุด</th></tr></thead><tbody>`
    +A.sides.map(s=>`<tr><td>${s.nm}</td><td>${h(s.h)}</td><td>${f(s.max*100,0)} % ของแนวเขต</td></tr>`).join('')
    +`<tr class="tot"><td>เงาจากภายนอกตกในที่ดินเรา</td><td>${A.nOut?h(A.lotOutH)+' ชม./วัน':'—'}</td><td>${A.nOut?f(A.lotOut*100,0)+' % ของแดดในที่ดิน':'ไม่มีวัตถุนอกที่ดิน'}</td></tr></tbody>`;
  document.getElementById('sinote').textContent=`ค่าเป็นชั่วโมงแดดตรงเฉลี่ยต่อวัน (${per}) · ห้องในบ้านวัดที่ผนังภายนอกของห้อง สูง 1.5 ม. · โซนนอกบ้านวัดที่พื้น · แถบ "ช่วงเวลา" ด้านบนใช้กับแผนที่สีเท่านั้น`;
}
let siTimer=0;
function siRecalc(){clearTimeout(siTimer);siTimer=setTimeout(()=>{siAllSteps.k=null;siLast=siAnalyse();siDraw();siTables()},120)}
function siRender(){siDraw();siSunPath();siProps()}
/* ---- properties of the selected object ---- */
function siProps(){
  const box=document.getElementById('siprops');if(!box)return;
  const o=SITE.objs.find(x=>x.id===SITE.sel);
  if(!o){box.innerHTML='<p class="hint tight">แตะวัตถุบนผังเพื่อแก้ขนาดและความสูง ลากเพื่อย้าย</p>';return}
  const n=(k,lab,mn,mx,st)=>`<label>${lab}<input type="number" data-sp="${k}" value="${o[k]}" min="${mn}" max="${mx}" step="${st}"></label>`;
  let f2=`<label class="wide">ชื่อ<input type="text" data-sp="name" value="${esc(o.name)}"></label>`;
  if(o.t==='zone')f2+=`<label>ชนิดโซน<select data-sp="kind">${Object.entries(SI_KIND).map(([k,v])=>`<option value="${k}" ${o.kind===k?'selected':''}>${v}</option>`).join('')}</select></label>`;
  f2+=n('x','ตำแหน่ง ตะวันออก (ม.)',-200,200,.5)+n('y','ตำแหน่ง เหนือ (ม.)',-200,200,.5);
  if(o.t==='tree')f2+=n('h','สูงถึงยอด (ม.)',1,40,.5)+n('r','รัศมีพุ่ม (ม.)',.5,15,.5)+n('ch','พุ่มเริ่มที่ความสูง (ม.)',0,30,.5);
  else{f2+=n('w','กว้าง ตะวันออก–ตะวันตก (ม.)',1,200,.5)+n('d','ลึก เหนือ–ใต้ (ม.)',1,200,.5)+n('rot','หมุน (องศา ตามเข็ม)',-180,180,5);
    if(o.t!=='zone')f2+=n('h',o.t==='house'?'ความสูงผนัง (ม.)':'ความสูง (ม.)',1,300,.5);
    if(o.t==='house')f2+=`<label>หลังคา<select data-sp="roof"><option value="gable" ${o.roof==='gable'?'selected':''}>จั่ว</option><option value="flat" ${o.roof==='flat'?'selected':''}>แบน</option></select></label>`+(o.roof==='gable'?n('rh','จั่วสูงเพิ่ม (ม.)',0,10,.5):'');}
  box.innerHTML=`<div class="siph"><b>${SI_TYPE[o.t]}</b><button class="btn sm" id="sidel">ลบ</button></div><div class="sigrid">${f2}</div>`
    +(o.t==='zone'&&SI_ROOM[o.kind]?'<p class="hint tight">ห้องต้องอยู่ในกรอบบ้าน ระบบวัดแดดที่ผนังภายนอกของห้อง</p>':'');
}
function siAdd(t,kind){
  const o={id:SITE.nextId++,t,x:0,y:-SITE.lot.d/2+4,rot:0};
  if(t==='house')Object.assign(o,{name:'บ้าน '+o.id,y:0,w:10,d:8,h:3,roof:'gable',rh:2});
  if(t==='bldg')Object.assign(o,{name:'ตึก '+o.id,x:SITE.lot.w/2+6,y:0,w:8,d:12,h:10});
  if(t==='tree')Object.assign(o,{name:'ต้นไม้ '+o.id,x:SITE.lot.w/2-3,y:SITE.lot.d/2-3,r:2.5,h:7,ch:2});
  if(t==='zone')Object.assign(o,{kind:kind||'laundry',name:SI_KIND[kind||'laundry'],w:4,d:3});
  if(t==='zone'&&SI_ROOM[o.kind]){const H=SITE.objs.find(x=>x.t==='house');if(H)Object.assign(o,{x:H.x,y:H.y,w:Math.min(4,H.w),d:Math.min(4,H.d),rot:H.rot||0})}
  SITE.objs.push(o);SITE.sel=o.id;siChanged();
}
function siChanged(){siRender();siRecalc();if(typeof touch==='function')touch()}
function siSync(){
  const q=id=>document.getElementById(id);if(!q('siplan'))return;
  if(!SITE.date)SITE.date=SIM.date||new Date().toISOString().slice(0,10);
  q('sidate').value=SITE.date;q('sih').value=SITE.h;q('sihv').textContent=hhmm(SITE.h);
  q('siview').value=SITE.view;q('siviewv').textContent=SITE.view+' ม.';q('silw').value=SITE.lot.w;q('sild').value=SITE.lot.d;
  q('siper2').value=SITE.period;q('siwin').value=SITE.win;
  document.querySelectorAll('#simode [data-sm]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.sm===SITE.mode)));
  q('sileg').hidden=SITE.mode!=='hours';q('siwinbox').hidden=SITE.mode!=='hours';
  q('siloc').textContent=`พิกัด ${f(SIM.lat,4)}, ${f(SIM.lon,4)} (ตั้งที่แท็บ "จำลองแผง")`;
}
function siRun(){siSync();siRender();siRecalc()}
function initSite(){
  const q=id=>document.getElementById(id),svg=q('siplan');if(!svg)return;
  if(!SITE.objs.length)siExample();
  let drag=null;
  const pt=e=>{const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;const r=p.matrixTransform(svg.getScreenCTM().inverse());return[(r.x-SI_PX/2)/siK(),(SI_PX/2-r.y)/siK()]};
  svg.addEventListener('pointerdown',e=>{
    const g=e.target.closest('[data-si]');
    if(!g){SITE.sel=null;siRender();return}
    const o=SITE.objs.find(x=>x.id===+g.dataset.si);if(!o)return;
    e.preventDefault();SITE.sel=o.id;const p=pt(e);drag={o,dx:p[0]-o.x,dy:p[1]-o.y,moved:false};
    try{svg.setPointerCapture(e.pointerId)}catch(_){}
    siRender();
  });
  svg.addEventListener('pointermove',e=>{
    if(!drag)return;const p=pt(e),r=v=>Math.round(v*2)/2,nx=r(p[0]-drag.dx),ny=r(p[1]-drag.dy);
    if(nx===drag.o.x&&ny===drag.o.y)return;
    /* rooms inside a house move with it when the house is dragged */
    if(drag.o.t==='house'){const ddx=nx-drag.o.x,ddy=ny-drag.o.y;SITE.objs.filter(z=>z.t==='zone'&&SI_ROOM[z.kind]&&siHouseOf(z)===drag.o).forEach(z=>{z.x+=ddx;z.y+=ddy})}
    drag.o.x=nx;drag.o.y=ny;drag.moved=true;siDraw();
  });
  const end=()=>{if(drag&&drag.moved){siProps();siRecalc();if(typeof touch==='function')touch()}drag=null};
  svg.addEventListener('pointerup',end);svg.addEventListener('pointercancel',end);
  q('siprops').addEventListener('input',e=>{
    const k=e.target.dataset.sp;if(!k)return;const o=SITE.objs.find(x=>x.id===SITE.sel);if(!o)return;
    if(k==='name'){o.name=e.target.value.slice(0,40);siDraw();if(typeof touch==='function')touch();return}
    if(k==='kind'||k==='roof'){o[k]=e.target.value;siChanged();return}
    const v=parseFloat(e.target.value);if(isNaN(v))return;
    const lim={h:[.5,300],w:[.5,200],d:[.5,200],r:[.3,15],ch:[0,30],rh:[0,10],rot:[-180,180],x:[-200,200],y:[-200,200]}[k]||[-1e3,1e3];
    o[k]=Math.max(lim[0],Math.min(lim[1],v));if(o.t==='tree')o.ch=Math.min(o.ch,o.h-.5);
    siDraw();siSunPath();siRecalc();if(typeof touch==='function')touch();
  });
  q('siprops').addEventListener('change',e=>{if(e.target.tagName==='SELECT')siProps()});
  q('siprops').addEventListener('click',e=>{if(e.target.id==='sidel'){SITE.objs=SITE.objs.filter(x=>x.id!==SITE.sel);SITE.sel=null;siChanged()}});
  q('sitools').addEventListener('click',e=>{const b=e.target.closest('[data-sa]');if(!b)return;
    const a=b.dataset.sa;
    if(a==='zone')siAdd('zone',q('sizk').value);else if(a==='example'){siExample();siChanged()}else if(a==='clear'){SITE.objs=[];SITE.sel=null;siChanged()}else siAdd(a)});
  q('sidate').addEventListener('change',e=>{if(/^\d{4}-\d{2}-\d{2}$/.test(e.target.value)){SITE.date=e.target.value;siRun();if(typeof touch==='function')touch()}});
  q('sidays').addEventListener('click',e=>{const b=e.target.closest('[data-sd]');if(!b)return;SITE.date=`${siYear()}-${b.dataset.sd}`;siRun();if(typeof touch==='function')touch()});
  q('sih').addEventListener('input',e=>{SITE.h=+e.target.value;q('sihv').textContent=hhmm(SITE.h);siDraw();siSunPath()});
  q('sih').addEventListener('change',()=>{if(typeof touch==='function')touch()});
  q('siplay').addEventListener('click',()=>{
    if(SITE.play){clearInterval(SITE.play);SITE.play=0;q('siplay').textContent='▶ เล่น';return}
    q('siplay').textContent='⏸ หยุด';
    SITE.play=setInterval(()=>{SITE.h=SITE.h>=18.5?6:SITE.h+0.25;q('sih').value=SITE.h;q('sihv').textContent=hhmm(SITE.h);siDraw();siSunPath();if(document.getElementById('tab-site').hidden){clearInterval(SITE.play);SITE.play=0;q('siplay').textContent='▶ เล่น'}},250);
  });
  q('simode').addEventListener('click',e=>{const b=e.target.closest('[data-sm]');if(!b)return;SITE.mode=b.dataset.sm;siSync();siDraw();if(typeof touch==='function')touch()});
  q('siper2').addEventListener('change',e=>{SITE.period=e.target.value;siRun();if(typeof touch==='function')touch()});
  q('siwin').addEventListener('change',e=>{SITE.win=e.target.value;siRecalc();if(typeof touch==='function')touch()});
  q('siview').addEventListener('input',e=>{SITE.view=+e.target.value;q('siviewv').textContent=SITE.view+' ม.';siDraw();siRecalc()});
  q('siview').addEventListener('change',()=>{if(typeof touch==='function')touch()});
  ['silw','sild'].forEach(id=>q(id).addEventListener('input',e=>{const v=parseFloat(e.target.value);if(isNaN(v)||v<2)return;SITE.lot[id==='silw'?'w':'d']=Math.min(200,v);siDraw();siRecalc();if(typeof touch==='function')touch()}));
}
function siRestore(o){
  if(!o||typeof o!=='object')return;
  const n=(v,d,lo,hi)=>{v=+v;return isFinite(v)?Math.max(lo,Math.min(hi,v)):d};
  if(Array.isArray(o.objs)){
    SITE.objs=o.objs.filter(x=>x&&SI_TYPE[x.t]).slice(0,200).map((x,i)=>{
      const b={id:n(x.id,i+1,1,1e6)|0,t:x.t,name:String(x.name||SI_TYPE[x.t]).slice(0,40),x:n(x.x,0,-200,200),y:n(x.y,0,-200,200),rot:n(x.rot,0,-180,180)};
      if(x.t==='tree')Object.assign(b,{h:n(x.h,7,.5,40),r:n(x.r,2.5,.3,15),ch:n(x.ch,2,0,30)});
      else Object.assign(b,{w:n(x.w,4,.5,200),d:n(x.d,4,.5,200)});
      if(x.t==='house'||x.t==='bldg')b.h=n(x.h,3,.5,300);
      if(x.t==='house'){b.roof=x.roof==='flat'?'flat':'gable';b.rh=n(x.rh,2,0,10)}
      if(x.t==='zone')b.kind=SI_KIND[x.kind]?x.kind:'laundry';
      return b;
    });
    SITE.nextId=Math.max(n(o.nextId,1,1,1e6)|0,...SITE.objs.map(x=>x.id+1),1);
  }
  if(o.lot)SITE.lot={w:n(o.lot.w,20,2,200),d:n(o.lot.d,30,2,200)};
  SITE.view=n(o.view,50,20,200);SITE.h=n(o.h,15,0,23.75);
  if(typeof o.date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(o.date))SITE.date=o.date;
  if(['shadow','hours'].includes(o.mode))SITE.mode=o.mode;if(SI_PER[o.period])SITE.period=o.period;if(SI_WIN[o.win])SITE.win=o.win;
  SITE.sel=null;
}
const siSnapshot=()=>({objs:SITE.objs,nextId:SITE.nextId,lot:SITE.lot,view:SITE.view,date:SITE.date,h:SITE.h,mode:SITE.mode,period:SITE.period,win:SITE.win});
