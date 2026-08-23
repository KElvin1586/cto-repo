// Local persistence: history in IndexedDB, design templates in localStorage.
// Everything stays on-device — nothing is ever sent to a server.

import type { HistoryEntry, Template } from "~/app/types";

const DB_NAME = "qr-studio";
const DB_VERSION = 1;
const HISTORY_STORE = "history";
const MAX_HISTORY = 100;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(HISTORY_STORE)) {
        db.createObjectStore(HISTORY_STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(
  db: IDBDatabase,
  store: string,
  mode: IDBTransactionMode,
  run: (s: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, mode);
    const req = run(t.objectStore(store));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function makeId() {
  return crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export async function addHistory(entry: Omit<HistoryEntry, "id" | "createdAt">): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  const db = await openDb();
  const full: HistoryEntry = { ...entry, id: makeId(), createdAt: Date.now() };
  await tx(db, HISTORY_STORE, "readwrite", (s) => s.put(full));
  await trimHistory(db);
  db.close();
}

async function trimHistory(db: IDBDatabase) {
  const all = await tx(db, HISTORY_STORE, "readonly", (s) => s.getAll() as IDBRequest<HistoryEntry[]>);
  if (all.length > MAX_HISTORY) {
    const sorted = all.sort((a, b) => b.createdAt - a.createdAt);
    const toDelete = sorted.slice(MAX_HISTORY);
    const t = db.transaction(HISTORY_STORE, "readwrite");
    const s = t.objectStore(HISTORY_STORE);
    toDelete.forEach((e) => s.delete(e.id));
  }
}

export async function getHistory(): Promise<HistoryEntry[]> {
  if (typeof indexedDB === "undefined") return [];
  const db = await openDb();
  const all = await tx(db, HISTORY_STORE, "readonly", (s) => s.getAll() as IDBRequest<HistoryEntry[]>);
  db.close();
  return all.sort((a, b) => b.createdAt - a.createdAt);
}

export async function deleteHistory(id: string): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  const db = await openDb();
  await tx(db, HISTORY_STORE, "readwrite", (s) => s.delete(id));
  db.close();
}

export async function clearHistory(): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  const db = await openDb();
  await tx(db, HISTORY_STORE, "readwrite", (s) => s.clear());
  db.close();
}

// ---------- Templates (localStorage) ----------

const TEMPLATE_KEY = "qr-studio:templates";

export function getTemplates(): Template[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(TEMPLATE_KEY);
    const list = raw ? (JSON.parse(raw) as Template[]) : [];
    return Array.isArray(list) ? list.sort((a, b) => b.createdAt - a.createdAt) : [];
  } catch {
    return [];
  }
}

export function saveTemplate(name: string, options: Template["options"]): Template {
  const tpl: Template = { id: makeId(), name, createdAt: Date.now(), options };
  const list = getTemplates();
  list.push(tpl);
  localStorage.setItem(TEMPLATE_KEY, JSON.stringify(list.slice(0, 100)));
  return tpl;
}

export function deleteTemplate(id: string): void {
  const list = getTemplates().filter((t) => t.id !== id);
  localStorage.setItem(TEMPLATE_KEY, JSON.stringify(list));
}
