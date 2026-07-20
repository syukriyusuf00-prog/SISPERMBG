/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { Calculator, Check, X, CornerDownLeft } from "lucide-react";

interface PriceCalculatorPopoverProps {
  initialValue: number;
  onApply: (value: number) => void;
  className?: string;
  placeholder?: string;
}

export function PriceCalculatorPopover({
  initialValue,
  onApply,
  className = "",
  placeholder = "Kalkulator",
}: PriceCalculatorPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expression, setExpression] = useState("");
  const [result, setResult] = useState<number | null>(null);
  
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Position of the popover
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const calculateCoords = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const scrollY = window.scrollY || window.pageYOffset;
      const scrollX = window.scrollX || window.pageXOffset;
      
      // Try to place it below, if not enough space place it above
      const popoverHeight = 310;
      const popoverWidth = 240;
      
      let top = rect.bottom + scrollY + 4;
      let left = rect.left + scrollX - popoverWidth + rect.width;

      // Boundary check for window edges
      if (left < 10) left = 10;
      if (left + popoverWidth > window.innerWidth - 10) {
        left = window.innerWidth - popoverWidth - 10;
      }
      
      if (rect.bottom + popoverHeight > window.innerHeight && rect.top - popoverHeight > 0) {
        top = rect.top + scrollY - popoverHeight - 4;
      }

      setCoords({ top, left });
    }
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOpen) {
      calculateCoords();
      setExpression(initialValue > 0 ? String(initialValue) : "");
      setResult(initialValue > 0 ? initialValue : 0);
    }
    setIsOpen(!isOpen);
  };

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleResizeOrScroll = () => {
      calculateCoords();
    };

    document.addEventListener("mousedown", handleOutsideClick);
    window.addEventListener("resize", handleResizeOrScroll);
    window.addEventListener("scroll", handleResizeOrScroll, true);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      window.removeEventListener("resize", handleResizeOrScroll);
      window.removeEventListener("scroll", handleResizeOrScroll, true);
    };
  }, [isOpen]);

  // Handle live mathematical evaluation
  const evaluateExpression = (expr: string): number => {
    try {
      // Sanitize the expression to allow only numbers and +, -, *, /, %, (, ), .
      const sanitized = expr.replace(/[^0-9+\-*/%.()\s]/g, "");
      if (!sanitized.trim()) return 0;
      
      const evalFn = new Function(`return (${sanitized})`);
      const val = evalFn();
      if (typeof val === "number" && !isNaN(val) && isFinite(val)) {
        return val;
      }
    } catch (e) {
      // Silent error for incomplete math expressions (e.g., "15000 +")
    }
    return result || 0;
  };

  // Update live preview when expression changes
  useEffect(() => {
    if (expression.trim() === "") {
      setResult(0);
      return;
    }
    const val = evaluateExpression(expression);
    setResult(Math.round(val));
  }, [expression]);

  const appendToExpression = (char: string) => {
    setExpression((prev) => prev + char);
  };

  const clearExpression = () => {
    setExpression("");
    setResult(0);
  };

  const backspaceExpression = () => {
    setExpression((prev) => (prev.length > 0 ? prev.slice(0, -1) : ""));
  };

  const handleEqual = () => {
    const val = evaluateExpression(expression);
    setExpression(String(Math.round(val)));
    setResult(Math.round(val));
  };

  const handleApply = () => {
    const val = evaluateExpression(expression);
    const finalVal = Math.max(0, Math.round(val));
    onApply(finalVal);
    setIsOpen(false);
  };

  // Keyboard support when the calculator is focused/open
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      
      if (key >= "0" && key <= "9") {
        appendToExpression(key);
        e.preventDefault();
      } else if (key === "+" || key === "-" || key === "*" || key === "/" || key === "(" || key === ")") {
        appendToExpression(key);
        e.preventDefault();
      } else if (key === ".") {
        appendToExpression(".");
        e.preventDefault();
      } else if (key === "Enter") {
        handleApply();
        e.preventDefault();
      } else if (key === "=") {
        handleEqual();
        e.preventDefault();
      } else if (key === "Backspace") {
        backspaceExpression();
        e.preventDefault();
      } else if (key === "Escape") {
        setIsOpen(false);
        e.preventDefault();
      } else if (key.toLowerCase() === "c") {
        clearExpression();
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, expression, result]);

  const buttonClasses = "flex items-center justify-center h-10 w-full text-sm font-extrabold rounded-xl transition cursor-pointer select-none";
  const numButtonClasses = `${buttonClasses} bg-slate-50 hover:bg-slate-100 text-slate-800 active:scale-95`;
  const opButtonClasses = `${buttonClasses} bg-indigo-50 hover:bg-indigo-100 text-indigo-700 active:scale-95`;
  const clearButtonClasses = `${buttonClasses} bg-rose-50 hover:bg-rose-100 text-rose-600 active:scale-95`;

  const popoverContent = isOpen ? (
    <div
      ref={popoverRef}
      style={{
        position: "absolute",
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        zIndex: 99999,
      }}
      className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-4 w-[240px] animate-in fade-in zoom-in duration-100 font-sans"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider flex items-center gap-1">
          <Calculator className="w-3 h-3" /> Alat Hitung Harga
        </span>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="text-slate-400 hover:text-slate-600 transition p-0.5 rounded hover:bg-slate-50"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Screen Display */}
      <div className="bg-slate-900 rounded-xl p-3 text-right mb-3 min-h-[64px] flex flex-col justify-between overflow-hidden shadow-inner border border-slate-850">
        <div className="text-[10px] text-slate-400 font-mono font-medium truncate tracking-tight h-4">
          {expression || "0"}
        </div>
        <div className="text-sm font-extrabold text-emerald-400 font-mono tracking-wide truncate">
          {result !== null ? `Rp ${new Intl.NumberFormat("id-ID").format(result)}` : "Rp 0"}
        </div>
      </div>

      {/* Button Grid */}
      <div className="grid grid-cols-4 gap-1.5 mb-3">
        {/* Row 1 */}
        <button type="button" onClick={() => appendToExpression("(")} className={opButtonClasses}>(</button>
        <button type="button" onClick={() => appendToExpression(")")} className={opButtonClasses}>)</button>
        <button type="button" onClick={backspaceExpression} className={clearButtonClasses}>⌫</button>
        <button type="button" onClick={clearExpression} className={clearButtonClasses}>C</button>

        {/* Row 2 */}
        <button type="button" onClick={() => appendToExpression("7")} className={numButtonClasses}>7</button>
        <button type="button" onClick={() => appendToExpression("8")} className={numButtonClasses}>8</button>
        <button type="button" onClick={() => appendToExpression("9")} className={numButtonClasses}>9</button>
        <button type="button" onClick={() => appendToExpression("/")} className={opButtonClasses}>÷</button>

        {/* Row 3 */}
        <button type="button" onClick={() => appendToExpression("4")} className={numButtonClasses}>4</button>
        <button type="button" onClick={() => appendToExpression("5")} className={numButtonClasses}>5</button>
        <button type="button" onClick={() => appendToExpression("6")} className={numButtonClasses}>6</button>
        <button type="button" onClick={() => appendToExpression("*")} className={opButtonClasses}>×</button>

        {/* Row 4 */}
        <button type="button" onClick={() => appendToExpression("1")} className={numButtonClasses}>1</button>
        <button type="button" onClick={() => appendToExpression("2")} className={numButtonClasses}>2</button>
        <button type="button" onClick={() => appendToExpression("3")} className={numButtonClasses}>3</button>
        <button type="button" onClick={() => appendToExpression("-")} className={opButtonClasses}>-</button>

        {/* Row 5 */}
        <button type="button" onClick={() => appendToExpression("0")} className={numButtonClasses}>0</button>
        <button type="button" onClick={() => appendToExpression(".")} className={numButtonClasses}>.</button>
        <button type="button" onClick={handleEqual} className={`${buttonClasses} bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95`}>=</button>
        <button type="button" onClick={() => appendToExpression("+")} className={opButtonClasses}>+</button>
      </div>

      {/* Action / Apply Button */}
      <button
        type="button"
        onClick={handleApply}
        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition duration-150 flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/10 active:scale-95 cursor-pointer"
      >
        <Check className="w-4 h-4" />
        <span>Gunakan Hasil</span>
        <CornerDownLeft className="w-3 h-3 opacity-60" />
      </button>
    </div>
  ) : null;

  return (
    <>
      <button
        ref={triggerRef}
        id={className.includes("custom-btn") ? undefined : "fc-calc-btn"}
        type="button"
        onClick={handleToggle}
        className={`p-1 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition duration-150 shrink-0 ${className}`}
        title={placeholder}
      >
        <Calculator className="w-3.5 h-3.5" />
      </button>
      {typeof document !== "undefined" && ReactDOM.createPortal(popoverContent, document.body)}
    </>
  );
}
