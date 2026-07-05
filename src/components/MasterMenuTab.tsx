/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { MasterMenu, MenuItem, SPPGProfile } from "../types";
import { downloadElementAsImage } from "../lib/printUtils";
import { 
  BookOpen, 
  Copy, 
  Clipboard, 
  Sparkles, 
  AlertCircle, 
  Printer, 
  Edit3, 
  Eye, 
  Check, 
  RefreshCw,
  Trash2,
  RotateCcw,
  Image as ImageIcon
} from "lucide-react";

interface MasterMenuTabProps {
  menu: MasterMenu;
  onChange: (updated: MasterMenu) => void;
  profile?: SPPGProfile;
  customLogo?: string;
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
}

// Convert YYYY-MM-DD into "Senin, 08 Juni 2026"
const formatIndonesianDate = (dateStr: string): string => {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jum'at", "Sabtu"];
    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    return `${days[d.getDay()]}, ${d.getDate().toString().padStart(2, "0")} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch (e) {
    return dateStr;
  }
};

export default function MasterMenuTab({ 
  menu, 
  onChange, 
  profile, 
  customLogo,
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
  setRightLogo
}: MasterMenuTabProps) {
  const [activeCategory, setActiveCategory] = useState<"usiaSekolah" | "tigaB" | "mpAsi">("usiaSekolah");
  const [isAlergi, setIsAlergi] = useState<boolean>(false);
  const [copiedItem, setCopiedItem] = useState<{ sourceLabel: string; item: MenuItem } | null>(null);
  const [justPastedDay, setJustPastedDay] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"edit" | "print">("edit");
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  // Customizable category labels
  const [labelUsiaSekolah, setLabelUsiaSekolah] = useState(() => 
    localStorage.getItem("menu_label_usia_sekolah") || 
    "Anak Sekolah/Pendidik/Tenaga Pendidik (TK/PAUD, TK/PAUD/LB, SD/MI/SLB, SMP/MTS/SMPLB, Siswa SMA/SMK/MK/MASMALB, Pendidik & Tenaga Pendidikan)"
  );
  const [labelTigaB, setLabelTigaB] = useState(() => 
    localStorage.getItem("menu_label_tiga_b") || 
    "3B (Balita, Bumi & BUSUI)"
  );
  const [labelMpAsi, setLabelMpAsi] = useState(() => 
    localStorage.getItem("menu_label_mp_asi") || 
    "MP-ASI 6-12"
  );

  // State-driven confirmations to avoid native iframe-blocking dialogs
  const [resetDayIndex, setResetDayIndex] = useState<number | null>(null);
  const [showResetAllConfirm, setShowResetAllConfirm] = useState<boolean>(false);

  const handleLeftLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setLeftLogo(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRightLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setRightLogo(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetLeftLogo = () => {
    setLeftLogo("/src/assets/images/logo_sppg_1782256222616.jpg");
  };

  const resetRightLogo = () => {
    setRightLogo("");
  };

  // Sync with profile if changed and not manually customized
  useEffect(() => {
    if (profile) {
      if (!localStorage.getItem("kop_line3")) {
        setKopLine3(profile.namaLembaga);
      }
      if (!localStorage.getItem("kop_line4")) {
        setKopLine4(`Alamat : ${profile.alamat}`);
      }
    }
  }, [profile]);

  // Persist Category Labels in localStorage
  useEffect(() => {
    localStorage.setItem("menu_label_usia_sekolah", labelUsiaSekolah);
  }, [labelUsiaSekolah]);
  useEffect(() => {
    localStorage.setItem("menu_label_tiga_b", labelTigaB);
  }, [labelTigaB]);
  useEffect(() => {
    localStorage.setItem("menu_label_mp_asi", labelMpAsi);
  }, [labelMpAsi]);

  // Compute key in MasterMenu state
  const menuKey = (isAlergi ? `${activeCategory}Alergi` : activeCategory) as keyof MasterMenu;

  const handleFieldChange = (
    key: keyof MasterMenu,
    dayIndex: number,
    field: keyof MenuItem,
    value: string
  ) => {
    const list = menu[key] ? [...menu[key]] : [];
    // Ensure array has 12 items
    while (list.length < 12) {
      list.push({
        namaMenu: "",
        karbohidrat: "",
        laukHewani: "",
        laukNabati: "",
        sayur: "",
        buahSusu: ""
      });
    }
    list[dayIndex] = {
      ...list[dayIndex],
      [field]: value
    };
    onChange({ ...menu, [key]: list });
  };

  const copyMenu = (dayIdx: number, item: MenuItem) => {
    const label = `${isAlergi ? "Alergi " : ""}${activeCategory === "usiaSekolah" ? labelUsiaSekolah : activeCategory === "tigaB" ? labelTigaB : labelMpAsi} Hari ${dayIdx + 1}`;
    setCopiedItem({ sourceLabel: label, item });
  };

  const pasteMenu = (dayIdx: number) => {
    if (!copiedItem) return;
    const list = menu[menuKey] ? [...menu[menuKey]] : [];
    while (list.length < 12) {
      list.push({
        namaMenu: "",
        karbohidrat: "",
        laukHewani: "",
        laukNabati: "",
        sayur: "",
        buahSusu: ""
      });
    }
    list[dayIdx] = { ...copiedItem.item };
    onChange({ ...menu, [menuKey]: list });
    
    setJustPastedDay(dayIdx);
    setTimeout(() => setJustPastedDay(null), 1500);
  };

  const resetDayMenu = (dayIdx: number) => {
    setResetDayIndex(dayIdx);
  };

  const handleConfirmResetDay = (dayIdx: number) => {
    const list = menu[menuKey] ? [...menu[menuKey]] : [];
    while (list.length < 12) {
      list.push({
        namaMenu: "",
        karbohidrat: "",
        laukHewani: "",
        laukNabati: "",
        sayur: "",
        buahSusu: ""
      });
    }
    list[dayIdx] = {
      namaMenu: "",
      karbohidrat: "",
      laukHewani: "",
      laukNabati: "",
      sayur: "",
      buahSusu: ""
    };
    onChange({ ...menu, [menuKey]: list });
    setResetDayIndex(null);
  };

  const resetAllDaysMenu = () => {
    setShowResetAllConfirm(true);
  };

  const handleConfirmResetAllDays = () => {
    const list = Array.from({ length: 12 }, () => ({
      namaMenu: "",
      karbohidrat: "",
      laukHewani: "",
      laukNabati: "",
      sayur: "",
      buahSusu: ""
    }));
    onChange({ ...menu, [menuKey]: list });
    setShowResetAllConfirm(false);
  };

  const getCategoryLabel = (cat: typeof activeCategory, alergiMode: boolean) => {
    let base = "";
    switch (cat) {
      case "usiaSekolah":
        base = labelUsiaSekolah;
        break;
      case "tigaB":
        base = labelTigaB;
        break;
      case "mpAsi":
        base = labelMpAsi;
        break;
    }
    return alergiMode ? `${base} - DIET ALERGI` : `${base} - STANDAR`;
  };

  const triggerPrint = () => {
    window.print();
  };

  const getMenuItem = (idx: number): MenuItem => {
    const list = menu[menuKey] || [];
    return list[idx] || {
      namaMenu: "",
      karbohidrat: "",
      laukHewani: "",
      laukNabati: "",
      sayur: "",
      buahSusu: ""
    };
  };

  const logoSrc = customLogo || "/src/assets/images/logo_sppg_1782256222616.jpg";

  return (
    <div id="master-menu-tab-container" className="space-y-6">
      {/* Print Page Styles */}
      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 6mm;
          }
          /* Hide absolutely everything by default to prevent blank pages or stray elements */
          body * {
            visibility: hidden !important;
          }
          /* Ensure ONLY our print container and its contents are visible and styled */
          #print-area-master-menu, #print-area-master-menu * {
            visibility: visible !important;
          }
          #print-area-master-menu {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 285mm !important;
            height: 198mm !important;
            box-sizing: border-box !important;
            padding: 2mm 0 !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background-color: white !important;
          }
          body {
            background-color: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Keep tables compact so everything fits on a single A4 page */
          table {
            page-break-inside: avoid !important;
            width: 100% !important;
            margin-bottom: 4px !important;
            border-collapse: collapse !important;
          }
          th {
            padding: 3px 2px !important;
            font-size: 9.5pt !important;
            font-weight: bold !important;
          }
          td {
            padding: 2px !important;
            height: 25px !important;
            font-size: 9pt !important;
          }
          /* Hide inputs borders/outlines on print */
          input {
            border: none !important;
            background: transparent !important;
            box-shadow: none !important;
            outline: none !important;
            text-align: center !important;
            padding: 0 !important;
            width: 100% !important;
            font-size: 9pt !important;
            font-weight: 500 !important;
            color: black !important;
          }
          input::placeholder {
            color: transparent !important;
          }
          /* Hide non-printable elements */
          .no-print, button {
            display: none !important;
          }
        }
      `}</style>

      {/* Mode Switcher Banner (no-print) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm gap-4 no-print">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
            Mode Tampilan & Cetak Master Menu
          </h3>
          <p className="text-xs text-slate-500">
            Edit menu dalam grid modern, atau cetak langsung dengan format resmi KOP ukuran 14 dan isi 12.
          </p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-xs shrink-0 self-end sm:self-center">
          <button
            type="button"
            id="btn-mode-edit"
            onClick={() => setViewMode("edit")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              viewMode === "edit" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            Mode Edit Grid
          </button>
          <button
            type="button"
            id="btn-mode-print"
            onClick={() => setViewMode("print")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              viewMode === "print" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            Pratinjau Cetak A4
          </button>
        </div>
      </div>

      {/* Target Pricing Info Banner (no-print) */}
      <div className="bg-gradient-to-r from-indigo-50 via-slate-50 to-rose-50 p-4 rounded-2xl border border-slate-200/60 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4 items-center no-print">
        <div className="md:col-span-1 space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
            <span className="text-xs font-bold text-indigo-950 uppercase tracking-wider">Metodologi & Anggaran</span>
          </div>
          <h4 className="text-sm font-bold text-slate-800">Standar Harga Per Porsi</h4>
          <p className="text-xs text-slate-500">Peta menu dan kalkulator diselaraskan dengan plafon unit-cost nasional:</p>
        </div>
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white p-2.5 rounded-xl border border-slate-200/50 text-center shadow-xs">
            <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider block">Anak Sekolah</span>
            <span className="text-sm font-extrabold text-slate-800 font-mono">Rp 8.000 / porsi</span>
            <span className="text-[9px] text-slate-400 block mt-0.5">(TK/PAUD, SD Kelas 1-3)</span>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-slate-200/50 text-center shadow-xs">
            <span className="text-[10px] text-rose-600 font-bold uppercase tracking-wider block">Balita (Kelompok 3B)</span>
            <span className="text-sm font-extrabold text-slate-800 font-mono">Rp 8.000 / porsi</span>
            <span className="text-[9px] text-slate-400 block mt-0.5">(Umur 13-59 Bulan)</span>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-slate-200/50 text-center shadow-xs">
            <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block">Bumil / Busui</span>
            <span className="text-sm font-extrabold text-slate-800 font-mono">Rp 10.000 / porsi</span>
            <span className="text-[9px] text-slate-400 block mt-0.5">(Ibu Hamil & Menyusui)</span>
          </div>
        </div>
      </div>

      {/* Configuration & Synchronization of Category Names (no-print) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm no-print space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600 shrink-0">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                Konfigurasi Nama Kategori Master Menu
              </h4>
              <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
                Sesuaikan nama kelompok sasaran menu di bawah ini. Perubahan akan langsung disinkronkan ke seluruh sistem, halaman edit, dan pratinjau cetak resmi.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Kembalikan nama kategori ke standar juknis?")) {
                setLabelUsiaSekolah("Anak Sekolah/Pendidik/Tenaga Pendidik (TK/PAUD, TK/PAUD/LB, SD/MI/SLB, SMP/MTS/SMPLB, Siswa SMA/SMK/MK/MASMALB, Pendidik & Tenaga Pendidikan)");
                setLabelTigaB("3B (Balita, Bumi & BUSUI)");
                setLabelMpAsi("MP-ASI 6-12");
              }
            }}
            className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
            title="Reset ke Standar Juknis"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset Standar
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-indigo-600 uppercase tracking-wider">
                Kategori 1: Usia Sekolah & Pendidik
              </label>
              <span className="text-[9px] font-bold text-slate-400 font-mono">ID: usiaSekolah</span>
            </div>
            <textarea
              rows={2}
              value={labelUsiaSekolah}
              onChange={(e) => setLabelUsiaSekolah(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 rounded-xl p-2.5 text-xs font-semibold leading-normal text-slate-800"
              placeholder="Nama Kategori Usia Sekolah"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-rose-600 uppercase tracking-wider">
                Kategori 2: Kelompok 3B
              </label>
              <span className="text-[9px] font-bold text-slate-400 font-mono">ID: tigaB</span>
            </div>
            <textarea
              rows={2}
              value={labelTigaB}
              onChange={(e) => setLabelTigaB(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20 rounded-xl p-2.5 text-xs font-semibold leading-normal text-slate-800"
              placeholder="Nama Kategori 3B"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">
                Kategori 3: MP-ASI 6-12
              </label>
              <span className="text-[9px] font-bold text-slate-400 font-mono">ID: mpAsi</span>
            </div>
            <textarea
              rows={2}
              value={labelMpAsi}
              onChange={(e) => setLabelMpAsi(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 rounded-xl p-2.5 text-xs font-semibold leading-normal text-slate-800"
              placeholder="Nama Kategori MP-ASI"
            />
          </div>
        </div>
      </div>

      {/* Primary Selectors (Always visible, helpful to switch categories directly) */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center no-print">
        {/* Standard vs Alergi Toggle */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-xs shrink-0">
          <button
            id="btn-menu-std"
            type="button"
            onClick={() => setIsAlergi(false)}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              !isAlergi ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Menu Standar
          </button>
          <button
            id="btn-menu-alergi"
            type="button"
            onClick={() => setIsAlergi(true)}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              isAlergi ? "bg-white text-rose-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            Menu Diet Alergi
          </button>
        </div>

        {/* Group Selector */}
        <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-xl w-full sm:w-auto max-w-lg shadow-xs">
          <button
            id="btn-group-sekolah"
            type="button"
            onClick={() => setActiveCategory("usiaSekolah")}
            className={`flex-1 sm:flex-none py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
              activeCategory === "usiaSekolah"
                ? "bg-white text-slate-800 shadow-sm border border-slate-200/50"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            Usia Sekolah & Pendidik
          </button>
          <button
            id="btn-group-3b"
            type="button"
            onClick={() => setActiveCategory("tigaB")}
            className={`flex-1 sm:flex-none py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
              activeCategory === "tigaB"
                ? "bg-white text-slate-800 shadow-sm border border-slate-200/50"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            Kelompok 3B
          </button>
          <button
            id="btn-group-mpasi"
            type="button"
            onClick={() => setActiveCategory("mpAsi")}
            className={`flex-1 sm:flex-none py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
              activeCategory === "mpAsi"
                ? "bg-white text-slate-800 shadow-sm border border-slate-200/50"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            MP-ASI 6-12
          </button>
        </div>
      </div>

      {/* --- VIEW MODE: EDIT GRID --- */}
      {viewMode === "edit" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm no-print">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
            <div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${isAlergi ? "bg-rose-50 text-rose-700 border border-rose-100" : "bg-indigo-50 text-indigo-700 border border-indigo-100"}`}>
                {isAlergi ? "Diet Alergi" : "Siklus Standar"}
              </span>
              <h3 className="text-base font-bold text-slate-800 mt-2 flex items-center gap-2">
                Perencanaan Menu 12 Hari — {getCategoryLabel(activeCategory, isAlergi)}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Tentukan nama menu dan komponen makanan. Gunakan tombol salin & tempel untuk mereplikasi item dengan cepat.
              </p>
            </div>

            {/* Action Buttons & Copied item banner */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              {copiedItem && (
                <div className="bg-amber-50 text-amber-800 text-xs py-2 px-4 rounded-xl border border-amber-200 flex items-center gap-2 shadow-sm animate-pulse max-w-sm">
                  <Clipboard className="w-4 h-4 text-amber-600 shrink-0" />
                  <div className="leading-tight">
                    <span className="font-bold block text-[10px] text-amber-900 uppercase">Tersimpan di Clipboard</span>
                    <span>Copied: {copiedItem.item.namaMenu || "Bahan Makanan"}</span>
                  </div>
                </div>
              )}
              <button
                type="button"
                id="btn-reset-all-menu"
                onClick={resetAllDaysMenu}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 hover:text-rose-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs shrink-0"
                title="Reset perencanaan untuk semua 12 hari"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Semua Hari
              </button>
            </div>
          </div>

          {/* 12-Day grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 12 }).map((_, idx) => {
              const currentList = menu[menuKey] || [];
              const item: MenuItem = currentList[idx] || {
                namaMenu: "",
                karbohidrat: "",
                laukHewani: "",
                laukNabati: "",
                sayur: "",
                buahSusu: ""
              };

              return (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border transition-all duration-200 space-y-3 relative group shadow-sm ${
                    justPastedDay === idx
                      ? "bg-emerald-50/50 border-emerald-300 ring-2 ring-emerald-500/10 scale-[0.98]"
                      : "border-slate-100 bg-slate-50/40 hover:bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  {/* Inline Reset Confirmation Overlay */}
                  {resetDayIndex === idx && (
                    <div className="absolute inset-0 bg-white/95 backdrop-blur-xs rounded-xl flex flex-col items-center justify-center p-4 text-center z-10 space-y-3 animate-in fade-in duration-100">
                      <div className="p-2 bg-rose-50 rounded-full text-rose-600">
                        <Trash2 className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-slate-900 font-sans">Kosongkan Hari {idx + 1}?</h4>
                        <p className="text-[10px] text-slate-500 leading-normal px-2">Semua komponen makanan hari ini akan dihapus.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setResetDayIndex(null)}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg transition"
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          onClick={() => handleConfirmResetDay(idx)}
                          className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded-lg transition"
                        >
                          Ya, Kosongkan
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Day Header with copy/paste */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-extrabold text-indigo-600 uppercase tracking-wider font-mono">Hari {idx + 1}</span>
                    
                    <div className="flex items-center gap-1">
                      <button
                        id={`btn-copy-menu-${idx}`}
                        type="button"
                        onClick={() => copyMenu(idx, item)}
                        className="p-1 hover:bg-white rounded border border-transparent hover:border-slate-200 text-slate-400 hover:text-slate-600 transition"
                        title="Salin perencanaan hari ini"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      {copiedItem && (
                        <button
                          id={`btn-paste-menu-${idx}`}
                          type="button"
                          onClick={() => pasteMenu(idx)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border transition ${
                            justPastedDay === idx
                              ? "bg-emerald-600 text-white border-emerald-600"
                              : "bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border-indigo-100"
                          }`}
                          title="Tempel menu yang disalin"
                        >
                          {justPastedDay === idx ? "Pasted!" : "Tempel"}
                        </button>
                      )}
                      <button
                        id={`btn-reset-menu-${idx}`}
                        type="button"
                        onClick={() => resetDayMenu(idx)}
                        className="p-1 hover:bg-rose-50 rounded border border-transparent hover:border-rose-100 text-slate-400 hover:text-rose-600 transition"
                        title="Reset menu hari ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Form fields */}
                  <div className="space-y-2">
                    <div className="space-y-0.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nama Menu Utama</label>
                      <input
                        id={`menu-nama-${menuKey}-${idx}`}
                        type="text"
                        value={item.namaMenu}
                        onChange={(e) => handleFieldChange(menuKey, idx, "namaMenu", e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg text-xs p-2 text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        placeholder="e.g. Nasi Ayam Panggang Madu"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-0.5">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Karbohidrat</label>
                        <input
                          id={`menu-karbo-${menuKey}-${idx}`}
                          type="text"
                          value={item.karbohidrat}
                          onChange={(e) => handleFieldChange(menuKey, idx, "karbohidrat", e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg text-[11px] p-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          placeholder="Nasi Putih"
                        />
                      </div>

                      <div className="space-y-0.5">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Lauk Hewani</label>
                        <input
                          id={`menu-hewani-${menuKey}-${idx}`}
                          type="text"
                          value={item.laukHewani}
                          onChange={(e) => handleFieldChange(menuKey, idx, "laukHewani", e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg text-[11px] p-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          placeholder="Ayam Panggang"
                        />
                      </div>

                      <div className="space-y-0.5">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Lauk Nabati</label>
                        <input
                          id={`menu-nabati-${menuKey}-${idx}`}
                          type="text"
                          value={item.laukNabati}
                          onChange={(e) => handleFieldChange(menuKey, idx, "laukNabati", e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg text-[11px] p-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          placeholder="Tempe Bacem"
                        />
                      </div>

                      <div className="space-y-0.5">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Sayur</label>
                        <input
                          id={`menu-sayur-${menuKey}-${idx}`}
                          type="text"
                          value={item.sayur}
                          onChange={(e) => handleFieldChange(menuKey, idx, "sayur", e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg text-[11px] p-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          placeholder="Sup Wortel"
                        />
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Buah / Susu / Lainnya</label>
                      <input
                        id={`menu-buahsusu-${menuKey}-${idx}`}
                        type="text"
                        value={item.buahSusu}
                        onChange={(e) => handleFieldChange(menuKey, idx, "buahSusu", e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg text-[11px] p-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        placeholder="Pisang + Susu"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- VIEW MODE: PRATINJAU CETAK A4 --- */}
      {viewMode === "print" && (
        <div className="space-y-6">
          {/* Custom Kop Editor panel (no-print) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-4 no-print">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Sesuaikan KOP Surat & Cetak</h4>
              <div className="flex items-center gap-2">
                <button
                  id="btn-print-action-img"
                  type="button"
                  disabled={!!isDownloading}
                  onClick={() => downloadElementAsImage("print-area-master-menu", `Master_Menu_${activeCategory}_Siklus_${isAlergi ? "Alergi" : "Standar"}`, setIsDownloading)}
                  className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md flex items-center gap-2 transition"
                >
                  <ImageIcon className="w-4 h-4" />
                  {isDownloading === "Memproses gambar..." || isDownloading === "Mengunduh gambar..." ? isDownloading : "Unduh Gambar (PNG)"}
                </button>
                <button
                  id="btn-print-action"
                  type="button"
                  onClick={triggerPrint}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md flex items-center gap-2 transition"
                >
                  <Printer className="w-4 h-4" />
                  Cetak / Download PDF (A4 Landscape)
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">KOP Baris 1</label>
                <input
                  type="text"
                  value={kopLine1}
                  onChange={(e) => setKopLine1(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs p-2 text-slate-800 font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">KOP Baris 2</label>
                <input
                  type="text"
                  value={kopLine2}
                  onChange={(e) => setKopLine2(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs p-2 text-slate-800 font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">KOP Baris 3 (Nama SPPG)</label>
                <input
                  type="text"
                  value={kopLine3}
                  onChange={(e) => setKopLine3(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs p-2 text-slate-800 font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">KOP Baris 4 (Alamat SPPG - Di-underline)</label>
                <input
                  type="text"
                  value={kopLine4}
                  onChange={(e) => setKopLine4(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs p-2 text-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-3">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Logo Kiri (Badan Gizi Nasional)</span>
                <div className="flex items-center gap-2">
                  <label className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer shadow-xs inline-flex items-center gap-1.5">
                    <span>Pilih Gambar...</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleLeftLogoUpload} 
                      className="hidden" 
                    />
                  </label>
                  {leftLogo !== "/src/assets/images/logo_sppg_1782256222616.jpg" && (
                    <button
                      type="button"
                      onClick={resetLeftLogo}
                      className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline"
                    >
                      Reset Default
                    </button>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Logo Kanan (Lembaga / Profil)</span>
                <div className="flex items-center gap-2">
                  <label className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer shadow-xs inline-flex items-center gap-1.5">
                    <span>Pilih Gambar...</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleRightLogoUpload} 
                      className="hidden" 
                    />
                  </label>
                  {rightLogo && (
                    <button
                      type="button"
                      onClick={resetRightLogo}
                      className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline"
                    >
                      Hapus Logo
                    </button>
                  )}
                </div>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 italic">
              Tip: Klik gambar logo atau ketik tulisan Kop Surat langsung di kertas di bawah untuk mengedit secara visual sebelum dicetak!
            </p>
          </div>

          {/* Printable Layout Sheet */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-inner flex justify-center no-print overflow-x-auto">
            <div 
              id="print-area-master-menu" 
              className="bg-white p-8 border border-slate-300 shadow-md w-full max-w-[297mm] min-w-[210mm] font-sans text-slate-900 print:text-black print:border-none print:shadow-none print:p-0 print:m-0"
            >
              {/* Kop Surat Header (Format Gambar 2 dengan Logo Kiri dan Kanan) */}
              <div className="relative flex items-center justify-between pb-3 border-b-2 border-black w-full" style={{ minHeight: '90px' }}>
                
                {/* Left Logo Container */}
                <div className="flex flex-col items-center justify-center w-24 h-24 shrink-0 relative group">
                  <img 
                    src={leftLogo} 
                    alt="Logo Kiri" 
                    className="w-20 h-20 object-contain" 
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/src/assets/images/logo_sppg_1782256222616.jpg";
                    }}
                  />
                  {/* Hover Edit Overlay (no-print) */}
                  <label className="absolute inset-0 bg-black/50 text-white text-[9px] font-bold flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer rounded transition-opacity duration-150 no-print">
                    <span>Ganti Logo Kiri</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleLeftLogoUpload} 
                      className="hidden" 
                    />
                  </label>
                </div>

                {/* Centered Kop Text - 100% Bold and Centered according to Image 2 */}
                <div className="text-center font-sans tracking-wide leading-snug px-4 flex-1">
                  <input
                    type="text"
                    value={kopLine1}
                    onChange={(e) => setKopLine1(e.target.value)}
                    className="w-full text-center bg-transparent border-0 focus:ring-0 p-0 font-bold uppercase text-slate-950 print:text-black font-sans leading-none"
                    style={{ fontSize: '14pt', fontWeight: 'bold' }}
                  />
                  <input
                    type="text"
                    value={kopLine2}
                    onChange={(e) => setKopLine2(e.target.value)}
                    className="w-full text-center bg-transparent border-0 focus:ring-0 p-0 font-bold uppercase text-slate-950 print:text-black font-sans leading-none mt-1"
                    style={{ fontSize: '13pt', fontWeight: 'bold' }}
                  />
                  <input
                    type="text"
                    value={kopLine3}
                    onChange={(e) => setKopLine3(e.target.value)}
                    className="w-full text-center bg-transparent border-0 focus:ring-0 p-0 font-bold uppercase text-slate-950 print:text-black font-sans leading-none mt-1"
                    style={{ fontSize: '13pt', fontWeight: 'bold' }}
                  />
                  <div className="w-full mt-1.5 flex justify-center">
                    <input
                      type="text"
                      value={kopLine4}
                      onChange={(e) => setKopLine4(e.target.value)}
                      className="text-center bg-transparent border-0 focus:ring-0 p-0 italic text-slate-700 print:text-black font-sans underline"
                      style={{ fontSize: '10pt', width: '100%' }}
                    />
                  </div>
                </div>

                {/* Right Logo Container */}
                <div className="flex flex-col items-center justify-center w-24 h-24 shrink-0 relative group border border-dashed border-slate-300 rounded print:border-none">
                  {rightLogo ? (
                    <>
                      <img 
                        src={rightLogo} 
                        alt="Logo Kanan" 
                        className="w-20 h-20 object-contain" 
                        referrerPolicy="no-referrer"
                      />
                      {/* Hover Edit Overlay (no-print) */}
                      <label className="absolute inset-0 bg-black/50 text-white text-[9px] font-bold flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer rounded transition-opacity duration-150 no-print">
                        <span>Ganti Logo Kanan</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleRightLogoUpload} 
                          className="hidden" 
                        />
                      </label>
                    </>
                  ) : (
                    <label className="w-full h-full flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 cursor-pointer text-center p-1 rounded transition duration-150 group print:hidden">
                      <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-600 leading-tight">Upload Logo</span>
                      <span className="text-[8px] text-slate-400 group-hover:text-slate-500 mt-0.5 leading-tight">(Profil)</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleRightLogoUpload} 
                        className="hidden" 
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Subtitle below Kop line to specify which Menu is printed */}
              <div className="text-center font-bold uppercase mt-3 mb-2" style={{ fontSize: '12pt' }}>
                PERENCANAAN SIKLUS MENU 12 HARI
                <div className="text-indigo-600 print:text-black font-extrabold" style={{ fontSize: '10.5pt', marginTop: '2px' }}>
                  {getCategoryLabel(activeCategory, isAlergi)}
                </div>
              </div>

              {/* TABLE 1: Hari 1 - 6 */}
              <div className="space-y-6">
                <table className="w-full border-collapse border border-black" style={{ fontSize: '12pt' }}>
                  <thead>
                    {/* Green Master Menu banner */}
                    <tr style={{ backgroundColor: '#92D050' }}>
                      <th 
                        colSpan={6} 
                        className="border border-black text-center font-bold uppercase py-2.5 text-slate-900 print:text-black" 
                        style={{ backgroundColor: '#92D050', fontSize: '14pt' }}
                      >
                        MASTER MENU
                      </th>
                    </tr>
                    {/* Days and Dates Yellow row */}
                    <tr style={{ backgroundColor: '#FFFF00' }}>
                      {Array.from({ length: 6 }).map((_, i) => {
                        const dayIdx = i;
                        const dateStr = profile?.periodeDates[dayIdx] || "";
                        return (
                          <th 
                            key={dayIdx} 
                            className="border border-black text-center font-bold py-2 px-1 text-slate-900 print:text-black w-1/6" 
                            style={{ backgroundColor: '#FFFF00', fontSize: '11pt' }}
                          >
                            {dateStr ? formatIndonesianDate(dateStr) : `Hari ${dayIdx + 1}`}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {/* 5 component rows: Karbohidrat, Lauk Hewani, Lauk Nabati, Sayur, BuahSusu */}
                    {/* Row 1: Karbohidrat */}
                    <tr className="hover:bg-slate-50">
                      {Array.from({ length: 6 }).map((_, i) => {
                        const dayIdx = i;
                        const item = getMenuItem(dayIdx);
                        return (
                          <td key={dayIdx} className="border border-black p-1 text-center h-10 w-1/6">
                            <input
                              type="text"
                              value={item.karbohidrat}
                              onChange={(e) => handleFieldChange(menuKey, dayIdx, "karbohidrat", e.target.value)}
                              className="w-full text-center bg-transparent border-0 focus:ring-0 p-0 font-medium text-slate-800 print:text-black"
                              style={{ fontSize: '11pt' }}
                              placeholder="-"
                            />
                          </td>
                        );
                      })}
                    </tr>
                    {/* Row 2: Lauk Hewani */}
                    <tr className="hover:bg-slate-50">
                      {Array.from({ length: 6 }).map((_, i) => {
                        const dayIdx = i;
                        const item = getMenuItem(dayIdx);
                        return (
                          <td key={dayIdx} className="border border-black p-1 text-center h-10 w-1/6">
                            <input
                              type="text"
                              value={item.laukHewani}
                              onChange={(e) => handleFieldChange(menuKey, dayIdx, "laukHewani", e.target.value)}
                              className="w-full text-center bg-transparent border-0 focus:ring-0 p-0 font-medium text-slate-800 print:text-black"
                              style={{ fontSize: '11pt' }}
                              placeholder="-"
                            />
                          </td>
                        );
                      })}
                    </tr>
                    {/* Row 3: Lauk Nabati */}
                    <tr className="hover:bg-slate-50">
                      {Array.from({ length: 6 }).map((_, i) => {
                        const dayIdx = i;
                        const item = getMenuItem(dayIdx);
                        return (
                          <td key={dayIdx} className="border border-black p-1 text-center h-10 w-1/6">
                            <input
                              type="text"
                              value={item.laukNabati}
                              onChange={(e) => handleFieldChange(menuKey, dayIdx, "laukNabati", e.target.value)}
                              className="w-full text-center bg-transparent border-0 focus:ring-0 p-0 font-medium text-slate-800 print:text-black"
                              style={{ fontSize: '11pt' }}
                              placeholder="-"
                            />
                          </td>
                        );
                      })}
                    </tr>
                    {/* Row 4: Sayur */}
                    <tr className="hover:bg-slate-50">
                      {Array.from({ length: 6 }).map((_, i) => {
                        const dayIdx = i;
                        const item = getMenuItem(dayIdx);
                        return (
                          <td key={dayIdx} className="border border-black p-1 text-center h-10 w-1/6">
                            <input
                              type="text"
                              value={item.sayur}
                              onChange={(e) => handleFieldChange(menuKey, dayIdx, "sayur", e.target.value)}
                              className="w-full text-center bg-transparent border-0 focus:ring-0 p-0 font-medium text-slate-800 print:text-black"
                              style={{ fontSize: '11pt' }}
                              placeholder="-"
                            />
                          </td>
                        );
                      })}
                    </tr>
                    {/* Row 5: Buah/Susu */}
                    <tr className="hover:bg-slate-50">
                      {Array.from({ length: 6 }).map((_, i) => {
                        const dayIdx = i;
                        const item = getMenuItem(dayIdx);
                        return (
                          <td key={dayIdx} className="border border-black p-1 text-center h-10 w-1/6">
                            <input
                              type="text"
                              value={item.buahSusu}
                              onChange={(e) => handleFieldChange(menuKey, dayIdx, "buahSusu", e.target.value)}
                              className="w-full text-center bg-transparent border-0 focus:ring-0 p-0 font-medium text-slate-800 print:text-black"
                              style={{ fontSize: '11pt' }}
                              placeholder="-"
                            />
                          </td>
                        );
                      })}
                    </tr>
                    {/* Footer Row: MENU 1 - 6 */}
                    <tr style={{ backgroundColor: '#D1D5DB' }} className="font-bold">
                      {Array.from({ length: 6 }).map((_, i) => {
                        const dayIdx = i;
                        return (
                          <td 
                            key={dayIdx} 
                            className="border border-black py-1.5 px-1 text-center text-slate-800 print:text-black w-1/6"
                            style={{ backgroundColor: '#D1D5DB', fontSize: '10pt' }}
                          >
                            MENU {dayIdx + 1}
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>

                {/* Divider space */}
                <div className="h-4"></div>

                {/* TABLE 2: Hari 7 - 12 */}
                <table className="w-full border-collapse border border-black" style={{ fontSize: '12pt' }}>
                  <thead>
                    {/* Days and Dates Yellow row */}
                    <tr style={{ backgroundColor: '#FFFF00' }}>
                      {Array.from({ length: 6 }).map((_, i) => {
                        const dayIdx = i + 6;
                        const dateStr = profile?.periodeDates[dayIdx] || "";
                        return (
                          <th 
                            key={dayIdx} 
                            className="border border-black text-center font-bold py-2 px-1 text-slate-900 print:text-black w-1/6" 
                            style={{ backgroundColor: '#FFFF00', fontSize: '11pt' }}
                          >
                            {dateStr ? formatIndonesianDate(dateStr) : `Hari ${dayIdx + 1}`}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {/* 5 component rows */}
                    {/* Row 1: Karbohidrat */}
                    <tr className="hover:bg-slate-50">
                      {Array.from({ length: 6 }).map((_, i) => {
                        const dayIdx = i + 6;
                        const item = getMenuItem(dayIdx);
                        return (
                          <td key={dayIdx} className="border border-black p-1 text-center h-10 w-1/6">
                            <input
                              type="text"
                              value={item.karbohidrat}
                              onChange={(e) => handleFieldChange(menuKey, dayIdx, "karbohidrat", e.target.value)}
                              className="w-full text-center bg-transparent border-0 focus:ring-0 p-0 font-medium text-slate-800 print:text-black"
                              style={{ fontSize: '11pt' }}
                              placeholder="-"
                            />
                          </td>
                        );
                      })}
                    </tr>
                    {/* Row 2: Lauk Hewani */}
                    <tr className="hover:bg-slate-50">
                      {Array.from({ length: 6 }).map((_, i) => {
                        const dayIdx = i + 6;
                        const item = getMenuItem(dayIdx);
                        return (
                          <td key={dayIdx} className="border border-black p-1 text-center h-10 w-1/6">
                            <input
                              type="text"
                              value={item.laukHewani}
                              onChange={(e) => handleFieldChange(menuKey, dayIdx, "laukHewani", e.target.value)}
                              className="w-full text-center bg-transparent border-0 focus:ring-0 p-0 font-medium text-slate-800 print:text-black"
                              style={{ fontSize: '11pt' }}
                              placeholder="-"
                            />
                          </td>
                        );
                      })}
                    </tr>
                    {/* Row 3: Lauk Nabati */}
                    <tr className="hover:bg-slate-50">
                      {Array.from({ length: 6 }).map((_, i) => {
                        const dayIdx = i + 6;
                        const item = getMenuItem(dayIdx);
                        return (
                          <td key={dayIdx} className="border border-black p-1 text-center h-10 w-1/6">
                            <input
                              type="text"
                              value={item.laukNabati}
                              onChange={(e) => handleFieldChange(menuKey, dayIdx, "laukNabati", e.target.value)}
                              className="w-full text-center bg-transparent border-0 focus:ring-0 p-0 font-medium text-slate-800 print:text-black"
                              style={{ fontSize: '11pt' }}
                              placeholder="-"
                            />
                          </td>
                        );
                      })}
                    </tr>
                    {/* Row 4: Sayur */}
                    <tr className="hover:bg-slate-50">
                      {Array.from({ length: 6 }).map((_, i) => {
                        const dayIdx = i + 6;
                        const item = getMenuItem(dayIdx);
                        return (
                          <td key={dayIdx} className="border border-black p-1 text-center h-10 w-1/6">
                            <input
                              type="text"
                              value={item.sayur}
                              onChange={(e) => handleFieldChange(menuKey, dayIdx, "sayur", e.target.value)}
                              className="w-full text-center bg-transparent border-0 focus:ring-0 p-0 font-medium text-slate-800 print:text-black"
                              style={{ fontSize: '11pt' }}
                              placeholder="-"
                            />
                          </td>
                        );
                      })}
                    </tr>
                    {/* Row 5: Buah/Susu */}
                    <tr className="hover:bg-slate-50">
                      {Array.from({ length: 6 }).map((_, i) => {
                        const dayIdx = i + 6;
                        const item = getMenuItem(dayIdx);
                        return (
                          <td key={dayIdx} className="border border-black p-1 text-center h-10 w-1/6">
                            <input
                              type="text"
                              value={item.buahSusu}
                              onChange={(e) => handleFieldChange(menuKey, dayIdx, "buahSusu", e.target.value)}
                              className="w-full text-center bg-transparent border-0 focus:ring-0 p-0 font-medium text-slate-800 print:text-black"
                              style={{ fontSize: '11pt' }}
                              placeholder="-"
                            />
                          </td>
                        );
                      })}
                    </tr>
                    {/* Footer Row: MENU 7 - 12 */}
                    <tr style={{ backgroundColor: '#D1D5DB' }} className="font-bold">
                      {Array.from({ length: 6 }).map((_, i) => {
                        const dayIdx = i + 6;
                        return (
                          <td 
                            key={dayIdx} 
                            className="border border-black py-1.5 px-1 text-center text-slate-800 print:text-black w-1/6"
                            style={{ backgroundColor: '#D1D5DB', fontSize: '10pt' }}
                          >
                            MENU {dayIdx + 1}
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset All Days Modal Confirmation */}
      {showResetAllConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-100 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-50 rounded-full shrink-0">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Reset Semua Hari?</h3>
                <p className="text-[10px] text-slate-500 font-medium">Kategori: {getCategoryLabel(activeCategory, isAlergi)}</p>
              </div>
            </div>
            
            <p className="text-xs text-slate-600 leading-relaxed">
              Tindakan ini akan mengosongkan seluruh isi menu perencanaan untuk <strong>semua 12 hari</strong> pada kategori yang sedang aktif ini. Tindakan ini tidak dapat dibatalkan.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowResetAllConfirm(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmResetAllDays}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-rose-500/10"
              >
                Ya, Reset Semua Hari
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
