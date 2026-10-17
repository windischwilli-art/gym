// Formwerk: Meine Woche – Trainingstage, andere Sportarten und Termine selbst festlegen
(function(){
"use strict";
const E=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const WDL=["Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag","Sonntag"];
const SPORTS=["pilates","yoga","schwimmen","boxen","rad","mtb","fussball","tennis","volley","klettern","tanzen","hiit","crosstrainer","rudern","wandern","ski","anderes"];
let WK=null; // {mode:"all"|"once", days:[7]}

function host(){let h=document.getElementById("wkset");if(!h){h=document.createElement("div");h.id="wkset";document.body.appendChild(h)}return h}
function open(){
 const p=S.profile,ws=weekStart(),once=p.weekOv&&p.weekOv.ws===ws;
 const src=once?p.weekOv.days:(p.week||[]);
 WK={mode:once?"once":"all",days:Array.from({length:7},(_,i)=>src[i]?{...src[i]}:null)};
 draw();
}
function close(){WKPREVIEW=null;host().innerHTML="";WK=null}
function preview(){
 WKPREVIEW=WK.days;let pd;try{pd=planDays()}finally{WKPREVIEW=null}
 return pd;
}
function draw(){
 const h=host(),runs=trains("run"),lifts=trains("strength");
 const opts=[["auto","App plant"],...(lifts?[["kraft","Kraft"]]:[]),...(runs?[["lauf","Laufen"]]:[]),["sport","Andere Sportart"],["frei","Keine Zeit"]];
 const rows=WK.days.map((w,i)=>{const k=w?w.k:"auto";
  return`<div class="wkrow ${k!=="auto"?"set":""}" data-k="${k}"><div class="wkhead"><b>${WDL[i]}</b>
   <select data-wk="k" data-i="${i}" aria-label="${WDL[i]}">${opts.map(([v,l])=>`<option value="${v}" ${v===k?"selected":""}>${l}</option>`).join("")}</select></div>
   ${k==="sport"?`<div class="wksport"><select data-wk="act" data-i="${i}" aria-label="Sportart">${SPORTS.map(s=>`<option value="${s}" ${s===(w.act||"pilates")?"selected":""}>${E(actType(s)[1])}</option>`).join("")}</select>
    <label class="wkmin"><input data-wk="min" data-i="${i}" inputmode="numeric" value="${w.min||""}" placeholder="60" aria-label="Minuten"><span>Min.</span></label></div>
    ${(w.act||"pilates")==="anderes"?`<input data-wk="name" data-i="${i}" value="${E(w.name||"")}" placeholder="Name, z. B. Unihockey" aria-label="Name der Sportart">`:""}`:""}</div>`}).join("");
 h.innerHTML=`<div class="scrim" data-wk="scrim"><div class="sheet" role="dialog" aria-modal="true" aria-label="Meine Woche"><div class="grab"></div>
 <div class="row between"><h2>Meine Woche</h2><button class="icon-btn" data-wk="close" aria-label="Schliessen">${I.x}</button></div>
 <p class="small muted" style="margin:0">Leg fest, wann du keine Zeit hast oder andere Sportarten wie Pilates, Schwimmen oder Boxen machst. Die übrigen Trainings verteilt die App auf deine freien Tage.</p>
 <div class="wkmode"><button class="chip" data-wk="mode" data-v="all" aria-pressed="${WK.mode==="all"}">Jede Woche</button><button class="chip" data-wk="mode" data-v="once" aria-pressed="${WK.mode==="once"}">Nur diese Woche</button></div>
 <div class="wkrows">${rows}</div>
 <div id="wkprevwrap">${prevHTML()}</div>
 <div class="grid2"><button class="btn ghost" data-wk="reset">Alles automatisch</button><button class="btn" data-wk="save">Speichern</button></div></div></div>`;
}
function prevHTML(){
 const pd=preview(),WD=["Mo","Di","Mi","Do","Fr","Sa","So"];
 return`<div class="eyebrow" style="margin-bottom:6px">So sieht deine Woche aus</div>
  <div class="wkprev">${pd.map((x,i)=>`<div class="${x.fixed?"fx":""} ${x.t==="Ruhetag"?"rest":""}"><span>${WD[i]}</span><b>${E(x.t)}</b><em>${E(x.d)}</em></div>`).join("")}</div>
  ${pd.dropped?`<div class="tip warn" style="margin-top:8px"><i></i><div class="small">${pd.dropped} ${pd.dropped===1?"Einheit passt":"Einheiten passen"} nicht mehr rein. Gib einen Tag frei, wenn du alles schaffen willst.</div></div>`:""}
  ${S.profile.runCfg?`<div class="small muted" style="margin-top:6px">Läufe aus dem Lauftrainer, die auf einen belegten Tag fallen, werden automatisch auf den nächsten freien Tag verschoben.</div>`:""}`;
}
function save(){
 const days=WK.days.map(w=>{if(!w)return null;const o={k:w.k};if(w.k==="sport"){o.act=w.act||"pilates";if(w.min>0)o.min=+w.min;if(o.act==="anderes"&&(w.name||"").trim())o.name=w.name.trim()}return o});
 const p=S.profile,any=days.some(Boolean);
 if(WK.mode==="once")p.weekOv={ws:weekStart(),days};
 else{p.week=any?days:null;delete p.weekOv}
 window.save();close();render(true);
}

document.addEventListener("click",ev=>{
 const b=ev.target.closest("[data-wk]");if(!b||!WK)return;const k=b.dataset.wk;
 if(b.tagName==="SELECT"||b.tagName==="INPUT")return;
 if(k==="scrim"&&ev.target!==b)return;
 if(k==="close"||k==="scrim")close();
 else if(k==="mode"){WK.mode=b.dataset.v;draw()}
 else if(k==="reset"){WK.days=Array(7).fill(null);draw()}
 else if(k==="save"){const m=WK.mode;save();toast(m==="once"?"Gilt nur für diese Woche":"Deine Woche ist gespeichert")}
});
document.addEventListener("change",ev=>{
 const t=ev.target;if(!WK||!t.dataset||!t.dataset.wk)return;const i=+t.dataset.i,f=t.dataset.wk;
 if(f==="k"){WK.days[i]=t.value==="auto"?null:{k:t.value,...(t.value==="sport"?{act:"pilates",min:60}:{})};draw()}
 else if(f==="act"){WK.days[i].act=t.value;draw()}
 else if(f==="min"||f==="name"){WK.days[i][f]=f==="min"?parseInt(t.value)||0:t.value;const p=document.getElementById("wkprevwrap");if(p)p.innerHTML=prevHTML()}
});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&WK)close()});

const css=document.createElement("style");
css.textContent=`
#wkset .sheet{gap:12px}
.wkmode{display:grid;grid-template-columns:1fr 1fr;gap:6px}.wkmode .chip{text-align:center}
.wkrows{display:flex;flex-direction:column;gap:6px}
.wkrow{display:flex;flex-direction:column;gap:6px;padding:8px 10px;border-radius:12px;background:var(--surface2)}
.wkrow.set{background:color-mix(in srgb,var(--accent) 10%,var(--surface))}
.wkrow[data-k="frei"]{background:color-mix(in srgb,var(--muted) 14%,var(--surface))}
.wkhead{display:flex;align-items:center;justify-content:space-between;gap:10px}.wkhead b{font-size:15px}
.wkhead select{width:auto;min-width:150px;padding:8px 10px}
.wksport{display:flex;gap:6px}.wksport select{flex:1;padding:8px 10px}
.wkmin{display:flex;align-items:center;gap:4px;flex:none;font-size:13px;color:var(--muted)}.wkmin input{width:64px;padding:8px;text-align:right}
.wkrow>input{padding:8px 10px}
.wkprev{display:flex;flex-direction:column;gap:3px}
.wkprev div{display:grid;grid-template-columns:28px auto 1fr;gap:8px;align-items:baseline;font-size:13px;padding:5px 8px;border-radius:8px;background:var(--surface2)}
.wkprev div.fx{background:color-mix(in srgb,var(--accent) 12%,var(--surface))}.wkprev div.rest{opacity:.65}
.wkprev span{font-weight:800;font-size:11px;color:var(--muted)}.wkprev em{font-style:normal;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
`;
document.head.appendChild(css);
window.wkOpen=open;
})();
