//预算云朵组件 - 修复液体填充问题

import React from 'react';

const BudgetCloud = ({ remaining, total, spent, onClick }) => {
  // 计算剩余百分比
  const percentage = total > 0 ? Math.max(0, Math.min(100, (remaining / total) * 100)) : 0;
  
  // 云朵尺寸
  const cloudWidth = 280;
  const cloudHeight = 180;
  
  // 液体高度（从底部开始）
  const liquidHeight = (percentage / 100) * cloudHeight;
  
  // 根据剩余百分比决定颜色
  const getColor = () => {
    if (remaining < 0) return { light: '#fee2e2', dark: '#ef4444' }; // 红色 - 超支
    if (percentage < 30) return { light: '#fef3c7', dark: '#f59e0b' }; // 黄色 - 警告
    return { light: '#a5f3fc', dark: '#06b6d4' }; // 青色 - 正常
  };
  
  const colors = getColor();

  return (
    <div 
      className="relative cursor-pointer active:scale-95 transition-transform"
      onClick={onClick}
      style={{ width: cloudWidth, height: cloudHeight }}
    >
      <svg 
        width={cloudWidth} 
        height={cloudHeight} 
        viewBox="0 0 280 180"
        className="drop-shadow-lg"
      >
        <defs>
          {/* 云朵形状路径 */}
          <clipPath id="cloudClip">
            <path d="
              M 50 140
              Q 20 140 20 110
              Q 20 80 50 80
              Q 50 40 100 40
              Q 120 20 160 30
              Q 200 10 230 50
              Q 270 50 260 90
              Q 280 110 250 140
              Z
            " />
          </clipPath>
          
          {/* 液体波浪渐变 */}
          <linearGradient id="liquidGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={colors.dark} stopOpacity="0.9" />
            <stop offset="100%" stopColor={colors.light} stopOpacity="0.95" />
          </linearGradient>
          
          {/* 波浪动画 */}
          <pattern id="wavePattern" x="0" y="0" width="200" height="20" patternUnits="userSpaceOnUse">
            <path 
              d="M 0 10 Q 25 0 50 10 Q 75 20 100 10 Q 125 0 150 10 Q 175 20 200 10 L 200 30 L 0 30 Z" 
              fill="url(#liquidGradient)"
            >
              <animate 
                attributeName="d" 
                values="
                  M 0 10 Q 25 0 50 10 Q 75 20 100 10 Q 125 0 150 10 Q 175 20 200 10 L 200 30 L 0 30 Z;
                  M 0 10 Q 25 20 50 10 Q 75 0 100 10 Q 125 20 150 10 Q 175 0 200 10 L 200 30 L 0 30 Z;
                  M 0 10 Q 25 0 50 10 Q 75 20 100 10 Q 125 0 150 10 Q 175 20 200 10 L 200 30 L 0 30 Z
                "
                dur="3s"
                repeatCount="indefinite"
              />
            </path>
          </pattern>
        </defs>
        
        {/* 云朵背景 - 白色 */}
        <path 
          d="
            M 50 140
            Q 20 140 20 110
            Q 20 80 50 80
            Q 50 40 100 40
            Q 120 20 160 30
            Q 200 10 230 50
            Q 270 50 260 90
            Q 280 110 250 140
            Z
          "
          fill="white"
          stroke="#e0f2fe"
          strokeWidth="2"
        />
        
        {/* 液体层 - 使用 clipPath 裁剪 */}
        <g clipPath="url(#cloudClip)">
          {/* 液体主体 - 从底部填充到指定高度 */}
          <rect 
            x="0" 
            y={180 - liquidHeight} 
            width="280" 
            height={liquidHeight + 20}
            fill="url(#liquidGradient)"
          />
          {/* 波浪顶部 */}
          {percentage > 0 && percentage < 100 && (
            <rect 
              x="-50" 
              y={180 - liquidHeight - 15} 
              width="380" 
              height="25"
              fill="url(#wavePattern)"
            >
              <animate 
                attributeName="x" 
                values="-50;-250;-50" 
                dur="8s" 
                repeatCount="indefinite"
              />
            </rect>
          )}
        </g>
        
        {/* 云朵边框（再画一次保证边缘清晰） */}
        <path 
          d="
            M 50 140
            Q 20 140 20 110
            Q 20 80 50 80
            Q 50 40 100 40
            Q 120 20 160 30
            Q 200 10 230 50
            Q 270 50 260 90
            Q 280 110 250 140
            Z
          "
          fill="none"
          stroke="#e0f2fe"
          strokeWidth="2"
        />
      </svg>
      
      {/* 金额显示 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span 
          className="text-4xl font-bold"
          style={{ color: remaining < 0 ? '#ef4444' : '#0891b2' }}
        >
          ¥{Math.abs(remaining).toLocaleString()}
        </span>
        <span className="text-sm text-gray-400 mt-1">
          {remaining < 0 ? '已超支' : '点击记账'}
        </span>
      </div>
    </div>
  );
};

export default BudgetCloud;