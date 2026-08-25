# QR Studio — Installation Guide

QR Studio is a fully client-side application. There is **no backend, database or
server** — everything runs in the browser, so installation is simply serving the
built static files. This guide covers running it locally for development and
building for production.

## Prerequisites

- [Bun](https://bun.sh) (the project's package manager) — download the installer
  or use `curl -fsSL https://bun.sh/install | bash`.
- Node.js 20+ is also fine if you prefer `npm`; the commands below use `bun`.

## 1. Install dependencies

```bash
bun install
```

This installs React, Vite, Tailwind CSS, the QR library (`qrcode`), and the
export libraries (`jspdf`, `jszip`, `vite-plugin-pwa`).

## 2. Run the development server

```bash
bun run dev
```

Open http://localhost:3000. The dev server has hot module reload. In the dev
build the **Development / Test Mode** toggle on the Pricing page is always
available so you can evaluate Premium features without paying.

## 3. Type-check

```bash
bunx tsc --noEmit
```

## 4. Production build

```bash
bun run build
```

This runs the TypeScript check and then builds the optimized production bundle,
including the offline service worker, into `dist/client/`.

## 5. Preview the production build

```bash
bun run preview
```

Or serve the production build on port 3000:

```bash
bun run publish   # builds, then starts the production server on port 3000
```

## Where things live

- `src/app/` — the React application (components, pages, entitlement system).
- `src/app/entitlements/` — plans, pricing and feature gating.
- `src/app/qr/` — QR generation, rendering and export logic.
- `docs/` — in-app documentation (user guide, developer guide, deployment,
  commercial license).
- `public/` — static assets (icons, favicon, `robots.txt`).

## Privacy

QR Studio performs **all** computation locally. QR data is encoded on-device and
stored (history/templates) only in your browser's IndexedDB/localStorage. No
data is uploaded, and there are no third-party analytics or network calls.
