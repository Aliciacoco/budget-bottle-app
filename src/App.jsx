import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Settings, ArrowLeft, X, Heart, Calendar, Edit, Trash2, ChevronLeft, ChevronRight, FileText, PiggyBank, History, Info } from 'lucide-react';
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
  checkWeekSettled
} from './api.js';

// ==================== 本地缓存工具函数 ====================
const CACHE_KEY = 'budget_bottle_cache';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5分钟过期

const saveToCache = (data) => {
  try {
    // 不保存图片数据，避免超出localStorage配额
    const cacheData = {
      ...data,
      wishes: data.wishes?.map(w => ({ ...w, image: null })) || [],
      timestamp: Date.now()
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch (e) {
    // 如果还是超出配额，清空缓存后重试
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
    // 检查是否过期
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

// 瓶子组件 - 使用自定义 SVG
const RabbitBottle = ({ remaining, total, spent, onStrawClick, onBodyClick }) => {
  
  const percentage = total > 0 ? (remaining / total) * 100 : 0;
  const fillHeight = Math.max(0, Math.min(100, percentage));
  
  const bodyBottom = 403;
  const bodyHeight = 320;
  const bodyTop = bodyBottom - bodyHeight; 
  const fillY = bodyTop + (bodyHeight * (1 - fillHeight / 100));
  const fillRectHeight = bodyHeight * fillHeight / 100;

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
        
        <rect
          x="74"
          y={fillY}
          width="252"
          height={fillRectHeight + 5}
          fill="#00C3E0"
          clipPath="url(#cupBodyClip)"
          onClick={onBodyClick}
          style={{ cursor: 'pointer' }}
        />
        
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
    </div>
  );
};

// ==================== 优化后的心愿池组件（带波浪动画）====================
const WishPoolBar = ({ poolAmount, wishes, onAddClick, onWishClick, onPoolClick, maxPoolAmount = 5000, debugMode = false, onDebugChange }) => {
  // 最大液体高度500px，最小容器高度180px
  const MAX_LIQUID_HEIGHT = 500;
  const MIN_CONTAINER_HEIGHT = 130;
  const SEABED_HEIGHT = 40; // 海底固定高度
  const HEADER_HEIGHT = 50; // 顶部文案区域高度
  const WISH_BALL_SIZE = 48; // 心愿球直径
  
  // 计算液体高度
  const liquidHeight = Math.min(MAX_LIQUID_HEIGHT, (poolAmount / maxPoolAmount) * MAX_LIQUID_HEIGHT);
  const hasBalance = poolAmount > 0;
  
  // SVG容器高度 = 液体高度 + 海底高度，但至少要有基础高度
  const svgHeight = Math.max(MIN_CONTAINER_HEIGHT, liquidHeight + SEABED_HEIGHT);
  
  // 整个组件高度
  const totalHeight = HEADER_HEIGHT + svgHeight;
  
  // 在SVG坐标系中的位置
  const seabedTop = svgHeight - SEABED_HEIGHT; // 海底顶部
  const liquidTop = hasBalance ? (svgHeight - SEABED_HEIGHT - liquidHeight) : seabedTop; // 液体顶部
  const liquidBottom = seabedTop; // 液体底部紧贴海底
  
  // 心愿球位置计算（像素值，相对于SVG容器顶部）
  // 有余额：心愿球100%沉在水中，顶部与液面平齐
  // 无余额：心愿球紧贴海底上方，无间隙
  const wishBallTop = hasBalance 
    ? liquidTop + 5 // 100%沉在水中，顶部在液面稍下方
    : seabedTop - WISH_BALL_SIZE; // 紧贴海底上方，无间隙
  
  // 关闭调试模式
  const closeDebugMode = () => {
    if (debugMode) {
      onDebugChange?.(-1);
    }
  };
  
  return (
    <div className="relative" style={{ height: `${totalHeight}px` }}>
      {/* 调试模式遮罩层 - 点击关闭 */}
      {debugMode && (
        <div 
          className="fixed inset-0 z-[5]" 
          onClick={closeDebugMode}
        />
      )}
      
      {/* 调试控制面板 */}
      {debugMode && (
        <div 
          className="absolute top-0 right-2 z-10 bg-black bg-opacity-70 text-white text-xs p-2 rounded"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-1">调试模式 (液体高度: {Math.round(liquidHeight)}px)</div>
          <div className="flex gap-1 flex-wrap">
            <button 
              onClick={() => onDebugChange?.(0)}
              className="px-2 py-1 bg-gray-600 rounded hover:bg-gray-500"
            >
              ¥0
            </button>
            <button 
              onClick={() => onDebugChange?.(500)}
              className="px-2 py-1 bg-gray-600 rounded hover:bg-gray-500"
            >
              ¥500
            </button>
            <button 
              onClick={() => onDebugChange?.(1000)}
              className="px-2 py-1 bg-gray-600 rounded hover:bg-gray-500"
            >
              ¥1000
            </button>
            <button 
              onClick={() => onDebugChange?.(2500)}
              className="px-2 py-1 bg-gray-600 rounded hover:bg-gray-500"
            >
              ¥2500
            </button>
            <button 
              onClick={() => onDebugChange?.(5000)}
              className="px-2 py-1 bg-gray-600 rounded hover:bg-gray-500"
            >
              ¥5000
            </button>
            <button 
              onClick={() => onDebugChange?.(10000)}
              className="px-2 py-1 bg-gray-600 rounded hover:bg-gray-500"
            >
              ¥10000
            </button>
          </div>
        </div>
      )}
      
      {/* 文案放在波浪上方 - 可点击 */}
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
        {/* 点击切换调试模式的小按钮 */}
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
      
      {/* 心愿池容器 */}
      <div className="relative w-full" style={{ height: `${svgHeight}px` }}>
        <svg 
          viewBox={`0 0 400 ${svgHeight}`}
          className="w-full h-full" 
          preserveAspectRatio="none"
        >
          <defs>
            {/* 蓝色液体渐变 */}
            <linearGradient id="liquidGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#00C3E0" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#00C3E0" stopOpacity="0.95" />
            </linearGradient>
            {/* 海底渐变 */}
            <linearGradient id="seabedGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#574262" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#3d2d45" stopOpacity="1" />
            </linearGradient>
          </defs>
          
          {/* 有余额时显示蓝色液体主体 */}
          {hasBalance && (
            <>
              {/* 液体主体 */}
              <rect
                x="0"
                y={liquidTop + 12}
                width="400"
                height={liquidHeight}
                fill="url(#liquidGradient)"
              />
              
              {/* 波浪动画层 - 第一层波浪 */}
              <path
                className="wave-animation-1"
                d={`M0 ${liquidTop + 10} 
                    Q50 ${liquidTop + 5} 100 ${liquidTop + 12}
                    T200 ${liquidTop + 8}
                    T300 ${liquidTop + 14}
                    T400 ${liquidTop + 10}
                    L400 ${liquidTop + 20} L0 ${liquidTop + 20} Z`}
                fill="#00C3E0"
                fillOpacity="0.9"
              />
              
              {/* 波浪动画层 - 第二层波浪（半透明叠加） */}
              <path
                className="wave-animation-2"
                d={`M0 ${liquidTop + 8} 
                    Q60 ${liquidTop + 14} 120 ${liquidTop + 6}
                    T240 ${liquidTop + 12}
                    T360 ${liquidTop + 8}
                    T400 ${liquidTop + 10}
                    L400 ${liquidTop + 18} L0 ${liquidTop + 18} Z`}
                fill="#00D4F0"
                fillOpacity="0.5"
              />
              
              {/* 高光波浪 */}
              <path
                className="wave-animation-3"
                d={`M0 ${liquidTop + 12} 
                    Q80 ${liquidTop + 8} 160 ${liquidTop + 14}
                    T320 ${liquidTop + 10}
                    T400 ${liquidTop + 12}`}
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="2"
                fill="none"
              />
            </>
          )}
          
          {/* 海底 - 始终显示，波浪形状 */}
          <path
            d={`M0 ${seabedTop} 
                Q50 ${seabedTop - 5} 100 ${seabedTop + 3}
                T200 ${seabedTop}
                T300 ${seabedTop + 3}
                T400 ${seabedTop - 2}
                L400 ${svgHeight} L0 ${svgHeight} Z`}
            fill="url(#seabedGradient)"
          />
        </svg>
        
        {/* 心愿球列表 - 浮在水面或落在海底 */}
        <div 
          className="absolute left-0 right-0 transition-all duration-300 px-4"
          style={{ top: `${wishBallTop}px` }}
        >
          {/* 使用flex-wrap让心愿球换行 */}
          <div className="flex flex-wrap gap-3 justify-center">
            {/* 添加按钮始终在首位 */}
            <div 
              className={`w-12 h-12 rounded-full flex items-center justify-center cursor-pointer active:scale-95 shadow-lg transition-all ${
                hasBalance 
                  ? 'bg-white bg-opacity-40 hover:bg-opacity-50' 
                  : 'bg-[#8b7a94] bg-opacity-60 hover:bg-opacity-70'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                onAddClick && onAddClick();
              }}
            >
              <Plus size={22} className="text-white" />
            </div>
            
            {/* 心愿列表 */}
            {wishes.map((wish, index) => (
              <div 
                key={wish.id || index}
                className={`w-12 h-12 rounded-full flex items-center justify-center overflow-hidden cursor-pointer active:scale-95 hover:ring-2 hover:ring-white shadow-lg transition-all ${
                  hasBalance 
                    ? 'bg-white bg-opacity-30' 
                    : 'bg-[#8b7a94] bg-opacity-50'
                }`}
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
              </div>
            ))}
          </div>
          {wishes.length > 0 && (
            <p className="text-center text-white text-opacity-70 text-xs mt-2">
              点击心愿可编辑
            </p>
          )}
        </div>
      </div>
      
      {/* 波浪动画样式 */}
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
        .wave-animation-1 {
          animation: wave1 3s ease-in-out infinite;
        }
        .wave-animation-2 {
          animation: wave2 2.5s ease-in-out infinite;
        }
        .wave-animation-3 {
          animation: wave3 4s ease-in-out infinite;
        }
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
      // 同步更新viewingTransactions
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
      // 同步更新viewingTransactions
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
      // 同步更新viewingTransactions
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

// 编辑心愿视图
const EditWishView = ({ editingWish, wishes, setWishes, wishPoolAmount, setWishPoolAmount }) => {
  const isNew = !editingWish?.id;
  const [description, setDescription] = useState(editingWish?.description || '');
  const [amount, setAmount] = useState(editingWish?.amount?.toString() || '');
  const [image, setImage] = useState(editingWish?.image || null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPurchaseConfirm, setShowPurchaseConfirm] = useState(false);

  const handleSubmit = async () => {
    if (!description || !amount) return;

    let result;
    if (isNew) {
      result = await createWish(description, parseFloat(amount), image);
    } else {
      result = await updateWish(editingWish.id, description, parseFloat(amount), image);
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
    await deleteWish(editingWish.id);
    setWishes(wishes.filter(w => w.id !== editingWish.id));
    window.history.back();
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const canPurchase = !isNew && wishPoolAmount >= parseFloat(amount || 0);

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
              确定用心愿池资金 ¥{amount} 购买"{description}"吗？
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

  // 计算总积攒金额
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

        {/* 积攒规则卡片 */}
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

        {/* 统计卡片 */}
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

        {/* 历史记录列表 */}
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
  
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingWeek, setIsLoadingWeek] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showAddTransactionModal, setShowAddTransactionModal] = useState(false);
  
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [editingWish, setEditingWish] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);
  const [newBudgetAmount, setNewBudgetAmount] = useState('');
  
  const [newTransactionAmount, setNewTransactionAmount] = useState('');
  const [newTransactionDescription, setNewTransactionDescription] = useState('');
  
  // 调试模式
  const [debugPoolAmount, setDebugPoolAmount] = useState(null);
  const [isDebugMode, setIsDebugMode] = useState(false);
  
  // 处理调试模式切换
  const handleDebugChange = (amount) => {
    if (amount === -1) {
      // 关闭调试模式
      setIsDebugMode(false);
      setDebugPoolAmount(null);
    } else {
      setIsDebugMode(true);
      setDebugPoolAmount(amount);
    }
  };

  // 浏览器返回支持
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

  // 导航函数
  const navigateTo = useCallback((view, data = {}) => {
    setCurrentView(view);
    window.history.pushState({ view, ...data }, '', window.location.href);
    window.scrollTo(0, 0);
    
    if (data.editingTransaction) setEditingTransaction(data.editingTransaction);
    if (data.editingWish) setEditingWish(data.editingWish);
    if (data.editingExpense) setEditingExpense(data.editingExpense);
    
    if (view === 'transactionList') {
      setViewingWeekInfo(weekInfo);
      setViewingWeekBudget(weeklyBudget);
      setViewingTransactions(transactions);
    }
  }, [weekInfo, weeklyBudget, transactions]);

  // ==================== 周结算逻辑 ====================
  const settleLastWeek = useCallback(async () => {
    // 获取上周信息
    const lastWeekInfo = getPreviousWeekInfo(weekInfo);
    
    // 检查上周是否已结算
    const checkResult = await checkWeekSettled(lastWeekInfo.weekKey);
    if (checkResult.settled) {
      console.log('✅ 上周已结算，跳过');
      return;
    }
    
    // 获取上周预算和交易
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
    
    // 创建结算历史记录
    await createWishPoolHistory(
      lastWeekInfo.weekKey,
      lastWeekBudget,
      lastWeekSpent,
      savedAmount
    );
    
    // 如果有节省，添加到心愿池
    if (savedAmount > 0) {
      const poolResult = await addToWishPool(savedAmount);
      if (poolResult.success) {
        setWishPoolAmount(poolResult.data.amount);
        console.log(`✅ 已将 ¥${savedAmount} 注入心愿池，当前余额 ¥${poolResult.data.amount}`);
      }
    }
    
    // 标记上周预算已结算
    await markWeeklyBudgetSettled(lastWeekInfo.weekKey);
  }, [weekInfo]);

  // 优化的数据加载：先显示缓存，再后台刷新
  const loadAllData = useCallback(async () => {
    // 1. 先尝试从缓存加载
    const cached = loadFromCache();
    if (cached && cached.weekKey === weekInfo.weekKey) {
      // 立即显示缓存数据
      setWeeklyBudget(cached.weeklyBudget);
      setViewingWeekBudget(cached.weeklyBudget);
      setTransactions(cached.transactions || []);
      setViewingTransactions(cached.transactions || []);
      setWishes(cached.wishes || []);
      setFixedExpenses(cached.fixedExpenses || []);
      setWishPoolAmount(cached.wishPoolAmount || 0);
      setIsLoading(false);
      
      // 如果没有预算，显示设置弹窗
      if (!cached.weeklyBudget) {
        setShowBudgetModal(true);
      }
    }

    // 2. 后台请求最新数据
    try {
      const [budgetResult, transResult, wishResult, expenseResult, poolResult] = await Promise.all([
        getWeeklyBudget(weekInfo.weekKey),
        getTransactions(weekInfo.weekKey),
        getWishes(),
        getFixedExpenses(),
        getWishPool()
      ]);

      const newData = {
        weekKey: weekInfo.weekKey,
        weeklyBudget: budgetResult.success ? budgetResult.data : null,
        transactions: transResult.success ? transResult.data : [],
        wishes: wishResult.success ? wishResult.data : [],
        fixedExpenses: expenseResult.success ? expenseResult.data : [],
        wishPoolAmount: poolResult.success ? (poolResult.data?.amount || 0) : 0
      };

      // 更新状态
      if (budgetResult.success) {
        setWeeklyBudget(budgetResult.data);
        setViewingWeekBudget(budgetResult.data);
        if (!budgetResult.data && !cached?.weeklyBudget) {
          setShowBudgetModal(true);
        }
      }
      if (transResult.success) {
        setTransactions(transResult.data);
        setViewingTransactions(transResult.data);
      }
      if (wishResult.success) setWishes(wishResult.data);
      if (expenseResult.success) setFixedExpenses(expenseResult.data);
      if (poolResult.success) setWishPoolAmount(poolResult.data?.amount || 0);

      // 保存到缓存
      saveToCache(newData);
      
      // 3. 检查并执行上周结算
      await settleLastWeek();
      
    } catch (error) {
      console.error('加载数据失败:', error);
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

    const result = await saveWeeklyBudget(weekInfo.weekKey, amount);
    if (result.success) {
      setWeeklyBudget(result.data);
      setViewingWeekBudget(result.data);
      setShowBudgetModal(false);
      setNewBudgetAmount('');
      
      // 更新缓存
      const cached = loadFromCache() || {};
      saveToCache({ ...cached, weeklyBudget: result.data });
    } else {
      alert('保存失败: ' + result.error);
    }
  };

  const handleQuickAddTransaction = async () => {
    if (!newTransactionAmount) return;

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
      
      // 更新缓存
      const cached = loadFromCache() || {};
      saveToCache({ ...cached, transactions: newTransactions });
    } else {
      alert('记录失败: ' + result.error);
    }
  };

  // 如果有缓存数据，不显示骨架屏
  if (isLoading) {
    return <SkeletonHome />;
  }

  // 消费记录列表视图
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

          {/* 周切换器 */}
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

          {/* 预算信息卡片 */}
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

          {/* 消费记录列表 */}
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

        {/* 预算编辑模态框 */}
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
                />
              </div>
              
              <p className="text-xs text-gray-400 mb-6 text-center">
                本周余额将自动流入心愿池
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowBudgetModal(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium active:scale-95 transition-transform"
                >
                  取消
                </button>
                <button
                  onClick={handleSetBudget}
                  className="flex-1 py-3 bg-gray-800 text-white rounded-xl font-medium active:scale-95 transition-transform"
                >
                  确认
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // 固定支出列表视图
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

  // 首页视图
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
        <div className="absolute top-4 left-5 z-20">
          <button
            onClick={() => navigateTo('fixedExpenses')}
          >
            <img src="/icons/fixedExpenses.svg" alt="Custom Icon" className="w-10 h-10" />
          </button>
        </div>

        <div className="pt-16 pb-0 text-center">
          <h1 className="text-xl font-bold text-gray-800">
            {weekInfo.year}年{weekInfo.month}月 第{weekInfo.weekNumber}周
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
              />
            </div>
            
            <p className="text-xs text-gray-400 mb-6 text-center">
              本周余额将自动流入心愿池
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowBudgetModal(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium active:scale-95 transition-transform"
              >
                取消
              </button>
              <button
                onClick={handleSetBudget}
                className="flex-1 py-3 bg-gray-800 text-white rounded-xl font-medium active:scale-95 transition-transform"
              >
                确认
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
                />
              </div>

              <button
                onClick={handleQuickAddTransaction}
                disabled={!newTransactionAmount}
                className="w-full py-4 bg-gray-800 text-white rounded-xl font-medium disabled:bg-gray-300 active:scale-95 transition-transform"
              >
                记录
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