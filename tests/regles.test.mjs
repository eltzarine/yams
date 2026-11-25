// Règles Firestore : chaque cas autorisé ou refusé, sur l'émulateur (lancé par « npm test »)
import { initializeTestEnvironment, assertSucceeds, assertFails } from "@firebase/rules-unit-testing";
import { doc, setDoc, updateDoc, deleteDoc, getDoc, getDocs, collection, serverTimestamp, Timestamp } from "firebase/firestore";
import fs from "fs";
const rules = fs.readFileSync(new URL("../auth/firestore.rules", import.meta.url), "utf8");
let n = 0, f = 0;
const t = async (m, p) => { n++; try { await p; console.log("✓", m) } catch (e) { f++; console.log("✗", m, e.message) } };

// ---------- Joueurs qui rejoignent une partie ----------
{
const env=await initializeTestEnvironment({projectId:"demo-regles1",firestore:{rules,host:"127.0.0.1",port:8085}});
const anon=env.unauthenticatedContext().firestore();
const lea=env.authenticatedContext("uL",{pseudo:"Léa"}).firestore();
const tom=env.authenticatedContext("uT",{pseudo:"Tom"}).firestore();
const G="gabcdefghij012345";const P="direct/K7P2Q/joueurs/";
await t("invité crée",assertSucceeds(setDoc(doc(anon,P+G),{pseudo:"Léa#guest",compte:false,at:serverTimestamp()})));
await t("invité sans #guest refusé",assertFails(setDoc(doc(anon,P+"gzzzzzzzzzzzzzzzz"),{pseudo:"Léa",compte:false,at:serverTimestamp()})));
await t("invité avec # dans le nom refusé",assertFails(setDoc(doc(anon,P+"gzzzzzzzzzzzzzzzz"),{pseudo:"A#b#guest",compte:false,at:serverTimestamp()})));
await t("invité se faisant passer pour compte refusé",assertFails(setDoc(doc(anon,P+"gyyyyyyyyyyyyyyyy"),{pseudo:"Tom",compte:true,uid:"uT",at:serverTimestamp()})));
await t("lecture publique",assertSucceeds(getDocs(collection(anon,"direct/K7P2Q/joueurs"))));
await t("compte crée le sien",assertSucceeds(setDoc(doc(tom,P+"uT"),{pseudo:"Tom",compte:true,uid:"uT",at:serverTimestamp()})));
await t("compte avec faux pseudo refusé",assertFails(setDoc(doc(tom,P+"uT"),{pseudo:"Marina",compte:true,uid:"uT",at:serverTimestamp()})));
await t("compte au nom d'un autre uid refusé",assertFails(setDoc(doc(tom,P+"uX"),{pseudo:"Tom",compte:true,uid:"uT",at:serverTimestamp()})));
await t("invité change de nom",assertSucceeds(setDoc(doc(anon,P+G),{pseudo:"Lé#guest".replace("Lé#","Lé#").replace("Lé#guest","Lea#guest"),compte:false,at:serverTimestamp()})));
await t("invité devient son compte",assertSucceeds(setDoc(doc(lea,P+G),{pseudo:"Léa",compte:true,uid:"uL",at:serverTimestamp()})));
await t("compte ne redevient pas invité",assertFails(setDoc(doc(anon,P+G),{pseudo:"X#guest",compte:false,at:serverTimestamp()})));
await t("autre compte ne prend pas la place",assertFails(setDoc(doc(tom,P+G),{pseudo:"Tom",compte:true,uid:"uT",at:serverTimestamp()})));
await t("champ en trop refusé",assertFails(setDoc(doc(anon,P+"gwwwwwwwwwwwwwwww"),{pseudo:"Z#guest",compte:false,at:serverTimestamp(),x:1})));
await t("direct toujours OK",assertSucceeds(setDoc(doc(anon,"direct/K7P2Q"),{players:["a"],scores:{},settings:{},started:false,last:null,updatedAt:serverTimestamp()})));
await t("direct avec hôte",assertSucceeds(setDoc(doc(anon,"direct/K7P2Q"),{players:["a"],hote:"César",scores:{},settings:{},started:false,last:null,updatedAt:serverTimestamp()})));
await t("direct avec hôte trop long refusé",assertFails(setDoc(doc(anon,"direct/K7P2Q"),{players:["a"],hote:"x".repeat(40),scores:{},settings:{},started:false,last:null,updatedAt:serverTimestamp()})));
await t("direct hôte null",assertSucceeds(setDoc(doc(anon,"direct/K7P2Q"),{players:["a"],hote:null,scores:{},settings:{},started:false,last:null,updatedAt:serverTimestamp()})));
await env.cleanup();
}

// ---------- Invitations ----------
{
const env=await initializeTestEnvironment({projectId:"demo-regles2",firestore:{rules,host:"127.0.0.1",port:8085}});
const ces=env.authenticatedContext("uA",{pseudo:"César"}).firestore();
const jo=env.authenticatedContext("uJ",{pseudo:"Jojo"}).firestore();
const tom=env.authenticatedContext("uT",{pseudo:"Tom"}).firestore();
const anon=env.unauthenticatedContext().firestore();
const inv=(h,u,c="K7P2Q")=>({code:c,hote:h,hoteUid:u,at:serverTimestamp()});
await t("hôte lit une invitation inexistante (écoute)",assertSucceeds(getDoc(doc(ces,"invitations/uJ"))));
await t("hôte invite Jojo",assertSucceeds(setDoc(doc(ces,"invitations/uJ"),inv("César","uA"))));
await t("non connecté ne peut pas inviter",assertFails(setDoc(doc(anon,"invitations/uX"),inv("César","uA"))));
await t("usurper le nom de l'hôte refusé",assertFails(setDoc(doc(tom,"invitations/uX"),inv("César","uT"))));
await t("s'inviter soi-même refusé",assertFails(setDoc(doc(ces,"invitations/uA"),inv("César","uA"))));
await t("Jojo lit son invitation",assertSucceeds(getDoc(doc(jo,"invitations/uJ"))));
await t("un tiers ne lit pas l'invitation",assertFails(getDoc(doc(tom,"invitations/uJ"))));
await t("non connecté ne lit pas",assertFails(getDoc(doc(anon,"invitations/uJ"))));
await t("Jojo ne peut pas modifier le code",assertFails(updateDoc(doc(jo,"invitations/uJ"),{code:"ZZZZZ"})));
await t("Jojo refuse",assertSucceeds(updateDoc(doc(jo,"invitations/uJ"),{refus:true})));
await t("hôte voit le refus",assertSucceeds(getDoc(doc(ces,"invitations/uJ"))));
await t("un tiers ne supprime pas",assertFails(deleteDoc(doc(tom,"invitations/uJ"))));
await t("hôte supprime",assertSucceeds(deleteDoc(doc(ces,"invitations/uJ"))));
await t("ré-invitation puis Jojo supprime (accepte)",assertSucceeds(setDoc(doc(ces,"invitations/uJ"),inv("César","uA")).then(()=>deleteDoc(doc(jo,"invitations/uJ")))));
await env.cleanup();
}

// ---------- Historique, directs, effacement ----------
{
const env=await initializeTestEnvironment({projectId:"demo-regles3",firestore:{rules,host:"127.0.0.1",port:8085}});
const anon=env.unauthenticatedContext().firestore();
const a1=env.authenticatedContext("anon1",{firebase:{sign_in_provider:"anonymous"}}).firestore();
const a2=env.authenticatedContext("anon2",{firebase:{sign_in_provider:"anonymous"}}).firestore();
const g=(owner,top=150)=>({date:"2026-11-24T21:00:00Z",winner:"César",top,ranking:[{n:"César",t:top}],owner,createdAt:serverTimestamp()});
const exp=h=>Timestamp.fromMillis(Date.now()+h*3600e3);
const live=(x={})=>({players:["a"],scores:{},settings:{},started:false,last:null,updatedAt:serverTimestamp(),expireAt:exp(24),...x});
await t("partie sans identité refusée",assertFails(setDoc(doc(anon,"parties/gabcdef1"),g("x"))));
await t("partie avec identité anonyme acceptée",assertSucceeds(setDoc(doc(a1,"parties/gabcdef1"),g("anon1"))));
await t("partie au nom d'un autre refusée",assertFails(setDoc(doc(a1,"parties/gabcdef2"),g("anon2"))));
await t("score > 1200 refusé",assertFails(setDoc(doc(a1,"parties/gabcdef3"),g("anon1",1500))));
await t("le créateur corrige",assertSucceeds(setDoc(doc(a1,"parties/gabcdef1"),{top:160,winner:"César",ranking:[{n:"César",t:160}]},{merge:true})));
await t("un autre ne corrige pas",assertFails(setDoc(doc(a2,"parties/gabcdef1"),{top:999},{merge:true})));
await t("un autre ne supprime pas",assertFails(deleteDoc(doc(a2,"parties/gabcdef1"))));
await t("sans compte ne supprime pas",assertFails(deleteDoc(doc(anon,"parties/gabcdef1"))));
await t("historique lisible par tous",assertSucceeds(getDocs(collection(anon,"parties"))));
await t("le créateur supprime",assertSucceeds(deleteDoc(doc(a1,"parties/gabcdef1"))));
await t("direct créé avec expireAt",assertSucceeds(setDoc(doc(anon,"direct/K7P2Q"),live())));
await t("direct lu avec son code",assertSucceeds(getDoc(doc(anon,"direct/K7P2Q"))));
await t("lister les directs refusé",assertFails(getDocs(collection(anon,"direct"))));
await t("expireAt trop lointain refusé",assertFails(setDoc(doc(anon,"direct/K7P2Q"),live({expireAt:exp(24*30)}))));
await t("joueur rejoint avec expireAt",assertSucceeds(setDoc(doc(anon,"direct/K7P2Q/joueurs/gabcdefghij012345"),{pseudo:"Léa#guest",compte:false,at:serverTimestamp(),expireAt:exp(24)})));
await t("liste des joueurs d'une partie (hôte)",assertSucceeds(getDocs(collection(anon,"direct/K7P2Q/joueurs"))));
await env.cleanup();
}
// ---------- Progression des défis de l'accueil ----------
{
const env=await initializeTestEnvironment({projectId:"demo-regles4",firestore:{rules,host:"127.0.0.1",port:8085}});
const anon=env.unauthenticatedContext().firestore();
const a1=env.authenticatedContext("anon1",{firebase:{sign_in_provider:"anonymous"}}).firestore();
const lea=env.authenticatedContext("uL",{pseudo:"Léa",firebase:{sign_in_provider:"custom"}}).firestore();
const tom=env.authenticatedContext("uT",{pseudo:"Tom",firebase:{sign_in_provider:"custom"}}).firestore();
const pr=(x={})=>({semaine:"2026-11-23",defis:4,updatedAt:serverTimestamp(),...x});
await t("compte écrit sa progression",assertSucceeds(setDoc(doc(lea,"progres/uL"),pr())));
await t("compte relit sa progression",assertSucceeds(getDoc(doc(lea,"progres/uL"))));
await t("un autre compte ne lit pas",assertFails(getDoc(doc(tom,"progres/uL"))));
await t("non connecté ne lit pas",assertFails(getDoc(doc(anon,"progres/uL"))));
await t("un autre compte n'écrit pas",assertFails(setDoc(doc(tom,"progres/uL"),pr())));
await t("identité anonyme refusée",assertFails(setDoc(doc(a1,"progres/anon1"),pr())));
await t("plus de 20 défis refusé",assertFails(setDoc(doc(lea,"progres/uL"),pr({defis:21}))));
await t("défis négatifs refusés",assertFails(setDoc(doc(lea,"progres/uL"),pr({defis:-1}))));
await t("semaine mal formée refusée",assertFails(setDoc(doc(lea,"progres/uL"),pr({semaine:"lundi"}))));
await t("champ en trop refusé",assertFails(setDoc(doc(lea,"progres/uL"),pr({x:1}))));
await t("compte supprime sa progression",assertSucceeds(deleteDoc(doc(lea,"progres/uL"))));
await env.cleanup();
}
console.log(`Règles : ${n - f}/${n}`);
if (f) process.exit(1);
