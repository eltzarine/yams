import json,urllib.request,sys,datetime,subprocess,os
ICI=os.path.dirname(os.path.abspath(__file__));AUTH=os.path.join(os.path.dirname(ICI),"auth")
# Ménage nocturne (auth/scripts/menage.mjs) : ce qui doit être effacé ou gardé, sur l'émulateur Firestore
P="demo-menage";B=f"http://127.0.0.1:8085/v1/projects/{P}/databases/(default)/documents/"
def rq(m,path,body=None):
    r=urllib.request.Request(B+path,data=json.dumps(body).encode() if body is not None else None,method=m,headers={"authorization":"Bearer owner","content-type":"application/json"})
    try:return json.load(urllib.request.urlopen(r))
    except urllib.error.HTTPError as e:return {"_err":e.code}
ago=lambda h:(datetime.datetime.now(datetime.timezone.utc)-datetime.timedelta(hours=h)).strftime("%Y-%m-%dT%H:%M:%SZ")
T=lambda h:{"timestampValue":ago(h)}
def put(path,f):rq("PATCH",path,{"fields":f})
put("direct/OLD01",{"updatedAt":T(48)});put("direct/OLD01/joueurs/g1",{"at":T(48),"pseudo":{"stringValue":"a#guest"}})
put("direct/NEW01",{"updatedAt":T(1)});put("direct/NEW01/joueurs/g2",{"at":T(1)})
put("direct/GONE1/joueurs/g3",{"at":T(30)});put("direct/GONE1/joueurs/g4",{"at":T(2)})
put("invitations/u1",{"at":T(1)});put("invitations/u2",{"at":{"timestampValue":datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")}})
put("parties/gold",{"date":{"stringValue":"x"},"createdAt":T(100)});put("joueurs/uA",{"pseudo":{"stringValue":"César"}})
env=dict(os.environ,FIRESTORE_EMULATOR_HOST="127.0.0.1:8085",PROJECT_ID=P)
for essai in ("1","0"):
    env["MENAGE_ESSAI"]=essai
    print(subprocess.run(["node","scripts/menage.mjs"],env=env,capture_output=True,text=True,cwd=AUTH).stdout.strip() or "ERREUR")
ex=lambda p:"_err" not in rq("GET",p)
checks={"direct/OLD01":False,"direct/OLD01/joueurs/g1":False,"direct/NEW01":True,"direct/NEW01/joueurs/g2":True,"direct/GONE1/joueurs/g3":False,"direct/GONE1/joueurs/g4":True,"invitations/u1":False,"invitations/u2":True,"parties/gold":True,"joueurs/uA":True}
bad=[p for p,v in checks.items() if ex(p)!=v]
for p,v in checks.items():print(("✓ " if ex(p)==v else "✗ ")+p+(" gardé" if v else " effacé"))
print("Ménage :","OK" if not bad else "ÉCHECS "+str(bad))
sys.exit(1 if bad else 0)
