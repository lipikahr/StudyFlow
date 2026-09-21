# StudyFlow

StudyFlow is a personal study and task management app for organizing goals, priorities, and progress across five life areas.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for task CRUD, completion toggles, filters, and dashboard summary endpoints
- `lib/db/src/schema/tasks.ts` — PostgreSQL task table and insert schema
- `artifacts/api-server/src/routes/tasks.ts` — Express route handlers and dashboard aggregation
- `artifacts/studyflow/src/pages/dashboard.tsx` — responsive dashboard workspace
- `artifacts/studyflow/src/components/task-dialog.tsx` — add/edit task form
- `artifacts/studyflow/src/index.css` — StudyFlow theme tokens and visual system

## Architecture decisions

- Tasks are persisted in the shared PostgreSQL database through Drizzle ORM; the browser only owns transient UI state.
- OpenAPI is the contract for backend routes and generated React Query hooks.
- Completion is represented by both a boolean and a timestamp so the dashboard can show state and completion history.
- The single dashboard route owns the first-build surface; filters and CRUD interactions stay in the same focused workspace.

## Product

- Dashboard totals, completion rate, high-priority active count, category progress, and upcoming tasks
- Task create, edit, delete, and completion toggle flows
- Search, status, category, and sort filtering
- Responsive desktop and mobile layouts with starter study tasks seeded for first load

## User preferences

No additional preferences recorded.

## Gotchas

- Run API codegen after changing `lib/api-spec/openapi.yaml`.
- Run `pnpm --filter @workspace/db run push` after changing the Drizzle schema.
- Use the managed artifact workflows for preview; the frontend calls the API through the shared `/api` path.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
