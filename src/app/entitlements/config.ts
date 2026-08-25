// Centralized plan & pricing configuration.
//
// These values drive the Upgrade modal, the Pricing page and feature gating.
// They are intentionally configurable so a real checkout/license system can be
// connected later — see PLANS.upgradeUrl below. There is NO payment handling in
// this app: billing is assumed to happen externally (e.g. Stripe checkout /
// a license key provider). The app only reads plan entitlement state.

export type Currency = "USD" | "EUR" | "GBP";

export interface PricePlan {
  /** Human label shown in the UI. */
  label: string;
  /** Numeric price. 0 for free. */
  price: number;
  /** ISO currency code. */
  currency: Currency;
}

export interface PlanConfig {
  /** The plan shown to unauthenticated / default users. */
  defaultPlan: "FREE" | "PREMIUM";
  /** Price/currency for each plan. */
  plans: Record<"FREE" | "PREMIUM", PricePlan>;
  /**
   * Where users are taken when they click Upgrade.
   * Set to "" to hide external checkout — the Upgrade modal will then explain
   * that premium is not yet purchasable (no fake payments are shown).
   * Connect a real checkout/license flow here later.
   */
  upgradeUrl: string;
  /**
   * When true, users can enter a preview mode from the Pricing page that grants
   * premium locally, purely for evaluating features. This is NOT a purchase and
   * NOT a license grant — it only flips local state so the owner can test.
   * Disable this in production once a real entitlement provider is connected.
   */
  previewPremiumEnabled: boolean;
}

export const PLAN_CONFIG: PlanConfig = {
  defaultPlan: "FREE",
  plans: {
    FREE: { label: "Free", price: 0, currency: "USD" },
    PREMIUM: { label: "Premium", price: 9.99, currency: "USD" },
  },
  // Connect your real checkout / license provider here.
  upgradeUrl: "",
  previewPremiumEnabled: true,
};

/** Format a price for display, e.g. "$9.99". */
export function formatPrice(p: PricePlan): string {
  if (p.price === 0) return "$0";
  const sym = p.currency === "USD" ? "$" : p.currency === "EUR" ? "€" : "£";
  return `${sym}${p.price.toFixed(2)}`;
}
