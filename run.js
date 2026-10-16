// Formwerk: Lauftrainer (Intervalle, Easy Run, Long Run)
(function(){
"use strict";
const E=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const WD=["Mo","Di","Mi","Do","Fr","Sa","So"],WDL=["Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag","Sonntag"];
const TYPES={iv:{name:"Intervalle",short:"INT",save:"Intervalle",color:"var(--hot,#E6407A)"},easy:{name:"Easy Run",short:"EASY",save:"Locker",color:"var(--c-coach)"},long:{name:"Long Run",short:"LONG",save:"Langer Lauf",color:"var(--c-run)"}};
const cfg=()=>(typeof S!=="undefined"&&S&&S.profile&&S.profile.runCfg)||null;
const lvl=()=>(S.profile.level||"mid");
const fmtP=s=>{s=Math.round(s);return Math.floor(s/60)+":"+String(s%60).padStart(2,"0")};
const parseT=v=>{let t=String(v||"").trim().replace(/[.,\s]+/g,":");if(t&&!t.includes(":")&&window.timeMask)t=window.timeMask(t);const p=t.split(":").map(Number);if(!p.length||p.some(isNaN))return 0;return p.reduce((a,x)=>a*60+x,0)};
const dIso=d=>iso(d);

// ---------- Pace-Zonen ----------
// Basis: 5-km-Pace (Sek./km). Aus Bestzeit, sonst aus den Läufen der letzten 8 Wochen geschätzt.
function p5(){
 const c=cfg();if(c&&c.ref5>0)return c.ref5/5;
 const since=daysAgo(56),cand=S.runs.filter(r=>r.date>=since&&r.km>=3&&r.km<=12&&r.sec>0).map(r=>r.sec/r.km);
 if(cand.length){const best=Math.min(...cand);return best/1.04}
 return{easy:390,mid:330,pro:280}[lvl()]||330;
}
function zones(){const b=p5();return{
 easy:[b*1.22,b*1.32],long:[b*1.25,b*1.35],tempo:[b*1.06,b*1.10],iv:[b*.97,b*1.01],trab:[b*1.4,b*1.6],base:b,est:!(cfg()&&cfg().ref5)}}
const zTxt=z=>fmtP(z[0])+"–"+fmtP(z[1])+" /km",zMid=z=>(z[0]+z[1])/2;

// ---------- Wochenzählung & Progression ----------
function weekIdx(){const c=cfg();if(!c||!c.start)return 0;return Math.max(0,Math.round((new Date(weekStart()+"T12:00")-new Date(c.start+"T12:00"))/(7*864e5)))}
const isDeload=w=>w%4===3;
// Intervall-Hauptteile: [Wiederholungen, Meter, Trabpause Sek.]
const IVS=[[6,400,90],[5,800,120],[4,1000,150],[6,400,90],[5,1000,150],[3,1600,180],[6,800,120],[4,800,120],[4,1200,150],[3,2000,180],[8,600,90],[5,600,90]];
function session(type,w){
 const z=zones(),L=lvl(),dl=isDeload(w),c=cfg()||{};
 if(type==="iv"){let[reps,m,rec]=IVS[w%IVS.length];if(L==="easy")reps=Math.max(3,reps-1);if(L==="pro")reps+=1;
  const ivSec=m/1000*zMid(z.iv),wu=12*60,cd=10*60;
  const segs=[{k:"wu",name:"Einlaufen",sec:wu,pace:z.easy,info:"Ganz locker, am Ende 3 kurze Steigerungen"}];
  for(let i=0;i<reps;i++){segs.push({k:"work",name:`Intervall ${i+1} von ${reps}`,sec:Math.round(ivSec),m,pace:z.iv,info:`${m} m zügig, gleichmässig`});if(i<reps-1)segs.push({k:"rec",name:"Trabpause",sec:rec,pace:z.trab,info:"Locker traben oder gehen"})}
  segs.push({k:"cd",name:"Auslaufen",sec:cd,pace:z.easy,info:"Locker auslaufen"});
  const km=wu/zMid(z.easy)+reps*m/1000+(reps-1)*rec/zMid(z.trab)+cd/zMid(z.easy);
  return{type,title:`Intervalle ${reps} × ${m>=1000?String(m/1000).replace(".",",")+" km":m+" m"}`,sub:`Pause ${rec>=120?(rec/60).toString().replace(".",",")+" Min.":rec+" Sek."} Trab · Ziel ${zTxt(z.iv)}`,segs,km,sec:segs.reduce((a,s)=>a+s.sec,0),dl};
 }
 if(type==="easy"){const base={easy:30,mid:40,pro:50}[L]||40,min=dl?base-5:base+Math.min(15,(w%4)*5);
  const segs=[{k:"run",name:"Easy Run",sec:min*60,pace:z.easy,info:"Locker, du kannst dich unterhalten"}];
  return{type,title:`Easy Run ${min} Min.`,sub:`Locker ${zTxt(z.easy)} · Puls niedrig`,segs,km:min*60/zMid(z.easy),sec:min*60,dl};
 }
 const start=c.longKm||{easy:8,mid:12,pro:16}[L],cap={easy:16,mid:24,pro:32}[L],block=Math.floor(w/4),inBlock=w%4;
 let km=Math.min(cap,start+block*2+Math.min(inBlock,2));if(dl)km=Math.max(start-2,Math.round(km*.75));
 const sec=km*zMid(z.long);
 return{type,title:`Long Run ${km} km`,sub:`Ruhig ${zTxt(z.long)} · trinken ab 60 Min.`,segs:[{k:"run",name:"Long Run",sec:Math.round(sec),km,pace:z.long,info:`${km} km gleichmässig ruhig`}],km,sec,dl};
}
function weekPlan(){const c=cfg();if(!c)return null;const w=weekIdx(),m={};[["iv",c.iv],["easy",c.easy],["long",c.long]].forEach(([t,d])=>{if(d!=null&&d>=0)m[d]=session(t,w)});return{w,days:m,deload:isDeload(w)}}
window.runWeekKm=function(){const p=weekPlan();if(!p)return 0;return Math.round(Object.values(p.days).reduce((a,s)=>a+s.km,0))};
window.runPlanOverlay=function(out){
 const p=weekPlan();if(!p||!(typeof trains==="function"&&trains("run")))return out;
 const res=out.map(x=>({...x})),displaced=[],c=cfg();
 for(let i=0;i<7;i++){if(p.days[i]){if(res[i].t==="Kraft")displaced.push(res[i]);res[i]={t:"Lauf",d:p.days[i].title,opt:false,run:p.days[i].type}}
  else if(res[i].t==="Lauf")res[i]={t:"Ruhetag",d:"Regeneration",opt:false}}
 for(const k of displaced){let best=-1;for(const pass of[0,1])for(let i=0;i<7&&best<0;i++){if(p.days[i]||res[i].t==="Kraft")continue;if(pass===0&&(i===(c.long+6)%7||i===(c.iv+6)%7))continue;best=i}if(best>=0)res[best]=k}
 return res;
};

// ---------- Karte im Lauf-Tab ----------
function doneOn(d){return S.runs.some(r=>r.date===d)}
window.runCardHTML=function(){
 const c=cfg();
 if(!c)return`<section class="card rcard"><div class="row between"><h2>Lauftrainer</h2><span class="pill">neu</span></div>
  <p class="small muted" style="margin:0">Dein Wochenplan mit <b>Intervallen</b>, <b>Easy Run</b> und <b>Long Run</b> am Wochenende. Mit Zielpace, Steigerung von Woche zu Woche und geführten Einheiten.</p>
  <button class="btn block" data-r="setup">Lauftrainer einrichten</button></section>`;
 const p=weekPlan(),z=zones(),today=TODAY(),ti=(new Date().getDay()+6)%7,ws=weekStart();
 const dates=Array.from({length:7},(_,i)=>{const d=new Date(ws+"T12:00");d.setDate(d.getDate()+i);return dIso(d)});
 // Heute oder nächste Einheit
 let ni=-1;for(let k=0;k<7;k++){const i=(ti+k)%7;if(p.days[i]&&!(k===0&&doneOn(today))&&(k>0||!doneOn(today))){ni=i;break}}
 const isToday=ni===ti&&!doneOn(today),s=ni>=0?p.days[ni]:null;
 const strip=dates.map((d,i)=>{const ses=p.days[i],done=ses&&doneOn(d);return`<div class="rday ${ses?"has":""} ${i===ti?"td":""} ${done?"done":""}" ${ses?`style="--rc:${TYPES[ses.type].color}"`:""}><span>${WD[i]}</span>${ses?`<b>${TYPES[ses.type].short}</b>`:"<b>·</b>"}${done?'<i>✓</i>':""}</div>`}).join("");
 const segList=s?(()=>{const g=[];let i=0;while(i<s.segs.length){const x=s.segs[i];if(x.k==="work"){let n=0;while(i<s.segs.length&&(s.segs[i].k==="work"||s.segs[i].k==="rec")){if(s.segs[i].k==="work")n++;i++}const r=s.segs.find(y=>y.k==="rec");g.push(`<li><b>${n} × ${x.m} m</b> in ${zTxt(x.pace)}${r?`, dazwischen ${r.sec>=120?(r.sec/60).toString().replace(".",",")+" Min.":r.sec+" Sek."} traben`:""}</li>`)}else{g.push(`<li><b>${E(x.name)}</b> ${x.km?x.km+" km":Math.round(x.sec/60)+" Min."} in ${zTxt(x.pace)}</li>`);i++}}return g.join("")})():"";
 return`<section class="card rcard"><div class="row between"><h2>Lauftrainer</h2><span class="pill ${p.deload?"warn":"acc"}">Woche ${p.w+1}${p.deload?" · Entlastung":""}</span></div>
 <div class="rstrip">${strip}</div>
 ${s?`<div class="rses" style="--rc:${TYPES[s.type].color}"><div class="eyebrow" style="color:var(--rc)">${isToday?"Heute":WDL[ni]}</div><div class="rtitle">${E(s.title)}</div><div class="small muted">${E(s.sub)}</div>
  <ul class="rsegs">${segList}</ul><div class="small">ca. <b>${de(r1(s.km))} km</b> · <b>${Math.round(s.sec/60)} Min.</b></div>
  ${isToday?`<button class="btn block" data-r="start" data-t="${s.type}">Einheit geführt starten</button>`:`<button class="btn ghost block" data-r="start" data-t="${s.type}">Trotzdem heute laufen</button>`}</div>`
  :`<div class="tip good"><i></i><div class="small">Alle Läufe dieser Woche erledigt. Stark!</div></div>`}
 ${p.deload?`<div class="small muted">Entlastungswoche: etwas weniger Umfang, damit dein Körper sich anpasst. Nächste Woche geht es wieder aufwärts.</div>`:""}
 <details class="small"><summary style="font-weight:700;cursor:pointer">Deine Pace-Zonen${z.est?" (geschätzt)":""}</summary><div class="list" style="margin-top:6px">
  <div class="li"><div class="grow">Easy Run</div><b class="num">${zTxt(z.easy)}</b></div><div class="li"><div class="grow">Long Run</div><b class="num">${zTxt(z.long)}</b></div>
  <div class="li"><div class="grow">Tempo / Schwelle</div><b class="num">${zTxt(z.tempo)}</b></div><div class="li"><div class="grow">Intervalle</div><b class="num">${zTxt(z.iv)}</b></div></div>
  <div class="muted" style="margin-top:6px">${z.est?"Aus deinen Läufen geschätzt. Trag in den Einstellungen deine 5-km-Bestzeit ein, dann werden die Zonen genauer.":"Berechnet aus deiner 5-km-Zeit von "+fmtP(cfg().ref5)+" Min."}</div></details>
 <div class="row between"><span class="small muted">Wochenumfang ca. ${window.runWeekKm()} km</span><button class="link small" data-r="setup">Einstellungen</button></div></section>`;
};

// ---------- Einrichten ----------
let SET=null;
function drawSetup(){
 const h=host("rsetup"),c=SET;
 const chips=k=>`<div class="rchips">${WD.map((d,i)=>`<button class="chip" data-r="day" data-k="${k}" data-i="${i}" aria-pressed="${c[k]===i}" ${["iv","easy","long"].some(o=>o!==k&&c[o]===i)?"disabled":""}>${d}</button>`).join("")}</div>`;
 h.innerHTML=`<div class="scrim" data-r="scrim"><div class="sheet" role="dialog" aria-modal="true" aria-label="Lauftrainer einrichten"><div class="grab"></div>
 <div class="row between"><h2>Lauftrainer</h2><button class="icon-btn" data-r="close" aria-label="Schliessen">${I.x}</button></div>
 <p class="small muted" style="margin:0">Wähle die Tage für deine drei Läufe. Zwischen Intervallen und Long Run sollte mindestens ein Tag liegen.</p>
 <div><div class="rlab" style="--rc:${TYPES.iv.color}">Intervalle</div>${chips("iv")}</div>
 <div><div class="rlab" style="--rc:${TYPES.easy.color}">Easy Run</div>${chips("easy")}</div>
 <div><div class="rlab" style="--rc:${TYPES.long.color}">Long Run</div>${chips("long")}</div>
 ${Math.abs(c.iv-c.long)===1||Math.abs(c.iv-c.long)===6?`<div class="tip warn"><i></i><div class="small">Intervalle direkt neben dem Long Run sind hart. Wenn möglich einen Tag Abstand lassen.</div></div>`:""}
 <div class="grid2"><label class="f">5-km-Bestzeit (optional)<input id="r-ref" inputmode="numeric" data-time placeholder="z. B. 25:30" value="${c.ref5?fmtP(c.ref5):""}"></label><label class="f">Aktueller Long Run (km)<input id="r-long" inputmode="decimal" placeholder="${{easy:8,mid:12,pro:16}[lvl()]}" value="${c.longKm||""}"></label></div>
 <label class="f">Dein Level<select id="r-lvl"><option value="easy" ${lvl()==="easy"?"selected":""}>Einsteiger</option><option value="mid" ${lvl()==="mid"?"selected":""}>Fortgeschritten</option><option value="pro" ${lvl()==="pro"?"selected":""}>Ambitioniert</option></select></label>
 <button class="btn block" data-r="save">Plan speichern</button>
 ${cfg()?`<button class="glink" style="align-self:center;color:var(--muted)" data-r="restart">Plan neu bei Woche 1 beginnen</button>`:""}</div></div>`;
}
function host(id){let h=document.getElementById(id);if(!h){h=document.createElement("div");h.id=id;document.body.appendChild(h)}return h}

// ---------- Geführter Lauf ----------
let RUN=null; // {type, ses, i, segStart, segM, t0, paused, pausedAt, iv}
let AC=null;
function beep(f=880,d=.16,n=1){try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();for(let i=0;i<n;i++){const o=AC.createOscillator(),g=AC.createGain(),t=AC.currentTime+i*.22;o.frequency.value=f;o.connect(g);g.connect(AC.destination);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.3,t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.start(t);o.stop(t+d+.02)}}catch(e){}
 try{navigator.vibrate&&navigator.vibrate(n>1?[200,100,200]:150)}catch(e){}}
function startRun(type){
 const ses=session(type,weekIdx());
 if(W.running){toast("Es läuft schon eine Aufzeichnung");return}
 G.m=0;W.running=true;W.start=Date.now();W.acc=0;if(typeof gpsStart==="function")gpsStart();
 RUN={type,ses,i:0,segStart:Date.now(),segM:0,t0:Date.now(),pausedMs:0,paused:false};beep(660,.05);
 RUN.iv=setInterval(tickRun,250);drawRun();
}
const elapsedAll=()=>RUN?((RUN.paused?RUN.pausedAt:Date.now())-RUN.t0-RUN.pausedMs)/1000:0;
const segElapsed=()=>RUN?((RUN.paused?RUN.pausedAt:Date.now())-RUN.segStart)/1000:0;
function nextSeg(auto){
 if(!RUN)return;RUN.i++;
 if(RUN.i>=RUN.ses.segs.length){finishRun();return}
 RUN.segStart=Date.now();RUN.segM=G.m;RUN.warned=false;
 const s=RUN.ses.segs[RUN.i];beep(s.k==="work"?990:660,.2,s.k==="work"?2:1);drawRun();
}
function tickRun(){
 if(!RUN||RUN.paused)return;const s=RUN.ses.segs[RUN.i],left=s.sec-segElapsed();
 if(left<=3.2&&left>0&&!RUN.warned){RUN.warned=true;beep(520,.08)}
 if(left<=0&&s.k!=="run"){nextSeg(true);return}
 const el=document.getElementById("rtime"),pc=document.getElementById("rpace2"),km=document.getElementById("rkm2"),tot=document.getElementById("rtot"),bar=document.getElementById("rbar");
 if(el)el.textContent=s.k==="run"?fmtP(segElapsed()):fmtP(Math.max(0,left));
 const dm=G.m-RUN.segM,se=segElapsed();
 if(pc)pc.textContent=dm>60?fmtP(se/(dm/1000)):"–";
 if(km)km.textContent=de(r1(G.m/1000));if(tot)tot.textContent=fmtP(elapsedAll());
 if(bar)bar.style.width=Math.min(100,s.k==="run"&&s.km?(dm/1000)/s.km*100:se/s.sec*100)+"%";
 const pace=dm>60?se/(dm/1000):0,hint=document.getElementById("rhint");
 if(hint&&pace){hint.textContent=pace<s.pace[0]-5?"Etwas langsamer":pace>s.pace[1]+5?"Etwas schneller":"Perfektes Tempo";hint.className="rhint "+(pace<s.pace[0]-5||pace>s.pace[1]+5?"warn":"good")}
}
function drawRun(){
 const h=host("rrun"),s=RUN.ses.segs[RUN.i],n=RUN.ses.segs.length,col=TYPES[RUN.type].color,nx=RUN.ses.segs[RUN.i+1];
 h.innerHTML=`<div class="rp" style="--rc:${s.k==="work"?TYPES.iv.color:s.k==="rec"?"var(--c-coach)":col}">
 <div class="rptop"><button class="icon-btn" data-r="stop" aria-label="Beenden">${I.x}</button><div class="eyebrow" style="color:#fff;opacity:.85">${E(RUN.ses.title)}</div><span class="small" style="opacity:.8">${RUN.i+1}/${n}</span></div>
 <div class="rpbar"><i id="rbar"></i></div>
 <div class="rpname">${E(s.name)}</div><div class="rpinfo">${E(s.info)}</div>
 <div class="rpbig num" id="rtime">${s.k==="run"?"0:00":fmtP(s.sec)}</div>
 <div class="rpsub">${s.k==="run"?(s.km?"Ziel "+s.km+" km":"Ziel "+Math.round(s.sec/60)+" Min."):"verbleibend"}</div>
 <div class="rpgrid"><div><span>Ziel-Pace</span><b class="num">${zTxt(s.pace).replace(" /km","")}</b></div><div><span>Deine Pace</span><b class="num" id="rpace2">–</b></div><div><span>Distanz</span><b class="num"><span id="rkm2">0</span> km</b></div><div><span>Gesamt</span><b class="num" id="rtot">0:00</b></div></div>
 <div id="rhint" class="rhint"></div>
 ${nx?`<div class="rpnext">Danach: <b>${E(nx.name)}</b> · ${nx.km?nx.km+" km":fmtP(nx.sec)}</div>`:""}
 <div class="rpbtns"><button class="btn ghost" data-r="pause">${RUN.paused?"Weiter":"Pause"}</button><button class="btn" data-r="next">${RUN.i<n-1?"Nächster Abschnitt":"Lauf beenden"}</button></div>
 <div class="small" style="text-align:center;opacity:.75">Lass die App geöffnet. Bei gesperrtem Bildschirm pausiert GPS.</div></div>`;
 tickRun();
}
function finishRun(){
 clearInterval(RUN.iv);if(typeof gpsStop==="function")gpsStop();W.running=false;
 const sec=Math.round(elapsedAll()),gkm=G.m/1000,km=gkm>=.3?r1(gkm):r1(RUN.ses.km*(sec/RUN.ses.sec));
 RUN.result={sec,km,gps:gkm>=.3};
 const h=host("rrun");
 h.innerHTML=`<div class="rp done" style="--rc:${TYPES[RUN.type].color}"><div class="rptop"><span></span><div class="eyebrow" style="color:#fff">Geschafft</div><span></span></div>
 <div class="rpname" style="margin-top:24px">${E(RUN.ses.title)}</div><div class="rpinfo">${RUN.result.gps?"Distanz per GPS gemessen":"Ohne GPS: Distanz aus deinem Plan geschätzt. Bitte prüfen."}</div>
 <div class="grid2" style="width:100%;max-width:360px"><label class="f" style="color:#fff">Distanz (km)<input id="rf-km" inputmode="decimal" value="${km>0?String(km).replace(".",","):""}" placeholder="z. B. 6,2"></label><label class="f" style="color:#fff">Dauer<input id="rf-t" inputmode="numeric" data-time value="${fmtP(sec)}"></label></div>
 <div class="rpbtns"><button class="btn ghost" data-r="discard">Verwerfen</button><button class="btn" data-r="saverun">Lauf speichern</button></div></div>`;
 beep(990,.25,2);
}
function closeRun(){if(RUN&&RUN.iv)clearInterval(RUN.iv);RUN=null;const h=document.getElementById("rrun");if(h)h.innerHTML="";W.running=false;W.acc=0;G.m=0;if(typeof wakeOff==="function")wakeOff();if(typeof render==="function")render(true)}

// ---------- Ereignisse ----------
document.addEventListener("click",ev=>{
 const b=ev.target.closest("[data-r]");if(!b)return;const k=b.dataset.r;
 if(k==="scrim"&&ev.target!==b)return;
 switch(k){
  case"setup":{const c=cfg()||{};SET={iv:c.iv!=null?c.iv:1,easy:c.easy!=null?c.easy:3,long:c.long!=null?c.long:6,ref5:c.ref5||0,longKm:c.longKm||""};drawSetup();break}
  case"close":case"scrim":host("rsetup").innerHTML="";SET=null;break;
  case"day":{const i=+b.dataset.i,key=b.dataset.k;SET.ref5=parseT(document.getElementById("r-ref").value)||0;SET.longKm=parseFloat(String(document.getElementById("r-long").value).replace(",","."))||"";SET[key]=i;drawSetup();break}
  case"save":case"restart":{const ref=parseT(document.getElementById("r-ref").value),lk=parseFloat(String(document.getElementById("r-long").value).replace(",","."));
   if(document.getElementById("r-ref").value.trim()&&!(ref>600&&ref<3600)){toast("Bitte die 5-km-Zeit eingeben, z. B. 2530 für 25:30");break}
   const old=cfg();S.profile.level=document.getElementById("r-lvl").value;
   S.profile.runCfg={iv:SET.iv,easy:SET.easy,long:SET.long,ref5:ref||0,longKm:lk>0?lk:0,start:k==="restart"||!old?weekStart():old.start};
   if(S.profile.train==="strength"||S.profile.train==="none")S.profile.train=S.profile.train==="strength"?"both":"run";
   save();host("rsetup").innerHTML="";SET=null;if(typeof render==="function")render(true);toast("Lauftrainer gespeichert");break}
  case"start":startRun(b.dataset.t);break;
  case"pause":if(!RUN)break;if(RUN.paused){const d=Date.now()-RUN.pausedAt;RUN.pausedMs+=d;RUN.segStart+=d;RUN.paused=false;W.running=true;if(typeof gpsStart==="function")gpsStart()}else{RUN.paused=true;RUN.pausedAt=Date.now();W.running=false;if(typeof gpsStop==="function")gpsStop()}drawRun();break;
  case"next":nextSeg(false);break;
  case"stop":if(RUN&&RUN.iv){finishRun()}break;
  case"discard":closeRun();toast("Lauf verworfen");break;
  case"saverun":{const km=parseFloat(String(document.getElementById("rf-km").value).replace(",",".")),sec=parseT(document.getElementById("rf-t").value);
   if(!(km>0)||!(sec>0)){toast("Bitte Distanz und Dauer prüfen");break}
   S.runs.push({id:uid(),date:TODAY(),km:r1(km),sec,type:TYPES[RUN.type].save,via:"Lauftrainer",title:RUN.ses.title});save();const t=RUN.ses.title;closeRun();toast("Gespeichert: "+t);break}
 }
});
const css=document.createElement("style");
css.textContent=`
.rcard{gap:12px}
.rstrip{display:grid;grid-template-columns:repeat(7,1fr);gap:4px}
.rday{position:relative;display:flex;flex-direction:column;align-items:center;gap:2px;padding:7px 0;border-radius:10px;background:var(--surface2);font-size:11px;color:var(--muted);font-weight:600}
.rday b{font-size:10px;letter-spacing:.04em}
.rday.has{background:color-mix(in srgb,var(--rc) 16%,var(--surface));color:var(--fg)}.rday.has b{color:var(--rc)}
.rday.td{box-shadow:inset 0 0 0 2px var(--sec)}
.rday.done{background:var(--rc);color:#fff}.rday.done b{color:#fff}
.rday i{position:absolute;top:2px;right:4px;font-style:normal;font-size:10px}
.rses{border-radius:14px;padding:14px;display:flex;flex-direction:column;gap:6px;background:color-mix(in srgb,var(--rc) 10%,var(--surface))}
.rtitle{font-family:var(--display);font-size:26px;font-weight:700;line-height:1.1}
.rsegs{margin:4px 0;padding-left:18px;display:flex;flex-direction:column;gap:4px;font-size:14px}
.rchips{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-top:6px}.rchips .chip{padding:8px 0;text-align:center}.rchips .chip:disabled{opacity:.3}
.rlab{font-weight:700;display:flex;align-items:center;gap:8px}.rlab::before{content:"";width:10px;height:10px;border-radius:50%;background:var(--rc)}
.rp{position:fixed;inset:0;z-index:48;background:linear-gradient(170deg,var(--rc),color-mix(in srgb,var(--rc) 55%,#0b0f1a));color:#fff;display:flex;flex-direction:column;align-items:center;gap:10px;padding:calc(env(safe-area-inset-top,0px) + 12px) 18px calc(env(safe-area-inset-bottom,0px) + 18px);overflow:auto;transition:background .4s}
.rptop{width:100%;max-width:440px;display:grid;grid-template-columns:36px 1fr 36px;align-items:center;text-align:center}.rptop .icon-btn{color:#fff}
.rpbar{width:100%;max-width:440px;height:6px;border-radius:9px;background:rgba(255,255,255,.25);overflow:hidden}.rpbar i{display:block;height:100%;width:0;background:#fff;border-radius:9px;transition:width .25s linear}
.rpname{font-family:var(--display);font-size:32px;font-weight:700;margin-top:10px;text-align:center}
.rpinfo{opacity:.85;text-align:center;font-size:15px}
.rpbig{font-size:96px;font-weight:700;line-height:1;margin-top:6px}
.rpsub{opacity:.8;margin-top:-4px}
.rpgrid{width:100%;max-width:440px;display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}
.rpgrid div{background:rgba(255,255,255,.14);border-radius:14px;padding:10px 12px;display:flex;flex-direction:column}.rpgrid span{font-size:11px;letter-spacing:.06em;text-transform:uppercase;opacity:.8;font-weight:700}.rpgrid b{font-size:24px}
.rhint{min-height:24px;font-weight:700;padding:3px 12px;border-radius:999px}.rhint.good{background:rgba(255,255,255,.2)}.rhint.warn{background:#fff;color:#111}
.rpnext{opacity:.9;font-size:14px}
.rpbtns{width:100%;max-width:440px;display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:auto}
.rp .btn.ghost{background:rgba(255,255,255,.18);color:#fff}.rp .btn:not(.ghost){background:#fff;color:#111;box-shadow:none}
.rp input{background:rgba(255,255,255,.18);color:#fff;border-color:transparent}
`;
document.head.appendChild(css);
try{if(S&&typeof render==="function")render(true)}catch(e){}
})();
