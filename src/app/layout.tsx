import { NavBar } from "@/components/navigation/NavBar";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <style>{`
          html, body {
            overscroll-behavior-y: none;
            touch-action: pan-x pan-y;
            -webkit-overflow-scrolling: touch;
            position: fixed;
            width: 100%;
            height: 100%;
            overflow-y: auto;
          }
          main {
            -webkit-overflow-scrolling: touch;
          }
        `}</style>
      </head>
      <body className="bg-gray-800 text-white min-h-screen pb-20">
        <main className="container mx-auto px-4 py-8">{children}</main>
        <NavBar />
      </body>
    </html>
  );
}
