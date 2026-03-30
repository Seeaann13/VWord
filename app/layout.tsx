import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css'; // Global styles
import AdBanner from '@/components/AdBanner';

const inter = Inter({ subsets: ['latin'] });
const playfair = Playfair_Display({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'WordHack 單字掃描器',
  description: '極簡、免費、高效的單字掃描與辨識工具',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#ffffff',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="zh-TW">
      <body 
        className={`${inter.className} bg-white text-black antialiased flex flex-col min-h-[100dvh]`}
        suppressHydrationWarning
      >
        {/* 頂部簡約標題列 */}
        <header className="flex-none h-16 flex items-center px-6 pt-[env(safe-area-inset-top)]">
          <h1 className={`${playfair.className} text-2xl font-bold`}>WordHack</h1>
        </header>

        {/* 中間內容區 (響應式容器) */}
        <main className="flex-1 relative w-full max-w-3xl mx-auto flex flex-col">
          {children}
        </main>

        {/* 底部廣告預留區塊 (A-ADS) */}
        <AdBanner />
      </body>
    </html>
  );
}
