# QR Studio — Deployment Guide

QR Studio is a static, client-side PWA. Deploying is just hosting the contents
of `dist/client` (the `vite build` output) on any static host. No server,
database or environment variables are required. The canonical copy lives at
`docs/deployment.md` (shown in-app).

## Build

```bash
bun install
bun run build
```

This runs `tsc --noEmit` and then `vite build`, emitting everything to
`dist/client/`:

- `index.html` — the app shell
- `assets/` — hashed JS/CSS bundles
- `sw.js` + `workbox-*.js` — the service worker (offline caching)
- `manifest.webmanifest` — PWA install manifest
- `icons/`, `favicon.svg`, `apple-touch-icon.png`

## Local / preview server

```bash
bun run start       # serves dist/client on 0.0.0.0:3000
# or the all-in-one:
bun run publish     # installs, builds and (re)starts the server on :3000
```

`serve.ts` serves real files and falls back to `index.html` so client-side
routes work when navigated to directly (deep links).

## Deploying to any static host

1. Run `bun run build`.
2. Upload the contents of `dist/client/` to your host.
3. Configure the host to return `index.html` for unknown paths (SPA fallback).
   - **Netlify**: `_redirects` → `/* /index.html 200`.
   - **Vercel**: `vercel.json` →
     `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }`.
   - **GitHub Pages / S3 / nginx**: rewrite unknown routes to `/index.html`.

### PWA notes for hosted deployments

- The service worker needs HTTPS (or `localhost`) to register — all public hosts
  provide this.
- Serve `manifest.webmanifest` and the icons from the site root with correct MIME
  types.
- The app caches its own assets and makes **no external requests**, so it works
  offline and does not depend on any third-party CDN.

## Verification checklist

After deploying, confirm:

1. The home page and `/wifi` (a deep link) load directly.
2. You can create a QR and download PNG, JPG, SVG and PDF.
3. The **Batch** page generates and downloads a ZIP.
4. **History** persists after a reload (IndexedDB).
5. With the network disconnected, the page still loads (offline PWA).
6. The browser offers **Install app** (PWA criteria are met).
7. `bun run build` completes with no TypeScript errors.
