'use client';

import Link from 'next/link';
import { getAllWords } from '@/lib/db';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, CheckCircle, Clock, Play, Zap, Info } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useAuth } from '@clerk/nextjs';

export default function Home() {
  const [stats, setStats] = useState({ new: 0, learning: 0, mastered: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useLanguage();
  const { userId } = useAuth();

  useEffect(() => {
    async function loadWords() {
      try {
        const words = await getAllWords();
        setStats({
          new: words.filter(w => w.status === 'New').length,
          learning: words.filter(w => w.status === 'Learning').length,
          mastered: words.filter(w => w.status === 'Mastered').length,
          total: words.length
        });
      } catch (err) {
        console.error('Failed to load words:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadWords();
  }, []);

  const reviewCount = stats.new + stats.learning;

  return (
    <div className="w-full flex-1 flex flex-col p-6 space-y-8 pb-32">
      {/* Ad Placeholder - Top */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="v-glass p-4 rounded-2xl border border-[var(--border)] flex items-center justify-between overflow-hidden relative group"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-500">
            <Info size={14} />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-mono text-[var(--text)]/40 uppercase tracking-widest">{t('system.active')}</span>
            <span className="text-xs font-bold text-[var(--text)] tracking-tight">
              {userId ? 'Cloud Backup Active' : 'Upgrade to vlens Pro for Cloud Sync'}
            </span>
          </div>
        </div>
        <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-[var(--text)]/30 group-hover:text-[var(--text)] transition-colors">
          <Zap size={16} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      </motion.div>

      {/* Hero Review Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative group"
      >
        <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full -z-10 group-hover:bg-emerald-500/30 transition-colors" />
        
        <div className="v-card p-10 flex flex-col items-center text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4">
            <Zap size={20} className="text-emerald-500 animate-pulse" />
          </div>
          
          <span className="text-[10px] font-mono text-[var(--text)]/40 uppercase tracking-[0.4em] mb-6">Daily Objective</span>
          
          <h1 className="text-sm font-bold text-[var(--text)]/60 mb-2 uppercase tracking-widest">Pending Review</h1>
          
          <div className="flex justify-center items-baseline gap-3 my-4">
            <span className="text-8xl font-black text-[var(--text)] tracking-tighter">
              {isLoading ? '...' : reviewCount}
            </span>
            <span className="text-emerald-500 font-mono text-sm uppercase tracking-widest">Units</span>
          </div>
          
          <p className="text-[var(--text)]/50 text-xs max-w-[200px] leading-relaxed mb-10">
            Restore your visual memories to solidify long-term retention.
          </p>
          
          <Link 
            href="/review" 
            className="group relative w-full py-5 bg-[var(--text)] text-[var(--bg)] rounded-2xl flex items-center justify-center gap-3 font-black text-xs uppercase tracking-[0.2em] hover:bg-emerald-500 hover:text-white transition-all active:scale-95 shadow-[0_20px_40px_rgba(0,0,0,0.1)]"
          >
            <span>{t('review.start')}</span>
            <Play size={16} fill="currentColor" />
          </Link>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="v-card p-6 flex flex-col"
        >
          <div className="flex items-center gap-2 text-blue-400 mb-4">
            <Clock size={16} />
            <span className="text-[10px] font-mono uppercase tracking-widest">New</span>
          </div>
          <span className="text-4xl font-black text-[var(--text)]">{isLoading ? '-' : stats.new}</span>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="v-card p-6 flex flex-col"
        >
          <div className="flex items-center gap-2 text-amber-400 mb-4">
            <BookOpen size={16} />
            <span className="text-[10px] font-mono uppercase tracking-widest">Learning</span>
          </div>
          <span className="text-4xl font-black text-[var(--text)]">{isLoading ? '-' : stats.learning}</span>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="v-card p-6 flex flex-col col-span-2 relative overflow-hidden"
        >
          <div className="flex items-center gap-2 text-emerald-400 mb-4">
            <CheckCircle size={16} />
            <span className="text-[10px] font-mono uppercase tracking-widest">Mastered</span>
          </div>
          <div className="flex items-end justify-between">
            <span className="text-5xl font-black text-[var(--text)]">{isLoading ? '-' : stats.mastered}</span>
            <div className="text-right">
              <span className="text-[10px] text-[var(--text)]/40 font-mono uppercase tracking-widest block">Total Capacity</span>
              <span className="text-[var(--text)] font-bold">{isLoading ? '-' : stats.total}</span>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-6 h-1 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: stats.total > 0 ? `${(stats.mastered / stats.total) * 100}%` : 0 }}
              className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
            />
          </div>
        </motion.div>
      </div>
    </div>

  );
}
