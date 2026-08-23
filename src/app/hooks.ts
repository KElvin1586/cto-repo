import { useEffect, useRef, useState } from "react";
import { buildMatrix, renderToCanvas } from "~/app/qr/render";
import type { QrOptions } from "~/app/types";

/** Sets the document title, meta description and canonical link (client-side SEO). */
export function useSeo(title: string, description: string) {
  useEffect(() => {
    document.title = title;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", description);

    let canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      canonical.setAttribute("href", window.location.origin + window.location.pathname);
    }
  }, [title, description]);
}

export interface QrRender {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  error: string | null;
}

/** Renders a QR code into a canvas whenever content or options change. */
export function useQrRender(content: string, options: QrOptions): QrRender {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setError(null);
    let matrix;
    try {
      matrix = buildMatrix(content || " ", options.ecc, options.margin);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return;
    }
    let active = true;
    renderToCanvas(canvas, matrix, options).catch(() => {
      if (active) setError("Could not render the QR code.");
    });
    return () => {
      active = false;
    };
  }, [content, options]);

  return { canvasRef, error };
}

/** Persists a value in localStorage across sessions. */
export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof localStorage === "undefined") return initial;
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });
  const set = (next: T | ((prev: T) => T)) => {
    setValue((prev) => {
      const val = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
      try {
        localStorage.setItem(key, JSON.stringify(val));
      } catch {
        /* storage full — ignore */
      }
      return val;
    });
  };
  return [value, set] as const;
}

/** Reads an uploaded image file into a data URL. */
export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
