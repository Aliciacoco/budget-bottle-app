// BudgetSetupView.jsx - 预算设置页面
// 简化版：分享和退出功能已移到品牌菜单

import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, ChevronRight, Check, Minus, Plus } from 'lucide-react';
import { saveWeeklyBudget } from '../api';
import Calculator from '../components/CalculatorModal';

// ===== 全屏蓝色设置页面 =====
const BudgetDetailView = ({ 
  isOpen, 
  onClose, 
  monthlyBudget, 
  setMonthlyBudget,
  fixedExpenses,
  navigateTo,
  suggestedWeeklyBudget,
  dailyBudget
}) => {
  const [localMonthlyBudget, setLocalMonthlyBudget] = useState(monthlyBudget);
  const [showCalculator, setShowCalculator] = useState(false);
  const saveTimer = useRef(null);
  
  useEffect(() => {
    setLocalMonthlyBudget(monthlyBudget);
  }, [monthlyBudget]);
  
  if (!isOpen) return null;
  
  const enabledExpenses = (fixedExpenses || []).filter(e => e.enabled !== false);
  const totalFixedExpenses = enabledExpenses.reduce((sum, e) => sum + e.amount, 0);
  
  const saveMonthlyBudgetValue = (value) => {
    if (setMonthlyBudget) setMonthlyBudget(value);
    localStorage.setItem('monthly_budget', value.toString());
  };
  
  const adjustBudget = (delta) => {
    const newValue = Math.max(0, localMonthlyBudget + delta);
    setLocalMonthlyBudget(newValue);
    
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveMonthlyBudgetValue(newValue);
    }, 300);
  };
  
  const handleMonthlyBudgetChange = (value) => {
    setLocalMonthlyBudget(value);
    saveMonthlyBudgetValue(value);
    setShowCalculator(false);
  };
  
  return (
    <div className="fixed inset-0 z-50 bg-cyan-500 overflow-auto">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@400;500;700;800&display=swap');
        .font-rounded { font-family: 'M PLUS Rounded 1c', sans-serif; }
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-10px) translateX(5px); }
        }
        .floating-cloud { animation: float 6s ease-in-out infinite; }
      `}</style>
      
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-4 w-16 h-16 bg-white/10 rounded-2xl rotate-12" />
        <div className="absolute top-40 left-4 w-12 h-12 bg-white/10 rounded-xl -rotate-12" />
        <div className="absolute bottom-40 right-8 w-20 h-20 bg-white/10 rounded-3xl rotate-45" />
        
        <div className="floating-cloud absolute top-16 left-0 opacity-90">
          <svg width="120" height="80" viewBox="0 0 120 80" fill="none">
            <ellipse cx="60" cy="45" rx="45" ry="30" fill="white" fillOpacity="0.95"/>
            <ellipse cx="35" cy="50" rx="30" ry="22" fill="white" fillOpacity="0.9"/>
            <ellipse cx="85" cy="52" rx="25" ry="18" fill="white" fillOpacity="0.85"/>
          </svg>
        </div>
      </div>
      
      {/* 返回按钮 */}
      <div className="relative z-10 px-6 pt-4">
        <button 
          onClick={onClose}
          className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white hover:bg-white/30 active:scale-95 transition-all"
        >
          <ArrowLeft size={24} strokeWidth={2.5} />
        </button>
      </div>
      
      {/* 主内容 */}
      <div className="relative z-10 flex flex-col items-center px-6 pt-8 pb-12">
        <div className="text-center mb-2">
          <p className="text-white/70 text-sm font-medium mb-1">推荐周预算</p>
          <div className="flex items-center justify-center gap-1">
            <span className="text-white/60 text-3xl font-bold">¥</span>
            <span className="text-white text-5xl font-extrabold font-rounded">
              {suggestedWeeklyBudget.toLocaleString()}
            </span>
          </div>
          <p className="text-white/60 text-sm mt-2">
            ≈ 每天 ¥{dailyBudget}
          </p>
        </div>
        
        <div className="w-full max-w-sm mt-8 space-y-3">
          {/* 每月总预算 */}
          <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <span className="text-lg">💰</span>
                </div>
                <span className="text-white font-medium">每月总预算</span>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => adjustBudget(-500)}
                  className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white active:bg-white/30 active:scale-95 transition-all"
                >
                  <Minus size={16} />
                </button>
                
                <button
                  onClick={() => setShowCalculator(true)}
                  className="text-white font-bold text-lg min-w-[80px] text-center active:opacity-70 transition-all"
                >
                  ¥{localMonthlyBudget.toLocaleString()}
                </button>
                
                <button 
                  onClick={() => adjustBudget(500)}
                  className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white active:bg-white/30 active:scale-95 transition-all"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>
          
          {/* 固定支出 */}
          <div 
            onClick={() => {
              onClose();
              setTimeout(() => navigateTo('editFixedExpense', { editingExpense: {} }), 100);
            }}
            className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 cursor-pointer active:bg-white/20 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <span className="text-lg">📋</span>
                </div>
                <div>
                  <span className="text-white font-medium">固定支出</span>
                  <p className="text-white/50 text-xs mt-0.5">
                    {enabledExpenses.length > 0 
                      ? `${enabledExpenses.length}项，共 ¥${totalFixedExpenses.toLocaleString()}`
                      : '点击添加房租、水电等'
                    }
                  </p>
                </div>
              </div>
              <ChevronRight size={20} className="text-white/50" />
            </div>
          </div>
          
          {/* 固定支出列表 */}
          {enabledExpenses.length > 0 && (
            <div className="bg-white/10 rounded-xl overflow-hidden">
              {enabledExpenses.map((expense, index) => (
                <div 
                  key={expense.id}
                  onClick={() => {
                    onClose();
                    setTimeout(() => navigateTo('editFixedExpense', { editingExpense: expense }), 100);
                  }}
                  className={`flex items-center justify-between px-4 py-3 cursor-pointer active:bg-white/10 transition-all ${
                    index !== enabledExpenses.length - 1 ? 'border-b border-white/10' : ''
                  }`}
                >
                  <span className="text-white/80 text-sm">{expense.name}</span>
                  <span className="text-white font-medium text-sm">¥{expense.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-white/40 text-xs">
            周预算 = (月预算 - 固定支出) ÷ 4
          </p>
        </div>
      </div>
      
      {showCalculator && (
        <Calculator
          value={localMonthlyBudget}
          onChange={handleMonthlyBudgetChange}
          onClose={() => setShowCalculator(false)}
          title="每月预算"
          showNote={false}
        />
      )}
    </div>
  );
};

// ===== 主设置页面 =====
const BudgetSetupView = ({ 
  monthlyBudget = 3000, 
  setMonthlyBudget, 
  fixedExpenses = [], 
  setFixedExpenses,
  weekInfo,
  weeklyBudget,
  setWeeklyBudget,
  navigateTo, 
  onBack
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [showBudgetDetail, setShowBudgetDetail] = useState(false);
  
  // 计算
  const enabledExpenses = (fixedExpenses || []).filter(e => e.enabled !== false);
  const totalFixedExpenses = enabledExpenses.reduce((sum, e) => sum + e.amount, 0);
  const availableForWeekly = Math.max(0, monthlyBudget - totalFixedExpenses);
  const suggestedWeeklyBudget = Math.floor(availableForWeekly / 4);
  const dailyBudget = Math.floor(suggestedWeeklyBudget / 7);
  
  const currentWeeklyBudget = weeklyBudget?.amount || 0;
  const showApplyButton = suggestedWeeklyBudget !== currentWeeklyBudget;
  
  const handleApplyWeeklyBudget = async () => {
    if (!weekInfo || suggestedWeeklyBudget < 0) return;
    
    setIsSaving(true);
    try {
      const result = await saveWeeklyBudget(weekInfo.weekKey, suggestedWeeklyBudget);
      if (result.success && setWeeklyBudget) {
        setWeeklyBudget(result.data);
      }
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@400;500;700;800&display=swap');
        .font-rounded { font-family: 'M PLUS Rounded 1c', sans-serif; }
      `}</style>
      
      {/* 导航栏 */}
      <div className="px-6 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <button 
            onClick={onBack}
            className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-gray-400 hover:text-gray-600 active:scale-95 transition-all"
          >
            <ArrowLeft size={24} strokeWidth={2.5} />
          </button>
          <h1 className="text-lg font-bold text-gray-800">预算设置</h1>
          <div className="w-12" />
        </div>
      </div>
      
      <div className="px-6 pt-4">
        {/* ===== 推荐周预算卡片 ===== */}
        <div 
          onClick={() => setShowBudgetDetail(true)}
          className="bg-cyan-500 rounded-3xl p-5 mb-4 cursor-pointer active:scale-[0.99] transition-all shadow-lg shadow-cyan-500/30 relative overflow-hidden"
        >
          {/* 背景装饰 */}
          <div className="absolute top-0 right-0 opacity-30">
            <svg width="120" height="100" viewBox="0 0 120 100" fill="none">
              <ellipse cx="80" cy="50" rx="60" ry="45" fill="white" fillOpacity="0.3"/>
              <ellipse cx="100" cy="70" rx="40" ry="30" fill="white" fillOpacity="0.2"/>
            </svg>
          </div>
          
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-white/70 text-sm font-medium">推荐周预算</p>
                <p className="text-white/50 text-xs mt-0.5">根据月预算和固定支出计算</p>
              </div>
              <ChevronRight size={20} className="text-white/50 mt-1" />
            </div>
            
            <div className="flex items-baseline gap-1">
              <span className="text-white/60 text-2xl font-bold">¥</span>
              <span className="text-white text-4xl font-extrabold font-rounded">
                {suggestedWeeklyBudget.toLocaleString()}
              </span>
            </div>
            
            {showApplyButton ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleApplyWeeklyBudget();
                }}
                disabled={isSaving}
                className="mt-3 px-4 py-2 bg-white text-cyan-600 font-bold text-sm rounded-xl flex items-center gap-1.5 active:scale-95 transition-all disabled:opacity-70"
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-cyan-300 border-t-cyan-600 rounded-full animate-spin" />
                ) : (
                  <Check size={16} strokeWidth={3} />
                )}
                应用到本周
              </button>
            ) : currentWeeklyBudget > 0 && (
              <p className="mt-3 text-white/60 text-sm flex items-center gap-1">
                <Check size={14} /> 已应用到本周
              </p>
            )}
          </div>
        </div>
        
        {/* 快捷设置项 */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {/* 每月总预算 */}
          <div 
            onClick={() => setShowBudgetDetail(true)}
            className="p-4 border-b border-gray-100 cursor-pointer active:bg-gray-50 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center">
                  <span className="text-lg">💰</span>
                </div>
                <div>
                  <p className="font-bold text-gray-800">每月总预算</p>
                  <p className="text-gray-400 text-xs">可分配到每周的金额来源</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-cyan-600 font-bold">¥{monthlyBudget.toLocaleString()}</span>
                <ChevronRight size={20} className="text-gray-300" />
              </div>
            </div>
          </div>
          
          {/* 固定支出 */}
          <div 
            onClick={() => navigateTo('editFixedExpense', { editingExpense: {} })}
            className="p-4 cursor-pointer active:bg-gray-50 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                  <span className="text-lg">📋</span>
                </div>
                <div>
                  <p className="font-bold text-gray-800">固定支出</p>
                  <p className="text-gray-400 text-xs">
                    {enabledExpenses.length > 0 
                      ? `${enabledExpenses.length}项，共 ¥${totalFixedExpenses.toLocaleString()}`
                      : '房租、订阅等每月必付项目'
                    }
                  </p>
                </div>
              </div>
              <ChevronRight size={20} className="text-gray-300" />
            </div>
          </div>
        </div>
        
        {/* 计算说明 */}
        <div className="mt-6 text-center">
          <p className="text-gray-300 text-xs">
            周预算 = (月预算 - 固定支出) ÷ 4
          </p>
        </div>
      </div>
      
      {/* 全屏蓝色设置页面 */}
      <BudgetDetailView
        isOpen={showBudgetDetail}
        onClose={() => setShowBudgetDetail(false)}
        monthlyBudget={monthlyBudget}
        setMonthlyBudget={setMonthlyBudget}
        fixedExpenses={fixedExpenses}
        navigateTo={navigateTo}
        suggestedWeeklyBudget={suggestedWeeklyBudget}
        dailyBudget={dailyBudget}
      />
      
      {/* 保存中遮罩 */}
      {isSaving && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg">
            <div className="w-6 h-6 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetSetupView;