# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SubSense is a subscription ROI (Return on Investment) optimizer built with Next.js 16. It helps users track their software subscriptions and score them based on usage frequency, importance, and cost to identify waste and optimization opportunities.

## Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run lint     # ESLint check
npm run start    # Start production server
```

## Architecture

### Tech Stack
- **Framework:** Next.js 16 with App Router (React 19)
- **Styling:** Tailwind CSS 4 with CSS variables for theming
- **UI Components:** shadcn/ui (new-york style) with Radix UI primitives
- **State:** In-memory store (`lib/store.ts`) - no database
- **Icons:** Lucide React
- **Notifications:** Sonner toast library

### Directory Structure
```
app/
├── layout.tsx              # Root layout with ThemeProvider
├── globals.css             # Tailwind + CSS variables
└── (dashboard)/            # Route group for main app
    ├── layout.tsx          # Dashboard layout with AppShell
    ├── page.tsx            # Dashboard home (KPIs + table)
    ├── add/page.tsx        # Add/edit subscription form
    ├── settings/page.tsx   # Settings page
    └── reports/[id]/       # Dynamic report routes

components/
├── app-shell.tsx           # Main layout shell with sidebar navigation
├── ui/                     # shadcn/ui components
└── [feature].tsx           # Feature-specific components

lib/
├── types.ts                # TypeScript interfaces (Subscription, KPIData)
├── store.ts                # In-memory data store with CRUD operations
├── scoring.ts              # ROI calculation algorithm
└── utils.ts                # cn() utility for class merging
```

### ROI Scoring System

The scoring algorithm in `lib/scoring.ts` calculates ROI (0-100) based on:
- **Usage frequency:** daily (40pts), weekly (30pts), monthly (15pts), rare (5pts)
- **Importance:** high (40pts), medium (25pts), low (10pts)
- **Cost penalty:** Reduces score based on monthly cost

Status thresholds:
- `good`: score >= 75 (keep)
- `review`: score >= 40 (consider downgrading)
- `cut`: score < 40 (recommend canceling)

### Path Aliases

`@/*` maps to the project root, configured in `tsconfig.json`.

### shadcn/ui Configuration

Components are configured via `components.json`:
- Style: new-york
- React Server Components enabled
- Components: `@/components/ui`
- Utils: `@/lib/utils`

## Notes

- TypeScript build errors are ignored in `next.config.mjs` (`ignoreBuildErrors: true`)
- Images are unoptimized (Vercel deployment consideration)
- Theme defaults to dark mode with system preference support
- Data persists only in memory (resets on page refresh in dev, per-instance in production)
