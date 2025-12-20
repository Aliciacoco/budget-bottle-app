// BudgetBottleApp.jsx - 主应用文件
// 修复：返回首页时动画跳动问题

import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Settings, ChevronRight } from 'lucide-react';

// 组件导入
import BudgetCloud, { CLOUD_COLOR } from './components/BudgetCloud';
import WishPoolBar from './components/WishPoolBar';
import DraggableBudgetIcons from './components/DraggableBudgetIcons';
import Calculator from './components/CalculatorModal';

// 视图导入
import TransactionListView from './views/TransactionListView';
import WishPoolDetailView from './views/WishPoolDetailView';
import EditWishView from './views/EditWishView';
import AddTransactionView from './views/AddTransactionView';
import EditTransactionView from './views/EditTransactionView';
import BudgetSetupView from './views/BudgetSetupView';
import EditFixedExpenseView from './views/EditFixedExpenseView';
import SpecialBudgetDetailView from './views/SpecialBudgetDetailView';
import EditSpecialBudgetView from './views/EditSpecialBudgetView';
import EditSpecialBudgetItemView from './views/EditSpecialBudgetItemView';

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

const BudgetBottleApp = () => {
  // ===== 基础状态 =====
  const [currentView, setCurrentView] = useState('home');
  const [viewParams, setViewParams] = useState({});
  const [isDataReady, setIsDataReady] = useState(false);
  const [isHomeReady, setIsHomeReady] = useState(false);  // 新增：首页就绪状态
  
  // ===== 周信息和预算 =====
  const [weekInfo, setWeekInfo] = useState(() => getWeekInfo(new Date()));
  const [weeklyBudget, setWeeklyBudget] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [viewingTransactions, setViewingTransactions] = useState([]);
  
  // ===== 心愿池 - 从缓存初始化 =====
  const [wishPoolAmount, setWishPoolAmount] = useState(() => {
    const cached = loadFromCache();
    return cached?.wishPoolAmount ?? 0;
  });
  const [wishes, setWishes] = useState(() => {
    const cached = loadFromCache();
    return cached?.wishes ?? [];
  });
  
  // ===== 独立预算 =====
  const [specialBudgets, setSpecialBudgets] = useState([]);
  const [specialBudgetItems, setSpecialBudgetItems] = useState({});
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
  
  // ===== 调试模式 =====
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [debugPoolAmount, setDebugPoolAmount] = useState(0);
  
  // ===== 记录消费弹窗 =====
  const [showAddTransactionModal, setShowAddTransactionModal] = useState(false);
  const [transactionNote, setTransactionNote] = useState('');
  
  // ===== Refs =====
  const homeContainerRef = useRef(null);
  
  // ===== 计算值 =====
  const weeklySpent = transactions.reduce((sum, t) => sum + t.amount, 0);
  const remaining = (weeklyBudget?.amount || 0) - weeklySpent;
  
  // ===== 导航函数 =====
  const navigateTo = (view, params = {}) => {
    setViewParams(params);
    setCurrentView(view);
    window.history.pushState({ view, params }, '', `#${view}`);
  };
  
  // ===== 初始化数据加载 =====
  useEffect(() => {
    const loadData = async () => {
      try {
        const cached = loadFromCache();
        if (cached) {
          if (cached.weeklyBudget) setWeeklyBudget(cached.weeklyBudget);
          if (cached.transactions) {
            setTransactions(cached.transactions);
            setViewingTransactions(cached.transactions);
          }
          if (cached.specialBudgets) setSpecialBudgets(cached.specialBudgets);
          if (cached.fixedExpenses) setFixedExpenses(cached.fixedExpenses);
          setIsDataReady(true);
        }
        
        const [budgetRes, transRes, poolRes, wishesRes, specialRes, fixedRes] = await Promise.all([
          getWeeklyBudget(weekInfo.weekKey),
          getTransactions(weekInfo.weekKey),
          getWishPool(),
          getWishes(),
          getSpecialBudgets(),
          getFixedExpenses()
        ]);
        
        if (budgetRes.success) setWeeklyBudget(budgetRes.data);
        if (transRes.success) {
          setTransactions(transRes.data);
          setViewingTransactions(transRes.data);
        }
        if (poolRes.success) setWishPoolAmount(poolRes.data.amount);
        if (wishesRes.success) setWishes(wishesRes.data);
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
        
        saveToCache({
          weeklyBudget: budgetRes.data,
          transactions: transRes.data,
          wishPoolAmount: poolRes.data?.amount,
          wishes: wishesRes.data,
          specialBudgets: specialRes.data,
          fixedExpenses: fixedRes.data
        });
        
        setIsDataReady(true);
      } catch (error) {
        console.error('数据加载失败:', error);
        setIsDataReady(true);
      }
    };
    
    loadData();
  }, [weekInfo.weekKey]);
  
  // ===== 首页就绪检测 =====
  useLayoutEffect(() => {
    if (currentView === 'home') {
      // 使用 requestAnimationFrame 确保 DOM 已渲染
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsHomeReady(true);
        });
      });
    } else {
      setIsHomeReady(false);
    }
  }, [currentView]);
  
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
  
  // ===== 小字切换动画 =====
  useEffect(() => {
    const interval = setInterval(() => {
      setSubtitleOpacity(0);
      setTimeout(() => {
        setSubtitleIndex(prev => (prev + 1) % 2);
        setSubtitleOpacity(1);
      }, 500);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  // ===== 调试模式处理 =====
  const handleDebugChange = (value) => {
    if (value === -1) {
      setIsDebugMode(false);
    } else {
      setIsDebugMode(true);
      setDebugPoolAmount(value);
    }
  };
  
  // ===== 打开记录消费弹窗 =====
  const openAddTransactionModal = () => {
    setTransactionNote('');
    setShowAddTransactionModal(true);
  };
  
  // ===== 处理记录消费 =====
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
      
      const cached = loadFromCache() || {};
      saveToCache({ ...cached, transactions: newTransactions });
    } else {
      alert('记录失败: ' + result.error);
    }
  };
  
  // ===== 刷新数据 =====
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
    const subtitles = [
      `预算 ¥${weeklyBudget?.amount?.toLocaleString() || 0}，已用 ¥${weeklySpent.toLocaleString()}`,
      `${weekInfo.month}月 第${weekInfo.weekNumber}周`
    ];
    
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@400;500;700;800&display=swap');
          .font-rounded {
            font-family: 'M PLUS Rounded 1c', sans-serif;
          }
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-8px); }
          }
          .float-animation {
            animation: float 4s ease-in-out infinite;
          }
          /* 防止返回时的布局跳动 */
          .home-container {
            min-height: 100vh;
            min-height: 100dvh;
          }
        `}</style>

        <div 
          ref={homeContainerRef} 
          className="home-container flex flex-col relative bg-gray-50"
          style={{ 
            opacity: isHomeReady ? 1 : 0.99,  // 微小变化触发重绘但不可见
            transform: 'translateZ(0)'  // 强制 GPU 加速，稳定布局
          }}
        >
          <div className="absolute top-8 right-6 z-20">
            <button 
              onClick={() => navigateTo('budgetSetup')} 
              className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm hover:shadow-md transition-all text-gray-400 hover:text-gray-600 active:scale-95"
            >
              <Settings size={20} strokeWidth={2.5} />
            </button>
          </div>
          
          <DraggableBudgetIcons
            budgets={pinnedBudgets}
            onBudgetClick={(budget) => navigateTo('specialBudgetDetail', { editingSpecialBudget: budget })}
            containerRef={homeContainerRef}
          />
          
          <div className="flex-1 flex flex-col items-center justify-center px-6">
            <div 
              className="text-center cursor-pointer active:opacity-80" 
              style={{ marginBottom: '50px' }}
              onClick={() => navigateTo('transactionList')}
            >
              <h1 
                className="font-extrabold leading-none font-rounded"
                style={{ 
                  fontSize: '36px',
                  color: colors.primary,
                }}
              >
                <span className="text-2xl text-gray-300 mr-1">¥</span>
                {remaining.toLocaleString()}
              </h1>
              <div 
                className="flex items-center gap-1 mt-3 text-gray-400 font-bold mx-auto justify-center"
                style={{ 
                  opacity: subtitleOpacity,
                  transition: 'opacity 500ms ease-in-out'
                }}
              >
                <span className="text-sm">
                  {subtitles[subtitleIndex]}
                </span>
                <ChevronRight size={16} strokeWidth={2.5} className="relative top-[0.5px]"/>
              </div>
            </div>
            
            <div className="float-animation w-full flex justify-center" style={{ maxWidth: '280px' }}>
              <BudgetCloud 
                remaining={remaining} 
                total={weeklyBudget?.amount || 0} 
                spent={weeklySpent} 
                onClick={openAddTransactionModal}
              />
            </div>
          </div>
          
          <WishPoolBar 
            poolAmount={isDebugMode ? debugPoolAmount : wishPoolAmount} 
            wishes={wishes} 
            onWishClick={(wish) => navigateTo('editWish', { editingWish: wish })} 
            onPoolClick={() => navigateTo('wishPoolDetail')} 
            debugMode={isDebugMode} 
            onDebugChange={handleDebugChange} 
          />
        </div>
        
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
      </>
    );
  };
  
  // ===== 视图路由 =====
  const renderCurrentView = () => {
    switch (currentView) {
      case 'home':
        return renderHomeView();
        
      case 'transactionList':
        return (
          <TransactionListView
            weekInfo={weekInfo}
            weeklyBudget={weeklyBudget}
            setWeeklyBudget={setWeeklyBudget}
            transactions={transactions}
            setTransactions={setTransactions}
            navigateTo={navigateTo}
            isDataReady={isDataReady}
          />
        );
        
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
            editingTransaction={viewParams.editingTransaction}
            weekInfo={weekInfo}
            transactions={transactions}
            setTransactions={setTransactions}
            viewingTransactions={viewingTransactions}
            setViewingTransactions={setViewingTransactions}
          />
        );
        
      case 'wishPoolDetail':
        return (
          <WishPoolDetailView
            wishPoolAmount={wishPoolAmount}
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
            wishPoolAmount={wishPoolAmount}
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
            specialBudgets={specialBudgets || []}
            specialBudgetItems={specialBudgetItems || {}}
            weekInfo={weekInfo}
            weeklyBudget={weeklyBudget}
            setWeeklyBudget={setWeeklyBudget}
            navigateTo={navigateTo}
            onBack={() => window.history.back()}
            isDataReady={isDataReady}
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