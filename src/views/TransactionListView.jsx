// TransactionListView.jsx
// 优化：按钮统一化 (色块+图标风格)，更符合参考图
// 修复：没有数据的历史周显示虚线云朵

import React, { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar, Edit3 } from 'lucide-react';
import { getWeeklyBudget, getTransactions, saveWeeklyBudget, createTransaction } from '../apiSelector';
import { loadFromCache, saveToCache, formatDate, getWeekInfo } from '../utils/helpers';
import Calculator from '../components/CalculatorModal';
import BudgetCloud from '../components/BudgetCloud';

// 导入设计系统组件
import { 
  PageContainer, 
  ContentArea,
  ListGroup,
  EmptyState,
  LoadingOverlay,
  colors,
} from '../components/design-system';

// --- 虚线云朵占位符（使用和 BudgetCloud 相同的路径） ---
const EmptyCloudPlaceholder = () => {
  // 和 BudgetCloud 保持一致的尺寸
  const displayW = 320;
  const displayH = 277;
  
  // BudgetCloud 的云朵路径
  const cloudPath = "M141.872 33C167.933 33.0001 190.742 46.6446 203.696 67.1777C206.236 71.2314 210.326 73.9341 214.924 74.6494C251.805 80.4783 280 112.298 280 150.821C280 193.451 247.233 228.001 206.872 228.001H85C48.728 226.014 20 197.611 20 163.009C20.0001 136.673 36.6628 113.994 60.6152 103.794C65.6191 101.674 69.2007 97.0373 70.3184 91.5264C77.0749 58.1431 106.515 33 141.872 33Z";
  
  return (
    <div style={{ width: displayW, height: displayH, position: 'relative' }}>
      <svg 
        width={displayW}
        height={displayH}
        viewBox="0 0 300 260"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* 虚线云朵边框 - 使用更深的颜色 */}
        <path 
          d={cloudPath}
          stroke={colors.gray[300]} 
          strokeWidth="4"
          strokeDasharray="12 8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </div>
  );
};

// --- 紧凑日期格式 ---
const formatCompactDate = (date) => {
  const d = new Date(date);
  return `${d.getMonth() + 1}.${d.getDate()}`;
};

// --- 周选择器组件 ---
const WeekSelector = ({ weekInfo, onPrev, onNext, canGoNext, isLoading }) => {
  const dateRangeText = `${formatCompactDate(weekInfo.weekStart)}-${formatCompactDate(weekInfo.weekEnd)}`;
  const weekLabel = `${weekInfo.isoYear || weekInfo.year}年第${weekInfo.isoWeekNumber || weekInfo.weekNumber}周`;
  
  return (
    <div className="bg-white rounded-2xl border-b-4 border-gray-200 flex items-center overflow-hidden border border-gray-100">
      <button 
        onClick={onPrev}
        disabled={isLoading}
        className="px-3 py-3 text-gray-300 hover:text-gray-400 hover:bg-gray-50 active:bg-gray-100 transition-all disabled:opacity-50"
      >
        <ChevronLeft size={20} strokeWidth={2} />
      </button>
      <div className="px-3 py-2 text-center min-w-[85px]">
        <p className="text-base font-extrabold text-gray-600 leading-tight">{dateRangeText}</p>
        <p className="text-xs text-gray-400 mt-0.5">{weekLabel}</p>
      </div>
      <button 
        onClick={onNext}
        disabled={!canGoNext || isLoading}
        className={`px-3 py-3 transition-all ${
          canGoNext && !isLoading ? 'text-gray-300 hover:text-gray-500 hover:bg-gray-50 active:bg-gray-100' : 'text-gray-200 cursor-not-allowed'
        }`}
      >
        <ChevronRight size={20} strokeWidth={2} />
      </button>
    </div>
  );
};

// --- 消费记录列表项 ---
const TransactionItem = ({ description, time, amount, onClick, showArrow = true }) => (
  <button
    onClick={onClick}
    className="w-full rounded-[16px] px-5 py-4 flex items-center justify-between active:scale-[0.99] active:bg-gray-200 transition-all"
    style={{ backgroundColor: colors.gray[100] }}
  >
    <div className="text-left">
      <p className="text-gray-800 font-bold">{description}</p>
      <p className="text-gray-400 text-xs mt-0.5">{time}</p>
    </div>
    <div className="flex items-center gap-2">
      <span className="font-extrabold text-red-500 text-lg">¥{amount.toLocaleString()}</span>
      {showArrow && <ChevronRight size={18} className="text-gray-300" strokeWidth={2} />}
    </div>
  </button>
);

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

  useEffect(() => {
    if (viewingWeekInfo.weekKey === weekInfo.weekKey) {
      setViewingWeekBudget(weeklyBudget);
      setViewingTransactions(transactions);
    }
  }, [weeklyBudget, transactions, weekInfo.weekKey, viewingWeekInfo.weekKey]);

  const viewingWeeklySpent = useMemo(() => viewingTransactions.reduce((sum, t) => sum + t.amount, 0), [viewingTransactions]);
  const viewingRemaining = (viewingWeekBudget?.amount || 0) - viewingWeeklySpent;
  const isCurrentWeek = viewingWeekInfo.weekKey === weekInfo.weekKey;
  const hasBudget = viewingWeekBudget && viewingWeekBudget.amount > 0;
  const hasAnyData = hasBudget || viewingTransactions.length > 0;

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
      else setViewingWeekBudget(null);
      if (transResult.success) setViewingTransactions(transResult.data);
      else setViewingTransactions([]);
    } catch (error) {
      console.error('加载周数据失败:', error);
      setViewingWeekBudget(null);
      setViewingTransactions([]);
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
      } else { alert('保存失败: ' + result.error); }
    } catch (error) { alert('保存失败，请重试'); } finally { setIsSaving(false); }
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
      } else { alert('记录失败: ' + result.error); }
    } catch (error) { alert('记录失败，请重试'); } finally { setIsSaving(false); }
  };

  const today = formatDate(new Date());
  const yesterday = formatDate(new Date(Date.now() - 86400000));
  const getDateLabel = (date) => {
    if (date === today) return '今天';
    if (date === yesterday) return '昨天';
    const d = new Date(date);
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  };

  return (
    <PageContainer>
      <style>{`.cloud-no-mouth .budget-cloud-wrapper svg:last-child { display: none !important; }`}</style>
      
      {/* 1. 导航栏 (Fixed) */}
      <div className="fixed top-0 left-0 right-0 z-20 pointer-events-none">
        <div className="max-w-[480px] mx-auto px-[30px] pt-4 pb-2">
          <div className="flex items-center justify-between pointer-events-auto w-full">
            <button 
              onClick={() => window.history.back()}
              className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 active:bg-gray-300 pointer-events-auto active:scale-95 transition-all"
            >
              <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <WeekSelector 
              weekInfo={viewingWeekInfo}
              onPrev={() => changeWeek('prev')}
              onNext={() => changeWeek('next')}
              canGoNext={canGoNext()}
              isLoading={isLoadingWeek}
            />
          </div>
        </div>
      </div>

      {/* 2. 内容区域 */}
      <ContentArea className="pt-24 space-y-5 pb-20">
        
        {/* 预算概览卡片 */}
        <div 
          className={`rounded-[24px] p-5 transition-opacity duration-300 ${isLoadingWeek ? 'opacity-60' : 'opacity-100'}`}
          style={{ backgroundColor: colors.gray[100] }}
        >
          {/* 云朵区域 */}
          <div className="flex justify-center cloud-no-mouth" style={{ height: '150px', marginBottom: '-5px' }}>
            {!isCurrentWeek && !hasAnyData ? (
              /* 历史周无数据：显示虚线云朵 */
              <div className="transform scale-[0.5] origin-top empty-cloud-wrapper">
                <EmptyCloudPlaceholder />
              </div>
            ) : (
              /* 有数据或当前周：显示正常云朵 */
              <div className="transform scale-[0.5] origin-top budget-cloud-wrapper">
                <BudgetCloud 
                  remaining={viewingRemaining}
                  total={viewingWeekBudget?.amount || 0}
                  spent={viewingWeeklySpent}
                />
              </div>
            )}
          </div>
          
          {/* 剩余金额 */}
          <div className="text-center mb-5">
            {!isCurrentWeek && !hasAnyData ? (
              /* 历史周无数据 */
              <>
                <p className="font-extrabold font-rounded text-gray-300" style={{ fontSize: '22px' }}>
                  ¥0
                </p>
                <p className="text-gray-300 text-sm mt-1">该周无预算记录</p>
              </>
            ) : (
              /* 有数据 */
              <>
                <p className={`font-extrabold font-rounded ${viewingRemaining >= 0 ? 'text-cyan-500' : 'text-red-500'}`} style={{ fontSize: '22px' }}>
                  ¥{viewingRemaining.toLocaleString()}
                </p>
                <p className="text-gray-400 text-sm mt-1">本周剩余额度</p>
              </>
            )}
          </div>
          
          {/* 本周预算条 */}
          <div className="bg-white rounded-[14px] px-4 py-3 flex items-center justify-between mb-3 border border-gray-200">
            <span className="text-gray-400 font-medium text-sm">本周预算</span>
            <div className="flex items-center gap-3">
              <span className={`text-xl font-extrabold ${!isCurrentWeek && !hasAnyData ? 'text-gray-300' : 'text-gray-700'}`}>
                ¥{viewingWeekBudget?.amount?.toLocaleString() || 0}
              </span>
              {isCurrentWeek && (
                <button 
                  onClick={() => setShowBudgetCalculator(true)}
                  className="w-7 h-7 rounded-lg bg-cyan-50 flex items-center justify-center text-cyan-500 active:bg-cyan-100 active:scale-95 transition-all"
                >
                  <Edit3 size={14} strokeWidth={2.5} />
                </button>
              )}
            </div>
          </div>
          
          {/* 已支出条 */}
          <div className="bg-white rounded-[14px] px-4 py-3 flex items-center justify-between border border-gray-200">
            <span className="text-gray-400 font-medium text-sm">已支出</span>
            <div className="flex items-center gap-3">
              <span className={`text-xl font-extrabold ${!isCurrentWeek && !hasAnyData ? 'text-gray-300' : 'text-red-500'}`}>
                ¥{viewingWeeklySpent.toLocaleString()}
              </span>
              {isCurrentWeek && (
                <button 
                  onClick={() => setShowExpenseCalculator(true)}
                  className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center text-red-500 active:bg-red-100 active:scale-95 transition-all"
                >
                  <Plus size={16} strokeWidth={3} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 消费记录列表 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-extrabold text-gray-700">消费记录</h2>
          </div>

          {isLoadingWeek ? (
            <div className="py-12 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-cyan-500 mx-auto"></div>
              <p className="text-gray-400 font-bold mt-4">加载中...</p>
            </div>
          ) : groupedTransactions.length === 0 ? (
            <EmptyState 
              icon={Calendar}
              message={isCurrentWeek ? "本周还没有消费记录" : "该周没有消费记录"}
              action={isCurrentWeek && (
                <button 
                  onClick={() => setShowExpenseCalculator(true)}
                  className="mt-4 px-6 py-3 bg-cyan-500 text-white rounded-2xl font-bold shadow-sm hover:bg-cyan-400 active:scale-95 transition-all flex items-center gap-1"
                >
                  <Plus size={18} /> 记一笔
                </button>
              )}
            />
          ) : (
            <div className="space-y-5">
              {groupedTransactions.map(([date, dayTransactions]) => {
                const dayTotal = dayTransactions.reduce((sum, t) => sum + t.amount, 0);
                return (
                  <div key={date}>
                    <div className="flex items-center justify-between px-1 mb-2">
                      <span className="text-sm text-gray-400">{getDateLabel(date)}</span>
                      <span className="text-xs text-gray-400">共 ¥{dayTotal.toLocaleString()}</span>
                    </div>
                    <ListGroup>
                      {dayTransactions.map(trans => (
                        <TransactionItem
                          key={trans.id}
                          description={trans.description || '消费'}
                          time={trans.time || ''}
                          amount={trans.amount}
                          onClick={isCurrentWeek ? () => navigateTo('editTransaction', { editingTransaction: trans }) : undefined}
                          showArrow={isCurrentWeek}
                        />
                      ))}
                    </ListGroup>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </ContentArea>

      {/* 模态框 */}
      {showBudgetCalculator && <Calculator value={viewingWeekBudget?.amount || 0} onChange={handleSetBudget} onClose={() => setShowBudgetCalculator(false)} title="设置本周预算" showNote={false} />}
      {showExpenseCalculator && <Calculator value={0} onChange={handleAddExpense} onClose={() => setShowExpenseCalculator(false)} title="记录消费" showNote={true} />}
      <LoadingOverlay isLoading={isSaving} />
    </PageContainer>
  );
};

export default TransactionListView;