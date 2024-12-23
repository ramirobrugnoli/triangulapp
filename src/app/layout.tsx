import { NavBar } from '@/components/navigation/NavBar';
import './globals.css'; 

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-gray-800 text-white min-h-screen pb-20">
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
        <NavBar />
      </body>
    </html>
  );
}