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
        const clonedEl = clonedDoc.getElementById(elementId);
        if (clonedEl) {
          clonedEl.style.transform = "none";
          clonedEl.style.margin = "0 auto";
          clonedEl.style.boxShadow = "none";
          clonedEl.style.border = "none";
          clonedEl.style.width = "100%";
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
