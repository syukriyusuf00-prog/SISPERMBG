/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Sliders, Edit3, Image as ImageIcon, Printer, Download, RotateCcw, ChevronDown, ChevronUp, Check, Settings2, Trash2 } from "lucide-react";
import { downloadElementAsImage } from "../lib/printUtils";

export interface LogoCrop {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface KopSuratProps {
  kopLine1: string;
  setKopLine1: (val: string) => void;
  kopLine2: string;
  setKopLine2: (val: string) => void;
  kopLine3: string;
  setKopLine3: (val: string) => void;
  kopLine4: string;
  setKopLine4: (val: string) => void;
  leftLogo: string;
  setLeftLogo: (val: string) => void;
  rightLogo: string;
  setRightLogo: (val: string) => void;
  leftLogoCrop?: LogoCrop;
  setLeftLogoCrop?: (val: LogoCrop) => void;
  rightLogoCrop?: LogoCrop;
  setRightLogoCrop?: (val: LogoCrop) => void;
  paperSize?: "A4" | "F4";
  setPaperSize?: (val: "A4" | "F4") => void;
  printTargetId?: string;
  filename?: string;
  title?: string;
  subtitle?: string;
}

export const defaultLogoCrop: LogoCrop = { top: 0, bottom: 0, left: 0, right: 0 };

export function KopSuratRenderHeader({
  kopLine1,
  kopLine2,
  kopLine3,
  kopLine4,
  leftLogo,
  rightLogo,
  leftLogoCrop = defaultLogoCrop,
  rightLogoCrop = defaultLogoCrop
}: {
  kopLine1: string;
  kopLine2: string;
  kopLine3: string;
  kopLine4: string;
  leftLogo: string;
  rightLogo: string;
  leftLogoCrop?: LogoCrop;
  rightLogoCrop?: LogoCrop;
}) {
  return (
    <div className="border-b-2 border-slate-900 pb-2 mb-3 text-slate-950 font-serif w-full">
      <div className="flex items-center justify-between gap-4">
        {/* Left Logo */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center overflow-hidden shrink-0">
          {leftLogo ? (
            <img
              src={leftLogo}
              alt="Logo Kiri"
              className="max-w-full max-h-full object-contain transition-all"
              style={{
                clipPath: `inset(${leftLogoCrop.top}% ${leftLogoCrop.right}% ${leftLogoCrop.bottom}% ${leftLogoCrop.left}%)`
              }}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-16 h-16 rounded border border-dashed border-slate-300 flex items-center justify-center text-[9px] text-slate-400">
              Logo 1
            </div>
          )}
        </div>

        {/* Center Kop Text */}
        <div className="text-center flex-1 px-2">
          <h1 className="text-xs sm:text-sm md:text-base font-extrabold uppercase tracking-wide leading-tight text-slate-950">
            {kopLine1}
          </h1>
          <h2 className="text-[11px] sm:text-xs md:text-sm font-bold uppercase tracking-wide leading-tight text-slate-900 mt-0.5">
            {kopLine2}
          </h2>
          <h3 className="text-[11px] sm:text-xs md:text-sm font-extrabold uppercase tracking-wide leading-tight text-slate-900 mt-0.5">
            {kopLine3}
          </h3>
          <p className="text-[9px] sm:text-[10px] md:text-[11px] font-medium leading-tight text-slate-700 italic mt-1 border-t border-slate-200 pt-0.5">
            {kopLine4}
          </p>
        </div>

        {/* Right Logo */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center overflow-hidden shrink-0">
          {rightLogo ? (
            <img
              src={rightLogo}
              alt="Logo Kanan"
              className="max-w-full max-h-full object-contain transition-all"
              style={{
                clipPath: `inset(${rightLogoCrop.top}% ${rightLogoCrop.right}% ${rightLogoCrop.bottom}% ${rightLogoCrop.left}%)`
              }}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-16 h-16 rounded border border-dashed border-slate-300 flex items-center justify-center text-[9px] text-slate-400">
              Logo 2
            </div>
          )}
        </div>
      </div>
      <div className="border-b border-slate-900 mt-1"></div>
    </div>
  );
}

export default function KopSuratConfigSection({
  kopLine1,
  setKopLine1,
  kopLine2,
  setKopLine2,
  kopLine3,
  setKopLine3,
  kopLine4,
  setKopLine4,
  leftLogo,
  setLeftLogo,
  rightLogo,
  setRightLogo,
  leftLogoCrop = defaultLogoCrop,
  setLeftLogoCrop,
  rightLogoCrop = defaultLogoCrop,
  setRightLogoCrop,
  paperSize = "A4",
  setPaperSize,
  printTargetId,
  filename = "Laporan_Cetak",
  title = "Pengaturan Kop Surat & Cetak Presisi",
  subtitle = "Atur 4 baris Kop, logo kiri & kanan dengan pemotongan (crop) presisi, serta ukuran kertas A4 atau F4."
}: KopSuratProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"text" | "logo" | "crop" | "paper">("text");
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  // File Uploader Handlers
  const handleLeftLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setLeftLogo(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRightLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setRightLogo(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const updateLeftCrop = (key: keyof LogoCrop, value: number) => {
    if (setLeftLogoCrop) {
      setLeftLogoCrop({
        ...leftLogoCrop,
        [key]: value
      });
    }
  };

  const updateRightCrop = (key: keyof LogoCrop, value: number) => {
    if (setRightLogoCrop) {
      setRightLogoCrop({
        ...rightLogoCrop,
        [key]: value
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPNG = async () => {
    if (!printTargetId) return;
    setIsDownloading(true);
    await downloadElementAsImage(printTargetId, filename);
    setIsDownloading(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs mb-6 no-print overflow-hidden">
      {/* Inject dynamic @page size style according to paperSize setting */}
      <style>{`
        @media print {
          @page {
            size: ${paperSize === "F4" ? "215mm 330mm" : "A4"};
            margin: 6mm;
          }
        }
      `}</style>
      {/* Header Bar with Accordion Toggle */}
      <div className="p-4 bg-slate-50/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
            <Edit3 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
              {title}
              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-black rounded-md uppercase tracking-wider">
                Resmi
              </span>
            </h4>
            <p className="text-xs text-slate-500 max-w-2xl">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {printTargetId && (
            <button
              type="button"
              onClick={handleDownloadPNG}
              disabled={isDownloading}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              {isDownloading ? "Memproses..." : "Unduh Gambar"}
            </button>
          )}

          <button
            id="btn-print-action"
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-indigo-600/20 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Cetak PDF ({paperSize})
          </button>

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 bg-slate-200/60 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer ml-1"
            title={isOpen ? "Sembunyikan Panel Editor Kop" : "Tampilkan Panel Editor Kop"}
          >
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Editor Body when toggled */}
      {isOpen && (
        <div className="p-5 space-y-5 animate-in fade-in duration-200">
          {/* Editor Sub-Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 max-w-md">
            <button
              type="button"
              onClick={() => setActiveTab("text")}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === "text" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Teks Kop (4 Baris)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("logo")}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === "logo" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Upload Logo
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("crop")}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === "crop" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Potong Logo (Crop)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("paper")}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === "paper" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Ukuran Kertas
            </button>
          </div>

          {/* TAB 1: TEXT LINES */}
          {activeTab === "text" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                  Kop Baris 1 (Instansi Utama)
                </label>
                <input
                  type="text"
                  value={kopLine1}
                  onChange={(e) => setKopLine1(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="BADAN GIZI NASIONAL"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                  Kop Baris 2 (Sub-Instansi / Satuan)
                </label>
                <input
                  type="text"
                  value={kopLine2}
                  onChange={(e) => setKopLine2(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="SATUAN PELAYANAN PEMENUHAN GIZI"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                  Kop Baris 3 (Nama Unit SPPG)
                </label>
                <input
                  type="text"
                  value={kopLine3}
                  onChange={(e) => setKopLine3(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-extrabold text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="SPPG MUNA BARAT SAWERIGADI ONDOKE"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                  Kop Baris 4 (Alamat / Kontak)
                </label>
                <input
                  type="text"
                  value={kopLine4}
                  onChange={(e) => setKopLine4(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="Alamat : Jln. Poros Lagadi-Tondasi..."
                />
              </div>
            </div>
          )}

          {/* TAB 2: LOGO UPLOADS */}
          {activeTab === "logo" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Logo Kiri */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-indigo-600" />
                    Logo Pojok Kiri (SPPG / BGN)
                  </span>
                  <button
                    type="button"
                    onClick={() => setLeftLogo("/src/assets/images/logo_sppg_1782256222616.jpg")}
                    className="text-[10px] text-indigo-600 hover:underline font-bold flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset Standar
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl border border-slate-200 bg-white p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                    {leftLogo ? (
                      <img src={leftLogo} alt="Logo Kiri" className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-[9px] text-slate-400">Kosong</span>
                    )}
                  </div>
                  <div className="space-y-2 flex-1">
                    <label className="px-3 py-1.5 bg-white border border-slate-300 hover:border-indigo-400 rounded-xl text-xs font-bold text-slate-700 cursor-pointer inline-flex items-center gap-1.5 shadow-xs">
                      <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                      Pilih Logo Kiri
                      <input type="file" accept="image/*" onChange={handleLeftLogoUpload} className="hidden" />
                    </label>
                    <p className="text-[10px] text-slate-400">Format PNG, JPG atau SVG dengan latar putih/transparan.</p>
                  </div>
                </div>
              </div>

              {/* Logo Kanan */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-emerald-600" />
                    Logo Pojok Kanan (Instansi / Pemda)
                  </span>
                  {rightLogo && (
                    <button
                      type="button"
                      onClick={() => setRightLogo("")}
                      className="text-[10px] text-rose-600 hover:underline font-bold flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Hapus Logo
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl border border-slate-200 bg-white p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                    {rightLogo ? (
                      <img src={rightLogo} alt="Logo Kanan" className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-[9px] text-slate-400 italic">Tanpa Logo</span>
                    )}
                  </div>
                  <div className="space-y-2 flex-1">
                    <label className="px-3 py-1.5 bg-white border border-slate-300 hover:border-emerald-400 rounded-xl text-xs font-bold text-slate-700 cursor-pointer inline-flex items-center gap-1.5 shadow-xs">
                      <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                      Pilih Logo Kanan
                      <input type="file" accept="image/*" onChange={handleRightLogoUpload} className="hidden" />
                    </label>
                    <p className="text-[10px] text-slate-400">Pilihan opsional untuk logo daerah atau institusi terkait.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LOGO CROP CONTROLS */}
          {activeTab === "crop" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Logo Kiri Crop */}
              <div className="p-4 bg-indigo-50/40 rounded-2xl border border-indigo-100 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-extrabold text-indigo-950 flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-indigo-600" />
                    Potong Margins Logo Kiri ({leftLogoCrop.top}%, {leftLogoCrop.right}%, {leftLogoCrop.bottom}%, {leftLogoCrop.left}%)
                  </span>
                  <button
                    type="button"
                    onClick={() => setLeftLogoCrop && setLeftLogoCrop(defaultLogoCrop)}
                    className="text-[10px] text-indigo-600 hover:underline font-bold"
                  >
                    Reset Crop
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Crop Atas: {leftLogoCrop.top}%</label>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={leftLogoCrop.top}
                      onChange={(e) => updateLeftCrop("top", Number(e.target.value))}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Crop Bawah: {leftLogoCrop.bottom}%</label>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={leftLogoCrop.bottom}
                      onChange={(e) => updateLeftCrop("bottom", Number(e.target.value))}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Crop Kiri: {leftLogoCrop.left}%</label>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={leftLogoCrop.left}
                      onChange={(e) => updateLeftCrop("left", Number(e.target.value))}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Crop Kanan: {leftLogoCrop.right}%</label>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={leftLogoCrop.right}
                      onChange={(e) => updateLeftCrop("right", Number(e.target.value))}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Logo Kanan Crop */}
              <div className="p-4 bg-emerald-50/40 rounded-2xl border border-emerald-100 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-extrabold text-emerald-950 flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-emerald-600" />
                    Potong Margins Logo Kanan ({rightLogoCrop.top}%, {rightLogoCrop.right}%, {rightLogoCrop.bottom}%, {rightLogoCrop.left}%)
                  </span>
                  <button
                    type="button"
                    onClick={() => setRightLogoCrop && setRightLogoCrop(defaultLogoCrop)}
                    className="text-[10px] text-emerald-600 hover:underline font-bold"
                  >
                    Reset Crop
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Crop Atas: {rightLogoCrop.top}%</label>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={rightLogoCrop.top}
                      onChange={(e) => updateRightCrop("top", Number(e.target.value))}
                      className="w-full accent-emerald-600 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Crop Bawah: {rightLogoCrop.bottom}%</label>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={rightLogoCrop.bottom}
                      onChange={(e) => updateRightCrop("bottom", Number(e.target.value))}
                      className="w-full accent-emerald-600 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Crop Kiri: {rightLogoCrop.left}%</label>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={rightLogoCrop.left}
                      onChange={(e) => updateRightCrop("left", Number(e.target.value))}
                      className="w-full accent-emerald-600 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Crop Kanan: {rightLogoCrop.right}%</label>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={rightLogoCrop.right}
                      onChange={(e) => updateRightCrop("right", Number(e.target.value))}
                      className="w-full accent-emerald-600 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PAPER SIZE SELECTION */}
          {activeTab === "paper" && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <h5 className="text-xs font-bold text-slate-800">Pilih Ukuran Kertas Cetakan & Layout:</h5>
              <div className="flex flex-wrap gap-4">
                <label
                  onClick={() => setPaperSize && setPaperSize("A4")}
                  className={`p-3.5 rounded-2xl border cursor-pointer flex items-center gap-3 transition-all ${
                    paperSize === "A4"
                      ? "bg-indigo-50/70 border-indigo-500 ring-2 ring-indigo-200 text-indigo-950"
                      : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="paperSize"
                    checked={paperSize === "A4"}
                    onChange={() => {}}
                    className="accent-indigo-600"
                  />
                  <div>
                    <span className="font-extrabold text-xs block">Kertas A4 (210 x 297 mm)</span>
                    <span className="text-[10px] text-slate-500">Standar cetak laporan nasional (Landscape/Portrait).</span>
                  </div>
                </label>

                <label
                  onClick={() => setPaperSize && setPaperSize("F4")}
                  className={`p-3.5 rounded-2xl border cursor-pointer flex items-center gap-3 transition-all ${
                    paperSize === "F4"
                      ? "bg-indigo-50/70 border-indigo-500 ring-2 ring-indigo-200 text-indigo-950"
                      : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="paperSize"
                    checked={paperSize === "F4"}
                    onChange={() => {}}
                    className="accent-indigo-600"
                  />
                  <div>
                    <span className="font-extrabold text-xs block">Kertas F4 / Folio (215 x 330 mm)</span>
                    <span className="text-[10px] text-slate-500">Ukuran HVS panjang untuk tabel laporan mendatar/lebar.</span>
                  </div>
                </label>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
