/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { SPPGProfile } from "../types";
import { Calendar, Building, User, CreditCard, RefreshCw } from "lucide-react";

interface SPPGProfileTabProps {
  profile: SPPGProfile;
  onChange: (updated: SPPGProfile) => void;
}

export default function SPPGProfileTab({ profile, onChange }: SPPGProfileTabProps) {
  const handleChange = (field: keyof SPPGProfile, value: any) => {
    onChange({ ...profile, [field]: value });
  };

  const handleDateChange = (index: number, value: string) => {
    const updatedDates = [...profile.periodeDates];
    updatedDates[index] = value;
    onChange({ ...profile, periodeDates: updatedDates });
  };

  // Auto-generate 12 days starting from a specific date, skipping Sundays (Senin s/d Sabtu, 2 pekan)
  const generate12Days = (startDateStr: string) => {
    if (!startDateStr) return;
    const dates: string[] = [];
    let current = new Date(startDateStr);
    
    while (dates.length < 12) {
      const day = current.getDay();
      if (day !== 0) { // Skip Sunday (0)
        dates.push(current.toISOString().split("T")[0]);
      }
      current.setDate(current.getDate() + 1);
    }

    // Set next period start date as the Monday after the last date
    let nextStart = new Date(current);
    while (nextStart.getDay() !== 1) { // Find next Monday
      nextStart.setDate(nextStart.getDate() + 1);
    }
    
    onChange({
      ...profile,
      periodeDates: dates,
      awalPeriodeBerikutnya: nextStart.toISOString().split("T")[0]
    });
  };

  return (
    <div id="sppg-profile-container" className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Building className="w-5 h-5 text-indigo-600" />
          Informasi Lembaga SPPG
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Nama Lembaga</label>
            <input
              id="input-nama-lembaga"
              type="text"
              value={profile.namaLembaga}
              onChange={(e) => handleChange("namaLembaga", e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
              placeholder="e.g. SPPG Muna Barat"
            />
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Alamat Lengkap</label>
            <input
              id="input-alamat"
              type="text"
              value={profile.alamat}
              onChange={(e) => handleChange("alamat", e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
              placeholder="Alamat SPPG"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Nama Kepala SPPG</label>
            <input
              id="input-kepala"
              type="text"
              value={profile.namaKepala}
              onChange={(e) => handleChange("namaKepala", e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
              placeholder="Nama Kepala"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Nama Ahli Gizi</label>
            <input
              id="input-ahli-gizi"
              type="text"
              value={profile.namaAhliGizi}
              onChange={(e) => handleChange("namaAhliGizi", e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
              placeholder="Nama Ahli Gizi"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Nama Yayasan</label>
            <input
              id="input-yayasan"
              type="text"
              value={profile.namaYayasan}
              onChange={(e) => handleChange("namaYayasan", e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
              placeholder="Nama Yayasan"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Ketua Yayasan</label>
            <input
              id="input-ketua-yayasan"
              type="text"
              value={profile.ketuaYayasan}
              onChange={(e) => handleChange("ketuaYayasan", e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
              placeholder="Nama Ketua Yayasan"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Nama Akuntan</label>
            <input
              id="input-nama-akuntan"
              type="text"
              value={profile.namaAkuntan}
              onChange={(e) => handleChange("namaAkuntan", e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
              placeholder="Nama Akuntan"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tahun Anggaran</label>
            <input
              id="input-tahun-anggaran"
              type="text"
              value={profile.tahunAnggaran}
              onChange={(e) => handleChange("tahunAnggaran", e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
              placeholder="Tahun"
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              Periode Penjadwalan (12 Hari Kerja)
            </h3>
            <p className="text-xs text-slate-500 mt-1">Siklus menu 12 hari (Senin s/d Sabtu, 2 pekan - Minggu libur)</p>
          </div>
          
          <div className="flex items-center gap-2">
            <input
              id="input-generate-start-date"
              type="date"
              defaultValue={profile.periodeDates[0] || ""}
              onChange={(e) => generate12Days(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
            />
            <button
              id="btn-auto-fill-dates"
              type="button"
              onClick={() => {
                const firstVal = (document.getElementById("input-generate-start-date") as HTMLInputElement)?.value;
                if (firstVal) generate12Days(firstVal);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-xs font-semibold transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Siklus Otomatis
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, idx) => (
            <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">Hari {idx + 1}</span>
              <input
                id={`date-field-${idx}`}
                type="date"
                value={profile.periodeDates[idx] || ""}
                onChange={(e) => handleDateChange(idx, e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg text-xs p-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          ))}
        </div>

        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-600">Awal Periode Berikutnya:</span>
            <input
              id="input-awal-periode-berikutnya"
              type="date"
              value={profile.awalPeriodeBerikutnya}
              onChange={(e) => handleChange("awalPeriodeBerikutnya", e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <span className="text-xs text-slate-400 italic">Tanggal ini otomatis dihitung saat Anda menekan tombol "Siklus Otomatis"</span>
        </div>
      </div>
    </div>
  );
}
