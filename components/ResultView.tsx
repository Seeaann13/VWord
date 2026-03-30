'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WordResult } from '@/services/recognition';
import { addWord } from '@/lib/db';
import { useRouter } from 'next/navigation';
import { Plus, Check, X, ArrowRight } from 'lucide-react';

import { useLanguage } from './providers/LanguageProvider';

interface ResultViewProps {
  results: WordResult[];
  onReset: () => void;
  sourceImage: string;
  sourceSnippet: string;
  rect?: { x: number, y: number, width: number, height: number };
}

export default function ResultView({ results, onReset, sourceImage, sourceSnippet, rect }: ResultViewProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('refresh-ad'));
  }, []);

  const handleAddToVocab = async (result: WordResult, idx: number) => {
    if (addedIds.has(idx)) return;
    
    await addWord({
      word: result.word,
      translation: result.translation,
      phonetic: result.phonetic,
      example: result.example,
      sourceImage: sourceImage,
      sourceSnippet: sourceSnippet,
      rect: rect,
      status: 'New'
    });
    
    setAddedIds(prev => new Set(prev).add(idx));
  };

  return (
    <div className="fixed inset-0 z-50 bg-[var(--bg)] flex flex-col overflow-hidden">
      {/* Header HUD */}
      <div className="flex-none h-20 px-6 flex items-center justify-between border-b border-[var(--border)] bg-[var(--bg)]/40 backdrop-blur-xl">
        <div className="flex flex-col">
          <span className="text-[10px] font-mono text-emerald-500 tracking-[0.3em] uppercase">{t('scanner.detectionEngine')}</span>
          <h2 className="text-[var(--text)] font-bold tracking-tight">{t('scanner.analysisResults')}</h2>
        </div>
        <button 
          onClick={onReset}
          className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-32">
        {results.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-10">
            <div className="w-20 h-20 rounded-3xl border border-[var(--border)] flex items-center justify-center text-gray-700 mb-6">
              <X size={40} strokeWidth={1} />
            </div>
            <h3 className="text-xl font-bold text-[var(--text)] mb-2">{t('scanner.noTargetsFound')}</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              {t('scanner.noTargetsDesc')}
            </p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {results.map((result, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="v-card p-6 relative group overflow-hidden"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-black text-[var(--text)] tracking-tight mb-1">
                      {result.word}
                    </h3>
                    <p className="text-emerald-500/60 font-mono text-xs tracking-widest uppercase">
                      {result.phonetic ? `[ ${result.phonetic} ]` : t('scanner.phoneticNA')}
                    </p>
                  </div>
                  
                  <button 
                    onClick={() => handleAddToVocab(result, idx)}
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                      addedIds.has(idx) 
                        ? 'bg-emerald-500 text-black' 
                        : 'bg-[var(--bg)]/20 text-[var(--text)] border border-[var(--border)] hover:bg-[var(--bg)]/40'
                    }`}
                  >
                    {addedIds.has(idx) ? <Check size={20} strokeWidth={3} /> : <Plus size={20} />}
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-[var(--bg)]/40 rounded-2xl border border-[var(--border)]">
                    <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block mb-2">{t('scanner.translation')}</span>
                    <p className="text-[var(--text)] font-medium">{result.translation}</p>
                  </div>
                  
                  {result.example && (
                    <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                      <span className="text-[9px] font-mono text-emerald-500/50 uppercase tracking-widest block mb-2">{t('scanner.context')}</span>
                      <p className="text-gray-400 text-sm italic leading-relaxed">
                        &quot;{result.example}&quot;
                      </p>
                    </div>
                  )}
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-3xl rounded-full -z-10" />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Footer Action */}
      <div className="flex-none p-6 bg-[var(--bg)]/60 backdrop-blur-2xl border-t border-[var(--border)]">
        <button 
          onClick={() => router.push('/words')}
          className="w-full py-5 bg-[var(--text)] text-[var(--bg)] font-black rounded-2xl flex items-center justify-center gap-3 hover:bg-emerald-500 transition-all active:scale-95 shadow-xl"
        >
          <span className="uppercase tracking-[0.2em] text-xs">{t('scanner.enterVault')}</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
