'use client';

import { useEffect } from 'react';
import { WordResult } from '@/services/recognition';
import { addWord } from '@/lib/db';
import { useRouter } from 'next/navigation';

interface ResultViewProps {
  results: WordResult[];
  onReset: () => void;
  sourceImage: string;
}

export default function ResultView({ results, onReset, sourceImage }: ResultViewProps) {
  const router = useRouter();

  // 顯示結果時觸發廣告刷新
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('refresh-ad'));
  }, []);

  const handleAddToVocab = async (result: WordResult) => {
    await addWord({
      word: result.word,
      translation: result.translation,
      phonetic: result.phonetic,
      example: result.example,
      sourceImage: sourceImage,
      status: 'New'
    });
    router.push('/words');
  };

  // 根據來源顯示不同的標籤顏色
  const sourceColors = {
    tesseract: 'bg-gray-100 text-gray-600 border border-gray-200',
    groq: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
    gemini: 'bg-blue-50 text-blue-600 border border-blue-200',
    cache: 'bg-amber-50 text-amber-600 border border-amber-200',
  };

  const sourceLabels = {
    tesseract: 'Local OCR',
    groq: 'Llama 3',
    gemini: 'Gemini Vision',
    cache: 'Cache',
  };

  return (
    <div className="min-h-full w-full z-40 bg-white flex flex-col">
      <div className="flex-1 p-6 flex flex-col items-center">
        {results.length === 0 ? (
          <div className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-xl border border-gray-100 text-center mt-10">
            <h2 className="text-2xl font-bold text-black mb-2">找不到單字</h2>
            <p className="text-gray-500">圖片中似乎沒有清晰的英文單字，請嘗試重新拍攝。</p>
          </div>
        ) : (
          <div className="w-full max-w-sm space-y-6 mt-4">
            {results.map((result, idx) => (
              <div key={idx} className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 relative">
                {/* 來源標籤 */}
                <div className="absolute top-4 right-4">
                  <span className={`text-[10px] px-2 py-1 rounded-full uppercase tracking-wider font-medium ${sourceColors[result.source]}`}>
                    {sourceLabels[result.source]}
                  </span>
                </div>

                <h2 className="text-3xl font-bold text-black mb-2 tracking-tight break-words pr-16">
                  {result.word || 'Unknown'}
                </h2>
                
                <p className="text-gray-500 font-mono text-sm mb-6">
                  {result.phonetic ? `/${result.phonetic}/` : ''}
                </p>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs text-gray-400 uppercase tracking-widest mb-1">Translation</h3>
                    <p className="text-lg text-gray-900 font-medium leading-relaxed">
                      {result.translation || '無翻譯'}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-xs text-gray-400 uppercase tracking-widest mb-1">Example</h3>
                    <p className="text-sm text-gray-600 leading-relaxed italic border-l-2 border-gray-200 pl-3">
                      &quot;{result.example || 'No example available.'}&quot;
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => handleAddToVocab(result)}
                  className="mt-6 w-full py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition"
                >
                  加入生字本
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="sticky bottom-0 w-full bg-white/90 backdrop-blur pb-[env(safe-area-inset-bottom)] pt-4 px-6 z-10 flex justify-center mt-auto border-t border-gray-100">
        <button 
          onClick={onReset}
          className="w-full max-w-sm px-10 py-3.5 bg-black text-white font-medium rounded-full hover:bg-gray-800 transition-all active:scale-95 shadow-lg mb-6"
        >
          繼續掃描
        </button>
      </div>
    </div>
  );
}
