// Production server for QR Studio. This is a fully client-side PWA: `vite build`
// emits static assets into dist/client, and this Bun server serves them on
// port 3000 with an SPA fallback so client-side routes (/, /url, /wifi, /batch,
// /history, /templates, /docs/*) all resolve to index.html.
//
// Starting a new instance supersedes the old one: it frees the port no matter
// which user owns the current server. Every sandbox user has passwordless sudo,
// so the takeover works across user boundaries.
import { readFileSync } from "node:fs";

// Pinned, NOT read from the environment. The published site URL is reverse-
// proxied to 0.0.0.0:3000, so the default site MUST bind there.
const PORT = 3000;
const HOST = "0.0.0.0";
const CLIENT_DIR = `${import.meta.dir}/dist/client`;

const INDEX_PATH = `${CLIENT_DIR}/index.html`;
let indexHtml = "";
try {
  indexHtml = readFileSync(INDEX_PATH, "utf8");
} catch {
  // First publish hasn't built yet; server will still start and 404 until build.
}

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".webmanifest": "application/manifest+json",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
};

const freePort =
  `for _ in $(seq 1 25); do ` +
  `pids=$(lsof -t -iTCP:${String(PORT)} -sTCP:LISTEN 2>/dev/null || true); ` +
  `if [ -z "$pids" ]; then exit 0; fi; ` +
  `kill $pids 2>/dev/null || true; sleep 0.2; ` +
  `done`;

for (let attempt = 1; ; attempt++) {
  await Bun.$`sudo sh -c ${freePort}`.quiet().nothrow();
  try {
    Bun.serve({
      port: PORT,
      hostname: HOST,
      async fetch(req) {
        const url = new URL(req.url);
        let path = decodeURIComponent(url.pathname);
        if (path.endsWith("/")) path += "index.html";

        const file = Bun.file(CLIENT_DIR + path);
        if (await file.exists()) {
          const ext = path.slice(path.lastIndexOf(".")).toLowerCase();
          return new Response(file, {
            headers: { "Content-Type": MIME[ext] ?? "application/octet-stream" },
          });
        }

        // SPA fallback: any unknown path serves the app shell (index.html).
        // The service worker + manifest are served as real files above.
        if (indexHtml) {
          return new Response(indexHtml, {
            headers: { "Content-Type": "text/html; charset=utf-8" },
          });
        }
        return new Response("Nothing built yet — run `bun run publish` first", {
          status: 503,
        });
      },
    });
    break;
  } catch (err) {
    if (attempt >= 10) throw err;
    await Bun.sleep(200);
  }
}
console.log(`QR Studio serving on http://${HOST}:${String(PORT)}`);
