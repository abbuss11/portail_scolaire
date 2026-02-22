# Rapport Detaille - Demarche et Architecture de la Solution

## 1. Contexte et objectif

Le projet vise a fournir un portail scolaire avec:

- un backend Django expose en API REST et administration Django;
- un frontend React (Vite + TypeScript) consommatrice de cette API.

Objectif principal de la demarche:

- clarifier la separation frontend/backend;
- supprimer les doublons fonctionnels;
- conserver une base technique maintenable;
- documenter clairement le systeme pour la reprise de projet.

## 2. Demarche suivie

### 2.1 Audit technique initial

Un audit de la base de code a ete realise pour identifier:

- la structure reelle des dossiers et des dependances;
- les couches techniques en doublon (templates Django + SPA React);
- les fichiers parasites (runtime local melange au code, anciens artefacts);
- les points de couplage entre frontend et backend.

Constat principal:

- le frontend React etait deja branche sur des endpoints API;
- les pages Django server-side etaient redondantes avec la SPA;
- la lisibilite globale etait penalisee par des elements runtime dans l'arborescence.

### 2.2 Choix d'architecture cible

Architecture cible retenue:

- `backend/` pour le projet Django (API + admin + modeles + migrations);
- `frontend/` pour le client React;
- documentation centralisee a la racine.

Ce choix permet:

- un demarrage plus simple pour un nouveau developpeur;
- une frontiere claire entre presentation et metier;
- une evolution independante des deux couches.

### 2.3 Refactor backend

Actions appliquees:

- conservation du routage `admin/` + `api/`;
- suppression des vues/templates HTML Django devenues inutiles;
- maintien des endpoints metier existants;
- nettoyage des modeles et alignement de la representation des roles;
- conservation des migrations et ajout d'une migration de coherence.

Resultat:

- backend API-first coherent avec l'usage du frontend;
- surface de code reduite;
- moins de risque de divergence fonctionnelle.

### 2.4 Refactor frontend

Actions appliquees:

- conservation de la structure par composants et du client API centralise;
- suppression d'une dependance non utilisee (`@supabase/supabase-js`);
- maintien des scripts de qualite (`typecheck`, `lint`);
- conservation du proxy Vite vers `http://127.0.0.1:8000`.

Resultat:

- frontend plus leger;
- flux de developpement stable;
- interop API conservee.

### 2.5 Documentation et hygiene

Actions appliquees:

- mise a jour du `README.md`;
- ajout d'un `requirements.txt` racine;
- ajout d'une documentation detaillee (ce rapport);
- ajout d'un document dedie a l'architecture de base de donnees:
  `docs/ARCHITECTURE_BASE_DONNEES.txt`.

## 3. Architecture globale de la solution

## 3.1 Vue d'ensemble

```text
Utilisateur
   |
   v
Frontend React (frontend/) ---- HTTP/JSON ----> Backend Django API (backend/)
                                                 |
                                                 v
                                           SQLite (backend/db.sqlite3)
```

## 3.2 Couche backend (Django)

Principaux blocs:

- `backend/gestion_scolaire/urls.py`
  - entree unique vers `admin/` et `api/`.
- `backend/web/api_urls.py`
  - definition des endpoints REST.
- `backend/web/api_views.py`
  - authentification, CRUD metier, dashboard, rapports.
- `backend/web/models.py`
  - modeles de donnees (Profile, Student, Subject, Grade, Attendance).
- `backend/web/signals.py`
  - creation automatique d'un `Profile` a la creation d'un `User`.

Points techniques notables:

- authentification par session Django (cookie) + protection CSRF;
- filtrage des droits par role (`admin`, `teacher`, `student`);
- `transaction.atomic()` pour la creation d'etudiant + compte utilisateur;
- requetes optimisees avec `select_related` sur les listes et rapports.

## 3.3 Couche frontend (React)

Principaux blocs:

- `frontend/src/api.ts`
  - client HTTP centralise, gestion cookie CSRF, erreurs API.
- `frontend/src/App.tsx`
  - orchestration des ecrans, chargement initial, gestion de session.
- `frontend/src/components/*`
  - ecrans metier (dashboard, notes, absences, etudiants, releve).
- `frontend/src/types/index.ts`
  - contrats TypeScript alignes avec la reponse JSON backend.

Points techniques notables:

- chargement en parallele des donnees principales (`Promise.all`);
- UX differenciee selon le role utilisateur;
- structure front orientee composants reutilisables.

## 3.4 Couplage frontend/backend

Strategie retenue:

- toutes les actions metier passent par les endpoints `/api/*`;
- le frontend ne depend pas des templates Django;
- le proxy Vite simplifie le dev local:
  - appels `/api` rediriges vers `http://127.0.0.1:8000`.

## 4. Architecture de la base de donnees

Le detail complet est fourni dans:

- `docs/ARCHITECTURE_BASE_DONNEES.txt`

Ce document contient:

- schema logique des tables;
- cardinalites et cles etrangeres;
- contraintes de donnees;
- recommandations d'evolution (index et scalabilite).

## 5. Qualite et validation

Verifications executees:

- frontend `npm run typecheck`: OK
- frontend `npm run lint`: OK

Verification backend:

- a executer apres installation des dependances Python:
  - `pip install -r requirements.txt`
  - `python backend/manage.py check`
  - `python backend/manage.py makemigrations --check --dry-run`

## 6. Forces de la solution

- architecture simple a comprendre;
- separation claire des responsabilites;
- endpoints metier couvrant les besoins principaux;
- code frontend/backend suffisamment decouple pour evolutions futures;
- base de donnees relationnelle coherente avec les cas d'usage scolaires.

## 7. Limites actuelles et evolutions recommandees

Limites actuelles:

- auth basee session (adaptee intranet), pas de JWT;
- pas de pagination API sur les listes volumineuses;
- SQLite adapte au demarrage, limitee pour forte charge concurrente.

Evolutions recommandees:

- pagination + filtres serveur sur notes/absences/etudiants;
- index additionnels sur requetes frequentes;
- migration PostgreSQL pour production;
- tests automatiques backend/frontend plus complets (unitaire + integration).

## 8. Conclusion

La solution est maintenant organisee de facon claire, orientee API,
avec une separation nette frontend/backend et une documentation de reprise.
Le socle est propre pour poursuivre le developpement fonctionnel et la
mise en production progressive.
