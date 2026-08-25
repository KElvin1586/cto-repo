# Changelog

All notable changes to **QR Studio** are documented here. Versions follow
[Semantic Versioning](https://semver.org).

## [1.1.0] — 2025-08-25

Commercial QA + freemium hardening release.

### Added
- Centralized Free/Premium entitlement system (`src/app/entitlements/`) with
  per-feature gating — Free users cannot execute Premium logic.
- Route-level and action-level enforcement (premium QR types, SVG/PDF export,
  logos, advanced styles, history, templates, batch).
- **Development / Test Mode** on the Pricing page — clearly labelled, unlocks
  Premium locally for evaluation only, never a purchase, auto-hidden in
  production unless explicitly enabled.
- Configurable commercial integration points: `UPGRADE_URL`, `PREMIUM_PRICE`,
  `PREMIUM_CURRENCY` (`src/app/entitlements/config.ts`).
- Open Graph + Twitter card metadata (`index.html`).
- `robots.txt`.
- Documentation: `INSTALLATION.md`, `PRICING.md`, `CHANGELOG.md`, `LICENSE.md`,
  `COMMERCIAL-LICENSE.md`, `USER-GUIDE.md`, `DEPLOYMENT.md`.

### Changed
- Upgrade modal copy is now honest about checkout being unconnected — no fake
  payment buttons, no placeholder/example production URLs.
- Pricing comparison now reflects real Free vs Premium entitlements.

### Security
- Confirmed no secrets, tokens or credentials in the frontend bundle.
- All computation stays local; no external API requests.

## [1.0.0] — 2025-08-23

Initial release. A private, offline-first QR code generator:

- 10 QR types (URL, Text, Email, Phone, SMS, Wi-Fi, VCard, Location, Event,
  WhatsApp).
- Customization: size, error correction, colors, margin, styles, logo.
- Export to PNG, JPG, WebP, SVG, PDF.
- Batch CSV → ZIP.
- History (IndexedDB) and Templates (localStorage).
- Offline installable PWA.
- No backend, no database, no uploads.
