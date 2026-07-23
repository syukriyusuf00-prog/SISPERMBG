/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useMemo, memo } from "react";
import { TKPIItem } from "../types";
import { ChevronDown, AlertCircle, Plus } from "lucide-react";

interface SearchableTkpiDropdownProps {
  tkpiList: TKPIItem[];
  selectedValue: string;
  onChange: (tkpiId: string) => void;
  id?: string;
  minimal?: boolean;
}

function SearchableTkpiDropdownComponent({
  tkpiList,
  selectedValue,
  onChange,
  id,
  minimal = false
}: SearchableTkpiDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [displayLimit, setDisplayLimit] = useState(25);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Indexed Map for O(1) selected item lookup
  const tkpiMap = useMemo(() => {
    const map = new Map<string, TKPIItem>();
    for (let i = 0; i < tkpiList.length; i++) {
      map.set(tkpiList[i].id, tkpiList[i]);
    }
    return map;
  }, [tkpiList]);

  const selectedItem = tkpiMap.get(selectedValue);

  // Sync state when selection changes
  useEffect(() => {
    if (selectedItem) {
      setSearchQuery(selectedItem.nama || "");
    } else {
      setSearchQuery("");
    }
  }, [selectedValue, selectedItem]);

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        if (selectedItem) {
          setSearchQuery(selectedItem.nama || "");
        } else {
          setSearchQuery("");
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [selectedItem]);

  // Memoized filter list based on search input
  const filteredList = useMemo(() => {
    if (!searchQuery) return tkpiList;
    const q = searchQuery.toLowerCase();
    
    return tkpiList.filter((item) => {
      const nameMatch = (item.nama || "").toLowerCase().includes(q);
      const categoryMatch = (item.kategori || "").toLowerCase().includes(q);
      const sourceMatch = (item.sumber || "").toLowerCase().includes(q);
      
      return nameMatch || categoryMatch || sourceMatch;
    });
  }, [tkpiList, searchQuery]);

  // Staged data slice
  const visibleItems = useMemo(() => {
    return filteredList.slice(0, displayLimit);
  }, [filteredList, displayLimit]);

  const handleSelect = (item: TKPIItem) => {
    onChange(item.id);
    setSearchQuery(item.nama);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative w-full" id={id}>
      <div className="relative flex items-center justify-center">
        <input
          type="text"
          value={searchQuery}
          onFocus={(e) => {
            setIsOpen(true);
            setDisplayLimit(25);
            e.target.select();
          }}
          onChange={(e) => {
            setIsOpen(true);
            setDisplayLimit(25);
            setSearchQuery(e.target.value);
          }}
          placeholder={minimal ? "Pilih bahan..." : "Ketik untuk mencari bahan..."}
          className={
            minimal
              ? "w-full bg-transparent hover:bg-slate-50 border-0 focus:ring-1 focus:ring-indigo-500 font-bold p-0.5 text-xs text-slate-950 text-center pr-3 focus:bg-white"
              : "w-full bg-white border border-slate-200 rounded p-1.5 pr-8 text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-sm"
          }
        />
        <button
          type="button"
          onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen) setDisplayLimit(25);
          }}
          className={
            minimal
              ? "absolute right-0 top-0 bottom-0 px-0.5 flex items-center justify-center text-slate-400 hover:text-slate-600"
              : "absolute right-0 top-0 bottom-0 px-2 flex items-center justify-center text-slate-400 hover:text-slate-600"
          }
        >
          <ChevronDown className={minimal ? "w-2.5 h-2.5" : "w-3.5 h-3.5"} />
        </button>
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto divide-y divide-slate-50">
          {filteredList.length > 0 ? (
            <>
              {visibleItems.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleSelect(t)}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-50 transition flex flex-col space-y-0.5 ${t.id === selectedValue ? "bg-indigo-50/50 font-semibold text-indigo-700" : "text-slate-700"}`}
                >
                  <span className="font-bold text-slate-800">{t.nama}</span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    [{t.kategori || t.sumber || "Umum"}] {t.sumber}
                  </span>
                </button>
              ))}
              {filteredList.length > displayLimit && (
                <button
                  type="button"
                  onClick={() => setDisplayLimit((prev) => prev + 25)}
                  className="w-full text-center py-2 text-xs font-bold text-indigo-600 hover:bg-indigo-50/50 flex items-center justify-center gap-1 bg-slate-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tampilkan 25 bahan lagi ({filteredList.length - displayLimit} tersisa)</span>
                </button>
              )}
            </>
          ) : (
            <div className="p-3 text-center text-xs text-rose-600 font-semibold flex flex-col items-center justify-center gap-1.5 bg-rose-50/20">
              <AlertCircle className="w-4 h-4 text-rose-500" />
              <span>(bahan tidak ada hubungi Odhe Gizi|082271095251)</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default memo(SearchableTkpiDropdownComponent);
