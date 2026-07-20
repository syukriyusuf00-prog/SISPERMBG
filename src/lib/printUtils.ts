/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import html2canvas from "html2canvas";

/**
 * Downloads a specific DOM element as a high-resolution PNG image.
 * Uses html2canvas with proper cross-origin configurations.
 */
export const downloadElementAsImage = async (elementId: string, filename: string, onProgress?: (msg: string | null) => void) => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found.`);
    return;
  }
  
  if (onProgress) onProgress("Memproses gambar...");
  
  try {
    // Store original styling adjustments if necessary
    const originalStyle = element.getAttribute("style") || "";
    
    // Gather and rewrite stylesheets to eliminate 'oklch' which crashes html2canvas's parser
    const originalDisabledState = new Map<any, boolean>();
    let combinedCss = "";

    for (const sheet of Array.from(document.styleSheets)) {
      try {
        originalDisabledState.set(sheet, sheet.disabled);
        const rules = sheet.cssRules || sheet.rules;
        if (rules) {
          for (const rule of Array.from(rules)) {
            combinedCss += rule.cssText + "\n";
          }
        }
      } catch (e) {
        console.warn("Could not read stylesheet rules:", e);
      }
    }

    // Replace oklch(...) with equivalent grayscale rgb(...) approximation to keep layout contrast
    const cleanCss = combinedCss.replace(/oklch\([^)]+\)/g, (match) => {
      try {
        const parts = match.substring(6, match.length - 1).trim().split(/[\s/]+/);
        const l = parseFloat(parts[0]);
        if (!isNaN(l)) {
          const intensity = Math.round(l * 255);
          return `rgb(${intensity}, ${intensity}, ${intensity})`;
        }
      } catch (e) {}
      return "rgb(200, 200, 200)";
    });

    // Disable original stylesheets
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        sheet.disabled = true;
      } catch (e) {}
    }

    // Insert clean temporary stylesheet
    const tempStyle = document.createElement("style");
    tempStyle.id = "html2canvas-temp-style";
    tempStyle.textContent = cleanCss;
    document.head.appendChild(tempStyle);

    let canvas;
    try {
      // Create a canvas using html2canvas with oklch-free styles
      canvas = await html2canvas(element, {
        scale: 2, // 2x scale for crisp print quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight
      });
    } finally {
      // Restore original stylesheet states
      if (tempStyle.parentNode) {
        tempStyle.parentNode.removeChild(tempStyle);
      }
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          const orig = originalDisabledState.get(sheet);
          if (orig !== undefined) {
            sheet.disabled = orig;
          } else {
            sheet.disabled = false;
          }
        } catch (e) {}
      }
    }
    
    if (onProgress) onProgress("Mengunduh gambar...");
    
    const imgData = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `${filename}.png`;
    link.href = imgData;
    link.click();
    
    if (onProgress) onProgress(null);
  } catch (error) {
    console.error("Gagal mengunduh gambar:", error);
    if (onProgress) onProgress("Gagal mengunduh gambar. Silakan gunakan Cetak/PDF.");
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
