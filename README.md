# App Template — React Native + Expo + TypeScript

A production-ready mobile app template built with React Native, Expo SDK 51, and TypeScript. Follows a feature-based architecture with a strict separation of concerns.

## Prerequisites

- **Node.js** 18+
- **Expo CLI** — `npm install -g expo-cli`
- **EAS CLI** — `npm install -g eas-cli`

## Quick Start

```bash
git clone <repo-url> App-Template
cd App-Template
npm install
cp .env.example .env.development
# Fill in your values in .env.development
npm run start
```

## Environment Setup

Three environment files are used:

| File | Purpose |
|------|---------|
| `.env.example` | Template — committed to git |
| `.env.development` | Local dev overrides — gitignored |
| `.env.production` | Production values — gitignored |

Required keys:

```env
API_BASE_URL=https://api.example.com
GOOGLE_CLIENT_ID=your-google-client-id
POSTHOG_API_KEY=your-posthog-api-key
APP_ENV=development
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run start` | Start Expo dev server |
| `npm run android` | Start on Android emulator |
| `npm run ios` | Start on iOS simulator |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Jest |
| `npm run build:preview` | Build preview via EAS |

## Features

- **Auth** — Email/password, Google Sign-In, Apple Sign-In (iOS)
- **Profile** — View/edit profile, avatar upload
- **Settings** — Dark mode, language (English/Arabic with RTL), notifications
- **Notifications** — Push notification list with mark-read

## Tech Stack

| Layer | Library |
|-------|---------|
| Framework | React Native 0.74 + Expo SDK 51 |
| Language | TypeScript 5 |
| Styling | NativeWind v4 (Tailwind CSS) |
| Navigation | React Navigation v6 |
| State | Zustand v4 |
| Server State | TanStack Query v5 |
| HTTP | Axios |
| Storage | MMKV + AsyncStorage |
| i18n | i18next + react-i18next |
| Testing | Jest + React Native Testing Library |
| CI/CD | GitHub Actions + EAS Build |

## Documentation

- [Architecture](./architecture.md) — Folder structure, naming conventions, data flow
- [Component Guidelines](./component-guidelines.md) — How to use and extend UI components
- [Feature Template](./feature-template.md) — Step-by-step guide to add a new feature
- [Contributing](./CONTRIBUTING.md) — Branch naming, commit format, PR checklist
