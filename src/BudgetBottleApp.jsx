// BudgetBottleApp.jsx - 主应用文件
// 修改：删除海底数据格言，添加固定支出列表路由

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronRight } from 'lucide-react';

// 组件导入
import BudgetCloud, { CLOUD_COLOR } from './components/BudgetCloud';
import WishPoolBar from './components/WishPoolBar';
import DraggableBudgetIcons from './components/DraggableBudgetIcons';
import Calculator from './components/CalculatorModal';

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
import BudgetSetupView from './views/BudgetSetupView';
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
  getFixedExpenses
} from './api';
import { 
  loadFromCache, 
  saveToCache, 
  getWeekInfo, 
  formatDate 
} from './utils/helpers';

// 设计系统颜色
const colors = {
  primary: '#06B6D4',
  primaryDark: '#0891B2',
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

// ===== 主组件 =====
const BudgetBottleApp = ({ currentUser, onLogout, onSwitchAccount }) => {
  // ===== 基础状态 =====
  const [currentView, setCurrentView] = useState('home');
  const [viewParams, setViewParams] = useState({});
  const [isDataReady, setIsDataReady] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  
  // ===== 周信息和预算 =====
  const [weekInfo, setWeekInfo] = useState(() => getWeekInfo(new Date()));
  const [weeklyBudget, setWeeklyBudget] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [viewingTransactions, setViewingTransactions] = useState([]);
  
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
  
  // 固定支出计算
  const enabledExpenses = (fixedExpenses || []).filter(e => e.enabled !== false);
  const fixedExpensesTotal = enabledExpenses.reduce((sum, e) => sum + e.amount, 0);
  
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
  
  // ===== 导航函数 =====
  const navigateTo = (view, params = {}) => {
    setViewParams(params);
    setCurrentView(view);
    window.history.pushState({ view, params }, '', `#${view}`);
  };
  
  // ===== 加载次要数据 =====
  const loadSecondaryData = async () => {
    if (isSecondaryLoaded) return;
    
    try {
      const [specialRes, fixedRes] = await Promise.all([
        getSpecialBudgets(),
        getFixedExpenses()
      ]);
      
      if (specialRes.success) {
        setSpecialBudgets(specialRes.data);
        const itemsMap = {};
        for (const budget of specialRes.data) {
          const itemsRes = await getSpecialBudgetItems(budget.id);
          if (itemsRes.success) {
            itemsMap[budget.id] = itemsRes.data;
          }
        }
        setSpecialBudgetItems(itemsMap);
      }
      
      if (fixedRes.success) setFixedExpenses(fixedRes.data);
      
      setIsSecondaryLoaded(true);
    } catch (error) {
      console.error('加载次要数据失败:', error);
    }
  };
  
  // ===== 初始化 =====
  useEffect(() => {
    const loadCoreData = async () => {
      try {
        const [budgetRes, transRes, poolRes, wishesRes] = await Promise.all([
          getWeeklyBudget(weekInfo.weekKey),
          getTransactions(weekInfo.weekKey),
          getWishPool(),
          getWishes()
        ]);
        
        if (budgetRes.success) setWeeklyBudget(budgetRes.data);
        if (transRes.success) {
          setTransactions(transRes.data);
          setViewingTransactions(transRes.data);
        }
        if (poolRes.success) setWishPoolAmount(poolRes.data.amount);
        if (wishesRes.success) setWishes(wishesRes.data);
        
        saveToCache({
          weeklyBudget: budgetRes.data,
          transactions: transRes.data,
          wishPoolAmount: poolRes.data?.amount,
          wishes: wishesRes.data
        });
        
        setIsDataReady(true);
        setIsInitialLoading(false);
        
        setTimeout(() => loadSecondaryData(), 500);
        
      } catch (error) {
        console.error('数据加载失败:', error);
        const cached = loadFromCache();
        if (cached) {
          if (cached.weeklyBudget) setWeeklyBudget(cached.weeklyBudget);
          if (cached.transactions) {
            setTransactions(cached.transactions);
            setViewingTransactions(cached.transactions);
          }
          if (cached.wishPoolAmount !== undefined) setWishPoolAmount(cached.wishPoolAmount);
          if (cached.wishes) setWishes(cached.wishes);
        }
        setIsDataReady(true);
        setIsInitialLoading(false);
      }
    };
    
    loadCoreData();
  }, [weekInfo.weekKey]);
  
  useEffect(() => {
    if ((currentView === 'budgetSetup' || currentView === 'specialBudgetTimeline' || currentView === 'spendingOverview' || currentView === 'fixedExpenseList') && !isSecondaryLoaded) {
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
        setCurrentView(event.state.view || 'home');
        setViewParams(event.state.params || {});
      } else {
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
  
  // ===== 其他处理函数 =====
  const closeSettlementResult = () => {
    setShowResultModal(false);
    setSettlementPhase('idle');
    setDrainProgress(0);
    setPoolFillAmount(0);
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
  
  // ===== 首页渲染 =====
  const renderHomeView = () => {
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
    
    if (isInitialLoading) {
      return (
        <>
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@400;500;700;800&display=swap');
            .font-rounded { font-family: 'M PLUS Rounded 1c', sans-serif; }
            @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
            .skeleton-pulse { animation: pulse 1.5s ease-in-out infinite; }
          `}</style>
          <div className="min-h-screen flex flex-col relative bg-gray-50">
            <div className="absolute top-8 left-6 z-20">
              <div className="h-8 w-24 bg-gray-200 rounded-lg skeleton-pulse" />
            </div>
            <div className="absolute top-8 right-6 z-20">
              <div className="w-10 h-10 bg-gray-200 rounded-2xl skeleton-pulse" />
            </div>
            <div className="flex-1 flex flex-col items-center justify-center px-6">
              <div className="text-center" style={{ marginBottom: '50px' }}>
                <div className="h-10 w-32 bg-gray-200 rounded-xl mx-auto skeleton-pulse" />
                <div className="h-4 w-48 bg-gray-100 rounded-lg mx-auto mt-3 skeleton-pulse" />
              </div>
              <div className="w-full flex justify-center" style={{ maxWidth: '280px' }}>
                <div className="w-[200px] h-[160px] bg-gray-100 rounded-[60px] skeleton-pulse" />
              </div>
            </div>
            <div className="px-6 pb-8">
              <div className="h-6 w-24 bg-gray-200 rounded-lg skeleton-pulse mb-2" />
              <div className="h-8 w-32 bg-gray-100 rounded-lg skeleton-pulse" />
            </div>
          </div>
        </>
      );
    }
    
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@400;500;700;800&display=swap');
          .font-rounded { font-family: 'M PLUS Rounded 1c', sans-serif; }
        `}</style>

        <div 
          ref={homeContainerRef} 
          className="min-h-screen bg-gray-50"
        >
          {/* 主内容区域 */}
          <div className="min-h-screen flex flex-col relative">
            {/* 左上角：CloudPool Logo */}
            <div className="absolute top-8 left-6 z-20">
              <button 
                onClick={() => navigateTo('brandMenu')} 
                className="text-cyan-500 font-extrabold text-xl font-rounded hover:text-cyan-600 active:scale-95 transition-all"
              >
                CloudPool
              </button>
            </div>
            
            {/* 右上角：消费全景入口 */}
            <div className="absolute top-8 right-6 z-20">
              <button 
                onClick={() => navigateTo('spendingOverview')} 
                className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm hover:shadow-md transition-all active:scale-95 bg-white"
              >
                {/* 四宫格图标 */}
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <rect x="2" y="2" width="7" height="7" rx="2" fill="#06B6D4"/>
                  <rect x="11" y="2" width="7" height="7" rx="2" fill="#F59E0B"/>
                  <rect x="2" y="11" width="7" height="7" rx="2" fill="#10B981"/>
                  <rect x="11" y="11" width="7" height="7" rx="2" fill="#8B5CF6"/>
                </svg>
              </button>
            </div>
            
            {pinnedBudgets.length > 0 && (
              <DraggableBudgetIcons
                budgets={pinnedBudgets}
                onBudgetClick={(budget) => navigateTo('specialBudgetDetail', { editingSpecialBudget: budget })}
                cloudRef={cloudRef}
                setSpecialBudgets={setSpecialBudgets}
              />
            )}
            
            <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
              <div 
                className="text-center cursor-pointer active:opacity-80" 
                style={{ marginBottom: '50px' }}
                onClick={() => navigateTo('transactionList')}
              >
                <h1 
                  className="font-extrabold leading-none font-rounded"
                  style={{ fontSize: '36px', color: colors.primary }}
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
                style={{ maxWidth: '280px' }}
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
            
            <div ref={poolRef}>
              <WishPoolBar 
                poolAmount={isDebugMode ? debugPoolAmount : displayPoolAmount} 
                animatingAmount={poolFillAmount}
                wishes={wishes} 
                onWishClick={(wish) => navigateTo('editWish', { editingWish: wish })} 
                onPoolClick={() => navigateTo('wishPoolDetail')} 
                debugMode={isDebugMode} 
                onDebugChange={handleDebugChange}
              />
            </div>
          </div>
        </div>
        
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
            value={budgetAmount || monthlyBudget / 4}
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
            onBack={() => window.history.back()}
            onLogout={onLogout}
            onSwitchToLogin={onSwitchAccount}
            currentUser={currentUser}
          />
        );
      
      case 'spendingOverview':
        return (
          <SpendingOverviewView
            onBack={() => window.history.back()}
            navigateTo={navigateTo}
            weeklyRemaining={displayRemaining}
            fixedExpensesTotal={fixedExpensesTotal}
            fixedExpensesCount={enabledExpenses.length}
            specialBudgetsCount={specialBudgets.length}
          />
        );
      
      case 'fixedExpenseList':
        return (
          <FixedExpenseListView
            fixedExpenses={fixedExpenses}
            onBack={() => window.history.back()}
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
          />
        );
        
      case 'budgetSetup':
        return (
          <BudgetSetupView
            monthlyBudget={monthlyBudget || 3000}
            setMonthlyBudget={setMonthlyBudget}
            fixedExpenses={fixedExpenses || []}
            setFixedExpenses={setFixedExpenses}
            weekInfo={weekInfo}
            weeklyBudget={weeklyBudget}
            setWeeklyBudget={setWeeklyBudget}
            navigateTo={navigateTo}
            onBack={() => window.history.back()}
            isDataReady={isDataReady && isSecondaryLoaded}
            currentUser={currentUser}
            onLogout={onLogout}
            onSwitchToLogin={onSwitchAccount}
          />
        );
      
      case 'editFixedExpense':
        return (
          <EditFixedExpenseView
            editingExpense={viewParams.editingExpense}
            fixedExpenses={fixedExpenses}
            setFixedExpenses={setFixedExpenses}
            onBack={() => window.history.back()}
          />
        );
      
      case 'specialBudgetTimeline':
        return (
          <SpecialBudgetTimelineView
            specialBudgets={specialBudgets}
            setSpecialBudgets={setSpecialBudgets}
            specialBudgetItems={specialBudgetItems}
            navigateTo={navigateTo}
            onBack={() => window.history.back()}
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
          />
        );
        
      case 'editSpecialBudget':
        return (
          <EditSpecialBudgetView
            editingSpecialBudget={viewParams.editingSpecialBudget}
            specialBudgets={specialBudgets}
            setSpecialBudgets={setSpecialBudgets}
            onBack={() => window.history.back()}
          />
        );
      
      case 'editSpecialBudgetItem':
        return (
          <EditSpecialBudgetItemView
            editingItem={viewParams.editingItem}
            budgetId={viewParams.budgetId}
            iconColor={viewParams.iconColor}
            onBack={() => window.history.back()}
          />
        );
        
      default:
        return renderHomeView();
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {renderCurrentView()}
    </div>
  );
};

export default BudgetBottleApp;