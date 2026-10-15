// Formwerk: Tagesbericht (beim ersten Öffnen am Tag)
(function(){
"use strict";
const E=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const D=(off)=>{const d=new Date();d.setDate(d.getDate()+off);return iso(d)};
const WD=["Mo","Di","Mi","Do","Fr","Sa","So"];
const wdIdx=d=>(new Date(d+"T12:00").getDay()+6)%7;

// ---------- Auswertung ----------
function weekStatus(){
 const t=targets(),pd=planDays(),today=TODAY(),ti=wdIdx(today);
 const ws=weekStart(),days=Array.from({length:7},(_,i)=>{const d=new Date(ws+"T12:00");d.setDate(d.getDate()+i);return iso(d)});
 const runsW=S.runs.filter(r=>inWeek(r.date)),km=runsW.reduce((a,r)=>a+r.km,0);
 const wkW=S.workouts.filter(w=>inWeek(w.date)).length;
 const runToday=S.runs.some(r=>r.date===today),wkToday=S.workouts.some(w=>w.date===today);
 const runPlanned=pd.filter(p=>p.t==="Lauf").length,wkPlanned=pd.filter(p=>p.t==="Kraft").length;
 const restRunDays=pd.map((p,i)=>({p,i})).filter(x=>x.p.t==="Lauf"&&(x.i>ti||(x.i===ti&&!runToday))).length;
 const restWkDays=pd.map((p,i)=>({p,i})).filter(x=>x.p.t==="Kraft"&&(x.i>ti||(x.i===ti&&!wkToday))).length;
 const kmLeft=Math.max(0,t.km-km),wkLeft=Math.max(0,wkPlanned-wkW);
 // typische Laufdistanz aus den letzten 4 Wochen
 const recent=S.runs.filter(r=>r.date>=D(-28)),avgRun=recent.length?recent.reduce((a,r)=>a+r.km,0)/recent.length:Math.max(4,t.km/Math.max(1,runPlanned));
 const perRun=restRunDays?kmLeft/restRunDays:kmLeft;
 const runState=!trains("run")?null:kmLeft<=0?"done":restRunDays===0?"miss":perRun<=avgRun*1.35+1?"ok":"tight";
 const wkState=!trains("strength")?null:wkLeft<=0?"done":restWkDays>=wkLeft?"ok":restWkDays+1>=wkLeft?"tight":"miss";
 const trainDays=days.filter(d=>S.runs.some(r=>r.date===d)||S.workouts.some(w=>w.date===d)||(S.acts||[]).some(x=>x.date===d)).length;
 return{t,km,kmLeft,restRunDays,perRun,avgRun,runState,wkW,wkPlanned,wkLeft,restWkDays,wkState,trainDays,days,runPlanned};
}
function nutrition(){
 const days=Array.from({length:7},(_,i)=>D(-7+i)); // letzte 7 Tage ohne heute
 const rows=days.map(d=>{const s=sum(foodsOn(d)),t=dayTargets(d);return{d,s,t,logged:s.kcal>300}});
 const L=rows.filter(r=>r.logged),n=L.length;
 if(!n)return{n,rows};
 const avg=k=>L.reduce((a,r)=>a+r.s[k],0)/n,avgT=k=>L.reduce((a,r)=>a+r.t[k],0)/n;
 const inRange=L.filter(r=>Math.abs(r.s.kcal-r.t.kcal)<=r.t.kcal*.1).length;
 return{n,rows,kcal:avg("kcal"),kcalT:avgT("kcal"),p:avg("p"),pT:avgT("prot"),c:avg("c"),cT:avgT("carb"),f:avg("f"),fT:avgT("fat"),sug:avg("sug"),fib:avg("fib"),inRange};
}
function weightTrend(){
 const w=[...(S.weights||[])].sort((a,b)=>a.date.localeCompare(b.date));if(w.length<2)return null;
 const last=w[w.length-1],ref=w.filter(x=>x.date<=D(-7)).pop()||w[0];
 const days=Math.max(1,(new Date(last.date)-new Date(ref.date))/864e5);if(days<4)return null;
 return{now:last.kg,perWeek:(last.kg-ref.kg)/days*7,days};
}
function todayPlan(){
 const pd=planDays()[wdIdx(TODAY())];
 const done={run:S.runs.some(r=>r.date===TODAY()),wk:S.workouts.some(w=>w.date===TODAY())};
 let tpl=null;
 if(pd.t==="Kraft"){const keys=Object.keys(TEMPLATES);tpl=keys.find(k=>pd.d.includes(k));
  if(!tpl){const last=[...S.workouts].sort((a,b)=>b.date.localeCompare(a.date))[0],i=last?keys.indexOf(last.name):-1;tpl=keys[(i+1)%keys.length]||keys[0]}}
 return{pd,done,tpl};
}
const PROT_IDEAS=[["Skyr (200 g) mit Beeren und Haferflocken",24],["2 Eier + Vollkornbrot mit Hüttenkäse",28],["Magerquark (250 g) mit Banane",30],["Proteinshake mit Milch",32],["Thunfisch-Sandwich mit Vollkornbrot",30],["Poulet-Salat mit Kichererbsen",38]];
function tips(ws,nu,wt){
 const out=[],t=targets(),g=S.profile.goal;
 if(nu.n>=3){
  if(nu.p<nu.pT*.85)out.push([1,"warn","Mehr Protein",`Im Schnitt ${r0(nu.p)} g statt ${r0(nu.pT)} g pro Tag. Idee: ${PROT_IDEAS[new Date().getDate()%PROT_IDEAS.length][0]} (ca. ${PROT_IDEAS[new Date().getDate()%PROT_IDEAS.length][1]} g Protein).`]);
  const diff=nu.kcal-nu.kcalT;
  if(g==="lose"&&diff>150)out.push([1,"warn","Etwas weniger Kalorien",`Du lagst im Schnitt ${de(r0(diff))} kcal über deinem Ziel. Spar zuerst bei Getränken, Snacks und Saucen.`]);
  else if(g==="gain"&&diff<-200)out.push([1,"warn","Mehr essen für Muskelaufbau",`Im Schnitt ${de(r0(-diff))} kcal unter Ziel. Ein zusätzlicher Snack mit Nüssen, Milch oder Brot hilft.`]);
  else if(diff<-nu.kcalT*.25)out.push([1,"warn","Zu wenig gegessen",`Im Schnitt ${de(r0(-diff))} kcal unter Ziel. Das bremst Leistung und Regeneration. Iss vor allem an Trainingstagen genug.`]);
  else if(g!=="gain"&&diff>nu.kcalT*.15)out.push([2,"warn","Kalorien im Blick behalten",`Im Schnitt ${de(r0(diff))} kcal über deinem Ziel.`]);
  if(nu.fib<20)out.push([3,"","Mehr Ballaststoffe",`Nur ${r0(nu.fib)} g pro Tag (Ziel 30 g). Gemüse, Linsen, Vollkornbrot oder Haferflocken einbauen.`]);
  if(nu.sug>t.sug*1.2)out.push([2,"","Weniger Zucker",`Im Schnitt ${r0(nu.sug)} g Zucker pro Tag. Süssgetränke und Süssigkeiten sind die schnellsten Hebel.`]);
 }
 if(nu.n<4)out.push([2,"","Essen regelmässiger eintragen",`Nur an ${nu.n} der letzten 7 Tage eingetragen. Je vollständiger, desto genauer werden Ziele und Tipps. Tipp: Foto oder Barcode geht am schnellsten.`]);
 if(ws.runState==="tight"||ws.runState==="miss")out.push([1,"warn","Laufziel wird knapp",ws.restRunDays?`Noch ${de(r1(ws.kmLeft))} km in ${ws.restRunDays} geplanten Läufen, also ca. ${de(r1(ws.perRun))} km pro Lauf. Ein zusätzlicher lockerer Lauf macht es entspannter.`:`Noch ${de(r1(ws.kmLeft))} km offen und kein Lauftag mehr im Plan. Ein kurzer Lauf am Wochenende reicht vielleicht schon.`]);
 if(ws.wkState==="tight"||ws.wkState==="miss")out.push([1,"warn","Krafttraining nachholen",`${ws.wkW} von ${ws.wkPlanned} Einheiten diese Woche. Plane die nächste Einheit fest ein, auch 30 Minuten zählen.`]);
 const lastWk=[...S.workouts].sort((a,b)=>b.date.localeCompare(a.date))[0];
 if(trains("strength")&&lastWk&&(new Date(TODAY())-new Date(lastWk.date))/864e5>=5)out.push([2,"","Lange kein Krafttraining",`Letzte Einheit vor ${r0((new Date(TODAY())-new Date(lastWk.date))/864e5)} Tagen. Muskeln brauchen regelmässige Reize, ideal 2–3 × pro Woche.`]);
 if(wt){if(g==="lose"&&wt.perWeek>0.1)out.push([1,"warn","Gewicht steigt",`Plus ${de(r1(wt.perWeek))} kg pro Woche. Prüfe Portionsgrössen und Getränke.`]);
  else if(g==="lose"&&wt.perWeek<-1)out.push([2,"warn","Zu schnelles Abnehmen",`${de(r1(wt.perWeek))} kg pro Woche. Mehr als 1 kg pro Woche kostet Muskeln. Iss etwas mehr, vor allem Protein.`]);
  else if(g==="gain"&&wt.perWeek<0)out.push([2,"warn","Gewicht stagniert",`Für Muskelaufbau sind +0,2–0,4 kg pro Woche ideal. Erhöhe die Kalorien leicht.`])}
 const good=[];
 if(nu.n>=3&&nu.p>=nu.pT*.9)good.push("Proteinziel gut getroffen");
 if(nu.n>=3&&nu.inRange>=Math.ceil(nu.n*.6))good.push(`Kalorien an ${nu.inRange} von ${nu.n} Tagen im Zielbereich`);
 if(ws.runState==="done")good.push("Laufziel der Woche erreicht");
 if(ws.wkState==="done")good.push("Alle Krafteinheiten der Woche erledigt");
 if(typeof streak==="function"&&streak()>=3)good.push(`${streak()} Tage in Folge aktiv`);
 if(wt&&g==="lose"&&wt.perWeek<=-0.2&&wt.perWeek>=-1)good.push(`Gewicht sinkt gesund (${de(r1(wt.perWeek))} kg/Woche)`);
 return{list:out.sort((a,b)=>a[0]-b[0]).slice(0,3),good};
}

// ---------- Darstellung ----------
const STATE={done:["good","Erreicht"],ok:["good","Auf Kurs"],tight:["warn","Knapp"],miss:["bad","Gefährdet"]};
function kcalChart(nu){
 const W=300,H=110,pb=18,bw=W/7,mx=Math.max(...nu.rows.map(r=>Math.max(r.s.kcal,r.t.kcal)),1000)*1.1;
 let g="";
 nu.rows.forEach((r,i)=>{const x=i*bw+bw*.22,w=bw*.56,h=(r.s.kcal/mx)*(H-pb-8),y=H-pb-h,ty=H-pb-(r.t.kcal/mx)*(H-pb-8);
  const over=r.s.kcal>r.t.kcal*1.1,under=r.logged&&r.s.kcal<r.t.kcal*.8;
  g+=r.logged?`<rect x="${x}" y="${y}" width="${w}" height="${Math.max(h,2)}" rx="4" fill="${over?"var(--warn)":under?"color-mix(in srgb,var(--c-food) 45%,transparent)":"var(--c-food)"}"/>`:`<rect x="${x}" y="${H-pb-3}" width="${w}" height="3" rx="1.5" fill="var(--line)"/>`;
  g+=`<line x1="${x-3}" x2="${x+w+3}" y1="${ty}" y2="${ty}" stroke="var(--fg)" stroke-width="2" stroke-dasharray="3 2" opacity=".55"/>`;
  g+=`<text x="${x+w/2}" y="${H-4}" text-anchor="middle" font-size="10" fill="var(--muted)">${WD[wdIdx(r.d)]}</text>`});
 return`<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block" role="img" aria-label="Kalorien der letzten 7 Tage im Vergleich zum Ziel">${g}</svg>
 <div class="row small muted" style="gap:14px"><span><i class="kd" style="background:var(--c-food)"></i> gegessen</span><span>– – Ziel</span><span><i class="kd" style="background:var(--warn)"></i> über Ziel</span></div>`;
}
function bar(v,t,color){const p=Math.min(100,t?v/t*100:0);return`<div class="bar"><i style="width:${p}%;background:${color}"></i></div>`}
function html(){
 const ws=weekStatus(),nu=nutrition(),wt=weightTrend(),tp=todayPlan(),tt=tips(ws,nu,wt),dt=dayTargets(TODAY());
 const h=new Date().getHours(),greet=h<11?"Guten Morgen":h<17?"Hallo":"Guten Abend",name=S.profile.name?", "+E(S.profile.name):"";
 const dstr=new Date().toLocaleDateString("de-DE",{weekday:"long",day:"numeric",month:"long"});
 // Heute
 const pd=tp.pd;let todayHTML;
 const isDone=(pd.t==="Kraft"&&tp.done.wk)||(pd.t==="Lauf"&&tp.done.run);
 if(isDone)todayHTML=`<div class="bfocus good"><div class="bbig">${pd.t} erledigt</div><div class="small">Stark! Heute steht nur noch Regeneration und gutes Essen an.</div></div>`;
 else if(pd.t==="Kraft"&&tp.tpl){const ex=TEMPLATES[tp.tpl]||[];
  todayHTML=`<div class="bfocus lift"><div class="eyebrow">Krafttraining</div><div class="bbig">${E(tp.tpl)}</div><div class="small">${ex.length} Übungen · ca. ${Math.max(35,ex.length*11)} Min. inkl. Aufwärmen</div><div class="small muted">${E(ex.slice(0,4).join(", "))}${ex.length>4?" …":""}</div>
   <button class="btn block" data-b="startWk" data-n="${E(tp.tpl)}">Training starten</button></div>`}
 else if(pd.t==="Lauf"){const sug=ws.restRunDays&&ws.kmLeft>0?Math.max(3,r1(ws.perRun)):null;
  todayHTML=`<div class="bfocus run"><div class="eyebrow">Laufen</div><div class="bbig">${E(pd.d)}</div>${sug?`<div class="small">Für dein Wochenziel: ca. <b>${de(sug)} km</b></div>`:""}
   <div class="grid2"><button class="btn ghost" data-b="runWarm">Aufwärmen</button><button class="btn" data-b="run">Lauf starten</button></div></div>`}
 else todayHTML=`<div class="bfocus rest"><div class="eyebrow">${pd.opt?"Optional":"Heute"}</div><div class="bbig">${E(pd.t)}</div><div class="small">${E(pd.d)}</div>${/Ruhetag|Erholung/.test(pd.t)?`<div class="small muted">Erholung gehört zum Training. Schlaf gut und iss genug Protein.</div>`:""}</div>`;
 const idea=PROT_IDEAS[new Date().getDate()%PROT_IDEAS.length];
 // Woche
 const wkRow=(label,val,state,sub,pct,color)=>`<div class="bwk"><div class="row between"><span style="font-weight:700">${label}</span>${state?`<span class="pill ${STATE[state][0]}">${STATE[state][1]}</span>`:""}</div>
  <div class="row between small"><span class="num" style="font-size:20px;font-weight:700">${val}</span><span class="muted">${sub}</span></div>${bar(pct,100,color)}</div>`;
 const weekHTML=[ws.runState?wkRow("Laufen",`${de(r1(ws.km))} / ${ws.t.km} km`,ws.runState,ws.kmLeft>0?`noch ${de(r1(ws.kmLeft))} km · ${ws.restRunDays} Lauftag${ws.restRunDays===1?"":"e"} übrig`:"Ziel erreicht",ws.t.km?ws.km/ws.t.km*100:0,"var(--c-run)"):"",
  ws.wkState?wkRow("Krafttraining",`${ws.wkW} / ${ws.wkPlanned} Einheiten`,ws.wkState,ws.wkLeft>0?`${ws.restWkDays} Krafttag${ws.restWkDays===1?"":"e"} im Plan übrig`:"Ziel erreicht",ws.wkPlanned?ws.wkW/ws.wkPlanned*100:0,"var(--c-lift)"):""].join("");
 const daysRow=`<div class="bdays">${ws.days.map((d,i)=>{const a=S.runs.some(r=>r.date===d)||S.workouts.some(w=>w.date===d)||(S.acts||[]).some(x=>x.date===d);return`<span class="${a?"on":""} ${d===TODAY()?"td":""}">${WD[i]}</span>`}).join("")}</div>`;
 // Ernährung
 const st=(v,t,inv)=>{const r=v/t;return inv?(r>1.2?"warn":"good"):(r>=.9?"good":r>=.7?"warn":"bad")};
 const nutHTML=nu.n<3?`<p class="small muted" style="margin:0">An ${nu.n} der letzten 7 Tage eingetragen. Ab 3 Tagen bekommst du hier eine Auswertung.</p>`:`${kcalChart(nu)}
  <div class="list">
   <div class="li"><div class="grow">Kalorien Ø</div><span class="num" style="font-size:17px">${de(r0(nu.kcal))} <span class="muted">/ ${de(r0(nu.kcalT))}</span></span><span class="pill ${Math.abs(nu.kcal-nu.kcalT)<=nu.kcalT*.1?"good":"warn"}">${nu.kcal>nu.kcalT?"+":""}${de(r0(nu.kcal-nu.kcalT))}</span></div>
   <div class="li"><div class="grow">Protein Ø</div><span class="num" style="font-size:17px">${r0(nu.p)} <span class="muted">/ ${r0(nu.pT)} g</span></span><span class="pill ${st(nu.p,nu.pT)}">${r0(nu.p/nu.pT*100)} %</span></div>
   <div class="li"><div class="grow">Ballaststoffe Ø</div><span class="num" style="font-size:17px">${r0(nu.fib)} <span class="muted">/ 30 g</span></span><span class="pill ${st(nu.fib,30)}">${r0(nu.fib/30*100)} %</span></div>
   <div class="li"><div class="grow">Zucker Ø</div><span class="num" style="font-size:17px">${r0(nu.sug)} <span class="muted">max. ${targets().sug} g</span></span><span class="pill ${st(nu.sug,targets().sug,true)}">${nu.sug>targets().sug*1.2?"hoch":"ok"}</span></div>
  </div><div class="small muted">Ausgewertet: ${nu.n} von 7 Tagen · ${nu.inRange} ${nu.inRange===1?"Tag":"Tage"} im Zielbereich (±10 %)</div>`;
 const wtHTML=wt?`<div class="row between small"><span>Gewicht: <b class="num" style="font-size:16px">${de(r1(wt.now))} kg</b></span><span class="pill ${(S.profile.goal==="lose"&&wt.perWeek<=0)||(S.profile.goal==="gain"&&wt.perWeek>=0)||(S.profile.goal==="keep"&&Math.abs(wt.perWeek)<.3)?"good":"warn"}">${wt.perWeek>0?"+":""}${de(r1(wt.perWeek))} kg / Woche</span></div>`:"";
 const tipsHTML=tt.list.length?tt.list.map(([,k,t,d])=>`<div class="tip ${k}"><i></i><div><div style="font-weight:600">${E(t)}</div><div class="small muted">${E(d)}</div></div></div>`).join(""):`<div class="tip good"><i></i><div><div style="font-weight:600">Alles im grünen Bereich</div><div class="small muted">Mach weiter so. Konstanz schlägt Perfektion.</div></div></div>`;
 const aiOk=window.aiReady&&window.aiReady();
 return`<div class="bin">
 <div class="row between"><div><div class="eyebrow" style="color:var(--hero2)">${E(dstr)}</div><h1 class="bh1">${greet}${name}</h1></div><button class="icon-btn" data-b="close" aria-label="Schliessen">${I.x}</button></div>
 <section class="card"><h2>Dein Plan für heute</h2>${todayHTML}
  <div class="row between small"><span class="muted">Kalorienziel heute</span><b class="num" style="font-size:17px">${de(dt.kcal)} kcal · ${dt.prot} g Protein</b></div>
  <div class="small muted">Protein-Idee: ${E(idea[0])} (ca. ${idea[1]} g)</div></section>
 ${weekHTML?`<section class="card"><div class="row between"><h2>Wochenziel</h2><span class="small muted">${ws.trainDays} Trainingstage</span></div>${daysRow}${weekHTML}</section>`:""}
 <section class="card"><h2>Ernährung, letzte 7 Tage</h2>${nutHTML}${wtHTML}</section>
 ${tt.good.length?`<section class="card"><h2>Das lief gut</h2><div class="stack" style="gap:6px">${tt.good.map(g=>`<div class="row" style="gap:8px"><span class="bok">${I.ok}</span><span>${E(g)}</span></div>`).join("")}</div></section>`:""}
 <section class="card"><h2>Das kannst du verbessern</h2>${tipsHTML}</section>
 ${aiOk?`<section class="card" id="baisec"><h2>KI-Coach</h2><p class="small muted" style="margin:0">Lass dir eine persönliche Einschätzung deiner Woche schreiben.</p><button class="btn ghost block" data-b="ai">Persönlichen KI-Bericht erstellen</button></section>`:""}
 <label class="swrem small"><input type="checkbox" id="bauto" ${S.profile.brief===false?"":"checked"}> Jeden Tag beim ersten Öffnen anzeigen</label>
 <button class="btn block gbig" data-b="close">Los geht's</button></div>`;
}
function open(){
 if(!S||!S.profile)return;
 let h=document.getElementById("brief");if(!h){h=document.createElement("div");h.id="brief";h.setAttribute("role","dialog");h.setAttribute("aria-modal","true");document.body.appendChild(h)}
 h.className="bp";h.innerHTML=html();h.scrollTop=0;
 if(S.lastBrief!==TODAY()){S.lastBrief=TODAY();save()}
}
function close(){const h=document.getElementById("brief");if(h)h.remove()}
async function aiReport(){
 const sec=document.getElementById("baisec");if(!sec)return;
 sec.innerHTML=`<h2>KI-Coach</h2><div class="row" style="gap:10px"><div class="spin" style="width:22px;height:22px"></div><span class="small muted">Schreibe deinen Bericht …</span></div>`;
 const ws=weekStatus(),nu=nutrition(),wt=weightTrend(),tp=todayPlan(),p=S.profile;
 const data={ziel:{lose:"abnehmen",keep:"halten",gain:"Muskelaufbau"}[p.goal],gewicht:p.weight,zielgewicht:p.targetWeight||null,alter:p.age,training:p.train,
  heuteGeplant:tp.pd.t+": "+tp.pd.d,woche:{laufKm:r1(ws.km),laufZielKm:ws.t.km,kraftEinheiten:ws.wkW,kraftGeplant:ws.wkPlanned,trainingstage:ws.trainDays},
  ernaehrung7Tage:nu.n?{tageErfasst:nu.n,kcalSchnitt:r0(nu.kcal),kcalZiel:r0(nu.kcalT),proteinSchnitt:r0(nu.p),proteinZiel:r0(nu.pT),ballaststoffe:r0(nu.fib),zucker:r0(nu.sug)}:"keine Daten",
  gewichtstrendProWoche:wt?r1(wt.perWeek):null,letzteTrainings:[...S.workouts].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,3).map(w=>w.date+" "+w.name),
  letzteLaeufe:[...S.runs].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,3).map(r=>r.date+" "+r.km+" km")};
 const prompt=`Du bist ein motivierender, ehrlicher Fitness- und Ernährungscoach. Schreibe auf Deutsch (Schweizer Schreibweise, ss statt ß) einen kurzen Tagesbericht für ${p.name||"den Nutzer"} auf Basis dieser Daten:
${JSON.stringify(data)}
Aufbau: 1) Ein Satz zur Woche. 2) Was heute wichtig ist (Training und Essen, konkret). 3) Zwei bis drei konkrete Verbesserungen mit Zahlen. 4) Ein motivierender Schlusssatz.
Maximal 130 Wörter, keine Überschriften, keine Emojis, keine medizinischen Diagnosen. Absätze mit Leerzeile trennen.`;
 try{const txt=await window.aiText(prompt);
  sec.innerHTML=`<h2>KI-Coach</h2>${String(txt).trim().split(/\n\s*\n/).map(x=>`<p style="margin:0;line-height:1.5">${E(x.replace(/\*\*/g,""))}</p>`).join("")}<div class="small muted">Erstellt mit ${E(window.aiProvName?window.aiProvName():"KI")}. Hinweise ersetzen keine ärztliche Beratung.</div>`;
 }catch(e){sec.innerHTML=`<h2>KI-Coach</h2><p class="small" style="color:var(--bad);margin:0;font-weight:600">${E(window.aiErr?window.aiErr(e):"Das hat nicht geklappt.")}</p><button class="btn ghost block" data-b="ai">Nochmal versuchen</button>`}
}
// Karte auf „Heute“
window.briefCardHTML=function(){
 try{const ws=weekStatus(),tp=todayPlan(),states=[ws.runState,ws.wkState].filter(Boolean),worst=states.includes("miss")?"miss":states.includes("tight")?"tight":states.length?"ok":null;
  return`<section class="card bcard"><div class="row between"><h2>Tagesbericht</h2>${worst?`<span class="pill ${STATE[worst][0]}">Woche: ${STATE[worst][1]}</span>`:""}</div>
  <div class="small muted">Heute: ${E(tp.pd.t)}${tp.tpl&&tp.pd.t==="Kraft"?" · "+E(tp.tpl):""}. Plan, Wochenziel, Ernährung und Tipps.</div>
  <button class="btn ghost block" data-b="open">Bericht ansehen</button></section>`}catch(e){return""}
};
document.addEventListener("click",ev=>{
 const b=ev.target.closest("[data-b]");if(!b)return;const k=b.dataset.b;
 switch(k){
  case"open":open();break;
  case"close":{const c=document.getElementById("bauto");if(c){const v=c.checked;if((S.profile.brief!==false)!==v){S.profile.brief=v;save()}}close();if(typeof render==="function")render(true);break}
  case"startWk":close();startWorkout(b.dataset.n);if(window.guideStart)window.guideStart();break;
  case"run":close();go("laufen");break;
  case"runWarm":close();go("laufen");setTimeout(()=>{const x=document.querySelector('[data-a="gRunWarm"]');if(x)x.click()},80);break;
  case"ai":aiReport();break;
 }
});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&document.getElementById("brief"))close()});
function maybeShow(){try{if(S&&S.profile&&S.profile.brief!==false&&S.lastBrief!==TODAY()&&!document.getElementById("brief")&&!document.getElementById("gplayer"))open()}catch(e){}}
document.addEventListener("visibilitychange",()=>{if(!document.hidden)setTimeout(maybeShow,600)});
setTimeout(maybeShow,900);

const css=document.createElement("style");
css.textContent=`
.bp{position:fixed;inset:0;z-index:45;background:var(--bg);overflow:auto;-webkit-overflow-scrolling:touch;padding:env(safe-area-inset-top,0px) 0 env(safe-area-inset-bottom,0px)}
.bp::before{content:"";position:fixed;inset:0 0 auto 0;height:320px;pointer-events:none;background:radial-gradient(420px 260px at 0% 0%,color-mix(in srgb,var(--hero1) 22%,transparent),transparent 70%),radial-gradient(360px 240px at 100% 0%,color-mix(in srgb,var(--hero3) 16%,transparent),transparent 70%)}
.bin{position:relative;max-width:440px;margin:0 auto;padding:16px 16px 28px;display:flex;flex-direction:column;gap:14px}
.bh1{font-size:36px;margin-top:4px}
.bfocus{border-radius:14px;padding:14px;display:flex;flex-direction:column;gap:6px;background:var(--surface2)}
.bfocus.lift{background:color-mix(in srgb,var(--c-lift) 12%,var(--surface))}.bfocus.run{background:color-mix(in srgb,var(--c-run) 12%,var(--surface))}
.bfocus.good{background:color-mix(in srgb,var(--good) 14%,var(--surface))}
.bfocus .btn{margin-top:6px}
.bbig{font-family:var(--display);font-size:26px;font-weight:700;line-height:1.1}
.bwk{display:flex;flex-direction:column;gap:6px}
.bdays{display:grid;grid-template-columns:repeat(7,1fr);gap:4px}
.bdays span{text-align:center;font-size:12px;font-weight:700;padding:6px 0;border-radius:8px;background:var(--surface2);color:var(--muted)}
.bdays span.on{background:var(--hero2);color:#fff}.bdays span.td{box-shadow:inset 0 0 0 2px var(--hero2)}
.bok{width:22px;height:22px;border-radius:50%;display:grid;place-items:center;background:var(--good);color:#fff;flex:none}.bok svg{width:13px;height:13px}
.bcard{background:linear-gradient(135deg,color-mix(in srgb,var(--hero1) 10%,var(--surface)),color-mix(in srgb,var(--hero3) 8%,var(--surface)))}
@media (prefers-reduced-motion:no-preference){.bin>*{animation:rise .4s cubic-bezier(.2,.8,.2,1) both}.bin>*:nth-child(2){animation-delay:.05s}.bin>*:nth-child(3){animation-delay:.1s}.bin>*:nth-child(4){animation-delay:.15s}.bin>*:nth-child(n+5){animation-delay:.2s}}
`;
document.head.appendChild(css);
window.briefOpen=open;
try{if(S&&typeof render==="function")render(true)}catch(e){}
})();
