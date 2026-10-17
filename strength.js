// Formwerk: Kraft-Werkzeuge – Übungs-Historie, Steigerungsvorschlag, Pausentimer, Intervall-Timer, 1RM-Rechner
(function(){
"use strict";
const E=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const D=v=>String(Math.round(v*10)/10).replace(".",",");
const N=v=>{const n=parseFloat(String(v).replace(",","."));return isFinite(n)?n:0};
const fmt=s=>{s=Math.max(0,Math.round(s));const h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60;return(h?h+":"+String(m).padStart(2,"0"):m)+":"+String(x).padStart(2,"0")};
const dl=d=>{const x=new Date(d+"T12:00");return x.getDate()+"."+(x.getMonth()+1)+"."};
const isBWe=n=>typeof window.guideEx==="object"&&window.guideEx[n]?!!window.guideEx[n][4]:false;

// ---------- Ton & Vibration ----------
let AC=null;
function beep(f=880,d=.15,n=1){try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();if(AC.state==="suspended")AC.resume();for(let i=0;i<n;i++){const o=AC.createOscillator(),g=AC.createGain(),t=AC.currentTime+i*.22;o.frequency.value=f;o.connect(g);g.connect(AC.destination);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.35,t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.start(t);o.stop(t+d+.03)}}catch(e){}
 try{navigator.vibrate&&navigator.vibrate(n>1?[180,90,180]:120)}catch(e){}}
window.stBeep=beep;

// ---------- Historie pro Übung ----------
function sessions(e){
 return S.workouts.filter(w=>w.sets.some(s=>s.e===e)).sort((a,b)=>a.date.localeCompare(b.date)||(a.id>b.id?1:-1)).map(w=>{
  const sets=w.sets.filter(s=>s.e===e),best=Math.max(...sets.map(s=>s.kg>0?e1rm(s.kg,s.reps):0)),top=Math.max(...sets.map(s=>s.kg||0));
  return{date:w.date,name:w.name,sets,best,top,reps:Math.max(...sets.map(s=>s.reps||0)),vol:sets.reduce((a,s)=>a+(s.kg||0)*(s.reps||0),0)}});
}
function setsTxt(sets){
 if(!sets.length)return"";const kg=sets[0].kg,same=sets.every(s=>s.kg===kg&&s.reps===sets[0].reps),sameKg=sets.every(s=>s.kg===kg);
 if(same)return`${sets.length} × ${sets[0].reps}${kg>0?" · "+D(kg)+" kg":""}`;
 if(sameKg)return`${kg>0?D(kg)+" kg × ":""}${sets.map(s=>s.reps).join(", ")}`;
 return sets.map(s=>(s.kg>0?D(s.kg)+"×":"")+s.reps).join(", ");
}
// Doppelte Progression: erst Wiederholungen bis 12 steigern, dann Gewicht erhöhen
function advice(e,ses){
 const l=ses[ses.length-1];if(!l)return"";const hold=window.guideEx&&window.guideEx[e]&&window.guideEx[e][5];
 if(hold)return`Ziel: ${Math.max(...l.sets.map(s=>s.reps))+5} Sek. halten`;
 if(!(l.top>0))return`Ziel: je 1–2 Wdh. mehr als letztes Mal`;
 const atTop=l.sets.filter(s=>s.kg===l.top),minR=Math.min(...atTop.map(s=>s.reps));
 if(minR>=12){const inc=l.top>=30?2.5:l.top>=8?2:1;return`Stark! Heute ${D(l.top+inc)} kg mit 8–10 Wdh. versuchen`}
 return`Ziel: ${D(l.top)} kg, je 1 Wdh. mehr (${atTop.length} × ${Math.min(12,minR+1)})`;
}
window.exHistLine=function(e){
 const ses=sessions(e);if(!ses.length)return`<div class="exlast muted">Erstes Mal: Starte mit einem Gewicht, das du sauber 10-mal schaffst.</div>`;
 const l=ses[ses.length-1],pr=Math.max(...ses.map(s=>s.best));
 return`<button class="exlast" data-st="hist" data-n="${E(e)}"><span><b>Letztes Mal</b> (${dl(l.date)}): ${E(setsTxt(l.sets))}${l.best>0&&l.best>=pr&&ses.length>1?' <span class="pill good" style="font-size:10px">Rekord</span>':""}</span><span class="exadv">${E(advice(e,ses))}</span>${ses.length>1?spark(ses.slice(-8).map(s=>s.best>0?s.best:s.reps)):""}</button>`;
};
function spark(v){if(v.length<2)return"";const mn=Math.min(...v),mx=Math.max(...v),r=mx-mn||1,w=64,h=20;
 const pts=v.map((x,i)=>`${(i/(v.length-1)*w).toFixed(1)},${(h-2-(x-mn)/r*(h-4)).toFixed(1)}`).join(" ");
 return`<svg class="exspark" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true"><polyline points="${pts}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`}
function chart(ses,bw){
 const v=ses.slice(-12),vals=v.map(s=>bw?s.reps:s.best);if(v.length<2)return`<div class="small muted">Nach dem zweiten Training siehst du hier deinen Verlauf.</div>`;
 const W=320,H=150,P={l:34,r:10,t:12,b:24},mn=Math.min(...vals)*.95,mx=Math.max(...vals)*1.03,rng=mx-mn||1;
 const X=i=>P.l+i/(v.length-1)*(W-P.l-P.r),Y=x=>P.t+(1-(x-mn)/rng)*(H-P.t-P.b);
 const pts=vals.map((x,i)=>`${X(i).toFixed(1)},${Y(x).toFixed(1)}`).join(" ");
 const ticks=[mn,(mn+mx)/2,mx];
 return`<svg viewBox="0 0 ${W} ${H}" class="exchart" role="img" aria-label="Verlauf">
  ${ticks.map(t=>`<line x1="${P.l}" x2="${W-P.r}" y1="${Y(t)}" y2="${Y(t)}" stroke="var(--line,#ddd)" stroke-width="1"/><text x="${P.l-6}" y="${Y(t)+4}" text-anchor="end" font-size="10" fill="var(--muted)">${Math.round(t)}</text>`).join("")}
  <polyline points="${pts}" fill="none" stroke="var(--c-lift,var(--accent))" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
  ${vals.map((x,i)=>`<circle cx="${X(i)}" cy="${Y(x)}" r="3.5" fill="var(--c-lift,var(--accent))"/>`).join("")}
  <text x="${P.l}" y="${H-6}" font-size="10" fill="var(--muted)">${dl(v[0].date)}</text><text x="${W-P.r}" y="${H-6}" font-size="10" fill="var(--muted)" text-anchor="end">${dl(v[v.length-1].date)}</text></svg>`;
}
function host(id){let h=document.getElementById(id);if(!h){h=document.createElement("div");h.id=id;document.body.appendChild(h)}return h}
function sheet(id,title,body){host(id).innerHTML=`<div class="scrim" data-st="close" data-h="${id}"><div class="sheet" role="dialog" aria-modal="true" aria-label="${E(title)}"><div class="grab"></div>
 <div class="row between"><h2>${E(title)}</h2><button class="icon-btn" data-st="close" data-h="${id}" aria-label="Schliessen">${I.x}</button></div>${body}</div></div>`}
function openHist(e){
 const ses=sessions(e),bw=ses.length&&ses.every(s=>!(s.top>0)),pr=ses.reduce((a,s)=>s.best>(a?a.best:0)?s:a,null);
 sheet("sthist",e,`${ses.length?`<div class="grid2"><div><div class="eyebrow">${bw?"Beste Wdh.":"Geschätztes 1RM"}</div><div class="num" style="font-size:30px;font-weight:700">${bw?Math.max(...ses.map(s=>s.reps)):D(pr.best)+" kg"}</div><div class="small muted">${bw?"":"am "+dl(pr.date)+" ("+E(setsTxt(pr.sets))+")"}</div></div><div><div class="eyebrow">Trainings</div><div class="num" style="font-size:30px;font-weight:700">${ses.length}</div></div></div>
  <div class="tip"><i></i><div class="small"><b>Nächstes Mal:</b> ${E(advice(e,ses))}</div></div>
  <div><div class="eyebrow" style="margin-bottom:4px">${bw?"Wiederholungen":"Geschätztes 1RM (kg)"}</div>${chart(ses,bw)}</div>
  <div class="list">${ses.slice().reverse().map(s=>`<div class="li"><div class="grow"><div class="t">${dl(s.date)} · ${E(s.name)}</div><div class="s">${E(setsTxt(s.sets))}${s.vol?" · "+D(s.vol)+" kg Volumen":""}</div></div>${s.best>0?`<span class="num" style="font-weight:700">${D(s.best)}<span class="muted" style="font-size:12px"> kg</span></span>`:""}</div>`).join("")}</div>`
  :`<p class="small muted">Für diese Übung gibt es noch keine Einträge.</p>`}
  <button class="btn ghost block" data-st="rm" data-kg="${pr&&pr.sets[0]?pr.sets.reduce((a,s)=>s.kg>a.kg?s:a).kg:""}" data-reps="${pr&&pr.sets[0]?pr.sets.reduce((a,s)=>s.kg>a.kg?s:a).reps:""}">1RM-Rechner öffnen</button>`);
}

// ---------- Pausentimer ----------
const RS=[45,60,90,120,180];
window.restSec=()=>(S&&S.profile&&S.profile.restSec)||90;
window.restAuto=()=>!(S&&S.profile&&S.profile.restAuto===false);
window.restBarHTML=function(){
 const sec=window.restSec(),on=REST.left>0,pct=on?REST.left/(REST.total||sec)*100:100;
 return`<div class="restbar ${on?"on":""}"><div class="row between"><span>Satzpause <span class="num" style="font-size:24px;font-weight:700" id="rest">${on?fmtTime(REST.left):fmt(sec)}</span></span>
  <span class="row" style="gap:6px">${on?`<button class="btn sm ghost" data-st="rplus">+15</button>`:""}<button class="btn sm ${on?"":"ghost"}" data-a="rest">${on?"Stopp":"Start"}</button></span></div>
  <div class="restprog"><i id="restprog" style="width:${pct}%"></i></div>
  <div class="row between" style="gap:6px;flex-wrap:wrap"><div class="restchips">${RS.map(s=>`<button class="chip" data-st="rsec" data-v="${s}" aria-pressed="${s===sec}">${s<60?s+"s":fmt(s)}</button>`).join("")}</div>
  <label class="small row" style="gap:6px;align-items:center"><input type="checkbox" data-st="rauto" ${window.restAuto()?"checked":""}> nach Satz automatisch</label></div></div>`;
};

// ---------- Werkzeuge-Karte ----------
window.toolsCardHTML=function(){
 return`<section class="card"><h2>Werkzeuge</h2><div class="grid2">
  <button class="card tile tooltile" data-st="timer"><span class="num" style="font-size:20px;font-weight:700">Timer</span><span class="small muted">Intervall, Tabata, EMOM, AMRAP, Stoppuhr</span></button>
  <button class="card tile tooltile" data-st="rm"><span class="num" style="font-size:20px;font-weight:700">1RM-Rechner</span><span class="small muted">Maximalgewicht und Trainingsgewichte</span></button></div></section>`;
};

// ---------- 1RM-Rechner ----------
const PCT=[[100,1],[95,2],[90,4],[85,6],[80,8],[75,10],[70,12],[65,15],[60,20],[50,25]];
function rmCalc(kg,reps){if(!(kg>0&&reps>0))return 0;if(reps===1)return kg;const ep=kg*(1+reps/30),bz=reps<37?kg*36/(37-reps):ep;return reps<=10?(ep+bz)/2:ep}
function rmBody(kg,reps){
 const rm=rmCalc(kg,reps),round=x=>Math.round(x/2.5)*2.5;
 return rm?`<div class="rmres"><div class="eyebrow">Geschätztes 1RM</div><div class="num" style="font-size:44px;font-weight:700;line-height:1">${D(rm)} <span class="muted" style="font-size:18px">kg</span></div>${reps>12?`<div class="small muted">Bei mehr als 12 Wdh. wird die Schätzung ungenauer.</div>`:""}</div>
  <div class="list rmtab"><div class="li small muted"><span style="width:56px">% 1RM</span><span class="grow">Gewicht</span><span>ca. Wdh.</span></div>${PCT.map(([p,r])=>`<div class="li"><b style="width:56px">${p} %</b><span class="grow num">${D(p===100?rm:round(rm*p/100))} kg</span><span class="muted">${r}</span></div>`).join("")}</div>
  <div class="small muted">Kraftaufbau: 75–85 % für 6–10 Wdh. Maximalkraft: 85–95 % für 2–5 Wdh. Gewichte auf 2,5 kg gerundet.</div>`
 :`<div class="small muted">Gib ein Gewicht und die geschafften Wiederholungen eines sauberen Satzes ein.</div>`;
}
function openRM(kg,reps){
 sheet("strm","1RM-Rechner",`<p class="small muted" style="margin:0">Schätzt dein Maximalgewicht für eine Wiederholung, ohne dass du es testen musst (Mittelwert aus Epley- und Brzycki-Formel).</p>
 <div class="grid2"><label class="f">Gewicht (kg)<input id="rm-kg" inputmode="decimal" value="${kg||""}" placeholder="z. B. 60"></label><label class="f">Wiederholungen<input id="rm-reps" inputmode="numeric" value="${reps||""}" placeholder="z. B. 8"></label></div>
 <div id="rmout" class="stack" style="gap:10px">${rmBody(N(kg),parseInt(reps)||0)}</div>`);
 setTimeout(()=>{const k=document.getElementById("rm-kg");if(k&&!kg)k.focus()},80);
}
document.addEventListener("input",ev=>{if(ev.target.id!=="rm-kg"&&ev.target.id!=="rm-reps")return;const o=document.getElementById("rmout");if(o)o.innerHTML=rmBody(N(document.getElementById("rm-kg").value),parseInt(document.getElementById("rm-reps").value)||0)});

// ---------- Intervall-Timer ----------
const MODES={
 iv:{name:"Intervall",info:"Arbeit und Pause im Wechsel",f:[["work","Arbeit (Sek.)",40],["rest","Pause (Sek.)",20],["rounds","Runden",10]]},
 tabata:{name:"Tabata",info:"8 × 20 Sek. Vollgas, 10 Sek. Pause",f:[["rounds","Runden",8]]},
 emom:{name:"EMOM",info:"Jede Minute eine Aufgabe, Rest ist Pause",f:[["every","Alle (Sek.)",60],["rounds","Runden",10]]},
 amrap:{name:"AMRAP",info:"So viele Runden wie möglich in der Zeit",f:[["min","Minuten",12]]},
 stop:{name:"Stoppuhr",info:"Zeit stoppen mit Runden",f:[]}
};
let TC=null,TR=null; // Einstellungen | laufender Timer
function tcfg(){const s=(S.profile.timer)||{};return{mode:s.mode||"iv",v:{work:40,rest:20,rounds:10,every:60,min:12,...(s.v||{})}}}
function drawTimerSetup(){
 const m=MODES[TC.mode];
 sheet("sttimer","Timer",`<div class="tmodes">${Object.entries(MODES).map(([k,x])=>`<button class="chip" data-st="tmode" data-v="${k}" aria-pressed="${TC.mode===k}">${x.name}</button>`).join("")}</div>
 <p class="small muted" style="margin:0">${m.info}</p>
 ${m.f.length?`<div class="grid${m.f.length>2?3:m.f.length===2?2:""}" style="${m.f.length===1?"display:grid":""}">${m.f.map(([k,l])=>`<label class="f">${l}<input data-tv="${k}" inputmode="numeric" value="${TC.v[k]}"></label>`).join("")}</div>`:""}
 <div class="small muted">${plan().total?"Dauer: "+fmt(plan().total)+" · ":""}10 Sek. Vorbereitung, Ton und Vibration bei jedem Wechsel.</div>
 <button class="btn block gbig" data-st="tstart">Start</button>`);
}
function plan(){
 const v=TC.v,m=TC.mode,ph=[];
 if(m==="iv")for(let i=0;i<v.rounds;i++){ph.push({k:"work",sec:v.work,r:i+1});if(i<v.rounds-1&&v.rest>0)ph.push({k:"rest",sec:v.rest,r:i+1})}
 if(m==="tabata")for(let i=0;i<v.rounds;i++){ph.push({k:"work",sec:20,r:i+1});if(i<v.rounds-1)ph.push({k:"rest",sec:10,r:i+1})}
 if(m==="emom")for(let i=0;i<v.rounds;i++)ph.push({k:"work",sec:v.every,r:i+1});
 if(m==="amrap")ph.push({k:"work",sec:v.min*60,r:0});
 return{ph,total:ph.reduce((a,p)=>a+p.sec,0),rounds:m==="amrap"||m==="stop"?0:v.rounds};
}
function startTimer(){
 const p=plan();beep(660,.05);
 TR={mode:TC.mode,ph:[{k:"prep",sec:10,r:0},...p.ph],i:0,t0:Date.now(),segStart:Date.now(),paused:false,pausedAt:0,pausedMs:0,rounds:p.rounds,laps:[],amr:0,warned:-1};
 if(typeof wakeOn==="function")try{wakeOn()}catch(e){}
 host("sttimer").innerHTML="";drawRun();TR.iv=setInterval(tick,200);
}
const now=()=>TR.paused?TR.pausedAt:Date.now();
const elapsed=()=>(now()-TR.t0-TR.pausedMs)/1000;
function tick(){
 if(!TR||TR.paused)return;
 if(TR.mode==="stop"&&TR.i>0){const el=document.getElementById("tbig");if(el)el.textContent=fmt(elapsed()-10);return}
 const p=TR.ph[TR.i],se=(now()-TR.segStart)/1000,left=p.sec-se;
 if(left<=3.05&&left>0&&TR.warned!==Math.ceil(left)){TR.warned=Math.ceil(left);beep(520,.08)}
 if(left<=0){next();return}
 const el=document.getElementById("tbig"),bar=document.getElementById("tbar");
 if(el)el.textContent=fmt(Math.ceil(left));if(bar)bar.style.width=(se/p.sec*100)+"%";
 const tt=document.getElementById("ttot");if(tt)tt.textContent=fmt(Math.max(0,elapsed()-10));
}
function next(){
 TR.i++;TR.warned=-1;
 if(TR.mode==="stop"&&TR.i===1){TR.segStart=Date.now();beep(990,.25,2);drawRun();return}
 if(TR.i>=TR.ph.length){finish();return}
 TR.segStart=Date.now();const p=TR.ph[TR.i];beep(p.k==="work"?990:660,.25,p.k==="work"?2:1);drawRun();
}
const COL={prep:"#64748b",work:"#E6407A",rest:"#10B981"};
function drawRun(){
 const h=host("strun"),p=TR.ph[Math.min(TR.i,TR.ph.length-1)],m=MODES[TR.mode],stopRun=TR.mode==="stop"&&TR.i>0;
 const label=p.k==="prep"?"Mach dich bereit":stopRun?"Stoppuhr":TR.mode==="amrap"?"AMRAP":TR.mode==="emom"?"Runde "+p.r+" von "+TR.rounds:p.k==="work"?"Arbeit":"Pause";
 const sub=p.k==="prep"?m.name+" startet gleich":stopRun?(TR.laps.length?TR.laps.length+" Runden":"Tippe auf „Runde“ für Zwischenzeiten"):TR.mode==="amrap"?`Runden: <b id="tamr">${TR.amr}</b>`:TR.rounds?`Runde ${p.r} von ${TR.rounds}`:"";
 h.innerHTML=`<div class="tp" style="--tc:${stopRun?COL.work:COL[p.k]}"><div class="tptop"><button class="icon-btn" data-st="tstop" aria-label="Beenden">${I.x}</button><div class="eyebrow" style="color:#fff;opacity:.85">${m.name}</div><span></span></div>
 <div class="tpbar"><i id="tbar"></i></div>
 <div class="tplabel">${label}</div><div class="tpsub">${sub}</div>
 <div class="tpbig num" id="tbig">${stopRun?fmt(elapsed()-10):fmt(p.sec)}</div>
 ${TR.mode!=="stop"&&p.k!=="prep"?`<div class="tpsub">Gesamt <span id="ttot">0:00</span>${TR.ph[TR.i+1]?` · danach ${TR.ph[TR.i+1].k==="work"?"Arbeit":"Pause"} ${fmt(TR.ph[TR.i+1].sec)}`:""}</div>`:""}
 ${stopRun&&TR.laps.length?`<div class="tplaps">${TR.laps.map((l,i)=>`<div><span>Runde ${i+1}</span><b class="num">${fmt(l.d)}</b></div>`).reverse().join("")}</div>`:""}
 <div class="tpbtns">${TR.mode==="amrap"&&p.k!=="prep"?`<button class="btn ghost" data-st="tamr">+1 Runde</button>`:stopRun?`<button class="btn ghost" data-st="tlap">Runde</button>`:`<button class="btn ghost" data-st="tskip">Überspringen</button>`}
  <button class="btn" data-st="tpause">${TR.paused?"Weiter":"Pause"}</button></div>
 <button class="glink" data-st="tstop" style="color:#fff;opacity:.85">Beenden</button></div>`;
 tick();
}
function finish(){
 clearInterval(TR.iv);beep(990,.35,3);if(typeof wakeOff==="function")try{wakeOff()}catch(e){}
 const sec=Math.max(0,Math.round(elapsed()-10)),m=MODES[TR.mode];TR.done=sec;
 host("strun").innerHTML=`<div class="tp" style="--tc:${COL.rest}"><div class="tptop"><span></span><div class="eyebrow" style="color:#fff">Geschafft</div><span></span></div>
 <div class="tplabel" style="margin-top:30px">${m.name} beendet</div><div class="tpbig num">${fmt(sec)}</div>
 ${TR.mode==="amrap"?`<div class="tpsub">${TR.amr} Runden geschafft</div>`:TR.laps.length?`<div class="tpsub">${TR.laps.length} Runden</div>`:""}
 <div class="tpsub">Willst du das als Aktivität eintragen? Die Kalorien zählen dann zu deinem Tagesziel.</div>
 <div class="tpbtns"><button class="btn ghost" data-st="tclose">Nur schliessen</button><button class="btn" data-st="tsave" ${sec<60?"disabled":""}>Eintragen</button></div></div>`;
}
function closeRun(){if(TR&&TR.iv)clearInterval(TR.iv);if(typeof wakeOff==="function")try{wakeOff()}catch(e){}TR=null;host("strun").innerHTML=""}

// ---------- Ereignisse ----------
document.addEventListener("click",ev=>{
 const b=ev.target.closest("[data-st]");if(!b)return;const k=b.dataset.st;
 if(b.tagName==="INPUT")return;
 if(k==="close"){if(ev.target!==b&&b.classList.contains("scrim"))return;host(b.dataset.h).innerHTML="";return}
 switch(k){
  case"hist":openHist(b.dataset.n);break;
  case"rm":{const h=document.getElementById("sthist");if(h)h.innerHTML="";openRM(b.dataset.kg,b.dataset.reps);break}
  case"rsec":S.profile.restSec=+b.dataset.v;save();if(REST.left){startRest()}render(true);break;
  case"rplus":REST.left+=15;REST.total=(REST.total||window.restSec())+15;break;
  case"timer":TC=tcfg();drawTimerSetup();break;
  case"tmode":readTV();TC.mode=b.dataset.v;drawTimerSetup();break;
  case"tstart":readTV();S.profile.timer={mode:TC.mode,v:TC.v};save();startTimer();break;
  case"tpause":if(TR.paused){const d=Date.now()-TR.pausedAt;TR.pausedMs+=d;TR.segStart+=d;TR.paused=false}else{TR.paused=true;TR.pausedAt=Date.now()}drawRun();break;
  case"tskip":next();break;
  case"tlap":{const t=elapsed()-10,prev=TR.laps.reduce((a,l)=>a+l.d,0);TR.laps.push({d:t-prev});beep(880,.08);drawRun();break}
  case"tamr":TR.amr++;beep(880,.06);{const el=document.getElementById("tamr");if(el)el.textContent=TR.amr}break;
  case"tstop":if(TR&&TR.i>0&&elapsed()>70)finish();else closeRun();break;
  case"tclose":closeRun();break;
  case"tsave":{const min=Math.max(1,Math.round(TR.done/60)),nm=MODES[TR.mode].name;(S.acts=S.acts||[]).push({id:uid(),date:TODAY(),type:"hiit",min,int:"hoch",via:nm+"-Timer"});save();closeRun();render(true);toast(min+" Min. "+nm+" eingetragen");break}
 }
});
function readTV(){document.querySelectorAll("[data-tv]").forEach(i=>{const v=parseInt(i.value);if(v>0)TC.v[i.dataset.tv]=Math.min(v,i.dataset.tv==="rounds"?99:3600)})}
document.addEventListener("input",ev=>{if(ev.target.dataset&&ev.target.dataset.tv&&TC){readTV();const s=document.querySelector("#sttimer .small.muted:not(p)");if(s)s.textContent=(plan().total?"Dauer: "+fmt(plan().total)+" · ":"")+"10 Sek. Vorbereitung, Ton und Vibration bei jedem Wechsel."}});
document.addEventListener("change",ev=>{if(ev.target.dataset&&ev.target.dataset.st==="rauto"){S.profile.restAuto=ev.target.checked;save()}});
document.addEventListener("visibilitychange",()=>{if(!document.hidden&&TR&&!TR.paused)tick()});

const css=document.createElement("style");
css.textContent=`
.exlast{display:flex;flex-direction:column;gap:2px;width:100%;text-align:left;font-size:13px;padding:8px 10px;margin:4px 0 2px;border-radius:10px;background:var(--surface2);position:relative;border:0;color:var(--fg)}
.exlast.muted{color:var(--muted)}
.exadv{color:var(--c-lift,var(--accent));font-weight:600}
.exspark{position:absolute;right:10px;top:8px;color:var(--c-lift,var(--accent));opacity:.8}
.exlast>span{padding-right:72px}
.exchart{width:100%;height:auto;display:block}
.restbar{display:flex;flex-direction:column;gap:8px;background:var(--surface2);border-radius:12px;padding:10px 12px}
.restbar.on{background:color-mix(in srgb,var(--c-lift,var(--accent)) 14%,var(--surface))}
.restprog{height:5px;border-radius:9px;background:color-mix(in srgb,var(--muted) 25%,transparent);overflow:hidden}.restprog i{display:block;height:100%;background:var(--c-lift,var(--accent));transition:width 1s linear}
.restchips{display:flex;gap:4px;flex-wrap:wrap}.restchips .chip{padding:5px 9px;font-size:12px}
.tooltile{text-align:left;gap:4px}
.rmres{padding:14px;border-radius:14px;background:color-mix(in srgb,var(--c-lift,var(--accent)) 10%,var(--surface))}
.rmtab .li{padding:7px 2px;gap:10px}
.tmodes{display:flex;gap:6px;flex-wrap:wrap}
.tp{position:fixed;inset:0;z-index:48;background:linear-gradient(170deg,var(--tc),color-mix(in srgb,var(--tc) 55%,#0b0f1a));color:#fff;display:flex;flex-direction:column;align-items:center;gap:10px;padding:calc(env(safe-area-inset-top,0px) + 12px) 18px calc(env(safe-area-inset-bottom,0px) + 18px);transition:background .4s;overflow:auto}
.tptop{width:100%;max-width:440px;display:grid;grid-template-columns:36px 1fr 36px;align-items:center;text-align:center}.tptop .icon-btn{color:#fff}
.tpbar{width:100%;max-width:440px;height:6px;border-radius:9px;background:rgba(255,255,255,.25);overflow:hidden}.tpbar i{display:block;height:100%;width:0;background:#fff}
.tplabel{font-family:var(--display);font-size:40px;font-weight:700;margin-top:18px;text-align:center}
.tpsub{opacity:.88;text-align:center;font-size:15px}
.tpbig{font-size:min(30vw,140px);font-weight:700;line-height:1;margin:10px 0}
.tplaps{width:100%;max-width:360px;display:flex;flex-direction:column;gap:4px;max-height:30vh;overflow:auto}.tplaps div{display:flex;justify-content:space-between;background:rgba(255,255,255,.14);border-radius:10px;padding:6px 12px}
.tpbtns{width:100%;max-width:440px;display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:auto}
.tp .btn.ghost{background:rgba(255,255,255,.18);color:#fff}.tp .btn:not(.ghost){background:#fff;color:#111;box-shadow:none}
`;
document.head.appendChild(css);
try{if(S&&typeof render==="function")render(true)}catch(e){}
})();
