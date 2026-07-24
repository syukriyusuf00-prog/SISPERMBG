/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// Cache for converted colors
const colorCache = new Map<string, string>();

let dummyEl: HTMLDivElement | null = null;

function getDummyEl(): HTMLDivElement | null {
  if (typeof document === "undefined") return null;
  if (!dummyEl && document.body) {
    dummyEl = document.createElement("div");
    dummyEl.style.display = "none";
    document.body.appendChild(dummyEl);
  }
  return dummyEl;
}

/**
 * Converts an oklab(...) color string into an rgb(...) or rgba(...) color string.
 */
function oklabToRgb(oklabStr: string): string {
  if (colorCache.has(oklabStr)) {
    return colorCache.get(oklabStr)!;
  }

  const dummy = getDummyEl();
  if (dummy) {
    try {
      dummy.style.color = "";
      dummy.style.color = oklabStr;
      const computed = getComputedStyle(dummy).color;
      if (computed && !computed.includes("oklab") && !computed.includes("oklch")) {
        colorCache.set(oklabStr, computed);
        return computed;
      }
    } catch {
      // Fallback
    }
  }

  const match = oklabStr.match(/oklab\(\s*([\d.%]+)[\s,]+([\d.-]+)[\s,]+([\d.-]+)(?:[\s,/]+([\d.%]+))?\s*\)/i);
  if (!match) return "rgb(0, 0, 0)";

  let l = parseFloat(match[1]);
  if (match[1].endsWith("%")) l /= 100;
  const a = parseFloat(match[2]);
  const b = parseFloat(match[3]);
  let alpha = match[4] !== undefined ? parseFloat(match[4]) : 1;
  if (match[4] && match[4].endsWith("%")) alpha /= 100;

  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.2914855480 * b;

  const l3 = l_ * l_ * l_;
  const m3 = m_ * m_ * m_;
  const s3 = s_ * s_ * s_;

  const rLin = +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
  const gLin = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
  const bLin = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3;

  const toGamma = (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 255;
    const g = x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
    return Math.min(255, Math.max(0, Math.round(g * 255)));
  };

  const r = toGamma(rLin);
  const g = toGamma(gLin);
  const bComp = toGamma(bLin);

  const res = alpha < 1 ? `rgba(${r}, ${g}, ${bComp}, ${alpha})` : `rgb(${r}, ${g}, ${bComp})`;
  colorCache.set(oklabStr, res);
  return res;
}

/**
  * Converts an oklch(...) color string into an rgb(...) or rgba(...) color string.
  */
function oklchToRgb(oklchStr: string): string {
  if (colorCache.has(oklchStr)) {
    return colorCache.get(oklchStr)!;
  }

  const dummy = getDummyEl();
  if (dummy) {
    try {
      dummy.style.color = "";
      dummy.style.color = oklchStr;
      const computed = getComputedStyle(dummy).color;
      if (computed && !computed.includes("oklch") && !computed.includes("oklab")) {
        colorCache.set(oklchStr, computed);
        return computed;
      }
    } catch {
      // Fallback
    }
  }

  const match = oklchStr.match(/oklch\(\s*([\d.%]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.%]+))?\s*\)/i);
  if (!match) return "rgb(0, 0, 0)";

  let l = parseFloat(match[1]);
  if (match[1].endsWith("%")) l /= 100;
  const c = parseFloat(match[2]);
  const h = parseFloat(match[3]);
  let alpha = match[4] !== undefined ? parseFloat(match[4]) : 1;
  if (match[4] && match[4].endsWith("%")) alpha /= 100;

  const hRad = (h * Math.PI) / 180;
  const a = c * Math.cos(hRad);
  const b = c * Math.sin(hRad);

  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.2914855480 * b;

  const l3 = l_ * l_ * l_;
  const m3 = m_ * m_ * m_;
  const s3 = s_ * s_ * s_;

  const rLin = +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
  const gLin = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
  const bLin = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3;

  const toGamma = (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 255;
    const g = x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
    return Math.min(255, Math.max(0, Math.round(g * 255)));
  };

  const r = toGamma(rLin);
  const g = toGamma(gLin);
  const bComp = toGamma(bLin);

  const res = alpha < 1 ? `rgba(${r}, ${g}, ${bComp}, ${alpha})` : `rgb(${r}, ${g}, ${bComp})`;
  colorCache.set(oklchStr, res);
  return res;
}

/**
 * Converts a CSS color(...) function string (e.g., color(srgb 0.1 0.2 0.3 / 0.8)) into an rgb(...) or rgba(...) string.
 */
function parseColorFunctionToRgb(colorStr: string): string {
  if (colorCache.has(colorStr)) {
    return colorCache.get(colorStr)!;
  }
  const match = colorStr.match(/color\(\s*([\w-]+)\s+([\d.%-]+)[\s,]+([\d.%-]+)[\s,]+([\d.%-]+)(?:[\s,/]+([\d.%-]+))?\s*\)/i);
  if (!match) return "rgb(0, 0, 0)";

  let r = parseFloat(match[2]);
  if (match[2].endsWith("%")) r = (r / 100) * 255;
  else if (r <= 1) r = r * 255;

  let g = parseFloat(match[3]);
  if (match[3].endsWith("%")) g = (g / 100) * 255;
  else if (g <= 1) g = g * 255;

  let b = parseFloat(match[4]);
  if (match[4].endsWith("%")) b = (b / 100) * 255;
  else if (b <= 1) b = b * 255;

  let alpha = match[5] !== undefined ? parseFloat(match[5]) : 1;
  if (match[5] && match[5].endsWith("%")) alpha /= 100;

  r = Math.min(255, Math.max(0, Math.round(r)));
  g = Math.min(255, Math.max(0, Math.round(g)));
  b = Math.min(255, Math.max(0, Math.round(b)));

  const res = alpha < 1 ? `rgba(${r}, ${g}, ${b}, ${alpha})` : `rgb(${r}, ${g}, ${b})`;
  colorCache.set(colorStr, res);
  return res;
}

let canvas2dCtx: CanvasRenderingContext2D | null = null;

function convertCssColorToRgb(colorStr: string): string {
  if (colorCache.has(colorStr)) {
    return colorCache.get(colorStr)!;
  }
  try {
    if (!canvas2dCtx && typeof document !== "undefined") {
      const canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;
      canvas2dCtx = canvas.getContext("2d");
    }
    if (canvas2dCtx) {
      canvas2dCtx.fillStyle = "#000000";
      canvas2dCtx.fillStyle = colorStr;
      const converted = canvas2dCtx.fillStyle;
      if (converted && !converted.includes("oklab") && !converted.includes("oklch") && !converted.includes("color(") && !converted.includes("color-mix")) {
        colorCache.set(colorStr, converted);
        return converted;
      }
    }
  } catch {
    // Fallback
  }

  if (colorStr.includes("color(")) return parseColorFunctionToRgb(colorStr);
  if (colorStr.includes("oklab")) return oklabToRgb(colorStr);
  if (colorStr.includes("oklch")) return oklchToRgb(colorStr);

  return colorStr;
}

const HAS_UNSUPPORTED_COLOR = (s: string) =>
  s.includes("oklab") || s.includes("oklch") || s.includes("light-dark") || s.includes("color-mix") || s.includes("color(");

export function sanitizeOklchString(str: string): string {
  if (!str) return str;
  if (!HAS_UNSUPPORTED_COLOR(str)) {
    return str;
  }

  let result = str;

  if (result.includes("light-dark")) {
    result = result.replace(/light-dark\(\s*([^,\)]+)\s*,\s*([^,\)]+)\s*\)/gi, "$1");
  }
  if (result.includes("color(")) {
    result = result.replace(/color\([^)]+\)/gi, (m) => convertCssColorToRgb(m));
  }
  if (result.includes("oklab")) {
    result = result.replace(/oklab\([^)]+\)/gi, (m) => convertCssColorToRgb(m));
  }
  if (result.includes("oklch")) {
    result = result.replace(/oklch\([^)]+\)/gi, (m) => convertCssColorToRgb(m));
  }
  if (result.includes("color-mix")) {
    result = result.replace(/color-mix\([^)]+\)/gi, (m) => convertCssColorToRgb(m));
  }

  return result;
}

function createSanitizedComputedStyle(origFn: typeof window.getComputedStyle) {
  return function (elt: Element, pseudoElt?: string | null): CSSStyleDeclaration {
    const style = origFn(elt, pseudoElt);
    return new Proxy(style, {
      get(target, prop, receiver) {
        if (prop === "getPropertyValue") {
          return function (propertyName: string) {
            const raw = target.getPropertyValue(propertyName);
            if (raw && typeof raw === "string" && HAS_UNSUPPORTED_COLOR(raw)) {
              return sanitizeOklchString(raw);
            }
            return raw;
          };
        }

        let val: any;
        try {
          val = target[prop as keyof CSSStyleDeclaration];
        } catch {
          val = Reflect.get(target, prop);
        }

        if (typeof val === "string" && HAS_UNSUPPORTED_COLOR(val)) {
          return sanitizeOklchString(val);
        }
        if (typeof val === "function") {
          return val.bind(target);
        }
        return val;
      }
    });
  };
}

/**
 * Applies onclone DOM transformations and getComputedStyle patch for html2canvas
 */
function prepareClonedDoc(clonedDoc: Document, elementId: string) {
  const clonedWin = clonedDoc.defaultView || window;
  if (clonedWin) {
    clonedWin.getComputedStyle = createSanitizedComputedStyle(clonedWin.getComputedStyle.bind(clonedWin));
  }

  // 1. Sanitize all <style> tags
  clonedDoc.querySelectorAll("style").forEach((styleEl) => {
    if (styleEl.textContent && HAS_UNSUPPORTED_COLOR(styleEl.textContent)) {
      styleEl.textContent = sanitizeOklchString(styleEl.textContent);
    }
  });

  // 2. Sanitize rules in document.styleSheets
  try {
    Array.from(clonedDoc.styleSheets).forEach((sheet) => {
      try {
        if (sheet.cssRules) {
          Array.from(sheet.cssRules).forEach((rule) => {
            if (rule.cssText && HAS_UNSUPPORTED_COLOR(rule.cssText)) {
              if ("style" in rule && (rule as CSSStyleRule).style) {
                const style = (rule as CSSStyleRule).style;
                for (let i = 0; i < style.length; i++) {
                  const prop = style[i];
                  const val = style.getPropertyValue(prop);
                  if (val && HAS_UNSUPPORTED_COLOR(val)) {
                    style.setProperty(prop, sanitizeOklchString(val));
                  }
                }
              }
            }
          });
        }
      } catch {
        // Ignore CORS stylesheet errors
      }
    });
  } catch {
    // Ignore stylesheet access errors
  }

  // 3. Sanitize inline styles on all elements
  clonedDoc.querySelectorAll("*").forEach((el) => {
    if (el instanceof HTMLElement || el instanceof SVGElement) {
      const styleAttr = el.getAttribute("style");
      if (styleAttr && HAS_UNSUPPORTED_COLOR(styleAttr)) {
        el.setAttribute("style", sanitizeOklchString(styleAttr));
      }
    }
  });

  // 4. Adjust target element layout if present
  const clonedEl = clonedDoc.getElementById(elementId);
  if (clonedEl) {
    clonedEl.style.transform = "none";
    clonedEl.style.margin = "0 auto";
    clonedEl.style.boxShadow = "none";
    clonedEl.style.border = "none";
    clonedEl.style.width = "100%";
  }
}

/**
 * Downloads a specific DOM element as a high-resolution PNG image.
 * Uses html2canvas with proper cross-origin configurations and OKLCH/OKLAB color sanitization.
 */
export const downloadElementAsImage = async (elementId: string, filename: string, onProgress?: (msg: string | null) => void) => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found.`);
    if (onProgress) onProgress("Elemen tidak ditemukan.");
    return;
  }
  
  if (onProgress) onProgress("Memproses gambar...");

  const origWindowGetComputedStyle = window.getComputedStyle;
  try {
    window.getComputedStyle = createSanitizedComputedStyle(origWindowGetComputedStyle);

    const canvas = await html2canvas(element, {
      scale: 2, // 2x scale for crisp print quality
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
      scrollX: 0,
      scrollY: -window.scrollY,
      windowWidth: document.documentElement.offsetWidth,
      windowHeight: document.documentElement.offsetHeight,
      onclone: (clonedDoc) => {
        prepareClonedDoc(clonedDoc, elementId);
      }
    });
    
    if (onProgress) onProgress("Mengunduh gambar...");
    
    const imgData = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `${filename}.png`;
    link.href = imgData;
    link.click();
    
    if (onProgress) onProgress(null);
  } catch (error) {
    console.error("Gagal mengunduh gambar:", error);
    if (onProgress) onProgress("Gagal mengunduh gambar. Silakan gunakan Cetak PDF.");
    setTimeout(() => {
      if (onProgress) onProgress(null);
    }, 4000);
  } finally {
    window.getComputedStyle = origWindowGetComputedStyle;
  }
};

/**
 * Triggers standard browser printing for a specific target by temporarily
 * hiding other elements or directly calling print.
 */
export const triggerPrint = () => {
  window.print();
};

/**
 * Exports a specific DOM element directly to a PDF file using html2canvas and jsPDF,
 * taking into account custom zoom scale percentages.
 */
export const exportToPDF = async (
  elementId: string,
  filename: string,
  scalePercent: number = 100,
  onProgress?: (msg: string | null) => void
) => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found.`);
    if (onProgress) onProgress("Elemen tidak ditemukan.");
    return;
  }

  if (onProgress) onProgress("Memproses dokumen PDF...");

  const origWindowGetComputedStyle = window.getComputedStyle;

  try {
    window.getComputedStyle = createSanitizedComputedStyle(origWindowGetComputedStyle);

    const renderScale = (scalePercent / 100) * 2; // 2x baseline resolution
    const canvas = await html2canvas(element, {
      scale: renderScale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
      scrollX: 0,
      scrollY: -window.scrollY,
      windowWidth: document.documentElement.offsetWidth,
      windowHeight: document.documentElement.offsetHeight,
      onclone: (clonedDoc) => {
        prepareClonedDoc(clonedDoc, elementId);
      }
    });

    if (onProgress) onProgress("Membuat file PDF...");

    const imgData = canvas.toDataURL("image/png");
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    // Detect orientation
    const isLandscape = imgWidth > imgHeight;
    const orientation = isLandscape ? "landscape" : "portrait";

    const pdf = new jsPDF({
      orientation,
      unit: "mm",
      format: "a4",
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // Effective width/height in mm
    const factor = renderScale / 2;
    const effectiveWidth = imgWidth / (3.78 * factor); // px to mm approx
    const effectiveHeight = imgHeight / (3.78 * factor);

    const widthRatio = pdfWidth / effectiveWidth;
    const printRatio = Math.min(widthRatio, 1);
    
    const finalWidth = effectiveWidth * printRatio;
    const finalHeight = effectiveHeight * printRatio;
    const xPos = Math.max(0, (pdfWidth - finalWidth) / 2);

    if (finalHeight <= pdfHeight) {
      pdf.addImage(imgData, "PNG", xPos, 2, finalWidth, finalHeight);
    } else {
      let position = 0;
      let heightLeft = finalHeight;

      pdf.addImage(imgData, "PNG", xPos, position, finalWidth, finalHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - finalHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", xPos, position, finalWidth, finalHeight);
        heightLeft -= pdfHeight;
      }
    }

    pdf.save(`${filename}.pdf`);
    if (onProgress) onProgress(null);
  } catch (err) {
    console.error("Gagal mengekspor PDF:", err);
    if (onProgress) onProgress("Gagal membuat PDF. Mengalihkan ke Cetak Browser...");
    setTimeout(() => {
      if (onProgress) onProgress(null);
      window.print();
    }, 1500);
  } finally {
    window.getComputedStyle = origWindowGetComputedStyle;
  }
};


