// BudgetCloud.jsx - 云朵组件
// 功能：水位显示、波浪动画、底部阴影、动态嘴巴

import React, { useEffect, useRef, useState } from 'react';

// 设计系统颜色
export const CLOUD_COLOR = '#00C3E0';

const BudgetCloud = ({ 
  remaining, 
  total, 
  spent, 
  onClick,
  drainProgress = 0,
  isShaking = false
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const currentHRef = useRef(null);
  const mouthRef = useRef(null);
  const mouthOffsetRef = useRef({ x: 0, y: 0 });
  const [isPressed, setIsPressed] = useState(false);
  const [scale, setScale] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  
  // SVG原始尺寸
  const svgW = 300;
  const svgH = 260;
  // 显示尺寸
  const displayW = 320;
  const displayH = Math.round(displayW * svgH / svgW);

  // 计算实际水位
  const basePercentage = total > 0 ? Math.max(0, Math.min(100, (remaining / total) * 100)) : 0;
  const percentage = Math.max(0, basePercentage - drainProgress);

  const liquidColor = CLOUD_COLOR;

  // 计算缩放比例
  useEffect(() => {
    setScale(displayW / svgW);
  }, []);

  // 嘴巴漂浮动画
  useEffect(() => {
    let animationId;
    let startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const x = Math.sin(elapsed * 0.002) * 3 + Math.sin(elapsed * 0.0015) * 2;
      const y = Math.sin(elapsed * 0.0025) * 2 + Math.cos(elapsed * 0.002) * 1.5;
      
      mouthOffsetRef.current = { x, y };
      
      if (mouthRef.current) {
        const currentWidth = parseFloat(mouthRef.current.getAttribute('width')) || 40;
        const mouthX = 150 - currentWidth / 2 + x;
        const mouthY = 177 + y;
        mouthRef.current.setAttribute('x', mouthX);
        mouthRef.current.setAttribute('y', mouthY);
      }
      
      animationId = requestAnimationFrame(animate);
    };
    
    animate();
    return () => cancelAnimationFrame(animationId);
  }, []);

  // 当 isPressed 变化时更新嘴巴宽度
  useEffect(() => {
    if (mouthRef.current) {
      const mouthWidth = isPressed ? 52 : 40;
      const { x } = mouthOffsetRef.current;
      const mouthX = 150 - mouthWidth / 2 + x;
      mouthRef.current.setAttribute('width', mouthWidth);
      mouthRef.current.setAttribute('x', mouthX);
    }
  }, [isPressed]);

  // 水波动画
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setLoadError('Canvas 2D context unavailable');
      setIsLoading(false);
      return;
    }
    
    let animationFrameId;
    let isMounted = true;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = displayW * dpr;
    canvas.height = displayH * dpr;
    ctx.scale(dpr, dpr);

    const speed = 0.04;
    const wavelength = 0.025;
    const amplitude = 4 * scale;
    
    if (currentHRef.current === null) {
      currentHRef.current = percentage;
    }

    // 【修复1】调整云朵内部的水位范围
    // 云朵实际可视范围约为 Y: 33 ~ 228（根据 cloudPath）
    // 但考虑云朵形状，有效填充区域调整为：
    const C_TOP = 45 * scale;   // 上移顶部边界，让水位能更高
    const C_BOT = 220 * scale;  // 底部保持不变

    const B_SETTINGS = [
      { x: 60 * scale,  y: 200 * scale, maxR: 5 * scale, delay: 80 },
      { x: 120 * scale, y: 210 * scale, maxR: 8 * scale, delay: 0 },
      { x: 180 * scale, y: 205 * scale, maxR: 6 * scale, delay: 320 },
      { x: 240 * scale, y: 200 * scale, maxR: 4 * scale, delay: 180 }
    ];

    const bubbles = B_SETTINGS.map(set => ({
      ...set, r: 0.1, status: 'waiting', waitCounter: 0, f: 0,
      maxTravel: 60 * scale, configY: set.y, dyingRStart: 0
    }));

    const bubbleSVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="45" fill="white" fill-opacity="0.20"/>
    <path d="M62 38 A 18 18 0 0 1 72 52" 
    fill="none" 
    stroke="${liquidColor.replace('#', '%23')}"
    stroke-width="6" 
    stroke-linecap="round" 
    stroke-opacity="0.6"/>
    </svg>`;
    
    const bubbleImg = new Image();
    
    // 【修复2】添加超时和错误处理
    const loadTimeout = setTimeout(() => {
      if (isMounted && isLoading) {
        console.warn('BudgetCloud: Bubble image load timeout, starting render anyway');
        setIsLoading(false);
        render();
      }
    }, 2000);

    const render = () => {
      if (!isMounted) return;
      
      ctx.clearRect(0, 0, displayW, displayH);
      
      currentHRef.current += (percentage - currentHRef.current) * 0.08;

      const phase = (performance.now() * speed * 0.001) * 25;

      // 【修复1】重新计算水位，让100%时水位达到云朵95%高度
      // fillRange 是水位可变动的总范围
      const fillRange = C_BOT - C_TOP;
      // 当 percentage=100 时，waterLevel 应该接近 C_TOP
      // 当 percentage=0 时，waterLevel 应该在 C_BOT 以下（不可见）
      const waterLevel = C_BOT - (fillRange * (currentHRef.current / 100));

      ctx.beginPath();
      ctx.fillStyle = liquidColor;
      ctx.moveTo(0, displayH);
      
      for (let x = 0; x <= displayW; x++) {
        const waveY = waterLevel + Math.sin(x * wavelength / scale + phase) * amplitude;
        ctx.lineTo(x, waveY);
      }
      
      ctx.lineTo(displayW, displayH);
      ctx.closePath();
      ctx.fill();

      // 气泡
      if (currentHRef.current > 5 && bubbleImg.complete) {
        bubbles.forEach(b => {
          if (b.status === 'waiting') {
            b.waitCounter++;
            if (b.waitCounter >= (100 + b.delay)) {
              b.status = 'birthing'; 
              b.f = 0; 
              b.r = 0.1; 
              b.y = b.configY;
            }
          } else {
            b.y -= 0.3 * scale;
            
            if (b.status === 'birthing') {
              b.f++; 
              b.r = (b.f / 25) * b.maxR;
              if (b.f >= 25) b.status = 'moving';
            } else if (b.status === 'moving') {
              b.r *= 0.998;
              const travel = b.configY - b.y;
              if (travel >= b.maxTravel || b.y <= waterLevel + b.r) {
                b.status = 'dying'; 
                b.f = 0; 
                b.dyingRStart = b.r;
              }
            } else if (b.status === 'dying') {
              b.f++; 
              b.r = b.dyingRStart * (1 - b.f / 25);
            }

            if ((b.status === 'dying' && b.f >= 25) || b.r <= 0.05) {
              b.status = 'waiting'; 
              b.waitCounter = 0;
            }

            if (b.y > waterLevel && b.status !== 'waiting' && b.r > 0) {
              ctx.save();
              const drawSize = Math.max(0.5, b.r * 2);
              if (b.status === 'birthing') ctx.globalAlpha = b.f / 25;
              if (b.status === 'dying') ctx.globalAlpha = 1 - b.f / 25;
              ctx.drawImage(bubbleImg, b.x - drawSize / 2, b.y - drawSize / 2, drawSize, drawSize);
              ctx.restore();
            }
          }
        });
      }

      animationFrameId = requestAnimationFrame(render);
    };

    bubbleImg.onload = () => {
      clearTimeout(loadTimeout);
      if (isMounted) {
        setIsLoading(false);
        setLoadError(null);
        render();
      }
    };
    
    bubbleImg.onerror = (e) => {
      clearTimeout(loadTimeout);
      console.error('BudgetCloud: Failed to load bubble image', e);
      if (isMounted) {
        setIsLoading(false);
        // 即使气泡图片加载失败，也继续渲染水波
        render();
      }
    };
    
    bubbleImg.src = bubbleSVG;
    
    // 如果图片已经缓存，直接渲染
    if (bubbleImg.complete) {
      clearTimeout(loadTimeout);
      setIsLoading(false);
      render();
    }
    
    return () => {
      isMounted = false;
      clearTimeout(loadTimeout);
      cancelAnimationFrame(animationFrameId);
    };
  }, [percentage, liquidColor, scale, displayW, displayH]);

  // 云朵路径
  const scaledCloudPath = `path('M${141.872 * scale} ${33 * scale}C${167.933 * scale} ${33.0001 * scale} ${190.742 * scale} ${46.6446 * scale} ${203.696 * scale} ${67.1777 * scale}C${206.236 * scale} ${71.2314 * scale} ${210.326 * scale} ${73.9341 * scale} ${214.924 * scale} ${74.6494 * scale}C${251.805 * scale} ${80.4783 * scale} ${280 * scale} ${112.298 * scale} ${280 * scale} ${150.821 * scale}C${280 * scale} ${193.451 * scale} ${247.233 * scale} ${228.001 * scale} ${206.872 * scale} ${228.001 * scale}H${85 * scale}C${48.728 * scale} ${226.014 * scale} ${20 * scale} ${197.611 * scale} ${20 * scale} ${163.009 * scale}C${20.0001 * scale} ${136.673 * scale} ${36.6628 * scale} ${113.994 * scale} ${60.6152 * scale} ${103.794 * scale}C${65.6191 * scale} ${101.674 * scale} ${69.2007 * scale} ${97.0373 * scale} ${70.3184 * scale} ${91.5264 * scale}C${77.0749 * scale} ${58.1431 * scale} ${106.515 * scale} ${33 * scale} ${141.872 * scale} ${33 * scale}Z')`;

  const cloudPath = "M141.872 33C167.933 33.0001 190.742 46.6446 203.696 67.1777C206.236 71.2314 210.326 73.9341 214.924 74.6494C251.805 80.4783 280 112.298 280 150.821C280 193.451 247.233 228.001 206.872 228.001H85C48.728 226.014 20 197.611 20 163.009C20.0001 136.673 36.6628 113.994 60.6152 103.794C65.6191 101.674 69.2007 97.0373 70.3184 91.5264C77.0749 58.1431 106.515 33 141.872 33Z";

  const handleClick = (e) => {
    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 200);
    if (onClick) onClick(e);
  };

  const mouthWidth = 40;
  const mouthHeight = 14;
  const mouthX = 150 - mouthWidth / 2;
  const mouthY = 177;

  return (
    <div 
      ref={containerRef}
      className={`relative cursor-pointer active:scale-95 transition-transform duration-300 ${isShaking ? 'animate-shake' : ''}`}
      onClick={handleClick}
      style={{ 
        width: `${displayW}px`,
        height: `${displayH}px`
      }}
    >
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.6s ease-in-out;
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        .animate-pulse-loading {
          animation: pulse 1.5s ease-in-out infinite;
        }
      `}</style>
      
      {/* 云朵背景SVG（带阴影） */}
      <svg 
        className="absolute inset-0"
        width={displayW}
        height={displayH}
        viewBox="0 0 300 260"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <filter id="cloudShadow" x="-10%" y="-10%" width="120%" height="130%">
            <feDropShadow dx="0" dy="7" stdDeviation="0" floodColor="#0EABC3" floodOpacity="1" />
          </filter>
        </defs>
        <path 
          d={cloudPath} 
          fill="#F3F4F6"
          filter="url(#cloudShadow)"
        />
      </svg>
      
      {/* 【修复2】加载状态指示 */}
      {isLoading && (
        <div 
          className="absolute inset-0 flex items-center justify-center"
          style={{
            clipPath: scaledCloudPath,
            WebkitClipPath: scaledCloudPath
          }}
        >
          <div className="animate-pulse-loading text-center">
            <div 
              className="w-8 h-8 mx-auto mb-2 rounded-full"
              style={{ backgroundColor: liquidColor, opacity: 0.3 }}
            />
            <span className="text-xs text-gray-400">加载中...</span>
          </div>
        </div>
      )}
      
      {/* 【修复2】错误状态提示 */}
      {loadError && (
        <div 
          className="absolute inset-0 flex items-center justify-center"
          style={{
            clipPath: scaledCloudPath,
            WebkitClipPath: scaledCloudPath
          }}
        >
          <div className="text-center text-xs text-red-400 px-4">
            <div className="mb-1">⚠️</div>
            <div>{loadError}</div>
            <div className="mt-1 text-gray-400">请刷新重试</div>
          </div>
        </div>
      )}
      
      {/* 水波Canvas层 */}
      <div 
        className="absolute inset-0"
        style={{
          clipPath: scaledCloudPath,
          WebkitClipPath: scaledCloudPath,
          opacity: isLoading ? 0 : 1,
          transition: 'opacity 0.3s ease-in-out'
        }}
      >
        <canvas 
          ref={canvasRef}
          style={{ 
            width: `${displayW}px`, 
            height: `${displayH}px`
          }} 
        />
      </div>
      
      {/* 嘴巴层 */}
      <svg 
        className="absolute inset-0 pointer-events-none"
        width={displayW}
        height={displayH}
        viewBox="0 0 300 260"
        preserveAspectRatio="xMidYMid meet"
        style={{
          opacity: isLoading ? 0 : 1,
          transition: 'opacity 0.3s ease-in-out'
        }}
      >
        <defs>
          <filter id="mouthShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="1" floodColor="#0EABC3" floodOpacity="0.6" />
          </filter>
        </defs>
        <rect 
          ref={mouthRef}
          x={mouthX}
          y={mouthY}
          width={mouthWidth}
          height={mouthHeight}
          rx="7"
          fill="white"
          filter="url(#mouthShadow)"
          style={{
            transition: 'width 0.15s ease-out'
          }}
        />
      </svg>
    </div>
  );
};

export default BudgetCloud;