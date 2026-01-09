import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";



export const metadata = {
  title: "Infra Credit khata",
  description: "Digital khata for infra credit",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* PWA meta tags */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#10b981" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />

        {/* install prompt hookup */}
        <script dangerouslySetInnerHTML={{
          __html: `
        window.addEventListener('beforeinstallprompt', (e) => {
          window.deferredPrompt = e;
          // You can show a custom install button in your app and call deferredPrompt.prompt()
        });
        `}} />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}