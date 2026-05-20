import type { Metadata } from "next";
import "./globals.css";
import "./editor-ux.css";


export const metadata: Metadata = {
  title: "VAMO — Sua plataforma de viagens",
  description: "Descubra roteiros de viagem detalhados criados por viajantes experientes. Planeje sua próxima aventura com quem já esteve lá.",
  keywords: "viagem, roteiros, turismo, itinerários, criadores, VAMO",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
