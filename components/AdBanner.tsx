'use client';

import { useEffect, useState, useRef } from 'react';

// 預留的廣告 ID 陣列 (測試用 ID，可替換為真實的 A-ADS IDs)
const AD_IDS = ['2336341', '2336342', '2336343'];

export default function AdBanner() {
  const [refreshCount, setRefreshCount] = useState(0);
  const [currentAdId, setCurrentAdId] = useState(AD_IDS[0]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // 初始載入日誌與隨機 ID
    console.log('[AdBanner] 🚀 AdBanner mounted, initial load.');
    setCurrentAdId(AD_IDS[Math.floor(Math.random() * AD_IDS.length)]);

    const handleRefresh = () => {
      // 防震機制 (Debounce)：清除之前的計時器
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // 設定新的 1 秒計時器，確保 1 秒內只會觸發一次刷新
      timeoutRef.current = setTimeout(() => {
        const nextAdId = AD_IDS[Math.floor(Math.random() * AD_IDS.length)];
        
        setRefreshCount(prev => {
          console.log(`[AdBanner] 🔄 廣告刷新觸發！(Refresh Count: ${prev + 1}, New Ad ID: ${nextAdId})`);
          return prev + 1;
        });
        setCurrentAdId(nextAdId);
      }, 1000);
    };

    // 監聽自訂的廣告刷新事件
    window.addEventListener('refresh-ad', handleRefresh);

    return () => {
      window.removeEventListener('refresh-ad', handleRefresh);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []); // 空依賴陣列，確保只綁定一次事件

  return (
    <footer className="flex-none h-[50px] border-t border-gray-200 bg-gray-50 pb-[env(safe-area-inset-bottom)] flex items-center justify-center relative overflow-hidden w-full">
      <div className="flex items-center justify-center w-full h-[50px]">
        <iframe 
          key={`${currentAdId}-${refreshCount}`}
          data-aa={currentAdId} 
          src={`//ad.a-ads.com/${currentAdId}?size=320x50`} 
          style={{ width: '320px', height: '50px', border: 0, padding: 0, overflow: 'hidden', backgroundColor: 'transparent' }}
          title="Advertisement"
          loading="lazy"
          sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-same-origin"
        />
      </div>
    </footer>
  );
}
