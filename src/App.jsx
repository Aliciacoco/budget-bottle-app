import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Settings, X, ChevronRight, ChevronLeft, Plus, Edit } from 'lucide-react';
import { getWeeklyBudget, saveWeeklyBudget, getTransactions, createTransaction, getWishes, getFixedExpenses, getWishPool, getWishPoolHistory, deleteWishPoolHistory, getSpecialBudgets, getSpecialBudgetItems, createWishPoolHistory } from './api';
import { saveToCache, loadFromCache, formatDate, formatShortDate, getWeekInfo } from './utils/helpers';
import ConfirmModal from './components/ConfirmModal';
import Calculator from './components/CalculatorModal';
import BudgetCloud from './components/BudgetCloud';
import WishPoolBar from './components/WishPoolBar';
import SkeletonHome from './components/SkeletonHome';
import AddTransactionView from './views/AddTransactionView';
import EditTransactionView from './views/EditTransactionView';
import EditExpenseView from './views/EditExpenseView';
import EditWishView from './views/EditWishView';
import WishPoolDetailView from './views/WishPoolDetailView';
import BudgetSetupView from './views/BudgetSetupView';
import SpecialBudgetDetailView from './views/SpecialBudgetDetailView';
import EditSpecialBudgetView from './views/EditSpecialBudgetView';
import { BUDGET_ICONS } from './constants/icons';

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
  const [monthlyBudget, setMonthlyBudget] = useState(3000);
  const [specialBudgets, setSpecialBudgets] = useState([]);
  const [specialBudgetItems, setSpecialBudgetItems] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isDataReady, setIsDataReady] = useState(false);
  const [isLoadingWeek, setIsLoadingWeek] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showAddTransactionModal, setShowAddTransactionModal] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [editingWish, setEditingWish] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);
  const [editingSpecialBudget, setEditingSpecialBudget] = useState(null);
  const [newBudgetAmount, setNewBudgetAmount] = useState('');
  const [newTransactionAmount, setNewTransactionAmount] = useState(0);
  const [newTransactionDescription, setNewTransactionDescription] = useState('');
  const [debugPoolAmount, setDebugPoolAmount] = useState(null);
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [isSavingBudget, setIsSavingBudget] = useState(false);
  const [isSavingTransaction, setIsSavingTransaction] = useState(false);

  const weeklySpent = useMemo(() => transactions.reduce((sum, t) => sum + t.amount, 0), [transactions]);
  const viewingWeeklySpent = useMemo(() => viewingTransactions.reduce((sum, t) => sum + t.amount, 0), [viewingTransactions]);
  const remaining = useMemo(() => (weeklyBudget?.amount || 0) - weeklySpent, [weeklyBudget, weeklySpent]);
  const viewingRemaining = useMemo(() => (viewingWeekBudget?.amount || 0) - viewingWeeklySpent, [viewingWeekBudget, viewingWeeklySpent]);
  const isCurrentWeek = viewingWeekInfo.weekKey === weekInfo.weekKey;
  const canGoNext = () => { const n = new Date(viewingWeekInfo.weekStart); n.setDate(n.getDate() + 7); return n <= new Date(); };
  const pinnedBudgets = useMemo(() => specialBudgets.filter(b => b.pinnedToHome), [specialBudgets]);

  const handleDebugChange = (amount) => { if (amount === -1) { setIsDebugMode(false); setDebugPoolAmount(null); } else { setIsDebugMode(true); setDebugPoolAmount(amount); } };

  useEffect(() => {
    const handlePopState = (event) => { const s = event.state || {}; setCurrentView(s.view || 'home'); setEditingTransaction(s.editingTransaction || null); setEditingWish(s.editingWish || null); setEditingExpense(s.editingExpense || null); setEditingSpecialBudget(s.editingSpecialBudget || null); window.scrollTo(0, 0); };
    window.addEventListener('popstate', handlePopState);
    if (window.history.state === null) window.history.replaceState({ view: 'home' }, '', window.location.href);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = useCallback((view, data = {}) => { setCurrentView(view); window.history.pushState({ view, ...data }, '', window.location.href); window.scrollTo(0, 0); if (data.editingTransaction) setEditingTransaction(data.editingTransaction); if (data.editingWish) setEditingWish(data.editingWish); if (data.editingExpense) setEditingExpense(data.editingExpense); if (data.editingSpecialBudget) setEditingSpecialBudget(data.editingSpecialBudget); if (view === 'transactionList') { setViewingWeekInfo(weekInfo); setViewingWeekBudget(weeklyBudget); setViewingTransactions(transactions); } }, [weekInfo, weeklyBudget, transactions]);

  const handleWishFulfilled = useCallback(async (wishName, amount, wishId) => { try { await createWishPoolHistory('WISH-' + wishId + '-' + Date.now(), 0, 0, -amount, true, wishName, wishId); const poolResult = await getWishPool(); if (poolResult.success) setWishPoolAmount(poolResult.data.amount); } catch (error) { console.error('记录心愿扣除失败:', error); } }, []);
  const handleWishRevoked = useCallback(async (wishId) => { try { const historyResult = await getWishPoolHistory(); if (historyResult.success) { const targetRecord = historyResult.data.find(h => h.wishId === wishId && h.isDeduction); if (targetRecord && deleteWishPoolHistory) { await deleteWishPoolHistory(targetRecord.id); const poolResult = await getWishPool(); if (poolResult.success) setWishPoolAmount(poolResult.data.amount); } } } catch (error) { console.error('删除扣除记录失败:', error); } }, []);
  const refreshSpecialBudgets = useCallback(async () => { const result = await getSpecialBudgets(); if (result.success) { setSpecialBudgets(result.data); const itemsMap = {}; await Promise.all(result.data.map(async (budget) => { const itemsResult = await getSpecialBudgetItems(budget.id); if (itemsResult.success) itemsMap[budget.id] = itemsResult.data; })); setSpecialBudgetItems(prev => ({ ...prev, ...itemsMap })); } }, []);
  const refreshFixedExpenses = useCallback(async () => { const result = await getFixedExpenses(); if (result.success) setFixedExpenses(result.data); }, []);

  const loadAllData = useCallback(async () => { setIsDataReady(false); const savedMonthlyBudget = localStorage.getItem('monthly_budget'); if (savedMonthlyBudget) setMonthlyBudget(parseFloat(savedMonthlyBudget)); const cached = loadFromCache(); if (cached && cached.weekKey === weekInfo.weekKey) { setWeeklyBudget(cached.weeklyBudget); setViewingWeekBudget(cached.weeklyBudget); setTransactions(cached.transactions || []); setViewingTransactions(cached.transactions || []); setWishes(cached.wishes || []); setFixedExpenses(cached.fixedExpenses || []); setWishPoolAmount(cached.wishPoolAmount || 0); setIsLoading(false); } try { const [budgetResult, transResult, wishResult, expenseResult, poolResult, specialBudgetResult] = await Promise.all([getWeeklyBudget(weekInfo.weekKey), getTransactions(weekInfo.weekKey), getWishes(), getFixedExpenses(), getWishPool(), getSpecialBudgets()]); const newData = { weekKey: weekInfo.weekKey, weeklyBudget: budgetResult.success ? budgetResult.data : null, transactions: transResult.success ? transResult.data : [], wishes: wishResult.success ? wishResult.data : [], fixedExpenses: expenseResult.success ? expenseResult.data : [], wishPoolAmount: poolResult.success ? (poolResult.data?.amount || 0) : 0 }; if (budgetResult.success) { setWeeklyBudget(budgetResult.data); setViewingWeekBudget(budgetResult.data); } if (transResult.success) { setTransactions(transResult.data); setViewingTransactions(transResult.data); } if (wishResult.success) setWishes(wishResult.data); if (expenseResult.success) setFixedExpenses(expenseResult.data); if (poolResult.success) setWishPoolAmount(poolResult.data?.amount || 0); if (specialBudgetResult.success) { setSpecialBudgets(specialBudgetResult.data); const itemsMap = {}; await Promise.all(specialBudgetResult.data.map(async (budget) => { const itemsResult = await getSpecialBudgetItems(budget.id); if (itemsResult.success) itemsMap[budget.id] = itemsResult.data; })); setSpecialBudgetItems(itemsMap); } saveToCache(newData); setIsDataReady(true); if (budgetResult.success && !budgetResult.data) setShowBudgetModal(true); } catch (error) { console.error('加载数据失败:', error); setIsDataReady(true); } finally { setIsLoading(false); } }, [weekInfo.weekKey]);
  useEffect(() => { loadAllData(); }, [loadAllData]);

  const loadWeekData = async (targetWeekInfo) => { setIsLoadingWeek(true); try { const [budgetResult, transResult] = await Promise.all([getWeeklyBudget(targetWeekInfo.weekKey), getTransactions(targetWeekInfo.weekKey)]); if (budgetResult.success) setViewingWeekBudget(budgetResult.data); if (transResult.success) setViewingTransactions(transResult.data); } catch (error) { console.error('加载周数据失败:', error); } finally { setIsLoadingWeek(false); } };
  const goToPreviousWeek = () => { const prevWeekStart = new Date(viewingWeekInfo.weekStart); prevWeekStart.setDate(prevWeekStart.getDate() - 7); const newWeekInfo = getWeekInfo(prevWeekStart); setViewingWeekInfo(newWeekInfo); loadWeekData(newWeekInfo); };
  const goToNextWeek = () => { const nextWeekStart = new Date(viewingWeekInfo.weekStart); nextWeekStart.setDate(nextWeekStart.getDate() + 7); if (nextWeekStart > new Date()) return; const newWeekInfo = getWeekInfo(nextWeekStart); setViewingWeekInfo(newWeekInfo); loadWeekData(newWeekInfo); };

  const handleSetBudget = async () => { const amount = parseFloat(newBudgetAmount); if (!amount || amount <= 0 || isSavingBudget || !isDataReady) return; setIsSavingBudget(true); try { const result = await saveWeeklyBudget(weekInfo.weekKey, amount); if (result.success) { setWeeklyBudget(result.data); setViewingWeekBudget(result.data); setShowBudgetModal(false); setNewBudgetAmount(''); const cached = loadFromCache() || {}; saveToCache({ ...cached, weeklyBudget: result.data }); } else { alert('保存失败: ' + result.error); } } catch (error) { alert('保存失败，请重试'); } finally { setIsSavingBudget(false); } };
  const handleQuickAddTransaction = async () => { if (!newTransactionAmount || isSavingTransaction) return; setIsSavingTransaction(true); try { const now = new Date(); const timeStr = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0'); const result = await createTransaction(weekInfo.weekKey, formatDate(now), timeStr, newTransactionAmount, newTransactionDescription); if (result.success) { const newTransactions = [...transactions, result.data]; setTransactions(newTransactions); setViewingTransactions([...viewingTransactions, result.data]); setShowAddTransactionModal(false); setNewTransactionAmount(0); setNewTransactionDescription(''); const cached = loadFromCache() || {}; saveToCache({ ...cached, transactions: newTransactions }); } else { alert('记录失败: ' + result.error); } } catch (error) { alert('记录失败，请重试'); } finally { setIsSavingTransaction(false); } };
  const openAddTransactionModal = () => { setNewTransactionAmount(0); setNewTransactionDescription(''); setShowAddTransactionModal(true); setTimeout(() => setShowCalculator(true), 100); };

  if (isLoading) return <SkeletonHome />;

  const renderTransactionListView = () => {
    const groupedByDate = viewingTransactions.reduce((acc, trans) => { const date = trans.date; if (!acc[date]) acc[date] = []; acc[date].push(trans); return acc; }, {});
    const today = formatDate(new Date()); const yesterday = formatDate(new Date(Date.now() - 86400000));
    const getDateLabel = (date) => { if (date === today) return '今天'; if (date === yesterday) return '昨天'; return date; };
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <button onClick={() => window.history.back()} className="flex items-center gap-2 text-gray-600 mb-4 active:scale-95"><ChevronLeft size={20} />返回</button>
          <div className="flex items-center justify-between mb-4 bg-white rounded-2xl p-3">
            <button onClick={goToPreviousWeek} className="p-2 text-gray-600 hover:bg-gray-100 rounded-full active:scale-95"><ChevronLeft size={24} /></button>
            <div className="text-center"><h2 className="text-base font-bold text-gray-800">{viewingWeekInfo.year}年{viewingWeekInfo.month}月 第{viewingWeekInfo.weekNumber}周</h2><p className="text-xs text-gray-400">{formatShortDate(viewingWeekInfo.weekStart)} - {formatShortDate(viewingWeekInfo.weekEnd)}</p>{!isCurrentWeek && <span className="text-xs text-blue-500">历史周</span>}</div>
            <button onClick={goToNextWeek} disabled={!canGoNext()} className={'p-2 rounded-full active:scale-95 ' + (canGoNext() ? 'text-gray-600 hover:bg-gray-100' : 'text-gray-300')}><ChevronRight size={24} /></button>
          </div>
          <div className="bg-white rounded-2xl p-4 mb-6">{isLoadingWeek ? (<div className="flex justify-center py-4"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-800"></div></div>) : (<div className="flex items-center justify-between"><div className="flex-1"><p className="text-xs text-gray-500 mb-1">预算</p><div className="flex items-center gap-1"><span className="text-lg font-bold text-gray-800">¥{viewingWeekBudget?.amount?.toLocaleString() || 0}</span>{isCurrentWeek && <button onClick={() => setShowBudgetModal(true)} className="p-1 text-gray-400 hover:text-gray-600 active:scale-95"><Edit size={14} /></button>}</div></div><div className="flex-1 text-center"><p className="text-xs text-gray-500 mb-1">支出</p><div className="flex items-center justify-center gap-1"><span className="text-lg font-bold text-red-500">¥{viewingWeeklySpent.toLocaleString()}</span>{isCurrentWeek && <button onClick={() => navigateTo('addTransaction')} className="p-1 text-gray-400 hover:text-gray-600 active:scale-95"><Plus size={14} /></button>}</div></div><div className="flex-1 text-right"><p className="text-xs text-gray-500 mb-1">剩余</p><span className={'text-lg font-bold ' + (viewingRemaining >= 0 ? 'text-green-500' : 'text-red-500')}>¥{viewingRemaining.toLocaleString()}</span></div></div>)}</div>
          {isLoadingWeek ? (<div className="bg-white rounded-2xl p-12 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800 mx-auto"></div><p className="text-gray-400 mt-4">加载中...</p></div>) : Object.keys(groupedByDate).length === 0 ? (<div className="bg-white rounded-2xl p-12 text-center"><p className="text-gray-400">暂无消费记录</p></div>) : (<div className="space-y-4">{Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a)).map(date => (<div key={date}><h3 className="text-sm text-gray-500 mb-2">{getDateLabel(date)}</h3><div className="space-y-2">{groupedByDate[date].map(trans => (<div key={trans.id} className="bg-white rounded-xl p-4 flex justify-between items-center"><span className="text-gray-800">{trans.description || '消费'}</span><div className="flex items-center gap-3"><span className="font-semibold text-red-500">-¥{trans.amount}</span>{isCurrentWeek && <button onClick={() => navigateTo('editTransaction', { editingTransaction: trans })} className="text-gray-400 active:scale-95"><Edit size={16} /></button>}</div></div>))}</div></div>))}</div>)}
        </div>
        {showBudgetModal && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"><div className="bg-white rounded-2xl p-6 mx-4 w-full max-w-sm"><h2 className="text-xl font-bold text-gray-800 mb-2">本周预算</h2><p className="text-sm text-gray-500 mb-4">{weekInfo.year}年{weekInfo.month}月 第{weekInfo.weekNumber}周</p><div className="relative mb-4"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-gray-400">¥</span><input type="number" value={newBudgetAmount} onChange={(e) => setNewBudgetAmount(e.target.value)} placeholder={weeklyBudget?.amount?.toString() || '600'} className="w-full pl-10 pr-4 py-4 border-2 border-gray-200 rounded-xl text-xl font-bold focus:border-gray-400 focus:outline-none" autoFocus disabled={isSavingBudget} /></div><p className="text-xs text-gray-400 mb-6 text-center">本周余额将自动流入心愿池</p><div className="flex gap-3"><button onClick={() => setShowBudgetModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium active:scale-95" disabled={isSavingBudget}>取消</button><button onClick={handleSetBudget} disabled={isSavingBudget || !isDataReady} className="flex-1 py-3 bg-gray-800 text-white rounded-xl font-medium active:scale-95 disabled:bg-gray-400">{isSavingBudget ? '保存中...' : '确认'}</button></div></div></div>)}
      </div>
    );
  };

  const renderHomeView = () => {
    const cssStyle = '.scrollbar-hide::-webkit-scrollbar { display: none; } .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; } @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } } .float-animation { animation: float 3s ease-in-out infinite; } @keyframes bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } } .bob-animation { animation: bob 2s ease-in-out infinite; }';
    return (
      <>
        <style>{cssStyle}</style>
        <div className="min-h-screen bg-gradient-to-b from-cyan-50 to-white flex flex-col">
          <div className="absolute top-8 right-6 z-10"><button onClick={() => navigateTo('budgetSetup')} className="p-2 text-gray-500 hover:bg-white hover:bg-opacity-50 rounded-full active:scale-95"><Settings size={20} /></button></div>
          <div className="flex-1 flex flex-col items-center justify-center px-6">
            <div className="text-center mb-4"><h1 className="text-xl font-bold text-gray-800">{weekInfo.month}月 第{weekInfo.weekNumber}周</h1><button onClick={() => navigateTo('transactionList')} className="flex items-center gap-1 mt-1 text-gray-500 hover:text-cyan-600 transition-colors active:scale-[0.98] mx-auto"><span>预算 ¥{weeklyBudget?.amount?.toLocaleString() || 0}，已用 ¥{weeklySpent.toLocaleString()}</span><ChevronRight size={16} /></button></div>
            <div className="float-animation"><BudgetCloud remaining={remaining} total={weeklyBudget?.amount || 0} spent={weeklySpent} onClick={openAddTransactionModal} /></div>
          </div>
          {pinnedBudgets.length > 0 && (<div className="px-6 pb-2"><div className="flex justify-center gap-6">{pinnedBudgets.map((budget, index) => { const iconConfig = BUDGET_ICONS[budget.icon] || BUDGET_ICONS.other; const IconComponent = iconConfig.icon; return (<button key={budget.id} onClick={() => navigateTo('specialBudgetDetail', { editingSpecialBudget: budget })} className="bob-animation flex flex-col items-center active:scale-95" style={{ animationDelay: (index * 0.2) + 's' }}><div className="w-11 h-11 rounded-xl flex items-center justify-center shadow-md" style={{ backgroundColor: iconConfig.color }}><IconComponent size={22} className="text-white" /></div><span className="text-xs text-gray-600 mt-1.5 font-medium">{budget.name}</span></button>); })}</div></div>)}
          <WishPoolBar poolAmount={isDebugMode ? debugPoolAmount : wishPoolAmount} wishes={wishes} onWishClick={(wish) => navigateTo('editWish', { editingWish: wish })} onPoolClick={() => navigateTo('wishPoolDetail')} debugMode={isDebugMode} onDebugChange={handleDebugChange} />
        </div>
        {showBudgetModal && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"><div className="bg-white rounded-2xl p-6 mx-4 w-full max-w-sm"><h2 className="text-xl font-bold text-gray-800 mb-2">本周预算</h2><p className="text-sm text-gray-500 mb-4">{weekInfo.year}年{weekInfo.month}月 第{weekInfo.weekNumber}周</p><div className="relative mb-4"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-gray-400">¥</span><input type="number" value={newBudgetAmount} onChange={(e) => setNewBudgetAmount(e.target.value)} placeholder={weeklyBudget?.amount?.toString() || '600'} className="w-full pl-10 pr-4 py-4 border-2 border-gray-200 rounded-xl text-xl font-bold focus:border-gray-400 focus:outline-none" autoFocus disabled={isSavingBudget} /></div><p className="text-xs text-gray-400 mb-6 text-center">本周余额将自动流入心愿池</p><div className="flex gap-3"><button onClick={() => setShowBudgetModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium active:scale-95" disabled={isSavingBudget}>取消</button><button onClick={handleSetBudget} disabled={isSavingBudget || !isDataReady} className="flex-1 py-3 bg-gray-800 text-white rounded-xl font-medium active:scale-95 disabled:bg-gray-400">{isSavingBudget ? '保存中...' : (isDataReady ? '确认' : '加载中...')}</button></div></div></div>)}
        {showAddTransactionModal && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"><div className="bg-white rounded-2xl p-6 mx-4 w-full max-w-sm"><div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold text-gray-800">记录消费</h2><button onClick={() => { setShowAddTransactionModal(false); setShowCalculator(false); setNewTransactionAmount(0); setNewTransactionDescription(''); }} className="text-gray-400" disabled={isSavingTransaction}><X size={24} /></button></div><div className="space-y-4"><div><label className="block text-gray-600 mb-2">金额</label><div className="relative cursor-pointer" onClick={() => setShowCalculator(true)}><span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-gray-400">¥</span><div className="w-full pl-10 pr-4 py-4 border-2 border-cyan-400 rounded-xl text-xl font-bold bg-gray-50 text-cyan-500">{newTransactionAmount || '0.00'}</div><span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">点击输入</span></div></div><div><label className="block text-gray-600 mb-2">备注（可选）</label><input type="text" value={newTransactionDescription} onChange={(e) => setNewTransactionDescription(e.target.value)} placeholder="例如：超市、外卖..." className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-cyan-400 focus:outline-none" disabled={isSavingTransaction} /></div><button onClick={handleQuickAddTransaction} disabled={!newTransactionAmount || isSavingTransaction} className="w-full py-4 bg-cyan-500 text-white rounded-xl font-medium disabled:bg-gray-300 active:scale-95">{isSavingTransaction ? '保存中...' : '记录'}</button></div></div></div>)}
        {showCalculator && <Calculator value={newTransactionAmount} onChange={(value) => setNewTransactionAmount(value)} onClose={() => setShowCalculator(false)} />}
      </>
    );
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'home': return renderHomeView();
      case 'transactionList': return renderTransactionListView();
      case 'addTransaction': return <AddTransactionView weekInfo={weekInfo} transactions={transactions} setTransactions={setTransactions} viewingTransactions={viewingTransactions} setViewingTransactions={setViewingTransactions} />;
      case 'editTransaction': return <EditTransactionView key={editingTransaction?.id} editingTransaction={editingTransaction} weekInfo={weekInfo} transactions={transactions} setTransactions={setTransactions} viewingTransactions={viewingTransactions} setViewingTransactions={setViewingTransactions} />;
      case 'editExpense': return <EditExpenseView key={editingExpense?.id || 'new'} editingExpense={editingExpense} fixedExpenses={fixedExpenses} setFixedExpenses={setFixedExpenses} refreshFixedExpenses={refreshFixedExpenses} />;
      case 'editWish': return <EditWishView key={editingWish?.id || 'new'} editingWish={editingWish} wishes={wishes} setWishes={setWishes} wishPoolAmount={wishPoolAmount} setWishPoolAmount={setWishPoolAmount} onWishFulfilled={handleWishFulfilled} onWishRevoked={handleWishRevoked} />;
      case 'wishPoolDetail': return <WishPoolDetailView wishPoolAmount={wishPoolAmount} wishes={wishes} onWishClick={(wish) => navigateTo('editWish', { editingWish: wish })} onAddWishClick={() => navigateTo('editWish', { editingWish: { id: null } })} refreshData={loadAllData} />;
      case 'budgetSetup': return <BudgetSetupView monthlyBudget={monthlyBudget} setMonthlyBudget={setMonthlyBudget} fixedExpenses={fixedExpenses} setFixedExpenses={setFixedExpenses} specialBudgets={specialBudgets} specialBudgetItems={specialBudgetItems} weekInfo={weekInfo} weeklyBudget={weeklyBudget} setWeeklyBudget={setWeeklyBudget} navigateTo={navigateTo} onBack={() => window.history.back()} />;
      case 'specialBudgetDetail': return <SpecialBudgetDetailView key={editingSpecialBudget?.id} budget={editingSpecialBudget} items={specialBudgetItems[editingSpecialBudget?.id] || []} setItems={setSpecialBudgetItems} navigateTo={navigateTo} refreshBudgets={refreshSpecialBudgets} />;
      case 'editSpecialBudget': return <EditSpecialBudgetView key={editingSpecialBudget?.id || 'new'} budget={editingSpecialBudget} specialBudgets={specialBudgets} setSpecialBudgets={setSpecialBudgets} refreshBudgets={refreshSpecialBudgets} />;
      default: return renderHomeView();
    }
  };

  return <div className="font-sans">{renderCurrentView()}</div>;
};

export default BudgetBottleApp;