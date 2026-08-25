# QR Studio — User Guide

QR Studio is a **private, offline-first QR code generator** that runs entirely in
your browser. Nothing you create is ever uploaded. The canonical copy lives at
`docs/user-guide.md` (shown in-app).

## Quick start

1. Open QR Studio (it works with or without an internet connection).
2. Pick a **QR type** from the chips (URL, Text, …).
3. Fill in the fields.
4. Watch the live **Preview** update as you type.
5. Choose a **download format** and save your code.

## QR types

| Type | Free | Available in |
| --- | --- | --- |
| URL | ✅ | Free |
| Text | ✅ | Free |
| Email, Phone, SMS, Wi-Fi, VCard, Location, Event, WhatsApp | 🔒 | Premium |

## Customization

- **Size** — Free up to 1024 px; Premium up to 2048 px (high-res).
- **Error correction** — L / M / Q / H.
- **Colors** — foreground and background.
- **Margin** — quiet zone width.
- **Style** — Square (Free); Rounded, Dots, Classy (Premium).
- **Logo** — embed an image inside the code (Premium).

## Export

- **PNG** and **JPG** — Free.
- **SVG** (vector) and **PDF** (print-ready) — Premium.
- **High-resolution PNG** (above 1024 px) — Premium.

## Premium features

- All 10 QR types
- Logo and advanced styles
- SVG / PDF / high-res export
- **History** (IndexedDB) — re-open and re-download saved codes
- **Templates** — reusable brand design presets
- **Batch** — generate hundreds of codes from a CSV file and download a ZIP

## Privacy

All QR generation, batch processing, history and templates stay on your device
(IndexedDB / localStorage). There is no backend, no third-party analytics and no
network uploads.
