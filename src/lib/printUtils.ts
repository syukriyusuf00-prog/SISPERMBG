/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import html2canvas from "html2canvas";

// Cache for converted oklch colors
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
 * Converts an oklch(...) color string into an rgb(...) or rgba(...) color string.
 * First attempts browser computed style resolution, then falls back to OKLCH->sRGB math.
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
      if (computed && !computed.includes("oklch")) {
        colorCache.set(oklchStr, computed);
        return computed;
      }
    } catch {
      // Fallback to math conversion if computed style fails
    }
  }

  // Regex parse: oklch(L C H [/ A]) or oklch(L% C H [/ A])
  const match = oklchStr.match(/oklch\(\s*([\d.%]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.%]+))?\s*\)/i);
  if (!match) return "#000000";

  let l = parseFloat(match[1]);
  if (match[1].endsWith("%")) l /= 100;
  const c = parseFloat(match[2]);
  const h = parseFloat(match[3]);
  let alpha = match[4] !== undefined ? parseFloat(match[4]) : 1;
  if (match[4] && match[4].endsWith("%")) alpha /= 100;

  // OKLCH to OKLAB
  const hRad = (h * Math.PI) / 180;
  const a = c * Math.cos(hRad);
  const b = c * Math.sin(hRad);

  // OKLAB to LMS
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.2914855480 * b;

  const l3 = l_ * l_ * l_;
  const m3 = m_ * m_ * m_;
  const s3 = s_ * s_ * s_;

  // LMS to Linear sRGB
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

function sanitizeOklchString(str: string): string {
  if (!str || !str.includes("oklch")) return str;
  return str.replace(/oklch\([^\)]+\)/gi, (m) => oklchToRgb(m));
}

/**
 * Downloads a specific DOM element as a high-resolution PNG image.
 * Uses html2canvas with proper cross-origin configurations and OKLCH color sanitization.
 */
export const downloadElementAsImage = async (elementId: string, filename: string, onProgress?: (msg: string | null) => void) => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found.`);
    if (onProgress) onProgress("Elemen tidak ditemukan.");
    return;
  }
  
  if (onProgress) onProgress("Memproses gambar...");
  
  try {
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
        // 1. Sanitize all <style> elements in the cloned document
        clonedDoc.querySelectorAll("style").forEach((styleEl) => {
          if (styleEl.textContent && styleEl.textContent.includes("oklch")) {
            styleEl.textContent = sanitizeOklchString(styleEl.textContent);
          }
        });

        // 2. Sanitize inline styles on any element in the cloned document
        clonedDoc.querySelectorAll("[style*='oklch']").forEach((el) => {
          const styleAttr = el.getAttribute("style");
          if (styleAttr) {
            el.setAttribute("style", sanitizeOklchString(styleAttr));
          }
        });

        // 3. Sanitize cssRules in styleSheets if available
        try {
          Array.from(clonedDoc.styleSheets).forEach((sheet) => {
            try {
              if (sheet.cssRules) {
                Array.from(sheet.cssRules).forEach((rule) => {
                  if (rule.cssText && rule.cssText.includes("oklch")) {
                    if ("style" in rule && (rule as CSSStyleRule).style) {
                      const style = (rule as CSSStyleRule).style;
                      for (let i = 0; i < style.length; i++) {
                        const prop = style[i];
                        const val = style.getPropertyValue(prop);
                        if (val.includes("oklch")) {
                          style.setProperty(prop, sanitizeOklchString(val));
                        }
                      }
                    }
                  }
                });
              }
            } catch {
              // CORS protected stylesheet, skip
            }
          });
        } catch {
          // Ignore stylesheet access errors
        }

        // 4. Adjust the target cloned element styling for proper canvas rendering
        const clonedEl = clonedDoc.getElementById(elementId);
        if (clonedEl) {
          clonedEl.style.transform = "none";
          clonedEl.style.margin = "0 auto";
          clonedEl.style.boxShadow = "none";
          clonedEl.style.border = "none";
          clonedEl.style.width = "100%";

          // Walk all child elements to sanitize inline styles or computed styles if needed
          const children = clonedEl.querySelectorAll("*");
          children.forEach((child) => {
            if (child instanceof HTMLElement && child.style.cssText.includes("oklch")) {
              child.style.cssText = sanitizeOklchString(child.style.cssText);
            }
          });
        }
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
  }
};

/**
 * Triggers standard browser printing for a specific target by temporarily
 * hiding other elements or directly calling print.
 */
export const triggerPrint = () => {
  window.print();
};

