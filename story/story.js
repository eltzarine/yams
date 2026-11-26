/* ================= Mode histoire =================
   Chapitre 1 : Nico, le patron du Parvis (bar de bikers), t'apprend à jouer.
   Combat en 13 tours contre un bot, avec les dés 3D de l'accueil (dice-box).
   Utilise les règles de la feuille (compute, counts, hasRun, UPPER, LOWER, ALL, DEFAULTS) avec les réglages par défaut. */
(()=>{
const PKEY="yams_histoire";
const TKEY="yams_histoire_conseils";
const BOSSES=[{id:"nico",nom:"Nico",titre:"Le patron",lieu:"Le Parvis · bar de bikers",sprite:"story/nico_sprite.png",head:"story/nico_head_sprite.png"}];
const NEXT="La Comptable";
const prog=()=>{try{return JSON.parse(localStorage.getItem(PKEY)||"{}")||{}}catch(e){return{}}};
const saveProg=p=>{try{localStorage.setItem(PKEY,JSON.stringify(p))}catch(e){}};
const tipsOn=()=>{try{return localStorage.getItem(TKEY)!=="0"}catch(e){return true}};
const me=()=>{try{const n=typeof meName==="function"?meName():null;return n||"Toi"}catch(e){return"Toi"}};
const E=s=>typeof esc==="function"?esc(s):String(s);
const ga=(n,p)=>{try{if(window.gtag)gtag("event",n,p||{})}catch(e){}};
const ST={...DEFAULTS};
const pts=(k,v)=>{const save=S.settings;S.settings=ST;try{return compute(k,v).pts}finally{S.settings=save}};
const SHORT={un:"1",deux:"2",trois:"3",quatre:"4",cinq:"5",six:"6",brelan:"Brelan",carre:"Carré",full:"Full",chance:"Chance",petite:"P. suite",grande:"G. suite",yams:"Yam's"};
const SAY={un:"les 1",deux:"les 2",trois:"les 3",quatre:"les 4",cinq:"les 5",six:"les 6",brelan:"Brelan",carre:"Carré",full:"Full",chance:"Chance",petite:"Petite suite",grande:"Grande suite",yams:"Yam's"};
const ROWS=[["un","deux","trois","quatre","cinq","six"],["brelan","carre","full","chance"],["petite","grande","yams"]];
const GEAR=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>`;
const XICON=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>`;

/* ---------- bloc sur l'accueil ---------- */
window.storyHTML=()=>{const p=prog(),won=p.nico==="win",b=BOSSES[0];
  return`<div class="storybox" id="storyBox"><img class="sb-sprite" src="${b.sprite}" alt="" aria-hidden="true">
  <small>Mode histoire · Chapitre 1</small><h2>${b.nom}</h2>
  <p>${won?`Nico est battu. Prochain adversaire : <b>${NEXT}</b>, bientôt.`:`Le patron du <b>Parvis</b> t'apprend à jouer. Bats-le pour gagner ta place au club.`}</p>
  <button id="storyGo" type="button">${won?"Revanche":"Jouer l'histoire"}</button>${won?`<span class="sb-done">✓ Battu${p.best?" · record "+p.best:""}</span>`:""}</div>`};
/* l'histoire se joue avec un compte : sans connexion, même parcours que « Me connecter », puis le combat s'ouvre */
const needLogin=()=>{try{return ACC_ON&&typeof meName==="function"&&!meName()}catch(e){return false}};
window.bindStory=()=>{const b=document.getElementById("storyGo");if(b)b.onclick=()=>{
  if(needLogin()&&typeof accTap==="function"){ga("histoire_connexion_demandee");if(window.loginThen)loginThen(()=>{if(!needLogin()){ga("histoire_connexion_ok");open()}});accTap();return}
  open()}};
/* connexion / déconnexion pendant le combat : pastille à jour, et retour à l'accueil si on n'est plus connecté */
window.storyAcct=()=>{if(!root||root.hidden)return;if(needLogin())return close();names()};

/* ---------- écran de combat ---------- */
let root=null,box=null,boxP=null;
const G={phase:"off",turn:1,throws:0,me:{},bot:{},locked:new Set(),broken:new Set(),pending:null,busy:false,lastTap:0,tapT:0,vals:[],tut:0};
const $=s=>root.querySelector(s);

function build(){
  root=document.createElement("div");root.className="story";root.id="story";root.hidden=true;root.setAttribute("role","dialog");root.setAttribute("aria-label","Mode histoire");
  const b=BOSSES[0];
  root.innerHTML=`<div class="scr">
  <header class="stop"><h1 class="brand"><img src="logo-yams-club.webp" alt="Yam’s Club" width="1086" height="362"></h1>
    <button class="sib acct on" id="sAcct" type="button"><span aria-hidden="true">👤</span><span class="an"></span></button>
    <button class="sib" id="sGear" type="button" aria-label="Réglages" title="Réglages">${GEAR}</button>
    <button class="sib" id="sQuit" type="button" aria-label="Quitter le combat" title="Quitter">${XICON}</button></header>
  <section class="shud" aria-label="Score">
    <div class="spf" id="sPfMe"><div class="ini"></div></div>
    <div class="sside"><div class="shp"><i id="sBarMe"></i><b id="sScMe">0</b></div><div class="snm sark" id="sNmMe"></div></div>
    <div class="stimer"><small>Tour</small><b class="sark" id="sTour">1</b></div>
    <div class="sside r"><div class="shp"><i id="sBarB"></i><b id="sScB">0</b></div><div class="snm sark">${b.nom}</div></div>
    <div class="spf" id="sPfB"><img src="${b.head}" alt="${b.nom}"></div>
  </section>
  <section class="szone" id="sZone" aria-label="Piste de dés">
    <div class="sfelt"></div><img class="swm" src="logo-yams-club.webp" alt="" aria-hidden="true"><div class="spiste"></div>
    <div class="sdice" id="sdice"></div>
    <div class="ssay off" id="sSay"><p></p></div>
    <div class="sscore sark" id="sScore"></div>
    <div class="shint" id="sHint"></div>
    <div class="shudl" id="sHud" hidden></div>
  </section>
  <div class="sinfo" id="sInfo"></div>
  <section class="sgrid" id="sGrid"></section>
  <div class="svs off" id="sVs"></div>
  <div class="sko" id="sKo"></div>
  <div class="smodal" id="sModal" hidden><div class="box" id="sBox"></div></div>
  </div>`;
  document.body.appendChild(root);
  $("#sQuit").onclick=askQuit;$("#sAcct").onclick=()=>{if(typeof accTap==="function")accTap()};$("#sGear").onclick=gear;
  $("#sZone").addEventListener("click",tap);["pointerdown","touchend","click"].forEach(ev=>root.addEventListener(ev,()=>{revive();audio();if(musicOn())ctx()},{passive:true}));
  $("#sGrid").addEventListener("click",e=>{const c=e.target.closest(".sc");if(c&&G.phase==="me")choose(c.dataset.k)});
  $("#sVs").addEventListener("click",()=>{if(G.phase==="vs"&&mus.want==="entree")mus.play("match",.6);skipVs()});
}

function open(){
  if(!root)build();
  names();
  root.hidden=false;document.documentElement.classList.add("story-on");
  G.gen=(G.gen||0)+1;Object.assign(G,{phase:"vs",turn:1,throws:0,me:{},bot:{},busy:false,vals:[],tut:0,warned:false,warnK:null,pending:null,botLast:null,t0:Date.now(),rollMs:[],nBroken:0});G.locked.clear();G.broken.clear();
  paintHud();grid();say("");hint("");hud();
  mus.pos=0;mus.load();mus.play("entree");
  /* tapis vide à chaque combat : on attend un éventuel lancer encore en cours (combat quitté en plein lancer), puis on vide */
  inflight=inflight.then(()=>{if(box)try{box.clear()}catch(e){}});
  vs();initDice();ga("histoire_debut",{boss:"nico"});
}
function names(){const n=me();$("#sAcct .an").textContent=n;$("#sAcct").setAttribute("aria-label","Mon compte : "+n);
  $("#sPfMe .ini").textContent=(n[0]||"?").toUpperCase();$("#sNmMe").textContent=n}
function close(){
  G.phase="off";mus.stop(.4);root.hidden=true;
  if(shared){const f=inflight;shareQ=shareQ.then(()=>f).then(()=>window.yamsDice.give());shared=false;box=null;boxP=null} /* rend le tapis à l'accueil une fois le lancer en cours fini */
document.documentElement.classList.remove("story-on");$("#sModal").hidden=true;
  if(typeof render==="function")render(); /* rafraîchit le bloc histoire de l'accueil */
}

/* ---------- écran VS (calé sur le riff d'entrée de 5,2 s : VS à 3,35 s, fin à 4,9 s), puis « Ready ? Fight ! », puis « À toi ! » ---------- */
let vsT=0;
function vs(){const b=BOSSES[0],n=me(),v=$("#sVs");
  v.innerHTML=`<div class="f"><div class="big"><div class="ini">${E((n[0]||"?").toUpperCase())}</div></div><b class="sark">${E(n)}</b><small>Le bleu</small></div>
  <b class="sark">VS</b>
  <div class="f"><small>${b.lieu}</small><img class="sprite" src="${b.sprite}" alt="${b.nom}"><b class="sark">${b.nom}</b><small>${b.titre}</small></div>`;
  v.classList.remove("off");clearTimeout(vsT);vsT=setTimeout(skipVs,4900)}
function skipVs(){if(G.phase!=="vs")return;clearTimeout(vsT);$("#sVs").classList.add("off");G.phase="ready";
  voice("rf"); /* un seul fichier : « Ready ? » à 0,1 s, « Fight ! » à 1,8 s */
  vsT=setTimeout(()=>{if(G.phase!=="ready")return;ko("Round 1","Ready ?");
  vsT=setTimeout(()=>{if(G.phase!=="ready")return;ko(BOSSES[0].nom+" vs "+me(),"Fight !");sfx.bell1();
    vsT=setTimeout(()=>{if(G.phase==="ready")startMyTurn()},1000)},1700)},100)}
function ko(small,big){const k=$("#sKo");k.innerHTML=`<div><small>${small}</small><b class="sark">${big}</b></div>`;k.classList.remove("go");void k.offsetWidth;k.classList.add("go")}

/* ---------- textes ---------- */
let sayT=0;
function say(html,ms,force){const s=$("#sSay");clearTimeout(sayT);if(!html||(!tipsOn()&&!ms&&!force)){s.classList.add("off");return}
  s.querySelector("p").innerHTML=html;s.classList.remove("off");if(ms)sayT=setTimeout(()=>s.classList.add("off"),ms)}
function hint(t){$("#sHint").textContent=t||""}
function hud(){const h=$("#sHud");if(G.phase!=="me"&&G.phase!=="bot"||!G.throws&&G.phase!=="me"){h.hidden=true;return}h.hidden=false;
  h.innerHTML=[0,1,2].map(i=>`<i class="${i<G.throws?"":"off"}"></i>`).join("")+(G.pending?"Dé cassé · relance":`${G.phase==="bot"?"Nico · ":""}Lancer ${G.throws}/3`);h.classList.toggle("ko",!!G.pending||G.broken.size>0)}
function pop(t){const s=$("#sScore");s.textContent=t;s.classList.remove("on");void s.offsetWidth;s.classList.add("on")}

/* ---------- scores ---------- */
const total=sc=>{const h=UPPER.reduce((a,u)=>a+(sc[u[0]]||0),0);return h+(h>=+ST.seuil?+ST.prime:0)+LOWER.reduce((a,l)=>a+(sc[l[0]]||0),0)};
function paintHud(){const a=total(G.me),b=total(G.bot),pc=v=>Math.min(100,v/2.6)+"%";
  $("#sScMe").textContent=a;$("#sScB").textContent=b;$("#sBarMe").style.width=pc(a);$("#sBarB").style.width=pc(b);
  $("#sTour").textContent=Math.min(13,G.turn);
  $("#sPfMe").classList.toggle("on",G.phase==="me");$("#sPfB").classList.toggle("on",G.phase==="bot")}
function best(sc,v){let k=null,p=0;ALL.forEach(c=>{if(sc[c]!=null)return;const x=pts(c,v);if(x>p){p=x;k=c}});return k?{k,p}:null}
const upper=sc=>UPPER.reduce((a,u)=>a+(sc[u[0]]||0),0);
function grid(){const isBot=G.phase==="bot",sc=isBot?G.bot:G.me,v=G.vals,can=!isBot&&G.phase==="me"&&G.throws>0&&!G.pending&&v.length===5,hot=can?best(G.me,v):null;
  const h=upper(sc),left=Math.max(0,+ST.seuil-h),upDone=UPPER.every(u=>sc[u[0]]!=null);
  $("#sInfo").innerHTML=`<span class="${isBot?"bot":""}">${isBot?"Grille de Nico":"Ta grille"}</span><span>${h>=+ST.seuil?`<b>Prime +${ST.prime} ✓</b>`:upDone?`Prime ratée (${h}/${ST.seuil})`:`1 à 6 : <b>${h}</b>/${ST.seuil} · encore <b>${left}</b> pour +${ST.prime}`}</span>`;
  $("#sGrid").classList.toggle("bot",isBot);
  $("#sGrid").innerHTML=ROWS.map(r=>`<div class="srow" style="grid-template-columns:repeat(${r.length},minmax(0,1fr))">${r.map(k=>{
    const done=sc[k]!=null,val=done?sc[k]:can?pts(k,v):"·";
    const cl=isBot&&G.botLast===k?"hot":done?"done":hot&&hot.k===k?"hot":!can?"wait":val===0?"z":"";
    return`<button type="button" class="sc ${cl}" data-k="${k}" aria-label="${SAY[k]} : ${val}"><span>${SHORT[k]}</span><b>${val}</b></button>`}).join("")}</div>`).join("")}

/* ---------- dés 3D (même moteur et mêmes réglages que l'accueil) ---------- */
/* le monde 3D du tapis du combat (l'accueil a le sien) : on le retrouve par son canvas */
let myWorld=null,shared=false,shareQ=Promise.resolve();const peek=()=>{if(shared)return window.yamsDice.peek();if(!myWorld)myWorld=(globalThis.__yamsWorlds||[]).find(w=>{const c=w.yamsPeek().canvas;return c&&c.closest&&c.closest("#sdice")})||null;const w=myWorld||(!globalThis.__yamsWorlds&&globalThis.__yamsWorld);return w&&w.yamsPeek()}; /* repli : ancien fichier de dés encore en cache */
const rolls=()=>{const r=box&&box.getRollResults()[0];return r?r.rolls:[]};
const allIds=()=>rolls().map(x=>x.rollId);
const live=()=>{const p=peek();return p?Object.values(p.dice).filter(d=>d.mesh&&d.mesh.rotationQuaternion&&d.config&&d.config.rollId!=null):[]};
const geo=d=>{const p=peek(),m=p.scene.getTransformMatrix().m,cv=p.canvas,W=cv.clientWidth,H=cv.clientHeight;
  const pr=(x,y,z)=>{const X=x*m[0]+y*m[4]+z*m[8]+m[12],Y=x*m[1]+y*m[5]+z*m[9]+m[13],w=x*m[3]+y*m[7]+z*m[11]+m[15];return[(X/w+1)/2*W,(1-Y/w)/2*H]};
  const q=d.mesh.rotationQuaternion,o=d.mesh.position;
  const rot=(x,y,z)=>{const tx=2*(q.y*z-q.z*y),ty=2*(q.z*x-q.x*z),tz=2*(q.x*y-q.y*x);return[x+q.w*tx+(q.y*tz-q.z*ty),y+q.w*ty+(q.z*tx-q.x*tz),z+q.w*tz+(q.x*ty-q.y*tx)]};
  const ax=[rot(1,0,0),rot(0,1,0),rot(0,0,1)];let k=0;ax.forEach((a,i)=>{if(Math.abs(a[1])>Math.abs(ax[k][1]))k=i});
  const up=ax[k].map(v=>v*Math.sign(ax[k][1])),side=ax[(k+1)%3];
  const e=d.mesh.getBoundingInfo().boundingBox.extendSize,h=Math.max(e.x,e.y,e.z)*Math.abs(d.mesh.scaling.x)||.33;
  const floor=Math.min(...live().map(x=>x.mesh.position.y));
  const t=[o.x+up[0]*h,o.y+up[1]*h,o.z+up[2]*h],c=pr(...t),s=pr(t[0]+side[0]*h,t[1]+side[1]*h,t[2]+side[2]*h);
  return{x:c[0],y:c[1],size:2*Math.hypot(s[0]-c[0],s[1]-c[1]),flat:Math.abs(up[1]),lift:(o.y-floor)/h}};
/* dé cassé : penché de plus de 12° ou posé sur un autre dé (même règle que l'accueil) */
const isBroken=d=>{const g=geo(d);return g.flat<.978||g.lift>1};
const TINT={base:"#FBF8F1",on:"#86AAD6",ko:"#F0A49A",win:"#F3CF5E"};
const tint=(d,kind)=>{const b=d.mesh.instancedBuffers;if(!b||!b.customColor)return;const h=TINT[kind];if(b.customColor.__k===kind)return;
  const c=new b.customColor.constructor(parseInt(h.slice(1,3),16)/255,parseInt(h.slice(3,5),16)/255,parseInt(h.slice(5,7),16)/255);c.__k=kind;b.customColor=c};
let rq=0;
function paintDice(win){const p=peek();if(!p)return;live().forEach(d=>{const id=d.config.rollId;tint(d,G.broken.has(id)?"ko":G.locked.has(id)?"on":win&&win.has(id)?"win":"base")});
  cancelAnimationFrame(rq);if(G.busy)return; /* pendant un lancer, dice-box dessine déjà : pas de second rendu */
  let n=0;const f=()=>{if(G.busy)return;p.scene.render();if(++n<24)rq=requestAnimationFrame(f)};f()}
/* le combat emprunte le tapis 3D de l'accueil (un seul moteur 3D pour toute l'appli) ; tapis à lui seulement si l'accueil n'en a pas */
function initDice(){
  if(boxP)return boxP;
  if(window.yamsDice)return boxP=(shareQ=shareQ.then(()=>window.yamsDice.take($("#sdice")))).then(b=>{
    if(!b){boxP=null;return ownDice()}
    if(G.phase==="off"){window.yamsDice.give();boxP=null;return null} /* combat déjà quitté */
    shared=true;box=b;return b});
  return ownDice()}
function ownDice(){
  let gl=false;try{const c=document.createElement("canvas");gl=!!(c.getContext("webgl2")||c.getContext("webgl"))}catch(e){}
  if(!gl){noDice();return boxP=Promise.resolve(null)}
  const base=new URL(".",location.href);
  return boxP=import("../dice/dice-box.es.min.js").then(async({default:DiceBox})=>{
    box=new DiceBox({container:"#sdice",origin:base.origin,assetPath:base.pathname+"dice/assets/",offscreen:!1,
      theme:"yams",themeColor:TINT.base,scale:5,insetPx:62,wallH:1.5,startingHeight:7,shadowTransparency:.65,lightIntensity:1.05,
      gravity:2.2,mass:3,throwForce:4,spinForce:4,restitution:.05,friction:.9,linearDamping:.6,angularDamping:.55});
    await box.init();return box}).catch(e=>{console.warn("dés 3D indisponibles",e);noDice();return null})}
function noDice(){const z=$("#sZone");if(z.querySelector(".snod3"))return;const d=document.createElement("div");d.className="snod3";
  d.textContent="Le mode histoire a besoin des dés 3D, indisponibles sur cet appareil.";z.appendChild(d)}
/* lance les dés donnés (rollId) et renvoie les 5 valeurs */
let inflight=Promise.resolve();
async function toss(ids){if(G.busy)return null;G.busy=true;const gen=G.gen,prev=inflight;let fin;inflight=new Promise(r=>fin=r);
  try{await prev}catch(e){}if(gen!==G.gen){fin();G.busy=false;return null}
  const b=await initDice();if(!b){fin();G.busy=false;return null}cancelAnimationFrame(rq);const tR=performance.now();G.broken.clear();rattle();hookImpacts();
  try{const rs=b.getRollResults()[0];
    /* toujours 5 dés sur le tapis : si un lancer a été interrompu (appli quittée, erreur), on vide le tapis avant de relancer les 5 */
    if(rs&&rs.rolls.length===5&&live().length===5&&b.getRollResults().length===1)await b.reroll(rs.rolls.filter(r=>ids.includes(r.rollId)),{remove:true});
    else{try{b.clear()}catch(e){}G.locked.clear();await b.roll("5dpip")}
    if(gen!==G.gen)return null; /* combat quitté pendant le lancer */
    if(live().length!==5||rolls().length!==5){try{b.clear()}catch(e){}G.locked.clear();await b.roll("5dpip")} /* jamais plus de 5 dés */
    live().forEach(d=>{if(ids.includes(d.config.rollId)&&isBroken(d))G.broken.add(d.config.rollId)});
    G.vals=rolls().map(r=>r.value);G.rollMs&&G.rollMs.push(Math.round(performance.now()-tR));if(G.broken.size){G.nBroken++;sfx.broken();if(navigator.vibrate)navigator.vibrate(60)}
    return{v:G.vals,broken:G.broken.size>0}}catch(e){try{b.clear()}catch(_){}return null}finally{if(gen===G.gen)G.busy=false;fin()}}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
/* Nico ne reste jamais bloqué : si un lancer échoue, il réessaie */
async function tossRetry(ids){for(let i=0;i<4;i++){const r=await toss(ids);if(r||G.phase!=="bot")return r;await wait(400)}return null}
/* mesures envoyées avec la fin ou l'abandon : durée de la partie et vitesse des lancers (repère les téléphones qui rament) */
function stats(){const r=G.rollMs||[],moy=r.length?Math.round(r.reduce((x,y)=>x+y,0)/r.length):0;
  return{duree_s:Math.round((Date.now()-(G.t0||Date.now()))/1000),lancers:r.length,lancer_moyen_ms:moy,lancer_max_ms:r.length?Math.max(...r):0,des_casses:G.nBroken||0}}
const issue=(a,b)=>a>b?"gagne":a===b?"egalite":"perdu";

/* ---------- sons : vrais bruits de dés (mêmes fichiers que l'accueil) + coups façon Street Fighter fabriqués avec Web Audio ----------
   Réglage partagé avec l'accueil (bouton haut-parleur, clé yamsSon). Respecte le mode silencieux de l'iPhone. */
const SKEY="yamsSon";let actx=null,master=null,lastAny=0,noiseBuf=null;const BUF={felt:[],click:[],rf:[]};
const soundOn=()=>{try{return localStorage.getItem(SKEY)!=="0"}catch(e){return true}};
const MKEY="yamsMusique";
const musicOn=()=>{try{return localStorage.getItem(MKEY)!=="0"}catch(e){return true}};
const audio=()=>soundOn()?ctx():null;
/* contexte audio commun aux bruitages et à la musique. Au retour dans l'appli, l'iPhone peut le laisser « interrompu » :
   on le relance quel que soit son état et, s'il refuse encore après un toucher, on le recrée (les sons déjà chargés sont réutilisés). */
function ctx(){
  if(!actx){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return null;
    try{if(navigator.audioSession)navigator.audioSession.type="ambient"}catch(e){}
    actx=new AC();master=actx.createGain();master.gain.value=.85;master.connect(actx.destination);
    const base=new URL(".",location.href).pathname;
    const get=(list,name,n)=>{for(let i=1;i<=n;i++)fetch(base+`dice/sounds/${name}${i}.mp3`).then(r=>r.arrayBuffer()).then(b=>new Promise((ok,ko)=>actx.decodeAudioData(b,ok,ko))).then(x=>list.push(x)).catch(()=>{})};
    if(!BUF.felt.length){get(BUF.felt,"surface_felt",7);get(BUF.click,"dicehit_plastic",5)}
    ["rf"].forEach(n=>{if(!BUF[n].length)fetch(base+"story/voix/ready-fight.mp3").then(r=>r.arrayBuffer()).then(b=>new Promise((ok,ko)=>actx.decodeAudioData(b,ok,ko))).then(x=>BUF[n].push(x)).catch(()=>{})});
    mbus=actx.createGain();mbus.connect(actx.destination);
    noiseBuf=actx.createBuffer(1,actx.sampleRate*.6,actx.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1}
  if(actx.state!=="running")actx.resume().catch(()=>{});return actx}
/* Safari iPhone : après être sorti de l'appli, le contexte peut se dire « running » tout en restant muet.
   Au premier toucher après un retour, on le recrée donc systématiquement (les sons chargés sont réutilisés, la musique reprend où elle était). */
let wasHidden=false;
function hardReset(){const old=actx;try{old.close()}catch(e){}actx=null;mus.cur=null;roomIn=null;["felt","click","rf"].forEach(k=>BUF[k].length=0);ctx();mus.resume()}
function revive(){if(!actx)return;if(wasHidden){wasHidden=false;return hardReset()}if(actx.state==="running")return;const old=actx;old.resume().catch(()=>{});
  setTimeout(()=>{if(actx!==old||old.state==="running")return;try{old.close()}catch(e){}actx=null;mus.cur=null;ctx();mus.resume()},350)}
document.addEventListener("visibilitychange",()=>{if(!actx)return;if(document.hidden){wasHidden=true;mus.pauseAt();actx.suspend().catch(()=>{})}else actx.resume().catch(()=>{})});

/* ---------- musique : riff d'entrée, boucle de match, fin de match. Bouton « Musique » dans les réglages (clé yamsMusique). ---------- */
let mbus=null,roomIn=null;const MBUF={};
const mus={cur:null,want:null,pos:0,
  load(){const base=new URL(".",location.href).pathname;["entree","match","victoire","defaite"].forEach(n=>{if(MBUF[n]||MBUF[n]===0)return;MBUF[n]=0;
    fetch(base+`story/musique/${n}.mp3`).then(r=>r.arrayBuffer()).then(b=>new Promise((ok,ko)=>ctx().decodeAudioData(b,ok,ko))).then(x=>{MBUF[n]=x;if(mus.want===n&&!mus.cur)mus.play(n)}).catch(()=>{delete MBUF[n]})})},
  vol:{entree:.42,match:.2,victoire:.42,defaite:.42},
  play(n,fadeIn){this.want=n;this.stop(.25,true);if(!musicOn()||root.hidden)return;const a=ctx(),b=MBUF[n];if(!a||!b)return this.load();
    const s=a.createBufferSource(),g=a.createGain();s.buffer=b;const t=a.currentTime,v=this.vol[n];
    g.gain.setValueAtTime(fadeIn?.0001:v,t);if(fadeIn)g.gain.exponentialRampToValueAtTime(v,t+fadeIn);
    let off=0;if(n==="match"){s.loop=true;s.loopStart=1;s.loopEnd=31;off=1+(this.pos||0)%30}
    s.connect(g).connect(mbus);s.start(t,off);this.cur={s,g,n,t0:t-(off-(n==="match"?1:0))};
    s.onended=()=>{if(this.cur&&this.cur.s===s){this.cur=null;if(n==="entree"&&this.want==="entree")this.play("match",1)}}},
  stop(fade,keepWant){const c=this.cur;if(!keepWant)this.want=null;if(!c)return;this.cur=null;const a=actx;if(!a)return;const t=a.currentTime;
    try{c.g.gain.cancelScheduledValues(t);c.g.gain.setValueAtTime(c.g.gain.value,t);c.g.gain.linearRampToValueAtTime(0,t+(fade||.2));c.s.stop(t+(fade||.2)+.02)}catch(e){}},
  pauseAt(){const c=this.cur;if(c&&c.n==="match"&&actx&&actx.state==="running")this.pos=actx.currentTime-c.t0},
  resume(){if(this.want==="match"&&!this.cur){this.pauseAt();this.play("match",.8)}}};
const play=(list,vol,rate)=>{const a=audio();if(!a||!list.length)return false;const s=a.createBufferSource();s.buffer=list[Math.random()*list.length|0];
  s.playbackRate.value=rate||(.92+Math.random()*.16);const g=a.createGain();g.gain.value=vol;s.connect(g).connect(master);s.start(a.currentTime+Math.random()*.008);return true};
const clack=v=>{const a=audio();if(!a)return;const now=a.currentTime;if(now-lastAny<.03)return;lastAny=now;play(BUF.felt,.25+.55*Math.max(.1,Math.min(1,v)))};
const rattle=()=>{for(let i=0;i<3;i++)setTimeout(()=>play(BUF.click,.12+Math.random()*.08),i*70+Math.random()*30)};
const track={};let hooked=false;
function hookImpacts(){const p=peek();if(hooked||!p||!p.scene)return;hooked=true;
  p.scene.onAfterRenderObservable.add(()=>{if(!soundOn()||root.hidden)return;const t=performance.now();
    Object.values(p.dice).forEach(d=>{if(!d.mesh||!d.config)return;const id=d.config.rollId,o=d.mesh.position,q=track[id];
      if(o.y<-50){delete track[id];return}if(q&&q.x===o.x&&q.y===o.y&&q.z===o.z)return;
      if(!q){track[id]={x:o.x,y:o.y,z:o.z,t,s:0,last:0};return}
      const dt=(t-q.t)/1000;if(dt<=0||dt>.3){Object.assign(q,{x:o.x,y:o.y,z:o.z,t,s:0});return}
      const s=Math.hypot(o.x-q.x,o.y-q.y,o.z-q.z)/dt;if(q.s>1.2&&s<q.s*.55&&t-q.last>70){clack(q.s/9);q.last=t}
      Object.assign(q,{x:o.x,y:o.y,z:o.z,t,s})})})}
/* ---------- ring de boxe : gant (avec un peu de salle), cloche, foule ---------- */
function room(){const a=actx;if(roomIn&&roomIn.context===a)return roomIn;const i=a.createGain(),d=a.createDelay(),fb=a.createGain(),lp=a.createBiquadFilter();
  d.delayTime.value=.09;fb.gain.value=.3;lp.type="lowpass";lp.frequency.value=2200;i.connect(master);i.connect(d);d.connect(lp).connect(fb).connect(d);lp.connect(master);return roomIn=i}
function env(g,t,v,att,dec){g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v,t+att);g.gain.exponentialRampToValueAtTime(.0001,t+att+dec)}
function nz(at,o){const a=audio();if(!a||!noiseBuf)return;const t=a.currentTime+at,n=a.createBufferSource();n.buffer=noiseBuf;const f=a.createBiquadFilter();f.type=o.type;f.frequency.setValueAtTime(o.f,t);if(o.f2)f.frequency.exponentialRampToValueAtTime(o.f2,t+o.att+o.dec);f.Q.value=o.q||.9;
  const g=a.createGain();env(g,t,o.v,o.att,o.dec);n.loop=true;n.connect(f).connect(g).connect(o.out||master);n.start(t);n.stop(t+o.att+o.dec+.05)}
function tn(at,o){const a=audio();if(!a)return;const t=a.currentTime+at,s=a.createOscillator();s.type="sine";s.frequency.setValueAtTime(o.f,t);if(o.f2)s.frequency.exponentialRampToValueAtTime(o.f2,t+o.att+o.dec);
  const g=a.createGain();env(g,t,o.v,o.att,o.dec);s.connect(g).connect(o.out||master);s.start(t);s.stop(t+o.att+o.dec+.05)}
function glove(at,v){if(!audio())return;nz(at,{type:"highpass",f:2200,v:v*.7,att:.001,dec:.035,out:room()});nz(at,{type:"bandpass",f:1100,q:.8,v,att:.002,dec:.08,out:room()});
  tn(at,{f:240,f2:90,v:v*1.1,att:.002,dec:.12,out:room()});tn(at,{f:110,f2:50,v:v*1.2,att:.002,dec:.15})}
function bell(at,v){[1,2.76,5.4].forEach((m,i)=>tn(at,{f:880*m,v:v/(i+1.5),att:.002,dec:1.1-i*.3}))}
function crowd(at,dur,v){nz(at,{type:"bandpass",f:600,f2:900,q:.5,v,att:dur*.5,dec:dur*.6})}
/* sons identiques à l'accueil : clic pour garder / lâcher un dé, petit carillon de combinaison après le lancer */
function beep(f,dur,type,vol,at){const a=audio();if(!a)return;const t=a.currentTime+(at||0),o=a.createOscillator();o.type=type||"triangle";o.frequency.setValueAtTime(f,t);
  const g=a.createGain();g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol||.08,t+.006);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g).connect(master);o.start(t);o.stop(t+dur+.02)}
function voice(n){if(audio())play(BUF[n],1,1)}
const sfx={
  light:()=>glove(0,.45),
  medium:()=>{glove(0,.45);glove(.13,.45)},
  heavy:()=>{glove(0,.5);glove(.1,.5);bell(.22,.25)},
  super:()=>{[0,.12,.24].forEach(t=>glove(t,.5));bell(.36,.3);bell(.62,.3);crowd(.3,1.4,.35)},
  tap:()=>glove(0,.32),
  lock:()=>{if(!play(BUF.click,.22,1.05))beep(900,.04,"sine",.08)},
  unlock:()=>{if(!play(BUF.click,.14,.8))beep(600,.04,"sine",.06)},
  combo:p=>{const b=p>=50?880:p>=25?698:587;beep(b,.12,"triangle",.07);beep(b*1.5,.18,"triangle",.06,.08)},
  miss:()=>nz(0,{type:"bandpass",f:600,f2:2500,q:2,v:.25,att:.04,dec:.14}),
  bell1:()=>bell(0,.28),
  broken:()=>{const a=audio();if(!a)return;const t=a.currentTime,o=a.createOscillator();o.type="sine";o.frequency.setValueAtTime(150,t);o.frequency.exponentialRampToValueAtTime(90,t+.25);
    const g=a.createGain();g.gain.setValueAtTime(.12,t);g.gain.exponentialRampToValueAtTime(.001,t+.25);o.connect(g).connect(master);o.start(t);o.stop(t+.3)},
  ko:()=>{bell(0,.32);bell(.3,.32);bell(.6,.32);crowd(.1,1.6,.4)}};
/* bon coup : bruitage, tremblement et annonce selon la combinaison */
function hit(k,p,mine){if(!p){if(mine)sfx.miss();return}let lvl="tap";
  if(k==="yams")lvl="super";else if(k==="grande"||k==="carre"||k==="full")lvl="heavy";else if(k==="petite"||p>=25)lvl="medium";else if(p>=18)lvl="light";
  sfx[lvl]();if(lvl==="tap")return;
  if(lvl!=="light"){const sc=root.querySelector(".scr");sc.classList.remove("shake","shake2");void sc.offsetWidth;sc.classList.add(lvl==="super"?"shake2":"shake")}
  if(navigator.vibrate)navigator.vibrate(lvl==="super"?[30,40,30,40,80]:lvl==="heavy"?[30,40,60]:30);
  if(lvl==="super")setTimeout(()=>ko(mine?"Super combo":"Nico","Yam's !"),300);
  else if(lvl==="heavy"&&mine)setTimeout(()=>ko(SAY[k],"Combo !"),250)}

/* ---------- tour du joueur ---------- */
function startMyTurn(){G.phase="me";G.throws=0;G.vals=[];G.locked.clear();G.broken.clear();G.pending=null;paintDice();paintHud();grid();hud();
  hint("Tape 2 fois pour lancer");
  if(G.turn===1){ko("Tuto · Round 1","À toi !");setTimeout(()=>say("Bienvenue au <b>Parvis</b>, le bleu ! Tape 2 fois sur le tapis pour lancer les dés."),900)}
  else{ko("Round "+G.turn,"À toi !");
    if(G.turn===2)say("À toi. Garde les dés qui t'arrangent et vise une case libre.");
    else if(G.turn===3)say("Les cases du haut : fais au moins <b>63</b> en tout sur 1 à 6 et tu touches <b>+37</b> de prime.");
    else say("")}}
async function myThrow(){if(G.busy||G.phase!=="me"||G.throws>=3&&!G.pending)return;
  const ids=G.pending||(G.throws===0?(allIds().length===5?allIds():[0,1,2,3,4]):allIds().filter(id=>!G.locked.has(id)));
  if(!ids.length){say("Tous tes dés sont gardés : choisis une case en bas.");return}
  hint("");if(G.throws===0)G.locked.clear();paintDice();
  const r=await toss(ids);if(!r||G.phase!=="me")return;
  if(r.broken){G.pending=ids;paintDice();grid();hud();hint("Tape 2 fois pour relancer");say("<b>Dé cassé !</b> Un dé est penché ou monté sur un autre : tape 2 fois pour relancer ce lancer.",0,true);return}
  if(G.pending)say("");G.pending=null;G.throws++;const v=r.v;
  const bt=best(G.me,v),win=new Set();
  if(bt){pop(`+${bt.p} ${SAY[bt.k]}`);winIds(bt.k,win);setTimeout(()=>sfx.combo(bt.p),350)}
  paintDice(win);grid();hud();paintHud();
  if(G.throws>=3){hint("");say(G.turn===1?"Plus de lancer ! Touche une case en bas. La <b>dorée</b> rapporte le plus.":"Plus de lancer : choisis une case.")}
  else{hint("");
    if(G.turn===1&&G.throws===1)say(bt?`${SAY[bt.k]} possible ! Touche les dés à <b>garder</b> (ils passent en bleu), puis tape 2 fois pour relancer les autres.`:"Touche les dés à <b>garder</b> (ils passent en bleu), puis tape 2 fois pour relancer les autres.");
    else if(G.turn===1&&G.throws===2)say("Encore un lancer, ou prends tout de suite une case en bas. La <b>dorée</b> rapporte le plus.");
    else if(G.turn>3)say("")}}
function winIds(k,set){const rs=rolls(),u=UPPER.find(x=>x[0]===k);
  if(u)rs.filter(r=>r.value===u[2]).forEach(r=>set.add(r.rollId));
  else if(k==="brelan"||k==="carre"){const c=counts(rs.map(r=>r.value)),n=[6,5,4,3,2,1].find(n=>c[n]>=(k==="carre"?4:3));rs.filter(r=>r.value===n).forEach(r=>set.add(r.rollId))}
  else rs.forEach(r=>set.add(r.rollId))}
function tap(e){if(G.phase!=="me"||G.busy||!box)return;
  if(G.throws>0&&G.throws<3&&!G.pending){const p=peek();if(p){const cr=p.canvas.getBoundingClientRect(),x=e.clientX-cr.left,y=e.clientY-cr.top;let hit=null,bd=1e9;
    live().forEach(d=>{const g=geo(d),dist=Math.hypot(g.x-x,g.y-y);if(dist<g.size*.7&&dist<bd){bd=dist;hit=d.config.rollId}});
    if(hit!=null){G.lastTap=0;clearTimeout(G.tapT);if(G.locked.has(hit)){G.locked.delete(hit);sfx.unlock()}else{G.locked.add(hit);sfx.lock()}paintDice();
      if(G.turn===1&&G.throws===1&&G.locked.size===1)say("C'est ça ! Garde ceux que tu veux, puis <b>tape 2 fois</b> pour relancer le reste.");return}}}
  const now=Date.now();clearTimeout(G.tapT);
  if(now-G.lastTap<420){G.lastTap=0;return myThrow()}
  G.lastTap=now;G.tapT=setTimeout(()=>{if(G.lastTap&&G.throws<3)hint("Encore un tap pour lancer")},430)}
function choose(k){if(G.phase!=="me"||G.busy||!G.throws||G.pending||G.me[k]!=null||G.vals.length!==5)return;
  const p=pts(k,G.vals),bt=best(G.me,G.vals);
  if(G.turn<=2&&bt&&bt.p>p&&!G.warned){G.warned=true;say(`Hé, le bleu ! <b>${SAY[bt.k]}</b> te rapporte ${bt.p}. Touche encore pour confirmer ${SAY[k]}.`);G.warnK=k;return}
  if(G.warned&&G.warnK!==k&&G.turn<=2&&bt&&bt.p>p){G.warnK=k;say(`<b>${SAY[bt.k]}</b> te rapporte ${bt.p}. Touche encore pour confirmer ${SAY[k]}.`);return}
  G.warned=false;G.warnK=null;
  const hadPrime=upper(G.me)>=+ST.seuil;G.me[k]=p;pop(p?`+${p} ${SAY[k]}`:`${SAY[k]} rayé`);hit(k,p,true); /* le coup part quand on inscrit sa case */
  if(!hadPrime&&upper(G.me)>=+ST.seuil)setTimeout(()=>{ko("Cases 1 à 6","Prime +"+ST.prime);sfx.heavy()},500);ga("histoire_case",{tour:G.turn,case:k,points:p});
  G.phase="wait";grid();paintHud();hud();
  say(p?(G.turn===1?"Pas mal ! À moi maintenant, regarde et apprends…":""):"Rayer une case, ça arrive. Choisis bien laquelle !",p?0:2200);
  setTimeout(botTurn,1100)}

/* ---------- tour de Nico (bot, niveau tuto) ---------- */
const SACRIFICE=["un","yams","deux","grande","trois","petite","carre","full","quatre","brelan","cinq","six","chance"];
function botKeep(v,sc,n){const c=counts(v),rs=rolls(),open=k=>sc[k]==null;
  if(open("yams")&&Math.max(...c)===5)return null;
  if(open("grande")&&hasRun(c,5))return null;
  if(open("full")&&pts("full",v)>0)return null;
  if((open("grande")||open("petite"))&&hasRun(c,4)){if(!open("grande"))return null;
    const s=[1,2,3].find(s=>[0,1,2,3].every(i=>c[s+i]));const keep=[];[0,1,2,3].forEach(i=>{const r=rs.find(r=>r.value===s+i&&!keep.includes(r.rollId));if(r)keep.push(r.rollId)});return keep}
  if(Math.random()<.35&&n<2)return[];if(n===1&&Math.random()<.3)return null; /* niveau tuto : Nico se trompe parfois */
  let val=0,cnt=0;for(let f=6;f>=1;f--){const w=c[f]+(open(UPPER[f-1][0])?.3:0);if(w>cnt){cnt=w;val=f}}
  return rs.filter(r=>r.value===val).map(r=>r.rollId)}
function botPick(sc,v){let bk=null,bv=-1;ALL.forEach(k=>{if(sc[k]!=null)return;let p=pts(k,v);if(p<=0)return;
    const u=UPPER.find(x=>x[0]===k);let s=p;if(u)s=p+(counts(v)[u[2]]>=3?8:0)-u[2];if(k==="chance")s=p-14;if(s>bv){bv=s;bk=k}});
  return bk||SACRIFICE.find(k=>sc[k]==null)}
async function botTurn(){if(G.phase==="off")return;G.phase="bot";G.throws=0;G.locked.clear();G.botLast=null;paintHud();grid();hint("");
  ko("Round "+G.turn,"À Nico !");await wait(1200);if(G.phase!=="bot")return;
  if(G.turn===1)say("Je regarde ce qui sort, je garde le meilleur et je relance le reste.",3000);
  let ids=allIds().length===5?allIds():[0,1,2,3,4];
  for(let n=0;n<3;n++){paintDice();let r=await tossRetry(ids);if(!r||G.phase!=="bot")return;
    for(let k=0;r.broken&&k<4;k++){paintDice();await wait(900);if(G.phase!=="bot")return;r=await tossRetry(ids);if(!r||G.phase!=="bot")return}
    G.broken.clear();const v=r.v;G.throws=n+1;hud();paintDice();await wait(700);
    if(n===2)break;const keep=botKeep(v,G.bot,n);if(keep===null)break;
    G.locked=new Set(keep);paintDice();await wait(650);ids=allIds().filter(id=>!G.locked.has(id));if(!ids.length)break}
  if(G.phase!=="bot")return;
  const k=botPick(G.bot,G.vals),p=pts(k,G.vals);G.bot[k]=p;G.botLast=k;grid();if(p)hit(k,p,false);const w=new Set();if(p)winIds(k,w);G.locked.clear();paintDice(w);
  pop(p?`Nico +${p} ${SAY[k]}`:`Nico raye ${SAY[k]}`);paintHud();
  if(G.turn===1)say(`J'ai pris <b>${SAY[k]}</b> pour ${p}. Chaque case ne sert qu'une fois : 13 tours, 13 cases.`,3200);
  await wait(1700);if(G.phase!=="bot")return;
  if(G.turn>=13)return end();
  G.botLast=null;G.turn++;startMyTurn()}

/* ---------- fin du combat ---------- */
function end(){G.phase="end";paintHud();hud();hint("");say("");const a=total(G.me),b=total(G.bot),won=a>b,p=prog();
  if(won){p.nico="win";p.best=Math.max(p.best||0,a);saveProg(p)}
  ga("histoire_fin",{boss:"nico",gagne:won?"oui":"non",resultat:issue(a,b),score:a,boss_score:b,ecart:a-b,...stats()});
  ko(won?"Nico est battu":"Fin du combat",won?"K.O. !":a===b?"Égalité":"Perdu");if(won)sfx.ko();else sfx.heavy();
  mus.stop(.8);setTimeout(()=>{if(G.phase==="end")mus.play(won?"victoire":"defaite")},700);
  setTimeout(()=>{modal(`<h3 class="sark">${won?"Victoire !":a===b?"Égalité":"Perdu…"}</h3>
    <p>${won?"« Pas mal le bleu, t'as ta place au Parvis. » Prochain adversaire : <b>"+NEXT+"</b>, bientôt.":"« Reviens quand tu veux, le bleu. » Nico t'attend pour la revanche."}</p>
    <div class="sres"><div><small>${E(me())}</small>${a}</div><div><small>Nico</small>${b}</div></div>
    <div class="snico"><img src="${BOSSES[0].head}" alt=""><p>${won?"« Partage ton score et je t'offre un verre au Parvis ! »":"« Partage ton score, que tout le Parvis sache qui paie la tournée ! »"}</p></div>
    <button class="sbtn gold" id="sShare" type="button">${won?"Partager mon score":"Partager ma honte"}</button>
    <button class="sbtn" id="sAgain" type="button">${won?"Rejouer":"Revanche"}</button><button class="sbtn" id="sBack" type="button">Retour au club</button>`,
    m=>{m.querySelector("#sShare").onclick=e=>share(e.currentTarget,a,b,won);m.querySelector("#sAgain").onclick=()=>{ga("histoire_revanche",{resultat:issue(a,b)});$("#sModal").hidden=true;open()};m.querySelector("#sBack").onclick=()=>{ga("histoire_retour_club",{resultat:issue(a,b)});close()}})},1800)}
async function share(btn,a,b,won){const app=location.origin+location.pathname.replace(/[^/]*$/,"");
  /* victoire : page « J'ai battu Nico », défaite : page « Nico m'a mis une raclée » (chacune son aperçu dans les messageries et sa campagne de suivi) */
  const url=won?app+"nico/":app+"nico-gagne/";
  const res=issue(a,b),text=won?`J'ai battu Nico au Parvis : ${a} à ${b} au Yam's Club ! À ton tour 🎲`:`Nico m'a mis une raclée au Parvis : ${a} à ${b} au Yam's Club 💪 Viens me venger 🎲`;
  const sent=(methode,etat)=>ga("histoire_partage",{gagne:won?"oui":"non",resultat:res,score:a,methode,etat});
  try{if(navigator.share){await navigator.share({title:"Yam's Club",text,url});sent("partage","envoye");btn.textContent=won?"Merci ! Ton verre t'attend":"Envoyé. Assume, maintenant";return}}
  catch(e){if(e&&e.name==="AbortError"){sent("partage","annule");return}}
  try{await navigator.clipboard.writeText(text+" "+url);sent("copie","envoye");btn.textContent="Copié ! Colle-le où tu veux"}catch(e){sent("copie","echec");btn.textContent="Partage indisponible"}}
function modal(html,bind){const m=$("#sModal"),bx=$("#sBox");bx.innerHTML=html;m.hidden=false;if(bind)bind(bx);const f=bx.querySelector("button");if(f)f.focus()}
function askQuit(){if(G.phase==="end"||(G.phase==="vs"||G.phase==="ready")&&!G.throws&&G.turn===1&&!Object.keys(G.me).length){G.phase="off";clearTimeout(vsT);return close()}
  modal(`<h3 class="sark">Quitter ?</h3><p>Le combat contre Nico sera abandonné.</p>
  <button class="sbtn gold" id="sStay" type="button">Continuer le combat</button><button class="sbtn" id="sLeave" type="button">Quitter</button>`,
  m=>{m.querySelector("#sStay").onclick=()=>{$("#sModal").hidden=true};m.querySelector("#sLeave").onclick=()=>{ga("histoire_abandon",{tour:G.turn,score:total(G.me),boss_score:total(G.bot),ecart:total(G.me)-total(G.bot),...stats()});close()}})}
function gear(){modal(`<h3 class="sark">Réglages</h3>
  <label class="stog">Conseils de Nico<input type="checkbox" id="sTips" ${tipsOn()?"checked":""}></label>
  <label class="stog">Musique<input type="checkbox" id="sMus" ${musicOn()?"checked":""}></label>
  <label class="stog">Son des dés et bruitages<input type="checkbox" id="sSnd" ${soundOn()?"checked":""}></label>
  <ul class="srules"><li>13 tours chacun, 3 lancers maximum par tour.</li><li>Touche un dé pour le garder, tape 2 fois sur le tapis pour lancer.</li><li>Prime de ${ST.prime} si tu fais ${ST.seuil} ou plus sur les cases 1 à 6.</li><li>Full ${ST.fullFixe}, petite suite ${ST.petite}, grande suite ${ST.grande}, Yam's ${ST.yams}.</li></ul>
  <button class="sbtn gold" id="sOk" type="button">OK</button>`,
  m=>{m.querySelector("#sMus").onchange=e=>{try{localStorage.setItem(MKEY,e.target.checked?"1":"0")}catch(_){}
    if(!e.target.checked){mus.pauseAt();mus.stop(.3)}else if(G.phase==="me"||G.phase==="bot"){mus.play("match",.8)}};
    m.querySelector("#sSnd").onchange=e=>{try{localStorage.setItem(SKEY,e.target.checked?"1":"0")}catch(_){}if(e.target.checked)sfx.light()};m.querySelector("#sTips").onchange=e=>{try{localStorage.setItem(TKEY,e.target.checked?"1":"0")}catch(_){}if(!e.target.checked)say("")};m.querySelector("#sOk").onclick=()=>{$("#sModal").hidden=true}})}
window.Story={open,close};
})();
/* l'accueil a pu s'afficher avant ce script : on le redessine pour faire apparaître le bloc histoire */
if(document.getElementById("cCreate")&&!document.getElementById("storyBox")&&typeof render==="function")render();
