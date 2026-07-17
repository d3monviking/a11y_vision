import "./globals.css";

export const metadata = {
  title: "A11yVision — AI Web Accessibility Auditor",
  description:
    "AI-powered visual accessibility auditor and code remediator. Scan screenshots for WCAG violations and automatically fix inaccessible HTML.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
