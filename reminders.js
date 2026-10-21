// Formwerk: Erinnerungen – offene Kalorien mit Essensvorschlag, anstehendes Training
(function(){
"use strict";
const E=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const DEF={on:true,train:"17:00",food:"19:30"};
const cfg=()=>({...DEF,...((S&&S.profile&&S.profile.rem)||{})});
const NATIVE=()=>window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.LocalNotifications;

// ---------- Essensideen (Werte kommen aus der Lebensmittel-Datenbank der App) ----------
const IDEAS=[
 ["Skyr mit Heidelbeeren",[["Skyr"],["Heidelbeeren"]],"s"],
 ["Magerquark mit Banane",[["Magerquark"],["Banane"]],"s"],
 ["Proteinshake mit Milch",[["Proteinshake mit Milch"]],"s"],
 ["Hüttenkäse mit Vollkornbrot",[["Hüttenkäse"],["Vollkornbrot"]],"s"],
 ["Apfel und eine Handvoll Mandeln",[["Apfel"],["Mandeln"]],"s"],
 ["Proteinjoghurt mit Himbeeren",[["Proteinjoghurt / High Protein"],["Himbeeren"]],"s"],
 ["Naturjoghurt mit Haferflocken",[["Naturjoghurt 3,5 %"],["Haferflocken"]],"s"],
 ["Rührei mit Vollkornbrot",[["Rührei"],["Vollkornbrot"]],"m"],
 ["Gemüsesuppe mit Brot",[["Gemüsesuppe"],["Vollkornbrot"]],"m"],
 ["Thunfisch-Wrap mit Salat",[["Wrap / Tortilla"],["Thunfisch in Wasser"],["Blattsalat"]],"m"],
 ["Pouletbrust mit Reis und Brokkoli",[["Pouletbrust"],["Reis, gekocht"],["Brokkoli"]],"m"],
 ["Lachs mit Kartoffeln und Spinat",[["Lachs"],["Kartoffeln, gekocht"],["Spinat"]],"m"],
 ["Trutenbrust mit Süsskartoffel und Bohnen",[["Trutenbrust"],["Süsskartoffel, gekocht"],["Grüne Bohnen"]],"m"],
 ["Vollkornnudeln mit Rindshack und Tomaten",[["Vollkornnudeln, gekocht"],["Rinderhack 5 %"],["Tomaten"]],"m"],
 ["Linsen mit Reis und Karotten",[["Linsen, gekocht"],["Reis, gekocht"],["Karotten"]],"m"],
 ["Tofu mit Quinoa und Paprika",[["Tofu natur"],["Quinoa, gekocht"],["Paprika"]],"m"],
 ["Porridge mit Milch und Banane",[["Porridge mit Milch"],["Banane"]],"m"],
 ["Chili con Carne",[["Chili con Carne"]],"m"]
];
function ideaVals(it){
 let kcal=0,p=0;for(const[n,f]of it[1]){const x=FOODS.find(y=>y.name===n);if(!x)return null;const g=(x.portion||100)*(f||1);kcal+=x.kcal*g/100;p+=x.p*g/100}
 return{name:it[0],kcal:Math.round(kcal/10)*10,p:Math.round(p),kind:it[2]};
}
function suggest(left,pLeft,h){
 const all=IDEAS.map(ideaVals).filter(Boolean);
 // Abends darf eine Mahlzeit den Rest füllen, tagsüber eher ein Snack oder eine normale Mahlzeit
 const target=h>=17?Math.min(left,900):left>700?Math.min(left*.5,700):Math.min(left,300);
 const fit=all.filter(x=>x.kcal<=left+80).map(x=>({...x,sc:Math.abs(x.kcal-target)/Math.max(150,target)-(pLeft>20?x.p/Math.max(1,x.kcal)*3:0)}));
 fit.sort((a,b)=>a.sc-b.sc);
 // Etwas Abwechslung: aus den drei besten je nach Tag zwei auswählen
 const top=fit.slice(0,3),dayN=new Date().getDate()%Math.max(1,top.length);return top.length>2?[top[dayN],top[(dayN+1)%3]]:top;
}

// ---------- Inhalte ----------
const hm=t=>{const[a,b]=String(t).split(":").map(Number);return a*60+(b||0)};
const nowMin=()=>{const d=new Date();return d.getHours()*60+d.getMinutes()};
function trainMsg(){
 if(typeof planDays!=="function")return null;const d=TODAY(),td=planDays()[(new Date().getDay()+6)%7];if(!td||td.opt)return null;
 let done=false,go="heute";
 if(td.t==="Lauf"){done=S.runs.some(r=>r.date===d);go="laufen"}
 else if(td.t==="Kraft"){done=S.workouts.some(w=>w.date===d);go="kraft"}
 else if(td.sport){done=(S.acts||[]).some(a=>a.date===d)}
 else return null;
 if(done)return null;
 return{id:101,kind:"train",go,title:td.t==="Lauf"?"Heute steht noch ein Lauf an":td.t==="Kraft"?"Heute steht noch Krafttraining an":"Heute: "+td.t,body:td.d.replace(/^🏁\s*/,"").replace(/\.$/,"")+(td.t==="Lauf"?". Schnüre die Schuhe, es lohnt sich!":". Du schaffst das!")};
}
function foodMsg(){
 const d=TODAY(),t=dayTargets(d),s=sum(foodsOn(d)),left=Math.round(t.kcal-s.kcal),pLeft=Math.round(t.prot-s.p),h=new Date().getHours();
 if(!s.kcal)return{id:102,kind:"food",go:"essen",title:"Noch nichts eingetragen",body:"Trag dein Essen von heute ein, damit dein Tagesziel stimmt. Mit dem Scanner geht es schnell."};
 if(left<150)return null;
 const ideas=suggest(left,pLeft,h),idea=ideas.map(x=>`${x.name} (ca. ${x.kcal} kcal, ${x.p} g Protein)`).join(" oder ");
 return{id:102,kind:"food",go:"essen",title:`Noch ${left.toLocaleString("de-CH")} kcal offen`,body:(pLeft>15?`Dir fehlen noch ${pLeft} g Protein. `:"")+(idea?"Wie wäre es mit "+idea+"?":"Plane noch eine Mahlzeit ein."),ideas,left,pLeft};
}
window.remPreview=()=>({train:trainMsg(),food:foodMsg()});

// ---------- Anzeigen ----------
function banner(m){
 let h=document.getElementById("rembanner");if(!h){h=document.createElement("div");h.id="rembanner";document.body.appendChild(h)}
 h.innerHTML=`<div class="remb ${m.kind}" role="status"><div class="grow"><b>${E(m.title)}</b><div class="small">${E(m.body)}</div></div>
  <div class="rembtns"><button class="btn" data-rem="go" data-go="${m.go}">${m.kind==="food"?"Essen erfassen":"Los geht's"}</button><button class="icon-btn" data-rem="x" aria-label="Schliessen">${I.x}</button></div></div>`;
}
async function systemNote(m){
 try{if(!("Notification"in window)||Notification.permission!=="granted")return false;
  const reg=await navigator.serviceWorker.ready;await reg.showNotification(m.title,{body:m.body,tag:"formwerk-"+m.kind,icon:"icons/icon-192.png",badge:"icons/icon-192.png",data:{go:m.go}});return true}catch(e){return false}
}
function fired(){const f=S.remFired||{};return f.d===TODAY()?f:{d:TODAY()}}
async function check(){
 try{
  if(!S||!S.profile)return;const c=cfg();if(!c.on)return;
  if(document.hidden)return; // im Hintergrund übernimmt die native App (später) bzw. beim nächsten Öffnen
  const f=fired(),now=nowMin();let changed=false;
  for(const[kind,fn]of[["train",trainMsg],["food",foodMsg]]){
   if(f[kind]||!c[kind]||now<hm(c[kind]))continue;
   const m=fn();f[kind]=1;changed=true;if(!m)continue;
   banner(m);systemNote(m);break;
  }
  if(changed){S.remFired=f;saveLocalOnly()}
 }catch(e){}
}
// Native App (Capacitor): Benachrichtigungen für heute im Voraus planen, Inhalt bei jeder Änderung neu berechnen
async function schedule(){
 const LN=NATIVE();if(!LN||!S||!S.profile)return;
 try{
  await LN.cancel({notifications:[101,102,111,112,121,122].map(id=>({id}))});const c=cfg();if(!c.on)return;const list=[];
  for(const[kind,fn]of[["train",trainMsg],["food",foodMsg]]){if(!c[kind])continue;const[hh,mm]=c[kind].split(":").map(Number),at=new Date();at.setHours(hh,mm,0,0);
   if(at<=new Date())continue;const m=fn();if(m)list.push({id:m.id,title:m.title,body:m.body,schedule:{at},extra:{go:m.go}})}
  // Auch die nächsten zwei Tage einplanen, falls die App dann nicht geöffnet wird (wird beim nächsten Öffnen aktualisiert)
  const pd=typeof planDays==="function"?planDays():[],ti=(new Date().getDay()+6)%7;
  for(const d of[1,2]){
   const day=new Date();day.setDate(day.getDate()+d);
   if(c.train&&ti+d<=6){const x=pd[ti+d];if(x&&!x.opt&&(x.t==="Lauf"||x.t==="Kraft"||x.sport)){const[hh,mm]=c.train.split(":").map(Number),at=new Date(day);at.setHours(hh,mm,0,0);
     list.push({id:100+d*10+1,title:x.t==="Lauf"?"Heute steht ein Lauf an":x.t==="Kraft"?"Heute steht Krafttraining an":"Heute: "+x.t,body:String(x.d).replace(/^🏁\s*/,""),schedule:{at},extra:{go:x.t==="Lauf"?"laufen":x.t==="Kraft"?"kraft":"heute"}})}}
   if(c.food){const[hh,mm]=c.food.split(":").map(Number),at=new Date(day);at.setHours(hh,mm,0,0);
     list.push({id:100+d*10+2,title:"Kalorien-Check",body:"Schau kurz rein: Wie viele Kalorien und wie viel Protein sind heute noch offen?",schedule:{at},extra:{go:"essen"}})}
  }
  if(list.length)await LN.schedule({notifications:list});
 }catch(e){}
}
window.remSchedule=schedule;
let NATPERM="unknown";
async function natPerm(ask){const LN=NATIVE();if(!LN)return;try{let r=await LN.checkPermissions();if(ask&&r.display!=="granted")r=await LN.requestPermissions();const v=r.display==="granted"?"granted":r.display==="denied"?"denied":"unknown";if(v!==NATPERM){NATPERM=v;if(typeof render==="function"&&tab==="coach")render(true)}if(v==="granted")schedule()}catch(e){}}
setTimeout(()=>natPerm(false),1500);
try{const LN=NATIVE();if(LN&&LN.addListener)LN.addListener("localNotificationActionPerformed",e=>{const g=e&&e.notification&&e.notification.extra&&e.notification.extra.go;if(g&&typeof go==="function")setTimeout(()=>go(g),300)})}catch(e){}

// ---------- Einstellungen (Coach) ----------
window.remCardHTML=function(){
 const c=cfg(),perm="Notification"in window?Notification.permission:"unsupported",standalone=window.matchMedia&&matchMedia("(display-mode: standalone)").matches||navigator.standalone;
 const pv=window.remPreview();
 return`<section class="card"><div class="row between"><h2>Erinnerungen</h2><button class="toggle" role="switch" aria-checked="${c.on}" data-rem="on" aria-label="Erinnerungen ein oder aus"><i></i></button></div>
 <p class="small muted" style="margin:0">Die App erinnert dich an ein offenes Training und sagt dir am Abend, wie viele Kalorien noch offen sind, mit einem passenden Essensvorschlag.</p>
 ${c.on?`<div class="grid2"><label class="f">Training-Erinnerung<input type="time" data-rem="train" value="${c.train||""}"></label><label class="f">Kalorien-Check<input type="time" data-rem="food" value="${c.food||""}"></label></div>
 ${NATIVE()?(NATPERM==="granted"?`<div class="small" style="color:var(--good);font-weight:600">Mitteilungen sind erlaubt.</div>`:NATPERM==="denied"?`<div class="small muted">Mitteilungen sind blockiert. Erlaube sie in den Einstellungen deines Handys bei Formwerk.</div>`:`<button class="btn ghost block" data-rem="perm">Mitteilungen erlauben</button>`)
  :perm==="granted"?`<div class="small" style="color:var(--good);font-weight:600">Benachrichtigungen sind erlaubt.</div>`
  :perm==="denied"?`<div class="small muted">Benachrichtigungen sind blockiert. Du kannst sie in den iPhone-Einstellungen bei Formwerk wieder erlauben. Bis dahin erscheinen die Hinweise in der App.</div>`
  :perm==="unsupported"||!standalone?`<div class="small muted">Für Mitteilungen auf dem Sperrbildschirm füge die App zum Home-Bildschirm hinzu. Bis dahin erscheinen die Hinweise oben in der App, sobald du sie öffnest.</div>`
  :`<button class="btn ghost block" data-rem="perm">Mitteilungen erlauben</button>`}
 <details class="small"><summary style="font-weight:700;cursor:pointer">Vorschau für jetzt</summary><div class="stack" style="gap:8px;margin-top:8px">
  ${[pv.train,pv.food].filter(Boolean).map(m=>`<div class="tip"><i></i><div><div style="font-weight:600">${E(m.title)}</div><div class="small muted">${E(m.body)}</div></div></div>`).join("")||`<div class="muted">Gerade gibt es nichts zu erinnern. Training erledigt und Kalorien im Ziel.</div>`}</div></details>`:""}
 </section>`;
};
function setCfg(o){S.profile.rem={...cfg(),...o};save();if(typeof render==="function")render(true);schedule()}

document.addEventListener("click",async ev=>{
 const b=ev.target.closest("[data-rem]");if(!b)return;const k=b.dataset.rem;
 if(k==="x"){const h=document.getElementById("rembanner");if(h)h.innerHTML=""}
 else if(k==="go"){const h=document.getElementById("rembanner");if(h)h.innerHTML="";if(typeof go==="function")go(b.dataset.go)}
 else if(k==="on")setCfg({on:!cfg().on});
 else if(k==="perm"&&NATIVE()){await natPerm(true);toast(NATPERM==="granted"?"Mitteilungen sind erlaubt":"Mitteilungen wurden nicht erlaubt")}
 else if(k==="perm"){try{const r=await Notification.requestPermission();toast(r==="granted"?"Mitteilungen sind erlaubt":"Mitteilungen wurden nicht erlaubt");render(true)}catch(e){}}
});
document.addEventListener("change",ev=>{const t=ev.target;if(!t.dataset||(t.dataset.rem!=="train"&&t.dataset.rem!=="food"))return;
 const o={};o[t.dataset.rem]=t.value;const f=S.remFired;if(f&&f.d===TODAY())delete f[t.dataset.rem];setCfg(o)});

// Prüfen beim Öffnen, wenn die App wieder in den Vordergrund kommt und jede Minute
document.addEventListener("visibilitychange",()=>{if(!document.hidden)setTimeout(check,800);else schedule()});
setInterval(check,60000);setTimeout(check,2500);
// Inhalt der geplanten Mitteilungen aktuell halten (native App)
const _save=window.save;if(typeof _save==="function"){window.save=function(){const r=_save.apply(this,arguments);clearTimeout(window.__remT);window.__remT=setTimeout(schedule,2000);return r}}

const css=document.createElement("style");
css.textContent=`
#rembanner{position:fixed;left:0;right:0;top:calc(env(safe-area-inset-top,0px) + 8px);z-index:60;display:flex;justify-content:center;padding:0 10px;pointer-events:none}
.remb{pointer-events:auto;width:100%;max-width:480px;display:flex;gap:10px;align-items:center;padding:12px 12px 12px 14px;border-radius:16px;background:var(--surface);box-shadow:0 10px 30px rgba(0,0,0,.18);border-left:5px solid var(--accent);animation:remin .35s ease}
.remb.food{border-left-color:var(--c-food)}.remb.train{border-left-color:var(--c-run)}
.remb b{font-size:15px}.remb .small{color:var(--muted);margin-top:2px}
.rembtns{display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex:none}.rembtns .btn{padding:8px 12px;font-size:13px;min-height:0}
@keyframes remin{from{transform:translateY(-20px);opacity:0}to{transform:none;opacity:1}}
.toggle{position:relative;width:50px;height:30px;border-radius:99px;background:var(--surface2);border:0;padding:0;flex:none;transition:background .2s}
.toggle i{position:absolute;top:3px;left:3px;width:24px;height:24px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.3);transition:transform .2s}
.toggle[aria-checked="true"]{background:var(--good,#22a06b)}.toggle[aria-checked="true"] i{transform:translateX(20px)}
`;
document.head.appendChild(css);
})();
