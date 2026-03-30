'use client';

import Link from 'next/link';
import { getAllWords } from '@/lib/db';
import { useEffect, useState } from 'react';
import { BookOpen, CheckCircle, Clock, Camera } from 'lucide-react';

export default function Home() {
  const [stats, setStats] = useState({ new: 0, learning: 0, mastered: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(true);

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
    <div className="w-full flex-1 flex flex-col p-6 space-y-8 bg-gray-50">
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -z-10"></div>
        <h1 className="text-xl font-bold text-gray-500 mb-2">今日待複習</h1>
        <div className="flex justify-center items-baseline gap-2">
          <span className="text-6xl font-black text-emerald-600">
            {isLoading ? '...' : reviewCount}
          </span>
          <span className="text-gray-400 font-medium">個單字</span>
        </div>
        
        <Link 
          href="/review" 
          className="mt-8 block w-full py-4 bg-emerald-600 text-white rounded-2xl text-center font-bold text-lg shadow-lg shadow-emerald-200 hover:bg-emerald-700 hover:shadow-xl transition-all active:scale-95"
        >
          開始複習
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
          <div className="flex items-center gap-2 text-blue-600 mb-3">
            <Clock size={20} />
            <span className="font-semibold text-sm">新單字</span>
          </div>
          <span className="text-3xl font-bold text-gray-900">{isLoading ? '-' : stats.new}</span>
        </div>
        
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
          <div className="flex items-center gap-2 text-yellow-600 mb-3">
            <BookOpen size={20} />
            <span className="font-semibold text-sm">學習中</span>
          </div>
          <span className="text-3xl font-bold text-gray-900">{isLoading ? '-' : stats.learning}</span>
        </div>
        
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col col-span-2">
          <div className="flex items-center gap-2 text-emerald-600 mb-3">
            <CheckCircle size={20} />
            <span className="font-semibold text-sm">已掌握 (Mastered)</span>
          </div>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-bold text-gray-900">{isLoading ? '-' : stats.mastered}</span>
            <span className="text-sm text-gray-400 mb-1">總計 {isLoading ? '-' : stats.total} 個單字</span>
          </div>
        </div>
      </div>

      <div className="pt-4">
        <Link 
          href="/scan" 
          className="w-full flex items-center justify-center gap-3 py-4 bg-white border-2 border-dashed border-gray-300 text-gray-600 rounded-2xl font-medium hover:bg-gray-50 hover:border-gray-400 transition-colors active:scale-95"
        >
          <Camera size={20} />
          <span>相機掃描加入新單字</span>
        </Link>
      </div>
    </div>
  );
}
