import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { QR_TYPES, getSchema } from "~/app/qr/payloads";
import {
  exportJpg,
  exportPdf,
  exportPng,
  exportSvg,
} from "~/app/qr/export";
import { buildMatrix, renderToSvg } from "~/app/qr/render";
import { useLocalStorage, useQrRender, readFileAsDataUrl } from "~/app/hooks";
import { addHistory, saveTemplate } from "~/app/store";
import { DEFAULT_OPTIONS, type QrOptions, type QrType } from "~/app/types";
import { FieldGroup, Pill, useFieldDefaults } from "./Fields";

const TYPE_META: Record<QrType, { icon: string; label: string }> = {
  url: { icon: "🔗", label: "URL" },
  text: { icon: "📝", label: "Text" },
  email: { icon: "✉️", label: "Email" },
  phone: { icon: "📞", label: "Phone" },
  sms: { icon: "💬", label: "SMS" },
  wifi: { icon: "📶", label: "Wi-Fi" },
  vcard: { icon: "👤", label: "VCard" },
  location: { icon: "📍", label: "Location" },
  event: { icon: "📅", label: "Event" },
  whatsapp: { icon: "🟢", label: "WhatsApp" },
};

const STYLE_LABELS: Record<QrOptions["style"], string> = {
  square: "Square",
  rounded: "Rounded",
  dots: "Dots",
  classy: "Classy",
};

export function Generator({ type, onChangeType }: { type: QrType; onChangeType: (t: QrType) => void }) {
  const [options, setOptions] = useLocalStorage<QrOptions>("qr-studio:options", DEFAULT_OPTIONS);
  const defaults = useFieldDefaults(type);
  const [values, setValues] = useState<Record<string, string>>(defaults);
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => setValues(defaults), [defaults]);

  const schema = getSchema(type);
  const content = useMemo(() => schema.build(values), [schema, values]);
  const label = useMemo(() => schema.summarize(values) || "qr-code", [schema, values]);

  const { canvasRef } = useQrRender(content || " ", options);

  const setValue = useCallback((name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const setOpt = useCallback(
    <K extends keyof QrOptions>(key: K, value: QrOptions[K]) => {
      setOptions((prev) => ({ ...prev, [key]: value }));
    },
    [setOptions],
  );

  const notify = (msg: string) => {
    setToast(msg);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(null), 2400);
  };

  const onLogo = async (file?: File) => {
    if (!file) {
      setOpt("logo", undefined);
      return;
    }
    const dataUrl = await readFileAsDataUrl(file);
    setOpt("logo", dataUrl);
  };

  const doExport = useCallback(
    (format: "png" | "jpg" | "svg" | "pdf") => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const safe = label.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-|-$/g, "") || "qr-code";
      if (format === "png") exportPng(canvas, safe);
      else if (format === "jpg") exportJpg(canvas, safe);
      else if (format === "svg") {
        const matrix = buildMatrix(content || " ", options.ecc, options.margin);
        exportSvg(renderToSvg(matrix, options), safe);
      } else exportPdf(canvas, safe);
      notify(`Downloaded ${format.toUpperCase()}`);
    },
    [canvasRef, label, options, content],
  );

  useEffect(() => {
    if (options.logo && options.ecc !== "H") {
      // Auto-recommend high EC when a logo is used.
      setOptions((prev) => ({ ...prev, ecc: "H" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.logo]);

  const saveHistory = async () => {
    await addHistory({ type, label, content, options });
    notify("Saved to history");
  };

  const saveAsTemplate = () => {
    const name = window.prompt("Name this template:", `${TYPE_META[type].label} preset`);
    if (!name) return;
    saveTemplate(name, options);
    notify("Template saved");
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
      {/* Left: editor */}
      <div className="space-y-6">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">QR type</p>
          <div className="flex flex-wrap gap-2">
            {QR_TYPES.map((t) => (
              <Pill key={t} active={t === type} onClick={() => onChangeType(t)}>
                <span className="mr-1">{TYPE_META[t].icon}</span>
                {TYPE_META[t].label}
              </Pill>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">{schema.title}</h2>
          <FieldGroup type={type} values={values} onChange={setValue} />
          <div className="mt-4 rounded-lg bg-slate-50 p-3">
            <p className="text-xs font-medium text-slate-500">Encoded content</p>
            <p className="mt-1 break-all font-mono text-xs text-slate-700">{content || " "}</p>
          </div>
        </div>

        {/* Customization */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Customization</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Size</span>
              <input
                type="range"
                min={256}
                max={2048}
                step={128}
                value={options.size}
                onChange={(e) => setOpt("size", Number(e.target.value))}
                className="w-full"
              />
              <span className="text-xs text-slate-500">{options.size} px</span>
            </label>

            <div>
              <span className="mb-1 block text-sm font-medium text-slate-700">Error correction</span>
              <div className="flex gap-2">
                {(["L", "M", "Q", "H"] as const).map((lvl) => (
                  <Pill key={lvl} active={options.ecc === lvl} onClick={() => setOpt("ecc", lvl)}>
                    {lvl}
                  </Pill>
                ))}
              </div>
            </div>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Margin (quiet zone)</span>
              <input
                type="range"
                min={0}
                max={8}
                step={1}
                value={options.margin}
                onChange={(e) => setOpt("margin", Number(e.target.value))}
                className="w-full"
              />
              <span className="text-xs text-slate-500">{options.margin} modules</span>
            </label>

            <div>
              <span className="mb-1 block text-sm font-medium text-slate-700">Style</span>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(STYLE_LABELS) as QrOptions["style"][]).map((s) => (
                  <Pill key={s} active={options.style === s} onClick={() => setOpt("style", s)}>
                    {STYLE_LABELS[s]}
                  </Pill>
                ))}
              </div>
            </div>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Foreground</span>
              <span className="flex items-center gap-2">
                <input
                  type="color"
                  value={colorToHex(options.fg)}
                  onChange={(e) => setOpt("fg", e.target.value)}
                  className="h-9 w-12 cursor-pointer rounded border border-slate-200"
                />
                <span className="font-mono text-xs text-slate-500">{options.fg}</span>
              </span>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Background</span>
              <span className="flex items-center gap-2">
                <input
                  type="color"
                  value={colorToHex(options.bg)}
                  onChange={(e) => setOpt("bg", e.target.value)}
                  className="h-9 w-12 cursor-pointer rounded border border-slate-200"
                />
                <span className="font-mono text-xs text-slate-500">{options.bg}</span>
              </span>
            </label>
          </div>

          {/* Logo */}
          <div className="mt-5 border-t border-slate-100 pt-4">
            <span className="mb-2 block text-sm font-medium text-slate-700">Logo</span>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200">
                Upload image
                <input type="file" accept="image/*" className="hidden" onChange={(e) => onLogo(e.target.files?.[0])} />
              </label>
              {options.logo && (
                <>
                  <button
                    type="button"
                    onClick={() => onLogo(undefined)}
                    className="rounded-lg bg-red-100 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-200"
                  >
                    Remove
                  </button>
                  <img src={options.logo} alt="logo preview" className="h-9 w-9 rounded object-contain ring-1 ring-slate-200" />
                </>
              )}
            </div>
            <label className="mt-3 block">
              <span className="mb-1 flex items-center justify-between text-sm font-medium text-slate-700">
                Logo size <span className="text-xs text-slate-500">{Math.round(options.logoScale * 100)}%</span>
              </span>
              <input
                type="range"
                min={0.08}
                max={0.35}
                step={0.01}
                value={options.logoScale}
                onChange={(e) => setOpt("logoScale", Number(e.target.value))}
                className="w-full"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Right: preview + actions */}
      <div className="lg:sticky lg:top-20 lg:self-start">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Preview</h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> 100% private
            </span>
          </div>

          <div className="qr-checkerboard mx-auto flex max-w-[360px] items-center justify-center rounded-xl border border-slate-200 p-3">
            <canvas
              ref={canvasRef}
              width={options.size}
              height={options.size}
              className="h-auto w-full rounded-md shadow-sm"
              style={{ imageRendering: "auto" }}
            />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button onClick={() => doExport("png")} className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700">
              PNG
            </button>
            <button onClick={() => doExport("jpg")} className="rounded-lg bg-slate-800 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-900">
              JPG
            </button>
            <button onClick={() => doExport("svg")} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700">
              SVG
            </button>
            <button onClick={() => doExport("pdf")} className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-700">
              PDF
            </button>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              onClick={saveHistory}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              💾 Save to history
            </button>
            <button
              onClick={saveAsTemplate}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              🎨 Save template
            </button>
          </div>

          <p className="mt-3 text-center text-xs text-slate-400">
            Codes are generated locally — nothing you scan or create is uploaded.
          </p>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

function colorToHex(color: string): string {
  const c = color.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(c) || /^#[0-9a-fA-F]{3}$/.test(c)) return c;
  // Transparent/theme colors fall back to safe defaults for the picker.
  return "#000000";
}

export { TYPE_META };
