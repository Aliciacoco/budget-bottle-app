import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Plus, Settings, ArrowLeft, X, Heart, Calendar, Edit, Trash2, ChevronLeft, ChevronRight, FileText, PiggyBank, History, Info, Check, Plane, Gift, Car, Home, ShoppingBag, Utensils, Music, Gamepad, Book, Briefcase, CreditCard, DollarSign, Menu } from 'lucide-react';
import './leancloud.js'
import { 
  getWeeklyBudget,
  saveWeeklyBudget,
  markWeeklyBudgetSettled,
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getWishes,
  createWish,
  updateWish,
  deleteWish,
  getFixedExpenses,
  createFixedExpense,
  updateFixedExpense,
  deleteFixedExpense,
  getWishPool,
  updateWishPool,
  addToWishPool,
  getWishPoolHistory,
  createWishPoolHistory,
  checkWeekSettled,
  getSpecialBudgets,
  createSpecialBudget,
  updateSpecialBudget,
  deleteSpecialBudget,
  getSpecialBudgetItems,
  createSpecialBudgetItem,
  updateSpecialBudgetItem,
  deleteSpecialBudgetItem
} from './api.js';

// ==================== 图标配置 ====================
const BUDGET_ICONS = {
  travel: { icon: Plane, label: '旅行', color: '#3B82F6' },
  gift: { icon: Gift, label: '礼物', color: '#EC4899' },
  car: { icon: Car, label: '交通', color: '#10B981' },
  home: { icon: Home, label: '家居', color: '#F59E0B' },
  shopping: { icon: ShoppingBag, label: '购物', color: '#8B5CF6' },
  food: { icon: Utensils, label: '餐饮', color: '#EF4444' },
  music: { icon: Music, label: '娱乐', color: '#06B6D4' },
  game: { icon: Gamepad, label: '游戏', color: '#84CC16' },
  book: { icon: Book, label: '学习', color: '#6366F1' },
  work: { icon: Briefcase, label: '工作', color: '#78716C' },
  credit: { icon: CreditCard, label: '账单', color: '#F97316' },
  other: { icon: DollarSign, label: '其他', color: '#64748B' }
};

// ==================== 本地缓存工具函数 ====================
const CACHE_KEY = 'budget_bottle_cache';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5分钟过期

const saveToCache = (data) => {
  try {
    const cacheData = {
      ...data,
      wishes: data.wishes?.map(w => ({ ...w, image: null })) || [],
      timestamp: Date.now()
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      try {
        localStorage.removeItem(CACHE_KEY);
        const minimalData = {
          weekKey: data.weekKey,
          weeklyBudget: data.weeklyBudget,
          transactions: data.transactions || [],
          wishPoolAmount: data.wishPoolAmount || 0,
          timestamp: Date.now()
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(minimalData));
      } catch (e2) {
        console.warn('缓存保存失败:', e2);
      }
    } else {
      console.warn('缓存保存失败:', e);
    }
  }
};

const loadFromCache = () => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const data = JSON.parse(cached);
    if (Date.now() - data.timestamp > CACHE_EXPIRY) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return data;
  } catch (e) {
    console.warn('缓存读取失败:', e);
    localStorage.removeItem(CACHE_KEY);
    return null;
  }
};

// 工具函数：获取当前周信息
const getWeekInfo = (date = new Date()) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  
  const firstDayOfMonth = new Date(year, month, 1);
  const firstDayWeekday = firstDayOfMonth.getDay() || 7;
  const weekNumber = Math.ceil((day + firstDayWeekday - 1) / 7);
  
  const dayOfWeek = date.getDay() || 7;
  const weekStart = new Date(date);
  weekStart.setDate(day - dayOfWeek + 1);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  
  return {
    year,
    month: month + 1,
    weekNumber,
    weekStart,
    weekEnd,
    weekKey: `${year}-${String(month + 1).padStart(2, '0')}-W${weekNumber}`
  };
};

// 获取上周信息
const getPreviousWeekInfo = (currentWeekInfo) => {
  const prevWeekStart = new Date(currentWeekInfo.weekStart);
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);
  return getWeekInfo(prevWeekStart);
};

// 格式化日期
const formatDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}/${m}/${d}`;
};

// 格式化短日期 (月/日)
const formatShortDate = (date) => {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return `${m}/${d}`;
};

// 解析 weekKey 为可读格式
const parseWeekKey = (weekKey) => {
  const match = weekKey.match(/(\d{4})-(\d{2})-W(\d+)/);
  if (match) {
    return `${match[1]}年${parseInt(match[2])}月 第${match[3]}周`;
  }
  return weekKey;
};

// 确认弹窗组件
const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl p-6 mx-4 w-full max-w-sm">
        <h2 className="text-lg font-bold text-gray-800 mb-2">{title}</h2>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium active:scale-95"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 bg-red-500 text-white rounded-xl font-medium active:scale-95"
          >
            确定删除
          </button>
        </div>
      </div>
    </div>
  );
};

// ==================== 计算器组件 ====================
const Calculator = ({ value, onChange, onClose }) => {
  const [display, setDisplay] = useState(value ? value.toString() : '');
  const [hasOperator, setHasOperator] = useState(false);
  
  const handleNumber = (num) => {
    setDisplay(prev => {
      // 如果当前显示为空或为0，直接替换（小数点除外）
      if (prev === '' || prev === '0') {
        return num === '.' ? '0.' : num;
      }
      // 防止多个小数点
      if (num === '.' && prev.includes('.')) {
        return prev;
      }
      return prev + num;
    });
  };
  
  const handleOperator = (op) => {
    if (display && !hasOperator) {
      setDisplay(prev => prev + ' ' + op + ' ');
      setHasOperator(true);
    }
  };
  
  const handleClear = () => {
    setDisplay('');
    setHasOperator(false);
  };
  
  const handleBackspace = () => {
    setDisplay(prev => {
      const newVal = prev.trim().slice(0, -1).trim();
      if (!newVal.includes('+') && !newVal.includes('-') && !newVal.includes('×') && !newVal.includes('÷')) {
        setHasOperator(false);
      }
      return newVal;
    });
  };
  
  const calculate = () => {
    try {
      let expr = display
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/\s/g, '');
      // eslint-disable-next-line no-eval
      const result = eval(expr);
      return isNaN(result) ? 0 : Math.round(result * 100) / 100;
    } catch {
      return 0;
    }
  };
  
  const handleConfirm = () => {
    const result = calculate();
    onChange(result);
    onClose();
  };
  
  const displayResult = calculate();
  
  return (
    <div 
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-t-3xl w-full max-w-md overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 显示区域 */}
        <div className="p-6 bg-gray-50">
          <div className="text-right">
            <div className="text-2xl text-cyan-500 font-bold mb-1">
              ¥{display || '0'}
            </div>
            {hasOperator && (
              <div className="text-sm text-gray-400">
                = ¥{displayResult}
              </div>
            )}
          </div>
        </div>
        
        {/* 键盘区域 */}
        <div className="p-4 grid grid-cols-4 gap-3">
          {['1', '2', '3', '+'].map(key => (
            <button
              key={key}
              onClick={() => {
                if (key === '+') handleOperator('+');
                else handleNumber(key);
              }}
              className={`py-4 rounded-xl text-xl font-medium active:scale-95 transition-transform ${
                key === '+' ? 'bg-gray-100 text-gray-600' : 'bg-white border border-gray-200'
              }`}
            >
              {key}
            </button>
          ))}
          {['4', '5', '6', '-'].map(key => (
            <button
              key={key}
              onClick={() => {
                if (key === '-') handleOperator('-');
                else handleNumber(key);
              }}
              className={`py-4 rounded-xl text-xl font-medium active:scale-95 transition-transform ${
                key === '-' ? 'bg-gray-100 text-gray-600' : 'bg-white border border-gray-200'
              }`}
            >
              {key}
            </button>
          ))}
          {['7', '8', '9', '×'].map(key => (
            <button
              key={key}
              onClick={() => {
                if (key === '×') handleOperator('×');
                else handleNumber(key);
              }}
              className={`py-4 rounded-xl text-xl font-medium active:scale-95 transition-transform ${
                key === '×' ? 'bg-gray-100 text-gray-600' : 'bg-white border border-gray-200'
              }`}
            >
              {key}
            </button>
          ))}
          <button
            onClick={() => handleNumber('.')}
            className="py-4 rounded-xl text-xl font-medium bg-white border border-gray-200 active:scale-95"
          >
            .
          </button>
          <button
            onClick={() => handleNumber('0')}
            className="py-4 rounded-xl text-xl font-medium bg-white border border-gray-200 active:scale-95"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            className="py-4 rounded-xl text-xl font-medium bg-gray-100 text-gray-600 active:scale-95"
          >
            ⌫
          </button>
          <button
            onClick={handleConfirm}
            className="py-4 rounded-xl text-xl font-medium bg-cyan-500 text-white active:scale-95"
          >
            完成
          </button>
        </div>
        
        {/* 取消按钮 */}
        <div className="px-4 pb-6">
          <button
            onClick={onClose}
            className="w-full py-3 text-gray-500 text-center"
          >
            取消
          </button>
        </div>
      </div>
      
      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

// 瓶子组件 - 使用自定义 SVG
const RabbitBottle = ({ remaining, total, spent, onStrawClick, onBodyClick }) => {
  
  const percentage = total > 0 ? (remaining / total) * 100 : 0;
  // 最大液体高度设置为315px
  const maxLiquidHeight = 315;
  const fillHeight = Math.max(0, Math.min(100, percentage));
  const actualFillHeight = (fillHeight / 100) * maxLiquidHeight;
  
  const bodyBottom = 403;
  const bodyHeight = 320;
  const bodyTop = bodyBottom - bodyHeight; 
  const fillY = bodyBottom - actualFillHeight;
  const fillRectHeight = actualFillHeight;

  return (
    <div 
      className="relative cursor-pointer"
      style={{ width: '400px', height: '450px' }}
    >
      <svg viewBox="0 0 400 450" className="w-full h-full">
        <defs>
          <clipPath id="cupBodyClip">
            <path d="M74.0823 83H326.082L297.704 403H102.461L74.0823 83Z" />
          </clipPath>
          <linearGradient id="liquidGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#00D4F0" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#00C3E0" stopOpacity="1" />
          </linearGradient>
        </defs>
        
        <path d="M333.402 83H66.7584C63.0704 83 60.0823 80.0128 60.0823 76.3258V75.6742C60.0823 71.9872 63.0704 69 66.7584 69H333.406C337.094 69 340.082 71.9872 340.082 75.6742V76.3258C340.078 80.0128 337.09 83 333.402 83Z" fill="#E6E6E6"/>
        
        <path 
          d="M74.0823 83H326.082L297.704 403H102.461L74.0823 83Z" 
          fill="#F3F3F3"
          onClick={onBodyClick}
          style={{ cursor: 'pointer' }}
        />
        
        <g 
          onClick={(e) => {
            e.stopPropagation();
            onStrawClick && onStrawClick();
          }}
          style={{ cursor: 'pointer' }}
          className="straw-group"
        >
          <path d="M269.082 20.245L241.919 13L223.082 83H252.192L269.082 20.245Z" fill="#000000" />
          <path d="M252.082 83H223.11L137.484 402.5H166.456L252.082 83Z" fill="#4F4F4F"/>
          <path d="M252.082 83H223.11L137.484 402.5H166.456L252.082 83Z" fill="#ffffff" fillOpacity="0.2"/>
        </g>
        
        {/* 液体主体 */}
        <rect
          x="74"
          y={fillY}
          width="252"
          height={fillRectHeight + 5}
          fill="url(#liquidGradient)"
          clipPath="url(#cupBodyClip)"
          onClick={onBodyClick}
          style={{ cursor: 'pointer' }}
        />
        
        {/* 5px高的波浪动画 */}
        {fillRectHeight > 0 && (
          <g clipPath="url(#cupBodyClip)">
            <path
              className="bottle-wave-1"
              d={`M74 ${fillY + 2} Q120 ${fillY - 3} 160 ${fillY + 2} T250 ${fillY} T326 ${fillY + 2} L326 ${fillY + 8} L74 ${fillY + 8} Z`}
              fill="#00D4F0"
              fillOpacity="0.8"
            />
            <path
              className="bottle-wave-2"
              d={`M74 ${fillY + 3} Q130 ${fillY + 6} 180 ${fillY + 1} T270 ${fillY + 4} T326 ${fillY + 2} L326 ${fillY + 10} L74 ${fillY + 10} Z`}
              fill="#00E5FF"
              fillOpacity="0.5"
            />
          </g>
        )}
        
        <rect x="208" y="418" width="14" height="10" fill="#E0E0E0"/>
        <rect x="222" y="435" width="25" height="10" rx="5" transform="rotate(-90 222 435)" fill="#4F4F4F"/>
        <rect x="192" y="403" width="16" height="40" fill="#E0E0E0"/>
      </svg>
      
      <div 
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" 
        style={{ paddingTop: '250px' }}
      >
        <div className="text-3xl font-bold text-gray-100">
          ¥{remaining.toLocaleString()}
        </div>
        <div className="text-[10px] text-gray-100 text-opacity-80 mt-0">
          点击吸管记录消费
        </div>
      </div>
      
      <style>{`
        @keyframes bottleWave1 {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(-15px); }
        }
        @keyframes bottleWave2 {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(10px); }
        }
        .bottle-wave-1 { animation: bottleWave1 2s ease-in-out infinite; }
        .bottle-wave-2 { animation: bottleWave2 2.5s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

// ==================== 首页侧边栏组件 ====================
const HomeSidebar = ({ 
  fixedExpenses, 
  specialBudgets, 
  onFixedExpensesClick, 
  onSpecialBudgetClick,
  onBudgetListClick 
}) => {
  const pinnedBudgets = specialBudgets.filter(b => b.pinnedToHome);
  
  return (
    <div className="absolute top-4 left-4 z-20 flex flex-col items-start gap-2">
      {/* 固定/灵活预算入口 */}
      <button
        onClick={onFixedExpensesClick}
        className="flex items-center gap-2 bg-white bg-opacity-90 backdrop-blur-sm rounded-full pl-3 pr-4 py-2 shadow-lg active:scale-95 transition-transform"
      >
        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
          <Menu size={14} className="text-gray-600" />
        </div>
        <span className="text-sm font-medium text-gray-700">
          固定/灵活预算
        </span>
      </button>
      
      {/* 固定到首页的专项预算 */}
      {pinnedBudgets.map(budget => {
        const iconConfig = BUDGET_ICONS[budget.icon] || BUDGET_ICONS.other;
        const IconComponent = iconConfig.icon;
        
        return (
          <button
            key={budget.id}
            onClick={() => onSpecialBudgetClick(budget)}
            className="flex items-center gap-2 bg-white bg-opacity-90 backdrop-blur-sm rounded-full pl-3 pr-4 py-2 shadow-lg active:scale-95 transition-transform"
          >
            <div 
              className="w-6 h-6 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${iconConfig.color}20` }}
            >
              <IconComponent size={14} style={{ color: iconConfig.color }} />
            </div>
            <span className="text-sm font-medium text-gray-700">
              {budget.name}
            </span>
          </button>
        );
      })}
    </div>
  );
};

// ==================== 物理引擎心愿池组件 ====================
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
  
  // 计算液体高度
  const liquidHeight = Math.min(MAX_LIQUID_HEIGHT, (poolAmount / maxPoolAmount) * MAX_LIQUID_HEIGHT);
  const hasBalance = poolAmount > 0;
  
  // 计算需要的行数（提前计算以确定容器高度）
  const padding = 16;
  const gap = 12;
  const ballsPerRow = Math.max(1, Math.floor((containerWidth - padding * 2 + gap) / (BALL_SIZE + gap)));
  const totalItems = wishes.length + 1;
  const rows = Math.ceil(totalItems / ballsPerRow);
  const ballsAreaHeight = rows * (BALL_SIZE + gap);
  
  // 计算SVG和容器高度
  const baseSvgHeight = Math.max(MIN_CONTAINER_HEIGHT, liquidHeight + SEABED_HEIGHT);
  const svgHeight = Math.max(baseSvgHeight, SEABED_HEIGHT + ballsAreaHeight + 20);
  const totalHeight = HEADER_HEIGHT + svgHeight;
  const seabedTop = svgHeight - SEABED_HEIGHT;
  const liquidTop = hasBalance ? (svgHeight - SEABED_HEIGHT - liquidHeight) : seabedTop;
  
  // 物理参数
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
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);
  
  const getGroundY = useCallback((x) => {
    if (hasBalance) {
      return liquidTop + 5;
    } else {
      return getMaxYForBall(x);
    }
  }, [hasBalance, liquidTop, getMaxYForBall]);
  
  useEffect(() => {
    const allItems = [{ id: 'add-button', isButton: true }, ...wishes];
    
    setBallPositions(prev => {
      const newPositions = allItems.map((item, index) => {
        const existingPos = prev.find(p => p.id === item.id);
        
        const row = Math.floor(index / ballsPerRow);
        const col = index % ballsPerRow;
        const targetX = padding + col * (BALL_SIZE + gap);
        
        const baseGroundY = getGroundY(targetX);
        const targetY = baseGroundY + row * (BALL_SIZE + gap);
        
        if (existingPos) {
          return {
            ...existingPos,
            targetX,
            targetY,
            isButton: item.isButton || false,
            fulfilled: item.fulfilled || false
          };
        }
        
        const startY = item.isButton ? targetY : -BALL_SIZE - Math.random() * 50;
        
        return {
          id: item.id,
          x: targetX,
          y: startY,
          vx: 0,
          vy: 0,
          targetX,
          targetY,
          isButton: item.isButton || false,
          fulfilled: item.fulfilled || false
        };
      });
      
      return newPositions;
    });
  }, [wishes, containerWidth, hasBalance, svgHeight, ballsPerRow, getGroundY]);
  
  useEffect(() => {
    const animate = () => {
      setBallPositions(prev => {
        let hasMovement = false;
        
        const updated = prev.map((ball, index) => {
          if (ball.isButton) {
            return { ...ball, x: ball.targetX, y: ball.targetY };
          }
          
          let { x, y, vx, vy, targetX, targetY } = ball;
          
          vy += GRAVITY;
          
          if (hasBalance && y > liquidTop) {
            vy -= BUOYANCY;
          }
          
          vx *= FRICTION;
          vy *= FRICTION;
          
          const dx = targetX - x;
          const dy = targetY - y;
          vx += dx * 0.02;
          vy += dy * 0.02;
          
          x += vx;
          y += vy;
          
          if (x < padding) {
            x = padding;
            vx = -vx * BOUNCE;
          }
          if (x > containerWidth - padding - BALL_SIZE) {
            x = containerWidth - padding - BALL_SIZE;
            vx = -vx * BOUNCE;
          }
          
          const maxY = getMaxYForBall(x);
          if (y > maxY) {
            y = maxY;
            vy = -vy * BOUNCE;
            if (Math.abs(vy) < 0.5) vy = 0;
          }
          
          if (Math.abs(vx) > 0.1 || Math.abs(vy) > 0.1 || 
              Math.abs(x - targetX) > 1 || Math.abs(y - targetY) > 1) {
            hasMovement = true;
          }
          
          return { ...ball, x, y, vx, vy };
        });
        
        for (let i = 0; i < updated.length; i++) {
          if (updated[i].isButton) continue;
          
          for (let j = i + 1; j < updated.length; j++) {
            if (updated[j].isButton) continue;
            
            const ball1 = updated[i];
            const ball2 = updated[j];
            
            const dx = (ball2.x + BALL_RADIUS) - (ball1.x + BALL_RADIUS);
            const dy = (ball2.y + BALL_RADIUS) - (ball1.y + BALL_RADIUS);
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDist = BALL_SIZE;
            
            if (distance < minDist && distance > 0) {
              hasMovement = true;
              
              const overlap = (minDist - distance) / 2;
              const nx = dx / distance;
              const ny = dy / distance;
              
              updated[i].x -= overlap * nx;
              updated[i].y -= overlap * ny;
              updated[j].x += overlap * nx;
              updated[j].y += overlap * ny;
              
              const maxY1 = getMaxYForBall(updated[i].x);
              const maxY2 = getMaxYForBall(updated[j].x);
              if (updated[i].y > maxY1) updated[i].y = maxY1;
              if (updated[j].y > maxY2) updated[j].y = maxY2;
              
              const dvx = ball1.vx - ball2.vx;
              const dvy = ball1.vy - ball2.vy;
              const dvn = dvx * nx + dvy * ny;
              
              if (dvn > 0) {
                updated[i].vx -= dvn * nx * BOUNCE;
                updated[i].vy -= dvn * ny * BOUNCE;
                updated[j].vx += dvn * nx * BOUNCE;
                updated[j].vy += dvn * ny * BOUNCE;
              }
            }
          }
        }
        
        return updated;
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [containerWidth, hasBalance, liquidTop, getMaxYForBall]);
  
  const closeDebugMode = () => {
    if (debugMode) {
      onDebugChange?.(-1);
    }
  };
  
  return (
    <div className="relative" style={{ height: `${totalHeight}px` }}>
      {debugMode && (
        <div 
          className="fixed inset-0 z-[5]" 
          onClick={closeDebugMode}
        />
      )}
      
      {debugMode && (
        <div 
          className="absolute top-0 right-2 z-10 bg-black bg-opacity-70 text-white text-xs p-2 rounded"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-1">调试模式 (液体高度: {Math.round(liquidHeight)}px)</div>
          <div className="flex gap-1 flex-wrap">
            {[0, 500, 1000, 2500, 5000, 10000].map(val => (
              <button 
                key={val}
                onClick={() => onDebugChange?.(val)}
                className="px-2 py-1 bg-gray-600 rounded hover:bg-gray-500"
              >
                ¥{val}
              </button>
            ))}
          </div>
        </div>
      )}
      
      <div 
        className="pl-6 pb-3 flex items-center gap-2 cursor-pointer active:opacity-80" 
        style={{ height: `${HEADER_HEIGHT}px` }}
        onClick={onPoolClick}
      >
        <div>
          <div className="text-sm text-gray-400 mb-1 flex items-center gap-1">
            心愿池
            <History size={12} className="text-gray-400" />
          </div>
          <div className="text-lg font-semibold text-[#00C3E0]">
            已积攒 ¥{poolAmount.toLocaleString()}
          </div>
        </div>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onDebugChange?.(debugMode ? -1 : poolAmount);
          }}
          className="ml-auto mr-4 w-6 h-6 rounded-full bg-gray-200 text-gray-500 text-xs flex items-center justify-center hover:bg-gray-300"
          title="切换调试模式"
        >
          {debugMode ? '×' : '?'}
        </button>
      </div>
      
      <div 
        ref={containerRef}
        className="relative w-full" 
        style={{ height: `${svgHeight}px` }}
      >
        <svg 
          viewBox={`0 0 400 ${svgHeight}`}
          className="w-full h-full" 
          preserveAspectRatio="none"
        >
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
              <rect
                x="0"
                y={liquidTop + 12}
                width="400"
                height={liquidHeight}
                fill="url(#liquidGradient)"
              />
              <path
                className="wave-animation-1"
                d={`M0 ${liquidTop + 10} Q50 ${liquidTop + 5} 100 ${liquidTop + 12} T200 ${liquidTop + 8} T300 ${liquidTop + 14} T400 ${liquidTop + 10} L400 ${liquidTop + 20} L0 ${liquidTop + 20} Z`}
                fill="#00C3E0"
                fillOpacity="0.9"
              />
              <path
                className="wave-animation-2"
                d={`M0 ${liquidTop + 8} Q60 ${liquidTop + 14} 120 ${liquidTop + 6} T240 ${liquidTop + 12} T360 ${liquidTop + 8} T400 ${liquidTop + 10} L400 ${liquidTop + 18} L0 ${liquidTop + 18} Z`}
                fill="#00D4F0"
                fillOpacity="0.5"
              />
              <path
                className="wave-animation-3"
                d={`M0 ${liquidTop + 12} Q80 ${liquidTop + 8} 160 ${liquidTop + 14} T320 ${liquidTop + 10} T400 ${liquidTop + 12}`}
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="2"
                fill="none"
              />
            </>
          )}
          
          <path
            d={`M0 ${seabedTop} Q50 ${seabedTop - 5} 100 ${seabedTop + 3} T200 ${seabedTop} T300 ${seabedTop + 3} T400 ${seabedTop - 2} L400 ${svgHeight} L0 ${svgHeight} Z`}
            fill="url(#seabedGradient)"
          />
        </svg>
        
        {ballPositions.map((ball) => {
          if (ball.isButton) {
            return (
              <div
                key="add-button"
                className={`absolute w-12 h-12 rounded-full flex items-center justify-center cursor-pointer active:scale-95 shadow-lg transition-colors ${
                  hasBalance 
                    ? 'bg-white bg-opacity-40 hover:bg-opacity-50' 
                    : 'bg-[#8b7a94] bg-opacity-60 hover:bg-opacity-70'
                }`}
                style={{
                  left: `${ball.x}px`,
                  top: `${ball.y}px`,
                  transform: 'translateZ(0)'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onAddClick && onAddClick();
                }}
              >
                <Plus size={22} className="text-white" />
              </div>
            );
          }
          
          const wish = wishes.find(w => w.id === ball.id);
          if (!wish) return null;
          
          return (
            <div
              key={ball.id}
              className={`absolute w-12 h-12 rounded-full flex items-center justify-center overflow-hidden cursor-pointer active:scale-95 hover:ring-2 hover:ring-white shadow-lg transition-colors ${
                hasBalance 
                  ? 'bg-white bg-opacity-30' 
                  : 'bg-[#8b7a94] bg-opacity-50'
              } ${ball.fulfilled ? 'ring-2 ring-green-400' : ''}`}
              style={{
                left: `${ball.x}px`,
                top: `${ball.y}px`,
                transform: 'translateZ(0)'
              }}
              title={wish.description}
              onClick={(e) => {
                e.stopPropagation();
                onWishClick && onWishClick(wish);
              }}
            >
              {wish.image ? (
                <img src={wish.image} alt="" className="w-full h-full object-cover" />
              ) : (
                <Heart size={18} className="text-white" />
              )}
              {ball.fulfilled && (
                <div className="absolute inset-0 bg-green-500 bg-opacity-50 flex items-center justify-center">
                  <Check size={24} className="text-white" strokeWidth={3} />
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <style>{`
        @keyframes wave1 {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(-20px); }
        }
        @keyframes wave2 {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(15px); }
        }
        @keyframes wave3 {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(-10px); }
        }
        .wave-animation-1 { animation: wave1 3s ease-in-out infinite; }
        .wave-animation-2 { animation: wave2 2.5s ease-in-out infinite; }
        .wave-animation-3 { animation: wave3 4s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

// 骨架屏
const SkeletonHome = () => (
  <div className="min-h-screen bg-white flex flex-col animate-pulse">
    <div className="px-6 pt-12 pb-4">
      <div className="h-6 bg-gray-200 rounded w-40 mx-auto mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-48 mx-auto"></div>
    </div>
    <div className="flex-1 flex items-center justify-center">
      <div className="w-80 h-96 bg-gray-200 rounded-3xl"></div>
    </div>
    <div className="h-28 bg-gray-300"></div>
  </div>
);

// ==================== 子视图组件 ====================

// 添加消费视图
const AddTransactionView = ({ weekInfo, transactions, setTransactions, viewingTransactions, setViewingTransactions }) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async () => {
    if (!amount) return;

    const now = new Date();
    const result = await createTransaction(
      weekInfo.weekKey,
      formatDate(now),
      `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
      parseFloat(amount),
      description
    );

    if (result.success) {
      setTransactions([...transactions, result.data]);
      setViewingTransactions([...viewingTransactions, result.data]);
      window.history.back();
    } else {
      alert('记录失败: ' + result.error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-gray-600 mb-6 active:scale-95"
        >
          <ArrowLeft size={20} />
          返回
        </button>

        <h1 className="text-2xl font-bold text-gray-800 mb-8">记录消费</h1>

        <div className="bg-white rounded-2xl p-6 space-y-6">
          <div>
            <label className="block text-gray-600 mb-2">金额</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-gray-400">¥</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl text-2xl font-bold focus:border-gray-400 focus:outline-none"
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-600 mb-2">备注</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="例如：超市、外卖..."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-gray-400 focus:outline-none"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!amount}
            className="w-full py-4 bg-gray-800 text-white rounded-xl font-medium disabled:bg-gray-300 active:scale-95 transition-transform"
          >
            记录消费
          </button>
        </div>
      </div>
    </div>
  );
};

// 编辑消费视图
const EditTransactionView = ({ editingTransaction, weekInfo, transactions, setTransactions, viewingTransactions, setViewingTransactions }) => {
  const [amount, setAmount] = useState(editingTransaction?.amount?.toString() || '');
  const [description, setDescription] = useState(editingTransaction?.description || '');
  const [date, setDate] = useState(editingTransaction?.date?.replace(/\//g, '-') || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!editingTransaction) return null;

  const handleSubmit = async () => {
    if (!amount) return;

    const result = await updateTransaction(
      editingTransaction.id,
      weekInfo.weekKey,
      parseFloat(amount),
      description,
      date.replace(/-/g, '/')
    );

    if (result.success) {
      const updated = transactions.map(t => 
        t.id === editingTransaction.id ? result.data : t
      );
      setTransactions(updated);
      const updatedViewing = viewingTransactions.map(t => 
        t.id === editingTransaction.id ? result.data : t
      );
      setViewingTransactions(updatedViewing);
      window.history.back();
    } else {
      alert('保存失败: ' + result.error);
    }
  };

  const handleDelete = async () => {
    const result = await deleteTransaction(editingTransaction.id);
    if (result.success) {
      setTransactions(transactions.filter(t => t.id !== editingTransaction.id));
      setViewingTransactions(viewingTransactions.filter(t => t.id !== editingTransaction.id));
      window.history.back();
    } else {
      alert('删除失败: ' + result.error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-gray-600 mb-6 active:scale-95"
        >
          <ArrowLeft size={20} />
          返回
        </button>

        <h1 className="text-2xl font-bold text-gray-800 mb-8">编辑消费</h1>

        <div className="bg-white rounded-2xl p-6 space-y-6">
          <div>
            <label className="block text-gray-600 mb-2">日期</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-gray-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-gray-600 mb-2">金额</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-gray-400">¥</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl text-2xl font-bold focus:border-gray-400 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-600 mb-2">备注</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="例如：超市、外卖..."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-gray-400 focus:outline-none"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={!amount}
              className="flex-1 py-4 bg-gray-800 text-white rounded-xl font-medium disabled:bg-gray-300 active:scale-95"
            >
              保存
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-6 py-4 bg-red-500 text-white rounded-xl font-medium active:scale-95"
            >
              删除
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="删除消费记录"
        message="确定要删除这条消费记录吗？此操作无法撤销。"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
};

// 编辑固定支出视图
const EditExpenseView = ({ editingExpense, fixedExpenses, setFixedExpenses }) => {
  const isNew = !editingExpense?.id;
  const [name, setName] = useState(editingExpense?.name || '');
  const [amount, setAmount] = useState(editingExpense?.amount?.toString() || '');
  const [expireDate, setExpireDate] = useState(editingExpense?.expireDate || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSubmit = async () => {
    if (!name || !amount) return;

    let result;
    if (isNew) {
      result = await createFixedExpense(name, parseFloat(amount), expireDate, true);
    } else {
      result = await updateFixedExpense(editingExpense.id, name, parseFloat(amount), expireDate, true);
    }

    if (result.success) {
      const expenseResult = await getFixedExpenses();
      if (expenseResult.success) setFixedExpenses(expenseResult.data);
      window.history.back();
    } else {
      alert('保存失败: ' + result.error);
    }
  };

  const handleDelete = async () => {
    const result = await deleteFixedExpense(editingExpense.id);
    if (result.success) {
      setFixedExpenses(fixedExpenses.filter(e => e.id !== editingExpense.id));
      window.history.back();
    } else {
      alert('删除失败: ' + result.error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-gray-600 mb-6 active:scale-95"
        >
          <ArrowLeft size={20} />
          返回
        </button>

        <h1 className="text-2xl font-bold text-gray-800 mb-8">
          {isNew ? '添加固定支出' : '编辑固定支出'}
        </h1>

        <div className="bg-white rounded-2xl p-6 space-y-6">
          <div>
            <label className="block text-gray-600 mb-2">名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：Claude会员"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-gray-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-gray-600 mb-2">每月金额</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-gray-400">¥</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl text-lg focus:border-gray-400 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-600 mb-2">到期日期（可选）</label>
            <input
              type="text"
              value={expireDate}
              onChange={(e) => setExpireDate(e.target.value)}
              placeholder="例如：2025/12/25"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-gray-400 focus:outline-none"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={!name || !amount}
              className="flex-1 py-4 bg-gray-800 text-white rounded-xl font-medium disabled:bg-gray-300 active:scale-95"
            >
              保存
            </button>
            {!isNew && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-6 py-4 bg-red-500 text-white rounded-xl font-medium active:scale-95"
              >
                删除
              </button>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="删除固定支出"
        message={`确定要删除"${name}"吗？此操作无法撤销。`}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
};

// 编辑心愿视图 - 增加已实现功能
const EditWishView = ({ editingWish, wishes, setWishes, wishPoolAmount, setWishPoolAmount }) => {
  const isNew = !editingWish?.id;
  const [description, setDescription] = useState(editingWish?.description || '');
  const [amount, setAmount] = useState(editingWish?.amount?.toString() || '');
  const [image, setImage] = useState(editingWish?.image || null);
  const [fulfilled, setFulfilled] = useState(editingWish?.fulfilled || false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPurchaseConfirm, setShowPurchaseConfirm] = useState(false);

  const handleSubmit = async () => {
    if (!description || !amount) return;

    let result;
    if (isNew) {
      result = await createWish(description, parseFloat(amount), image, fulfilled);
    } else {
      result = await updateWish(editingWish.id, description, parseFloat(amount), image, fulfilled);
    }

    if (result.success) {
      const wishResult = await getWishes();
      if (wishResult.success) setWishes(wishResult.data);
      window.history.back();
    } else {
      alert('保存失败: ' + result.error);
    }
  };

  const handleDelete = async () => {
    const result = await deleteWish(editingWish.id);
    if (result.success) {
      setWishes(wishes.filter(w => w.id !== editingWish.id));
      window.history.back();
    } else {
      alert('删除失败: ' + result.error);
    }
  };

  const handlePurchase = async () => {
    await updateWishPool(wishPoolAmount - parseFloat(amount));
    setWishPoolAmount(wishPoolAmount - parseFloat(amount));
    const result = await updateWish(editingWish.id, description, parseFloat(amount), image, true);
    if (result.success) {
      const wishResult = await getWishes();
      if (wishResult.success) setWishes(wishResult.data);
    }
    window.history.back();
  };

  const handleToggleFulfilled = () => {
    setFulfilled(!fulfilled);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const canPurchase = !isNew && !fulfilled && wishPoolAmount >= parseFloat(amount || 0);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-gray-600 mb-6 active:scale-95"
        >
          <ArrowLeft size={20} />
          返回
        </button>

        <h1 className="text-2xl font-bold text-gray-800 mb-8">
          {isNew ? '添加心愿' : '编辑心愿'}
        </h1>

        <div className="bg-white rounded-2xl p-6 space-y-6">
          {!isNew && (
            <div 
              className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-colors ${
                fulfilled ? 'bg-green-50 border-2 border-green-200' : 'bg-gray-50 border-2 border-gray-200'
              }`}
              onClick={handleToggleFulfilled}
            >
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  fulfilled ? 'bg-green-500' : 'bg-gray-300'
                }`}>
                  {fulfilled && <Check size={16} className="text-white" />}
                </div>
                <span className={`font-medium ${fulfilled ? 'text-green-700' : 'text-gray-600'}`}>
                  {fulfilled ? '已实现 🎉' : '未实现'}
                </span>
              </div>
              <span className="text-sm text-gray-400">点击切换</span>
            </div>
          )}

          <div>
            <label className="block text-gray-600 mb-2">心愿描述</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="例如：羽绒服"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-gray-600 mb-2">金额</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-gray-400">¥</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl text-lg focus:border-pink-400 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-600 mb-2">图片（可选）</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl"
            />
            {image && (
              <div className="mt-4 relative">
                <img src={image} alt="" className="w-full h-40 object-cover rounded-xl" />
                <button
                  onClick={() => setImage(null)}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full active:scale-95"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>

          {canPurchase && (
            <button
              onClick={() => setShowPurchaseConfirm(true)}
              className="w-full py-4 bg-pink-500 text-white rounded-xl font-medium active:scale-95"
            >
              🎉 可以买啦！用心愿池资金购买
            </button>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={!description || !amount}
              className="flex-1 py-4 bg-gray-800 text-white rounded-xl font-medium disabled:bg-gray-300 active:scale-95"
            >
              保存
            </button>
            {!isNew && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-6 py-4 bg-red-500 text-white rounded-xl font-medium active:scale-95"
              >
                删除
              </button>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="删除心愿"
        message={`确定要删除"${description}"吗？此操作无法撤销。`}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {showPurchaseConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl p-6 mx-4 w-full max-w-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-2">确认购买</h2>
            <p className="text-gray-600 mb-6">
              确定用心愿池资金 ¥{amount} 购买"{description}"吗？购买后将标记为已实现。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPurchaseConfirm(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium active:scale-95"
              >
                取消
              </button>
              <button
                onClick={handlePurchase}
                className="flex-1 py-3 bg-pink-500 text-white rounded-xl font-medium active:scale-95"
              >
                确定购买
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== 心愿池历史视图 ====================
const WishPoolHistoryView = ({ wishPoolAmount }) => {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      const result = await getWishPoolHistory();
      if (result.success) {
        setHistory(result.data);
      }
      setIsLoading(false);
    };
    loadHistory();
  }, []);

  const totalSaved = history.reduce((sum, h) => sum + (h.savedAmount > 0 ? h.savedAmount : 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-gray-600 mb-6 active:scale-95"
        >
          <ArrowLeft size={20} />
          返回
        </button>

        <h1 className="text-2xl font-bold text-gray-800 mb-2">心愿池</h1>
        <p className="text-gray-500 mb-6">当前余额 ¥{wishPoolAmount.toLocaleString()}</p>

        <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-5 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center flex-shrink-0">
              <Info size={20} className="text-cyan-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">积攒规则</h3>
              <ul className="text-sm text-gray-600 space-y-1.5">
                <li>• 每周日 24:00 自动结算本周预算</li>
                <li>• 周预算 - 本周支出 = 本周节省金额</li>
                <li>• 节省金额自动流入心愿池</li>
                <li>• 攒够心愿金额即可购买心愿物品</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">累计积攒</p>
              <p className="text-2xl font-bold text-cyan-500">¥{totalSaved.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">结算周数</p>
              <p className="text-2xl font-bold text-gray-800">{history.length}</p>
            </div>
          </div>
        </div>

        <h2 className="text-lg font-semibold text-gray-800 mb-3">积攒历史</h2>
        
        {isLoading ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800 mx-auto"></div>
            <p className="text-gray-400 mt-4">加载中...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <PiggyBank size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-400">暂无积攒记录</p>
            <p className="text-sm text-gray-300 mt-2">每周日结算后会自动记录</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((item) => (
              <div key={item.id} className="bg-white rounded-xl p-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium text-gray-800">{parseWeekKey(item.weekKey)}</span>
                  <span className={`font-semibold ${item.savedAmount >= 0 ? 'text-cyan-500' : 'text-red-500'}`}>
                    {item.savedAmount >= 0 ? '+' : ''}¥{item.savedAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-gray-400">
                  <span>预算 ¥{item.budgetAmount} · 支出 ¥{item.spentAmount}</span>
                  <span>{new Date(item.settledAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ==================== 固定/灵活预算列表视图 ====================
const BudgetListView = ({ 
  fixedExpenses, 
  specialBudgets, 
  specialBudgetItems,
  setFixedExpenses,
  setSpecialBudgets,
  navigateTo 
}) => {
  const totalFixedExpense = fixedExpenses.reduce((sum, e) => sum + e.amount, 0);
  
  // 计算每个专项预算的已用金额
  const getSpentAmount = (budgetId) => {
    const items = specialBudgetItems[budgetId] || [];
    return items.reduce((sum, item) => sum + (item.actualAmount || 0), 0);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-gray-600 mb-6 active:scale-95"
        >
          <ArrowLeft size={20} />
          返回
        </button>

        <h1 className="text-2xl font-bold text-gray-800 mb-6">固定/灵活预算</h1>

        {/* 固定支出卡片 */}
        <div 
          className="bg-white rounded-2xl p-5 mb-4 cursor-pointer active:scale-[0.99] transition-transform"
          onClick={() => navigateTo('fixedExpenses')}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
              <Menu size={24} className="text-gray-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-800">固定支出</span>
                <span className="text-cyan-500 font-semibold">¥{totalFixedExpense.toLocaleString()}/月</span>
              </div>
              <p className="text-sm text-gray-400 mt-1">
                {fixedExpenses.length > 0 
                  ? fixedExpenses.map(e => e.name).join(' · ')
                  : '暂无固定支出'
                }
              </p>
            </div>
            <ChevronRight size={20} className="text-gray-300" />
          </div>
        </div>

        {/* 专项预算列表 */}
        <div className="space-y-3">
          {specialBudgets.map(budget => {
            const iconConfig = BUDGET_ICONS[budget.icon] || BUDGET_ICONS.other;
            const IconComponent = iconConfig.icon;
            const spentAmount = getSpentAmount(budget.id);
            
            return (
              <div
                key={budget.id}
                className="bg-white rounded-2xl p-5 cursor-pointer active:scale-[0.99] transition-transform"
                onClick={() => navigateTo('specialBudgetDetail', { editingSpecialBudget: budget })}
              >
                <div className="flex items-center gap-4">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${iconConfig.color}15` }}
                  >
                    <IconComponent size={24} style={{ color: iconConfig.color }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-800">{budget.name}</span>
                      <span className="text-red-500 font-semibold">¥{spentAmount.toLocaleString()}</span>
                    </div>
                  </div>
                  {budget.pinnedToHome && (
                    <div className="px-2 py-1 bg-cyan-50 rounded text-xs text-cyan-600">首页</div>
                  )}
                  <ChevronRight size={20} className="text-gray-300" />
                </div>
              </div>
            );
          })}
        </div>

        {/* 添加灵活预算按钮 */}
        <button
          onClick={() => navigateTo('editSpecialBudget', { editingSpecialBudget: { id: null } })}
          className="w-full mt-4 py-4 bg-white rounded-2xl text-gray-500 flex items-center justify-center gap-2 active:scale-[0.99] transition-transform"
        >
          <Plus size={20} />
          增加灵活预算
        </button>
      </div>
    </div>
  );
};

// ==================== 专项预算详情视图 ====================
const SpecialBudgetDetailView = ({ 
  budget, 
  items,
  setItems,
  navigateTo,
  refreshBudgets
}) => {
  const [localItems, setLocalItems] = useState(items || []);
  const [editingItemId, setEditingItemId] = useState(null);
  const [editingItemName, setEditingItemName] = useState('');
  const [showCalculator, setShowCalculator] = useState(false);
  const [calculatorTarget, setCalculatorTarget] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteItemConfirm, setShowDeleteItemConfirm] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState(null);
  
  const iconConfig = BUDGET_ICONS[budget.icon] || BUDGET_ICONS.other;
  const IconComponent = iconConfig.icon;
  
  const totalBudget = localItems.reduce((sum, item) => sum + (item.budgetAmount || 0), 0);
  const totalSpent = localItems.reduce((sum, item) => sum + (item.actualAmount || 0), 0);

  useEffect(() => {
    loadItems();
  }, [budget.id]);

  const loadItems = async () => {
    setIsLoading(true);
    const result = await getSpecialBudgetItems(budget.id);
    if (result.success) {
      setLocalItems(result.data);
      setItems(prev => ({ ...prev, [budget.id]: result.data }));
    }
    setIsLoading(false);
  };

  const handleAddItem = async () => {
    const result = await createSpecialBudgetItem(budget.id, '新项目', 0, 0);
    if (result.success) {
      const newItems = [...localItems, result.data];
      setLocalItems(newItems);
      setItems(prev => ({ ...prev, [budget.id]: newItems }));
      // 自动进入编辑模式
      setEditingItemId(result.data.id);
      setEditingItemName(result.data.name);
    }
  };

  const handleUpdateItem = async (itemId, field, value) => {
    const item = localItems.find(i => i.id === itemId);
    if (!item) return;

    const updates = { ...item, [field]: value };
    const result = await updateSpecialBudgetItem(
      itemId,
      updates.name,
      updates.budgetAmount,
      updates.actualAmount
    );
    
    if (result.success) {
      const newItems = localItems.map(i => i.id === itemId ? result.data : i);
      setLocalItems(newItems);
      setItems(prev => ({ ...prev, [budget.id]: newItems }));
    }
  };

  const handleDeleteItem = async (itemId) => {
    const result = await deleteSpecialBudgetItem(itemId);
    if (result.success) {
      const newItems = localItems.filter(i => i.id !== itemId);
      setLocalItems(newItems);
      setItems(prev => ({ ...prev, [budget.id]: newItems }));
    }
    setShowDeleteItemConfirm(false);
    setDeletingItemId(null);
  };

  const openCalculator = (itemId, field, currentValue) => {
    setCalculatorTarget({ itemId, field, currentValue });
    setShowCalculator(true);
  };

  const handleCalculatorConfirm = (value) => {
    if (calculatorTarget) {
      handleUpdateItem(calculatorTarget.itemId, calculatorTarget.field, value);
    }
  };

  // 开始编辑项目名称
  const startEditingName = (item) => {
    setEditingItemId(item.id);
    setEditingItemName(item.name);
  };

  // 保存项目名称
  const saveItemName = (itemId) => {
    if (editingItemName.trim()) {
      handleUpdateItem(itemId, 'name', editingItemName.trim());
    }
    setEditingItemId(null);
    setEditingItemName('');
  };

  // 确认删除项目
  const confirmDeleteItem = (itemId) => {
    setDeletingItemId(itemId);
    setShowDeleteItemConfirm(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <div className="bg-white p-6 pb-4">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => window.history.back()}
            className="text-gray-600 active:scale-95"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="flex-1 flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${iconConfig.color}15` }}
            >
              <IconComponent size={20} style={{ color: iconConfig.color }} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                {budget.name}
                <button
                  onClick={() => navigateTo('editSpecialBudget', { editingSpecialBudget: budget })}
                  className="text-gray-400"
                >
                  <Edit size={16} />
                </button>
              </h1>
              <p className="text-sm text-gray-400">
                预算 ¥{totalBudget.toLocaleString()}，已用 ¥{totalSpent.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 子项列表 */}
      <div className="p-6">
        {isLoading ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800 mx-auto"></div>
            <p className="text-gray-400 mt-4">加载中...</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl overflow-hidden">
            {/* 表头 */}
            <div className="grid grid-cols-4 px-5 py-3 bg-gray-50 text-sm text-gray-500">
              <span>项目</span>
              <span className="text-center">预算</span>
              <span className="text-center">支出</span>
              <span className="text-right">操作</span>
            </div>

            {/* 子项列表 */}
            {localItems.map(item => (
              <div key={item.id} className="grid grid-cols-4 items-center px-5 py-4 border-b border-gray-100">
                {editingItemId === item.id ? (
                  <>
                    <input
                      type="text"
                      value={editingItemName}
                      onChange={(e) => setEditingItemName(e.target.value)}
                      onBlur={() => saveItemName(item.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          saveItemName(item.id);
                        }
                      }}
                      className="border-b border-cyan-500 focus:outline-none text-gray-800 bg-transparent"
                      autoFocus
                    />
                    <div 
                      className="text-center text-gray-400 cursor-pointer"
                      onClick={() => openCalculator(item.id, 'budgetAmount', item.budgetAmount)}
                    >
                      ¥{item.budgetAmount || 0}
                    </div>
                    <div 
                      className="text-center text-red-500 font-medium cursor-pointer"
                      onClick={() => openCalculator(item.id, 'actualAmount', item.actualAmount)}
                    >
                      ¥{item.actualAmount || 0}
                    </div>
                    <div className="flex items-center justify-end">
                      <button
                        onClick={() => confirmDeleteItem(item.id)}
                        className="text-red-400 p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <span 
                      className="text-gray-800 cursor-pointer"
                      onClick={() => startEditingName(item)}
                    >
                      {item.name}
                    </span>
                    <span 
                      className="text-center text-gray-400 cursor-pointer"
                      onClick={() => openCalculator(item.id, 'budgetAmount', item.budgetAmount)}
                    >
                      ¥{item.budgetAmount || '-'}
                    </span>
                    <span 
                      className={`text-center font-medium cursor-pointer ${item.actualAmount ? 'text-red-500' : 'text-gray-300'}`}
                      onClick={() => openCalculator(item.id, 'actualAmount', item.actualAmount)}
                    >
                      {item.actualAmount ? `¥${item.actualAmount}` : '-'}
                    </span>
                    <div className="flex items-center justify-end">
                      <button
                        onClick={() => confirmDeleteItem(item.id)}
                        className="text-gray-300 hover:text-red-400 p-1 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}

            {/* 添加项目 */}
            <button
              onClick={handleAddItem}
              className="w-full py-4 text-gray-400 flex items-center justify-center gap-2 active:bg-gray-50"
            >
              <Plus size={18} />
              添加项目
            </button>
          </div>
        )}
      </div>

      {/* 计算器 */}
      {showCalculator && (
        <Calculator
          value={calculatorTarget?.currentValue || 0}
          onChange={handleCalculatorConfirm}
          onClose={() => setShowCalculator(false)}
        />
      )}

      {/* 删除确认弹窗 */}
      <ConfirmModal
        isOpen={showDeleteItemConfirm}
        title="删除项目"
        message="确定要删除这个项目吗？此操作无法撤销。"
        onConfirm={() => handleDeleteItem(deletingItemId)}
        onCancel={() => {
          setShowDeleteItemConfirm(false);
          setDeletingItemId(null);
        }}
      />
    </div>
  );
};

// ==================== 编辑专项预算视图 ====================
const EditSpecialBudgetView = ({ 
  budget, 
  specialBudgets,
  setSpecialBudgets,
  refreshBudgets
}) => {
  const isNew = !budget?.id;
  const [name, setName] = useState(budget?.name || '');
  const [icon, setIcon] = useState(budget?.icon || 'travel');
  const [pinnedToHome, setPinnedToHome] = useState(budget?.pinnedToHome || false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSubmit = async () => {
    if (!name) return;

    let result;
    if (isNew) {
      result = await createSpecialBudget(
        name, 
        icon, 
        0,  // totalBudget 自动计算，不需要设置
        '', // startDate 不需要
        '', // endDate 不需要
        pinnedToHome
      );
    } else {
      result = await updateSpecialBudget(
        budget.id,
        name,
        icon,
        budget.totalBudget || 0,
        budget.startDate || '',
        budget.endDate || '',
        pinnedToHome
      );
    }

    if (result.success) {
      await refreshBudgets();
      window.history.back();
    } else {
      alert('保存失败: ' + result.error);
    }
  };

  const handleDelete = async () => {
    const result = await deleteSpecialBudget(budget.id);
    if (result.success) {
      await refreshBudgets();
      window.history.go(-2);
    } else {
      alert('删除失败: ' + result.error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-gray-600 mb-6 active:scale-95"
        >
          <ArrowLeft size={20} />
          返回
        </button>

        <h1 className="text-2xl font-bold text-gray-800 mb-8">
          {isNew ? '添加灵活预算' : '修改账本信息'}
        </h1>

        <div className="bg-white rounded-2xl p-6 space-y-6">
          {/* 图标选择 */}
          <div>
            <label className="block text-gray-600 mb-3">图标</label>
            <div className="flex gap-3 flex-wrap">
              {Object.entries(BUDGET_ICONS).map(([key, config]) => {
                const IconComp = config.icon;
                return (
                  <button
                    key={key}
                    onClick={() => setIcon(key)}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                      icon === key 
                        ? 'ring-2 ring-offset-2' 
                        : 'hover:scale-105'
                    }`}
                    style={{ 
                      backgroundColor: `${config.color}15`,
                      ringColor: icon === key ? config.color : 'transparent'
                    }}
                  >
                    <IconComp size={24} style={{ color: config.color }} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* 名称 */}
          <div>
            <label className="block text-gray-600 mb-2">账本名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：泰国游"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-cyan-400 focus:outline-none"
            />
          </div>

          {/* 固定到首页 */}
          <div 
            className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer"
            onClick={() => setPinnedToHome(!pinnedToHome)}
          >
            <span className="text-gray-700">在首页固定</span>
            <div className={`w-12 h-7 rounded-full transition-colors ${pinnedToHome ? 'bg-cyan-500' : 'bg-gray-300'}`}>
              <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform mt-1 ${pinnedToHome ? 'translate-x-6' : 'translate-x-1'}`} />
            </div>
          </div>

          {/* 按钮 */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSubmit}
              disabled={!name}
              className="flex-1 py-4 bg-gray-800 text-white rounded-xl font-medium disabled:bg-gray-300 active:scale-95"
            >
              确认
            </button>
            {!isNew && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-6 py-4 bg-red-500 text-white rounded-xl font-medium active:scale-95"
              >
                删除
              </button>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="删除灵活预算"
        message={`确定要删除"${name}"吗？所有子项记录也将被删除，此操作无法撤销。`}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
};

// ==================== 主组件 ====================

const BudgetBottleApp = () => {
  const [currentView, setCurrentView] = useState('home');
  const [weekInfo] = useState(getWeekInfo());
  const [viewingWeekInfo, setViewingWeekInfo] = useState(getWeekInfo());
  
  const [weeklyBudget, setWeeklyBudget] = useState(null);
  const [viewingWeekBudget, setViewingWeekBudget] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [viewingTransactions, setViewingTransactions] = useState([]);
  
  const [wishes, setWishes] = useState([]);
  const [fixedExpenses, setFixedExpenses] = useState([]);
  const [wishPoolAmount, setWishPoolAmount] = useState(0);
  
  // 专项预算相关状态
  const [specialBudgets, setSpecialBudgets] = useState([]);
  const [specialBudgetItems, setSpecialBudgetItems] = useState({});
  
  const [isLoading, setIsLoading] = useState(true);
  const [isDataReady, setIsDataReady] = useState(false);
  const [isLoadingWeek, setIsLoadingWeek] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showAddTransactionModal, setShowAddTransactionModal] = useState(false);
  
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [editingWish, setEditingWish] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);
  const [editingSpecialBudget, setEditingSpecialBudget] = useState(null);
  const [newBudgetAmount, setNewBudgetAmount] = useState('');
  
  const [newTransactionAmount, setNewTransactionAmount] = useState('');
  const [newTransactionDescription, setNewTransactionDescription] = useState('');
  
  const [debugPoolAmount, setDebugPoolAmount] = useState(null);
  const [isDebugMode, setIsDebugMode] = useState(false);
  
  const [isSavingBudget, setIsSavingBudget] = useState(false);
  const [isSavingTransaction, setIsSavingTransaction] = useState(false);
  
  const handleDebugChange = (amount) => {
    if (amount === -1) {
      setIsDebugMode(false);
      setDebugPoolAmount(null);
    } else {
      setIsDebugMode(true);
      setDebugPoolAmount(amount);
    }
  };

  useEffect(() => {
    const handlePopState = (event) => {
      if (event.state && event.state.view) {
        setCurrentView(event.state.view);
      } else {
        setCurrentView('home');
      }
      window.scrollTo(0, 0);
    };

    window.addEventListener('popstate', handlePopState);
    if (window.history.state === null) {
      window.history.replaceState({ view: 'home' }, '', window.location.href);
    }

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = useCallback((view, data = {}) => {
    setCurrentView(view);
    window.history.pushState({ view, ...data }, '', window.location.href);
    window.scrollTo(0, 0);
    
    if (data.editingTransaction) setEditingTransaction(data.editingTransaction);
    if (data.editingWish) setEditingWish(data.editingWish);
    if (data.editingExpense) setEditingExpense(data.editingExpense);
    if (data.editingSpecialBudget) setEditingSpecialBudget(data.editingSpecialBudget);
    
    if (view === 'transactionList') {
      setViewingWeekInfo(weekInfo);
      setViewingWeekBudget(weeklyBudget);
      setViewingTransactions(transactions);
    }
  }, [weekInfo, weeklyBudget, transactions]);

  const settleLastWeek = useCallback(async () => {
    const lastWeekInfo = getPreviousWeekInfo(weekInfo);
    
    const checkResult = await checkWeekSettled(lastWeekInfo.weekKey);
    if (checkResult.settled) {
      console.log('✅ 上周已结算，跳过');
      return;
    }
    
    const [budgetResult, transResult] = await Promise.all([
      getWeeklyBudget(lastWeekInfo.weekKey),
      getTransactions(lastWeekInfo.weekKey)
    ]);
    
    if (!budgetResult.success || !budgetResult.data) {
      console.log('ℹ️ 上周无预算记录，跳过结算');
      return;
    }
    
    const lastWeekBudget = budgetResult.data.amount || 0;
    const lastWeekSpent = transResult.success 
      ? transResult.data.reduce((sum, t) => sum + t.amount, 0) 
      : 0;
    const savedAmount = lastWeekBudget - lastWeekSpent;
    
    console.log(`📊 上周结算：预算 ¥${lastWeekBudget}，支出 ¥${lastWeekSpent}，节省 ¥${savedAmount}`);
    
    await createWishPoolHistory(
      lastWeekInfo.weekKey,
      lastWeekBudget,
      lastWeekSpent,
      savedAmount
    );
    
    if (savedAmount > 0) {
      const poolResult = await addToWishPool(savedAmount);
      if (poolResult.success) {
        setWishPoolAmount(poolResult.data.amount);
        console.log(`✅ 已将 ¥${savedAmount} 注入心愿池，当前余额 ¥${poolResult.data.amount}`);
      }
    }
    
    await markWeeklyBudgetSettled(lastWeekInfo.weekKey);
  }, [weekInfo]);

  const refreshSpecialBudgets = useCallback(async () => {
    const result = await getSpecialBudgets();
    if (result.success) {
      setSpecialBudgets(result.data);
    }
  }, []);

  const loadAllData = useCallback(async () => {
    setIsDataReady(false);
    
    const cached = loadFromCache();
    if (cached && cached.weekKey === weekInfo.weekKey) {
      setWeeklyBudget(cached.weeklyBudget);
      setViewingWeekBudget(cached.weeklyBudget);
      setTransactions(cached.transactions || []);
      setViewingTransactions(cached.transactions || []);
      setWishes(cached.wishes || []);
      setFixedExpenses(cached.fixedExpenses || []);
      setWishPoolAmount(cached.wishPoolAmount || 0);
      setIsLoading(false);
    }

    try {
      const [budgetResult, transResult, wishResult, expenseResult, poolResult, specialBudgetResult] = await Promise.all([
        getWeeklyBudget(weekInfo.weekKey),
        getTransactions(weekInfo.weekKey),
        getWishes(),
        getFixedExpenses(),
        getWishPool(),
        getSpecialBudgets()
      ]);

      const newData = {
        weekKey: weekInfo.weekKey,
        weeklyBudget: budgetResult.success ? budgetResult.data : null,
        transactions: transResult.success ? transResult.data : [],
        wishes: wishResult.success ? wishResult.data : [],
        fixedExpenses: expenseResult.success ? expenseResult.data : [],
        wishPoolAmount: poolResult.success ? (poolResult.data?.amount || 0) : 0
      };

      if (budgetResult.success) {
        setWeeklyBudget(budgetResult.data);
        setViewingWeekBudget(budgetResult.data);
      }
      if (transResult.success) {
        setTransactions(transResult.data);
        setViewingTransactions(transResult.data);
      }
      if (wishResult.success) setWishes(wishResult.data);
      if (expenseResult.success) setFixedExpenses(expenseResult.data);
      if (poolResult.success) setWishPoolAmount(poolResult.data?.amount || 0);
      if (specialBudgetResult.success) setSpecialBudgets(specialBudgetResult.data);

      saveToCache(newData);
      
      await settleLastWeek();
      
      setIsDataReady(true);
      
      if (budgetResult.success && !budgetResult.data) {
        setShowBudgetModal(true);
      }
      
    } catch (error) {
      console.error('加载数据失败:', error);
      setIsDataReady(true);
    } finally {
      setIsLoading(false);
    }
  }, [weekInfo.weekKey, settleLastWeek]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const loadWeekData = async (targetWeekInfo) => {
    setIsLoadingWeek(true);
    try {
      const [budgetResult, transResult] = await Promise.all([
        getWeeklyBudget(targetWeekInfo.weekKey),
        getTransactions(targetWeekInfo.weekKey)
      ]);

      if (budgetResult.success) {
        setViewingWeekBudget(budgetResult.data);
      }
      if (transResult.success) {
        setViewingTransactions(transResult.data);
      }
    } catch (error) {
      console.error('加载周数据失败:', error);
    } finally {
      setIsLoadingWeek(false);
    }
  };

  const goToPreviousWeek = () => {
    const prevWeekStart = new Date(viewingWeekInfo.weekStart);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);
    const newWeekInfo = getWeekInfo(prevWeekStart);
    setViewingWeekInfo(newWeekInfo);
    loadWeekData(newWeekInfo);
  };

  const goToNextWeek = () => {
    const nextWeekStart = new Date(viewingWeekInfo.weekStart);
    nextWeekStart.setDate(nextWeekStart.getDate() + 7);
    
    if (nextWeekStart > new Date()) return;
    
    const newWeekInfo = getWeekInfo(nextWeekStart);
    setViewingWeekInfo(newWeekInfo);
    loadWeekData(newWeekInfo);
  };

  const isCurrentWeek = viewingWeekInfo.weekKey === weekInfo.weekKey;

  const canGoNext = () => {
    const nextWeekStart = new Date(viewingWeekInfo.weekStart);
    nextWeekStart.setDate(nextWeekStart.getDate() + 7);
    return nextWeekStart <= new Date();
  };

  const weeklySpent = useMemo(() => {
    return transactions.reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const viewingWeeklySpent = useMemo(() => {
    return viewingTransactions.reduce((sum, t) => sum + t.amount, 0);
  }, [viewingTransactions]);

  const remaining = useMemo(() => {
    return (weeklyBudget?.amount || 0) - weeklySpent;
  }, [weeklyBudget, weeklySpent]);

  const viewingRemaining = useMemo(() => {
    return (viewingWeekBudget?.amount || 0) - viewingWeeklySpent;
  }, [viewingWeekBudget, viewingWeeklySpent]);

  const totalFixedExpense = useMemo(() => {
    return fixedExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [fixedExpenses]);

  const handleSetBudget = async () => {
    const amount = parseFloat(newBudgetAmount);
    if (!amount || amount <= 0) return;
    
    if (isSavingBudget) {
      console.log('⏳ 正在保存中，请稍候...');
      return;
    }
    
    if (!isDataReady) {
      console.log('⏳ 数据还在加载中，请稍候...');
      return;
    }
    
    setIsSavingBudget(true);

    try {
      const result = await saveWeeklyBudget(weekInfo.weekKey, amount);
      if (result.success) {
        setWeeklyBudget(result.data);
        setViewingWeekBudget(result.data);
        setShowBudgetModal(false);
        setNewBudgetAmount('');
        
        const cached = loadFromCache() || {};
        saveToCache({ ...cached, weeklyBudget: result.data });
      } else {
        alert('保存失败: ' + result.error);
      }
    } catch (error) {
      console.error('保存预算出错:', error);
      alert('保存失败，请重试');
    } finally {
      setIsSavingBudget(false);
    }
  };

  const handleQuickAddTransaction = async () => {
    if (!newTransactionAmount) return;
    
    if (isSavingTransaction) {
      console.log('⏳ 正在保存中，请稍候...');
      return;
    }
    
    setIsSavingTransaction(true);

    try {
      const now = new Date();
      const result = await createTransaction(
        weekInfo.weekKey,
        formatDate(now),
        `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
        parseFloat(newTransactionAmount),
        newTransactionDescription
      );

      if (result.success) {
        const newTransactions = [...transactions, result.data];
        setTransactions(newTransactions);
        setViewingTransactions([...viewingTransactions, result.data]);
        setShowAddTransactionModal(false);
        setNewTransactionAmount('');
        setNewTransactionDescription('');
        
        const cached = loadFromCache() || {};
        saveToCache({ ...cached, transactions: newTransactions });
      } else {
        alert('记录失败: ' + result.error);
      }
    } catch (error) {
      console.error('记录消费出错:', error);
      alert('记录失败，请重试');
    } finally {
      setIsSavingTransaction(false);
    }
  };

  if (isLoading) {
    return <SkeletonHome />;
  }

  const renderTransactionListView = () => {
    const groupedByDate = viewingTransactions.reduce((acc, trans) => {
      const date = trans.date;
      if (!acc[date]) acc[date] = [];
      acc[date].push(trans);
      return acc;
    }, {});

    const today = formatDate(new Date());
    const yesterday = formatDate(new Date(Date.now() - 86400000));

    const getDateLabel = (date) => {
      if (date === today) return '今天';
      if (date === yesterday) return '昨天';
      return date;
    };

    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-gray-600 mb-4 active:scale-95"
          >
            <ArrowLeft size={20} />
            返回
          </button>

          <div className="flex items-center justify-between mb-4 bg-white rounded-2xl p-3">
            <button
              onClick={goToPreviousWeek}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-full active:scale-95"
            >
              <ChevronLeft size={24} />
            </button>
            
            <div className="text-center">
              <h2 className="text-base font-bold text-gray-800">
                {viewingWeekInfo.year}年{viewingWeekInfo.month}月 第{viewingWeekInfo.weekNumber}周
              </h2>
              <p className="text-xs text-gray-400">
                {formatShortDate(viewingWeekInfo.weekStart)} - {formatShortDate(viewingWeekInfo.weekEnd)}
              </p>
              {!isCurrentWeek && (
                <span className="text-xs text-blue-500">历史周</span>
              )}
            </div>
            
            <button
              onClick={goToNextWeek}
              disabled={!canGoNext()}
              className={`p-2 rounded-full active:scale-95 ${
                canGoNext() ? 'text-gray-600 hover:bg-gray-100' : 'text-gray-300'
              }`}
            >
              <ChevronRight size={24} />
            </button>
          </div>

          <div className="bg-white rounded-2xl p-4 mb-6">
            {isLoadingWeek ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-800"></div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1">预算</p>
                  <div className="flex items-center gap-1">
                    <span className="text-lg font-bold text-gray-800">
                      ¥{viewingWeekBudget?.amount?.toLocaleString() || 0}
                    </span>
                    {isCurrentWeek && (
                      <button
                        onClick={() => setShowBudgetModal(true)}
                        className="p-1 text-gray-400 hover:text-gray-600 active:scale-95"
                      >
                        <Edit size={14} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex-1 text-center">
                  <p className="text-xs text-gray-500 mb-1">支出</p>
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-lg font-bold text-red-500">
                      ¥{viewingWeeklySpent.toLocaleString()}
                    </span>
                    {isCurrentWeek && (
                      <button
                        onClick={() => navigateTo('addTransaction')}
                        className="p-1 text-gray-400 hover:text-gray-600 active:scale-95"
                      >
                        <Plus size={14} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex-1 text-right">
                  <p className="text-xs text-gray-500 mb-1">剩余</p>
                  <span className={`text-lg font-bold ${viewingRemaining >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    ¥{viewingRemaining.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>

          {isLoadingWeek ? (
            <div className="bg-white rounded-2xl p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800 mx-auto"></div>
              <p className="text-gray-400 mt-4">加载中...</p>
            </div>
          ) : Object.keys(groupedByDate).length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center">
              <p className="text-gray-400">暂无消费记录</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a)).map(date => (
                <div key={date}>
                  <h3 className="text-sm text-gray-500 mb-2">{getDateLabel(date)}</h3>
                  <div className="space-y-2">
                    {groupedByDate[date].map(trans => (
                      <div 
                        key={trans.id} 
                        className="bg-white rounded-xl p-4 flex justify-between items-center"
                      >
                        <span className="text-gray-800">{trans.description || '消费'}</span>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-red-500">-¥{trans.amount}</span>
                          {isCurrentWeek && (
                            <button
                              onClick={() => navigateTo('editTransaction', { editingTransaction: trans })}
                              className="text-gray-400 active:scale-95"
                            >
                              <Edit size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {showBudgetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-2xl p-6 mx-4 w-full max-w-sm">
              <h2 className="text-xl font-bold text-gray-800 mb-2">本周预算</h2>
              <p className="text-sm text-gray-500 mb-4">
                {weekInfo.year}年{weekInfo.month}月 第{weekInfo.weekNumber}周
              </p>
              
              <div className="relative mb-4">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-gray-400">¥</span>
                <input
                  type="number"
                  value={newBudgetAmount}
                  onChange={(e) => setNewBudgetAmount(e.target.value)}
                  placeholder={weeklyBudget?.amount?.toString() || '600'}
                  className="w-full pl-10 pr-4 py-4 border-2 border-gray-200 rounded-xl text-xl font-bold focus:border-gray-400 focus:outline-none"
                  autoFocus
                  disabled={isSavingBudget}
                />
              </div>
              
              <p className="text-xs text-gray-400 mb-6 text-center">
                本周余额将自动流入心愿池
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowBudgetModal(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium active:scale-95 transition-transform"
                  disabled={isSavingBudget}
                >
                  取消
                </button>
                <button
                  onClick={handleSetBudget}
                  disabled={isSavingBudget || !isDataReady}
                  className="flex-1 py-3 bg-gray-800 text-white rounded-xl font-medium active:scale-95 transition-transform disabled:bg-gray-400"
                >
                  {isSavingBudget ? '保存中...' : '确认'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderFixedExpensesView = () => {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-gray-600 mb-6 active:scale-95"
          >
            <ArrowLeft size={20} />
            返回
          </button>

          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">固定支出</h1>
              <p className="text-gray-500">每月合计支出 ¥{totalFixedExpense.toLocaleString()}</p>
            </div>
            <button
              onClick={() => navigateTo('editExpense', { editingExpense: { id: null } })}
              className="bg-gray-800 text-white p-3 rounded-full active:scale-95"
            >
              <Plus size={20} />
            </button>
          </div>

          {fixedExpenses.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center">
              <FileText size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-400">暂无固定支出</p>
              <button
                onClick={() => navigateTo('editExpense', { editingExpense: { id: null } })}
                className="mt-4 px-6 py-2 bg-gray-800 text-white rounded-xl active:scale-95"
              >
                添加
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {fixedExpenses.map(expense => (
                <div 
                  key={expense.id}
                  className="bg-white rounded-xl p-4 flex justify-between items-center"
                  onClick={() => navigateTo('editExpense', { editingExpense: expense })}
                >
                  <div>
                    <span className="text-gray-800">{expense.name}</span>
                    {expense.expireDate && (
                      <p className="text-xs text-gray-400">{expense.expireDate}到期</p>
                    )}
                  </div>
                  <span className="font-semibold">¥{expense.amount}/月</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderHomeView = () => (
    <>
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        
        .straw-group:hover {
          opacity: 0.8;
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        .float-animation {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
      
      <div className="min-h-screen bg-white flex flex-col">
        {/* 左上角侧边栏 */}
        <HomeSidebar
          fixedExpenses={fixedExpenses}
          specialBudgets={specialBudgets}
          onFixedExpensesClick={() => navigateTo('budgetList')}
          onSpecialBudgetClick={(budget) => navigateTo('specialBudgetDetail', { editingSpecialBudget: budget })}
          onBudgetListClick={() => navigateTo('budgetList')}
        />

        <div className="pt-16 pb-0 text-center">
          <h1 className="text-xl font-bold text-gray-800">
            {weekInfo.month}月 第{weekInfo.weekNumber}周
          </h1>
          <p className="text-base text-[#A7ADB4] font-medium mt-1 flex items-center justify-center">
            预算 ¥{weeklyBudget?.amount?.toLocaleString() || 0}，已用 ¥{weeklySpent.toLocaleString()}
          </p>
        </div>

        <div className="flex-1 pt-8 pb-4 flex flex-col items-center justify-start px-6">
          <div className="float-animation">
            <RabbitBottle
              remaining={remaining}
              total={weeklyBudget?.amount || 0}
              spent={weeklySpent}
              onStrawClick={() => setShowAddTransactionModal(true)}
              onBodyClick={() => navigateTo('transactionList')}
            />
          </div>
        </div>
        
        <WishPoolBar
          poolAmount={isDebugMode ? debugPoolAmount : wishPoolAmount}
          wishes={wishes}
          onAddClick={() => navigateTo('editWish', { editingWish: { id: null } })}
          onWishClick={(wish) => navigateTo('editWish', { editingWish: wish })}
          onPoolClick={() => navigateTo('wishPoolHistory')}
          debugMode={isDebugMode}
          onDebugChange={handleDebugChange}
        />
      </div>
      
      {showBudgetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl p-6 mx-4 w-full max-w-sm">
            <h2 className="text-xl font-bold text-gray-800 mb-2">本周预算</h2>
            <p className="text-sm text-gray-500 mb-4">
              {weekInfo.year}年{weekInfo.month}月 第{weekInfo.weekNumber}周
            </p>
            
            <div className="relative mb-4">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-gray-400">¥</span>
              <input
                type="number"
                value={newBudgetAmount}
                onChange={(e) => setNewBudgetAmount(e.target.value)}
                placeholder={weeklyBudget?.amount?.toString() || '600'}
                className="w-full pl-10 pr-4 py-4 border-2 border-gray-200 rounded-xl text-xl font-bold focus:border-gray-400 focus:outline-none"
                autoFocus
                disabled={isSavingBudget}
              />
            </div>
            
            <p className="text-xs text-gray-400 mb-6 text-center">
              本周余额将自动流入心愿池
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowBudgetModal(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium active:scale-95 transition-transform"
                disabled={isSavingBudget}
              >
                取消
              </button>
              <button
                onClick={handleSetBudget}
                disabled={isSavingBudget || !isDataReady}
                className="flex-1 py-3 bg-gray-800 text-white rounded-xl font-medium active:scale-95 transition-transform disabled:bg-gray-400"
              >
                {isSavingBudget ? '保存中...' : (isDataReady ? '确认' : '加载中...')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddTransactionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl p-6 mx-4 w-full max-w-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">记录消费</h2>
              <button 
                onClick={() => {
                  setShowAddTransactionModal(false);
                  setNewTransactionAmount('');
                  setNewTransactionDescription('');
                }}
                className="text-gray-400"
                disabled={isSavingTransaction}
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-600 mb-2">金额</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-gray-400">¥</span>
                  <input
                    type="number"
                    value={newTransactionAmount}
                    onChange={(e) => setNewTransactionAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-10 pr-4 py-4 border-2 border-gray-200 rounded-xl text-xl font-bold focus:border-gray-400 focus:outline-none"
                    autoFocus
                    disabled={isSavingTransaction}
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-600 mb-2">备注（可选）</label>
                <input
                  type="text"
                  value={newTransactionDescription}
                  onChange={(e) => setNewTransactionDescription(e.target.value)}
                  placeholder="例如：超市、外卖..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-gray-400 focus:outline-none"
                  disabled={isSavingTransaction}
                />
              </div>

              <button
                onClick={handleQuickAddTransaction}
                disabled={!newTransactionAmount || isSavingTransaction}
                className="w-full py-4 bg-gray-800 text-white rounded-xl font-medium disabled:bg-gray-300 active:scale-95 transition-transform"
              >
                {isSavingTransaction ? '保存中...' : '记录'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  const renderCurrentView = () => {
    switch (currentView) {
      case 'home':
        return renderHomeView();
      case 'transactionList':
        return renderTransactionListView();
      case 'addTransaction':
        return (
          <AddTransactionView 
            weekInfo={weekInfo}
            transactions={transactions}
            setTransactions={setTransactions}
            viewingTransactions={viewingTransactions}
            setViewingTransactions={setViewingTransactions}
          />
        );
      case 'editTransaction':
        return (
          <EditTransactionView 
            key={editingTransaction?.id}
            editingTransaction={editingTransaction}
            weekInfo={weekInfo}
            transactions={transactions}
            setTransactions={setTransactions}
            viewingTransactions={viewingTransactions}
            setViewingTransactions={setViewingTransactions}
          />
        );
      case 'fixedExpenses':
        return renderFixedExpensesView();
      case 'editExpense':
        return (
          <EditExpenseView 
            key={editingExpense?.id || 'new'}
            editingExpense={editingExpense}
            fixedExpenses={fixedExpenses}
            setFixedExpenses={setFixedExpenses}
          />
        );
      case 'editWish':
        return (
          <EditWishView 
            key={editingWish?.id || 'new'}
            editingWish={editingWish}
            wishes={wishes}
            setWishes={setWishes}
            wishPoolAmount={wishPoolAmount}
            setWishPoolAmount={setWishPoolAmount}
          />
        );
      case 'wishPoolHistory':
        return (
          <WishPoolHistoryView 
            wishPoolAmount={wishPoolAmount}
          />
        );
      case 'budgetList':
        return (
          <BudgetListView
            fixedExpenses={fixedExpenses}
            specialBudgets={specialBudgets}
            specialBudgetItems={specialBudgetItems}
            setFixedExpenses={setFixedExpenses}
            setSpecialBudgets={setSpecialBudgets}
            navigateTo={navigateTo}
          />
        );
      case 'specialBudgetDetail':
        return (
          <SpecialBudgetDetailView
            key={editingSpecialBudget?.id}
            budget={editingSpecialBudget}
            items={specialBudgetItems[editingSpecialBudget?.id] || []}
            setItems={setSpecialBudgetItems}
            navigateTo={navigateTo}
            refreshBudgets={refreshSpecialBudgets}
          />
        );
      case 'editSpecialBudget':
        return (
          <EditSpecialBudgetView
            key={editingSpecialBudget?.id || 'new'}
            budget={editingSpecialBudget}
            specialBudgets={specialBudgets}
            setSpecialBudgets={setSpecialBudgets}
            refreshBudgets={refreshSpecialBudgets}
          />
        );
      default:
        return renderHomeView();
    }
  };

  return (
    <div className="font-sans">
      {renderCurrentView()}
    </div>
  );
};

export default BudgetBottleApp;