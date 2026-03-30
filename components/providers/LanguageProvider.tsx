'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'zh-TW' | 'ja';

const translations = {
  'en': {
    'app.name': 'vlens',
    'nav.home': 'Home',
    'nav.scanner': 'Scanner',
    'nav.vault': 'Vault',
    'nav.review': 'Review',
    'auth.signin': 'Sign In',
    'auth.signup': 'Sign Up',
    'system.active': 'System Active',
    'system.offline': 'Offline Mode',
    'theme.toggle': 'Toggle Theme',
    'lang.toggle': 'Change Language',
    'words.empty': 'No words found. Start scanning!',
    'review.start': 'Start Review',
    'review.title': 'V-Review: Scene Restoration',
    'review.reveal': 'Reveal Word',
    'review.next': 'Next Card',
    'review.mastered': 'Mastered',
    'review.keepLearning': 'Keep Learning',
    'review.congrats': 'Great Job!',
    'review.allDone': "You've completed all pending reviews.",
    'review.backHome': 'Back to Home',
    'scanner.capture': 'Capture',
    'scanner.detectionEngine': 'Detection Engine',
    'scanner.analysisResults': 'ANALYSIS RESULTS',
    'scanner.noTargetsFound': 'No Targets Found',
    'scanner.noTargetsDesc': "The neural engine couldn't isolate any clear vocabulary. Try a different angle or better lighting.",
    'scanner.translation': 'Translation',
    'scanner.context': 'Context',
    'scanner.enterVault': 'Enter Memory Vault',
    'scanner.visualEngine': 'Visual Engine',
    'scanner.readyToCapture': 'Ready to capture visual memories. Align text within the frame.',
    'scanner.accessDenied': 'Access Denied',
    'scanner.enableCameraDesc': 'Please enable camera permissions in system settings.',
    'scanner.initializeLens': 'Initialize Lens',
    'scanner.importFromLocal': 'Import from local storage',
    'scanner.neuralEngineLoading': 'Neural Engine Loading',
    'scanner.discard': 'Discard',
    'scanner.analyzeScene': 'Analyze Scene',
    'scanner.processing': 'Processing...',
    'scanner.recognitionFailed': 'Recognition failed, please try again',
    'scanner.phoneticNA': 'Phonetic N/A',
  },
  'zh-TW': {
    'app.name': 'vlens',
    'nav.home': '首頁',
    'nav.scanner': '掃描',
    'nav.vault': '單字庫',
    'nav.review': '複習',
    'auth.signin': '登入',
    'auth.signup': '註冊',
    'system.active': '系統已啟動',
    'system.offline': '離線模式',
    'theme.toggle': '切換主題',
    'lang.toggle': '切換語言',
    'words.empty': '尚未有單字，開始掃描吧！',
    'review.start': '開始複習',
    'review.title': 'V-Review: 場景還原',
    'review.reveal': '顯示單字',
    'review.next': '下一張',
    'review.mastered': '已掌握',
    'review.keepLearning': '繼續學習',
    'review.congrats': '太棒了！',
    'review.allDone': '你已完成所有待複習項目。',
    'review.backHome': '回到首頁',
    'scanner.capture': '拍攝',
    'scanner.detectionEngine': '偵測引擎',
    'scanner.analysisResults': '分析結果',
    'scanner.noTargetsFound': '未發現目標',
    'scanner.noTargetsDesc': '神經引擎無法分離出清晰的單字。請嘗試不同的角度或更好的光線。',
    'scanner.translation': '翻譯',
    'scanner.context': '語境',
    'scanner.enterVault': '進入記憶庫',
    'scanner.visualEngine': '啟動視覺引擎',
    'scanner.readyToCapture': '準備擷取視覺記憶。請將文字對齊框內。',
    'scanner.accessDenied': '存取被拒',
    'scanner.enableCameraDesc': '請在系統設定中啟用相機權限。',
    'scanner.initializeLens': '初始化鏡頭',
    'scanner.importFromLocal': '從本地儲存匯入',
    'scanner.neuralEngineLoading': '神經引擎載入中',
    'scanner.discard': '捨棄',
    'scanner.analyzeScene': '分析場景',
    'scanner.processing': '處理中...',
    'scanner.recognitionFailed': '辨識失敗，請重試',
    'scanner.phoneticNA': '暫無音標',
  },
  'ja': {
    'app.name': 'vlens',
    'nav.home': 'ホーム',
    'nav.scanner': 'スキャナー',
    'nav.vault': '単語帳',
    'nav.review': '復習',
    'auth.signin': 'ログイン',
    'auth.signup': 'サインアップ',
    'system.active': 'システム稼働中',
    'system.offline': 'オフラインモード',
    'theme.toggle': 'テーマ切替',
    'lang.toggle': '言語切替',
    'words.empty': '単語がありません。スキャンを開始しましょう！',
    'review.start': '復習を開始',
    'review.title': 'V-Review: シーン復元',
    'review.reveal': '単語を表示',
    'review.next': '次のカード',
    'review.mastered': 'マスターした',
    'review.keepLearning': '学習を続ける',
    'review.congrats': '素晴らしい！',
    'review.allDone': 'すべての復習が完了しました。',
    'review.backHome': 'ホームに戻る',
    'scanner.capture': 'キャプチャ',
    'scanner.detectionEngine': '検出エンジン',
    'scanner.analysisResults': '分析結果',
    'scanner.noTargetsFound': 'ターゲットが見つかりません',
    'scanner.noTargetsDesc': 'ニューラルエンジンが単語を分離できませんでした。角度を変えるか、明るい場所で試してください。',
    'scanner.translation': '翻訳',
    'scanner.context': 'コンテキスト',
    'scanner.enterVault': 'メモリーヴォルトに入る',
    'scanner.visualEngine': 'ビジュアルエンジン起動',
    'scanner.readyToCapture': '視覚メモリをキャプチャする準備ができました。フレーム内にテキストを合わせてください。',
    'scanner.accessDenied': 'アクセス拒否',
    'scanner.enableCameraDesc': 'システム設定でカメラの権限を有効にしてください。',
    'scanner.initializeLens': 'レンズを初期化',
    'scanner.importFromLocal': 'ローカルストレージからインポート',
    'scanner.neuralEngineLoading': 'ニューラルエンジン読み込み中',
    'scanner.discard': '破棄',
    'scanner.analyzeScene': 'シーンを分析',
    'scanner.processing': '処理中...',
    'scanner.recognitionFailed': '認識に失敗しました。もう一度お試しください。',
    'scanner.phoneticNA': '発音記号なし',
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations['en']) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('zh-TW');

  useEffect(() => {
    const savedLang = localStorage.getItem('vlens-lang') as Language;
    if (savedLang && translations[savedLang]) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLanguageState(savedLang);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('vlens-lang', lang);
  };

  const t = (key: keyof typeof translations['en']) => {
    return translations[language][key] || translations['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
