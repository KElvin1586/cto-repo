import { useMemo, useState } from "react";
import { QR_TYPES, getSchema } from "../qr/payloads";
import { generateBatchZip, parseCsv, rowsToItems } from "../qr/batch";
import { useSeo } from "../hooks";
import { DEFAULT_OPTIONS, type QrOptions, type QrType } from "../types";
import { Pill } from "../components/Fields";

const SAMPLE = `label,url
Homepage,https://example.com
Product,https://example.com/product
Support,https://example.com/support`;

export function BatchPage() {
  useSeo(
    "Batch QR Code Generator (CSV → ZIP) — QR Studio",
    "Generate hundreds of QR codes at once from a CSV file and download them all as a ZIP. Private, free and offline.",
  );
  const [type, setType] = useState<QrType>("url");
  const [csv, setCsv] = useState<string>(SAMPLE);
  const [size, setSize] = useState(512);
  const [ecc, setEcc] = useState<QrOptions["ecc"]>("M");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const schema = getSchema(type);
  const parsed = useMemo(() => parseCsv(csv), [csv]);
  const items = useMemo(
    () => rowsToItems(parsed.headers, parsed.rows, schema.summarize, schema.build),
    [parsed, schema],
  );

  const onFile = (file: File | undefined) => {
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setCsv(String(reader.result));
    reader.readAsText(file);
  };

  const doBatch = async () => {
    if (!items.length) {
      setMessage("No rows to generate — check the CSV.");
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const n = await generateBatchZip(items, { ...DEFAULT_OPTIONS, size, ecc, margin: 4 });
      setMessage(`Generated and downloaded ${n} QR codes.`);
    } catch (e) {
      setMessage(`Error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Batch QR generation</h1>
      <p className="mt-2 text-slate-600">
        Paste CSV data (or upload a file) and generate a QR code for every row. All codes
        are created locally and downloaded as a single ZIP.
      </p>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="mb-2 text-sm font-medium text-slate-700">QR type</p>
        <div className="flex flex-wrap gap-2">
          {QR_TYPES.map((t) => (
            <Pill key={t} active={t === type} onClick={() => setType(t)}>
              {t}
            </Pill>
          ))}
        </div>

        <label className="mt-4 block">
          <span className="mb-1 block text-sm font-medium text-slate-700">CSV data</span>
          <textarea
            className="min-h-[180px] w-full rounded-lg border border-slate-300 bg-slate-50 p-3 font-mono text-xs text-slate-800"
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
          />
        </label>
        <p className="mt-1 text-xs text-slate-500">
          First row = column headers. Use a <code className="rounded bg-slate-100 px-1">label</code> column for file names, plus the fields for your chosen type.
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="cursor-pointer rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200">
            Upload .csv
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          </label>
          <button
            type="button"
            onClick={() => setCsv(SAMPLE)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Use sample
          </button>
          {fileName && <span className="text-xs text-slate-500">Loaded: {fileName}</span>}
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Size: {size}px</span>
            <input type="range" min={256} max={2048} step={128} value={size} onChange={(e) => setSize(Number(e.target.value))} className="w-full" />
          </label>
          <div>
            <span className="mb-1 block text-sm font-medium text-slate-700">Error correction</span>
            <div className="flex gap-2">
              {(["L", "M", "Q", "H"] as const).map((l) => (
                <Pill key={l} active={ecc === l} onClick={() => setEcc(l)}>
                  {l}
                </Pill>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={doBatch}
          disabled={busy}
          className="mt-5 w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
        >
          {busy ? "Generating…" : `Generate ${items.length} QR code${items.length === 1 ? "" : "s"} & download ZIP`}
        </button>
        {parsed.errors.length > 0 && (
          <ul className="mt-3 space-y-1">
            {parsed.errors.map((e, i) => (
              <li key={i} className="rounded-md bg-amber-50 px-3 py-1.5 text-xs text-amber-700">
                {e}
              </li>
            ))}
          </ul>
        )}
        {message && <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>}
      </div>
    </div>
  );
}
