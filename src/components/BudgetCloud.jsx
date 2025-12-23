// BudgetCloud.jsx - 云朵组件
// 功能：水位显示、波浪动画、结算排水动画、空云抖动

import React, { useEffect, useRef } from 'react';

// 设计系统颜色
export const CLOUD_COLOR = '#00BFDC';  // cyan-500

const BudgetCloud = ({ 
  remaining, 
  total, 
  spent, 
  onClick,
  drainProgress = 0,  // 0-100 排水进度（结算动画用）
  isShaking = false   // 是否抖动（空云动画用）
}) => {
  const canvasRef = useRef(null);
  const currentHRef = useRef(null);
  
  const originalW = 308;
  const originalH = 224;
  const logicalW = 280;
  const logicalH = Math.round(logicalW * (originalH / originalW));

  // 计算实际水位（考虑排水进度）
  const basePercentage = total > 0 ? Math.max(0, Math.min(100, (remaining / total) * 100)) : 0;
  const percentage = Math.max(0, basePercentage - drainProgress);

  const liquidColor = CLOUD_COLOR;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = logicalW * dpr;
    canvas.height = logicalH * dpr;
    ctx.scale(dpr, dpr);

    const speed = 0.04;
    const wavelength = 0.025;
    const amplitude = 4;
    
    if (currentHRef.current === null) {
      currentHRef.current = percentage;
    }

    const C_TOP = 0.03;
    const C_BOT = 0.95;

    const B_SETTINGS = [
      { x: 45,  y: logicalH * 0.80, maxR: 5, delay: 80 },
      { x: 110, y: logicalH * 0.99, maxR: 8, delay: 0 },
      { x: 175, y: logicalH * 0.90, maxR: 6, delay: 320 },
      { x: 240, y: logicalH * 0.88, maxR: 4, delay: 180 }
    ];

    const bubbles = B_SETTINGS.map(set => ({
      ...set, r: 0.1, status: 'waiting', waitCounter: 0, f: 0,
      maxTravel: logicalH * 0.3, configY: set.y, dyingRStart: 0
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
    bubbleImg.src = bubbleSVG;

    const render = () => {
      ctx.clearRect(0, 0, logicalW, logicalH);
      
      currentHRef.current += (percentage - currentHRef.current) * 0.08;

      const phase = (performance.now() * speed * 0.001) * 25;

      const tY = logicalH * C_TOP;
      const bY = logicalH * C_BOT;
      const fillRange = bY - tY - amplitude * 2;
      const waterLevel = bY - amplitude - (fillRange * (currentHRef.current / 100));

      ctx.beginPath();
      ctx.fillStyle = liquidColor;
      ctx.moveTo(0, logicalH);
      
      for (let x = 0; x <= logicalW; x++) {
        const waveY = waterLevel + Math.sin(x * wavelength + phase) * amplitude;
        ctx.lineTo(x, waveY);
      }
      
      ctx.lineTo(logicalW, logicalH);
      ctx.closePath();
      ctx.fill();

      // 只在有水时显示气泡
      if (currentHRef.current > 5) {
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
            b.y -= 0.2;
            
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

    bubbleImg.onload = () => render();
    if (bubbleImg.complete) render();
    
    return () => cancelAnimationFrame(animationFrameId);
  }, [percentage, logicalH, liquidColor]);

  const cloudPath = "M170.621 38C201.558 38 228.755 53.2859 244.555 76.4834L245.299 77.5938L245.306 77.6035C247.53 81.0058 251.079 83.3252 255.11 84.0352L255.502 84.0986L255.511 84.0996C299.858 90.8163 334 127.546 334 172.283C334 221.589 294.443 261.625 245.621 261.625H104.896L104.79 261.619C61.1843 259.33 26 226.502 26 185.76C26 154.771 46.4474 128.375 75.3525 116.578L75.3594 116.575C79.8465 114.754 83.1194 110.742 84.1465 105.889C92.3483 67.057 128.005 38.0001 170.621 38Z";

  return (
    <div 
      className={`relative cursor-pointer active:scale-95 transition-transform duration-300 flex items-center justify-center ${isShaking ? 'animate-shake' : ''}`}
      onClick={onClick}
      style={{ 
        width: '100%',
        maxWidth: `${logicalW}px`, 
        aspectRatio: `${logicalW} / ${logicalH}`
      }}
    >
      {/* 抖动动画样式 */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.6s ease-in-out;
        }
      `}</style>
      
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <clipPath id="cloudClipPath" clipPathUnits="userSpaceOnUse" transform={`scale(${logicalW / originalW})`}>
            <path d={cloudPath} transform="translate(-26, -38)" />
          </clipPath>
        </defs>
      </svg>

      <svg 
        className="absolute inset-0" 
        width="100%"
        height="100%"
        viewBox="26 38 308 224"
        preserveAspectRatio="xMidYMid meet"
      >
        <path 
          d={cloudPath} 
          fill="#F3F4F6"
        />
      </svg>

      <div 
        className="absolute inset-0 overflow-hidden"
        style={{
          clipPath: "url(#cloudClipPath)",
          WebkitClipPath: "url(#cloudClipPath)"
        }}
      >
        <canvas 
          ref={canvasRef} 
          style={{ 
            width: '100%', 
            height: '100%'
          }} 
        />
      </div>
    </div>
  );
};

export default BudgetCloud;