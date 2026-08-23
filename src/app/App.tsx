import { BrowserRouter, Link, NavLink, Route, Routes, useParams } from "react-router-dom";
import { Generator } from "./components/Generator";
import { TYPE_META } from "./components/Generator";
import { getSchema, QR_TYPES } from "./qr/payloads";
import { useSeo } from "./hooks";
import { BatchPage } from "./pages/BatchPage";
import { HistoryPage } from "./pages/HistoryPage";
import { TemplatesPage } from "./pages/TemplatesPage";
import { DocsIndex, DocPage } from "./pages/DocsPage";
import type { QrType } from "./types";

function Logo() {
  return (
    <NavLink to="/" className="flex items-center gap-2 font-bold text-slate-900">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-600 text-white">🧩</span>
      <span>QR&nbsp;Studio</span>
    </NavLink>
  );
}

const NAV = [
  { to: "/", label: "Generator" },
  { to: "/batch", label: "Batch" },
  { to: "/history", label: "History" },
  { to: "/templates", label: "Templates" },
  { to: "/docs", label: "Docs" },
];

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Logo />
        <nav className="flex items-center gap-1 sm:gap-2">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === "/"}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100"
                }`
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <p className="font-semibold text-slate-900">QR Studio</p>
          <p className="mt-2 text-sm text-slate-500">
            A private, offline-first QR code generator. Your data never leaves your device.
          </p>
        </div>
        <div>
          <p className="font-semibold text-slate-900">QR types</p>
          <div className="mt-2 grid grid-cols-2 gap-x-4">
            {QR_TYPES.map((t) => (
              <Link key={t} to={`/${t}`} className="text-sm text-slate-500 hover:text-indigo-600">
                {TYPE_META[t].label} QR
              </Link>
            ))}
          </div>
        </div>
        <div>
          <p className="font-semibold text-slate-900">Resources</p>
          <div className="mt-2 space-y-1">
            <Link to="/docs/user-guide" className="block text-sm text-slate-500 hover:text-indigo-600">User guide</Link>
            <Link to="/docs/developer-guide" className="block text-sm text-slate-500 hover:text-indigo-600">Developer guide</Link>
            <Link to="/docs/deployment" className="block text-sm text-slate-500 hover:text-indigo-600">Deployment guide</Link>
            <Link to="/docs/license" className="block text-sm text-slate-500 hover:text-indigo-600">License</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function HomePage() {
  useSeo(
    "QR Studio — Offline QR Code Generator",
    "Create, customize and export QR codes for URLs, Wi-Fi, VCard, Email and 10 more types. 100% private — runs entirely in your browser, even offline.",
  );
  return (
    <div className="mx-auto max-w-7xl px-4">
      <section className="mx-auto max-w-3xl py-12 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          QR codes, generated <span className="text-indigo-600">privately</span>.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-slate-600">
          Build beautiful, scannable QR codes for links, Wi-Fi, contacts and more. No
          sign-up, no uploads — your data stays in your browser, and works completely offline.
        </p>
      </section>
      <Generator type="url" onChangeType={(t) => (window.location.href = `/${t}`)} />
    </div>
  );
}

function TypePage({ qtype }: { qtype: QrType }) {
  const schema = getSchema(qtype);
  useSeo(
    `${schema.title} QR Code Generator — QR Studio`,
    `${schema.description} Make a ${schema.title} QR code that scans instantly. Private, ad-free and works offline.`,
  );
  return (
    <div className="mx-auto max-w-7xl px-4">
      <section className="mx-auto max-w-3xl py-10 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          {schema.title} QR Code Generator
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-lg text-slate-600">{schema.tagline}.</p>
      </section>
      <Generator
        type={qtype}
        onChangeType={(t) => {
          window.location.href = `/${t}`;
        }}
      />
      <section className="prose mx-auto mt-16 max-w-3xl">
        {schema.seoBody.map((p, i) => (
          <p key={i} className="mb-4 text-slate-600">
            {p}
          </p>
        ))}
      </section>
      <section className="mx-auto mt-8 max-w-3xl">
        <h2 className="text-lg font-semibold text-slate-900">Try another type</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {QR_TYPES.map((t) => (
            <Link key={t} to={`/${t}`} className="rounded-full bg-white px-3 py-1.5 text-sm font-medium text-slate-600 ring-1 ring-slate-200 hover:bg-indigo-50 hover:text-indigo-700">
              {TYPE_META[t].label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function NotFound() {
  useSeo("Page not found — QR Studio", "The page you are looking for does not exist.");
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="text-6xl">🔍</p>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">Page not found</h1>
      <Link to="/" className="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
        Back to the generator
      </Link>
    </div>
  );
}

const TYPE_NAMES = QR_TYPES as readonly string[];

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-dvh flex-col">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/batch" element={<BatchPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/templates" element={<TemplatesPage />} />
            <Route path="/docs" element={<DocsIndex />} />
            <Route path="/docs/:doc" element={<DocPage />} />
            <Route
              path="/:type"
              element={
                <TypeRouteGuard />
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

function TypeRouteGuard() {
  const { type } = useParams<{ type: string }>();
  if (type && TYPE_NAMES.includes(type)) {
    return <TypePage qtype={type as QrType} />;
  }
  return <NotFound />;
}
