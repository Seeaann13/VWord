import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css'; // Global styles
import AdBanner from '@/components/AdBanner';
import BottomNav from '@/components/BottomNav';

const inter = Inter({ subsets: ['latin'] });
const playfair = Playfair_Display({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'WordHack 背單字',
  description: '極簡、免費、高效的單字學習與複習工具',
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
        className={`${inter.className} bg-gray-50 text-black antialiased flex flex-col min-h-[100dvh] pb-16`}
        suppressHydrationWarning
      >
        {/* 頂部簡約標題列 */}
        <header className="flex-none h-16 flex items-center px-6 pt-[env(safe-area-inset-top)] bg-white border-b border-gray-100 sticky top-0 z-40">
          <h1 className={`${playfair.className} text-2xl font-bold text-emerald-700`}>WordHack</h1>
        </header>

        {/* 中間內容區 (響應式容器) */}
        <main className="flex-1 relative w-full max-w-3xl mx-auto flex flex-col">
          {children}
        </main>

        {/* 底部廣告預留區塊 (A-ADS) */}
        <div className="w-full max-w-3xl mx-auto mb-4">
          <AdBanner />
        </div>

        {/* 底部導覽列 */}
        <BottomNav />
      </body>
    </html>
  );
}
