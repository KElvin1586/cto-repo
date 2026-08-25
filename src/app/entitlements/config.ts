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
  // Connect your real checkout / license provider (e.g. a Stripe checkout URL or
  // license server) here. When empty, the app never shows a fake payment button
  // and instead explains that purchasing isn't wired up yet.
  upgradeUrl: "",
  /** See `preview` below. */
  previewPremiumEnabled: true,
};

// ---------------------------------------------------------------------------
// Commercial integration points (kept for easy wiring to a real payment/entitlement
// provider). These are just aliases into PLAN_CONFIG — change the single source of
// truth above and payouts / the Upgrade button follow automatically.
// ---------------------------------------------------------------------------

/** Where the "Upgrade to Premium" button sends users. Empty = no external checkout. */
export const UPGRADE_URL: string = PLAN_CONFIG.upgradeUrl;
/** The monthly Premium price, for display and future checkout. */
export const PREMIUM_PRICE: number = PLAN_CONFIG.plans.PREMIUM.price;
/** ISO currency code for the Premium price. */
export const PREMIUM_CURRENCY: Currency = PLAN_CONFIG.plans.PREMIUM.currency;

// ---------------------------------------------------------------------------
// Development / Test mode (NOT a purchase, NOT a license).
//
// previewPremiumEnabled grants premium locally so you can evaluate and test every
// feature without paying. It only flips local state — it never claims a payment
// occurred and never stores credentials.
//
// Production safety: the "Preview Premium" demo toggle and its entry points are
// hidden in a production build UNLESS previewPremiumEnabled is explicitly set to
// true. Set it to false before release once a real entitlement provider is wired up.
// ---------------------------------------------------------------------------

function isDevBuild(): boolean {
  try {
    return import.meta.env?.DEV === true;
  } catch {
    return false;
  }
}

/**
 * Whether the in-app "Preview Premium (development / test mode)" UI should render.
 * Hidden in production builds by default (see previewPremiumEnabled) to keep test
 * affordances out of a live release. A real purchase path never depends on this.
 */
export function previewVisible(): boolean {
  return PLAN_CONFIG.previewPremiumEnabled || isDevBuild();
}

/** Format a price for display, e.g. "$9.99". */
export function formatPrice(p: PricePlan): string {
  if (p.price === 0) return "$0";
  const sym = p.currency === "USD" ? "$" : p.currency === "EUR" ? "€" : "£";
  return `${sym}${p.price.toFixed(2)}`;
}
