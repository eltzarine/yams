// Tests du mini-serveur en local (wrangler dev) : codes, pseudo, suppression
import { SignJWT, importPKCS8, jwtVerify, importJWK, decodeJwt } from "jose";
import fs from "fs";
const B = "http://127.0.0.1:8787", O = "http://localhost:8765";
const sa = JSON.parse(fs.readFileSync("test/keys/sa.json"));
const saPub = await importJWK(JSON.parse(fs.readFileSync("test/keys/sa_pub.jwk")), "RS256");
const idKey = await importPKCS8(fs.readFileSync("test/keys/id_priv.pem", "utf8"), "RS256");
let fails = 0; const ok = (c, m) => { console.log((c ? "✓ " : "✗ ") + m); if (!c) fails++; };
const call = async (method, path, body, token, origin = O) => {
  const r = await fetch(B + path, { method, headers: { origin, "content-type": "application/json", ...(token ? { authorization: "Bearer " + token } : {}), "cf-connecting-ip": "1.2.3." + (Math.random() * 200 | 0) }, body: body ? JSON.stringify(body) : undefined });
  return { status: r.status, ...(await r.json()), cors: r.headers.get("access-control-allow-origin") };
};
// simule Firebase : jeton personnalisé -> jeton d'identité
async function idTokenFrom(custom) {
  const { payload } = await jwtVerify(custom, saPub, { issuer: sa.client_email, audience: "https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit" });
  return new SignJWT({ ...(payload.claims || {}) }).setProtectedHeader({ alg: "RS256", kid: "idk1" }).setIssuer("test-issuer").setAudience("yams-gaillon").setSubject(payload.uid).setIssuedAt().setExpirationTime("1h").sign(idKey);
}
const email = `test${Date.now()}@exemple.fr`;
let r = await call("POST", "/code/request", { email }, null, "https://pirate.example");
ok(r.status === 403 && !r.cors, "origine inconnue refusée");
r = await call("POST", "/code/request", { email: "pasunmail" }); ok(r.status === 400 && r.error === "email", "e-mail invalide refusé");
r = await call("POST", "/code/request", { email: email.toUpperCase() }); ok(r.ok && /^\d{6}$/.test(r.devCode) && r.cors === O, "code envoyé (6 chiffres) + CORS");
const code = r.devCode;
r = await call("POST", "/code/request", { email }); ok(r.status === 429 && r.error === "attends" && r.retry > 0, "renvoi bloqué pendant 1 minute");
const wrong = code === "000000" ? "111111" : "000000";
r = await call("POST", "/code/verify", { email, code: wrong }); ok(r.status === 400 && r.error === "faux" && r.left === 4, "mauvais code : 4 essais restants");
const v = await call("POST", "/code/verify", { email, code }); ok(v.ok && v.isNew && v.uid && v.pseudo === null && v.token, "bon code : compte créé");
const uid = v.uid, t1 = decodeJwt(v.token); ok(t1.uid === uid && t1.iss === sa.client_email, "jeton Firebase personnalisé correct");
r = await call("POST", "/code/verify", { email, code }); ok(r.status === 400 && r.error === "expire", "code à usage unique");
let idt = await idTokenFrom(v.token);
r = await call("GET", "/me", null, idt); ok(r.ok && r.uid === uid && r.email === email && r.passkeys === 0, "/me avec session");
r = await call("GET", "/me", null, "faux.jeton.x"); ok(r.status === 401, "/me refusé sans session valide");
r = await call("GET", "/pseudo/check?p=A"); ok(r.available === false && r.reason === "court", "pseudo trop court");
r = await call("GET", "/pseudo/check?p=<script>"); ok(r.available === false && r.reason === "caracteres", "pseudo avec caractères interdits");
const nick = "Zoé" + (Date.now() % 100000);
r = await call("GET", "/pseudo/check?p=" + encodeURIComponent(nick)); ok(r.available === true, "pseudo libre");
r = await call("POST", "/pseudo", { pseudo: nick }); ok(r.status === 401, "pseudo refusé sans session");
r = await call("POST", "/pseudo", { pseudo: "  " + nick + "  " }, idt); ok(r.ok && r.pseudo === nick && decodeJwt(r.token).claims.pseudo === nick, "pseudo enregistré + jeton avec pseudo");
idt = await idTokenFrom(r.token);
r = await call("GET", "/pseudo/check?p=" + encodeURIComponent(nick.replace("é", "E").toUpperCase())); ok(r.available === false && r.reason === "pris", "unicité sans majuscules ni accents");
// deuxième compte qui tente le même pseudo
const email2 = "b" + email;
const c2 = (await call("POST", "/code/request", { email: email2 })).devCode;
const v2 = await call("POST", "/code/verify", { email: email2, code: c2 });
const idt2 = await idTokenFrom(v2.token);
r = await call("POST", "/pseudo", { pseudo: nick.toLowerCase().replace("é", "e") }, idt2); ok(r.status === 409 && r.error === "pseudo_pris", "pseudo déjà pris refusé");
// reconnexion par code : même compte, pseudo retrouvé
await new Promise(res => setTimeout(res, 61000));
const c3 = (await call("POST", "/code/request", { email })).devCode;
const v3 = await call("POST", "/code/verify", { email, code: c3 }); ok(v3.ok && !v3.isNew && v3.uid === uid && v3.pseudo === nick, "reconnexion : même compte et pseudo");
// 5 mauvais essais -> code bloqué
await new Promise(res => setTimeout(res, 61000));
const c4 = (await call("POST", "/code/request", { email: email2 })).devCode;
const w4 = c4 === "000000" ? "111111" : "000000";
for (let i = 0; i < 4; i++) await call("POST", "/code/verify", { email: email2, code: w4 });
r = await call("POST", "/code/verify", { email: email2, code: w4 }); ok(r.status === 400 && r.error === "bloque", "5e mauvais essai : code bloqué");
r = await call("POST", "/code/verify", { email: email2, code: c4 }); ok(r.status === 400, "même le bon code ne passe plus après blocage");
// suppression
r = await call("POST", "/account/delete", {}, idt); ok(r.ok && decodeJwt(r.token).uid === uid, "compte supprimé (jeton frais renvoyé)");
r = await call("GET", "/me", null, idt); ok(r.status === 401 && r.error === "compte", "session du compte supprimé refusée");
r = await call("GET", "/pseudo/check?p=" + encodeURIComponent(nick)); ok(r.available === true, "pseudo libéré après suppression");
r = await call("POST", "/passkey/login/options"); ok(r.ok && r.cid && r.options.challenge && r.options.rpId === "localhost", "options Face ID (connexion)");
console.log(fails ? `\n${fails} ÉCHEC(S)` : "\nTout est bon");
process.exit(fails ? 1 : 0);
