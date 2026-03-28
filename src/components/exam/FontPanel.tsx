"use client";

import { useState, useEffect } from "react";
import { useExamStore } from "@/store/examStore";
import { usePreferencesStore } from "@/store/preferencesStore";

const ARABIC_FONTS = [
  "Noto Sans Arabic",
  "Cairo",
  "Tajawal",
  "Amiri",
  "Scheherazade New",
  "Harmattan",
  "Lateef",
  "Reem Kufi",
  "Almarai",
  "Mada",
  "El Messiri",
  "Jomhuria",
  "Mirza",
  "Rakkas",
  "Aref Ruqaa",
  "Markazi Text",
  "Katibeh",
  "Lemonada",
  "IBM Plex Arabic",
  "Changa",
];

const ENGLISH_FONTS = [
  "Inter",
  "Roboto",
  "Open Sans",
  "Lato",
  "Montserrat",
  "Poppins",
  "Source Sans 3",
  "Raleway",
  "Nunito",
  "Ubuntu",
  "Merriweather",
  "Playfair Display",
  "PT Serif",
  "Libre Baskerville",
  "Crimson Text",
  "Oswald",
  "Work Sans",
  "DM Sans",
  "Outfit",
  "Josefin Sans",
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

  // Load all font files
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

  // Apply selected font to question area
  useEffect(() => {
    const STYLE_ID = "font-panel-override";
    let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null;

    if (!questionFont) {
      style?.remove();
      return;
    }

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
      {/* Tab button — fixed to lower-left corner */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-4 left-4 z-40 bg-white border-2 border-indigo-300 text-indigo-700 font-semibold shadow-md hover:bg-indigo-50 hover:border-indigo-400 transition-colors rounded-xl px-5 py-2 text-xl"
        aria-label="Open font selector"
      >
        🔤 Fonts
      </button>

      {/* Backdrop */}
      {open && (
        <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setOpen(false)} />
      )}

      {/* Slide-out panel */}
      <div
        className={`fixed top-0 left-0 h-full z-50 bg-white shadow-2xl flex flex-col transition-transform duration-300 ${open ? "translate-x-0" : "-translate-x-full"}`}
        style={{ width: "440px" }}
      >
        {/* Header */}
        <div className="bg-indigo-600 text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div>
            <div className="text-2xl font-bold">Font Settings</div>
            <div className="text-lg text-indigo-200">
              {isAr ? "Choose your Arabic font" : "Choose your English font"}
            </div>
          </div>
          <button onClick={() => setOpen(false)} aria-label="Close" className="text-3xl text-indigo-200 hover:text-white px-2">×</button>
        </div>

        {/* Active font bar */}
        {questionFont && (
          <div className="bg-indigo-50 border-b border-indigo-200 px-5 py-3 flex items-center justify-between shrink-0">
            <span className="text-indigo-700 text-xl font-semibold">Active: {questionFont}</span>
            <button
              onClick={() => setQuestionFont("")}
              className="text-indigo-400 hover:text-indigo-700 text-lg underline"
            >
              Reset to default
            </button>
          </div>
        )}

        {/* Font list */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
          {fonts.map((font) => {
            const isActive = questionFont === font;
            return (
              <button
                key={font}
                onClick={() => setQuestionFont(isActive ? "" : font)}
                className={`w-full text-left px-5 py-4 transition-colors ${
                  isActive ? "bg-indigo-600 text-white" : "hover:bg-indigo-50"
                }`}
              >
                <div className="text-base font-semibold mb-1" style={{ fontFamily: "system-ui" }}>
                  {isActive && "✓ "}{font}
                </div>
                <div
                  style={{
                    fontFamily: `'${font}', sans-serif`,
                    fontSize: "20px",
                    direction: isAr ? "rtl" : "ltr",
                    color: isActive ? "rgba(255,255,255,0.9)" : "#374151",
                    lineHeight: "1.6",
                  }}
                >
                  {sample}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t px-5 py-4 bg-gray-50 text-gray-500 text-xl shrink-0">
          Your font choice is saved automatically.
        </div>
      </div>
    </>
  );
}
