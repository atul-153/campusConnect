# CampusConnect

CampusConnect is a full-stack college community portal built with React, Spring Boot, and Spring Data JPA. It uses MySQL for Docker deployments and includes an H2 profile for local development. It includes student registration/login, two-category elections, a ranked suggestion board, private complaints, campus events, and a faculty dashboard.

## Run Everything With Docker

Prerequisites: Docker Desktop with Docker Compose.

1. Copy `.env.example` to `.env` and change the local passwords/secrets.
2. From this folder, run `docker compose up --build`.
3. Open `http://localhost:3000`.

Compose starts MySQL, the Spring Boot API, and the React UI. The Admin account uses `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_NAME` from `.env`; the local example is Sumeet Rathod at `sumeet.rathod_it_2026@tsdcem.ac.in` with password `iamadmin`. On startup, the configured password is refreshed only if that email already belongs to an Admin; a Student account is never promoted. Student registration never accepts a role. These credentials are for local development only; replace them before any deployment.

To seed the three requested student accounts, set `SEED_STUDENT_PASSWORD` in `.env` to their shared password before starting the API. Student seed accounts are inserted only when missing, and their passwords are stored as BCrypt hashes. The requested Admin account uses the `ADMIN_EMAIL` and `ADMIN_NAME` values above; set its `ADMIN_PASSWORD` locally. Existing accounts are not overwritten.

Stop the app with `Ctrl+C`; run `docker compose down` to stop and remove containers. Database files remain in the `campusconnect_data` volume. `docker compose down -v` also deletes that database volume.

## Run Services Separately

### Local development without MySQL or Docker

The `local` Spring profile uses an H2 database stored in `backend/data/`, so you can run the complete app without installing or configuring MySQL. From the repository root, start the API:

```powershell
Set-Location backend
mvn spring-boot:run "-Dspring-boot.run.profiles=local"
```

In a second terminal, from the repository root, start the frontend:

```powershell
npm install
npm run dev
```

Open `http://localhost:5173`. Vite forwards `/api` requests to the API at `http://localhost:8080`. Student registration and login use the local database, which persists across API restarts. The local database is separate from the MySQL database used by Docker Compose. The local profile also creates the development Admin account `sumeet.rathod_it_2026@tsdcem.ac.in` with password `iamadmin`; override `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_NAME` before starting the API to change it. Do not use these development credentials in a deployment.

### MySQL development

Prerequisites: Java 17+, Maven 3.9+, Node.js 20+, npm, and MySQL 8. Create a MySQL database/user (or load `database/schema.sql` in MySQL Workbench), then set the backend environment variables shown below. The application uses `spring.jpa.hibernate.ddl-auto=update` for local development and can create/update tables on startup.

```powershell
$env:DB_URL = 'jdbc:mysql://localhost:3306/campusconnect?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC'
$env:DB_USERNAME = 'campusconnect'
$env:DB_PASSWORD = 'your-local-db-password'
$env:JWT_SECRET = 'use-a-long-random-secret-of-at-least-32-characters'
$env:ADMIN_EMAIL = 'sumeet.rathod_it_2026@tsdcem.ac.in'
$env:ADMIN_PASSWORD = 'iamadmin'
$env:ADMIN_NAME = 'Sumeet Rathod'
$env:SEED_STUDENT_PASSWORD = 'set-the-requested-student-password-locally'
Set-Location backend
mvn spring-boot:run
```

In a second terminal, from the repository root:

```powershell
npm install
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api` requests to `http://localhost:8080`. For a separately hosted frontend, set `VITE_API_URL` to the API origin and set backend `CORS_ALLOWED_ORIGIN` to the frontend origin.

## Database Schema

`database/schema.sql` documents all tables and relationships. The JPA entities are the runtime mapping; the schema file is provided for manual MySQL setup and inspection. Tables:

- `users`: unique email, BCrypt password hash, and `STUDENT`/`ADMIN` role.
- `elections`, `candidates`, `votes`: election categories and candidate relationships. Unique constraints prevent a student voting twice in one election or category.
- `suggestions`, `suggestion_reactions`: student proposals, status, and one up/down reaction per student per suggestion.
- `complaints`: private student submissions with an Admin-managed status.
- `campus_events`: date, location, category, and creator.

Do not use `ddl-auto=update` as a production migration strategy. Use versioned migrations and managed secrets before deployment.

## API Overview

Protected requests use `Authorization: Bearer <token>`. Successful responses are JSON; errors use `{ "message": "..." }`.

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | Public | Create a Student account using `firstname.lastname_branch_year@tsdcem.ac.in` |
| POST | `/api/auth/login` | Public | Sign in and receive a JWT |
| GET | `/api/dashboard` | Student/Admin | Role-aware dashboard statistics |
| GET | `/api/elections` | Student/Admin | Elections and eligible results |
| POST | `/api/elections/{id}/vote` | Student | Cast one vote per category |
| POST | `/api/admin/elections` | Admin | Create an election |
| PUT, DELETE | `/api/admin/elections/{id}` | Admin | Edit or remove an election |
| PATCH | `/api/admin/elections/{id}/status` | Admin | Open, close, or publish an election |
| POST | `/api/admin/elections/{id}/candidates` | Admin | Add an election candidate |
| PUT, DELETE | `/api/admin/candidates/{id}` | Admin | Edit or remove a candidate |
| GET, POST | `/api/suggestions` | Student/Admin, create Student only | List ranked ideas or submit one |
| PUT | `/api/suggestions/{id}/reaction` | Student | Like/dislike (one changeable reaction) |
| PATCH | `/api/admin/suggestions/{id}/status` | Admin | Moderate suggestion status |
| DELETE | `/api/admin/suggestions/{id}` | Admin | Remove a suggestion |
| POST | `/api/complaints` | Student | Submit a private complaint |
| GET | `/api/admin/complaints` | Admin | Read the private complaint inbox |
| PATCH | `/api/admin/complaints/{id}/status` | Admin | Update complaint status |
| DELETE | `/api/admin/complaints/{id}` | Admin | Remove a complaint |
| GET | `/api/events` | Student/Admin | Upcoming events for students; all events for Admins |
| POST | `/api/admin/events` | Admin | Add an event |
| PUT, DELETE | `/api/admin/events/{id}` | Admin | Edit or remove an event |

Election categories are `COLLEGE_BACHELOR_REP` and `CLASS_REP`; suggestion statuses are `UNDER_REVIEW`, `PLANNED`, `IN_PROGRESS`, and `COMPLETED`. An election needs at least two candidates before it can be opened, and published results are visible to students only after voting closes.

## Project Layout

```text
src/                         React SPA and responsive styles
backend/src/main/java/        Spring Boot REST API, security, JPA entities
backend/src/main/resources/   API/database configuration
database/schema.sql           MySQL tables and keys
docker-compose.yml             MySQL + API + frontend local stack
```