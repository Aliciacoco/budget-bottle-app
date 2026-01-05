// BudgetSetupView.jsx - 预算设置页面
// 支持匿名用户提示 + 绑定账号功能

import React, { useState, useRef } from 'react';
import { Plus, ChevronDown, ArrowLeft, LogOut, Minus, Check, UserCircle, CloudUpload } from 'lucide-react';
import { saveWeeklyBudget } from '../api';
import { isAnonymousUser } from '../auth';
import { getFloatingIcon } from '../constants/floatingIcons';
import Calculator from '../components/CalculatorModal';

import { 
  PageContainer, 
  LoadingOverlay,
  ConfirmModal
} from '../components/design-system';

// 判断专项预算状态
const getBudgetStatus = (budget) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (!budget.startDate && !budget.endDate) return 'ongoing';
  
  const endDate = budget.endDate ? new Date(budget.endDate) : null;
  const startDate = budget.startDate ? new Date(budget.startDate) : null;
  
  if (endDate && endDate < today) return 'history';
  if (startDate && startDate > today) return 'upcoming';
  
  return 'ongoing';
};

// 云朵卡片组件
const CloudCard = ({ children }) => {
  const cloudPath = "M170.621 38C201.558 38 228.755 53.2859 244.555 76.4834L245.299 77.5938L245.306 77.6035C247.53 81.0058 251.079 83.3252 255.11 84.0352L255.502 84.0986L255.511 84.0996C299.858 90.8163 334 127.546 334 172.283C334 221.589 294.443 261.625 245.621 261.625H104.896L104.79 261.619C61.1843 259.33 26 226.502 26 185.76C26 154.771 46.4474 128.375 75.3525 116.578L75.3594 116.575C79.8465 114.754 83.1194 110.742 84.1465 105.889C92.3483 67.057 128.005 38.0001 170.621 38Z";
  
  return (
    <div className="relative w-full" style={{ maxWidth: '260px' }}>
      <svg 
        viewBox="26 38 308 224"
        className="w-full h-auto"
        style={{ filter: 'drop-shadow(0 4px 12px rgba(6, 182, 212, 0.25))' }}
      >
        <defs>
          <linearGradient id="cloudGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22D3EE" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>
        </defs>
        <path d={cloudPath} fill="url(#cloudGradient)" />
      </svg>
      
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
};

const BudgetSetupView = ({ 
  monthlyBudget = 3000, 
  setMonthlyBudget, 
  fixedExpenses = [], 
  specialBudgets = [],
  specialBudgetItems = {},
  weekInfo,
  weeklyBudget,
  setWeeklyBudget,
  navigateTo, 
  onBack,
  currentUser,
  onLogout,
  onSwitchAccount
}) => {
  const [localMonthlyBudget, setLocalMonthlyBudget] = useState(monthlyBudget || 3000);
  const [isSaving, setIsSaving] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showFixedExpenses, setShowFixedExpenses] = useState(false);
  
  const saveTimer = useRef(null);
  
  // 是否为匿名用户
  const isAnonymous = isAnonymousUser();

  // 计算
  const enabledExpenses = (fixedExpenses || []).filter(e => e.enabled !== false);
  const totalFixedExpenses = enabledExpenses.reduce((sum, e) => sum + e.amount, 0);
  const availableForWeekly = Math.max(0, localMonthlyBudget - totalFixedExpenses);
  const suggestedWeeklyBudget = Math.floor(availableForWeekly / 4);
  const dailyBudget = Math.floor(suggestedWeeklyBudget / 7);
  
  const currentWeeklyBudget = weeklyBudget?.amount || 0;
  const showApplyButton = suggestedWeeklyBudget !== currentWeeklyBudget;

  const saveMonthlyBudget = (value) => {
    if (setMonthlyBudget) setMonthlyBudget(value);
    localStorage.setItem('monthly_budget', value.toString());
  };

  const handleMonthlyBudgetChange = (value) => {
    setLocalMonthlyBudget(value);
    saveMonthlyBudget(value);
    setShowCalculator(false);
  };

  const adjustBudget = (delta, e) => {
    if (e) e.preventDefault();
    if (e && e.currentTarget) e.currentTarget.blur();
    
    const newValue = Math.max(0, localMonthlyBudget + delta);
    setLocalMonthlyBudget(newValue);
    
    if (saveTimer.current) clearTimeout(saveTimer.current);
    
    saveTimer.current = setTimeout(() => {
      saveMonthlyBudget(newValue);
      saveTimer.current = null;
    }, 300);
  };

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

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    if (onLogout) onLogout();
  };

  const userName = currentUser?.nickname || currentUser?.username || '';

  return (
    <PageContainer bg="gray" className="relative pb-6">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@400;500;700;800&display=swap');
        .font-rounded { font-family: 'M PLUS Rounded 1c', sans-serif; }
      `}</style>

      {/* 导航栏 */}
      <div className="fixed top-0 left-0 right-0 z-20 px-6 pt-4 pb-2 pointer-events-none">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <button 
            onClick={onBack}
            className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm hover:shadow-md transition-shadow text-gray-400 hover:text-gray-600 pointer-events-auto active:scale-95"
          >
            <ArrowLeft size={24} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <div className="pt-20 px-6 max-w-lg mx-auto">
        
        {/* ===== 流程图区域 ===== */}
        <div className="flex flex-col items-center">
          
          {/* 1. 每月总预算 */}
          <div className="text-center mb-1">
            <span className="text-gray-400 text-xs font-medium">
              {isAnonymous ? '每月总预算' : `${userName}的每月总预算`}
            </span>
          </div>
          
          <div className="flex items-center gap-3 mb-1">
            <button 
              onClick={(e) => adjustBudget(-500, e)}
              className="w-8 h-8 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-400 active:border-cyan-400 active:text-cyan-500 active:scale-95 transition-all focus:outline-none focus:ring-0"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <Minus size={16} strokeWidth={2} />
            </button>
            
            <button
              onClick={() => setShowCalculator(true)}
              className="flex items-baseline gap-1 active:opacity-70 active:scale-95 transition-all focus:outline-none"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <span className="text-gray-400 text-xl font-bold">¥</span>
              <span className="text-gray-800 text-4xl font-extrabold font-rounded">
                {localMonthlyBudget.toLocaleString()}
              </span>
            </button>
            
            <button 
              onClick={(e) => adjustBudget(500, e)}
              className="w-8 h-8 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-400 active:border-cyan-400 active:text-cyan-500 active:scale-95 transition-all focus:outline-none focus:ring-0"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <Plus size={16} strokeWidth={2} />
            </button>
          </div>
          
          <div className="w-px h-4 bg-gray-200" />
          
          {/* 2. 固定支出 */}
          <button
            onClick={() => setShowFixedExpenses(!showFixedExpenses)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-gray-100 bg-white active:border-gray-200 active:scale-[0.98] transition-all mb-1 shadow-sm focus:outline-none"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <div className="text-left">
              <span className="text-gray-400 text-xs font-medium">固定支出</span>
              <div className="text-gray-700 font-extrabold font-rounded">
                ¥{totalFixedExpenses.toLocaleString()}
              </div>
            </div>
            <ChevronDown 
              size={16} 
              className={`text-gray-300 transition-transform ml-1 ${showFixedExpenses ? 'rotate-180' : ''}`} 
            />
          </button>
          
          {/* 固定支出列表 */}
          {showFixedExpenses && (
            <div className="w-full max-w-[240px] mb-3 space-y-2">
              {enabledExpenses.map(expense => (
                <div 
                  key={expense.id}
                  onClick={() => navigateTo('editFixedExpense', { editingExpense: expense })}
                  className="flex items-center justify-between px-3 py-2 bg-white rounded-lg cursor-pointer active:bg-gray-50 active:scale-[0.99] transition-all shadow-sm text-sm"
                >
                  <span className="text-gray-600">{expense.name}</span>
                  <span className="text-gray-700 font-bold font-rounded">¥{expense.amount.toLocaleString()}</span>
                </div>
              ))}
              <button
                onClick={() => navigateTo('editFixedExpense', { editingExpense: {} })}
                className="w-full py-2 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 font-medium text-xs active:border-cyan-300 active:text-cyan-500 transition-all flex items-center justify-center gap-1 bg-white"
              >
                <Plus size={14} /> 添加
              </button>
            </div>
          )}
          
          <div className="w-px h-4 bg-gray-200" />
          
          {/* 3. 建议周预算 */}
          <CloudCard>
            <div className="text-center">
              <div className="inline-flex items-center gap-1 bg-white/20 rounded-full px-2 py-0.5 mb-1">
                <span className="text-sm">☁️</span>
                <span className="text-white/90 text-xs font-bold">建议周预算</span>
              </div>
              
              <div className="mb-0.5">
                <span className="text-white/60 text-lg font-bold">¥</span>
                <span className="text-white text-3xl font-extrabold font-rounded">
                  {suggestedWeeklyBudget.toLocaleString()}
                </span>
              </div>
              
              <p className="text-white/60 text-xs font-medium">
                ≈ 每天 ¥{dailyBudget}
              </p>
            </div>
          </CloudCard>
          
          {/* 应用按钮 */}
          {showApplyButton && (
            <button
              onClick={handleApplyWeeklyBudget}
              className="mt-3 px-6 py-2 bg-cyan-500 text-white font-bold rounded-xl flex items-center gap-2 active:bg-cyan-600 active:scale-95 transition-all shadow-md"
            >
              <Check size={16} strokeWidth={3} />
              应用到本周
            </button>
          )}
          
          {!showApplyButton && currentWeeklyBudget > 0 && (
            <p className="mt-2 text-gray-400 text-xs">
              ✓ 已应用到本周
            </p>
          )}
          
          {/* 过渡说明 */}
          <div className="text-center my-4">
            <p className="text-gray-300 text-xs">
              ─ ─ ─  以下是专项支出  ─ ─ ─
            </p>
          </div>
          
          {/* 4. 专项支出 */}
          <div className="w-full bg-white rounded-2xl p-4 shadow-sm mb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 text-xs font-bold">专项支出</span>
              <button
                onClick={() => navigateTo('editSpecialBudget', { editingSpecialBudget: {} })}
                className="w-7 h-7 bg-gray-100 text-gray-400 rounded-lg flex items-center justify-center active:bg-gray-200 active:scale-95 transition-all"
              >
                <Plus size={14} strokeWidth={2.5} />
              </button>
            </div>
            
            {specialBudgets.length === 0 ? (
              <div 
                onClick={() => navigateTo('editSpecialBudget', { editingSpecialBudget: {} })}
                className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer active:border-cyan-300 active:bg-cyan-50/30 transition-all"
              >
                <p className="text-gray-400 font-bold text-sm">旅行、大件购物...</p>
                <p className="text-gray-300 text-xs mt-0.5">点击添加</p>
              </div>
            ) : (
              <div className="space-y-2">
                {specialBudgets.map(budget => {
                  const iconConfig = getFloatingIcon(budget.icon);
                  const IconComponent = iconConfig.icon;
                  const iconColor = iconConfig.color;
                  const items = specialBudgetItems[budget.id] || [];
                  const totalBudget = items.reduce((sum, item) => sum + (item.budgetAmount || 0), 0);
                  const status = getBudgetStatus(budget);
                  const isHistory = status === 'history';
                  
                  return (
                    <div
                      key={budget.id}
                      onClick={() => navigateTo('specialBudgetDetail', { editingSpecialBudget: budget })}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer active:scale-[0.99] transition-all ${
                        isHistory 
                          ? 'bg-gray-100 opacity-60' 
                          : 'bg-gray-50 active:bg-gray-100'
                      }`}
                    >
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ 
                          backgroundColor: isHistory ? '#E5E7EB' : iconColor + '20',
                        }}
                      >
                        <div 
                          className="w-6 h-6" 
                          style={{ 
                            filter: isHistory ? 'grayscale(100%)' : 'none',
                            opacity: isHistory ? 0.5 : 1 
                          }}
                        >
                          <IconComponent className="w-full h-full" />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-bold text-sm truncate ${isHistory ? 'text-gray-400' : 'text-gray-700'}`}>
                            {budget.name}
                          </span>
                          {isHistory && (
                            <span className="text-xs text-gray-400 bg-gray-200 px-1 py-0.5 rounded flex-shrink-0">
                              历史
                            </span>
                          )}
                        </div>
                        <div className={`text-sm font-extrabold font-rounded ${isHistory ? 'text-gray-400' : 'text-gray-800'}`}>
                          ¥{totalBudget.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ===== 账户区域 ===== */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          {/* 当前账户信息 */}
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              isAnonymous ? 'bg-gray-100' : 'bg-cyan-100'
            }`}>
              <UserCircle size={28} className={isAnonymous ? 'text-gray-400' : 'text-cyan-500'} />
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-800">
                {isAnonymous ? '本地用户' : (userName || '用户')}
              </p>
              <p className="text-sm text-gray-400">
                {isAnonymous ? '数据仅保存在此设备' : `@${currentUser?.username}`}
              </p>
            </div>
          </div>
          
          {/* 匿名用户提示 */}
          {isAnonymous && (
            <div className="mb-4 p-3 bg-cyan-50 rounded-xl">
              <p className="text-cyan-600 text-sm text-center leading-relaxed">
                ☁️ 登录账号可在多设备间同步数据
              </p>
            </div>
          )}
          
          {/* 操作按钮 */}
          <div className="space-y-2">
            {/* 登录/切换账户按钮 */}
            {onSwitchAccount && (
              <button
                onClick={onSwitchAccount}
                className={`w-full py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all active:scale-[0.98] ${
                  isAnonymous 
                    ? 'bg-cyan-500 hover:bg-cyan-600 text-white border-b-4 border-cyan-600 active:border-b-0 active:translate-y-1'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                }`}
              >
                {isAnonymous ? (
                  <>
                    <CloudUpload size={18} strokeWidth={2.5} />
                    登录以同步数据
                  </>
                ) : (
                  <>
                    <UserCircle size={18} strokeWidth={2.5} />
                    切换账号
                  </>
                )}
              </button>
            )}
            
            {/* 已登录用户显示退出按钮 */}
            {!isAnonymous && onLogout && (
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-xl flex items-center justify-center gap-2 font-bold transition-all active:scale-[0.98]"
              >
                <LogOut size={18} strokeWidth={2.5} />
                退出登录
              </button>
            )}
          </div>
        </div>
        
        {/* 版本信息 */}
        <div className="text-center py-6">
          <p className="text-gray-300 text-xs">CloudPool v1.0.0</p>
        </div>
      </div>
      
      {/* 计算器 */}
      {showCalculator && (
        <Calculator
          value={localMonthlyBudget}
          onChange={handleMonthlyBudgetChange}
          onClose={() => setShowCalculator(false)}
          title="每月预算"
          showNote={false}
        />
      )}

      {/* 退出确认 */}
      <ConfirmModal
        isOpen={showLogoutConfirm}
        title="退出登录"
        message="退出后将回到本地模式，当前账号数据仍会保留在云端。"
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
        confirmText="退出"
        confirmVariant="danger"
      />
      
      <LoadingOverlay isLoading={isSaving} />
    </PageContainer>
  );
};

export default BudgetSetupView;