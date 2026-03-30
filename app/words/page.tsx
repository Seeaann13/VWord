'use client';

import { getAllWords, Word, deleteWord, updateWordStatus } from '@/lib/db';
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Plus, Search, Trash2, ChevronDown } from 'lucide-react';

export default function WordsPage() {
  const [words, setWords] = useState<Word[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'All' | 'New' | 'Learning' | 'Mastered'>('All');

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
    if (confirm('確定要刪除這個單字嗎？')) {
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
    <div className="w-full p-6 bg-gray-50 min-h-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">我的單字庫</h1>
        <Link 
          href="/words/add" 
          className="flex items-center gap-1 bg-emerald-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-emerald-700 transition shadow-sm"
        >
          <Plus size={16} />
          新增
        </Link>
      </div>

      <div className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="搜尋單字或翻譯..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-full focus:ring-2 focus:ring-emerald-500 outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select 
          className="bg-white border border-gray-200 rounded-full px-4 py-2 outline-none"
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
        >
          <option value="All">全部</option>
          <option value="New">新單字</option>
          <option value="Learning">學習中</option>
          <option value="Mastered">已掌握</option>
        </select>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
        </div>
      ) : filteredWords.length === 0 ? (
        <div className="text-center py-10 text-gray-500 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <p>找不到單字喔！</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredWords.map((word) => (
            <div key={word.id} className="p-4 border border-gray-100 rounded-xl flex items-center justify-between bg-white shadow-sm hover:shadow-md transition-shadow">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{word.word}</h2>
                <p className="text-gray-600 text-sm mt-1">{word.translation}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  word.status === 'New' ? 'bg-blue-100 text-blue-800' :
                  word.status === 'Learning' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-emerald-100 text-emerald-800'
                }`}>
                  {word.status}
                </span>
                <button 
                  onClick={() => word.id && handleDelete(word.id)}
                  className="text-gray-400 hover:text-red-500 transition"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
