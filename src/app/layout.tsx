import type { Metadata } from 'next';
import { Inter, Poppins } from 'next/font/google';
import './globals.css';
import { SessionTimeoutManager } from '@/components/auth/SessionTimeoutManager';

const inter = Inter({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-inter',
  display: 'swap',
});

const poppins = Poppins({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'T-SMART - Treasury Smart System',
  description: 'Sistem Manajemen Keuangan SMP IT ANAK SOLEH MATARAM',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={`${inter.variable} ${poppins.variable} ${inter.className}`}>
        {children}
        <SessionTimeoutManager />
      </body>
    </html>
  );
}
