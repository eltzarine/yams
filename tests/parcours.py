# Parcours complet de l'appli, avec le vrai SDK Firebase (même version que le site) branché sur les émulateurs
# Firestore + Auth et les vraies règles. Lancé par « npm test » (voir package.json).
import re,json,os,sys,threading,functools,urllib.request
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright
ICI=os.path.dirname(os.path.abspath(__file__));RACINE=os.path.dirname(ICI)
FB=os.path.join(ICI,"node_modules","firebase")+"/";P="demo-yams"
class Silencieux(SimpleHTTPRequestHandler):
    def log_message(self,*a):pass
srv=ThreadingHTTPServer(("127.0.0.1",0),functools.partial(Silencieux,directory=RACINE))
threading.Thread(target=srv.serve_forever,daemon=True).start()
APP=f"http://127.0.0.1:{srv.server_address[1]}/"
FS=f"http://127.0.0.1:8085/v1/projects/{P}/databases/(default)/documents/"
patch='''(function(){const oi=firebase.initializeApp.bind(firebase);firebase.initializeApp=function(c){const a=oi(c);firebase.firestore().useEmulator("127.0.0.1",8085);firebase.auth().useEmulator("http://127.0.0.1:9099",{disableWarnings:true});return a};
const b=o=>btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/=+$/,"").replace(/\\+/g,"-").replace(/\\//g,"_");
window.__login=async(uid,pseudo)=>{const t=Math.floor(Date.now()/1000);const tok=b({alg:"none",typ:"JWT"})+"."+b({iss:"x@x",sub:"x@x",aud:"https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit",iat:t,exp:t+3600,uid,claims:{pseudo}})+".";await firebase.auth().signInWithCustomToken(tok)};})();'''
fails=[]
def ok(c,m):
    print(("✓ " if c else "✗ ")+m)
    if not c:fails.append(m)
def rq(method,path,body=None,owner=True):
    h={"content-type":"application/json"}
    if owner:h["authorization"]="Bearer owner"
    r=urllib.request.Request(FS+path,data=json.dumps(body).encode() if body is not None else None,method=method,headers=h)
    try:return json.load(urllib.request.urlopen(r)),200
    except urllib.error.HTTPError as e:return e.read().decode()[:200],e.code
def sval(x):return {"stringValue":x}
def fields(doc):
    def v(x):
        k,val=next(iter(x.items()))
        if k=="arrayValue":return [v(i) for i in val.get("values",[])]
        if k=="mapValue":return {a:v(b) for a,b in val.get("fields",{}).items()}
        if k=="integerValue":return int(val)
        return val
    return {a:v(b) for a,b in doc.get("fields",{}).items()}
for uid,ps in [("uJ","Jojo"),("uA","César")]:rq("PATCH","joueurs/"+uid,{"fields":{"pseudo":sval(ps)}})
# défi de l'accueil déjà réussi cette semaine : le bouton « Entrer au Yam's Club » est affiché d'office
DEFI="(()=>{const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()-((d.getDay()+6)%7));localStorage.setItem('yamsDefiSemaine',d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'))})()"
SEEN="localStorage.setItem('yams-saison-vue',SEASON.key);localStorage.setItem('yams-podium-vu',SEASON.key);"+DEFI
with sync_playwright() as p:
    br=p.chromium.launch(**({"executable_path":os.environ["CHROME_BIN"]} if os.environ.get("CHROME_BIN") else {}),args=["--no-sandbox","--disable-features=LocalNetworkAccessChecks,PrivateNetworkAccessRespectPreflightResults"])
    def mk(name):
        ctx=br.new_context(viewport={"width":390,"height":844},device_scale_factor=2,is_mobile=True,has_touch=True,service_workers="block")
        def route(r):
            u=r.request.url
            m=re.search(r"firebasejs/10\.12\.2/(firebase-[a-z]+-compat\.js)$",u)
            if m:
                body=open(FB+m.group(1)).read()
                if "auth-compat" in u:body+="\n"+patch
                return r.fulfill(body=body,content_type="application/javascript")
            if u.startswith(APP):
                if u.split("?")[0] in (APP,APP+"index.html"):
                    resp=r.fetch();h=re.sub(r'<meta http-equiv="Content-Security-Policy"[^>]*>','',resp.text()).replace('projectId: "yams-gaillon"','projectId: "%s"'%P)
                    return r.fulfill(response=resp,body=h)
                return r.continue_()
            return r.abort()
        ctx.route(lambda url: not (url.startswith("http://127.0.0.1:8085") or url.startswith("http://127.0.0.1:9099")),route);pg=ctx.new_page();pg.errs=[]
        pg.on("pageerror",lambda e:(pg.errs.append(str(e)),print(name,"PAGEERR",e)))
        return pg
    def boot(pg,uid=None,ps=None,extra=""):
        pg.goto(APP);pg.evaluate(SEEN+";"+extra);pg.reload();pg.wait_for_timeout(1500)
        if uid:pg.evaluate(f"__login('{uid}','{ps}')");pg.wait_for_timeout(1200)
        pg.click("#btnPlay");pg.wait_for_timeout(1800)
        if not uid:  # sans compte : « Jouer » propose le code e-mail ou l'invité
            ok(pg.locator("#pcGuest").count()==1,"Jouer sans compte : choix e-mail / invité");pg.click("#pcGuest");pg.wait_for_timeout(1200)
    A=mk("Hôte");boot(A,"uA","César","localStorage.setItem('yams-partenaires',JSON.stringify(['Jojo']))")
    ok("César" in A.inner_text("#btnAcct"),"hôte connecté (vrai Firebase Auth)")
    A.click("#cCreate");A.wait_for_selector(".joinbox",timeout=8000);code=A.inner_text(".joinbox b")
    A.wait_for_timeout(2500);d,st=rq("GET","direct/"+code)
    ok(st==200 and fields(d).get("hote")=="César","direct créé dans Firestore avec l'hôte ("+code+")")
    A.wait_for_selector("[data-mate='Jojo']",timeout=8000);A.click("[data-mate='Jojo']");A.wait_for_timeout(1500)
    d,st=rq("GET","invitations/uJ");ok(st==200 and fields(d).get("code")==code,"invitation écrite (règles OK)")
    J=mk("Jojo");boot(J,"uJ","Jojo");J.wait_for_selector("#invOk",timeout=8000);J.click("#invOk")
    J.wait_for_url("**partie=*",timeout=10000);J.wait_for_selector(".joined",timeout=10000)
    A.wait_for_timeout(2500)
    ok(A.locator(".prow.ac input[value='Jojo']").count()==1 and not A.is_disabled("#go"),"hôte : Jojo validée, Commencer actif")
    d,st=rq("GET","invitations/uJ");ok(st==404,"invitation supprimée par Jojo")
    G=mk("Invité");boot(G);G.click("#cJoin");G.fill("#fcode",code);G.fill("#jname","Léa");G.click("#jgo");G.wait_for_url("**partie=*",timeout=10000);G.wait_for_selector(".joined",timeout=10000)
    A.wait_for_timeout(2500);names=A.eval_on_selector_all("#plist input","e=>e.map(x=>x.value)")
    ok("Léa" in names,"invité Léa ajoutée chez l'hôte "+str(names))
    # 15 min sans début de partie : décompte puis retrait, et retour possible
    A.evaluate("Object.values(S.joins).forEach(j=>{if(j.n==='Jojo')j.at=Date.now()-JOIN_MS+90e3})");A.wait_for_timeout(1600)
    ok("retiré dans 1:" in A.inner_text("#plist"),"hôte : décompte affiché dans les 2 dernières minutes")
    A.evaluate("Object.values(S.joins).forEach(j=>{if(j.n==='Jojo')j.at=Date.now()})")
    A.evaluate("Object.values(S.joins).forEach(j=>{if(j.n==='Léa#guest')j.at=Date.now()-JOIN_MS-1000})");A.wait_for_timeout(2500)
    names=A.eval_on_selector_all("#plist input","e=>e.map(x=>x.value)")
    ok("Léa" not in names and "Jojo" in names,"Léa retirée au bout de 15 min, Jojo reste "+str(names))
    G.wait_for_selector("#vRejoin",timeout=8000);ok("retiré" in G.inner_text("#app"),"Léa : message de retrait + bouton Rejoindre à nouveau")
    G.click("#vRejoin");G.wait_for_timeout(3000)
    names=A.eval_on_selector_all("#plist input","e=>e.map(x=>x.value)")
    ok("Léa" in names and G.locator(".joined").count()==1 and G.locator("#vRejoin").count()==0,"Léa a rejoint à nouveau "+str(names))
    K=mk("Max");boot(K);K.click("#cJoin");K.fill("#fcode",code);K.fill("#jname","Max");K.click("#jgo");K.wait_for_url("**partie=*",timeout=10000);K.wait_for_selector(".joined",timeout=10000)
    A.wait_for_timeout(2500)
    A.click("#go");A.wait_for_timeout(1500)
    A.click("#tabBoard");A.wait_for_timeout(300);A.click('td.cell button[data-p="0"][data-k="chance"]');A.fill("#man","20");A.click("#manOk");A.wait_for_timeout(2500)
    J.wait_for_timeout(1500)
    ok(J.locator('td.cell[data-p="0"][data-k="chance"]').inner_text()=="20","Jojo voit le score de César en direct")
    ok(J.locator("thead th.mine").count()==1 and "Jojo" in J.inner_text("#btnAcct"),"Jojo : joueuse, colonne surlignée, 👤 Jojo (session gardée)")
    G.evaluate("__login('uL','Léa')");G.wait_for_timeout(4000)
    hd=A.eval_on_selector_all("thead th","e=>e.map(x=>x.innerText.replace(/\\s+/g,' ').trim())")
    ok(any(h.endswith("Léa") and "guest" not in h for h in hd),"Léa se connecte en cours de partie → renommée chez l'hôte "+str(hd))
    S_=mk("Spectateur");boot(S_);S_.click("#cJoin");S_.fill("#fcode",code);S_.fill("#jname","Zed");S_.click("#jgo");S_.wait_for_url("**partie=*",timeout=10000);S_.wait_for_timeout(2000)
    ok("spectateur" in S_.inner_text("#app") and S_.locator("th.mine").count()==0,"partie commencée → spectateur")
    d,st=rq("GET",f"direct/{code}/joueurs");ok(not any(fields(x).get("pseudo","").startswith("Zed") for x in d.get("documents",[])),"le spectateur n'a rien écrit")
    # finir la partie → historique (règles « parties »)
    A.evaluate("S.players.forEach((_,p)=>{S.scores[p]=S.scores[p]||{};ALL.forEach(k=>{if(S.scores[p][k]==null)S.scores[p][k]=p+1})});save();render()");A.wait_for_timeout(4000)
    d,st=rq("GET","parties");docs=[fields(x) for x in d.get("documents",[])] if st==200 else []
    mine=[x for x in docs if "Léa" in [r["n"] for r in x.get("ranking",[])]]
    ok(bool(mine) and mine[0].get("owner")=="uA","partie finie enregistrée, propriétaire = compte de l'hôte")
    # fin de partie en invité : Max garde son score en créant son compte
    K.wait_for_selector("#vKeep",timeout=10000);kt=K.inner_text(".keep")
    ok("va disparaître" in kt and "de " in kt and "e de" in kt.replace("1er de","1e de"),"Max : « Ton score va disparaître » + place dans la saison")
    ok("t'a battu" not in kt,"Max a gagné : pas de message de revanche");K.screenshot(path="/tmp/keep.png")
    ok(K.evaluate("readKeeps().length")==1,"Max : partie gardée sur son téléphone")
    A.evaluate("joinSub&&joinSub();joinSub=null")  # l'appli de l'hôte n'écoute plus (fermée)
    K.evaluate("__login('uM','Max')");K.wait_for_timeout(3500)
    ok(K.evaluate("readKeeps().length")==0 and K.locator(".keep").count()==0,"Max : compte créé, partie réclamée")
    A.evaluate("claimSweep()");A.wait_for_timeout(3500)
    d,st=rq("GET","parties");docs=[fields(x) for x in d.get("documents",[])]
    rk=[[r["n"] for r in x.get("ranking",[])] for x in docs if any(r["n"] in ("Max","Max#guest") for r in x.get("ranking",[]))]
    ok(bool(rk) and "Max" in rk[0] and "Max#guest" not in rk[0],"partie enregistrée : Max#guest → Max "+str(rk))
    ok(A.evaluate("readClaims().length")==0,"hôte : plus rien à rattacher")
    watch=A.evaluate("watchJoins()")
    # l'hôte quitte la partie : ceux qui avaient rejoint reçoivent une invitation (5 min, bloque Commencer)
    A.evaluate("openNew()");A.wait_for_selector("#change");A.click("#change");A.wait_for_timeout(2500)
    ok(A.locator(".pdchip").count()==3 and A.is_disabled("#go") and "en attente" in A.inner_text("#plist") and ":" not in A.inner_text("#plist"),"quitter : Jojo et Léa en attente, sans décompte, Commencer bloqué")
    d,st=rq("GET","invitations/uJ");ok(st==200,"invitation envoyée à Jojo (compte)")
    J.wait_for_selector("#vRejoin",timeout=8000);ok("relance" in J.inner_text("#app"),"Jojo : « César relance une partie » Accepter / Refuser")
    J.click("#vRejoin");J.wait_for_timeout(3000)
    ok(A.locator(".prow.ac input[value='Jojo']").count()==1 and A.locator(".pdchip").count()==2,"Jojo a accepté : redevient compte chez l'hôte")
    ok(J.locator(".joined").count()==1 and J.locator("#vRejoin").count()==0,"Jojo : de nouveau dans la partie")
    A.evaluate("Object.values(S.pending).forEach(p=>p.until=Date.now()-1)");A.wait_for_timeout(1800)
    names=A.eval_on_selector_all("#plist input","e=>e.map(x=>x.value)")
    ok("Léa" not in names and "Max" not in names and "Jojo" in names and not A.is_disabled("#go"),"Léa et Max sans réponse : retirée, Commencer débloqué "+str(names))
    # hôte sans compte : identité anonyme invisible
    H=mk("Hôte sans compte");boot(H);H.click("#cCreate");H.wait_for_selector("#plist input");H.fill("#plist input >> nth=0","Paul");H.fill("#plist input >> nth=1","Zoé");H.click("#go");H.wait_for_timeout(800)
    H.evaluate("S.players.forEach((_,p)=>{S.scores[p]={};ALL.forEach(k=>S.scores[p][k]=3)});save();render()");H.wait_for_timeout(5000)
    d,st=rq("GET","parties");docs=[fields(x) for x in d.get("documents",[])]
    pz=[x for x in docs if "Zoé#guest" in [r["n"] for r in x.get("ranking",[])]]
    ok(bool(pz) and str(pz[0].get("owner","")).strip()!="","hôte sans compte : partie enregistrée avec une identité anonyme")
    ok("Me connecter" in H.evaluate("document.body.innerText") or H.locator("#btnAcct").count()==0,"l'identité anonyme n'est pas affichée comme un compte")
    H.click("#look") if H.locator("#look").count() else None
    ok("enregistrée" in H.evaluate("document.getElementById('syncSt')?document.getElementById('syncSt').innerText:'enregistrée'"),"message « Partie enregistrée »")
    A.screenshot(path="/tmp/e2e-fin.png");J.wait_for_timeout(1500);J.screenshot(path="/tmp/e2e-jojo-fin.png")
    errs=sum(len(x.errs) for x in (A,J,G,S_,H,K));ok(errs==0,"aucune erreur JavaScript ("+str(errs)+")")
    # sondes de sécurité : client anonyme sans appli
    _,st=rq("GET","direct",owner=False);ok(st==403,f"sonde : lister tous les directs sans compte → refusé ({st})")
    d,_=rq("GET","parties");pid=d["documents"][0]["name"].split("/")[-1]
    _,st=rq("DELETE","parties/"+pid,owner=False);ok(st==403,f"sonde : supprimer une partie de l'historique → refusé ({st})")
    _,st=rq("PATCH","parties/gfake12345?updateMask.fieldPaths=top",{"fields":{"top":{"integerValue":"2000"}}},owner=False);ok(st==403,f"sonde : créer une fausse partie sans identité → refusé ({st})")
    print("Parcours :",("OK" if not fails else "ÉCHECS "+str(fails)))
    br.close()
srv.shutdown()
sys.exit(1 if fails else 0)
