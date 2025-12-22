// WishPoolBar.jsx - 心愿池组件
// 支持显示图标或用户上传的图片

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ChevronRight, Check } from 'lucide-react';
import { getWishIcon, WISH_ICONS } from '../constants/wishIcons.jsx';

// 全局位置缓存
const globalBallPositionsCache = {
  positions: [],
  initialized: false,
  wishIds: '',
  lastPoolAmount: 0,
};

// 设计系统颜色
const POOL_COLOR = '#00BFDC';  // cyan-500

// 金额格式化（修复精度问题）
const formatAmount = (amount) => {
  return Math.round(amount * 100) / 100;
};

const WishPoolBar = ({ 
  poolAmount, 
  wishes, 
  onWishClick, 
  onPoolClick, 
  maxPoolAmount = 5000, 
  debugMode = false, 
  onDebugChange 
}) => {
  // 格式化金额
  const displayPoolAmount = formatAmount(poolAmount);
  
  // 高度配置
  const HEADER_HEIGHT = 60;
  const SEABED_HEIGHT = 40;
  const MIN_LIQUID_HEIGHT = 60;
  const MAX_LIQUID_HEIGHT = 500;
  const BALL_SIZE = 48;
  const BALL_RADIUS = BALL_SIZE / 2;
  
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const wavePhaseRef = useRef(0);
  const prevPoolAmountRef = useRef(poolAmount);
  const [containerWidth, setContainerWidth] = useState(400);
  const [ballPositions, setBallPositions] = useState([]);
  
  // 根据金额计算液体高度
  const liquidHeight = useMemo(() => {
    if (poolAmount <= 0) return 0;
    if (poolAmount >= maxPoolAmount) return MAX_LIQUID_HEIGHT;
    return Math.max(MIN_LIQUID_HEIGHT, (poolAmount / maxPoolAmount) * MAX_LIQUID_HEIGHT);
  }, [poolAmount, maxPoolAmount]);
  
  const hasBalance = poolAmount > 0;
  const enableBuoyancy = poolAmount >= maxPoolAmount / 3;
  
  // 动态计算高度
  const svgHeight = useMemo(() => {
    const baseHeight = SEABED_HEIGHT + liquidHeight + 80;
    return Math.max(baseHeight, 150);
  }, [liquidHeight]);
  
  const totalHeight = HEADER_HEIGHT + svgHeight;
  
  const padding = 12;
  const seabedTop = svgHeight - SEABED_HEIGHT;
  const liquidTop = hasBalance ? (svgHeight - SEABED_HEIGHT - liquidHeight) : seabedTop;
  
  // 物理参数
  const GRAVITY = 0.35;
  const FRICTION = 0.92;
  const BOUNCE = 0.3;
  const BUOYANCY_FORCE = 0.5;
  const VELOCITY_THRESHOLD = 0.08;
  const POSITION_SNAP_THRESHOLD = 2;
  
  const currentWishIds = useMemo(() => wishes.map(w => w.id).sort().join(','), [wishes]);
  
  // 海底波浪函数
  const getSeabedWaveY = useCallback((x, seabedTopY, width) => {
    const normalizedX = x / width;
    const wave = Math.cos(normalizedX * Math.PI * 2) * 4;
    return seabedTopY + wave;
  }, []);
  
  // 获取水面 Y 坐标
  const getFloatTargetY = useCallback(() => {
    return liquidTop + 15 + BALL_RADIUS;
  }, [liquidTop]);
  
  // 获取球的最大 Y 坐标
  const getMaxYForBall = useCallback((ballX) => {
    const centerX = ballX + BALL_RADIUS;
    const seabedY = getSeabedWaveY(centerX, seabedTop, containerWidth);
    return seabedY - BALL_SIZE - 2;
  }, [getSeabedWaveY, seabedTop, containerWidth]);
  
  // 监听容器宽度
  useEffect(() => {
    const updateWidth = () => { 
      if (containerRef.current) setContainerWidth(containerRef.current.offsetWidth); 
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);
  
  // 金额变化时重置球的状态
  useEffect(() => {
    if (prevPoolAmountRef.current !== poolAmount) {
      setBallPositions(prev => prev.map(ball => ({
        ...ball,
        settled: false,
      })));
      prevPoolAmountRef.current = poolAmount;
      globalBallPositionsCache.lastPoolAmount = poolAmount;
    }
  }, [poolAmount]);
  
  // 初始化球的位置
  useEffect(() => {
    const allItems = [...wishes];
    const wishListChanged = globalBallPositionsCache.wishIds !== currentWishIds;
    
    if (globalBallPositionsCache.initialized && !wishListChanged && globalBallPositionsCache.positions.length > 0) {
      const updatedPositions = globalBallPositionsCache.positions
        .map(pos => {
          const wish = allItems.find(w => w.id === pos.id);
          if (wish) {
            return { ...pos, fulfilled: wish.fulfilled || false, icon: wish.icon, image: wish.image };
          }
          return null;
        })
        .filter(Boolean);
      
      const existingIds = updatedPositions.map(p => p.id);
      allItems.filter(w => !existingIds.includes(w.id)).forEach((item) => {
        const startX = padding + Math.random() * (containerWidth - padding * 2 - BALL_SIZE);
        updatedPositions.push({
          id: item.id,
          x: startX,
          y: -BALL_SIZE - Math.random() * 30,
          vx: 0,
          vy: 0,
          settled: false,
          fulfilled: item.fulfilled || false,
          icon: item.icon,
          image: item.image
        });
      });
      
      setBallPositions(updatedPositions);
      globalBallPositionsCache.positions = updatedPositions;
      globalBallPositionsCache.wishIds = currentWishIds;
      return;
    }
    
    const newPositions = allItems.map((item, index) => {
      const startX = padding + (index % 5) * (BALL_SIZE + 8) + Math.random() * 5;
      return {
        id: item.id,
        x: Math.min(startX, containerWidth - padding - BALL_SIZE),
        y: -BALL_SIZE - index * 20,
        vx: 0,
        vy: 0,
        settled: false,
        fulfilled: item.fulfilled || false,
        icon: item.icon,
        image: item.image
      };
    });
    
    setBallPositions(newPositions);
    globalBallPositionsCache.positions = newPositions;
    globalBallPositionsCache.initialized = true;
    globalBallPositionsCache.wishIds = currentWishIds;
  }, [wishes, containerWidth, currentWishIds, padding]);
  
  // Canvas 波浪动画
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const dpr = window.devicePixelRatio || 1;
    canvas.width = containerWidth * dpr;
    canvas.height = svgHeight * dpr;
    ctx.scale(dpr, dpr);
    
    const speed = 0.04;
    const wavelength = 0.02;
    const amplitude = 5;
    
    const renderWaves = () => {
      ctx.clearRect(0, 0, containerWidth, svgHeight);
      
      // 绘制液体
      if (hasBalance) {
        ctx.beginPath();
        ctx.fillStyle = POOL_COLOR;
        ctx.moveTo(0, svgHeight);
        
        for (let x = 0; x <= containerWidth; x++) {
          const waveY = liquidTop + 12 + Math.sin(x * wavelength + wavePhaseRef.current) * amplitude;
          ctx.lineTo(x, waveY);
        }
        
        ctx.lineTo(containerWidth, svgHeight);
        ctx.closePath();
        ctx.fill();
        
        // 绘制第二层波浪
        ctx.beginPath();
        ctx.fillStyle = 'rgba(6, 182, 212, 0.5)';
        ctx.moveTo(0, svgHeight);
        
        for (let x = 0; x <= containerWidth; x++) {
          const waveY = liquidTop + 10 + Math.sin(x * wavelength * 1.2 + wavePhaseRef.current * 0.8 + 1) * (amplitude * 0.7);
          ctx.lineTo(x, waveY);
        }
        
        ctx.lineTo(containerWidth, svgHeight);
        ctx.closePath();
        ctx.fill();
      }
      
      // 绘制海底
      const gradient = ctx.createLinearGradient(0, seabedTop, 0, svgHeight);
      gradient.addColorStop(0, 'rgba(87, 66, 98, 0.95)');
      gradient.addColorStop(1, 'rgba(61, 45, 69, 1)');
      
      ctx.beginPath();
      ctx.fillStyle = gradient;
      ctx.moveTo(0, getSeabedWaveY(0, seabedTop, containerWidth));
      
      for (let x = 5; x <= containerWidth; x += 5) {
        ctx.lineTo(x, getSeabedWaveY(x, seabedTop, containerWidth));
      }
      
      ctx.lineTo(containerWidth, svgHeight);
      ctx.lineTo(0, svgHeight);
      ctx.closePath();
      ctx.fill();
      
      wavePhaseRef.current += speed;
    };
    
    // 物理更新
    const updatePhysics = () => {
      const floatTargetY = getFloatTargetY();
      
      setBallPositions(prev => {
        const updated = prev.map((ball) => {
          if (ball.settled) {
            if (enableBuoyancy && hasBalance) {
              const targetY = floatTargetY - BALL_RADIUS;
              if (Math.abs(ball.y - targetY) > POSITION_SNAP_THRESHOLD * 2) {
                return { ...ball, settled: false };
              }
            }
            return ball;
          }
          
          let { x, y, vx, vy } = ball;
          
          vy += GRAVITY;
          
          if (enableBuoyancy && hasBalance) {
            const ballCenterY = y + BALL_RADIUS;
            const targetY = floatTargetY;
            
            if (ballCenterY > targetY) {
              vy -= BUOYANCY_FORCE * 1.5;
            } else if (ballCenterY < targetY - 5) {
              vy += GRAVITY * 0.5;
            }
            
            const distToTarget = Math.abs(ballCenterY - targetY);
            if (distToTarget < 30) {
              vy *= 0.85;
              vx *= 0.9;
              
              if (distToTarget < POSITION_SNAP_THRESHOLD && Math.abs(vy) < 0.5) {
                y = targetY - BALL_RADIUS;
                vy = 0;
              }
            }
          }
          
          vx *= FRICTION;
          vy *= FRICTION;
          
          x += vx;
          y += vy;
          
          if (x < padding) { 
            x = padding; 
            vx = Math.abs(vx) * BOUNCE;
          }
          if (x > containerWidth - padding - BALL_SIZE) { 
            x = containerWidth - padding - BALL_SIZE; 
            vx = -Math.abs(vx) * BOUNCE;
          }
          
          const maxY = getMaxYForBall(x);
          if (y > maxY) { 
            y = maxY; 
            vy = -Math.abs(vy) * BOUNCE;
          }
          
          if (y < -BALL_SIZE) {
            y = -BALL_SIZE;
            vy = Math.abs(vy) * 0.5;
          }
          
          let settled = false;
          if (Math.abs(vx) < VELOCITY_THRESHOLD && Math.abs(vy) < VELOCITY_THRESHOLD) {
            if (enableBuoyancy && hasBalance) {
              const ballCenterY = y + BALL_RADIUS;
              const targetY = floatTargetY;
              if (Math.abs(ballCenterY - targetY) < POSITION_SNAP_THRESHOLD) {
                y = targetY - BALL_RADIUS;
                vx = 0;
                vy = 0;
                settled = true;
              }
            } else {
              vx = 0;
              vy = 0;
              settled = true;
            }
          }
          
          return { ...ball, x, y, vx, vy, settled };
        });
        
        // 碰撞检测
        for (let i = 0; i < updated.length; i++) {
          for (let j = i + 1; j < updated.length; j++) {
            const ball1 = updated[i];
            const ball2 = updated[j];
            
            const dx = (ball2.x + BALL_RADIUS) - (ball1.x + BALL_RADIUS);
            const dy = (ball2.y + BALL_RADIUS) - (ball1.y + BALL_RADIUS);
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDist = BALL_SIZE + 2;
            
            if (distance < minDist && distance > 0) {
              const overlap = (minDist - distance) / 2;
              const nx = dx / distance;
              const ny = dy / distance;
              
              updated[i].x -= overlap * nx;
              updated[i].y -= overlap * ny;
              updated[j].x += overlap * nx;
              updated[j].y += overlap * ny;
              
              if (!ball1.settled || !ball2.settled) {
                const dvx = ball1.vx - ball2.vx;
                const dvy = ball1.vy - ball2.vy;
                const dvn = dvx * nx + dvy * ny;
                
                if (dvn > 0) {
                  updated[i].vx -= dvn * nx * BOUNCE;
                  updated[i].vy -= dvn * ny * BOUNCE;
                  updated[j].vx += dvn * nx * BOUNCE;
                  updated[j].vy += dvn * ny * BOUNCE;
                  updated[i].settled = false;
                  updated[j].settled = false;
                }
              }
              
              [updated[i], updated[j]].forEach(b => {
                if (b.x < padding) b.x = padding;
                if (b.x > containerWidth - padding - BALL_SIZE) {
                  b.x = containerWidth - padding - BALL_SIZE;
                }
                const maxY = getMaxYForBall(b.x);
                if (b.y > maxY) b.y = maxY;
              });
            }
          }
        }
        
        globalBallPositionsCache.positions = updated;
        return updated;
      });
    };
    
    const animate = () => {
      renderWaves();
      updatePhysics();
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    return () => { 
      if (animationRef.current) cancelAnimationFrame(animationRef.current); 
    };
  }, [containerWidth, svgHeight, hasBalance, enableBuoyancy, liquidTop, seabedTop, getMaxYForBall, getFloatTargetY, getSeabedWaveY, padding]);
  
  return (
    <div className="relative" style={{ height: `${totalHeight}px` }}>
      {/* 引入字体 */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@400;500;700;800&display=swap');
        .font-rounded {
          font-family: 'M PLUS Rounded 1c', sans-serif;
        }
      `}</style>

      {debugMode && <div className="fixed inset-0 z-[5]" onClick={() => onDebugChange?.(-1)} />}
      {debugMode && (
        <div className="absolute top-0 right-2 z-10 bg-black bg-opacity-70 text-white text-xs p-2 rounded-xl" onClick={(e) => e.stopPropagation()}>
          <div className="mb-1 font-bold">调试模式 (浮力: {enableBuoyancy ? '开' : '关'})</div>
          <div className="flex gap-1 flex-wrap">
            {[0, 500, 1000, 1700, 2500, 5000].map(val => (
              <button 
                key={val} 
                onClick={() => onDebugChange?.(val)} 
                className={`px-2 py-1 rounded-lg font-bold ${val >= maxPoolAmount / 3 ? 'bg-cyan-600' : 'bg-gray-600'} hover:opacity-80 active:scale-95`}
              >
                ¥{val}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* 心愿池标题和金额 - 使用设计系统风格 */}
      <div 
        className="px-6 pb-3 cursor-pointer active:opacity-80" 
        style={{ height: `${HEADER_HEIGHT}px` }} 
        onClick={onPoolClick}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="text-sm text-gray-400 font-bold">心愿池</span>
                <ChevronRight size={14} className="text-gray-400" strokeWidth={2.5} />
              </div>
              <span className="text-xl font-extrabold font-rounded" style={{ color: POOL_COLOR }}>
                ¥{displayPoolAmount.toLocaleString()}
              </span>
            </div>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); onDebugChange?.(debugMode ? -1 : poolAmount); }}
            className="w-6 h-6 rounded-full bg-gray-200 text-gray-500 text-xs font-bold flex items-center justify-center hover:bg-gray-300 active:scale-95 transition-all" 
            title="调试"
          >
            {debugMode ? '×' : '?'}
          </button>
        </div>
      </div>
      
      <div ref={containerRef} className="relative w-full" style={{ height: `${svgHeight}px` }}>
        {/* Canvas 波浪层 */}
        <canvas 
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ width: '100%', height: '100%' }}
        />
        
        {/* 心愿球 */}
        {ballPositions.map((ball) => {
          const wish = wishes.find(w => w.id === ball.id);
          if (!wish) return null;
          
          const hasImage = wish.image;
          const iconKey = wish.icon || 'ball1';
          const iconConfig = getWishIcon(iconKey);
          const IconComponent = iconConfig.icon;
          
          return (
            <div 
              key={ball.id} 
              className={`absolute rounded-full flex items-center justify-center overflow-hidden border-2 border-white/40 bg-white/40 backdrop-blur-sm cursor-pointer active:scale-95 transition-transform ${ball.fulfilled ? 'ring-2 ring-green-400' : ''}`}
              style={{ 
                left: `${ball.x}px`, 
                top: `${ball.y}px`,
                width: `${BALL_SIZE}px`,
                height: `${BALL_SIZE}px`,
              }} 
              title={wish.description} 
              onClick={(e) => { 
                e.stopPropagation(); 
                onWishClick && onWishClick(wish); 
              }}
            >
              {hasImage ? (
                /* 显示用户上传的图片 */
                <img 
                  src={wish.image} 
                  alt={wish.description}
                  className="w-full h-full object-cover"
                  style={{
                    borderRadius: '50%'
                  }}
                />
              ) : (
                /* 显示自定义 SVG 图标 */
                <div className="w-10 h-10">
                  <IconComponent className="w-full h-full" />
                </div>
              )}
              
              {ball.fulfilled && (
                <div className="absolute inset-0 bg-green-500 bg-opacity-50 flex items-center justify-center rounded-full">
                  <Check size={24} className="text-white" strokeWidth={3} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WishPoolBar;