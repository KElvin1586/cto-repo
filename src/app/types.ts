// Shared type definitions for QR Studio.

export type QrType =
  | "url"
  | "text"
  | "email"
  | "phone"
  | "sms"
  | "wifi"
  | "vcard"
  | "location"
  | "event"
  | "whatsapp";

export type EccLevel = "L" | "M" | "Q" | "H";

export type QrStyle = "square" | "rounded" | "dots" | "classy";

export interface QrOptions {
  /** Total output size in pixels (width == height). */
  size: number;
  /** Error correction level. H is recommended when a logo is embedded. */
  ecc: EccLevel;
  /** Quiet-zone margin in modules (0..8). */
  margin: number;
  /** Foreground (module) color. */
  fg: string;
  /** Background color. */
  bg: string;
  /** Module / corner rendering style. */
  style: QrStyle;
  /** Logo image data URL, if any. */
  logo?: string;
  /** Logo size as a fraction of the QR width (0..0.4). Default 0.2. */
  logoScale: number;
  /** White ring padding around the logo, as a fraction of the QR width. */
  logoPadding: number;
}

export const DEFAULT_OPTIONS: QrOptions = {
  size: 1024,
  ecc: "M",
  margin: 4,
  fg: "#111827",
  bg: "#ffffff",
  style: "square",
  logoScale: 0.2,
  logoPadding: 0.03,
};

/** A single saved generation history entry. */
export interface HistoryEntry {
  id: string;
  createdAt: number;
  type: QrType;
  label: string;
  content: string;
  options: QrOptions;
}

/** A reusable design preset / template. */
export interface Template {
  id: string;
  name: string;
  createdAt: number;
  options: QrOptions;
}
