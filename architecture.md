# Architecture

## Folder Structure

```
src/
├── components/
│   ├── ui/           # Reusable UI components (Button, Input, Card, …)
│   └── layout/       # Layout primitives (Screen, Stack, Row)
├── config/
│   └── env.ts        # Validated env vars
├── features/
│   └── <feature>/    # Each feature is self-contained (see below)
├── hooks/            # Global reusable hooks
├── locales/          # i18n translation files
├── navigation/       # Navigator components
├── services/         # API client, analytics, logger, notifications, storage
├── stores/
│   ├── persistent/   # MMKV-backed Zustand stores (auth, settings)
│   └── session/      # In-memory Zustand stores (ui, modal)
├── theme/            # Design tokens (colors, spacing, radius, typography)
├── types/            # Global TypeScript types
└── utils/            # Pure helper functions
```

## Feature Module Rules

Every feature under `src/features/<name>/` MUST contain exactly these files:

| File/Folder | Purpose |
|-------------|---------|
| `screens/` | Screen-level components registered in navigators |
| `components/` | Feature-scoped UI components |
| `hooks/` | Feature-specific custom hooks |
| `api.ts` | TanStack Query hooks + raw Axios calls for this feature |
| `store.ts` | Zustand slice for feature-local state |
| `types.ts` | TypeScript interfaces/types for this feature |

No exceptions. AI tools should follow this contract when scaffolding a new feature.

## Naming Conventions

- **Components**: PascalCase (`LoginScreen.tsx`, `Button.tsx`)
- **Hooks**: camelCase with `use` prefix (`useAuth.ts`, `useLogin.ts`)
- **Files**: kebab-case for config/utility files (`jest.setup.ts`, `env.ts`)
- **Stores**: camelCase with `Store` suffix (`authStore.ts`)
- **Types**: PascalCase interfaces, exported from `types.ts`

## Data Flow

```
UI Screens
  ↓ (calls)
Feature Hooks  ─────────────────→  Zustand Stores
  ↓ (calls)                              ↓ (reads)
TanStack Query / Mutations         UI Screens (re-render)
  ↓ (calls)
Axios Client (services/api/client.ts)
  ↓ (HTTP)
REST API Server
  ↑ (cached)
TanStack Query Cache
```

## Store Usage Rules

- **Never** access Zustand stores directly from screens. Always go through a feature hook.
- Persistent stores (`authStore`, `settingsStore`) use MMKV via `zustand/middleware` `persist`.
- Session stores (`uiStore`, `modalStore`) are plain Zustand — no persistence.

## AI-Friendly Conventions

When prompting an AI to add a new feature, use this template:

> "Add a new feature called `<name>` to `src/features/<name>/`. Create `types.ts`, `api.ts` (with TanStack Query hooks), `store.ts` (Zustand slice), `hooks/use<Name>.ts`, and `screens/<Name>Screen.tsx`. Register the screen in the appropriate navigator."

The strict folder convention means the AI can generate consistent, correct code every time.
