import { Link } from "react-router-dom";
import { usePlan, setPlan, FEATURES, hasFeature } from "~/app/entitlements";
import type { FeatureId } from "~/app/entitlements";
import { PLAN_CONFIG, formatPrice, previewVisible } from "~/app/entitlements/config";
import { useSeo } from "~/app/hooks";

const trackFeatures: FeatureId[] = [
  "qr-url",
  "qr-text",
  "qr-wifi",
  "qr-vcard",
  "qr-email",
  "qr-phone",
  "qr-sms",
  "qr-whatsapp",
  "qr-event",
  "qr-location",
  "export-svg",
  "export-pdf",
  "export-highres",
  "logo",
  "style-advanced",
  "history",
  "templates",
  "batch",
];

export function PricingPage() {
  useSeo(
    "Pricing — QR Studio",
    "QR Studio is free to use for URL and Text codes with PNG export. Premium unlocks all 10 QR types, logos, advanced styles, SVG/PDF export, history, templates and batch generation.",
  );
  const plan = usePlan();
  const free = PLAN_CONFIG.plans.FREE;
  const premium = PLAN_CONFIG.plans.PREMIUM;

  const togglePreview = () => {
    setPlan(plan === "PREMIUM" ? "FREE" : "PREMIUM");
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <section className="text-center">
        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-700">
          Pricing
        </span>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900">
          Private by default. Free to start.
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-lg text-slate-600">
          Every QR code is generated on your device. Nothing leaves your browser.
          Upgrade only for the advanced types and tools.
        </p>
      </section>

      {/* Plan cards */}
      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Free</h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">Current</span>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-slate-900">{formatPrice(free)}</p>
          <p className="mt-1 text-sm text-slate-500">No account required · works offline</p>
          <Link
            to="/"
            className="mt-5 block rounded-xl border border-slate-300 px-4 py-2.5 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Start for free
          </Link>
        </div>

        <div className="rounded-2xl border-2 border-indigo-500 bg-gradient-to-b from-indigo-50 to-white p-7 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Premium</h2>
            <span className="rounded-full bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-3 py-1 text-xs font-semibold text-white">
              👑 Best value
            </span>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-slate-900">
            {formatPrice(premium)} <span className="text-base font-normal text-slate-500">/ month</span>
          </p>
          <p className="mt-1 text-sm text-slate-500">Everything in Free, plus all advanced features</p>
          <div className="mt-5">
            {PLAN_CONFIG.upgradeUrl ? (
              <a
                href={PLAN_CONFIG.upgradeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:from-indigo-700 hover:to-fuchsia-700"
              >
                Upgrade to Premium
              </a>
            ) : (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-center text-sm text-amber-800">
                Checkout not connected yet — no payment is taken on this build.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Preview premium toggle (DEVELOPMENT / TEST MODE only — never a purchase) */}
      {previewVisible() && (
        <section className="mt-8 rounded-2xl border border-dashed border-amber-300 bg-amber-50/50 p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-slate-900">
                ⚠️ Development / Test Mode — Preview Premium
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Flip this switch to unlock every feature locally for evaluation. This is{" "}
                <strong>not a purchase</strong> and not a license — no payment is processed and it
                only changes state on this device. Hidden in a production release.
              </p>
            </div>
            <button
              onClick={togglePreview}
              aria-pressed={plan === "PREMIUM"}
              className={`rounded-xl px-5 py-2.5 font-semibold transition ${
                plan === "PREMIUM"
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {plan === "PREMIUM" ? "Premium active (click to reset to Free)" : "Activate Premium preview"}
            </button>
          </div>
          {plan === "PREMIUM" && (
            <p className="mt-3 text-xs text-slate-500">
              You are in Premium test mode. Everything is unlocked on this device for evaluation.
              This does not grant a license and no payment has been taken.
            </p>
          )}
        </section>
      )}

      {/* Comparison table */}
      <section className="mt-10">
        <h2 className="text-2xl font-bold text-slate-900">What's included</h2>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[520px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <th className="px-4 py-3 font-semibold">Feature</th>
                <th className="px-4 py-3 text-center font-semibold">Free</th>
                <th className="px-4 py-3 text-center font-semibold">Premium</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {trackFeatures.map((id) => {
                const f = FEATURES[id];
                const freeOk = hasFeature("FREE", id);
                return (
                  <tr key={id} className={f.required === "PREMIUM" ? "bg-indigo-50/40" : ""}>
                    <td className="px-4 py-2.5 font-medium text-slate-800">{f.label}</td>
                    <td className="px-4 py-2.5 text-center">
                      {freeOk ? <span className="text-emerald-600">✓</span> : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span className="text-emerald-600">✓</span>
                    </td>
                  </tr>
                );
              })}
              <tr>
                <td className="px-4 py-2.5 font-medium text-slate-800">100% private, no uploads</td>
                <td className="px-4 py-2.5 text-center text-emerald-600">✓</td>
                <td className="px-4 py-2.5 text-center text-emerald-600">✓</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-medium text-slate-800">Offline PWA</td>
                <td className="px-4 py-2.5 text-center text-emerald-600">✓</td>
                <td className="px-4 py-2.5 text-center text-emerald-600">✓</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-slate-400">
          No payment is processed in this application. Premium is granted by an external
          checkout/license provider, which this build is configured to connect later.
        </p>
      </section>
    </div>
  );
}
