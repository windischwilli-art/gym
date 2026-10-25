// Formwerk: Kalorien per Foto schätzen (KI)
(function(){
"use strict";
const KEY="formwerk-ai";
let CFG={};try{CFG=JSON.parse(localStorage.getItem(KEY))||{}}catch(e){}
const saveCfg=()=>{try{localStorage.setItem(KEY,JSON.stringify(CFG))}catch(e){}};
const PROV={
 formwerk:{name:"Formwerk-KI",cost:"gratis, kein Schlüssel nötig"},
 gemini:{name:"Google Gemini",cost:"kostenlos (mit Tageslimit)",model:"gemini-flash-latest",
  steps:['<b>aistudio.google.com/apikey</b> öffnen und mit deinem Google-Konto anmelden','Auf <b>„API-Schlüssel erstellen“</b> tippen','Den Schlüssel kopieren und hier einfügen']},
 claude:{name:"Claude (Anthropic)",cost:"ca. 1 Rappen pro Foto",model:"claude-haiku-5-5",
  steps:['<b>console.anthropic.com</b> öffnen und ein Konto anlegen','Unter <b>Billing</b> etwas Guthaben aufladen (z. B. 5 $)','Unter <b>API Keys</b> einen Schlüssel erstellen, kopieren und hier einfügen']}
};
const E=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const N=v=>{const n=parseFloat(String(v).replace(",","."));return isFinite(n)?n:0};
// Eingebaute KI: läuft über das Firebase-Projekt der App (Firebase AI Logic, Gemini). Niemand braucht einen eigenen Schlüssel.
// Geschützt mit App Check (reCAPTCHA im Web, App Attest / Play Integrity in der Store-App).
const FW={sdk:"https://www.gstatic.com/firebasejs/12.19.0/",
 recaptcha:{type:"enterprise",key:"6LdT6f8tAAAAAEkRKT598iZhDSJXdOptC1WeY-s6"}, // Website-Schlüssel aus der reCAPTCHA-Verwaltung
 models:["gemini-3.8-flash","gemini-3.6-flash","gemini-3-flash","gemini-2.5-flash"],
 perDay:25}; // Fotos/Berichte pro Gerät und Tag, damit das gemeinsame Kontingent für alle reicht
const ownKey=()=>!!(CFG.prov&&CFG.prov!=="formwerk"&&CFG.key);
const prov=()=>ownKey()?CFG.prov:"formwerk";
const ready=()=>true;
let UI={setup:false,prov:"gemini",msg:"",busy:false};

// ---------- API ----------
const PROMPT=note=>`Du bist Ernährungsexperte. Analysiere das Foto einer Mahlzeit.
Erkenne jede sichtbare Komponente einzeln (z. B. Reis, Poulet, Sauce, Salat) und schätze die Menge in Gramm anhand von Teller- und Besteckgrössen (Standardteller ca. 26 cm).
Berücksichtige versteckte Fette wie Öl, Butter oder Rahmsauce realistisch.
Gehe so vor: 1. Komponenten erkennen. 2. Menge in Gramm schätzen (z. B. 1 Ei ca. 55 g ohne Schale, 1 Tasse gekochter Reis ca. 160 g, eine typische Beilagen-Portion Reis 150–250 g). 3. Nährwerte pro 100 g aus Standardtabellen nehmen (gesfett = gesättigte Fettsäuren, salz = Salz in g; z. B. gekochter Reis 130 kcal, 2,7 g Protein, 28 g KH, 0,3 g Fett; Spiegelei in Öl ca. 195 kcal, 13,6 g Protein, 0,8 g KH, 15 g Fett; gekochtes Ei 155 kcal).
Gib pro Komponente die geschätzte Menge und die Werte pro 100 g an. Rechne nicht selbst hoch.
${note?`Hinweis vom Nutzer: ${note}\n`:""}Antworte nur mit JSON in genau dieser Form:
{"erkannt":true,"gericht":"kurzer Name auf Deutsch","komponenten":[{"name":"Name auf Deutsch","gramm":0,"pro100":{"kcal":0,"protein":0,"kh":0,"fett":0,"gesfett":0,"salz":0}}],"sicherheit":"hoch|mittel|niedrig","hinweis":"ein kurzer Satz"}
Wenn kein Essen zu sehen ist: {"erkannt":false}`;

// fetch mit Zeitlimit, damit nichts endlos „analysiert“
async function tfetch(url,opt,ms){const ac=new AbortController(),t=setTimeout(()=>ac.abort(),ms||60000);
 try{return await fetch(url,{...opt,signal:ac.signal})}catch(e){throw{code:e&&e.name==="AbortError"?"timeout":"net"}}finally{clearTimeout(t)}}
// Google benennt Modelle immer wieder um und schaltet alte ab. Darum fragt die App selbst nach,
// welche Modelle der Schlüssel nutzen darf, nimmt das neueste passende Flash-Modell und merkt sich, was funktioniert.
const GEM_FALLBACK=["gemini-flash-latest","gemini-3.8-flash","gemini-3.6-flash","gemini-3-flash-preview","gemini-2.5-flash"];
const gemVer=n=>{const m=n.match(/gemini-(\d+(?:\.\d+)?)/);return m?parseFloat(m[1]):0};
async function gemModels(key){
 try{
  if(CFG.gemList&&CFG.gemListKey===key.slice(-6)&&Date.now()-(CFG.gemListAt||0)<7*864e5)return CFG.gemList;
  const r=await tfetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000",{headers:{"x-goog-api-key":key}},20000);
  if(!r.ok)return[];
  const j=await r.json(),list=(j.models||[])
   .filter(m=>(m.supportedGenerationMethods||[]).includes("generateContent"))
   .map(m=>String(m.name||"").replace(/^models\//,""))
   .filter(n=>/^gemini-/.test(n)&&/flash/.test(n)&&!/lite|tts|image|live|audio|embed|thinking|exp|learnlm/.test(n));
  // stabile vor Vorschau, neuere Version zuerst
  list.sort((a,b)=>(/preview/.test(a)-/preview/.test(b))||(gemVer(b)-gemVer(a))||(a.length-b.length));
  const top=list.slice(0,6);if(CFG.key===key){CFG.gemList=top;CFG.gemListKey=key.slice(-6);CFG.gemListAt=Date.now();saveCfg()}return top;
 }catch(e){return[]}
}
let FWP=null; // Promise auf {getGenerativeModel, ai}
function fwInit(){
 if(FWP)return FWP;
 FWP=(async()=>{
  if(typeof FIREBASE_CONFIG==="undefined")throw{code:"api",msg:"Firebase ist nicht eingerichtet"};
  const[A,C,M]=await Promise.all([import(FW.sdk+"firebase-app.js"),import(FW.sdk+"firebase-app-check.js"),import(FW.sdk+"firebase-ai.js")]);
  const app=A.getApps().find(a=>a.name==="fw-ai")||A.initializeApp(FIREBASE_CONFIG,"fw-ai");
  let check=false;
  const cap=window.Capacitor&&window.Capacitor.Plugins,nat=cap&&cap.FirebaseAppCheck;
  try{
   if(window.Capacitor&&window.Capacitor.isNativePlatform&&window.Capacitor.isNativePlatform()){
    // Store-App: Token kommt vom Gerät (App Attest bzw. Play Integrity), sobald das Plugin eingebaut ist
    if(nat){C.initializeAppCheck(app,{provider:new C.CustomProvider({getToken:async()=>{const r=await nat.getToken({forceRefresh:false});return{token:r.token,expireTimeMillis:r.expireTimeMillis||Date.now()+30*60000}}}),isTokenAutoRefreshEnabled:true});check=true}
   }else if(FW.recaptcha.key){
    const P=FW.recaptcha.type==="enterprise"?C.ReCaptchaEnterpriseProvider:C.ReCaptchaV3Provider;
    C.initializeAppCheck(app,{provider:new P(FW.recaptcha.key),isTokenAutoRefreshEnabled:true});check=true;
   }
  }catch(e){}
  const ai=M.getAI(app,{backend:new M.GoogleAIBackend(),...(check?{useLimitedUseAppCheckTokens:true}:{})});
  return{M,ai};
 })();
 FWP.catch(()=>{FWP=null});
 return FWP;
}
function fwCount(){const d=new Date().toISOString().slice(0,10);if(!CFG.fwDay||CFG.fwDay.d!==d)CFG.fwDay={d,n:0};return CFG.fwDay}
async function callFW(b64,text){
 const day=fwCount();if(day.n>=FW.perDay)throw{code:"daylimit"};
 let fw;try{fw=await fwInit()}catch(e){throw e&&e.code?e:{code:"net",message:String(e&&e.message||e)}}
 const models=[...new Set([CFG.fwModel,...FW.models].filter(Boolean))];let last=null;let busyRetried=false;
 for(const model of models){
  try{
   const gm=fw.M.getGenerativeModel(fw.ai,{model,generationConfig:{temperature:.2,maxOutputTokens:8192,...(b64?{responseMimeType:"application/json"}:{})}});
   const parts=b64?[{inlineData:{mimeType:"image/jpeg",data:b64}},{text}]:[{text}];
   const res=await Promise.race([gm.generateContent(parts),new Promise((_,rej)=>setTimeout(()=>rej({code:"timeout"}),60000))]);
   const out=res.response.text();
   if(out&&out.trim()){if(CFG.fwModel!==model)CFG.fwModel=model;day.n++;saveCfg();return out}
   last={code:"api",msg:"Leere Antwort"};continue;
  }catch(e){
   if(e&&e.code==="timeout")throw e;
   const m=String((e&&e.message)||e||""),st=e&&e.customErrorData&&e.customErrorData.status;
   if(st===429||/\[429|RESOURCE_EXHAUSTED|exceeded your current quota/i.test(m)){last={code:/per ?day|PerDay/i.test(m)?"fwday":"fwquota",msg:m};
    const w=parseFloat((m.match(/retry in ([\d.]+)s/)||[])[1]);if(w>0&&w<6&&!busyRetried){busyRetried=true;await new Promise(r=>setTimeout(r,w*1000+300));models.splice(models.indexOf(model)+1,0,model)}continue}
   if(/app.?check|attestation|unauthenticated|401/i.test(m))throw{code:"fwcheck",msg:m};
   if(/high demand|overloaded|UNAVAILABLE|\[50[0-4]/i.test(m)){last={code:"fwquota",msg:m};if(!busyRetried){busyRetried=true;await new Promise(r=>setTimeout(r,1500));models.splice(models.indexOf(model)+1,0,model)}continue}
   if(/API has not been used|is disabled|SERVICE_DISABLED|PERMISSION_DENIED|api-not-enabled/i.test(m))throw{code:"fwoff",msg:m};
   if(/Failed to fetch|NetworkError|network/i.test(m))throw{code:"net",message:m};
   last={code:"api",msg:model+": "+m};if(CFG.fwModel===model){delete CFG.fwModel;saveCfg()}
  }
 }
 throw last||{code:"api"};
}
async function callAI(prov,key,b64,text){
 if(prov==="formwerk")return callFW(b64,text);
 if(prov==="gemini"){
  const parts=b64?[{inline_data:{mime_type:"image/jpeg",data:b64}},{text}]:[{text}];
  const found=await gemModels(key);
  const models=[...new Set([CFG.prov==="gemini"&&CFG.key===key?CFG.gemModel:null,...found,...GEM_FALLBACK].filter(Boolean))];
  let last=null;
  for(const model of models){
   const r=await tfetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,{method:"POST",
    headers:{"Content-Type":"application/json","x-goog-api-key":key},
    body:JSON.stringify({contents:[{parts}],generationConfig:{temperature:.2,maxOutputTokens:8192,...(b64?{responseMimeType:"application/json"}:{})}})});
   const j=await r.json().catch(()=>({}));
   if(r.ok){
    const c=j.candidates&&j.candidates[0];
    const out=((c&&c.content&&c.content.parts)||[]).filter(p=>!p.thought).map(p=>p.text||"").join("");
    if(out.trim()){if(CFG.prov==="gemini"&&CFG.key===key&&CFG.gemModel!==model){CFG.gemModel=model;saveCfg()}return out}
    last={code:"api",msg:"Leere Antwort von "+model+(c&&c.finishReason?" ("+c.finishReason+")":"")+(j.promptFeedback&&j.promptFeedback.blockReason?" ("+j.promptFeedback.blockReason+")":"")};continue;
   }
   const m=(j.error&&j.error.message)||"HTTP "+r.status;
   // nur ein wirklich falscher Schlüssel bricht ab, alles andere: nächstes Modell versuchen
   if(/API key not valid|API_KEY_INVALID|API key expired|invalid api key/i.test(m)||r.status===401)throw{code:"key",msg:m};
   last={code:r.status===429?"quota":r.status===403?"key":"api",msg:model+": "+m};
   if(CFG.gemModel===model){delete CFG.gemModel;saveCfg()}
  }
  throw last||{code:"api"};
 }
 const content=b64?[{type:"image",source:{type:"base64",media_type:"image/jpeg",data:b64}},{type:"text",text}]:text;
 const r=await tfetch("https://api.anthropic.com/v1/messages",{method:"POST",
  headers:{"content-type":"application/json","x-api-key":key,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
  body:JSON.stringify({model:PROV.claude.model,max_tokens:1200,messages:[{role:"user",content}]})});
 const j=await r.json().catch(()=>({}));
 if(!r.ok){const m=(j.error&&j.error.message)||"";throw{code:r.status===401?"key":r.status===429?"quota":/credit|balance|billing/i.test(m)?"credit":"api",msg:m}}
 return(j.content||[]).filter(c=>c.type==="text").map(c=>c.text).join("");
}
function parseJSON(t){const a=t.indexOf("{"),b=t.lastIndexOf("}");if(a<0||b<a)throw{code:"parse"};try{return JSON.parse(t.slice(a,b+1))}catch(e){throw{code:"parse"}}}
function errText(e){
 const c=e&&e.code;
 if(c==="daylimit")return"Du hast heute schon "+FW.perDay+" Fotos analysieren lassen, das ist das Tageslimit der eingebauten KI. Morgen geht es weiter, oder trag das Essen über die Suche ein. Wer mehr braucht, kann in Coach → Daten & Verbindungen einen eigenen Schlüssel hinterlegen.";
 if(c==="fwquota")return"Die eingebaute KI ist gerade ausgelastet. Versuch es in ein paar Minuten nochmal.";
 if(c==="fwday")return"Die eingebaute KI hat ihr Tageskontingent für heute aufgebraucht. Morgen geht es wieder, oder trag das Essen über die Suche ein.";
 if(c==="fwcheck")return"Die App konnte sich bei der KI nicht ausweisen. Lade die App einmal neu und versuch es nochmal.";
 if(c==="fwoff")return"Die eingebaute KI ist im Moment nicht verfügbar. Versuch es später nochmal.";
 if(c==="key")return"Der API-Schlüssel wird nicht akzeptiert. Prüfe ihn in den Einstellungen (Coach → Daten & Verbindungen)."+(e.msg?" Meldung von Google/Anthropic: "+e.msg:"");
 if(c==="quota")return"Das Limit ist für den Moment erreicht. Versuch es in ein paar Minuten nochmal.";
 if(c==="credit")return"Dein Anthropic-Guthaben ist aufgebraucht. Lade unter console.anthropic.com → Billing etwas auf.";
 if(c==="parse")return"Die Antwort der KI war unvollständig. Versuch es nochmal.";
 if(c==="timeout")return"Die KI hat zu lange gebraucht (über 60 Sekunden). Versuch es nochmal, am besten mit gutem Empfang.";
 if(c==="api")return"Die KI hat einen Fehler gemeldet"+(e.msg?": "+e.msg:".");
 return"Keine Verbindung zur KI. Prüfe dein Internet und versuch es nochmal."+(e&&e.message?" ("+e.message+")":"");
}

// ---------- Einstellungen (Karte im Coach) ----------
window.aiCardHTML=function(){
 const head=(pill,cls)=>`<div class="row between"><span style="font-weight:700;font-size:16px">KI-Foto-Analyse</span><span class="pill ${cls}">${pill}</span></div>`;
 const msg=UI.msg?`<div class="small" role="alert" style="color:${UI.ok?"var(--good)":"var(--bad)"};font-weight:600">${E(UI.msg)}</div>`:"";
 if(ownKey()&&!UI.setup)return head("eigener Schlüssel","good")+`<div class="small muted">Fotografiere dein Essen, die KI schätzt Lebensmittel, Mengen und Kalorien. Anbieter: ${E(PROV[CFG.prov].name)} (${E(PROV[CFG.prov].cost)}), ohne Tageslimit der App.</div>
  ${msg}<div class="grid2"><button class="btn ghost" data-ai="setup">Ändern</button><button class="btn ghost" data-ai="remove">Eingebaute KI nutzen</button></div>`;
 if(!UI.setup){const n=fwCount().n;return head("bereit","good")+`<div class="small muted">Fotografiere dein Essen, die KI schätzt Lebensmittel, Mengen und Kalorien. Eingebaut und gratis, du brauchst nichts einzurichten. Bis zu ${FW.perDay} Analysen pro Tag${n?`, heute ${n} genutzt`:""}.</div>
  ${msg}<button class="link small" style="align-self:flex-start" data-ai="setup">Eigenen Schlüssel verwenden (optional, ohne Tageslimit)</button>`}
 const p=UI.prov;
 return head("einrichten","")+`<div class="grid2">${Object.entries(PROV).filter(([k])=>k!=="formwerk").map(([k,v])=>`<button class="choice" data-ai="prov" data-v="${k}" aria-pressed="${p===k}"><span style="font-weight:700">${v.name}</span><span class="small muted">${v.cost}</span></button>`).join("")}</div>
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
 const h=host(),top=t=>`<div class="row between"><h2>${t}</h2><button class="icon-btn" aria-label="Schliessen" data-ai="close">${I.x}</button></div>`;
 let b="";
 if(AV.stage==="setup")b=top("KI einrichten")+`<div id="aicard" class="stack" style="gap:10px">${window.aiCardHTML()}</div>`;
 else if(AV.stage==="pick")b=top("Foto vom Essen")+`
  ${AV.img?`<img class="aiimg" src="${AV.img}" alt="Dein Foto">`:`<div class="aidrop"><svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg><div>Fotografiere deinen Teller von schräg oben. Alles sollte gut sichtbar sein.</div></div>`}
  <div class="grid2"><button class="btn ${AV.img?"ghost":""}" data-ai="cam">${AV.img?"Neues Foto":"Foto aufnehmen"}</button><button class="btn ghost" data-ai="lib">Aus Fotos wählen</button></div>
  ${AV.img?`<label class="f">Was sollte die KI wissen? (optional)<input id="ainote" value="${E(AV.note)}" placeholder="z. B. mit Butter gebraten, grosse Portion"></label>
  <button class="btn block gbig" data-ai="analyze">Kalorien schätzen</button>`:""}
  ${AV.err?`<div class="small" role="alert" style="color:var(--bad);font-weight:600">${E(AV.err)}</div>`:""}
  <div class="small muted">Analyse mit ${E(PROV[prov()].name)}. Die Werte sind Schätzungen, du kannst sie danach anpassen.</div>`;
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
 document.querySelectorAll("input.aifile").forEach(x=>x.remove());
 const inp=document.createElement("input");inp.type="file";inp.accept="image/*";inp.className="aifile";inp.style.cssText="position:fixed;left:-9999px;opacity:0;width:1px;height:1px";if(capture)inp.setAttribute("capture","environment");
 document.body.appendChild(inp);
 inp.onchange=async()=>{const f=inp.files&&inp.files[0];inp.remove();if(!f||!AV)return;try{const{url,b64}=await shrink(f);AV.img=url;AV.b64=b64;AV.err="";AV.stage="pick";draw()}catch(e){AV.err="Dieses Bild kann ich nicht öffnen. Versuch ein anderes.";draw()}};
 inp.click();
}
function shrink(file){return new Promise((res,rej)=>{const u=URL.createObjectURL(file),img=new Image();
 img.onload=()=>{URL.revokeObjectURL(u);if(!img.naturalWidth){rej(new Error("leer"));return}const m=1280,s=Math.min(1,m/Math.max(img.naturalWidth,img.naturalHeight)),c=document.createElement("canvas");
  c.width=Math.round(img.naturalWidth*s);c.height=Math.round(img.naturalHeight*s);c.getContext("2d").drawImage(img,0,0,c.width,c.height);
  const url=c.toDataURL("image/jpeg",.82);res({url,b64:url.split(",")[1]})};
 img.onerror=e=>{URL.revokeObjectURL(u);rej(e)};img.src=u})}
async function analyze(){
 const note=(document.getElementById("ainote")||{}).value||"";AV.note=note;AV.stage="busy";AV.err="";draw();
 const run=AV.run={};
 try{
  const txt=await callAI(prov(),CFG.key,AV.b64,PROMPT(note.trim()));
  if(!AV||AV.run!==run)return;
  const r=parseJSON(txt);
  if(r.erkannt===false||!Array.isArray(r.komponenten)||!r.komponenten.length){AV.stage="pick";AV.err="Auf dem Foto konnte ich kein Essen erkennen. Versuch es mit einem näheren Foto.";draw();return}
  AV.res=r;AV.items=r.komponenten.map(k=>{const g=N(k.gramm),h=k.pro100||k.pro_100g;
   if(h&&g>0){const f=g/100,fat=N(h.fett)*f;return{name:String(k.name||"Essen"),g0:g,g,kcal:N(h.kcal)*f,p:N(h.protein)*f,c:N(h.kh)*f,f:fat,sat:h.gesfett!=null?Math.min(fat,N(h.gesfett)*f):null,salt:h.salz!=null?N(h.salz)*f:null,on:true}}
   return{name:String(k.name||"Essen"),g0:g,g,kcal:N(k.kcal),p:N(k.protein),c:N(k.kh),f:N(k.fett),on:true}}).filter(i=>i.kcal>0||i.g>0);
  if(!AV.items.length)throw{code:"parse"};
  AV.stage="result";draw();
 }catch(e){if(!AV||AV.run!==run)return;AV.stage="pick";AV.err=errText(e);draw()}
}
function addFoods(){
 const today=typeof TODAY==="function"?TODAY():new Date().toISOString().slice(0,10);let n=0,kc=0;
 AV.items.filter(i=>i.on&&i.g>0).forEach(i=>{const k=i.g0>0?i.g/i.g0:1;S.foods.push({id:uid(),date:today,meal:AV.meal,name:i.name.trim()||"Essen",g:Math.round(i.g),kcal:i.kcal*k,p:i.p*k,c:i.c*k,f:i.f*k,fib:0,sug:0,...(i.sat!=null?{sat:i.sat*k}:{}),...(i.salt!=null?{salt:i.salt*k}:{}),ai:true});n++;kc+=i.kcal*k});
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
  case"setup":UI.setup=true;UI.prov=ownKey()?CFG.prov:"gemini";UI.msg="";paintCard();break;
  case"cancel":UI.setup=false;UI.msg="";paintCard();if(AV&&AV.stage==="setup")close();break;
  case"prov":UI.prov=b.dataset.v;UI.msg="";paintCard();break;
  case"remove":{const keep=CFG.fwDay;CFG=keep?{fwDay:keep}:{};saveCfg();UI.msg="Die App nutzt wieder die eingebaute KI.";UI.ok=true;paintCard();break}
  case"savekey":{const key=(document.getElementById("aikey").value||"").trim();if(key.length<20){UI.msg="Bitte den vollständigen Schlüssel einfügen.";UI.ok=false;paintCard();break}
   UI.busy=true;UI.msg="";paintCard();
   try{await callAI(UI.prov,key,null,"Antworte nur mit OK.");CFG={prov:UI.prov,key,...(CFG.fwDay?{fwDay:CFG.fwDay}:{})};saveCfg();UI.setup=false;UI.busy=false;UI.msg="Schlüssel funktioniert.";UI.ok=true;
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
window.aiReady=ready;
window.aiText=prompt=>callAI(prov(),CFG.key,null,prompt);
window.aiErr=errText;
window.aiProvName=()=>PROV[prov()].name;
})();
