# MTSE Frontend Admin

E-commerce admin panel built with React + Vite + TypeScript.

## Tech Stack

- **React 19** + **TypeScript**
- **Vite** (build tool)
- **TailwindCSS 4** (styling)
- **React Router** (routing)
- **Zustand** (state management)
- **Axios** (HTTP client)
- **Vitest** + React Testing Library (testing)
- **Zod** (validation)
- **mtse-shared** (shared config-driven library)

## Getting Started

```bash
npm install
npm run dev
```

## Project Structure

```
src/
├── app/            App bootstrap (App, Providers, Router)
├── components/     Reusable UI components (ui, layout, common)
├── config/         Environment config
├── features/       Feature modules (domain-driven)
├── hooks/          Global custom hooks
├── lib/            Third-party wrappers (api, utils)
├── services/       Global API services
├── stores/         Zustand state stores
├── types/          Global TypeScript types
└── utils/          Global utilities
```

## Code Generation

```bash
npm run generate component Button
npm run generate feature products
npm run generate page Dashboard
npm run generate service auth
npm run generate hook Cart
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run generate` | Generate components/features/services |

## Environment

Create a `.env` file:

```env
VITE_API_URL=http://localhost:3000
```
