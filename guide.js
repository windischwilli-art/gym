// Formwerk: geführtes Training, Aufwärmen und Übungs-Animationen
(function(){
"use strict";

// ================= Strichfigur-Animation =================
// Winkel in Grad, Weltkoordinaten: 0 = nach unten, 90 = nach vorn (rechts), 180 = nach oben, -90 = nach hinten.
const R=Math.PI/180, dir=(a,l)=>[Math.sin(a*R)*l,Math.cos(a*R)*l], add=(a,b)=>[a[0]+b[0],a[1]+b[1]];
const FLOOR=152;

function norm(p){
 const a=p.a||[0,0],l=p.l||[0,0],f=p.f===undefined?90:p.f;
 return{t:p.t===undefined?180:p.t,hd:p.hd,a1:p.a1||a,a2:p.a2||a,l1:p.l1||l,l2:p.l2||l,f1:p.f1===undefined?f:p.f1,f2:p.f2===undefined?f:p.f2,r:p.r||[0,0]};
}
function fk(p){
 const hip=p.r,neck=add(hip,dir(p.t,44)),head=add(neck,dir(p.hd===undefined?p.t:p.hd,13));
 const arm=a=>{const e=add(neck,dir(a[0],24));return[e,add(e,dir(a[1],22))]};
 const leg=(l,f)=>{const k=add(hip,dir(l[0],30)),ft=add(k,dir(l[1],30));return[k,ft,add(ft,dir(f,8))]};
 const[e1,h1]=arm(p.a1),[e2,h2]=arm(p.a2),[k1,f1,t1]=leg(p.l1,p.f1),[k2,f2,t2]=leg(p.l2,p.f2);
 return{hip,neck,head,e1,h1,e2,h2,k1,f1,t1,k2,f2,t2};
}
const lerp=(a,b,t)=>a+(b-a)*t, lerpA=(a,b,t)=>a.map((v,i)=>lerp(v,b[i],t));
function mix(A,B,t){return{t:lerp(A.t,B.t,t),hd:A.hd===undefined&&B.hd===undefined?undefined:lerp(A.hd===undefined?A.t:A.hd,B.hd===undefined?B.t:B.hd,t),
 a1:lerpA(A.a1,B.a1,t),a2:lerpA(A.a2,B.a2,t),l1:lerpA(A.l1,B.l1,t),l2:lerpA(A.l2,B.l2,t),f1:lerp(A.f1,B.f1,t),f2:lerp(A.f2,B.f2,t),r:lerpA(A.r,B.r,t)}}

// Geräte/Umgebung (feste Koordinaten im 200×160-Feld)
const FIX={
 bench:'<rect x="50" y="121" width="86" height="7" rx="3"/><rect x="58" y="128" width="5" height="24"/><rect x="123" y="128" width="5" height="24"/>',
 bench2:'<rect x="32" y="120" width="42" height="8" rx="3"/><rect x="38" y="128" width="5" height="24"/><rect x="63" y="128" width="5" height="24"/>',
 bulg:'<rect x="30" y="127" width="44" height="7" rx="3"/><rect x="36" y="134" width="5" height="18"/><rect x="63" y="134" width="5" height="18"/>',
 pullbar:'<rect x="55" y="24" width="90" height="5" rx="2.5"/><rect x="55" y="24" width="4" height="128"/><rect x="141" y="24" width="4" height="128"/>',
 dipbar:'<rect x="92" y="94" width="46" height="5" rx="2.5"/><rect x="130" y="94" width="5" height="58"/>',
 table:'<rect x="118" y="66" width="78" height="6" rx="2"/><rect x="122" y="72" width="5" height="80"/><rect x="186" y="72" width="5" height="80"/>',
 chair:'<rect x="38" y="122" width="40" height="6" rx="2"/><rect x="40" y="128" width="4" height="24"/><rect x="72" y="128" width="4" height="24"/><rect x="38" y="84" width="4" height="40"/>',
 post:'<rect x="194" y="30" width="5" height="122" rx="2"/>',
 wall:'<rect x="150" y="14" width="5" height="138" rx="2"/>',
 top:'<rect x="96" y="2" width="40" height="5" rx="2"/>'
};
// Muster: anchor = Punkt, der fest bleibt (foot = vorderer Fuß, hand = vordere Hand, root = Hüfte frei)
const P={};
function pat(name,o){const out=[];let prev={};for(const p of o.poses){prev={...prev,...p};out.push(norm(prev))}P[name]={...o,poses:out}}
const ST={t:180,a:[0,0],l:[0,0]};
pat("stand",{anchor:"foot",at:[100,FLOOR],poses:[ST,{a:[4,4]}],dur:1.4});
pat("squat_bw",{anchor:"foot",at:[104,FLOOR],poses:[{t:178,a:[90,90],l:[0,0]},{t:150,l:[75,-30]}],dur:1.1});
pat("squat_goblet",{anchor:"foot",at:[104,FLOOR],poses:[{t:178,a:[15,165],l:[0,0]},{t:150,l:[75,-30]}],dur:1.1});
pat("squat_bb",{anchor:"foot",at:[104,FLOOR],poses:[{t:178,a:[-60,170],l:[0,0]},{t:150,l:[75,-30]}],dur:1.2});
pat("squat_band",{anchor:"foot",at:[104,FLOOR],band:"foot",poses:[{t:178,a:[30,175],l:[0,0]},{t:150,l:[75,-30]}],dur:1.1});
pat("hinge",{anchor:"foot",at:[106,FLOOR],poses:[{t:180,a:[0,0],l:[0,0]},{t:105,l:[12,-8]}],dur:1.3});
pat("hinge_gm",{anchor:"foot",at:[106,FLOOR],band:"foot",poses:[{t:180,a:[-60,170],l:[0,0]},{t:110,l:[12,-8]}],dur:1.3});
pat("swing",{anchor:"foot",at:[100,FLOOR],poses:[{t:178,a:[95,95],l:[0,0]},{t:115,a:[-25,-20],l:[30,-15]}],dur:.6});
pat("sl_rdl",{anchor:"foot",at:[112,FLOOR],poses:[{t:178,a:[0,0],l1:[0,0],l2:[0,0]},{t:100,l1:[8,-5],l2:[-82,-85]}],dur:1.4});
pat("lunge",{anchor:"foot",at:[128,FLOOR],poses:[{t:180,a:[0,0],l1:[0,0],l2:[0,0]},{l1:[80,0],l2:[-20,-80]}],dur:1.1});
pat("bulgarian",{anchor:"foot",at:[125,FLOOR],fix:["bulg"],poses:[{t:178,a:[0,0],l1:[50,-10],l2:[-30,-100]},{l1:[80,0],l2:[-25,-110]}],dur:1.2});
pat("calf",{anchor:"root",poses:[{r:[100,92],t:180,a:[0,0],l:[0,0],f:90},{r:[100,85],f:40}],dur:.9});
pat("bridge",{anchor:"root",poses:[{r:[110,144],t:-90,hd:-90,a:[90,90],l:[150,22],f:90},{r:[110,120],t:-63,hd:-75,a:[77,77],l:[90,-4]}],dur:1.2});
pat("hipthrust",{anchor:"root",fix:["bench2"],poses:[{r:[105,140],t:-120,hd:-110,a:[60,60],l:[140,15]},{r:[105,112],t:-95,hd:-95,a:[95,95],l:[75,0]}],dur:1.2});
pat("bench",{anchor:"root",fix:["bench"],poses:[{r:[122,116],t:-90,hd:-90,a:[180,180],l:[50,58]},{a:[20,170]}],dur:1.2});
pat("floorpress",{anchor:"root",poses:[{r:[122,144],t:-90,hd:-90,a:[180,180],l:[150,22]},{a:[70,170]}],dur:1.2});
pat("pushup",{anchor:"hand",at:[148,FLOOR],poses:[{t:114,a:[-25,-25],l:[-66,-66],f:10},{t:102,a:[-90,0],l:[-78,-78]}],dur:1});
pat("pike",{anchor:"hand",at:[142,FLOOR],poses:[{t:72,a:[15,15],l:[-15,-15],f:60},{t:45,a:[-60,10],l:[0,0]}],dur:1.1});
pat("ohp",{anchor:"foot",at:[100,FLOOR],band:"foot",poses:[{t:180,a:[30,175],l:[0,0]},{a:[175,178]}],dur:1.1});
pat("row",{anchor:"foot",at:[104,FLOOR],poses:[{t:112,a:[0,0],l:[20,-12]},{a:[-100,0]}],dur:1});
pat("rowband",{anchor:"foot",at:[84,FLOOR],fix:["post"],band:[195,48],poses:[{t:178,a:[90,90],l:[0,0]},{a:[-20,80]}],dur:1});
pat("inverted",{anchor:"hand",at:[150,70],fix:["table"],poses:[{t:110,a:[172,172],l:[-70,-70],f:0},{t:112,a:[-130,160],l:[-68,-68]}],dur:1.1});
pat("pullup",{anchor:"hand",at:[100,26],fix:["pullbar"],poses:[{t:180,a:[180,180],l:[10,-80]},{t:175,a:[30,170],l:[20,-70]}],dur:1.2});
pat("deadhang",{anchor:"hand",at:[100,26],fix:["pullbar"],poses:[{t:180,a:[180,180],l:[6,-10]},{t:182,l:[2,-6]}],dur:1.6});
pat("pulldown",{anchor:"foot",at:[100,FLOOR],fix:["top"],band:[116,6],poses:[{t:180,a:[175,178],l:[0,0]},{a:[25,165]}],dur:1.1});
pat("curl",{anchor:"foot",at:[100,FLOOR],band:"foot",poses:[{t:180,a:[0,0],l:[0,0]},{a:[8,165]}],dur:1});
pat("towel",{anchor:"foot",at:[100,FLOOR],band:"foot",poses:[{t:180,a:[0,95],l:[0,0]},{a:[0,102]}],dur:.5});
pat("pushdown",{anchor:"foot",at:[96,FLOOR],fix:["top"],band:[130,6],poses:[{t:174,a:[8,160],l:[0,0]},{a:[8,8]}],dur:1});
pat("french",{anchor:"foot",at:[100,FLOOR],poses:[{t:180,a:[172,-15],l:[0,0]},{a:[172,178]}],dur:1.1});
pat("dips",{anchor:"hand",at:[112,96],fix:["dipbar"],poses:[{t:178,a:[0,0],l:[10,-80]},{t:165,a:[-100,30]}],dur:1.1});
pat("benchdip",{anchor:"hand",at:[70,122],fix:["chair"],poses:[{t:180,a:[-5,-5],l:[90,10]},{a:[-100,20],l:[85,70]}],dur:1.1});
pat("facepull",{anchor:"foot",at:[86,FLOOR],fix:["post"],band:[195,40],poses:[{t:178,a:[90,90],l:[0,0]},{a:[-100,110]}],dur:1});
pat("revfly",{anchor:"foot",at:[104,FLOOR],poses:[{t:105,a:[0,0],l:[12,-8]},{a:[-75,-75]}],dur:1.1});
pat("superman",{anchor:"root",poses:[{r:[82,145],t:90,hd:90,a:[90,90],l:[-90,-90],f:0},{t:100,hd:105,a:[108,108],l:[-100,-100]}],dur:1.2});
pat("plank",{anchor:"hand",at:[142,FLOOR],poses:[{t:103,a:[0,90],l:[-77,-77],f:10},{t:101,l:[-79,-79]}],dur:1.8});
pat("lateral",{anchor:"root",front:true,band:"foot",poses:[{r:[100,90],t:180,a1:[12,12],a2:[-12,-12],l1:[4,4],l2:[-4,-4],f1:90,f2:-90},{a1:[86,88],a2:[-86,-88]}],dur:1.1});
pat("kickback",{anchor:"foot",at:[104,FLOOR],poses:[{t:110,a:[-95,0],l:[20,-12]},{a:[-95,-95]}],dur:1});
pat("legcurl",{anchor:"root",fix:["bench"],poses:[{r:[96,114],t:90,hd:90,a:[90,90],l:[-90,-90],f:0},{l:[-90,-190]}],dur:1.1});
pat("deadbug",{anchor:"root",poses:[{r:[110,144],t:-90,hd:-90,a1:[180,180],a2:[180,180],l1:[180,90],l2:[180,90]},{a1:[-100,-100],l1:[100,95]}],dur:1.3});
pat("twist",{anchor:"root",poses:[{r:[100,144],t:205,hd:195,a:[120,100],l:[120,80],f:60},{a:[70,50]}],dur:.7});
pat("kneeraise",{anchor:"hand",at:[100,26],fix:["pullbar"],poses:[{t:180,a:[180,180],l:[0,0]},{t:185,l:[95,0]}],dur:1.1});
pat("sideplank",{anchor:"root",front:true,poses:[{r:[100,128],t:110,hd:110,a1:[0,0],a2:[180,180],l1:[-70,-70],l2:[-72,-72]},{r:[100,124]}],dur:1.6});
// Aufwärmen
pat("jacks",{anchor:"root",front:true,vb:"-14 -24 228 182",poses:[{r:[100,90],t:180,a1:[20,20],a2:[-20,-20],l1:[8,8],l2:[-8,-8],f1:90,f2:-90},{r:[100,85],a1:[155,165],a2:[-155,-165],l1:[22,22],l2:[-22,-22]}],dur:.45});
pat("armcircles",{anchor:"root",front:true,poses:[{r:[100,90],t:180,a1:[90,90],a2:[-90,-90],l1:[4,4],l2:[-4,-4],f1:90,f2:-90},{a1:[112,112],a2:[-112,-112]},{a1:[90,90],a2:[-90,-90]},{a1:[68,68],a2:[-68,-68]}],dur:.32});
pat("catcow",{anchor:"hand",at:[118,FLOOR],poses:[{t:113,hd:150,a:[0,0],l:[0,-90],f:-90},{t:108,hd:40}],dur:1.4});
pat("climbers",{anchor:"hand",at:[156,FLOOR],poses:[{t:114,a:[-25,-25],l1:[-66,-66],l2:[40,-60],f:10},{l1:[40,-60],l2:[-66,-66]}],dur:.33});
pat("highknees",{anchor:"root",poses:[{r:[100,90],t:178,a1:[-40,60],a2:[40,100],l1:[85,-5],l2:[0,0]},{a1:[40,100],a2:[-40,60],l1:[0,0],l2:[85,-5]}],dur:.3});
pat("buttkicks",{anchor:"root",poses:[{r:[100,90],t:178,a1:[-30,60],a2:[30,100],l1:[-5,-150],l2:[0,0]},{a1:[30,100],a2:[-30,60],l1:[0,0],l2:[-5,-150]}],dur:.3});
pat("legswing",{anchor:"root",fix:["wall"],poses:[{r:[100,90],t:180,a1:[88,88],a2:[0,0],l1:[55,45],l2:[0,0]},{l1:[-35,-35]}],dur:.7});
pat("walk",{anchor:"root",poses:[{r:[100,90],t:180,a1:[-25,-10],a2:[25,40],l1:[22,0],l2:[-22,-35]},{a1:[25,40],a2:[-25,-10],l1:[-22,-35],l2:[22,0]}],dur:.55});

// Gewichte zeichnen
function itemSVG(kind,j,pt){
 const plate=p=>`<circle cx="${p[0]}" cy="${p[1]}" r="13" class="gi"/><circle cx="${p[0]}" cy="${p[1]}" r="3" class="gh"/>`;
 const db=(p,o)=>`<g opacity="${o}"><rect x="${p[0]-9}" y="${p[1]-2}" width="18" height="4" rx="2" class="gi"/><rect x="${p[0]-11}" y="${p[1]-5}" width="5" height="10" rx="1.5" class="gi"/><rect x="${p[0]+6}" y="${p[1]-5}" width="5" height="10" rx="1.5" class="gi"/></g>`;
 const kb=p=>`<path d="M${p[0]-4} ${p[1]+1} q4 -7 8 0" class="gs"/><circle cx="${p[0]}" cy="${p[1]+9}" r="7.5" class="gi"/>`;
 const line=(a,b)=>`<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" class="gb"/>`;
 switch(kind){
  case"bb":return plate(j.h1);
  case"bbneck":return plate(add(j.neck,[-4,-3]));
  case"bbhip":return plate(add(j.hip,[0,-12]));
  case"db":return db(j.h2,.45)+db(j.h1,1);
  case"kb":return kb(j.h1);
  case"band":case"cable":{const to=pt==="foot"?j.f1:pt;return to?line(j.h1,to)+(kind==="cable"?`<circle cx="${to[0]}" cy="${to[1]}" r="3" class="gi"/>`:""):""}
 }
 return"";
}

const RUNNING=new Set();
// ---- Körperform ----
const f1=v=>v.toFixed(1);
function cap(A,B,ra,rb,cls){
 const dx=B[0]-A[0],dy=B[1]-A[1],L=Math.hypot(dx,dy)||1,nx=-dy/L,ny=dx/L;
 return`<path class="${cls}" d="M${f1(A[0]+nx*ra)} ${f1(A[1]+ny*ra)}L${f1(B[0]+nx*rb)} ${f1(B[1]+ny*rb)}L${f1(B[0]-nx*rb)} ${f1(B[1]-ny*rb)}L${f1(A[0]-nx*ra)} ${f1(A[1]-ny*ra)}Z"/><circle class="${cls}" cx="${f1(A[0])}" cy="${f1(A[1])}" r="${ra}"/><circle class="${cls}" cx="${f1(B[0])}" cy="${f1(B[1])}" r="${rb}"/>`;
}
const at=(A,B,t)=>[A[0]+(B[0]-A[0])*t,A[1]+(B[1]-A[1])*t];
function torsoPath(hip,neck,front,cls,w){
 // w: [[t, vorn, hinten], ...] entlang Hüfte→Hals
 const dx=neck[0]-hip[0],dy=neck[1]-hip[1],L=Math.hypot(dx,dy)||1,ux=dx/L,uy=dy/L;
 let fx=-uy,fy=ux; if(front===-1){fx=-fx;fy=-fy}
 const P=(t,o)=>[hip[0]+dx*t+fx*o,hip[1]+dy*t+fy*o];
 const F=w.map(([t,a])=>P(t,a)),Bk=w.slice().reverse().map(([t,,b])=>P(t,-b));
 const pts=[...F,...Bk];
 let d=`M${f1(pts[0][0])} ${f1(pts[0][1])}`;
 for(let i=1;i<pts.length;i++){const p=pts[i],q=pts[(i+1)%pts.length],m=[(p[0]+q[0])/2,(p[1]+q[1])/2];d+=`Q${f1(p[0])} ${f1(p[1])} ${f1(m[0])} ${f1(m[1])}`}
 return`<path class="${cls}" d="${d}Z"/>`;
}
const SIDE_W=[[-.12,7,9],[.12,6.5,8.5],[.32,6,6.5],[.62,9.5,7.5],[.88,8,8],[1.04,4,6]];
const FRONT_W=[[-.1,9.5,9.5],[.15,8.6,8.6],[.4,9,9],[.7,11,11],[.92,12,12],[1.04,8,8]];
function headSVG(j,front,v){
 const h=j.head,fx=front?0:-v[1],fy=front?0:v[0];
 if(front)return`<circle class="bh" cx="${f1(h[0])}" cy="${f1(h[1]-1.8)}" r="9.2"/><circle class="bs" cx="${f1(h[0])}" cy="${f1(h[1]+.8)}" r="8.2"/><circle class="be" cx="${f1(h[0]-2.8)}" cy="${f1(h[1])}" r="1"/><circle class="be" cx="${f1(h[0]+2.8)}" cy="${f1(h[1])}" r="1"/>`;
 return`<circle class="bh" cx="${f1(h[0]-fx*1.6+v[0]*1.2)}" cy="${f1(h[1]-fy*1.6+v[1]*1.2)}" r="9.3"/><circle class="bs" cx="${f1(h[0]+fx*1.4)}" cy="${f1(h[1]+fy*1.4)}" r="8.1"/><circle class="be" cx="${f1(h[0]+fx*6+v[0]*1.5)}" cy="${f1(h[1]+fy*6+v[1]*1.5)}" r="1.05"/>`;
}
function limbArm(j,e,h,s,far){
 const sk=far?"bs2":"bs",sh=far?"bt2":"bt";
 return cap(j.neck,e,4.6,3.9,sk)+cap(e,h,3.6,2.9,sk)+cap(j.neck,at(j.neck,e,.5),5.6,4.8,sh)+`<circle class="${sk}" cx="${f1(h[0])}" cy="${f1(h[1])}" r="3.4"/>`;
}
function limbLeg(j,k,f,t,far){
 const sk=far?"bs2":"bs",sp=far?"bp2":"bp";
 return cap(k,f,4.6,3.1,sk)+cap(j.hip,k,6.6,4.9,sk)+cap(j.hip,at(j.hip,k,.62),7,5.6,sp)+cap(f,t,3.6,3,"bo");
}
function muscleSVG(j,front,mus){
 if(!mus)return"";const m=mus.toLowerCase(),o=[];
 const v=[j.neck[0]-j.hip[0],j.neck[1]-j.hip[1]],L=Math.hypot(v[0],v[1])||1,u=[v[0]/L,v[1]/L],fr=front?[0,0]:[-u[1],u[0]];
 const T=(t,off)=>[j.hip[0]+v[0]*t+fr[0]*off,j.hip[1]+v[1]*t+fr[1]*off];
 if(/brust/.test(m))o.push(cap(T(.58,front?0:5.5),T(.82,front?0:5.5),front?7:4.6,front?7:4.2,"bm"));
 if(/rücken/.test(m)&&!/unterer/.test(m))o.push(cap(T(.5,front?0:-4.5),T(.86,front?0:-4.8),4.6,4.6,"bm"));
 if(/unterer rücken/.test(m))o.push(cap(T(.14,-4.2),T(.42,-4),3.8,3.8,"bm"));
 if(/rumpf/.test(m))o.push(cap(T(.18,front?0:4.2),T(.5,front?0:4.4),front?5:3.6,front?5:3.6,"bm"));
 if(/schulter/.test(m))o.push(`<circle class="bm" cx="${f1(at(j.neck,j.e1,.18)[0])}" cy="${f1(at(j.neck,j.e1,.18)[1])}" r="5.4"/>`);
 if(/bizeps|trizeps/.test(m))o.push(cap(at(j.neck,j.e1,.35),at(j.neck,j.e1,.9),3.3,2.9,"bm"));
 if(/unterarm/.test(m))o.push(cap(at(j.e1,j.h1,.1),at(j.e1,j.h1,.8),2.7,2.2,"bm"));
 if(/beine|oberschenkel/.test(m))o.push(cap(at(j.hip,j.k1,.25),at(j.hip,j.k1,.92),5.6,4.2,"bm"));
 if(/po/.test(m.replace(/[a-zäöü]po/g,"")))o.push(`<circle class="bm" cx="${f1(T(.02,front?0:-5)[0])}" cy="${f1(T(.02,front?0:-5)[1])}" r="6"/>`);
 if(/waden/.test(m))o.push(cap(at(j.k1,j.f1,.12),at(j.k1,j.f1,.6),3.9,3.3,"bm"));
 return`<g class="bmg">${o.join("")}</g>`;
}
function bodySVG(j,p,mus,item){
 const front=!!p.front,v=[j.head[0]-j.neck[0],j.head[1]-j.neck[1]],vl=Math.hypot(v[0],v[1])||1,vn=[v[0]/vl,v[1]/vl];
 const feet=[(j.f1[0]+j.f2[0])/2,FLOOR+1.5];
 const lowest=Math.max(j.f1[1],j.f2[1],j.hip[1]),shadowOp=Math.max(0,.16-(FLOOR-lowest)/400);
 let s=`<ellipse class="bshadow" cx="${f1(feet[0])}" cy="${feet[1]}" rx="34" ry="3.4" opacity="${shadowOp.toFixed(3)}"/>`;
 if(front){
  const tv=[j.neck[0]-j.hip[0],j.neck[1]-j.hip[1]],tl=Math.hypot(tv[0],tv[1])||1,pr=[-tv[1]/tl,tv[0]/tl];
  const off=(pt,d)=>[pt[0]+pr[0]*d,pt[1]+pr[1]*d];
  // rechte Seite (a1/l1) liegt in Blickrichtung rechts
  const sgn=pr[0]>=0?1:-1,S1=off(j.neck,9.5*sgn),S2=off(j.neck,-9.5*sgn),H1=off(j.hip,4.5*sgn),H2=off(j.hip,-4.5*sgn);
  const sh=(o,d)=>off(o,d);
  const J1={...j,neck:S1,hip:H1},J2={...j,neck:S2,hip:H2};
  s+=limbLeg(J2,sh(j.k2,-4.5*sgn),sh(j.f2,-4.5*sgn),sh(j.t2,-4.5*sgn),false)+limbLeg(J1,sh(j.k1,4.5*sgn),sh(j.f1,4.5*sgn),sh(j.t1,4.5*sgn),false);
  s+=torsoPath(j.hip,j.neck,0,"bt",FRONT_W)+cap(off(j.hip,-4.5),off(j.hip,4.5),8.8,8.8,"bp")+cap(off(j.hip,-3),off(at(j.hip,j.neck,.18),-3),8,8,"bp")+cap(off(j.hip,3),off(at(j.hip,j.neck,.18),3),8,8,"bp");
  s+=cap(j.neck,j.head,3.6,3.6,"bs")+headSVG(j,true,vn);
  s+=limbArm(J2,sh(j.e2,-9.5*sgn),sh(j.h2,-9.5*sgn),false)+limbArm(J1,sh(j.e1,9.5*sgn),sh(j.h1,9.5*sgn),false);
  return s+muscleSVG(j,true,mus);
 }
 s+=limbArm(j,j.e2,j.h2,true)+limbLeg(j,j.k2,j.f2,j.t2,true);
 s+=torsoPath(j.hip,j.neck,1,"bt",SIDE_W);
 s+=limbLeg(j,j.k1,j.f1,j.t1,false);
 s+=torsoPath(j.hip,at(j.hip,j.neck,.22),1,"bp",[[-.55,7,9],[0,7.2,9.2],[.5,6.6,8.6],[1,6.5,8.5]]);
 s+=cap(j.neck,at(j.neck,j.head,.7),3.4,3.4,"bs")+headSVG(j,false,vn);
 s+=muscleSVG(j,false,mus);
 s+=limbArm(j,j.e1,j.h1,false);
 return s;
}
function mountAnim(el,patName,item,mus){
 const p=P[patName]||P.stand;
 const reduce=matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
 el.innerHTML=`<svg viewBox="${p.vb||"0 0 200 160"}" class="gfigsvg" role="img" aria-label="Animation der Übung">
  <line x1="8" y1="${FLOOR+1.5}" x2="192" y2="${FLOOR+1.5}" class="gfloor"/>
  <g class="gfix">${(p.fix||[]).map(f=>FIX[f]).join("")}</g>
  <g data-k="body"></g><g data-k="items"></g></svg>`;
 const B=el.querySelector('[data-k="body"]'),IT=el.querySelector('[data-k="items"]');
 const draw=pose=>{
  let j=fk(pose),sh=[0,0];
  if(p.anchor==="foot")sh=[p.at[0]-j.f1[0],p.at[1]-j.f1[1]];
  else if(p.anchor==="hand")sh=[p.at[0]-j.h1[0],p.at[1]-j.h1[1]];
  if(sh[0]||sh[1]){for(const k in j)j[k]=add(j[k],sh)}
  B.innerHTML=bodySVG(j,p,mus,item);
  IT.innerHTML=item?itemSVG(item,j,p.band):"";
 };
 const n=p.poses.length,seq=n===2?[0,1]:[...Array(n).keys()],durMs=(p.dur||1)*1000;
 const st={on:true};
 if(reduce){draw(mix(p.poses[0],p.poses[1%n],.6));return st}
 const t0=performance.now();
 const frame=now=>{
  if(!st.on)return;
  if(!el.isConnected){st.on=false;RUNNING.delete(st);return}
  const tt=Math.max(0,(now-t0)/durMs),i=Math.floor(tt)%seq.length,frac=tt%1;
  const e=Math.min(1,Math.max(0,(frac-.08)/.84)),ease=.5-.5*Math.cos(Math.PI*e);
  draw(mix(p.poses[seq[i]],p.poses[seq[(i+1)%seq.length]],ease));
  requestAnimationFrame(frame);
 };
 RUNNING.add(st);requestAnimationFrame(frame);
 return st;
}
// ---- Echte Übungsfotos (free-exercise-db, gemeinfrei/Unlicense): Start- und Endposition ----
const PHOTO={"Bankdrücken": "Barbell_Bench_Press_-_Medium_Grip", "Kurzhantel-Bankdrücken": "Dumbbell_Bench_Press", "Kurzhantel-Bodendrücken": "Dumbbell_Floor_Press", "Liegestütze": "Pushups", "Enge Liegestütze": "Pushups_Close_and_Wide_Hand_Positions", "Schulterdrücken": "Standing_Military_Press", "Kurzhantel-Schulterdrücken": "Dumbbell_Shoulder_Press", "Kettlebell-Schulterdrücken": "Two-Arm_Kettlebell_Military_Press", "Schulterdrücken mit Band": "Shoulder_Press_-_With_Bands", "Dips": "Dips_-_Triceps_Version", "Dips am Stuhl": "Bench_Dips", "Trizepsdrücken am Kabel": "Triceps_Pushdown_-_Rope_Attachment", "Kurzhantel-French-Press": "Dumbbell_One-Arm_Triceps_Extension", "Trizepsdrücken mit Band": "Speed_Band_Overhead_Triceps", "Klimmzüge": "Pullups", "Chin-ups (enger Griff)": "Chin-Up", "Latzug mit Band": "Straight-Arm_Pulldown", "Rudern unter dem Tisch": "Inverted_Row", "Langhantelrudern": "Bent_Over_Barbell_Row", "Kurzhantelrudern einarmig": "One-Arm_Dumbbell_Row", "Kettlebell-Rudern": "One-Arm_Kettlebell_Row", "Rudern mit Band": "Seated_Cable_Rows", "Superman (Rückenstrecker)": "Superman", "Bizepscurls": "Dumbbell_Bicep_Curl", "Kettlebell-Curls": "Dumbbell_Alternate_Bicep_Curl", "Bizepscurls mit Band": "Standing_Biceps_Cable_Curl", "Face Pulls": "Face_Pull", "Face Pulls mit Band": "Face_Pull", "Kurzhantel-Reverse-Flys": "Seated_Bent-Over_Rear_Delt_Raise", "Y-T-W-Heben am Boden": "Superman", "Kniebeugen": "Barbell_Squat", "Goblet Squats": "Goblet_Squat", "Kniebeugen mit Band": "Bodyweight_Squat", "Kniebeugen (Körpergewicht)": "Bodyweight_Squat", "Rumänisches Kreuzheben": "Romanian_Deadlift", "Kurzhantel-Kreuzheben": "Stiff-Legged_Dumbbell_Deadlift", "Kettlebell Swings": "One-Arm_Kettlebell_Swings", "Good Mornings mit Band": "Band_Good_Morning", "Einbeiniges Kreuzheben": "Kettlebell_One-Legged_Deadlift", "Ausfallschritte": "Dumbbell_Rear_Lunge", "Bulgarian Split Squats": "Split_Squat_with_Dumbbells", "Wadenheben": "Standing_Calf_Raises", "Plank (Sek.)": "Plank", "Hip Thrusts": "Barbell_Hip_Thrust", "Glute Bridges": "Butt_Lift_Bridge", "Schrägbankdrücken (Kurzhantel)": "Incline_Dumbbell_Press", "Brustpresse (Maschine)": "Machine_Bench_Press", "Butterfly (Maschine)": "Butterfly", "Liegestütze erhöht (leichter)": "Incline_Push-Up", "Arnold Press": "Arnold_Dumbbell_Press", "Schulterpresse (Maschine)": "Leverage_Shoulder_Press", "Seitheben": "Side_Lateral_Raise", "Seitheben mit Band": "Lateral_Raise_-_With_Bands", "Bankdrücken eng": "Close-Grip_Barbell_Bench_Press", "Trizeps-Kickbacks": "Tricep_Dumbbell_Kickback", "Overhead-Trizeps mit Band": "Speed_Band_Overhead_Triceps", "Latzug (Maschine)": "Wide-Grip_Lat_Pulldown", "Negativ-Klimmzüge": "Pullups", "Kabelrudern sitzend": "Seated_Cable_Rows", "T-Bar-Rudern": "T-Bar_Row_with_Handle", "Hammer Curls": "Hammer_Curls", "Kabelcurls": "Standing_Biceps_Cable_Curl", "Reverse Flys mit Band": "Back_Flyes_-_With_Bands", "Beinpresse": "Leg_Press", "Front Squats": "Front_Squat_Clean_Grip", "Sumo Squats": "Plie_Dumbbell_Squat", "Split Squats": "Split_Squats", "Kreuzheben (klassisch)": "Barbell_Deadlift", "Beinbeuger (Maschine)": "Lying_Leg_Curls", "Step-ups": "Dumbbell_Step_Ups", "Walking Lunges": "Bodyweight_Walking_Lunge", "Seitliche Ausfallschritte": "Barbell_Side_Split_Squat", "Wadenheben einbeinig": "Calf_Raise_On_A_Dumbbell", "Wadenheben an der Maschine": "Smith_Machine_Calf_Raise", "Seitstütz (Sek.)": "Side_Bridge", "Bergsteiger (Sek.)": "Mountain_Climbers", "Dead Bug": "Dead_Bug", "Russian Twists": "Russian_Twist", "Hanging Knee Raises": "Hanging_Leg_Raise", "Hip Thrusts mit Band": "Butt_Lift_Bridge", "Pike-Liegestütze": "Handstand_Push-Ups", "Hampelmann": "Star_Jump", "Armkreisen": "Arm_Circles", "Katze-Kuh": "Cat_Stretch", "Liegestütze locker": "Incline_Push-Up", "Band Pull-Aparts": "Band_Pull_Apart", "Y-T-W-Heben": "Superman", "Kniebeugen locker": "Bodyweight_Squat", "Ausfallschritte mit Drehung": "Bodyweight_Walking_Lunge", "Glute Bridges locker": "Butt_Lift_Bridge", "Bergsteiger": "Mountain_Climbers", "Wadenheben locker": "Standing_Calf_Raises", "Anfersen": "Single_Leg_Butt_Kick"};
function mountEx(el,n){
 const inf=info(n),id=PHOTO[n];
 if(!id||!el){el&&el.classList.remove("gphoto");return mountAnim(el,inf[0],itemFor(inf),inf[2])}
 el.classList.add("gphoto");
 el.innerHTML=`<img src="img/ex/${id}/0.jpg" alt="${esc2(n)}: Startposition" decoding="async"><img class="b" src="img/ex/${id}/1.jpg" alt="${esc2(n)}: Endposition" decoding="async"><div class="gph-tag" aria-hidden="true"><span class="s0">Start</span><span class="s1">Ende</span></div>`;
 let failed=false;el.querySelectorAll("img").forEach(im=>im.addEventListener("error",()=>{if(failed)return;failed=true;el.classList.remove("gphoto");mountAnim(el,inf[0],itemFor(inf),inf[2])}));
 return{on:true};
}
function stopAnims(){RUNNING.forEach(s=>s.on=false);RUNNING.clear()}

// ================= Übungswissen =================
// [Muster, Gewicht, Muskeln, Tipps, Körpergewicht?, Sekunden (gehalten)?]
const EX={
 "Bankdrücken":["bench","bb","Brust, Schultern, Trizeps",["Schulterblätter zusammen und nach unten ziehen","Stange kontrolliert zur unteren Brust senken","Füße fest am Boden, kraftvoll hochdrücken"]],
 "Kurzhantel-Bankdrücken":["bench","db","Brust, Schultern, Trizeps",["Hanteln auf Brusthöhe, Ellbogen ca. 45° zum Körper","Gleichmäßig nach oben drücken","Langsam absenken, bis du eine Dehnung spürst"]],
 "Kurzhantel-Bodendrücken":["floorpress","db","Brust, Trizeps",["Rückenlage, Knie angewinkelt","Absenken, bis die Oberarme den Boden berühren","Kurz pausieren, dann kraftvoll hochdrücken"]],
 "Liegestütze":["pushup",null,"Brust, Schultern, Trizeps, Rumpf",["Hände etwas breiter als schulterbreit","Körper bleibt eine gerade Linie, Bauch fest","Brust bis knapp über den Boden, dann hochdrücken"],1],
 "Enge Liegestütze":["pushup",null,"Trizeps, Brust",["Hände eng unter den Schultern","Ellbogen nah am Körper nach hinten führen","Zu schwer? Auf den Knien ausführen"],1],
 "Pike-Liegestütze":["pike",null,"Schultern, Trizeps",["Hüfte hoch, Körper bildet ein umgedrehtes V","Kopf zwischen die Hände Richtung Boden senken","Kraftvoll zurück nach oben drücken"],1],
 "Schulterdrücken":["ohp","bb","Schultern, Trizeps",["Stange auf Schulterhöhe, etwas breiter als schulterbreit","Bauch und Po anspannen, kein Hohlkreuz","Senkrecht über den Kopf drücken"]],
 "Kurzhantel-Schulterdrücken":["ohp","db","Schultern, Trizeps",["Hanteln auf Schulterhöhe, Handflächen nach vorn","Rumpf fest, kein Hohlkreuz","Nach oben drücken, bis die Arme gestreckt sind"]],
 "Kettlebell-Schulterdrücken":["ohp","kb","Schultern, Trizeps, Rumpf",["Kettlebell in Racks-Position an der Schulter","Po und Bauch anspannen","Nach oben drücken, Arm neben dem Ohr"]],
 "Schulterdrücken mit Band":["ohp","band","Schultern, Trizeps",["Band unter beide Füße, Enden auf Schulterhöhe","Rumpf fest","Nach oben drücken, langsam zurück"]],
 "Dips":["dips",null,"Brust, Trizeps",["Arme gestreckt, Schultern weg von den Ohren","Absenken, bis die Oberarme waagrecht sind","Oberkörper leicht nach vorn, hochdrücken"],1],
 "Dips am Stuhl":["benchdip",null,"Trizeps",["Hände an der Stuhlkante, Finger nach vorn","Po nah am Stuhl absenken, Ellbogen nach hinten","Bis ca. 90° beugen, dann hochdrücken"],1],
 "Trizepsdrücken am Kabel":["pushdown","cable","Trizeps",["Ellbogen fest an der Seite","Griff nach unten drücken, Arme ganz strecken","Langsam zurück, Ellbogen bleiben ruhig"]],
 "Kurzhantel-French-Press":["french","db","Trizeps",["Hantel mit beiden Händen über dem Kopf","Hinter dem Kopf absenken, Ellbogen zeigen nach vorn","Nur die Unterarme bewegen"]],
 "Trizepsdrücken mit Band":["pushdown","band","Trizeps",["Band oben befestigen, z. B. mit Türanker","Ellbogen an der Seite, nach unten strecken","Langsam zurück"]],
 "Klimmzüge":["pullup",null,"Rücken, Bizeps",["Etwas breiter als schulterbreit greifen","Brust zur Stange, Schultern nach unten","Kontrolliert ganz ablassen. Zu schwer? Band als Hilfe"],1],
 "Chin-ups (enger Griff)":["pullup",null,"Bizeps, Rücken",["Untergriff, Hände schulterbreit","Kinn über die Stange ziehen","Langsam bis zu gestreckten Armen ablassen"],1],
 "Latzug mit Band":["pulldown","band","Rücken, Bizeps",["Band oben befestigen, Arme nach oben gestreckt","Ellbogen nach unten zu den Rippen ziehen","Schulterblätter zusammen, langsam zurück"]],
 "Rudern unter dem Tisch":["inverted",null,"Rücken, Bizeps",["Unter einen stabilen Tisch legen, Kante greifen","Körper gerade, Fersen am Boden","Brust zur Tischkante ziehen, langsam ablassen"],1],
 "Langhantelrudern":["row","bb","Rücken, Bizeps",["Oberkörper ca. 45° nach vorn, Rücken gerade","Stange zum Bauchnabel ziehen","Schulterblätter zusammen, kontrolliert absenken"]],
 "Kurzhantelrudern einarmig":["row","db","Rücken, Bizeps",["Eine Hand und ein Knie auf der Bank abstützen","Hantel zur Hüfte ziehen, Ellbogen nah am Körper","Unten ganz strecken, dann Seite wechseln"]],
 "Kettlebell-Rudern":["row","kb","Rücken, Bizeps",["Hüfte nach hinten, Rücken gerade","Kettlebell zur Hüfte ziehen","Langsam absenken, Seite wechseln"]],
 "Rudern mit Band":["rowband","band","Rücken, Bizeps",["Band auf Brusthöhe befestigen","Ellbogen nach hinten ziehen, Brust raus","Schulterblätter zusammen, langsam nachgeben"]],
 "Superman (Rückenstrecker)":["superman",null,"Unterer Rücken, Po",["Bauchlage, Arme nach vorn gestreckt","Arme und Beine gleichzeitig leicht anheben","2 Sekunden halten, langsam ablegen"],1],
 "Bizepscurls":["curl","db","Bizeps",["Ellbogen bleiben eng am Körper","Gewicht kontrolliert hochbeugen, nicht schwingen","Langsam ganz absenken"]],
 "Kettlebell-Curls":["curl","kb","Bizeps, Unterarme",["Kettlebell am Griff halten","Ellbogen fixiert, hochbeugen","Langsam absenken"]],
 "Bizepscurls mit Band":["curl","band","Bizeps",["Band unter die Füße, Enden greifen","Ellbogen am Körper, hochbeugen","Langsam nachgeben"]],
 "Handtuch-Curls (isometrisch, Sek.)":["towel","band","Bizeps",["Handtuch unter den Fuß, Enden greifen","Mit voller Kraft nach oben ziehen","Spannung halten, ruhig atmen"],1,30],
 "Face Pulls":["facepull","cable","Hintere Schulter, oberer Rücken",["Seil auf Kopfhöhe einstellen","Zum Gesicht ziehen, Hände nach außen","Ellbogen hoch, Schulterblätter zusammen"]],
 "Face Pulls mit Band":["facepull","band","Hintere Schulter, oberer Rücken",["Band auf Kopfhöhe befestigen","Zum Gesicht ziehen, Hände nach außen","Ellbogen hoch, Schulterblätter zusammen"]],
 "Kurzhantel-Reverse-Flys":["revfly","db","Hintere Schulter",["Oberkörper nach vorn, Rücken gerade","Arme leicht gebeugt seitlich anheben","Oben kurz halten, langsam absenken"]],
 "Y-T-W-Heben am Boden":["superman",null,"Oberer Rücken, Schultern",["Bauchlage, Stirn knapp über dem Boden","Arme nacheinander in Y-, T- und W-Form anheben","Schulterblätter bewusst zusammenziehen"],1],
 "Kniebeugen":["squat_bb","bbneck","Beine, Po",["Stange auf dem oberen Rücken, Füße schulterbreit","Hüfte nach hinten unten, Knie folgen den Zehen","Bis Oberschenkel waagrecht, dann hochdrücken"]],
 "Goblet Squats":["squat_goblet","gob","Beine, Po, Rumpf",["Gewicht vor der Brust halten","Aufrecht bleiben, tief in die Hocke","Über die Fersen hochdrücken"]],
 "Kniebeugen mit Band":["squat_band","band","Beine, Po",["Band unter die Füße, Enden auf Schulterhöhe","Hüfte nach hinten, Knie nach außen","Hochdrücken gegen den Widerstand"]],
 "Kniebeugen (Körpergewicht)":["squat_bw",null,"Beine, Po",["Füße schulterbreit, Arme nach vorn","Hüfte nach hinten unten, Rücken gerade","Fersen bleiben am Boden, hochdrücken"],1],
 "Rumänisches Kreuzheben":["hinge","bb","Hintere Oberschenkel, Po, Rücken",["Knie leicht gebeugt, Rücken gerade","Hüfte nach hinten, Stange nah an den Beinen","Bis Mitte Schienbein, dann Hüfte nach vorn"]],
 "Kurzhantel-Kreuzheben":["hinge","db","Hintere Oberschenkel, Po, Rücken",["Hanteln vor den Oberschenkeln","Hüfte nach hinten, Rücken gerade","Bis Mitte Schienbein, dann aufrichten"]],
 "Kettlebell Swings":["swing","kb","Po, hintere Oberschenkel, Rumpf",["Kettlebell zwischen die Beine schwingen","Hüfte explosiv nach vorn strecken","Die Kraft kommt aus der Hüfte, nicht aus den Armen"]],
 "Good Mornings mit Band":["hinge_gm","band","Hintere Oberschenkel, unterer Rücken",["Band unter die Füße, hinter den Nacken","Hüfte nach hinten, Rücken gerade","Aufrichten über die Hüfte"]],
 "Einbeiniges Kreuzheben":["sl_rdl",null,"Po, hintere Oberschenkel, Balance",["Auf einem Bein stehen, Knie leicht gebeugt","Oberkörper nach vorn, hinteres Bein hebt sich","Hüfte bleibt gerade, langsam zurück"],1],
 "Ausfallschritte":["lunge","db?","Beine, Po",["Großer Schritt nach hinten","Hinteres Knie knapp über den Boden","Über die vordere Ferse zurückdrücken"]],
 "Bulgarian Split Squats":["bulgarian","db?","Beine, Po",["Hinteren Fuß auf die Bank legen","Senkrecht nach unten absenken","Vorderes Knie über dem Fuß, hochdrücken"]],
 "Wadenheben":["calf","db?","Waden",["Fußballen auf eine Stufe oder flach am Boden","So hoch wie möglich auf die Zehen","Oben kurz halten, langsam absenken"]],
 "Plank (Sek.)":["plank",null,"Rumpf",["Unterarme unter den Schultern","Körper gerade wie ein Brett","Bauch und Po fest anspannen, ruhig atmen"],1,45],
 "Hip Thrusts":["hipthrust","bbhip","Po, hintere Oberschenkel",["Schultern an der Bank, Stange auf der Hüfte","Hüfte hochdrücken, bis der Körper gerade ist","Oben Po fest anspannen"]],
 "Glute Bridges":["bridge",null,"Po, hintere Oberschenkel",["Rückenlage, Füße hüftbreit aufgestellt","Hüfte hochdrücken bis zur geraden Linie","Oben Po anspannen, langsam ablegen"],1],
 "Schrägbankdrücken (Kurzhantel)":["bench","db","Obere Brust, Schultern",["Bank auf ca. 30° schräg stellen","Hanteln über der oberen Brust nach oben drücken","Langsam absenken, Ellbogen leicht angewinkelt"]],
 "Brustpresse (Maschine)":["bench",null,"Brust, Trizeps",["Sitz so einstellen, dass die Griffe auf Brusthöhe sind","Griffe kontrolliert nach vorn drücken","Langsam zurück, Schultern bleiben unten"]],
 "Butterfly (Maschine)":["bench",null,"Brust",["Arme leicht gebeugt, Ellbogen auf Schulterhöhe","Griffe vor der Brust zusammenführen","Langsam öffnen bis zur Dehnung"]],
 "Liegestütze erhöht (leichter)":["pushup",null,"Brust, Trizeps",["Hände auf Bank, Tisch oder Wand","Körper bleibt gerade","Je höher die Hände, desto leichter"],1],
 "Arnold Press":["ohp","db","Schultern",["Hanteln vor dem Gesicht, Handflächen zu dir","Beim Hochdrücken die Hände nach aussen drehen","Langsam zurück in die Startposition"]],
 "Schulterpresse (Maschine)":["ohp",null,"Schultern, Trizeps",["Griffe auf Schulterhöhe","Rücken fest an der Lehne","Nach oben drücken, langsam zurück"]],
 "Seitheben":["lateral","db","Seitliche Schulter",["Hanteln seitlich am Körper, Arme leicht gebeugt","Seitlich bis auf Schulterhöhe heben","Langsam absenken, nicht schwingen"]],
 "Seitheben mit Band":["lateral","band","Seitliche Schulter",["Band unter die Füsse","Arme seitlich bis Schulterhöhe heben","Langsam nachgeben"]],
 "Bankdrücken eng":["bench","bb","Trizeps, Brust",["Griff schulterbreit","Ellbogen nah am Körper absenken","Kraftvoll hochdrücken"]],
 "Trizeps-Kickbacks":["kickback","db","Trizeps",["Oberkörper nach vorn, Oberarm am Körper","Unterarm nach hinten strecken","Oberarm bleibt ruhig, langsam zurück"]],
 "Overhead-Trizeps mit Band":["french","band","Trizeps",["Band unter den Fuss, Enden hinter dem Kopf","Arme nach oben strecken","Ellbogen zeigen nach vorn"]],
 "Latzug (Maschine)":["pulldown","cable","Rücken, Bizeps",["Stange etwas breiter als schulterbreit greifen","Zur oberen Brust ziehen, Brust raus","Langsam nach oben zurück"]],
 "Negativ-Klimmzüge":["pullup",null,"Rücken, Bizeps",["Mit Sprung oder Hocker nach oben","Ganz langsam ablassen (3–5 Sekunden)","Ideal, um Klimmzüge zu lernen"],1],
 "Kabelrudern sitzend":["rowband","cable","Rücken, Bizeps",["Aufrecht sitzen, Knie leicht gebeugt","Griff zum Bauch ziehen, Schulterblätter zusammen","Langsam nach vorn nachgeben"]],
 "T-Bar-Rudern":["row","bb","Rücken",["Oberkörper nach vorn, Rücken gerade","Stange zur Brust ziehen","Kontrolliert absenken"]],
 "Hammer Curls":["curl","db","Bizeps, Unterarme",["Daumen zeigen nach oben","Ellbogen am Körper, hochbeugen","Langsam absenken"]],
 "Kabelcurls":["curl","cable","Bizeps",["Griff am unteren Kabelzug","Ellbogen fixiert, hochbeugen","Spannung halten, langsam zurück"]],
 "Reverse Flys mit Band":["facepull","band","Hintere Schulter",["Band auf Brusthöhe vor dem Körper","Arme gestreckt nach aussen ziehen","Schulterblätter zusammen"]],
 "Beinpresse":["squat_bw",null,"Beine, Po",["Füsse schulterbreit auf der Platte","Knie bis ca. 90° beugen","Drücken, Knie nicht ganz durchstrecken"]],
 "Front Squats":["squat_goblet","bb","Beine, Rumpf",["Stange vorn auf den Schultern","Ellbogen hoch, Oberkörper aufrecht","Tief in die Hocke, hochdrücken"]],
 "Sumo Squats":["squat_goblet","db","Beine, Innenseite, Po",["Breiter Stand, Zehen nach aussen","Hantel zwischen den Beinen halten","Tief absenken, über die Fersen hochdrücken"]],
 "Split Squats":["lunge",null,"Beine, Po",["Schrittstellung, Füsse bleiben stehen","Hinteres Knie Richtung Boden","Über das vordere Bein hochdrücken"],1],
 "Kreuzheben (klassisch)":["hinge","bb","Rücken, Po, Beine",["Stange über der Fussmitte, Rücken gerade","Mit Beinen und Hüfte hochdrücken","Stange nah am Körper, oben aufrichten"]],
 "Beinbeuger (Maschine)":["legcurl",null,"Hintere Oberschenkel",["Polster knapp über den Fersen","Fersen Richtung Po ziehen","Langsam zurück"]],
 "Step-ups":["lunge","db?","Beine, Po",["Ganzen Fuss auf die Bank setzen","Über das vordere Bein hochdrücken","Langsam wieder absteigen, Seite wechseln"]],
 "Walking Lunges":["lunge",null,"Beine, Po",["Grosser Schritt nach vorn","Hinteres Knie knapp über den Boden","Direkt in den nächsten Schritt"],1],
 "Seitliche Ausfallschritte":["lunge",null,"Beine, Innenseite",["Breiter Schritt zur Seite","Hüfte nach hinten, anderes Bein gestreckt","Zurückdrücken, Seite wechseln"],1],
 "Wadenheben einbeinig":["calf",null,"Waden",["Auf einem Bein, z. B. auf einer Stufe","Ganz hoch auf die Zehen","Langsam absenken"],1],
 "Wadenheben an der Maschine":["calf","bbneck","Waden",["Schultern unter die Polster","Hoch auf die Zehen drücken","Unten kurz dehnen"]],
 "Seitstütz (Sek.)":["sideplank",null,"Seitlicher Rumpf",["Unterarm unter der Schulter","Hüfte hoch, Körper gerade","Halten, dann Seite wechseln"],1,30],
 "Bergsteiger (Sek.)":["climbers",null,"Rumpf, Kreislauf",["Liegestützposition","Knie abwechselnd zur Brust","Hüfte bleibt unten"],1,30],
 "Dead Bug":["deadbug",null,"Rumpf",["Rückenlage, Arme hoch, Knie 90°","Gegengleich Arm und Bein strecken","Unterer Rücken bleibt am Boden"],1],
 "Russian Twists":["twist",null,"Seitlicher Rumpf",["Sitzen, Oberkörper leicht zurück","Hände von Seite zu Seite führen","Füsse optional anheben"],1],
 "Hanging Knee Raises":["kneeraise",null,"Bauch, Hüftbeuger",["An der Stange hängen","Knie zur Brust ziehen","Langsam absenken, nicht schwingen"],1],
 "Hip Thrusts mit Band":["hipthrust",null,"Po",["Band über der Hüfte","Hüfte hochdrücken","Oben Po fest anspannen"]],
 // Aufwärmen
 "Hampelmann":["jacks",null,"Ganzer Körper",["Locker auf der Stelle springen","Arme über den Kopf, Beine auseinander","Gleichmäßiges Tempo"],1],
 "Armkreisen":["armcircles",null,"Schultern",["Arme seitlich ausstrecken","Kleine Kreise, langsam größer werden","Nach der Hälfte Richtung wechseln"],1],
 "Katze-Kuh":["catcow",null,"Wirbelsäule",["Vierfüßlerstand, Hände unter den Schultern","Einatmen: Blick nach vorn, Rücken senken","Ausatmen: Rücken rund, Kinn zur Brust"],1],
 "Liegestütze locker":["pushup",null,"Brust, Schultern",["Langsam und kontrolliert","Gerne auf den Knien","Nur aufwärmen, nicht auspowern"],1],
 "Band Pull-Aparts":["facepull","band","Oberer Rücken",["Band auf Brusthöhe vor dem Körper","Arme gestreckt auseinanderziehen","Schulterblätter zusammen"],1],
 "Y-T-W-Heben":["superman",null,"Oberer Rücken",["Bauchlage","Arme in Y-, T- und W-Form heben","Langsam und bewusst"],1],
 "Hängen an der Stange":["deadhang",null,"Schultern, Griff",["Stange schulterbreit greifen","Locker hängen, Schultern leicht aktiv","Ruhig atmen"],1],
 "Kniehebelauf":["highknees",null,"Beine, Kreislauf",["Auf der Stelle laufen","Knie bis Hüfthöhe heben","Arme aktiv mitnehmen"],1],
 "Anfersen":["buttkicks",null,"Oberschenkel, Kreislauf",["Auf der Stelle laufen","Fersen Richtung Po","Leicht und schnell"],1],
 "Beinpendel":["legswing",null,"Hüfte",["An einer Wand abstützen","Bein locker vor und zurück schwingen","Nach der Hälfte Seite wechseln"],1],
 "Kniebeugen locker":["squat_bw",null,"Beine, Hüfte",["Langsam und tief","Fersen bleiben am Boden","Arme nach vorn"],1],
 "Ausfallschritte mit Drehung":["lunge",null,"Hüfte, Beine",["Großer Schritt","Oberkörper zum vorderen Bein drehen","Seiten abwechseln"],1],
 "Glute Bridges locker":["bridge",null,"Po",["Hüfte hoch und runter","Oben kurz anspannen","Ruhiges Tempo"],1],
 "Bergsteiger":["climbers",null,"Rumpf, Kreislauf",["Liegestützposition","Knie abwechselnd zur Brust ziehen","Hüfte bleibt unten"],1],
 "Zügig gehen":["walk",null,"Kreislauf",["Zügig gehen oder ganz locker traben","Arme mitschwingen","Puls langsam steigern"],1],
 "Wadenheben locker":["calf",null,"Waden, Sprunggelenke",["Auf die Zehen und zurück","Locker und federnd","Sprunggelenke mobilisieren"],1]
};
const eqNow=()=>(typeof S!=="undefined"&&S&&S.profile&&S.profile.equip&&S.profile.equip.length)?S.profile.equip:["gym"];
function itemFor(info){
 let it=info[1];const eq=eqNow(),has=k=>eq.includes("gym")||eq.includes(k);
 if(it==="db?")return has("db")?"db":null;
 if(it==="gob")return has("db")?"db":has("kb")?"kb":"db";
 return it;
}
const info=n=>EX[n]||["stand",null,"",[]];
const isBW=n=>!!info(n)[4],holdSec=n=>info(n)[5]||0;
const esc2=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

// ================= Aufwärmprogramme =================
function warmupFor(name){
 const eq=eqNow(),has=k=>eq.includes("gym")||eq.includes(k),W=(n,v)=>({k:"warm",n,...v});
 if(/Push|Oberkörper/.test(name))return[W("Hampelmann",{sec:45}),W("Armkreisen",{sec:30}),W("Katze-Kuh",{reps:"8×"}),W("Liegestütze locker",{reps:"8×"}),has("band")?W("Band Pull-Aparts",{reps:"15×"}):W("Y-T-W-Heben",{reps:"8×"})];
 if(/Pull/.test(name))return[W("Hampelmann",{sec:45}),W("Armkreisen",{sec:30}),W("Katze-Kuh",{reps:"8×"}),has("band")?W("Band Pull-Aparts",{reps:"15×"}):W("Y-T-W-Heben",{reps:"8×"}),has("bar")?W("Hängen an der Stange",{sec:20}):W("Superman (Rückenstrecker)",{reps:"8×"})];
 if(/Beine|Unterkörper/.test(name))return[W("Kniehebelauf",{sec:40}),W("Beinpendel",{reps:"10× pro Seite"}),W("Kniebeugen locker",{reps:"10×"}),W("Ausfallschritte mit Drehung",{reps:"6× pro Seite"}),W("Glute Bridges locker",{reps:"10×"})];
 return[W("Hampelmann",{sec:45}),W("Bergsteiger",{sec:30}),W("Kniebeugen locker",{reps:"10×"}),W("Katze-Kuh",{reps:"6×"}),W("Beinpendel",{reps:"8× pro Seite"})];
}
const RUNWARM=[{k:"warm",n:"Zügig gehen",sec:180},{k:"warm",n:"Beinpendel",reps:"10× pro Seite"},{k:"warm",n:"Kniehebelauf",sec:30},{k:"warm",n:"Anfersen",sec:30},{k:"warm",n:"Ausfallschritte mit Drehung",reps:"6× pro Seite"},{k:"warm",n:"Wadenheben locker",reps:"15×"}];

// ================= Ton, Vibration =================
let AC=null;
function beep(f=880,d=.16,times=1){try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();
 for(let i=0;i<times;i++){const o=AC.createOscillator(),g=AC.createGain(),t=AC.currentTime+i*.22;o.frequency.value=f;o.connect(g);g.connect(AC.destination);
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.25,t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.start(t);o.stop(t+d+.02)}}catch(e){}
 try{navigator.vibrate&&navigator.vibrate(times>1?[120,80,120]:120)}catch(e){}}

// ================= Player =================
let G2=null; // {mode:"wk"|"run", steps, i, tEnd, left, run, iv}
const host=()=>{let h=document.getElementById("gplayer");if(!h){h=document.createElement("div");h.id="gplayer";h.className="gp";h.setAttribute("role","dialog");h.setAttribute("aria-modal","true");document.body.appendChild(h)}return h};

function buildSteps(){
 const steps=[...warmupFor(CUR.name)];
 const sets=[];CUR.ex.forEach((x,xi)=>x.sets.forEach((s,si)=>{if(!s.done)sets.push({k:"set",x:xi,s:si})}));
 sets.forEach((st,i)=>{steps.push(st);if(i<sets.length-1){const bw=isBW(CUR.ex[st.x].e);const rs=window.restSec?window.restSec():90;steps.push({k:"rest",sec:bw?Math.min(60,rs):rs})}});
 steps.push({k:"done"});
 return steps;
}
function open(mode){
 if(mode==="wk"&&(!CUR||!CUR.ex.length)){if(CUR&&typeof toast==="function")toast("Füge zuerst Übungen hinzu");return}
 G2={mode,steps:mode==="run"?[...RUNWARM,{k:"rundone"}]:buildSteps(),i:0,start:Date.now()};
 if(typeof wakeOn==="function")wakeOn();
 beep(660,.01);// Audio freischalten
 show();
}
function close(){
 stopTimer();stopAnims();const h=document.getElementById("gplayer");if(h)h.remove();G2=null;
 if(typeof W!=="undefined"&&!W.running&&typeof wakeOff==="function")wakeOff();
 if(typeof render==="function")render(true);
}
function stopTimer(){if(G2&&G2.iv){clearInterval(G2.iv);G2.iv=null}}
function startTimer(sec,onEnd){
 stopTimer();G2.left=sec;G2.total=sec;G2.tEnd=Date.now()+sec*1000;G2.run=true;G2.onEnd=onEnd;
 G2.iv=setInterval(tick,200);tick();
}
function tick(){
 if(!G2)return;
 const left=G2.run?Math.max(0,(G2.tEnd-Date.now())/1000):G2.left;
 const el=document.getElementById("gtime"),ring=document.getElementById("gring");
 if(el)el.textContent=fmt(Math.ceil(left));
 if(ring){const C=2*Math.PI*54;ring.setAttribute("stroke-dashoffset",String(C*(1-left/G2.total)))}
 if(G2.run&&left<=3.2&&left>0&&!G2.warned){G2.warned=true;beep(660,.1)}
 if(G2.run&&left<=0){G2.run=false;stopTimer();beep(990,.18,2);const f=G2.onEnd;G2.onEnd=null;if(f)f()}
}
const fmt=s=>Math.floor(s/60)+":"+String(Math.max(0,s%60)).padStart(2,"0");
function next(){if(!G2)return;stopTimer();G2.warned=false;G2.i=Math.min(G2.i+1,G2.steps.length-1);show()}
function prev(){if(!G2||G2.i===0)return;stopTimer();G2.warned=false;G2.i--;if(G2.steps[G2.i].k==="rest"&&G2.i>0)G2.i--;show()}

function ringTimer(sec){const C=2*Math.PI*54;return`<div class="gtimer"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="54" class="gtr"/><circle id="gring" cx="60" cy="60" r="54" class="gtf" stroke-dasharray="${C}" stroke-dashoffset="0"/></svg><div id="gtime" class="num">${fmt(sec)}</div></div>`}

function show(){
 stopAnims();
 const h=host(),st=G2.steps[G2.i],N=G2.steps.length;
 const warmN=G2.steps.filter(s=>s.k==="warm").length;
 const prog=`<div class="gprog"><i style="width:${(G2.i/(N-1))*100}%"></i></div>`;
 const top=lbl=>`<div class="gtop"><button class="icon-btn" data-g="close" aria-label="Schließen">${I.x}</button><div class="gphase">${lbl}</div><button class="glink" data-g="prev" ${G2.i?"":"disabled"}>Zurück</button></div>${prog}`;
 let body="";
 if(st.k==="warm"){
  const inf=info(st.n),wi=G2.steps.slice(0,G2.i+1).filter(s=>s.k==="warm").length;
  body=top(`Aufwärmen · ${wi} von ${warmN}`)+`<div class="gfig" id="gfig"></div>
  <div class="gname"><h1>${esc2(st.n)}</h1><span class="pill acc">${st.sec?st.sec+" Sek.":st.reps}</span></div>
  <ul class="gcues">${inf[3].map(c=>`<li>${esc2(c)}</li>`).join("")}</ul>
  ${st.sec?ringTimer(st.sec)+`<div class="grid2"><button class="btn ghost" data-g="pause" id="gpause">Pause</button><button class="btn" data-g="next">Weiter</button></div>`
   :`<button class="btn block gbig" data-g="next">Fertig, weiter</button>`}
  <button class="glink gskip" data-g="skipwarm">Aufwärmen überspringen</button>`;
 }else if(st.k==="set"){
  const x=CUR.ex[st.x],s=x.sets[st.s],inf=info(x.e),bw=isBW(x.e),hold=holdSec(x.e);
  const last=typeof lastFor==="function"?lastFor(x.e):null,ls=last&&(last[st.s]||last[0]);
  const exI=CUR.ex.findIndex(e=>e===x)+1;
  body=top(`Übung ${exI} von ${CUR.ex.length} · Satz ${st.s+1} von ${x.sets.length}`)+`<div class="gfig" id="gfig"></div>
  <div class="gname"><h1>${esc2(x.e)}</h1><span class="gleg"><i></i>Trainiert: ${esc2(inf[2])}</span></div>
  <ul class="gcues">${inf[3].map(c=>`<li>${esc2(c)}</li>`).join("")}</ul>
  ${G2.firstSet!==true&&exI===1&&st.s===0&&!bw?`<div class="tip"><i></i><div class="small">Tipp: Mach vorher einen leichten Aufwärmsatz mit etwa der Hälfte des Gewichts.</div></div>`:""}
  <div class="${bw?"":"grid2"}">${bw?"":`<label class="f">Gewicht (kg)<input id="gkg" inputmode="decimal" value="${s.kg===""?"":esc2(s.kg)}" placeholder="0"></label>`}
  <label class="f">${hold?"Sekunden":"Wiederholungen"}<input id="greps" inputmode="numeric" value="${s.reps===""?(hold||""):esc2(s.reps)}" placeholder="${hold?hold:"10"}"></label></div>
  ${ls?`<div class="small muted">Letztes Mal: ${ls.kg?String(ls.kg).replace(".",",")+" kg × ":""}${ls.reps}${hold?" Sek.":""}</div>`:""}
  ${hold?`<div id="ghold"></div><button class="btn block gbig" data-g="hold">Halten starten</button>`:`<button class="btn block gbig" data-g="done">Satz erledigt</button>`}
  <div class="row" style="justify-content:center;gap:22px"><button class="glink" data-a="exSwap" data-x="${st.x}">Übung tauschen</button><button class="glink" style="color:var(--muted)" data-g="list">Zur Übersicht</button></div>`;
 }else if(st.k==="rest"){
  const nx=G2.steps.slice(G2.i+1).find(s=>s.k==="set"),nxe=nx?CUR.ex[nx.x]:null;
  const prev=G2.steps.slice(0,G2.i).reverse().find(s=>s.k==="set"),isNew=!!(nxe&&(!prev||prev.x!==nx.x));
  let prep="";
  if(nxe&&!isNew&&prev){const ps=CUR.ex[prev.x].sets[prev.s],ns0=nxe.sets[nx.s];if(ns0.kg===""&&ps.kg!=="")ns0.kg=ps.kg;if(ns0.reps===""&&ps.reps!=="")ns0.reps=ps.reps}
  if(nxe){const ns=nxe.sets[nx.s],inf=info(nxe.e),bw=isBW(nxe.e),hold=holdSec(nxe.e),last=typeof lastFor==="function"?lastFor(nxe.e):null,ls=last&&(last[nx.s]||last[0]);
   const exI=CUR.ex.indexOf(nxe)+1;
   prep=`<div class="card gnext ${isNew?"gnew":""}"><div class="row between"><div class="eyebrow">${isNew?"Nächste Übung · jetzt vorbereiten":"Als Nächstes"}</div><span class="small muted">Übung ${exI} von ${CUR.ex.length}</span></div>
    <div class="gfig ${isNew?"":"gmed"}" id="gfig"></div>
    <div><div style="font-weight:800;font-size:20px;line-height:1.2">${esc2(nxe.e)}</div><div class="small muted">Satz ${nx.s+1} von ${nxe.sets.length} · Trainiert: ${esc2(inf[2])}</div></div>
    <div class="${bw?"":"grid2"}">${bw?"":`<label class="f">Gewicht (kg)<input id="gnkg" data-gn="kg" inputmode="decimal" value="${ns.kg===""?"":esc2(ns.kg)}" placeholder="0"></label>`}
     <label class="f">${hold?"Sekunden":"Wiederholungen"}<input id="gnreps" data-gn="reps" inputmode="numeric" value="${ns.reps===""?(hold||""):esc2(ns.reps)}" placeholder="${hold?hold:"10"}"></label></div>
    ${ls?`<div class="small muted">Letztes Mal: ${ls.kg?String(ls.kg).replace(".",",")+" kg × ":""}${ls.reps}${hold?" Sek.":""}</div>`:""}
    ${isNew?`<div class="small" style="font-weight:700">So geht's</div><ul class="gcues">${inf[3].map(c=>`<li>${esc2(c)}</li>`).join("")}</ul>
     <div class="tip"><i></i><div class="small">${bw?"Platz frei machen und Position einnehmen.":"Gerät einstellen und Gewicht bereitlegen, dann bist du startklar, wenn die Pause vorbei ist."}</div></div>`:""}
   </div>`}
  body=top("Pause")+`<div class="grest grestc"><div class="grow">${ringTimer(st.sec)}</div>
  <div class="gcol"><button class="btn ghost" data-g="plus">+15 Sek.</button><button class="btn" data-g="next">Weiter</button></div></div>${prep}`;
 }else if(st.k==="done"){
  const sets=CUR.ex.reduce((a,x)=>a+x.sets.filter(s=>s.done).length,0),vol=CUR.ex.reduce((a,x)=>a+x.sets.filter(s=>s.done).reduce((b,s)=>b+(num(s.kg)||0)*(num(s.reps)||0),0),0);
  const min=Math.max(1,Math.round((Date.now()-CUR.start)/60000));
  body=top("Geschafft")+`<div class="gdone"><div class="gbadge">${I.ok}</div><h1>Starkes Training!</h1><p class="muted" style="margin:0">${esc2(CUR.name)} abgeschlossen.</p></div>
  <div class="grid3 gstats"><div><div class="eyebrow">Sätze</div><div class="num">${sets}</div></div><div><div class="eyebrow">Volumen</div><div class="num">${Math.round(vol).toLocaleString("de-DE")} kg</div></div><div><div class="eyebrow">Dauer</div><div class="num">${min} Min.</div></div></div>
  <div class="stack" style="gap:8px"><div style="font-weight:700;text-align:center">Wie anstrengend war es?</div>
  <div class="grid3">${[["leicht","Leicht"],["mittel","Mittel"],["hart","Hart"]].map(([k,l])=>`<button class="chip" data-g="int" data-v="${k}" aria-pressed="${(CUR.int||"mittel")===k}">${l}</button>`).join("")}</div>
  <div class="small muted" style="text-align:center" id="gkcal">Verbrauch ca. ${typeof wkKcal==="function"?Math.round(wkKcal({min,int:CUR.int||"mittel"})).toLocaleString("de-DE"):"–"} kcal · zählt zu deinem Tagesziel</div></div>
  <button class="btn block gbig" data-g="save">Training speichern</button><button class="glink gskip" data-g="list">Zur Übersicht</button>`;
 }else if(st.k==="rundone"){
  body=top("Bereit")+`<div class="gdone"><div class="gbadge">${I.ok}</div><h1>Aufgewärmt!</h1><p class="muted" style="margin:0">Muskeln und Gelenke sind bereit. Viel Spaß beim Laufen.</p></div>
  <button class="btn block gbig" data-g="runstart">Lauf starten</button><button class="glink gskip" data-g="close">Schließen</button>`;
 }
 h.innerHTML=`<div class="gin">${body}</div>`;
 h.scrollTop=0;
 // Animation einhängen
 const fig=document.getElementById("gfig");
 if(fig){let n=null;if(st.k==="warm")n=st.n;else if(st.k==="set")n=CUR.ex[st.x].e;else if(st.k==="rest"){const nx=G2.steps.slice(G2.i+1).find(s=>s.k==="set");n=nx?CUR.ex[nx.x].e:null}
  if(n)mountEx(fig,n)}
 if(st.k==="warm"&&st.sec)startTimer(st.sec,next);
 if(st.k==="rest")startTimer(st.sec,next);
}
document.addEventListener("input",ev=>{const t=ev.target;if(!t.dataset||!t.dataset.gn||!G2||!CUR)return;const nx=G2.steps.slice(G2.i+1).find(s=>s.k==="set");if(!nx)return;CUR.ex[nx.x].sets[nx.s][t.dataset.gn]=t.value});
function readSet(){const st=G2.steps[G2.i],s=CUR.ex[st.x].sets[st.s];const kg=document.getElementById("gkg"),rp=document.getElementById("greps");
 if(kg)s.kg=kg.value.trim();if(rp)s.reps=rp.value.trim();return s}

function saveWorkout(){
 const sets=[];CUR.ex.forEach(x=>x.sets.forEach(s=>{if(s.done&&num(s.reps)>0)sets.push({e:x.e,kg:num(s.kg)||0,reps:num(s.reps)})}));
 if(!sets.length){toast("Hake mindestens einen Satz ab");return}
 const wd=CUR.date||TODAY(),wm=num(CUR.min)>0?Math.round(num(CUR.min)):wd!==TODAY()?60:Math.max(10,Math.round((Date.now()-CUR.start)/60000));
 S.workouts.push({id:uid(),date:wd,name:CUR.name,min:wm,int:CUR.int||"mittel",sets});
 CUR=null;save();close();toast("Training gespeichert");
}

document.addEventListener("click",ev=>{
 const b=ev.target.closest("[data-g]");
 if(b&&G2){const a=b.dataset.g;
  switch(a){
   case"close":close();break;
   case"list":close();break;
   case"prev":prev();break;
   case"next":next();break;
   case"skipwarm":{const i=G2.steps.findIndex(s=>s.k!=="warm");G2.i=i<0?G2.steps.length-1:i;stopTimer();show();break}
   case"pause":if(G2.run){G2.left=Math.max(0,(G2.tEnd-Date.now())/1000);G2.run=false;b.textContent="Weiter";}else{G2.tEnd=Date.now()+G2.left*1000;G2.run=true;b.textContent="Pause";if(!G2.iv)G2.iv=setInterval(tick,200)}break;
   case"plus":if(G2.run)G2.tEnd+=15000;else G2.left+=15;G2.total+=15;tick();break;
   case"done":{const s=readSet();if(!(num(s.reps)>0)){toast("Trag ein, wie viele Wiederholungen du geschafft hast");break}s.done=true;G2.firstSet=true;if(typeof save==="function")save();next();break}
   case"hold":{const s=readSet(),sec=num(s.reps)||holdSec(CUR.ex[G2.steps[G2.i].x].e);b.disabled=true;b.textContent="Halten …";
    const box=document.getElementById("ghold");if(box)box.innerHTML=ringTimer(sec);
    startTimer(sec,()=>{s.reps=String(sec);s.done=true;next()});break}
   case"save":saveWorkout();break;
   case"int":CUR.int=b.dataset.v;show();break;
   case"runstart":close();if(typeof go==="function")go("laufen");setTimeout(()=>{const s=document.querySelector('[data-a="wStart"]');if(s)s.click()},60);break;
  }
  return;
 }
 const c=ev.target.closest("[data-a]");if(!c)return;
 const a=c.dataset.a;
 if(a==="exSwap"){SW={kind:"cur",x:+c.dataset.x,remember:false};drawSwap();return}
 if(a==="exAdd"){SW={kind:"add",remember:false};drawSwap();return}
 if(a==="tplEdit"){SW={kind:"edit",name:c.dataset.n};drawSwap();return}
 if(a==="guideStart"||a==="guideResume")open("wk");
 else if(a==="gRunWarm")open("run");
 else if(a==="gInfo")showInfo(c.dataset.n);
 else if(a==="gInfoClose")closeInfo();
});
document.addEventListener("keydown",e=>{if(e.key==="Escape"){if(SW){SW=null;drawSwap()}else if(document.getElementById("ginfo"))closeInfo();else if(G2)close()}});
document.addEventListener("visibilitychange",()=>{if(!document.hidden&&G2&&typeof wakeOn==="function")wakeOn()});

// ================= Übungen tauschen & Vorlagen bearbeiten =================
const EQL={gym:"Studio",bb:"Langhantel",db:"Kurzhanteln",kb:"Kettlebell",bench:"Bank",bar:"Stange",band:"Band"};
const SLOTLBL={hpress:"Brust",vpress:"Schultern",dips:"Brust & Trizeps",tri:"Trizeps",vpull:"Rücken (ziehen von oben)",hpull:"Rücken (rudern)",curl:"Bizeps",rear:"Hintere Schulter",squat:"Beine (Kniebeugen)",hinge:"Hüfte & Beinrückseite",lunge:"Beine (einbeinig)",calf:"Waden",core:"Rumpf",glute:"Po"};
const REL={hpress:["dips"],dips:["hpress","tri"],tri:["dips"],vpull:["hpull"],hpull:["vpull","rear"],rear:["hpull"],squat:["lunge"],lunge:["squat"],hinge:["glute"],glute:["hinge"]};
const reqOf=(n,slot)=>{for(const k of slot?[slot,...Object.keys(SLOTS)]:Object.keys(SLOTS)){const c=SLOTS[k].find(x=>x[0]===n);if(c)return c[1]}return[]};
const slotOf=n=>{for(const k in SLOTS)if(SLOTS[k].some(c=>c[0]===n))return k;return null};
const eqText=req=>req&&req.length?req.map(r=>EQL[r]||r).join(" + "):"ohne Geräte";
function optionsFor(name,exclude){
 const eq=eqNow(),slot=name?slotOf(name):null,seen=new Set(exclude||[]),fit=[],other=[];
 if(name)seen.add(name);
 const add=n=>{if(seen.has(n))return;seen.add(n);const req=reqOf(n);(hasEq(req,eq)||(SLOTS&&Object.values(SLOTS).some(l=>l.some(c=>c[0]===n&&hasEq(c[1],eq))))?fit:other).push(n)};
 if(slot){SLOTS[slot].forEach(c=>add(c[0]));(REL[slot]||[]).forEach(s=>SLOTS[s].forEach(c=>add(c[0])))}
 else Object.keys(SLOTS).forEach(k=>SLOTS[k].forEach(c=>add(c[0])));
 return{fit,other,slot};
}
let SW=null; // {kind:"cur"|"add"|"edit"|"tswap"|"tadd", x, name, remember}
const swHost=()=>{let h=document.getElementById("gswap");if(!h){h=document.createElement("div");h.id="gswap";document.body.appendChild(h)}return h};
function swOpt(n,extra){const inf=info(n),req=reqOf(n);return`<button class="swopt" data-sw="pick" data-n="${esc2(n)}"><div class="gfig gmini" data-anim="${esc2(n)}"></div><div class="grow" style="text-align:left;min-width:0"><div style="font-weight:700">${esc2(n)}</div><div class="small muted">${esc2(inf[2]||"")}</div><div class="small" style="color:var(--c-lift);font-weight:600">${esc2(eqText(req))}</div></div>${extra||""}</button>`}
function swList(name,exclude,grouped){
 if(grouped){ // alle Übungen nach Muskelgruppe
  const eq=eqNow(),seen=new Set(exclude||[]);let h="";
  for(const k of Object.keys(SLOTS)){const fit=[...new Set(SLOTS[k].filter(c=>hasEq(c[1],eq)).map(c=>c[0]))].filter(n=>!seen.has(n));if(!fit.length)continue;fit.forEach(n=>seen.add(n));
   h+=`<details class="swgrp" ${k==="hpress"?"open":""}><summary>${SLOTLBL[k]} <span class="muted small">${fit.length}</span></summary><div class="stack" style="gap:8px;margin-top:8px">${fit.map(n=>swOpt(n)).join("")}</div></details>`}
  return h;
 }
 const o=optionsFor(name,exclude);
 return`<div class="eyebrow">Passend zu deinem Equipment</div><div class="stack" style="gap:8px">${o.fit.length?o.fit.map(n=>swOpt(n)).join(""):'<p class="small muted" style="margin:0">Keine weiteren Alternativen mit deinem Equipment.</p>'}</div>
 ${o.other.length?`<details class="swgrp"><summary>Mit anderem Equipment <span class="muted small">${o.other.length}</span></summary><div class="stack" style="gap:8px;margin-top:8px">${o.other.map(n=>swOpt(n)).join("")}</div></details>`:""}`;
}
function tplList(name){return(TEMPLATES[name]||[]).slice()}
function saveTpl(name,list){if(S.profile.myTpl&&S.profile.myTpl[name]){S.profile.myTpl[name]=list}else{S.profile.tpl=S.profile.tpl||{};S.profile.tpl[name]=list}save()}
function drawSwap(){
 stopMini();const h=swHost();if(!SW){h.innerHTML="";return}
 let title="",body="";
 const custom=`<div class="card" style="padding:12px;gap:8px;background:var(--surface2)"><div style="font-weight:700">Eigene Übung</div><div class="row"><input id="swcustom" placeholder="z. B. Brustpresse schräg" autocomplete="off"><button class="btn ghost" data-sw="custom">Übernehmen</button></div></div>`;
 if(SW.kind==="cur"||SW.kind==="tswap"){
  const cur=SW.kind==="cur"?CUR.ex[SW.x].e:tplList(SW.name)[SW.x],tname=SW.kind==="cur"?CUR.name:SW.name;
  title="Übung tauschen";
  body=`<div class="swcur"><div class="gfig gmini" data-anim="${esc2(cur)}"></div><div class="grow"><div class="eyebrow">Aktuell</div><div style="font-weight:700;font-size:17px">${esc2(cur)}</div></div></div>
  ${swList(cur,SW.kind==="cur"?CUR.ex.map(e=>e.e):tplList(SW.name))}${custom}
  ${SW.kind==="cur"?`<label class="swrem"><input type="checkbox" id="swremember" ${SW.remember?"checked":""}> Auch in der Vorlage „${esc2(tname)}“ dauerhaft ändern</label>
  <button class="glink" style="align-self:center;color:var(--bad)" data-sw="remove">Übung aus diesem Training entfernen</button>`:""}`;
 }else if(SW.kind==="add"||SW.kind==="tadd"){
  title="Übung hinzufügen";
  body=`${custom}${swList(null,SW.kind==="add"?CUR.ex.map(e=>e.e):tplList(SW.name),true)}
  ${SW.kind==="add"?`<label class="swrem"><input type="checkbox" id="swremember" ${SW.remember?"checked":""}> Auch zur Vorlage „${esc2(CUR.name)}“ hinzufügen</label>`:""}`;
 }else if(SW.kind==="edit"){
  const list=tplList(SW.name),changed=S.profile.tpl&&S.profile.tpl[SW.name];
  title="Vorlage „"+SW.name+"“";
  body=`<p class="small muted" style="margin:0">Tausche, entferne oder ergänze Übungen. Die Änderungen gelten für alle künftigen Trainings mit dieser Vorlage.</p>
  <div class="stack" style="gap:8px">${list.map((n,i)=>`<div class="swopt static"><div class="gfig gmini" data-anim="${esc2(n)}"></div><div class="grow" style="min-width:0"><div style="font-weight:700">${esc2(n)}</div><div class="small muted">${esc2(info(n)[2]||"")}</div></div>
   <div class="stack" style="gap:4px;flex:none;align-items:flex-end"><button class="link small" data-sw="tswap" data-x="${i}">Tauschen</button><button class="link small" style="color:var(--muted)" data-sw="tdel" data-x="${i}">Entfernen</button>
   <span class="row" style="gap:10px">${i?`<button class="link small" data-sw="tup" data-x="${i}" aria-label="Nach oben">▲</button>`:""}${i<list.length-1?`<button class="link small" data-sw="tdown" data-x="${i}" aria-label="Nach unten">▼</button>`:""}</span></div></div>`).join("")}</div>
  <button class="btn ghost block" data-sw="tadd">+ Übung hinzufügen</button>
  ${S.profile.myTpl&&S.profile.myTpl[SW.name]?`<button class="glink" style="align-self:center;color:var(--bad)" data-sw="tdelTpl">Eigene Vorlage löschen</button>`:changed?`<button class="glink" style="align-self:center;color:var(--muted)" data-sw="treset">Standard wiederherstellen</button>`:""}
  <button class="btn block" data-sw="close">Fertig</button>`;
 }
 h.innerHTML=`<div class="scrim gsw" data-sw="scrim"><div class="sheet" role="dialog" aria-modal="true" aria-label="${esc2(title)}"><div class="grab"></div>
  <div class="row between"><h2>${esc2(title)}</h2><button class="icon-btn" aria-label="Schließen" data-sw="close">${I.x}</button></div>${body}</div></div>`;
 mountMini(h);
}
// kleine Animationen nur für sichtbare Einträge starten
let MINIOBS=null;
function stopMini(){if(MINIOBS){MINIOBS.disconnect();MINIOBS=null}}
function mountMini(root){
 const go=el=>{if(el.dataset.on)return;el.dataset.on="1";mountEx(el,el.dataset.anim)};
 const els=root.querySelectorAll("[data-anim]");
 if("IntersectionObserver"in window){MINIOBS=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)go(e.target)}),{root:root.querySelector(".sheet")});els.forEach(e=>MINIOBS.observe(e))}
 else els.forEach(go);
 root.querySelectorAll("details").forEach(d=>d.addEventListener("toggle",()=>{if(d.open)d.querySelectorAll("[data-anim]").forEach(go)}));
}
function newSets(n,count){const l=typeof lastFor==="function"?lastFor(n):null,hold=holdSec(n);return Array.from({length:count||3},(_,i)=>({kg:l?(l[i]||l[0]).kg:"",reps:l?(l[i]||l[0]).reps:(hold?String(hold):""),done:false}))}
function afterCurChange(){if(typeof save==="function")save();if(G2&&G2.mode==="wk")rebuild();else if(typeof render==="function")render(true)}
function rebuild(){const st=G2.steps[G2.i],pastWarm=st&&st.k!=="warm";G2.steps=buildSteps();
 if(pastWarm){const i=G2.steps.findIndex(s=>s.k==="set");G2.i=i<0?G2.steps.length-1:i}else G2.i=Math.min(G2.i,G2.steps.length-1);show()}
function applyPick(n){
 n=String(n||"").trim();if(!n)return;
 const rem=!!(document.getElementById("swremember")||{}).checked;
 if(SW.kind==="cur"){const ex=CUR.ex[SW.x],old=ex.e,done=ex.sets.filter(s=>s.done),open=ex.sets.filter(s=>!s.done),nx={e:n,sets:newSets(n,open.length||3)};
  if(done.length){ex.sets=done;CUR.ex.splice(SW.x+1,0,nx)}else CUR.ex[SW.x]=nx;
  if(rem){const l=tplList(CUR.name).map(e=>e===old?n:e);saveTpl(CUR.name,l)}
  SW=null;drawSwap();afterCurChange();toast("Getauscht: "+n);return}
 if(SW.kind==="add"){CUR.ex.push({e:n,sets:newSets(n,3)});if(rem){const l=tplList(CUR.name);if(!l.includes(n))l.push(n);saveTpl(CUR.name,l)}
  SW=null;drawSwap();afterCurChange();toast(n+" hinzugefügt");return}
 if(SW.kind==="tswap"){const l=tplList(SW.name);l[SW.x]=n;saveTpl(SW.name,l);SW={kind:"edit",name:SW.name};drawSwap();if(typeof render==="function")render(true);return}
 if(SW.kind==="tadd"){const l=tplList(SW.name);if(!l.includes(n))l.push(n);saveTpl(SW.name,l);SW={kind:"edit",name:SW.name};drawSwap();if(typeof render==="function")render(true);return}
}
document.addEventListener("click",ev=>{
 const b=ev.target.closest("[data-sw]");if(!b||!SW)return;const k=b.dataset.sw;
 if(k==="scrim"&&ev.target!==b)return;
 const back=()=>{if(SW.kind==="tswap"||SW.kind==="tadd")SW={kind:"edit",name:SW.name};else SW=null;drawSwap()};
 switch(k){
  case"close":case"scrim":back();break;
  case"pick":applyPick(b.dataset.n);break;
  case"custom":{const v=(document.getElementById("swcustom")||{}).value;if(!v||!v.trim()){toast("Gib einen Namen für die Übung ein");break}applyPick(v);break}
  case"remove":{if(CUR.ex.length<=1){toast("Ein Training braucht mindestens eine Übung");break}const n=CUR.ex[SW.x].e;CUR.ex.splice(SW.x,1);
   if((document.getElementById("swremember")||{}).checked){saveTpl(CUR.name,tplList(CUR.name).filter(e=>e!==n))}SW=null;drawSwap();afterCurChange();toast(n+" entfernt");break}
  case"tswap":SW={kind:"tswap",name:SW.name,x:+b.dataset.x};drawSwap();break;
  case"tadd":SW={kind:"tadd",name:SW.name};drawSwap();break;
  case"tdel":{const l=tplList(SW.name);if(l.length<=1){toast("Eine Vorlage braucht mindestens eine Übung");break}l.splice(+b.dataset.x,1);saveTpl(SW.name,l);drawSwap();if(typeof render==="function")render(true);break}
  case"tup":case"tdown":{const l=tplList(SW.name),i=+b.dataset.x,j=k==="tup"?i-1:i+1;[l[i],l[j]]=[l[j],l[i]];saveTpl(SW.name,l);drawSwap();if(typeof render==="function")render(true);break}
  case"tdelTpl":{if(S.profile.myTpl){delete S.profile.myTpl[SW.name]}if(S.profile.tpl)delete S.profile.tpl[SW.name];save();SW=null;drawSwap();if(typeof render==="function")render(true);toast("Vorlage gelöscht");break}
  case"treset":{if(S.profile.tpl){delete S.profile.tpl[SW.name];save()}if(typeof render==="function")render(true);drawSwap();toast("Standard wiederhergestellt");break}
 }
});
document.addEventListener("keydown",e=>{if(e.key==="Enter"&&e.target.id==="swcustom"){e.preventDefault();const b=document.querySelector('[data-sw="custom"]');if(b)b.click()}});

// ================= Übungs-Info =================
function showInfo(n){
 closeInfo();const inf=info(n);
 const d=document.createElement("div");d.id="ginfo";d.className="scrim";d.innerHTML=`<div class="sheet" role="dialog" aria-modal="true" aria-label="${esc2(n)}"><div class="grab"></div>
 <div class="row between"><h2>${esc2(n)}</h2><button class="icon-btn" data-a="gInfoClose" aria-label="Schließen">${I.x}</button></div>
 <div class="gfig" id="gifig"></div>${inf[2]?`<div class="gleg"><i></i>Trainiert: ${esc2(inf[2])}</div>`:""}
 <ul class="gcues">${inf[3].map(c=>`<li>${esc2(c)}</li>`).join("")}</ul>${PHOTO[n]?'<div class="small muted">Fotos: free-exercise-db (gemeinfrei)</div>':""}</div>`;
 d.addEventListener("click",e=>{if(e.target===d)closeInfo()});
 document.body.appendChild(d);mountEx(document.getElementById("gifig"),n);
}
function closeInfo(){const d=document.getElementById("ginfo");if(d)d.remove()}

// ================= Stil =================
const css=document.createElement("style");
css.textContent=`
.gp{position:fixed;inset:0;z-index:40;background:var(--bg);overflow:auto;-webkit-overflow-scrolling:touch;padding:env(safe-area-inset-top,0px) 0 env(safe-area-inset-bottom,0px)}
.gp::before{content:"";position:fixed;inset:0 0 auto 0;height:300px;pointer-events:none;background:radial-gradient(380px 240px at 0% 0%,color-mix(in srgb,var(--c-lift) 20%,transparent),transparent 70%),radial-gradient(320px 220px at 100% 0%,color-mix(in srgb,var(--hero1) 16%,transparent),transparent 70%)}
.gin{position:relative;max-width:440px;margin:0 auto;padding:10px 16px 28px;display:flex;flex-direction:column;gap:14px;min-height:100%}
.gtop{display:grid;grid-template-columns:36px 1fr auto;align-items:center;gap:8px}
.gphase{text-align:center;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--c-lift)}
.glink{color:var(--c-lift);font-weight:600;font-size:14px}.glink:disabled{opacity:.3}
.gskip{align-self:center;color:var(--muted);font-size:13px}
.gprog{height:6px;border-radius:9px;background:var(--surface2);overflow:hidden}.gprog i{display:block;height:100%;background:linear-gradient(90deg,var(--c-lift),var(--hero3));border-radius:9px;transition:width .4s}
.gfig{background:var(--surface);border-radius:20px;aspect-ratio:5/4;max-width:100%;color:var(--fg);box-shadow:0 14px 34px -24px var(--c-lift);overflow:hidden}
.gfig.gsmall{width:84px;flex:none;border-radius:14px;box-shadow:none;background:var(--surface2)}
.gfigsvg{width:100%;height:100%;display:block}
.gfig.gphoto{position:relative;aspect-ratio:3/2;background:#1a1a1a}
.gphoto img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
.gphoto img.b{opacity:0}
.gph-tag{position:absolute;left:10px;bottom:10px;display:flex;gap:4px;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase}
.gph-tag span{padding:3px 8px;border-radius:999px;background:rgba(0,0,0,.45);color:rgba(255,255,255,.7)}
.gph-tag .s0{background:var(--c-lift);color:#fff}
.gfig.gmini .gph-tag,.gfig.gsmall .gph-tag{display:none}
@media (prefers-reduced-motion:no-preference){
 .gphoto img.b{animation:phb 3.2s ease-in-out infinite}
 .gph-tag .s0{animation:pht0 3.2s ease-in-out infinite}.gph-tag .s1{animation:pht1 3.2s ease-in-out infinite}
 @keyframes phb{0%,38%{opacity:0}50%,88%{opacity:1}100%{opacity:0}}
 @keyframes pht0{0%,38%{background:var(--c-lift);color:#fff}50%,88%{background:rgba(0,0,0,.45);color:rgba(255,255,255,.7)}100%{background:var(--c-lift);color:#fff}}
 @keyframes pht1{0%,38%{background:rgba(0,0,0,.45);color:rgba(255,255,255,.7)}50%,88%{background:var(--c-lift);color:#fff}100%{background:rgba(0,0,0,.45);color:rgba(255,255,255,.7)}}
}
@media (prefers-reduced-motion:reduce){.gphoto img{width:50%}.gphoto img.b{left:50%;opacity:1}}
.gfigsvg{--skin:#E9B48F;--skin2:#C98F6B;--shirt:var(--c-lift);--shirt2:color-mix(in srgb,var(--c-lift) 62%,#000);--shorts:#262B40;--shorts2:#1A1E2E;--hair:#3B2A1E;--shoe:#F25C3B}
.gfigsvg .bs{fill:var(--skin)}.gfigsvg .bs2{fill:var(--skin2)}
.gfigsvg .bt{fill:var(--shirt);stroke:var(--shirt);stroke-width:1.2;stroke-linejoin:round}.gfigsvg .bt2{fill:var(--shirt2)}
.gfigsvg .bp{fill:var(--shorts);stroke:var(--shorts);stroke-width:1;stroke-linejoin:round}.gfigsvg .bp2{fill:var(--shorts2)}
.gfigsvg .bh{fill:var(--hair)}.gfigsvg .be{fill:#2A1E16}
.gfigsvg .bo{fill:var(--shoe)}
.gfigsvg .bshadow{fill:#000}
.gfigsvg .bm{fill:#FF4D2E;opacity:.7}
@media (prefers-reduced-motion:no-preference){.gfigsvg .bmg{animation:mpulse 1.6s ease-in-out infinite alternate}@keyframes mpulse{from{opacity:.55}to{opacity:1}}}
.gleg{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--muted)}.gleg i{width:10px;height:10px;border-radius:50%;background:#FF5A3C;opacity:.8}
.gfigsvg .gfloor{stroke:var(--line);stroke-width:3;stroke-linecap:round}
.gfigsvg .gfix{fill:var(--muted);opacity:.45}
.gfigsvg .gi{fill:var(--c-lift)}.gfigsvg .gh{fill:var(--surface)}.gfigsvg .gs{fill:none;stroke:var(--c-lift);stroke-width:3;stroke-linecap:round}
.gfigsvg .gb{stroke:var(--c-food);stroke-width:2.5;stroke-linecap:round}
.gname{display:flex;flex-direction:column;gap:4px;align-items:flex-start}
.gname h1{font-size:32px;margin:0}
.gcues{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:7px;counter-reset:c}
.gcues li{display:grid;grid-template-columns:22px 1fr;gap:8px;font-size:14px;line-height:1.4;counter-increment:c}
.gcues li::before{content:counter(c);width:22px;height:22px;border-radius:50%;display:grid;place-items:center;font-size:12px;font-weight:700;background:color-mix(in srgb,var(--c-lift) 16%,transparent);color:var(--c-lift)}
.gtimer{position:relative;width:180px;height:180px;align-self:center}
.gtimer svg{width:100%;height:100%;transform:rotate(-90deg)}
.gtr{fill:none;stroke:var(--surface2);stroke-width:9}.gtf{fill:none;stroke:var(--c-lift);stroke-width:9;stroke-linecap:round;transition:stroke-dashoffset .2s linear}
.gtimer #gtime{position:absolute;inset:0;display:grid;place-items:center;font-size:52px;font-weight:700}
.grest{display:flex;flex-direction:column;gap:16px;padding-top:12px}
.gbig{padding:15px 18px;font-size:17px}
.gp .btn:not(.ghost){background:linear-gradient(135deg,var(--c-lift),var(--hero3))}
.gnext{gap:10px}
.gnext.gnew{box-shadow:inset 0 0 0 2px color-mix(in srgb,var(--c-lift) 55%,transparent)}
.gfig.gmed{max-height:190px;aspect-ratio:auto;height:190px}
.grestc{flex-direction:row;align-items:center;gap:14px;padding-top:4px}
.grestc .gtimer{width:130px;height:130px}.grestc .gtimer #gtime{font-size:36px}
.gcol{display:flex;flex-direction:column;gap:8px;flex:1}
.gdone{display:flex;flex-direction:column;align-items:center;text-align:center;gap:8px;padding-top:24px}
.gbadge{width:84px;height:84px;border-radius:50%;display:grid;place-items:center;color:#fff;background:linear-gradient(135deg,var(--c-lift),var(--hero3));box-shadow:0 14px 30px -14px var(--c-lift)}
.gbadge svg{width:42px;height:42px}
.gstats{text-align:center}.gstats .num{font-size:26px;font-weight:700}
#gswap .scrim{z-index:50}
.swopt{display:flex;align-items:center;gap:12px;padding:8px;border-radius:14px;background:var(--surface);border:1.5px solid transparent;width:100%;text-align:left}
.swopt:not(.static):active{transform:scale(.98)}.swopt:not(.static):hover{border-color:color-mix(in srgb,var(--c-lift) 40%,transparent)}
.gfig.gmini{width:78px;flex:none;border-radius:12px;box-shadow:none;background:var(--surface2)}
.swcur{display:flex;align-items:center;gap:12px;padding:10px;border-radius:14px;background:color-mix(in srgb,var(--c-lift) 10%,var(--surface))}
.swgrp summary{cursor:pointer;font-weight:700;padding:6px 0}
.swrem{display:flex;gap:10px;align-items:center;font-size:14px}.swrem input{width:20px;height:20px;accent-color:var(--c-lift)}
.exname{font-weight:700;text-align:left;display:inline-flex;align-items:center;gap:6px}
.exname .q{width:18px;height:18px;border-radius:50%;display:grid;place-items:center;font-size:11px;font-weight:700;background:color-mix(in srgb,var(--c-lift) 16%,transparent);color:var(--c-lift)}
@media (prefers-reduced-motion:no-preference){.gin>*{animation:rise .35s cubic-bezier(.2,.8,.2,1) both}.gbadge{animation:pop .5s cubic-bezier(.3,1.6,.5,1) both}@keyframes pop{from{transform:scale(.3);opacity:0}}}
`;
document.head.appendChild(css);

window.guideStart=()=>open("wk");
window.guideOpen=open;
window.guideInfo=showInfo;
window.guideAnim=mountAnim;
window.guideEx2=mountEx;
window.guideEx=EX;
})();
