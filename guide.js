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
pat("pushup",{anchor:"hand",at:[160,FLOOR],poses:[{t:114,a:[-25,-25],l:[-66,-66],f:10},{t:102,a:[-90,0],l:[-78,-78]}],dur:1});
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
pat("plank",{anchor:"hand",at:[150,FLOOR],poses:[{t:103,a:[0,90],l:[-77,-77],f:10},{t:101,l:[-79,-79]}],dur:1.8});
// Aufwärmen
pat("jacks",{anchor:"root",front:true,poses:[{r:[100,90],t:180,a1:[20,20],a2:[-20,-20],l1:[8,8],l2:[-8,-8],f1:90,f2:-90},{r:[100,85],a1:[155,165],a2:[-155,-165],l1:[22,22],l2:[-22,-22]}],dur:.45});
pat("armcircles",{anchor:"root",front:true,poses:[{r:[100,90],t:180,a1:[90,90],a2:[-90,-90],l1:[4,4],l2:[-4,-4],f1:90,f2:-90},{a1:[112,112],a2:[-112,-112]},{a1:[90,90],a2:[-90,-90]},{a1:[68,68],a2:[-68,-68]}],dur:.32});
pat("catcow",{anchor:"hand",at:[118,FLOOR],poses:[{t:113,hd:150,a:[0,0],l:[0,-90],f:-90},{t:108,hd:40}],dur:1.4});
pat("climbers",{anchor:"hand",at:[168,FLOOR],poses:[{t:114,a:[-25,-25],l1:[-66,-66],l2:[40,-60],f:10},{l1:[40,-60],l2:[-66,-66]}],dur:.33});
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
function mountAnim(el,patName,item){
 const p=P[patName]||P.stand;
 const reduce=matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
 el.innerHTML=`<svg viewBox="0 0 200 160" class="gfigsvg" role="img" aria-label="Animation der Übung">
  <line x1="8" y1="${FLOOR+1.5}" x2="192" y2="${FLOOR+1.5}" class="gfloor"/>
  <g class="gfix">${(p.fix||[]).map(f=>FIX[f]).join("")}</g>
  <g class="gfar" opacity="${p.front?1:.35}"><polyline data-k="arm2"/><polyline data-k="leg2"/></g>
  <line data-k="torso" class="gtorso"/><circle data-k="head" r="9.5" class="ghead"/>
  <g><polyline data-k="leg1"/><polyline data-k="arm1"/></g>
  <g data-k="items"></g></svg>`;
 const q=k=>el.querySelector(`[data-k="${k}"]`),E={arm1:q("arm1"),arm2:q("arm2"),leg1:q("leg1"),leg2:q("leg2"),torso:q("torso"),head:q("head"),items:q("items")};
 const pts=a=>a.map(v=>v[0].toFixed(1)+","+v[1].toFixed(1)).join(" ");
 const draw=pose=>{
  let j=fk(pose);
  let sh=[0,0];
  if(p.anchor==="foot")sh=[p.at[0]-j.f1[0],p.at[1]-j.f1[1]];
  else if(p.anchor==="hand")sh=[p.at[0]-j.h1[0],p.at[1]-j.h1[1]];
  if(sh[0]||sh[1]){for(const k in j)j[k]=add(j[k],sh)}
  E.arm1.setAttribute("points",pts([j.neck,j.e1,j.h1]));E.arm2.setAttribute("points",pts([j.neck,j.e2,j.h2]));
  E.leg1.setAttribute("points",pts([j.hip,j.k1,j.f1,j.t1]));E.leg2.setAttribute("points",pts([j.hip,j.k2,j.f2,j.t2]));
  E.torso.setAttribute("x1",j.hip[0]);E.torso.setAttribute("y1",j.hip[1]);E.torso.setAttribute("x2",j.neck[0]);E.torso.setAttribute("y2",j.neck[1]);
  E.head.setAttribute("cx",j.head[0]);E.head.setAttribute("cy",j.head[1]);
  E.items.innerHTML=item?itemSVG(item,j,p.band):"";
 };
 const n=p.poses.length,seq=n===2?[0,1]:[...Array(n).keys()],durMs=(p.dur||1)*1000;
 const st={on:true};
 if(reduce){draw(mix(p.poses[0],p.poses[1%n],.6));return st}
 const t0=performance.now();
 const frame=now=>{
  if(!st.on)return;
  if(!el.isConnected){st.on=false;RUNNING.delete(st);return}
  const tt=Math.max(0,(now-t0)/durMs),i=Math.floor(tt)%seq.length,frac=tt%1;
  // bei 2 Posen: hin und zurück, kurze Pause an den Umkehrpunkten
  const e=Math.min(1,Math.max(0,(frac-.08)/.84)),ease=.5-.5*Math.cos(Math.PI*e);
  const a=p.poses[seq[i]],b=p.poses[seq[(i+1)%seq.length]];
  draw(mix(a,b,ease));
  requestAnimationFrame(frame);
 };
 RUNNING.add(st);requestAnimationFrame(frame);
 return st;
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
 sets.forEach((st,i)=>{steps.push(st);if(i<sets.length-1){const bw=isBW(CUR.ex[st.x].e);steps.push({k:"rest",sec:bw?60:90})}});
 steps.push({k:"done"});
 return steps;
}
function open(mode){
 if(mode==="wk"&&!CUR)return;
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
  <div class="gname"><h1>${esc2(x.e)}</h1><span class="small muted">${esc2(inf[2])}</span></div>
  <ul class="gcues">${inf[3].map(c=>`<li>${esc2(c)}</li>`).join("")}</ul>
  ${G2.firstSet!==true&&exI===1&&st.s===0&&!bw?`<div class="tip"><i></i><div class="small">Tipp: Mach vorher einen leichten Aufwärmsatz mit etwa der Hälfte des Gewichts.</div></div>`:""}
  <div class="${bw?"":"grid2"}">${bw?"":`<label class="f">Gewicht (kg)<input id="gkg" inputmode="decimal" value="${s.kg===""?"":esc2(s.kg)}" placeholder="0"></label>`}
  <label class="f">${hold?"Sekunden":"Wiederholungen"}<input id="greps" inputmode="numeric" value="${s.reps===""?(hold||""):esc2(s.reps)}" placeholder="${hold?hold:"10"}"></label></div>
  ${ls?`<div class="small muted">Letztes Mal: ${ls.kg?String(ls.kg).replace(".",",")+" kg × ":""}${ls.reps}${hold?" Sek.":""}</div>`:""}
  ${hold?`<div id="ghold"></div><button class="btn block gbig" data-g="hold">Halten starten</button>`:`<button class="btn block gbig" data-g="done">Satz erledigt</button>`}
  <button class="glink gskip" data-g="list">Zur Übersicht</button>`;
 }else if(st.k==="rest"){
  const nx=G2.steps.slice(G2.i+1).find(s=>s.k==="set"),nxe=nx?CUR.ex[nx.x]:null;
  body=top("Pause")+`<div class="grest">${ringTimer(st.sec)}
  <div class="grid2"><button class="btn ghost" data-g="plus">+15 Sek.</button><button class="btn" data-g="next">Weiter</button></div></div>
  ${nxe?`<div class="card gnext"><div class="eyebrow">Als Nächstes</div><div class="row" style="gap:12px;align-items:center"><div class="gfig gsmall" id="gfig"></div><div class="grow"><div style="font-weight:700">${esc2(nxe.e)}</div><div class="small muted">Satz ${nx.s+1} von ${nxe.sets.length}${nxe.sets[nx.s].kg!==""&&!isBW(nxe.e)?" · "+String(nxe.sets[nx.s].kg).replace(".",",")+" kg":""}</div></div></div></div>`:""}`;
 }else if(st.k==="done"){
  const sets=CUR.ex.reduce((a,x)=>a+x.sets.filter(s=>s.done).length,0),vol=CUR.ex.reduce((a,x)=>a+x.sets.filter(s=>s.done).reduce((b,s)=>b+(num(s.kg)||0)*(num(s.reps)||0),0),0);
  const min=Math.max(1,Math.round((Date.now()-CUR.start)/60000));
  body=top("Geschafft")+`<div class="gdone"><div class="gbadge">${I.ok}</div><h1>Starkes Training!</h1><p class="muted" style="margin:0">${esc2(CUR.name)} abgeschlossen.</p></div>
  <div class="grid3 gstats"><div><div class="eyebrow">Sätze</div><div class="num">${sets}</div></div><div><div class="eyebrow">Volumen</div><div class="num">${Math.round(vol).toLocaleString("de-DE")} kg</div></div><div><div class="eyebrow">Dauer</div><div class="num">${min} Min.</div></div></div>
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
  if(n){const inf=info(n);mountAnim(fig,inf[0],itemFor(inf))}}
 if(st.k==="warm"&&st.sec)startTimer(st.sec,next);
 if(st.k==="rest")startTimer(st.sec,next);
}
function readSet(){const st=G2.steps[G2.i],s=CUR.ex[st.x].sets[st.s];const kg=document.getElementById("gkg"),rp=document.getElementById("greps");
 if(kg)s.kg=kg.value.trim();if(rp)s.reps=rp.value.trim();return s}

function saveWorkout(){
 const sets=[];CUR.ex.forEach(x=>x.sets.forEach(s=>{if(s.done&&num(s.reps)>0)sets.push({e:x.e,kg:num(s.kg)||0,reps:num(s.reps)})}));
 if(!sets.length){toast("Hake mindestens einen Satz ab");return}
 S.workouts.push({id:uid(),date:TODAY(),name:CUR.name,min:Math.max(10,Math.round((Date.now()-CUR.start)/60000)),sets});
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
   case"runstart":close();if(typeof go==="function")go("laufen");setTimeout(()=>{const s=document.querySelector('[data-a="wStart"]');if(s)s.click()},60);break;
  }
  return;
 }
 const c=ev.target.closest("[data-a]");if(!c)return;
 const a=c.dataset.a;
 if(a==="guideStart"||a==="guideResume")open("wk");
 else if(a==="gRunWarm")open("run");
 else if(a==="gInfo")showInfo(c.dataset.n);
 else if(a==="gInfoClose")closeInfo();
});
document.addEventListener("keydown",e=>{if(e.key==="Escape"){if(document.getElementById("ginfo"))closeInfo();else if(G2)close()}});
document.addEventListener("visibilitychange",()=>{if(!document.hidden&&G2&&typeof wakeOn==="function")wakeOn()});

// ================= Übungs-Info =================
function showInfo(n){
 closeInfo();const inf=info(n);
 const d=document.createElement("div");d.id="ginfo";d.className="scrim";d.innerHTML=`<div class="sheet" role="dialog" aria-modal="true" aria-label="${esc2(n)}"><div class="grab"></div>
 <div class="row between"><h2>${esc2(n)}</h2><button class="icon-btn" data-a="gInfoClose" aria-label="Schließen">${I.x}</button></div>
 <div class="gfig" id="gifig"></div>${inf[2]?`<div class="small muted">Trainiert: ${esc2(inf[2])}</div>`:""}
 <ul class="gcues">${inf[3].map(c=>`<li>${esc2(c)}</li>`).join("")}</ul></div>`;
 d.addEventListener("click",e=>{if(e.target===d)closeInfo()});
 document.body.appendChild(d);mountAnim(document.getElementById("gifig"),inf[0],itemFor(inf));
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
.gfigsvg polyline,.gfigsvg .gtorso{fill:none;stroke:currentColor;stroke-linecap:round;stroke-linejoin:round;stroke-width:6.5}
.gfigsvg .gtorso{stroke-width:8.5}.gfigsvg .ghead{fill:currentColor}
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
.gnext{gap:8px}
.gdone{display:flex;flex-direction:column;align-items:center;text-align:center;gap:8px;padding-top:24px}
.gbadge{width:84px;height:84px;border-radius:50%;display:grid;place-items:center;color:#fff;background:linear-gradient(135deg,var(--c-lift),var(--hero3));box-shadow:0 14px 30px -14px var(--c-lift)}
.gbadge svg{width:42px;height:42px}
.gstats{text-align:center}.gstats .num{font-size:26px;font-weight:700}
.exname{font-weight:700;text-align:left;display:inline-flex;align-items:center;gap:6px}
.exname .q{width:18px;height:18px;border-radius:50%;display:grid;place-items:center;font-size:11px;font-weight:700;background:color-mix(in srgb,var(--c-lift) 16%,transparent);color:var(--c-lift)}
@media (prefers-reduced-motion:no-preference){.gin>*{animation:rise .35s cubic-bezier(.2,.8,.2,1) both}.gbadge{animation:pop .5s cubic-bezier(.3,1.6,.5,1) both}@keyframes pop{from{transform:scale(.3);opacity:0}}}
`;
document.head.appendChild(css);

window.guideStart=()=>open("wk");
window.guideOpen=open;
window.guideInfo=showInfo;
window.guideAnim=mountAnim;
window.guideEx=EX;
})();
