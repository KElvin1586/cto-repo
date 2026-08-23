// Builds the encoded QR payload string for each supported type, and describes the
// form fields needed to fill it in. Everything is deterministic and local.

import type { QrType } from "~/app/types";

export type FieldKind = "text" | "textarea" | "select" | "datetime" | "number" | "boolean";

export interface FieldDef {
  name: string;
  label: string;
  kind: FieldKind;
  placeholder?: string;
  required?: boolean;
  helper?: string;
  options?: { value: string; label: string }[];
}

export interface TypeSchema {
  type: QrType;
  title: string;
  tagline: string;
  description: string;
  /** Long-form description used on the SEO page for this type. */
  seoBody: string[];
  fields: FieldDef[];
  build: (values: Record<string, string>) => string;
  /** A short human label for the content, used in history. */
  summarize: (values: Record<string, string>) => string;
}

const escapeVCard = (s: string) =>
  s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

const schemas: Record<QrType, TypeSchema> = {
  url: {
    type: "url",
    title: "URL",
    tagline: "Link a website or deep link",
    description:
      "Point a scan straight at a web page. Add https:// for links, or use an app scheme for deep links.",
    seoBody: [
      "A URL QR code sends the scanner to a website, app or online resource the moment their camera reads it. It is the most common type of QR code and is perfect for menus, product pages, profiles, brochures and signage.",
      "Add the scheme (https://) for web links, or a custom scheme (such as facetime:// or tg://) for app deep links. QR Studio encodes your link exactly as typed and keeps it private — nothing is uploaded anywhere.",
    ],
    fields: [
      { name: "url", label: "URL", kind: "text", required: true, placeholder: "https://example.com" },
    ],
    build: (v) => v.url.trim(),
    summarize: (v) => v.url.trim(),
  },
  text: {
    type: "text",
    title: "Plain text",
    tagline: "Share any text or note",
    description: "Encode a short message, a promo code, a coupon or any plain text snippet.",
    seoBody: [
      "A text QR code stores a plain message that the reader displays on screen. Use it for short notes, discount codes, serial numbers, Wi-Fi instructions or anything that doesn't need to open an app.",
      "Keep text codes short for reliability — QR codes hold roughly 3,000 characters maximum, and less at high error-correction levels.",
    ],
    fields: [{ name: "text", label: "Text", kind: "textarea", required: true, placeholder: "Your message…" }],
    build: (v) => v.text,
    summarize: (v) => v.text.slice(0, 60),
  },
  email: {
    type: "email",
    title: "Email",
    tagline: "Open a pre-filled email draft",
    description: "Scanning opens the device email app with recipient, subject and body pre-filled.",
    seoBody: [
      "An email QR code opens the phone's mail app with the address, subject and body already filled in. It's ideal for lead capture, event RSVPs, feedback forms and support shortcuts on print materials.",
      "The code uses the mailto: scheme, so the recipient is always free to edit before sending — nothing is sent automatically.",
    ],
    fields: [
      { name: "email", label: "To (email)", kind: "text", required: true, placeholder: "hello@example.com" },
      { name: "subject", label: "Subject", kind: "text", placeholder: "Optional" },
      { name: "body", label: "Body", kind: "textarea", placeholder: "Optional message" },
    ],
    build: (v) => {
      const base = `mailto:${v.email.trim()}`;
      const qs = [] as string[];
      if (v.subject) qs.push(`subject=${encodeURIComponent(v.subject)}`);
      if (v.body) qs.push(`body=${encodeURIComponent(v.body)}`);
      return qs.length ? `${base}?${qs.join("&")}` : base;
    },
    summarize: (v) => v.email.trim(),
  },
  phone: {
    type: "phone",
    title: "Phone",
    tagline: "Start a call with one scan",
    description: "Tapping the scan dials the number straight away.",
    seoBody: [
      "A phone QR code stores a tel: link — scanning (or tapping the notification) calls the number directly. Add the country code with a leading + for maximum compatibility, e.g. +15551234567.",
      "Commonly used on business cards, storefront signs, vehicles and service stickers.",
    ],
    fields: [
      { name: "phone", label: "Phone number", kind: "text", required: true, placeholder: "+15551234567", helper: "Include country code for best compatibility." },
    ],
    build: (v) => `tel:${v.phone.replace(/[^\d+]/g, "")}`,
    summarize: (v) => v.phone.trim(),
  },
  sms: {
    type: "sms",
    title: "SMS",
    tagline: "Draft a text message",
    description: "Opens the messaging app with the number and message pre-filled.",
    seoBody: [
      "An SMS QR code drafts a text message to a chosen number using the smsto: scheme. The scanner reviews and sends it — nothing is transmitted automatically.",
      "Great for two-factor onboarding, 'text us your order' prompts and support shortcuts.",
    ],
    fields: [
      { name: "phone", label: "Number", kind: "text", required: true, placeholder: "+15551234567" },
      { name: "message", label: "Message", kind: "textarea", placeholder: "Pre-filled message (optional)" },
    ],
    build: (v) => `smsto:${v.phone.replace(/[^\d+]/g, "")}:${v.message}`,
    summarize: (v) => `SMS to ${v.phone.trim()}`,
  },
  wifi: {
    type: "wifi",
    title: "Wi-Fi",
    tagline: "One-tap secure network login",
    description: "Scanning connects the device to your network without typing the password.",
    seoBody: [
      "A Wi-Fi QR code lets guests join a network with a single scan — no password to type or share verbally. Works on iOS, Android and most modern devices natively.",
      "Choose WPA for secured networks, or nopass for open guest networks. QR Studio stores only the network details you enter, locally in your browser.",
    ],
    fields: [
      { name: "ssid", label: "Network name (SSID)", kind: "text", required: true, placeholder: "MyNetwork" },
      {
        name: "security",
        label: "Security",
        kind: "select",
        required: true,
        options: [
          { value: "WPA", label: "WPA / WPA2 / WPA3" },
          { value: "WEP", label: "WEP" },
          { value: "nopass", label: "Open (no password)" },
        ],
      },
      { name: "password", label: "Password", kind: "text", placeholder: "Network password" },
      { name: "hidden", label: "Hidden network", kind: "boolean" },
    ],
    build: (v) => {
      const sec = v.security || "WPA";
      const hidden = v.hidden === "on" || v.hidden === "true";
      let out = `WIFI:T:${sec};S:${v.ssid};`;
      if (sec !== "nopass") out += `P:${v.password};`;
      if (hidden) out += "H:true;";
      return out + ";";
    },
    summarize: (v) => `Wi-Fi ${v.ssid.trim()}`,
  },
  vcard: {
    type: "vcard",
    title: "VCard",
    tagline: "Save contact details as a card",
    description: "Adds the person or business straight to the scanner's contacts.",
    seoBody: [
      "A VCard QR code carries a contact as a standard vCard 3.0 file. Scanning it offers to add the contact to the device's address book — name, organization, phone, email, website, address and notes in one.",
      "It's the go-to for business cards, name badges, real-estate signs and event networking.",
    ],
    fields: [
      { name: "firstName", label: "First name", kind: "text", required: true },
      { name: "lastName", label: "Last name", kind: "text" },
      { name: "org", label: "Organization", kind: "text" },
      { name: "title", label: "Job title", kind: "text" },
      { name: "phone", label: "Phone", kind: "text", placeholder: "+15551234567" },
      { name: "mobile", label: "Mobile", kind: "text", placeholder: "+15559876543" },
      { name: "email", label: "Email", kind: "text", placeholder: "name@company.com" },
      { name: "website", label: "Website", kind: "text", placeholder: "https://example.com" },
      { name: "address", label: "Address", kind: "textarea", placeholder: "Street, City, ZIP" },
      { name: "note", label: "Note", kind: "textarea" },
    ],
    build: (v) => {
      const lines = ["BEGIN:VCARD", "VERSION:3.0"];
      const fn = `${v.firstName} ${v.lastName}`.trim();
      if (fn) lines.push(`FN:${escapeVCard(fn)}`);
      if (v.firstName) lines.push(`N:${escapeVCard(v.lastName || "")};${escapeVCard(v.firstName)};;;`);
      if (v.org) lines.push(`ORG:${escapeVCard(v.org)}`);
      if (v.title) lines.push(`TITLE:${escapeVCard(v.title)}`);
      if (v.phone) lines.push(`TEL;TYPE=WORK,VOICE:${escapeVCard(v.phone)}`);
      if (v.mobile) lines.push(`TEL;TYPE=CELL,VOICE:${escapeVCard(v.mobile)}`);
      if (v.email) lines.push(`EMAIL:${escapeVCard(v.email)}`);
      if (v.website) lines.push(`URL:${escapeVCard(v.website)}`);
      const addr = v.address.trim().replace(/\n/g, ",");
      if (addr) {
        const parts = [addr].map(escapeVCard);
        lines.push(`ADR;TYPE=WORK:;;${parts.join(";")};;;;`);
      }
      if (v.note) lines.push(`NOTE:${escapeVCard(v.note)}`);
      lines.push("END:VCARD");
      return lines.join("\n");
    },
    summarize: (v) =>
      `${v.firstName.trim()} ${v.lastName.trim()}`.trim() || "VCard contact",
  },
  location: {
    type: "location",
    title: "Location",
    tagline: "Open a map pin",
    description: "Scanning opens the device maps app at the exact coordinates.",
    seoBody: [
      "A location QR code encodes latitude and longitude with the geo: scheme, opening the phone's map app pinned at that spot. Add a label to suggest a point of interest on some readers.",
      "Use it for event venues, parking, delivery pickup points, store finders and directions on flyers.",
    ],
    fields: [
      { name: "latitude", label: "Latitude", kind: "number", required: true, placeholder: "40.7128" },
      { name: "longitude", label: "Longitude", kind: "number", required: true, placeholder: "-74.0060" },
      { name: "label", label: "Label (optional)", kind: "text", placeholder: "Statue of Liberty" },
    ],
    build: (v) => {
      const base = `geo:${v.latitude.trim()},${v.longitude.trim()}`;
      return v.label ? `${base}?q=${encodeURIComponent(v.label)}` : base;
    },
    summarize: (v) => `Location ${v.latitude.trim()}, ${v.longitude.trim()}`,
  },
  event: {
    type: "event",
    title: "Event",
    tagline: "Add a calendar appointment",
    description: "Saves the event to the scanner's calendar with one tap.",
    seoBody: [
      "An event QR code carries a calendar invite in the iCalendar format. Scanning it can add the event to the device calendar with title, time, location and description ready to go.",
      "Perfect for workshops, meetings, ticket confirmation, store events and webinars on posters and email footers.",
    ],
    fields: [
      { name: "title", label: "Event title", kind: "text", required: true },
      { name: "start", label: "Start", kind: "datetime", required: true },
      { name: "end", label: "End", kind: "datetime" },
      { name: "location", label: "Location", kind: "text" },
      { name: "description", label: "Description", kind: "textarea" },
    ],
    build: (v) => {
      const toIcal = (iso: string) => {
        const d = new Date(iso);
        const p = (n: number) => String(n).padStart(2, "0");
        return `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}T${p(
          d.getUTCHours(),
        )}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}Z`;
      };
      const lines = [
        "BEGIN:VEVENT",
        "VERSION:2.0",
        "PRODID:-//QR Studio//EN",
        `UID:${Date.now()}@qrstudio`,
        `DTSTAMP:${toIcal(new Date().toISOString())}`,
      ];
      if (v.title) lines.push(`SUMMARY:${escapeVCard(v.title)}`);
      if (v.start) lines.push(`DTSTART:${toIcal(v.start)}`);
      if (v.end) lines.push(`DTEND:${toIcal(v.end)}`);
      if (v.location) lines.push(`LOCATION:${escapeVCard(v.location)}`);
      if (v.description) lines.push(`DESCRIPTION:${escapeVCard(v.description)}`);
      lines.push("END:VEVENT");
      return lines.join("\n");
    },
    summarize: (v) => v.title.trim() || "Event",
  },
  whatsapp: {
    type: "whatsapp",
    title: "WhatsApp",
    tagline: "Open a chat with a typed message",
    description: "Starts a WhatsApp conversation with the message already drafted.",
    seoBody: [
      "A WhatsApp QR code opens a WhatsApp chat with a chosen number and pre-fills a message. The recipient must have WhatsApp and the number active; scanning simply opens wa.me.",
      "Handy for order enquiries, quotes, bookings and customer support on menus and adverts.",
    ],
    fields: [
      { name: "phone", label: "Phone (with country code)", kind: "text", required: true, placeholder: "15551234567", helper: "Digits only, no +, no spaces. Example: 15551234567" },
      { name: "message", label: "Pre-filled message", kind: "textarea", placeholder: "Hi, I'd like to…" },
    ],
    build: (v) => {
      const digits = v.phone.replace(/\D/g, "");
      const url = `https://wa.me/${digits}`;
      return v.message ? `${url}?text=${encodeURIComponent(v.message)}` : url;
    },
    summarize: (v) => `WhatsApp ${v.phone.trim()}`,
  },
};

export function getSchema(type: QrType): TypeSchema {
  return schemas[type];
}

export const QR_TYPES = Object.keys(schemas) as QrType[];
export const SCHEMAS = schemas;
