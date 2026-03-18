# PinuiBinui — Claude Code Conventions

## Stack
- Next.js 14 App Router, TypeScript strict mode
- Tailwind CSS with logical RTL properties
- Supabase (Auth, PostgreSQL + RLS, Storage)
- @tanstack/react-query for all client-side data fetching
- react-hook-form + zod for all forms
- next-intl for i18n (Hebrew primary + English)

## Folder layout
```
src/
  app/                 — Next.js App Router pages and layouts
    (public)/          — Unauthenticated routes (login, reset-password)
    portal/            — Authenticated portals (one subfolder per role)
    api/               — Route Handlers
  components/
    shared/            — Truly reusable UI primitives
    portal/            — Role-specific composite components
      admin/
      resident/
      supervisor/
      developer/
      lawyer/
  lib/
    supabase/          — Browser client, server client, admin client, types
    rbac/              — Permissions matrix and canAccess() function
    hooks/             — All custom React hooks
  i18n/                — next-intl config and locale utilities
messages/
  he.json              — Hebrew translations (default)
  en.json              — English translations
supabase/
  migrations/          — SQL migration files (apply via Supabase CLI)
```

## Naming conventions
- Files: kebab-case for pages/routes, PascalCase for components
- Components: **named exports only**, no default exports
- Hooks: prefix with "use" (e.g. useDocumentChecklist)
- Server-only code: suffix with `.server.ts`
- All user-facing strings: via `useTranslations()` from next-intl — never hardcode text

## Supabase rules
- **Never** import the browser client in Server Components
- Use `src/lib/supabase/server.ts` in Server Components and middleware
- Use `src/lib/supabase/client.ts` in Client Components only
- Use `src/lib/supabase/admin.ts` only in server Route Handlers (bypasses RLS)
- Always type the client: `createBrowserClient<Database>()` / `createServerClient<Database>()`
- Use `createSignedUrl` (1-hour expiry) for serving documents — **never** `getPublicUrl`

## RBAC rules
- All access checks go through `src/lib/rbac/permissions.ts`
- Middleware at `src/middleware.ts` handles route-level role enforcement
- Role is read from `user.app_metadata.role` (set via admin SDK) — not from the DB in middleware
- Never check role inline — always call `canAccess(role, resource, action)`
- Portal routes are prefixed: `/portal/admin`, `/portal/resident`, `/portal/supervisor`, etc.

## Document flows
| source    | uploaded_by        | visible_to                      |
|-----------|--------------------|---------------------------------|
| resident  | resident user      | resident, supervisor, lawyer, admin |
| developer | developer user     | all roles                       |
| municipality | admin           | all roles                       |

## i18n rules
- Default locale: `he` (Hebrew, RTL)
- Secondary locale: `en` (English, LTR)
- Language toggle in portal header switches locale AND flips `dir` attribute
- All translations go in `/messages/he.json` and `/messages/en.json`

## Accessibility (elderly users)
- Minimum font size: 18px for labels, 16px for body
- All interactive elements must have `aria-label`
- Color contrast must pass WCAG AA (4.5:1 minimum)
- Status must never rely on color alone — always include an icon or text
- Use `role="alert"` for Action Required cards

## RTL layout
- Set `<html lang="he" dir="rtl">` by default
- Use Tailwind logical utilities everywhere: `ms-*`, `me-*`, `ps-*`, `pe-*`
- Avoid `ml-*`, `mr-*`, `pl-*`, `pr-*` — these break RTL

## Git
- Conventional commits: feat / fix / chore / refactor / docs
- Feature branches: `feature/<short-slug>`
- Never commit `.env.local`
