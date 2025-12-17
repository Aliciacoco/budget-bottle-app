import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Heart, ChevronRight, Check } from 'lucide-react';

const WishPoolBar = ({ 
  poolAmount, 
  wishes, 
  onAddClick, 
  onWishClick, 
  onPoolClick, 
  maxPoolAmount = 5000, 
  debugMode = false, 
  onDebugChange 
}) => {
  const MAX_LIQUID_HEIGHT = 500;
  const MIN_CONTAINER_HEIGHT = 130;
  const SEABED_HEIGHT = 40;
  const HEADER_HEIGHT = 50;
  const BALL_SIZE = 48;
  const BALL_RADIUS = BALL_SIZE / 2;
  
  const containerRef = useRef(null);
  const animationRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(400);
  const [ballPositions, setBallPositions] = useState([]);
  
  const liquidHeight = Math.min(MAX_LIQUID_HEIGHT, (poolAmount / maxPoolAmount) * MAX_LIQUID_HEIGHT);
  const hasBalance = poolAmount > 0;
  
  const padding = 16;
  const gap = 12;
  const ballsPerRow = Math.max(1, Math.floor((containerWidth - padding * 2 + gap) / (BALL_SIZE + gap)));
  const totalItems = wishes.length + 1;
  const rows = Math.ceil(totalItems / ballsPerRow);
  const ballsAreaHeight = rows * (BALL_SIZE + gap);
  
  const baseSvgHeight = Math.max(MIN_CONTAINER_HEIGHT, liquidHeight + SEABED_HEIGHT);
  const svgHeight = Math.max(baseSvgHeight, SEABED_HEIGHT + ballsAreaHeight + 20);
  const totalHeight = HEADER_HEIGHT + svgHeight;
  const seabedTop = svgHeight - SEABED_HEIGHT;
  const liquidTop = hasBalance ? (svgHeight - SEABED_HEIGHT - liquidHeight) : seabedTop;
  
  const GRAVITY = 0.5;
  const FRICTION = 0.98;
  const BOUNCE = 0.6;
  const BUOYANCY = hasBalance ? 0.3 : 0;
  
  const getSeabedY = useCallback((x, seabedTopY) => {
    const svgX = (x / containerWidth) * 400;
    const wave1 = Math.sin((svgX / 400) * Math.PI * 2) * 3;
    const wave2 = Math.sin((svgX / 400) * Math.PI * 4 + 1) * 2;
    const wave3 = Math.cos((svgX / 400) * Math.PI * 3) * 1.5;
    return seabedTopY + wave1 + wave2 + wave3;
  }, [containerWidth]);
  
  const getMaxYForBall = useCallback((ballX) => {
    const centerX = ballX + BALL_RADIUS;
    const seabedY = getSeabedY(centerX, seabedTop);
    return seabedY - BALL_SIZE;
  }, [getSeabedY, seabedTop]);
  
  useEffect(() => {
    const updateWidth = () => { if (containerRef.current) setContainerWidth(containerRef.current.offsetWidth); };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);
  
  const getGroundY = useCallback((x) => hasBalance ? liquidTop + 5 : getMaxYForBall(x), [hasBalance, liquidTop, getMaxYForBall]);
  
  useEffect(() => {
    const allItems = [{ id: 'add-button', isButton: true }, ...wishes];
    setBallPositions(prev => {
      return allItems.map((item, index) => {
        const existingPos = prev.find(p => p.id === item.id);
        const row = Math.floor(index / ballsPerRow);
        const col = index % ballsPerRow;
        const targetX = padding + col * (BALL_SIZE + gap);
        const baseGroundY = getGroundY(targetX);
        const targetY = baseGroundY + row * (BALL_SIZE + gap);
        if (existingPos) return { ...existingPos, targetX, targetY, isButton: item.isButton || false, fulfilled: item.fulfilled || false };
        const startY = item.isButton ? targetY : -BALL_SIZE - Math.random() * 50;
        return { id: item.id, x: targetX, y: startY, vx: 0, vy: 0, targetX, targetY, isButton: item.isButton || false, fulfilled: item.fulfilled || false };
      });
    });
  }, [wishes, containerWidth, hasBalance, svgHeight, ballsPerRow, getGroundY]);
  
  useEffect(() => {
    const animate = () => {
      setBallPositions(prev => {
        const updated = prev.map((ball) => {
          if (ball.isButton) return { ...ball, x: ball.targetX, y: ball.targetY };
          let { x, y, vx, vy, targetX, targetY } = ball;
          vy += GRAVITY;
          if (hasBalance && y > liquidTop) vy -= BUOYANCY;
          vx *= FRICTION; vy *= FRICTION;
          const dx = targetX - x; const dy = targetY - y;
          vx += dx * 0.02; vy += dy * 0.02;
          x += vx; y += vy;
          if (x < padding) { x = padding; vx = -vx * BOUNCE; }
          if (x > containerWidth - padding - BALL_SIZE) { x = containerWidth - padding - BALL_SIZE; vx = -vx * BOUNCE; }
          const maxY = getMaxYForBall(x);
          if (y > maxY) { y = maxY; vy = -vy * BOUNCE; if (Math.abs(vy) < 0.5) vy = 0; }
          return { ...ball, x, y, vx, vy };
        });
        for (let i = 0; i < updated.length; i++) {
          if (updated[i].isButton) continue;
          for (let j = i + 1; j < updated.length; j++) {
            if (updated[j].isButton) continue;
            const ball1 = updated[i]; const ball2 = updated[j];
            const dx = (ball2.x + BALL_RADIUS) - (ball1.x + BALL_RADIUS);
            const dy = (ball2.y + BALL_RADIUS) - (ball1.y + BALL_RADIUS);
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDist = BALL_SIZE;
            if (distance < minDist && distance > 0) {
              const overlap = (minDist - distance) / 2;
              const nx = dx / distance; const ny = dy / distance;
              updated[i].x -= overlap * nx; updated[i].y -= overlap * ny;
              updated[j].x += overlap * nx; updated[j].y += overlap * ny;
              const maxY1 = getMaxYForBall(updated[i].x); const maxY2 = getMaxYForBall(updated[j].x);
              if (updated[i].y > maxY1) updated[i].y = maxY1;
              if (updated[j].y > maxY2) updated[j].y = maxY2;
              const dvx = ball1.vx - ball2.vx; const dvy = ball1.vy - ball2.vy;
              const dvn = dvx * nx + dvy * ny;
              if (dvn > 0) {
                updated[i].vx -= dvn * nx * BOUNCE; updated[i].vy -= dvn * ny * BOUNCE;
                updated[j].vx += dvn * nx * BOUNCE; updated[j].vy += dvn * ny * BOUNCE;
              }
            }
          }
        }
        return updated;
      });
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
  }, [containerWidth, hasBalance, liquidTop, getMaxYForBall]);
  
  return (
    <div className="relative" style={{ height: `${totalHeight}px` }}>
      {debugMode && <div className="fixed inset-0 z-[5]" onClick={() => onDebugChange?.(-1)} />}
      {debugMode && (
        <div className="absolute top-0 right-2 z-10 bg-black bg-opacity-70 text-white text-xs p-2 rounded" onClick={(e) => e.stopPropagation()}>
          <div className="mb-1">调试模式</div>
          <div className="flex gap-1 flex-wrap">
            {[0, 500, 1000, 2500, 5000, 10000].map(val => (
              <button key={val} onClick={() => onDebugChange?.(val)} className="px-2 py-1 bg-gray-600 rounded hover:bg-gray-500">¥{val}</button>
            ))}
          </div>
        </div>
      )}
      <div className="px-6 pb-3 cursor-pointer active:opacity-80" style={{ height: `${HEADER_HEIGHT}px` }} onClick={onPoolClick}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">心愿池</span>
            <ChevronRight size={14} className="text-gray-400" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-[#00C3E0]">¥{poolAmount.toLocaleString()}</span>
            <button onClick={(e) => { e.stopPropagation(); onDebugChange?.(debugMode ? -1 : poolAmount); }}
              className="w-5 h-5 rounded-full bg-gray-200 text-gray-500 text-xs flex items-center justify-center hover:bg-gray-300" title="调试">
              {debugMode ? '×' : '?'}
            </button>
          </div>
        </div>
      </div>
      <div ref={containerRef} className="relative w-full" style={{ height: `${svgHeight}px` }}>
        <svg viewBox={`0 0 400 ${svgHeight}`} className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="liquidGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#00C3E0" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#00C3E0" stopOpacity="0.95" />
            </linearGradient>
            <linearGradient id="seabedGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#574262" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#3d2d45" stopOpacity="1" />
            </linearGradient>
          </defs>
          {hasBalance && (
            <>
              <rect x="0" y={liquidTop + 12} width="400" height={liquidHeight} fill="url(#liquidGradient)" />
              <path className="wave-animation-1" d={`M0 ${liquidTop + 10} Q50 ${liquidTop + 5} 100 ${liquidTop + 12} T200 ${liquidTop + 8} T300 ${liquidTop + 14} T400 ${liquidTop + 10} L400 ${liquidTop + 20} L0 ${liquidTop + 20} Z`} fill="#00C3E0" fillOpacity="0.9" />
              <path className="wave-animation-2" d={`M0 ${liquidTop + 8} Q60 ${liquidTop + 14} 120 ${liquidTop + 6} T240 ${liquidTop + 12} T360 ${liquidTop + 8} T400 ${liquidTop + 10} L400 ${liquidTop + 18} L0 ${liquidTop + 18} Z`} fill="#00D4F0" fillOpacity="0.5" />
            </>
          )}
          <path d={`M0 ${seabedTop} Q50 ${seabedTop - 5} 100 ${seabedTop + 3} T200 ${seabedTop} T300 ${seabedTop + 3} T400 ${seabedTop - 2} L400 ${svgHeight} L0 ${svgHeight} Z`} fill="url(#seabedGradient)" />
        </svg>
        {ballPositions.map((ball) => {
          if (ball.isButton) {
            return (
              <div key="add-button" className={`absolute w-12 h-12 rounded-full flex items-center justify-center cursor-pointer active:scale-95 shadow-lg transition-colors ${hasBalance ? 'bg-white bg-opacity-40 hover:bg-opacity-50' : 'bg-[#8b7a94] bg-opacity-60 hover:bg-opacity-70'}`}
                style={{ left: `${ball.x}px`, top: `${ball.y}px` }} onClick={(e) => { e.stopPropagation(); onAddClick && onAddClick(); }}>
                <Plus size={22} className="text-white" />
              </div>
            );
          }
          const wish = wishes.find(w => w.id === ball.id);
          if (!wish) return null;
          return (
            <div key={ball.id} className={`absolute w-12 h-12 rounded-full flex items-center justify-center overflow-hidden cursor-pointer active:scale-95 hover:ring-2 hover:ring-white shadow-lg transition-colors ${hasBalance ? 'bg-white bg-opacity-30' : 'bg-[#8b7a94] bg-opacity-50'} ${ball.fulfilled ? 'ring-2 ring-green-400' : ''}`}
              style={{ left: `${ball.x}px`, top: `${ball.y}px` }} title={wish.description} onClick={(e) => { e.stopPropagation(); onWishClick && onWishClick(wish); }}>
              {wish.image ? <img src={wish.image} alt="" className="w-full h-full object-cover" /> : <Heart size={18} className="text-white" />}
              {ball.fulfilled && <div className="absolute inset-0 bg-green-500 bg-opacity-50 flex items-center justify-center"><Check size={24} className="text-white" strokeWidth={3} /></div>}
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes wave1 { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(-20px); } }
        @keyframes wave2 { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(15px); } }
        .wave-animation-1 { animation: wave1 3s ease-in-out infinite; }
        .wave-animation-2 { animation: wave2 2.5s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default WishPoolBar;