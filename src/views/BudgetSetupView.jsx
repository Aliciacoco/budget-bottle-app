// BudgetSetupView.jsx - 预算设置页面
// 修复：月预算输入改为计算器模式，统一金额输入框样式

import React, { useState } from 'react';
import { Plus, Calendar, ChevronRight, Target, ArrowLeft } from 'lucide-react';
import { saveWeeklyBudget } from '../api';
import { getFloatingIcon } from '../constants/floatingIcons';
import Calculator from '../components/CalculatorModal';

// 导入设计系统组件
import { 
  PageContainer, 
  DuoButton,
  AmountInput,
  LoadingOverlay
} from '../components/design-system';

const BudgetSetupView = ({ 
  monthlyBudget = 3000, 
  setMonthlyBudget, 
  fixedExpenses = [], 
  setFixedExpenses, 
  specialBudgets = [],
  specialBudgetItems = {},
  weekInfo,
  weeklyBudget,
  setWeeklyBudget,
  navigateTo, 
  onBack 
}) => {
  const [localMonthlyBudget, setLocalMonthlyBudget] = useState(monthlyBudget || 3000);
  const [isSaving, setIsSaving] = useState(false);
  const [showAllExpenses, setShowAllExpenses] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);

  const enabledExpenses = (fixedExpenses || []).filter(e => e.enabled !== false);
  const totalFixedExpenses = enabledExpenses.reduce((sum, e) => sum + e.amount, 0);
  const currentMonthlyBudget = localMonthlyBudget || 3000;
  const availableForWeekly = currentMonthlyBudget - totalFixedExpenses;
  const suggestedWeeklyBudget = Math.floor(availableForWeekly / 4);
  
  const displayedExpenses = showAllExpenses ? fixedExpenses : (fixedExpenses || []).slice(0, 3);
  const hasMoreExpenses = (fixedExpenses || []).length > 3;

  const handleMonthlyBudgetChange = (value) => {
    setLocalMonthlyBudget(value);
    if (setMonthlyBudget) setMonthlyBudget(value);
    localStorage.setItem('monthly_budget', value.toString());
    setShowCalculator(false);
  };

  const handleExpenseClick = (expense) => {
    navigateTo('editFixedExpense', { editingExpense: expense });
  };

  const handleAddExpense = () => {
    navigateTo('editFixedExpense', { editingExpense: {} });
  };

  const handleSetWeeklyBudget = async (amount) => {
    if (!amount || amount <= 0) return;
    setIsSaving(true);
    try {
      const result = await saveWeeklyBudget(weekInfo.weekKey, amount);
      if (result.success) {
        setWeeklyBudget(result.data);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <PageContainer bg="gray" className="relative pb-8">
      {/* 引入 M PLUS Rounded 1c 字体 */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@400;500;700;800&display=swap');
        .font-rounded {
          font-family: 'M PLUS Rounded 1c', sans-serif;
        }
      `}</style>

      {/* 固定透明导航栏 */}
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

      {/* 主内容区 */}
      <div className="pt-20 px-6 max-w-lg mx-auto space-y-6">
        
        {/* 页面标题 */}
        <div className="text-center mb-2">
          <h1 className="text-2xl font-extrabold text-gray-800">预算设置</h1>
          <p className="text-gray-400 font-medium text-sm mt-1">配置你的月度预算计划</p>
        </div>

        {/* SECTION 1: 每月总预算 - 使用计算器模式 */}
        <div className="bg-white rounded-3xl p-5 shadow-sm">
          <label className="text-gray-400 font-bold uppercase tracking-wider text-xs mb-3 block">每月总收入/预算</label>
          <AmountInput
            value={localMonthlyBudget}
            onClick={() => setShowCalculator(true)}
          />
        </div>

        {/* SECTION 2: 固定支出 */}
        <div className="bg-white rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <label className="text-gray-400 font-bold uppercase tracking-wider text-xs">固定支出</label>
              <div className="text-amber-500 font-extrabold text-xl mt-1 font-rounded">
                ¥{totalFixedExpenses.toLocaleString()} <span className="text-gray-400 text-sm font-medium">/月</span>
              </div>
            </div>
            <button 
              onClick={handleAddExpense}
              className="w-10 h-10 bg-gray-100 text-gray-500 rounded-xl flex items-center justify-center hover:bg-gray-200 active:scale-95 transition-all"
            >
              <Plus size={20} strokeWidth={2.5} />
            </button>
          </div>
          
          <div className="space-y-3">
            {(fixedExpenses || []).length === 0 ? (
              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center text-gray-400 font-bold">
                还没有固定支出
              </div>
            ) : (
              displayedExpenses.map(expense => (
                <div 
                  key={expense.id}
                  onClick={() => handleExpenseClick(expense)}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl cursor-pointer active:bg-gray-100 active:scale-[0.99] transition-all"
                >
                  <div className="flex-1">
                    <div className="font-bold text-gray-700 text-lg">{expense.name}</div>
                    {expense.expireDate ? (
                      <div className="text-xs font-bold text-gray-400 flex items-center gap-1 mt-1">
                        <Calendar size={12} strokeWidth={2.5} />
                        {expense.expireDate} 到期
                      </div>
                    ) : (
                      <div className="text-xs font-bold text-gray-300 mt-1">无限期</div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="font-extrabold text-gray-700 text-lg font-rounded">¥{expense.amount.toLocaleString()}</span>
                    <ChevronRight 
                      size={20} 
                      className="text-gray-300"
                      strokeWidth={2.5}
                    />
                  </div>
                </div>
              ))
            )}
            
            {hasMoreExpenses && (
              <button
                onClick={() => setShowAllExpenses(!showAllExpenses)}
                className="w-full py-3 text-gray-400 font-bold text-sm hover:bg-gray-50 rounded-xl transition-colors"
              >
                {showAllExpenses ? '收起' : `查看全部 (${fixedExpenses.length})`}
              </button>
            )}
          </div>
        </div>

        {/* SECTION 3: 建议卡片 */}
        <div className="bg-cyan-500 rounded-3xl p-6 text-white relative overflow-hidden shadow-sm">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/20 rounded-full"></div>
          <div className="relative z-10">
            <h2 className="font-extrabold text-lg flex items-center gap-2 mb-4">
              <Target className="text-cyan-200" size={24} />
              建议周预算
            </h2>
            
            <div className="bg-black/10 rounded-2xl p-4 space-y-2 mb-4 backdrop-blur-sm">
              <div className="flex justify-between text-cyan-100 font-medium text-sm">
                <span>月预算 - 固定支出</span>
                <span className="font-rounded">¥{availableForWeekly.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-white/10">
                <span className="text-cyan-100 font-medium">÷ 4周 ≈</span>
                <span className="text-3xl font-extrabold text-white font-rounded">¥{suggestedWeeklyBudget.toLocaleString()}</span>
              </div>
            </div>

            {weeklyBudget && weeklyBudget.amount !== suggestedWeeklyBudget && (
              <button
                onClick={() => handleSetWeeklyBudget(suggestedWeeklyBudget)}
                className="w-full py-3 bg-white text-cyan-500 font-extrabold rounded-xl active:scale-[0.98] transition-all"
              >
                应用这个预算
              </button>
            )}
          </div>
        </div>

        {/* SECTION 4: 远航计划 - 修复图标渲染 */}
        <div className="bg-white rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <label className="text-gray-400 font-bold uppercase tracking-wider text-xs">远航计划</label>
            <button 
              onClick={() => navigateTo('editSpecialBudget', { editingSpecialBudget: {} })}
              className="w-10 h-10 bg-gray-100 text-gray-500 rounded-xl flex items-center justify-center hover:bg-gray-200 active:scale-95 transition-all"
            >
              <Plus size={20} strokeWidth={2.5} />
            </button>
          </div>
           
          <div className="space-y-3">
            {(specialBudgets || []).map(budget => {
              const iconConfig = getFloatingIcon(budget.icon);
              const IconComponent = iconConfig.icon;
              const iconColor = iconConfig.color;
              const items = specialBudgetItems[budget.id] || [];
              const totalBudget = items.reduce((sum, item) => sum + (item.budgetAmount || 0), 0);
              
              return (
                <div 
                  key={budget.id}
                  onClick={() => navigateTo('specialBudgetDetail', { editingSpecialBudget: budget })}
                  className="cursor-pointer bg-gray-50 rounded-2xl p-4 flex items-center gap-4 active:bg-gray-100 active:scale-[0.99] transition-all"
                >
                  {/* 自定义 SVG 图标 */}
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ 
                      backgroundColor: iconColor + '15',
                    }}
                  >
                    <div className="w-8 h-8">
                      <IconComponent className="w-full h-full" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="font-extrabold text-gray-700 text-lg">{budget.name}</div>
                    <div className="text-gray-400 font-bold text-xs mt-1 font-rounded">
                      总预算 ¥{totalBudget.toLocaleString()}
                    </div>
                  </div>
                  <ChevronRight className="text-gray-300" strokeWidth={3} />
                </div>
              )
            })}
            
            {(specialBudgets || []).length === 0 && (
              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center text-gray-400 font-bold">
                还没有远航计划
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* 计算器弹窗 */}
      {showCalculator && (
        <Calculator
          value={localMonthlyBudget}
          onChange={handleMonthlyBudgetChange}
          onClose={() => setShowCalculator(false)}
          title="每月预算"
          showNote={false}
        />
      )}
      
      <LoadingOverlay isLoading={isSaving} />
    </PageContainer>
  );
};

export default BudgetSetupView;