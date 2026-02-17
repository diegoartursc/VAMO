import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VAMO — Sua plataforma de viagens",
  description: "Descubra experiências únicas e pacotes de viagem personalizados. Conectamos você às melhores agências e criadores de roteiros.",
  keywords: "viagem, pacotes, roteiros, turismo, VAMO",
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
