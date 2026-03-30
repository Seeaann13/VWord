'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { processImage, WordResult, initTesseract } from '@/services/recognition';
import ResultView from './ResultView';

declare global {
  interface Window {
    cv: any;
  }
}

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function Scanner() {
  const [isOpenCvLoaded, setIsOpenCvLoaded] = useState(false);
  const [isCameraRequested, setIsCameraRequested] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [permissionError, setPermissionError] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  
  // 辨識狀態
  const [recognitionStatus, setRecognitionStatus] = useState<string>('');
  const [results, setResults] = useState<WordResult[] | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hiddenCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const animationFrameId = useRef<number>(0);
  const lastProcessTime = useRef<number>(0);
  const smoothedRectRef = useRef<Rect | null>(null);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraRequested(false);
    setIsCameraReady(false);
  };

  // 1. 載入 OpenCV.js 與預熱 Tesseract
  const handleOpenCvLoad = () => {
    const checkCv = setInterval(() => {
      if (window.cv && window.cv.Mat) {
        clearInterval(checkCv);
        setIsOpenCvLoaded(true);
      } else if (window.cv && typeof window.cv === 'function') {
        window.cv().then((target: any) => {
           window.cv = target;
           clearInterval(checkCv);
           setIsOpenCvLoaded(true);
        }).catch(() => {});
      }
    }, 100);
  };

  useEffect(() => {
    // App 啟動時預先初始化 Tesseract Worker (Singleton)
    initTesseract().catch(console.error);
  }, []);

  // 2. 啟動相機
  useEffect(() => {
    if (!isCameraRequested) return;

    const startCamera = async () => {
      try {
        let stream: MediaStream | null = null;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { 
              facingMode: 'environment',
              width: { ideal: 1920 },
              height: { ideal: 1080 }
            }
          });
        } catch (initialErr) {
          console.warn("無法使用環境相機，嘗試使用預設相機:", initialErr);
          // Fallback to default camera
          stream = await navigator.mediaDevices.getUserMedia({
            video: true
          });
        }
        
        streamRef.current = stream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            setIsCameraReady(true);
          };
        }
      } catch (err) {
        console.error("無法存取相機:", err);
        setPermissionError(true);
        setIsCameraRequested(false);
      }
    };

    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isCameraRequested]);

  // 3. 影像處理迴圈
  useEffect(() => {
    if (!isCameraReady || !isOpenCvLoaded || capturedImage) return;

    const processFrame = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const hiddenCanvas = hiddenCanvasRef.current;
      const cv = window.cv;

      if (!video || !canvas || !hiddenCanvas || !cv) return;
      if (video.readyState !== video.HAVE_ENOUGH_DATA) {
        animationFrameId.current = requestAnimationFrame(processFrame);
        return;
      }

      const now = Date.now();
      if (now - lastProcessTime.current < 1000 / 30) {
        animationFrameId.current = requestAnimationFrame(processFrame);
        return;
      }
      lastProcessTime.current = now;

      const ctx = canvas.getContext('2d');
      const hiddenCtx = hiddenCanvas.getContext('2d', { willReadFrequently: true });
      if (!ctx || !hiddenCtx) return;

      if (canvas.width !== video.clientWidth || canvas.height !== video.clientHeight) {
        canvas.width = video.clientWidth;
        canvas.height = video.clientHeight;
      }

      const vw = video.videoWidth;
      const vh = video.videoHeight;

      const processWidth = 480;
      const scale = vw / processWidth;
      const processHeight = Math.round(vh / scale);

      hiddenCanvas.width = processWidth;
      hiddenCanvas.height = processHeight;
      hiddenCtx.drawImage(video, 0, 0, processWidth, processHeight);

      let src = new cv.Mat();
      let gray = new cv.Mat();
      let blur = new cv.Mat();
      let edges = new cv.Mat();
      let contours = new cv.MatVector();
      let hierarchy = new cv.Mat();

      try {
        src = cv.imread(hiddenCanvas);
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
        cv.GaussianBlur(gray, blur, new cv.Size(5, 5), 0);
        cv.Canny(blur, edges, 75, 200);
        cv.findContours(edges, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);

        let maxArea = 0;
        let bestRect: any = null;

        for (let i = 0; i < contours.size(); ++i) {
          let cnt = contours.get(i);
          let area = cv.contourArea(cnt);
          
          if (area > (processWidth * processHeight * 0.1) && area > maxArea) {
            maxArea = area;
            bestRect = cv.boundingRect(cnt);
          }
          cnt.delete();
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (bestRect) {
          const scaleX = canvas.width / processWidth;
          const scaleY = canvas.height / processHeight;

          const rect = {
            x: bestRect.x * scaleX,
            y: bestRect.y * scaleY,
            width: bestRect.width * scaleX,
            height: bestRect.height * scaleY
          };

          if (!smoothedRectRef.current) {
            smoothedRectRef.current = rect;
          } else {
            const alpha = 0.2;
            smoothedRectRef.current = {
              x: smoothedRectRef.current.x * (1 - alpha) + rect.x * alpha,
              y: smoothedRectRef.current.y * (1 - alpha) + rect.y * alpha,
              width: smoothedRectRef.current.width * (1 - alpha) + rect.width * alpha,
              height: smoothedRectRef.current.height * (1 - alpha) + rect.height * alpha,
            };
          }

          const r = smoothedRectRef.current;
          ctx.beginPath();
          ctx.rect(r.x, r.y, r.width, r.height);
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.fillStyle = 'rgba(59, 130, 246, 0.15)';
          ctx.fill();
        } else {
          smoothedRectRef.current = null;
        }

      } catch (err) {
        console.error("OpenCV Processing Error:", err);
      } finally {
        if (src) src.delete();
        if (gray) gray.delete();
        if (blur) blur.delete();
        if (edges) edges.delete();
        if (contours) contours.delete();
        if (hierarchy) hierarchy.delete();
      }

      animationFrameId.current = requestAnimationFrame(processFrame);
    };

    animationFrameId.current = requestAnimationFrame(processFrame);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isCameraReady, isOpenCvLoaded, capturedImage]);

  // 4. 拍照與裁切
  const handleCapture = () => {
    const video = videoRef.current;
    const displayCanvas = canvasRef.current;
    if (!video || !displayCanvas) return;

    setRecognitionStatus('處理中...');
    console.log('[Capture] 1. 開始擷取影像');

    setTimeout(async () => {
      let tempCanvas: HTMLCanvasElement | null = null;
      let originalDataUrl = '';
      
      try {
        const vw = video.videoWidth;
        const vh = video.videoHeight;
        const dw = displayCanvas.width;
        const dh = displayCanvas.height;

        // 1. tempCanvas: 擷取 Video 的原始解析度全圖
        tempCanvas = document.createElement('canvas');
        tempCanvas.width = vw;
        tempCanvas.height = vh;
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) {
          throw new Error('無法建立 tempCanvas context');
        }
        tempCtx.drawImage(video, 0, 0, vw, vh);
        originalDataUrl = tempCanvas.toDataURL('image/jpeg', 0.8);
        
        console.log('[Capture] 2. 原始影像擷取完成，準備 OpenCV 處理');

        const cv = window.cv;
        
        const cropCenter85 = () => {
          console.log('[Capture] 擷取中央 85% 區域');
          const cropW = vw * 0.85;
          const cropH = vh * 0.85;
          const cropX = (vw - cropW) / 2;
          const cropY = (vh - cropH) / 2;
          const croppedCanvas = document.createElement('canvas');
          croppedCanvas.width = cropW;
          croppedCanvas.height = cropH;
          const ctx = croppedCanvas.getContext('2d');
          if (ctx && tempCanvas) {
            ctx.drawImage(tempCanvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
          }
          return croppedCanvas.toDataURL('image/jpeg', 0.8);
        };

        if (!isOpenCvLoaded || !cv || !smoothedRectRef.current) {
          console.log('[Capture] 3. 未偵測到清晰邊緣或 OpenCV 未載入，使用中央 85% 圖片');
          setCapturedImage(cropCenter85());
          return;
        }

        // Wrap OpenCV processing in a Promise to allow timeout
        const processOpenCV = new Promise<string>((resolve, reject) => {
          let srcMat, dstMat;
          try {
            console.log('[Capture] 4. 計算最大外接矩形');
            // 2. 座標轉換公式：使用 videoWidth / canvasDisplayWidth 作為比例尺
            const scaleX = vw / dw;
            const scaleY = vh / dh;

            const r = smoothedRectRef.current!;
            
            let minX = r.x * scaleX;
            let minY = r.y * scaleY;
            let rectWidth = r.width * scaleX;
            let rectHeight = r.height * scaleY;

            // 確保邊界在影像範圍內
            minX = Math.max(0, minX);
            minY = Math.max(0, minY);
            if (minX + rectWidth > vw) rectWidth = vw - minX;
            if (minY + rectHeight > vh) rectHeight = vh - minY;

            // 如果計算出的矩形面積小於畫面 15%，自動擷取畫面中央 85% 的區域
            const rectArea = rectWidth * rectHeight;
            const videoArea = vw * vh;
            if (rectArea < videoArea * 0.15) {
              console.log('[Capture] 矩形過小 (<15%)，使用中央 85% 圖片');
              resolve(cropCenter85());
              return;
            }

            console.log('[Capture] 5. 執行裁切 (Crop)');
            srcMat = cv.imread(tempCanvas);
            let rx = Math.round(minX);
            let ry = Math.round(minY);
            let rw = Math.round(rectWidth);
            let rh = Math.round(rectHeight);
            if (rx + rw > vw) rw = vw - rx;
            if (ry + rh > vh) rh = vh - ry;
            const rect = new cv.Rect(rx, ry, rw, rh);
            dstMat = srcMat.roi(rect);

            console.log('[Capture] 6. 渲染至 croppedCanvas');
            const croppedCanvas = document.createElement('canvas');
            croppedCanvas.width = dstMat.cols;
            croppedCanvas.height = dstMat.rows;
            
            // 直接渲染與轉換
            cv.imshow(croppedCanvas, dstMat);
            const finalImageUrl = croppedCanvas.toDataURL('image/jpeg', 0.8);
            
            console.log('[Capture] 7. OpenCV 處理完成');
            resolve(finalImageUrl);
          } catch (e) {
            reject(e);
          } finally {
            // 清理記憶體
            if (srcMat) srcMat.delete();
            if (dstMat) dstMat.delete();
          }
        });

        const timeoutPromise = new Promise<string>((_, reject) => {
          setTimeout(() => reject(new Error('OpenCV 處理超時 (3秒)')), 3000);
        });

        try {
          const finalImage = await Promise.race([processOpenCV, timeoutPromise]);
          // 強制更新預覽
          setCapturedImage(finalImage);
        } catch (cvError) {
          console.error('[Capture] OpenCV 處理失敗或超時:', cvError);
          console.log('[Capture] 影像處理失敗或超時，將使用原始圖片');
          setCapturedImage(originalDataUrl);
        }

      } catch (err) {
        console.error("[Capture] 發生未預期錯誤:", err);
        console.log('[Capture] 處理圖片時發生錯誤，將使用原始圖片');
        if (originalDataUrl) {
          setCapturedImage(originalDataUrl);
        }
      } finally {
        console.log('[Capture] 8. 執行 finally 區塊，關閉相機並重置狀態');
        stopCamera();
        setRecognitionStatus('');
        
        // 觸發廣告刷新
        window.dispatchEvent(new CustomEvent('refresh-ad'));
      }
    }, 500); // 顯示 0.5 秒的「處理中...」
  };

  // 6. 執行辨識流程
  const handleRecognize = async () => {
    if (!capturedImage) return;
    try {
      const res = await processImage(capturedImage, setRecognitionStatus);
      setResults(res);
    } catch (err) {
      console.error(err);
      setRecognitionStatus('辨識失敗，請重試');
      setTimeout(() => setRecognitionStatus(''), 3000);
    }
  };

  const handleReset = () => {
    setResults(null);
    setCapturedImage(null);
    setRecognitionStatus('');
  };

  // 如果有辨識結果，顯示 ResultView
  if (results) {
    return <ResultView results={results} onReset={handleReset} />;
  }

  return (
    <div className="relative w-full flex-1 bg-white flex flex-col items-center justify-center overflow-hidden">
      <Script 
        src="https://docs.opencv.org/4.8.0/opencv.js" 
        strategy="afterInteractive"
        onLoad={handleOpenCvLoad}
      />

      {!isCameraRequested && !capturedImage ? (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-white p-6 text-center">
          <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-2xl mb-8 flex items-center justify-center text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 7V5a2 2 0 0 1 2-2h2"></path>
              <path d="M17 3h2a2 2 0 0 1 2 2v2"></path>
              <path d="M21 17v2a2 2 0 0 1-2 2h-2"></path>
              <path d="M7 21H5a2 2 0 0 1-2-2v-2"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-semibold mb-3 tracking-tight text-black">準備掃描</h2>
          <p className="text-gray-500 text-sm max-w-[260px] leading-relaxed">
            點擊下方按鈕啟動相機進行單字辨識。
          </p>
          {permissionError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm max-w-[260px] text-left">
              <p className="font-semibold mb-1">無法存取相機</p>
              <p className="mb-2">請確認瀏覽器已允許相機權限。</p>
              <p className="text-xs opacity-80">
                提示：若您在預覽視窗中無法開啟相機，請嘗試點擊右上角按鈕「在新分頁中開啟」本應用程式。
              </p>
            </div>
          )}
          <button 
            onClick={() => {
              setPermissionError(false);
              setIsCameraRequested(true);
            }}
            className="mt-10 px-10 py-3.5 bg-black text-white font-medium rounded-full hover:bg-gray-800 transition-all active:scale-95 shadow-lg"
          >
            啟動相機
          </button>
          
          <div className="mt-6">
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              id="image-upload"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    if (event.target?.result) {
                      setCapturedImage(event.target.result as string);
                      stopCamera();
                    }
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />
            <label 
              htmlFor="image-upload"
              className="text-gray-500 text-sm hover:text-black cursor-pointer underline underline-offset-4 transition-colors"
            >
              或從裝置上傳圖片
            </label>
          </div>
        </div>
      ) : !capturedImage ? (
        <>
          <video 
            ref={videoRef} 
            playsInline 
            muted 
            className="absolute inset-0 w-full h-full object-cover"
          />
          <canvas 
            ref={canvasRef} 
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
          />
          <canvas 
            ref={hiddenCanvasRef} 
            className="hidden" 
          />

          {!isOpenCvLoaded && isCameraReady && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 bg-white/80 backdrop-blur-md text-black px-4 py-2 rounded-full text-xs flex items-center gap-2 shadow-sm">
              <div className="w-3 h-3 border-2 border-gray-400 border-t-black rounded-full animate-spin"></div>
              視覺引擎載入中...
            </div>
          )}

          <div className="absolute bottom-8 left-0 right-0 flex justify-center z-20">
            <button 
              onClick={handleCapture}
              className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center active:scale-95 transition-transform shadow-lg"
            >
              <div className="w-16 h-16 bg-white/90 rounded-full"></div>
            </button>
          </div>
        </>
      ) : (
        <div className="absolute inset-0 z-30 bg-white flex flex-col">
          <div className="flex-1 relative p-4 flex items-center justify-center bg-gray-50 min-h-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={capturedImage} 
              alt="Scanned Document" 
              className="max-w-full max-h-full object-contain rounded-md shadow-lg"
            />
          </div>
          
          {/* 狀態提示區 */}
          {recognitionStatus && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 bg-white/90 backdrop-blur-md text-black px-6 py-4 rounded-2xl flex flex-col items-center gap-3 shadow-xl border border-gray-100">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-black rounded-full animate-spin"></div>
              <p className="text-sm font-medium tracking-widest">{recognitionStatus}</p>
            </div>
          )}

          <div className="flex-none h-24 flex items-center justify-between px-8 bg-white border-t border-gray-200">
            <button 
              onClick={() => setCapturedImage(null)}
              disabled={!!recognitionStatus}
              className="text-gray-500 hover:text-black px-4 py-2 font-medium tracking-wide disabled:opacity-50"
            >
              重拍
            </button>
            <button 
              onClick={handleRecognize}
              disabled={!!recognitionStatus}
              className="bg-black text-white px-8 py-3 rounded-full font-medium hover:bg-gray-800 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 shadow-md"
            >
              確認並辨識
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
