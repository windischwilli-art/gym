// Formwerk: Lauftrainer (Intervalle, Easy Run, Long Run)
(function(){
"use strict";
const E=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const WD=["Mo","Di","Mi","Do","Fr","Sa","So"],WDL=["Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag","Sonntag"];
const TYPES={iv:{name:"Intervalle",short:"INT",save:"Intervalle",color:"var(--hot,#E6407A)"},easy:{name:"Easy Run",short:"EASY",save:"Locker",color:"var(--c-coach)"},long:{name:"Long Run",short:"LONG",save:"Langer Lauf",color:"var(--c-run)"},race:{name:"Wettkampf",short:"RACE",save:"Wettkampf",color:"#F59E0B"}};
const cfg=()=>(typeof S!=="undefined"&&S&&S.profile&&S.profile.runCfg)||null;
const lvl=()=>(S.profile.level||"mid");
const fmtP=s=>{s=Math.round(s);return Math.floor(s/60)+":"+String(s%60).padStart(2,"0")};
const parseT=v=>{let t=String(v||"").trim().replace(/[.,\s]+/g,":");if(t&&!t.includes(":")&&window.timeMask)t=window.timeMask(t);const p=t.split(":").map(Number);if(!p.length||p.some(isNaN))return 0;return p.reduce((a,x)=>a*60+x,0)};
const dIso=d=>iso(d);

// ---------- Wettkampf-Ziel ----------
const DAY=864e5;
const addD=(d,n)=>{const x=new Date(d+"T12:00");x.setDate(x.getDate()+n);return dIso(x)};
const wsOf=d=>{const x=new Date(d+"T12:00");x.setDate(x.getDate()-(x.getDay()+6)%7);return dIso(x)};
const wkBetween=(a,b)=>Math.round((new Date(b+"T12:00")-new Date(a+"T12:00"))/(7*DAY));
const riegel=(t,d1,d2)=>t*Math.pow(d2/d1,1.06);
const fmtH=s=>{s=Math.round(s);const h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60;return h?h+":"+String(m).padStart(2,"0")+":"+String(x).padStart(2,"0"):m+":"+String(x).padStart(2,"0")};
const fDate=d=>{const x=new Date(d+"T12:00");return x.getDate()+"."+(x.getMonth()+1)+"."};
const fDateL=d=>new Date(d+"T12:00").toLocaleDateString("de-CH",{weekday:"short",day:"numeric",month:"long",year:"numeric"});
const RD={
 "5":{km:5,name:"5 km",taper:1,spec:3,min:4,peak:{easy:10,mid:12,pro:14}},
 "10":{km:10,name:"10 km",taper:1,spec:4,min:6,peak:{easy:12,mid:15,pro:18}},
 hm:{km:21.0975,name:"Halbmarathon",taper:2,spec:5,min:8,peak:{easy:18,mid:20,pro:22}},
 m:{km:42.195,name:"Marathon",taper:3,spec:6,min:12,peak:{easy:28,mid:32,pro:34}}
};
// Qualitätseinheiten in der spezifischen Phase: [Wdh., Meter, Trabpause Sek., Tempo]
const QS={
 "5":[[5,1000,120,"rp"],[6,800,90,"rp"],[3,1600,150,"iv"],[10,400,60,"rp"]],
 "10":[[5,1000,90,"rp"],[6,800,90,"iv"],[3,2000,120,"rp"],[4,1600,90,"rp"],[2,3000,150,"rp"]],
 hm:[[3,3000,120,"rp"],[1,6000,0,"tempo"],[2,5000,180,"rp"],[4,2000,90,"tempo"],[1,10000,0,"rp"]],
 m:[[3,4000,120,"rp"],[1,8000,0,"tempo"],[2,6000,180,"rp"],[1,12000,0,"rp"],[3,5000,150,"rp"]]
};
const race=()=>{const c=cfg();return c&&c.race&&c.race.date>=TODAY()?c.race:null};
const racePast=()=>{const c=cfg();return c&&c.race&&c.race.date<TODAY()?c.race:null};
function rinfo(ws){
 const r=race();if(!r)return null;const d=RD[r.key],rws=wsOf(r.date);
 const T=Math.max(1,wkBetween(r.start,rws)+1),wtg=wkBetween(ws,rws),i=T-1-wtg;
 if(wtg<0||i<0)return null;
 const ph=wtg===0?"race":wtg<d.taper?"taper":wtg<d.taper+d.spec?"spec":"base";
 return{r,d,T,wtg,i,ph,iPeak:Math.max(1,T-1-d.taper),deload:(ph==="base"||ph==="spec")&&i%4===3&&wtg>d.taper,rd:(new Date(r.date+"T12:00").getDay()+6)%7}
}
const PHASE={base:"Grundlage",spec:"Wettkampfspezifisch",taper:"Tapering",race:"Rennwoche"};
const PHASEINFO={base:"Ausdauer aufbauen, Long Run wird länger, Intervalle für die Grundschnelligkeit.",spec:"Training im Renntempo und an der Schwelle. Jetzt wird es konkret.",taper:"Weniger Umfang, Tempo bleibt. Die Beine werden frisch für den Renntag.",race:"Kurz und knackig aktivieren, viel schlafen, gut essen. Dann: Rennen!"};
function prediction(r){return r&&r.refSec?riegel(r.refSec,r.refKm||5,RD[r.key].km):0}

// ---------- Pace-Zonen ----------
// Basis: 5-km-Pace (Sek./km). Aus Bestzeit, sonst aus den Läufen der letzten 8 Wochen geschätzt.
let ZW=null; // Woche, für die gerade gerechnet wird (Wettkampfplan)
function p5base(){
 const c=cfg();if(c&&c.ref5>0)return c.ref5/5;
 const since=daysAgo(56),cand=S.runs.filter(r=>r.date>=since&&r.km>=3&&r.km<=12&&r.sec>0).map(r=>r.sec/r.km);
 if(cand.length){const best=Math.min(...cand);return best/1.04}
 return{easy:390,mid:330,pro:280}[lvl()]||330;
}
function p5(){
 const cur=p5base(),inf=rinfo(ZW||weekStart());if(!inf)return cur;
 // Mit Ziel: Trainingstempo wandert von heute Richtung Zielform (höchstens 7 % schneller)
 const goal5=riegel(inf.r.goal,inf.d.km,5)/5,tgt=Math.max(goal5,cur*.93);if(tgt>=cur)return cur;
 return cur+(tgt-cur)*Math.min(1,inf.i/inf.iPeak);
}
function zones(){const b=p5(),inf=rinfo(ZW||weekStart()),gp=inf?inf.r.goal/inf.d.km:0;return{
 easy:[b*1.22,b*1.32],long:[b*1.25,b*1.35],tempo:[b*1.06,b*1.10],iv:[b*.97,b*1.01],trab:[b*1.4,b*1.6],rp:gp?[gp-3,gp+3]:null,base:b,est:!(cfg()&&cfg().ref5)}}
const zTxt=z=>fmtP(z[0])+"–"+fmtP(z[1])+" /km",zMid=z=>(z[0]+z[1])/2;

// ---------- Wochenzählung & Progression ----------
function weekIdx(){const c=cfg();if(!c||!c.start)return 0;return Math.max(0,Math.round((new Date(weekStart()+"T12:00")-new Date(c.start+"T12:00"))/(7*864e5)))}
const isDeload=w=>w%4===3;
// Intervall-Hauptteile: [Wiederholungen, Meter, Trabpause Sek.]
const IVS=[[6,400,90],[5,800,120],[4,1000,150],[6,400,90],[5,1000,150],[3,1600,180],[6,800,120],[4,800,120],[4,1200,150],[3,2000,180],[8,600,90],[5,600,90]];
const kmTxt=m=>m>=1000?String(m/1000).replace(".",",")+" km":m+" m";
const recTxt=r=>r>=120?(r/60).toString().replace(".",",")+" Min.":r+" Sek.";
// Baut eine Tempo-/Intervall-Einheit mit Ein- und Auslaufen
function qualSes(reps,m,rec,pk,z,dl,wuMin){
 const pace=z[pk]||z.iv,wu=(wuMin||12)*60,cd=10*60,pn={iv:"Intervalltempo",rp:"Renntempo",tempo:"Schwellentempo"}[pk];
 const segs=[{k:"wu",name:"Einlaufen",sec:wu,pace:z.easy,info:"Ganz locker, am Ende 3 kurze Steigerungen"}];
 const workSec=Math.round(m/1000*zMid(pace));
 for(let i=0;i<reps;i++){segs.push({k:"work",name:reps>1?`${pk==="iv"?"Intervall":"Abschnitt"} ${i+1} von ${reps}`:(pk==="rp"?"Renntempo":"Tempolauf"),sec:workSec,m,pace,info:`${kmTxt(m)} im ${pn}`});if(i<reps-1&&rec)segs.push({k:"rec",name:"Trabpause",sec:rec,pace:z.trab,info:"Locker traben oder gehen"})}
 segs.push({k:"cd",name:"Auslaufen",sec:cd,pace:z.easy,info:"Locker auslaufen"});
 const km=wu/zMid(z.easy)+reps*m/1000+(reps-1)*(rec||0)/zMid(z.trab)+cd/zMid(z.easy);
 const title=reps===1?(pk==="rp"?`${kmTxt(m)} im Renntempo`:`Tempolauf ${kmTxt(m)}`):`${pk==="iv"?"Intervalle":pk==="rp"?"Renntempo":"Schwelle"} ${reps} × ${kmTxt(m)}`;
 return{type:"iv",title,sub:`${rec&&reps>1?"Pause "+recTxt(rec)+" Trab · ":""}Ziel ${zTxt(pace)}`,segs,km,sec:segs.reduce((a,s)=>a+s.sec,0),dl};
}
function session(type,w){
 const z=zones(),L=lvl(),dl=isDeload(w),c=cfg()||{};
 if(type==="iv"){let[reps,m,rec]=IVS[w%IVS.length];if(L==="easy")reps=Math.max(3,reps-1);if(L==="pro")reps+=1;return qualSes(reps,m,rec,"iv",z,dl)}
 if(type==="easy"){const base={easy:30,mid:40,pro:50}[L]||40,min=dl?base-5:base+Math.min(15,(w%4)*5);
  const segs=[{k:"run",name:"Easy Run",sec:min*60,pace:z.easy,info:"Locker, du kannst dich unterhalten"}];
  return{type,title:`Easy Run ${min} Min.`,sub:`Locker ${zTxt(z.easy)} · Puls niedrig`,segs,km:min*60/zMid(z.easy),sec:min*60,dl};
 }
 const start=c.longKm||{easy:8,mid:12,pro:16}[L],cap={easy:16,mid:24,pro:32}[L],block=Math.floor(w/4),inBlock=w%4;
 let km=Math.min(cap,start+block*2+Math.min(inBlock,2));if(dl)km=Math.max(start-2,Math.round(km*.75));
 return longSes(km,0,z,dl);
}
function longSes(km,rpKm,z,dl){
 const a=km-rpKm,segs=[{k:"run",name:rpKm?"Long Run ruhig":"Long Run",sec:Math.round(a*zMid(z.long)),km:a,pace:z.long,info:`${a} km gleichmässig ruhig`}];
 if(rpKm)segs.push({k:"run",name:"Renntempo",sec:Math.round(rpKm*zMid(z.rp)),km:rpKm,pace:z.rp,info:`Die letzten ${rpKm} km im Renntempo`});
 return{type:"long",title:`Long Run ${km} km`+(rpKm?`, davon ${rpKm} im Renntempo`:""),sub:`Ruhig ${zTxt(z.long)}${rpKm?" · Schluss "+zTxt(z.rp):""} · trinken ab 60 Min.`,segs,km,sec:segs.reduce((x,s)=>x+s.sec,0),dl};
}
// Einheit im Wettkampfplan
function raceSession(type,inf){
 const z=zones(),L=lvl(),{d,r,ph,i,wtg,deload}=inf,key=r.key,c=cfg()||{};
 if(type==="race")return{type:"race",title:`${r.name||d.name}: Wettkampf`,sub:`Ziel ${fmtH(r.goal)} · ${zTxt(z.rp)}`,segs:[{k:"run",name:r.name||d.name,km:Math.round(d.km*10)/10,sec:r.goal,pace:z.rp,info:"Gleichmässig im Zieltempo starten. Ab der Hälfte steigern, wenn es geht."}],km:d.km,sec:r.goal,dl:false};
 if(type==="iv"){
  if(ph==="race"){const s=qualSes(4,200,90,"rp",z,false,15);s.segs[s.segs.length-1].sec=5*60;s.title="Aktivierung 4 × 200 m";s.sub="Kurz, locker, im Renntempo · keine Ermüdung";s.sec=s.segs.reduce((a,x)=>a+x.sec,0);s.km=15*60/zMid(z.easy)+.8+5*60/zMid(z.easy);return s}
  if(ph==="base"){if(key==="m"&&i%2===1)return qualSes(1,Math.min(10000,5000+Math.floor(i/2)*1000),0,"tempo",z,deload);
   let[reps,m,rec]=IVS[i%IVS.length];if(L==="easy")reps=Math.max(3,reps-1);if(L==="pro")reps+=1;if(deload)reps=Math.max(3,reps-1);return qualSes(reps,m,rec,"iv",z,deload)}
  const list=QS[key],specI=Math.max(0,d.spec-(wtg-d.taper)-1);let[reps,m,rec,pk]=list[(ph==="taper"?d.spec-1:specI)%list.length];
  if(reps>=3){if(L==="easy")reps--;if(L==="pro")reps++}
  if(ph==="taper"){if(reps>1)reps=Math.max(2,Math.ceil(reps*.6));else m=Math.max(3000,Math.round(m*.6/1000)*1000)}
  if(deload){if(reps>2)reps--;else if(reps===1)m=Math.max(3000,m-2000)}
  return qualSes(reps,m,rec,pk,z,deload);
 }
 if(type==="easy"){let min=({easy:30,mid:40,pro:50}[L]||40)+(key==="m"?10:key==="hm"?5:0);
  if(ph==="spec")min+=5;if(ph==="taper")min-=10;if(deload)min-=5;if(ph==="race")min=20;
  const segs=[{k:"run",name:ph==="race"?"Lockerer Lauf":"Easy Run",sec:min*60,pace:z.easy,info:ph==="race"?"Ganz locker, Beine lockern":"Locker, du kannst dich unterhalten"}];
  return{type:"easy",title:`${ph==="race"?"Lockerer Lauf":"Easy Run"} ${min} Min.`,sub:`Locker ${zTxt(z.easy)} · Puls niedrig`,segs,km:min*60/zMid(z.easy),sec:min*60,dl:deload};
 }
 const L0=c.longKm||{easy:8,mid:12,pro:16}[L],P=Math.max(L0,d.peak[L]);let km,rp=0;
 if(ph==="taper")km=Math.round(P*(wtg===1?(key==="m"?.5:.6):.72));
 else{km=Math.round(Math.min(L0+(P-L0)*Math.min(1,i/inf.iPeak),L0+2*i));if(deload)km=Math.max(L0-2,Math.round(km*.78))}
 if(ph==="spec"&&!deload&&i%2===0){if(key==="hm")rp=Math.min(6,Math.round(km*.3));if(key==="m")rp=Math.min(12,Math.round(km*.35));if(key==="10")rp=0}
 return longSes(km,rp,z,deload);
}
function weekPlan(ws){
 const c=cfg();if(!c)return null;ws=ws||weekStart();ZW=ws;
 try{
  const inf=rinfo(ws),m={};
  if(inf){
   [["iv",c.iv],["easy",c.easy],["long",c.long]].forEach(([t,d])=>{if(d==null||d<0)return;
    if(inf.ph==="race"){if(t==="long"||d>=inf.rd)return;if(t==="iv"&&d>inf.rd-2)return}
    m[d]=raceSession(t,inf)});
   if(inf.ph==="race")m[inf.rd]=raceSession("race",inf);
   return{w:inf.i,days:m,deload:inf.deload,inf};
  }
  const w=ws===weekStart()?weekIdx():Math.max(0,wkBetween(c.start,ws));
  [["iv",c.iv],["easy",c.easy],["long",c.long]].forEach(([t,d])=>{if(d!=null&&d>=0)m[d]=session(t,w)});return{w,days:m,deload:isDeload(w)};
 }finally{ZW=null}
}
window.runWeekKm=function(){const p=weekPlan();if(!p)return 0;return Math.round(Object.values(p.days).reduce((a,s)=>a+s.km,0))};
window.runPlanOverlay=function(out){
 const p=weekPlan();if(!p||!(typeof trains==="function"&&trains("run")))return out;
 const res=out.map(x=>({...x})),displaced=[],c=cfg();
 for(let i=0;i<7;i++){if(p.days[i]){if(res[i].t==="Kraft")displaced.push(res[i]);res[i]={t:"Lauf",d:(p.days[i].type==="race"?"🏁 ":"")+p.days[i].title,opt:false,run:p.days[i].type}}
  else if(res[i].t==="Lauf")res[i]={t:"Ruhetag",d:"Regeneration",opt:false}}
 // In der Rennwoche keine Kraft mehr kurz vor dem Rennen
 if(p.inf&&p.inf.ph==="race")for(let i=Math.max(0,p.inf.rd-2);i<7;i++)if(res[i].t==="Kraft"){res[i]={t:"Ruhetag",d:i>p.inf.rd?"Erholung nach dem Rennen":"Frisch bleiben fürs Rennen",opt:false}}
 for(const k of displaced){let best=-1;for(const pass of[0,1])for(let i=0;i<7&&best<0;i++){if(p.days[i]||res[i].t==="Kraft"||res[i].t==="Ruhetag"&&p.inf&&p.inf.ph==="race")continue;if(pass===0&&(i===(c.long+6)%7||i===(c.iv+6)%7))continue;best=i}if(best>=0)res[best]=k}
 return res;
};

// ---------- Karte im Lauf-Tab ----------
function doneOn(d){return S.runs.some(r=>r.date===d)}
function segListHTML(s){const g=[];let i=0;while(i<s.segs.length){const x=s.segs[i];if(x.k==="work"&&s.segs.filter(y=>y.k==="work").length>1){let n=0;while(i<s.segs.length&&(s.segs[i].k==="work"||s.segs[i].k==="rec")){if(s.segs[i].k==="work")n++;i++}const r=s.segs.find(y=>y.k==="rec");g.push(`<li><b>${n} × ${kmTxt(x.m)}</b> in ${zTxt(x.pace)}${r?`, dazwischen ${recTxt(r.sec)} traben`:""}</li>`)}else{g.push(`<li><b>${E(x.name)}</b> ${x.m?kmTxt(x.m):x.km?de(x.km)+" km":Math.round(x.sec/60)+" Min."} in ${zTxt(x.pace)}</li>`);i++}}return g.join("")}
function raceHead(p){
 const inf=p.inf,r=inf.r,pred=prediction(r),days=Math.round((new Date(r.date+"T12:00")-new Date(TODAY()+"T12:00"))/DAY);
 const ratio=pred?r.goal/pred:0,real=!pred?"":ratio>=1?["good","Realistisch, deine aktuelle Form reicht schon"]:ratio>=.97?["acc","Ambitioniert, aber gut machbar"]:ratio>=.93?["warn","Sehr ambitioniert, braucht konsequentes Training"]:["bad","Kaum realistisch bis dahin. Die Trainingstempos sind auf höchstens 7 % Verbesserung begrenzt."];
 const short=inf.T<inf.d.min;
 return`<div class="rrace"><div class="row between" style="align-items:flex-start"><div><div class="eyebrow" style="color:#F59E0B">Dein Ziel</div><div class="rtitle" style="font-size:22px">${E(r.name||inf.d.name)} in ${fmtH(r.goal)}</div>
  <div class="small muted">${fDateL(r.date)} · ${zTxt([r.goal/inf.d.km,r.goal/inf.d.km]).split("–")[0]} /km</div></div><div class="rcount"><b class="num">${days}</b><span>${days===1?"Tag":"Tage"}</span></div></div>
  <div class="rphase">${["base","spec","taper","race"].map(k=>`<i class="${k===inf.ph?"on":""}">${PHASE[k]}</i>`).join("")}</div>
  <div class="small">${PHASEINFO[inf.ph]}</div>
  ${pred?`<div class="small">Prognose aus deiner ${r.refKm===10?"10":"5"}-km-Zeit: <b>${fmtH(pred)}</b> · <span class="pill ${real[0]}" style="font-size:11px">${real[1].split(",")[0].split(".")[0]}</span>${ratio<.97?`<div class="muted" style="margin-top:3px">${real[1]}</div>`:""}</div>`:""}
  ${short?`<div class="tip warn"><i></i><div class="small">Nur ${inf.T} Wochen Vorbereitung. Für ${inf.d.name} sind mindestens ${inf.d.min} Wochen empfohlen. Der Plan steigert deshalb vorsichtig.</div></div>`:""}
  <button class="btn ghost block" data-r="overview">Ganzen Plan ansehen</button></div>`;
}
window.runCardHTML=function(){
 const c=cfg();
 if(!c)return`<section class="card rcard"><div class="row between"><h2>Lauftrainer</h2><span class="pill">neu</span></div>
  <p class="small muted" style="margin:0">Dein Wochenplan mit <b>Intervallen</b>, <b>Easy Run</b> und <b>Long Run</b> am Wochenende. Optional mit einem <b>Wettkampf-Ziel</b> (10 km, Halbmarathon, Marathon) und Zielzeit.</p>
  <button class="btn block" data-r="setup">Lauftrainer einrichten</button></section>`;
 const p=weekPlan(),today=TODAY(),ti=(new Date().getDay()+6)%7,ws=weekStart();ZW=ws;const z=zones();ZW=null;
 const dates=Array.from({length:7},(_,i)=>addD(ws,i));
 let ni=-1;for(let k=0;k<7;k++){const i=(ti+k)%7;if(p.days[i]&&(k>0||!doneOn(today))){ni=i;break}}
 const isToday=ni===ti&&!doneOn(today),s=ni>=0?p.days[ni]:null;
 const strip=dates.map((d,i)=>{const ses=p.days[i],done=ses&&doneOn(d);return`<div class="rday ${ses?"has":""} ${i===ti?"td":""} ${done?"done":""}" ${ses?`style="--rc:${TYPES[ses.type].color}"`:""}><span>${WD[i]}</span>${ses?`<b>${TYPES[ses.type].short}</b>`:"<b>·</b>"}${done?'<i>✓</i>':""}</div>`}).join("");
 const past=racePast();
 return`<section class="card rcard"><div class="row between"><h2>Lauftrainer</h2><span class="pill ${p.deload?"warn":"acc"}">${p.inf?`Woche ${p.inf.i+1} von ${p.inf.T}`:`Woche ${p.w+1}`}${p.deload?" · Entlastung":""}</span></div>
 ${p.inf?raceHead(p):past?`<div class="rrace"><div class="eyebrow" style="color:#F59E0B">Wettkampf vorbei</div><div class="rtitle" style="font-size:22px">${E(past.name||RD[past.key].name)}</div>${(()=>{const res=S.runs.find(x=>x.date===past.date&&x.type==="Wettkampf");return res?`<div class="small">Deine Zeit: <b>${fmtH(res.sec)}</b>${res.sec<=past.goal?" · Ziel erreicht, Gratulation!":" · Ziel war "+fmtH(past.goal)}</div>`:`<div class="small muted">Trag deine Zeit unten bei „Lauf speichern“ mit der Art „Wettkampf“ ein.</div>`})()}<div class="grid2"><button class="btn ghost" data-r="raceend">Zurück zum Wochenplan</button><button class="btn" data-r="setup">Neues Ziel</button></div></div>`:""}
 <div class="rstrip">${strip}</div>
 ${s?`<div class="rses" style="--rc:${TYPES[s.type].color}"><div class="eyebrow" style="color:var(--rc)">${isToday?"Heute":WDL[ni]}</div><div class="rtitle">${E(s.title)}</div><div class="small muted">${E(s.sub)}</div>
  <ul class="rsegs">${segListHTML(s)}</ul><div class="small">ca. <b>${de(r1(s.km))} km</b> · <b>${fmtH(s.sec).replace(/:\d\d$/,"")} ${s.sec>=3600?"Std.":"Min."}</b></div>
  ${isToday?`<button class="btn block" data-r="start" data-t="${s.type}">${s.type==="race"?"Rennen starten":"Einheit geführt starten"}</button>`:`<button class="btn ghost block" data-r="start" data-t="${s.type}">Trotzdem heute laufen</button>`}</div>`
  :`<div class="tip good"><i></i><div class="small">Alle Läufe dieser Woche erledigt. Stark!</div></div>`}
 ${p.deload?`<div class="small muted">Entlastungswoche: etwas weniger Umfang, damit dein Körper sich anpasst. Nächste Woche geht es wieder aufwärts.</div>`:""}
 <details class="small"><summary style="font-weight:700;cursor:pointer">Deine Pace-Zonen${z.est?" (geschätzt)":""}</summary><div class="list" style="margin-top:6px">
  <div class="li"><div class="grow">Easy Run</div><b class="num">${zTxt(z.easy)}</b></div><div class="li"><div class="grow">Long Run</div><b class="num">${zTxt(z.long)}</b></div>
  ${z.rp?`<div class="li"><div class="grow">Renntempo (Ziel)</div><b class="num">${zTxt(z.rp)}</b></div>`:""}
  <div class="li"><div class="grow">Tempo / Schwelle</div><b class="num">${zTxt(z.tempo)}</b></div><div class="li"><div class="grow">Intervalle</div><b class="num">${zTxt(z.iv)}</b></div></div>
  <div class="muted" style="margin-top:6px">${z.est?"Aus deinen Läufen geschätzt. Trag in den Einstellungen deine 5- oder 10-km-Zeit ein, dann werden die Zonen genauer.":"Berechnet aus deiner "+(c.refKm===10?"10":"5")+"-km-Zeit von "+fmtH(c.refSec||c.ref5)+(p.inf?". Wird bis zum Wettkampf schrittweise schneller.":".")}</div></details>
 <div class="row between"><span class="small muted">Wochenumfang ca. ${window.runWeekKm()} km</span><button class="link small" data-r="setup">Einstellungen</button></div></section>`;
};

// ---------- Plan-Übersicht bis zum Wettkampf ----------
function drawOverview(){
 const r=race();if(!r)return;const h=host("rsetup"),rws=wsOf(r.date),cur=weekStart();
 const T=wkBetween(r.start,rws)+1;let html="",sum=0,lastPh="";
 for(let k=0;k<T;k++){const ws=addD(r.start,7*k),p=weekPlan(ws);if(!p||!p.inf)continue;const inf=p.inf,km=Object.values(p.days).reduce((a,s)=>a+s.km,0);sum+=km;
  if(inf.ph!==lastPh){html+=`<div class="rovph">${PHASE[inf.ph]}</div>`;lastPh=inf.ph}
  const days=Object.keys(p.days).map(Number).sort((a,b)=>a-b);
  html+=`<div class="rovw ${ws===cur?"cur":""} ${ws<cur?"past":""}"><div class="row between"><b>Woche ${k+1}${p.deload?" · Entlastung":""}</b><span class="small muted">${fDate(ws)}–${fDate(addD(ws,6))} · ${Math.round(km)} km</span></div>
   ${days.map(d=>{const s=p.days[d];return`<div class="rovs" style="--rc:${TYPES[s.type].color}"><span>${WD[d]}</span><div><b>${E(s.title)}</b><div class="small muted">${E(s.sub)}</div></div></div>`}).join("")}</div>`}
 h.innerHTML=`<div class="scrim" data-r="scrim"><div class="sheet" role="dialog" aria-modal="true" aria-label="Wettkampfplan"><div class="grab"></div>
 <div class="row between"><h2>Plan bis ${fDate(r.date)}</h2><button class="icon-btn" data-r="close" aria-label="Schliessen">${I.x}</button></div>
 <div class="small muted">${E(r.name||RD[r.key].name)} in ${fmtH(r.goal)} · ${T} Wochen · gesamt ca. ${Math.round(sum)} km. Die Tempos passen sich an, wenn du eine neue Bestzeit einträgst.</div>
 <div class="rov">${html}</div></div></div>`;
 setTimeout(()=>{const c=h.querySelector(".rovw.cur");if(c)c.scrollIntoView({block:"center"})},50);
}

// ---------- Einrichten ----------
let SET=null;
function readSet(){
 if(!SET)return;const v=id=>{const el=document.getElementById(id);return el?el.value:""};
 SET.refSec=parseT(v("r-ref"))||0;SET.longKm=parseFloat(String(v("r-long")).replace(",","."))||"";
 if(document.getElementById("r-date"))SET.date=v("r-date");if(document.getElementById("r-goal"))SET.goal=parseT(v("r-goal"))||0;if(document.getElementById("r-name"))SET.name=v("r-name");
 const l=document.getElementById("r-lvl");if(l)SET.lvl=l.value;
}
function drawSetup(){
 const h=host("rsetup"),c=SET,L=c.lvl||lvl();
 const chips=k=>`<div class="rchips">${WD.map((d,i)=>`<button class="chip" data-r="day" data-k="${k}" data-i="${i}" aria-pressed="${c[k]===i}" ${["iv","easy","long"].some(o=>o!==k&&c[o]===i)?"disabled":""}>${d}</button>`).join("")}</div>`;
 const rk=c.key,pred=c.refSec&&rk?riegel(c.refSec,c.refKm,RD[rk].km):0;
 const minDate=addD(TODAY(),7);
 h.innerHTML=`<div class="scrim" data-r="scrim"><div class="sheet" role="dialog" aria-modal="true" aria-label="Lauftrainer einrichten"><div class="grab"></div>
 <div class="row between"><h2>Lauftrainer</h2><button class="icon-btn" data-r="close" aria-label="Schliessen">${I.x}</button></div>
 <div class="rbox"><div class="rlab" style="--rc:#F59E0B">Wettkampf-Ziel</div>
  <div class="rdist">${[["","Kein"],["10","10 km"],["hm","Halb&shy;marathon"],["m","Marathon"],["5","5 km"]].map(([k,n])=>`<button class="chip" data-r="dist" data-v="${k}" aria-pressed="${(c.key||"")===k}">${n}</button>`).join("")}</div>
  ${rk?`<div class="grid2"><label class="f">Datum<input id="r-date" type="date" min="${minDate}" value="${c.date||""}"></label><label class="f">Zielzeit<input id="r-goal" inputmode="numeric" data-time placeholder="${rk==="m"?"z. B. 3:59:00":rk==="hm"?"z. B. 1:49:00":rk==="10"?"z. B. 49:00":"z. B. 24:00"}" value="${c.goal?fmtH(c.goal):""}"></label></div>
   <label class="f">Name des Laufs (optional)<input id="r-name" placeholder="z. B. Zürich Marathon" value="${E(c.name||"")}"></label>
   ${pred?`<div class="small">Mit deiner aktuellen Form schaffst du ca. <b>${fmtH(pred)}</b>.${c.goal?` Dein Ziel ist ${c.goal<pred?Math.round((1-c.goal/pred)*1000)/10+" % schneller":"machbar"}.`:` <button class="link small" data-r="usepred">Als Zielzeit übernehmen</button>`}</div>`:`<div class="small muted">Trag unten deine aktuelle 5- oder 10-km-Zeit ein, dann siehst du eine Prognose.</div>`}`:`<div class="small muted">Ohne Ziel läuft ein fortlaufender Wochenplan. Mit Ziel bekommst du einen Plan in Phasen bis zum Renntag.</div>`}
 </div>
 <div><div class="small" style="font-weight:700;margin-bottom:6px">Aktuelle Bestzeit (für deine Tempos)</div>
  <div class="row" style="gap:8px;align-items:stretch"><div class="seg2">${[5,10].map(k=>`<button class="chip" data-r="refkm" data-v="${k}" aria-pressed="${c.refKm===k}">${k} km</button>`).join("")}</div>
  <input id="r-ref" class="grow" inputmode="numeric" data-time placeholder="${c.refKm===10?"z. B. 52:30":"z. B. 25:30"}" value="${c.refSec?fmtH(c.refSec):""}" aria-label="Zeit"></div></div>
 <p class="small muted" style="margin:0">Wähle die Tage für deine drei Läufe. Zwischen Intervallen und Long Run sollte mindestens ein Tag liegen.</p>
 <div><div class="rlab" style="--rc:${TYPES.iv.color}">Intervalle / Tempo</div>${chips("iv")}</div>
 <div><div class="rlab" style="--rc:${TYPES.easy.color}">Easy Run</div>${chips("easy")}</div>
 <div><div class="rlab" style="--rc:${TYPES.long.color}">Long Run</div>${chips("long")}</div>
 ${Math.abs(c.iv-c.long)===1||Math.abs(c.iv-c.long)===6?`<div class="tip warn"><i></i><div class="small">Intervalle direkt neben dem Long Run sind hart. Wenn möglich einen Tag Abstand lassen.</div></div>`:""}
 <div class="grid2"><label class="f">Aktueller Long Run (km)<input id="r-long" inputmode="decimal" placeholder="${{easy:8,mid:12,pro:16}[L]}" value="${c.longKm||""}"></label>
 <label class="f">Dein Level<select id="r-lvl"><option value="easy" ${L==="easy"?"selected":""}>Einsteiger</option><option value="mid" ${L==="mid"?"selected":""}>Fortgeschritten</option><option value="pro" ${L==="pro"?"selected":""}>Ambitioniert</option></select></label></div>
 <button class="btn block" data-r="save">${rk?"Wettkampfplan erstellen":"Plan speichern"}</button>
 ${cfg()&&!rk?`<button class="glink" style="align-self:center;color:var(--muted)" data-r="restart">Plan neu bei Woche 1 beginnen</button>`:""}</div></div>`;
}
function host(id){let h=document.getElementById(id);if(!h){h=document.createElement("div");h.id=id;document.body.appendChild(h)}return h}
function sesFor(type){const p=weekPlan();if(p)for(const k in p.days)if(p.days[k].type===type)return p.days[k];return type==="race"?null:session(type,weekIdx())}

// ---------- Geführter Lauf ----------
let RUN=null; // {type, ses, i, segStart, segM, t0, paused, pausedAt, iv}
let AC=null;
function beep(f=880,d=.16,n=1){try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();for(let i=0;i<n;i++){const o=AC.createOscillator(),g=AC.createGain(),t=AC.currentTime+i*.22;o.frequency.value=f;o.connect(g);g.connect(AC.destination);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.3,t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.start(t);o.stop(t+d+.02)}}catch(e){}
 try{navigator.vibrate&&navigator.vibrate(n>1?[200,100,200]:150)}catch(e){}}
function startRun(type){
 const ses=sesFor(type);if(!ses){toast("Diese Einheit ist diese Woche nicht geplant");return}
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
 const s=RUN.ses.segs[RUN.i];beep(s.k==="work"||s.name==="Renntempo"?990:660,.2,s.k==="work"?2:1);drawRun();
}
function tickRun(){
 if(!RUN||RUN.paused)return;const s=RUN.ses.segs[RUN.i],left=s.sec-segElapsed();
 if(left<=3.2&&left>0&&!RUN.warned){RUN.warned=true;beep(520,.08)}
 if(left<=0&&s.k!=="run"){nextSeg(true);return}
 const el=document.getElementById("rtime"),pc=document.getElementById("rpace2"),km=document.getElementById("rkm2"),tot=document.getElementById("rtot"),bar=document.getElementById("rbar");
 if(el)el.textContent=s.k==="run"?fmtH(segElapsed()):fmtP(Math.max(0,left));
 const dm=G.m-RUN.segM,se=segElapsed();
 if(pc)pc.textContent=dm>60?fmtP(se/(dm/1000)):"–";
 if(km)km.textContent=de(r1(G.m/1000));if(tot)tot.textContent=fmtH(elapsedAll());
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
 <div class="rpbig num ${s.sec>=3600&&s.k==="run"?"long":""}" id="rtime">${s.k==="run"?"0:00":fmtP(s.sec)}</div>
 <div class="rpsub">${s.k==="run"?(s.km?"Ziel "+de(s.km)+" km":"Ziel "+Math.round(s.sec/60)+" Min."):"verbleibend"}</div>
 <div class="rpgrid"><div><span>Ziel-Pace</span><b class="num">${zTxt(s.pace).replace(" /km","")}</b></div><div><span>Deine Pace</span><b class="num" id="rpace2">–</b></div><div><span>Distanz</span><b class="num"><span id="rkm2">0</span> km</b></div><div><span>Gesamt</span><b class="num" id="rtot">0:00</b></div></div>
 <div id="rhint" class="rhint"></div>
 ${nx?`<div class="rpnext">Danach: <b>${E(nx.name)}</b> · ${nx.km?de(nx.km)+" km":fmtP(nx.sec)}</div>`:""}
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
 <div class="grid2" style="width:100%;max-width:360px"><label class="f" style="color:#fff">Distanz (km)<input id="rf-km" inputmode="decimal" value="${km>0?String(km).replace(".",","):""}" placeholder="z. B. 6,2"></label><label class="f" style="color:#fff">Dauer<input id="rf-t" inputmode="numeric" data-time value="${fmtH(sec)}"></label></div>
 <div class="rpbtns"><button class="btn ghost" data-r="discard">Verwerfen</button><button class="btn" data-r="saverun">Lauf speichern</button></div></div>`;
 beep(990,.25,2);
}
function closeRun(){if(RUN&&RUN.iv)clearInterval(RUN.iv);RUN=null;const h=document.getElementById("rrun");if(h)h.innerHTML="";W.running=false;W.acc=0;G.m=0;if(typeof wakeOff==="function")wakeOff();if(typeof render==="function")render(true)}

// ---------- Ereignisse ----------
document.addEventListener("click",ev=>{
 const b=ev.target.closest("[data-r]");if(!b)return;const k=b.dataset.r;
 if(k==="scrim"&&ev.target!==b)return;
 switch(k){
  case"setup":{const c=cfg()||{},r=c.race&&c.race.date>=TODAY()?c.race:null;SET={iv:c.iv!=null?c.iv:1,easy:c.easy!=null?c.easy:3,long:c.long!=null?c.long:6,refKm:c.refKm||5,refSec:c.refSec||c.ref5||0,longKm:c.longKm||"",key:r?r.key:"",date:r?r.date:"",goal:r?r.goal:0,name:r?r.name||"":""};drawSetup();break}
  case"close":case"scrim":host("rsetup").innerHTML="";SET=null;break;
  case"overview":drawOverview();break;
  case"day":{readSet();SET[b.dataset.k]=+b.dataset.i;drawSetup();break}
  case"dist":{readSet();SET.key=b.dataset.v;if(SET.key&&!SET.date)SET.date=addD(TODAY(),{"5":42,"10":56,hm:84,m:112}[SET.key]+((7-(new Date().getDay()))%7));SET.goal=0;drawSetup();break}
  case"refkm":{readSet();SET.refKm=+b.dataset.v;drawSetup();break}
  case"usepred":{readSet();SET.goal=Math.round(riegel(SET.refSec,SET.refKm,RD[SET.key].km)/5)*5;drawSetup();break}
  case"raceend":{const c=cfg();if(c&&c.race){(c.pastRaces=c.pastRaces||[]).push(c.race);c.race=null;c.start=weekStart();save();render(true);toast("Zurück im normalen Wochenplan")}break}
  case"save":case"restart":{readSet();const ref=SET.refSec,km=SET.refKm;
   if(ref&&!(ref>km*120&&ref<km*720)){toast(`Bitte deine ${km}-km-Zeit prüfen, z. B. ${km===10?"5230 für 52:30":"2530 für 25:30"}`);break}
   let rc=null;
   if(SET.key){const d=RD[SET.key];
    if(!SET.date||SET.date<addD(TODAY(),7)){toast("Bitte ein Datum mindestens eine Woche in der Zukunft wählen");break}
    let goal=SET.goal;if(!goal&&ref)goal=Math.round(riegel(ref,km,d.km));
    if(!goal){toast("Bitte eine Zielzeit eingeben (oder deine Bestzeit, dann schlage ich eine vor)");break}
    if(goal<d.km*150||goal>d.km*600){toast("Die Zielzeit sieht nicht richtig aus. Format h:mm:ss, z. B. 14900 für 1:49:00");break}
    rc={key:SET.key,date:SET.date,goal,name:(SET.name||"").trim(),refKm:km,refSec:ref||0,start:weekStart()};
    const old=cfg()&&cfg().race;if(old&&old.key===rc.key&&old.date===rc.date&&k!=="restart")rc.start=old.start;
   }
   const old=cfg();S.profile.level=SET.lvl||document.getElementById("r-lvl").value;
   S.profile.runCfg={...(old||{}),iv:SET.iv,easy:SET.easy,long:SET.long,refKm:km,refSec:ref||0,ref5:ref?Math.round(riegel(ref,km,5)):0,longKm:SET.longKm>0?SET.longKm:0,start:k==="restart"||!old?weekStart():old.start,race:rc};
   if(S.profile.train==="strength"||S.profile.train==="none")S.profile.train=S.profile.train==="strength"?"both":"run";
   save();host("rsetup").innerHTML="";SET=null;if(typeof render==="function")render(true);toast(rc?"Wettkampfplan erstellt":"Lauftrainer gespeichert");break}
  case"start":startRun(b.dataset.t);break;
  case"pause":if(!RUN)break;if(RUN.paused){const d=Date.now()-RUN.pausedAt;RUN.pausedMs+=d;RUN.segStart+=d;RUN.paused=false;W.running=true;if(typeof gpsStart==="function")gpsStart()}else{RUN.paused=true;RUN.pausedAt=Date.now();W.running=false;if(typeof gpsStop==="function")gpsStop()}drawRun();break;
  case"next":nextSeg(false);break;
  case"stop":if(RUN&&RUN.iv){finishRun()}break;
  case"discard":closeRun();toast("Lauf verworfen");break;
  case"saverun":{const km=parseFloat(String(document.getElementById("rf-km").value).replace(",",".")),sec=parseT(document.getElementById("rf-t").value);
   if(!(km>0)||!(sec>0)){toast("Bitte Distanz und Dauer prüfen");break}
   S.runs.push({id:uid(),date:TODAY(),km:r1(km),sec,type:TYPES[RUN.type].save,via:"Lauftrainer",title:RUN.ses.title});if(RUN.type==="race"){const c=cfg();if(c&&c.race)c.race.result=sec}save();const t=RUN.ses.title;closeRun();toast("Gespeichert: "+t);break}
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
.rpbig.long{font-size:72px}
.rrace{border-radius:14px;padding:14px;display:flex;flex-direction:column;gap:8px;background:color-mix(in srgb,#F59E0B 12%,var(--surface))}
.rcount{display:flex;flex-direction:column;align-items:center;justify-content:center;min-width:64px;padding:6px 8px;border-radius:12px;background:#F59E0B;color:#fff}.rcount b{font-size:26px;line-height:1}.rcount span{font-size:11px;font-weight:700}
.rphase{display:grid;grid-template-columns:repeat(4,1fr);gap:3px}.rphase i{font-style:normal;font-size:10px;font-weight:700;text-align:center;padding:5px 2px;border-radius:7px;background:var(--surface2);color:var(--muted);line-height:1.15}.rphase i.on{background:#F59E0B;color:#fff}
.rbox{display:flex;flex-direction:column;gap:10px;padding:12px;border-radius:14px;background:color-mix(in srgb,#F59E0B 9%,var(--surface))}
.rdist{display:grid;grid-template-columns:repeat(5,1fr);gap:4px}.rdist .chip{padding:8px 2px;font-size:12px;text-align:center;line-height:1.15}
.seg2{display:grid;grid-template-columns:1fr 1fr;gap:4px;flex:none}.seg2 .chip{padding:8px 12px}
.rov{display:flex;flex-direction:column;gap:8px}
.rovph{font-size:11px;letter-spacing:.08em;text-transform:uppercase;font-weight:800;color:#F59E0B;margin-top:6px}
.rovw{border-radius:12px;padding:10px 12px;background:var(--surface2);display:flex;flex-direction:column;gap:6px}.rovw.cur{box-shadow:inset 0 0 0 2px var(--sec)}.rovw.past{opacity:.55}
.rovs{display:grid;grid-template-columns:28px 1fr;gap:8px;align-items:start;font-size:14px}.rovs span{font-size:11px;font-weight:800;color:var(--rc);padding-top:2px}
`;
document.head.appendChild(css);
try{if(S&&typeof render==="function")render(true)}catch(e){}
})();
