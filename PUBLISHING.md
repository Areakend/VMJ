# Guide de publication — Play Store & App Store

> ⚠️ Ce document est une analyse technique préparée par un assistant IA, **pas un
> avis juridique**. Avant publication, faites valider les points « loi Évin » et
> « marque » par un avocat (une consultation courte suffit souvent — cliniques
> juridiques, avocats en ligne, ou l'ordre des avocats de votre barreau).

## 1. Marque Jägermeister — ce qui a été retiré et pourquoi

**Le risque.** « Jägermeister », le logo au cerf, et l'habillage orange-sur-vert
sont des marques déposées de Mast-Jägermeister SE (protégées en France par le
Code de la propriété intellectuelle — contrefaçon, art. L713-2 s. — et au niveau
UE par l'EUIPO). La mention « projet de fans indépendant » **ne protège pas** :
utiliser la marque dans le nom, l'icône ou le marketing d'une app reste de la
contrefaçon. En pratique, Apple (guideline 5.2.1) et Google (politique propriété
intellectuelle) rejettent ou dépublient ce genre d'app dès le review, souvent
sur simple plainte du titulaire.

**Ce qui a été fait dans ce commit :**
- Nom affiché partout : « Shot Tracker » (placeholder **neutre** — changez-le
  dans `src/config/branding.js` + `vite.config.js` + `capacitor.config.json` +
  `android/.../strings.xml` + `ios/.../Info.plist` + `index.html`).
- Icônes et splash screens remplacés (verre à shot neutre au lieu du cerf).
- Tous les textes UI et notifications : plus aucune référence à Jäger, au cerf,
  aux « 56 plantes », aux « Jäger-bombs ».
- Marqueur de carte : cerf → verre à shot.

**Ce qui reste à faire (nécessite vos accès) :**
- [ ] **Renommer l'applicationId** `com.vitemonjager.app` (« vite mon Jäger »
  reste une référence à la marque, et il est **visible** dans l'URL Play Store).
  À faire **avant** la première publication — après, il est immuable. Étapes :
  1. Choisir p. ex. `com.areakend.shottracker` ;
  2. Remplacer dans `android/app/build.gradle` (applicationId + namespace),
     `capacitor.config.json` (appId), `strings.xml` (package_name,
     custom_url_scheme), iOS bundle id dans Xcode ;
  3. Dans la console Firebase : ajouter une nouvelle app Android/iOS avec le
     nouvel id, télécharger le nouveau `google-services.json` (et
     `GoogleService-Info.plist` pour iOS) ;
  4. Regénérer le client OAuth Google Sign-In pour le nouveau package + SHA-1.
- [ ] Renommer le scheme de deep link `vitemonjager://` (défini dans
  `strings.xml` et utilisé dans `App.jsx`/`utils/share.js`).
- [ ] Le projet Firebase s'appelle `jager-tracking` : invisible pour les
  utilisateurs (seulement dans les URLs techniques), acceptable de le garder.
- [ ] Choisir le nom définitif + vérifier sa disponibilité (Play Store, App
  Store, et une recherche de marque INPI/EUIPO rapide).

## 2. Loi Évin — ce qui a été fait et pourquoi

**Le cadre.** La loi Évin (Code de la santé publique, art. L3323-2 s.) encadre
strictement la « propagande ou publicité » en faveur de l'alcool : supports
limités, contenu limité à des informations objectives, et message sanitaire
obligatoire. Une app de **suivi personnel** n'est pas en soi de la publicité,
mais des mécanismes qui **incitent à boire** (jeux, défis, messages
d'encouragement, classements à qui boit le plus) font basculer l'app du côté de
l'incitation — c'est aussi exactement ce que les stores sanctionnent (Apple
guideline **1.4.3** : pas d'encouragement à la consommation excessive d'alcool ;
Google Play : politique équivalente).

**Ce qui a été fait dans ce commit :**
- **Message sanitaire obligatoire** « L'abus d'alcool est dangereux pour la
  santé. À consommer avec modération. » affiché sur l'écran de connexion et dans
  le menu Profil (`src/components/HealthWarning.jsx`).
- **Age gate 18+** sur l'écran de connexion (obligatoire pour le rating stores
  et cohérent avec l'interdiction de vente aux mineurs).
- **Roulette** : « Take a Shot! » (injonction de boire = incitation) remplacé
  par un tirage au sort neutre qui n'ordonne rien.
- **Notifications** réécrites : elles décrivent un événement (« un ami a
  enregistré une boisson ») sans jamais inciter (« Water is for pasta », « One
  shot and you're back in the game », etc. supprimés).
- **Textes UI** adoucis (« Time to fix that? », « Be the first! » supprimés).
- **Ressources d'aide** : Alcool Info Service (0 980 980 930,
  alcool-info-service.fr) dans le menu Profil.
- **Politique de confidentialité** : `public/privacy.html` (servie sur
  `<votre-domaine>/privacy.html`).

**Recommandations supplémentaires (produit, à considérer) :**
- Positionner l'app comme un outil de **modération/awareness** (c'est déjà ce
  qu'elle fait : voir sa consommation objectivement). Le classement des
  événements par volume bu reste le point le plus discutable au regard du
  1.4.3 — envisagez un classement par « participation » plutôt que par volume,
  ou au minimum ne pas le mettre en avant dans les captures d'écran des stores.
- Une alerte douce quand le volume d'une soirée dépasse un seuil (l'app a déjà
  `getLastNightVolume`) renforcerait le positionnement « modération ».

## 3. Checklist Play Store

- [ ] Compte Google Play Console (25 $ une fois).
- [ ] **Signature release** : générer un keystore et ajouter les 4 secrets
  `ANDROID_*` au repo GitHub (voir DEPLOYMENT_NOTES.md §6) — le APK debug
  actuel n'est pas acceptable pour le store. Passer aussi à un **App Bundle**
  (`./gradlew bundleRelease`) exigé par Play.
- [ ] `versionCode`/`versionName` à jour dans `android/app/build.gradle`.
- [ ] Fiche store : questionnaire de classification **IARC → 18+** (références
  à l'alcool), déclaration « app liée à l'alcool ».
- [ ] **Data safety form** : déclarer la collecte de localisation précise,
  identifiants de compte, contenu utilisateur — finalité « fonctionnement de
  l'app », pas de partage, chiffrement en transit, suppression possible.
- [ ] URL de politique de confidentialité : `https://<domaine>/privacy.html`.
- [ ] **Suppression de compte** : Play exige un lien web de suppression — l'app
  a la suppression intégrée ; ajoutez une page/ancre expliquant la procédure
  (la politique de confidentialité §6 peut servir, avec l'URL directe).
- [ ] Captures d'écran sans référence de marque, sans mise en avant du
  classement « qui boit le plus ».
- [ ] Pays de distribution : attention, certains pays interdisent totalement
  les apps liées à l'alcool — la console vous guidera.

## 4. Checklist App Store

- [ ] Compte Apple Developer (99 €/an) + Mac avec Xcode pour builder
  (`npx cap sync ios`, puis archive/upload via Xcode ou fastlane).
- [ ] Le dossier `ios/` existe mais n'a **pas de lane CI** : build manuel au
  début, fastlane plus tard.
- [ ] Bundle id définitif (voir §1) + profil de provisioning + clé APNs pour
  les notifications push (console Firebase → Cloud Messaging → APNs).
- [ ] Guideline **1.4.3** : l'app ne doit pas encourager la consommation
  excessive — les changements du §2 vont dans ce sens ; gardez des captures
  d'écran sobres.
- [ ] Guideline **5.2.1** : aucune référence de marque (fait, §1).
- [ ] Age rating **17+/18+** (références à l'alcool) via le questionnaire.
- [ ] « Sign in with Google » seul est accepté… mais Apple exige souvent
  **Sign in with Apple** quand une connexion tierce est proposée (guideline
  4.8). Prévoir de l'ajouter (Firebase Auth le supporte directement).
- [ ] Privacy « nutrition labels » : localisation précise, identifiants,
  contenu utilisateur — mêmes réponses que le Data safety Google.
- [ ] Politique de confidentialité : même URL.

## 5. Avant soumission — technique

- [ ] Déployer les 4 étapes Firebase de DEPLOYMENT_NOTES.md (index, functions,
  backfill, rules) si ce n'est pas déjà fait.
- [ ] Activer **App Check** (VITE_RECAPTCHA_ENTERPRISE_SITE_KEY) et passer en
  mode « enforce » après vérification.
- [ ] Mettre une adresse e-mail de contact réelle dans `public/privacy.html`
  (TODO marqué dans le fichier) — les stores l'exigent aussi dans la fiche.
- [ ] Tester le parcours complet sur un appareil réel : connexion, age gate,
  log d'un shot, événement, notifications, suppression de compte.
- [ ] Vérifier que `assets/` régénère bien les icônes natives si vous les
  retouchez : `npx @capacitor/assets generate` (les mipmaps/splash ont déjà été
  remplacés dans ce commit).
