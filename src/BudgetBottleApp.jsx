// BudgetBottleApp.jsx - 主应用文件
// 优化：修复白屏加载问题，使用设计系统组件
// 修复：设置预算默认使用上周预算、心愿池动画数字、返回导航问题

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronRight, Droplets, RefreshCw, WifiOff } from 'lucide-react';

// 组件导入
import BudgetCloud, { CLOUD_COLOR } from './components/BudgetCloud';
import WishPoolBar from './components/WishPoolBar';
import DraggableBudgetIcons from './components/DraggableBudgetIcons';
import Calculator from './components/CalculatorModal';

// 设计系统组件导入
import { 
  PageContainer, 
  DuoButton, 
  colors 
} from './components/design-system';

// 动画组件导入
import { 
  RainEffect,
  SettlementResultModal,
  CelebrationAnimation
} from './components/animations';

// 视图导入
import TransactionListView from './views/TransactionListView';
import WishPoolDetailView from './views/WishPoolDetailView';
import EditWishView from './views/EditWishView';
import EditTransactionView from './views/EditTransactionView';
import EditFixedExpenseView from './views/EditFixedExpenseView';
import FixedExpenseListView from './views/FixedExpenseListView';
import SpecialBudgetDetailView from './views/SpecialBudgetDetailView';
import EditSpecialBudgetView from './views/EditSpecialBudgetView';
import EditSpecialBudgetItemView from './views/EditSpecialBudgetItemView';
import SpecialBudgetTimelineView from './views/SpecialBudgetTimelineView';
import BrandMenuView from './views/BrandMenuView';
import SpendingOverviewView from './views/SpendingOverviewView';

// API 和工具函数导入
import { 
  getWeeklyBudget, 
  getTransactions, 
  createTransaction,
  getWishPool, 
  getWishes,
  getSpecialBudgets,
  getSpecialBudgetItems,
  getFixedExpenses,
  checkWeekSettled,
  createWishPoolHistory
} from './apiSelector';
import { 
  loadFromCache, 
  saveToCache, 
  getWeekInfo, 
  formatDate,
  parseWeekKeyToISO
} from './utils/helpers';

// ===== 加载失败提示组件（使用设计系统） =====
const LoadingErrorView = ({ error, onRetry }) => (
  <PageContainer>
    <div className="min-h-screen flex items-center justify-center px-[30px]">
      <div className="bg-[#F9F9F9] rounded-[20px] p-8 w-full max-w-sm text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
          <WifiOff size={32} className="text-red-400" />
        </div>
        <h2 className="text-xl font-extrabold text-gray-700 mb-2">加载失败</h2>
        <p className="text-gray-400 font-medium mb-6 text-sm">
          {error || '网络连接异常，请检查网络后重试'}
        </p>
        <DuoButton 
          onClick={onRetry} 
          variant="primary" 
          fullWidth 
          icon={RefreshCw}
        >
          重新加载
        </DuoButton>
      </div>
    </div>
  </PageContainer>
);

// ===== 全屏加载组件（使用设计系统） =====
const FullScreenLoader = ({ message = '正在连接服务器...' }) => (
  <PageContainer>
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="text-center w-full px-12">
        {/* 进度条 */}
        <div className="w-full max-w-[200px] mx-auto mb-4">
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full"
              style={{
                backgroundColor: colors.primary,
                animation: 'loading-progress 1.5s ease-in-out infinite'
              }}
            />
          </div>
        </div>
        
        <p className="text-gray-400 font-medium text-sm">{message}</p>
      </div>
      
      <style>{`
        @keyframes loading-progress {
          0% { width: 0%; margin-left: 0%; }
          50% { width: 60%; margin-left: 20%; }
          100% { width: 0%; margin-left: 100%; }
        }
      `}</style>
    </div>
  </PageContainer>
);

// ===== 结算确认弹窗组件 =====
const SettlementConfirmModal = ({ 
  isOpen, 
  weekLabel, 
  savedAmount, 
  onConfirm, 
  onSkip 
}) => {
  if (!isOpen) return null;
  
  const isPositive = savedAmount > 0;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6">
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl">
        <div className="pt-8 pb-4 flex justify-center">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
            isPositive ? 'bg-cyan-100' : 'bg-gray-100'
          }`}>
            <Droplets size={40} className={isPositive ? 'text-cyan-500' : 'text-gray-400'} />
          </div>
        </div>
        
        <div className="px-6 pb-6 text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            {weekLabel} 结算
          </h2>
          
          {isPositive ? (
            <>
              <p className="text-gray-500 mb-4">上周你节省了</p>
              <p className="text-4xl font-extrabold text-cyan-500 mb-4 font-rounded">
                ¥{savedAmount.toLocaleString()}
              </p>
              <p className="text-gray-500 text-sm">是否存入心愿池？</p>
            </>
          ) : (
            <>
              <p className="text-gray-500 mb-4">上周预算已用完</p>
              <p className="text-2xl font-bold text-gray-400 mb-4">没有余额可存入</p>
            </>
          )}
        </div>
        
        <div className="px-6 pb-8 space-y-3">
          {isPositive ? (
            <>
              <DuoButton onClick={onConfirm} variant="primary" fullWidth>
                存入心愿池
              </DuoButton>
              <DuoButton onClick={onSkip} variant="secondary" fullWidth>
                暂不存入
              </DuoButton>
            </>
          ) : (
            <DuoButton onClick={onSkip} variant="secondary" fullWidth>
              知道了
            </DuoButton>
          )}
        </div>
      </div>
    </div>
  );
};

// ===== 结算倒计时 Hook =====
const useSettlementCountdown = (weekInfo) => {
  const [timeLeft, setTimeLeft] = useState({ 
    hours: 0, minutes: 0, seconds: 0, 
    totalSeconds: 0, isCountdownActive: false 
  });
  
  useEffect(() => {
    if (!weekInfo?.weekEnd) return;
    
    const calculateTimeLeft = () => {
      const now = new Date();
      const diff = weekInfo.weekEnd.getTime() - now.getTime();
      
      if (diff <= 0) {
        return { hours: 0, minutes: 0, seconds: 0, totalSeconds: 0, isCountdownActive: false };
      }
      
      const totalSeconds = Math.floor(diff / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      
      const SIX_HOURS = 6 * 60 * 60;
      const isCountdownActive = totalSeconds <= SIX_HOURS;
      
      return { hours, minutes, seconds, totalSeconds, isCountdownActive };
    };
    
    setTimeLeft(calculateTimeLeft());
    
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);
      
      if (newTimeLeft.totalSeconds <= 0) {
        clearInterval(timer);
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [weekInfo?.weekEnd?.getTime()]);
  
  const formattedTime = timeLeft.isCountdownActive
    ? `${String(timeLeft.hours).padStart(2, '0')}:${String(timeLeft.minutes).padStart(2, '0')}:${String(timeLeft.seconds).padStart(2, '0')}`
    : null;
  
  return { ...timeLeft, formattedTime };
};

// ===== 获取上周的周信息 =====
const getPreviousWeekInfo = (currentWeekInfo) => {
  const currentWeekStart = currentWeekInfo.weekStart;
  const previousWeekDate = new Date(currentWeekStart);
  previousWeekDate.setDate(previousWeekDate.getDate() - 1);
  return getWeekInfo(previousWeekDate);
};

// ===== 主组件 =====
const BudgetBottleApp = ({ currentUser, onLogout, onSwitchAccount }) => {
  // ===== 加载状态 =====
  const [loadingState, setLoadingState] = useState('connecting');
  const [loadingMessage, setLoadingMessage] = useState('正在连接服务器...');
  const [loadError, setLoadError] = useState(null);
  
  // ===== 基础状态 =====
  const [currentView, setCurrentView] = useState('home');
  const [viewParams, setViewParams] = useState({});
  const [isDataReady, setIsDataReady] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  
  // ===== 导航历史栈（用于正确返回） =====
  const navigationStackRef = useRef(['home']);
  
  // ===== 周信息和预算 =====
  const [weekInfo, setWeekInfo] = useState(() => getWeekInfo(new Date()));
  const [weeklyBudget, setWeeklyBudget] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [viewingTransactions, setViewingTransactions] = useState([]);
  
  // ===== 上周预算（用于设置本周预算的默认值） =====
  const [previousWeekBudgetAmount, setPreviousWeekBudgetAmount] = useState(null);
  
  // ===== 心愿池 =====
  const [wishPoolAmount, setWishPoolAmount] = useState(null);
  const [wishes, setWishes] = useState([]);
  
  // ===== 独立预算 =====
  const [specialBudgets, setSpecialBudgets] = useState([]);
  const [specialBudgetItems, setSpecialBudgetItems] = useState({});
  const [isSecondaryLoaded, setIsSecondaryLoaded] = useState(false);
  
  const pinnedBudgets = specialBudgets.filter(b => b.pinnedToHome);
  
  // ===== 月预算和固定支出 =====
  const [monthlyBudget, setMonthlyBudget] = useState(() => {
    const saved = localStorage.getItem('monthly_budget');
    return saved ? parseFloat(saved) : 3000;
  });
  const [fixedExpenses, setFixedExpenses] = useState([]);
  
  // ===== UI 状态 =====
  const [subtitleIndex, setSubtitleIndex] = useState(0);
  const [subtitleOpacity, setSubtitleOpacity] = useState(1);
  
  // ===== 动画状态 =====
  const [showCelebration, setShowCelebration] = useState(false);
  const [settlementPhase, setSettlementPhase] = useState('idle');
  const [drainProgress, setDrainProgress] = useState(0);
  const [poolFillAmount, setPoolFillAmount] = useState(0);
  const [showResultModal, setShowResultModal] = useState(false);
  const [settlementData, setSettlementData] = useState({ saved: 0, isEmpty: false });
  
  // ===== 动画前的心愿池金额（用于正确显示动画） =====
  const [preAnimationPoolAmount, setPreAnimationPoolAmount] = useState(null);
  
  // ===== 结算确认弹窗状态 =====
  const [showSettlementConfirm, setShowSettlementConfirm] = useState(false);
  const [pendingSettlementData, setPendingSettlementData] = useState(null);
  const [isTestMode, setIsTestMode] = useState(false);
  
  // ===== 待结算队列 =====
  const [pendingSettlements, setPendingSettlements] = useState([]);
  
  // ===== 调试模式 =====
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [debugPoolAmount, setDebugPoolAmount] = useState(0);
  
  // ===== 记录消费弹窗 =====
  const [showAddTransactionModal, setShowAddTransactionModal] = useState(false);
  const [transactionNote, setTransactionNote] = useState('');
  const [showSetBudgetModal, setShowSetBudgetModal] = useState(false);
  
  // ===== Refs =====
  const homeContainerRef = useRef(null);
  const cloudRef = useRef(null);
  const poolRef = useRef(null);
  
  // ===== 结算倒计时 =====
  const { isCountdownActive, formattedTime } = useSettlementCountdown(weekInfo);
  
  // ===== 计算值 =====
  const weeklySpent = transactions.reduce((sum, t) => sum + t.amount, 0);
  const budgetAmount = weeklyBudget?.amount || 0;
  const remaining = budgetAmount - weeklySpent;
  
  const displayRemaining = isInitialLoading ? 0 : remaining;
  const displayPoolAmount = wishPoolAmount === null ? 0 : wishPoolAmount;
  
  const enabledExpenses = (fixedExpenses || []).filter(e => e.enabled !== false);
  const fixedExpensesTotal = enabledExpenses.reduce((sum, e) => sum + e.amount, 0);
  
  // ===== 计算设置预算弹窗的默认值 =====
  const getDefaultBudgetAmount = useCallback(() => {
    // 优先使用上周预算
    if (previousWeekBudgetAmount && previousWeekBudgetAmount > 0) {
      return previousWeekBudgetAmount;
    }
    // 其次使用当前周预算
    if (budgetAmount > 0) {
      return budgetAmount;
    }
    // 最后使用月预算/4
    return monthlyBudget / 4;
  }, [previousWeekBudgetAmount, budgetAmount, monthlyBudget]);
  
  // ===== 更新缓存的工具函数 =====
  const updateTransactionsCache = useCallback((newTransactions) => {
    const cached = loadFromCache() || {};
    saveToCache({ ...cached, transactions: newTransactions });
  }, []);
  
  const updateTransactions = useCallback((updater) => {
    setTransactions(prev => {
      const newTransactions = typeof updater === 'function' ? updater(prev) : updater;
      updateTransactionsCache(newTransactions);
      return newTransactions;
    });
  }, [updateTransactionsCache]);
  
  // ===== 导航函数（优化版） =====
  const navigateTo = useCallback((view, params = {}) => {
    // 更新导航栈
    if (view === 'home') {
      // 回到首页时清空栈
      navigationStackRef.current = ['home'];
      window.history.replaceState({ view: 'home', params: {} }, '', '#home');
    } else {
      navigationStackRef.current.push(view);
      window.history.pushState({ view, params }, '', `#${view}`);
    }
    setViewParams(params);
    setCurrentView(view);
  }, []);
  
  // ===== 返回函数（优化版） =====
  const goBack = useCallback(() => {
    const stack = navigationStackRef.current;
    
    // 如果栈里只有首页或为空，直接回首页
    if (stack.length <= 1) {
      navigateTo('home');
      return;
    }
    
    // 弹出当前页面
    stack.pop();
    
    // 获取上一个页面
    const previousView = stack[stack.length - 1] || 'home';
    
    // 使用 replaceState 而不是 back，避免历史记录问题
    window.history.replaceState({ view: previousView, params: {} }, '', `#${previousView}`);
    setCurrentView(previousView);
    setViewParams({});
  }, [navigateTo]);
  
  // ===== 播放结算动画 =====
  const playSettlementAnimation = useCallback((savedAmount, isEmpty) => {
    return new Promise((resolve) => {
      // 保存动画开始前的心愿池金额
      setPreAnimationPoolAmount(displayPoolAmount);
      
      setSettlementPhase('raining');
      setSettlementData({ saved: savedAmount, isEmpty });
      
      if (savedAmount > 0) {
        const startTime = Date.now();
        const duration = 2500;
        
        const animateAmount = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const easeProgress = 1 - Math.pow(1 - progress, 3);
          const currentAmount = savedAmount * easeProgress;
          setPoolFillAmount(currentAmount);
          
          if (progress < 1) {
            requestAnimationFrame(animateAmount);
          }
        };
        requestAnimationFrame(animateAmount);
      }
      
      setTimeout(() => {
        setSettlementPhase('result');
        setShowResultModal(true);
        resolve();
      }, 2500);
    });
  }, [displayPoolAmount]);
  
  // ===== 处理结算队列 =====
  useEffect(() => {
    if (pendingSettlements.length > 0 && settlementPhase === 'idle' && !isInitialLoading) {
      const nextSettlement = pendingSettlements[0];
      playSettlementAnimation(nextSettlement.saved, nextSettlement.isEmpty);
      setPendingSettlements(prev => prev.slice(1));
    }
  }, [pendingSettlements, settlementPhase, isInitialLoading, playSettlementAnimation]);
  
  // ===== 检查上周结算 =====
  const checkPreviousWeekSettlement = async (currentWeekInfo) => {
    try {
      const prevWeekInfo = getPreviousWeekInfo(currentWeekInfo);
      const weekKey = prevWeekInfo.weekKey;
      
      const settledResult = await checkWeekSettled(weekKey);
      
      // 获取上周预算（无论是否已结算，都要获取用于默认值）
      const budgetRes = await getWeeklyBudget(weekKey);
      
      if (budgetRes?.success && budgetRes?.data) {
        // 保存上周预算金额
        setPreviousWeekBudgetAmount(budgetRes.data.amount);
      }
      
      if (settledResult?.settled) {
        return null;
      }
      
      if (!budgetRes?.success || !budgetRes?.data) {
        return null;
      }
      
      const budget = budgetRes.data.amount;
      
      const transRes = await getTransactions(weekKey);
      
      const spent = transRes?.success 
        ? transRes.data.reduce((sum, t) => sum + t.amount, 0) 
        : 0;
      
      const saved = budget - spent;
      
      return {
        weekKey,
        weekLabel: parseWeekKeyToISO(weekKey),
        budget,
        spent,
        saved
      };
      
    } catch (error) {
      console.error('检查上周结算失败:', error);
      return null;
    }
  };
  
  // ===== 用户确认存入心愿池 =====
  const handleConfirmSettlement = async () => {
    if (!pendingSettlementData) return;
    
    const { weekKey, budget, spent, saved } = pendingSettlementData;
    
    setShowSettlementConfirm(false);
    
    if (isTestMode) {
      setPendingSettlements([{
        weekKey,
        saved: Math.max(0, saved),
        isEmpty: saved <= 0
      }]);
      setPendingSettlementData(null);
      setIsTestMode(false);
      return;
    }
    
    const historyResult = await createWishPoolHistory(
      weekKey, budget, spent, saved, false, '', ''
    );
    
    if (historyResult.success && historyResult.isNew) {
      setPendingSettlements([{
        weekKey,
        saved: Math.max(0, saved),
        isEmpty: saved <= 0
      }]);
    }
    
    setPendingSettlementData(null);
  };
  
  // ===== 用户跳过存入 =====
  const handleSkipSettlement = () => {
    setShowSettlementConfirm(false);
    setPendingSettlementData(null);
    setIsTestMode(false);
  };
  
  // ===== 加载次要数据 =====
  const loadSecondaryData = async () => {
    if (isSecondaryLoaded) return;
    
    try {
      const [specialRes, fixedRes] = await Promise.all([
        getSpecialBudgets(),
        getFixedExpenses()
      ]);
      
      if (specialRes?.success) {
        setSpecialBudgets(specialRes.data);
        const itemsMap = {};
        for (const budget of specialRes.data) {
          const itemsRes = await getSpecialBudgetItems(budget.id);
          if (itemsRes?.success) {
            itemsMap[budget.id] = itemsRes.data;
          }
        }
        setSpecialBudgetItems(itemsMap);
      }
      
      if (fixedRes?.success) setFixedExpenses(fixedRes.data);
      
      setIsSecondaryLoaded(true);
    } catch (error) {
      console.error('加载次要数据失败:', error);
    }
  };
  
  // ===== 初始化 =====
  const loadCoreData = useCallback(async () => {
    setLoadingState('connecting');
    setLoadingMessage('正在连接服务器...');
    setLoadError(null);
    
    // 先尝试使用缓存数据快速显示
    const cached = loadFromCache();
    if (cached) {
      if (cached.weeklyBudget) setWeeklyBudget(cached.weeklyBudget);
      if (cached.transactions) {
        setTransactions(cached.transactions);
        setViewingTransactions(cached.transactions);
      }
      if (cached.wishPoolAmount !== undefined) setWishPoolAmount(cached.wishPoolAmount);
      if (cached.wishes) setWishes(cached.wishes);
      
      // 有缓存时直接显示界面
      setIsDataReady(true);
      setIsInitialLoading(false);
      setLoadingState('ready');
    }
    
    try {
      setLoadingMessage('正在加载数据...');
      setLoadingState('loading');
      
      // 检查上周结算（同时会获取上周预算用于默认值）
      const settlementData = await checkPreviousWeekSettlement(weekInfo);
      
      // 并行加载核心数据
      const [budgetRes, transRes, poolRes, wishesRes] = await Promise.all([
        getWeeklyBudget(weekInfo.weekKey),
        getTransactions(weekInfo.weekKey),
        getWishPool(),
        getWishes()
      ]);
      
      // 检查是否全部失败
      const allFailed = !budgetRes?.success && !transRes?.success && 
                        !poolRes?.success && !wishesRes?.success;
      
      if (allFailed && !cached) {
        throw new Error('无法连接到服务器，请检查网络连接');
      }
      
      // 更新状态
      if (budgetRes?.success) setWeeklyBudget(budgetRes.data);
      if (transRes?.success) {
        setTransactions(transRes.data);
        setViewingTransactions(transRes.data);
      }
      if (poolRes?.success) setWishPoolAmount(poolRes.data.amount);
      if (wishesRes?.success) setWishes(wishesRes.data);
      
      // 保存缓存
      saveToCache({
        weeklyBudget: budgetRes?.data || cached?.weeklyBudget,
        transactions: transRes?.data || cached?.transactions,
        wishPoolAmount: poolRes?.data?.amount ?? cached?.wishPoolAmount,
        wishes: wishesRes?.data || cached?.wishes
      });
      
      setIsDataReady(true);
      setIsInitialLoading(false);
      setLoadingState('ready');
      
      // 显示结算确认弹窗
      if (settlementData) {
        setTimeout(() => {
          setPendingSettlementData(settlementData);
          setShowSettlementConfirm(true);
        }, 500);
      }
      
      // 延迟加载次要数据
      setTimeout(() => loadSecondaryData(), 500);
      
    } catch (error) {
      console.error('数据加载失败:', error);
      
      // 如果有缓存，使用缓存继续
      if (cached) {
        setIsDataReady(true);
        setIsInitialLoading(false);
        setLoadingState('ready');
      } else {
        setLoadError(error.message || '加载失败，请重试');
        setLoadingState('error');
      }
    }
  }, [weekInfo.weekKey]);
  
  // ===== 初始化 =====
  useEffect(() => {
    loadCoreData();
  }, [loadCoreData]);
  
  useEffect(() => {
    if ((currentView === 'budgetSetup' || currentView === 'specialBudgetTimeline' || 
         currentView === 'spendingOverview' || currentView === 'fixedExpenseList') && 
        !isSecondaryLoaded) {
      loadSecondaryData();
    }
  }, [currentView, isSecondaryLoaded]);
  
  // ===== 浏览器历史记录处理 =====
  useEffect(() => {
    if (!window.history.state) {
      window.history.replaceState({ view: 'home', params: {} }, '', '#home');
    }
    
    const handlePopState = (event) => {
      if (event.state) {
        const targetView = event.state.view || 'home';
        const stack = navigationStackRef.current;
        
        // 找到目标视图在栈中的位置
        const targetIndex = stack.lastIndexOf(targetView);
        
        if (targetIndex >= 0) {
          // 截取栈到目标位置
          navigationStackRef.current = stack.slice(0, targetIndex + 1);
        } else {
          // 如果找不到，直接回首页
          navigationStackRef.current = ['home'];
        }
        
        setCurrentView(targetView);
        setViewParams(event.state.params || {});
      } else {
        navigationStackRef.current = ['home'];
        setCurrentView('home');
        setViewParams({});
      }
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  
  // ===== bfcache 恢复 =====
  useEffect(() => {
    const handlePageShow = (event) => {
      if (event.persisted) {
        const cached = loadFromCache();
        if (cached) {
          if (cached.transactions) {
            setTransactions(cached.transactions);
            setViewingTransactions(cached.transactions);
          }
          if (cached.weeklyBudget) setWeeklyBudget(cached.weeklyBudget);
          if (cached.wishes) setWishes(cached.wishes);
          if (cached.wishPoolAmount !== undefined) setWishPoolAmount(cached.wishPoolAmount);
        }
      }
    };
    
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);
  
  useEffect(() => {
    if (currentView === 'home') {
      const cached = loadFromCache();
      if (cached?.transactions) {
        setTransactions(cached.transactions);
        setViewingTransactions(cached.transactions);
      }
    }
  }, [currentView]);
  
  // ===== 小字切换动画 =====
  useEffect(() => {
    const interval = setInterval(() => {
      setSubtitleOpacity(0);
      setTimeout(() => {
        const count = isCountdownActive ? 3 : 2;
        setSubtitleIndex(prev => (prev + 1) % count);
        setSubtitleOpacity(1);
      }, 500);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [isCountdownActive]);
  
  // ===== 关闭结算结果 =====
  const closeSettlementResult = async () => {
    setShowResultModal(false);
    setSettlementPhase('idle');
    setDrainProgress(0);
    setPoolFillAmount(0);
    setPreAnimationPoolAmount(null); // 重置动画前金额
    
    try {
      const poolRes = await getWishPool();
      if (poolRes.success) {
        setWishPoolAmount(poolRes.data.amount);
      }
    } catch (error) {
      console.error('刷新心愿池失败:', error);
    }
  };
  
  const handleDebugChange = (value) => {
    if (value === -1) {
      setIsDebugMode(false);
    } else {
      setIsDebugMode(true);
      setDebugPoolAmount(value);
    }
  };
  
  const openAddTransactionModal = () => {
    setTransactionNote('');
    setShowAddTransactionModal(true);
  };
  
  const handleAddTransaction = async (amount, note) => {
    if (!amount || amount <= 0) return;
    
    const now = new Date();
    const result = await createTransaction(
      weekInfo.weekKey,
      formatDate(now),
      `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
      amount,
      note || ''
    );
    
    if (result.success) {
      const newTransactions = [...transactions, result.data];
      setTransactions(newTransactions);
      setViewingTransactions(newTransactions);
      setShowAddTransactionModal(false);
      setTransactionNote('');
      updateTransactionsCache(newTransactions);
    } else {
      alert('记录失败: ' + result.error);
    }
  };
  
  const handleSetWeeklyBudget = async (amount) => {
    if (!amount || amount <= 0) return;
    
    try {
      const { saveWeeklyBudget } = await import('./api');
      const result = await saveWeeklyBudget(weekInfo.weekKey, amount);
      if (result.success) {
        setWeeklyBudget(result.data);
        setShowSetBudgetModal(false);
        
        const cached = loadFromCache() || {};
        saveToCache({ ...cached, weeklyBudget: result.data });
      } else {
        alert('设置失败');
      }
    } catch (error) {
      console.error('设置周预算失败:', error);
    }
  };
  
  const refreshData = async () => {
    try {
      const [poolRes, wishesRes] = await Promise.all([
        getWishPool(),
        getWishes()
      ]);
      if (poolRes.success) setWishPoolAmount(poolRes.data.amount);
      if (wishesRes.success) setWishes(wishesRes.data);
    } catch (error) {
      console.error('刷新数据失败:', error);
    }
  };
  
  // ===== 计算心愿池显示金额 =====
  const getPoolDisplayAmount = () => {
    if (isDebugMode) return debugPoolAmount;
    
    // 如果正在播放动画，使用动画前的金额 + 当前填充量
    if (settlementPhase !== 'idle' && preAnimationPoolAmount !== null) {
      return preAnimationPoolAmount + poolFillAmount;
    }
    
    // 正常显示
    return displayPoolAmount;
  };
  
  // ===== 首页渲染 =====
  const renderHomeView = () => {
    // 显示加载状态
    if (loadingState === 'connecting' || loadingState === 'loading') {
      return <FullScreenLoader message={loadingMessage} />;
    }
    
    // 显示错误状态
    if (loadingState === 'error') {
      return <LoadingErrorView error={loadError} onRetry={loadCoreData} />;
    }
    
    const subtitles = isCountdownActive 
      ? [
          `预算 ¥${budgetAmount.toLocaleString()}，已用 ¥${weeklySpent.toLocaleString()}`,
          `${weekInfo.isoYear || weekInfo.year}年 第${weekInfo.isoWeekNumber || weekInfo.weekNumber}周`,
          `距结算 ${formattedTime}`
        ]
      : [
          `预算 ¥${budgetAmount.toLocaleString()}，已用 ¥${weeklySpent.toLocaleString()}`,
          `${weekInfo.isoYear || weekInfo.year}年 第${weekInfo.isoWeekNumber || weekInfo.weekNumber}周`
        ];
    
    // 骨架屏
    if (isInitialLoading) {
      return (
        <PageContainer bg="gray">
          <div className="absolute top-8 left-6 z-20">
            <div className="h-8 w-24 bg-gray-200 rounded-lg skeleton-pulse" />
          </div>
          <div className="absolute top-8 right-6 z-20">
            <div className="w-10 h-10 bg-gray-200 rounded-2xl skeleton-pulse" />
          </div>
          <div className="min-h-screen flex flex-col items-center justify-center px-6">
            <div className="text-center" style={{ marginBottom: '50px' }}>
              <div className="h-10 w-32 bg-gray-200 rounded-xl mx-auto skeleton-pulse" />
              <div className="h-4 w-48 bg-gray-100 rounded-lg mx-auto mt-3 skeleton-pulse" />
            </div>
            <div className="w-full flex justify-center" style={{ maxWidth: '280px' }}>
              <div className="w-[200px] h-[160px] bg-gray-100 rounded-[60px] skeleton-pulse" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 px-6 pb-8">
            <div className="h-6 w-24 bg-gray-200 rounded-lg skeleton-pulse mb-2" />
            <div className="h-8 w-32 bg-gray-100 rounded-lg skeleton-pulse" />
          </div>
          <style>{`
            @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
            .skeleton-pulse { animation: pulse 1.5s ease-in-out infinite; }
          `}</style>
        </PageContainer>
      );
    }
    
    return (
      <>
        <PageContainer>
          <div 
            ref={homeContainerRef} 
            className="min-h-screen flex flex-col relative"
          >
            {/* 顶部导航 */}
            <div className="absolute top-0 left-0 right-0 h-20 z-20 px-6 flex items-center justify-between border-b border-[#F3F4F6]">
              <button 
                onClick={() => navigateTo('brandMenu')} 
                className="text-cyan-500 font-extrabold text-xl font-rounded active:scale-95 transition-all"
              >
                CloudPool
              </button>
              
              <button 
                onClick={() => navigateTo('spendingOverview')} 
                className="w-10 h-10 rounded-2xl flex items-center justify-center hover:shadow-md transition-all active:scale-95 bg-white"
              >
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect fill="white"/>
                  <rect x="6" y="6" width="23" height="6" rx="3" fill="#00C3E0"/>
                  <path d="M26 12L26 6L26.2143 6C27.7528 6 29 7.34312 29 9C29 10.6569 27.7528 12 26.2143 12L26 12Z" fill="#00C7E4"/>
                  <path d="M9 12L9 6L8.78571 6C7.24719 6 6 7.34312 6 9C6 10.6569 7.24719 12 8.78571 12L9 12Z" fill="#00C7E4"/>
                  <rect x="6" y="15" width="23" height="6" rx="3" fill="#FFC800"/>
                  <path d="M26 21L26 15L26.2143 15C27.7528 15 29 16.3431 29 18C29 19.6569 27.7528 21 26.2143 21L26 21Z" fill="#FFC200"/>
                  <path d="M9 21L9 15L8.78571 15C7.24719 15 6 16.3431 6 18C6 19.6569 7.24719 21 8.78571 21L9 21Z" fill="#FFC200"/>
                  <rect x="6" y="24" width="23" height="6" rx="3" fill="#A568CC"/>
                  <path d="M26 30L26 24L26.2143 24C27.7528 24 29 25.3431 29 27C29 28.6569 27.7528 30 26.2143 30L26 30Z" fill="#CE82FF"/>
                  <path d="M9 30L9 24L8.78571 24C7.24719 24 6 25.3431 6 27C6 28.6569 7.24719 30 8.78571 30L9 30Z" fill="#CE82FF"/>
                </svg>
              </button>
            </div>
            
            {/* 可拖拽的独立预算图标 */}
            {pinnedBudgets.length > 0 && (
              <DraggableBudgetIcons
                budgets={pinnedBudgets}
                onBudgetClick={(budget) => navigateTo('specialBudgetDetail', { editingSpecialBudget: budget })}
                cloudRef={cloudRef}
                setSpecialBudgets={setSpecialBudgets}
              />
            )}
            
            {/* 主内容 */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10" style={{ paddingBottom: '0px' }}>
              <div 
                className="text-center cursor-pointer active:opacity-80" 
                style={{ marginBottom: '12px' }}
                onClick={() => navigateTo('transactionList')}
              >
                <h1 
                  className="font-extrabold leading-none font-rounded"
                  style={{ fontSize: '32px', color: colors.primary }}
                >
                  <span className="text-2xl mr-1 text-gray-300">¥</span>
                  {displayRemaining.toLocaleString()}
                </h1>
                <div 
                  className="flex items-center gap-1 mt-3 font-bold mx-auto justify-center text-gray-400"
                  style={{ opacity: subtitleOpacity, transition: 'opacity 500ms ease-in-out' }}
                >
                  <span className="text-sm">{subtitles[subtitleIndex]}</span>
                  <ChevronRight size={16} strokeWidth={2.5} className="relative top-[0.5px]"/>
                </div>
              </div>
              
              <div 
                ref={cloudRef}
                className="w-full flex justify-center" 
                style={{ maxWidth: '320px', marginBottom: '-40px' }}
              >
                <BudgetCloud 
                  remaining={displayRemaining} 
                  total={budgetAmount} 
                  spent={weeklySpent} 
                  onClick={openAddTransactionModal}
                  drainProgress={drainProgress}
                  isShaking={settlementPhase === 'shaking'}
                />
              </div>
            </div>
            
            {/* 心愿池 */}
            <div ref={poolRef} style={{ 
              transform: 'translateY(-50px)', 
              position: 'relative', 
              zIndex: 30 
            }}>
              <WishPoolBar 
                poolAmount={getPoolDisplayAmount()} 
                animatingAmount={settlementPhase !== 'idle' ? poolFillAmount : 0}
                wishes={wishes} 
                onWishClick={(wish) => navigateTo('editWish', { editingWish: wish })} 
                onPoolClick={() => navigateTo('wishPoolDetail')} 
                debugMode={isDebugMode} 
                onDebugChange={handleDebugChange}
              />
            </div>
          </div>
        </PageContainer>
        
        {/* 弹窗和动画 */}
        <SettlementConfirmModal
          isOpen={showSettlementConfirm}
          weekLabel={pendingSettlementData?.weekLabel || ''}
          savedAmount={pendingSettlementData?.saved || 0}
          onConfirm={handleConfirmSettlement}
          onSkip={handleSkipSettlement}
        />
        
        <RainEffect 
          isActive={settlementPhase === 'raining'}
          cloudRef={cloudRef}
        />
        
        <SettlementResultModal
          isOpen={showResultModal}
          savedAmount={settlementData.saved}
          isEmpty={settlementData.isEmpty}
          onClose={closeSettlementResult}
          onSetBudget={() => setShowSetBudgetModal(true)}
        />
        
        {showAddTransactionModal && (
          <Calculator
            value={0}
            onChange={handleAddTransaction}
            onClose={() => setShowAddTransactionModal(false)}
            showNote={true}
            noteValue={transactionNote}
            onNoteChange={setTransactionNote}
            title="记录消费"
          />
        )}
        
        {showSetBudgetModal && (
          <Calculator
            value={getDefaultBudgetAmount()}
            onChange={handleSetWeeklyBudget}
            onClose={() => setShowSetBudgetModal(false)}
            showNote={false}
            title="设置本周预算"
          />
        )}
        
        {showCelebration && (
          <CelebrationAnimation
            wishName="测试心愿"
            amount={999}
            onComplete={() => setShowCelebration(false)}
          />
        )}
      </>
    );
  };
  
  // ===== 视图路由 =====
  const renderCurrentView = () => {
    switch (currentView) {
      case 'home':
        return renderHomeView();
      
      case 'brandMenu':
        return (
          <BrandMenuView
            onBack={goBack}
            onLogout={onLogout}
            onSwitchToLogin={onSwitchAccount}
            currentUser={currentUser}
          />
        );
      
      case 'spendingOverview':
        return (
          <SpendingOverviewView
            onBack={goBack}
            navigateTo={navigateTo}
            weeklySpent={weeklySpent}
            weeklyBudget={budgetAmount}
            weeklyRemaining={displayRemaining}
            transactions={transactions}
            fixedExpensesTotal={fixedExpensesTotal}
            specialBudgetsCount={specialBudgets.length}
          />
        );
      
      case 'fixedExpenseList':
        return (
          <FixedExpenseListView
            fixedExpenses={fixedExpenses}
            onBack={goBack}
            navigateTo={navigateTo}
          />
        );
        
      case 'transactionList':
        return (
          <TransactionListView
            weekInfo={weekInfo}
            weeklyBudget={weeklyBudget}
            setWeeklyBudget={setWeeklyBudget}
            transactions={transactions}
            setTransactions={updateTransactions}
            navigateTo={navigateTo}
            isDataReady={isDataReady}
            onBack={goBack}
          />
        );
        
      case 'editTransaction':
        return (
          <EditTransactionView
            editingTransaction={viewParams.editingTransaction}
            weekInfo={weekInfo}
            transactions={transactions}
            setTransactions={updateTransactions}
            viewingTransactions={viewingTransactions}
            setViewingTransactions={setViewingTransactions}
            onBack={goBack}
          />
        );
        
      case 'wishPoolDetail':
        return (
          <WishPoolDetailView
            wishPoolAmount={displayPoolAmount}
            wishes={wishes}
            onWishClick={(wish) => navigateTo('editWish', { editingWish: wish })}
            onAddWishClick={() => navigateTo('editWish', { editingWish: {} })}
            refreshData={refreshData}
            onBack={goBack}
          />
        );
        
      case 'editWish':
        return (
          <EditWishView
            editingWish={viewParams.editingWish}
            wishes={wishes}
            setWishes={setWishes}
            wishPoolAmount={displayPoolAmount}
            setWishPoolAmount={setWishPoolAmount}
            onBack={goBack}
          />
        );
        
      case 'editFixedExpense':
        return (
          <EditFixedExpenseView
            editingExpense={viewParams.editingExpense}
            fixedExpenses={fixedExpenses}
            setFixedExpenses={setFixedExpenses}
            onBack={goBack}
          />
        );
      
      case 'specialBudgetTimeline':
        return (
          <SpecialBudgetTimelineView
            specialBudgets={specialBudgets}
            setSpecialBudgets={setSpecialBudgets}
            specialBudgetItems={specialBudgetItems}
            navigateTo={navigateTo}
            onBack={goBack}
            isDataReady={isSecondaryLoaded}
          />
        );
        
      case 'specialBudgetDetail':
        return (
          <SpecialBudgetDetailView
            editingSpecialBudget={viewParams.editingSpecialBudget}
            specialBudgets={specialBudgets}
            setSpecialBudgets={setSpecialBudgets}
            navigateTo={navigateTo}
            onBack={goBack}
          />
        );
        
      case 'editSpecialBudget':
        return (
          <EditSpecialBudgetView
            editingSpecialBudget={viewParams.editingSpecialBudget}
            specialBudgets={specialBudgets}
            setSpecialBudgets={setSpecialBudgets}
            onBack={goBack}
          />
        );
      
      case 'editSpecialBudgetItem':
        return (
          <EditSpecialBudgetItemView
            editingItem={viewParams.editingItem}
            budgetId={viewParams.budgetId}
            iconColor={viewParams.iconColor}
            onBack={goBack}
          />
        );
        
      default:
        return renderHomeView();
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-100">
      {renderCurrentView()}
    </div>
  );
};

export default BudgetBottleApp;