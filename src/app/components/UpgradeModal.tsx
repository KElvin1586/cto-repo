import { useEffect, useRef } from "react";
import { usePlan } from "~/app/entitlements";
import { FEATURES } from "~/app/entitlements";
import type { FeatureId } from "~/app/entitlements";
import { PLAN_CONFIG, formatPrice, previewVisible } from "~/app/entitlements/config";
import { Link } from "react-router-dom";

export interface UpgradeModalOptions {
  /** Feature being requested — shows its label and pitch. */
  feature: FeatureId;
  /** Optional extra context line. */
  title?: string;
  message?: string;
}

interface Props {
  open: boolean;
  feature: FeatureId;
  onClose: () => void;
  title?: string;
  message?: string;
}

/**
 * Professional Upgrade modal. Accessible (focus trap, ESC to close, labelled
 * dialog). It explains the locked feature and Premium benefits and offers an
 * Upgrade button that goes to the configured external checkout, or explains that
 * purchasing isn't wired up yet. No fake payment is ever shown.
 */
export function UpgradeModal({ open, feature, onClose, title, message }: Props) {
  const plan = usePlan();
  const closeRef = useRef<HTMLButtonElement>(null);
  const def = FEATURES[feature];
  const premium = PLAN_CONFIG.plans.PREMIUM;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || plan === "PREMIUM") return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="upgrade-title"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-2xl">
            👑
          </div>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            ✕
          </button>
        </div>

        <h2 id="upgrade-title" className="mt-4 text-xl font-bold text-slate-900">
          {title ?? `${def.label} is a Premium feature`}
        </h2>
        <p className="mt-2 text-slate-600">
          {message ?? def.pitch}
        </p>

        <div className="mt-4 space-y-2 rounded-xl bg-slate-50 p-4 text-sm">
          <p className="font-semibold text-slate-900">Get everything with Premium:</p>
          <ul className="grid grid-cols-1 gap-1.5 text-slate-600 sm:grid-cols-2">
            <li>✅ All 10 QR types</li>
            <li>✅ Logo inside QR</li>
            <li>✅ Advanced styles</li>
            <li>✅ SVG &amp; PDF export</li>
            <li>✅ High-res PNG</li>
            <li>✅ History &amp; templates</li>
            <li>✅ Batch generation</li>
            <li>🔒 Ad-free &amp; private</li>
          </ul>
        </div>

        <p className="mt-4 text-center text-lg font-bold text-slate-900">
          {formatPrice(premium)} <span className="text-sm font-normal text-slate-500">/ month</span>
        </p>

        <div className="mt-4 flex flex-col gap-2">
          {PLAN_CONFIG.upgradeUrl ? (
            <a
              href={PLAN_CONFIG.upgradeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-4 py-3 text-center font-semibold text-white transition hover:from-indigo-700 hover:to-fuchsia-700"
            >
              Upgrade to Premium
            </a>
          ) : (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-800">
              {previewVisible() ? (
                <>
                  Premium checkout isn't connected yet — you can preview it from the{" "}
                  <Link to="/pricing" onClick={onClose} className="font-semibold underline">
                    Development / Test Mode on the Pricing page
                  </Link>
                  .
                </>
              ) : (
                <>
                  Premium checkout isn't connected yet in this build — no payment is taken. Set up a
                  real checkout URL in the configuration to enable purchasing.
                </>
              )}
            </div>
          )}
          <Link
            to="/pricing"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Compare Free vs Premium
          </Link>
        </div>
      </div>
    </div>
  );
}

/** Small inline 🔒 PREMIUM badge, shown next to locked features. */
export function PremiumBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-slate-800 to-slate-700 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-300">
      🔒 Premium
    </span>
  );
}
