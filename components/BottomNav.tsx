'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Camera, BookMarked } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';

export default function BottomNav() {
  const pathname = usePathname();
  const { t } = useLanguage();

  return (
    <nav className="v-glass rounded-3xl p-2 shadow-2xl">
      <div className="flex justify-around items-center h-14 relative">
        {/* 複習 */}
        <Link
          href="/review"
          className={`flex flex-col items-center justify-center w-full h-full transition-all duration-300 ${
            pathname === '/review' ? 'text-emerald-400 scale-110' : 'text-[var(--text)]/50 hover:text-[var(--text)]/80'
          }`}
        >
          <BookOpen size={22} strokeWidth={pathname === '/review' ? 2.5 : 2} />
          <span className="text-[9px] font-mono tracking-tighter mt-1 uppercase">{t('nav.review')}</span>
        </Link>

        {/* 鏡頭 (中央凸起) */}
        <Link
          href="/scan"
          className="relative -top-6 flex items-center justify-center w-16 h-16 bg-emerald-500 text-black rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.4)] border-4 border-[var(--bg)] hover:scale-110 active:scale-95 transition-all duration-300"
        >
          <Camera size={28} strokeWidth={2.5} />
        </Link>

        {/* 字庫 */}
        <Link
          href="/words"
          className={`flex flex-col items-center justify-center w-full h-full transition-all duration-300 ${
            pathname === '/words' ? 'text-emerald-400 scale-110' : 'text-[var(--text)]/50 hover:text-[var(--text)]/80'
          }`}
        >
          <BookMarked size={22} strokeWidth={pathname === '/words' ? 2.5 : 2} />
          <span className="text-[9px] font-mono tracking-tighter mt-1 uppercase">{t('nav.vault')}</span>
        </Link>
      </div>
    </nav>
  );
}
