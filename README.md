# WHAT WORKS? — 31 / 31

MVP du challenge d’octobre 2026. Direction artistique « encre bleue » : une seule encre outremer sur papier blanc, un surligneur fluo pour ce qui compte, du rouge pour les échecs. Archivo étendu pour les titres, Newsreader pour la lecture, un vrai calendrier d’octobre, des bâtons de comptage et des tampons de statut.

## Démarrage

Node.js 24+ est requis (SQLite natif).

```sh
npm install
npm run dev
```

Interface : http://localhost:5173 ; API : http://localhost:3001.

`/?demo=1` permet d’explorer des exemples fictifs. Ils ne sont jamais insérés dans la base réelle. Sans ce paramètre, le registre démarre vide et le jour est calculé depuis le 1er octobre 2026.

Pour configurer l’admin, définir `ADMIN_PASSWORD` (12 caractères minimum) avant le démarrage. Exemple interactif dans zsh, sans enregistrer le secret dans l’historique :

```sh
read -s 'ADMIN_PASSWORD?Mot de passe admin : '
export ADMIN_PASSWORD
npm run dev
```

L’espace privé est accessible sur `/admin` et `/admin/saas`. Le mot de passe est haché avec scrypt ; les cookies de session sont HttpOnly et SameSite=Strict. Les sessions expirent après 24 h et sont invalidées au redémarrage. Sans mot de passe configuré, aucune route d’administration n’est ouverte.

## Architecture

- `src/App.jsx` : registre, rapports, journal, classement, contrôle privé et formulaires.
- `src/style.css` : identité graphique, responsive et thème sombre.
- `src/i18n.js` : textes de l’interface en français (par défaut) et en anglais, sélecteur FR / EN dans l’en-tête.
- `src/demo.js` : spécimens de démonstration bilingues, isolés de SQLite.
- `server/index.mjs` : API HTTP, authentification, validation, persistance.
- `server/metrics.mjs` : calculs financiers.
- `server/share.mjs` : image Open Graph PNG générée depuis les données du projet.
- `data/challenge.sqlite` : base locale, non versionnée.
- `data/uploads/` : captures et logos importés, non versionnés.

Tables : `users`, `saas`, `revenue_transactions`, `expenses`, `analytics_snapshots`, `build_logs`. Toutes les données liées à un projet sont supprimées avec lui. Un jour et un slug ne peuvent appartenir qu’à une expérience.

## Parcours disponible

1. Créer une expérience et documenter hypothèse, build, résultat, décision, stack et modèle économique.
2. Importer un logo et une capture (PNG, JPEG, WebP ; 5 Mo maximum, conversion WebP).
3. Ajouter revenus et dépenses individuels. Les montants sont stockés en centimes.
4. Ajouter un relevé quotidien : visiteurs, inscriptions, actifs, clients et MRR actif. Le relevé le plus récent alimente les totaux ; un ajout pour la même date remplace le relevé du jour.
5. Ajouter les entrées du build log.
6. Consulter rapports, courbes 7/30 jours/tout, classement et comparaison privée triable.

Profit = revenus − dépenses ; profit/heure = profit ÷ temps de build. La conversion présentée correspond aux clients ÷ visiteurs. Le MRR est saisi comme valeur active du jour, jamais calculé en additionnant les anciens abonnements. Les visiteurs et utilisateurs globaux sont les sommes par produit, pas des personnes dédupliquées entre produits.

Les coûts et profits ne sont pas exposés par l’API publique. Les autres métriques, transactions de revenus et journaux sont publics. Ne pas saisir de données confidentielles dans leurs descriptions.

## Production

```sh
npm run build
NODE_ENV=production PUBLIC_URL=https://votre-domaine.fr npm start
```

L’API sert alors le site compilé sur le port 3001 (`PORT` configurable). Utiliser HTTPS via un reverse proxy ; le cookie est Secure en production. `ADMIN_PASSWORD` doit être présent lors du premier démarrage, et permet une rotation aux démarrages suivants. `DATABASE_PATH` permet de choisir le fichier SQLite.

L’hébergement doit fournir un disque persistant. Sauvegarder la base et `data/uploads/`. Les balises Open Graph propres à chaque expérience sont injectées par le serveur de production ; le serveur Vite de développement sert seulement le HTML générique. Les images de partage sont accessibles sur `/api/og/[slug]`.

## Vérification et limites

```sh
npm test
npm run build
```

Tests sur base temporaire : authentification, CRUD, confidentialité des coûts, calculs, validation des montants, suppression en cascade. Rendu vérifié dans le navigateur sur desktop et mobile.

La saisie analytics et financière est manuelle dans ce MVP : aucune intégration Stripe ou collecte automatique de visites. Les données sont actualisées au chargement et après chaque enregistrement. Pas de synchronisation temps réel entre onglets. Les polices sont chargées via Google Fonts avec des polices système de secours. Le site n’est pas déployé.
