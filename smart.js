// Formwerk: Smarte Trainingswahl – erkennt, welche Muskelgruppen erholt sind, und empfiehlt die passende Vorlage
(function(){
"use strict";
const GN={push:"Push",pull:"Pull",legs:"Beine"};
const GM={push:"Brust, Schultern und Trizeps",pull:"Rücken und Bizeps",legs:"Beine und Po"};
// Muskel-Text einer Übung -> Anteile an Push / Pull / Beine
function groupsOf(e){
 const ex=window.guideEx&&window.guideEx[e];if(!ex)return null;
 const parts=String(ex[2]||"").toLowerCase().split(",").map(s=>s.trim()),g={push:0,pull:0,legs:0};
 parts.forEach((p,i)=>{const w=i===0?1:.5;
  if(/hintere schulter|rücken|bizeps|latissimus/.test(p)&&!/unterer rücken/.test(p))g.pull+=w;
  else if(/brust|trizeps|schulter/.test(p))g.push+=w;
  else if(/bein|po|oberschenkel|wade|innenseite|hüfte|unterer rücken/.test(p))g.legs+=w});
 const s=g.push+g.pull+g.legs;if(!s)return null;for(const k in g)g[k]/=s;return g;
}
const daysBetween=(a,b)=>Math.round((new Date(b+"T12:00")-new Date(a+"T12:00"))/864e5);
// Erholung: am selben Tag und am Tag danach voll belastet, danach abklingend (Muskeln brauchen ca. 48–72 Std.)
const DECAY=[1,1,.55,.2];
function fatigue(onDate,extra){
 const f={push:0,pull:0,legs:0},why={push:[],pull:[],legs:[]};
 const wks=[...(S.workouts||[]),...(extra||[])];
 for(const w of wks){const d=daysBetween(w.date,onDate);if(d<0||d>=DECAY.length)continue;
  const g={push:0,pull:0,legs:0};let n=0;
  for(const s of w.sets){const x=groupsOf(s.e);if(!x)continue;n++;for(const k in g)g[k]+=x[k]}
  if(!n)continue;
  for(const k in g){const share=g[k]/n;f[k]+=share*DECAY[d]*Math.min(1.5,n/10);if(share>.45)why[k].push({d,name:w.name})}}
 // Laufen belastet die Beine, harte Einheiten stärker
 for(const r of S.runs||[]){const d=daysBetween(r.date,onDate);if(d<0||d>2)continue;
  const hard=r.type==="Intervalle"||r.type==="Tempo"||r.type==="Wettkampf"||r.type==="Langer Lauf"||r.km>=14;
  f.legs+=(hard?.8:.35)*(d===0?1:d===1?.8:.35);if(hard&&d<=1)why.legs.push({d,name:r.type==="Langer Lauf"?"Long Run":r.type,run:true})}
 return{f,why};
}
function tplGroups(name){
 const list=TEMPLATES[name]||[],g={push:0,pull:0,legs:0};let n=0;
 list.forEach(e=>{const x=groupsOf(e);if(x){n++;for(const k in g)g[k]+=x[k]}});
 if(n)for(const k in g)g[k]/=n;return g;
}
function lastDone(name,onDate,extra){let best=99;for(const w of [...(S.workouts||[]),...(extra||[])])if(w.name===name){const d=daysBetween(w.date,onDate);if(d>=0&&d<best)best=d}return best}
const dom=g=>Object.keys(g).sort((a,b)=>g[b]-g[a])[0];
// Beste Vorlage für einen Tag: möglichst wenig Belastung auf ermüdeten Muskeln, sonst die am längsten nicht gemachte
function recommend(onDate,extra){
 const names=Object.keys(TEMPLATES||{});if(!names.length)return null;
 const{f,why}=fatigue(onDate,extra);
 const sc=names.map(n=>{const g=tplGroups(n),load=g.push*f.push+g.pull*f.pull+g.legs*f.legs,ago=lastDone(n,onDate,extra);return{n,g,load,ago,score:load*3-Math.min(ago,7)*.08}});
 sc.sort((a,b)=>a.score-b.score);
 const best=sc[0],tired=Object.keys(f).filter(k=>f[k]>=.45).sort((a,b)=>f[b]-f[a]);
 return{name:best.n,fat:f,why,tired,best,all:sc};
}
function reasonText(r){
 if(!r)return"";const parts=[],when=d=>d===0?"heute":d===1?"gestern":"vorgestern";
 for(const k of r.tired.slice(0,2)){const w=r.why[k].sort((a,b)=>a.d-b.d)[0];if(!w)continue;
  parts.push(w.run?`${when(w.d)} ${w.name==="Long Run"?"Long Run":w.name==="Wettkampf"?"Wettkampf":w.name} (Beine brauchen Erholung)`:`${when(w.d)} ${w.name} (${GM[k]})`)}
 const g=dom(r.best.g);
 if(!parts.length)return r.best.ago>=99?`Alle Muskelgruppen sind erholt. Starte mit ${r.name}.`:r.best.ago>=7?`${r.name} hast du am längsten nicht mehr gemacht.`:`Alle Muskelgruppen sind erholt. ${r.name} ist als Nächstes dran.`;
 return`${parts.join(" und ").replace(/^./,c=>c.toUpperCase())}. ${r.name} passt jetzt am besten, ${GM[g]} sind erholt.`;
}
window.smartRec=()=>{const r=recommend(TODAY());return r?{...r,reason:reasonText(r)}:null};

// Wochenplan: Krafttage ab heute mit der jeweils passenden Vorlage füllen (Tage nacheinander simuliert)
window.smartPlan=function(out){
 try{
  if(!S||!S.workouts||typeof TEMPLATES==="undefined"||!Object.keys(TEMPLATES).length)return out;
  const ti=(new Date().getDay()+6)%7,ws=weekStart(),extra=[];
  const date=i=>{const d=new Date(ws+"T12:00");d.setDate(d.getDate()+i);return iso(d)};
  const doneToday=S.workouts.some(w=>w.date===TODAY());
  return out.map((x,i)=>{
   if(x.t!=="Kraft"||i<ti)return x;
   if(i===ti&&doneToday){const w=S.workouts.filter(w=>w.date===TODAY()).pop();return{...x,d:w.name+" erledigt"}}
   const r=recommend(date(i),extra);if(!r)return x;
   extra.push({date:date(i),name:r.name,sets:(TEMPLATES[r.name]||[]).flatMap(e=>[{e},{e},{e}])});
   const res=Object.assign({...x,d:r.name+(/Min\./.test(x.d)?", 45 Min.":""),smart:r.name},{});
   if(i===ti)res.why=reasonText(r);
   return res});
 }catch(e){return out}
};
// Hinweis für den Coach
window.smartTip=function(){
 try{const pd=planDays()[(new Date().getDay()+6)%7];if(!pd||pd.t!=="Kraft"||!pd.smart||S.workouts.some(w=>w.date===TODAY()))return null;
  const r=window.smartRec();if(!r||!r.tired.length)return null;
  return{k:"",t:`Heute besser ${r.name}`,d:r.reason};}catch(e){return null}
};
})();
