// 交易记录列表视图 - 新设计（灰色背景 + 透明固定导航栏）

import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, Edit2, Calendar, ArrowLeft } from 'lucide-react';
import { getWeeklyBudget, getTransactions, saveWeeklyBudget, createTransaction } from '../api';
import { loadFromCache, saveToCache, formatDate, formatShortDate, getWeekInfo } from '../utils/helpers';
import Calculator from '../components/CalculatorModal';

// 导入设计系统组件
import { 
  PageContainer, 
  DuoCard,
  IconButton,
  EmptyState,
  LoadingOverlay
} from '../components/design-system';

// --- 静态云朵组件 ---
const BudgetCloud = ({ remaining, total, hasBudget }) => {
  const cloudPathData = "M170.621 38C201.558 38 228.755 53.2859 244.555 76.4834L245.299 77.5938L245.306 77.6035C247.53 81.0058 251.079 83.3252 255.11 84.0352L255.502 84.0986L255.511 84.0996C299.858 90.8163 334 127.546 334 172.283C334 221.589 294.443 261.625 245.621 261.625H104.896L104.79 261.619C61.1843 259.33 26 226.502 26 185.76C26 154.771 46.4474 128.375 75.3525 116.578L75.3594 116.575C79.8465 114.754 83.1194 110.742 84.1465 105.889C92.3483 67.057 128.005 38.0001 170.621 38Z";
  const percent = total > 0 ? Math.max(0, Math.min(1, remaining / total)) : 0;
  const liquidColor = remaining >= 0 ? '#06B6D4' : '#EF4444';
  const waterHeight = 224 * percent;
  const waterY = 262 - waterHeight; 

  return (
    <div className="w-[100px] aspect-[308/224] mx-auto">
      {!hasBudget ? (
        <svg viewBox="26 38 308 224" className="w-full h-full drop-shadow-sm opacity-50">
           <path d={cloudPathData} fill="none" stroke="#D1D5DB" strokeWidth="6" strokeDasharray="12 8" />
           <text x="180" y="160" textAnchor="middle" fill="#9CA3AF" fontSize="36" fontWeight="bold">?</text>
        </svg>
      ) : (
        <svg viewBox="26 38 308 224" className="w-full h-full drop-shadow-lg">
          <defs>
            <clipPath id="cloudShapeList">
              <path d={cloudPathData} />
            </clipPath>
          </defs>
          <path d={cloudPathData} fill="#F3F4F6" />
          <rect 
            x="26" 
            y={waterY} 
            width="308" 
            height={waterHeight} 
            fill={liquidColor} 
            clipPath="url(#cloudShapeList)"
            className="transition-all duration-700 ease-out" 
          />
          <path d={cloudPathData} fill="white" opacity="0.15" style={{mixBlendMode: 'overlay'}} pointerEvents="none"/>
        </svg>
      )}
    </div>
  );
};

const TransactionListView = ({
  weekInfo,
  weeklyBudget,
  setWeeklyBudget,
  transactions,
  setTransactions,
  navigateTo,
  isDataReady = true,
}) => {
  const [viewingWeekInfo, setViewingWeekInfo] = useState(weekInfo);
  const [viewingWeekBudget, setViewingWeekBudget] = useState(weeklyBudget);
  const [viewingTransactions, setViewingTransactions] = useState(transactions);
  const [isLoadingWeek, setIsLoadingWeek] = useState(false);
  const [showBudgetCalculator, setShowBudgetCalculator] = useState(false);
  const [showExpenseCalculator, setShowExpenseCalculator] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const viewingWeeklySpent = useMemo(() => 
    viewingTransactions.reduce((sum, t) => sum + t.amount, 0), 
    [viewingTransactions]
  );
  
  const viewingRemaining = (viewingWeekBudget?.amount || 0) - viewingWeeklySpent;
  const isCurrentWeek = viewingWeekInfo.weekKey === weekInfo.weekKey;
  const hasBudget = viewingWeekBudget && viewingWeekBudget.amount > 0;

  const groupedTransactions = useMemo(() => {
    const groups = viewingTransactions.reduce((acc, trans) => {
      const date = trans.date;
      if (!acc[date]) acc[date] = [];
      acc[date].push(trans);
      return acc;
    }, {});

    Object.keys(groups).forEach(date => {
      groups[date].sort((a, b) => {
        if (a.time && b.time) return b.time.localeCompare(a.time);
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return timeB - timeA;
      });
    });

    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [viewingTransactions]);

  const canGoNext = () => {
    const n = new Date(viewingWeekInfo.weekStart);
    n.setDate(n.getDate() + 7);
    return n <= new Date();
  };

  const loadWeekData = async (targetWeekInfo) => {
    setIsLoadingWeek(true);
    try {
      if (targetWeekInfo.weekKey === weekInfo.weekKey) {
        setViewingWeekBudget(weeklyBudget);
        setViewingTransactions(transactions);
        setIsLoadingWeek(false);
        return;
      }
      
      const [budgetResult, transResult] = await Promise.all([
        getWeeklyBudget(targetWeekInfo.weekKey),
        getTransactions(targetWeekInfo.weekKey)
      ]);
      if (budgetResult.success) setViewingWeekBudget(budgetResult.data);
      if (transResult.success) setViewingTransactions(transResult.data);
    } catch (error) {
      console.error('加载周数据失败:', error);
    } finally {
      setIsLoadingWeek(false);
    }
  };

  const changeWeek = (direction) => {
    const baseDate = new Date(viewingWeekInfo.weekStart);
    baseDate.setDate(baseDate.getDate() + (direction === 'next' ? 7 : -7));
    if (direction === 'next' && baseDate > new Date()) return;
    const newWeekInfo = getWeekInfo(baseDate);
    setViewingWeekInfo(newWeekInfo);
    loadWeekData(newWeekInfo);
  };

  const handleSetBudget = async (amount) => {
    if (!amount || amount <= 0 || !isDataReady) return;
    
    setIsSaving(true);
    try {
      const result = await saveWeeklyBudget(weekInfo.weekKey, amount);
      if (result.success) {
        if (isCurrentWeek) {
          setWeeklyBudget(result.data);
          const cached = loadFromCache() || {};
          saveToCache({ ...cached, weeklyBudget: result.data });
        }
        setViewingWeekBudget(result.data);
        setShowBudgetCalculator(false);
      } else {
        alert('保存失败: ' + result.error);
      }
    } catch (error) {
      alert('保存失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddExpense = async (amount, note) => {
    if (!amount || amount <= 0) return;
    
    setIsSaving(true);
    try {
      const now = new Date();
      const result = await createTransaction(
        weekInfo.weekKey,
        formatDate(now),
        `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
        amount,
        note || '消费'
      );
      
      if (result.success) {
        const newTransactions = [result.data, ...transactions];
        setTransactions(newTransactions);
        setViewingTransactions(newTransactions);
        setShowExpenseCalculator(false);
      } else {
        alert('记录失败: ' + result.error);
      }
    } catch (error) {
      alert('记录失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  const today = formatDate(new Date());
  const yesterday = formatDate(new Date(Date.now() - 86400000));

  const getDateLabel = (date) => {
    if (date === today) return '今天';
    if (date === yesterday) return '昨天';
    return date;
  };

  return (
    <PageContainer bg="gray" className="relative pb-8">
      {/* 固定透明导航栏 */}
      <div className="fixed top-0 left-0 right-0 z-20 px-6 pt-4 pb-2 pointer-events-none">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <button 
            onClick={() => window.history.back()}
            className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm hover:shadow-md transition-shadow text-gray-400 hover:text-gray-600 pointer-events-auto active:scale-95"
          >
            <ArrowLeft size={24} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* 顶部内容区 - 需要留出导航栏空间 */}
      <div className="pt-20 px-6 max-w-lg mx-auto space-y-5">
        
        {/* 周选择器 */}
        <div className="bg-white rounded-3xl p-4 flex items-center justify-between shadow-sm">
          <button 
            onClick={() => changeWeek('prev')}
            className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 active:scale-95 transition-all"
          >
            <ChevronLeft size={24} strokeWidth={2.5} />
          </button>
          
          <div className="text-center">
            <h2 className="text-lg font-extrabold text-gray-700 flex items-center justify-center gap-2">
              {viewingWeekInfo.year}年 {viewingWeekInfo.month}月
              {!isCurrentWeek && (
                <span className="text-xs bg-cyan-100 text-cyan-600 px-2 py-0.5 rounded-full font-bold">历史</span>
              )}
            </h2>
            <p className="text-sm text-gray-400 font-bold mt-1">
              第 {viewingWeekInfo.weekNumber} 周 · {formatShortDate(viewingWeekInfo.weekStart)} - {formatShortDate(viewingWeekInfo.weekEnd)}
            </p>
          </div>
          
          <button 
            onClick={() => changeWeek('next')}
            disabled={!canGoNext()}
            className={`w-10 h-10 rounded-xl flex items-center justify-center active:scale-95 transition-all ${
              canGoNext() ? 'bg-gray-100 text-gray-500 hover:bg-gray-200' : 'bg-gray-50 text-gray-200 cursor-not-allowed'
            }`}
          >
            <ChevronRight size={24} strokeWidth={2.5} />
          </button>
        </div>

        {/* 预算概览卡片 */}
        <div className={`bg-white rounded-3xl p-5 shadow-sm transition-opacity duration-300 ${isLoadingWeek ? 'opacity-60' : 'opacity-100'}`}>
          <div className="flex items-center gap-6">
            <div className="flex-shrink-0">
              <BudgetCloud 
                remaining={viewingRemaining} 
                total={viewingWeekBudget?.amount || 0} 
                hasBudget={hasBudget} 
              />
            </div>
            
            <div className="flex-1 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 font-bold text-sm">本周预算</span>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-extrabold text-gray-700">
                    ¥{viewingWeekBudget?.amount?.toLocaleString() || 0}
                  </span>
                  {isCurrentWeek && (
                    <button 
                      onClick={() => setShowBudgetCalculator(true)}
                      className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center text-cyan-500 hover:bg-cyan-200 active:scale-95 transition-all"
                    >
                      <Edit2 size={14} strokeWidth={2.5} />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-400 font-bold text-sm">已支出</span>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-extrabold text-red-500">
                    ¥{viewingWeeklySpent.toLocaleString()}
                  </span>
                  {isCurrentWeek && (
                    <button 
                      onClick={() => setShowExpenseCalculator(true)}
                      className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-500 hover:bg-red-200 active:scale-95 transition-all"
                    >
                      <Plus size={16} strokeWidth={3} />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-2 border-t-2 border-gray-100">
                <span className="text-gray-400 font-bold text-sm">剩余额度</span>
                <span className={`text-xl font-extrabold ${viewingRemaining >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  ¥{viewingRemaining.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 交易列表 */}
        <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-extrabold text-gray-700">消费记录</h2>
          </div>
          
          <div className="p-4">
            {isLoadingWeek ? (
              <div className="py-12 text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-cyan-500 mx-auto"></div>
                <p className="text-gray-400 font-bold mt-4">加载中...</p>
              </div>
            ) : groupedTransactions.length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <Calendar size={32} className="text-gray-300" />
                </div>
                <p className="text-gray-400 font-bold mb-2">本周还没有消费记录</p>
                {isCurrentWeek && (
                  <button 
                    onClick={() => setShowExpenseCalculator(true)}
                    className="mt-4 px-6 py-3 bg-cyan-500 text-white rounded-2xl font-bold shadow-sm hover:bg-cyan-400 active:scale-95 transition-all"
                  >
                    <Plus size={18} className="inline mr-1" />记一笔
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {groupedTransactions.map(([date, dayTransactions]) => (
                  <div key={date}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-bold text-gray-400">{getDateLabel(date)}</h3>
                      <span className="text-xs font-bold text-gray-300">
                        共 ¥{dayTransactions.reduce((acc, t) => acc + t.amount, 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {dayTransactions.map(trans => (
                        <div 
                          key={trans.id} 
                          onClick={isCurrentWeek ? () => navigateTo('editTransaction', { editingTransaction: trans }) : undefined}
                          className={`bg-gray-50 rounded-2xl p-4 flex justify-between items-center ${
                            isCurrentWeek ? 'cursor-pointer active:bg-gray-100 active:scale-[0.99] transition-all' : ''
                          }`}
                        >
                          <div>
                            <span className="font-bold text-gray-700">{trans.description || '消费'}</span>
                            <span className="text-xs text-gray-400 ml-2">{trans.time}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-red-500">-¥{trans.amount.toLocaleString()}</span>
                            {isCurrentWeek && <ChevronRight size={18} className="text-gray-300" strokeWidth={2.5} />}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 预算计算器 */}
      {showBudgetCalculator && (
        <Calculator
          value={viewingWeekBudget?.amount || 0}
          onChange={(amount) => handleSetBudget(amount)}
          onClose={() => setShowBudgetCalculator(false)}
          title="设置本周预算"
          showNote={false}
        />
      )}

      {/* 消费计算器 */}
      {showExpenseCalculator && (
        <Calculator
          value={0}
          onChange={(amount, note) => handleAddExpense(amount, note)}
          onClose={() => setShowExpenseCalculator(false)}
          title="记录消费"
          showNote={true}
        />
      )}

      <LoadingOverlay isLoading={isSaving} />
    </PageContainer>
  );
};

export default TransactionListView;