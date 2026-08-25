// Export helpers: PNG, JPG, SVG and PDF download. All run entirely in the browser.

// NOTE: jsPDF (and its html2canvas dependency) is loaded lazily via dynamic
// import() so the ~400 KB PDF engine is only fetched when a PDF export is
// actually requested — keeping the initial load small for everyone else.

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9_-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "qr-code";
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [head, body] = dataUrl.split(",");
  const mime = head.match(/data:(.*?);/)?.[1] ?? "image/png";
  const bin = atob(body);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

export function exportPng(canvas: HTMLCanvasElement, filename: string) {
  const dataUrl = canvas.toDataURL("image/png");
  download(dataUrlToBlob(dataUrl), `${safeName(filename)}.png`);
}

export function exportJpg(canvas: HTMLCanvasElement, filename: string) {
  const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
  download(dataUrlToBlob(dataUrl), `${safeName(filename)}.jpg`);
}

export function exportSvg(svgString: string, filename: string) {
  download(
    new Blob([svgString], { type: "image/svg+xml;charset=utf-8" }),
    `${safeName(filename)}.svg`,
  );
}

export async function exportPdf(canvas: HTMLCanvasElement, filename: string) {
  const { jsPDF } = await import("jspdf");
  const dataUrl = canvas.toDataURL("image/png");
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  // Fit a square QR on the page with ample margin.
  const margin = 20;
  const dim = Math.min(pageW, pageH) - margin * 2;
  const x = (pageW - dim) / 2;
  const y = (pageH - dim) / 2;
  pdf.addImage(dataUrl, "PNG", x, y, dim, dim);
  pdf.save(`${safeName(filename)}.pdf`);
}

/** Render the SVG string to a raster PNG data URL via an offscreen canvas. */
export async function svgToPngDataUrl(svgString: string, size = 1024): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = size;
      c.height = size;
      const ctx = c.getContext("2d");
      if (!ctx) return reject(new Error("no canvas"));
      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/png"));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("svg conversion failed"));
    };
    img.src = url;
  });
}
