// Formwerk: Countdown-Signale (3-2-1 mit Ton und Vibration) und Feier bei persönlichen Rekorden
(function(){
"use strict";
const E=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const D=v=>String(Math.round(v*10)/10).replace(".",",");

// ---------- Ton ----------
let AC=null;
function ac(){try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();if(AC.state==="suspended")AC.resume();return AC}catch(e){return null}}
// Ton bei der ersten Berührung freischalten (iPhone spielt sonst nichts ab)
["touchstart","pointerdown","keydown"].forEach(t=>document.addEventListener(t,()=>{const a=ac();if(a&&!a._unlocked){try{const o=a.createOscillator(),g=a.createGain();g.gain.value=0;o.connect(g);g.connect(a.destination);o.start();o.stop(a.currentTime+.01);a._unlocked=true}catch(e){}}},{passive:true}));
function tone(f,d,vol,at){const a=ac();if(!a)return;const t=a.currentTime+(at||0),o=a.createOscillator(),g=a.createGain();
 o.type="sine";o.frequency.value=f;o.connect(g);g.connect(a.destination);
 g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol||.4,t+.015);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.start(t);o.stop(t+d+.03)}

// ---------- Vibration (Store-App: Haptics-Plugin, Android-Browser: vibrate; Safari kann nicht vibrieren) ----------
function buzz(p){
 const H=window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.Haptics;
 if(H){try{let at=0;(Array.isArray(p)?p:[p]).forEach((ms,i)=>{if(i%2===0)setTimeout(()=>H.vibrate({duration:ms}).catch(()=>{}),at);at+=ms});return}catch(e){}}
 try{navigator.vibrate&&navigator.vibrate(p)}catch(e){}
}

// ---------- grosse Zahl in der Mitte ----------
function flash(txt,cls){
 let el=document.getElementById("fxcount");if(!el){el=document.createElement("div");el.id="fxcount";el.setAttribute("aria-live","assertive");document.body.appendChild(el)}
 el.className="";el.innerHTML=`<span>${E(txt)}</span>`;void el.offsetWidth;el.className="on "+(cls||"");
 clearTimeout(el._t);el._t=setTimeout(()=>{el.className=""},cls==="go"?1100:800);
}
// n = 3, 2, 1
function count(n){tone(n===1?1046:880,.14,.45);buzz(n===1?140:90);flash(String(n))}
function go(label){tone(1318,.22,.5);tone(1760,.4,.5,.2);buzz([260,90,260]);flash(label||"Los!","go")}

// ---------- Persönliche Rekorde ----------
const isBW=n=>window.guideEx&&window.guideEx[n]?!!window.guideEx[n][4]:false;
const holdOf=n=>window.guideEx&&window.guideEx[n]?window.guideEx[n][5]||0:0;
const num=v=>{const n=parseFloat(String(v).replace(",","."));return isFinite(n)?n:0};
const est=(kg,r)=>kg*(1+r/30);
// prüft einen eben erledigten Satz gegen alle früheren Trainings und die schon erledigten Sätze von heute
function checkPR(xi,si){
 try{
  if(typeof CUR==="undefined"||!CUR)return null;const x=CUR.ex[xi],s=x&&x.sets[si];if(!s||!s.done)return null;
  const kg=num(s.kg),reps=num(s.reps);if(!(reps>0))return null;
  const prev=[];(S.workouts||[]).forEach(w=>w.sets.forEach(t=>{if(t.e===x.e)prev.push({kg:+t.kg||0,reps:+t.reps||0})}));
  if(!prev.length)return null; // erstes Mal: noch kein Vergleich
  CUR.ex.forEach((y,yi)=>{if(y.e===x.e)y.sets.forEach((t,ti)=>{if(t.done&&!(yi===xi&&ti===si))prev.push({kg:num(t.kg),reps:num(t.reps)})})});
  const hold=holdOf(x.e),unit=hold?" Sek.":" Wdh.";
  let r=null;
  if(kg>0&&!isBW(x.e)){
   const topKg=Math.max(...prev.map(p=>p.kg)),best=Math.max(...prev.filter(p=>p.kg>0).map(p=>est(p.kg,p.reps)),0),now=est(kg,reps);
   const repsAtKg=Math.max(0,...prev.filter(p=>p.kg===kg).map(p=>p.reps));
   if(kg>topKg)r={type:"Schwerstes Gewicht",big:D(kg)+" kg",was:"bisher "+D(topKg)+" kg"};
   else if(now>best+.05)r={type:"Neues Kraft-Hoch",big:D(kg)+" kg × "+reps,was:"geschätztes 1RM "+D(now)+" kg (bisher "+D(best)+" kg)"};
   else if(repsAtKg&&reps>repsAtKg)r={type:"Mehr Wiederholungen",big:D(kg)+" kg × "+reps,was:"bisher "+repsAtKg+" Wdh. mit "+D(kg)+" kg"};
  }else{
   const top=Math.max(...prev.map(p=>p.reps));
   if(reps>top)r={type:hold?"Längste Haltezeit":"Meiste Wiederholungen",big:reps+unit,was:"bisher "+top+unit};
  }
  if(!r)return null;
  r.e=x.e;(CUR.prs=CUR.prs||[]).push({e:x.e,type:r.type,big:r.big});
  return r;
 }catch(e){return null}
}
function celebrate(r){
 if(!r)return;
 [784,988,1175,1568].forEach((f,i)=>tone(f,.28,.42,i*.11));buzz([120,60,120,60,320]);
 let el=document.getElementById("fxpr");if(!el){el=document.createElement("div");el.id="fxpr";document.body.appendChild(el)}
 const conf=Array.from({length:26},(_,i)=>`<i style="--x:${(Math.random()*2-1).toFixed(2)};--d:${(.6+Math.random()*.7).toFixed(2)}s;--r:${Math.round(Math.random()*720-360)}deg;--c:${["#FFC83D","#FF6B4A","#3D7BFF","#2BD18F","#E6407A"][i%5]};left:${(10+Math.random()*80).toFixed(1)}%"></i>`).join("");
 el.innerHTML=`<div class="fxprcard" role="status" aria-live="polite"><div class="fxconf">${conf}</div>
  <div class="fxtrophy"><svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/></svg></div>
  <div class="fxeyebrow">Persönlicher Rekord</div><div class="fxbig">${E(r.big)}</div><div class="fxtype">${E(r.type)} · ${E(r.e)}</div><div class="fxwas">${E(r.was)}</div></div>`;
 el.className="on";clearTimeout(el._t);el._t=setTimeout(()=>{el.className=""},3800);
 el.onclick=()=>{el.className=""};
}
function pr(xi,si){const r=checkPR(xi,si);if(r)celebrate(r);return r}

const css=document.createElement("style");
css.textContent=`
#fxcount{position:fixed;inset:0;z-index:80;display:grid;place-items:center;pointer-events:none;opacity:0}
#fxcount span{display:grid;place-items:center;width:min(64vw,300px);aspect-ratio:1;border-radius:50%;background:color-mix(in srgb,var(--surface,#fff) 90%,transparent);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);box-shadow:0 20px 60px -20px rgba(0,0,0,.35);font-family:var(--display,inherit);font-weight:800;font-size:min(40vw,190px);line-height:1;color:var(--c-lift,#3D5AFE)}
#fxcount.on{animation:fxpop .8s cubic-bezier(.2,.9,.3,1) both}
#fxcount.go span{font-size:min(20vw,96px);color:var(--good,#22a06b)}
#fxcount.go.on{animation-duration:1.1s}
@keyframes fxpop{0%{opacity:0;transform:scale(1.8)}18%{opacity:1;transform:scale(1)}70%{opacity:1}100%{opacity:0;transform:scale(.85)}}
#fxpr{position:fixed;left:0;right:0;top:calc(env(safe-area-inset-top,0px) + 14px);z-index:85;display:flex;justify-content:center;padding:0 14px;pointer-events:none;opacity:0;transform:translateY(-30px);transition:opacity .3s,transform .4s cubic-bezier(.2,1.4,.4,1)}
#fxpr.on{opacity:1;transform:none;pointer-events:auto}
.fxprcard{position:relative;overflow:hidden;width:100%;max-width:400px;text-align:center;padding:18px 16px 16px;border-radius:22px;color:#1b1400;background:linear-gradient(135deg,#FFE27A,#FFB938);box-shadow:0 18px 50px -12px rgba(255,170,0,.65)}
.fxtrophy{width:60px;height:60px;margin:0 auto 6px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.55);color:#9a5b00}
#fxpr.on .fxtrophy{animation:fxwob .9s cubic-bezier(.3,1.6,.5,1) both}
@keyframes fxwob{0%{transform:scale(.2) rotate(-30deg)}100%{transform:none}}
.fxeyebrow{font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;opacity:.75}
.fxbig{font-family:var(--display,inherit);font-size:34px;font-weight:800;line-height:1.1;margin-top:2px}
.fxtype{font-weight:700;font-size:15px;margin-top:2px}.fxwas{font-size:13px;opacity:.75;margin-top:2px}
.fxconf{position:absolute;inset:0;pointer-events:none}
.fxconf i{position:absolute;top:-10px;width:8px;height:12px;border-radius:2px;background:var(--c);opacity:0}
#fxpr.on .fxconf i{animation:fxfall var(--d) ease-out .1s both}
@keyframes fxfall{0%{opacity:1;transform:translate(0,0) rotate(0)}100%{opacity:0;transform:translate(calc(var(--x)*70px),170px) rotate(var(--r))}}
@media (prefers-reduced-motion:reduce){#fxcount.on,#fxpr.on .fxtrophy,#fxpr.on .fxconf i{animation:none}#fxcount.on{opacity:1}}
`;
document.head.appendChild(css);
window.fx={count,go,buzz,tone,pr,checkPR,celebrate};
})();
