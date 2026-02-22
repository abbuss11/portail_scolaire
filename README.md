# Gestion Scolaire

Application de gestion scolaire separee en deux couches:

- `frontend/`: interface React + Vite + TypeScript
- `backend/`: API Django + admin Django

Le backend est `API-first` .

## Architecture

```
gestion_scolaire/
|- backend/
|  |- manage.py
|  |- requirements.txt
|  |- db.sqlite3
|  |- gestion_scolaire/
|  |  |- settings.py
|  |  |- urls.py
|  |  |- asgi.py
|  |  `- wsgi.py
|  `- web/
|     |- admin.py
|     |- api_urls.py
|     |- api_views.py
|     |- apps.py
|     |- models.py
|     |- signals.py
|     `- migrations/
|- frontend/
|  |- package.json
|  |- vite.config.ts
|  `- src/
|- requirements.txt
`- .gitignore

```
```

## Prerequis

- Python 3.13+
- Node.js 20+ (ou 22+)
- npm 10+

## Installation

### Backend

Depuis la racine du projet:

```powershell
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
python backend\manage.py migrate
python backend\manage.py runserver
```

Backend disponible sur `http://127.0.0.1:8000`.

### Frontend

Dans un second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Frontend disponible sur `http://127.0.0.1:5173`.

Le proxy Vite redirige automatiquement `/api` vers `http://127.0.0.1:8000`.

## Documentation

- Rapport detaille: `docs/RAPPORT_DEMARCHE_ARCHITECTURE.md`
- Architecture base de donnees (TXT): `docs/ARCHITECTURE_BASE_DONNEES.txt`

## Endpoints principaux

- `GET /api/auth/csrf/`
- `GET /api/auth/me/`
- `POST /api/auth/login/`
- `POST /api/auth/logout/`
- `GET /api/dashboard/`
- `GET|POST /api/students/`
- `GET /api/students/<id>/report/`
- `GET /api/subjects/`
- `GET|POST /api/grades/`
- `PATCH|DELETE /api/grades/<id>/`
- `GET|POST /api/absences/`
- `PATCH|DELETE /api/absences/<id>/`
- `GET /api/student/report/`
- `GET /api/public/report/?matricule=<MATRICULE>`

## Commandes de verification

```powershell
# Backend
python backend\manage.py check
python backend\manage.py makemigrations --check --dry-run

# Frontend
cd frontend
npm run typecheck
npm run lint
```
