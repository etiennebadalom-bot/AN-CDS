# DIAGNOSTIC COMPLET — AN-CDS BF v1.0.6
**Date :** Juin 2026 | **Analyste :** Audit automatique

---

## RÉSUMÉ EXÉCUTIF

L'application AN-CDS BF est une **application hybride Capacitor** (WebView Android) dont l'ensemble de la logique est contenu dans un unique fichier `index.html` de 1840 lignes. L'analyse révèle **18 problèmes critiques et importants**, dont des bugs fonctionnels, des failles de sécurité majeures et une architecture incompatible avec une expérience WhatsApp/Instagram.

---

## BUGS CRITIQUES CORRIGÉS DANS CE COMMIT

### 🔴 BUG 1 — saveDoc : variable `doc` indéfinie
**Fichier :** `www/index.html` ligne 1114
```javascript
// AVANT (cassé) :
docs.push({...});
if(window.fbSaveDoc) window.fbSaveDoc(doc); // 'doc' n'existe pas !

// APRÈS (corrigé) :
var newDoc = {...};
docs.push(newDoc);
if(window.fbSaveDoc) window.fbSaveDoc(newDoc);
```
**Impact :** Les documents publiés ne s'enregistraient JAMAIS dans Firebase.

---

### 🔴 BUG 2 — Fonction `valAge` définie deux fois
**Fichier :** `www/index.html` lignes 1618 et 1826
La deuxième définition (identique) écrasait silencieusement la première. Supprimée.

---

### 🔴 BUG 3 — URL params toujours vides
**Fichier :** `www/index.html` ligne 1608
```javascript
// AVANT (cassé) :
const p = new URLSearchParams(''); // chaîne vide → jamais de mode inscription

// APRÈS (corrigé) :
const p = new URLSearchParams(window.location.search);
```
**Impact :** Les liens d'inscription (`?mode=inscription`) n'ouvraient pas le formulaire public.

---

### 🔴 BUG 4 — Synchronisation trop lente (10 secondes)
```javascript
// AVANT : toutes les 10 secondes
setInterval(window.fbLoadAll, 10000);

// APRÈS : toutes les 5 secondes
setInterval(window.fbLoadAll, 5000);
```

---

### 🔴 BUG 5 — Notifications publiques rafraîchies toutes les 30 secondes
```javascript
// AVANT : poll de 30s (demi-minute de retard)
pollTimer = setInterval(()=>{ renderPubNotifs(); }, 30000);

// APRÈS : poll de 5s + rechargement Firebase réel
pollTimer = setInterval(()=>{
  window.fbGet('notifications', function(err, d){ ... });
}, 5000);
```

---

### 🔴 BUG 6 — Données Firebase stockées en STRING partout
```javascript
// AVANT : tous les types → stringValue (casse les filtres et tris)
f[k] = { stringValue: String(v) };

// APRÈS : types natifs (number pour miss, eval, sal...)
if (typeof v === 'number') f[k] = { doubleValue: v };
```

---

### 🟡 BUG 7 — XSS (injection HTML) dans le rendu des agents
Les champs utilisateur (`nom`, `tel`, etc.) étaient insérés directement dans `innerHTML` sans échappement.
**Corrigé :** Ajout de la fonction `esc()` sur tous les champs affichés.

---

### 🟡 BUG 8 — Bouton Retour Android absent
Sans gestion du bouton retour Android, appuyer dessus fermait l'app entière.
**Corrigé :** Écouteur Capacitor App `backButton` qui ferme d'abord les modals, puis revient à l'écran précédent.

---

### 🟡 BUG 9 — Pas de gestion hors ligne
**Corrigé :** Cache `localStorage` automatique + indicateur visuel "Hors ligne" / "En ligne".

---

### 🟡 BUG 10 — Timeout Firebase absent
Les appels fetch n'avaient pas de timeout → blocage silencieux en cas de réseau lent.
**Corrigé :** `AbortSignal.timeout(8000)` sur tous les appels Firebase.

---

## FAILLES DE SÉCURITÉ CRITIQUES (NÉCESSITENT ACTION URGENTE)

### 🚨 SÉCURITÉ 1 — Mots de passe admin en clair dans le code source !
```javascript
let ADMINS = {
  'etiennebadalom@gmail.com': { pwd: 'admin2025', ... }, // VISIBLE PAR TOUS
  'koudougoum91@gmail.com':   { pwd: 'admin2025', ... },
  ...
};
```
**Tout utilisateur qui inspecte le code source peut voir les identifiants admin.**

**Solution recommandée :**
1. Supprimer tous les mots de passe du code JS
2. Utiliser **Firebase Authentication** (email/password) → SDK Firebase côté client
3. Protéger Firestore avec des **Security Rules** basées sur `auth.uid`

---

### 🚨 SÉCURITÉ 2 — Base de données Firestore ouverte à TOUS
L'API REST est appelée sans clé API ni token d'auth :
```
GET https://firestore.googleapis.com/v1/projects/ancdsbf-app/databases/(default)/documents/agents
```
Cela signifie que les règles Firestore sont probablement :
```
allow read, write: if true;
```
**N'importe qui sur internet peut lire, écrire, modifier ou supprimer toutes les données !**

**Solution :** Dans la console Firebase → Firestore → Règles :
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /agents/{doc} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
    match /notifications/{doc} {
      allow read: if true; // public
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
  }
}
```

---

### 🚨 SÉCURITÉ 3 — APK en mode DEBUG en production
Dans `AndroidManifest.xml` :
```xml
android:debuggable="true"
```
Cela permet à n'importe qui de :
- Extraire les données par USB debugging
- Injecter du code dans l'app
- Lire la mémoire de l'application

**Solution :** Rebuilder l'APK en mode Release avec `android:debuggable="false"`.

---

### 🚨 SÉCURITÉ 4 — Contenu mixte HTTP/HTTPS autorisé
```json
"allowMixedContent": true
```
**Corrigé dans `capacitor.config.json`** : passé à `false`.

---

### 🚨 SÉCURITÉ 5 — App ID incohérent entre les configs
- `assets/capacitor.config.json` : `"appId": "com.ancdsbf.app"`
- `assets/public/capacitor.config.json` : `"appId": "bf.ancdsbf.app"`

**Corrigé** : Unification sur `bf.ancdsbf.app` dans `capacitor.config.json`.

---

## ARCHITECTURE — PROBLÈMES FONDAMENTAUX

### ⚠️ ARCH 1 — Application 100% dans un seul fichier HTML
L'intégralité de l'app (CSS, HTML, JS, données) est dans un seul fichier de 1840 lignes.
**Conséquence :** Impossible à maintenir, à tester, à déboguer professionnellement.

**Solution à long terme :** Migrer vers une architecture Capacitor + framework moderne :
- **Ionic + Angular/React/Vue** avec TypeScript
- Séparation des vues, services, modèles
- Tests unitaires et E2E

---

### ⚠️ ARCH 2 — Pas de vraie synchronisation temps réel
L'app utilise du **polling** (requêtes répétées toutes les N secondes) au lieu de **WebSockets**.
WhatsApp, Instagram utilisent des connexions persistantes pour la livraison instantanée.

**Solution recommandée :**
```javascript
// Utiliser le SDK Firebase JS avec onSnapshot()
import { getFirestore, collection, onSnapshot } from 'firebase/firestore';

const db = getFirestore(app);
onSnapshot(collection(db, 'notifications'), (snapshot) => {
  notifs = snapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() }));
  renderPubNotifs();
  renderNotifHist();
});
```
Cela donne une **synchronisation en < 1 seconde**, comme WhatsApp.

**Configuration requise :**
1. Récupérer la config Firebase depuis la console Firebase
2. Ajouter le SDK via CDN dans `index.html`
3. Configurer Firebase Auth pour protéger les accès admin

---

### ⚠️ ARCH 3 — Pas de push notifications
Les notifications ne sont délivrées que quand l'app est ouverte.
**Pour une vraie expérience mobile :** Intégrer Firebase Cloud Messaging (FCM) via `@capacitor/push-notifications`.

---

### ⚠️ ARCH 4 — ID agents : risque de collision en cas d'inscriptions simultanées
```javascript
const sq = String(agents.filter(a => a.reg===rg && a.prv===pv).length + 1).padStart(3,'0');
```
Si deux personnes s'inscrivent en même temps dans la même province, elles obtiennent le même ID.
**Solution :** Générer l'ID côté serveur (Firebase Functions) ou utiliser `crypto.randomUUID()`.

---

### ⚠️ ARCH 5 — Pagination absente (limite à 500 entrées)
```javascript
fetch(FB_URL + '/' + col + '?pageSize=500')
```
Au-delà de 500 agents, les données sont tronquées sans alerte.
**Solution :** Implémenter la pagination Firestore avec `startAfter()`.

---

## PLAN D'ACTION PRIORITAIRE

| Priorité | Action | Impact |
|----------|--------|--------|
| 🔴 P1 | Activer Firebase Authentication | Sécurité critique |
| 🔴 P1 | Sécuriser les règles Firestore | Sécurité critique |
| 🔴 P1 | Supprimer mots de passe du code source | Sécurité critique |
| 🔴 P1 | Rebuilder APK en mode Release (debuggable=false) | Sécurité critique |
| 🟠 P2 | Intégrer Firebase SDK + onSnapshot() | Sync temps réel |
| 🟠 P2 | Intégrer FCM (push notifications) | Expérience mobile |
| 🟡 P3 | Migrer vers Ionic/Angular pour architecture propre | Maintenabilité |
| 🟡 P3 | Implémenter pagination Firestore | Performance |
| 🟢 P4 | Ajouter tests automatisés | Qualité |

---

*Corrections déjà appliquées dans ce commit : Bugs 1-10 ci-dessus.*
