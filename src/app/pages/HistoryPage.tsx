import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSeo } from "../hooks";
import { useQrRender } from "../hooks";
import { clearHistory, deleteHistory, getHistory } from "../store";
import { TYPE_META } from "../components/Generator";
import type { HistoryEntry } from "../types";

function MiniQr({ content, options }: { content: string; options: HistoryEntry["options"] }) {
  const { canvasRef } = useQrRender(content, { ...options, size: 160 });
  return (
    <canvas
      ref={canvasRef}
      width={160}
      height={160}
      className="h-16 w-16 rounded-md shadow-sm ring-1 ring-slate-200"
    />
  );
}

export function HistoryPage() {
  useSeo(
    "History — QR Studio",
    "Your recent QR codes, stored privately in your browser (IndexedDB).",
  );
  const [items, setItems] = useState<HistoryEntry[]>([]);

  const refresh = async () => setItems(await getHistory());

  useEffect(() => {
    void refresh();
  }, []);

  const remove = async (id: string) => {
    await deleteHistory(id);
    await refresh();
  };
  const wipe = async () => {
    if (!window.confirm("Delete all history? This cannot be undone.")) return;
    await clearHistory();
    await refresh();
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">History</h1>
        {items.length > 0 && (
          <button onClick={wipe} className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
            Clear all
          </button>
        )}
      </div>
      <p className="mt-2 text-slate-600">
        Everything is saved on this device with IndexedDB. Nothing is uploaded.
      </p>

      {items.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-4xl">🗂️</p>
          <p className="mt-3 text-slate-600">No saved codes yet.</p>
          <Link to="/" className="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
            Create your first QR code
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {items.map((e) => (
            <li key={e.id} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <MiniQr content={e.content} options={e.options} />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 truncate font-semibold text-slate-900">
                  <span>{TYPE_META[e.type].icon}</span> {e.label || e.type}
                </p>
                <p className="mt-0.5 truncate font-mono text-xs text-slate-500">{e.content}</p>
                <p className="mt-0.5 text-xs text-slate-400">{new Date(e.createdAt).toLocaleString()}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  onClick={() => navigator.clipboard?.writeText(e.content)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Copy
                </button>
                <button
                  onClick={() => remove(e.id)}
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
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
