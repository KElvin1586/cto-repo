import { useState } from "react";
import { Link } from "react-router-dom";
import { useSeo } from "../hooks";
import { useQrRender } from "../hooks";
import { deleteTemplate, getTemplates } from "../store";
import { DEFAULT_OPTIONS, type Template } from "../types";

function MiniDesign({ options }: { options: Template["options"] }) {
  const { canvasRef } = useQrRender("https://example.com", { ...options, size: 160 });
  return (
    <canvas
      ref={canvasRef}
      width={160}
      height={160}
      className="h-20 w-20 rounded-md shadow-sm ring-1 ring-slate-200"
    />
  );
}

export function TemplatesPage() {
  useSeo(
    "Templates — QR Studio",
    "Save and reuse QR code design presets for fast, consistent branding. Stored locally in your browser.",
  );
  const [list, setList] = useState<Template[]>(() => getTemplates());
  const [applied, setApplied] = useState<string | null>(null);

  const refresh = () => setList(getTemplates());

  const remove = (id: string) => {
    deleteTemplate(id);
    refresh();
  };

  const apply = (t: Template) => {
    try {
      localStorage.setItem("qr-studio:options", JSON.stringify(t.options));
    } catch {
      /* ignore */
    }
    setApplied(t.name);
    setTimeout(() => setApplied(null), 2000);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Templates</h1>
      <p className="mt-2 text-slate-600">
        Reusable design presets. Save a look from the generator, then apply it any time.
        Stored locally.
      </p>

      {applied && (
        <div className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Applied “{applied}”. Head to the <Link to="/" className="font-semibold underline">generator</Link> to use it.
        </div>
      )}

      {list.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-4xl">🎨</p>
          <p className="mt-3 text-slate-600">
            No templates yet. In the generator, customize colors and styles, then hit "Save template".
          </p>
          <Link to="/" className="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
            Open the generator
          </Link>
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((t) => (
            <li key={t.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <MiniDesign options={t.options} />
              <p className="mt-3 font-semibold text-slate-900">{t.name}</p>
              <p className="text-xs text-slate-400">{new Date(t.createdAt).toLocaleDateString()}</p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => apply(t)}
                  className="flex-1 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  Apply
                </button>
                <button
                  onClick={() => remove(t.id)}
                  className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export { DEFAULT_OPTIONS };
