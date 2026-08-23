# QR Studio — User Guide

Welcome to QR Studio, a private QR code generator that lives completely in your
browser. This guide walks through everything you can do.

## Quick start

1. Open QR Studio (it works with or without an internet connection).
2. Pick a **QR type** from the chips at the top (URL, Text, Email, …).
3. Fill in the fields for that type.
4. Watch the live **Preview** update as you type.
5. Choose a **download format** (PNG, JPG, SVG or PDF) and save your code.

That's it. Nothing is uploaded anywhere.

## Supported QR types

- **URL** — links to a website or deep link.
- **Text** — any short message or note.
- **Email** — opens the mail app with recipient, subject and body pre-filled.
- **Phone** — dials a number when scanned.
- **SMS** — drafts a text message to a number.
- **Wi-Fi** — one-tap network login (WPA / WEP / open, hidden-network support).
- **VCard** — saves a full contact to the scanner's address book.
- **Location** — opens the map at given coordinates.
- **Event** — adds a calendar entry (title, time, location, description).
- **WhatsApp** — opens a chat with a pre-filled message.

## Customization

- **Size** — the output resolution, from 256 to 2048 px. Larger = higher quality
  for print; 512–1024 px is plenty for screens.
- **Error correction (L/M/Q/H)** — how much damage the code can survive and still
  scan. Use **H** when you add a logo, since the logo blocks part of the code.
- **Colors** — pick any foreground and background color.
- **Logo** — upload an image to embed in the center. QR Studio automatically
  suggests H error correction and draws a white backing plate to keep it scannable.
- **Margin (quiet zone)** — the empty border around the code. 4 modules is the
  widely recommended default; increase it for printed materials.
- **Style** — four corner/module styles: **Square**, **Rounded**, **Dots** and
  **Classy** (rounded finder patterns with dotted data).

## Exporting

Use the **PNG / JPG / SVG / PDF** buttons under the preview:

- **PNG** — crisp raster, ideal for the web and most uses.
- **JPG** — smaller file size; best for photos/documents (no transparency).
- **SVG** — vector, infinitely scalable; best for print and design software.
- **PDF** — a single A4 page with the code centered, ready to print.

Also try **Save to history** to keep a record and **Save template** to reuse the
current design later.

## Batch generation

The **Batch** page turns a CSV file into many QR codes at once:

1. Choose the QR type.
2. Paste CSV data or upload a `.csv` file.
3. The first row should be headers. Use a `label` column for file names, plus the
   field names for your chosen type (e.g. `url`, or `ssid`, `password`, …).
4. Set a size and error-correction level.
5. Click **Generate & download ZIP** — every row becomes a PNG inside a `.zip`.

Example CSV for URL codes:

```csv
label,url
Homepage,https://example.com
Product,https://example.com/product
Support,https://example.com/support
```

For a Wi-Fi batch, the headers would be `label,ssid,security,password` — the
`security` column accepts `WPA`, `WEP` or `nopass`.

## History

Every code you save appears on the **History** page, stored privately on your
device with IndexedDB. From there you can **copy** the encoded content or
**delete** individual entries, or **clear all** history. Your history is kept even
after you close the tab and works fully offline.

## Templates

Save any design as a reusable **template**. On the **Templates** page you can
**Apply** a template (it becomes the active design in the generator) or **Delete**
it. Templates are stored in your browser's localStorage.

## Offline & install (PWA)

QR Studio is a Progressive Web App:

- **Install it** via your browser's "Install app" / "Add to home screen" option —
  it runs full-screen like a native app.
- **Use it offline** — once loaded once, the entire app is cached by its service
  worker and works with no connection.

## Privacy

QR Studio performs all QR encoding, rendering and export **locally in your
browser**. There is no backend, no analytics, and no server that receives your
data. History and templates never leave your device.
