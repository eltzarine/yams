// Publie auth/firestore.rules via l'API Firebase Rules (compte de service du projet)
import { SignJWT, importPKCS8 } from "jose";
import fs from "fs";
const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "{}");
const project = sa.project_id;
if (!sa.private_key || !project) { console.error("FIREBASE_SERVICE_ACCOUNT manquant"); process.exit(1); }
const key = await importPKCS8(sa.private_key, "RS256");
const assertion = await new SignJWT({ scope: "https://www.googleapis.com/auth/firebase https://www.googleapis.com/auth/cloud-platform" })
  .setProtectedHeader({ alg: "RS256", kid: sa.private_key_id }).setIssuer(sa.client_email)
  .setAudience("https://oauth2.googleapis.com/token").setIssuedAt().setExpirationTime("10m").sign(key);
const tr = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }) });
const tok = await tr.json(); if (!tr.ok) { console.error("jeton", tok); process.exit(1); }
const H = { authorization: "Bearer " + tok.access_token, "content-type": "application/json" };
// 1) Connexion anonyme (identité invisible qui prouve qui a créé une partie de l'historique)
{
  const u = `https://identitytoolkit.googleapis.com/admin/v2/projects/${project}/config`;
  const g = await fetch(u, { headers: H }); const cfgAuth = await g.json().catch(() => ({}));
  if (!g.ok) console.log("::warning::Lecture de la config Auth impossible :", g.status, JSON.stringify(cfgAuth).slice(0, 300));
  else if (cfgAuth.signIn && cfgAuth.signIn.anonymous && cfgAuth.signIn.anonymous.enabled) console.log("Connexion anonyme : déjà activée");
  else {
    const p = await fetch(u + "?updateMask=signIn.anonymous.enabled", { method: "PATCH", headers: H, body: JSON.stringify({ signIn: { anonymous: { enabled: true } } }) });
    const r = await p.json().catch(() => ({}));
    if (p.ok) console.log("Connexion anonyme : activée");
    else console.log("::warning::Active la connexion anonyme dans la console Firebase (Authentication > Sign-in method > Anonyme). Erreur :", p.status, JSON.stringify(r).slice(0, 300));
  }
}
// 2) Effacement automatique (TTL) des documents temporaires, sur le champ expireAt
for (const group of ["direct", "joueurs", "invitations"]) {
  const u = `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/collectionGroups/${group}/fields/expireAt`;
  const g = await fetch(u, { headers: H }); const f = await g.json().catch(() => ({}));
  const st = f.ttlConfig && f.ttlConfig.state;
  if (st === "ACTIVE" || st === "CREATING") { console.log(`TTL ${group} : ${st}`); continue; }
  const p = await fetch(u + "?updateMask=ttlConfig", { method: "PATCH", headers: H, body: JSON.stringify({ ttlConfig: {} }) });
  const r = await p.json().catch(() => ({}));
  console.log(p.ok ? `TTL ${group} : demandé` : `::warning::TTL ${group} non activé : ${p.status} ${JSON.stringify(r).slice(0, 200)}`);
}
// 3) Règles Firestore
const base = `https://firebaserules.googleapis.com/v1/projects/${project}`;
const content = fs.readFileSync(new URL("../firestore.rules", import.meta.url), "utf8");
const rs = await fetch(base + "/rulesets", { method: "POST", headers: H, body: JSON.stringify({ source: { files: [{ name: "firestore.rules", content }] } }) });
const ruleset = await rs.json(); if (!rs.ok) { console.error("ruleset", JSON.stringify(ruleset)); process.exit(1); }
const relName = `projects/${project}/releases/cloud.firestore`;
const up = await fetch(`https://firebaserules.googleapis.com/v1/${relName}`, { method: "PATCH", headers: H, body: JSON.stringify({ release: { name: relName, rulesetName: ruleset.name } }) });
const rel = await up.json(); if (!up.ok) { console.error("release", JSON.stringify(rel)); process.exit(1); }
console.log("Règles Firestore publiées :", ruleset.name);
