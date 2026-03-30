'use client';

import { useEffect, useState, useRef } from 'react';

// 預留的廣告 ID 陣列 (替換為您的真實 A-ADS ID)
const AD_IDS = ['2432299'];

export default function AdBanner() {
  const [refreshCount, setRefreshCount] = useState(0);
  const [currentAdId, setCurrentAdId] = useState(() => AD_IDS[Math.floor(Math.random() * AD_IDS.length)]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // 初始載入日誌
    console.log('[AdBanner] 🚀 AdBanner mounted, initial load.');

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
    <footer className="flex-none min-h-[60px] border-t border-gray-200 bg-gray-50 pb-[env(safe-area-inset-bottom)] flex items-center justify-center relative overflow-hidden w-full">
      <div id="frame" style={{ width: '100%', margin: 'auto', position: 'relative', zIndex: 99998 }}>
        <iframe 
          key={`${currentAdId}-${refreshCount}`}
          data-aa={currentAdId} 
          src={`//acceptable.a-ads.com/${currentAdId}/?size=Adaptive`}
          style={{ border: 0, padding: 0, width: '70%', height: 'auto', overflow: 'hidden', display: 'block', margin: 'auto' }}
          title="Advertisement"
          loading="lazy"
          sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-same-origin"
        />
      </div>
    </footer>
  );
}
