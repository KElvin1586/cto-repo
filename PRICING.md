# QR Studio — Pricing

QR Studio is a **Free + Premium** product. Everything is generated locally in
your browser; Premium simply unlocks the advanced features and tools.

The prices below are the **displayed prices** in the application. Exact
live pricing is always shown on the [Pricing page](/pricing).

## Free — $0 / forever

- QR types: **URL** and **Text**
- Export: **PNG** and **JPG**
- Customization: size (up to 1024 px), error correction (L/M/Q/H), colors,
  margin, and the Square style
- 100% private: everything on-device, works offline
- Installable as a PWA

## Premium — $9.99 / month (configurable)

Everything in Free, plus:

- All **10 QR types** (adds Email, Phone, SMS, Wi-Fi, VCard, Location, Event,
  WhatsApp)
- **Logos** embedded inside the code
- **Advanced styles**: Rounded, Dots, Classy (in addition to Square)
- **High-resolution** export (up to 2048 px)
- **SVG** and print-ready **PDF** export
- **History** — re-open and re-download saved codes (IndexedDB)
- **Templates** — reusable brand design presets
- **Batch generation** — hundreds of codes from a CSV, downloaded as a ZIP

## Upgrade process

From the Free app:

1. A Premium feature shows a **🔒 Premium** lock badge.
2. Clicking it opens the **Upgrade modal**, which explains the feature and the
   Premium price.
3. The **Upgrade to Premium** button takes you to the configured checkout URL
   (see below).
4. Once a real entitlement provider grants Premium, the app reflects it
   immediately.

## Payment integration (future)

QR Studio deliberately does **not** process payments itself and never fakes a
purchase. Commercializing Premium is a configuration change, not a code rewrite:

- Set `upgradeUrl` in `src/app/entitlements/config.ts` to your real checkout
  URL (e.g. a Stripe Payment Link).
- Set `premiumPrice` / `premiumCurrency` to match.
- Have your checkout/license provider call `setPlan("PREMIUM")` (via a webhook
  or a stored entitlement) once payment is verified.

Until a real checkout is connected, the app shows **no fake payment button** —
it clearly states that purchasing is not yet available and offers a clearly
labelled **Development / Test Mode** to evaluate Premium locally.
