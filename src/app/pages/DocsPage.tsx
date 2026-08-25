import { useParams, Link } from "react-router-dom";
import { useSeo } from "../hooks";

// Single source of truth: the real markdown docs in /docs are imported raw so the
// app and the repo never drift apart.
import readme from "../../../README.md?raw";
import userGuide from "../../../docs/user-guide.md?raw";
import devGuide from "../../../docs/developer-guide.md?raw";
import deployment from "../../../docs/deployment.md?raw";
import license from "../../../docs/LICENSE-commercial.md?raw";
import pricing from "../../../PRICING.md?raw";

const DOCS: Record<string, { title: string; body: string }> = {
  "": { title: "Documentation", body: readme },
  "user-guide": { title: "User Guide", body: userGuide },
  "developer-guide": { title: "Developer Guide", body: devGuide },
  deployment: { title: "Deployment Guide", body: deployment },
  license: { title: "Commercial License", body: license },
  pricing: { title: "Pricing", body: pricing },
};

const DOC_LINKS = [
  { to: "/docs/user-guide", label: "User Guide" },
  { to: "/docs/developer-guide", label: "Developer Guide" },
  { to: "/docs/pricing", label: "Pricing" },
  { to: "/docs/deployment", label: "Deployment Guide" },
  { to: "/docs/license", label: "Commercial License" },
];

/** Minimal markdown-ish renderer for the embedded docs. */
function Md({ text }: { text: string }) {
  const lines = text.split("\n");
  const out: React.ReactNode[] = [];
  let code: string[] = [];
  let inCode = false;
  let list: string[] = [];

  const flushList = (key: string) => {
    if (list.length) {
      out.push(
        <ul key={key} className="my-3 list-disc space-y-1 pl-6 text-slate-600">
          {list.map((li, i) => (
            <li key={i}>{li.replace(/^[-*] /, "")}</li>
          ))}
        </ul>,
      );
      list = [];
    }
  };

  lines.forEach((line, i) => {
    if (line.trim().startsWith("```")) {
      if (inCode) {
        out.push(
          <pre key={`c${i}`} className="my-3 overflow-x-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">
            {code.join("\n")}
          </pre>,
        );
        code = [];
        inCode = false;
      } else {
        flushList(`l${i}`);
        inCode = true;
      }
      return;
    }
    if (inCode) {
      code.push(line);
      return;
    }
    if (/^[-*] /.test(line)) {
      list.push(line);
      return;
    }
    if (line.startsWith("## ")) {
      flushList(`h${i}`);
      out.push(<h2 key={`h${i}`} className="mt-8 text-2xl font-bold text-slate-900">{line.slice(3)}</h2>);
      return;
    }
    if (line.startsWith("### ")) {
      flushList(`h3${i}`);
      out.push(<h3 key={`h3${i}`} className="mt-6 text-lg font-semibold text-slate-900">{line.slice(4)}</h3>);
      return;
    }
    if (line.startsWith("# ")) {
      flushList(`h1${i}`);
      out.push(<h1 key={`h1${i}`} className="text-3xl font-extrabold text-slate-900">{line.slice(2)}</h1>);
      return;
    }
    if (line.trim() === "") {
      flushList(`s${i}`);
      return;
    }
    out.push(
      <p key={`p${i}`} className="my-3 text-slate-600">
        {line}
      </p>,
    );
  });
  flushList("end");
  return <div>{out}</div>;
}

export function DocsIndex() {
  useSeo("Documentation — QR Studio", "Full documentation for QR Studio: user guide, developer guide, deployment and license.");
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Documentation</h1>
      <p className="mt-2 text-slate-600">Everything you need to use, extend and deploy QR Studio.</p>
      <ul className="mt-6 space-y-3">
        {DOC_LINKS.map((d) => (
          <li key={d.to}>
            <Link to={d.to} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-indigo-300">
              <span className="font-semibold text-slate-900">{d.label}</span>
              <span className="text-slate-400">→</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DocPage() {
  const { doc = "" } = useParams<{ doc: string }>();
  const entry = DOCS[doc] ?? DOCS[""];
  useSeo(`${entry.title} — QR Studio`, `QR Studio ${entry.title.toLowerCase()}.`);
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <nav className="mb-6 flex flex-wrap gap-2 text-sm">
        <Link to="/docs" className="text-indigo-600 hover:underline">Docs</Link>
        {DOC_LINKS.map((d) => (
          <Link key={d.to} to={d.to} className="rounded-full bg-slate-100 px-3 py-1 text-slate-600 hover:bg-slate-200">
            {d.label}
          </Link>
        ))}
      </nav>
      <Md text={entry.body} />
    </div>
  );
}
