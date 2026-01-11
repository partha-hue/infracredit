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
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#10b981" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />

        <script dangerouslySetInnerHTML={{
          __html: `
        window.addEventListener('beforeinstallprompt', (e) => {
          window.deferredPrompt = e;
        });

        // Handle Android Hardware Back Button
        document.addEventListener('deviceready', () => {
          if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
            window.Capacitor.Plugins.App.addListener('backButton', ({ canGoBack }) => {
              if (canGoBack) {
                window.history.back();
              } else {
                window.Capacitor.Plugins.App.exitApp();
              }
            });
          }
        }, false);
        `}} />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
