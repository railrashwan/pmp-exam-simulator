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

  const base = "flex items-center justify-center text-[14px] font-medium rounded border h-11 cursor-pointer select-none active:scale-95 transition-transform";

  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="calc-title"
    >
      <div className="bg-canvas border border-edge rounded-lg shadow-xl w-72 overflow-hidden">
        <div className="bg-surface border-b border-edge px-4 py-3 flex items-center justify-between">
          <span id="calc-title" className="text-[14px] font-semibold text-content">Calculator</span>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Close calculator"
            className="text-muted hover:text-content text-xl leading-none px-1 transition-colors"
          >
            ×
          </button>
        </div>

        {/* Display */}
        <div className="bg-surface-2 px-4 py-3 text-right border-b border-edge">
          <div className="text-[12px] text-muted h-5">{prev} {operator}</div>
          <div className="text-[20px] font-bold truncate text-content font-mono">{display}</div>
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-4 gap-1.5 p-3">
          {[
            { label: "C",  action: handleClear,              cls: "bg-wrong-bg border-wrong text-wrong col-span-2 hover:opacity-90" },
            { label: "⌫", action: handleBackspace,           cls: "bg-surface border-edge text-content hover:bg-surface-2" },
            { label: "÷", action: () => handleOperator("÷"), cls: "bg-surface-2 border-edge text-content hover:bg-surface" },
            { label: "7",  action: () => inputDigit("7"),     cls: "bg-canvas border-edge text-content hover:bg-surface" },
            { label: "8",  action: () => inputDigit("8"),     cls: "bg-canvas border-edge text-content hover:bg-surface" },
            { label: "9",  action: () => inputDigit("9"),     cls: "bg-canvas border-edge text-content hover:bg-surface" },
            { label: "×", action: () => handleOperator("×"), cls: "bg-surface-2 border-edge text-content hover:bg-surface" },
            { label: "4",  action: () => inputDigit("4"),     cls: "bg-canvas border-edge text-content hover:bg-surface" },
            { label: "5",  action: () => inputDigit("5"),     cls: "bg-canvas border-edge text-content hover:bg-surface" },
            { label: "6",  action: () => inputDigit("6"),     cls: "bg-canvas border-edge text-content hover:bg-surface" },
            { label: "-",  action: () => handleOperator("-"), cls: "bg-surface-2 border-edge text-content hover:bg-surface" },
            { label: "1",  action: () => inputDigit("1"),     cls: "bg-canvas border-edge text-content hover:bg-surface" },
            { label: "2",  action: () => inputDigit("2"),     cls: "bg-canvas border-edge text-content hover:bg-surface" },
            { label: "3",  action: () => inputDigit("3"),     cls: "bg-canvas border-edge text-content hover:bg-surface" },
            { label: "+",  action: () => handleOperator("+"), cls: "bg-surface-2 border-edge text-content hover:bg-surface" },
            { label: "0",  action: () => inputDigit("0"),     cls: "bg-canvas border-edge text-content hover:bg-surface col-span-2" },
            { label: ".",  action: inputDecimal,              cls: "bg-canvas border-edge text-content hover:bg-surface" },
            { label: "=",  action: handleEquals,              cls: "bg-interact border-interact text-inverse hover:bg-interact-h" },
          ].map((btn, i) => (
            <button key={i} onClick={btn.action} className={`${base} ${btn.cls}`}>{btn.label}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
