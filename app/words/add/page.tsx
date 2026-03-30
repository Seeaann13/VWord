'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { addWord } from '@/lib/db';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

export default function AddWordPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    word: '',
    translation: '',
    phonetic: '',
    example: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await addWord({
        ...formData,
        sourceImage: '', // 手動新增暫無圖片
        status: 'New',
      });
      router.push('/words');
    } catch (err) {
      console.error('Failed to add word:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full p-6 bg-gray-50 min-h-full">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/words" className="p-2 text-gray-500 hover:text-gray-900">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">手動新增單字</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">單字</label>
          <input
            type="text"
            required
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
            value={formData.word}
            onChange={(e) => setFormData({ ...formData, word: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">翻譯</label>
          <input
            type="text"
            required
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
            value={formData.translation}
            onChange={(e) => setFormData({ ...formData, translation: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">音標 (選填)</label>
          <input
            type="text"
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
            value={formData.phonetic}
            onChange={(e) => setFormData({ ...formData, phonetic: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">例句 (選填)</label>
          <textarea
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none h-24"
            value={formData.example}
            onChange={(e) => setFormData({ ...formData, example: e.target.value })}
          />
        </div>
        
        <button
          type="submit"
          disabled={isSaving}
          className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold text-lg hover:bg-emerald-700 transition shadow-lg shadow-emerald-200 flex items-center justify-center gap-2"
        >
          {isSaving ? '儲存中...' : (
            <>
              <Save size={20} />
              儲存單字
            </>
          )}
        </button>
      </form>
    </div>
  );
}
