'use client';

import { getAllWords, Word, deleteWord } from '@/lib/db';
import { useEffect, useState, useMemo } from 'react';
import { Search, Trash2, Layers, Zap, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useAuth } from '@clerk/nextjs';

export default function WordsPage() {
  const [words, setWords] = useState<Word[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'All' | 'New' | 'Learning' | 'Mastered'>('All');
  const { t } = useLanguage();
  const { userId } = useAuth();

  useEffect(() => {
    loadWords();
  }, []);

  async function loadWords() {
    setIsLoading(true);
    try {
      const loadedWords = await getAllWords();
      setWords(loadedWords.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
    } catch (err) {
      console.error('Failed to load words:', err);
    } finally {
      setIsLoading(false);
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm('Delete this memory?')) {
      await deleteWord(id);
      loadWords();
    }
  };

  const filteredWords = useMemo(() => {
    return words.filter(word => {
      const matchesSearch = word.word.toLowerCase().includes(search.toLowerCase()) || 
                            word.translation.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === 'All' || word.status === filter;
      return matchesSearch && matchesFilter;
    });
  }, [words, search, filter]);

  return (
    <div className="w-full">
      <header className="mb-10">
        <div className="flex items-center gap-2 text-emerald-500 mb-2">
          <Layers size={14} />
          <span className="text-[10px] font-mono tracking-[0.2em] uppercase">Memory Vault</span>
        </div>
        <h1 className="text-4xl font-bold tracking-tighter text-[var(--text)]">{t('nav.vault')}</h1>
      </header>

      <div className="flex flex-col gap-4 mb-10">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text)]/30 group-focus-within:text-emerald-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search memories..."
            className="w-full pl-12 pr-4 py-4 bg-white/5 border border-[var(--border)] rounded-2xl focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all placeholder:text-[var(--text)]/20 text-sm text-[var(--text)]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {(['All', 'New', 'Learning', 'Mastered'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-[10px] font-mono tracking-wider uppercase transition-all whitespace-nowrap ${
                filter === f 
                ? 'bg-emerald-500 text-black font-bold' 
                : 'bg-white/5 text-[var(--text)]/40 border border-[var(--border)] hover:border-white/20'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          <span className="text-[10px] font-mono text-[var(--text)]/40 tracking-widest uppercase">Syncing...</span>
        </div>
      ) : filteredWords.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-[var(--border)]"
        >
          <p className="text-[var(--text)]/30 font-mono text-xs uppercase tracking-widest">{t('words.empty')}</p>
        </motion.div>
      ) : (
        <div className="grid gap-4">
          <AnimatePresence mode="popLayout">
            {filteredWords.map((word, index) => (
              <motion.div
                layout
                key={word.id || index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
              >
                {index > 0 && index % 5 === 0 && (
                  <div className="v-glass p-4 rounded-2xl border border-[var(--border)] flex items-center justify-between mb-4 group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500/50">
                        <Zap size={14} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[8px] font-mono text-[var(--text)]/30 uppercase tracking-widest">Neural Sponsor</span>
                        <span className="text-[10px] font-bold text-[var(--text)]/40 tracking-tight italic">&quot;Your memory, amplified.&quot;</span>
                      </div>
                    </div>
                    <div className="text-[8px] font-mono text-[var(--text)]/20 uppercase tracking-widest border border-[var(--border)] px-2 py-1 rounded">AD</div>
                  </div>
                )}
                <div className="v-card p-5 group mb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h2 className="text-xl font-bold text-[var(--text)] tracking-tight group-hover:text-emerald-400 transition-colors">
                        {word.word}
                      </h2>
                      {word.status === 'Mastered' && <CheckCircle2 size={14} className="text-emerald-500" />}
                      {word.status === 'Learning' && <Zap size={14} className="text-yellow-500" />}
                    </div>
                    <p className="text-[var(--text)]/60 text-sm leading-relaxed mb-3">{word.translation}</p>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-white/5 text-[var(--text)]/40 border border-[var(--border)] uppercase tracking-tighter">
                        {word.status}
                      </span>
                      {word.phonetic && (
                        <span className="text-[9px] font-mono text-emerald-500/60">
                          [{word.phonetic}]
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-4">
                    <button 
                      onClick={() => word.id && handleDelete(word.id)}
                      className="p-2 text-[var(--text)]/20 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                    
                    {word.sourceSnippet && (
                      <div className="w-16 h-16 rounded-xl overflow-hidden border border-[var(--border)] grayscale group-hover:grayscale-0 transition-all duration-500">
                        <img 
                          src={word.sourceSnippet} 
                          alt="Memory Snippet" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
