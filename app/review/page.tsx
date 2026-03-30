'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllWords, Word, updateWordStatus } from '@/lib/db';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, X, Eye, ChevronRight } from 'lucide-react';

export default function ReviewPage() {
  const [words, setWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    async function loadWords() {
      const allWords = await getAllWords();
      // Filter words for review (New or Learning)
      const reviewWords = allWords.filter(w => w.status !== 'Mastered');
      // Shuffle words
      setWords(reviewWords.sort(() => Math.random() - 0.5));
      setIsLoading(false);
    }
    loadWords();
  }, []);

  const handleStatusUpdate = async (status: Word['status']) => {
    const word = words[currentIndex];
    if (word.id) {
      await updateWordStatus(word.id, status);
      handleNext();
    }
  };

  const handleNext = () => {
    setIsRevealed(false);
    if (currentIndex < words.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setCurrentIndex(words.length); // Finished state
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (words.length === 0 || currentIndex >= words.length) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500 mb-8"
        >
          <Check size={48} />
        </motion.div>
        <h2 className="text-2xl font-bold text-[var(--text)] mb-4">{t('review.congrats')}</h2>
        <p className="text-[var(--text)]/50 mb-10">{t('review.allDone')}</p>
        <button 
          onClick={() => router.push('/')}
          className="px-10 py-4 bg-[var(--text)] text-[var(--bg)] rounded-2xl font-bold uppercase tracking-widest text-xs"
        >
          {t('review.backHome')}
        </button>
      </div>
    );
  }

  const currentWord = words[currentIndex];

  return (
    <div className="flex-1 flex flex-col p-6 space-y-8">
      <header className="flex items-center justify-between">
        <button onClick={() => router.push('/')} className="text-[var(--text)]/50 hover:text-[var(--text)]">
          <ArrowLeft size={24} />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-mono text-emerald-500 uppercase tracking-widest">{t('review.title')}</span>
          <span className="text-xs font-bold text-[var(--text)]/40">{currentIndex + 1} / {words.length}</span>
        </div>
        <div className="w-6" />
      </header>

      <div className="flex-1 flex flex-col space-y-6">
        {/* Scene Restoration Card */}
        <div className="v-card flex-1 relative overflow-hidden flex flex-col">
          <div className="flex-1 relative bg-black/20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={currentWord.sourceSnippet} 
              alt="Scene Context" 
              className="w-full h-full object-contain"
            />
            
            {/* Blackout Box */}
            {!isRevealed && currentWord.rect && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute bg-black shadow-2xl border border-white/10"
                style={{
                  left: `${currentWord.rect.x * 100}%`,
                  top: `${currentWord.rect.y * 100}%`,
                  width: `${currentWord.rect.width * 100}%`,
                  height: `${currentWord.rect.height * 100}%`,
                }}
              />
            )}
          </div>

          <AnimatePresence>
            {isRevealed && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="p-8 bg-[var(--bg)]/80 backdrop-blur-xl border-t border-[var(--border)]"
              >
                <h3 className="text-4xl font-black text-[var(--text)] tracking-tighter mb-2">{currentWord.word}</h3>
                <p className="text-emerald-500 font-mono text-sm mb-4 uppercase tracking-widest">{currentWord.phonetic}</p>
                <div className="space-y-4">
                  <div className="p-4 bg-[var(--bg)]/40 rounded-xl border border-[var(--border)]">
                    <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block mb-1">{t('scanner.translation')}</span>
                    <p className="text-[var(--text)] font-medium">{currentWord.translation}</p>
                  </div>
                  <div className="p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                    <span className="text-[9px] font-mono text-emerald-500/50 uppercase tracking-widest block mb-1">{t('scanner.context')}</span>
                    <p className="text-gray-400 text-sm italic">&quot;{currentWord.example}&quot;</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-4">
          {!isRevealed ? (
            <button 
              onClick={() => setIsRevealed(true)}
              className="w-full py-6 bg-[var(--text)] text-[var(--bg)] rounded-2xl font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 shadow-xl hover:bg-emerald-500 hover:text-white transition-all"
            >
              <Eye size={18} />
              {t('review.reveal')}
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => handleStatusUpdate('Learning')}
                className="py-5 bg-white/5 border border-white/10 text-[var(--text)] rounded-2xl font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
              >
                <X size={16} className="text-red-500" />
                {t('review.keepLearning')}
              </button>
              <button 
                onClick={() => handleStatusUpdate('Mastered')}
                className="py-5 bg-emerald-500 text-black rounded-2xl font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-emerald-400 transition-all"
              >
                <Check size={16} />
                {t('review.mastered')}
              </button>
            </div>
          )}
          
          {isRevealed && (
            <button 
              onClick={handleNext}
              className="w-full py-4 text-[var(--text)]/40 hover:text-[var(--text)] text-[10px] font-mono uppercase tracking-[0.3em] flex items-center justify-center gap-2 transition-colors"
            >
              {t('review.next')}
              <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
