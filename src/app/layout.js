import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";



export const metadata = {
  title: "Infra Credit khata",
  description: "Digital khata for infra credit",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
       
      >
        {children}
      </body>
    </html>
  );
}
