'use client';

import { useEffect, useState } from 'react';
import { getAllWords, updateWordStatus, Word } from '@/lib/db';
import Link from 'next/link';
import { ArrowLeft, Check, X } from 'lucide-react';

export default function ReviewPage() {
  const [wordsToReview, setWordsToReview] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    async function loadWords() {
      try {
        const words = await getAllWords();
        // 篩選出需要複習的單字 (New 或 Learning)
        const reviewList = words.filter(w => w.status !== 'Mastered');
        // 隨機打亂順序
        setWordsToReview(reviewList.sort(() => Math.random() - 0.5));
      } catch (err) {
        console.error('Failed to load words:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadWords();
  }, []);

  const handleNext = async (remembered: boolean) => {
    const currentWord = wordsToReview[currentIndex];
    
    // 更新狀態邏輯
    let newStatus: 'New' | 'Learning' | 'Mastered' = currentWord.status;
    if (remembered) {
      if (currentWord.status === 'New') newStatus = 'Learning';
      else if (currentWord.status === 'Learning') newStatus = 'Mastered';
    } else {
      newStatus = 'Learning'; // 忘記了就退回或保持在 Learning
    }

    if (newStatus !== currentWord.status && currentWord.id) {
      await updateWordStatus(currentWord.id, newStatus);
    }

    if (currentIndex < wordsToReview.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
    } else {
      setIsFinished(true);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (wordsToReview.length === 0 || isFinished) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
          <Check size={48} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">太棒了！</h2>
        <p className="text-gray-500 mb-8">您已經完成今天的單字複習。</p>
        <Link 
          href="/"
          className="px-8 py-3 bg-gray-900 text-white rounded-full font-medium hover:bg-gray-800 transition-colors"
        >
          回首頁
        </Link>
      </div>
    );
  }

  const currentWord = wordsToReview[currentIndex];

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      <div className="flex items-center p-4">
        <Link href="/" className="p-2 text-gray-500 hover:text-gray-900">
          <ArrowLeft size={24} />
        </Link>
        <div className="flex-1 text-center font-medium text-gray-500">
          {currentIndex + 1} / {wordsToReview.length}
        </div>
        <div className="w-10"></div> {/* Spacer */}
      </div>

      <div className="flex-1 flex flex-col p-6 pb-24">
        {/* Flashcard */}
        <div 
          className={`flex-1 bg-white rounded-3xl shadow-sm border border-gray-100 p-8 flex flex-col items-center justify-center text-center transition-all duration-300 cursor-pointer ${isFlipped ? 'bg-emerald-50/30' : ''}`}
          onClick={() => !isFlipped && setIsFlipped(true)}
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">{currentWord.word}</h2>
          <p className="text-gray-500 font-mono mb-8">{currentWord.phonetic ? `/${currentWord.phonetic}/` : ''}</p>

          {!isFlipped ? (
            <div className="mt-auto text-emerald-600 font-medium animate-pulse">
              點擊顯示答案
            </div>
          ) : (
            <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="h-px w-full bg-gray-100"></div>
              <div>
                <h3 className="text-xs text-gray-400 uppercase tracking-widest mb-2">Translation</h3>
                <p className="text-xl text-gray-900 font-medium">{currentWord.translation}</p>
              </div>
              
              {currentWord.example && (
                <div>
                  <h3 className="text-xs text-gray-400 uppercase tracking-widest mb-2">Example</h3>
                  <p className="text-gray-600 italic leading-relaxed">"{currentWord.example}"</p>
                </div>
              )}

              {currentWord.sourceImage && (
                <div className="pt-4">
                  <h3 className="text-xs text-gray-400 uppercase tracking-widest mb-2">Scene Memory</h3>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={currentWord.sourceImage} alt="Source" className="w-full h-32 object-cover rounded-xl opacity-80" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className={`flex gap-4 mt-8 transition-all duration-300 ${isFlipped ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
          <button 
            onClick={() => handleNext(false)}
            className="flex-1 py-4 bg-red-50 text-red-600 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
          >
            <X size={24} />
            忘記了
          </button>
          <button 
            onClick={() => handleNext(true)}
            className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"
          >
            <Check size={24} />
            記住了
          </button>
        </div>
      </div>
    </div>
  );
}
