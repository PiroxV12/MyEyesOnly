# MyEyesOnly — installation Netlify + Render

## Important
Cette version est conçue pour un scénario GTA RP. Le champ de téléphone doit être un identifiant/téléphone RP fictif. Le site ne doit pas être utilisé pour collecter de vrais codes SMS/OTP.

## 1 — GitHub
Crée un dépôt GitHub, puis mets tout le contenu de ce projet dedans.

## 2 — Backend Render
Sur Render : New → Web Service → sélectionne le dépôt.
Build Command :
`npm install`
Start Command :
`npm start`

Ajoute les variables Environment :
`NODE_ENV=production`
`SESSION_SECRET=` une longue valeur aléatoire
`DISCORD_WEBHOOK_URL=` ton NOUVEAU webhook Discord
`RP_ACCESS_CODE=2468`

Après le déploiement, Render donne une URL comme :
`https://myeyesonly-api.onrender.com`

## 3 — Frontend Netlify
Dans Netlify : Add new site → Import from Git.
Sélectionne le dépôt.
Le fichier netlify.toml configure le dossier frontend.

Le frontend doit ensuite pointer vers le backend Render. Dans cette version, pour un déploiement séparé, remplace les appels `/api/...` dans `frontend/app.js` par `https://TON-BACKEND-RENDER.onrender.com/api/...`.

## 4 — Webhook Discord
Ne mets JAMAIS le webhook dans le frontend, GitHub ou Netlify.
Mets-le uniquement dans Render → Environment → DISCORD_WEBHOOK_URL.

Si tu as déjà publié le webhook dans un chat ou un dépôt, régénère-le dans Discord avant de l'utiliser.

## 5 — Fonctionnement
Joueur → identifiant/téléphone RP → demande Discord → toi tu envoies manuellement le code RP par SMS dans ton serveur → joueur saisit le code → accès.

Le code utilisé par le backend est `RP_ACCESS_CODE`.
Pour changer le code : Render → Environment → RP_ACCESS_CODE → Save/Deploy.

## Limitation volontaire
Le code est global pour cette version simple. Si tu veux des codes différents par joueur/session, il faut ajouter une petite base de données ou un stockage serveur pour associer chaque code à chaque session.
