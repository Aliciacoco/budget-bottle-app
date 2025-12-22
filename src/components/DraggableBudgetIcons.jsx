// DraggableBudgetIcons.jsx - 首页可拖拽的独立预算图标
// 核心修复：使用云端数据库存储位置，实现多设备同步

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Check, X, Move, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { getFloatingIcon } from '../constants/floatingIcons.jsx';
import { updateSpecialBudgetIconPosition } from '../api';

const DraggableBudgetIcons = ({ budgets = [], onBudgetClick, cloudRef, setSpecialBudgets }) => {
  // 位置和缩放直接从 budgets 数据读取（云端数据）
  // 编辑时使用本地临时状态
  const [tempPositions, setTempPositions] = useState({});  // { id: { offsetX, offsetY } }
  const [tempScales, setTempScales] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [cloudCenter, setCloudCenter] = useState({ x: 0, y: 0 });
  const [isSaving, setIsSaving] = useState(false);
  
  const dragStartPos = useRef({ x: 0, y: 0 });
  const longPressTimer = useRef(null);
  const isLongPress = useRef(false);
  const editingIdRef = useRef(null);

  // 同步 editingId 到 ref
  useEffect(() => {
    editingIdRef.current = editingId;
  }, [editingId]);

  // 默认配置
  const DEFAULT_SCALE = 1;
  const MIN_SCALE = 0.6;
  const MAX_SCALE = 1.8;
  const SCALE_STEP = 0.2;
  const ICON_SIZE = 56;

  // 监听云朵位置变化
  useEffect(() => {
    const updateCloudCenter = () => {
      if (cloudRef?.current) {
        const rect = cloudRef.current.getBoundingClientRect();
        setCloudCenter({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        });
      }
    };
    
    updateCloudCenter();
    window.addEventListener('resize', updateCloudCenter);
    window.addEventListener('scroll', updateCloudCenter);
    
    let observer;
    if (cloudRef?.current && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(updateCloudCenter);
      observer.observe(cloudRef.current);
    }
    
    const timer = setTimeout(updateCloudCenter, 100);
    
    return () => {
      window.removeEventListener('resize', updateCloudCenter);
      window.removeEventListener('scroll', updateCloudCenter);
      observer?.disconnect();
      clearTimeout(timer);
    };
  }, [cloudRef]);

  // 获取可拖动范围
  const getDragLimits = useCallback(() => {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const padding = 30;
    
    return {
      minX: padding - cloudCenter.x,
      maxX: screenWidth - padding - ICON_SIZE - cloudCenter.x,
      minY: 80 - cloudCenter.y,
      maxY: screenHeight - 200 - cloudCenter.y
    };
  }, [cloudCenter]);

  // 生成默认位置
  const getDefaultPosition = useCallback((index) => {
    return {
      offsetX: -120 + (index % 3) * 50,
      offsetY: -150 + Math.floor(index / 3) * 60
    };
  }, []);

  // 获取图标的位置（优先使用临时状态，否则使用云端数据）
  const getPosition = useCallback((budget, index) => {
    if (tempPositions[budget.id]) {
      return tempPositions[budget.id];
    }
    // 从云端数据读取，如果没有则使用默认位置
    if (budget.iconOffsetX !== undefined && budget.iconOffsetY !== undefined && 
        (budget.iconOffsetX !== 0 || budget.iconOffsetY !== 0)) {
      return { offsetX: budget.iconOffsetX, offsetY: budget.iconOffsetY };
    }
    return getDefaultPosition(index);
  }, [tempPositions, getDefaultPosition]);

  // 获取图标的缩放
  const getScale = useCallback((budget) => {
    if (tempScales[budget.id] !== undefined) {
      return tempScales[budget.id];
    }
    return budget.iconScale || DEFAULT_SCALE;
  }, [tempScales]);

  // 偏移量转屏幕像素位置
  const offsetToPixel = useCallback((offsetX, offsetY) => {
    return {
      x: cloudCenter.x + offsetX,
      y: cloudCenter.y + offsetY
    };
  }, [cloudCenter]);

  // 屏幕像素位置转偏移量
  const pixelToOffset = useCallback((x, y) => {
    const limits = getDragLimits();
    let offsetX = x - cloudCenter.x;
    let offsetY = y - cloudCenter.y;
    
    offsetX = Math.max(limits.minX, Math.min(limits.maxX, offsetX));
    offsetY = Math.max(limits.minY, Math.min(limits.maxY, offsetY));
    
    return { offsetX, offsetY };
  }, [cloudCenter, getDragLimits]);

  // 进入编辑模式时，初始化临时状态
  useEffect(() => {
    if (editingId) {
      const budget = budgets.find(b => b.id === editingId);
      if (budget) {
        const index = budgets.indexOf(budget);
        const pos = getPosition(budget, index);
        const scale = getScale(budget);
        setTempPositions(prev => ({ ...prev, [editingId]: pos }));
        setTempScales(prev => ({ ...prev, [editingId]: scale }));
      }
    }
  }, [editingId, budgets]);

  // 保存到云端
  const saveChanges = useCallback(async () => {
    const currentEditingId = editingIdRef.current;
    if (!currentEditingId) return;
    
    const pos = tempPositions[currentEditingId];
    const scale = tempScales[currentEditingId] || DEFAULT_SCALE;
    
    if (!pos) {
      setEditingId(null);
      return;
    }
    
    setIsSaving(true);
    try {
      const result = await updateSpecialBudgetIconPosition(
        currentEditingId,
        pos.offsetX,
        pos.offsetY,
        scale
      );
      
      if (result.success && setSpecialBudgets) {
        // 更新父组件状态
        setSpecialBudgets(prev => prev.map(b => 
          b.id === currentEditingId 
            ? { ...b, iconOffsetX: pos.offsetX, iconOffsetY: pos.offsetY, iconScale: scale }
            : b
        ));
      }
    } catch (error) {
      console.error('保存位置失败:', error);
    } finally {
      setIsSaving(false);
      setHasChanges(false);
      setEditingId(null);
      setDragging(false);
      // 清除临时状态
      setTempPositions(prev => {
        const next = { ...prev };
        delete next[currentEditingId];
        return next;
      });
      setTempScales(prev => {
        const next = { ...prev };
        delete next[currentEditingId];
        return next;
      });
    }
  }, [tempPositions, tempScales, setSpecialBudgets]);

  // 取消编辑
  const cancelEdit = useCallback(() => {
    const currentEditingId = editingIdRef.current;
    
    // 清除临时状态
    if (currentEditingId) {
      setTempPositions(prev => {
        const next = { ...prev };
        delete next[currentEditingId];
        return next;
      });
      setTempScales(prev => {
        const next = { ...prev };
        delete next[currentEditingId];
        return next;
      });
    }
    
    setHasChanges(false);
    setEditingId(null);
    setDragging(false);
  }, []);

  // 重置
  const resetToDefault = useCallback((budgetId) => {
    const index = budgets.findIndex(b => b.id === budgetId);
    if (index === -1) return;
    setTempPositions(prev => ({ ...prev, [budgetId]: getDefaultPosition(index) }));
    setTempScales(prev => ({ ...prev, [budgetId]: DEFAULT_SCALE }));
    setHasChanges(true);
  }, [budgets, getDefaultPosition]);

  // 触摸事件
  const handleTouchStart = useCallback((e, budgetId) => {
    if (editingIdRef.current && editingIdRef.current !== budgetId) return;
    
    const touch = e.touches[0];
    dragStartPos.current = { x: touch.clientX, y: touch.clientY };
    isLongPress.current = false;
    
    if (editingIdRef.current === budgetId) {
      setDragging(true);
      return;
    }
    
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      setEditingId(budgetId);
      if (navigator.vibrate) navigator.vibrate(50);
    }, 500);
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    
    const currentEditingId = editingIdRef.current;
    if (!currentEditingId || !dragging) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - dragStartPos.current.x;
    const deltaY = touch.clientY - dragStartPos.current.y;
    
    setTempPositions(prev => {
      const currentPos = prev[currentEditingId];
      if (!currentPos) return prev;
      
      const currentPixel = offsetToPixel(currentPos.offsetX, currentPos.offsetY);
      const newPixel = {
        x: currentPixel.x + deltaX,
        y: currentPixel.y + deltaY
      };
      
      const newOffset = pixelToOffset(newPixel.x, newPixel.y);
      return { ...prev, [currentEditingId]: newOffset };
    });
    
    dragStartPos.current = { x: touch.clientX, y: touch.clientY };
    setHasChanges(true);
  }, [dragging, offsetToPixel, pixelToOffset]);

  const handleTouchEnd = useCallback((e, budget) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    
    if (editingIdRef.current && dragging) {
      setDragging(false);
      return;
    }
    
    if (!isLongPress.current && !editingIdRef.current) {
      onBudgetClick && onBudgetClick(budget);
    }
  }, [dragging, onBudgetClick]);

  // 缩放
  const handleZoomIn = useCallback(() => {
    const id = editingIdRef.current;
    if (!id) return;
    setTempScales(prev => ({ ...prev, [id]: Math.min(MAX_SCALE, (prev[id] || DEFAULT_SCALE) + SCALE_STEP) }));
    setHasChanges(true);
  }, []);

  const handleZoomOut = useCallback(() => {
    const id = editingIdRef.current;
    if (!id) return;
    setTempScales(prev => ({ ...prev, [id]: Math.max(MIN_SCALE, (prev[id] || DEFAULT_SCALE) - SCALE_STEP) }));
    setHasChanges(true);
  }, []);

  // 全局触摸事件
  useEffect(() => {
    if (editingId && dragging) {
      const handler = (e) => handleTouchMove(e);
      document.addEventListener('touchmove', handler, { passive: false });
      return () => document.removeEventListener('touchmove', handler);
    }
  }, [editingId, dragging, handleTouchMove]);

  // 鼠标事件（PC端）
  const handleMouseDown = useCallback((e, budgetId) => {
    if (editingIdRef.current && editingIdRef.current !== budgetId) return;
    
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    isLongPress.current = false;
    
    if (editingIdRef.current === budgetId) {
      setDragging(true);
      return;
    }
    
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      setEditingId(budgetId);
    }, 500);
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    
    const currentEditingId = editingIdRef.current;
    if (!currentEditingId || !dragging) return;
    e.preventDefault();
    
    const deltaX = e.clientX - dragStartPos.current.x;
    const deltaY = e.clientY - dragStartPos.current.y;
    
    setTempPositions(prev => {
      const currentPos = prev[currentEditingId];
      if (!currentPos) return prev;
      
      const currentPixel = offsetToPixel(currentPos.offsetX, currentPos.offsetY);
      const newPixel = {
        x: currentPixel.x + deltaX,
        y: currentPixel.y + deltaY
      };
      
      const newOffset = pixelToOffset(newPixel.x, newPixel.y);
      return { ...prev, [currentEditingId]: newOffset };
    });
    
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    setHasChanges(true);
  }, [dragging, offsetToPixel, pixelToOffset]);

  const handleMouseUp = useCallback((e, budget) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    
    if (editingIdRef.current && dragging) {
      setDragging(false);
      return;
    }
    
    if (!isLongPress.current && !editingIdRef.current) {
      onBudgetClick && onBudgetClick(budget);
    }
  }, [dragging, onBudgetClick]);

  useEffect(() => {
    if (editingId && dragging) {
      const moveHandler = (e) => handleMouseMove(e);
      const upHandler = () => setDragging(false);
      document.addEventListener('mousemove', moveHandler);
      document.addEventListener('mouseup', upHandler);
      return () => {
        document.removeEventListener('mousemove', moveHandler);
        document.removeEventListener('mouseup', upHandler);
      };
    }
  }, [editingId, dragging, handleMouseMove]);

  // 窗口大小变化时强制重新渲染
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const handleResize = () => forceUpdate(n => n + 1);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 等待云朵位置初始化
  if (budgets.length === 0 || cloudCenter.x === 0) return null;

  // 计算可拖动区域的边界框
  const limits = getDragLimits();
  const dragAreaBounds = {
    left: cloudCenter.x + limits.minX,
    top: cloudCenter.y + limits.minY,
    width: limits.maxX - limits.minX + ICON_SIZE,
    height: limits.maxY - limits.minY + ICON_SIZE
  };

  return (
    <>
      {/* 编辑模式下的可拖动区域指示 */}
      {editingId && (
        <div 
          className="fixed pointer-events-none z-[5]"
          style={{
            left: `${dragAreaBounds.left}px`,
            top: `${dragAreaBounds.top}px`,
            width: `${dragAreaBounds.width}px`,
            height: `${dragAreaBounds.height}px`,
            border: '2px dashed rgba(6, 182, 212, 0.4)',
            borderRadius: '24px',
            backgroundColor: 'rgba(6, 182, 212, 0.05)'
          }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-cyan-400 text-sm font-bold flex items-center gap-2 opacity-50">
            <Move size={16} />
            可拖动区域
          </div>
        </div>
      )}

      {/* 图标列表 */}
      {budgets.map((budget, index) => {
        const pos = getPosition(budget, index);
        const scale = getScale(budget);
        
        const iconKey = budget.icon || 'travel';
        const iconConfig = getFloatingIcon(iconKey);
        const IconComponent = iconConfig.icon;
        const iconColor = budget.iconColor || iconConfig.color || '#3B82F6';
        
        const isEditing = editingId === budget.id;
        const pixelPos = offsetToPixel(pos.offsetX, pos.offsetY);
        
        const baseSize = ICON_SIZE;
        const scaledSize = baseSize * scale;
        const scaledIconSize = 48 * scale;
        
        return (
          <div
            key={budget.id}
            className={`fixed touch-none select-none ${
              editingId && !isEditing ? 'opacity-30 pointer-events-none' : ''
            }`}
            style={{
              left: `${pixelPos.x}px`,
              top: `${pixelPos.y}px`,
              zIndex: isEditing ? 30 : 1,
            }}
            onTouchStart={(e) => handleTouchStart(e, budget.id)}
            onTouchEnd={(e) => handleTouchEnd(e, budget)}
            onMouseDown={(e) => handleMouseDown(e, budget.id)}
            onMouseUp={(e) => handleMouseUp(e, budget)}
          >
            {isEditing && (
              <div 
                className="absolute -inset-3 border-2 border-dashed border-cyan-400 rounded-2xl bg-cyan-50/30"
                style={{ pointerEvents: 'none' }}
              />
            )}
            
            <div 
              className="rounded-2xl flex items-center justify-center"
              style={{ 
                width: `${scaledSize}px`,
                height: `${scaledSize}px`,
                transform: isEditing && dragging ? 'scale(1.1)' : 'scale(1)',
                transition: dragging ? 'transform 0.1s' : 'none'
              }}
            >
              <div style={{ width: `${scaledIconSize}px`, height: `${scaledIconSize}px`, color: iconColor }}>
                <IconComponent className="w-full h-full" />
              </div>
            </div>
          </div>
        );
      })}

      {/* 编辑工具栏 */}
      {editingId && (
        <div 
          className="fixed bottom-32 left-1/2 -translate-x-1/2 z-40 bg-white rounded-2xl shadow-xl p-3 flex items-center gap-2"
          style={{ animation: 'slideUp 0.2s ease-out' }}
        >
          <style>{`
            @keyframes slideUp {
              from { transform: translate(-50%, 20px); opacity: 0; }
              to { transform: translate(-50%, 0); opacity: 1; }
            }
          `}</style>
          
          <button 
            onClick={handleZoomOut}
            disabled={(tempScales[editingId] || getScale(budgets.find(b => b.id === editingId))) <= MIN_SCALE}
            className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
          >
            <ZoomOut size={20} strokeWidth={2.5} />
          </button>
          
          <div className="w-14 text-center">
            <span className="text-sm font-bold text-gray-500">
              {Math.round((tempScales[editingId] || getScale(budgets.find(b => b.id === editingId))) * 100)}%
            </span>
          </div>
          
          <button 
            onClick={handleZoomIn}
            disabled={(tempScales[editingId] || getScale(budgets.find(b => b.id === editingId))) >= MAX_SCALE}
            className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
          >
            <ZoomIn size={20} strokeWidth={2.5} />
          </button>
          
          <div className="w-px h-8 bg-gray-200 mx-1" />
          
          <button 
            onClick={() => resetToDefault(editingId)}
            className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 active:scale-95"
            title="重置"
          >
            <RotateCcw size={18} strokeWidth={2.5} />
          </button>
          
          <div className="w-px h-8 bg-gray-200 mx-1" />
          
          <button 
            onClick={cancelEdit}
            disabled={isSaving}
            className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-500 active:scale-95 disabled:opacity-50"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
          
          <button 
            onClick={saveChanges}
            disabled={isSaving}
            className="w-10 h-10 rounded-xl bg-cyan-500 flex items-center justify-center text-white active:scale-95 disabled:opacity-50"
          >
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Check size={20} strokeWidth={2.5} />
            )}
          </button>
        </div>
      )}

      {editingId && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 bg-black/70 text-white text-sm font-bold px-4 py-2 rounded-full">
          拖动图标调整位置
        </div>
      )}
    </>
  );
};

export default DraggableBudgetIcons;