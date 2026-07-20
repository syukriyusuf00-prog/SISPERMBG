/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { TKPIItem, BahanMakananInput, FoodCostDay, MasterMenu, HariPM } from "../types";
import { calculateDay, formatRupiah, getCountsForDay } from "../utils/calc";
import SearchableTkpiDropdown from "./SearchableTkpiDropdown";
import { PriceCalculatorPopover } from "./PriceCalculatorPopover";
import { Plus, Trash2, HelpCircle, Sparkles, AlertTriangle, CheckCircle2, ChevronRight, Calculator, Info, Sliders, Printer, Download, FileSpreadsheet, Edit3, RefreshCw, Image as ImageIcon, Settings, ChevronDown, ChevronUp } from "lucide-react";
import { downloadElementAsImage } from "../lib/printUtils";
import { TARGET_AKG_LIMITS } from "../tkpiData";
import * as XLSX from "xlsx";
import { DEFAULT_SASARAN_LIST } from "../initialData";

interface FoodCostTabProps {
  foodCostDays: FoodCostDay[];
  tkpiList: TKPIItem[];
  masterMenu: MasterMenu;
  harianPM: HariPM[];
  onFoodCostDaysChange: (updated: FoodCostDay[]) => void;
  profile?: any;
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
  pmSettings?: any;
  setPmSettings?: (val: any) => void;
}

const formatThousandSeparator = (value: number | string | undefined | null): string => {
  if (value === undefined || value === null || value === "") return "";
  const clean = String(value).replace(/[^0-9]/g, "");
  if (!clean) return "";
  return new Intl.NumberFormat("id-ID").format(parseInt(clean, 10));
};

const parseThousandSeparator = (value: string): number => {
  const clean = value.replace(/[^0-9]/g, "");
  return clean ? parseInt(clean, 10) : 0;
};

interface EditableBddCellProps {
  value: number; // resolved BDD
  isCustom: boolean; // whether currently customized
  onChange: (newVal: number | undefined) => void;
}

function EditableBddCell({ value, isCustom, onChange }: EditableBddCellProps) {
  const [localVal, setLocalVal] = React.useState<string>(String(value));

  // Sync when the resolved value changes from outside (e.g. changing ingredient)
  React.useEffect(() => {
    setLocalVal(String(value));
  }, [value]);

  const handleBlur = () => {
    if (localVal === "") {
      onChange(undefined);
    } else {
      const parsed = Number(localVal);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
        onChange(parsed);
      } else {
        // Revert to current prop value
        setLocalVal(String(value));
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleBlur();
      e.currentTarget.blur();
    }
  };

  return (
    <div className="flex items-center justify-center">
      <input
        type="number"
        min="1"
        max="100"
        value={localVal}
        onChange={(e) => setLocalVal(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`w-full text-center bg-transparent border-0 font-mono font-bold p-0 text-xs focus:ring-1 focus:ring-indigo-500 rounded ${isCustom ? "text-indigo-600 bg-indigo-50/20" : "text-slate-950"}`}
        placeholder="bdd"
        title={isCustom ? "BDD Dikustomisasi (Hapus untuk menggunakan bawaan TKPI)" : "BDD Bawaan TKPI (Klik untuk kustomisasi)"}
      />
      <span className="text-slate-500 text-[9px] font-bold pr-1">%</span>
    </div>
  );
}

export default function FoodCostTab({
  foodCostDays,
  tkpiList,
  masterMenu,
  harianPM,
  onFoodCostDaysChange,
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
  setRightLogo,
  pmSettings,
  setPmSettings
}: FoodCostTabProps) {
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [selectedGroup, setSelectedGroup] = useState<"sekolah" | "tigaB" | "custom">("sekolah");
  const [selectedType, setSelectedType] = useState<"Basah" | "Alergi" | "Kering" | "MP-ASI">("Basah");
  const [viewMode, setViewMode] = useState<"edit" | "print">("edit");
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  const [planningMode, setPlanningMode] = useState<"with_bumbu_10" | "all_ingredients">(() => {
    return (localStorage.getItem("sisper_planning_mode") as any) || "with_bumbu_10";
  });

  const handlePlanningModeChange = (mode: "with_bumbu_10" | "all_ingredients") => {
    setPlanningMode(mode);
    localStorage.setItem("sisper_planning_mode", mode);
  };

  // State for Calculator Modal
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    variant?: "danger" | "warning" | "info";
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const triggerConfirm = ({
    title,
    message,
    onConfirm,
    confirmText = "Hapus",
    cancelText = "Batal",
    variant = "danger"
  }: {
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    variant?: "danger" | "warning" | "info";
  }) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      },
      confirmText,
      cancelText,
      variant
    });
  };

  const [activeCalcField, setActiveCalcField] = useState<{
    porsi: "besar" | "kecil" | string; // If custom table, it is the tableId
    rowIndex: number;
    field: "potong" | "ekor" | "buah" | "butir";
    initialValue: string;
  } | null>(null);

  const [calcExpr, setCalcExpr] = useState<string>("");
  const [calcResult, setCalcResult] = useState<string>("");

  // State for Buffer & Jumlah Config Modal
  const [activeBufferConfig, setActiveBufferConfig] = useState<{
    porsi: "besar" | "kecil" | string; // If custom table, it is the tableId
    rowIndex: number;
    namaBahan: string;
    bufferBase: string;
    bufferCustomVal?: string;
    jumlahBufferChoice: string;
    jumlahBufferCustomVal?: string;
  } | null>(null);

  const openBufferConfig = (porsi: "besar" | "kecil" | string, rowIndex: number, b: any) => {
    setActiveBufferConfig({
      porsi,
      rowIndex,
      namaBahan: b.nama || b.namaBahan || "Bahan Makanan",
      bufferBase: b.bufferBase || "auto",
      bufferCustomVal: b.bufferCustomVal || "",
      jumlahBufferChoice: b.jumlahBufferChoice || "auto",
      jumlahBufferCustomVal: b.jumlahBufferCustomVal || ""
    });
  };

  const saveBufferConfig = (config: typeof activeBufferConfig) => {
    if (!config) return;
    const { porsi, rowIndex, bufferBase, bufferCustomVal, jumlahBufferChoice, jumlahBufferCustomVal } = config;

    const updates = {
      bufferBase: bufferBase as any,
      bufferCustomVal,
      jumlahBufferChoice,
      jumlahBufferCustomVal
    };

    if (porsi === "besar" || porsi === "kecil") {
      handleRowBatchChange(porsi, rowIndex, updates);
    } else {
      editIngredientInCustomTableBatch(porsi, rowIndex, updates);
    }
    setActiveBufferConfig(null);
  };

  const safeEvalMath = (expr: string): string => {
    try {
      // Sanitasi input: hanya boleh angka, operator (+ - * / . ( )), spasi
      const sanitized = expr.replace(/[^0-9+\-*/().\s]/g, "");
      if (!sanitized.trim()) return "";
      
      // Gunakan Function constructor untuk kalkulasi ekspresi matematika ter-sanitasi secara aman
      const evaluated = new Function(`return (${sanitized})`)();
      if (typeof evaluated === "number" && !isNaN(evaluated) && isFinite(evaluated)) {
        // Bulatkan ke desimal yang wajar jika panjang desimalnya terlalu banyak
        return Number(evaluated.toFixed(3)).toString();
      }
      return "";
    } catch (error) {
      return "";
    }
  };

  const openCalculator = (
    porsi: "besar" | "kecil" | string,
    rowIndex: number,
    field: "potong" | "ekor" | "buah" | "butir",
    currentVal: string
  ) => {
    setActiveCalcField({ porsi, rowIndex, field, initialValue: currentVal });
    setCalcExpr(currentVal || "");
    const initialRes = safeEvalMath(currentVal);
    setCalcResult(initialRes || currentVal || "");
  };

  const handleCalcKeyPress = (key: string) => {
    if (key === "C") {
      setCalcExpr("");
      setCalcResult("");
    } else if (key === "Del") {
      const newVal = calcExpr.slice(0, -1);
      setCalcExpr(newVal);
      const res = safeEvalMath(newVal);
      setCalcResult(res || newVal || "");
    } else if (key === "=") {
      const res = safeEvalMath(calcExpr);
      if (res) {
        setCalcExpr(res);
        setCalcResult(res);
      }
    } else {
      const newVal = calcExpr + key;
      setCalcExpr(newVal);
      const res = safeEvalMath(newVal);
      setCalcResult(res || newVal || "");
    }
  };

  const saveCalculatorResult = (valToSave: string) => {
    if (!activeCalcField) return;
    const { porsi, rowIndex, field } = activeCalcField;
    const finalVal = valToSave === "" ? undefined : (isNaN(Number(valToSave)) ? valToSave : Number(valToSave));

    if (porsi === "besar" || porsi === "kecil") {
      handleRowChange(porsi, rowIndex, field, finalVal);
    } else {
      editIngredientInCustomTable(porsi, rowIndex, field, finalVal);
    }
    setActiveCalcField(null);
  };

  // New States for PM Selection Modes & Custom Target Prices per Sasaran
  const [sasaranTargets, setSasaranTargets] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem("sppg_sasaran_targets_v1");
    if (saved) return JSON.parse(saved);
    return {
      tk_paud_lb: 8000,
      sd_kelas_1_3: 8000,
      sd_kelas_4_6: 8000,
      smp_mts_smplb: 8000,
      sma_smk_ma: 8000,
      pendidik: 8000,
      tenaga_kependidikan: 8000,
      anak_balita: 8000,
      anak_balita_13_59: 8000,
      balita_6_11: 8000,
      ibu_hamil: 10000,
      ibu_menyusui: 10000
    };
  });

  const [pmSelectionModeBesar, setPmSelectionModeBesar] = useState<"standard" | "merge" | "custom">(() => {
    return (localStorage.getItem("sppg_pm_selection_mode_besar") as any) || "standard";
  });

  const [pmSelectionModeKecil, setPmSelectionModeKecil] = useState<"standard" | "merge" | "custom">(() => {
    return (localStorage.getItem("sppg_pm_selection_mode_kecil") as any) || "standard";
  });

  const [selectedSasaransBesar, setSelectedSasaransBesar] = useState<string[]>(() => {
    const saved = localStorage.getItem("sppg_selected_sasarans_besar");
    return saved ? JSON.parse(saved) : ["sd_kelas_4_6", "smp_mts_smplb", "sma_smk_ma", "pendidik", "tenaga_kependidikan"];
  });

  const [selectedSasaransKecil, setSelectedSasaransKecil] = useState<string[]>(() => {
    const saved = localStorage.getItem("sppg_selected_sasarans_kecil");
    return saved ? JSON.parse(saved) : ["tk_paud_lb", "sd_kelas_1_3"];
  });

  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [activeConfigTab, setActiveConfigTab] = useState<"targets" | "mergeBesar" | "mergeKecil">("targets");
  const [showKecilSasaranEditor, setShowKecilSasaranEditor] = useState(false);
  const [showBesarSasaranEditor, setShowBesarSasaranEditor] = useState(false);

  const settings = pmSettings || {
    porsiKecilHarga: 8000,
    porsiBesarHarga: 10000,
    porsiKecilSasaranIds: ["tk_paud_lb", "sd_kelas_1_3", "anak_balita", "anak_balita_13_59", "balita_6_11"],
    porsiBesarSasaranIds: ["sd_kelas_4_6", "smp_mts_smplb", "sma_smk_ma", "pendidik", "tenaga_kependidikan", "ibu_hamil", "ibu_menyusui"]
  };

  const updateSetting = (key: string, value: any) => {
    if (setPmSettings) {
      setPmSettings({
        ...settings,
        [key]: value
      });
    }
  };

  React.useEffect(() => {
    localStorage.setItem("sppg_sasaran_targets_v1", JSON.stringify(sasaranTargets));
  }, [sasaranTargets]);

  React.useEffect(() => {
    localStorage.setItem("sppg_pm_selection_mode_besar", pmSelectionModeBesar);
  }, [pmSelectionModeBesar]);

  React.useEffect(() => {
    localStorage.setItem("sppg_pm_selection_mode_kecil", pmSelectionModeKecil);
  }, [pmSelectionModeKecil]);

  React.useEffect(() => {
    localStorage.setItem("sppg_selected_sasarans_besar", JSON.stringify(selectedSasaransBesar));
  }, [selectedSasaransBesar]);

  React.useEffect(() => {
    localStorage.setItem("sppg_selected_sasarans_kecil", JSON.stringify(selectedSasaransKecil));
  }, [selectedSasaransKecil]);

  // Custom PM count states
  const [customPmBesarCount, setCustomPmBesarCount] = useState<number>(() => {
    const saved = localStorage.getItem("sppg_custom_pm_besar_count");
    return saved ? Number(saved) : 100;
  });
  const [customPmKecilCount, setCustomPmKecilCount] = useState<number>(() => {
    const saved = localStorage.getItem("sppg_custom_pm_kecil_count");
    return saved ? Number(saved) : 100;
  });

  React.useEffect(() => {
    localStorage.setItem("sppg_custom_pm_besar_count", String(customPmBesarCount));
  }, [customPmBesarCount]);

  React.useEffect(() => {
    localStorage.setItem("sppg_custom_pm_kecil_count", String(customPmKecilCount));
  }, [customPmKecilCount]);

  // Custom tables state
  const [customTables, setCustomTables] = useState<any[]>(() => {
    const saved = localStorage.getItem("sppg_custom_fc_tables_v1");
    return saved ? JSON.parse(saved) : [];
  });

  React.useEffect(() => {
    localStorage.setItem("sppg_custom_fc_tables_v1", JSON.stringify(customTables));
  }, [customTables]);

  // Form states to create custom table
  const [showAddTableForm, setShowAddTableForm] = useState(false);
  const [newTableName, setNewTableName] = useState("");
  const [newTablePorsi, setNewTablePorsi] = useState<"besar" | "kecil">("besar");
  const [newTablePmCount, setNewTablePmCount] = useState<number>(100);
  const [newTablePlafon, setNewTablePlafon] = useState<number>(10000);

  // Kriteria PM labels state
  const [customKriteriaLabels, setCustomKriteriaLabels] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem("sppg_custom_kriteria_labels");
    return saved ? JSON.parse(saved) : {};
  });

  const saveCustomKriteriaLabel = (key: string, value: string) => {
    const updated = { ...customKriteriaLabels, [key]: value };
    setCustomKriteriaLabels(updated);
    localStorage.setItem("sppg_custom_kriteria_labels", JSON.stringify(updated));
  };

  // Custom tables action handlers
  const addIngredientToCustomTable = (tableId: string) => {
    const defaultTkpiId = tkpiList[0]?.id || "beras_giling";
    const newBahan: BahanMakananInput = {
      id: `custom_row_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      tkpiId: defaultTkpiId,
      beratBB: 50,
      urt: "1 porsi",
      hargaSatuan: 20000
    };
    setCustomTables(prev => prev.map(t => {
      if (t.id === tableId) {
        return { ...t, bahanList: [...t.bahanList, newBahan] };
      }
      return t;
    }));
  };

  const removeIngredientFromCustomTable = (tableId: string, rowId: string, index: number) => {
    setCustomTables(prev => prev.map(t => {
      if (t.id === tableId) {
        const updatedList = t.bahanList.filter((b: any, idx: number) => {
          if (rowId && b.id) {
            return b.id !== rowId;
          }
          return idx !== index;
        });
        return { ...t, bahanList: updatedList };
      }
      return t;
    }));
  };

  const editIngredientInCustomTable = (tableId: string, rowIndex: number, field: keyof BahanMakananInput, value: any) => {
    setCustomTables(prev => prev.map(t => {
      if (t.id === tableId) {
        const updatedList = [...t.bahanList];
        updatedList[rowIndex] = { ...updatedList[rowIndex], [field]: value };
        return { ...t, bahanList: updatedList };
      }
      return t;
    }));
  };

  const editIngredientInCustomTableBatch = (tableId: string, rowIndex: number, updates: Partial<BahanMakananInput>) => {
    setCustomTables(prev => prev.map(t => {
      if (t.id === tableId) {
        const updatedList = [...t.bahanList];
        updatedList[rowIndex] = { ...updatedList[rowIndex], ...updates };
        return { ...t, bahanList: updatedList };
      }
      return t;
    }));
  };

  const editCustomTableMeta = (tableId: string, field: string, value: any) => {
    setCustomTables(prev => prev.map(t => {
      if (t.id === tableId) {
        return { ...t, [field]: value };
      }
      return t;
    }));
  };

  const deleteCustomTable = (tableId: string) => {
    triggerConfirm({
      title: "Hapus Tabel Komponen Kustom",
      message: "Apakah Anda yakin ingin menghapus tabel komponen kustom ini? Seluruh isi data bahan di dalamnya akan hilang secara permanen.",
      onConfirm: () => {
        setCustomTables(prev => prev.filter(t => t.id !== tableId));
      }
    });
  };

  // Customizable column headers
  const [headerPotong, setHeaderPotong] = useState(() => localStorage.getItem("fc_header_potong") || "Potong");
  const [headerEkor, setHeaderEkor] = useState(() => localStorage.getItem("fc_header_ekor") || "Ekor");
  const [headerBuah, setHeaderBuah] = useState(() => localStorage.getItem("fc_header_buah") || "Buah");
  const [headerButir, setHeaderButir] = useState(() => localStorage.getItem("fc_header_butir") || "Butir");

  // Table row density / spacing
  const [tableDensity, setTableDensity] = useState<"cramped" | "normal" | "spacious">(() => (localStorage.getItem("fc_table_density") as any) || "normal");

  const getCellPadding = () => {
    if (tableDensity === "cramped") return "p-0.5";
    if (tableDensity === "spacious") return "p-2";
    return "p-1"; // normal
  };

  // Selected AKG reference templates
  const [besarAkgType, setBesarAkgType] = useState<string>("sd_besar");
  const [kecilAkgType, setKecilAkgType] = useState<string>("sd_kecil");

  // Selected AKG reference modes ("min" | "max" | "avg" | "custom")
  const [besarAkgMode, setBesarAkgMode] = useState<string>(() => localStorage.getItem("sppg_besar_akg_mode") || "avg");
  const [kecilAkgMode, setKecilAkgMode] = useState<string>(() => localStorage.getItem("sppg_kecil_akg_mode") || "avg");

  React.useEffect(() => {
    localStorage.setItem("sppg_besar_akg_mode", besarAkgMode);
  }, [besarAkgMode]);

  React.useEffect(() => {
    localStorage.setItem("sppg_kecil_akg_mode", kecilAkgMode);
  }, [kecilAkgMode]);

  // Custom values for "Custom" option
  const [customBesar, setCustomBesar] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem("sppg_custom_besar");
    return saved ? JSON.parse(saved) : { energi: 634, protein: 15, lemak: 18, kh: 85, serat: 8 };
  });
  const [customKecil, setCustomKecil] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem("sppg_custom_kecil");
    return saved ? JSON.parse(saved) : { energi: 371, protein: 8, lemak: 11, kh: 55, serat: 5 };
  });

  React.useEffect(() => {
    localStorage.setItem("sppg_custom_besar", JSON.stringify(customBesar));
  }, [customBesar]);

  React.useEffect(() => {
    localStorage.setItem("sppg_custom_kecil", JSON.stringify(customKecil));
  }, [customKecil]);

  // Synchronize target templates based on selectedGroup
  React.useEffect(() => {
    if (selectedGroup === "sekolah") {
      setBesarAkgType("sd_besar");
      setKecilAkgType("sd_kecil");
    } else {
      setBesarAkgType("bumil");
      setKecilAkgType("balita");
    }
  }, [selectedGroup]);

  const getAkgTarget = (porsi: "besar" | "kecil", key: string): number => {
    const isBesar = porsi === "besar";
    const type = isBesar ? besarAkgType : kecilAkgType;
    const mode = isBesar ? besarAkgMode : kecilAkgMode;

    if (type === "custom" || mode === "custom") {
      const customMap = isBesar ? customBesar : customKecil;
      return customMap[key] || 0;
    }

    const config = TARGET_AKG_LIMITS[type];
    if (!config) return 0;

    const minVal = key === "energi" ? config.energiMin : (config as any)[`${key}Min`] || 0;
    const ratio = config.energiMax / config.energiMin;

    if (mode === "min") {
      return minVal;
    }
    if (mode === "max") {
      if (key === "energi") return config.energiMax;
      return Math.round(minVal * ratio * 10) / 10;
    }
    // "avg" mode (default)
    if (key === "energi") {
      return (config.energiMin + config.energiMax) / 2;
    }
    const maxVal = minVal * ratio;
    return Math.round(((minVal + maxVal) / 2) * 10) / 10;
  };

  const handleAkgValChange = (
    porsi: "besar" | "kecil",
    key: string,
    val: number,
    currentMode: string,
    akgTypeFromTable?: string,
    tableId?: string
  ) => {
    const isBesar = porsi === "besar";
    const setCustom = isBesar ? setCustomBesar : setCustomKecil;

    if (tableId) {
      editCustomTableMeta(tableId, "akgMode", "custom");
    } else {
      if (isBesar) {
        setBesarAkgMode("custom");
      } else {
        setKecilAkgMode("custom");
      }
    }

    if (currentMode === "custom") {
      setCustom(prev => ({ ...prev, [key]: val }));
    } else {
      const keys = ["energi", "protein", "lemak", "kh", "serat"];
      const newCustom: Record<string, number> = {};
      
      keys.forEach(k => {
        if (k === key) {
          newCustom[k] = val;
        } else {
          let displayedVal = 0;
          const type = akgTypeFromTable || (isBesar ? besarAkgType : kecilAkgType);
          const config = TARGET_AKG_LIMITS[type];
          if (config) {
            const minVal = k === "energi" ? config.energiMin : (config as any)[`${k}Min`] || 0;
            const ratio = config.energiMax / config.energiMin;

            if (currentMode === "min") {
              displayedVal = minVal;
            } else if (currentMode === "max") {
              if (k === "energi") displayedVal = config.energiMax;
              else displayedVal = Math.round(minVal * ratio * 10) / 10;
            } else { // "avg"
              if (k === "energi") {
                displayedVal = (config.energiMin + config.energiMax) / 2;
              } else {
                const maxVal = minVal * ratio;
                displayedVal = Math.round(((minVal + maxVal) / 2) * 10) / 10;
              }
            }
          }
          newCustom[k] = displayedVal;
        }
      });
      setCustom(newCustom);
    }
  };

  // Force selectedType to MP-ASI if threeB group is active and user wants it, or vice versa
  React.useEffect(() => {
    if (selectedGroup === "sekolah" && selectedType === "MP-ASI") {
      setSelectedType("Basah");
    }
  }, [selectedGroup, selectedType]);

  // Compute database category representation
  const getDbType = (group: "sekolah" | "tigaB" | "custom", type: "Basah" | "Alergi" | "Kering" | "MP-ASI") => {
    if (group === "sekolah") {
      return type === "MP-ASI" ? "Basah" : type;
    } else {
      if (type === "MP-ASI") return "MP-ASI";
      return `3B-${type}` as FoodCostDay["jenisMenu"];
    }
  };

  const activeDbType = getDbType(selectedGroup, selectedType);

  // Get active Day's data
  const dayIndex = selectedDay - 1;
  const currentDayData = (foodCostDays.find((d) => d.hariKe === selectedDay && d.jenisMenu === activeDbType) || {
    hariKe: selectedDay,
    jenisMenu: activeDbType,
    porsiBesarBahan: [],
    porsiKecilBahan: [],
    bufferPct: 5
  }) as FoodCostDay;

  // Get recipient counts based on selected group and type from harianPM
  const dayCounts = getCountsForDay(harianPM, selectedDay);

  // Helper to compute dynamic combined/merged count and target price
  const getPmCountAndTargetPrice = (porsi: "besar" | "kecil") => {
    const targetIds = porsi === "besar" ? settings.porsiBesarSasaranIds : settings.porsiKecilSasaranIds;
    const targetPrice = porsi === "besar" ? settings.porsiBesarHarga : settings.porsiKecilHarga;
    
    const dayPM = harianPM.find(h => h.hariKe === selectedDay) || harianPM[0] || { sasaran: [] };
    let count = 0;
    targetIds.forEach((sId: string) => {
      const sasItem = dayPM.sasaran.find(item => item.id === sId);
      if (sasItem) {
        count += porsi === "besar" ? (Number(sasItem.porsiBesar) || 0) : (Number(sasItem.porsiKecil) || 0);
      }
    });
    
    // Check if there is an active custom count for today
    const currentCustom = porsi === "besar" ? currentDayData.customPmBesarCount : currentDayData.customPmKecilCount;
    if (currentCustom !== undefined) {
      count = currentCustom;
    }
    
    return { count, targetPrice };
  };

  const pmBesarInfo = getPmCountAndTargetPrice("besar");
  const pmKecilInfo = getPmCountAndTargetPrice("kecil");

  const pmBesar = pmBesarInfo.count;
  const pmKecil = pmKecilInfo.count;

  const activeTargetPriceBesar = pmBesarInfo.targetPrice;
  const activeTargetPriceKecil = pmKecilInfo.targetPrice;

  const dayPMForLabels = harianPM.find(h => h.hariKe === selectedDay) || harianPM[0] || { sasaran: [] };
  const porsiKecilLabels = dayPMForLabels.sasaran
    .filter(s => settings.porsiKecilSasaranIds.includes(s.id))
    .map(s => s.label)
    .join(", ");

  const porsiBesarLabels = dayPMForLabels.sasaran
    .filter(s => settings.porsiBesarSasaranIds.includes(s.id))
    .map(s => s.label)
    .join(", ");

  const rabPorsiKecil = pmKecil * activeTargetPriceKecil;
  const rabPorsiBesar = pmBesar * activeTargetPriceBesar;

  const handleToggleKecilSasaran = (id: string) => {
    const currentList = settings.porsiKecilSasaranIds || [];
    const isChecked = currentList.includes(id);
    const updatedIds = isChecked
      ? currentList.filter((x: string) => x !== id)
      : [...currentList, id];
    updateSetting("porsiKecilSasaranIds", updatedIds);
  };

  const handleToggleBesarSasaran = (id: string) => {
    const currentList = settings.porsiBesarSasaranIds || [];
    const isChecked = currentList.includes(id);
    const updatedIds = isChecked
      ? currentList.filter((x: string) => x !== id)
      : [...currentList, id];
    updateSetting("porsiBesarSasaranIds", updatedIds);
  };

  // Get Menu Name from Master Menu
  let namaMenuHariIni = "";
  if (selectedGroup === "sekolah") {
    const list = selectedType === "Alergi" ? masterMenu.usiaSekolahAlergi : masterMenu.usiaSekolah;
    namaMenuHariIni = list?.[dayIndex]?.namaMenu || `Menu Sekolah ${selectedType}`;
  } else if (selectedGroup === "tigaB") {
    if (selectedType === "MP-ASI") {
      const list = masterMenu.mpAsi;
      namaMenuHariIni = list?.[dayIndex]?.namaMenu || "Menu MP-ASI (6-12 Bln)";
    } else {
      const list = selectedType === "Alergi" ? masterMenu.tigaBAlergi : masterMenu.tigaB;
      namaMenuHariIni = list?.[dayIndex]?.namaMenu || `Menu 3B ${selectedType}`;
    }
  } else {
    namaMenuHariIni = `Menu Kustom ${selectedType}`;
  }

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

  const currentCalendarDate = profile?.periodeDates?.[selectedDay - 1] 
    ? formatIndonesianDate(profile.periodeDates[selectedDay - 1]) 
    : `Hari Ke-${selectedDay}`;

  // Calculate results for the day
  const results = calculateDay(
    currentDayData.porsiBesarBahan,
    currentDayData.porsiKecilBahan,
    pmBesar,
    pmKecil,
    currentDayData.bufferPct,
    tkpiList
  );

  const updateDayData = (updatedDay: FoodCostDay) => {
    const updatedDays = foodCostDays.map((d) => {
      if (d.hariKe === updatedDay.hariKe && d.jenisMenu === updatedDay.jenisMenu) {
        return updatedDay;
      }
      return d;
    });

    if (!foodCostDays.some((d) => d.hariKe === updatedDay.hariKe && d.jenisMenu === updatedDay.jenisMenu)) {
      updatedDays.push(updatedDay);
    }
    onFoodCostDaysChange(updatedDays);
  };

  const handleBufferChange = (val: number) => {
    updateDayData({ ...currentDayData, bufferPct: val });
  };

  const autoMatchFromMasterMenu = () => {
    let menuItem: any | undefined;
    if (selectedGroup === "sekolah") {
      const list = selectedType === "Alergi" ? masterMenu.usiaSekolahAlergi : masterMenu.usiaSekolah;
      menuItem = list?.[dayIndex];
    } else if (selectedGroup === "tigaB") {
      if (selectedType === "MP-ASI") {
        menuItem = masterMenu.mpAsi?.[dayIndex];
      } else {
        const list = selectedType === "Alergi" ? masterMenu.tigaBAlergi : masterMenu.tigaB;
        menuItem = list?.[dayIndex];
      }
    }

    if (!menuItem) {
      alert("Menu master tidak ditemukan untuk hari dan kategori ini!");
      return;
    }

    const matchTkpi = (text: string, defaultId: string): string => {
      if (!text) return defaultId;
      const t = text.toLowerCase();
      
      const found = tkpiList.find(item => {
        const name = item.nama.toLowerCase();
        return name.includes(t) || t.includes(name);
      });
      if (found) return found.id;

      if (t.includes("beras") || t.includes("nasi") || t.includes("bubur")) return "beras_giling";
      if (t.includes("kentang")) return "kentang_segar";
      if (t.includes("singkong") || t.includes("ubi")) return "singkong_segar";
      
      if (t.includes("ayam")) return "daging_ayam_tanpa_kulit";
      if (t.includes("sapi") || t.includes("daging")) return "daging_sapi";
      if (t.includes("telur")) return "telur_ayam_ras";
      if (t.includes("ikan")) {
        if (t.includes("kembung")) return "ikan_kembung_segar";
        if (t.includes("mujair")) return "ikan_mujair_segar";
        if (t.includes("teri")) return "ikan_teri_kering";
        return "ikan_kembung_segar";
      }
      if (t.includes("udang")) return "udang_segar";
      
      if (t.includes("tempe")) return "tempe_kedelai";
      if (t.includes("tahu")) return "tahu_mentah";
      if (t.includes("kacang hijau")) return "kacang_hijau_kering";
      if (t.includes("kacang merah")) return "kacang_merah_segar";
      if (t.includes("kacang tanah")) return "kacang_tanah_kupas";
      
      if (t.includes("wortel")) return "wortel_segar";
      if (t.includes("bayam")) return "bayam_segar";
      if (t.includes("kangkung")) return "kangkung_segar";
      if (t.includes("labu siam")) return "labu_siam_segar";
      if (t.includes("labu kuning")) return "labu_kuning";
      if (t.includes("sawi")) return "sawi_segar";
      if (t.includes("kol") || t.includes("kubis")) return "kubis_kol_segar";
      if (t.includes("tomat")) return "tomat_masak_segar";
      
      if (t.includes("pisang")) {
        if (t.includes("ambon")) return "pisang_ambon";
        if (t.includes("raja")) return "pisang_raja";
        return "pisang_ambon";
      }
      if (t.includes("jeruk")) return "jeruk_manis";
      if (t.includes("pepaya")) return "pepaya_segar";
      if (t.includes("apel")) return "apel_segar";
      if (t.includes("semangka")) return "semangka";
      if (t.includes("susu")) return "susu_bubuk_fullcream";

      return defaultId;
    };

    const pbBahan: BahanMakananInput[] = [];
    const pkBahan: BahanMakananInput[] = [];

    const components = [
      { text: menuItem.karbohidrat, defaultTkpi: "beras_giling", defaultBeratPb: 80, defaultBeratPk: 50, defaultUrtPb: "1 piring", defaultUrtPk: "1/2 piring" },
      { text: menuItem.laukHewani, defaultTkpi: "daging_ayam_tanpa_kulit", defaultBeratPb: 65, defaultBeratPk: 40, defaultUrtPb: "1 potong md", defaultUrtPk: "1 potong kcl" },
      { text: menuItem.laukNabati, defaultTkpi: "tempe_kedelai", defaultBeratPb: 30, defaultBeratPk: 20, defaultUrtPb: "1 potong", defaultUrtPk: "1/2 potong" },
      { text: menuItem.sayur, defaultTkpi: "wortel_segar", defaultBeratPb: 40, defaultBeratPk: 25, defaultUrtPb: "1/2 gelas", defaultUrtPk: "1/3 gelas" },
      { text: menuItem.buahSusu, defaultTkpi: "pisang_ambon", defaultBeratPb: 100, defaultBeratPk: 80, defaultUrtPb: "1 buah", defaultUrtPk: "1 buah kcl" }
    ];

    const standardPrices: Record<string, number> = {
      beras_giling: 14000,
      kentang_segar: 20000,
      singkong_segar: 10000,
      daging_ayam_tanpa_kulit: 40000,
      daging_sapi: 120000,
      telur_ayam_ras: 28000,
      ikan_kembung_segar: 35000,
      ikan_mujair_segar: 30000,
      ikan_teri_kering: 80000,
      udang_segar: 70000,
      tempe_kedelai: 15000,
      tahu_mentah: 10000,
      kacang_hijau_kering: 25000,
      kacang_merah_segar: 24000,
      kacang_tanah_kupas: 28000,
      wortel_segar: 18000,
      bayam_segar: 15000,
      kangkung_segar: 12000,
      labu_siam_segar: 12000,
      labu_kuning: 15000,
      sawi_segar: 14000,
      kubis_kol_segar: 12000,
      tomat_masak_segar: 16000,
      pisang_ambon: 12000,
      pisang_raja: 15000,
      jeruk_manis: 20000,
      pepaya_segar: 10000,
      apel_segar: 30000,
      semangka: 10000,
      susu_bubuk_fullcream: 95000
    };

    components.forEach((comp, idx) => {
      if (!comp.text || comp.text.trim() === "" || comp.text.toLowerCase().includes("tidak ada") || comp.text.toLowerCase() === "-") {
        return;
      }

      const tkpiId = matchTkpi(comp.text, comp.defaultTkpi);
      const hargaDb = standardPrices[tkpiId] || 20000;

      pbBahan.push({
        id: `pb_auto_${idx}_${Date.now()}`,
        tkpiId,
        beratBB: comp.defaultBeratPb,
        urt: comp.defaultUrtPb,
        hargaSatuan: hargaDb
      });

      pkBahan.push({
        id: `pk_auto_${idx}_${Date.now()}`,
        tkpiId,
        beratBB: comp.defaultBeratPk,
        urt: comp.defaultUrtPk,
        hargaSatuan: hargaDb
      });
    });

    if (pbBahan.length === 0) {
      alert("Gagal mengidentifikasi bahan makanan yang valid dari Master Menu.");
      return;
    }

    updateDayData({
      ...currentDayData,
      porsiBesarBahan: pbBahan,
      porsiKecilBahan: pkBahan
    });
  };

  const addIngredientRow = (porsi: "besar" | "kecil") => {
    const defaultTkpiId = tkpiList[0]?.id || "beras_giling";
    const newBahan: BahanMakananInput = {
      id: `${porsi}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      tkpiId: defaultTkpiId,
      beratBB: porsi === "besar" ? 60 : 40,
      urt: "1 porsi",
      hargaSatuan: 20000
    };

    if (porsi === "besar") {
      updateDayData({
        ...currentDayData,
        porsiBesarBahan: [...currentDayData.porsiBesarBahan, newBahan]
      });
    } else {
      updateDayData({
        ...currentDayData,
        porsiKecilBahan: [...currentDayData.porsiKecilBahan, newBahan]
      });
    }
  };

  const removeIngredientRow = (porsi: "besar" | "kecil", id: string, index: number) => {
    const listKey = porsi === "besar" ? "porsiBesarBahan" : "porsiKecilBahan";
    const currentList = currentDayData[listKey] || [];
    const updatedList = currentList.filter((b, idx) => {
      if (id && b.id) {
        return b.id !== id;
      }
      return idx !== index;
    });

    updateDayData({
      ...currentDayData,
      [listKey]: updatedList
    });
  };

  const handleRowChange = (
    porsi: "besar" | "kecil",
    index: number,
    field: keyof BahanMakananInput,
    value: any
  ) => {
    const listKey = porsi === "besar" ? "porsiBesarBahan" : "porsiKecilBahan";
    const list = [...currentDayData[listKey]];
    list[index] = { ...list[index], [field]: value };
    updateDayData({ ...currentDayData, [listKey]: list });
  };

  const handleRowBatchChange = (
    porsi: "besar" | "kecil",
    index: number,
    updates: Partial<BahanMakananInput>
  ) => {
    const listKey = porsi === "besar" ? "porsiBesarBahan" : "porsiKecilBahan";
    const list = [...currentDayData[listKey]];
    list[index] = { ...list[index], ...updates };
    updateDayData({ ...currentDayData, [listKey]: list });
  };

  const targetPriceKecil = activeTargetPriceKecil;
  const targetPriceBesar = activeTargetPriceBesar;

  const logoSrc = customLogo || localStorage.getItem("sisper_custom_logo") || "/src/assets/images/logo_sppg_1782256222616.jpg";

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    const generateSheetData = (porsi: "besar" | "kecil") => {
      const activeItems = porsi === "besar" ? results.porsiBesarItems : results.porsiKecilItems;
      const totalBahan = porsi === "besar" ? results.totalBesarBahanCost : results.totalKecilBahanCost;
      const buffer = porsi === "besar" ? results.bufferBesarCost : results.bufferKecilCost;
      const bumbu = porsi === "besar" ? results.bumbuBesarCost : results.bumbuKecilCost;
      const subtotal = porsi === "besar" ? results.subtotalBesarCost : results.subtotalKecilCost;
      const perPorsi = porsi === "besar" ? results.costPerPorsiBesar : results.costPerPorsiKecil;
      const pmCount = porsi === "besar" ? pmBesar : pmKecil;

      const sheetData: any[][] = [];

      sheetData.push([kopLine1]);
      sheetData.push([kopLine2]);
      sheetData.push([kopLine3]);
      sheetData.push([kopLine4]);
      sheetData.push([]);
      
      sheetData.push(["LAPORAN FOOD COST (ANALISIS BIAYA & GIZI) - " + (porsi === "besar" ? "PORSI BESAR" : "PORSI KECIL")]);
      sheetData.push(["Siklus Hari Ke:", selectedDay, "Kategori:", selectedType, "Menu:", namaMenuHariIni]);
      sheetData.push(["Jumlah Penerima Manfaat (PM):", pmCount, "Penerima Manfaat"]);
      sheetData.push([]);

      sheetData.push([
        "KRITERIA PM", "MENU", "BAHAN MAKANAN", "BERAT (BB) (g)", "URT",
        "ENERGI (Kal)", "PROTEIN (g)", "LEMAK (g)", "KH (g)", "SERAT (g)",
        "BDD (%)", "BK (gr)", "Jumlah Manfaat", "Gram", "Kg",
        headerPotong, headerEkor, `Buffer (${currentDayData.bufferPct}%)`, "Jumlah+Buffer", "Harga Satuan (Rp)", "Harga Total (Rp)"
      ]);

      const defaultLabel = porsi === "besar"
        ? (selectedGroup === "sekolah" ? "Siswa SD 4-6 / SMP / SMA" : selectedGroup === "tigaB" ? "Ibu Hamil / Ibu Menyusui" : "PM Porsi Besar (Custom)")
        : (selectedGroup === "sekolah" ? "Siswa TK/PAUD / SD 1-3" : selectedGroup === "tigaB" ? "Balita (6-59 Bln)" : "PM Porsi Kecil (Custom)");

      const labelKey = `${selectedDay}_${selectedGroup}_${selectedType}_${porsi}`;
      const kriteriaPmText = customKriteriaLabels[labelKey] ?? defaultLabel;

      activeItems.forEach((b) => {
        sheetData.push([
          kriteriaPmText,
          namaMenuHariIni || "-",
          b.nama,
          b.beratBB,
          b.urt,
          b.energi,
          b.protein,
          b.lemak,
          b.kh,
          b.serat,
          b.bdd,
          b.beratKotor,
          pmCount,
          b.totalKebutuhanGram,
          b.totalKebutuhanKg,
          b.potong || 0,
          b.ekor || 0,
          b.buah || 0,
          b.butir || 0,
          b.hargaSatuan,
          b.hargaTotal
        ]);
      });

      sheetData.push([]);

      const sumEnergi = activeItems.reduce((acc, b) => acc + b.energi, 0);
      const sumProtein = activeItems.reduce((acc, b) => acc + b.protein, 0);
      const sumLemak = activeItems.reduce((acc, b) => acc + b.lemak, 0);
      const sumKH = activeItems.reduce((acc, b) => acc + b.kh, 0);
      const sumSerat = activeItems.reduce((acc, b) => acc + b.serat, 0);

      const targetEnergi = getAkgTarget(porsi, "energi");
      const targetProtein = getAkgTarget(porsi, "protein");
      const targetLemak = getAkgTarget(porsi, "lemak");
      const targetKH = getAkgTarget(porsi, "kh");
      const targetSerat = getAkgTarget(porsi, "serat");

      const pctEnergi = targetEnergi > 0 ? (sumEnergi / targetEnergi) * 100 : 0;
      const pctProtein = targetProtein > 0 ? (sumProtein / targetProtein) * 100 : 0;
      const pctLemak = targetLemak > 0 ? (sumLemak / targetLemak) * 100 : 0;
      const pctKH = targetKH > 0 ? (sumKH / targetKH) * 100 : 0;
      const pctSerat = targetSerat > 0 ? (sumSerat / targetSerat) * 100 : 0;

      sheetData.push(["KANDUNGAN GIZI", "", "", "", "", sumEnergi, sumProtein, sumLemak, sumKH, sumSerat, "", "", "JUMLAH (Rp)", totalBahan, "", "", "JUMLAH (Rp)", totalBahan]);
      sheetData.push([`KEBUTUHAN RUJUKAN AKG`, "", "", "", "", targetEnergi, targetProtein, targetLemak, targetKH, targetSerat, "", "", "BUMBU 10% (Rp)", totalBahan * 0.1, "", "", "BUMBU 10% (Rp)", totalBahan * 0.1]);
      sheetData.push(["KEBUTUHAN 90-110%", "", "", "", "", `${pctEnergi.toFixed(0)}%`, `${pctProtein.toFixed(0)}%`, `${pctLemak.toFixed(0)}%`, `${pctKH.toFixed(0)}%`, `${pctSerat.toFixed(0)}%`, "", "", "JUMLAH+BUMBU 10% (Rp)", totalBahan * 1.1, "", "", "JUMLAH+BUMBU 10% (Rp)", totalBahan * 1.1]);
      sheetData.push([]);
      sheetData.push(["", "", "", "", "", "", "", "", "", "", "", "", "HARGA PER PORSI (Rp)", perPorsi]);

      return sheetData;
    };

    const besarData = generateSheetData("besar");
    const wsBesar = XLSX.utils.aoa_to_sheet(besarData);
    XLSX.utils.book_append_sheet(wb, wsBesar, "Porsi Besar");

    const kecilData = generateSheetData("kecil");
    const wsKecil = XLSX.utils.aoa_to_sheet(kecilData);
    XLSX.utils.book_append_sheet(wb, wsKecil, "Porsi Kecil");

    // Append custom tables to Excel
    customTables.forEach((table, index) => {
      const resultsCustom = table.porsi === "besar"
        ? calculateDay(table.bahanList, [], table.pmCount, 0, table.bufferPct || 5, tkpiList)
        : calculateDay([], table.bahanList, 0, table.pmCount, table.bufferPct || 5, tkpiList);

      const itemsCustom = table.porsi === "besar" ? resultsCustom.porsiBesarItems : resultsCustom.porsiKecilItems;
      const totalBahanCustom = table.porsi === "besar" ? resultsCustom.totalBesarBahanCost : resultsCustom.totalKecilBahanCost;
      const bufferCustom = table.porsi === "besar" ? resultsCustom.bufferBesarCost : resultsCustom.bufferKecilCost;
      const subtotalCustom = table.porsi === "besar" ? resultsCustom.subtotalBesarCost : resultsCustom.subtotalKecilCost;
      const perPorsiCustom = table.porsi === "besar" ? resultsCustom.costPerPorsiBesar : resultsCustom.costPerPorsiKecil;
      const pmCountCustom = table.pmCount;

      const sheetDataCustom: any[][] = [];

      sheetDataCustom.push([kopLine1]);
      sheetDataCustom.push([kopLine2]);
      sheetDataCustom.push([kopLine3]);
      sheetDataCustom.push([kopLine4]);
      sheetDataCustom.push([]);
      
      sheetDataCustom.push(["LAPORAN FOOD COST (ANALISIS BIAYA & GIZI) - " + table.namaTabel.toUpperCase()]);
      sheetDataCustom.push(["Siklus Hari Ke:", selectedDay, "Kategori:", selectedType, "Porsi:", table.porsi.toUpperCase()]);
      sheetDataCustom.push(["Jumlah Penerima Manfaat (PM):", pmCountCustom, "Penerima Manfaat"]);
      sheetDataCustom.push([]);

      sheetDataCustom.push([
        "KRITERIA PM", "MENU", "BAHAN MAKANAN", "BERAT (BB) (g)", "URT",
        "ENERGI (Kal)", "PROTEIN (g)", "LEMAK (g)", "KH (g)", "SERAT (g)",
        "BDD (%)", "BK (gr)", "Jumlah Manfaat", "Gram", "Kg",
        "Potong", "Ekor", "Buah", "Butir", "Harga Satuan (Rp)", "Harga Total (Rp)"
      ]);

      const tableKriteria = table.kriteriaPm || (table.porsi === "besar" ? "Kriteria PM Besar" : "Kriteria PM Kecil");

      itemsCustom.forEach((b) => {
        sheetDataCustom.push([
          tableKriteria,
          namaMenuHariIni || "-",
          b.nama,
          b.beratBB,
          b.urt,
          b.energi,
          b.protein,
          b.lemak,
          b.kh,
          b.serat,
          b.bdd,
          b.beratKotor,
          pmCountCustom,
          b.totalKebutuhanGram,
          b.totalKebutuhanKg,
          b.potong || 0,
          b.ekor || 0,
          b.buah || 0,
          b.butir || 0,
          b.hargaSatuan,
          b.hargaTotal
        ]);
      });

      sheetDataCustom.push([]);

      const sumEnergiCustom = itemsCustom.reduce((acc, b) => acc + b.energi, 0);
      const sumProteinCustom = itemsCustom.reduce((acc, b) => acc + b.protein, 0);
      const sumLemakCustom = itemsCustom.reduce((acc, b) => acc + b.lemak, 0);
      const sumKHCustom = itemsCustom.reduce((acc, b) => acc + b.kh, 0);
      const sumSeratCustom = itemsCustom.reduce((acc, b) => acc + b.serat, 0);

      const tableAkgType = table.akgType || (table.porsi === "besar" ? "sd_besar" : "sd_kecil");
      const tableAkgMode = table.akgMode || "avg";
      const getCustomTableAkgTarget = (key: string): number => {
        if (tableAkgType === "custom" || tableAkgMode === "custom") {
          const customMap = table.porsi === "besar" ? customBesar : customKecil;
          return customMap[key] || 0;
        }
        const config = TARGET_AKG_LIMITS[tableAkgType];
        if (!config) return 0;

        const minVal = key === "energi" ? config.energiMin : (config as any)[`${key}Min`] || 0;
        const ratio = config.energiMax / config.energiMin;

        if (tableAkgMode === "min") {
          return minVal;
        }
        if (tableAkgMode === "max") {
          if (key === "energi") return config.energiMax;
          return Math.round(minVal * ratio * 10) / 10;
        }
        // "avg" mode
        if (key === "energi") {
          return (config.energiMin + config.energiMax) / 2;
        }
        const maxVal = minVal * ratio;
        return Math.round(((minVal + maxVal) / 2) * 10) / 10;
      };

      const targetEnergiCustom = getCustomTableAkgTarget("energi");
      const targetProteinCustom = getCustomTableAkgTarget("protein");
      const targetLemakCustom = getCustomTableAkgTarget("lemak");
      const targetKHCustom = getCustomTableAkgTarget("kh");
      const targetSeratCustom = getCustomTableAkgTarget("serat");

      const pctEnergiCustom = targetEnergiCustom > 0 ? (sumEnergiCustom / targetEnergiCustom) * 100 : 0;
      const pctProteinCustom = targetProteinCustom > 0 ? (sumProteinCustom / targetProteinCustom) * 100 : 0;
      const pctLemakCustom = targetLemakCustom > 0 ? (sumLemakCustom / targetLemakCustom) * 100 : 0;
      const pctKHCustom = targetKHCustom > 0 ? (sumKHCustom / targetKHCustom) * 100 : 0;
      const pctSeratCustom = targetSeratCustom > 0 ? (sumSeratCustom / targetSeratCustom) * 100 : 0;

      sheetDataCustom.push(["KANDUNGAN GIZI", "", "", "", "", sumEnergiCustom, sumProteinCustom, sumLemakCustom, sumKHCustom, sumSeratCustom, "", "", "JUMLAH (Rp)", totalBahanCustom, "", "", "JUMLAH (Rp)", totalBahanCustom]);
      sheetDataCustom.push([`KEBUTUHAN RUJUKAN AKG`, "", "", "", "", targetEnergiCustom, targetProteinCustom, targetLemakCustom, targetKHCustom, targetSeratCustom, "", "", "BUMBU 10% (Rp)", totalBahanCustom * 0.1, "", "", "BUMBU 10% (Rp)", totalBahanCustom * 0.1]);
      sheetDataCustom.push(["KEBUTUHAN 90-110%", "", "", "", "", `${pctEnergiCustom.toFixed(0)}%`, `${pctProteinCustom.toFixed(0)}%`, `${pctLemakCustom.toFixed(0)}%`, `${pctKHCustom.toFixed(0)}%`, `${pctSeratCustom.toFixed(0)}%`, "", "", "JUMLAH+BUMBU 10% (Rp)", totalBahanCustom * 1.1, "", "", "JUMLAH+BUMBU 10% (Rp)", totalBahanCustom * 1.1]);
      sheetDataCustom.push([]);
      sheetDataCustom.push(["", "", "", "", "", "", "", "", "", "", "", "", "HARGA PER PORSI (Rp)", perPorsiCustom]);

      const wsCustom = XLSX.utils.aoa_to_sheet(sheetDataCustom);
      const cleanSheetName = table.namaTabel.substring(0, 25).replace(/[\\\/\?\*\[\]]/g, "") || `Tabel ${index + 1}`;
      XLSX.utils.book_append_sheet(wb, wsCustom, cleanSheetName);
    });

    XLSX.writeFile(wb, `Food_Cost_Hari_${selectedDay}_${selectedGroup}_${selectedType}.xlsx`);
  };

  const renderFoodCostTable = (porsi: "besar" | "kecil", isPrint: boolean) => {
    const items = porsi === "besar" ? results.porsiBesarItems : results.porsiKecilItems;
    const totalBahanCost = porsi === "besar" ? results.totalBesarBahanCost : results.totalKecilBahanCost;
    const bufferCost = porsi === "besar" ? results.bufferBesarCost : results.bufferKecilCost;
    const bumbuCost = porsi === "besar" ? results.bumbuBesarCost : results.bumbuKecilCost;
    const subtotalCost = porsi === "besar" ? results.subtotalBesarCost : results.subtotalKecilCost;
    const costPerPorsi = porsi === "besar" ? results.costPerPorsiBesar : results.costPerPorsiKecil;
    const recipientCount = porsi === "besar" ? pmBesar : pmKecil;
    const targetPrice = porsi === "besar" ? targetPriceBesar : targetPriceKecil;

    const calculatedCostPerPorsi = planningMode === "all_ingredients"
      ? (recipientCount > 0 ? totalBahanCost / recipientCount : 0)
      : costPerPorsi;

    const akgType = porsi === "besar" ? besarAkgType : kecilAkgType;
    const setAkgType = porsi === "besar" ? setBesarAkgType : setKecilAkgType;
    const customMap = porsi === "besar" ? customBesar : customKecil;
    const setCustomMap = porsi === "besar" ? setCustomBesar : setCustomKecil;

    const sumEnergi = items.reduce((acc, b) => acc + b.energi, 0);
    const sumProtein = items.reduce((acc, b) => acc + b.protein, 0);
    const sumLemak = items.reduce((acc, b) => acc + b.lemak, 0);
    const sumKH = items.reduce((acc, b) => acc + b.kh, 0);
    const sumSerat = items.reduce((acc, b) => acc + b.serat, 0);

    const targetEnergi = getAkgTarget(porsi, "energi");
    const targetProtein = getAkgTarget(porsi, "protein");
    const targetLemak = getAkgTarget(porsi, "lemak");
    const targetKH = getAkgTarget(porsi, "kh");
    const targetSerat = getAkgTarget(porsi, "serat");

    const pctEnergi = targetEnergi > 0 ? (sumEnergi / targetEnergi) * 100 : 0;
    const pctProtein = targetProtein > 0 ? (sumProtein / targetProtein) * 100 : 0;
    const pctLemak = targetLemak > 0 ? (sumLemak / targetLemak) * 100 : 0;
    const pctKH = targetKH > 0 ? (sumKH / targetKH) * 100 : 0;
    const pctSerat = targetSerat > 0 ? (sumSerat / targetSerat) * 100 : 0;

    const diffPrice = calculatedCostPerPorsi - targetPrice;
    const isOverBudget = diffPrice > 0;

    const defaultLabel = porsi === "besar"
      ? (selectedGroup === "sekolah" ? "Siswa SD 4-6 / SMP / SMA" : selectedGroup === "tigaB" ? "Ibu Hamil / Ibu Menyusui" : "PM Porsi Besar (Custom)")
      : (selectedGroup === "sekolah" ? "Siswa TK/PAUD / SD 1-3" : selectedGroup === "tigaB" ? "Balita (6-59 Bln)" : "PM Porsi Kecil (Custom)");

    const labelKey = `${selectedDay}_${selectedGroup}_${selectedType}_${porsi}`;
    const kriteriaPmText = customKriteriaLabels[labelKey] ?? defaultLabel;

    if (items.length === 0) {
      if (isPrint) {
        return (
          <div className="p-4 border border-black rounded-lg text-center text-xs font-bold text-slate-500 italic uppercase bg-slate-50">
            Tidak ada komponen bahan baku untuk porsi {porsi} hari ini.
          </div>
        );
      }
      return (
        <div className="flex flex-col items-center justify-center p-8 bg-slate-50 border border-dashed border-slate-300 rounded-2xl space-y-3 text-center my-2">
          <div className="p-3 bg-rose-50 text-rose-500 rounded-full animate-pulse">
            <Trash2 className="w-6 h-6" />
          </div>
          <div>
            <h5 className="text-xs font-black text-slate-700 uppercase tracking-wide">
              Komponen Bahan Baku Kosong
            </h5>
            <p className="text-[11px] text-slate-500 mt-1 max-w-sm">
              Seluruh bahan baku telah dihapus. Silakan klik tombol <strong className="text-indigo-600 font-extrabold">+ Tambah Bahan Baku</strong> di atas untuk menginput ulang.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto border border-black rounded-lg shadow-xs">
        <table className="w-full border-collapse border border-black font-sans text-xs text-center" style={{ fontSize: '12px' }}>
          <thead className="bg-[#92D050] text-black font-bold uppercase border border-black text-center">
            <tr>
              <th rowSpan={2} className="p-1 border border-black text-center text-slate-950 font-extrabold w-[110px] min-w-[110px]">KRITERIA PM</th>
              <th rowSpan={2} className="p-1 border border-black text-center text-slate-950 font-extrabold w-[110px] min-w-[110px]">MENU</th>
              <th rowSpan={2} className="p-1 border border-black text-center text-slate-950 font-extrabold w-[160px] min-w-[160px]">BAHAN MAKANAN</th>
              <th rowSpan={2} className="p-1 border border-black text-center text-slate-950 font-extrabold w-[56px] min-w-[56px]">BERAT (BB)</th>
              <th rowSpan={2} className="p-1 border border-black text-center text-slate-950 font-extrabold w-[56px] min-w-[56px]">URT</th>
              <th colSpan={5} className="p-1 border border-black text-center text-slate-950 font-extrabold bg-[#76933C] text-white">KOMPOSISI ZAT GIZI MAKANAN</th>
              <th rowSpan={2} className="p-1 border border-black text-center text-slate-950 font-extrabold w-[56px] min-w-[56px]">BDD (%)</th>
              <th rowSpan={2} className="p-1 border border-black text-center text-slate-950 font-extrabold w-[64px] min-w-[64px]">BK (g)</th>
              <th rowSpan={2} className="p-1 border border-black text-center text-slate-950 font-extrabold w-[64px] min-w-[64px]">Jumlah Manfaat</th>
              <th rowSpan={2} className="p-1 border border-black text-center text-slate-950 font-extrabold w-[72px] min-w-[72px]">Gram (g)</th>
              <th rowSpan={2} className="p-1 border border-black text-center text-slate-950 font-extrabold w-[72px] min-w-[72px]">Kg (kg)</th>
              <th rowSpan={2} className="p-1 border border-black text-center text-slate-950 font-extrabold w-[48px] min-w-[48px] bg-[#92D050]">
                {isPrint ? (
                  headerPotong
                ) : (
                  <input
                    type="text"
                    value={headerPotong}
                    onChange={(e) => {
                      setHeaderPotong(e.target.value);
                      localStorage.setItem("fc_header_potong", e.target.value);
                    }}
                    className="w-full text-center bg-[#92D050] border-0 hover:bg-[#86c145] focus:bg-white font-extrabold p-0.5 rounded text-slate-950 uppercase text-[11px] focus:ring-1 focus:ring-slate-600"
                    title="Ubah judul kolom Potong"
                  />
                )}
              </th>
              <th rowSpan={2} className="p-1 border border-black text-center text-slate-950 font-extrabold w-[48px] min-w-[48px] bg-[#92D050]">
                {isPrint ? (
                  headerEkor
                ) : (
                  <input
                    type="text"
                    value={headerEkor}
                    onChange={(e) => {
                      setHeaderEkor(e.target.value);
                      localStorage.setItem("fc_header_ekor", e.target.value);
                    }}
                    className="w-full text-center bg-[#92D050] border-0 hover:bg-[#86c145] focus:bg-white font-extrabold p-0.5 rounded text-slate-950 uppercase text-[11px] focus:ring-1 focus:ring-slate-600"
                    title="Ubah judul kolom Ekor"
                  />
                )}
              </th>
              <th rowSpan={2} className="p-1 border border-black text-center text-slate-950 font-extrabold w-[115px] min-w-[115px] bg-[#92D050] text-[10px] leading-tight select-none">
                Buffer ({currentDayData.bufferPct}%)
              </th>
              <th rowSpan={2} className="p-1 border border-black text-center text-slate-950 font-extrabold w-[155px] min-w-[155px] bg-[#92D050] text-[10px] leading-tight select-none">
                Jumlah+Buffer
              </th>
              <th rowSpan={2} className="p-1 border border-black text-center text-slate-950 font-extrabold w-[130px] min-w-[130px]">Harga Satuan</th>
              <th rowSpan={2} className="p-1 border border-black border-r-2 border-r-slate-950 text-center text-slate-950 font-extrabold w-[136px] min-w-[136px]">Harga Total</th>
              {!isPrint && <th rowSpan={2} className="p-1 border border-black border-l-2 border-l-slate-950 text-center text-rose-800 w-[44px] min-w-[44px] no-print">Aksi</th>}
            </tr>
            <tr>
              <th className="p-1 border border-black text-center w-[54px] min-w-[54px] bg-[#D8E4BC] text-slate-950 font-bold">ENERGI (Kal)</th>
              <th className="p-1 border border-black text-center w-[56px] min-w-[56px] bg-[#D8E4BC] text-slate-950 font-bold">Protein (g)</th>
              <th className="p-1 border border-black text-center w-[56px] min-w-[56px] bg-[#D8E4BC] text-slate-950 font-bold">LEMAK (g)</th>
              <th className="p-1 border border-black text-center w-[56px] min-w-[56px] bg-[#D8E4BC] text-slate-950 font-bold">KH (g)</th>
              <th className="p-1 border border-black text-center w-[56px] min-w-[56px] bg-[#D8E4BC] text-slate-950 font-bold">SERAT (g)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black text-[11px] text-slate-900 bg-white">
            {items.length === 0 ? (
              <tr>
                <td colSpan={isPrint ? 21 : 22} className="p-6 text-center text-slate-400 italic bg-slate-50 border border-black">
                  Belum ada bahan makanan yang diinput untuk porsi {porsi}.
                </td>
              </tr>
            ) : (
              items.map((b, idx) => (
                <tr key={b.id} className="hover:bg-slate-50/50">
                  {idx === 0 && (
                    <td rowSpan={items.length} className="p-1 border border-black text-center font-extrabold bg-[#E2EFDA] align-middle text-[10px] uppercase leading-tight w-[110px] min-w-[110px]">
                      {isPrint ? (
                        <span className="block p-1 text-[10px] font-extrabold text-slate-950 uppercase">{kriteriaPmText}</span>
                      ) : (
                        <textarea
                          value={kriteriaPmText}
                          onChange={(e) => saveCustomKriteriaLabel(labelKey, e.target.value)}
                          className="w-full text-center bg-transparent border-0 font-extrabold text-[10px] uppercase focus:ring-1 focus:ring-indigo-500 p-1 resize-none overflow-hidden"
                          rows={3}
                          placeholder="Edit Kriteria PM..."
                        />
                      )}
                    </td>
                  )}
                  {idx === 0 && (
                    <td rowSpan={items.length} className="p-1 border border-black text-center font-bold bg-[#F2F2F2] align-middle text-[10px] w-[110px] min-w-[110px] break-words text-slate-950">
                      {namaMenuHariIni || "-"}
                    </td>
                  )}
                  <td className="p-1 border border-black font-semibold w-[160px] min-w-[160px] text-center">
                    {isPrint ? (
                      <span className="p-0.5 block text-xs font-bold text-slate-950 text-center">{b.nama}</span>
                    ) : (
                      <div className="flex items-center gap-1.5 justify-center">
                        <div className="flex-1 min-w-0">
                          <SearchableTkpiDropdown
                            id={`fc-select-tkpi-${porsi}-${idx}`}
                            tkpiList={tkpiList}
                            selectedValue={currentDayData[porsi === "besar" ? "porsiBesarBahan" : "porsiKecilBahan"][idx]?.tkpiId || ""}
                            onChange={(val) => handleRowChange(porsi, idx, "tkpiId", val)}
                            minimal
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeIngredientRow(porsi, b.id, idx)}
                          className="p-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition hover:scale-105 active:scale-95 shrink-0 no-print"
                          title="Hapus Bahan Makanan Ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="p-1 border border-black text-center w-[56px] min-w-[56px]">
                    {isPrint ? (
                      <span className="font-mono font-bold text-slate-950 text-xs text-center">{b.beratBB}</span>
                    ) : (
                      <input
                        id={`fc-input-bb-${porsi}-${idx}`}
                        type="number"
                        value={currentDayData[porsi === "besar" ? "porsiBesarBahan" : "porsiKecilBahan"][idx]?.beratBB || ""}
                        onChange={(e) => handleRowChange(porsi, idx, "beratBB", Number(e.target.value))}
                        className="w-full text-center bg-transparent border-0 font-mono font-bold p-0 text-slate-950 text-xs"
                      />
                    )}
                  </td>
                  <td className="p-1 border border-black text-center w-[56px] min-w-[56px]">
                    {isPrint ? (
                      <span className="text-slate-950 text-xs text-center">{b.urt}</span>
                    ) : (
                      <input
                        id={`fc-input-urt-${porsi}-${idx}`}
                        type="text"
                        value={currentDayData[porsi === "besar" ? "porsiBesarBahan" : "porsiKecilBahan"][idx]?.urt || ""}
                        onChange={(e) => handleRowChange(porsi, idx, "urt", e.target.value)}
                        className="w-full text-center bg-transparent border-0 p-0 text-slate-950 text-xs text-center"
                      />
                    )}
                  </td>
                  <td className="p-1 border border-black text-center font-mono text-slate-950 font-semibold bg-slate-50/30 w-[54px] min-w-[54px] text-xs">{b.energi.toFixed(1)}</td>
                  <td className="p-1 border border-black text-center font-mono text-slate-950 font-semibold bg-slate-50/30 w-[56px] min-w-[56px] text-xs">{b.protein.toFixed(1)}</td>
                  <td className="p-1 border border-black text-center font-mono text-slate-950 font-semibold bg-slate-50/30 w-[56px] min-w-[56px] text-xs">{b.lemak.toFixed(1)}</td>
                  <td className="p-1 border border-black text-center font-mono text-slate-950 font-semibold bg-slate-50/30 w-[56px] min-w-[56px] text-xs">{b.kh.toFixed(1)}</td>
                  <td className="p-1 border border-black text-center font-mono text-slate-950 font-semibold bg-slate-50/30 w-[56px] min-w-[56px] text-xs">{b.serat.toFixed(1)}</td>
                  
                  <td className="p-1 border border-black text-center w-[56px] min-w-[56px]">
                    {isPrint ? (
                      <span className="font-mono font-bold text-slate-950 text-xs">{b.bdd}%</span>
                    ) : (
                      <EditableBddCell
                        value={b.bdd}
                        isCustom={currentDayData[porsi === "besar" ? "porsiBesarBahan" : "porsiKecilBahan"][idx]?.bdd !== undefined}
                        onChange={(newVal) => handleRowChange(porsi, idx, "bdd", newVal)}
                      />
                    )}
                  </td>
                  <td className="p-1 border border-black text-center font-mono text-indigo-955 font-bold bg-[#E6F0FA]/20 w-[64px] min-w-[64px] text-slate-950 text-xs">{b.beratKotor.toFixed(1)}</td>
                  
                  {idx === 0 && (
                    <td rowSpan={items.length} className="p-1 border border-black text-center font-extrabold bg-[#FFF2CC] align-middle font-mono w-[64px] min-w-[64px] text-slate-950 text-xs">
                      {recipientCount}
                    </td>
                  )}
                  
                  <td className="p-1 border border-black text-center font-mono text-slate-950 w-[72px] min-w-[72px] font-semibold text-xs">{b.totalKebutuhanGram.toFixed(1)}</td>
                  <td className="p-1 border border-black text-center font-mono font-bold text-slate-950 w-[72px] min-w-[72px] text-xs">{b.totalKebutuhanKg.toFixed(3)}</td>
                  
                   <td className="p-1 border border-black text-center w-[48px] min-w-[48px]">
                    {isPrint ? (
                      <span className="font-mono text-slate-950">{b.potong || "-"}</span>
                    ) : (
                      <div className="relative group/calc flex items-center justify-center h-full w-full">
                        <input
                          type="text"
                          value={currentDayData[porsi === "besar" ? "porsiBesarBahan" : "porsiKecilBahan"][idx]?.potong ?? ""}
                          onChange={(e) => handleRowChange(porsi, idx, "potong", e.target.value)}
                          className="w-full text-center bg-transparent border-0 font-mono p-0 text-slate-950 text-xs focus:ring-1 focus:ring-rose-500 rounded"
                        />
                        <button
                          type="button"
                          onClick={() => openCalculator(porsi, idx, "potong", String(currentDayData[porsi === "besar" ? "porsiBesarBahan" : "porsiKecilBahan"][idx]?.potong ?? ""))}
                          className="absolute right-0.5 top-1/2 -translate-y-1/2 opacity-0 group-hover/calc:opacity-100 focus:opacity-100 bg-white hover:bg-slate-100 border border-slate-200 shadow-xs px-0.5 rounded text-[10px] text-slate-500 z-10 transition-opacity"
                          title="Buka Kalkulator"
                        >
                          🧮
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="p-1 border border-black text-center w-[48px] min-w-[48px]">
                    {isPrint ? (
                      <span className="font-mono text-slate-950">{b.ekor || "-"}</span>
                    ) : (
                      <div className="relative group/calc flex items-center justify-center h-full w-full">
                        <input
                          type="text"
                          value={currentDayData[porsi === "besar" ? "porsiBesarBahan" : "porsiKecilBahan"][idx]?.ekor ?? ""}
                          onChange={(e) => handleRowChange(porsi, idx, "ekor", e.target.value)}
                          className="w-full text-center bg-transparent border-0 font-mono p-0 text-slate-950 text-xs focus:ring-1 focus:ring-rose-500 rounded"
                        />
                        <button
                          type="button"
                          onClick={() => openCalculator(porsi, idx, "ekor", String(currentDayData[porsi === "besar" ? "porsiBesarBahan" : "porsiKecilBahan"][idx]?.ekor ?? ""))}
                          className="absolute right-0.5 top-1/2 -translate-y-1/2 opacity-0 group-hover/calc:opacity-100 focus:opacity-100 bg-white hover:bg-slate-100 border border-slate-200 shadow-xs px-0.5 rounded text-[10px] text-slate-500 z-10 transition-opacity"
                          title="Buka Kalkulator"
                        >
                          🧮
                        </button>
                      </div>
                    )}
                  </td>
                  <td
                    onClick={() => !isPrint && openBufferConfig(porsi, idx, b)}
                    className={`p-1 border border-black text-center w-[115px] min-w-[115px] bg-slate-50/50 ${!isPrint ? "cursor-pointer hover:bg-indigo-50/70 transition-all group/buffer" : ""}`}
                    title={!isPrint ? "Klik untuk memilih basis Buffer (Kg, Potong, Ekor)" : undefined}
                  >
                    <div className="flex flex-col items-center justify-center h-full min-h-[36px]">
                      <span className="font-mono text-slate-950 text-xs font-semibold">
                        {typeof b.buah === "number" && b.buah >= 0 ? b.buah.toFixed(3) : "-"}
                      </span>
                      {!isPrint && (
                        <span className="text-[8px] text-indigo-600 font-extrabold uppercase tracking-wider block leading-none mt-0.5 opacity-70 group-hover/buffer:opacity-100 transition-opacity">
                          {b.bufferBase === "kg" ? "KG" : b.bufferBase === "potong" ? "Ptg" : b.bufferBase === "ekor" ? "Ekr" : b.bufferBase === "custom" ? "Cust" : "Auto"} ⚙️
                        </span>
                      )}
                    </div>
                  </td>
                  <td
                    onClick={() => !isPrint && openBufferConfig(porsi, idx, b)}
                    className={`p-1 border border-black text-center w-[155px] min-w-[155px] bg-[#E6F0FA]/30 ${!isPrint ? "cursor-pointer hover:bg-indigo-50/70 transition-all group/jumlah" : ""}`}
                    title={!isPrint ? "Klik untuk mengatur rumus Jumlah + Buffer" : undefined}
                  >
                    <div className="flex flex-col items-center justify-center h-full min-h-[36px]">
                      <span className="font-mono text-slate-950 text-xs font-bold text-indigo-950">
                        {typeof b.butir === "number" && b.butir >= 0 ? b.butir.toFixed(3) : "-"}
                      </span>
                      {!isPrint && (
                        <span className="text-[8px] text-indigo-700 font-extrabold uppercase tracking-wider block leading-none mt-0.5 opacity-70 group-hover/jumlah:opacity-100 transition-opacity">
                          {(() => {
                            const val = b.jumlahBufferChoice || "auto";
                            if (val === "auto") return "Auto";
                            if (val === "kg_with") return "KG + Buf";
                            if (val === "kg_without") return "KG Saja";
                            if (val === "potong_with") return "Ptg + Buf";
                            if (val === "potong_without") return "Ptg Saja";
                            if (val === "ekor_with") return "Ekr + Buf";
                            if (val === "ekor_without") return "Ekr Saja";
                            if (val === "custom_with") return "Cust + Buf";
                            if (val === "custom_without") return "Cust Saja";
                            return val;
                          })()} ⚙️
                        </span>
                      )}
                    </div>
                  </td>
                  
                  <td className="p-1 border border-black text-center w-[130px] min-w-[130px]">
                    {isPrint ? (
                      <div className="flex items-center justify-between px-1 w-full font-mono text-xs font-bold text-slate-950">
                        <span className="text-slate-500">Rp</span>
                        <span>{formatRupiah(b.hargaSatuan).replace("Rp", "").trim()}</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-1 w-full">
                        <div className="flex items-center gap-1 bg-white/50 px-1 rounded border border-slate-200 w-full max-w-[84px]">
                          <span className="text-[10px] font-bold text-slate-400">Rp</span>
                          <input
                            id={`fc-input-price-${porsi}-${idx}`}
                            type="text"
                            inputMode="numeric"
                            value={formatThousandSeparator(currentDayData[porsi === "besar" ? "porsiBesarBahan" : "porsiKecilBahan"][idx]?.hargaSatuan)}
                            onChange={(e) => handleRowChange(porsi, idx, "hargaSatuan", parseThousandSeparator(e.target.value))}
                            className="w-full text-right bg-transparent border-0 font-mono font-bold p-0 focus:ring-0 text-slate-950 text-xs"
                          />
                        </div>
                        <PriceCalculatorPopover
                          initialValue={currentDayData[porsi === "besar" ? "porsiBesarBahan" : "porsiKecilBahan"][idx]?.hargaSatuan || 0}
                          onApply={(val) => handleRowChange(porsi, idx, "hargaSatuan", val)}
                          placeholder="Hitung Harga Satuan"
                        />
                      </div>
                    )}
                  </td>
                  <td className="p-1 border border-black border-r-2 border-r-slate-950 text-center w-[136px] min-w-[136px]">
                    <div className="flex items-center justify-between px-1 w-full h-full">
                      <span className="text-slate-500 text-[10px] font-bold">Rp</span>
                      <div className="flex items-center gap-1 font-mono text-xs font-bold text-slate-950 whitespace-nowrap">
                        <span>{formatRupiah(b.hargaTotal).replace("Rp", "").trim()}</span>
                      </div>
                    </div>
                  </td>
                  {!isPrint && (
                    <td className="p-1 border border-black border-l-2 border-l-slate-950 text-center w-[44px] min-w-[44px] no-print">
                      <button
                        id={`fc-btn-del-${porsi}-${idx}`}
                        type="button"
                        onClick={() => removeIngredientRow(porsi, b.id, idx)}
                        className="p-0.5 text-slate-400 hover:text-rose-600 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
          
          <tfoot className="border border-black font-semibold text-slate-950 text-xs text-center">
            {/* ROW 1: KANDUNGAN GIZI + JUMLAH */}
            <tr className="border border-black">
              {/* Left Part: Kandungan Gizi (cols 1-10) */}
              <td colSpan={5} className="p-1.5 border border-black font-extrabold text-black uppercase bg-[#92D050] text-center">
                KANDUNGAN GIZI
              </td>
              <td className="p-1.5 border border-black text-center font-mono font-extrabold text-black w-[54px] min-w-[54px] bg-[#92D050]">
                {sumEnergi.toFixed(1)}
              </td>
              <td className="p-1.5 border border-black text-center font-mono font-extrabold text-black w-[56px] min-w-[56px] bg-[#92D050]">
                {sumProtein.toFixed(1)}
              </td>
              <td className="p-1.5 border border-black text-center font-mono font-extrabold text-black w-[56px] min-w-[56px] bg-[#92D050]">
                {sumLemak.toFixed(1)}
              </td>
              <td className="p-1.5 border border-black text-center font-mono font-extrabold text-black w-[56px] min-w-[56px] bg-[#92D050]">
                {sumKH.toFixed(1)}
              </td>
              <td className="p-1.5 border border-black text-center font-mono font-extrabold text-black w-[56px] min-w-[56px] bg-[#92D050]">
                {sumSerat.toFixed(1)}
              </td>

              {/* Right Part: JUMLAH (cols 11-22) */}
              <td colSpan={10} className="p-1.5 border border-black border-r-2 border-r-slate-950 text-right pr-4 uppercase text-slate-950 font-black bg-[#BFBFBF]">
                JUMLAH
              </td>
              <td className="p-1 border border-black border-l-2 border-l-slate-950 border-r-2 border-r-slate-950 bg-[#BFBFBF]">
                <div className="flex items-center justify-between px-1 w-full font-mono text-xs font-black text-slate-950">
                  <span className="text-slate-600 font-black">Rp</span>
                  <span className="font-black">{formatRupiah(totalBahanCost).replace("Rp", "").trim()}</span>
                </div>
              </td>
              {!isPrint && (
                <td className="p-1 border border-black border-l-2 border-l-slate-950 bg-[#BFBFBF] no-print"></td>
              )}
            </tr>

            {/* ROW 2: KEBUTUHAN RUJUKAN AKG + (BUMBU 10% OR HARGA PER PORSI) */}
            <tr className="border border-black">
              {/* Left Part: Rujukan AKG (cols 1-10) */}
              <td colSpan={5} className="p-1.5 border border-black font-extrabold text-black uppercase bg-[#92D050] text-center">
                <div className="flex items-center justify-center gap-1 flex-wrap">
                  <span>KEBUTUHAN RUJUKAN AKG PORSI {porsi === "besar" ? "BESAR" : "KECIL"}</span>
                  {!isPrint && (
                    <select
                      value={porsi === "besar" ? besarAkgMode : kecilAkgMode}
                      onChange={(e) => {
                        if (porsi === "besar") {
                          setBesarAkgMode(e.target.value);
                        } else {
                          setKecilAkgMode(e.target.value);
                        }
                      }}
                      className="bg-white/90 hover:bg-white text-slate-800 text-[10px] font-black rounded px-1.5 py-0.5 border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 uppercase cursor-pointer"
                    >
                      <option value="min">Rujukan MIN</option>
                      <option value="max">Rujukan MAX</option>
                      <option value="avg">Rata-rata</option>
                      <option value="custom">Kustom ✍️</option>
                    </select>
                  )}
                </div>
              </td>
              
              {/* ENERGI */}
              <td className="p-1 border border-black text-center font-mono font-bold text-black w-[54px] min-w-[54px] bg-[#92D050]">
                {isPrint ? (
                  <span>{targetEnergi > 0 ? targetEnergi.toFixed(1) : "-"}</span>
                ) : (
                  <input
                    type="number"
                    step="any"
                    value={targetEnergi > 0 ? Number(targetEnergi.toFixed(1)) : ""}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      handleAkgValChange(porsi, "energi", val, porsi === "besar" ? besarAkgMode : kecilAkgMode);
                    }}
                    className="w-full text-center bg-white/40 focus:bg-white border-0 focus:ring-1 focus:ring-indigo-500 font-mono font-bold px-0 py-0.5 rounded text-black text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                )}
              </td>

              {/* PROTEIN */}
              <td className="p-1 border border-black text-center font-mono font-bold text-black w-[56px] min-w-[56px] bg-[#92D050]">
                {isPrint ? (
                  <span>{targetProtein > 0 ? targetProtein.toFixed(1) : "-"}</span>
                ) : (
                  <input
                    type="number"
                    step="any"
                    value={targetProtein > 0 ? Number(targetProtein.toFixed(1)) : ""}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      handleAkgValChange(porsi, "protein", val, porsi === "besar" ? besarAkgMode : kecilAkgMode);
                    }}
                    className="w-full text-center bg-white/40 focus:bg-white border-0 focus:ring-1 focus:ring-indigo-500 font-mono font-bold px-0 py-0.5 rounded text-black text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                )}
              </td>

              {/* LEMAK */}
              <td className="p-1 border border-black text-center font-mono font-bold text-black w-[56px] min-w-[56px] bg-[#92D050]">
                {isPrint ? (
                  <span>{targetLemak > 0 ? targetLemak.toFixed(1) : "-"}</span>
                ) : (
                  <input
                    type="number"
                    step="any"
                    value={targetLemak > 0 ? Number(targetLemak.toFixed(1)) : ""}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      handleAkgValChange(porsi, "lemak", val, porsi === "besar" ? besarAkgMode : kecilAkgMode);
                    }}
                    className="w-full text-center bg-white/40 focus:bg-white border-0 focus:ring-1 focus:ring-indigo-500 font-mono font-bold px-0 py-0.5 rounded text-black text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                )}
              </td>

              {/* KH */}
              <td className="p-1 border border-black text-center font-mono font-bold text-black w-[56px] min-w-[56px] bg-[#92D050]">
                {isPrint ? (
                  <span>{targetKH > 0 ? targetKH.toFixed(1) : "-"}</span>
                ) : (
                  <input
                    type="number"
                    step="any"
                    value={targetKH > 0 ? Number(targetKH.toFixed(1)) : ""}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      handleAkgValChange(porsi, "kh", val, porsi === "besar" ? besarAkgMode : kecilAkgMode);
                    }}
                    className="w-full text-center bg-white/40 focus:bg-white border-0 focus:ring-1 focus:ring-indigo-500 font-mono font-bold px-0 py-0.5 rounded text-black text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                )}
              </td>

              {/* SERAT */}
              <td className="p-1 border border-black text-center font-mono font-bold text-black w-[56px] min-w-[56px] bg-[#92D050]">
                {isPrint ? (
                  <span>{targetSerat > 0 ? targetSerat.toFixed(1) : "-"}</span>
                ) : (
                  <input
                    type="number"
                    step="any"
                    value={targetSerat > 0 ? Number(targetSerat.toFixed(1)) : ""}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      handleAkgValChange(porsi, "serat", val, porsi === "besar" ? besarAkgMode : kecilAkgMode);
                    }}
                    className="w-full text-center bg-white/40 focus:bg-white border-0 focus:ring-1 focus:ring-indigo-500 font-mono font-bold px-0 py-0.5 rounded text-black text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                )}
              </td>

              {planningMode === "all_ingredients" ? (
                <>
                  {/* Right Part: HARGA PER PORSI (cols 11-22) */}
                  <td colSpan={10} className="p-1.5 border border-black border-r-2 border-r-slate-950 text-right pr-4 uppercase text-slate-950 font-black bg-[#A9D08E]">
                    HARGA PER PORSI
                  </td>
                  <td className={`p-1 border border-black border-l-2 border-l-slate-950 border-r-2 border-r-slate-950 ${calculatedCostPerPorsi > targetPrice ? "bg-[#FF0000]" : "bg-[#00B050]"}`}>
                    <div className="flex items-center justify-between px-1 w-full font-mono text-xs font-black text-white">
                      <span className="text-white/90 font-black">Rp</span>
                      <span className="font-black text-white">{formatRupiah(calculatedCostPerPorsi).replace("Rp", "").trim()}</span>
                    </div>
                  </td>
                  {!isPrint && (
                    <td className={`p-1 border border-black border-l-2 border-l-slate-950 no-print ${calculatedCostPerPorsi > targetPrice ? "bg-[#FF0000]" : "bg-[#00B050]"}`}></td>
                  )}
                </>
              ) : (
                <>
                  {/* Right Part: BUMBU 10% (cols 11-22) */}
                  <td colSpan={10} className="p-1.5 border border-black border-r-2 border-r-slate-950 text-right pr-4 uppercase text-slate-950 font-black bg-[#FFFF00]">
                    BUMBU 10%
                  </td>
                  <td className="p-1 border border-black border-l-2 border-l-slate-950 border-r-2 border-r-slate-950 bg-[#FFFF00]">
                    <div className="flex items-center justify-between px-1 w-full font-mono text-xs font-black text-slate-950">
                      <span className="text-slate-600 font-black">Rp</span>
                      <span className="font-black">{formatRupiah(bumbuCost).replace("Rp", "").trim()}</span>
                    </div>
                  </td>
                  {!isPrint && (
                    <td className="p-1 border border-black border-l-2 border-l-slate-950 bg-[#FFFF00] no-print"></td>
                  )}
                </>
              )}
            </tr>

            {/* ROW 3: KEBUTUHAN 90-110% + (JUMLAH+BUMBU 10% OR BLANK) */}
            <tr className="border border-black">
              {/* Left Part: Kebutuhan 90-110% (cols 1-10) */}
              <td colSpan={5} className="p-1.5 border border-black font-extrabold text-black uppercase bg-[#92D050] text-center">
                KEBUTUHAN 90-110%
              </td>
              
              {[
                { val: pctEnergi, active: targetEnergi > 0 },
                { val: pctProtein, active: targetProtein > 0 },
                { val: pctLemak, active: targetLemak > 0 },
                { val: pctKH, active: targetKH > 0 },
                { val: pctSerat, active: targetSerat > 0 },
              ].map((pctInfo, idx) => {
                const isOk = pctInfo.active && pctInfo.val >= 90 && pctInfo.val <= 110;
                const cellBg = pctInfo.active ? (isOk ? '#00B050' : '#FF0000') : '#FF0000';
                const cellText = 'black';
                return (
                  <td 
                    key={idx} 
                    className="p-1.5 border border-black text-center font-mono font-black text-black" 
                    style={{ backgroundColor: cellBg, color: cellText }}
                  >
                    {pctInfo.active ? `${pctInfo.val.toFixed(0)}%` : ""}
                  </td>
                );
              })}

              {planningMode === "all_ingredients" ? (
                <>
                  <td colSpan={10} className="p-1.5 border border-black bg-slate-50/10"></td>
                  <td className="p-1 border border-black bg-slate-50/10"></td>
                  {!isPrint && (
                    <td className="p-1 border border-black bg-slate-50/10 no-print"></td>
                  )}
                </>
              ) : (
                <>
                  {/* Right Part: JUMLAH+BUMBU 10% (cols 11-22) */}
                  <td colSpan={10} className="p-1.5 border border-black border-r-2 border-r-slate-950 text-right pr-4 uppercase text-slate-950 font-black bg-[#F8CBAD]">
                    JUMLAH+BUMBU 10%
                  </td>
                  <td className="p-1 border border-black border-l-2 border-l-slate-950 border-r-2 border-r-slate-950 bg-[#F8CBAD]">
                    <div className="flex items-center justify-between px-1 w-full font-mono text-xs font-black text-slate-950">
                      <span className="text-slate-600 font-black">Rp</span>
                      <span className="font-black">{formatRupiah(subtotalCost).replace("Rp", "").trim()}</span>
                    </div>
                  </td>
                  {!isPrint && (
                    <td className="p-1 border border-black border-l-2 border-l-slate-950 bg-[#F8CBAD] no-print"></td>
                  )}
                </>
              )}
            </tr>

            {/* ROW 4: HARGA PER PORSI */}
            {planningMode === "with_bumbu_10" && (
              <tr className="border border-black font-extrabold text-black">
                {/* Left Part: Empty (cols 1-10) */}
                <td colSpan={10} className="p-1.5 border border-black bg-slate-50/30"></td>

                {/* Right Part: HARGA PER PORSI (cols 11-22) */}
                <td colSpan={10} className="p-1.5 border border-black border-r-2 border-r-slate-950 text-right pr-4 uppercase text-slate-950 font-black bg-[#A9D08E]">
                  HARGA PER PORSI
                </td>
                <td className={`p-1 border border-black border-l-2 border-l-slate-950 border-r-2 border-r-slate-950 ${calculatedCostPerPorsi > targetPrice ? "bg-[#FF0000]" : "bg-[#00B050]"}`}>
                  <div className="flex items-center justify-between px-1 w-full font-mono text-xs font-black text-white">
                    <span className="text-white/90 font-black">Rp</span>
                    <span className="font-black text-white">{formatRupiah(calculatedCostPerPorsi).replace("Rp", "").trim()}</span>
                  </div>
                </td>
                {!isPrint && (
                  <td className={`p-1 border border-black border-l-2 border-l-slate-950 no-print ${calculatedCostPerPorsi > targetPrice ? "bg-[#FF0000]" : "bg-[#00B050]"}`}></td>
                )}
              </tr>
            )}
          </tfoot>
        </table>
      </div>
    );
  };

  const renderCustomFoodCostTable = (table: any, isPrint: boolean) => {
    const results = table.porsi === "besar"
      ? calculateDay(table.bahanList, [], table.pmCount, 0, table.bufferPct || 5, tkpiList)
      : calculateDay([], table.bahanList, 0, table.pmCount, table.bufferPct || 5, tkpiList);

    const items = table.porsi === "besar" ? results.porsiBesarItems : results.porsiKecilItems;
    const totalBahanCost = table.porsi === "besar" ? results.totalBesarBahanCost : results.totalKecilBahanCost;
    const bufferCost = table.porsi === "besar" ? results.bufferBesarCost : results.bufferKecilCost;
    const bumbuCost = table.porsi === "besar" ? results.bumbuBesarCost : results.bumbuKecilCost;
    const subtotalCost = table.porsi === "besar" ? results.subtotalBesarCost : results.subtotalKecilCost;
    const costPerPorsi = table.porsi === "besar" ? results.costPerPorsiBesar : results.costPerPorsiKecil;
    const recipientCount = table.pmCount;
    const targetPrice = table.plafon;

    const calculatedCostPerPorsi = planningMode === "all_ingredients"
      ? (recipientCount > 0 ? totalBahanCost / recipientCount : 0)
      : costPerPorsi;

    const akgType = table.akgType || (table.porsi === "besar" ? "sd_besar" : "sd_kecil");
    const akgMode = table.akgMode || "avg";

    const getCustomTableAkgTarget = (key: string): number => {
      if (akgType === "custom" || akgMode === "custom") {
        const customMap = table.porsi === "besar" ? customBesar : customKecil;
        return customMap[key] || 0;
      }
      const config = TARGET_AKG_LIMITS[akgType];
      if (!config) return 0;

      const minVal = key === "energi" ? config.energiMin : (config as any)[`${key}Min`] || 0;
      const ratio = config.energiMax / config.energiMin;

      if (akgMode === "min") {
        return minVal;
      }
      if (akgMode === "max") {
        if (key === "energi") return config.energiMax;
        return Math.round(minVal * ratio * 10) / 10;
      }
      // "avg" mode
      if (key === "energi") {
        return (config.energiMin + config.energiMax) / 2;
      }
      const maxVal = minVal * ratio;
      return Math.round(((minVal + maxVal) / 2) * 10) / 10;
    };

    const sumEnergi = items.reduce((acc, b) => acc + b.energi, 0);
    const sumProtein = items.reduce((acc, b) => acc + b.protein, 0);
    const sumLemak = items.reduce((acc, b) => acc + b.lemak, 0);
    const sumKH = items.reduce((acc, b) => acc + b.kh, 0);
    const sumSerat = items.reduce((acc, b) => acc + b.serat, 0);

    const targetEnergi = getCustomTableAkgTarget("energi");
    const targetProtein = getCustomTableAkgTarget("protein");
    const targetLemak = getCustomTableAkgTarget("lemak");
    const targetKH = getCustomTableAkgTarget("kh");
    const targetSerat = getCustomTableAkgTarget("serat");

    const pctEnergi = targetEnergi > 0 ? (sumEnergi / targetEnergi) * 100 : 0;
    const pctProtein = targetProtein > 0 ? (sumProtein / targetProtein) * 100 : 0;
    const pctLemak = targetLemak > 0 ? (sumLemak / targetLemak) * 100 : 0;
    const pctKH = targetKH > 0 ? (sumKH / targetKH) * 100 : 0;
    const pctSerat = targetSerat > 0 ? (sumSerat / targetSerat) * 100 : 0;

    const tableKriteria = table.kriteriaPm || (table.porsi === "besar" ? "Kriteria PM Besar" : "Kriteria PM Kecil");

    if (items.length === 0) {
      if (isPrint) {
        return (
          <div className="p-4 border border-black rounded-lg text-center text-xs font-bold text-slate-500 italic uppercase bg-slate-50">
            Tidak ada komponen bahan baku untuk porsi {table.porsi} di tabel kustom ini.
          </div>
        );
      }
      return (
        <div className="flex flex-col items-center justify-center p-8 bg-slate-50 border border-dashed border-slate-300 rounded-2xl space-y-3 text-center my-2">
          <div className="p-3 bg-rose-50 text-rose-500 rounded-full animate-pulse">
            <Trash2 className="w-6 h-6" />
          </div>
          <div>
            <h5 className="text-xs font-black text-slate-700 uppercase tracking-wide">
              Komponen Bahan Baku Kosong
            </h5>
            <p className="text-[11px] text-slate-500 mt-1 max-w-sm">
              Seluruh bahan baku telah dihapus. Silakan klik tombol <strong className="text-indigo-600 font-extrabold">+ Tambah Bahan Baku</strong> di atas untuk menginput ulang.
            </p>
          </div>
        </div>
      );
    }

    const customBufferPct = table.bufferPct || 5;

    return (
      <div className="overflow-x-auto border border-black rounded-lg shadow-xs">
        <table className="w-full border-collapse border border-black font-sans text-xs text-center" style={{ fontSize: '12px' }}>
          <thead className="bg-[#92D050] text-black font-bold uppercase border border-black text-center">
            <tr>
              <th rowSpan={2} className="p-1 border border-black text-center text-slate-950 font-extrabold w-[110px] min-w-[110px]">KRITERIA PM</th>
              <th rowSpan={2} className="p-1 border border-black text-center text-slate-950 font-extrabold w-[110px] min-w-[110px]">MENU</th>
              <th rowSpan={2} className="p-1 border border-black text-center text-slate-950 font-extrabold w-[160px] min-w-[160px]">BAHAN MAKANAN</th>
              <th rowSpan={2} className="p-1 border border-black text-center text-slate-950 font-extrabold w-[56px] min-w-[56px]">BERAT (BB)</th>
              <th rowSpan={2} className="p-1 border border-black text-center text-slate-950 font-extrabold w-[56px] min-w-[56px]">URT</th>
              <th colSpan={5} className="p-1 border border-black text-center text-slate-950 font-extrabold bg-[#76933C] text-white">KOMPOSISI ZAT GIZI MAKANAN</th>
              <th rowSpan={2} className="p-1 border border-black text-center text-slate-950 font-extrabold w-[56px] min-w-[56px]">BDD (%)</th>
              <th rowSpan={2} className="p-1 border border-black text-center text-slate-950 font-extrabold w-[64px] min-w-[64px]">BK (g)</th>
              <th rowSpan={2} className="p-1 border border-black text-center text-slate-950 font-extrabold w-[64px] min-w-[64px]">Jumlah Manfaat</th>
              <th rowSpan={2} className="p-1 border border-black text-center text-slate-950 font-extrabold w-[72px] min-w-[72px]">Gram (g)</th>
              <th rowSpan={2} className="p-1 border border-black text-center text-slate-950 font-extrabold w-[72px] min-w-[72px]">Kg (kg)</th>
              <th rowSpan={2} className="p-1 border border-black text-center text-slate-950 font-extrabold w-[48px] min-w-[48px] bg-[#92D050]">
                {isPrint ? (
                  headerPotong
                ) : (
                  <input
                    type="text"
                    value={headerPotong}
                    onChange={(e) => {
                      setHeaderPotong(e.target.value);
                      localStorage.setItem("fc_header_potong", e.target.value);
                    }}
                    className="w-full text-center bg-[#92D050] border-0 hover:bg-[#86c145] focus:bg-white font-extrabold p-0.5 rounded text-slate-950 uppercase text-[11px] focus:ring-1 focus:ring-slate-600"
                    title="Ubah judul kolom Potong"
                  />
                )}
              </th>
              <th rowSpan={2} className="p-1 border border-black text-center text-slate-950 font-extrabold w-[48px] min-w-[48px] bg-[#92D050]">
                {isPrint ? (
                  headerEkor
                ) : (
                  <input
                    type="text"
                    value={headerEkor}
                    onChange={(e) => {
                      setHeaderEkor(e.target.value);
                      localStorage.setItem("fc_header_ekor", e.target.value);
                    }}
                    className="w-full text-center bg-[#92D050] border-0 hover:bg-[#86c145] focus:bg-white font-extrabold p-0.5 rounded text-slate-950 uppercase text-[11px] focus:ring-1 focus:ring-slate-600"
                    title="Ubah judul kolom Ekor"
                  />
                )}
              </th>
              <th rowSpan={2} className="p-1 border border-black text-center text-slate-950 font-extrabold w-[115px] min-w-[115px] bg-[#92D050] text-[10px] leading-tight select-none">
                Buffer ({customBufferPct}%)
              </th>
              <th rowSpan={2} className="p-1 border border-black text-center text-slate-950 font-extrabold w-[155px] min-w-[155px] bg-[#92D050] text-[10px] leading-tight select-none">
                Jumlah+Buffer
              </th>
              <th rowSpan={2} className="p-1 border border-black text-center text-slate-950 font-extrabold w-[130px] min-w-[130px]">Harga Satuan</th>
              <th rowSpan={2} className="p-1 border border-black border-r-2 border-r-slate-950 text-center text-slate-950 font-extrabold w-[136px] min-w-[136px]">Harga Total</th>
              {!isPrint && <th rowSpan={2} className="p-1 border border-black border-l-2 border-l-slate-950 text-center text-rose-800 w-[44px] min-w-[44px] no-print">Aksi</th>}
            </tr>
            <tr>
              <th className="p-1 border border-black text-center w-[54px] min-w-[54px] bg-[#D8E4BC] text-slate-950 font-bold">ENERGI (Kal)</th>
              <th className="p-1 border border-black text-center w-[56px] min-w-[56px] bg-[#D8E4BC] text-slate-950 font-bold">Protein (g)</th>
              <th className="p-1 border border-black text-center w-[56px] min-w-[56px] bg-[#D8E4BC] text-slate-950 font-bold">LEMAK (g)</th>
              <th className="p-1 border border-black text-center w-[56px] min-w-[56px] bg-[#D8E4BC] text-slate-950 font-bold">KH (g)</th>
              <th className="p-1 border border-black text-center w-[56px] min-w-[56px] bg-[#D8E4BC] text-slate-950 font-bold">SERAT (g)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black text-[11px] text-slate-900 bg-white">
            {items.length === 0 ? (
              <tr>
                <td colSpan={isPrint ? 21 : 22} className="p-6 text-center text-slate-400 italic bg-slate-50 border border-black">
                  Belum ada bahan makanan yang diinput untuk tabel ini.
                </td>
              </tr>
            ) : (
              items.map((b, idx) => (
                <tr key={b.id} className="hover:bg-slate-50/50">
                  {idx === 0 && (
                    <td rowSpan={items.length} className="p-1 border border-black text-center font-extrabold bg-[#E2EFDA] align-middle text-[10px] uppercase leading-tight w-[110px] min-w-[110px]">
                      {isPrint ? (
                        <span className="block p-1 text-[10px] font-extrabold text-slate-950 uppercase">{tableKriteria}</span>
                      ) : (
                        <textarea
                          value={tableKriteria}
                          onChange={(e) => editCustomTableMeta(table.id, "kriteriaPm", e.target.value)}
                          className="w-full text-center bg-transparent border-0 font-extrabold text-[10px] uppercase focus:ring-1 focus:ring-indigo-500 p-1 resize-none overflow-hidden"
                          rows={3}
                          placeholder="Edit Kriteria PM..."
                        />
                      )}
                    </td>
                  )}
                  {idx === 0 && (
                    <td rowSpan={items.length} className="p-1 border border-black text-center font-bold bg-[#F2F2F2] align-middle text-[10px] w-[110px] min-w-[110px] break-words text-slate-950">
                      {namaMenuHariIni || "-"}
                    </td>
                  )}
                  <td className="p-1 border border-black font-semibold w-[160px] min-w-[160px] text-center">
                    {isPrint ? (
                      <span className="p-0.5 block text-xs font-bold text-slate-950 text-center">{b.nama}</span>
                    ) : (
                      <SearchableTkpiDropdown
                        id={`fc-custom-select-tkpi-${table.id}-${idx}`}
                        tkpiList={tkpiList}
                        selectedValue={table.bahanList[idx]?.tkpiId || ""}
                        onChange={(tkpiId) => editIngredientInCustomTable(table.id, idx, "tkpiId", tkpiId)}
                        minimal
                      />
                    )}
                  </td>
                  <td className="p-1 border border-black text-center w-[56px] min-w-[56px]">
                    {isPrint ? (
                      <span className="font-mono font-bold text-slate-950 text-xs text-center">{b.beratBB}</span>
                    ) : (
                      <input
                        type="number"
                        value={table.bahanList[idx]?.beratBB || ""}
                        onChange={(e) => editIngredientInCustomTable(table.id, idx, "beratBB", Number(e.target.value))}
                        className="w-full text-center bg-transparent border-0 font-mono font-bold p-0 text-slate-950 text-xs"
                      />
                    )}
                  </td>
                  <td className="p-1 border border-black text-center w-[56px] min-w-[56px]">
                    {isPrint ? (
                      <span className="text-slate-950 text-xs text-center">{b.urt}</span>
                    ) : (
                      <input
                        type="text"
                        value={table.bahanList[idx]?.urt || ""}
                        onChange={(e) => editIngredientInCustomTable(table.id, idx, "urt", e.target.value)}
                        className="w-full text-center bg-transparent border-0 p-0 text-slate-950 text-xs text-center"
                      />
                    )}
                  </td>
                  <td className="p-1 border border-black text-center font-mono text-slate-950 font-semibold bg-slate-50/30 w-[54px] min-w-[54px] text-xs">{b.energi.toFixed(1)}</td>
                  <td className="p-1 border border-black text-center font-mono text-slate-950 font-semibold bg-slate-50/30 w-[56px] min-w-[56px] text-xs">{b.protein.toFixed(1)}</td>
                  <td className="p-1 border border-black text-center font-mono text-slate-950 font-semibold bg-slate-50/30 w-[56px] min-w-[56px] text-xs">{b.lemak.toFixed(1)}</td>
                  <td className="p-1 border border-black text-center font-mono text-slate-950 font-semibold bg-slate-50/30 w-[56px] min-w-[56px] text-xs">{b.kh.toFixed(1)}</td>
                  <td className="p-1 border border-black text-center font-mono text-slate-950 font-semibold bg-slate-50/30 w-[56px] min-w-[56px] text-xs">{b.serat.toFixed(1)}</td>
                  
                  <td className="p-1 border border-black text-center w-[56px] min-w-[56px]">
                    {isPrint ? (
                      <span className="font-mono font-bold text-slate-950 text-xs">{b.bdd}%</span>
                    ) : (
                      <EditableBddCell
                        value={b.bdd}
                        isCustom={table.bahanList[idx]?.bdd !== undefined}
                        onChange={(newVal) => editIngredientInCustomTable(table.id, idx, "bdd", newVal)}
                      />
                    )}
                  </td>
                  <td className="p-1 border border-black text-center font-mono text-indigo-955 font-bold bg-[#E6F0FA]/20 w-[64px] min-w-[64px] text-slate-950 text-xs">{b.beratKotor.toFixed(1)}</td>
                  
                  {idx === 0 && (
                    <td rowSpan={items.length} className="p-1 border border-black text-center font-extrabold bg-[#FFF2CC] align-middle font-mono w-[64px] min-w-[64px] text-slate-950 text-xs">
                      {recipientCount}
                    </td>
                  )}
                  
                  <td className="p-1 border border-black text-center font-mono text-slate-950 w-[72px] min-w-[72px] font-semibold text-xs">{b.totalKebutuhanGram.toFixed(1)}</td>
                  <td className="p-1 border border-black text-center font-mono font-bold text-slate-950 w-[72px] min-w-[72px] text-xs">{b.totalKebutuhanKg.toFixed(3)}</td>
                  
                  <td className="p-1 border border-black text-center w-[48px] min-w-[48px]">
                    {isPrint ? (
                      <span className="font-mono text-slate-950">{b.potong || "-"}</span>
                    ) : (
                      <div className="relative group/calc flex items-center justify-center h-full w-full">
                        <input
                          type="text"
                          value={b.potong ?? ""}
                          onChange={(e) => editIngredientInCustomTable(table.id, idx, "potong", e.target.value)}
                          className="w-full text-center bg-transparent border-0 font-mono p-0 text-slate-950 text-xs focus:ring-1 focus:ring-rose-500 rounded"
                        />
                        <button
                          type="button"
                          onClick={() => openCalculator(table.id, idx, "potong", String(b.potong ?? ""))}
                          className="absolute right-0.5 top-1/2 -translate-y-1/2 opacity-0 group-hover/calc:opacity-100 focus:opacity-100 bg-white hover:bg-slate-100 border border-slate-200 shadow-xs px-0.5 rounded text-[10px] text-slate-500 z-10 transition-opacity"
                          title="Buka Kalkulator"
                        >
                          🧮
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="p-1 border border-black text-center w-[48px] min-w-[48px]">
                    {isPrint ? (
                      <span className="font-mono text-slate-950">{b.ekor || "-"}</span>
                    ) : (
                      <div className="relative group/calc flex items-center justify-center h-full w-full">
                        <input
                          type="text"
                          value={b.ekor ?? ""}
                          onChange={(e) => editIngredientInCustomTable(table.id, idx, "ekor", e.target.value)}
                          className="w-full text-center bg-transparent border-0 font-mono p-0 text-slate-950 text-xs focus:ring-1 focus:ring-rose-500 rounded"
                        />
                        <button
                          type="button"
                          onClick={() => openCalculator(table.id, idx, "ekor", String(b.ekor ?? ""))}
                          className="absolute right-0.5 top-1/2 -translate-y-1/2 opacity-0 group-hover/calc:opacity-100 focus:opacity-100 bg-white hover:bg-slate-100 border border-slate-200 shadow-xs px-0.5 rounded text-[10px] text-slate-500 z-10 transition-opacity"
                          title="Buka Kalkulator"
                        >
                          🧮
                        </button>
                      </div>
                    )}
                  </td>
                  <td
                    onClick={() => !isPrint && openBufferConfig(table.id, idx, b)}
                    className={`p-1 border border-black text-center w-[115px] min-w-[115px] bg-slate-50/50 ${!isPrint ? "cursor-pointer hover:bg-indigo-50/70 transition-all group/buffer" : ""}`}
                    title={!isPrint ? "Klik untuk memilih basis Buffer (Kg, Potong, Ekor)" : undefined}
                  >
                    <div className="flex flex-col items-center justify-center h-full min-h-[36px]">
                      <span className="font-mono text-slate-950 text-xs font-semibold">
                        {typeof b.buah === "number" && b.buah >= 0 ? b.buah.toFixed(3) : "-"}
                      </span>
                      {!isPrint && (
                        <span className="text-[8px] text-indigo-600 font-extrabold uppercase tracking-wider block leading-none mt-0.5 opacity-70 group-hover/buffer:opacity-100 transition-opacity">
                          {b.bufferBase === "kg" ? "KG" : b.bufferBase === "potong" ? "Ptg" : b.bufferBase === "ekor" ? "Ekr" : b.bufferBase === "custom" ? "Cust" : "Auto"} ⚙️
                        </span>
                      )}
                    </div>
                  </td>
                  <td
                    onClick={() => !isPrint && openBufferConfig(table.id, idx, b)}
                    className={`p-1 border border-black text-center w-[155px] min-w-[155px] bg-[#E6F0FA]/30 ${!isPrint ? "cursor-pointer hover:bg-indigo-50/70 transition-all group/jumlah" : ""}`}
                    title={!isPrint ? "Klik untuk mengatur rumus Jumlah + Buffer" : undefined}
                  >
                    <div className="flex flex-col items-center justify-center h-full min-h-[36px]">
                      <span className="font-mono text-slate-950 text-xs font-bold text-indigo-950">
                        {typeof b.butir === "number" && b.butir >= 0 ? b.butir.toFixed(3) : "-"}
                      </span>
                      {!isPrint && (
                        <span className="text-[8px] text-indigo-700 font-extrabold uppercase tracking-wider block leading-none mt-0.5 opacity-70 group-hover/jumlah:opacity-100 transition-opacity">
                          {(() => {
                            const val = b.jumlahBufferChoice || "auto";
                            if (val === "auto") return "Auto";
                            if (val === "kg_with") return "KG + Buf";
                            if (val === "kg_without") return "KG Saja";
                            if (val === "potong_with") return "Ptg + Buf";
                            if (val === "potong_without") return "Ptg Saja";
                            if (val === "ekor_with") return "Ekr + Buf";
                            if (val === "ekor_without") return "Ekr Saja";
                            if (val === "custom_with") return "Cust + Buf";
                            if (val === "custom_without") return "Cust Saja";
                            return val;
                          })()} ⚙️
                        </span>
                      )}
                    </div>
                  </td>
                  
                  <td className="p-1 border border-black text-center w-[130px] min-w-[130px]">
                    {isPrint ? (
                      <div className="flex items-center justify-between px-1 w-full font-mono text-xs font-bold text-slate-950">
                        <span className="text-slate-500">Rp</span>
                        <span>{formatRupiah(b.hargaSatuan).replace("Rp", "").trim()}</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-1 w-full">
                        <div className="flex items-center gap-1 bg-white/50 px-1 rounded border border-slate-200 w-full max-w-[84px]">
                          <span className="text-[10px] font-bold text-slate-400">Rp</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={formatThousandSeparator(b.hargaSatuan)}
                            onChange={(e) => editIngredientInCustomTable(table.id, idx, "hargaSatuan", parseThousandSeparator(e.target.value))}
                            className="w-full text-right bg-transparent border-0 font-mono font-bold p-0 focus:ring-0 text-slate-950 text-xs"
                          />
                        </div>
                        <PriceCalculatorPopover
                          initialValue={b.hargaSatuan || 0}
                          onApply={(val) => editIngredientInCustomTable(table.id, idx, "hargaSatuan", val)}
                          placeholder="Hitung Harga Satuan"
                        />
                      </div>
                    )}
                  </td>
                  <td className="p-1 border border-black border-r-2 border-r-slate-950 text-center w-[136px] min-w-[136px]">
                    <div className="flex items-center justify-between px-1 w-full h-full">
                      <span className="text-slate-500 text-[10px] font-bold">Rp</span>
                      <div className="flex items-center gap-1 font-mono text-xs font-bold text-slate-950 whitespace-nowrap">
                        <span>{formatRupiah(b.hargaTotal).replace("Rp", "").trim()}</span>
                      </div>
                    </div>
                  </td>
                  {!isPrint && (
                    <td className="p-1 border border-black border-l-2 border-l-slate-950 text-center w-[44px] min-w-[44px] no-print">
                      <button
                        type="button"
                        onClick={() => removeIngredientFromCustomTable(table.id, b.id, idx)}
                        className="p-0.5 text-slate-400 hover:text-rose-600 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
          
          <tfoot className="border border-black font-semibold text-slate-950 text-xs text-center">
            {/* ROW 1: KANDUNGAN GIZI + JUMLAH */}
            <tr className="border border-black">
              {/* Left Part: Kandungan Gizi (cols 1-10) */}
              <td colSpan={5} className="p-1.5 border border-black font-extrabold text-black uppercase bg-[#92D050] text-center">
                KANDUNGAN GIZI
              </td>
              <td className="p-1.5 border border-black text-center font-mono font-extrabold text-black w-[54px] min-w-[54px] bg-[#92D050]">
                {sumEnergi.toFixed(1)}
              </td>
              <td className="p-1.5 border border-black text-center font-mono font-extrabold text-black w-[56px] min-w-[56px] bg-[#92D050]">
                {sumProtein.toFixed(1)}
              </td>
              <td className="p-1.5 border border-black text-center font-mono font-extrabold text-black w-[56px] min-w-[56px] bg-[#92D050]">
                {sumLemak.toFixed(1)}
              </td>
              <td className="p-1.5 border border-black text-center font-mono font-extrabold text-black w-[56px] min-w-[56px] bg-[#92D050]">
                {sumKH.toFixed(1)}
              </td>
              <td className="p-1.5 border border-black text-center font-mono font-extrabold text-black w-[56px] min-w-[56px] bg-[#92D050]">
                {sumSerat.toFixed(1)}
              </td>

              {/* Right Part: JUMLAH (cols 11-22) */}
              <td colSpan={10} className="p-1.5 border border-black border-r-2 border-r-slate-950 text-right pr-4 uppercase text-slate-950 font-black bg-[#BFBFBF]">
                JUMLAH
              </td>
              <td className="p-1 border border-black border-l-2 border-l-slate-950 border-r-2 border-r-slate-950 bg-[#BFBFBF]">
                <div className="flex items-center justify-between px-1 w-full font-mono text-xs font-black text-slate-950">
                  <span className="text-slate-600 font-black">Rp</span>
                  <span className="font-black">{formatRupiah(totalBahanCost).replace("Rp", "").trim()}</span>
                </div>
              </td>
              {!isPrint && (
                <td className="p-1 border border-black border-l-2 border-l-slate-950 bg-[#BFBFBF] no-print"></td>
              )}
            </tr>

            {/* ROW 2: KEBUTUHAN RUJUKAN AKG + (BUMBU 10% OR HARGA PER PORSI) */}
            <tr className="border border-black">
              {/* Left Part: Rujukan AKG (cols 1-10) */}
              <td colSpan={5} className="p-1.5 border border-black font-extrabold text-black uppercase bg-[#92D050] text-center">
                <div className="flex items-center justify-center gap-1 flex-wrap">
                  <span>KEBUTUHAN RUJUKAN AKG PORSI {table.porsi === "besar" ? "BESAR" : "KECIL"}</span>
                  {!isPrint && (
                    <select
                      value={akgMode}
                      onChange={(e) => editCustomTableMeta(table.id, "akgMode", e.target.value)}
                      className="bg-white/90 hover:bg-white text-slate-800 text-[10px] font-black rounded px-1.5 py-0.5 border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 uppercase cursor-pointer"
                    >
                      <option value="min">Rujukan MIN</option>
                      <option value="max">Rujukan MAX</option>
                      <option value="avg">Rata-rata</option>
                      <option value="custom">Kustom ✍️</option>
                    </select>
                  )}
                </div>
              </td>
              
              {/* ENERGI */}
              <td className="p-1 border border-black text-center font-mono font-bold text-black w-[54px] min-w-[54px] bg-[#92D050]">
                {isPrint ? (
                  <span>{targetEnergi > 0 ? targetEnergi.toFixed(1) : "-"}</span>
                ) : (
                  <input
                    type="number"
                    step="any"
                    value={targetEnergi > 0 ? Number(targetEnergi.toFixed(1)) : ""}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      handleAkgValChange(table.porsi, "energi", val, akgMode, table.akgType, table.id);
                    }}
                    className="w-full text-center bg-white/40 focus:bg-white border-0 focus:ring-1 focus:ring-indigo-500 font-mono font-bold px-0 py-0.5 rounded text-black text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                )}
              </td>

              {/* PROTEIN */}
              <td className="p-1 border border-black text-center font-mono font-bold text-black w-[56px] min-w-[56px] bg-[#92D050]">
                {isPrint ? (
                  <span>{targetProtein > 0 ? targetProtein.toFixed(1) : "-"}</span>
                ) : (
                  <input
                    type="number"
                    step="any"
                    value={targetProtein > 0 ? Number(targetProtein.toFixed(1)) : ""}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      handleAkgValChange(table.porsi, "protein", val, akgMode, table.akgType, table.id);
                    }}
                    className="w-full text-center bg-white/40 focus:bg-white border-0 focus:ring-1 focus:ring-indigo-500 font-mono font-bold px-0 py-0.5 rounded text-black text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                )}
              </td>

              {/* LEMAK */}
              <td className="p-1 border border-black text-center font-mono font-bold text-black w-[56px] min-w-[56px] bg-[#92D050]">
                {isPrint ? (
                  <span>{targetLemak > 0 ? targetLemak.toFixed(1) : "-"}</span>
                ) : (
                  <input
                    type="number"
                    step="any"
                    value={targetLemak > 0 ? Number(targetLemak.toFixed(1)) : ""}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      handleAkgValChange(table.porsi, "lemak", val, akgMode, table.akgType, table.id);
                    }}
                    className="w-full text-center bg-white/40 focus:bg-white border-0 focus:ring-1 focus:ring-indigo-500 font-mono font-bold px-0 py-0.5 rounded text-black text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                )}
              </td>

              {/* KH */}
              <td className="p-1 border border-black text-center font-mono font-bold text-black w-[56px] min-w-[56px] bg-[#92D050]">
                {isPrint ? (
                  <span>{targetKH > 0 ? targetKH.toFixed(1) : "-"}</span>
                ) : (
                  <input
                    type="number"
                    step="any"
                    value={targetKH > 0 ? Number(targetKH.toFixed(1)) : ""}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      handleAkgValChange(table.porsi, "kh", val, akgMode, table.akgType, table.id);
                    }}
                    className="w-full text-center bg-white/40 focus:bg-white border-0 focus:ring-1 focus:ring-indigo-500 font-mono font-bold px-0 py-0.5 rounded text-black text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                )}
              </td>

              {/* SERAT */}
              <td className="p-1 border border-black text-center font-mono font-bold text-black w-[56px] min-w-[56px] bg-[#92D050]">
                {isPrint ? (
                  <span>{targetSerat > 0 ? targetSerat.toFixed(1) : "-"}</span>
                ) : (
                  <input
                    type="number"
                    step="any"
                    value={targetSerat > 0 ? Number(targetSerat.toFixed(1)) : ""}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      handleAkgValChange(table.porsi, "serat", val, akgMode, table.akgType, table.id);
                    }}
                    className="w-full text-center bg-white/40 focus:bg-white border-0 focus:ring-1 focus:ring-indigo-500 font-mono font-bold px-0 py-0.5 rounded text-black text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                )}
              </td>

              {planningMode === "all_ingredients" ? (
                <>
                  {/* Right Part: HARGA PER PORSI (cols 11-22) */}
                  <td colSpan={10} className="p-1.5 border border-black border-r-2 border-r-slate-950 text-right pr-4 uppercase text-slate-950 font-black bg-[#A9D08E]">
                    HARGA PER PORSI
                  </td>
                  <td className={`p-1 border border-black border-l-2 border-l-slate-950 border-r-2 border-r-slate-950 ${calculatedCostPerPorsi > targetPrice ? "bg-[#FF0000]" : "bg-[#00B050]"}`}>
                    <div className="flex items-center justify-between px-1 w-full font-mono text-xs font-black text-white">
                      <span className="text-white/90 font-black">Rp</span>
                      <span className="font-black text-white">{formatRupiah(calculatedCostPerPorsi).replace("Rp", "").trim()}</span>
                    </div>
                  </td>
                  {!isPrint && (
                    <td className={`p-1 border border-black border-l-2 border-l-slate-950 no-print ${calculatedCostPerPorsi > targetPrice ? "bg-[#FF0000]" : "bg-[#00B050]"}`}></td>
                  )}
                </>
              ) : (
                <>
                  {/* Right Part: BUMBU 10% (cols 11-22) */}
                  <td colSpan={10} className="p-1.5 border border-black border-r-2 border-r-slate-950 text-right pr-4 uppercase text-slate-950 font-black bg-[#FFFF00]">
                    BUMBU 10%
                  </td>
                  <td className="p-1 border border-black border-l-2 border-l-slate-950 border-r-2 border-r-slate-950 bg-[#FFFF00]">
                    <div className="flex items-center justify-between px-1 w-full font-mono text-xs font-black text-slate-950">
                      <span className="text-slate-600 font-black">Rp</span>
                      <span className="font-black">{formatRupiah(bumbuCost).replace("Rp", "").trim()}</span>
                    </div>
                  </td>
                  {!isPrint && (
                    <td className="p-1 border border-black border-l-2 border-l-slate-950 bg-[#FFFF00] no-print"></td>
                  )}
                </>
              )}
            </tr>

            {/* ROW 3: KEBUTUHAN 90-110% + (JUMLAH+BUMBU 10% OR BLANK) */}
            <tr className="border border-black">
              {/* Left Part: Kebutuhan 90-110% (cols 1-10) */}
              <td colSpan={5} className="p-1.5 border border-black font-extrabold text-black uppercase bg-[#92D050] text-center">
                KEBUTUHAN 90-110%
              </td>
              
              {[
                { val: pctEnergi, active: targetEnergi > 0 },
                { val: pctProtein, active: targetProtein > 0 },
                { val: pctLemak, active: targetLemak > 0 },
                { val: pctKH, active: targetKH > 0 },
                { val: pctSerat, active: targetSerat > 0 },
              ].map((pctInfo, idx) => {
                const isOk = pctInfo.active && pctInfo.val >= 90 && pctInfo.val <= 110;
                const cellBg = pctInfo.active ? (isOk ? '#00B050' : '#FF0000') : '#FF0000';
                const cellText = 'black';
                return (
                  <td 
                    key={idx} 
                    className="p-1.5 border border-black text-center font-mono font-black text-black" 
                    style={{ backgroundColor: cellBg, color: cellText }}
                  >
                    {pctInfo.active ? `${pctInfo.val.toFixed(0)}%` : ""}
                  </td>
                );
              })}

              {planningMode === "all_ingredients" ? (
                <>
                  <td colSpan={10} className="p-1.5 border border-black bg-slate-50/10"></td>
                  <td className="p-1 border border-black bg-slate-50/10"></td>
                  {!isPrint && (
                    <td className="p-1 border border-black bg-slate-50/10 no-print"></td>
                  )}
                </>
              ) : (
                <>
                  {/* Right Part: JUMLAH+BUMBU 10% (cols 11-22) */}
                  <td colSpan={10} className="p-1.5 border border-black border-r-2 border-r-slate-950 text-right pr-4 uppercase text-slate-950 font-black bg-[#F8CBAD]">
                    JUMLAH+BUMBU 10%
                  </td>
                  <td className="p-1 border border-black border-l-2 border-l-slate-950 border-r-2 border-r-slate-950 bg-[#F8CBAD]">
                    <div className="flex items-center justify-between px-1 w-full font-mono text-xs font-black text-slate-950">
                      <span className="text-slate-600 font-black">Rp</span>
                      <span className="font-black">{formatRupiah(subtotalCost).replace("Rp", "").trim()}</span>
                    </div>
                  </td>
                  {!isPrint && (
                    <td className="p-1 border border-black border-l-2 border-l-slate-950 bg-[#F8CBAD] no-print"></td>
                  )}
                </>
              )}
            </tr>

            {/* ROW 4: HARGA PER PORSI */}
            {planningMode === "with_bumbu_10" && (
              <tr className="border border-black font-extrabold text-black">
                {/* Left Part: Empty (cols 1-10) */}
                <td colSpan={10} className="p-1.5 border border-black bg-slate-50/30"></td>

                {/* Right Part: HARGA PER PORSI (cols 11-22) */}
                <td colSpan={10} className="p-1.5 border border-black border-r-2 border-r-slate-950 text-right pr-4 uppercase text-slate-950 font-black bg-[#A9D08E]">
                  HARGA PER PORSI
                </td>
                <td className={`p-1 border border-black border-l-2 border-l-slate-950 border-r-2 border-r-slate-950 ${calculatedCostPerPorsi > targetPrice ? "bg-[#FF0000]" : "bg-[#00B050]"}`}>
                  <div className="flex items-center justify-between px-1 w-full font-mono text-xs font-black text-white">
                    <span className="text-white/90 font-black">Rp</span>
                    <span className="font-black text-white">{formatRupiah(calculatedCostPerPorsi).replace("Rp", "").trim()}</span>
                  </div>
                </td>
                {!isPrint && (
                  <td className={`p-1 border border-black border-l-2 border-l-slate-950 no-print ${calculatedCostPerPorsi > targetPrice ? "bg-[#FF0000]" : "bg-[#00B050]"}`}></td>
                )}
              </tr>
            )}
          </tfoot>
        </table>
      </div>
    );
  };

  return (
    <div id="food-cost-container" className="space-y-6">
      {/* 1. Injected Print Styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4 landscape;
            margin: 6mm 8mm;
          }
          body {
            background-color: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .no-print, header, nav, footer, .sidebar, button, .tab-bar, #select-fc-day, #select-fc-group, #select-fc-type {
            display: none !important;
          }
          #print-area-food-cost {
            display: block !important;
            width: 100% !important;
            position: absolute !important;
            left: 0 !important;
            right: 0 !important;
            top: 0 !important;
            margin: 0 auto !important;
            padding: 0 !important;
            zoom: 70% !important; /* Auto scale down to ensure fitting in standard A4 landscape */
          }
          /* Centered block layout */
          #print-area-food-cost > div {
            margin: 0 auto !important;
            width: 100% !important;
            max-width: 100% !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
          }
          /* Enforce compact layout and prevent spill */
          #print-area-food-cost table {
            width: 100% !important;
            table-layout: fixed !important;
            border-collapse: collapse !important;
            margin: 0 auto !important;
          }
          #print-area-food-cost th, #print-area-food-cost td {
            font-size: 8px !important;
            padding: 2px 3px !important;
            line-height: 1.15 !important;
            word-wrap: break-word !important;
            white-space: normal !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            border: 1px solid black !important;
          }
          /* Set proportionate percentages for high-density column layout to prevent overflow */
          #print-area-food-cost th.w-\\[110px\\], #print-area-food-cost td.w-\\[110px\\] { width: 5.5% !important; min-width: auto !important; }
          #print-area-food-cost th.w-\\[160px\\], #print-area-food-cost td.w-\\[160px\\] { width: 9% !important; min-width: auto !important; }
          #print-area-food-cost th.w-\\[56px\\], #print-area-food-cost td.w-\\[56px\\] { width: 3.5% !important; min-width: auto !important; }
          #print-area-food-cost th.w-\\[64px\\], #print-area-food-cost td.w-\\[64px\\] { width: 4% !important; min-width: auto !important; }
          #print-area-food-cost th.w-\\[72px\\], #print-area-food-cost td.w-\\[72px\\] { width: 4.5% !important; min-width: auto !important; }
          #print-area-food-cost th.w-\\[48px\\], #print-area-food-cost td.w-\\[48px\\] { width: 3% !important; min-width: auto !important; }
          #print-area-food-cost th.w-\\[115px\\], #print-area-food-cost td.w-\\[115px\\] { width: 6% !important; min-width: auto !important; }
          #print-area-food-cost th.w-\\[155px\\], #print-area-food-cost td.w-\\[155px\\] { width: 8% !important; min-width: auto !important; }
          #print-area-food-cost th.w-\\[130px\\], #print-area-food-cost td.w-\\[130px\\] { width: 7% !important; min-width: auto !important; }
          #print-area-food-cost th.w-\\[145px\\], #print-area-food-cost td.w-\\[145px\\] { width: 8% !important; min-width: auto !important; }

          input, select {
            border: none !important;
            background: transparent !important;
            box-shadow: none !important;
            outline: none !important;
            padding: 0 !important;
            font-size: inherit !important;
            color: black !important;
          }
        }
      `}} />

      {/* 2. Top Navigation header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4 no-print">
        <div>
          <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-indigo-600" />
            ANALISIS & KALKULATOR FOOD COST SPPG
          </h3>
          <p className="text-xs text-slate-500">
            Kalkulasi unit cost, kecukupan gizi rujukan AKG, penyusutan (buffer), dan ekspor A4 Landscape presisi.
          </p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-xs shrink-0 self-end sm:self-center">
          <button
            type="button"
            id="btn-mode-fc-edit"
            onClick={() => setViewMode("edit")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              viewMode === "edit" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            Mode Edit Kalkulator
          </button>
          <button
            type="button"
            id="btn-mode-fc-print"
            onClick={() => setViewMode("print")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              viewMode === "print" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            Pratinjau Cetak A4 / Ekspor
          </button>
        </div>
      </div>

      {/* --- VIEW MODE: EDIT INTERAKTIF --- */}
      {viewMode === "edit" && (
        <div className="space-y-6 no-print">
          {/* Interactive Filters Panel */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 flex-grow">
              {/* 1. Cycle Day Selector */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase block">Siklus Menu</label>
                <select
                  id="select-fc-day"
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(Number(e.target.value))}
                  className="bg-slate-50 border border-slate-200 rounded-xl text-xs px-3 py-2.5 text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-full"
                >
                  {Array.from({ length: 12 }).map((_, i) => (
                    <option key={i} value={i + 1}>
                      Hari Ke-{i + 1}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Target Recipient Group Filter */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase block">Kelompok Sasaran</label>
                <select
                  id="select-fc-group"
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 rounded-xl text-xs px-3 py-2.5 text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-full"
                >
                  <option value="sekolah">Kelompok Usia Sekolah (TK/SD/SMP/SMA)</option>
                  <option value="tigaB">Kelompok 3B (Balita, Bumil, Busui)</option>
                  <option value="custom">✍️ Kelompok Sasaran Kustom</option>
                </select>
              </div>

              {/* 3. Menu Type Selector */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase block">Kategori Menu / Diet</label>
                <select
                  id="select-fc-type"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 rounded-xl text-xs px-3 py-2.5 text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-full"
                >
                  <option value="Basah">Menu Basah (Standar)</option>
                  <option value="Alergi">Menu Diet Alergi</option>
                  <option value="Kering">Menu Kering / Kudapan</option>
                  {selectedGroup === "tigaB" && <option value="MP-ASI">Menu MP-ASI (6-12 Bln)</option>}
                </select>
              </div>

              {/* 4. Buffer Rate Selector */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase block">Penyusutan (Buffer)</label>
                <div className="flex bg-slate-50 border border-slate-200 rounded-xl p-1 gap-1 items-center h-10">
                  <button
                    id="btn-buffer-3"
                    type="button"
                    onClick={() => handleBufferChange(3)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                      currentDayData.bufferPct === 3 ? "bg-white text-indigo-600 shadow-xs border border-slate-200/50" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    3%
                  </button>
                  <button
                    id="btn-buffer-5"
                    type="button"
                    onClick={() => handleBufferChange(5)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                      currentDayData.bufferPct === 5 ? "bg-white text-indigo-600 shadow-xs border border-slate-200/50" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    5%
                  </button>
                  <div className="flex-1 min-w-0 flex items-center bg-white border border-slate-200 rounded-lg px-1.5 py-0.5 h-8">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={![3, 5].includes(currentDayData.bufferPct) ? currentDayData.bufferPct : ""}
                      placeholder="Custom"
                      onChange={(e) => {
                        const val = e.target.value === "" ? 3 : parseFloat(e.target.value);
                        if (!isNaN(val)) {
                          handleBufferChange(val);
                        }
                      }}
                      className="w-full text-center bg-transparent border-0 font-bold text-xs p-0 text-indigo-600 focus:outline-none focus:ring-0 placeholder:text-slate-400"
                    />
                    <span className="text-[9px] text-slate-400 font-bold">%</span>
                  </div>
                </div>
              </div>

              {/* 5. Spice Planning Selector */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase block">Perencanaan Bumbu</label>
                <select
                  value={planningMode}
                  onChange={(e) => handlePlanningModeChange(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 rounded-xl text-xs px-3 py-2.5 text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-full cursor-pointer h-10"
                >
                  <option value="with_bumbu_10">Bumbu Tambahan 10%</option>
                  <option value="all_ingredients">Semua Bahan Termasuk Bumbu</option>
                </select>
              </div>
            </div>

            {/* Selected Menu Highlight with Copy Button */}
            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-1 min-w-0">
              <div className="flex items-center gap-3 min-w-0">
                <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 animate-pulse" />
                <div className="min-w-0">
                  <span className="text-[9px] font-bold text-indigo-600 uppercase block">Hari {selectedDay} ({selectedType}) — 📅 {currentCalendarDate}</span>
                  <span className="text-xs font-extrabold text-slate-800 truncate block">{namaMenuHariIni || "Belum ada menu"}</span>
                </div>
              </div>
              {namaMenuHariIni && selectedGroup !== "custom" && (
                <button
                  type="button"
                  onClick={autoMatchFromMasterMenu}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 self-start sm:self-center shadow-sm shrink-0 hover:scale-[1.02] active:scale-[0.98]"
                  title="Salin dan otomatis petakan komponen menu ini ke database TKPI"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Salin ke Food Costing
                </button>
              )}
            </div>
          </div>

          {/* RAB & Realisasi Belanja Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Rencana Anggaran Biaya (RAB) */}
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/40 p-4 rounded-2xl border border-emerald-100 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider block">
                  Rencana Anggaran Biaya (RAB Harian)
                </span>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-xl font-black text-emerald-900 font-mono">
                    Rp {formatThousandSeparator(rabPorsiKecil + rabPorsiBesar)}
                  </span>
                </div>
              </div>
              <div className="text-[10px] text-emerald-700 font-semibold mt-3 space-y-0.5 border-t border-emerald-200/50 pt-2 font-mono">
                <div>Kecil: {pmKecil} PM x Rp {formatThousandSeparator(activeTargetPriceKecil)} = Rp {formatThousandSeparator(pmKecil * activeTargetPriceKecil)}</div>
                <div>Besar: {pmBesar} PM x Rp {formatThousandSeparator(activeTargetPriceBesar)} = Rp {formatThousandSeparator(pmBesar * activeTargetPriceBesar)}</div>
              </div>
            </div>

            {/* 2. Realisasi Belanja Harian */}
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/40 p-4 rounded-2xl border border-indigo-100 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black text-indigo-800 uppercase tracking-wider block">
                  Realisasi Belanja Harian (Actual)
                </span>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-xl font-black text-indigo-900 font-mono">
                    Rp {formatThousandSeparator(results.subtotalKecilCost + results.subtotalBesarCost)}
                  </span>
                </div>
              </div>
              <div className="text-[10px] text-indigo-700 font-semibold mt-3 space-y-0.5 border-t border-indigo-200/50 pt-2 font-mono">
                <div>Kecil: Rp {formatThousandSeparator(results.subtotalKecilCost)} (Rp {formatThousandSeparator(Math.round(results.costPerPorsiKecil))}/porsi)</div>
                <div>Besar: Rp {formatThousandSeparator(results.subtotalBesarCost)} (Rp {formatThousandSeparator(Math.round(results.costPerPorsiBesar))}/porsi)</div>
              </div>
            </div>

            {/* 3. Sisa / Efisiensi Saldo */}
            <div className={`p-4 rounded-2xl border shadow-xs flex flex-col justify-between ${
              (pmKecil * activeTargetPriceKecil + pmBesar * activeTargetPriceBesar) - (results.subtotalKecilCost + results.subtotalBesarCost) >= 0 
                ? "bg-gradient-to-br from-teal-50 to-teal-100/40 border-teal-100" 
                : "bg-gradient-to-br from-rose-50 to-rose-100/40 border-rose-100"
            }`}>
              <div>
                <span className={`text-[10px] font-black uppercase tracking-wider block ${
                  (pmKecil * activeTargetPriceKecil + pmBesar * activeTargetPriceBesar) - (results.subtotalKecilCost + results.subtotalBesarCost) >= 0 ? "text-teal-800" : "text-rose-800"
                }`}>
                  {((pmKecil * activeTargetPriceKecil + pmBesar * activeTargetPriceBesar) - (results.subtotalKecilCost + results.subtotalBesarCost)) >= 0 ? "Sisa / Efisiensi Anggaran (Surplus)" : "Defisit / Melebihi Anggaran"}
                </span>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className={`text-xl font-black font-mono ${
                    (pmKecil * activeTargetPriceKecil + pmBesar * activeTargetPriceBesar) - (results.subtotalKecilCost + results.subtotalBesarCost) >= 0 ? "text-teal-900" : "text-rose-900"
                  }`}>
                    {((pmKecil * activeTargetPriceKecil + pmBesar * activeTargetPriceBesar) - (results.subtotalKecilCost + results.subtotalBesarCost)) >= 0 ? "+" : ""}{formatRupiah((pmKecil * activeTargetPriceKecil + pmBesar * activeTargetPriceBesar) - (results.subtotalKecilCost + results.subtotalBesarCost))}
                  </span>
                </div>
              </div>
              <div className={`text-[10px] font-semibold mt-3 border-t pt-2 ${
                (pmKecil * activeTargetPriceKecil + pmBesar * activeTargetPriceBesar) - (results.subtotalKecilCost + results.subtotalBesarCost) >= 0 
                  ? "text-teal-700 border-teal-200/50" 
                  : "text-rose-700 border-rose-200/50"
              }`}>
                {((pmKecil * activeTargetPriceKecil + pmBesar * activeTargetPriceBesar) - (results.subtotalKecilCost + results.subtotalBesarCost)) >= 0 
                  ? "✓ Komponen belanja aman di bawah plafon harian." 
                  : "⚠️ Perhatian: Anggaran belanja melebihi pagu dana yang diatur!"}
              </div>
            </div>
          </div>

          {/* CONFIGURATION & MERGING PANEL (no-print) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden no-print">
            <button
              type="button"
              onClick={() => setShowConfigPanel(!showConfigPanel)}
              className="w-full px-5 py-4 flex items-center justify-between bg-slate-50/50 hover:bg-slate-50 transition-all border-b border-slate-100"
            >
              <div className="flex items-center gap-3 text-left">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    Pengaturan Plafon Target Harga & Penggabungan Kriteria PM
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-normal mt-0.5 font-medium">
                    Sesuaikan harga per porsi target dan atur gabungan sasaran penerima manfaat secara kustom atau modular.
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 shrink-0">
                {showConfigPanel ? "Sembunyikan" : "Tampilkan Panel"}
                <ChevronRight className={`w-4 h-4 transform transition-transform duration-200 ${showConfigPanel ? 'rotate-90' : ''}`} />
              </span>
            </button>

            {showConfigPanel && (
              <div className="p-5 space-y-6">
                {/* Tabs */}
                <div className="flex border-b border-slate-100 pb-px gap-2 overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setActiveConfigTab("targets")}
                    className={`px-4 py-2 rounded-t-xl text-xs font-extrabold whitespace-nowrap transition-all ${
                      activeConfigTab === "targets"
                        ? "bg-slate-100 text-slate-800 border-t border-x border-slate-200/60"
                        : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    🎯 Plafon Harga Per Sasaran
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveConfigTab("mergeBesar")}
                    className={`px-4 py-2 rounded-t-xl text-xs font-extrabold whitespace-nowrap transition-all ${
                      activeConfigTab === "mergeBesar"
                        ? "bg-slate-100 text-slate-800 border-t border-x border-slate-200/60"
                        : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    🍱 Kriteria Porsi Besar
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveConfigTab("mergeKecil")}
                    className={`px-4 py-2 rounded-t-xl text-xs font-extrabold whitespace-nowrap transition-all ${
                      activeConfigTab === "mergeKecil"
                        ? "bg-slate-100 text-slate-800 border-t border-x border-slate-200/60"
                        : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    🥣 Kriteria Porsi Kecil
                  </button>
                </div>

                {/* Tab 1: Plafon Targets per Sasaran */}
                {activeConfigTab === "targets" && (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                        Atur Target Harga (Plafon) Per Porsi Individual:
                      </h5>
                      <button
                        type="button"
                        onClick={() => {
                          triggerConfirm({
                            title: "Reset Target Harga Porsi",
                            message: "Apakah Anda yakin ingin mengembalikan target harga (plafon) porsi setiap sasaran ke standar juknis (Porsi Kecil Rp 8.000 & Porsi Besar Rp 10.000)?",
                            confirmText: "Reset",
                            variant: "warning",
                            onConfirm: () => {
                              setSasaranTargets({
                                tk_paud_lb: 8000,
                                sd_kelas_1_3: 8000,
                                sd_kelas_4_6: 8000,
                                smp_mts_smplb: 8000,
                                sma_smk_ma: 8000,
                                pendidik: 8000,
                                tenaga_kependidikan: 8000,
                                anak_balita: 8000,
                                anak_balita_13_59: 8000,
                                balita_6_11: 8000,
                                ibu_hamil: 10000,
                                ibu_menyusui: 10000
                              });
                            }
                          });
                        }}
                        className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1.5 transition-all"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Reset ke Default Juknis
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {DEFAULT_SASARAN_LIST.map((sas) => (
                        <div key={sas.id} className="bg-slate-50/50 p-3 rounded-xl border border-slate-200/60 flex flex-col justify-between gap-2.5">
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                              ID: {sas.id}
                            </span>
                            <span className="text-xs font-bold text-slate-700 block mt-0.5">
                              {sas.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                            <span className="text-xs font-bold text-slate-400">Rp</span>
                            <input
                              type="number"
                              min="0"
                              step="500"
                              value={sasaranTargets[sas.id] || 0}
                              onChange={(e) => {
                                const val = Math.max(0, Number(e.target.value));
                                setSasaranTargets(prev => ({ ...prev, [sas.id]: val }));
                              }}
                              className="w-full text-xs font-bold text-slate-800 text-right bg-transparent border-none p-0 focus:outline-none focus:ring-0 font-mono"
                            />
                            <span className="text-[10px] text-slate-400 font-bold shrink-0">/ porsi</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tab 2: Merge settings for Porsi Besar */}
                {activeConfigTab === "mergeBesar" && (
                  <div className="space-y-4">
                    {/* Target Price Input for Porsi Besar */}
                    <div className="space-y-1.5 max-w-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                        Plafon Target Porsi Besar (Rp / Porsi)
                      </label>
                      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5">
                        <span className="text-xs font-bold text-slate-400 font-semibold">Rp</span>
                        <input
                          type="number"
                          min="0"
                          step="500"
                          value={settings.porsiBesarHarga}
                          onChange={(e) => updateSetting("porsiBesarHarga", Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full text-xs font-bold text-slate-800 bg-transparent border-none p-0 focus:outline-none focus:ring-0 font-mono"
                        />
                        <span className="text-[10px] text-slate-400 font-bold shrink-0">/ porsi</span>
                      </div>
                    </div>

                    <div className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="font-bold text-slate-700 block mb-1">Klasifikasi Sasaran Terpilih:</span>
                      <p className="text-slate-500 text-[11px]">
                        {porsiBesarLabels || "Belum ada sasaran terpilih. Atur klasifikasi di bawah."}
                      </p>
                    </div>

                    {/* Accordion Toggle for Porsi Besar Classifications */}
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => setShowBesarSasaranEditor(!showBesarSasaranEditor)}
                        className="w-full flex items-center justify-between px-3 py-2 bg-cyan-50 hover:bg-cyan-100/80 text-cyan-700 rounded-xl text-[11px] font-bold transition cursor-pointer"
                      >
                        <span className="flex items-center gap-1">
                          <Settings className="w-3.5 h-3.5" />
                          Pilih Klasifikasi Sasaran Porsi Besar
                        </span>
                        {showBesarSasaranEditor ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      {showBesarSasaranEditor && (
                        <div className="mt-2 p-3 bg-white border border-slate-150 rounded-xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-[11px] max-h-[180px] overflow-y-auto animate-in fade-in duration-150">
                          {DEFAULT_SASARAN_LIST.map((s) => {
                            const isChecked = settings.porsiBesarSasaranIds.includes(s.id);
                            const dayPM = harianPM.find(h => h.hariKe === selectedDay) || harianPM[0] || { sasaran: [] };
                            const sasItem = dayPM.sasaran.find(x => x.id === s.id);
                            const activeCount = sasItem ? (Number(sasItem.porsiBesar) || 0) : 0;
                            return (
                              <label
                                key={s.id}
                                className={`flex items-center justify-between p-1.5 rounded-lg border cursor-pointer transition ${
                                  isChecked 
                                    ? "bg-cyan-50/40 border-cyan-200 text-cyan-950 font-semibold" 
                                    : "border-slate-100 text-slate-600 hover:bg-slate-50"
                                }`}
                              >
                                <span className="flex items-center gap-2 truncate">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => handleToggleBesarSasaran(s.id)}
                                    className="rounded text-cyan-600 focus:ring-cyan-500 w-3.5 h-3.5"
                                  />
                                  <span className="truncate">{s.label}</span>
                                </span>
                                <span className="font-mono text-[9px] text-slate-400 shrink-0 pr-1">({activeCount} PM)</span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Tab 3: Merge settings for Porsi Kecil */}
                {activeConfigTab === "mergeKecil" && (
                  <div className="space-y-4">
                    {/* Target Price Input for Porsi Kecil */}
                    <div className="space-y-1.5 max-w-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                        Plafon Target Porsi Kecil (Rp / Porsi)
                      </label>
                      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5">
                        <span className="text-xs font-bold text-slate-400 font-semibold">Rp</span>
                        <input
                          type="number"
                          min="0"
                          step="500"
                          value={settings.porsiKecilHarga}
                          onChange={(e) => updateSetting("porsiKecilHarga", Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full text-xs font-bold text-slate-800 bg-transparent border-none p-0 focus:outline-none focus:ring-0 font-mono"
                        />
                        <span className="text-[10px] text-slate-400 font-bold shrink-0">/ porsi</span>
                      </div>
                    </div>

                    <div className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="font-bold text-slate-700 block mb-1">Klasifikasi Sasaran Terpilih:</span>
                      <p className="text-slate-500 text-[11px]">
                        {porsiKecilLabels || "Belum ada sasaran terpilih. Atur klasifikasi di bawah."}
                      </p>
                    </div>

                    {/* Accordion Toggle for Porsi Kecil Classifications */}
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => setShowKecilSasaranEditor(!showKecilSasaranEditor)}
                        className="w-full flex items-center justify-between px-3 py-2 bg-indigo-50 hover:bg-indigo-100/80 text-indigo-700 rounded-xl text-[11px] font-bold transition cursor-pointer"
                      >
                        <span className="flex items-center gap-1">
                          <Settings className="w-3.5 h-3.5" />
                          Pilih Klasifikasi Sasaran Porsi Kecil
                        </span>
                        {showKecilSasaranEditor ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      {showKecilSasaranEditor && (
                        <div className="mt-2 p-3 bg-white border border-slate-150 rounded-xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-[11px] max-h-[180px] overflow-y-auto animate-in fade-in duration-150">
                          {DEFAULT_SASARAN_LIST.map((s) => {
                            const isChecked = settings.porsiKecilSasaranIds.includes(s.id);
                            const dayPM = harianPM.find(h => h.hariKe === selectedDay) || harianPM[0] || { sasaran: [] };
                            const sasItem = dayPM.sasaran.find(x => x.id === s.id);
                            const activeCount = sasItem ? (Number(sasItem.porsiKecil) || 0) : 0;
                            return (
                              <label
                                key={s.id}
                                className={`flex items-center justify-between p-1.5 rounded-lg border cursor-pointer transition ${
                                  isChecked 
                                    ? "bg-indigo-50/40 border-indigo-200 text-indigo-950 font-semibold" 
                                    : "border-slate-100 text-slate-600 hover:bg-slate-50"
                                }`}
                              >
                                <span className="flex items-center gap-2 truncate">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => handleToggleKecilSasaran(s.id)}
                                    className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                                  />
                                  <span className="truncate">{s.label}</span>
                                </span>
                                <span className="font-mono text-[9px] text-slate-400 shrink-0 pr-1">({activeCount} PM)</span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Recipient info & targets summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
              <div className="min-w-0 flex-1 pr-3">
                <span className="text-xs text-slate-500 font-semibold uppercase block">PM PORSI BESAR (Plafon: {formatRupiah(activeTargetPriceBesar)})</span>
                <p className="text-[11px] text-cyan-600 mt-0.5 font-semibold truncate" title={porsiBesarLabels}>
                  {porsiBesarLabels || "Tidak ada sasaran aktif"}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border shadow-xs transition ${currentDayData.customPmBesarCount !== undefined ? 'bg-cyan-50 border-cyan-200 text-cyan-700' : 'bg-white border-slate-200 text-slate-800'}`}>
                  <span className="text-[9px] font-extrabold uppercase text-slate-400">Hari ini:</span>
                  <input
                    type="number"
                    min="0"
                    placeholder={String(
                      settings.porsiBesarSasaranIds.reduce((acc, sId) => {
                        const dayPM = harianPM.find(h => h.hariKe === selectedDay) || harianPM[0] || { sasaran: [] };
                        const sasItem = dayPM.sasaran.find(x => x.id === sId);
                        return acc + (sasItem ? (Number(sasItem.porsiBesar) || 0) : 0);
                      }, 0)
                    )}
                    value={currentDayData.customPmBesarCount !== undefined ? currentDayData.customPmBesarCount : ""}
                    onChange={(e) => {
                      const val = e.target.value === "" ? undefined : Math.max(0, Number(e.target.value));
                      updateDayData({ ...currentDayData, customPmBesarCount: val });
                    }}
                    className="w-14 text-center text-xs font-black font-mono bg-transparent border-0 p-0 focus:outline-none focus:ring-0"
                    title="Ubah angka ini untuk menyesuaikan jumlah porsi besar khusus hari ini saja"
                  />
                  <span className="text-xs font-bold font-mono">PM</span>
                </div>
                {currentDayData.customPmBesarCount !== undefined && (
                  <button
                    type="button"
                    onClick={() => updateDayData({ ...currentDayData, customPmBesarCount: undefined })}
                    className="text-[10px] text-rose-500 hover:text-rose-700 font-bold underline shrink-0 cursor-pointer"
                    title="Kembalikan ke nilai default dari database"
                  >
                    Batal
                  </button>
                )}
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
              <div className="min-w-0 flex-1 pr-3">
                <span className="text-xs text-slate-500 font-semibold uppercase block">PM PORSI KECIL (Plafon: {formatRupiah(activeTargetPriceKecil)})</span>
                <p className="text-[11px] text-indigo-600 mt-0.5 font-semibold truncate" title={porsiKecilLabels}>
                  {porsiKecilLabels || "Tidak ada sasaran aktif"}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border shadow-xs transition ${currentDayData.customPmKecilCount !== undefined ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-800'}`}>
                  <span className="text-[9px] font-extrabold uppercase text-slate-400">Hari ini:</span>
                  <input
                    type="number"
                    min="0"
                    placeholder={String(
                      settings.porsiKecilSasaranIds.reduce((acc, sId) => {
                        const dayPM = harianPM.find(h => h.hariKe === selectedDay) || harianPM[0] || { sasaran: [] };
                        const sasItem = dayPM.sasaran.find(x => x.id === sId);
                        return acc + (sasItem ? (Number(sasItem.porsiKecil) || 0) : 0);
                      }, 0)
                    )}
                    value={currentDayData.customPmKecilCount !== undefined ? currentDayData.customPmKecilCount : ""}
                    onChange={(e) => {
                      const val = e.target.value === "" ? undefined : Math.max(0, Number(e.target.value));
                      updateDayData({ ...currentDayData, customPmKecilCount: val });
                    }}
                    className="w-14 text-center text-xs font-black font-mono bg-transparent border-0 p-0 focus:outline-none focus:ring-0"
                    title="Ubah angka ini untuk menyesuaikan jumlah porsi kecil khusus hari ini saja"
                  />
                  <span className="text-xs font-bold font-mono">PM</span>
                </div>
                {currentDayData.customPmKecilCount !== undefined && (
                  <button
                    type="button"
                    onClick={() => updateDayData({ ...currentDayData, customPmKecilCount: undefined })}
                    className="text-[10px] text-rose-500 hover:text-rose-700 font-bold underline shrink-0 cursor-pointer"
                    title="Kembalikan ke nilai default dari database"
                  >
                    Batal
                  </button>
                )}
              </div>
            </div>
          </div>



          {/* Table 1: Porsi Besar Block */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-3 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-extrabold text-slate-800 flex items-center gap-2 uppercase text-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  KOMPONEN BAHAN BAKU - PORSI BESAR
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5 font-semibold">
                  Plafon: {formatRupiah(targetPriceBesar)} per porsi
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  id="btn-add-ing-besar"
                  type="button"
                  onClick={() => addIngredientRow("besar")}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-xs font-bold transition shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tambah Bahan Baku
                </button>
                <button
                  type="button"
                  onClick={() => {
                    triggerConfirm({
                      title: "Hapus Semua Bahan Porsi Besar",
                      message: "Apakah Anda yakin ingin menghapus seluruh komponen bahan baku porsi besar hari ini?",
                      onConfirm: () => {
                        updateDayData({
                          ...currentDayData,
                          porsiBesarBahan: []
                        });
                      }
                    });
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold transition shadow-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Hapus Semua
                </button>
              </div>
            </div>
            
            {renderFoodCostTable("besar", false)}

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                Rujukan AKG Porsi Besar Aktif:
              </span>
              <select
                id="select-akg-besar"
                value={besarAkgType}
                onChange={(e) => setBesarAkgType(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg text-xs px-2 py-1 text-slate-700 font-bold focus:outline-none"
              >
                {Object.entries(TARGET_AKG_LIMITS).map(([key, val]) => (
                  <option key={key} value={key}>
                    {val.label}
                  </option>
                ))}
                <option value="custom">✍️ Target Kustom (Input Manual)</option>
              </select>
            </div>
          </div>

          {/* Table 2: Porsi Kecil Block */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-3 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-extrabold text-slate-800 flex items-center gap-2 uppercase text-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
                  KOMPONEN BAHAN BAKU - PORSI KECIL
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5 font-semibold">
                  Plafon: {formatRupiah(targetPriceKecil)} per porsi
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  id="btn-add-ing-kecil"
                  type="button"
                  onClick={() => addIngredientRow("kecil")}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-xs font-bold transition shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tambah Bahan Baku
                </button>
                <button
                  type="button"
                  onClick={() => {
                    triggerConfirm({
                      title: "Hapus Semua Bahan Porsi Kecil",
                      message: "Apakah Anda yakin ingin menghapus seluruh komponen bahan baku porsi kecil hari ini?",
                      onConfirm: () => {
                        updateDayData({
                          ...currentDayData,
                          porsiKecilBahan: []
                        });
                      }
                    });
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold transition shadow-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Hapus Semua
                </button>
              </div>
            </div>

            {renderFoodCostTable("kecil", false)}

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                Rujukan AKG Porsi Kecil Aktif:
              </span>
              <select
                id="select-akg-kecil"
                value={kecilAkgType}
                onChange={(e) => setKecilAkgType(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg text-xs px-2 py-1 text-slate-700 font-bold focus:outline-none"
              >
                {Object.entries(TARGET_AKG_LIMITS).map(([key, val]) => (
                  <option key={key} value={key}>
                    {val.label}
                  </option>
                ))}
                <option value="custom">✍️ Target Kustom (Input Manual)</option>
              </select>
            </div>
          </div>

          {/* Custom Components / Tables Section */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse"></span>
                  Komponen & Tabel Baru (Porsi Besar / Kecil)
                </h4>
                <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                  Tambahkan komponen porsi atau sasaran kustom baru secara independen.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setNewTableName(`Komponen Kustom ${customTables.length + 1}`);
                  setShowAddTableForm(!showAddTableForm);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs transition shrink-0"
              >
                <Plus className="w-4 h-4" />
                Tambah Tabel Baru
              </button>
            </div>

            {/* Form to Add New Table */}
            {showAddTableForm && (
              <div className="bg-white p-5 rounded-2xl border-2 border-dashed border-purple-200 shadow-sm space-y-4">
                <h5 className="text-xs font-black text-purple-950 uppercase tracking-wide">Konfigurasi Tabel Komponen Baru</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Nama Komponen / Tabel</label>
                    <input
                      type="text"
                      value={newTableName}
                      onChange={(e) => setNewTableName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs p-2.5 text-slate-800 font-bold"
                      placeholder="Contoh: MP-ASI Porsi Sedang"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Tipe Porsi Rujukan</label>
                    <select
                      value={newTablePorsi}
                      onChange={(e) => setNewTablePorsi(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs p-2.5 text-slate-800 font-bold"
                    >
                      <option value="besar">Porsi Besar (SMP/SMA/Bumil/Busui)</option>
                      <option value="kecil">Porsi Kecil (TK/PAUD/Balita)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Jumlah Penerima Manfaat (PM)</label>
                    <input
                      type="number"
                      min="1"
                      value={newTablePmCount}
                      onChange={(e) => setNewTablePmCount(Math.max(1, Number(e.target.value)))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs p-2.5 text-slate-800 font-mono font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Plafon Per Porsi (Rp)</label>
                    <input
                      type="number"
                      min="0"
                      value={newTablePlafon}
                      onChange={(e) => setNewTablePlafon(Math.max(0, Number(e.target.value)))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs p-2.5 text-slate-800 font-mono font-bold"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddTableForm(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!newTableName.trim()) {
                        alert("Nama tabel/komponen harus diisi.");
                        return;
                      }
                      const tableId = `custom_table_${Date.now()}`;
                      const defaultTkpiId = tkpiList[0]?.id || "beras_giling";
                      const newTableObj = {
                        id: tableId,
                        namaTabel: newTableName,
                        porsi: newTablePorsi,
                        pmCount: newTablePmCount,
                        plafon: newTablePlafon,
                        akgType: newTablePorsi === "besar" ? "sd_besar" : "sd_kecil",
                        bufferPct: 5,
                        kriteriaPm: newTablePorsi === "besar" ? "PM Porsi Besar Baru" : "PM Porsi Kecil Baru",
                        bahanList: [
                          {
                            id: `custom_row_${Date.now()}_1`,
                            tkpiId: defaultTkpiId,
                            beratBB: 50,
                            urt: "1 porsi",
                            hargaSatuan: 20000
                          }
                        ]
                      };
                      setCustomTables([...customTables, newTableObj]);
                      setShowAddTableForm(false);
                    }}
                    className="px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl"
                  >
                    Simpan Tabel Komponen Baru
                  </button>
                </div>
              </div>
            )}

            {/* Custom Tables List */}
            {customTables.map((table) => {
              return (
                <div key={table.id} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-3 p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
                    <div className="space-y-1 flex-grow">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${table.porsi === "besar" ? "bg-amber-500" : "bg-cyan-500"}`}></span>
                        <input
                          type="text"
                          value={table.namaTabel}
                          onChange={(e) => editCustomTableMeta(table.id, "namaTabel", e.target.value)}
                          className="font-extrabold text-slate-800 text-xs bg-slate-50 hover:bg-slate-100 border border-transparent hover:border-slate-200 focus:bg-white focus:border-indigo-500 rounded px-2 py-1 focus:outline-none"
                        />
                        <span className="text-[9px] font-black uppercase text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">Tabel Baru</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400 font-semibold pl-4">
                        <div className="flex items-center gap-1">
                          Plafon: 
                          <input
                            type="number"
                            value={table.plafon || ""}
                            onChange={(e) => editCustomTableMeta(table.id, "plafon", Number(e.target.value))}
                            className="w-16 font-mono text-xs font-bold text-slate-700 bg-slate-50 border border-slate-100 rounded px-1 text-right"
                          />
                          / porsi
                        </div>
                        <div className="flex items-center gap-1">
                          Jumlah PM: 
                          <input
                            type="number"
                            value={table.pmCount || ""}
                            onChange={(e) => editCustomTableMeta(table.id, "pmCount", Number(e.target.value))}
                            className="w-12 font-mono text-xs font-bold text-slate-700 bg-slate-50 border border-slate-100 rounded px-1 text-center"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => addIngredientToCustomTable(table.id)}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-xs font-bold transition shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Tambah Bahan Baku
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteCustomTable(table.id)}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold transition shadow-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Hapus Tabel
                      </button>
                    </div>
                  </div>

                  {renderCustomFoodCostTable(table, false)}

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                      Rujukan AKG Aktif:
                    </span>
                    <select
                      value={table.akgType || (table.porsi === "besar" ? "sd_besar" : "sd_kecil")}
                      onChange={(e) => editCustomTableMeta(table.id, "akgType", e.target.value)}
                      className="bg-white border border-slate-200 rounded-lg text-xs px-2 py-1 text-slate-700 font-bold focus:outline-none"
                    >
                      {Object.entries(TARGET_AKG_LIMITS).map(([key, val]) => (
                        <option key={key} value={key}>
                          {val.label}
                        </option>
                      ))}
                      <option value="custom">✍️ Target Kustom (Input Manual)</option>
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- VIEW MODE: PRATINJAU CETAK A4 & EXPORT --- */}
      {viewMode === "print" && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 no-print">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-2 border-b border-slate-100 gap-3">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Sesuaikan KOP Surat & Cetak / Ekspor</h4>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  id="btn-fc-export-excel"
                  type="button"
                  onClick={handleExportExcel}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Unduh Excel (.XLSX)
                </button>
                <button
                  id="btn-fc-download-img"
                  type="button"
                  disabled={!!isDownloading}
                  onClick={() => downloadElementAsImage("print-area-food-cost", `Food_Cost_Hari_${selectedDay}_${selectedType}`, setIsDownloading)}
                  className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition"
                >
                  <ImageIcon className="w-4 h-4" />
                  {isDownloading === "Memproses gambar..." || isDownloading === "Mengunduh gambar..." ? isDownloading : "Unduh Gambar (PNG)"}
                </button>
                <button
                  id="btn-fc-print"
                  type="button"
                  onClick={() => window.print()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition"
                >
                  <Printer className="w-4 h-4" />
                  Cetak / Simpan PDF (A4 Landscape)
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
                <label className="text-[10px] font-bold text-slate-400 uppercase">KOP Baris 4 (Alamat SPPG)</label>
                <input
                  type="text"
                  value={kopLine4}
                  onChange={(e) => setKopLine4(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs p-2 text-slate-800"
                />
              </div>
            </div>
            <p className="text-[10px] text-slate-400 italic">
              Tip: Menyesuaikan KOP di sini otomatis memperbarui KOP Master Menu. Tekan Cetak untuk mencetak langsung dengan presisi A4 Landscape.
            </p>
          </div>

          <div className="bg-slate-100 p-6 rounded-2xl border border-slate-300 shadow-inner flex justify-center no-print overflow-x-auto">
            <div 
              id="print-area-food-cost" 
              className="bg-white p-8 border border-slate-400 shadow-md w-full max-w-[297mm] min-w-[210mm] font-sans text-slate-950 print:text-black print:border-none print:shadow-none print:p-0 print:m-0 space-y-10"
            >
              {/* SHEET 1: PORSI BESAR PAGE */}
              <div className="space-y-6 print:break-after-page">
                <div className="relative flex items-center justify-between pb-3 border-b-2 border-black w-full" style={{ minHeight: '90px' }}>
                  {/* Left Logo Container */}
                  <div className="flex flex-col items-center justify-center w-20 h-20 shrink-0 relative">
                    <img 
                      src={leftLogo} 
                      alt="Logo Kiri" 
                      className="w-16 h-16 object-contain" 
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/src/assets/images/logo_sppg_1782256222616.jpg";
                      }}
                    />
                  </div>

                  {/* Centered Kop Text */}
                  <div className="text-center font-sans tracking-wide leading-snug px-4 flex-1">
                    <div className="font-bold uppercase text-slate-950 print:text-black font-sans leading-none" style={{ fontSize: '14pt' }}>{kopLine1}</div>
                    <div className="font-bold uppercase text-slate-950 print:text-black font-sans leading-none mt-1" style={{ fontSize: '13pt' }}>{kopLine2}</div>
                    <div className="font-bold uppercase text-slate-950 print:text-black font-sans leading-none mt-1" style={{ fontSize: '13pt' }}>{kopLine3}</div>
                    <div className="italic text-slate-800 print:text-black font-sans mt-1.5" style={{ fontSize: '10pt' }}>{kopLine4}</div>
                  </div>

                  {/* Right Logo Container */}
                  <div className="flex flex-col items-center justify-center w-20 h-20 shrink-0 relative">
                    {rightLogo ? (
                      <img 
                        src={rightLogo} 
                        alt="Logo Kanan" 
                        className="w-16 h-16 object-contain" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-16 h-16 border border-dashed border-slate-300 rounded flex items-center justify-center text-[8px] text-slate-400 font-bold uppercase no-print">
                        Logo Kanan
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-center space-y-1">
                  <h3 className="font-black text-black uppercase tracking-wide" style={{ fontSize: '13pt' }}>
                    LAPORAN KOMPONEN BAHAN BAKU & FOOD COST - PORSI BESAR
                  </h3>
                  <p className="text-xs font-bold text-slate-700 uppercase">
                    SIKLUS HARI KE-{selectedDay} ({selectedType}) | NAMA MENU: {namaMenuHariIni || "-"} | JUMLAH PM: {pmBesar} ORANG
                  </p>
                </div>

                {renderFoodCostTable("besar", true)}
              </div>

              {/* SHEET 2: PORSI KECIL PAGE */}
              <div className="space-y-6 print:break-before-page pt-10 print:pt-0">
                <div className="relative flex items-center justify-between pb-3 border-b-2 border-black w-full" style={{ minHeight: '90px' }}>
                  {/* Left Logo Container */}
                  <div className="flex flex-col items-center justify-center w-20 h-20 shrink-0 relative">
                    <img 
                      src={leftLogo} 
                      alt="Logo Kiri" 
                      className="w-16 h-16 object-contain" 
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/src/assets/images/logo_sppg_1782256222616.jpg";
                      }}
                    />
                  </div>

                  {/* Centered Kop Text */}
                  <div className="text-center font-sans tracking-wide leading-snug px-4 flex-1">
                    <div className="font-bold uppercase text-slate-950 print:text-black font-sans leading-none" style={{ fontSize: '14pt' }}>{kopLine1}</div>
                    <div className="font-bold uppercase text-slate-950 print:text-black font-sans leading-none mt-1" style={{ fontSize: '13pt' }}>{kopLine2}</div>
                    <div className="font-bold uppercase text-slate-950 print:text-black font-sans leading-none mt-1" style={{ fontSize: '13pt' }}>{kopLine3}</div>
                    <div className="italic text-slate-800 print:text-black font-sans mt-1.5" style={{ fontSize: '10pt' }}>{kopLine4}</div>
                  </div>

                  {/* Right Logo Container */}
                  <div className="flex flex-col items-center justify-center w-20 h-20 shrink-0 relative">
                    {rightLogo ? (
                      <img 
                        src={rightLogo} 
                        alt="Logo Kanan" 
                        className="w-16 h-16 object-contain" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-16 h-16 border border-dashed border-slate-300 rounded flex items-center justify-center text-[8px] text-slate-400 font-bold uppercase no-print">
                        Logo Kanan
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-center space-y-1">
                  <h3 className="font-black text-black uppercase tracking-wide" style={{ fontSize: '13pt' }}>
                    LAPORAN KOMPONEN BAHAN BAKU & FOOD COST - PORSI KECIL
                  </h3>
                  <p className="text-xs font-bold text-slate-700 uppercase">
                    SIKLUS HARI KE-{selectedDay} ({selectedType}) | NAMA MENU: {namaMenuHariIni || "-"} | JUMLAH PM: {pmKecil} ORANG
                  </p>
                </div>

                {renderFoodCostTable("kecil", true)}
              </div>

              {/* SHEETS FOR CUSTOM TABLES */}
              {customTables.map((table) => {
                return (
                  <div key={table.id} className="space-y-6 print:break-before-page pt-10 print:pt-0">
                    <div className="relative flex items-center justify-between pb-3 border-b-2 border-black w-full" style={{ minHeight: '90px' }}>
                      {/* Left Logo Container */}
                      <div className="flex flex-col items-center justify-center w-20 h-20 shrink-0 relative">
                        <img 
                          src={leftLogo} 
                          alt="Logo Kiri" 
                          className="w-16 h-16 object-contain" 
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/src/assets/images/logo_sppg_1782256222616.jpg";
                          }}
                        />
                      </div>

                      {/* Centered Kop Text */}
                      <div className="text-center font-sans tracking-wide leading-snug px-4 flex-1">
                        <div className="font-bold uppercase text-slate-950 print:text-black font-sans leading-none" style={{ fontSize: '14pt' }}>{kopLine1}</div>
                        <div className="font-bold uppercase text-slate-950 print:text-black font-sans leading-none mt-1" style={{ fontSize: '13pt' }}>{kopLine2}</div>
                        <div className="font-bold uppercase text-slate-950 print:text-black font-sans leading-none mt-1" style={{ fontSize: '13pt' }}>{kopLine3}</div>
                        <div className="italic text-slate-800 print:text-black font-sans mt-1.5" style={{ fontSize: '10pt' }}>{kopLine4}</div>
                      </div>

                      {/* Right Logo Container */}
                      <div className="flex flex-col items-center justify-center w-20 h-20 shrink-0 relative">
                        {rightLogo ? (
                          <img 
                            src={rightLogo} 
                            alt="Logo Kanan" 
                            className="w-16 h-16 object-contain" 
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-16 h-16 border border-dashed border-slate-300 rounded flex items-center justify-center text-[8px] text-slate-400 font-bold uppercase no-print">
                            Logo Kanan
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-center space-y-1">
                      <h3 className="font-black text-black uppercase tracking-wide" style={{ fontSize: '13pt' }}>
                        LAPORAN KOMPONEN BAHAN BAKU & FOOD COST - {table.namaTabel.toUpperCase()}
                      </h3>
                      <p className="text-xs font-bold text-slate-700 uppercase">
                        SIKLUS HARI KE-{selectedDay} | PORSI: {table.porsi.toUpperCase()} | JUMLAH PM: {table.pmCount} ORANG
                      </p>
                    </div>

                    {renderCustomFoodCostTable(table, true)}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* CALCULATOR POPUP MODAL */}
      {activeCalcField && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in no-print">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl w-full max-w-sm overflow-hidden flex flex-col relative text-white">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-indigo-400" />
                <span className="font-sans font-bold text-sm tracking-wide text-indigo-200">
                  Kalkulator: {activeCalcField.field.toUpperCase()}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveCalcField(null)}
                className="text-slate-400 hover:text-white hover:bg-slate-800 p-1 rounded-full transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Display Screen */}
            <div className="bg-slate-950 p-4 rounded-2xl mb-4 border border-slate-800 text-right font-mono flex flex-col justify-between min-h-[84px]">
              <div className="text-slate-400 text-sm overflow-x-auto whitespace-nowrap scrollbar-none min-h-[20px]">
                {calcExpr || "0"}
              </div>
              <div className="text-white text-2xl font-bold truncate">
                {calcResult || "0"}
              </div>
            </div>

            {/* Keypad Grid */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {/* Row 1 */}
              <button
                type="button"
                onClick={() => handleCalcKeyPress("C")}
                className="p-3 bg-rose-950 hover:bg-rose-900 border border-rose-900 text-rose-300 font-bold rounded-xl text-center text-sm transition-all"
              >
                C
              </button>
              <button
                type="button"
                onClick={() => handleCalcKeyPress("(")}
                className="p-3 bg-slate-800 hover:bg-slate-700 text-indigo-300 font-bold rounded-xl text-center text-sm transition-all"
              >
                (
              </button>
              <button
                type="button"
                onClick={() => handleCalcKeyPress(")")}
                className="p-3 bg-slate-800 hover:bg-slate-700 text-indigo-300 font-bold rounded-xl text-center text-sm transition-all"
              >
                )
              </button>
              <button
                type="button"
                onClick={() => handleCalcKeyPress("/")}
                className="p-3 bg-indigo-950 hover:bg-indigo-900 border border-indigo-900 text-indigo-300 font-bold rounded-xl text-center text-sm transition-all"
              >
                ÷
              </button>

              {/* Row 2 */}
              <button
                type="button"
                onClick={() => handleCalcKeyPress("7")}
                className="p-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-center text-sm transition-all"
              >
                7
              </button>
              <button
                type="button"
                onClick={() => handleCalcKeyPress("8")}
                className="p-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-center text-sm transition-all"
              >
                8
              </button>
              <button
                type="button"
                onClick={() => handleCalcKeyPress("9")}
                className="p-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-center text-sm transition-all"
              >
                9
              </button>
              <button
                type="button"
                onClick={() => handleCalcKeyPress("*")}
                className="p-3 bg-indigo-950 hover:bg-indigo-900 border border-indigo-900 text-indigo-300 font-bold rounded-xl text-center text-sm transition-all"
              >
                ×
              </button>

              {/* Row 3 */}
              <button
                type="button"
                onClick={() => handleCalcKeyPress("4")}
                className="p-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-center text-sm transition-all"
              >
                4
              </button>
              <button
                type="button"
                onClick={() => handleCalcKeyPress("5")}
                className="p-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-center text-sm transition-all"
              >
                5
              </button>
              <button
                type="button"
                onClick={() => handleCalcKeyPress("6")}
                className="p-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-center text-sm transition-all"
              >
                6
              </button>
              <button
                type="button"
                onClick={() => handleCalcKeyPress("-")}
                className="p-3 bg-indigo-950 hover:bg-indigo-900 border border-indigo-900 text-indigo-300 font-bold rounded-xl text-center text-sm transition-all"
              >
                -
              </button>

              {/* Row 4 */}
              <button
                type="button"
                onClick={() => handleCalcKeyPress("1")}
                className="p-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-center text-sm transition-all"
              >
                1
              </button>
              <button
                type="button"
                onClick={() => handleCalcKeyPress("2")}
                className="p-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-center text-sm transition-all"
              >
                2
              </button>
              <button
                type="button"
                onClick={() => handleCalcKeyPress("3")}
                className="p-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-center text-sm transition-all"
              >
                3
              </button>
              <button
                type="button"
                onClick={() => handleCalcKeyPress("+")}
                className="p-3 bg-indigo-950 hover:bg-indigo-900 border border-indigo-900 text-indigo-300 font-bold rounded-xl text-center text-sm transition-all"
              >
                +
              </button>

              {/* Row 5 */}
              <button
                type="button"
                onClick={() => handleCalcKeyPress("0")}
                className="p-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-center text-sm transition-all col-span-2"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => handleCalcKeyPress(".")}
                className="p-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-center text-sm transition-all"
              >
                .
              </button>
              <button
                type="button"
                onClick={() => handleCalcKeyPress("Del")}
                className="p-3 bg-rose-950 hover:bg-rose-900 border border-rose-900 text-rose-300 font-bold rounded-xl text-center text-sm transition-all"
              >
                ⌫
              </button>
            </div>

            {/* Actions Panel */}
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                type="button"
                onClick={() => setActiveCalcField(null)}
                className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-sm transition-all uppercase"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => saveCalculatorResult(calcResult || calcExpr)}
                className="py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-sm transition-all shadow-md shadow-emerald-950/20 uppercase"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BUFFER & JUMLAH CONFIG MODAL */}
      {activeBufferConfig && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in no-print p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col relative text-slate-800 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 leading-tight">
                    Konfigurasi Penyusutan (Buffer) & Jumlah + Buffer
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Bahan: <span className="text-indigo-600 font-bold font-mono">{activeBufferConfig.namaBahan}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveBufferConfig(null)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-full transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-1">
              
              {/* Bagian 1: BUFFER */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-5 h-5 bg-indigo-100 text-indigo-700 text-xs font-black rounded-full">
                    1
                  </span>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Pilih Basis Perhitungan Nilai Penyusutan (Buffer)
                  </h4>
                </div>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Tentukan basis perhitungan untuk menentukan nilai penyusutan (Buffer):
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Option: Total Kilogram */}
                  <label
                    onClick={() => setActiveBufferConfig({ ...activeBufferConfig, bufferBase: "kg" })}
                    className={`p-3 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                      activeBufferConfig.bufferBase === "kg"
                        ? "bg-indigo-50/50 border-indigo-400 ring-2 ring-indigo-100 shadow-xs"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="bufferBase"
                      checked={activeBufferConfig.bufferBase === "kg"}
                      onChange={() => {}}
                      className="mt-1 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer shrink-0"
                    />
                    <div className="space-y-0.5 leading-snug">
                      <span className="text-xs font-extrabold text-slate-800 block">
                        Total kilogram
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium block leading-tight">
                        Penyusutan dihitung berdasarkan total berat kebutuhan bersih (KG)
                      </span>
                    </div>
                  </label>

                  {/* Option: Total Potongan */}
                  <label
                    onClick={() => setActiveBufferConfig({ ...activeBufferConfig, bufferBase: "potong" })}
                    className={`p-3 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                      activeBufferConfig.bufferBase === "potong"
                        ? "bg-indigo-50/50 border-indigo-400 ring-2 ring-indigo-100 shadow-xs"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="bufferBase"
                      checked={activeBufferConfig.bufferBase === "potong"}
                      onChange={() => {}}
                      className="mt-1 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer shrink-0"
                    />
                    <div className="space-y-0.5 leading-snug">
                      <span className="text-xs font-extrabold text-slate-800 block">
                        Total potongan
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium block leading-tight">
                        Penyusutan dihitung berdasarkan total jumlah potong porsi PM
                      </span>
                    </div>
                  </label>

                  {/* Option: Total Ekor */}
                  <label
                    onClick={() => setActiveBufferConfig({ ...activeBufferConfig, bufferBase: "ekor" })}
                    className={`p-3 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                      activeBufferConfig.bufferBase === "ekor"
                        ? "bg-indigo-50/50 border-indigo-400 ring-2 ring-indigo-100 shadow-xs"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="bufferBase"
                      checked={activeBufferConfig.bufferBase === "ekor"}
                      onChange={() => {}}
                      className="mt-1 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer shrink-0"
                    />
                    <div className="space-y-0.5 leading-snug">
                      <span className="text-xs font-extrabold text-slate-800 block">
                        Total ekor
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium block leading-tight">
                        Penyusutan dihitung berdasarkan total jumlah ekor porsi PM
                      </span>
                    </div>
                  </label>

                  {/* Option: Custom Manual Input */}
                  <label
                    onClick={() => setActiveBufferConfig({ ...activeBufferConfig, bufferBase: "custom" })}
                    className={`p-3 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                      activeBufferConfig.bufferBase === "custom"
                        ? "bg-rose-50/50 border-rose-400 ring-2 ring-rose-100 shadow-xs"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="bufferBase"
                      checked={activeBufferConfig.bufferBase === "custom"}
                      onChange={() => {}}
                      className="mt-1 text-rose-600 focus:ring-rose-500 h-4 w-4 cursor-pointer shrink-0"
                    />
                    <div className="space-y-0.5 leading-snug">
                      <span className="text-xs font-extrabold text-rose-800 block">
                        Gunakan Manual (Custom)
                      </span>
                      <span className="text-[10px] text-rose-500 font-medium block leading-tight">
                        Gunakan angka kustom manual sebagai basis penyusutan
                      </span>
                    </div>
                  </label>
                </div>

                {/* If custom is selected for Buffer */}
                {activeBufferConfig.bufferBase === "custom" && (
                  <div className="p-3 bg-rose-50/60 border border-rose-200 rounded-2xl space-y-1 mt-2 animate-in slide-in-from-top-2 duration-150">
                    <label className="text-[10px] font-black text-rose-800 uppercase tracking-wider block">
                      Isi Nilai Custom Buffer
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: 15"
                      value={activeBufferConfig.bufferCustomVal ?? ""}
                      onChange={(e) => setActiveBufferConfig({ ...activeBufferConfig, bufferCustomVal: e.target.value })}
                      className="w-full max-w-xs text-xs border border-rose-200 rounded-xl bg-white p-2 text-rose-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                )}
              </div>

              {/* Bagian 2: JUMLAH & BUFFER */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-5 h-5 bg-indigo-100 text-indigo-700 text-xs font-black rounded-full">
                    2
                  </span>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Pilih Basis Perhitungan Nilai Jumlah + Buffer
                  </h4>
                </div>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Pilih nilai dasar yang akan ditambahkan dengan buffer untuk masuk secara otomatis ke kolom <strong>Jumlah + Buffer</strong>:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Option: Total kilo */}
                  <label
                    onClick={() => setActiveBufferConfig({ ...activeBufferConfig, jumlahBufferChoice: "kg_without" })}
                    className={`p-3 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                      activeBufferConfig.jumlahBufferChoice === "kg_without"
                        ? "bg-indigo-50/50 border-indigo-400 ring-2 ring-indigo-100 shadow-xs"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="jumlahBufferChoice"
                      checked={activeBufferConfig.jumlahBufferChoice === "kg_without"}
                      onChange={() => {}}
                      className="mt-1 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer shrink-0"
                    />
                    <div className="space-y-0.5 leading-snug">
                      <span className="text-xs font-extrabold text-slate-800 block">
                        Total kilo
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium block leading-tight">
                        Mengambil nilai berat total (kg) saja tanpa buffer
                      </span>
                    </div>
                  </label>

                  {/* Option: Kilogram */}
                  <label
                    onClick={() => setActiveBufferConfig({ ...activeBufferConfig, jumlahBufferChoice: "kilogram_without" })}
                    className={`p-3 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                      activeBufferConfig.jumlahBufferChoice === "kilogram_without"
                        ? "bg-indigo-50/50 border-indigo-400 ring-2 ring-indigo-100 shadow-xs"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="jumlahBufferChoice"
                      checked={activeBufferConfig.jumlahBufferChoice === "kilogram_without"}
                      onChange={() => {}}
                      className="mt-1 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer shrink-0"
                    />
                    <div className="space-y-0.5 leading-snug">
                      <span className="text-xs font-extrabold text-slate-800 block">
                        Kilogram
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium block leading-tight">
                        Mengambil nilai kilogram dasar (kg) saja tanpa buffer
                      </span>
                    </div>
                  </label>

                  {/* Option: Total potong */}
                  <label
                    onClick={() => setActiveBufferConfig({ ...activeBufferConfig, jumlahBufferChoice: "potong_without" })}
                    className={`p-3 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                      activeBufferConfig.jumlahBufferChoice === "potong_without"
                        ? "bg-indigo-50/50 border-indigo-400 ring-2 ring-indigo-100 shadow-xs"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="jumlahBufferChoice"
                      checked={activeBufferConfig.jumlahBufferChoice === "potong_without"}
                      onChange={() => {}}
                      className="mt-1 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer shrink-0"
                    />
                    <div className="space-y-0.5 leading-snug">
                      <span className="text-xs font-extrabold text-slate-800 block">
                        Total potong
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium block leading-tight">
                        Mengambil nilai total potongan porsi saja tanpa buffer
                      </span>
                    </div>
                  </label>

                  {/* Option: Total ekor */}
                  <label
                    onClick={() => setActiveBufferConfig({ ...activeBufferConfig, jumlahBufferChoice: "ekor_without" })}
                    className={`p-3 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                      activeBufferConfig.jumlahBufferChoice === "ekor_without"
                        ? "bg-indigo-50/50 border-indigo-400 ring-2 ring-indigo-100 shadow-xs"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="jumlahBufferChoice"
                      checked={activeBufferConfig.jumlahBufferChoice === "ekor_without"}
                      onChange={() => {}}
                      className="mt-1 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer shrink-0"
                    />
                    <div className="space-y-0.5 leading-snug">
                      <span className="text-xs font-extrabold text-slate-800 block">
                        Total ekor
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium block leading-tight">
                        Mengambil nilai total ekor porsi saja tanpa buffer
                      </span>
                    </div>
                  </label>

                  {/* Option: Total kilo + total nilai buffer */}
                  <label
                    onClick={() => setActiveBufferConfig({ ...activeBufferConfig, jumlahBufferChoice: "kg_with" })}
                    className={`p-3 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                      activeBufferConfig.jumlahBufferChoice === "kg_with"
                        ? "bg-indigo-50/50 border-indigo-400 ring-2 ring-indigo-100 shadow-xs"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="jumlahBufferChoice"
                      checked={activeBufferConfig.jumlahBufferChoice === "kg_with"}
                      onChange={() => {}}
                      className="mt-1 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer shrink-0"
                    />
                    <div className="space-y-0.5 leading-snug">
                      <span className="text-xs font-extrabold text-slate-800 block">
                        Total kilo + total nilai buffer
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium block leading-tight">
                        Kebutuhan (kg) ditambah nilai penyusutan (buffer)
                      </span>
                    </div>
                  </label>

                  {/* Option: Kilogram + total nilai buffer */}
                  <label
                    onClick={() => setActiveBufferConfig({ ...activeBufferConfig, jumlahBufferChoice: "kilogram_with" })}
                    className={`p-3 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                      activeBufferConfig.jumlahBufferChoice === "kilogram_with"
                        ? "bg-indigo-50/50 border-indigo-400 ring-2 ring-indigo-100 shadow-xs"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="jumlahBufferChoice"
                      checked={activeBufferConfig.jumlahBufferChoice === "kilogram_with"}
                      onChange={() => {}}
                      className="mt-1 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer shrink-0"
                    />
                    <div className="space-y-0.5 leading-snug">
                      <span className="text-xs font-extrabold text-slate-800 block">
                        Kilogram + total nilai buffer
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium block leading-tight">
                        Kilogram dasar ditambah nilai penyusutan (buffer)
                      </span>
                    </div>
                  </label>

                  {/* Option: Total potong + total nilai buffer */}
                  <label
                    onClick={() => setActiveBufferConfig({ ...activeBufferConfig, jumlahBufferChoice: "potong_with" })}
                    className={`p-3 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                      activeBufferConfig.jumlahBufferChoice === "potong_with"
                        ? "bg-indigo-50/50 border-indigo-400 ring-2 ring-indigo-100 shadow-xs"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="jumlahBufferChoice"
                      checked={activeBufferConfig.jumlahBufferChoice === "potong_with"}
                      onChange={() => {}}
                      className="mt-1 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer shrink-0"
                    />
                    <div className="space-y-0.5 leading-snug">
                      <span className="text-xs font-extrabold text-slate-800 block">
                        Total potong + total nilai buffer
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium block leading-tight">
                        Total potongan porsi ditambah nilai penyusutan (buffer)
                      </span>
                    </div>
                  </label>

                  {/* Option: Total ekor + total nilai buffer */}
                  <label
                    onClick={() => setActiveBufferConfig({ ...activeBufferConfig, jumlahBufferChoice: "ekor_with" })}
                    className={`p-3 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                      activeBufferConfig.jumlahBufferChoice === "ekor_with"
                        ? "bg-indigo-50/50 border-indigo-400 ring-2 ring-indigo-100 shadow-xs"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="jumlahBufferChoice"
                      checked={activeBufferConfig.jumlahBufferChoice === "ekor_with"}
                      onChange={() => {}}
                      className="mt-1 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer shrink-0"
                    />
                    <div className="space-y-0.5 leading-snug">
                      <span className="text-xs font-extrabold text-slate-800 block">
                        Total ekor + total nilai buffer
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium block leading-tight">
                        Total ekor porsi ditambah nilai penyusutan (buffer)
                      </span>
                    </div>
                  </label>

                  {/* Option: Custom Manual (With Buffer) */}
                  <label
                    onClick={() => setActiveBufferConfig({ ...activeBufferConfig, jumlahBufferChoice: "custom_with" })}
                    className={`p-3 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                      activeBufferConfig.jumlahBufferChoice === "custom_with"
                        ? "bg-rose-50/50 border-rose-400 ring-2 ring-rose-100 shadow-xs"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="jumlahBufferChoice"
                      checked={activeBufferConfig.jumlahBufferChoice === "custom_with"}
                      onChange={() => {}}
                      className="mt-1 text-rose-600 focus:ring-rose-500 h-4 w-4 cursor-pointer shrink-0"
                    />
                    <div className="space-y-0.5 leading-snug">
                      <span className="text-xs font-extrabold text-rose-800 block">
                        Manual Custom + Nilai Buffer
                      </span>
                      <span className="text-[10px] text-rose-500 font-medium block leading-tight">
                        Angka kustom manual ditambah nilai penyusutan (buffer)
                      </span>
                    </div>
                  </label>

                  {/* Option: Custom Manual (Without Buffer) */}
                  <label
                    onClick={() => setActiveBufferConfig({ ...activeBufferConfig, jumlahBufferChoice: "custom_without" })}
                    className={`p-3 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                      activeBufferConfig.jumlahBufferChoice === "custom_without"
                        ? "bg-rose-50/50 border-rose-400 ring-2 ring-rose-100 shadow-xs"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="jumlahBufferChoice"
                      checked={activeBufferConfig.jumlahBufferChoice === "custom_without"}
                      onChange={() => {}}
                      className="mt-1 text-rose-600 focus:ring-rose-500 h-4 w-4 cursor-pointer shrink-0"
                    />
                    <div className="space-y-0.5 leading-snug">
                      <span className="text-xs font-extrabold text-rose-800 block">
                        Hanya Ambil Manual Custom Saja
                      </span>
                      <span className="text-[10px] text-rose-500 font-medium block leading-tight">
                        Angka kustom manual saja tanpa tambahan buffer
                      </span>
                    </div>
                  </label>
                </div>

                {/* If custom is selected for Jumlah */}
                {(activeBufferConfig.jumlahBufferChoice === "custom_with" || activeBufferConfig.jumlahBufferChoice === "custom_without") && (
                  <div className="p-3 bg-rose-50/60 border border-rose-200 rounded-2xl space-y-1 mt-2 animate-in slide-in-from-top-2 duration-150">
                    <label className="text-[10px] font-black text-rose-800 uppercase tracking-wider block">
                      Isi Nilai Custom Jumlah
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: 120"
                      value={activeBufferConfig.jumlahBufferCustomVal ?? ""}
                      onChange={(e) => setActiveBufferConfig({ ...activeBufferConfig, jumlahBufferCustomVal: e.target.value })}
                      className="w-full max-w-xs text-xs border border-rose-200 rounded-xl bg-white p-2 text-rose-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                )}
              </div>

            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveBufferConfig(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => saveBufferConfig(activeBufferConfig)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold rounded-xl transition shadow-md shadow-indigo-100 cursor-pointer"
              >
                Simpan Konfigurasi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM NON-BLOCKING CONFIRMATION MODAL */}
      {confirmModal.isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 no-print animate-fade-in"
          onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        >
          <div 
            className="bg-white border border-slate-100 rounded-3xl p-6 shadow-2xl w-full max-w-sm animate-in zoom-in-95 duration-150 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3.5">
              <div className={`p-2.5 rounded-full shrink-0 ${
                confirmModal.variant === "warning" 
                  ? "bg-amber-50 text-amber-600" 
                  : confirmModal.variant === "info" 
                    ? "bg-indigo-50 text-indigo-600" 
                    : "bg-rose-50 text-rose-600"
              }`}>
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-black text-slate-900 text-sm tracking-tight">
                  {confirmModal.title}
                </h4>
                <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                  {confirmModal.message}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                {confirmModal.cancelText || "Batal"}
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className={`px-4 py-2 text-xs font-black text-white rounded-xl transition shadow-xs ${
                  confirmModal.variant === "warning"
                    ? "bg-amber-600 hover:bg-amber-700"
                    : confirmModal.variant === "info"
                      ? "bg-indigo-600 hover:bg-indigo-700"
                      : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                {confirmModal.confirmText || "Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
