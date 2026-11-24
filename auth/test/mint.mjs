// serveur de test : transforme un jeton personnalisé en jeton d'identité (comme Firebase)
import { SignJWT, importPKCS8, jwtVerify, importJWK } from "jose";
import http from "http"; import fs from "fs";
const sa = JSON.parse(fs.readFileSync("test/keys/sa.json"));
const saPub = await importJWK(JSON.parse(fs.readFileSync("test/keys/sa_pub.jwk")), "RS256");
const idKey = await importPKCS8(fs.readFileSync("test/keys/id_priv.pem", "utf8"), "RS256");
http.createServer(async (req, res) => {
  res.setHeader("access-control-allow-origin", "*"); res.setHeader("access-control-allow-headers", "content-type");
  if (req.method === "OPTIONS") return res.end();
  let b = ""; for await (const c of req) b += c;
  try {
    const { payload } = await jwtVerify(b, saPub, { issuer: sa.client_email });
    const t = await new SignJWT({ ...(payload.claims || {}) }).setProtectedHeader({ alg: "RS256", kid: "idk1" }).setIssuer("test-issuer").setAudience("yams-gaillon").setSubject(payload.uid).setIssuedAt().setExpirationTime("1h").sign(idKey);
    res.end(JSON.stringify({ idToken: t, uid: payload.uid, claims: payload.claims || {} }));
  } catch (e) { res.statusCode = 400; res.end(JSON.stringify({ error: e.message })) }
}).listen(8798, () => console.log("mint ok"));
