// RainEffect.jsx - 首页下雨效果
// 水滴形状的雨滴，从云朵底部落到页面底部
// 修改：z-index 调低，让水滴在心愿球后面

import React, { useEffect, useRef } from 'react';

// 主题色
const THEME_COLOR = '#00BFDC';

const RainEffect = ({ 
  isActive, 
  cloudRef
}) => {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    if (!isActive) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    
    // 获取云朵位置
    let startY = height * 0.45;
    let startLeft = width * 0.2;
    let startRight = width * 0.8;
    
    if (cloudRef?.current) {
      const rect = cloudRef.current.getBoundingClientRect();
      startY = rect.bottom;
      startLeft = rect.left + rect.width * 0.1;
      startRight = rect.right - rect.width * 0.1;
    }
    
    // 落到页面底部
    const endY = height + 50;
    
    const drops = [];
    const dropCount = 18;
    
    // 绘制水滴形状（纯色）
    const drawDrop = (x, y, size, opacity) => {
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.fillStyle = THEME_COLOR;
      
      // 绘制水滴形状（贝塞尔曲线）
      ctx.beginPath();
      ctx.moveTo(x, y - size); // 顶部尖端
      ctx.bezierCurveTo(
        x + size * 0.7, y - size * 0.2,
        x + size * 0.7, y + size * 0.6,
        x, y + size
      );
      ctx.bezierCurveTo(
        x - size * 0.7, y + size * 0.6,
        x - size * 0.7, y - size * 0.2,
        x, y - size
      );
      ctx.fill();
      
      ctx.restore();
    };
    
    // 初始化水滴
    for (let i = 0; i < dropCount; i++) {
      drops.push({
        x: startLeft + Math.random() * (startRight - startLeft),
        y: startY + Math.random() * 100,
        speed: 5 + Math.random() * 4,
        size: 10 + Math.random() * 8,
        opacity: 0.7 + Math.random() * 0.3,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.03 + Math.random() * 0.03
      });
    }
    
    let animationId;
    
    const render = () => {
      ctx.clearRect(0, 0, width, height);
      
      drops.forEach(drop => {
        // 轻微左右摆动
        drop.wobble += drop.wobbleSpeed;
        const wobbleX = Math.sin(drop.wobble) * 3;
        
        drawDrop(drop.x + wobbleX, drop.y, drop.size, drop.opacity);
        
        // 更新位置
        drop.y += drop.speed;
        
        // 到达页面底部时重置
        if (drop.y > endY) {
          drop.y = startY - Math.random() * 30;
          drop.x = startLeft + Math.random() * (startRight - startLeft);
          drop.speed = 5 + Math.random() * 4;
          drop.size = 10 + Math.random() * 8;
        }
      });
      
      animationId = requestAnimationFrame(render);
    };
    
    render();
    
    return () => cancelAnimationFrame(animationId);
  }, [isActive, cloudRef]);
  
  if (!isActive) return null;
  
  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ 
        width: '100%', 
        height: '100%',
        zIndex: 25  // 低于心愿池(30)，让水滴在心愿球后面
      }}
    />
  );
};

export default RainEffect;