/* faux Firebase pour les tests : Firestore vide + Auth via le serveur de test (jetons) */
(function(){
  const snap={docs:[],empty:true,size:0,forEach(){},docChanges(){return[]},exists:false,data(){return undefined},metadata:{hasPendingWrites:false,fromCache:false}};
  window.__fsWrites=[];
  function q(path){const o={
    collection:(n)=>q(path+"/"+n),doc:(id)=>q(path+"/"+(id||"auto")),
    orderBy:()=>o,where:()=>o,limit:()=>o,startAfter:()=>o,
    get:()=>Promise.resolve(snap),onSnapshot:(a,b)=>{const cb=typeof a==="function"?a:b;setTimeout(()=>cb&&cb(snap),10);return()=>{}},
    set:(d)=>{window.__fsWrites.push({op:"set",path,d});return Promise.resolve()},update:(d)=>{window.__fsWrites.push({op:"update",path,d});return Promise.resolve()},
    delete:()=>{window.__fsWrites.push({op:"delete",path});return Promise.resolve()},add:(d)=>{window.__fsWrites.push({op:"add",path,d});return Promise.resolve({id:"x"})},id:path.split("/").pop()};return o}
  const fs={collection:(n)=>q(n),enablePersistence:()=>Promise.resolve(),batch:()=>({set(){},update(){},delete(){},commit:()=>Promise.resolve()}),runTransaction:(f)=>f({get:()=>Promise.resolve(snap),set(){},update(){}})};
  const listeners=[];let cur=null;const KEEP=u=>{try{u?sessionStorage.setItem('fakeUser',JSON.stringify({uid:u.uid,c:u._claims,t:u._tok})):sessionStorage.removeItem('fakeUser')}catch(e){}};
  function mkUser(uid,claims){return{uid,_claims:claims,_tok:null,
    async getIdToken(){return this._tok},async getIdTokenResult(){return{claims:this._claims,token:this._tok}},
    async delete(){window.__authDeleted=uid;cur=null;KEEP(null);listeners.forEach(l=>l(null))}}}
  try{const k=JSON.parse(sessionStorage.getItem('fakeUser')||'null');if(k){cur=mkUser(k.uid,k.c);cur._tok=k.t}}catch(e){}
  const auth={get currentUser(){return cur},
    onAuthStateChanged(f){listeners.push(f);setTimeout(()=>f(cur),20);return()=>{}},
    async signInWithCustomToken(t){const r=await fetch("https://mint.test/",{method:"POST",body:t});const d=await r.json();if(!r.ok)throw new Error(d.error);
      const u=mkUser(d.uid,d.claims);u._tok=d.idToken;const changed=!cur||cur.uid!==u.uid;cur=u;KEEP(u);if(changed)listeners.forEach(l=>l(cur));return{user:u}},
    async signOut(){cur=null;KEEP(null);listeners.forEach(l=>l(null))}};
  const app={};
  window.firebase={apps:[],initializeApp(c){this.apps.push(app);return app},firestore:Object.assign(()=>fs,{FieldValue:{serverTimestamp:()=>"__ts__",increment:n=>n,arrayUnion:(...a)=>a},Timestamp:{now:()=>({toMillis:()=>Date.now()})}}),auth:()=>auth};
})();
