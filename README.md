# QR Studio

A **private, offline-first QR code generator** that runs entirely in your browser.
Create, customize and export QR codes for 10 content types — no sign-up, no
uploads, no backend.

## Highlights

- **10 QR types** — URL, Text, Email, Phone, SMS, Wi-Fi, VCard, Location, Event, WhatsApp
- **Full customization** — size, error correction (L/M/Q/H), colors, logo, margin and 4 corner styles (Square, Rounded, Dots, Classy)
- **4 export formats** — PNG, JPG, SVG and PDF
- **Batch generation** — generate hundreds of codes from a CSV file and download them all as a ZIP
- **History** — recent codes saved privately with IndexedDB
- **Templates** — reusable design presets
- **Offline PWA** — installable and usable with no internet connection
- **Privacy first** — every pixel is generated locally; your data never leaves the device

## Tech Stack

- **TypeScript**
- **Vite** (build tool)
- **React** (UI)
- **Tailwind CSS** (styling)
- **qrcode** (QR encoding)
- **jsPDF** (PDF export)
- **JSZip** (batch ZIP export)
- **vite-plugin-pwa** (offline installable PWA)

## Getting started

```bash
bun install        # or: npm install
bun run dev        # start the dev server on :3000
bun run build      # type-check + production build
bun run start      # serve the production build on :3000
```

> This project targets [Bun](https://bun.sh) but works with npm/pnpm/yarn too —
> just replace `bun` with your package manager.

## Project structure

```
site/
  index.html            # HTML shell + SEO/JSON-LD
  vite.config.ts        # Vite + Tailwind + PWA configuration
  serve.ts              # static production server (Bun) with SPA fallback
  public/               # favicon, PWA icons, manifest assets
  src/app/
    main.tsx            # entry — registers the service worker
    App.tsx             # layout + routing + SEO pages
    hooks.ts            # SEO, QR rendering, localStorage hooks
    types.ts            # shared types & defaults
    qr/
      payloads.ts       # per-type field schemas & payload builders
      render.ts         # module matrix extraction + canvas/SVG rendering
      export.ts         # PNG/JPG/SVG/PDF download helpers
      batch.ts          # CSV parsing + bulk ZIP export
    store.ts            # IndexedDB history + localStorage templates
    components/         # Generator, form fields
    pages/              # Home, per-type pages, Batch, History, Templates, Docs
  docs/                 # full documentation (also shown in-app)
```

## Documentation

See the `docs/` folder (also available in-app under /docs):

- [User Guide](docs/user-guide.md)
- [Developer Guide](docs/developer-guide.md)
- [Deployment Guide](docs/deployment.md)
- [Commercial License](docs/LICENSE-commercial.md)

## License

QR Studio is licensed under a commercial license — see
[LICENSE-commercial.md](docs/LICENSE-commercial.md). Private, non-commercial
personal use is permitted; commercial use requires a license.
