"use client";

import { useState, useEffect, useRef } from "react";

interface Props {
  onClose: () => void;
}

export function Calculator({ onClose }: Props) {
  const [display, setDisplay] = useState("0");
  const [prev, setPrev] = useState("");
  const [operator, setOperator] = useState("");
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { closeRef.current?.focus(); }, []);

  function inputDigit(digit: string) {
    if (waitingForOperand) { setDisplay(digit); setWaitingForOperand(false); }
    else setDisplay(display === "0" ? digit : display + digit);
  }

  function inputDecimal() {
    if (waitingForOperand) { setDisplay("0."); setWaitingForOperand(false); return; }
    if (!display.includes(".")) setDisplay(display + ".");
  }

  function calculate(a: number, b: number, op: string): number {
    switch (op) {
      case "+": return a + b;
      case "-": return a - b;
      case "×": return a * b;
      case "÷": return b !== 0 ? a / b : 0;
      default: return b;
    }
  }

  function handleOperator(op: string) {
    const current = parseFloat(display);
    if (prev !== "" && !waitingForOperand) {
      const result = calculate(parseFloat(prev), current, operator);
      setDisplay(String(result)); setPrev(String(result));
    } else { setPrev(display); }
    setOperator(op); setWaitingForOperand(true);
  }

  function handleEquals() {
    const current = parseFloat(display);
    if (prev !== "" && operator) {
      const result = calculate(parseFloat(prev), current, operator);
      setDisplay(String(parseFloat(result.toFixed(10))));
      setPrev(""); setOperator(""); setWaitingForOperand(true);
    }
  }

  function handleClear() { setDisplay("0"); setPrev(""); setOperator(""); setWaitingForOperand(false); }
  function handleBackspace() { if (display.length > 1) setDisplay(display.slice(0, -1)); else setDisplay("0"); }

  const btnBase = "flex items-center justify-center text-2xl font-medium rounded-lg border-2 h-14 cursor-pointer select-none active:scale-95 transition-transform shadow-sm hover:shadow-md";

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-labelledby="calc-title">
      <div className="bg-white rounded-xl shadow-2xl w-80 overflow-hidden">
        <div className="bg-gray-700 text-white px-4 py-3 flex items-center justify-between">
          <span id="calc-title" className="text-2xl font-semibold">Calculator</span>
          <button ref={closeRef} onClick={onClose} aria-label="Close calculator" className="text-gray-300 hover:text-white text-3xl leading-none px-2">×</button>
        </div>

        {/* Display */}
        <div className="bg-gray-100 px-4 py-3 text-right font-mono overflow-hidden">
          <div className="text-xl text-gray-400 h-7">{prev} {operator}</div>
          <div className="text-3xl font-bold truncate text-gray-900">{display}</div>
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-4 gap-2 p-3">
          {[
            { label: "C", action: handleClear, cls: "bg-red-100 hover:bg-red-200 col-span-2" },
            { label: "⌫", action: handleBackspace, cls: "bg-gray-100 hover:bg-gray-200" },
            { label: "÷", action: () => handleOperator("÷"), cls: "bg-orange-100 hover:bg-orange-200" },
            { label: "7", action: () => inputDigit("7"), cls: "bg-white hover:bg-gray-50" },
            { label: "8", action: () => inputDigit("8"), cls: "bg-white hover:bg-gray-50" },
            { label: "9", action: () => inputDigit("9"), cls: "bg-white hover:bg-gray-50" },
            { label: "×", action: () => handleOperator("×"), cls: "bg-orange-100 hover:bg-orange-200" },
            { label: "4", action: () => inputDigit("4"), cls: "bg-white hover:bg-gray-50" },
            { label: "5", action: () => inputDigit("5"), cls: "bg-white hover:bg-gray-50" },
            { label: "6", action: () => inputDigit("6"), cls: "bg-white hover:bg-gray-50" },
            { label: "-", action: () => handleOperator("-"), cls: "bg-orange-100 hover:bg-orange-200" },
            { label: "1", action: () => inputDigit("1"), cls: "bg-white hover:bg-gray-50" },
            { label: "2", action: () => inputDigit("2"), cls: "bg-white hover:bg-gray-50" },
            { label: "3", action: () => inputDigit("3"), cls: "bg-white hover:bg-gray-50" },
            { label: "+", action: () => handleOperator("+"), cls: "bg-orange-100 hover:bg-orange-200" },
            { label: "0", action: () => inputDigit("0"), cls: "bg-white hover:bg-gray-50 col-span-2" },
            { label: ".", action: inputDecimal, cls: "bg-white hover:bg-gray-50" },
            { label: "=", action: handleEquals, cls: "bg-blue-500 hover:bg-blue-600 text-white" },
          ].map((btn, i) => (
            <button key={i} onClick={btn.action} className={`${btnBase} ${btn.cls}`}>{btn.label}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
