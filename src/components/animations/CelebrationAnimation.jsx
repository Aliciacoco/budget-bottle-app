// CelebrationAnimation.jsx - 心愿达成庆祝动画
// 参考 test.html 效果：图片弹出 + 对勾徽章 + 粒子喷射

import React, { useState, useEffect, useRef } from 'react';
import { getWishIcon } from '../../constants/wishIcons.jsx';

const CelebrationAnimation = ({ 
  wishName,
  amount,
  wishIcon,    // 图标 key
  wishImage,   // 图片 URL（优先使用）
  onComplete,
}) => {
  const [phase, setPhase] = useState('enter'); // enter | active | exit
  const [showCheck, setShowCheck] = useState(false);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const particles = useRef([]);
  
  // 粒子类
  class Particle {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.velocity = {
        x: (Math.random() - 0.5) * 22,
        y: Math.random() * -18 - 8
      };
      this.gravity = 0.6;
      this.friction = 0.94;
      this.life = 1;
      this.decay = Math.random() * 0.015 + 0.01;
      const colors = ['#22C55E', '#4ADE80', '#FCD34D', '#FFD700', '#06B6D4'];
      this.color = colors[Math.floor(Math.random() * colors.length)];
      this.size = Math.random() * 7 + 4;
    }
    
    draw(ctx) {
      ctx.save();
      ctx.globalAlpha = this.life;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    
    update() {
      this.velocity.x *= this.friction;
      this.velocity.y *= this.friction;
      this.velocity.y += this.gravity;
      this.x += this.velocity.x;
      this.y += this.velocity.y;
      this.life -= this.decay;
    }
  }

  // 粒子动画
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.scale(dpr, dpr);
    
    let animationId;
    
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
      
      particles.current = particles.current.filter(p => p.life > 0);
      particles.current.forEach(p => {
        p.update();
        p.draw(ctx);
      });
      
      animationId = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => cancelAnimationFrame(animationId);
  }, []);

  // 动画序列
  useEffect(() => {
    // 400ms 后显示对勾并喷射粒子
    const checkTimer = setTimeout(() => {
      setShowCheck(true);
      
      // 从图片顶部喷射粒子
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top;
        
        for (let i = 0; i < 60; i++) {
          particles.current.push(new Particle(cx, cy));
        }
      }
    }, 400);
    
    return () => clearTimeout(checkTimer);
  }, []);

  const handleClose = () => {
    setPhase('exit');
    setTimeout(() => {
      onComplete?.();
    }, 300);
  };

  // 获取图标配置
  const iconConfig = getWishIcon(wishIcon || 'ball1');
  const IconComponent = iconConfig?.icon;

  return (
    <div 
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-white transition-opacity duration-300 ${
        phase === 'exit' ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={handleClose}
    >
      {/* 粒子画布 */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ width: '100%', height: '100%' }}
      />
      
      {/* 主内容 */}
      <div className="relative flex flex-col items-center justify-center w-full max-w-md px-8">
        
        {/* 图片/图标容器 */}
        <div ref={containerRef} className="relative w-64 h-64 mx-auto mb-10">
          <div className="w-full h-full bg-gray-50 rounded-[48px] shadow-2xl flex items-center justify-center overflow-hidden border border-gray-100 anim-pop">
            {wishImage ? (
              <img 
                src={wishImage} 
                alt={wishName}
                className="w-full h-full object-cover"
              />
            ) : IconComponent ? (
              <IconComponent 
                size={100} 
                className="text-gray-300"
                strokeWidth={1.5}
              />
            ) : (
              <div className="text-8xl">🎁</div>
            )}
          </div>
          
          {/* 对勾徽章 */}
          <div 
            className={`absolute bottom-0 right-0 w-16 h-16 bg-green-500 rounded-full border-[5px] border-white flex items-center justify-center shadow-lg z-10 ${
              showCheck ? 'anim-badge' : 'opacity-0'
            }`}
            style={{ 
              transform: 'translate(25%, 25%)',
              boxShadow: '0 10px 20px rgba(34, 197, 94, 0.3)'
            }}
          >
            <svg 
              width="30" 
              height="30" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="white" 
              strokeWidth="4"
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <polyline 
                points="20 6 9 17 4 12" 
                className={`checkmark-path ${showCheck ? 'active' : ''}`}
              />
            </svg>
          </div>
        </div>
        
        {/* 文字 */}
        <div className="text-center w-full">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2 anim-text delay-300">
            {wishName || '心愿'}
          </h1>
          <p className="text-gray-400 font-bold anim-text delay-400">
            心愿已达成 🎉
          </p>
          {amount > 0 && (
            <p className="text-cyan-500 font-extrabold text-xl mt-3 anim-text delay-400" style={{ fontFamily: "'M PLUS Rounded 1c', sans-serif" }}>
              ¥{amount.toLocaleString()}
            </p>
          )}
        </div>
        
        {/* 按钮 */}
        <button 
          className="mt-12 bg-gray-100 text-gray-400 hover:text-gray-600 px-6 py-2.5 rounded-full text-sm font-bold transition-colors anim-text delay-400 active:scale-95"
          onClick={handleClose}
        >
          继续探索
        </button>
      </div>
      
      {/* 动画样式 */}
      <style>{`
        @keyframes pop-center {
          0% { transform: scale(0.5); opacity: 0; }
          50% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        
        @keyframes badge-hit {
          0% { transform: translate(25%, 25%) scale(0); opacity: 0; }
          60% { transform: translate(25%, 25%) scale(1.2); opacity: 1; }
          100% { transform: translate(25%, 25%) scale(1); opacity: 1; }
        }
        
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .anim-pop {
          animation: pop-center 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        
        .anim-badge {
          animation: badge-hit 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
        
        .anim-text {
          opacity: 0;
          animation: fade-up 0.6s ease-out forwards;
        }
        
        .delay-300 { animation-delay: 0.3s; }
        .delay-400 { animation-delay: 0.4s; }
        
        .checkmark-path {
          stroke-dasharray: 100;
          stroke-dashoffset: 100;
          transition: stroke-dashoffset 0.4s ease-out;
        }
        
        .checkmark-path.active {
          stroke-dashoffset: 0;
        }
      `}</style>
    </div>
  );
};

export default CelebrationAnimation;