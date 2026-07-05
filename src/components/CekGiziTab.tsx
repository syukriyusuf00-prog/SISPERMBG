/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { TKPIItem, CekGiziInput } from "../types";
import { TARGET_AKG_LIMITS } from "../tkpiData";
import { Sparkles, Plus, Trash2, ArrowUpRight, Scale, Activity, Settings, Sliders, ChevronDown, ChevronUp, Printer, Download, Image as ImageIcon } from "lucide-react";
import SearchableTkpiDropdown from "./SearchableTkpiDropdown";
import { downloadElementAsImage } from "../lib/printUtils";

interface CekGiziTabProps {
  tkpiList: TKPIItem[];
  items: CekGiziInput[];
  setItems: React.Dispatch<React.SetStateAction<CekGiziInput[]>>;
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

export default function CekGiziTab({ 
  tkpiList,
  items,
  setItems,
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
}: CekGiziTabProps) {
  const [rujukanAkgType, setRujukanAkgType] = useState<string>("sd_besar");
  const [customRujukanAkg, setCustomRujukanAkg] = useState<number>(700); // kkal
  const [showTargetsEditor, setShowTargetsEditor] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"edit" | "print">("edit");
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  // Initialize detailed targets for all 19 nutrients
  const [akgTargets, setAkgTargets] = useState<Record<string, number>>(() => {
    const targetEnergy = 634; // standard for sd_besar
    const scaleFactor = targetEnergy / 2150;
    return {
      energi: targetEnergy,
      protein: 15,
      lemak: 18,
      kh: 85,
      serat: 8,
      abu: Number((5 * scaleFactor).toFixed(2)),
      ca: Number((1000 * scaleFactor).toFixed(1)),
      p: Number((700 * scaleFactor).toFixed(1)),
      fe: Number((15 * scaleFactor).toFixed(2)),
      na: Number((1500 * scaleFactor).toFixed(0)),
      k: Number((4700 * scaleFactor).toFixed(0)),
      cu: Number((0.9 * scaleFactor).toFixed(2)),
      zn: Number((10 * scaleFactor).toFixed(2)),
      retinol: Number((600 * scaleFactor).toFixed(0)),
      b_karoten: Number((1500 * scaleFactor).toFixed(0)),
      thiamin: Number((1.2 * scaleFactor).toFixed(2)),
      riboflavin: Number((1.3 * scaleFactor).toFixed(2)),
      niasin: Number((15 * scaleFactor).toFixed(2)),
      vit_c: Number((90 * scaleFactor).toFixed(1))
    };
  });

  // Handle template change
  const handleRujukanChange = (type: string) => {
    setRujukanAkgType(type);
    if (type !== "custom") {
      const config = TARGET_AKG_LIMITS[type];
      const targetEnergy = config ? (config.energiMin + config.energiMax) / 2 : 700;
      const scaleFactor = targetEnergy / 2150;
      
      setAkgTargets({
        energi: Number(targetEnergy.toFixed(0)),
        protein: config ? config.proteinMin : Number((65 * scaleFactor).toFixed(1)),
        lemak: config ? config.lemakMin : Number((70 * scaleFactor).toFixed(1)),
        kh: config ? config.khMin : Number((325 * scaleFactor).toFixed(1)),
        serat: config ? config.seratMin : Number((30 * scaleFactor).toFixed(1)),
        abu: Number((5 * scaleFactor).toFixed(2)),
        ca: Number((1000 * scaleFactor).toFixed(1)),
        p: Number((700 * scaleFactor).toFixed(1)),
        fe: Number((15 * scaleFactor).toFixed(2)),
        na: Number((1500 * scaleFactor).toFixed(0)),
        k: Number((4700 * scaleFactor).toFixed(0)),
        cu: Number((0.9 * scaleFactor).toFixed(2)),
        zn: Number((10 * scaleFactor).toFixed(2)),
        retinol: Number((600 * scaleFactor).toFixed(0)),
        b_karoten: Number((1500 * scaleFactor).toFixed(0)),
        thiamin: Number((1.2 * scaleFactor).toFixed(2)),
        riboflavin: Number((1.3 * scaleFactor).toFixed(2)),
        niasin: Number((15 * scaleFactor).toFixed(2)),
        vit_c: Number((90 * scaleFactor).toFixed(1))
      });
    }
  };

  // Handle custom total energy change
  const handleCustomEnergyChange = (energyVal: number) => {
    setCustomRujukanAkg(energyVal);
    const scaleFactor = energyVal / 2150;
    setAkgTargets({
      energi: energyVal,
      protein: Number((65 * scaleFactor).toFixed(1)),
      lemak: Number((70 * scaleFactor).toFixed(1)),
      kh: Number((325 * scaleFactor).toFixed(1)),
      serat: Number((30 * scaleFactor).toFixed(1)),
      abu: Number((5 * scaleFactor).toFixed(2)),
      ca: Number((1000 * scaleFactor).toFixed(1)),
      p: Number((700 * scaleFactor).toFixed(1)),
      fe: Number((15 * scaleFactor).toFixed(2)),
      na: Number((1500 * scaleFactor).toFixed(0)),
      k: Number((4700 * scaleFactor).toFixed(0)),
      cu: Number((0.9 * scaleFactor).toFixed(2)),
      zn: Number((10 * scaleFactor).toFixed(2)),
      retinol: Number((600 * scaleFactor).toFixed(0)),
      b_karoten: Number((1500 * scaleFactor).toFixed(0)),
      thiamin: Number((1.2 * scaleFactor).toFixed(2)),
      riboflavin: Number((1.3 * scaleFactor).toFixed(2)),
      niasin: Number((15 * scaleFactor).toFixed(2)),
      vit_c: Number((90 * scaleFactor).toFixed(1))
    });
  };

  // Handle single custom target override
  const handleTargetFieldChange = (key: string, value: number) => {
    setAkgTargets((prev) => ({
      ...prev,
      [key]: value
    }));
    setRujukanAkgType("custom");
  };

  // Add a row to sandbox
  const addRow = () => {
    const newItem: CekGiziInput = {
      id: `cek_${Date.now()}`,
      namaMenu: items[0]?.namaMenu || "Menu Baru",
      tkpiId: tkpiList[0]?.id || "beras_giling",
      berat: 50,
      urt: "1 porsi"
    };
    setItems([...items, newItem]);
  };

  const removeRow = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const handleRowChange = (index: number, field: keyof CekGiziInput, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  // Calculations for all 22 nutrients
  const nutrientsList = [
    { key: "energi", label: "Energi", unit: "kkal", color: "bg-amber-500", text: "text-amber-700 font-bold" },
    { key: "protein", label: "Protein", unit: "g", color: "bg-indigo-500", text: "text-indigo-700 font-bold" },
    { key: "lemak", label: "Lemak", unit: "g", color: "bg-rose-500", text: "text-rose-700 font-bold" },
    { key: "kh", label: "Karbohidrat", unit: "g", color: "bg-cyan-500", text: "text-cyan-700 font-bold" },
    { key: "serat", label: "Serat", unit: "g", color: "bg-emerald-500", text: "text-emerald-700 font-medium" },
    { key: "abu", label: "Abu", unit: "g", color: "bg-slate-400", text: "text-slate-600 font-medium" },
    { key: "ca", label: "Kalsium (Ca)", unit: "mg", color: "bg-purple-500", text: "text-purple-700 font-medium" },
    { key: "p", label: "Fosfor (P)", unit: "mg", color: "bg-blue-500", text: "text-blue-700 font-medium" },
    { key: "fe", label: "Zat Besi (Fe)", unit: "mg", color: "bg-red-500", text: "text-red-700 font-medium" },
    { key: "na", label: "Natrium (Na)", unit: "mg", color: "bg-yellow-600", text: "text-yellow-800 font-medium" },
    { key: "k", label: "Kalium (K)", unit: "mg", color: "bg-teal-500", text: "text-teal-700 font-medium" },
    { key: "cu", label: "Tembaga (Cu)", unit: "mg", color: "bg-orange-400", text: "text-orange-700 font-medium" },
    { key: "zn", label: "Seng (Zn)", unit: "mg", color: "bg-sky-500", text: "text-sky-700 font-medium" },
    { key: "retinol", label: "Retinol", unit: "mcg", color: "bg-pink-400", text: "text-pink-700 font-medium" },
    { key: "b_karoten", label: "β-Karoten", unit: "mcg", color: "bg-amber-600", text: "text-amber-800 font-medium" },
    { key: "thiamin", label: "Thiamin (Vit B1)", unit: "mg", color: "bg-emerald-400", text: "text-emerald-800 font-medium" },
    { key: "riboflavin", label: "Riboflavin (Vit B2)", unit: "mg", color: "bg-lime-500", text: "text-lime-700 font-medium" },
    { key: "niasin", label: "Niasin", unit: "mg", color: "bg-violet-500", text: "text-violet-700 font-medium" },
    { key: "vit_c", label: "Vitamin C", unit: "mg", color: "bg-orange-500", text: "text-orange-700 font-medium" }
  ];

  // Sum up all nutrients
  const totals: Record<string, number> = {};
  nutrientsList.forEach((n) => {
    totals[n.key] = 0;
  });

  items.forEach((item) => {
    const tkpi = tkpiList.find((t) => t.id === item.tkpiId);
    if (tkpi) {
      const factor = (Number(item.berat) || 0) / 100;
      nutrientsList.forEach((n) => {
        totals[n.key] += ((tkpi as any)[n.key] || 0) * factor;
      });
    }
  });

  const getFulfillmentStatus = (percent: number) => {
    if (percent === 0) return { label: "N/A", textClass: "text-slate-400 bg-slate-100", barClass: "bg-slate-200" };
    if (percent < 90) return { label: "KURANG (<90%)", textClass: "text-amber-700 bg-amber-50 border border-amber-200", barClass: "bg-amber-500" };
    if (percent <= 110) return { label: "SESUAI (90-110%)", textClass: "text-emerald-700 bg-emerald-50 border border-emerald-200", barClass: "bg-emerald-500" };
    return { label: "LEBIH (>110%)", textClass: "text-rose-700 bg-rose-50 border border-rose-200", barClass: "bg-rose-500" };
  };

  return (
    <div id="cek-gizi-container" className="space-y-6">
      {/* Tab Switcher: Edit vs Cetak */}
      <div className="flex border-b border-slate-200 no-print">
        <button
          type="button"
          onClick={() => setViewMode("edit")}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition ${viewMode === "edit" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
        >
          📝 Kustomisasi & Edit Data
        </button>
        <button
          type="button"
          onClick={() => setViewMode("print")}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition ${viewMode === "print" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
        >
          🖨️ Pratinjau & Cetak Laporan (A4)
        </button>
      </div>

      {viewMode === "edit" && (
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-5">
            <div>
              <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                <Scale className="w-5 h-5 text-indigo-600" />
                Cek Kandungan Gizi Mandiri (Kalkulator Sandbox)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Simulasikan kombinasi porsi bahan makanan apa saja untuk mengukur detail 22 kandungan nutrisi lengkap secara langsung.
              </p>
            </div>

            <button
              id="btn-cekgizi-add"
              type="button"
              onClick={addRow}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah Komponen Bahan
            </button>
          </div>

          {/* Dynamic Items Table */}
          <div className="overflow-x-auto border border-slate-100 rounded-xl mb-6">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="p-3 pl-4 w-12 text-center">No</th>
                  <th className="p-3">Nama Menu</th>
                  <th className="p-3">Bahan Makanan (TKPI)</th>
                  <th className="p-3 text-right w-24">Berat (gram)</th>
                  <th className="p-3 text-center w-28">URT</th>
                  <th className="p-3 w-16 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 italic bg-slate-50/20">
                      Belum ada bahan makanan yang dimasukkan. Silakan tekan tombol tambah.
                    </td>
                  </tr>
                ) : (
                  items.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="p-2 pl-4 text-center text-slate-400 font-mono">{idx + 1}</td>
                      <td className="p-2">
                        <input
                          id={`cek-input-menu-${idx}`}
                          type="text"
                          value={item.namaMenu || ""}
                          onChange={(e) => handleRowChange(idx, "namaMenu", e.target.value)}
                          className="w-full bg-transparent border border-transparent hover:border-slate-200 focus:border-indigo-500 focus:bg-white rounded p-1 text-xs text-slate-800 font-medium"
                          placeholder="Nama Menu Uji"
                        />
                      </td>
                      <td className="p-2">
                        <SearchableTkpiDropdown
                          id={`cek-select-tkpi-${idx}`}
                          tkpiList={tkpiList}
                          selectedValue={item.tkpiId}
                          onChange={(tkpiId) => handleRowChange(idx, "tkpiId", tkpiId)}
                        />
                      </td>
                      <td className="p-2">
                        <input
                          id={`cek-input-berat-${idx}`}
                          type="number"
                          value={item.berat}
                          onChange={(e) => handleRowChange(idx, "berat", Number(e.target.value))}
                          className="w-full text-right bg-white border border-slate-200 rounded p-1 text-xs font-mono"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          id={`cek-input-urt-${idx}`}
                          type="text"
                          value={item.urt || ""}
                          onChange={(e) => handleRowChange(idx, "urt", e.target.value)}
                          className="w-full text-center bg-white border border-slate-200 rounded p-1 text-xs"
                          placeholder="e.g. 1 piring"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <button
                          id={`cek-btn-delete-${idx}`}
                          type="button"
                          onClick={() => removeRow(item.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* PENGATURAN TARGET AKG KUSTOM DAN TEMPLATE */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  Rujukan & Pengaturan Target AKG Kustom
                </h4>
                <p className="text-xs text-slate-500">
                  Pilih rujukan kelompok sasaran atau sesuaikan nilai target gizi untuk memicu analisis status secara dinamis.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <select
                  id="select-akg-target"
                  value={rujukanAkgType}
                  onChange={(e) => handleRujukanChange(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg text-xs px-3 py-1.5 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  {Object.entries(TARGET_AKG_LIMITS).map(([key, val]) => (
                    <option key={key} value={key}>
                      {val.label} ({((val.energiMin + val.energiMax)/2).toFixed(0)} kkal)
                    </option>
                  ))}
                  <option value="custom">Kustom (Input Manual)</option>
                </select>

                {rujukanAkgType === "custom" && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500">Energi:</span>
                    <input
                      id="input-custom-akg"
                      type="number"
                      value={customRujukanAkg}
                      onChange={(e) => handleCustomEnergyChange(Number(e.target.value))}
                      className="w-20 px-2 py-1 border border-slate-200 rounded bg-white text-xs font-mono text-right"
                    />
                    <span className="text-xs text-slate-400 font-medium">kkal</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setShowTargetsEditor(!showTargetsEditor)}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300/80 text-slate-700 rounded-lg text-xs font-semibold transition"
                >
                  <Settings className="w-3.5 h-3.5" />
                  {showTargetsEditor ? "Sembunyikan Editor Target" : "Sesuaikan Target (19 Zat Gizi)"}
                  {showTargetsEditor ? <ChevronUp className="w-3.5 h-3.5 ml-1" /> : <ChevronDown className="w-3.5 h-3.5 ml-1" />}
                </button>
              </div>
            </div>

            {/* Collapsible individual targets list */}
            {showTargetsEditor && (
              <div className="mt-5 pt-5 border-t border-slate-200/70 transition-all duration-300">
                <h5 className="text-[11px] font-bold text-indigo-700 mb-3 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5" />
                  Nilai Target AKG Kustom Aktif (Dapat Diedit Langsung):
                </h5>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-3">
                  {nutrientsList.map((n) => {
                    const targetVal = akgTargets[n.key] || 0;
                    return (
                      <div key={`target-${n.key}`} className="bg-white p-2.5 rounded-xl border border-slate-150 flex flex-col space-y-1 shadow-sm">
                        <span className="text-[10px] font-bold text-slate-500 truncate" title={n.label}>
                          {n.label} ({n.unit})
                        </span>
                        <input
                          type="number"
                          step={n.unit === "mg" || n.unit === "mcg" ? "0.01" : "0.1"}
                          value={targetVal}
                          onChange={(e) => handleTargetFieldChange(n.key, Number(e.target.value))}
                          className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-mono text-right text-slate-800 font-bold focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-400 mt-2 italic font-medium">
                  *Mengedit langsung nilai target di atas secara otomatis mengalihkan status rujukan ke "Kustom (Input Manual)".
                </p>
              </div>
            )}
          </div>

          {/* ANALISIS CAPAIAN & KANDUNGAN GIZI UTAMA (19 PARAMETER) */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
              <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                <Activity className="w-4.5 h-4.5 text-indigo-600 animate-pulse" />
                Analisis Capaian & Kandungan Gizi Lengkap (19 Parameter)
              </h4>
              <div className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100 uppercase tracking-wider">
                Rujukan: {rujukanAkgType === "custom" ? "Target Kustom" : TARGET_AKG_LIMITS[rujukanAkgType]?.label}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {nutrientsList.map((n) => {
                const actual = totals[n.key] || 0;
                const target = akgTargets[n.key] || 0;
                const percent = target > 0 ? (actual / target) * 100 : 0;
                const status = getFulfillmentStatus(percent);

                return (
                  <div key={n.key} className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md hover:border-slate-300 transition duration-200">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-black text-slate-700 uppercase tracking-wide flex items-center gap-1.5 truncate" title={n.label}>
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${n.color}`}></span>
                        {n.label}
                      </span>
                      <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md shrink-0 ${status.textClass}`}>
                        {percent.toFixed(1)}%
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-baseline justify-between text-xs">
                        <span className="text-slate-500 font-medium">Realisasi:</span>
                        <span className="font-mono font-extrabold text-slate-800">
                          {actual.toFixed(2)} <span className="text-[9px] text-slate-400 font-medium">{n.unit}</span>
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between text-xs">
                        <span className="text-slate-500 font-medium">Target AKG:</span>
                        <span className="font-mono font-extrabold text-slate-600">
                          {target.toFixed(2)} <span className="text-[9px] text-slate-400 font-medium">{n.unit}</span>
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar & Status Badge */}
                    <div className="space-y-2">
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden shadow-inner">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${status.barClass}`}
                          style={{ width: `${Math.min(100, percent)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between items-center text-[9px] font-bold">
                        <span className="text-slate-400 uppercase tracking-wider">Status Gizi</span>
                        <span className={`${status.textClass.split(" ")[0]} uppercase font-extrabold`}>{status.label}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* --- PRATINJAU CETAK KOP & EKSPOR --- */}
      {viewMode === "print" && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 no-print">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-2 border-b border-slate-100 gap-3">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Sesuaikan KOP Surat & Cetak / Ekspor</h4>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  id="btn-cg-download-img"
                  type="button"
                  disabled={!!isDownloading}
                  onClick={() => downloadElementAsImage("print-area-cek-gizi", "Laporan_Kandungan_Gizi_Sandbox", setIsDownloading)}
                  className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition"
                >
                  <ImageIcon className="w-4 h-4" />
                  {isDownloading === "Memproses gambar..." || isDownloading === "Mengunduh gambar..." ? isDownloading : "Unduh Gambar (PNG)"}
                </button>
                <button
                  id="btn-cg-print"
                  type="button"
                  onClick={() => window.print()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition"
                >
                  <Printer className="w-4 h-4" />
                  Cetak / Simpan PDF (A4 Portrait)
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
                <label className="text-[10px] font-bold text-slate-400 uppercase">KOP Baris 3</label>
                <input
                  type="text"
                  value={kopLine3}
                  onChange={(e) => setKopLine3(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs p-2 text-slate-800 font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">KOP Baris 4</label>
                <input
                  type="text"
                  value={kopLine4}
                  onChange={(e) => setKopLine4(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs p-2 text-slate-800"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-100 p-6 rounded-2xl border border-slate-300 shadow-inner flex justify-center no-print overflow-x-auto">
            <div 
              id="print-area-cek-gizi" 
              className="bg-white p-8 border border-slate-400 shadow-md w-full max-w-[210mm] min-w-[210mm] font-sans text-slate-950 print:text-black print:border-none print:shadow-none print:p-0 print:m-0 space-y-8"
            >
              {/* Kop Surat Header (GiziSync - Sistem Informasi Pemantauan Status Gizi) */}
              <div className="flex items-center justify-between pb-4 border-b-2 border-slate-300 w-full select-none" style={{ minHeight: '90px' }}>
                {/* Left Section: Doctor Profile and Brand */}
                <div className="flex items-center gap-3">
                  {/* Doctor Profile Rounded Card */}
                  <div className="w-[150px] h-[70px] bg-white border border-slate-200 rounded-xl shadow-xs relative flex items-center justify-end overflow-hidden p-1 shrink-0">
                    {/* The cropped white card effect with doctor photo on the right half */}
                    <div className="absolute left-0 top-0 h-full w-[45%] bg-white z-0"></div>
                    <img 
                      src="/src/assets/images/doctor_profile_1783236264580.jpg" 
                      alt="Ahli Gizi" 
                      className="w-14 h-14 rounded-full object-cover border border-slate-100 relative z-10 mr-1.5"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/src/assets/images/logo_sppg_1782256222616.jpg";
                      }}
                    />
                  </div>
                  
                  {/* GiziSync Brand Text */}
                  <div className="flex flex-col text-left font-sans leading-tight">
                    <span className="text-[#0D6D41] font-extrabold text-[15px] tracking-wide uppercase">GiziSync</span>
                    <span className="text-[#626FFF] text-[8px] font-extrabold tracking-wider uppercase">Nutrition, Synchronized</span>
                  </div>
                </div>

                {/* Center Section: Main Header Text */}
                <div className="text-center font-sans px-4 flex-1 flex flex-col justify-center items-center">
                  <div className="font-extrabold text-[#0D6D41] font-sans leading-tight text-center max-w-sm" style={{ fontSize: '13pt', letterSpacing: '0.02em' }}>
                    SISTEM INFORMASI PEMANTAUAN STATUS GIZI
                  </div>
                  <div className="text-[#626FFF] font-medium font-sans mt-1 text-center" style={{ fontSize: '9pt' }}>
                    Sesuai format standar lampiran PMK No. 2 Tahun 2020.
                  </div>
                </div>

                {/* Right Section: Creator and WA Info */}
                <div className="flex flex-col items-end text-right font-sans shrink-0">
                  <span className="text-[#1F87C0] font-black text-[13px] tracking-wide uppercase leading-none">GiziSync</span>
                  <span className="text-slate-800 font-bold text-[10px] mt-1 leading-none">Syukri Odhe | Ahli Gizi</span>
                  <a 
                    href="https://wa.me/6282271095251" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-[#1F87C0] font-semibold text-[9px] mt-1 hover:underline leading-none"
                  >
                    (WA_0822-7109-5251)
                  </a>
                </div>
              </div>

              {/* Title */}
              <div className="text-center space-y-1">
                <h3 className="font-black text-black uppercase tracking-wide" style={{ fontSize: '13pt' }}>
                  LAPORAN ANALISIS KANDUNGAN GIZI MANDIRI
                </h3>
                <p className="text-xs font-bold text-slate-700 uppercase">
                  KALKULATOR SANDBOX GIZI | RUJUKAN: {rujukanAkgType === "custom" ? "TARGET KUSTOM" : TARGET_AKG_LIMITS[rujukanAkgType]?.label.toUpperCase()}
                </p>
              </div>

              {/* Components list table */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b pb-1">Daftar Bahan Makanan yang Diuji:</h4>
                <table className="w-full text-left text-[10px] border-collapse border border-slate-300">
                  <thead className="bg-slate-100 font-bold text-slate-700 uppercase">
                    <tr>
                      <th className="border border-slate-300 p-1.5 text-center w-8">No</th>
                      <th className="border border-slate-300 p-1.5">Nama Menu</th>
                      <th className="border border-slate-300 p-1.5">Bahan Makanan (TKPI)</th>
                      <th className="border border-slate-300 p-1.5 text-right w-24">Berat</th>
                      <th className="border border-slate-300 p-1.5 text-center w-24">URT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => {
                      const tkpi = tkpiList.find((t) => t.id === item.tkpiId);
                      return (
                        <tr key={item.id} className="text-slate-800 font-medium">
                          <td className="border border-slate-300 p-1.5 text-center font-mono">{idx + 1}</td>
                          <td className="border border-slate-300 p-1.5">{item.namaMenu}</td>
                          <td className="border border-slate-300 p-1.5">{tkpi?.nama || "-"}</td>
                          <td className="border border-slate-300 p-1.5 text-right font-mono">{item.berat} gram</td>
                          <td className="border border-slate-300 p-1.5 text-center">{item.urt || "-"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Nutrients Analysis Grid */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b pb-1">Hasil Kandungan Nutrisi & Persentase Capaian Target:</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {nutrientsList.map((n) => {
                    const actual = totals[n.key] || 0;
                    const target = akgTargets[n.key] || 0;
                    const percent = target > 0 ? (actual / target) * 100 : 0;
                    const status = getFulfillmentStatus(percent);

                    return (
                      <div key={`print-n-${n.key}`} className="border border-slate-300 p-2 rounded-lg flex flex-col justify-between text-[10px] space-y-1">
                        <div className="flex items-center justify-between font-bold">
                          <span className="uppercase text-slate-800">{n.label}</span>
                          <span className="text-slate-700">{percent.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Realisasi:</span>
                          <span className="font-bold font-mono">{actual.toFixed(2)} {n.unit}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Target AKG:</span>
                          <span className="font-bold font-mono text-slate-600">{target.toFixed(2)} {n.unit}</span>
                        </div>
                        <div className="flex justify-between items-center pt-1 border-t border-dashed border-slate-200">
                          <span className="text-[8px] uppercase font-bold text-slate-400">Status</span>
                          <span className="font-black uppercase text-[8px]">{status.label.split(" ")[0]}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
