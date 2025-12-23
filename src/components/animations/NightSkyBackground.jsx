// NightSkyBackground.jsx - 夜间背景效果
// 根据时间自动切换，包含闪烁的星星

import React, { useState, useEffect, useMemo } from 'react';

// 判断是否是夜间（18:00 - 6:00）
export const isNightTime = () => {
  const hour = new Date().getHours();
  return hour >= 18 || hour < 6;
};

// 获取夜间渐变程度（用于平滑过渡）
export const getNightIntensity = () => {
  const hour = new Date().getHours();
  const minute = new Date().getMinutes();
  const time = hour + minute / 60;
  
  // 18:00-20:00 渐变到夜间
  if (time >= 18 && time < 20) {
    return (time - 18) / 2;
  }
  // 20:00-5:00 完全夜间
  if (time >= 20 || time < 5) {
    return 1;
  }
  // 5:00-7:00 渐变到白天
  if (time >= 5 && time < 7) {
    return 1 - (time - 5) / 2;
  }
  // 白天
  return 0;
};

// 星星组件
const Star = ({ x, y, size, delay }) => (
  <div
    className="absolute rounded-full bg-white animate-twinkle"
    style={{
      left: `${x}%`,
      top: `${y}%`,
      width: size,
      height: size,
      animationDelay: `${delay}s`,
      boxShadow: `0 0 ${size * 2}px ${size / 2}px rgba(255,255,255,0.3)`
    }}
  />
);

// 流星组件
const ShootingStar = ({ delay }) => {
  const startX = 10 + Math.random() * 30;
  const startY = 5 + Math.random() * 20;
  
  return (
    <div
      className="absolute w-1 h-1 bg-white rounded-full animate-shooting-star"
      style={{
        left: `${startX}%`,
        top: `${startY}%`,
        animationDelay: `${delay}s`,
      }}
    />
  );
};

const NightSkyBackground = ({ children, className = '' }) => {
  const [isNight, setIsNight] = useState(isNightTime());
  const [intensity, setIntensity] = useState(getNightIntensity());
  
  // 每分钟检查一次时间
  useEffect(() => {
    const checkTime = () => {
      setIsNight(isNightTime());
      setIntensity(getNightIntensity());
    };
    
    const interval = setInterval(checkTime, 60000);
    return () => clearInterval(interval);
  }, []);
  
  // 生成固定的星星位置（使用 useMemo 避免重新生成）
  const stars = useMemo(() => {
    const starList = [];
    for (let i = 0; i < 50; i++) {
      starList.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 60, // 只在上半部分
        size: 1 + Math.random() * 2,
        delay: Math.random() * 3
      });
    }
    return starList;
  }, []);
  
  // 日间背景
  const dayBackground = 'bg-gray-50';
  
  // 夜间背景渐变
  const nightBackground = `linear-gradient(to bottom, 
    rgba(15, 23, 42, ${intensity}) 0%, 
    rgba(30, 41, 59, ${intensity}) 30%,
    rgba(51, 65, 85, ${intensity}) 60%,
    rgba(71, 85, 105, ${intensity * 0.8}) 100%
  )`;

  return (
    <div 
      className={`relative min-h-screen transition-colors duration-1000 ${!isNight ? dayBackground : ''} ${className}`}
      style={isNight ? { background: nightBackground } : {}}
    >
      {/* 星星层 */}
      {isNight && intensity > 0.3 && (
        <div 
          className="absolute inset-0 overflow-hidden pointer-events-none z-0"
          style={{ opacity: intensity }}
        >
          {stars.map(star => (
            <Star key={star.id} {...star} />
          ))}
          
          {/* 偶尔的流星 */}
          <ShootingStar delay={5} />
          <ShootingStar delay={12} />
          <ShootingStar delay={20} />
        </div>
      )}
      
      {/* 月亮 */}
      {isNight && intensity > 0.5 && (
        <div 
          className="absolute top-16 right-8 w-12 h-12 rounded-full z-0 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 30% 30%, #FEF9C3, #FDE68A)',
            boxShadow: '0 0 30px 10px rgba(253, 230, 138, 0.3)',
            opacity: intensity
          }}
        />
      )}
      
      {/* 内容层 */}
      <div className="relative z-10">
        {children}
      </div>
      
      {/* 动画样式 */}
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        .animate-twinkle {
          animation: twinkle 2s ease-in-out infinite;
        }
        
        @keyframes shooting-star {
          0% { 
            transform: translateX(0) translateY(0) rotate(45deg);
            opacity: 1;
            width: 4px;
            height: 4px;
          }
          70% {
            opacity: 1;
          }
          100% { 
            transform: translateX(200px) translateY(200px) rotate(45deg);
            opacity: 0;
            width: 2px;
            height: 100px;
          }
        }
        .animate-shooting-star {
          animation: shooting-star 1s ease-out infinite;
        }
      `}</style>
    </div>
  );
};

export default NightSkyBackground;