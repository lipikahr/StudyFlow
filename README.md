# StudyFlow

StudyFlow is a personal study and task management workspace for turning coursework, DSA practice, projects, placement preparation, and everyday goals into steady daily progress.

## What it includes

- Dashboard with total, active, completed, high-priority, and completion-rate stats
- Task creation, editing, deletion, and completion toggles
- Categories for DSA, Academics, Projects, Placement, and Personal
- Low, medium, and high priority levels
- Search, completion-status, category, and sort filters
- Upcoming-task and category-progress summaries
- Responsive desktop and mobile layouts
- PostgreSQL persistence through the Express API, so tasks survive refreshes

## Stack

- React + Vite + TypeScript
- Express 5
- PostgreSQL + Drizzle ORM
- OpenAPI-first API contract with generated React Query hooks
- Tailwind CSS and custom StudyFlow theme styling
- pnpm workspace monorepo

## Project structure

```text
artifacts/
  api-server/       Express API and task routes
  studyflow/        React + Vite frontend
lib/
  api-spec/         OpenAPI source of truth
  api-client-react/ Generated React Query client
  api-zod/          Generated Zod request/response schemas
  db/               Drizzle database schema and client
```

## Local development

This project uses pnpm workspaces.

```bash
pnpm install
pnpm run typecheck
```

Run the API server and frontend through the configured Replit workflows:

```bash
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/studyflow run dev
```

The API is served under `/api` and the frontend is served at the root preview path.

## Environment

The API server requires a PostgreSQL connection string:

```text
DATABASE_URL=...
```

The database schema can be applied with:

```bash
pnpm --filter @workspace/db run push
```

## API surface

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/tasks` | List tasks with filters |
| `POST` | `/api/tasks` | Create a task |
| `GET` | `/api/tasks/:id` | Fetch one task |
| `PATCH` | `/api/tasks/:id` | Update a task |
| `DELETE` | `/api/tasks/:id` | Delete a task |
| `PATCH` | `/api/tasks/:id/toggle` | Toggle completion |
| `GET` | `/api/dashboard/summary` | Fetch dashboard aggregates |

## Updating the API contract

The OpenAPI file is the source of truth. After changing `lib/api-spec/openapi.yaml`, regenerate the typed client and validation schemas:

```bash
pnpm --filter @workspace/api-spec run codegen
```

## Design direction

StudyFlow uses a warm, editorial “sunlit study desk” direction: deep ink navigation, parchment surfaces, saffron progress accents, teal area cues, and expressive display typography. The interface is intentionally personal and inviting rather than clinical or administrative.