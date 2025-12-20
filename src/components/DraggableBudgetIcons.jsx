// DraggableBudgetIcons.jsx - 首页可拖拽的独立预算图标
// 新增功能：双指缩放、置于底层

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { getFloatingIcon, FLOATING_ICONS } from '../constants/floatingIcons.jsx';

const DraggableBudgetIcons = ({ budgets = [], onBudgetClick, containerRef }) => {
  const [positions, setPositions] = useState({});
  const [scales, setScales] = useState({});  // 每个图标的缩放比例
  const [dragging, setDragging] = useState(null);
  const [scaling, setScaling] = useState(null);  // 正在缩放的图标
  const dragStartPos = useRef({ x: 0, y: 0 });
  const dragStartTime = useRef(0);
  const hasMoved = useRef(false);
  const initialPinchDistance = useRef(0);
  const initialScale = useRef(1);

  // 默认和范围配置
  const DEFAULT_SCALE = 1;
  const MIN_SCALE = 0.5;
  const MAX_SCALE = 2;

  // 初始化位置和缩放
  useEffect(() => {
    if (budgets.length === 0) return;
    
    // 加载保存的位置
    const savedPositions = localStorage.getItem('budget_icon_positions');
    if (savedPositions) {
      try {
        const parsed = JSON.parse(savedPositions);
        setPositions(parsed);
      } catch (e) {}
    } else {
      // 默认位置
      const defaultPositions = {};
      budgets.forEach((budget, index) => {
        defaultPositions[budget.id] = {
          x: 20 + (index % 2) * 60,
          y: 120 + Math.floor(index / 2) * 70
        };
      });
      setPositions(defaultPositions);
    }
    
    // 加载保存的缩放
    const savedScales = localStorage.getItem('budget_icon_scales');
    if (savedScales) {
      try {
        const parsed = JSON.parse(savedScales);
        setScales(parsed);
      } catch (e) {}
    } else {
      // 默认缩放
      const defaultScales = {};
      budgets.forEach((budget) => {
        defaultScales[budget.id] = DEFAULT_SCALE;
      });
      setScales(defaultScales);
    }
  }, [budgets]);

  // 保存位置
  useEffect(() => {
    if (Object.keys(positions).length > 0) {
      localStorage.setItem('budget_icon_positions', JSON.stringify(positions));
    }
  }, [positions]);

  // 保存缩放
  useEffect(() => {
    if (Object.keys(scales).length > 0) {
      localStorage.setItem('budget_icon_scales', JSON.stringify(scales));
    }
  }, [scales]);

  // 计算两点之间距离
  const getDistance = (touch1, touch2) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = useCallback((e, budgetId) => {
    e.stopPropagation();
    
    // 双指缩放
    if (e.touches.length === 2) {
      const distance = getDistance(e.touches[0], e.touches[1]);
      initialPinchDistance.current = distance;
      initialScale.current = scales[budgetId] || DEFAULT_SCALE;
      setScaling(budgetId);
      return;
    }
    
    // 单指拖拽
    const touch = e.touches[0];
    dragStartPos.current = { x: touch.clientX, y: touch.clientY };
    dragStartTime.current = Date.now();
    hasMoved.current = false;
    setDragging(budgetId);
  }, [scales]);

  const handleTouchMove = useCallback((e) => {
    // 双指缩放处理
    if (scaling && e.touches.length === 2) {
      e.preventDefault();
      const distance = getDistance(e.touches[0], e.touches[1]);
      const scaleFactor = distance / initialPinchDistance.current;
      const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, initialScale.current * scaleFactor));
      
      setScales(prev => ({
        ...prev,
        [scaling]: newScale
      }));
      return;
    }
    
    // 单指拖拽处理
    if (!dragging) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - dragStartPos.current.x;
    const deltaY = touch.clientY - dragStartPos.current.y;
    
    if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
      hasMoved.current = true;
    }
    
    setPositions(prev => {
      const currentPos = prev[dragging] || { x: 50, y: 150 };
      return {
        ...prev,
        [dragging]: {
          x: Math.max(10, Math.min(window.innerWidth - 70, currentPos.x + deltaX)),
          y: Math.max(80, Math.min(window.innerHeight - 200, currentPos.y + deltaY))
        }
      };
    });
    
    dragStartPos.current = { x: touch.clientX, y: touch.clientY };
  }, [dragging, scaling]);

  const handleTouchEnd = useCallback((e, budget) => {
    // 结束缩放
    if (scaling) {
      setScaling(null);
      return;
    }
    
    // 结束拖拽
    const duration = Date.now() - dragStartTime.current;
    
    if (!hasMoved.current && duration < 300) {
      onBudgetClick && onBudgetClick(budget);
    }
    
    setDragging(null);
  }, [onBudgetClick, scaling]);

  useEffect(() => {
    const handler = (e) => handleTouchMove(e);
    
    if (dragging || scaling) {
      document.addEventListener('touchmove', handler, { passive: false });
      return () => document.removeEventListener('touchmove', handler);
    }
  }, [dragging, scaling, handleTouchMove]);

  if (budgets.length === 0) return null;

  return (
    <>
      {budgets.map((budget) => {
        const pos = positions[budget.id] || { x: 50, y: 150 };
        const scale = scales[budget.id] || DEFAULT_SCALE;
        const iconKey = budget.icon || 'travel';
        const iconConfig = getFloatingIcon(iconKey);
        const IconComponent = iconConfig.icon;
        const iconColor = budget.iconColor || iconConfig.color || '#3B82F6';
        
        // 基础尺寸 * 缩放比例
        const baseSize = 56;  // w-14 = 56px
        const iconBaseSize = 48;  // w-12 = 48px
        const scaledSize = baseSize * scale;
        const scaledIconSize = iconBaseSize * scale;
        
        return (
          <div
            key={budget.id}
            className={`fixed touch-none select-none transition-transform ${
              dragging === budget.id || scaling === budget.id ? 'z-20' : 'z-[1]'
            }`}
            style={{
              left: `${pos.x}px`,
              top: `${pos.y}px`,
              // 置于底层，但拖拽/缩放时提升
              zIndex: dragging === budget.id || scaling === budget.id ? 20 : 1,
            }}
            onTouchStart={(e) => handleTouchStart(e, budget.id)}
            onTouchEnd={(e) => handleTouchEnd(e, budget)}
          >
            {/* 图标容器 - 支持缩放 */}
            <div 
              className="rounded-2xl flex items-center justify-center active:scale-95 transition-all"
              style={{ 
                width: `${scaledSize}px`,
                height: `${scaledSize}px`,
                // 拖拽时添加放大效果
                transform: dragging === budget.id ? 'scale(1.1)' : 'scale(1)',
              }}
            >
              {/* 自定义 SVG 图标 */}
              <div 
                style={{ 
                  width: `${scaledIconSize}px`,
                  height: `${scaledIconSize}px`,
                  color: iconColor 
                }}
              >
                <IconComponent className="w-full h-full" />
              </div>
            </div>
            
            {/* 缩放提示 - 仅在缩放时显示 */}
            {scaling === budget.id && (
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs px-2 py-0.5 rounded-full whitespace-nowrap">
                {Math.round(scale * 100)}%
              </div>
            )}
          </div>
        );
      })}
    </>
  );
};

export default DraggableBudgetIcons;