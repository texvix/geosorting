export const metadata = {
  title: "Geosort Lauflisten",
  description: "Optimierte Tourenplanung für Vertriebsteams"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
