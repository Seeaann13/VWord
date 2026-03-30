import { createWorker, Worker } from 'tesseract.js';
import { GoogleGenAI, Type } from '@google/genai';

export interface WordResult {
  word: string;
  phonetic: string;
  translation: string;
  example: string;
  source: 'tesseract' | 'groq' | 'gemini' | 'cache';
}

// Singleton Worker 避免記憶體洩漏
let workerInstance: Worker | null = null;

export const initTesseract = async () => {
  if (!workerInstance) {
    workerInstance = await createWorker('eng');
  }
  return workerInstance;
};

// 縮小圖片以加快傳輸並節省 API 流量
const resizeImage = (base64Str: string, maxWidth = 800): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = maxWidth / img.width;
      if (scale >= 1) return resolve(base64Str); // 若圖片已經夠小則不放大
      
      const canvas = document.createElement('canvas');
      canvas.width = maxWidth;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(base64Str);
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.src = base64Str;
  });
};

const callGeminiVision = async (imageBase64: string): Promise<WordResult[]> => {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing Gemini API Key');
  }

  const ai = new GoogleGenAI({ apiKey });
  
  // 移除 Data URL 前綴
  const base64Data = imageBase64.split(',')[1];
  const mimeType = imageBase64.split(';')[0].split(':')[1] || 'image/jpeg';

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      },
      "Extract all meaningful English words or phrases from this image. Provide their phonetic, Traditional Chinese translation, and an English example sentence. Ignore random letters, numbers, or pure Chinese text."
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            word: { type: Type.STRING, description: "The English word or phrase" },
            phonetic: { type: Type.STRING, description: "IPA phonetic transcription" },
            translation: { type: Type.STRING, description: "Traditional Chinese translation" },
            example: { type: Type.STRING, description: "An English example sentence" }
          },
          required: ["word", "phonetic", "translation", "example"]
        }
      },
      temperature: 0.1
    }
  });

  return JSON.parse(response.text || '[]');
};

export const processImage = async (
  imageBase64: string, 
  onProgress: (status: string) => void
): Promise<WordResult[]> => {
  try {
    onProgress('本地辨識中...');
    const worker = await initTesseract();
    const { data } = await worker.recognize(imageBase64);
    
    const text = data.text.trim();
    
    // 強制優先使用 Groq 處理 Tesseract 的初步文字結果
    if (text.length > 0) {
      try {
        onProgress('AI 優化中 (Groq Llama 3)...');
        const res = await fetch('/api/groq', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text })
        });
        
        if (res.ok) {
          const resultData = await res.json();
          if (resultData.words && Array.isArray(resultData.words)) {
            return resultData.words.map((w: any) => ({ ...w, source: 'groq' }));
          }
        } else {
          console.warn('Groq API returned non-ok status:', res.status);
        }
      } catch (e) {
        console.warn('Groq failed, falling back to Gemini', e);
      }
    }

    // Low: 送往 Gemini Vision 強制解析 (當 Groq 失敗或 Tesseract 沒抓到字時)
    onProgress('AI 深度解析中 (Gemini Vision)...');
    const resizedImage = await resizeImage(imageBase64, 800);
    const resultData = await callGeminiVision(resizedImage);
    return resultData.map((w: any) => ({ ...w, source: 'gemini' }));
  } catch (error) {
    console.error('Recognition error:', error);
    throw error;
  }
};
