// Ménage nocturne de Firestore (sans facturation Google, à la place des règles TTL) :
//  - directs inactifs depuis plus de 24 h, avec les joueurs qui les ont rejoints
//  - joueurs rejoints restés seuls (direct déjà supprimé) depuis plus de 24 h
//  - invitations de plus de 10 minutes
// Ne touche jamais à l'historique (« parties ») ni aux profils de comptes (« joueurs/{uid} » à la racine).
// Variables : FIREBASE_SERVICE_ACCOUNT (JSON) ; MENAGE_ESSAI=1 pour compter sans rien effacer ;
// FIRESTORE_EMULATOR_HOST (tests) pour viser l'émulateur.
import { SignJWT, importPKCS8 } from "jose";

const ESSAI = process.env.MENAGE_ESSAI === "1";
const EMU = process.env.FIRESTORE_EMULATOR_HOST;
const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "{}");
const project = EMU ? (process.env.PROJECT_ID || "demo-yams") : sa.project_id;
if (!project || (!EMU && !sa.private_key)) { console.error("FIREBASE_SERVICE_ACCOUNT manquant"); process.exit(1); }

const JOUR = 24 * 3600e3, INVITATION = 10 * 60e3;

async function jeton() {
  if (EMU) return "owner"; // l'émulateur accepte « owner » (règles ignorées)
  const key = await importPKCS8(sa.private_key, "RS256");
  const assertion = await new SignJWT({ scope: "https://www.googleapis.com/auth/datastore https://www.googleapis.com/auth/cloud-platform" })
    .setProtectedHeader({ alg: "RS256", kid: sa.private_key_id }).setIssuer(sa.client_email)
    .setAudience("https://oauth2.googleapis.com/token").setIssuedAt().setExpirationTime("10m").sign(key);
  const r = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }) });
  const d = await r.json(); if (!r.ok) throw new Error("jeton : " + JSON.stringify(d));
  return d.access_token;
}

const H = { authorization: "Bearer " + await jeton(), "content-type": "application/json" };
const ROOT = `projects/${project}/databases/(default)/documents`;
const API = EMU ? `http://${EMU}/v1/` : "https://firestore.googleapis.com/v1/";

async function appel(url, body) {
  const r = await fetch(API + url, { method: body ? "POST" : "GET", headers: H, body: body ? JSON.stringify(body) : undefined });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`${r.status} ${JSON.stringify(d).slice(0, 300)}`);
  return d;
}
// tous les documents d'une collection ; avec showMissing, aussi les documents supprimés qui gardent des sous-collections
async function liste(collection, missing = false) {
  const out = []; let page = "";
  for (;;) {
    const d = await appel(`${ROOT}/${collection}?pageSize=300${missing ? "&showMissing=true" : ""}${page ? "&pageToken=" + page : ""}`);
    out.push(...(d.documents || []));
    if (!d.nextPageToken) return out; page = d.nextPageToken;
  }
}
const ts = (doc, champ) => { const v = doc.fields && doc.fields[champ]; return v && v.timestampValue ? Date.parse(v.timestampValue) : 0; };
async function sousDocs(nom, sous) {
  const out = []; let page = "";
  for (;;) {
    const d = await appel(`${nom}/${sous}?pageSize=300${page ? "&pageToken=" + page : ""}`);
    out.push(...(d.documents || []).map(x => x.name));
    if (!d.nextPageToken) return out; page = d.nextPageToken;
  }
}
async function effacer(noms) {
  if (ESSAI || !noms.length) return;
  for (let i = 0; i < noms.length; i += 400)
    await appel(`${ROOT}:commit`, { writes: noms.slice(i, i + 400).map(name => ({ delete: name })) });
}

const bilan = { directs: 0, "joueurs rejoints": 0, invitations: 0 };
const vieux = Date.now() - JOUR, aEffacer = [];
// 1) directs inactifs depuis 24 h (ou déjà supprimés) et leurs joueurs de plus de 24 h
for (const d of await liste("direct", true)) {
  const existe = !!d.createTime, inactif = existe && ts(d, "updatedAt") < vieux;
  if (existe && !inactif) continue;
  const joueurs = await sousDocs(d.name, "joueurs");
  for (const j of joueurs) {
    if (inactif) { aEffacer.push(j); bilan["joueurs rejoints"]++; continue; }
    // direct déjà supprimé : on n'efface que les joueurs de plus de 24 h
    const doc = await appel(j);
    if (ts(doc, "at") < vieux) { aEffacer.push(j); bilan["joueurs rejoints"]++; }
  }
  if (inactif) { aEffacer.push(d.name); bilan.directs++; }
}
// 2) invitations de plus de 10 minutes
for (const d of await liste("invitations")) if (ts(d, "at") < Date.now() - INVITATION) { aEffacer.push(d.name); bilan.invitations++; }
await effacer(aEffacer);

console.log((ESSAI ? "Essai (rien effacé) : " : "Ménage fait : ") + Object.entries(bilan).map(([k, v]) => `${v} ${k}`).join(", "));
