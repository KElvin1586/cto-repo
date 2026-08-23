// Batch QR generation: robust CSV parsing and bulk PNG export as a ZIP.
// All computation and file handling happens locally in the browser.

import JSZip from "jszip";
import { buildMatrix, renderToCanvas } from "~/app/qr/render";
import type { QrOptions } from "~/app/types";

export interface ParsedCsv {
  headers: string[];
  rows: string[][];
  errors: string[];
}

/** A tolerant CSV parser handling quotes, commas and newlines inside fields. */
export function parseCsv(csv: string): ParsedCsv {
  const errors: string[] = [];
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const text = csv.replace(/\r\n/g, "\n");

  const pushField = () => {
    row.push(field);
    field = "";
  };
  const pushRow = (_line: number) => {
    pushField();
    rows.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') {
        field += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      pushField();
    } else if ((ch === "\n") && !inQuotes) {
      pushRow(i);
    } else {
      field += ch;
    }
  }
  if (field !== "" || row.length) pushRow(text.length);

  if (rows.length === 0) {
    return { headers: [], rows: [], errors: ["The CSV file is empty."] };
  }

  let headers = rows[0].map((h) => h.trim()).filter(Boolean);
  let data = rows.slice(1);

  // If every row is short, the file may have no header — treat row 0 as data.
  const maxCols = Math.max(...data.map((r) => r.length), 0);
  if (!headers.length || maxCols < headers.length) {
    errors.push(
      "No clear header row was found — using generic column names. Provide a header row for best results.",
    );
    const code = Math.max(headers.length, maxCols);
    headers = Array.from({ length: code }, (_, i) => `col${i + 1}`);
    data = rows;
  }

  // Normalize ragged rows.
  const norm = data.map((r) => {
    const out = headers.map((_, j) => (r[j] === undefined ? "" : r[j].trim()));
    return out;
  });
  const valid = norm.filter((r) => r.some((v) => v !== ""));
  if (!valid.length) errors.push("The CSV contains no data rows.");

  return { headers, rows: valid, errors };
}

export interface BatchItem {
  label: string;
  content: string;
}

/**
 * Build payloads for every CSV row against a type schema. Accepts a `label`
 * column (used as the file name and history label) in addition to the schema's
 * own fields; any unmapped columns are ignored.
 */
export function rowsToItems(
  headers: string[],
  rows: string[][],
  summarize: (v: Record<string, string>) => string,
  build: (v: Record<string, string>) => string,
): BatchItem[] {
  return rows.map((values, i) => {
    const rec: Record<string, string> = {};
    headers.forEach((h, j) => {
      rec[h] = values[j] ?? "";
    });
    const labelCol = headers.find((h) => h.toLowerCase() === "label");
    const content = build(rec);
    const label = (labelCol ? rec[labelCol] : "") || summarize(rec) || `row-${i + 1}`;
    return { label, content };
  });
}

/** Generate a QR PNG for every item and bundle them into a ZIP. */
export async function generateBatchZip(items: BatchItem[], options: QrOptions): Promise<number> {
  const zip = new JSZip();
  const folder = zip.folder("qr-codes");
  if (!folder) throw new Error("Could not create zip folder");
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const matrix = buildMatrix(item.content || " ", options.ecc, options.margin);
    const canvas = document.createElement("canvas");
    await renderToCanvas(canvas, matrix, { ...options, size: options.size > 0 ? options.size : 1024 });
    const dataUrl = canvas.toDataURL("image/png");
    const bin = atob(dataUrl.split(",")[1]);
    const arr = new Uint8Array(bin.length);
    for (let j = 0; j < bin.length; j++) arr[j] = bin.charCodeAt(j);
    const safe = item.label.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-|-$/g, "") || `qr-${i + 1}`;
    folder.file(`${(i + 1).toString().padStart(3, "0")}-${safe.slice(0, 60)}.png`, arr);
  }
  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "qr-studio-batch.zip";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
  return items.length;
}
