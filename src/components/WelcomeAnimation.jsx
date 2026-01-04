// WelcomeAnimation.jsx - 欢迎回来动画
// 参考周结算动画样式：全屏青色背景 + 白色粒子

import React, { useState, useEffect, useMemo } from 'react';

const CLOUD_COLOR = '#06B6D4'; // cyan-500

const WelcomeAnimation = ({ userName, onComplete }) => {
  const [showContent, setShowContent] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  
  // 固定的粒子位置
  const particles = useMemo(() => {
    return [...Array(25)].map((_, i) => ({
      id: i,
      x: (i * 17 + 5) % 100,
      y: (i * 23 + 10) % 100,
      size: 20 + (i % 6) * 15,
      opacity: 0.06 + (i % 4) * 0.03,
      delay: (i * 0.15) % 2.5
    }));
  }, []);
  
  // 动画入场
  useEffect(() => {
    const showTimer = setTimeout(() => setShowContent(true), 100);
    return () => clearTimeout(showTimer);
  }, []);
  
  // 处理关闭
  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onComplete?.();
    }, 400);
  };
  
  return (
    <div 
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-opacity duration-400 ${
        isExiting ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ backgroundColor: CLOUD_COLOR }}
    >
      {/* 背景粒子 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map(p => (
          <div
            key={p.id}
            className="absolute rounded-full animate-float-particle"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              backgroundColor: 'white',
              opacity: p.opacity,
              animationDelay: `${p.delay}s`
            }}
          />
        ))}
      </div>
      
      {/* 主内容 */}
      <div className={`relative z-10 text-center px-8 transition-all duration-500 ${
        showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}>
        {/* 云朵图标 */}
        <div className="mb-6 animate-bounce-gentle">
          <svg width="100" height="75" viewBox="0 0 100 75" fill="none" className="mx-auto">
            <path 
              d="M80 56H20C11 56 4 49 4 40C4 31 11 24 20 24C20 24 20 24 20 24C21.5 12.5 32 4 45 4C55.5 4 64.5 10.5 68 20C70.5 18.5 73.5 17.5 77 17.5C88.5 17.5 98 27 98 38.5C98 38.5 98 38.5 98 38.5C98 49 88.5 56 80 56Z"
              fill="white"
            />
            {/* 眼睛 */}
            <circle cx="38" cy="38" r="4" fill={CLOUD_COLOR} />
            <circle cx="62" cy="38" r="4" fill={CLOUD_COLOR} />
            {/* 眼睛高光 */}
            <circle cx="36" cy="36" r="1.5" fill="white" />
            <circle cx="60" cy="36" r="1.5" fill="white" />
            {/* 腮红 */}
            <ellipse cx="28" cy="45" rx="6" ry="4" fill="#FB7185" fillOpacity="0.5" />
            <ellipse cx="72" cy="45" rx="6" ry="4" fill="#FB7185" fillOpacity="0.5" />
            {/* 微笑 */}
            <path 
              d="M42 48 Q50 56 58 48" 
              stroke={CLOUD_COLOR}
              strokeWidth="3" 
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </div>
        
        <p className="text-white/70 font-bold text-lg mb-3">
          欢迎回来
        </p>
        <h1 
          className="text-4xl font-extrabold text-white mb-4"
          style={{ fontFamily: "'M PLUS Rounded 1c', sans-serif" }}
        >
          {userName}
        </h1>
        <p className="text-white/70 font-bold text-lg">
          云朵都想你啦 (´･ω･`)
        </p>
        
        <button
          onClick={handleClose}
          className="mt-12 px-12 py-4 bg-white/20 text-white font-extrabold rounded-2xl active:scale-95 transition-transform backdrop-blur-sm"
        >
          开始使用
        </button>
      </div>
      
      {/* 动画样式 */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@400;500;700;800&display=swap');
        
        @keyframes float-particle {
          0%, 100% { 
            transform: translateY(0) scale(1); 
          }
          50% { 
            transform: translateY(-20px) scale(1.1); 
          }
        }
        .animate-float-particle {
          animation: float-particle 4s ease-in-out infinite;
        }
        
        @keyframes bounce-gentle {
          0%, 100% { 
            transform: translateY(0); 
          }
          50% { 
            transform: translateY(-10px); 
          }
        }
        .animate-bounce-gentle {
          animation: bounce-gentle 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default WelcomeAnimation;