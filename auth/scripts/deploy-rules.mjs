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
const base = `https://firebaserules.googleapis.com/v1/projects/${project}`;
const content = fs.readFileSync(new URL("../firestore.rules", import.meta.url), "utf8");
const rs = await fetch(base + "/rulesets", { method: "POST", headers: H, body: JSON.stringify({ source: { files: [{ name: "firestore.rules", content }] } }) });
const ruleset = await rs.json(); if (!rs.ok) { console.error("ruleset", JSON.stringify(ruleset)); process.exit(1); }
const relName = `projects/${project}/releases/cloud.firestore`;
const up = await fetch(`https://firebaserules.googleapis.com/v1/${relName}`, { method: "PATCH", headers: H, body: JSON.stringify({ release: { name: relName, rulesetName: ruleset.name } }) });
const rel = await up.json(); if (!up.ok) { console.error("release", JSON.stringify(rel)); process.exit(1); }
console.log("Règles Firestore publiées :", ruleset.name);
