import type { Metadata, Viewport } from "next";
import "./globals.css";
import { productConfig } from "@/lib/config/product";

export const metadata: Metadata = {
  title: {
    default: productConfig.name,
    template: `%s · ${productConfig.name}`,
  },
  description: "Organiza Americanos, Mexicanos, ligas y torneos de pádel con marcador en vivo.",
};

export const viewport: Viewport = {
  themeColor: "#0f6f52",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
