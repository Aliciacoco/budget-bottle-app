// SettlementResultModal.jsx - 周结算全屏结果页
// 有节省：青色背景 + 白色粒子
// 空空如也：灰色背景 + 深灰粒子

import React, { useEffect, useState, useMemo } from 'react';
import { CLOUD_COLOR } from '../BudgetCloud';

const SettlementResultModal = ({ 
  isOpen, 
  savedAmount, 
  isEmpty,
  onClose,
  onSetBudget  // 设置预算回调
}) => {
  const [showContent, setShowContent] = useState(false);
  
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
    if (isOpen) {
      const timer = setTimeout(() => setShowContent(true), 100);
      return () => clearTimeout(timer);
    } else {
      setShowContent(false);
    }
  }, [isOpen]);

  // 处理继续按钮
  const handleContinue = () => {
    onClose?.();
    // 延迟一点弹出设置预算
    setTimeout(() => {
      onSetBudget?.();
    }, 300);
  };
  
  if (!isOpen) return null;
  
  // 背景颜色和粒子颜色
  const bgColor = isEmpty ? '#9CA3AF' : CLOUD_COLOR; // gray-400 / cyan
  const particleColor = isEmpty ? 'rgba(107, 114, 128, 0.5)' : 'white'; // gray-500 / white
  
  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ backgroundColor: bgColor }}
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
              backgroundColor: particleColor,
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
        {isEmpty ? (
          <>
            <h1 className="text-4xl font-extrabold text-white mb-4">
              空空如也
            </h1>
            <p className="text-white/70 font-bold text-lg">
              这周继续加油
            </p>
          </>
        ) : (
          <>
            <p className="text-white/70 font-bold text-lg mb-4">
              上周节省
            </p>
            <h1 
              className="text-6xl font-extrabold text-white mb-4"
              style={{ fontFamily: "'M PLUS Rounded 1c', sans-serif" }}
            >
              ¥{savedAmount.toLocaleString()}
            </h1>
            <p className="text-white/70 font-bold text-lg">
              已流入心愿池
            </p>
          </>
        )}
        
        <button
          onClick={handleContinue}
          className="mt-16 px-12 py-4 bg-white/20 text-white font-extrabold rounded-2xl active:scale-95 transition-transform backdrop-blur-sm"
        >
          开启新的一周
        </button>
      </div>
      
      {/* 动画样式 */}
      <style>{`
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
      `}</style>
    </div>
  );
};

export default SettlementResultModal;