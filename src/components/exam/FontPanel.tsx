"use client";

import { useState, useEffect } from "react";
import { useExamStore } from "@/store/examStore";
import { usePreferencesStore } from "@/store/preferencesStore";

const ARABIC_FONTS = [
  "Noto Sans Arabic", "Cairo", "Tajawal", "Amiri", "Scheherazade New",
  "Harmattan", "Lateef", "Reem Kufi", "Almarai", "Mada",
  "El Messiri", "Jomhuria", "Mirza", "Rakkas", "Aref Ruqaa",
  "Markazi Text", "Katibeh", "Lemonada", "IBM Plex Arabic", "Changa",
];

const ENGLISH_FONTS = [
  "Inter", "Roboto", "Open Sans", "Lato", "Montserrat",
  "Poppins", "Source Sans 3", "Raleway", "Nunito", "Ubuntu",
  "Merriweather", "Playfair Display", "PT Serif", "Libre Baskerville", "Crimson Text",
  "Oswald", "Work Sans", "DM Sans", "Outfit", "Josefin Sans",
];

const ARABIC_SAMPLE = "ما هي الخطوة الأولى التي يجب عليك اتخاذها؟";
const ENGLISH_SAMPLE = "What is the first step you should take?";

const ARABIC_FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic&family=Cairo&family=Tajawal&family=Amiri&family=Scheherazade+New&family=Harmattan&family=Lateef&family=Reem+Kufi&family=Almarai&family=Mada&family=El+Messiri&family=Jomhuria&family=Mirza&family=Rakkas&family=Aref+Ruqaa&family=Markazi+Text&family=Katibeh&family=Lemonada&family=IBM+Plex+Arabic&family=Changa&display=swap";
const ENGLISH_FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Inter&family=Roboto&family=Open+Sans&family=Lato&family=Montserrat&family=Poppins&family=Source+Sans+3&family=Raleway&family=Nunito&family=Ubuntu&family=Merriweather&family=Playfair+Display&family=PT+Serif&family=Libre+Baskerville&family=Crimson+Text&family=Oswald&family=Work+Sans&family=DM+Sans&family=Outfit&family=Josefin+Sans&display=swap";

export function FontPanel() {
  const { language } = useExamStore();
  const { questionFont, setQuestionFont } = usePreferencesStore();
  const [open, setOpen] = useState(false);

  const isAr = language === "ar";
  const fonts = isAr ? ARABIC_FONTS : ENGLISH_FONTS;
  const sample = isAr ? ARABIC_SAMPLE : ENGLISH_SAMPLE;

  useEffect(() => {
    ["font-panel-arabic", "font-panel-english"].forEach((id, i) => {
      if (document.getElementById(id)) return;
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = i === 0 ? ARABIC_FONTS_URL : ENGLISH_FONTS_URL;
      document.head.appendChild(link);
    });
  }, []);

  useEffect(() => {
    const STYLE_ID = "font-panel-override";
    let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
    if (!questionFont) { style?.remove(); return; }
    if (!style) {
      style = document.createElement("style");
      style.id = STYLE_ID;
      document.head.appendChild(style);
    }
    style.textContent = `
      #question-area p,
      #question-area label span,
      #question-area [dir] {
        font-family: '${questionFont}', sans-serif !important;
      }
    `;
  }, [questionFont]);

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-4 left-4 z-40 bg-canvas border border-edge text-muted font-medium shadow-sm hover:bg-surface hover:text-content transition-colors rounded px-4 py-1.5 text-[13px]"
        aria-label="Open font selector"
      >
        Aa
      </button>

      {/* Backdrop */}
      {open && (
        <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setOpen(false)} />
      )}

      {/* Slide-out panel */}
      <div
        className={`fixed top-0 left-0 h-full z-50 bg-canvas shadow-xl flex flex-col transition-transform duration-300 border-r border-edge ${open ? "translate-x-0" : "-translate-x-full"}`}
        style={{ width: "400px" }}
      >
        {/* Header */}
        <div className="bg-surface border-b border-edge px-5 py-4 flex items-center justify-between shrink-0">
          <div>
            <div className="text-[15px] font-bold text-content">Font Settings</div>
            <div className="text-[13px] text-muted mt-0.5">
              {isAr ? "Choose your Arabic font" : "Choose your English font"}
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="text-muted hover:text-content text-xl px-1 transition-colors"
          >
            ×
          </button>
        </div>

        {/* Active font bar */}
        {questionFont && (
          <div className="bg-surface-2 border-b border-edge px-5 py-2.5 flex items-center justify-between shrink-0">
            <span className="text-interact text-[13px] font-semibold">Active: {questionFont}</span>
            <button
              onClick={() => setQuestionFont("")}
              className="text-muted hover:text-content text-[12px] underline transition-colors"
            >
              Reset
            </button>
          </div>
        )}

        {/* Font list */}
        <div className="flex-1 overflow-y-auto divide-y divide-edge">
          {fonts.map((font) => {
            const isActive = questionFont === font;
            return (
              <button
                key={font}
                onClick={() => setQuestionFont(isActive ? "" : font)}
                className={`w-full text-left px-5 py-4 transition-colors ${
                  isActive ? "bg-selected border-l-2 border-primary" : "hover:bg-surface"
                }`}
              >
                <div className="text-[12px] font-semibold text-muted mb-1.5" style={{ fontFamily: "system-ui" }}>
                  {isActive && "✓ "}{font}
                </div>
                <div
                  style={{
                    fontFamily: `'${font}', sans-serif`,
                    fontSize: "15px",
                    direction: isAr ? "rtl" : "ltr",
                    lineHeight: "1.6",
                  }}
                  className="text-content"
                >
                  {sample}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-edge px-5 py-3 bg-surface text-muted text-[12px] shrink-0">
          Your font choice is saved automatically.
        </div>
      </div>
    </>
  );
}
