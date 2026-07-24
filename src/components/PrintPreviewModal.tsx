import React, { useState, useEffect, useRef } from "react";
import { 
  X, 
  Printer, 
  FileText, 
  Image as ImageIcon, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Eye, 
  Sliders, 
  Check, 
  Sparkles,
  Maximize2
} from "lucide-react";
import { exportToPDF, downloadElementAsImage, sanitizeOklchString } from "../lib/printUtils";

interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  elementId: string;
  filename?: string;
  defaultScale?: number;
  defaultPaperSize?: "A4" | "F4";
  defaultOrientation?: "portrait" | "landscape";
}

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
  isOpen,
  onClose,
  title,
  elementId,
  filename = "Dokumen_Cetak",
  defaultScale = 100,
  defaultPaperSize = "A4",
  defaultOrientation = "portrait"
}) => {
  const [scale, setScale] = useState<number>(defaultScale);
  const [paperSize, setPaperSize] = useState<"A4" | "F4">(defaultPaperSize);
  const [orientation, setOrientation] = useState<"portrait" | "landscape">(defaultOrientation);
  const [autoPrint, setAutoPrint] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const hasAutoPrintedRef = useRef<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setScale(defaultScale);
      setPaperSize(defaultPaperSize);
      setOrientation(defaultOrientation);
      hasAutoPrintedRef.current = false;
    }
  }, [isOpen, defaultScale, defaultPaperSize, defaultOrientation]);

  // Update iframe content whenever dependencies change
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      updateIframeContent();
    }, 150);

    return () => clearTimeout(timer);
  }, [isOpen, elementId, scale, paperSize, orientation]);

  const updateIframeContent = () => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const targetEl = document.getElementById(elementId);
    if (!targetEl) return;

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    // Collect and sanitize all stylesheets from parent document
    let combinedStyles = "";
    document.querySelectorAll("style, link[rel='stylesheet']").forEach((styleEl) => {
      if (styleEl.tagName.toLowerCase() === "style") {
        combinedStyles += styleEl.textContent + "\n";
      } else if (styleEl.tagName.toLowerCase() === "link") {
        try {
          const sheet = (styleEl as HTMLLinkElement).sheet;
          if (sheet) {
            Array.from(sheet.cssRules).forEach((rule) => {
              combinedStyles += rule.cssText + "\n";
            });
          }
        } catch {
          // CORS stylesheet bypass
        }
      }
    });

    // Sanitize modern CSS colors (oklab, oklch, color-mix, etc.)
    const sanitizedCss = sanitizeOklchString(combinedStyles);

    // Dimensions in mm
    let sheetWidthMm = paperSize === "A4" ? 210 : 215;
    let sheetHeightMm = paperSize === "A4" ? 297 : 330;

    if (orientation === "landscape") {
      const temp = sheetWidthMm;
      sheetWidthMm = sheetHeightMm;
      sheetHeightMm = temp;
    }

    // Clone element
    const clonedEl = targetEl.cloneNode(true) as HTMLElement;
    clonedEl.style.margin = "0 auto";
    clonedEl.style.boxShadow = "none";
    clonedEl.style.border = "none";
    clonedEl.style.width = "100%";
    clonedEl.style.transform = "none";

    // Clean up .no-print elements inside iframe
    clonedEl.querySelectorAll(".no-print").forEach((el) => el.remove());

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${title}</title>
          <style>
            ${sanitizedCss}

            /* Custom Iframe Base & Reset */
            html, body {
              margin: 0;
              padding: 0;
              background-color: #f1f5f9;
              font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              color: #0f172a;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            .no-print, header, nav, footer, button {
              display: none !important;
            }

            .preview-wrapper {
              display: flex;
              justify-content: center;
              padding: 24px;
              min-height: 100vh;
              box-sizing: border-box;
            }

            .paper-sheet {
              background: #ffffff;
              width: ${sheetWidthMm}mm;
              min-height: ${sheetHeightMm}mm;
              padding: 12mm;
              box-sizing: border-box;
              box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
              border-radius: 4px;
              border: 1px solid #cbd5e1;
              zoom: ${scale}%;
              transition: zoom 0.15s ease-in-out;
            }

            @media print {
              html, body {
                background: #ffffff !important;
                padding: 0 !important;
                margin: 0 !important;
              }
              .preview-wrapper {
                padding: 0 !important;
                display: block !important;
              }
              .paper-sheet {
                box-shadow: none !important;
                border: none !important;
                border-radius: 0 !important;
                width: 100% !important;
                min-height: auto !important;
                padding: 0 !important;
                margin: 0 !important;
                zoom: ${scale}% !important;
              }
              @page {
                size: ${paperSize} ${orientation};
                margin: 10mm;
              }
            }
          </style>
        </head>
        <body>
          <div class="preview-wrapper">
            <div class="paper-sheet">
              ${clonedEl.outerHTML}
            </div>
          </div>
        </body>
      </html>
    `;

    doc.open();
    doc.write(htmlContent);
    doc.close();

    // Auto-Print trigger when modal opens and content is loaded
    if (autoPrint && !hasAutoPrintedRef.current) {
      hasAutoPrintedRef.current = true;
      setIsProcessing(true);
      setStatusMsg("Auto-Print: Membuka dialog cetak otomatis...");
      setTimeout(() => {
        if (iframeRef.current && iframeRef.current.contentWindow) {
          try {
            iframeRef.current.contentWindow.focus();
            iframeRef.current.contentWindow.print();
          } catch {
            window.print();
          }
        } else {
          window.print();
        }
        setIsProcessing(false);
        setStatusMsg(null);
      }, 400);
    }
  };

  const handlePrintDirect = () => {
    setIsProcessing(true);
    setStatusMsg("Mempersiapkan pencetakan...");
    setTimeout(() => {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        try {
          iframeRef.current.contentWindow.focus();
          iframeRef.current.contentWindow.print();
        } catch {
          window.print();
        }
      } else {
        window.print();
      }
      setIsProcessing(false);
      setStatusMsg(null);
    }, 300);
  };

  const handlePDFExport = async () => {
    setIsProcessing(true);
    await exportToPDF(elementId, filename, scale, (msg) => setStatusMsg(msg));
    setIsProcessing(false);
  };

  const handlePNGExport = async () => {
    setIsProcessing(true);
    await downloadElementAsImage(elementId, filename, (msg) => setStatusMsg(msg));
    setIsProcessing(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/70 backdrop-blur-sm flex flex-col justify-between p-2 sm:p-4 animate-fade-in no-print">
      {/* Top Header & Toolbar */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-3 sm:p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 shrink-0">
        
        {/* Left: Title & Status */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-800">{title}</h3>
              <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-100 text-emerald-800 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Live Iframe Preview
              </span>
            </div>
            <p className="text-xs text-slate-500">Validasi visual tata letak A4/F4 sebelum mencetak</p>
          </div>
        </div>

        {/* Center: Controls for Paper Size, Orientation, Scale */}
        <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200/80">
          
          {/* Paper Size Selector */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 text-xs font-semibold">
            <span className="px-2 text-slate-500 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" /> Ukuran:
            </span>
            <button
              type="button"
              onClick={() => setPaperSize("A4")}
              className={`px-2.5 py-1 rounded-md transition ${
                paperSize === "A4"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              A4 (210×297)
            </button>
            <button
              type="button"
              onClick={() => setPaperSize("F4")}
              className={`px-2.5 py-1 rounded-md transition ${
                paperSize === "F4"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              F4 / Folio (215×330)
            </button>
          </div>

          {/* Orientation Toggle */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 text-xs font-semibold">
            <span className="px-2 text-slate-500 flex items-center gap-1">
              <RotateCw className="w-3.5 h-3.5" /> Orientasi:
            </span>
            <button
              type="button"
              onClick={() => setOrientation("portrait")}
              className={`px-2.5 py-1 rounded-md transition ${
                orientation === "portrait"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Potret
            </button>
            <button
              type="button"
              onClick={() => setOrientation("landscape")}
              className={`px-2.5 py-1 rounded-md transition ${
                orientation === "landscape"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Lansekap
            </button>
          </div>

          {/* Zoom Scale Selector */}
          <div className="flex items-center gap-1.5 bg-white p-1 px-2.5 rounded-lg border border-slate-200 text-xs font-semibold">
            <span className="text-slate-500 flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5" /> Skala:
            </span>
            <button
              type="button"
              onClick={() => setScale((s) => Math.max(50, s - 5))}
              className="p-1 text-slate-600 hover:bg-slate-100 rounded"
              title="Perkecil Skala"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="w-12 text-center font-bold text-indigo-700 bg-indigo-50 px-1 py-0.5 rounded">
              {scale}%
            </span>
            <button
              type="button"
              onClick={() => setScale((s) => Math.min(150, s + 5))}
              className="p-1 text-slate-600 hover:bg-slate-100 rounded"
              title="Perbesar Skala"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            
            <div className="flex items-center gap-1 ml-1 border-l border-slate-200 pl-2">
              {[80, 90, 100].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setScale(preset)}
                  className={`px-1.5 py-0.5 text-[10px] rounded ${
                    scale === preset ? "bg-slate-800 text-white" : "text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  {preset}%
                </button>
              ))}
            </div>
          </div>

          {/* Auto-Print Toggle */}
          <button
            type="button"
            onClick={() => setAutoPrint((prev) => !prev)}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              autoPrint
                ? "bg-emerald-50 border-emerald-300 text-emerald-800 shadow-xs"
                : "bg-white border-slate-200 text-slate-500 hover:bg-slate-100"
            }`}
            title="Sistem akan otomatis membuka dialog cetak ketika pratinjau dibuka"
          >
            <Printer className={`w-3.5 h-3.5 ${autoPrint ? "text-emerald-600 animate-pulse" : "text-slate-400"}`} />
            <span>Auto-Print: <strong>{autoPrint ? "AKTIF" : "NONAKTIF"}</strong></span>
          </button>

        </div>

        {/* Right: Actions & Close */}
        <div className="flex items-center gap-2 justify-end">
          <button
            type="button"
            onClick={handlePrintDirect}
            disabled={isProcessing}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Langsung</span>
          </button>

          <button
            type="button"
            onClick={handlePDFExport}
            disabled={isProcessing}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Unduh PDF</span>
          </button>

          <button
            type="button"
            onClick={handlePNGExport}
            disabled={isProcessing}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 active:scale-95 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            <ImageIcon className="w-4 h-4" />
            <span className="hidden sm:inline">PNG</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer ml-2"
            title="Tutup Pratinjau"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

      </div>

      {/* Status banner if processing */}
      {statusMsg && (
        <div className="my-2 p-2.5 bg-indigo-600 text-white text-xs font-semibold rounded-xl text-center shadow-md animate-bounce">
          {statusMsg}
        </div>
      )}

      {/* Center: Live Iframe Container */}
      <div className="flex-1 my-2 bg-slate-800/50 rounded-2xl border border-slate-700 shadow-inner overflow-hidden relative">
        <iframe
          ref={iframeRef}
          title="Print Preview Frame"
          className="w-full h-full border-none rounded-2xl bg-slate-100"
        />
      </div>

      {/* Bottom Footer Tip */}
      <div className="bg-white/90 backdrop-blur-md rounded-xl p-2.5 px-4 border border-slate-200 text-xs text-slate-600 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Maximize2 className="w-3.5 h-3.5 text-indigo-600" />
          <span>Format Kertas: <strong>{paperSize} ({orientation === "portrait" ? "Potret" : "Lansekap"})</strong> — Skala Tampilan: <strong>{scale}%</strong></span>
        </div>
        <div className="hidden sm:block text-[11px] text-slate-400">
          Iframe dirender dengan proteksi kompatibilitas warna & Tailwind CSS
        </div>
      </div>

    </div>
  );
};

export default PrintPreviewModal;
