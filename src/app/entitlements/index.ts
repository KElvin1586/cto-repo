// Centralized entitlement system.
//
// Single source of truth for what each plan may do. Every premium feature is
// registered here with an id, a human label (for the lock badge), which plan is
// required, and a short "why premium" description used by the Upgrade modal.
//
// All enforcement goes through `requireFeature()` / `useFeatureAccess()`:
//   - The UI shows 🔒 PREMIUM badges and an Upgrade button.
//   - The underlying action is never executed for a feature the user lacks.
//
// Plan state is stored locally (remote entitlement can be layered on later via
// `setPlan()`). There is deliberately NO fake payment or fake license validation:
// premium is granted through `setPlan("PREMIUM")`, which a real checkout/license
// provider would call after verifying entitlement.

import { useEffect, useState } from "react";
import { PLAN_CONFIG } from "./config";
import type { PlanConfig } from "./config";
import type { QrType } from "~/app/types";

export type Plan = "FREE" | "PREMIUM";

/** Every feature id in the system — kept as an explicit union to avoid circular types. */
export type FeatureId =
  | "qr-url"
  | "qr-text"
  | "qr-wifi"
  | "qr-vcard"
  | "qr-email"
  | "qr-phone"
  | "qr-sms"
  | "qr-whatsapp"
  | "qr-event"
  | "qr-location"
  | "export-svg"
  | "export-pdf"
  | "export-highres"
  | "logo"
  | "style-advanced"
  | "history"
  | "templates"
  | "batch";

export interface FeatureDef {
  id: FeatureId;
  /** Label shown on the 🔒 PREMIUM badge / lock. */
  label: string;
  /** Required plan to use this feature. */
  required: Plan;
  /** Short explanation used in the Upgrade modal. */
  pitch: string;
}

export const FEATURES: Record<FeatureId, FeatureDef> = {
  "qr-url": { id: "qr-url", label: "URL QR", required: "FREE", pitch: "Link a website." },
  "qr-text": { id: "qr-text", label: "Text QR", required: "FREE", pitch: "Encode plain text." },
  "qr-wifi": { id: "qr-wifi", label: "Wi-Fi QR", required: "PREMIUM", pitch: "Let guests connect to Wi-Fi with a single scan." },
  "qr-vcard": { id: "qr-vcard", label: "VCard QR", required: "PREMIUM", pitch: "Share a full contact that saves straight to the address book." },
  "qr-email": { id: "qr-email", label: "Email QR", required: "PREMIUM", pitch: "Pre-fill an email to your inbox." },
  "qr-phone": { id: "qr-phone", label: "Phone QR", required: "PREMIUM", pitch: "Let people call you with one scan." },
  "qr-sms": { id: "qr-sms", label: "SMS QR", required: "PREMIUM", pitch: "Draft a text message to a number." },
  "qr-whatsapp": { id: "qr-whatsapp", label: "WhatsApp QR", required: "PREMIUM", pitch: "Start a WhatsApp chat with a message ready." },
  "qr-event": { id: "qr-event", label: "Event QR", required: "PREMIUM", pitch: "Add a calendar event with one tap." },
  "qr-location": { id: "qr-location", label: "Location QR", required: "PREMIUM", pitch: "Open a map pin at exact coordinates." },
  "export-svg": { id: "export-svg", label: "SVG export", required: "PREMIUM", pitch: "Vector, infinitely scalable codes for print and design." },
  "export-pdf": { id: "export-pdf", label: "Print-ready PDF", required: "PREMIUM", pitch: "A print-ready A4 page for physical materials." },
  "export-highres": { id: "export-highres", label: "High-resolution PNG", required: "PREMIUM", pitch: "Sharp, high-resolution PNG for large-format output." },
  logo: { id: "logo", label: "Logo & image", required: "PREMIUM", pitch: "Embed your logo inside the QR code." },
  "style-advanced": { id: "style-advanced", label: "Advanced styling", required: "PREMIUM", pitch: "Rounded, Dots and Classy corner styles." },
  history: { id: "history", label: "QR history", required: "PREMIUM", pitch: "Re-open and re-download codes you've made." },
  templates: { id: "templates", label: "Saved templates", required: "PREMIUM", pitch: "Reuse your branded designs instantly." },
  batch: { id: "batch", label: "Batch generation", required: "PREMIUM", pitch: "Generate hundreds of codes from a CSV in one ZIP." },
};

export const FREE_FEATURE_IDS: FeatureId[] = (Object.values(FEATURES) as FeatureDef[])
  .filter((f) => f.required === "FREE")
  .map((f) => f.id);
export const PREMIUM_FEATURE_IDS: FeatureId[] = (Object.values(FEATURES) as FeatureDef[])
  .filter((f) => f.required === "PREMIUM")
  .map((f) => f.id);

// ---- Storage (local, client-side) ----

const PLAN_KEY = "qr-studio:plan";

export function getPlan(): Plan {
  if (typeof localStorage === "undefined") return PLAN_CONFIG.defaultPlan;
  try {
    const raw = localStorage.getItem(PLAN_KEY);
    if (raw === "PREMIUM" || raw === "FREE") return raw;
  } catch {
    /* ignore */
  }
  return PLAN_CONFIG.defaultPlan;
}

/**
 * Set the active plan. In this build this is local state only. A real
 * entitlement provider (checkout webhook, license server) should call this after
 * verifying the user is entitled — then premium needs no further changes.
 */
export function setPlan(plan: Plan): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(PLAN_KEY, plan);
    window.dispatchEvent(new CustomEvent("qrstudio:plan", { detail: plan }));
  } catch {
    /* ignore */
  }
}

/** Subscribe to plan changes. Returns an unsubscribe function. */
export function onPlanChange(cb: (plan: Plan) => void): () => void {
  const handler = (e: Event) => cb((e as CustomEvent<Plan>).detail);
  window.addEventListener("qrstudio:plan", handler);
  return () => window.removeEventListener("qrstudio:plan", handler);
}

/** React hook that returns the current plan and re-renders on change. */
export function usePlan(): Plan {
  const [plan, setPlanState] = useState<Plan>(() => getPlan());
  useEffect(() => onPlanChange((p) => setPlanState(p)), []);
  return plan;
}

// ---- Feature access rules (single enforcement point) ----

export function hasFeature(plan: Plan, feature: FeatureId): boolean {
  const def = FEATURES[feature];
  const rank: Record<Plan, number> = { FREE: 0, PREMIUM: 1 };
  return rank[plan] >= rank[def.required];
}

/** Throws if the given plan cannot use a feature. Prevents logic bypass. */
export function assertFeature(plan: Plan, feature: FeatureId): void {
  if (!hasFeature(plan, feature)) {
    throw new Error(`Feature "${feature}" requires ${FEATURES[feature].required}.`);
  }
}

export interface FeatureAccess {
  plan: Plan;
  premium: boolean;
  can: (feature: FeatureId) => boolean;
}

/** React hook exposing the current plan and a `can(feature)` helper. */
export function useFeatureAccess(): FeatureAccess {
  const plan = usePlan();
  return { plan, premium: plan === "PREMIUM", can: (f) => hasFeature(plan, f) };
}

export type { PlanConfig };
export { PLAN_CONFIG };

// ---- QR type → feature mapping ----

const QR_TYPE_FEATURE: Record<QrType, FeatureId> = {
  url: "qr-url",
  text: "qr-text",
  wifi: "qr-wifi",
  vcard: "qr-vcard",
  email: "qr-email",
  phone: "qr-phone",
  sms: "qr-sms",
  whatsapp: "qr-whatsapp",
  event: "qr-event",
  location: "qr-location",
};

/** The entitlement feature required to generate a given QR type. */
export function qrTypeFeature(type: QrType): FeatureId {
  return QR_TYPE_FEATURE[type];
} 
