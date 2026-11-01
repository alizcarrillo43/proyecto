import './globals.css';
import type { Metadata } from 'next';
import { Bricolage_Grotesque } from 'next/font/google';
import { SessionProvider } from '@/components/session-provider';
import { Toaster } from '@/components/ui/sonner';

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-bricolage',
});

export const metadata: Metadata = {
  title: 'Paso Firme | Punto de venta',
  description: 'Punto de venta para la zapatería Paso Firme',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es-MX">
      <body className={`${bricolage.variable} font-sans`}>
        <SessionProvider>{children}</SessionProvider>
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
