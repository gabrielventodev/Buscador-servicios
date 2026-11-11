import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Buscador de servicios",
  description: "Pedidos de trabajo para prestadores de servicios de la zona.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR">
      <body>{children}</body>
    </html>
  );
}
