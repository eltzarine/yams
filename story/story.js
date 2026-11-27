/* ================= Mode histoire =================
   Chapitre 1 : Nico, le patron du Parvis (bar de bikers), t'apprend à jouer.
   Combat en 13 tours contre un bot, avec les dés 3D de l'accueil (dice-box).
   Utilise les règles de la feuille (compute, counts, hasRun, UPPER, LOWER, ALL, DEFAULTS) avec les réglages par défaut. */
(()=>{
const PKEY="yams_histoire";
const TKEY="yams_histoire_conseils";
const BOSSES=[{id:"nico",nom:"Nico",court:"Nico",titre:"Le patron",lieu:"Le Parvis · bar de bikers",sprite:"story/nico_sprite.png",head:"story/nico_head_sprite.png"},
  {id:"bruno",nom:"Père Bruno",court:"Bruno",titre:"Le prêtre",lieu:"L'église · le Yam's des dieux",sprite:"story/bruno_sprite.png",head:"story/bruno_head_sprite.png",stage:"story/eglise.webp"}];
/* chapitre en cours : 1 = Nico (tuto), 2 = Père Bruno (secret, en test : 5 taps sous le chapitre 1) */
let CH=1;const B=()=>BOSSES[CH-1];
const C2KEY="yams_chapitre2";
const ch2On=()=>{try{return localStorage.getItem(C2KEY)==="1"}catch(e){return false}};
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

/* ---------- progression liée au compte : histoire/{uid} dans Firestore ----------
   Fiche du compte : { nico:{battu,record,parties,victoires,dernieres:[{id,d,s,n}] (20 max)}, updatedAt }.
   Le record compte aussi les défaites. La progression déjà sur le téléphone (yams_histoire, d'avant les comptes)
   est donnée une seule fois, au premier compte qui se connecte ici (prog().owner = son uid), en gardant le meilleur.
   Hors connexion : les combats finis attendent dans yams_histoire_q_<uid> et partent à la prochaine synchro. */
const CKEY=u=>"yams_histoire_c_"+u,QKEY=u=>"yams_histoire_q_"+u;
const rd=(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k)||"null");return v==null?d:v}catch(e){return d}};
const wr=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const uid=()=>{try{return typeof meName==="function"&&meName()&&Acc.user?Acc.user.uid:null}catch(e){return null}};
const blank=()=>({battu:false,record:0,parties:0,victoires:0,dernieres:[]});
const clean=n=>{const b=blank();n=n&&typeof n==="object"?n:{};
  return{battu:!!n.battu,record:Math.max(0,Math.min(1200,n.record|0)),parties:Math.max(0,n.parties|0),victoires:Math.max(0,n.victoires|0),dernieres:Array.isArray(n.dernieres)?n.dernieres.slice(0,20):b.dernieres}};
/* ajoute des combats finis (les plus récents en tête), sans doublon */
const addGames=(n,games)=>{games.forEach(g=>{if(n.dernieres.some(x=>x.id===g.id))return;n.parties++;if(g.s>g.n){n.victoires++;n.battu=true}
  n.record=Math.max(n.record,g.s);n.dernieres.unshift(g)});n.dernieres=n.dernieres.slice(0,20);n.victoires=Math.min(n.victoires,n.parties);return n};
/* ce que l'accueil affiche : la fiche du compte connecté, sinon la progression du téléphone si personne ne l'a encore prise */
const view=()=>{const u=uid();if(u){const n=addGames(clean(rd(CKEY(u),null)),rd(QKEY(u),[]).slice().reverse());
    const p=prog();if(!p.owner&&(p.nico==="win"||p.best)){n.battu=n.battu||p.nico==="win";n.record=Math.max(n.record,p.best|0)}return n}
  const p=prog();return p.owner?blank():{...blank(),battu:p.nico==="win",record:p.best|0}};
let syncing=null,synced=null;
async function sync(){const u=uid();if(!u||typeof DB==="undefined"||!DB)return;if(syncing)return syncing;
  syncing=(async()=>{const ref=DB.collection("histoire").doc(u),q=rd(QKEY(u),[]),p=prog(),claim=!p.owner&&(p.nico==="win"||p.best);
    const snap=await ref.get({source:"server"});
    const n=clean(snap.exists?(snap.data()||{}).nico:null),before=JSON.stringify(n);
    if(claim){n.battu=n.battu||p.nico==="win";n.record=Math.max(n.record,p.best|0)}
    addGames(n,q.slice().reverse());
    if(JSON.stringify(n)!==before||!snap.exists)await ref.set({nico:n,updatedAt:firebase.firestore.FieldValue.serverTimestamp()});
    wr(CKEY(u),n);
    const left=rd(QKEY(u),[]).filter(g=>!q.some(x=>x.id===g.id));wr(QKEY(u),left);
    if(claim){const p2=prog();p2.owner=u;saveProg(p2);ga("histoire_progression_rattachee")}
    synced=u;paintBox();return true})().catch(()=>false).then(ok=>{syncing=null;
    if(ok&&uid()===u&&rd(QKEY(u),[]).length)sync()}); /* un combat fini pendant l'envoi part juste après */
  return syncing}
/* combat fini : rangé dans la file du compte, puis envoyé */
function record(a,b){const u=uid();if(!u)return;
  const q=rd(QKEY(u),[]);q.push({id:"h"+Date.now().toString(36)+Math.random().toString(36).slice(2,6),d:new Date().toISOString(),s:a|0,n:b|0});wr(QKEY(u),q.slice(-50));sync()}
function paintBox(){const el=document.getElementById("storyBox");if(!el||!window.storyHTML)return;el.outerHTML=storyHTML();if(window.bindStory)bindStory()}
window.addEventListener("online",()=>{if(uid())sync()});

/* ---------- bloc sur l'accueil ---------- */
window.storyHTML=()=>{const v=view(),won=v.battu,b=BOSSES[0],c2=BOSSES[1];
  return`<div class="storywrap" id="storyBox"><div class="storybox" id="storyCh1"><img class="sb-sprite" src="${b.sprite}" alt="" aria-hidden="true">
  <small>Mode histoire · Chapitre 1</small><h2>${b.nom}</h2>
  <p>${won?`Nico est battu. Prochain adversaire : <b>${NEXT}</b>, bientôt.`:`Le patron du <b>Parvis</b> t'apprend à jouer. Bats-le pour gagner ta place au club.`}</p>
  <button id="storyGo" type="button">${won?"Revanche":"Jouer l'histoire"}</button>${won?`<span class="sb-done">✓ Battu${v.record?" · record "+v.record:""}</span>`:v.record?`<span class="sb-done">Record ${v.record}</span>`:""}</div>
  <div class="sb-secret" id="storySecret" aria-hidden="true"></div>
  ${ch2On()?`<div class="storybox ch2"><img class="sb-sprite" src="${c2.sprite}" alt="" aria-hidden="true"><span class="sb-test">TEST</span>
  <small>Mode histoire · Chapitre 2</small><h2>${c2.nom}</h2>
  <p>À l'église, le Père Bruno a trouvé par le Saint-Esprit <b>le Yam's des dieux</b> : on y joue avec des pouvoirs.</p>
  <button id="storyGo2" type="button">Jouer le chapitre 2</button></div>`:""}</div>`};
/* l'histoire se joue avec un compte : sans connexion, même parcours que « Me connecter », puis le combat s'ouvre */
const needLogin=()=>{try{return ACC_ON&&typeof meName==="function"&&!meName()}catch(e){return false}};
const go=ch=>{
  if(needLogin()&&typeof accTap==="function"){ga("histoire_connexion_demandee");if(window.loginThen)loginThen(()=>{if(!needLogin()){ga("histoire_connexion_ok");open(ch)}});accTap();return}
  open(ch)};
let secretN=0,secretT=0;
window.bindStory=()=>{const b=document.getElementById("storyGo");if(b)b.onclick=e=>{e.stopPropagation();go(1)};
  const b2=document.getElementById("storyGo2");if(b2)b2.onclick=()=>go(2);
  /* secret : 5 taps en moins de 3 s sur le chapitre 1 (ou juste dessous) font apparaître le chapitre 2 */
  const t=()=>{const n=Date.now();if(n-secretT>3000)secretN=0;secretT=n;if(++secretN<5)return;secretN=0;if(ch2On())return;
    try{localStorage.setItem(C2KEY,"1")}catch(e){}ga("histoire_chapitre2_debloque");paintBox();
    const c=document.querySelector("#storyBox .ch2");if(c&&c.scrollIntoView)c.scrollIntoView({behavior:"smooth",block:"center"})};
  ["storyCh1","storySecret"].forEach(id=>{const el=document.getElementById(id);if(el)el.addEventListener("click",t)})};
/* connexion / déconnexion pendant le combat : pastille à jour, et retour à l'accueil si on n'est plus connecté */
window.storyAcct=()=>{const u=uid();if(u&&synced!==u)sync();else if(!u&&synced){synced=null;paintBox()}
  if(!root||root.hidden)return;if(needLogin())return close();names()};

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
    <div class="sside"><div class="shp"><i id="sBarMe"></i><b id="sScMe">0</b></div><div class="snm sark" id="sNmMe"></div><div class="sreact" id="sReact" hidden><i></i></div></div>
    <div class="stimer"><small>Tour</small><b class="sark" id="sTour">1</b></div>
    <div class="sside r"><div class="shp"><i id="sBarB"></i><b id="sScB">0</b></div><div class="snm sark" id="sNmB">${b.nom}</div></div>
    <div class="spf" id="sPfB"><img src="${b.head}" alt="${b.nom}"></div>
  </section>
  <section class="szone" id="sZone" aria-label="Piste de dés">
    <div class="sfelt"></div><img class="swm" src="logo-yams-club.webp" alt="" aria-hidden="true"><div class="spiste"></div>
    <div class="sdice" id="sdice"></div>
    <div class="ssay off" id="sSay"><p></p></div>
    <div class="sscore sark" id="sScore"></div>
    <div class="shint" id="sHint"></div>
    <div class="shudl" id="sHud" hidden></div>
    <div class="sfx" id="sFx" aria-hidden="true"></div><div class="sfz" id="sFz" aria-hidden="true"></div>
    <div class="spow l" id="sPowMe" hidden></div><div class="spow r" id="sPowB" hidden></div>
  </section>
  <div class="sinfo" id="sInfo"></div>
  <section class="sgrid" id="sGrid"></section>
  <div class="svs off" id="sVs"></div>
  <div class="sko" id="sKo"></div>
  <div class="smodal" id="sModal" hidden><div class="box" id="sBox"></div></div>
  </div>`;
  document.body.appendChild(root);
  $("#sQuit").onclick=askQuit;$("#sAcct").onclick=()=>{if(typeof accTap==="function")accTap()};$("#sGear").onclick=gear;
  $("#sZone").addEventListener("click",tap);
  $("#sPowMe").addEventListener("click",e=>{e.stopPropagation();const k=e.target.closest("[data-p]");if(k)power(k.dataset.p)});
  $("#sPowB").addEventListener("click",e=>e.stopPropagation());["pointerdown","touchend","click"].forEach(ev=>root.addEventListener(ev,()=>{revive();audio();if(musicOn())ctx()},{passive:true}));
  $("#sGrid").addEventListener("click",e=>{const c=e.target.closest(".sc");if(c&&G.phase==="me")choose(c.dataset.k)});
  $("#sVs").addEventListener("click",()=>{if(G.phase==="vs"&&mus.want==="entree")mus.play("match",.6);skipVs()});
}

function open(ch){
  if(!root)build();
  if(ch)CH=ch;const b=B();
  if(b.stage)root.style.setProperty("--stage",`url("${new URL(b.stage,location.href).href}")`);else root.style.removeProperty("--stage");
  $("#sNmB").textContent=b.court;const hi=$("#sPfB img");hi.src=b.head;hi.alt=b.nom;
  $("#sPowMe").hidden=$("#sPowB").hidden=CH!==2;fxOff();
  names();
  root.hidden=false;document.documentElement.classList.add("story-on");
  G.gen=(G.gen||0)+1;Object.assign(G,{phase:"vs",turn:1,throws:0,me:{},bot:{},busy:false,vals:[],tut:0,warned:false,warnK:null,pending:null,botLast:null,t0:Date.now(),rollMs:[],nBroken:0,
    pw:{me:{gel:0,rel:0,qua:0,dbl:0},bot:{gel:0,rel:0,qua:0,dbl:0}},frozen:new Set(),extra:false,dbl:false,arm:null,react:false,hold:false,atk:false});G.locked.clear();G.broken.clear();paintPow();
  paintHud();grid();say("");hint("");hud();
  mus.pos=0;mus.load();mus.play("entree");
  /* tapis vide à chaque combat : on attend un éventuel lancer encore en cours (combat quitté en plein lancer), puis on vide */
  inflight=inflight.then(()=>{if(box)try{box.clear()}catch(e){}});
  vs();initDice();ga("histoire_debut",{boss:b.id});
}
function names(){const n=me();$("#sAcct .an").textContent=n;$("#sAcct").setAttribute("aria-label","Mon compte : "+n);
  $("#sPfMe .ini").textContent=(n[0]||"?").toUpperCase();$("#sNmMe").textContent=n}
function close(){
  G.phase="off";fxOff();unfreeze();if(G.reactGo)G.reactGo();mus.stop(.4);root.hidden=true;
  if(shared){const f=inflight;shareQ=shareQ.then(()=>f).then(()=>window.yamsDice.give());shared=false;box=null;boxP=null} /* rend le tapis à l'accueil une fois le lancer en cours fini */
document.documentElement.classList.remove("story-on");$("#sModal").hidden=true;
  if(typeof render==="function")render(); /* rafraîchit le bloc histoire de l'accueil */
}

/* ---------- écran VS (calé sur le riff d'entrée de 5,2 s : VS à 3,35 s, fin à 4,9 s), puis « Ready ? Fight ! », puis « À toi ! » ---------- */
let vsT=0;
function vs(){const b=B(),n=me(),v=$("#sVs");
  v.innerHTML=`<div class="f"><div class="big"><div class="ini">${E((n[0]||"?").toUpperCase())}</div></div><b class="sark">${E(n)}</b><small>Le bleu</small></div>
  <b class="sark">VS</b>
  <div class="f"><small>${b.lieu}</small><img class="sprite" src="${b.sprite}" alt="${b.nom}"><b class="sark">${b.nom}</b><small>${b.titre}</small></div>`;
  v.classList.remove("off");clearTimeout(vsT);vsT=setTimeout(skipVs,4900)}
function skipVs(){if(G.phase!=="vs")return;clearTimeout(vsT);$("#sVs").classList.add("off");G.phase="ready";
  voice("rf"); /* un seul fichier : « Ready ? » à 0,1 s, « Fight ! » à 1,8 s */
  vsT=setTimeout(()=>{if(G.phase!=="ready")return;ko("Round 1","Ready ?");
  vsT=setTimeout(()=>{if(G.phase!=="ready")return;ko(B().court+" vs "+me(),"Fight !");sfx.bell1();
    vsT=setTimeout(()=>{if(G.phase==="ready")startMyTurn()},1000)},1700)},100)}
function ko(small,big){const k=$("#sKo");k.innerHTML=`<div><small>${small}</small><b class="sark">${big}</b></div>`;k.classList.remove("go");void k.offsetWidth;k.classList.add("go")}

/* ---------- textes ---------- */
let sayT=0;
function say(html,ms,force){const s=$("#sSay");clearTimeout(sayT);if(!html||(!tipsOn()&&!ms&&!force)){s.classList.add("off");return}
  s.querySelector("p").innerHTML=html;s.classList.remove("off");if(ms)sayT=setTimeout(()=>s.classList.add("off"),ms)}
function hint(t){$("#sHint").textContent=t||""}
function hud(){paintPow();const h=$("#sHud");if(G.phase!=="me"&&G.phase!=="bot"||!G.throws&&G.phase!=="me"){h.hidden=true;return}h.hidden=false;
  h.innerHTML=[0,1,2].map(i=>`<i class="${i<G.throws?"":"off"}"></i>`).join("")+(G.pending?"Dé cassé · relance":`${G.phase==="bot"?B().court+" · ":""}${G.extra?"4e lancer":"Lancer "+G.throws+"/3"}`);h.classList.toggle("ko",!!G.pending||G.broken.size>0)}
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
  $("#sInfo").innerHTML=`<span class="${isBot?"bot":""}">${isBot?"Grille de "+B().court:"Ta grille"}</span><span>${h>=+ST.seuil?`<b>Prime +${ST.prime} ✓</b>`:upDone?`Prime ratée (${h}/${ST.seuil})`:`1 à 6 : <b>${h}</b>/${ST.seuil} · encore <b>${left}</b> pour +${ST.prime}`}</span>`;
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
const TINT={base:"#FBF8F1",on:"#86AAD6",ko:"#F0A49A",win:"#F3CF5E",ice:"#A9DEFF",dim:"#77716A",tgg:"#E4F7FF",tgr:"#FFB7AC"};
const tint=(d,kind)=>{const b=d.mesh.instancedBuffers;if(!b||!b.customColor)return;const h=TINT[kind];if(b.customColor.__k===kind)return;
  const c=new b.customColor.constructor(parseInt(h.slice(1,3),16)/255,parseInt(h.slice(3,5),16)/255,parseInt(h.slice(5,7),16)/255);c.__k=kind;b.customColor=c};
let rq=0;
function paintDice(win){const p=peek();if(!p)return;live().forEach(d=>{const id=d.config.rollId;
    tint(d,G.arm?(targetable(id)?(G.arm==="gel"?"tgg":"tgr"):"dim"):G.frozen.has(id)?"ice":G.broken.has(id)?"ko":G.locked.has(id)?"on":win&&win.has(id)?"win":"base")});
  paintFz();
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
    box=new DiceBox({container:"#sdice",origin:base.origin,assetPath:base.pathname+"dice/assets/",offscreen:!1,delay:0,
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
  /* chaque chapitre a sa musique (chapitre 2 : orgue d'église façon arcade, dans musique/eglise/) */
  key(n){return(CH===2?"eglise/":"")+n},
  load(){const base=new URL(".",location.href).pathname;["entree","match","victoire","defaite"].forEach(n=>{const k=this.key(n);if(MBUF[k]||MBUF[k]===0)return;MBUF[k]=0;
    fetch(base+`story/musique/${k}.mp3`).then(r=>r.arrayBuffer()).then(b=>new Promise((ok,ko)=>ctx().decodeAudioData(b,ok,ko))).then(x=>{MBUF[k]=x;if(mus.want===n&&!mus.cur&&mus.key(n)===k)mus.play(n)}).catch(()=>{delete MBUF[k]})})},
  vol:{entree:.42,match:.2,victoire:.42,defaite:.42},
  play(n,fadeIn){this.want=n;this.stop(.25,true);if(!musicOn()||root.hidden)return;const a=ctx(),b=MBUF[this.key(n)];if(!a||!b)return this.load();
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
  if(lvl==="super")setTimeout(()=>ko(mine?"Super combo":B().court,"Yam's !"),300);
  else if(lvl==="heavy"&&mine)setTimeout(()=>ko(SAY[k],"Combo !"),250)}

/* ---------- tour du joueur ---------- */
function startMyTurn(){G.phase="me";G.throws=0;G.vals=[];G.locked.clear();G.broken.clear();G.pending=null;unfreeze();G.extra=false;G.dbl=false;G.atk=false;G.hold=false;paintDice();paintHud();grid();hud();paintPow();
  if(CH===2){hint("Tape 2 fois pour lancer");ko("Round "+G.turn,"À toi !");
    if(G.turn===1)setTimeout(()=>say("Bienvenue dans la maison du Seigneur ! Ici on joue au <b>Yam's des dieux</b> : un full, une suite ou un Yam's te donnent un <b>pouvoir</b>.",4200,true),900);return}
  hint("Tape 2 fois pour lancer");
  if(G.turn===1){ko("Tuto · Round 1","À toi !");setTimeout(()=>say("Bienvenue au <b>Parvis</b>, le bleu ! Tape 2 fois sur le tapis pour lancer les dés."),900)}
  else{ko("Round "+G.turn,"À toi !");
    if(G.turn===2)say("À toi. Garde les dés qui t'arrangent et vise une case libre.");
    else if(G.turn===3)say("Les cases du haut : fais au moins <b>63</b> en tout sur 1 à 6 et tu touches <b>+37</b> de prime.");
    else say("")}}
async function myThrow(){if(G.busy||G.hold||G.phase!=="me"||G.throws>=3&&!G.pending&&!G.extra)return;
  const xtra=G.throws>=3&&G.extra&&!G.pending;
  const ids=G.pending||(G.throws===0?(allIds().length===5?allIds():[0,1,2,3,4]):allIds().filter(id=>!G.locked.has(id)&&!G.frozen.has(id)));
  if(!ids.length){say("Tous tes dés sont gardés : choisis une case en bas.");return}
  hint("");if(G.throws===0)G.locked.clear();paintDice();paintPow();
  let r=await toss(ids);if(!r||G.phase!=="me")return;
  if(!r.broken&&G.dbl){G.dbl=false;G.hold=true;paintPow();r=await divine(ids)||r;G.hold=false;if(G.phase!=="me")return}
  if(r.broken){G.pending=ids;paintDice();grid();hud();hint("Tape 2 fois pour relancer");say("<b>Dé cassé !</b> Un dé est penché ou monté sur un autre : tape 2 fois pour relancer ce lancer.",0,true);return}
  if(G.pending)say("");G.pending=null;if(xtra)G.extra=false;else G.throws++;const v=r.v;
  const bt=best(G.me,v),win=new Set();
  if(bt){pop(`+${bt.p} ${SAY[bt.k]}`);winIds(bt.k,win);setTimeout(()=>sfx.combo(bt.p),350)}
  paintDice(win);grid();hud();paintHud();paintPow();
  if(CH===2){gain("me");if(G.throws<3)await botStrike();else hint(G.pw.me.qua?"4e lancer à gauche, ou choisis ta case":"");return}
  if(G.throws>=3){hint("");say(G.turn===1?"Plus de lancer ! Touche une case en bas. La <b>dorée</b> rapporte le plus.":"Plus de lancer : choisis une case.")}
  else{hint("");
    if(G.turn===1&&G.throws===1)say(bt?`${SAY[bt.k]} possible ! Touche les dés à <b>garder</b> (ils passent en bleu), puis tape 2 fois pour relancer les autres.`:"Touche les dés à <b>garder</b> (ils passent en bleu), puis tape 2 fois pour relancer les autres.");
    else if(G.turn===1&&G.throws===2)say("Encore un lancer, ou prends tout de suite une case en bas. La <b>dorée</b> rapporte le plus.");
    else if(G.turn>3)say("")}}
function winIds(k,set){const rs=rolls(),u=UPPER.find(x=>x[0]===k);
  if(u)rs.filter(r=>r.value===u[2]).forEach(r=>set.add(r.rollId));
  else if(k==="brelan"||k==="carre"){const c=counts(rs.map(r=>r.value)),n=[6,5,4,3,2,1].find(n=>c[n]>=(k==="carre"?4:3));rs.filter(r=>r.value===n).forEach(r=>set.add(r.rollId))}
  else rs.forEach(r=>set.add(r.rollId))}
function tap(e){if(G.arm&&G.phase==="bot"&&!G.busy&&box)return aim(e);
  if(G.phase!=="me"||G.busy||G.hold||!box)return;
  if(G.throws>0&&(G.throws<3||G.extra)&&!G.pending){const p=peek();if(p){const cr=p.canvas.getBoundingClientRect(),x=e.clientX-cr.left,y=e.clientY-cr.top;let hit=null,bd=1e9;
    live().forEach(d=>{const g=geo(d),dist=Math.hypot(g.x-x,g.y-y);if(dist<g.size*.7&&dist<bd){bd=dist;hit=d.config.rollId}});
    if(hit!=null&&G.frozen.has(hit)){G.lastTap=0;clearTimeout(G.tapT);sfx.miss();say("Ce dé est <b>gelé</b> : tu le gardes jusqu'à la fin du tour.",1800,true);return}
    if(hit!=null){G.lastTap=0;clearTimeout(G.tapT);if(G.locked.has(hit)){G.locked.delete(hit);sfx.unlock()}else{G.locked.add(hit);sfx.lock()}paintDice();
      if(G.turn===1&&G.throws===1&&G.locked.size===1)say("C'est ça ! Garde ceux que tu veux, puis <b>tape 2 fois</b> pour relancer le reste.");return}}}
  const now=Date.now();clearTimeout(G.tapT);
  if(now-G.lastTap<420){G.lastTap=0;return myThrow()}
  G.lastTap=now;G.tapT=setTimeout(()=>{if(G.lastTap&&(G.throws<3||G.extra))hint("Encore un tap pour lancer")},430)}
function choose(k){if(G.phase!=="me"||G.busy||G.hold||!G.throws||G.pending||G.me[k]!=null||G.vals.length!==5)return;
  const p=pts(k,G.vals),bt=best(G.me,G.vals);
  if(CH===1&&G.turn<=2&&bt&&bt.p>p&&!G.warned){G.warned=true;say(`Hé, le bleu ! <b>${SAY[bt.k]}</b> te rapporte ${bt.p}. Touche encore pour confirmer ${SAY[k]}.`);G.warnK=k;return}
  if(CH===1&&G.warned&&G.warnK!==k&&G.turn<=2&&bt&&bt.p>p){G.warnK=k;say(`<b>${SAY[bt.k]}</b> te rapporte ${bt.p}. Touche encore pour confirmer ${SAY[k]}.`);return}
  G.warned=false;G.warnK=null;
  const hadPrime=upper(G.me)>=+ST.seuil;G.me[k]=p;pop(p?`+${p} ${SAY[k]}`:`${SAY[k]} rayé`);hit(k,p,true); /* le coup part quand on inscrit sa case */
  if(!hadPrime&&upper(G.me)>=+ST.seuil)setTimeout(()=>{ko("Cases 1 à 6","Prime +"+ST.prime);sfx.heavy()},500);ga("histoire_case",{tour:G.turn,case:k,points:p});
  G.phase="wait";G.extra=false;G.dbl=false;unfreeze();grid();paintHud();hud();
  if(CH===2)say(p?"":"Le Seigneur pardonne… pas les cases rayées.",p?0:2200);
  else say(p?(G.turn===1?"Pas mal ! À moi maintenant, regarde et apprends…":""):"Rayer une case, ça arrive. Choisis bien laquelle !",p?0:2200);
  setTimeout(botTurn,1100)}

/* ---------- tour de Nico (bot, niveau tuto) ---------- */
const SACRIFICE=["un","yams","deux","grande","trois","petite","carre","full","quatre","brelan","cinq","six","chance"];
function botKeep(v,sc,n){const c=counts(v),rs=rolls(),open=k=>sc[k]==null;
  if(open("yams")&&Math.max(...c)===5)return null;
  if(open("grande")&&hasRun(c,5))return null;
  if(open("full")&&pts("full",v)>0)return null;
  if((open("grande")||open("petite"))&&hasRun(c,4)){if(!open("grande"))return null;
    const s=[1,2,3].find(s=>[0,1,2,3].every(i=>c[s+i]));const keep=[];[0,1,2,3].forEach(i=>{const r=rs.find(r=>r.value===s+i&&!keep.includes(r.rollId));if(r)keep.push(r.rollId)});return keep}
  if(CH===1){if(Math.random()<.35&&n<2)return[];if(n===1&&Math.random()<.3)return null} /* niveau tuto : Nico se trompe parfois */
  let val=0,cnt=0;for(let f=6;f>=1;f--){const w=c[f]+(open(UPPER[f-1][0])?.3:0);if(w>cnt){cnt=w;val=f}}
  return rs.filter(r=>r.value===val).map(r=>r.rollId)}
function botPick(sc,v){let bk=null,bv=-1;ALL.forEach(k=>{if(sc[k]!=null)return;let p=pts(k,v);if(p<=0)return;
    const u=UPPER.find(x=>x[0]===k);let s=p;if(u)s=p+(counts(v)[u[2]]>=3?8:0)-u[2];if(k==="chance")s=p-14;if(s>bv){bv=s;bk=k}});
  return bk||SACRIFICE.find(k=>sc[k]==null)}
async function botTurn(){if(G.phase==="off")return;G.phase="bot";G.throws=0;G.locked.clear();unfreeze();G.botLast=null;paintHud();grid();hint("");paintPow();
  ko("Round "+G.turn,"À "+B().court+" !");await wait(1200);if(G.phase!=="bot")return;
  if(CH===1&&G.turn===1)say("Je regarde ce qui sort, je garde le meilleur et je relance le reste.",3000);
  let bdbl=false;if(CH===2&&G.pw.bot.dbl&&G.turn>2&&Math.random()<.6){G.pw.bot.dbl--;bdbl=true;paintPow();ko("Père Bruno","Double garanti");sfx.heavy();await wait(1100);if(G.phase!=="bot")return}
  let ids=allIds().length===5?allIds():[0,1,2,3,4];
  for(let n=0;n<4;n++){paintDice();let r=await tossRetry(ids);if(!r||G.phase!=="bot")return;
    for(let k=0;r.broken&&k<4;k++){paintDice();await wait(900);if(G.phase!=="bot")return;r=await tossRetry(ids);if(!r||G.phase!=="bot")return}
    if(bdbl){bdbl=false;r=await divine(ids,true)||r;if(G.phase!=="bot")return}
    if(CH===2)gain("bot");
    G.broken.clear();G.throws=Math.min(3,n+1);hud();paintDice();await wait(700);if(G.phase!=="bot")return;
    if(CH===2&&n<3){await react(n);if(G.phase!=="bot")return}
    const v=G.vals;
    if(n>=2){ /* 4e lancer de Bruno : seulement si son meilleur coup est faible */
      if(n===2&&CH===2&&G.pw.bot.qua){const bt=best(G.bot,v);if(!bt||bt.p<20){const keep=botKeep(v,G.bot,1)||[];
        G.pw.bot.qua--;paintPow();ko("Père Bruno","4e lancer !");sfx.heavy();G.locked=new Set([...keep,...G.frozen]);paintDice();await wait(1000);if(G.phase!=="bot")return;
        ids=allIds().filter(id=>!G.locked.has(id));if(ids.length)continue}}
      break}
    let keep=botKeep(v,G.bot,n);if(keep===null&&!G.frozen.size)break;
    G.locked=new Set([...(keep||allIds()),...G.frozen]);paintDice();await wait(650);ids=allIds().filter(id=>!G.locked.has(id));if(!ids.length)break}
  if(G.phase!=="bot")return;
  const k=botPick(G.bot,G.vals),p=pts(k,G.vals);G.bot[k]=p;G.botLast=k;grid();if(p)hit(k,p,false);const w=new Set();if(p)winIds(k,w);G.locked.clear();unfreeze();paintDice(w);
  pop(p?`${B().court} +${p} ${SAY[k]}`:`${B().court} raye ${SAY[k]}`);paintHud();
  if(CH===1&&G.turn===1)say(`J'ai pris <b>${SAY[k]}</b> pour ${p}. Chaque case ne sert qu'une fois : 13 tours, 13 cases.`,3200);
  await wait(1700);if(G.phase!=="bot")return;
  if(G.turn>=13)return end();
  G.botLast=null;G.turn++;startMyTurn()}

/* ---------- fin du combat ---------- */
function end(){G.phase="end";fxOff();paintHud();hud();hint("");say("");paintPow();const a=total(G.me),b=total(G.bot),won=a>b,p=prog();
  if(CH===2)return end2(a,b,won);
  if(uid())record(a,b);else if(won){p.nico="win";p.best=Math.max(p.best||0,a);saveProg(p)}
  ga("histoire_fin",{boss:"nico",gagne:won?"oui":"non",resultat:issue(a,b),score:a,boss_score:b,ecart:a-b,...stats()});
  ko(won?"Nico est battu":"Fin du combat",won?"K.O. !":a===b?"Égalité":"Perdu");if(won)sfx.ko();else sfx.heavy();
  mus.stop(.8);setTimeout(()=>{if(G.phase==="end")mus.play(won?"victoire":"defaite")},700);
  setTimeout(()=>{modal(`<h3 class="sark">${won?"Victoire !":a===b?"Égalité":"Perdu…"}</h3>
    <p>${won?"« Pas mal le bleu, t'as ta place au Parvis. » Prochain adversaire : <b>"+NEXT+"</b>, bientôt.":"« Reviens quand tu veux, le bleu. » Nico t'attend pour la revanche."}</p>
    <div class="sres"><div><small>${E(me())}</small>${a}</div><div><small>Nico</small>${b}</div></div>
    <div class="snico"><img src="${BOSSES[0].head}" alt=""><p>${won?"« Partage ton score et je t'offre un verre au Parvis ! »":"« Partage ton score, que tout le Parvis sache qui paie la tournée ! »"}</p></div>
    <button class="sbtn gold" id="sShare" type="button">${won?"Partager mon score":"Partager ma honte"}</button>
    <button class="sbtn" id="sAgain" type="button">${won?"Rejouer":"Revanche"}</button><button class="sbtn" id="sBack" type="button">Retour au club</button>`,
    m=>{m.querySelector("#sShare").onclick=e=>share(e.currentTarget,a,b,won);m.querySelector("#sAgain").onclick=()=>{ga("histoire_revanche",{resultat:issue(a,b)});$("#sModal").hidden=true;open(1)};m.querySelector("#sBack").onclick=()=>{ga("histoire_retour_club",{resultat:issue(a,b)});close()}})},1800)}
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
  modal(`<h3 class="sark">Quitter ?</h3><p>Le combat contre ${B().nom} sera abandonné.</p>
  <button class="sbtn gold" id="sStay" type="button">Continuer le combat</button><button class="sbtn" id="sLeave" type="button">Quitter</button>`,
  m=>{m.querySelector("#sStay").onclick=()=>{$("#sModal").hidden=true};m.querySelector("#sLeave").onclick=()=>{ga("histoire_abandon",{boss:B().id,tour:G.turn,score:total(G.me),boss_score:total(G.bot),ecart:total(G.me)-total(G.bot),...stats()});close()}})}
function gear(){modal(`<h3 class="sark">Réglages</h3>
  <label class="stog">Conseils de Nico<input type="checkbox" id="sTips" ${tipsOn()?"checked":""}></label>
  <label class="stog">Musique<input type="checkbox" id="sMus" ${musicOn()?"checked":""}></label>
  <label class="stog">Son des dés et bruitages<input type="checkbox" id="sSnd" ${soundOn()?"checked":""}></label>
  <ul class="srules"><li>13 tours chacun, 3 lancers maximum par tour.</li><li>Touche un dé pour le garder, tape 2 fois sur le tapis pour lancer.</li><li>Prime de ${ST.prime} si tu fais ${ST.seuil} ou plus sur les cases 1 à 6.</li><li>Full ${ST.fullFixe}, petite suite ${ST.petite}, grande suite ${ST.grande}, Yam's ${ST.yams}.</li>${CH===2?`<li><b>Pouvoirs</b> : fais la combinaison pendant ton tour (pas besoin de l'inscrire), un seul de chaque à la fois. Full = geler un dé de Bruno, petite suite = relancer un de ses dés, grande suite = 4e lancer, Yam's = double garanti au prochain lancer.</li><li>Les attaques (rouge) se jouent au tour de Bruno, juste après un de ses lancers, sur un dé qu'il n'a pas gardé.</li>`:""}</ul>
  <button class="sbtn gold" id="sOk" type="button">OK</button>`,
  m=>{m.querySelector("#sMus").onchange=e=>{try{localStorage.setItem(MKEY,e.target.checked?"1":"0")}catch(_){}
    if(!e.target.checked){mus.pauseAt();mus.stop(.3)}else if(G.phase==="me"||G.phase==="bot"){mus.play("match",.8)}};
    m.querySelector("#sSnd").onchange=e=>{try{localStorage.setItem(SKEY,e.target.checked?"1":"0")}catch(_){}if(e.target.checked)sfx.light()};m.querySelector("#sTips").onchange=e=>{try{localStorage.setItem(TKEY,e.target.checked?"1":"0")}catch(_){}if(!e.target.checked)say("")};m.querySelector("#sOk").onclick=()=>{$("#sModal").hidden=true}})}
/* ---------- chapitre 2 : pouvoirs du Yam's des dieux ----------
   On gagne un pouvoir en faisant la combinaison pendant son tour (sans avoir à l'inscrire), un seul de chaque à la fois : full = geler un dé adverse, petite suite = relancer un dé adverse,
   grande suite = 4e lancer, Yam's = au moins un double au prochain lancer. Attaques (rouge) : au tour de l'adversaire, juste après un
   de ses lancers, sur un dé qu'il n'a pas gardé ; un dé gelé ne peut plus être relancé jusqu'à la fin de son tour. Boosts (vert) : à son tour. */
const PNAME={gel:"Geler un dé",rel:"Relancer un dé",qua:"4e lancer",dbl:"Double garanti"};
const PSTEP=["gel","rel","qua","dbl"];
const SV=d=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const PICON={
  gel:SV('<path d="M12 2v20M3.3 7l17.4 10M20.7 7L3.3 17M9.5 3.5L12 6l2.5-2.5M9.5 20.5L12 18l2.5 2.5"/>'),
  rel:SV('<rect x="1.5" y="6.5" width="11" height="11" rx="3"/><circle cx="7" cy="12" r="1.4" fill="currentColor" stroke="none"/><text x="13.5" y="12.5">+1</text>'),
  qua:SV('<path d="M20 12a8 8 0 1 1-2.4-5.7"/><path d="M18.4 2.6v4.2h-4.2"/><text x="8.6" y="15.6" style="font-size:10px">4</text>'),
  dbl:SV('<rect x="1.5" y="8" width="10" height="10" rx="2.5"/><rect x="12.5" y="4" width="10" height="10" rx="2.5"/><circle cx="4.5" cy="11" r="1.1" fill="currentColor" stroke="none"/><circle cx="8.5" cy="15" r="1.1" fill="currentColor" stroke="none"/><circle cx="15.5" cy="7" r="1.1" fill="currentColor" stroke="none"/><circle cx="19.5" cy="11" r="1.1" fill="currentColor" stroke="none"/>')};
const valOf=id=>{const r=rolls().find(x=>x.rollId===id);return r?r.value:0};
const targetable=id=>G.phase==="bot"&&!G.locked.has(id)&&!G.frozen.has(id);
const anyTarget=()=>allIds().some(targetable);
function usable(k){if(G.busy)return false;
  if(k==="gel")return G.react&&!G.arm&&G.reactN<2&&anyTarget();
  if(k==="rel")return G.react&&!G.arm&&anyTarget();
  if(k==="qua")return G.phase==="me"&&!G.hold&&G.throws>=3&&!G.pending&&!G.extra;
  if(k==="dbl")return G.phase==="me"&&!G.hold&&!G.pending&&!G.dbl&&(G.throws<3||G.extra);return false}
function paintPow(){if(!root||CH!==2||!G.pw)return;
  const side=who=>{const key=k=>{const n=G.pw[who][k],st=!n?"empty":who==="bot"?"idle":G.arm===k?"armed":usable(k)?"ready":"idle";
      const lab=(who==="bot"?"Bruno : ":"")+PNAME[k]+(n?` (${n})`:" — pas encore gagné")+(st==="ready"?" — utilisable":st==="armed"?" — activé":"");
      const a=who==="me"?`button type="button"`:`span role="img"`;
      return`<${a} class="pk ${k==="gel"||k==="rel"?"atk":"self"} ${st}" data-p="${k}" aria-label="${lab}">${PICON[k]}${n?`<b>${n}</b>`:""}</${who==="me"?"button":"span"}>`};
    return`<em class="pg atk">ATQ</em>${key("gel")}${key("rel")}<i class="psep"></i><em class="pg self">BOOST</em>${key("qua")}${key("dbl")}`};
  $("#sPowMe").innerHTML=side("me");$("#sPowB").innerHTML=side("bot")}
function gain(who){const v=G.vals;if(v.length!==5)return;const c=counts(v),mx=Math.max(...c);let w=null;
  if(mx===5)w="dbl";else if(hasRun(c,5))w="qua";else if(hasRun(c,4))w="rel";else if(pts("full",v)>0)w="gel";
  if(!w||G.pw[who][w])return; /* un seul de chaque pouvoir à la fois */
  G.pw[who][w]=1;paintPow();ga("histoire_pouvoir_gagne",{qui:who,pouvoir:w});
  setTimeout(()=>{if(G.phase==="off")return;ko(who==="me"?"Pouvoir gagné":"Bruno gagne un pouvoir",PNAME[w]);sfx.combo(50)},700)}
function power(k){if(CH!==2||!G.pw||!G.pw.me[k])return;
  if(G.arm===k){G.arm=null;fxOff();paintDice();paintPow();hint("");if(G.reactGo)G.reactGo();return} /* retouche = annuler */
  if(!usable(k)){sfx.miss();return}
  ga("histoire_pouvoir",{pouvoir:k,tour:G.turn});
  if(k==="qua"){G.pw.me.qua--;G.extra=true;ko("Grande suite","4e lancer !");sfx.heavy();hint("Tape 2 fois pour lancer");hud();paintPow();return}
  if(k==="dbl"){G.pw.me.dbl--;G.dbl=true;ko("Yam's des dieux","Double garanti");sfx.heavy();hint("Tape 2 fois pour lancer");paintPow();return}
  clearTimeout(G.reactT);G.arm=k;$("#sReact").hidden=true;fxOn(k);paintDice();paintPow();
  hint(k==="gel"?"Touche un dé de Bruno à geler":"Choisis un dé libre à relancer")}
/* fenêtre de réaction après un lancer de Bruno : fine ligne sous ta barre de vie */
async function react(n){if(!((G.pw.me.gel&&n<2)||G.pw.me.rel)||!anyTarget())return;
  G.react=true;G.reactN=n;paintPow();const bar=$("#sReact"),i=bar.firstElementChild;bar.hidden=false;
  i.style.transition="none";i.style.width="100%";void i.offsetWidth;i.style.transition="width 2.6s linear";i.style.width="0%";
  if(G.turn<=3)hint("Réagis : touche un pouvoir rouge !");
  await new Promise(res=>{G.reactGo=()=>{G.reactGo=null;clearTimeout(G.reactT);res()};G.reactT=setTimeout(()=>{if(!G.arm&&G.reactGo)G.reactGo()},2700)});
  G.react=false;G.arm=null;bar.hidden=true;hint("");fxOff();paintDice();paintPow()}
/* attaque visée : on touche un dé de Bruno */
async function aim(e){const p=peek();if(!p)return;const cr=p.canvas.getBoundingClientRect(),x=e.clientX-cr.left,y=e.clientY-cr.top;let hitId=null,bd=1e9;
  live().forEach(d=>{const g=geo(d),dist=Math.hypot(g.x-x,g.y-y);if(dist<g.size*.7&&dist<bd){bd=dist;hitId=d.config.rollId}});
  if(hitId==null)return;
  if(!targetable(hitId)){sfx.miss();say(G.frozen.has(hitId)?"Ce dé est déjà gelé.":"Dé <b>bloqué</b> : Bruno l'a gardé, on n'y touche pas.",1600,true);return}
  const k=G.arm;G.pw.me[k]--;G.arm=null;hint("");
  if(k==="gel"){G.frozen.add(hitId);fxOff();sfx.lock();iceHit();ko("Vent glacial","Gelé !");paintDice();paintPow();ga("histoire_attaque",{pouvoir:"gel",tour:G.turn});
    await wait(800);if(G.reactGo)G.reactGo();return}
  paintDice();paintPow();let r=await toss([hitId]);if(r&&r.broken)r=await toss([hitId]);fxOff();ko("Temps arrêté","Relancé !");sfx.medium();paintDice();paintPow();
  ga("histoire_attaque",{pouvoir:"rel",tour:G.turn});await wait(700);if(G.reactGo)G.reactGo()}
/* Bruno attaque après un de tes lancers (une fois par tour au plus) */
async function botStrike(){if(G.atk||G.phase!=="me")return;const free=allIds().filter(id=>!G.locked.has(id)&&!G.frozen.has(id));if(!free.length)return;
  const useGel=G.pw.bot.gel>0&&Math.random()<.5,useRel=!useGel&&G.pw.bot.rel>0&&Math.random()<.5;if(!useGel&&!useRel)return;
  G.atk=true;G.hold=true;paintPow();const bt=best(G.me,G.vals),win=new Set();if(bt)winIds(bt.k,win);
  if(useGel){const c=free.filter(id=>!win.has(id)),pool=(c.length?c:free).sort((a,b)=>valOf(a)-valOf(b)),id=pool[0];
    G.pw.bot.gel--;paintPow();fxOn("gel");ko("Père Bruno","Vent glacial !");say("Que le froid du Seigneur fige ce dé !",2200,true);await wait(1500);if(G.phase!=="me")return;
    G.frozen.add(id);fxOff();iceHit();paintDice(win)}
  else{const c=free.filter(id=>win.has(id)),pool=c.length?c:free,id=pool[Math.random()*pool.length|0];
    G.pw.bot.rel--;paintPow();fxOn("rel");ko("Père Bruno","Le temps s'arrête");say("Pardonne-moi, mon enfant…",2000,true);await wait(1700);if(G.phase!=="me")return;
    let r=await toss([id]);if(r&&r.broken)r=await toss([id]);fxOff();if(G.phase!=="me")return;
    const b2=best(G.me,G.vals),w2=new Set();if(b2){pop(`+${b2.p} ${SAY[b2.k]}`);winIds(b2.k,w2)}paintDice(w2);grid();gain("me")}
  G.hold=false;hud();paintPow()}
/* double garanti : le double doit sortir parmi les dés qu'on vient de lancer (ou, si on n'en lance qu'un, avec un dé déjà posé).
   Le moteur physique ne choisit pas les faces : tant que ce n'est pas le cas, un des dés lancés est relancé « guidé par le Saint-Esprit ». */
async function divine(ids,bot){const v=id=>valOf(id);
  /* un dé relancé change d'identifiant : les dés lancés sont ceux qui ne sont ni gardés ni gelés */
  const thrown=()=>allIds().filter(id=>!G.locked.has(id)&&!G.frozen.has(id));
  const ok=()=>{if(G.vals.length!==5)return true;const t=thrown();if(!t.length)return true;
    if(t.length>=2){const c={};return t.some(id=>(c[v(id)]=(c[v(id)]||0)+1)>=2)}
    return allIds().some(id=>id!==t[0]&&v(id)===v(t[0]))};
  if(ok())return null;
  ko(bot?"Père Bruno":"Yam's des dieux","Saint-Esprit");fxOn("holy");let r=null;const gen=G.gen;
  for(let i=0;i<20&&!ok();i++){const t=thrown(),id=t.length>=2?t[1+i%(t.length-1)]:t[0]; /* un dé lancé sert d'ancre, on relance les autres */
    await wait(120);if(gen!==G.gen)return null;r=await toss([id]);if(!r)break;if(r.broken){r=await toss([...G.broken]);if(!r)break}}
  fxOff();return r}
/* effets : vent glacial, temps arrêté (musique coupée, tic-tac), lumière divine */
let tickT=0;
function fxOn(k){fxOff();G.fx=k;root.classList.add(k==="gel"?"frozen":k==="rel"?"tstop":"holy");const fx=$("#sFx");
  if(k==="gel"){fx.innerHTML=`<div class="sfrost"><i class="fz-tint"></i><i class="fz-patch"></i><i class="fz-cry"></i><i class="fz-wind b"></i><i class="fz-wind"></i><i class="fz-snow b"></i><i class="fz-snow"></i></div>
    <div class="sgel sark">VENT GLACIAL<small>${G.phase==="bot"?"Choisis le dé à geler":"Bruno gèle un de tes dés"}</small></div>`;
    nz(0,{type:"bandpass",f:450,f2:1400,q:.6,v:.2,att:.5,dec:1.8});nz(.6,{type:"bandpass",f:900,f2:500,q:.7,v:.14,att:.4,dec:1.4})}
  else if(k==="rel"){fx.innerHTML=`<div class="stic sark">TIC… TAC…<small>Le temps est arrêté</small></div>`;mus.pauseAt();mus.stop(.15,true);
    let t=false;tickT=setInterval(()=>{t=!t;beep(t?1250:900,.05,"square",.05)},500)}
  else{fx.innerHTML=`<div class="sholy"></div>`;bell(0,.18)}}
function fxOff(){if(!root)return;root.classList.remove("frozen","tstop","holy");const fx=$("#sFx");if(fx)fx.innerHTML="";clearInterval(tickT);
  const was=G.fx;G.fx=null;if(was==="rel"&&G.phase!=="off"&&G.phase!=="end"&&musicOn())mus.resume()}
function iceHit(){[0,.05,.11].forEach((t,i)=>tn(t,{f:2600-i*500,f2:1400,v:.09,att:.002,dec:.25}));nz(0,{type:"highpass",f:3000,v:.15,att:.002,dec:.2})}
/* dé gelé : coque de glace en 3D dans la scène (copie agrandie du dé, matière glace translucide, accrochée au dé)
   + teinte glacée du dé + petite pastille flocon au-dessus */
const shells=new Map();let iceMatS=null;
function iceMat(sc){if(iceMatS&&iceMatS.getScene()===sc)return iceMatS;const S=sc.materials.find(m=>m.getClassName()==="StandardMaterial");if(!S)return null;
  const m=new S.constructor("yamsIce",sc),C3=S.diffuseColor.constructor;m.diffuseColor=new C3(.74,.9,1);m.emissiveColor=new C3(.2,.4,.58);m.specularColor=new C3(1,1,1);m.specularPower=110;
  m.alpha=.42;m.backFaceCulling=true;return iceMatS=m}
function shellOn(d){const id=d.config.rollId,o=shells.get(id);if(o&&o.die===d.mesh&&!o.sh.isDisposed())return;if(o)try{o.sh.dispose()}catch(e){}
  const src=d.mesh.sourceMesh,sc=d.mesh.getScene(),m=src&&iceMat(sc);if(!m)return;let sh;try{sh=src.clone("yamsIce"+id,null,true)}catch(e){return}if(!sh)return;
  sh.setEnabled(true);sh.isVisible=true;sh.isPickable=false;sh.material=m;sh.parent=d.mesh;sh.position.set(0,0,0);sh.rotationQuaternion=null;
  sh.rotation.set(.13,.22,-.09);sh.scaling.set(1.3,1.22,1.34);try{sh.receiveShadows=false}catch(e){}shells.set(id,{sh,die:d.mesh})}
function shellOff(id,burst){const o=shells.get(id);if(!o)return;shells.delete(id);const sh=o.sh;if(!burst||sh.isDisposed()){try{sh.dispose()}catch(e){}return}
  /* la glace éclate : la coque gonfle et s'efface */
  const m=sh.material.clone("yamsIceOut");sh.material=m;const p=peek(),t0=performance.now();iceHit();
  const f=()=>{const k=Math.min(1,(performance.now()-t0)/320);sh.scaling.set(1.3+k*.5,1.22+k*.5,1.34+k*.5);m.alpha=.42*(1-k);try{p&&p.scene.render()}catch(e){}
    if(k<1)requestAnimationFrame(f);else{try{sh.dispose();m.dispose()}catch(e){}}};f()}
function unfreeze(){const burst=G.phase!=="off";[...shells.keys()].forEach(id=>shellOff(id,burst&&G.frozen.has(id)));if(G.frozen)G.frozen.clear();paintFz()}
function paintFz(){const z=root&&$("#sFz");if(!z)return;const fr=G.frozen||new Set();
  [...shells.keys()].forEach(id=>{if(!fr.has(id))shellOff(id,false)});
  if(!fr.size){z.innerHTML="";return}const p=peek();if(!p)return;
  const ds=live().filter(d=>fr.has(d.config.rollId));ds.forEach(shellOn);
  const zr=$("#sZone").getBoundingClientRect(),cr=p.canvas.getBoundingClientRect();
  z.innerHTML=ds.map(d=>{const g=geo(d),x=cr.left-zr.left+g.x,y=cr.top-zr.top+g.y;
    return`<span class="fzb" style="left:${x+g.size*.55}px;top:${y-g.size*.85}px">${PICON.gel}</span>`}).join("")}
function end2(a,b,won){ga("histoire_fin",{boss:"bruno",gagne:won?"oui":"non",resultat:issue(a,b),score:a,boss_score:b,ecart:a-b,...stats()});
  ko(won?"Bruno est battu":"Fin du combat",won?"K.O. !":a===b?"Égalité":"Perdu");if(won)sfx.ko();else sfx.heavy();
  mus.stop(.8);setTimeout(()=>{if(G.phase==="end")mus.play(won?"victoire":"defaite")},700);
  setTimeout(()=>{modal(`<h3 class="sark">${won?"Victoire !":a===b?"Égalité":"Perdu…"}</h3>
    <p>${won?"Tu as battu le Père Bruno au Yam's des dieux.":"Le Père Bruno garde le Yam's des dieux… pour l'instant."}</p>
    <div class="sres"><div><small>${E(me())}</small>${a}</div><div><small>Bruno</small>${b}</div></div>
    <div class="snico"><img src="${BOSSES[1].head}" alt=""><p>${won?"« Amen ! Le Seigneur t'a donné de bons dés. »":"« Reviens à la messe, mon enfant… et au Yam's. »"}</p></div>
    <button class="sbtn gold" id="sAgain" type="button">${won?"Rejouer":"Revanche"}</button><button class="sbtn" id="sBack" type="button">Retour au club</button>`,
    m=>{m.querySelector("#sAgain").onclick=()=>{ga("histoire_revanche",{boss:"bruno",resultat:issue(a,b)});$("#sModal").hidden=true;open(2)};m.querySelector("#sBack").onclick=()=>close()})},1800)}

window.Story={open,close};
})();
/* l'accueil a pu s'afficher avant ce script : on le redessine pour faire apparaître le bloc histoire */
if(document.getElementById("cCreate")&&!document.getElementById("storyBox")&&typeof render==="function")render();
