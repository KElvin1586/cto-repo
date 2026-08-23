# QR Studio — Developer Guide

This guide explains the architecture and how to extend QR Studio. It is a fully
client-side TypeScript + React + Vite + Tailwind application — there is no
backend, database or server-side logic.

## Architecture overview

```
Browser
  ├─ React UI (components/pages)
  ├─ QR engine (qr/payloads, qr/render, qr/export, qr/batch)
  ├─ Local persistence (store.ts: IndexedDB + localStorage)
  ├─ PWA service worker (vite-plugin-pwa)
  └─ Third-party libs: qrcode, jspdf, jszip
```

All QR computation happens on-device. The `qrcode` library produces a raw module
matrix; QR Studio's own renderer (`qr/render.ts`) draws it to a `<canvas>` (for
PNG/JPG/PDF) or builds an SVG string, applying colors, margin and the four styles.

## Adding a new QR type

1. **Schema + payload** — in `src/app/qr/payloads.ts`, add an entry to the
   `schemas` record keyed by a new `QrType`:
   - `fields`: the form fields (`name`, `label`, `kind`, …).
   - `build(values)` → the string to encode.
   - `summarize(values)` → a human label used in history/file names.
   - `seoBody`: array of paragraphs for its SEO page.
2. **Type union** — add the key to `QrType` in `src/app/types.ts`, then add a
   label + icon in `TYPE_META` in `src/app/components/Generator.tsx`.
3. **Routing** — the type route is automatic: `/wifi`, `/vcard`, etc. resolve
   through `TypeRouteGuard` in `src/app/App.tsx`.
4. **CSV batch** — batch works automatically because it calls `schema.build` and
   `schema.summarize`; just document the expected columns.

## Adding a style

Add the option to the `QrStyle` union in `src/app/types.ts`, then implement the
shape in `drawModule` (canvas) and `svgShape` (SVG) in `src/app/qr/render.ts`, and
optionally a label in `STYLE_LABELS` in the Generator.

## Export pipeline

- `exportPng` / `exportJpg` — rasterize the canvas to a Blob and download.
- `exportSvg` — serialize `renderToSvg(matrix, options)`.
- `exportPdf` — embed the canvas PNG into an A4 jsPDF document.
- Batch — for each row, render a canvas, then bundle the PNGs with JSZip.

## Data privacy

By design there is **no server communication**. History uses IndexedDB
(`store.ts`); templates persist to localStorage. If you add new functionality,
keep it client-side to preserve the privacy guarantee.

## Development workflow

```bash
bun install         # install dependencies
bun run dev         # dev server on :3000
bun run build       # tsc --noEmit, then vite build → dist/client
bun run start       # serve the production build on :3000
```

`serve.ts` is a minimal Bun static server with an SPA fallback: real files under
`dist/client` are served directly, anything else returns `index.html` so
client-side routes (`/wifi`, `/batch`, …) work when navigated to directly.

## Quality gates

- `tsc --noEmit` runs as part of `bun run build` and must pass.
- `noUnusedLocals` / `noUnusedParameters` / `strict` are enabled.
- Keep the PWA intact — the service worker precaches build assets for offline use.

## Testing

QR Studio includes a browser-based test suite that exercises generation,
customization, export, batch and offline behaviour. See the deployment guide for
how the production build is verified after `bun run build`.
