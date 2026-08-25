import { Link } from "react-router-dom";
import { useFeatureAccess } from "~/app/entitlements";
import { FEATURES } from "~/app/entitlements";
import type { FeatureId } from "~/app/entitlements";

/**
 * Full-page premium gate. When the user lacks the feature it renders an
 * explanatory lock screen with an Upgrade action instead of the page content.
 */
export function PremiumGate({
  feature,
  title,
  children,
}: {
  feature: FeatureId;
  title?: string;
  children: React.ReactNode;
}) {
  const { can } = useFeatureAccess();
  if (can(feature)) return <>{children}</>;
  const def = FEATURES[feature];
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <p className="text-6xl">🔒</p>
      <h1 className="mt-4 text-3xl font-bold text-slate-900">{title ?? def.label} is a Premium feature</h1>
      <p className="mx-auto mt-3 max-w-md text-slate-600">{def.pitch}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          to="/pricing"
          className="rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-6 py-2.5 text-sm font-semibold text-white hover:from-indigo-700 hover:to-fuchsia-700"
        >
          Upgrade to Premium
        </Link>
        <Link to="/" className="rounded-xl border border-slate-300 px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          Create a free QR code
        </Link>
      </div>
    </div>
  );
}
