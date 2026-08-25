import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { QR_TYPES, getSchema } from "~/app/qr/payloads";
import { exportJpg, exportPdf, exportPng, exportSvg } from "~/app/qr/export";
import { buildMatrix, renderToSvg } from "~/app/qr/render";
import { useLocalStorage, useQrRender, readFileAsDataUrl } from "~/app/hooks";
import { addHistory, saveTemplate } from "~/app/store";
import { DEFAULT_OPTIONS, type QrOptions, type QrType } from "~/app/types";
import { FieldGroup, Pill, useFieldDefaults } from "./Fields";
import { UpgradeModal, PremiumBadge } from "./UpgradeModal";
import {
  useFeatureAccess,
  qrTypeFeature,
  hasFeature,
  FEATURES,
} from "~/app/entitlements";
import type { FeatureId } from "~/app/entitlements";

// Free tier configuration — premium unlocks more.
const FREE_STYLES: QrOptions["style"][] = ["square"];
const PREMIUM_STYLES: QrOptions["style"][] = ["square", "rounded", "dots", "classy"];
const FREE_MAX_SIZE = 1024;

const TYPE_META: Record<QrType, { icon: string; label: string; feature: FeatureId }> = {
  url: { icon: "🔗", label: "URL", feature: "qr-url" },
  text: { icon: "📝", label: "Text", feature: "qr-text" },
  email: { icon: "✉️", label: "Email", feature: "qr-email" },
  phone: { icon: "📞", label: "Phone", feature: "qr-phone" },
  sms: { icon: "💬", label: "SMS", feature: "qr-sms" },
  wifi: { icon: "📶", label: "Wi-Fi", feature: "qr-wifi" },
  vcard: { icon: "👤", label: "VCard", feature: "qr-vcard" },
  location: { icon: "📍", label: "Location", feature: "qr-location" },
  event: { icon: "📅", label: "Event", feature: "qr-event" },
  whatsapp: { icon: "🟢", label: "WhatsApp", feature: "qr-whatsapp" },
};

const STYLE_LABELS: Record<QrOptions["style"], string> = {
  square: "Square",
  rounded: "Rounded",
  dots: "Dots",
  classy: "Classy",
};

const AVAILABLE_STYLES = (premium: boolean): QrOptions["style"][] =>
  premium ? PREMIUM_STYLES : FREE_STYLES;

export function Generator({ type, onChangeType }: { type: QrType; onChangeType: (t: QrType) => void }) {
  const { plan, premium, can } = useFeatureAccess();
  const [options, setOptions] = useLocalStorage<QrOptions>("qr-studio:options", DEFAULT_OPTIONS);
  const defaults = useFieldDefaults(type);
  const [values, setValues] = useState<Record<string, string>>(defaults);
  const [toast, setToast] = useState<string | null>(null);
  const [locked, setLocked] = useState<FeatureId | null>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => setValues(defaults), [defaults]);

  const schema = getSchema(type);
  const content = useMemo(() => schema.build(values), [schema, values]);
  const label = useMemo(() => schema.summarize(values) || "qr-code", [schema, values]);

  const maxSize = premium ? 2048 : FREE_MAX_SIZE;
  // Effective options enforce the tier for rendering/export (no logic bypass).
  const effectiveOptions: QrOptions = useMemo(() => {
    const style = premium ? options.style : "square";
    return { ...options, style, size: Math.min(options.size, maxSize) };
  }, [options, premium, maxSize]);

  const { canvasRef } = useQrRender(content || " ", effectiveOptions);

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

  const requestFeature = (feature: FeatureId) => {
    if (can(feature)) return true;
    setLocked(feature);
    return false;
  };
  const closeModal = () => setLocked(null);

  const selectType = (t: QrType) => {
    const f = qrTypeFeature(t);
    if (!requestFeature(f)) return;
    onChangeType(t);
  };

  const onLogo = async (file?: File) => {
    if (!requestFeature("logo")) return;
    if (!file) {
      setOpt("logo", undefined);
      return;
    }
    const dataUrl = await readFileAsDataUrl(file);
    setOpt("logo", dataUrl);
  };

  const doExport = useCallback(
    async (format: "png" | "jpg" | "svg" | "pdf") => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      if (format === "svg" && !requestFeature("export-svg")) return;
      if (format === "pdf" && !requestFeature("export-pdf")) return;
      const safe = label.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-|-$/g, "") || "qr-code";
      if (format === "png") exportPng(canvas, safe);
      else if (format === "jpg") exportJpg(canvas, safe);
      else if (format === "svg") {
        const matrix = buildMatrix(content || " ", effectiveOptions.ecc, effectiveOptions.margin);
        exportSvg(renderToSvg(matrix, effectiveOptions), safe);
      } else await exportPdf(canvas, safe);
      notify(`Downloaded ${format.toUpperCase()}`);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canvasRef, label, content, effectiveOptions],
  );

  useEffect(() => {
    if (effectiveOptions.logo && effectiveOptions.ecc !== "H") {
      setOptions((prev) => ({ ...prev, ecc: "H" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveOptions.logo]);

  const saveHistory = async () => {
    if (!requestFeature("history")) return;
    await addHistory({ type, label, content, options: effectiveOptions });
    notify("Saved to history");
  };

  const saveAsTemplate = () => {
    if (!requestFeature("templates")) return;
    const name = window.prompt("Name this template:", `${TYPE_META[type].label} preset`);
    if (!name) return;
    saveTemplate(name, effectiveOptions);
    notify("Template saved");
  };

  const selectStyle = (s: QrOptions["style"]) => {
    if (s === "square") {
      setOpt("style", "square");
      return;
    }
    if (!requestFeature("style-advanced")) return;
    setOpt("style", s);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
      {/* Left: editor */}
      <div className="space-y-6">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">QR type</p>
          <div className="flex flex-wrap gap-2">
            {QR_TYPES.map((t) => {
              const f = qrTypeFeature(t);
              const lockedNow = !hasFeature(plan, f);
              return (
                <Pill key={t} active={t === type} onClick={() => selectType(t)}>
                  <span className="mr-1">{TYPE_META[t].icon}</span>
                  {TYPE_META[t].label}
                  {lockedNow && <span className="ml-1 text-[10px]">🔒</span>}
                </Pill>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">{schema.title}</h2>
            {!premium && <PremiumBadge />}
          </div>
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
              <span className="mb-1 flex items-center justify-between text-sm font-medium text-slate-700">
                Size
                {!premium && (
                  <span className="text-[10px] font-semibold uppercase text-slate-400">
                    up to {FREE_MAX_SIZE}px · <PremiumLink onClick={() => requestFeature("export-highres")}>high-res 🔒</PremiumLink>
                  </span>
                )}
              </span>
              <input
                type="range"
                min={256}
                max={maxSize}
                step={128}
                value={Math.min(options.size, maxSize)}
                onChange={(e) => setOpt("size", Number(e.target.value))}
                className="w-full"
              />
              <span className="text-xs text-slate-500">{Math.min(options.size, maxSize)} px</span>
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
              <span className="mb-1 flex items-center justify-between text-sm font-medium text-slate-700">
                Style
                {!premium && <PremiumLink onClick={() => requestFeature("style-advanced")} label="more styles" />}
              </span>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_STYLES(premium).map((s) => (
                  <Pill key={s} active={effectiveOptions.style === s} onClick={() => selectStyle(s)}>
                    {STYLE_LABELS[s]}
                  </Pill>
                ))}
                {!premium && (
                  <span
                    onClick={() => requestFeature("style-advanced")}
                    className="cursor-pointer rounded-full px-3 py-1.5 text-sm font-medium text-slate-400 ring-1 ring-dashed ring-slate-300 hover:bg-slate-50"
                  >
                    Rounded · Dots · Classy 🔒
                  </span>
                )}
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
            <span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
              Logo {!premium && <PremiumBadge />}
            </span>
            <div className="flex items-center gap-3">
              <label
                onClick={(e) => {
                  if (!premium) {
                    e.preventDefault();
                    requestFeature("logo");
                  }
                }}
                className={`cursor-pointer rounded-lg px-3 py-2 text-sm font-medium transition ${
                  premium ? "bg-slate-100 text-slate-700 hover:bg-slate-200" : "bg-slate-100 text-slate-400"
                }`}
              >
                Upload image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={!premium}
                  onChange={(e) => onLogo(e.target.files?.[0])}
                />
              </label>
              {effectiveOptions.logo && (
                <>
                  <button
                    type="button"
                    onClick={() => onLogo(undefined)}
                    className="rounded-lg bg-red-100 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-200"
                  >
                    Remove
                  </button>
                  <img src={effectiveOptions.logo} alt="logo preview" className="h-9 w-9 rounded object-contain ring-1 ring-slate-200" />
                </>
              )}
            </div>
            {premium && effectiveOptions.logo && (
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
            )}
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
              width={effectiveOptions.size}
              height={effectiveOptions.size}
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
            <button
              onClick={() => doExport("svg")}
              className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              SVG {!premium && "🔒"}
            </button>
            <button
              onClick={() => doExport("pdf")}
              className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
            >
              PDF {!premium && "🔒"}
            </button>
          </div>
          {!premium && (
            <p className="mt-2 text-center text-xs text-slate-400">
              SVG, PDF and high-res (over {FREE_MAX_SIZE}px) are Premium.
            </p>
          )}

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              onClick={saveHistory}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                premium ? "border-slate-300 text-slate-700 hover:bg-slate-50" : "border-slate-200 text-slate-400"
              }`}
            >
              💾 History {!premium && "🔒"}
            </button>
            <button
              onClick={saveAsTemplate}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                premium ? "border-slate-300 text-slate-700 hover:bg-slate-50" : "border-slate-200 text-slate-400"
              }`}
            >
              🎨 Template {!premium && "🔒"}
            </button>
          </div>

          {!premium && (
            <button
              onClick={() => requestFeature("export-svg")}
              className="mt-3 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:from-indigo-700 hover:to-fuchsia-700"
            >
              Upgrade — unlock all features
            </button>
          )}

          <p className="mt-3 text-center text-xs text-slate-400">
            Codes are generated locally — nothing you scan or create is uploaded.
          </p>
        </div>
      </div>

      {locked && (
        <UpgradeModal
          open={true}
          feature={locked}
          onClose={closeModal}
          title={FEATURES[locked].label}
          message={FEATURES[locked].pitch}
        />
      )}

      {toast && (
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

/** Inline premium upgrade link. */
function PremiumLink({ label, onClick, children }: { label?: string; onClick: () => void; children?: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-[10px] font-semibold uppercase tracking-wide text-amber-600 hover:underline"
    >
      {children ?? label ?? "Premium"} 🔒
    </button>
  );
}

// Pill does not accept a `disabled` prop; the click guard lives in selectType().

function colorToHex(color: string): string {
  const c = color.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(c) || /^#[0-9a-fA-F]{3}$/.test(c)) return c;
  return "#000000";
}

export { TYPE_META };
