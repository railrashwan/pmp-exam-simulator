import type { Metadata } from "next";
import "./globals.css";
import { LangSync } from "@/components/LangSync";

export const metadata: Metadata = {
  title: "PMP Exam Simulator",
  description: "PMP Certification Exam Simulator - English & Arabic",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        {/* Apply saved theme before hydration to prevent flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var p=JSON.parse(localStorage.getItem('pmp-preferences')||'{}');if(p.state?.theme==='dark')document.documentElement.classList.add('dark');}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col antialiased bg-canvas text-content">
        <LangSync />
        {children}
      </body>
    </html>
  );
}
