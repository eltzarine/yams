/* Yam's — mini-serveur de comptes (Cloudflare Worker + D1)
   - code à 6 chiffres par e-mail (Brevo), valable 15 minutes
   - Face ID / empreinte (passkeys)
   - ouvre la session Firebase du joueur (jeton personnalisé)
   Les e-mails, codes et clés restent ici, jamais dans Firestore (lisible publiquement). */
import { SignJWT, importPKCS8, jwtVerify, createRemoteJWKSet } from "jose";
import {
  generateRegistrationOptions, verifyRegistrationResponse,
  generateAuthenticationOptions, verifyAuthenticationResponse,
} from "@simplewebauthn/server";

const CODE_TTL = 15 * 60;          // secondes
const CODE_MAX_TRIES = 5;
const CODE_RESEND = 60;            // une demande par minute et par adresse
const CODE_PER_DAY = 8;            // par adresse
const IP_PER_DAY = 40;             // demandes de code par adresse IP
const CHALLENGE_TTL = 5 * 60;

const now = () => Math.floor(Date.now() / 1000);
const day = () => new Date().toISOString().slice(0, 10);

/* ---------- utilitaires ---------- */
class HttpError extends Error { constructor(status, code, extra) { super(code); this.status = status; this.code = code; this.extra = extra || {}; } }
const b64u = {
  enc(bytes) { let s = ""; for (const b of bytes) s += String.fromCharCode(b); return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); },
  dec(str) { const s = atob(str.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((str.length + 3) % 4)); return Uint8Array.from(s, c => c.charCodeAt(0)); },
};
function randomId(len = 20) {
  const abc = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const r = crypto.getRandomValues(new Uint8Array(len)); let s = "";
  for (const x of r) s += abc[x % abc.length]; return s;
}
function randomCode() {
  const r = crypto.getRandomValues(new Uint32Array(1))[0] % 1000000;
  return String(r).padStart(6, "0");
}
async function sha256(text) {
  const h = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return b64u.enc(new Uint8Array(h));
}
function sameString(a, b) { // comparaison à temps constant
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0;
}
export function normEmail(e) {
  e = String(e || "").trim().toLowerCase();
  return e.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) ? e : null;
}
export function normPseudo(p) {
  return String(p || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}
export function cleanPseudo(p) {
  p = String(p || "").replace(/\s+/g, " ").trim();
  if (p.length < 2) return { error: "court" };
  if (p.length > 16) return { error: "long" };
  if (!/^[\p{L}\p{N}][\p{L}\p{N} '._-]*$/u.test(p)) return { error: "caracteres" };
  return { pseudo: p };
}

/* ---------- configuration ---------- */
function cfg(env) {
  if (!env._cfg) {
    const sa = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT || "{}");
    env._cfg = {
      sa,
      origins: String(env.ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean),
      rpID: env.RP_ID,
      project: env.FIREBASE_PROJECT || sa.project_id,
      jwks: createRemoteJWKSet(new URL(env.ID_JWKS_URL || "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com")),
      pepper: sa.private_key_id || "",
    };
  }
  return env._cfg;
}

/* ---------- Firebase : jeton personnalisé et vérification de session ---------- */
let signKey = null;
async function customToken(env, uid, pseudo) {
  const c = cfg(env);
  if (!signKey) signKey = await importPKCS8(c.sa.private_key, "RS256");
  return new SignJWT({ uid, claims: pseudo ? { pseudo } : {} })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(c.sa.client_email).setSubject(c.sa.client_email)
    .setAudience("https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit")
    .setIssuedAt().setExpirationTime("1h").sign(signKey);
}
async function requireUser(env, req) {
  const c = cfg(env);
  const m = /^Bearer (.+)$/.exec(req.headers.get("authorization") || "");
  if (!m) throw new HttpError(401, "session");
  try {
    const { payload } = await jwtVerify(m[1], c.jwks, {
      issuer: env.ID_ISSUER || `https://securetoken.google.com/${c.project}`,
      audience: c.project,
    });
    const user = await env.DB.prepare("SELECT uid,email,pseudo FROM users WHERE uid=?").bind(payload.sub).first();
    if (!user) throw new HttpError(401, "compte");
    return user;
  } catch (e) {
    if (e instanceof HttpError) throw e;
    throw new HttpError(401, "session");
  }
}

/* ---------- e-mail (Brevo) ---------- */
async function sendCode(env, email, code) {
  if (env.DEV_ECHO_CODE === "1") return; // tests locaux : pas d'envoi réel
  const subject = `${code} est ton code Yam’s`;
  const text = `Ton code de connexion Yam’s : ${code}\n\nIl est valable 15 minutes. Si tu n’as rien demandé, ignore ce message.`;
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;max-width:420px;margin:0 auto;padding:24px;color:#1B2620">
<p style="font-size:16px;margin:0 0 12px">Ton code de connexion Yam’s :</p>
<p style="font-size:36px;font-weight:700;letter-spacing:8px;margin:0 0 16px;color:#1F4D3A">${code}</p>
<p style="font-size:14px;color:#55665C;margin:0">Il est valable 15 minutes. Si tu n’as rien demandé, ignore ce message.</p></div>`;
  const r = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": env.BREVO_API_KEY, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      sender: { name: env.MAIL_FROM_NAME || "Yams Club", email: env.MAIL_FROM },
      to: [{ email }], subject, textContent: text, htmlContent: html,
      tags: ["code-connexion"],
    }),
  });
  if (!r.ok) { console.log("brevo", r.status, await r.text().catch(() => "")); throw new HttpError(502, "envoi"); }
}

/* ---------- routes ---------- */
async function codeRequest(env, req, body) {
  const email = normEmail(body.email);
  if (!email) throw new HttpError(400, "email");
  const ip = req.headers.get("cf-connecting-ip") || "local", d = day(), t = now();
  // limite par adresse IP
  const ipKey = `ip:${ip}:${d}`;
  const rl = await env.DB.prepare("SELECT count FROM ratelimit WHERE key=?").bind(ipKey).first();
  if (rl && rl.count >= IP_PER_DAY) throw new HttpError(429, "trop");
  // limite par e-mail
  const row = await env.DB.prepare("SELECT sent_at,day,day_count FROM codes WHERE email=?").bind(email).first();
  if (row && t - row.sent_at < CODE_RESEND) throw new HttpError(429, "attends", { retry: CODE_RESEND - (t - row.sent_at) });
  const dayCount = row && row.day === d ? row.day_count : 0;
  if (dayCount >= CODE_PER_DAY) throw new HttpError(429, "trop");
  const code = randomCode();
  const hash = await sha256(`${email}|${code}|${cfg(env).pepper}`);
  await sendCode(env, email, code);
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO codes(email,hash,expires,attempts,sent_at,day,day_count) VALUES(?,?,?,0,?,?,?)
      ON CONFLICT(email) DO UPDATE SET hash=excluded.hash,expires=excluded.expires,attempts=0,sent_at=excluded.sent_at,day=excluded.day,day_count=excluded.day_count`)
      .bind(email, hash, t + CODE_TTL, t, d, dayCount + 1),
    env.DB.prepare(`INSERT INTO ratelimit(key,count,expires) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1`)
      .bind(ipKey, t + 86400),
  ]);
  const out = { ok: true, ttl: CODE_TTL, resend: CODE_RESEND };
  if (env.DEV_ECHO_CODE === "1") out.devCode = code;
  return out;
}

async function codeVerify(env, body) {
  const email = normEmail(body.email);
  const code = String(body.code || "").replace(/\D/g, "");
  if (!email || code.length !== 6) throw new HttpError(400, "code");
  const row = await env.DB.prepare("SELECT hash,expires,attempts FROM codes WHERE email=?").bind(email).first();
  if (!row || !row.hash || row.expires < now()) throw new HttpError(400, "expire");
  if (row.attempts >= CODE_MAX_TRIES) throw new HttpError(400, "bloque");
  const hash = await sha256(`${email}|${code}|${cfg(env).pepper}`);
  if (!sameString(hash, row.hash)) {
    const left = CODE_MAX_TRIES - row.attempts - 1;
    await env.DB.prepare(left <= 0 ? "UPDATE codes SET attempts=attempts+1,hash=NULL WHERE email=?" : "UPDATE codes SET attempts=attempts+1 WHERE email=?").bind(email).run();
    throw new HttpError(400, left <= 0 ? "bloque" : "faux", { left });
  }
  // code bon : on l'efface (usage unique) mais on garde le compteur du jour
  await env.DB.prepare("UPDATE codes SET hash=NULL,attempts=0 WHERE email=?").bind(email).run();
  let user = await env.DB.prepare("SELECT uid,pseudo FROM users WHERE email=?").bind(email).first();
  let isNew = false;
  if (!user) {
    user = { uid: "u" + randomId(23), pseudo: null }; isNew = true;
    await env.DB.prepare("INSERT INTO users(uid,email,created) VALUES(?,?,?)").bind(user.uid, email, now()).run();
  }
  return { ok: true, uid: user.uid, pseudo: user.pseudo, isNew, token: await customToken(env, user.uid, user.pseudo) };
}

async function pseudoCheck(env, url) {
  const c = cleanPseudo(url.searchParams.get("p"));
  if (c.error) return { ok: true, available: false, reason: c.error };
  const taken = await env.DB.prepare("SELECT uid FROM users WHERE pseudo_norm=?").bind(normPseudo(c.pseudo)).first();
  return { ok: true, available: !taken, reason: taken ? "pris" : null };
}

async function pseudoSet(env, req, body) {
  const user = await requireUser(env, req);
  const c = cleanPseudo(body.pseudo);
  if (c.error) throw new HttpError(400, "pseudo_" + c.error);
  const norm = normPseudo(c.pseudo);
  const taken = await env.DB.prepare("SELECT uid FROM users WHERE pseudo_norm=? AND uid<>?").bind(norm, user.uid).first();
  if (taken) throw new HttpError(409, "pseudo_pris");
  try {
    await env.DB.prepare("UPDATE users SET pseudo=?,pseudo_norm=? WHERE uid=?").bind(c.pseudo, norm, user.uid).run();
  } catch (e) { throw new HttpError(409, "pseudo_pris"); } // index unique : deux personnes au même instant
  return { ok: true, pseudo: c.pseudo, token: await customToken(env, user.uid, c.pseudo) };
}

async function me(env, req) {
  const user = await requireUser(env, req);
  const pk = await env.DB.prepare("SELECT COUNT(*) AS n FROM passkeys WHERE uid=?").bind(user.uid).first();
  return { ok: true, uid: user.uid, email: user.email, pseudo: user.pseudo, passkeys: pk ? pk.n : 0 };
}

/* --- Face ID / empreinte (passkeys) --- */
async function saveChallenge(env, id, challenge, uid) {
  await env.DB.prepare("INSERT OR REPLACE INTO challenges(id,challenge,uid,expires) VALUES(?,?,?,?)").bind(id, challenge, uid, now() + CHALLENGE_TTL).run();
}
async function takeChallenge(env, id) {
  const row = await env.DB.prepare("SELECT challenge,uid,expires FROM challenges WHERE id=?").bind(id).first();
  await env.DB.prepare("DELETE FROM challenges WHERE id=?").bind(id).run();
  if (!row || row.expires < now()) throw new HttpError(400, "delai");
  return row;
}
async function passkeyRegisterOptions(env, req) {
  const user = await requireUser(env, req), c = cfg(env);
  const existing = await env.DB.prepare("SELECT id,transports FROM passkeys WHERE uid=?").bind(user.uid).all();
  const options = await generateRegistrationOptions({
    rpName: "Yam’s", rpID: c.rpID,
    userName: user.pseudo || user.email, userDisplayName: user.pseudo || user.email,
    userID: new TextEncoder().encode(user.uid),
    attestationType: "none",
    excludeCredentials: (existing.results || []).map(p => ({ id: p.id, transports: p.transports ? JSON.parse(p.transports) : undefined })),
    authenticatorSelection: { residentKey: "required", userVerification: "preferred" },
  });
  await saveChallenge(env, "reg:" + user.uid, options.challenge, user.uid);
  return { ok: true, options };
}
async function passkeyRegisterVerify(env, req, body) {
  const user = await requireUser(env, req), c = cfg(env);
  const ch = await takeChallenge(env, "reg:" + user.uid);
  let v;
  try {
    v = await verifyRegistrationResponse({ response: body.response, expectedChallenge: ch.challenge, expectedOrigin: c.origins, expectedRPID: c.rpID, requireUserVerification: false });
  } catch (e) { console.log("reg", e.message); throw new HttpError(400, "passkey"); }
  if (!v.verified || !v.registrationInfo) throw new HttpError(400, "passkey");
  const cred = v.registrationInfo.credential;
  await env.DB.prepare("INSERT OR REPLACE INTO passkeys(id,uid,public_key,counter,transports,created) VALUES(?,?,?,?,?,?)")
    .bind(cred.id, user.uid, b64u.enc(cred.publicKey), cred.counter || 0, JSON.stringify(cred.transports || body.response?.response?.transports || []), now()).run();
  return { ok: true };
}
async function passkeyLoginOptions(env) {
  const c = cfg(env);
  const options = await generateAuthenticationOptions({ rpID: c.rpID, userVerification: "preferred", allowCredentials: [] });
  const cid = randomId(24);
  await saveChallenge(env, "auth:" + cid, options.challenge, null);
  return { ok: true, options, cid };
}
async function passkeyLoginVerify(env, body) {
  const c = cfg(env);
  if (!body.cid || !body.response || !body.response.id) throw new HttpError(400, "passkey");
  const ch = await takeChallenge(env, "auth:" + String(body.cid));
  const pk = await env.DB.prepare("SELECT id,uid,public_key,counter,transports FROM passkeys WHERE id=?").bind(String(body.response.id)).first();
  if (!pk) throw new HttpError(404, "passkey_inconnue");
  let v;
  try {
    v = await verifyAuthenticationResponse({
      response: body.response, expectedChallenge: ch.challenge, expectedOrigin: c.origins, expectedRPID: c.rpID, requireUserVerification: false,
      credential: { id: pk.id, publicKey: b64u.dec(pk.public_key), counter: pk.counter, transports: pk.transports ? JSON.parse(pk.transports) : undefined },
    });
  } catch (e) { console.log("auth", e.message); throw new HttpError(400, "passkey"); }
  if (!v.verified) throw new HttpError(400, "passkey");
  await env.DB.prepare("UPDATE passkeys SET counter=? WHERE id=?").bind(v.authenticationInfo.newCounter || 0, pk.id).run();
  const user = await env.DB.prepare("SELECT uid,pseudo FROM users WHERE uid=?").bind(pk.uid).first();
  if (!user) throw new HttpError(404, "passkey_inconnue");
  return { ok: true, uid: user.uid, pseudo: user.pseudo, token: await customToken(env, user.uid, user.pseudo) };
}

async function accountDelete(env, req) {
  const user = await requireUser(env, req);
  // jeton tout frais : permet à l'appli de supprimer aussi le compte Firebase (« connexion récente » exigée)
  const token = await customToken(env, user.uid, null);
  await env.DB.batch([
    env.DB.prepare("DELETE FROM passkeys WHERE uid=?").bind(user.uid),
    env.DB.prepare("DELETE FROM challenges WHERE uid=?").bind(user.uid),
    env.DB.prepare("DELETE FROM codes WHERE email=?").bind(user.email),
    env.DB.prepare("DELETE FROM users WHERE uid=?").bind(user.uid),
  ]);
  return { ok: true, token };
}

async function cleanup(env) {
  const t = now();
  await env.DB.batch([
    env.DB.prepare("DELETE FROM challenges WHERE expires<?").bind(t),
    env.DB.prepare("DELETE FROM ratelimit WHERE expires<?").bind(t),
    env.DB.prepare("DELETE FROM codes WHERE expires<? AND day<>?").bind(t, day()),
  ]);
}

/* ---------- entrée ---------- */
const ROUTES = {
  "POST /code/request": (env, req, body) => codeRequest(env, req, body),
  "POST /code/verify": (env, req, body) => codeVerify(env, body),
  "GET /pseudo/check": (env, req, body, url) => pseudoCheck(env, url),
  "POST /pseudo": (env, req, body) => pseudoSet(env, req, body),
  "GET /me": (env, req) => me(env, req),
  "POST /passkey/register/options": (env, req) => passkeyRegisterOptions(env, req),
  "POST /passkey/register/verify": (env, req, body) => passkeyRegisterVerify(env, req, body),
  "POST /passkey/login/options": (env) => passkeyLoginOptions(env),
  "POST /passkey/login/verify": (env, req, body) => passkeyLoginVerify(env, body),
  "POST /account/delete": (env, req) => accountDelete(env, req),
};

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    const origin = req.headers.get("origin") || "";
    const allowed = cfg(env).origins.includes(origin);
    const cors = allowed ? {
      "access-control-allow-origin": origin, "vary": "origin",
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-headers": "content-type,authorization",
      "access-control-max-age": "86400",
    } : {};
    const json = (status, data) => new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...cors } });
    if (req.method === "OPTIONS") return new Response(null, { status: allowed ? 204 : 403, headers: cors });
    if (url.pathname === "/" && req.method === "GET") return json(200, { ok: true, service: "yams-auth" });
    if (!allowed) return json(403, { ok: false, error: "origine" });
    const route = ROUTES[`${req.method} ${url.pathname}`];
    if (!route) return json(404, { ok: false, error: "introuvable" });
    try {
      let body = {};
      if (req.method === "POST") {
        const txt = await req.text();
        if (txt.length > 20000) throw new HttpError(413, "taille");
        body = txt ? JSON.parse(txt) : {};
      }
      const out = await route(env, req, body, url);
      if (Math.random() < 0.05) ctx.waitUntil(cleanup(env).catch(() => {}));
      return json(200, out);
    } catch (e) {
      if (e instanceof HttpError) return json(e.status, { ok: false, error: e.code, ...e.extra });
      if (e instanceof SyntaxError) return json(400, { ok: false, error: "requete" });
      console.log("erreur", e && e.stack || e);
      return json(500, { ok: false, error: "serveur" });
    }
  },
};
