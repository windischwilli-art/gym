// Formwerk: Kalorien per Foto schätzen (KI)
(function(){
"use strict";
const KEY="formwerk-ai";
let CFG={};try{CFG=JSON.parse(localStorage.getItem(KEY))||{}}catch(e){}
const saveCfg=()=>{try{localStorage.setItem(KEY,JSON.stringify(CFG))}catch(e){}};
const PROV={
 gemini:{name:"Google Gemini",cost:"kostenlos (mit Tageslimit)",model:"gemini-flash-latest",
  steps:['<b>aistudio.google.com/apikey</b> öffnen und mit deinem Google-Konto anmelden','Auf <b>„API-Schlüssel erstellen“</b> tippen','Den Schlüssel kopieren und hier einfügen']},
 claude:{name:"Claude (Anthropic)",cost:"ca. 1 Rappen pro Foto",model:"claude-haiku-5-5",
  steps:['<b>console.anthropic.com</b> öffnen und ein Konto anlegen','Unter <b>Billing</b> etwas Guthaben aufladen (z. B. 5 $)','Unter <b>API Keys</b> einen Schlüssel erstellen, kopieren und hier einfügen']}
};
const E=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const N=v=>{const n=parseFloat(String(v).replace(",","."));return isFinite(n)?n:0};
const ready=()=>!!(CFG.prov&&CFG.key);
let UI={setup:false,prov:"gemini",msg:"",busy:false};

// ---------- API ----------
const PROMPT=note=>`Du bist Ernährungsexperte. Analysiere das Foto einer Mahlzeit.
Erkenne jede sichtbare Komponente einzeln (z. B. Reis, Poulet, Sauce, Salat) und schätze die Menge in Gramm anhand von Teller- und Besteckgrössen (Standardteller ca. 26 cm).
Berücksichtige versteckte Fette wie Öl, Butter oder Rahmsauce realistisch.
Gib pro Komponente die Werte für die geschätzte Menge an: kcal, Protein, Kohlenhydrate, Fett (Gramm).
${note?`Hinweis vom Nutzer: ${note}\n`:""}Antworte nur mit JSON in genau dieser Form:
{"erkannt":true,"gericht":"kurzer Name auf Deutsch","komponenten":[{"name":"Name auf Deutsch","gramm":0,"kcal":0,"protein":0,"kh":0,"fett":0}],"sicherheit":"hoch|mittel|niedrig","hinweis":"ein kurzer Satz"}
Wenn kein Essen zu sehen ist: {"erkannt":false}`;

async function callAI(prov,key,b64,text){
 if(prov==="gemini"){
  const parts=b64?[{inline_data:{mime_type:"image/jpeg",data:b64}},{text}]:[{text}];
  const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${PROV.gemini.model}:generateContent`,{method:"POST",
   headers:{"Content-Type":"application/json","x-goog-api-key":key},
   body:JSON.stringify({contents:[{parts}],generationConfig:{temperature:.2,...(b64?{responseMimeType:"application/json"}:{})}})});
  const j=await r.json().catch(()=>({}));
  if(!r.ok){const m=(j.error&&j.error.message)||"";throw{code:r.status===429?"quota":/API key|API_KEY|permission/i.test(m)||r.status===403?"key":"api",msg:m}}
  return((j.candidates&&j.candidates[0]&&j.candidates[0].content&&j.candidates[0].content.parts)||[]).map(p=>p.text||"").join("");
 }
 const content=b64?[{type:"image",source:{type:"base64",media_type:"image/jpeg",data:b64}},{type:"text",text}]:text;
 const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",
  headers:{"content-type":"application/json","x-api-key":key,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
  body:JSON.stringify({model:PROV.claude.model,max_tokens:1200,messages:[{role:"user",content}]})});
 const j=await r.json().catch(()=>({}));
 if(!r.ok){const m=(j.error&&j.error.message)||"";throw{code:r.status===401?"key":r.status===429?"quota":/credit|balance|billing/i.test(m)?"credit":"api",msg:m}}
 return(j.content||[]).filter(c=>c.type==="text").map(c=>c.text).join("");
}
function parseJSON(t){const a=t.indexOf("{"),b=t.lastIndexOf("}");if(a<0||b<a)throw{code:"parse"};return JSON.parse(t.slice(a,b+1))}
function errText(e){
 const c=e&&e.code;
 if(c==="key")return"Der API-Schlüssel wird nicht akzeptiert. Prüfe ihn in den Einstellungen (Coach → Daten & Verbindungen).";
 if(c==="quota")return"Das Limit ist für den Moment erreicht. Versuch es in ein paar Minuten nochmal.";
 if(c==="credit")return"Dein Anthropic-Guthaben ist aufgebraucht. Lade unter console.anthropic.com → Billing etwas auf.";
 if(c==="parse")return"Die Antwort der KI war unvollständig. Versuch es nochmal.";
 if(c==="api")return"Die KI hat einen Fehler gemeldet"+(e.msg?": "+e.msg:".");
 return"Keine Verbindung. Prüfe dein Internet und versuch es nochmal.";
}

// ---------- Einstellungen (Karte im Coach) ----------
window.aiCardHTML=function(){
 const head=(pill,cls)=>`<div class="row between"><span style="font-weight:700;font-size:16px">KI-Foto-Analyse</span><span class="pill ${cls}">${pill}</span></div>`;
 const msg=UI.msg?`<div class="small" role="alert" style="color:${UI.ok?"var(--good)":"var(--bad)"};font-weight:600">${E(UI.msg)}</div>`:"";
 if(ready()&&!UI.setup)return head("bereit","good")+`<div class="small muted">Fotografiere dein Essen, die KI schätzt Lebensmittel, Mengen und Kalorien. Anbieter: ${E(PROV[CFG.prov].name)} (${E(PROV[CFG.prov].cost)}).</div>
  ${msg}<div class="grid2"><button class="btn ghost" data-ai="setup">Ändern</button><button class="btn ghost" data-ai="remove">Entfernen</button></div>`;
 if(!UI.setup)return head("nicht eingerichtet","")+`<div class="small muted">Mach ein Foto von deinem Teller und die KI schätzt, wie viele Kalorien drin sind. Dafür brauchst du einmalig einen eigenen Schlüssel, bei Google sogar kostenlos.</div>
  <button class="btn block" data-ai="setup">KI-Foto-Analyse einrichten</button>`;
 const p=UI.prov;
 return head("einrichten","")+`<div class="grid2">${Object.entries(PROV).map(([k,v])=>`<button class="choice" data-ai="prov" data-v="${k}" aria-pressed="${p===k}"><span style="font-weight:700">${v.name}</span><span class="small muted">${v.cost}</span></button>`).join("")}</div>
  <ol class="small steps">${PROV[p].steps.map(x=>`<li>${x}</li>`).join("")}</ol>
  <label class="f">API-Schlüssel<input id="aikey" type="password" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${p==="gemini"?"AIza…":"sk-ant-…"}" value="${CFG.prov===p?E(CFG.key||""):""}"></label>
  ${msg}<div class="grid2"><button class="btn ghost" data-ai="cancel">Abbrechen</button><button class="btn" data-ai="savekey" ${UI.busy?"disabled":""}>${UI.busy?"Prüfe …":"Speichern & testen"}</button></div>
  <div class="small muted">Der Schlüssel bleibt nur auf diesem Gerät. Fotos werden zur Analyse an ${E(PROV[p].name)} geschickt.</div>`;
};
function paintCard(){const el=document.getElementById("aicard");if(el)el.innerHTML=window.aiCardHTML();if(AV&&AV.stage==="setup")draw()}

// ---------- Foto-Ablauf ----------
let AV=null; // {stage, img, b64, note, meal, res, items, err}
const host=()=>{let h=document.getElementById("aiov");if(!h){h=document.createElement("div");h.id="aiov";document.body.appendChild(h)}return h};
function open(meal){
 if(typeof SHEET!=="undefined"&&SHEET){meal=meal||SHEET.meal;if(typeof closeSheet==="function")closeSheet()}
 AV={stage:ready()?"pick":"setup",meal:meal||(typeof suggestMeal==="function"?suggestMeal():"Mittagessen"),note:""};
 if(!ready()){UI.setup=true;UI.msg=""}
 draw();
}
function close(){const h=document.getElementById("aiov");if(h)h.innerHTML="";AV=null}
function itemsTotal(){return AV.items.filter(i=>i.on).reduce((a,i)=>{const k=i.g0>0?i.g/i.g0:1;return{kcal:a.kcal+i.kcal*k,p:a.p+i.p*k,c:a.c+i.c*k,f:a.f+i.f*k}},{kcal:0,p:0,c:0,f:0})}
function draw(){
 if(!AV)return;
 const h=host(),top=t=>`<div class="row between"><h2>${t}</h2><button class="icon-btn" aria-label="Schließen" data-ai="close">${I.x}</button></div>`;
 let b="";
 if(AV.stage==="setup")b=top("KI einrichten")+`<div id="aicard" class="stack" style="gap:10px">${window.aiCardHTML()}</div>`;
 else if(AV.stage==="pick")b=top("Foto vom Essen")+`
  ${AV.img?`<img class="aiimg" src="${AV.img}" alt="Dein Foto">`:`<div class="aidrop"><svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg><div>Fotografiere deinen Teller von schräg oben. Alles sollte gut sichtbar sein.</div></div>`}
  <div class="grid2"><button class="btn ${AV.img?"ghost":""}" data-ai="cam">${AV.img?"Neues Foto":"Foto aufnehmen"}</button><button class="btn ghost" data-ai="lib">Aus Fotos wählen</button></div>
  ${AV.img?`<label class="f">Was sollte die KI wissen? (optional)<input id="ainote" value="${E(AV.note)}" placeholder="z. B. mit Butter gebraten, grosse Portion"></label>
  <button class="btn block gbig" data-ai="analyze">Kalorien schätzen</button>`:""}
  ${AV.err?`<div class="small" role="alert" style="color:var(--bad);font-weight:600">${E(AV.err)}</div>`:""}
  <div class="small muted">Analyse mit ${E(PROV[CFG.prov].name)}. Die Werte sind Schätzungen, du kannst sie danach anpassen.</div>`;
 else if(AV.stage==="busy")b=top("Foto vom Essen")+`<div class="aiwrap"><img class="aiimg" src="${AV.img}" alt=""><div class="aiscan"><div class="spin"></div><b>KI analysiert dein Essen …</b></div></div><button class="btn ghost block" data-ai="abort">Abbrechen</button>`;
 else if(AV.stage==="result"){
  const t=itemsTotal(),r=AV.res||{},MEALS_=typeof MEALS!=="undefined"?MEALS:["Frühstück","Mittagessen","Abendessen","Snacks"];
  b=top(E(r.gericht||"Deine Mahlzeit"))+`<img class="aiimg small" src="${AV.img}" alt="">
  <div class="aitotal"><div><div class="eyebrow">Geschätzt</div><div class="num" style="font-size:38px;font-weight:700;line-height:1">${Math.round(t.kcal).toLocaleString("de-DE")} <span style="font-size:16px" class="muted">kcal</span></div></div>
   <div class="small" style="text-align:right"><span style="color:var(--prot)">P ${Math.round(t.p)} g</span> · <span style="color:var(--carb)">K ${Math.round(t.c)} g</span> · <span style="color:var(--fat)">F ${Math.round(t.f)} g</span>${r.sicherheit?`<div class="pill ${r.sicherheit==="hoch"?"good":r.sicherheit==="niedrig"?"warn":""}" style="margin-top:6px">Sicherheit: ${E(r.sicherheit)}</div>`:""}</div></div>
  <div class="list">${AV.items.map((i,n)=>{const k=i.g0>0?i.g/i.g0:1;return`<div class="li aiitem ${i.on?"":"off"}"><button class="check" aria-pressed="${i.on}" aria-label="${E(i.name)} übernehmen" data-ai="tog" data-n="${n}">${I.ok}</button>
   <div class="grow"><input class="ainame" data-ai-n="${n}" data-ai-f="name" value="${E(i.name)}" aria-label="Name"><div class="s">${Math.round(i.kcal*k)} kcal · P ${Math.round(i.p*k)} · K ${Math.round(i.c*k)} · F ${Math.round(i.f*k)}</div></div>
   <label class="aig"><input inputmode="numeric" data-ai-n="${n}" data-ai-f="g" value="${Math.round(i.g)}" aria-label="Gramm"><span>g</span></label></div>`}).join("")}</div>
  ${r.hinweis?`<div class="tip"><i></i><div class="small">${E(r.hinweis)}</div></div>`:""}
  <label class="f">Mahlzeit<select id="aimeal">${MEALS_.map(m=>`<option ${m===AV.meal?"selected":""}>${m}</option>`).join("")}</select></label>
  <button class="btn block gbig" data-ai="add">Zu ${E(AV.meal)} hinzufügen</button><button class="glink" style="align-self:center;color:var(--muted);font-size:13px" data-ai="again">Neues Foto</button>`;
 }
 h.innerHTML=`<div class="scrim" data-ai="scrim"><div class="sheet aisheet" role="dialog" aria-modal="true" aria-label="Foto vom Essen"><div class="grab"></div>${b}</div></div>`;
 const m=document.getElementById("aimeal");if(m)m.onchange=()=>{AV.meal=m.value;const btn=h.querySelector('[data-ai="add"]');if(btn)btn.textContent="Zu "+AV.meal+" hinzufügen"};
}
function pickFile(capture){
 const inp=document.createElement("input");inp.type="file";inp.accept="image/*";if(capture)inp.setAttribute("capture","environment");
 inp.onchange=async()=>{const f=inp.files&&inp.files[0];if(!f||!AV)return;try{const{url,b64}=await shrink(f);AV.img=url;AV.b64=b64;AV.err="";AV.stage="pick";draw()}catch(e){AV.err="Dieses Bild kann ich nicht öffnen. Versuch ein anderes.";draw()}};
 inp.click();
}
function shrink(file){return new Promise((res,rej)=>{const u=URL.createObjectURL(file),img=new Image();
 img.onload=()=>{URL.revokeObjectURL(u);const m=1024,s=Math.min(1,m/Math.max(img.naturalWidth,img.naturalHeight)),c=document.createElement("canvas");
  c.width=Math.round(img.naturalWidth*s);c.height=Math.round(img.naturalHeight*s);c.getContext("2d").drawImage(img,0,0,c.width,c.height);
  const url=c.toDataURL("image/jpeg",.82);res({url,b64:url.split(",")[1]})};
 img.onerror=e=>{URL.revokeObjectURL(u);rej(e)};img.src=u})}
async function analyze(){
 const note=(document.getElementById("ainote")||{}).value||"";AV.note=note;AV.stage="busy";AV.err="";draw();
 const run=AV.run={};
 try{
  const txt=await callAI(CFG.prov,CFG.key,AV.b64,PROMPT(note.trim()));
  if(!AV||AV.run!==run)return;
  const r=parseJSON(txt);
  if(r.erkannt===false||!Array.isArray(r.komponenten)||!r.komponenten.length){AV.stage="pick";AV.err="Auf dem Foto konnte ich kein Essen erkennen. Versuch es mit einem näheren Foto.";draw();return}
  AV.res=r;AV.items=r.komponenten.map(k=>({name:String(k.name||"Essen"),g0:N(k.gramm),g:N(k.gramm),kcal:N(k.kcal),p:N(k.protein),c:N(k.kh),f:N(k.fett),on:true}));
  AV.stage="result";draw();
 }catch(e){if(!AV||AV.run!==run)return;AV.stage="pick";AV.err=errText(e);draw()}
}
function addFoods(){
 const today=typeof TODAY==="function"?TODAY():new Date().toISOString().slice(0,10);let n=0,kc=0;
 AV.items.filter(i=>i.on&&i.g>0).forEach(i=>{const k=i.g0>0?i.g/i.g0:1;S.foods.push({id:uid(),date:today,meal:AV.meal,name:i.name.trim()||"Essen",g:Math.round(i.g),kcal:i.kcal*k,p:i.p*k,c:i.c*k,f:i.f*k,fib:0,sug:0,ai:true});n++;kc+=i.kcal*k});
 if(!n){toast("Wähle mindestens ein Lebensmittel aus");return}
 save();close();if(typeof go==="function"&&tab!=="essen")go("essen");else render(true);toast(n+(n===1?" Eintrag":" Einträge")+" · "+Math.round(kc)+" kcal hinzugefügt");
}

// ---------- Ereignisse ----------
document.addEventListener("click",async ev=>{
 const a=ev.target.closest("[data-a]");
 if(a&&a.dataset.a==="aiPhoto"){open(a.dataset.meal);return}
 const b=ev.target.closest("[data-ai]");if(!b)return;const k=b.dataset.ai;
 if(k==="scrim"&&ev.target!==b)return;
 switch(k){
  case"close":case"scrim":close();break;
  case"setup":UI.setup=true;UI.prov=CFG.prov||"gemini";UI.msg="";paintCard();break;
  case"cancel":UI.setup=false;UI.msg="";paintCard();if(AV&&AV.stage==="setup")close();break;
  case"prov":UI.prov=b.dataset.v;UI.msg="";paintCard();break;
  case"remove":CFG={};saveCfg();UI.msg="";paintCard();break;
  case"savekey":{const key=(document.getElementById("aikey").value||"").trim();if(key.length<20){UI.msg="Bitte den vollständigen Schlüssel einfügen.";UI.ok=false;paintCard();break}
   UI.busy=true;UI.msg="";paintCard();
   try{await callAI(UI.prov,key,null,"Antworte nur mit OK.");CFG={prov:UI.prov,key};saveCfg();UI.setup=false;UI.busy=false;UI.msg="Schlüssel funktioniert.";UI.ok=true;
    if(AV&&AV.stage==="setup"){AV.stage="pick";draw()}else paintCard();toast("KI-Foto-Analyse ist bereit")}
   catch(e){UI.busy=false;UI.msg=errText(e);UI.ok=false;paintCard()}break}
  case"cam":pickFile(true);break;
  case"lib":pickFile(false);break;
  case"analyze":analyze();break;
  case"abort":AV.run=null;AV.stage="pick";draw();break;
  case"again":AV.img=null;AV.b64=null;AV.items=null;AV.stage="pick";draw();pickFile(true);break;
  case"tog":{const i=AV.items[+b.dataset.n];i.on=!i.on;draw();break}
  case"add":addFoods();break;
 }
});
document.addEventListener("input",ev=>{
 const t=ev.target;if(!AV||!t.dataset||t.dataset.aiN===undefined)return;const i=AV.items[+t.dataset.aiN];
 if(t.dataset.aiF==="name")i.name=t.value;
 else{i.g=N(t.value);const row=t.closest(".aiitem"),k=i.g0>0?i.g/i.g0:1;if(row)row.querySelector(".s").textContent=`${Math.round(i.kcal*k)} kcal · P ${Math.round(i.p*k)} · K ${Math.round(i.c*k)} · F ${Math.round(i.f*k)}`;
  const tt=itemsTotal(),tot=document.querySelector(".aitotal .num");if(tot)tot.innerHTML=`${Math.round(tt.kcal).toLocaleString("de-DE")} <span style="font-size:16px" class="muted">kcal</span>`}
});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&AV)close()});

const css=document.createElement("style");
css.textContent=`
#aiov .sheet{z-index:25}
.aisheet{gap:14px}
.aiimg{width:100%;max-height:320px;object-fit:cover;border-radius:16px;display:block}
.aiimg.small{max-height:150px}
.aidrop{display:flex;flex-direction:column;align-items:center;gap:10px;text-align:center;padding:30px 16px;border-radius:16px;border:2px dashed color-mix(in srgb,var(--c-food) 45%,transparent);background:color-mix(in srgb,var(--c-food) 8%,var(--surface));color:var(--muted);font-size:14px}
.aidrop svg{color:var(--c-food)}
.aiwrap{position:relative}
.aiscan{position:absolute;inset:0;border-radius:16px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;color:#fff;background:linear-gradient(180deg,rgba(0,0,0,.15),rgba(0,0,0,.55))}
.aiscan .spin{border-color:rgba(255,255,255,.3);border-top-color:#fff}
.aitotal{display:flex;justify-content:space-between;align-items:flex-end;gap:10px;padding:14px;border-radius:14px;background:color-mix(in srgb,var(--c-food) 10%,var(--surface))}
.aiitem{gap:10px}.aiitem.off{opacity:.45}
.ainame{padding:4px 6px;margin-left:-6px;background:transparent;font-weight:600;font-size:15px}
.ainame:focus{background:var(--surface2)}
.aig{display:flex;align-items:center;gap:4px;flex:none;font-size:13px;color:var(--muted)}
.aig input{width:64px;padding:8px;text-align:right}
`;
document.head.appendChild(css);
try{if(typeof S!=="undefined"&&S&&typeof render==="function")render(true)}catch(e){}
window.aiOpen=open;
})();
