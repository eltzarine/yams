import { generateKeyPair, exportPKCS8, exportJWK } from "jose";
import fs from "fs";
const sa = await generateKeyPair("RS256", { extractable: true });
const id = await generateKeyPair("RS256", { extractable: true });
const saJson = { type: "service_account", project_id: "yams-gaillon", private_key_id: "testkid123", private_key: await exportPKCS8(sa.privateKey), client_email: "test@yams-gaillon.iam.gserviceaccount.com" };
fs.writeFileSync("test/keys/sa.json", JSON.stringify(saJson));
fs.writeFileSync("test/keys/sa_pub.jwk", JSON.stringify(await exportJWK(sa.publicKey)));
const jwk = await exportJWK(id.publicKey); jwk.kid = "idk1"; jwk.alg = "RS256"; jwk.use = "sig";
fs.writeFileSync("test/keys/jwks.json", JSON.stringify({ keys: [jwk] }));
fs.writeFileSync("test/keys/id_priv.pem", await exportPKCS8(id.privateKey));
fs.writeFileSync(".dev.vars", [
  `FIREBASE_SERVICE_ACCOUNT='${JSON.stringify(saJson)}'`,
  `DEV_ECHO_CODE=1`, `ORIGINS=http://localhost:8765`, `RP_ID=localhost`,
  `ID_JWKS_URL=http://localhost:8799/jwks.json`, `ID_ISSUER=test-issuer`, `BREVO_API_KEY=x`,
].join("\n"));
console.log("ok");
