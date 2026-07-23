/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from "react";
import { SPPGProfile, HariPM, FoodCostDay, TKPIItem, MasterMenu } from "../types";
import { calculateDay, getCountsForDay } from "../utils/calc";
import { Printer, Download, RefreshCw, Plus, Trash2, Calendar, FileText, Check, Combine, Eye, EyeOff, Maximize2, Minimize2 } from "lucide-react";
import { PriceCalculatorPopover } from "./PriceCalculatorPopover";
import * as XLSX from "xlsx";

interface NotaPesananLogistikTabProps {
  profile: SPPGProfile;
  foodCostDays: FoodCostDay[];
  tkpiList: TKPIItem[];
  harianPM: HariPM[];
  masterMenu: MasterMenu;
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

interface NotaItem {
  id: string;
  nama: string;
  jumlah: number;
  satuan: string;
  hargaSatuan: number;
  // Custom tracking fields from food cost
  totalKg?: number;
  potong?: number;
  ekor?: number;
  buah?: number;
  butir?: number;
  formula?: string;
  // New fields for unit converter and smart aggregation
  sumKg?: number;
  sumPotong?: number;
  sumEkor?: number;
  sumButir?: number;
  defaultUnit?: string;
  selectedUnitType?: "foodcost" | "kg" | "potong" | "ekor" | "custom";
  customUnit?: string;
}

// Format number helper (e.g. 1.250 or 1.250.000)
const formatNumber = (num: number, decimalPlaces = 0) => {
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(num);
};

// Convert YYYY-MM-DD into "Senin, 08 Juni 2026"
const formatIndonesianDate = (dateStr: string): string => {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    return `${days[d.getDay()]}, ${d.getDate().toString().padStart(2, "0")} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch (e) {
    return dateStr;
  }
};

// Smart utility to guess standard Indonesian units based on ingredient name
const guessSatuan = (name: string): string => {
  const lower = name.toLowerCase();
  if (lower.includes("minyak")) return "Liter";
  if (lower.includes("susu") && !lower.includes("bubuk")) return "Liter";
  if (lower.includes("kecap") || lower.includes("saus") || lower.includes("tiram")) return "Pcs";
  if (lower.includes("pisang") && lower.includes("mas")) return "Rak";
  if (lower.includes("telur")) return "Butir";
  if (lower.includes("tahu") || lower.includes("tempe")) return "Pcs";
  if (lower.includes("garam") || lower.includes("royco") || lower.includes("masako") || lower.includes("bumbu")) return "Bks";
  return "Kg";
};

export default function NotaPesananLogistikTab({
  profile,
  foodCostDays,
  tkpiList,
  harianPM,
  masterMenu,
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
}: NotaPesananLogistikTabProps) {
  const logoSrc = localStorage.getItem("sisper_custom_logo") || "/src/assets/images/logo_sppg_1782256222616.jpg";

  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [mode, setMode] = useState<"harian" | "gabungan">("harian");
  const [selectedDays, setSelectedDays] = useState<number[]>(Array.from({ length: 10 }, (_, i) => i + 1));
  const [items, setItems] = useState<NotaItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingVal, setEditingVal] = useState<string>("");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Customizable Logos states (Left & Right) synchronized via props
  const logoLeft = leftLogo;
  const setLogoLeft = setLeftLogo;
  const logoRight = rightLogo;
  const setLogoRight = setRightLogo;

  const [logoLeftCropTop, setLogoLeftCropTop] = useState(() => Number(localStorage.getItem("logo_left_crop_top") || "0"));
  const [logoLeftCropBottom, setLogoLeftCropBottom] = useState(() => Number(localStorage.getItem("logo_left_crop_bottom") || "0"));
  const [logoLeftCropLeft, setLogoLeftCropLeft] = useState(() => Number(localStorage.getItem("logo_left_crop_left") || "0"));
  const [logoLeftCropRight, setLogoLeftCropRight] = useState(() => Number(localStorage.getItem("logo_left_crop_right") || "0"));

  const [logoRightCropTop, setLogoRightCropTop] = useState(() => Number(localStorage.getItem("logo_right_crop_top") || "0"));
  const [logoRightCropBottom, setLogoRightCropBottom] = useState(() => Number(localStorage.getItem("logo_right_crop_bottom") || "0"));
  const [logoRightCropLeft, setLogoRightCropLeft] = useState(() => Number(localStorage.getItem("logo_right_crop_left") || "0"));
  const [logoRightCropRight, setLogoRightCropRight] = useState(() => Number(localStorage.getItem("logo_right_crop_right") || "0"));

  const [logoLeftScale, setLogoLeftScale] = useState(() => Number(localStorage.getItem("logo_left_scale") || "100"));
  const [logoRightScale, setLogoRightScale] = useState(() => Number(localStorage.getItem("logo_right_scale") || "100"));

  const [logoLeftOffsetX, setLogoLeftOffsetX] = useState(() => Number(localStorage.getItem("logo_left_offset_x") || "0"));
  const [logoLeftOffsetY, setLogoLeftOffsetY] = useState(() => Number(localStorage.getItem("logo_left_offset_y") || "0"));

  const [logoRightOffsetX, setLogoRightOffsetX] = useState(() => Number(localStorage.getItem("logo_right_offset_x") || "0"));
  const [logoRightOffsetY, setLogoRightOffsetY] = useState(() => Number(localStorage.getItem("logo_right_offset_y") || "0"));

  const [logoLeftWidth, setLogoLeftWidth] = useState(() => Number(localStorage.getItem("logo_left_width") || "80"));
  const [logoRightWidth, setLogoRightWidth] = useState(() => Number(localStorage.getItem("logo_right_width") || "80"));

  // KOP Font Styling states
  const [kopLine1Size, setKopLine1Size] = useState(() => Number(localStorage.getItem("kop_line1_size") || "18"));
  const [kopLine2Size, setKopLine2Size] = useState(() => Number(localStorage.getItem("kop_line2_size") || "14"));
  const [kopLine3Size, setKopLine3Size] = useState(() => Number(localStorage.getItem("kop_line3_size") || "14"));

  const [kopLine1Font, setKopLine1Font] = useState(() => localStorage.getItem("kop_line1_font") || "Arial, sans-serif");
  const [kopLine2Font, setKopLine2Font] = useState(() => localStorage.getItem("kop_line2_font") || "Arial, sans-serif");
  const [kopLine3Font, setKopLine3Font] = useState(() => localStorage.getItem("kop_line3_font") || "Arial, sans-serif");

  const [kopLine1Weight, setKopLine1Weight] = useState(() => localStorage.getItem("kop_line1_weight") || "900");
  const [kopLine2Weight, setKopLine2Weight] = useState(() => localStorage.getItem("kop_line2_weight") || "800");
  const [kopLine3Weight, setKopLine3Weight] = useState(() => localStorage.getItem("kop_line3_weight") || "900");

  const [kopLine1Italic, setKopLine1Italic] = useState(() => localStorage.getItem("kop_line1_italic") === "true");
  const [kopLine2Italic, setKopLine2Italic] = useState(() => localStorage.getItem("kop_line2_italic") === "true");
  const [kopLine3Italic, setKopLine3Italic] = useState(() => localStorage.getItem("kop_line3_italic") === "true");

  // Customizable table options
  const [tableDensity, setTableDensity] = useState<"cramped" | "normal" | "spacious">(() => (localStorage.getItem("nota_table_density") as any) || "normal");
  const [tableFontSize, setTableFontSize] = useState(() => Number(localStorage.getItem("nota_table_font_size") || "12"));
  const [bahanColWidth, setBahanColWidth] = useState<"normal" | "wide" | "extra-wide">(() => (localStorage.getItem("nota_bahan_col_width") as any) || "wide");
  const [previewWidth, setPreviewWidth] = useState<"standard" | "full">(() => (localStorage.getItem("nota_preview_width") as any) || "full");
  
  // Printable custom metadata fields
  const [dari, setDari] = useState(profile.namaLembaga);
  const [kepada, setKepada] = useState("Penyedia Logistik Bahan Makanan");
  const [alamat, setAlamat] = useState(profile.alamat);
  const [tanggal, setTanggal] = useState("");
  const [namaKepala, setNamaKepala] = useState(profile.namaKepala);
  const [jabatanKepala, setJabatanKepala] = useState("Kepala Satuan Pelayanan Pemenuhan Gizi");

  // Recipient numbers for current selected day
  const dayCounts = useMemo(() => getCountsForDay(harianPM, selectedDay), [harianPM, selectedDay]);
  const pmKecilSekolah = dayCounts.pmKecilSekolah;
  const pmBesarSekolah = dayCounts.pmBesarSekolah;
  const pmKecil3B = dayCounts.pmKecil3B;
  const pmBesar3B = dayCounts.pmBesar3B;

  // Persist KOP and table choices to localStorage
  useEffect(() => {
    localStorage.setItem("kop_line1", kopLine1);
    localStorage.setItem("kop_line2", kopLine2);
    localStorage.setItem("kop_line3", kopLine3);
    localStorage.setItem("kop_line4", kopLine4);
  }, [kopLine1, kopLine2, kopLine3, kopLine4]);

  useEffect(() => {
    localStorage.setItem("nota_table_density", tableDensity);
  }, [tableDensity]);

  useEffect(() => {
    localStorage.setItem("nota_bahan_col_width", bahanColWidth);
  }, [bahanColWidth]);

  useEffect(() => {
    localStorage.setItem("nota_preview_width", previewWidth);
  }, [previewWidth]);

  // Persist logos, crops, fonts, and table font sizes
  useEffect(() => {
    localStorage.setItem("logo_left_src", logoLeft);
    localStorage.setItem("logo_right_src", logoRight);
  }, [logoLeft, logoRight]);

  useEffect(() => {
    localStorage.setItem("logo_left_crop_top", String(logoLeftCropTop));
    localStorage.setItem("logo_left_crop_bottom", String(logoLeftCropBottom));
    localStorage.setItem("logo_left_crop_left", String(logoLeftCropLeft));
    localStorage.setItem("logo_left_crop_right", String(logoLeftCropRight));
  }, [logoLeftCropTop, logoLeftCropBottom, logoLeftCropLeft, logoLeftCropRight]);

  useEffect(() => {
    localStorage.setItem("logo_right_crop_top", String(logoRightCropTop));
    localStorage.setItem("logo_right_crop_bottom", String(logoRightCropBottom));
    localStorage.setItem("logo_right_crop_left", String(logoRightCropLeft));
    localStorage.setItem("logo_right_crop_right", String(logoRightCropRight));
  }, [logoRightCropTop, logoRightCropBottom, logoRightCropLeft, logoRightCropRight]);

  useEffect(() => {
    localStorage.setItem("logo_left_scale", String(logoLeftScale));
    localStorage.setItem("logo_right_scale", String(logoRightScale));
  }, [logoLeftScale, logoRightScale]);

  useEffect(() => {
    localStorage.setItem("logo_left_offset_x", String(logoLeftOffsetX));
    localStorage.setItem("logo_left_offset_y", String(logoLeftOffsetY));
  }, [logoLeftOffsetX, logoLeftOffsetY]);

  useEffect(() => {
    localStorage.setItem("logo_right_offset_x", String(logoRightOffsetX));
    localStorage.setItem("logo_right_offset_y", String(logoRightOffsetY));
  }, [logoRightOffsetX, logoRightOffsetY]);

  useEffect(() => {
    localStorage.setItem("logo_left_width", String(logoLeftWidth));
    localStorage.setItem("logo_right_width", String(logoRightWidth));
  }, [logoLeftWidth, logoRightWidth]);

  useEffect(() => {
    localStorage.setItem("kop_line1_size", String(kopLine1Size));
    localStorage.setItem("kop_line2_size", String(kopLine2Size));
    localStorage.setItem("kop_line3_size", String(kopLine3Size));
    localStorage.setItem("kop_line1_font", kopLine1Font);
    localStorage.setItem("kop_line2_font", kopLine2Font);
    localStorage.setItem("kop_line3_font", kopLine3Font);
    localStorage.setItem("kop_line1_weight", kopLine1Weight);
    localStorage.setItem("kop_line2_weight", kopLine2Weight);
    localStorage.setItem("kop_line3_weight", kopLine3Weight);
    localStorage.setItem("kop_line1_italic", String(kopLine1Italic));
    localStorage.setItem("kop_line2_italic", String(kopLine2Italic));
    localStorage.setItem("kop_line3_italic", String(kopLine3Italic));
  }, [
    kopLine1Size, kopLine2Size, kopLine3Size,
    kopLine1Font, kopLine2Font, kopLine3Font,
    kopLine1Weight, kopLine2Weight, kopLine3Weight,
    kopLine1Italic, kopLine2Italic, kopLine3Italic
  ]);

  useEffect(() => {
    localStorage.setItem("nota_table_font_size", String(tableFontSize));
  }, [tableFontSize]);

  // Sync profile metadata on load or profile change
  useEffect(() => {
    setDari(profile.namaLembaga);
    setNamaKepala(profile.namaKepala);
    setAlamat(profile.alamat);
    if (!localStorage.getItem("kop_line3")) {
      setKopLine3(profile.namaLembaga);
    }
    if (!localStorage.getItem("kop_line4")) {
      setKopLine4(`Alamat : ${profile.alamat}`);
    }
  }, [profile]);

  // Auto-set tanggal based on selected day index of profile dates or combined range
  useEffect(() => {
    if (mode === "gabungan") {
      const datesList = selectedDays
        .map(d => profile.periodeDates[d - 1])
        .filter(Boolean);
      if (datesList.length > 0) {
        const first = formatIndonesianDate(datesList[0]);
        const last = formatIndonesianDate(datesList[datesList.length - 1]);
        setTanggal(`Gabungan Siklus: ${first} s.d. ${last}`);
      } else {
        setTanggal("Gabungan 12 Hari, Periode Juli 2026");
      }
    } else {
      const defaultDateStr = profile.periodeDates[selectedDay - 1] || "";
      if (defaultDateStr) {
        setTanggal(formatIndonesianDate(defaultDateStr));
      } else {
        setTanggal(`Hari Ke-${selectedDay}, Periode Juli 2026`);
      }
    }
  }, [selectedDay, selectedDays, mode, profile.periodeDates]);

  // Helper to calculate row totals dynamically: Jumlah * Harga Satuan (buffer is already inside Jumlah from food cost!)
  const calculateRowTotal = (row: NotaItem): number => {
    if (!row.nama || row.nama.trim() === "") return 0;
    const qty = Number(row.jumlah) || 0;
    const price = Number(row.hargaSatuan) || 0;
    return qty * price;
  };

  // Main calculation of merged ingredients
  const calculateMergedIngredients = (dayNums: number[]): NotaItem[] => {
    const parseVal = (val: number | string | undefined | null): number => {
      if (val === undefined || val === null) return 0;
      if (typeof val === "number") return val;
      const str = String(val).trim();
      if (!str) return 0;
      try {
        const sanitized = str.replace(/[^0-9+\-*/().\s]/g, "");
        if (!sanitized.trim()) return 0;
        const evaluated = new Function(`return (${sanitized})`)();
        if (typeof evaluated === "number" && !isNaN(evaluated) && isFinite(evaluated)) {
          return evaluated;
        }
      } catch (e) {}
      const parsed = parseFloat(str);
      return isNaN(parsed) ? 0 : parsed;
    };

    const aggregated: Record<string, {
      nama: string;
      sumKg: number;
      sumPotong: number;
      sumEkor: number;
      sumButir: number;
      hargaSatuan: number;
      defaultUnit: string;
    }> = {};

    const getFoodCostUnitAndQty = (item: any, pmCount: number, bufferPct: number) => {
      const qty = item.butir || 0; // The actual precalculated "Jumlah+Buffer"
      const jChoice = item.jumlahBufferChoice || "auto";
      let unit = "Kg";
      if (jChoice === "auto") {
        const selectedBase = item.bufferBase || "auto";
        if (selectedBase === "kg") {
          unit = "Kg";
        } else if (selectedBase === "potong") {
          unit = "Potong";
        } else if (selectedBase === "ekor") {
          unit = "Ekor";
        } else if (selectedBase === "custom") {
          unit = "Custom";
        } else {
          // "auto" legacy detection
          if (parseVal(item.potong) > 0) unit = "Potong";
          else if (parseVal(item.ekor) > 0) unit = "Ekor";
          else unit = "Kg";
        }
      } else {
        const parts = jChoice.split("_");
        const baseType = parts[0];
        if (baseType === "kg") unit = "Kg";
        else if (baseType === "potong") unit = "Potong";
        else if (baseType === "ekor") unit = "Ekor";
        else if (baseType === "custom") unit = "Custom";
      }
      
      let displayUnit = "Kg";
      if (unit === "Potong") displayUnit = "Potong";
      else if (unit === "Ekor") displayUnit = "Ekor";
      else if (unit === "Custom") {
        displayUnit = guessSatuan(item.nama);
      } else {
        displayUnit = "Kg";
      }
      
      return { unit: displayUnit, qty };
    };

    const processItems = (itemsList: any[], pmCount: number, bufferPct: number) => {
      itemsList.forEach((item) => {
        const rawName = item.nama;
        if (!rawName || rawName.trim() === "") return;
        const key = rawName.trim().toLowerCase();

        const addBuffer = !item.jumlahBufferChoice || item.jumlahBufferChoice.endsWith("_with") || item.jumlahBufferChoice === "auto";
        const rowBufferPct = item.bufferBase === "custom" && item.bufferCustomVal !== undefined ? parseVal(item.bufferCustomVal) : bufferPct;
        const bufMult = addBuffer ? (1 + rowBufferPct / 100) : 1;

        const kgVal = (item.totalKebutuhanKg || 0) * bufMult;
        const potongVal = parseVal(item.potong) * pmCount * bufMult;
        const ekorVal = parseVal(item.ekor) * pmCount * bufMult;
        const activeVal = item.butir || 0;
        const { unit: activeUnit } = getFoodCostUnitAndQty(item, pmCount, rowBufferPct);

        if (!aggregated[key]) {
          aggregated[key] = {
            nama: rawName.trim(),
            sumKg: kgVal,
            sumPotong: potongVal,
            sumEkor: ekorVal,
            sumButir: activeVal,
            hargaSatuan: item.hargaSatuan,
            defaultUnit: activeUnit,
          };
        } else {
          aggregated[key].sumKg += kgVal;
          aggregated[key].sumPotong += potongVal;
          aggregated[key].sumEkor += ekorVal;
          aggregated[key].sumButir += activeVal;
          if (item.hargaSatuan > aggregated[key].hargaSatuan) {
            aggregated[key].hargaSatuan = item.hargaSatuan;
          }
        }
      });
    };

    // 1. Process standard menus for all specified dayNums
    dayNums.forEach((dayNum) => {
      const dCounts = getCountsForDay(harianPM, dayNum);

      const pmKecilSch = dCounts.pmKecilSekolah;
      const pmBesarSch = dCounts.pmBesarSekolah;
      const pmKecil3 = dCounts.pmKecil3B;
      const pmBesar3 = dCounts.pmBesar3B;

      // Filter all foodCostDays for this dayNum
      const matchingDays = foodCostDays.filter((d) => d.hariKe === dayNum);

      matchingDays.forEach((dayData) => {
        const isSchool = ["Basah", "Alergi", "Kering"].includes(dayData.jenisMenu);
        let pmBesar = isSchool ? pmBesarSch : pmBesar3;
        let pmKecil = isSchool ? pmKecilSch : pmKecil3;

        if (dayData.customPmBesarCount !== undefined) pmBesar = dayData.customPmBesarCount;
        if (dayData.customPmKecilCount !== undefined) pmKecil = dayData.customPmKecilCount;

        const result = calculateDay(
          dayData.porsiBesarBahan,
          dayData.porsiKecilBahan,
          pmBesar,
          pmKecil,
          dayData.bufferPct,
          tkpiList
        );
        processItems(result.porsiBesarItems, result.jumlahPMBesar, dayData.bufferPct);
        processItems(result.porsiKecilItems, result.jumlahPMKecil, dayData.bufferPct);
      });
    });

    // 2. Process Custom Tables from localStorage
    let customTables: any[] = [];
    try {
      const saved = localStorage.getItem("sppg_custom_fc_tables_v1");
      if (saved) {
        customTables = JSON.parse(saved);
      }
    } catch (e) {
      console.error("Error reading custom tables:", e);
    }

    customTables.forEach((table) => {
      const resultsCustom = table.porsi === "besar"
        ? calculateDay(table.bahanList, [], table.pmCount, 0, table.bufferPct || 5, tkpiList)
        : calculateDay([], table.bahanList, 0, table.pmCount, table.bufferPct || 5, tkpiList);
      
      const itemsCustom = table.porsi === "besar" ? resultsCustom.porsiBesarItems : resultsCustom.porsiKecilItems;
      const pmCountCustom = table.pmCount;
      const bufferPctCustom = table.bufferPct || 5;

      processItems(itemsCustom, pmCountCustom, bufferPctCustom);
    });

    // 3. Map to final output items
    const mapped: NotaItem[] = Object.values(aggregated).map((x, idx) => {
      const initialUnit = x.defaultUnit || guessSatuan(x.nama);
      const initialJumlah = x.sumButir > 0 ? x.sumButir : x.sumKg;

      return {
        id: `merged_${idx}_${Date.now()}`,
        nama: x.nama,
        jumlah: parseFloat(initialJumlah.toFixed(1)),
        satuan: initialUnit,
        hargaSatuan: x.hargaSatuan,
        
        sumKg: parseFloat(x.sumKg.toFixed(1)),
        sumPotong: parseFloat(x.sumPotong.toFixed(1)),
        sumEkor: parseFloat(x.sumEkor.toFixed(1)),
        sumButir: parseFloat(x.sumButir.toFixed(1)),
        defaultUnit: initialUnit,
        selectedUnitType: "foodcost",
        customUnit: "",
      };
    });

    const padded = [...mapped];
    const totalLinesNeeded = 25;
    let padIdx = padded.length;
    while (padded.length < totalLinesNeeded) {
      padded.push({
        id: `pad_${padIdx}_${Date.now()}`,
        nama: "",
        jumlah: 0,
        satuan: "",
        hargaSatuan: 0,
        sumKg: 0,
        sumPotong: 0,
        sumEkor: 0,
        sumButir: 0,
        defaultUnit: "",
        selectedUnitType: "custom",
        customUnit: "",
      } as NotaItem);
      padIdx++;
    }
    return padded;
  };

  // Populate items when day or calculation inputs change
  const handleReload = () => {
    const calcItems = mode === "gabungan" 
      ? calculateMergedIngredients(selectedDays) 
      : calculateMergedIngredients([selectedDay]);
    setItems(calcItems);
  };

  useEffect(() => {
    handleReload();
  }, [selectedDay, selectedDays, mode, foodCostDays, tkpiList, harianPM]);

  // Table row modifiers
  const handleEditItem = (id: string, field: keyof NotaItem, value: any) => {
    setItems((prevItems) =>
      prevItems.map((it) => {
        if (it.id !== id) return it;

        let parsedValue = value;
        if (field === "jumlah") {
          if (typeof value === "string") {
            if (value.endsWith(".")) {
              parsedValue = value;
            } else {
              parsedValue = value === "" ? 0 : Number(value);
            }
          } else {
            parsedValue = Number(value);
          }
        } else if (field === "hargaSatuan") {
          parsedValue = value === "" ? 0 : Number(value);
        }

        const updated = { ...it, [field]: parsedValue };
        return updated;
      })
    );
  };

  const handleUnitTypeChange = (id: string, type: "foodcost" | "kg" | "potong" | "ekor" | "custom", customUnitValue?: string) => {
    setItems((prevItems) =>
      prevItems.map((it) => {
        if (it.id !== id) return it;

        const updated = { ...it, selectedUnitType: type };
        if (customUnitValue !== undefined) {
          updated.customUnit = customUnitValue;
        }

        if (type === "foodcost") {
          updated.satuan = it.defaultUnit || "Kg";
          updated.jumlah = parseFloat((it.sumButir || 0).toFixed(1));
        } else if (type === "kg") {
          updated.satuan = "Kg";
          updated.jumlah = parseFloat((it.sumKg || 0).toFixed(1));
        } else if (type === "potong") {
          updated.satuan = "Potong";
          updated.jumlah = parseFloat((it.sumPotong || 0).toFixed(1));
        } else if (type === "ekor") {
          updated.satuan = "Ekor";
          updated.jumlah = parseFloat((it.sumEkor || 0).toFixed(1));
        } else {
          updated.satuan = customUnitValue !== undefined ? customUnitValue : (it.customUnit || "Kg");
        }

        return updated;
      })
    );
  };

  const handleAddItem = () => {
    const newItem: NotaItem = {
      id: `manual_${Date.now()}`,
      nama: "",
      jumlah: 0,
      satuan: "",
      hargaSatuan: 0,
      sumKg: 0,
      sumPotong: 0,
      sumEkor: 0,
      sumButir: 0,
      defaultUnit: "",
      selectedUnitType: "custom" as const,
      customUnit: "",
    };
    setItems([...items, newItem]);
  };

  const handleDeleteItem = (id: string) => {
    setItems(items.filter((it) => it.id !== id));
  };

  const handleMergeDuplicates = () => {
    const aggregated: Record<string, NotaItem> = {};
    items.forEach((item) => {
      if (!item.nama || item.nama.trim() === "") return;
      const key = item.nama.trim().toLowerCase();
      if (!aggregated[key]) {
        aggregated[key] = { ...item, nama: item.nama.trim() };
      } else {
        // Accumulate amount
        aggregated[key].jumlah = parseFloat((aggregated[key].jumlah + item.jumlah).toFixed(1));
        aggregated[key].sumKg = parseFloat(((aggregated[key].sumKg || 0) + (item.sumKg || 0)).toFixed(1));
        aggregated[key].sumPotong = parseFloat(((aggregated[key].sumPotong || 0) + (item.sumPotong || 0)).toFixed(1));
        aggregated[key].sumEkor = parseFloat(((aggregated[key].sumEkor || 0) + (item.sumEkor || 0)).toFixed(1));
        aggregated[key].sumButir = parseFloat(((aggregated[key].sumButir || 0) + (item.sumButir || 0)).toFixed(1));
        if (item.hargaSatuan > aggregated[key].hargaSatuan) {
          aggregated[key].hargaSatuan = item.hargaSatuan;
        }
      }
    });

    const merged = Object.values(aggregated);
    const padded = [...merged];
    const totalLinesNeeded = 25;
    let padIdx = padded.length;
    while (padded.length < totalLinesNeeded) {
      padded.push({
        id: `pad_${padIdx}_${Date.now()}`,
        nama: "",
        jumlah: 0,
        satuan: "",
        hargaSatuan: 0,
        sumKg: 0,
        sumPotong: 0,
        sumEkor: 0,
        sumButir: 0,
        defaultUnit: "",
        selectedUnitType: "custom",
        customUnit: "",
      } as NotaItem);
      padIdx++;
    }
    setItems(padded);
  };

  // Grand Total calculation
  const totalBelanja = useMemo(() => {
    return items.reduce((acc, it) => acc + calculateRowTotal(it), 0);
  }, [items]);

  // Trigger Print Dialog
  const handlePrint = () => {
    window.print();
  };

  const handleLogoLeftChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setLogoLeft(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoRightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setLogoRight(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Export to beautifully structured Excel matching the template
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    // Custom row arrays
    const sheetData = [
      [kopLine1],
      [kopLine2],
      [kopLine3],
      [kopLine4],
      [],
      [`Dari : ${dari}`],
      [`Kepada : ${kepada}`],
      [`Alamat : ${alamat}`],
      [`Tanggal : ${tanggal}`],
      [],
      ["No.", "Uraian Jenis Bahan Makanan", "Jumlah", "Satuan", "Harga", "Total"],
    ];

    // Add items (up to 25 rows or more)
    items.forEach((row, idx) => {
      const isEmpty = !row.nama || row.nama.trim() === "";
      if (isEmpty) {
        sheetData.push(["", "", "", "", "", ""]);
      } else {
        const rowTotal = calculateRowTotal(row);
        sheetData.push([
          String(idx + 1),
          row.nama,
          row.jumlah === 0 ? "" : Number(row.jumlah).toFixed(1),
          row.satuan,
          row.hargaSatuan === 0 ? "Rp -" : `Rp ${formatNumber(row.hargaSatuan)}`,
          rowTotal === 0 ? "Rp -" : `Rp ${formatNumber(rowTotal)}`,
        ]);
      }
    });

    // Add Total row
    sheetData.push(["TOTAL BELANJA", "", "", "", "", `Rp ${formatNumber(totalBelanja)}`]);
    sheetData.push([]);
    sheetData.push(["", "", "", "Mengetahui,"]);
    sheetData.push(["", "", "", jabatanKepala]);
    sheetData.push([]);
    sheetData.push([]);
    sheetData.push([]);
    sheetData.push(["", "", "", namaKepala]);

    const ws = XLSX.utils.aoa_to_sheet(sheetData);

    // Apply basic dimensions
    ws["!cols"] = [
      { wch: 8 },  // No.
      { wch: 35 }, // Uraian Jenis Bahan Makanan
      { wch: 15 }, // Jumlah
      { wch: 12 }, // Satuan
      { wch: 18 }, // Harga
      { wch: 20 }, // Total
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Nota Pesanan Logistik");
    const filename = mode === "gabungan" 
      ? "Nota_Pesanan_Logistik_Gabungan.xlsx" 
      : `Nota_Pesanan_Logistik_Hari_${selectedDay}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  return (
    <div className="space-y-6" id="nota-pesanan-logistik-tab-container">
      {/* Dynamic Print CSS to target print area perfectly */}
      <style>{`
        /* Custom Table Spacing and Sizes for screen preview and print */
        .print-container th, .print-container td {
          padding: ${tableDensity === "cramped" ? "3px 5px" : tableDensity === "spacious" ? "9px 12px" : "5px 8px"} !important;
          font-size: ${tableFontSize}px !important;
        }
        .col-nama-bahan {
          width: ${previewWidth === "full" ? "auto" : (bahanColWidth === "normal" ? "180px" : bahanColWidth === "extra-wide" ? "380px" : "280px")} !important;
          max-width: ${previewWidth === "full" ? "none" : (bahanColWidth === "normal" ? "180px" : bahanColWidth === "extra-wide" ? "380px" : "280px")} !important;
        }
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 12mm 10mm 12mm;
          }
          /* Hide all default page content and navigation panels */
          body {
            background-color: white !important;
            color: black !important;
            font-family: Arial, sans-serif !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          #sisper-app-root header,
          #sisper-app-root section,
          #sisper-app-root main > div > div:first-child,
          #nota-pesanan-logistik-tab-container .no-print,
          #sisper-app-root footer {
            display: none !important;
          }
          /* Setup perfect printable layout */
          #print-area-wrapper {
            display: block !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .print-container {
            width: 100% !important;
            max-width: 100% !important;
            min-height: auto !important;
            padding: 0 !important;
            margin: 0 auto !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
            overflow: visible !important;
          }

          /* Auto-centering and perfect fitting */
          .print-container > div {
            margin: 0 auto !important;
            width: 100% !important;
          }

          /* Force shrink the table if it is too wide */
          .print-container table {
            border-collapse: collapse !important;
            width: 100% !important;
            table-layout: fixed !important;
            margin: 0 auto !important;
          }

          /* Perfect percentage based column scaling so it always fits perfectly on A4 */
          .print-container th:nth-of-type(1), .print-container td:nth-of-type(1) { width: 6% !important; text-align: center !important; }
          .print-container th:nth-of-type(2), .print-container td:nth-of-type(2) { width: 44% !important; text-align: left !important; }
          .print-container th:nth-of-type(3), .print-container td:nth-of-type(3) { width: 12% !important; text-align: center !important; }
          .print-container th:nth-of-type(4), .print-container td:nth-of-type(4) { width: 12% !important; text-align: center !important; }
          .print-container th:nth-of-type(5), .print-container td:nth-of-type(5) { width: 13% !important; text-align: right !important; }
          .print-container th:nth-of-type(6), .print-container td:nth-of-type(6) { width: 13% !important; text-align: right !important; }

          /* Enforce compact text & font sizes when printing to prevent overflow */
          .print-container th, .print-container td {
            border: 1px solid black !important;
            padding: 3px 5px !important;
            font-size: ${Math.min(tableFontSize, 10.5)}px !important; /* Auto clamp font-size so it does not overflow */
            line-height: 1.15 !important;
            word-wrap: break-word !important;
            white-space: normal !important;
            overflow: hidden !important;
          }

          /* Ensure borderless style for input fields when printing */
          .print-container input {
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            font-size: inherit !important;
            background: transparent !important;
            color: black !important;
          }

          /* Keep signatures on same page when possible */
          .print-break-inside-avoid {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      {/* Control Panel (no-print) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4 no-print">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-orange-600 animate-pulse" />
              Nota Pesanan Logistik (Rekapitulasi Gabungan Terintegrasi)
            </h3>
            <p className="text-xs text-slate-500">
              Kombinasi otomatis kebutuhan bahan kotor (Kg) harian atau rekap gabungan 10 hari kerja yang fleksibel. Siap cetak / ekspor.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-xs self-start lg:self-center">
            <button
              type="button"
              onClick={() => setMode("harian")}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                mode === "harian" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Mode Harian
            </button>
            <button
              type="button"
              onClick={() => setMode("gabungan")}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                mode === "gabungan" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Gabungan 10 Hari
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-3">
            {mode === "harian" ? (
              /* Day Selector */
              <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-600 font-bold px-1.5">Pilih Hari:</span>
                <select
                  id="select-nota-logistik-day"
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(Number(e.target.value))}
                  className="bg-white border border-slate-200 rounded-lg text-sm px-3 py-1 font-mono font-black text-indigo-600 focus:ring-1 focus:ring-indigo-500"
                >
                  {Array.from({ length: 10 }).map((_, i) => (
                    <option key={i} value={i + 1}>
                      Hari Ke-{i + 1}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              /* Multi-day selection triggers */
              <div className="space-y-2 w-full">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-700 block">Pilih Hari untuk Rekap Gabungan:</span>
                  <div className="flex items-center gap-2 text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setSelectedDays(Array.from({ length: 10 }, (_, i) => i + 1))}
                      className="text-indigo-600 hover:underline"
                    >
                      Pilih Semua
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setSelectedDays([])}
                      className="text-rose-500 hover:underline"
                    >
                      Kosongkan
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {Array.from({ length: 10 }).map((_, i) => {
                    const dNum = i + 1;
                    const isSelected = selectedDays.includes(dNum);
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedDays(selectedDays.filter((x) => x !== dNum));
                          } else {
                            setSelectedDays([...selectedDays, dNum].sort((a, b) => a - b));
                          }
                        }}
                        className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg border transition ${
                          isSelected
                            ? "bg-indigo-50 border-indigo-200 text-indigo-600"
                            : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        H-{dNum}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 self-end md:self-center shrink-0">
            <button
              id="btn-nota-logistik-toggle-sidebar"
              type="button"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className={`p-2 rounded-xl transition text-xs font-bold flex items-center gap-1.5 border shadow-sm ${
                isSidebarCollapsed 
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600 shadow-indigo-600/15" 
                  : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
              }`}
              title={isSidebarCollapsed ? "Tampilkan Panel Kustomisasi" : "Sembunyikan Panel Kustomisasi"}
            >
              {isSidebarCollapsed ? (
                <>
                  <Eye className="w-4 h-4 text-white" />
                  Tampilkan Panel
                </>
              ) : (
                <>
                  <EyeOff className="w-4 h-4 text-slate-500" />
                  Sembunyikan Panel
                </>
              )}
            </button>

            <button
              id="btn-nota-logistik-toggle-width"
              type="button"
              onClick={() => {
                const nextWidth = previewWidth === "full" ? "standard" : "full";
                setPreviewWidth(nextWidth);
                if (nextWidth === "full") {
                  setIsSidebarCollapsed(true);
                }
              }}
              className={`p-2 rounded-xl transition text-xs font-bold flex items-center gap-1.5 border shadow-sm ${
                previewWidth === "full"
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-emerald-600/15"
                  : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
              }`}
              title={previewWidth === "full" ? "Ubah ke Lebar Cetak A4 Standar" : "Atur Tampilan Melebar Penuh Layar"}
            >
              {previewWidth === "full" ? (
                <>
                  <Minimize2 className="w-4 h-4 text-white" />
                  Lebar Standar
                </>
              ) : (
                <>
                  <Maximize2 className="w-4 h-4 text-slate-500" />
                  Lebar Penuh (Full Width)
                </>
              )}
            </button>

            <button
              id="btn-nota-logistik-reload"
              type="button"
              onClick={handleReload}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 rounded-xl transition text-xs font-bold flex items-center gap-1.5 border border-slate-200"
              title="Reset ke hitungan kalkulasi default"
            >
              <RefreshCw className="w-4 h-4" />
              Reset Kalkulasi
            </button>

            <button
              id="btn-nota-logistik-add-row"
              type="button"
              onClick={handleAddItem}
              className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl transition text-xs font-bold flex items-center gap-1.5 border border-indigo-100"
            >
              <Plus className="w-4 h-4" />
              Tambah Baris
            </button>

            <button
              id="btn-nota-logistik-merge-dup"
              type="button"
              onClick={handleMergeDuplicates}
              className="p-2 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-xl transition text-xs font-bold flex items-center gap-1.5 border border-teal-100"
              title="Gabungkan baris bahan makanan yang sama dan kalkulasikan totalnya otomatis"
            >
              <Combine className="w-4 h-4" />
              Gabungkan Duplikat
            </button>

            <button
              id="btn-nota-logistik-export"
              type="button"
              onClick={handleExportExcel}
              className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-emerald-500/10"
            >
              <Download className="w-4 h-4" />
              Unduh Excel
            </button>

            <button
              id="btn-nota-logistik-print"
              type="button"
              onClick={handlePrint}
              className="p-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl transition text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-orange-500/10"
            >
              <Printer className="w-4 h-4" />
              Cetak Presisi 100%
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
        {/* Printable Fields Editors (no-print) */}
        <div className={`bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4 no-print xl:col-span-1 ${isSidebarCollapsed ? "hidden" : "block"}`}>
          <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-1.5">
            ✏️ Kustomisasi Surat Cetak
          </h4>
          
          <div className="space-y-3.5 text-xs">
            {/* 1. Isi Teks KOP Surat */}
            <details className="bg-slate-50 rounded-xl border border-slate-150 overflow-hidden group" open>
              <summary className="p-2.5 font-bold text-slate-700 hover:bg-slate-100 cursor-pointer flex justify-between items-center select-none text-[10px] uppercase tracking-wider">
                <span>✏️ Isi Teks KOP</span>
                <span className="transition-transform group-open:rotate-180 text-slate-400 text-[10px]">▼</span>
              </summary>
              <div className="p-2.5 pt-2 border-t border-slate-100 bg-white space-y-2.5">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-500">KOP Baris 1:</label>
                  <input
                    type="text"
                    value={kopLine1}
                    onChange={(e) => setKopLine1(e.target.value)}
                    className="w-full px-2 py-1 border border-slate-200 rounded-lg bg-white focus:ring-1 focus:ring-indigo-500 text-slate-800 font-medium text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-500">KOP Baris 2:</label>
                  <input
                    type="text"
                    value={kopLine2}
                    onChange={(e) => setKopLine2(e.target.value)}
                    className="w-full px-2 py-1 border border-slate-200 rounded-lg bg-white focus:ring-1 focus:ring-indigo-500 text-slate-800 font-medium text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-500">KOP Baris 3 (Lembaga):</label>
                  <input
                    type="text"
                    value={kopLine3}
                    onChange={(e) => setKopLine3(e.target.value)}
                    className="w-full px-2 py-1 border border-slate-200 rounded-lg bg-white focus:ring-1 focus:ring-indigo-500 text-slate-800 font-medium text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-500">KOP Baris 4 (Alamat):</label>
                  <input
                    type="text"
                    value={kopLine4}
                    onChange={(e) => setKopLine4(e.target.value)}
                    className="w-full px-2 py-1 border border-slate-200 rounded-lg bg-white focus:ring-1 focus:ring-indigo-500 text-slate-800 text-xs"
                  />
                </div>
              </div>
            </details>

            {/* 2. Format & Gaya Teks KOP */}
            <details className="bg-slate-50 rounded-xl border border-slate-150 overflow-hidden group">
              <summary className="p-2.5 font-bold text-slate-700 hover:bg-slate-100 cursor-pointer flex justify-between items-center select-none text-[10px] uppercase tracking-wider">
                <span>🎨 Gaya Huruf KOP</span>
                <span className="transition-transform group-open:rotate-180 text-slate-400 text-[10px]">▼</span>
              </summary>
              <div className="p-2.5 pt-2 border-t border-slate-100 bg-white space-y-3">
                
                {/* Baris 1 font controls */}
                <div className="p-2 border border-slate-100 rounded-lg space-y-1.5 bg-slate-50/50">
                  <div className="font-bold text-indigo-700 text-[9px] uppercase tracking-wider">Baris 1 (Instansi Utama)</div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div>
                      <label className="text-[9px] text-slate-400 font-semibold block">Model Huruf</label>
                      <select 
                        value={kopLine1Font} 
                        onChange={(e) => setKopLine1Font(e.target.value)}
                        className="w-full px-1.5 py-0.5 border border-slate-200 rounded text-[10px] font-medium"
                      >
                        <option value="Arial, sans-serif">Arial (Sans)</option>
                        <option value="'Times New Roman', Times, serif">Times (Serif)</option>
                        <option value="Georgia, serif">Georgia</option>
                        <option value="'JetBrains Mono', monospace">Mono</option>
                        <option value="system-ui">System UI</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-400 font-semibold block">Ketebalan</label>
                      <select 
                        value={kopLine1Weight} 
                        onChange={(e) => setKopLine1Weight(e.target.value)}
                        className="w-full px-1.5 py-0.5 border border-slate-200 rounded text-[10px] font-medium"
                      >
                        <option value="400">Normal</option>
                        <option value="600">Sedang (600)</option>
                        <option value="700">Tebal (700)</option>
                        <option value="900">Sangat Tebal (900)</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-0.5">
                    <div className="flex items-center gap-1.5">
                      <input 
                        type="checkbox" 
                        id="italic-l1"
                        checked={kopLine1Italic}
                        onChange={(e) => setKopLine1Italic(e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3 h-3"
                      />
                      <label htmlFor="italic-l1" className="text-[10px] text-slate-600 font-semibold">Miring (Italic)</label>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 font-semibold">
                      <span>Ukuran:</span>
                      <input 
                        type="number" 
                        min="8" 
                        max="36" 
                        value={kopLine1Size}
                        onChange={(e) => setKopLine1Size(Number(e.target.value))}
                        className="w-8 px-0.5 py-0.5 border border-slate-200 rounded text-center text-[10px] font-bold"
                      />
                      <span>px</span>
                    </div>
                  </div>
                </div>

                {/* Baris 2 font controls */}
                <div className="p-2 border border-slate-100 rounded-lg space-y-1.5 bg-slate-50/50">
                  <div className="font-bold text-indigo-700 text-[9px] uppercase tracking-wider">Baris 2 (Layanan)</div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div>
                      <label className="text-[9px] text-slate-400 font-semibold block">Model Huruf</label>
                      <select 
                        value={kopLine2Font} 
                        onChange={(e) => setKopLine2Font(e.target.value)}
                        className="w-full px-1.5 py-0.5 border border-slate-200 rounded text-[10px] font-medium"
                      >
                        <option value="Arial, sans-serif">Arial (Sans)</option>
                        <option value="'Times New Roman', Times, serif">Times (Serif)</option>
                        <option value="Georgia, serif">Georgia</option>
                        <option value="'JetBrains Mono', monospace">Mono</option>
                        <option value="system-ui">System UI</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-400 font-semibold block">Ketebalan</label>
                      <select 
                        value={kopLine2Weight} 
                        onChange={(e) => setKopLine2Weight(e.target.value)}
                        className="w-full px-1.5 py-0.5 border border-slate-200 rounded text-[10px] font-medium"
                      >
                        <option value="400">Normal</option>
                        <option value="600">Sedang (600)</option>
                        <option value="700">Tebal (700)</option>
                        <option value="800">Sangat Tebal (800)</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-0.5">
                    <div className="flex items-center gap-1.5">
                      <input 
                        type="checkbox" 
                        id="italic-l2"
                        checked={kopLine2Italic}
                        onChange={(e) => setKopLine2Italic(e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3 h-3"
                      />
                      <label htmlFor="italic-l2" className="text-[10px] text-slate-600 font-semibold">Miring (Italic)</label>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 font-semibold">
                      <span>Ukuran:</span>
                      <input 
                        type="number" 
                        min="8" 
                        max="36" 
                        value={kopLine2Size}
                        onChange={(e) => setKopLine2Size(Number(e.target.value))}
                        className="w-8 px-0.5 py-0.5 border border-slate-200 rounded text-center text-[10px] font-bold"
                      />
                      <span>px</span>
                    </div>
                  </div>
                </div>

                {/* Baris 3 font controls */}
                <div className="p-2 border border-slate-100 rounded-lg space-y-1.5 bg-slate-50/50">
                  <div className="font-bold text-indigo-700 text-[9px] uppercase tracking-wider">Baris 3 (SPPG / Cabang)</div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div>
                      <label className="text-[9px] text-slate-400 font-semibold block">Model Huruf</label>
                      <select 
                        value={kopLine3Font} 
                        onChange={(e) => setKopLine3Font(e.target.value)}
                        className="w-full px-1.5 py-0.5 border border-slate-200 rounded text-[10px] font-medium"
                      >
                        <option value="Arial, sans-serif">Arial (Sans)</option>
                        <option value="'Times New Roman', Times, serif">Times (Serif)</option>
                        <option value="Georgia, serif">Georgia</option>
                        <option value="'JetBrains Mono', monospace">Mono</option>
                        <option value="system-ui">System UI</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-400 font-semibold block">Ketebalan</label>
                      <select 
                        value={kopLine3Weight} 
                        onChange={(e) => setKopLine3Weight(e.target.value)}
                        className="w-full px-1.5 py-0.5 border border-slate-200 rounded text-[10px] font-medium"
                      >
                        <option value="400">Normal</option>
                        <option value="600">Sedang (600)</option>
                        <option value="700">Tebal (700)</option>
                        <option value="900">Sangat Tebal (900)</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-0.5">
                    <div className="flex items-center gap-1.5">
                      <input 
                        type="checkbox" 
                        id="italic-l3"
                        checked={kopLine3Italic}
                        onChange={(e) => setKopLine3Italic(e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3 h-3"
                      />
                      <label htmlFor="italic-l3" className="text-[10px] text-slate-600 font-semibold">Miring (Italic)</label>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 font-semibold">
                      <span>Ukuran:</span>
                      <input 
                        type="number" 
                        min="8" 
                        max="36" 
                        value={kopLine3Size}
                        onChange={(e) => setKopLine3Size(Number(e.target.value))}
                        className="w-8 px-0.5 py-0.5 border border-slate-200 rounded text-center text-[10px] font-bold"
                      />
                      <span>px</span>
                    </div>
                  </div>
                </div>
              </div>
            </details>

            {/* 3. Logo Kiri */}
            <details className="bg-slate-50 rounded-xl border border-slate-150 overflow-hidden group">
              <summary className="p-2.5 font-bold text-slate-700 hover:bg-slate-100 cursor-pointer flex justify-between items-center select-none text-[10px] uppercase tracking-wider">
                <span>🖼️ Logo Kiri (KOP)</span>
                <span className="transition-transform group-open:rotate-180 text-slate-400 text-[10px]">▼</span>
              </summary>
              <div className="p-2.5 pt-2 border-t border-slate-100 bg-white space-y-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-500 block">Pilih File Logo Kiri:</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleLogoLeftChange}
                    className="w-full text-[10px] text-slate-500 file:mr-2 file:py-0.5 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer border border-slate-100 p-1 rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-0.5">
                    <label className="text-[10px] font-semibold text-slate-500 flex justify-between">
                      <span>Lebar:</span>
                      <span className="text-indigo-600 font-bold">{logoLeftWidth}px</span>
                    </label>
                    <input 
                      type="range" 
                      min="40" 
                      max="160" 
                      value={logoLeftWidth} 
                      onChange={(e) => setLogoLeftWidth(Number(e.target.value))}
                      className="w-full h-1 bg-slate-100 rounded appearance-none cursor-pointer accent-indigo-600"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[10px] font-semibold text-slate-500 flex justify-between">
                      <span>Zoom:</span>
                      <span className="text-indigo-600 font-bold">{logoLeftScale}%</span>
                    </label>
                    <input 
                      type="range" 
                      min="50" 
                      max="300" 
                      value={logoLeftScale} 
                      onChange={(e) => setLogoLeftScale(Number(e.target.value))}
                      className="w-full h-1 bg-slate-100 rounded appearance-none cursor-pointer accent-indigo-600"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Crop (Potong Sisi)</span>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
                    <div className="space-y-0.5">
                      <label className="text-[9px] font-medium text-slate-500 flex justify-between">
                        <span>Atas:</span>
                        <span className="text-slate-700 font-semibold">{logoLeftCropTop}%</span>
                      </label>
                      <input 
                        type="range" 
                        min="0" 
                        max="90" 
                        value={logoLeftCropTop} 
                        onChange={(e) => setLogoLeftCropTop(Number(e.target.value))}
                        className="w-full h-1 bg-slate-200 rounded appearance-none cursor-pointer accent-slate-600"
                      />
                    </div>
                    <div className="space-y-0.5">
                      <label className="text-[9px] font-medium text-slate-500 flex justify-between">
                        <span>Bawah:</span>
                        <span className="text-slate-700 font-semibold">{logoLeftCropBottom}%</span>
                      </label>
                      <input 
                        type="range" 
                        min="0" 
                        max="90" 
                        value={logoLeftCropBottom} 
                        onChange={(e) => setLogoLeftCropBottom(Number(e.target.value))}
                        className="w-full h-1 bg-slate-200 rounded appearance-none cursor-pointer accent-slate-600"
                      />
                    </div>
                    <div className="space-y-0.5">
                      <label className="text-[9px] font-medium text-slate-500 flex justify-between">
                        <span>Kiri:</span>
                        <span className="text-slate-700 font-semibold">{logoLeftCropLeft}%</span>
                      </label>
                      <input 
                        type="range" 
                        min="0" 
                        max="90" 
                        value={logoLeftCropLeft} 
                        onChange={(e) => setLogoLeftCropLeft(Number(e.target.value))}
                        className="w-full h-1 bg-slate-200 rounded appearance-none cursor-pointer accent-slate-600"
                      />
                    </div>
                    <div className="space-y-0.5">
                      <label className="text-[9px] font-medium text-slate-500 flex justify-between">
                        <span>Kanan:</span>
                        <span className="text-slate-700 font-semibold">{logoLeftCropRight}%</span>
                      </label>
                      <input 
                        type="range" 
                        min="0" 
                        max="90" 
                        value={logoLeftCropRight} 
                        onChange={(e) => setLogoLeftCropRight(Number(e.target.value))}
                        className="w-full h-1 bg-slate-200 rounded appearance-none cursor-pointer accent-slate-600"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-0.5">
                    <label className="text-[10px] font-semibold text-slate-500 flex justify-between">
                      <span>Geser X:</span>
                      <span>{logoLeftOffsetX}px</span>
                    </label>
                    <input 
                      type="range" 
                      min="-100" 
                      max="100" 
                      value={logoLeftOffsetX} 
                      onChange={(e) => setLogoLeftOffsetX(Number(e.target.value))}
                      className="w-full h-1 bg-slate-100 rounded appearance-none cursor-pointer accent-slate-500"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[10px] font-semibold text-slate-500 flex justify-between">
                      <span>Geser Y:</span>
                      <span>{logoLeftOffsetY}px</span>
                    </label>
                    <input 
                      type="range" 
                      min="-100" 
                      max="100" 
                      value={logoLeftOffsetY} 
                      onChange={(e) => setLogoLeftOffsetY(Number(e.target.value))}
                      className="w-full h-1 bg-slate-100 rounded appearance-none cursor-pointer accent-slate-500"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setLogoLeftCropTop(0);
                    setLogoLeftCropBottom(0);
                    setLogoLeftCropLeft(0);
                    setLogoLeftCropRight(0);
                    setLogoLeftScale(100);
                    setLogoLeftOffsetX(0);
                    setLogoLeftOffsetY(0);
                    setLogoLeftWidth(80);
                    setLogoLeft("/src/assets/images/logo_sppg_1782256222616.jpg");
                  }}
                  className="w-full py-1 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded transition font-bold text-[10px]"
                >
                  Reset Logo Kiri
                </button>
              </div>
            </details>

            {/* 4. Logo Kanan */}
            <details className="bg-slate-50 rounded-xl border border-slate-155 overflow-hidden group">
              <summary className="p-2.5 font-bold text-slate-700 hover:bg-slate-100 cursor-pointer flex justify-between items-center select-none text-[10px] uppercase tracking-wider">
                <span>🖼️ Logo Kanan (KOP)</span>
                <span className="transition-transform group-open:rotate-180 text-slate-400 text-[10px]">▼</span>
              </summary>
              <div className="p-2.5 pt-2 border-t border-slate-100 bg-white space-y-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-500 block">Pilih File Logo Kanan:</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleLogoRightChange}
                    className="w-full text-[10px] text-slate-500 file:mr-2 file:py-0.5 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer border border-slate-100 p-1 rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-0.5">
                    <label className="text-[10px] font-semibold text-slate-500 flex justify-between">
                      <span>Lebar:</span>
                      <span className="text-indigo-600 font-bold">{logoRightWidth}px</span>
                    </label>
                    <input 
                      type="range" 
                      min="40" 
                      max="160" 
                      value={logoRightWidth} 
                      onChange={(e) => setLogoRightWidth(Number(e.target.value))}
                      className="w-full h-1 bg-slate-100 rounded appearance-none cursor-pointer accent-indigo-600"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[10px] font-semibold text-slate-500 flex justify-between">
                      <span>Zoom:</span>
                      <span className="text-indigo-600 font-bold">{logoRightScale}%</span>
                    </label>
                    <input 
                      type="range" 
                      min="50" 
                      max="300" 
                      value={logoRightScale} 
                      onChange={(e) => setLogoRightScale(Number(e.target.value))}
                      className="w-full h-1 bg-slate-100 rounded appearance-none cursor-pointer accent-indigo-600"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Crop (Potong Sisi)</span>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
                    <div className="space-y-0.5">
                      <label className="text-[9px] font-medium text-slate-500 flex justify-between">
                        <span>Atas:</span>
                        <span className="text-slate-700 font-semibold">{logoRightCropTop}%</span>
                      </label>
                      <input 
                        type="range" 
                        min="0" 
                        max="90" 
                        value={logoRightCropTop} 
                        onChange={(e) => setLogoRightCropTop(Number(e.target.value))}
                        className="w-full h-1 bg-slate-200 rounded appearance-none cursor-pointer accent-slate-600"
                      />
                    </div>
                    <div className="space-y-0.5">
                      <label className="text-[9px] font-medium text-slate-500 flex justify-between">
                        <span>Bawah:</span>
                        <span className="text-slate-700 font-semibold">{logoRightCropBottom}%</span>
                      </label>
                      <input 
                        type="range" 
                        min="0" 
                        max="90" 
                        value={logoRightCropBottom} 
                        onChange={(e) => setLogoRightCropBottom(Number(e.target.value))}
                        className="w-full h-1 bg-slate-200 rounded appearance-none cursor-pointer accent-slate-600"
                      />
                    </div>
                    <div className="space-y-0.5">
                      <label className="text-[9px] font-medium text-slate-500 flex justify-between">
                        <span>Kiri:</span>
                        <span className="text-slate-700 font-semibold">{logoRightCropLeft}%</span>
                      </label>
                      <input 
                        type="range" 
                        min="0" 
                        max="90" 
                        value={logoRightCropLeft} 
                        onChange={(e) => setLogoRightCropLeft(Number(e.target.value))}
                        className="w-full h-1 bg-slate-200 rounded appearance-none cursor-pointer accent-slate-600"
                      />
                    </div>
                    <div className="space-y-0.5">
                      <label className="text-[9px] font-medium text-slate-500 flex justify-between">
                        <span>Kanan:</span>
                        <span className="text-slate-700 font-semibold">{logoRightCropRight}%</span>
                      </label>
                      <input 
                        type="range" 
                        min="0" 
                        max="90" 
                        value={logoRightCropRight} 
                        onChange={(e) => setLogoRightCropRight(Number(e.target.value))}
                        className="w-full h-1 bg-slate-200 rounded appearance-none cursor-pointer accent-slate-600"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-0.5">
                    <label className="text-[10px] font-semibold text-slate-500 flex justify-between">
                      <span>Geser X:</span>
                      <span>{logoRightOffsetX}px</span>
                    </label>
                    <input 
                      type="range" 
                      min="-100" 
                      max="100" 
                      value={logoRightOffsetX} 
                      onChange={(e) => setLogoRightOffsetX(Number(e.target.value))}
                      className="w-full h-1 bg-slate-100 rounded appearance-none cursor-pointer accent-slate-500"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[10px] font-semibold text-slate-500 flex justify-between">
                      <span>Geser Y:</span>
                      <span>{logoRightOffsetY}px</span>
                    </label>
                    <input 
                      type="range" 
                      min="-100" 
                      max="100" 
                      value={logoRightOffsetY} 
                      onChange={(e) => setLogoRightOffsetY(Number(e.target.value))}
                      className="w-full h-1 bg-slate-100 rounded appearance-none cursor-pointer accent-slate-500"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setLogoRightCropTop(0);
                      setLogoRightCropBottom(0);
                      setLogoRightCropLeft(0);
                      setLogoRightCropRight(0);
                      setLogoRightScale(100);
                      setLogoRightOffsetX(0);
                      setLogoRightOffsetY(0);
                      setLogoRightWidth(80);
                    }}
                    className="flex-1 py-1 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded transition font-bold text-[10px]"
                  >
                    Reset Logo
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLogoRight("");
                    }}
                    className="py-1 px-2 text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded transition font-bold text-[10px]"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            </details>

            {/* 5. Tata Letak & Ukuran Tabel */}
            <details className="bg-slate-50 rounded-xl border border-slate-150 overflow-hidden group">
              <summary className="p-2.5 font-bold text-slate-700 hover:bg-slate-100 cursor-pointer flex justify-between items-center select-none text-[10px] uppercase tracking-wider">
                <span>📏 Ukuran & Spasi Tabel</span>
                <span className="transition-transform group-open:rotate-180 text-slate-400 text-[10px]">▼</span>
              </summary>
              <div className="p-2.5 pt-2 border-t border-slate-100 bg-white space-y-3.5">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-500 flex justify-between items-center text-[10px]">
                    <span>Ukuran Font Tabel:</span>
                    <span className="text-indigo-600 font-bold">{tableFontSize}px</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="range" 
                      min="8" 
                      max="20" 
                      value={tableFontSize} 
                      onChange={(e) => setTableFontSize(Number(e.target.value))}
                      className="flex-1 h-1 bg-slate-200 rounded appearance-none cursor-pointer accent-indigo-600"
                    />
                    <input 
                      type="number" 
                      min="8" 
                      max="20" 
                      value={tableFontSize} 
                      onChange={(e) => setTableFontSize(Number(e.target.value))}
                      className="w-10 px-1 py-0.5 border border-slate-200 rounded text-center text-[10px] font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-500">Lebar Kolom Bahan:</label>
                  <select
                    value={bahanColWidth}
                    onChange={(e) => setBahanColWidth(e.target.value as any)}
                    className="w-full px-2 py-1 border border-slate-200 rounded-lg bg-white focus:ring-1 focus:ring-indigo-500 text-slate-800 font-medium text-xs cursor-pointer"
                  >
                    <option value="normal">Normal (180px)</option>
                    <option value="wide">Lebar (280px)</option>
                    <option value="extra-wide">Sangat Lebar (380px)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-500">Lebar Tampilan Layar:</label>
                  <select
                    value={previewWidth}
                    onChange={(e) => setPreviewWidth(e.target.value as any)}
                    className="w-full px-2 py-1 border border-slate-200 rounded-lg bg-white focus:ring-1 focus:ring-indigo-500 text-slate-800 font-medium text-xs cursor-pointer"
                  >
                    <option value="full">Lebar Penuh (Mengisi Ruang)</option>
                    <option value="standard">Standar Cetak A4 (210mm)</option>
                  </select>
                </div>
              </div>
            </details>

            {/* 6. Metadata Nota */}
            <details className="bg-slate-50 rounded-xl border border-slate-150 overflow-hidden group">
              <summary className="p-2.5 font-bold text-slate-700 hover:bg-slate-100 cursor-pointer flex justify-between items-center select-none text-[10px] uppercase tracking-wider">
                <span>📋 Informasi & Penandatangan</span>
                <span className="transition-transform group-open:rotate-180 text-slate-400 text-[10px]">▼</span>
              </summary>
              <div className="p-2.5 pt-2 border-t border-slate-100 bg-white space-y-2.5">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-500 text-[10px]">Dari (Nama SPPG):</label>
                  <input
                    type="text"
                    value={dari}
                    onChange={(e) => setDari(e.target.value)}
                    className="w-full px-2 py-1 border border-slate-200 rounded-lg bg-white focus:ring-1 focus:ring-indigo-500 text-slate-800 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-500 text-[10px]">Kepada (Penerima):</label>
                  <input
                    type="text"
                    value={kepada}
                    onChange={(e) => setKepada(e.target.value)}
                    className="w-full px-2 py-1 border border-slate-200 rounded-lg bg-white focus:ring-1 focus:ring-indigo-500 text-slate-800 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-500 text-[10px]">Alamat Penerima:</label>
                  <input
                    type="text"
                    value={alamat}
                    onChange={(e) => setAlamat(e.target.value)}
                    className="w-full px-2 py-1 border border-slate-200 rounded-lg bg-white focus:ring-1 focus:ring-indigo-500 text-slate-800 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-500 text-[10px]">Tanggal Nota:</label>
                  <input
                    type="text"
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    className="w-full px-2 py-1 border border-slate-200 rounded-lg bg-white focus:ring-1 focus:ring-indigo-500 text-slate-800 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-500 text-[10px]">Nama Penandatangan:</label>
                  <input
                    type="text"
                    value={namaKepala}
                    onChange={(e) => setNamaKepala(e.target.value)}
                    className="w-full px-2 py-1 border border-slate-200 rounded-lg bg-white focus:ring-1 focus:ring-indigo-500 text-slate-800 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-500 text-[10px]">Jabatan Penandatangan:</label>
                  <input
                    type="text"
                    value={jabatanKepala}
                    onChange={(e) => setJabatanKepala(e.target.value)}
                    className="w-full px-2 py-1 border border-slate-200 rounded-lg bg-white focus:ring-1 focus:ring-indigo-500 text-slate-800 font-medium"
                  />
                </div>
              </div>
            </details>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5 mt-2">
            <span className="text-[10px] font-bold text-indigo-700 uppercase block">💡 Tips Pengeditan</span>
            <p className="text-[10px] leading-relaxed text-slate-500">
              Anda juga bisa <strong>mengedit nama bahan, jumlah, satuan, dan harga langsung</strong> di baris tabel sebelah kanan sebelum dicetak atau diunduh. Kolom "Total" akan otomatis menyesuaikan!
            </p>
          </div>
        </div>

        {/* Paper Preview Block */}
        <div className={`${isSidebarCollapsed ? "xl:col-span-4" : "xl:col-span-3"} flex justify-center w-full`} id="print-area-wrapper">
          <div className={`print-container w-full ${previewWidth === "full" ? "max-w-full" : "max-w-[210mm]"} min-h-[297mm] bg-white text-black p-[15mm] border border-slate-200 rounded-3xl shadow-lg relative flex flex-col gap-5 overflow-x-auto`}>
            
            {/* Header Surat */}
            <div className="relative flex items-center justify-between pb-3 border-b-[3px] border-double border-black w-full mb-4 gap-4" style={{ minHeight: '100px' }}>
              
              {/* Logo Kiri */}
              <div className="flex-shrink-0 flex items-center justify-start min-w-[80px]" style={{ width: `${logoLeftWidth}px` }}>
                {logoLeft ? (
                  <div 
                    className="relative overflow-hidden flex items-center justify-center border border-slate-100 rounded bg-slate-50/30" 
                    style={{ width: `${logoLeftWidth}px`, height: `${logoLeftWidth}px` }}
                  >
                    <img 
                      src={logoLeft} 
                      alt="Logo Kiri" 
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        clipPath: `inset(${logoLeftCropTop}% ${logoLeftCropRight}% ${logoLeftCropBottom}% ${logoLeftCropLeft}%)`,
                        transform: `scale(${logoLeftScale / 100}) translate(${logoLeftOffsetX}px, ${logoLeftOffsetY}px)`,
                        transformOrigin: "center center",
                      }}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/src/assets/images/logo_sppg_1782256222616.jpg";
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 border border-dashed border-slate-300 rounded flex items-center justify-center text-[10px] text-slate-400 text-center">
                    No Logo Kiri
                  </div>
                )}
              </div>
              
              {/* KOP Text content */}
              <div className="text-center tracking-wide leading-snug px-2 flex-1 w-full">
                <div 
                  style={{ 
                    fontSize: `${kopLine1Size}px`,
                    fontFamily: kopLine1Font,
                    fontWeight: kopLine1Weight,
                    fontStyle: kopLine1Italic ? "italic" : "normal"
                  }} 
                  className="uppercase text-slate-900 print:text-black leading-tight"
                >
                  {kopLine1}
                </div>
                <div 
                  style={{ 
                    fontSize: `${kopLine2Size}px`,
                    fontFamily: kopLine2Font,
                    fontWeight: kopLine2Weight,
                    fontStyle: kopLine2Italic ? "italic" : "normal"
                  }} 
                  className="uppercase text-slate-800 print:text-black mt-1 leading-tight"
                >
                  {kopLine2}
                </div>
                <div 
                  style={{ 
                    fontSize: `${kopLine3Size}px`,
                    fontFamily: kopLine3Font,
                    fontWeight: kopLine3Weight,
                    fontStyle: kopLine3Italic ? "italic" : "normal"
                  }} 
                  className="uppercase mt-1 leading-tight text-indigo-900 print:text-black"
                >
                  {kopLine3}
                </div>
                <div className="italic text-slate-600 print:text-black mt-1.5 font-medium underline" style={{ fontSize: '10pt' }}>
                  {kopLine4}
                </div>
              </div>

              {/* Logo Kanan */}
              <div className="flex-shrink-0 flex items-center justify-end min-w-[80px]" style={{ width: `${logoRightWidth}px` }}>
                {logoRight ? (
                  <div 
                    className="relative overflow-hidden flex items-center justify-center border border-slate-100 rounded bg-slate-50/30" 
                    style={{ width: `${logoRightWidth}px`, height: `${logoRightWidth}px` }}
                  >
                    <img 
                      src={logoRight} 
                      alt="Logo Kanan" 
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        clipPath: `inset(${logoRightCropTop}% ${logoRightCropRight}% ${logoRightCropBottom}% ${logoRightCropLeft}%)`,
                        transform: `scale(${logoRightScale / 100}) translate(${logoRightOffsetX}px, ${logoRightOffsetY}px)`,
                        transformOrigin: "center center",
                      }}
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ) : (
                  <div className="border border-dashed border-slate-300 rounded flex items-center justify-center text-[10px] text-slate-400 text-center no-print" style={{ width: `${logoRightWidth}px`, height: `${logoRightWidth}px` }}>
                    No Logo Kanan
                  </div>
                )}
              </div>

            </div>

            {/* Metadata Surat */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-medium my-5 leading-normal">
              <div className="space-y-1">
                <div className="flex items-start">
                  <span className="w-20 inline-block font-bold">Dari</span>
                  <span className="mr-2">:</span>
                  <span className="flex-1 font-semibold">{dari}</span>
                </div>
                <div className="flex items-start">
                  <span className="w-20 inline-block font-bold">Kepada</span>
                  <span className="mr-2">:</span>
                  <span className="flex-1 font-semibold">{kepada}</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-start">
                  <span className="w-20 inline-block font-bold">Alamat</span>
                  <span className="mr-2">:</span>
                  <span className="flex-1 font-semibold">{alamat}</span>
                </div>
                <div className="flex items-start">
                  <span className="w-20 inline-block font-bold">Tanggal</span>
                  <span className="mr-2">:</span>
                  <span className="flex-1 font-semibold">{tanggal}</span>
                </div>
              </div>
            </div>

            {/* Main Table */}
            <div className="w-full">
              <table className="w-full text-[12px] border-collapse border border-black font-sans leading-relaxed">
                <thead>
                  <tr className="bg-[#92D050] text-black font-extrabold border-b border-black">
                    <th className="border border-black p-2 text-center w-12 text-[12px] uppercase font-bold text-slate-950 select-none">
                      No.
                    </th>
                    <th className="border border-black p-2 text-left text-[12px] uppercase font-bold text-slate-950 select-none col-nama-bahan">
                      Uraian Jenis Bahan Makanan
                    </th>
                    <th className="border border-black p-2 text-center w-24 text-[12px] uppercase font-bold text-slate-950 select-none">
                      Jumlah
                    </th>
                    <th className="border border-black p-2 text-center w-28 text-[12px] uppercase font-bold text-slate-950 select-none">
                      Satuan
                    </th>
                    <th className="border border-black p-2 text-center w-36 text-[12px] uppercase font-bold text-slate-950 select-none">
                      Harga
                    </th>
                    <th className="border border-black p-2 text-center w-40 text-[12px] uppercase font-bold text-slate-950 select-none">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((row, idx) => {
                    const rowTotal = calculateRowTotal(row);
                    const hasBahan = row.nama && row.nama.trim() !== "";

                    return (
                      <tr key={row.id} className="hover:bg-slate-50/60 print:hover:bg-transparent group">
                        {/* No. */}
                        <td className="border border-black text-center py-1 text-slate-950 font-bold select-none text-[12px]">
                          {idx + 1}
                        </td>

                        {/* Uraian Jenis Bahan Makanan */}
                        <td className="border border-black px-1.5 py-0.5 relative col-nama-bahan">
                          <input
                            id={`item-name-${row.id}`}
                            type="text"
                            value={row.nama}
                            placeholder={row.nama ? "" : `Ketik bahan...`}
                            onChange={(e) => handleEditItem(row.id, "nama", e.target.value)}
                            className="w-full bg-transparent border-0 p-0 m-0 focus:outline-none focus:ring-0 font-medium text-slate-900 print:text-black placeholder:text-slate-300 print:placeholder:text-transparent"
                          />
                          <button
                            id={`btn-del-nota-row-${row.id}`}
                            onClick={() => handleDeleteItem(row.id)}
                            className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-0.5 hover:bg-rose-100 text-rose-600 rounded transition no-print"
                            title="Hapus baris ini"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </td>

                        {/* Jumlah */}
                        <td className="border border-black px-1 py-0.5 text-center font-semibold font-mono">
                          <input
                            id={`item-qty-${row.id}`}
                            type="text"
                            value={
                              editingId === row.id
                                ? editingVal
                                : row.jumlah === 0
                                ? ""
                                : typeof row.jumlah === "number"
                                ? row.jumlah.toFixed(1)
                                : row.jumlah
                            }
                            placeholder="-"
                            onFocus={() => {
                              setEditingId(row.id);
                              setEditingVal(row.jumlah === 0 ? "" : String(row.jumlah));
                            }}
                            onBlur={() => {
                              setEditingId(null);
                              const num = editingVal === "" ? 0 : parseFloat(editingVal);
                              handleEditItem(row.id, "jumlah", isNaN(num) ? 0 : parseFloat(num.toFixed(1)));
                            }}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9.]/g, "");
                              setEditingVal(val);
                            }}
                            className="w-full bg-transparent border-0 p-0 m-0 text-center focus:outline-none focus:ring-0 font-bold placeholder:text-slate-300 print:placeholder:text-transparent text-slate-850 text-xs"
                          />
                        </td>

                        {/* Satuan */}
                        <td className="border border-black px-1 py-0.5">
                          <div className="flex items-center justify-center gap-1.5">
                            <span className="font-semibold text-center hidden print:inline">{row.satuan}</span>
                            <div className="flex items-center gap-1.5 no-print">
                              <select
                                value={row.selectedUnitType || "foodcost"}
                                onChange={(e) => handleUnitTypeChange(row.id, e.target.value as any)}
                                className="text-[10px] py-0.5 px-1 border border-slate-200 rounded bg-white text-slate-755 font-sans cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                              >
                                <option value="foodcost">Asli ({row.defaultUnit || "Kg"})</option>
                                <option value="kg">Kg</option>
                                <option value="ekor">Ekor</option>
                                <option value="potong">Potong</option>
                                <option value="custom">Kustom...</option>
                              </select>
                              {(row.selectedUnitType === "custom") && (
                                <input
                                  type="text"
                                  placeholder="Unit"
                                  value={row.customUnit || ""}
                                  onChange={(e) => handleUnitTypeChange(row.id, "custom", e.target.value)}
                                  className="text-[10px] py-0.5 px-1 border border-slate-200 rounded bg-white text-slate-800 font-mono text-center w-[50px] focus:outline-none"
                                />
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Harga Satuan */}
                        <td className="border border-black px-1.5 py-0.5 font-mono">
                          <div className="flex justify-between items-center w-full gap-1">
                            <span className="text-slate-400 print:text-black pr-0.5 font-bold">Rp</span>
                            <div className="flex-1 flex items-center justify-end gap-1">
                              <input
                                id={`item-price-${row.id}`}
                                type="text"
                                value={row.hargaSatuan === 0 ? "" : Number(row.hargaSatuan).toLocaleString("id-ID")}
                                placeholder="-"
                                onChange={(e) => {
                                  const rawVal = e.target.value.replace(/\D/g, "");
                                  const numVal = rawVal ? parseInt(rawVal, 10) : 0;
                                  handleEditItem(row.id, "hargaSatuan", numVal);
                                }}
                                className="w-full bg-transparent border-0 p-0 m-0 text-right focus:outline-none focus:ring-0 font-bold placeholder:text-slate-400 print:placeholder:text-transparent text-xs text-slate-900"
                              />
                              <PriceCalculatorPopover
                                initialValue={row.hargaSatuan || 0}
                                onApply={(val) => handleEditItem(row.id, "hargaSatuan", val)}
                                placeholder="Hitung Harga Satuan"
                                className="no-print custom-btn"
                              />
                            </div>
                          </div>
                        </td>

                        {/* Harga Total */}
                        <td className="border border-black px-1.5 py-0.5 font-mono font-bold bg-slate-50/20">
                          <div className="flex justify-between w-full">
                            <span>Rp</span>
                            <span>
                              {rowTotal === 0 ? "-" : formatNumber(rowTotal)}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {/* TOTAL BELANJA */}
                  <tr className="bg-gray-200 font-bold text-black border-t-2 border-black">
                    <td
                      colSpan={4}
                      className="border border-black px-4 py-2 text-center text-xs font-black uppercase tracking-wider text-slate-950"
                    >
                      TOTAL BELANJA
                    </td>
                    <td className="border border-black px-2 py-2 font-mono text-xs font-black bg-gray-200 text-center text-slate-500">
                      Rp -
                    </td>
                    <td className="border border-black px-3 py-2 font-mono text-xs font-black bg-gray-200">
                      <div className="flex justify-between w-full text-slate-950">
                        <span>Rp</span>
                        <span>{formatNumber(totalBelanja)}</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Signature Block */}
            <div className="mt-6 flex justify-end print:break-inside-avoid">
              <div className="text-center space-y-1 text-xs w-80 font-medium">
                <p>Mengetahui,</p>
                <p>{jabatanKepala}</p>
                <div className="h-20"></div>
                <p className="font-bold underline uppercase">{namaKepala}</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
