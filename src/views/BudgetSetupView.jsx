//预算设置页面

import React, { useState } from 'react';
import { ArrowLeft, Plus, Edit, Trash2, Calendar, ChevronRight, Anchor } from 'lucide-react';
import { createFixedExpense, updateFixedExpense, deleteFixedExpense, saveWeeklyBudget } from '../api';
import { BUDGET_ICONS } from '../constants/icons';
import ConfirmModal from '../components/ConfirmModal';

const BudgetSetupView = ({ 
  monthlyBudget, 
  setMonthlyBudget, 
  fixedExpenses, 
  setFixedExpenses, 
  specialBudgets,
  specialBudgetItems,
  weekInfo,
  weeklyBudget,
  setWeeklyBudget,
  navigateTo, 
  onBack 
}) => {
  const [localMonthlyBudget, setLocalMonthlyBudget] = useState(monthlyBudget.toString());
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [expenseName, setExpenseName] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingExpenseId, setDeletingExpenseId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const enabledExpenses = fixedExpenses.filter(e => e.enabled !== false);
  const totalFixedExpenses = enabledExpenses.reduce((sum, e) => sum + e.amount, 0);
  const availableForWeekly = monthlyBudget - totalFixedExpenses;
  const suggestedWeeklyBudget = Math.floor(availableForWeekly / 4);

  const handleMonthlyBudgetChange = (value) => {
    setLocalMonthlyBudget(value);
    const amount = parseFloat(value) || 0;
    setMonthlyBudget(amount);
    localStorage.setItem('monthly_budget', amount.toString());
  };

  const openAddExpenseModal = () => {
    setEditingExpense(null);
    setExpenseName('');
    setExpenseAmount('');
    setExpenseDate('');
    setShowExpenseModal(true);
  };

  const openEditExpenseModal = (expense) => {
    setEditingExpense(expense);
    setExpenseName(expense.name);
    setExpenseAmount(expense.amount.toString());
    setExpenseDate(expense.expireDate || '');
    setShowExpenseModal(true);
  };

  const handleSaveExpense = async () => {
    if (!expenseName || !expenseAmount) return;
    setIsSaving(true);
    try {
      const amount = parseFloat(expenseAmount);
      let result;
      if (editingExpense) {
        result = await updateFixedExpense(editingExpense.id, expenseName, amount, expenseDate, true);
      } else {
        result = await createFixedExpense(expenseName, amount, expenseDate, true);
      }
      if (result.success) {
        if (editingExpense) {
          setFixedExpenses(fixedExpenses.map(e => e.id === editingExpense.id ? result.data : e));
        } else {
          setFixedExpenses([...fixedExpenses, result.data]);
        }
        setShowExpenseModal(false);
      } else {
        alert('保存失败: ' + result.error);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteExpense = async () => {
    if (!deletingExpenseId) return;
    setIsSaving(true);
    try {
      const result = await deleteFixedExpense(deletingExpenseId);
      if (result.success) {
        setFixedExpenses(fixedExpenses.filter(e => e.id !== deletingExpenseId));
      }
    } finally {
      setIsSaving(false);
      setShowDeleteConfirm(false);
      setDeletingExpenseId(null);
    }
  };

  const confirmDeleteExpense = (expenseId) => {
    setDeletingExpenseId(expenseId);
    setShowDeleteConfirm(true);
  };

  const handleSetWeeklyBudget = async (amount) => {
    if (!amount || amount <= 0) return;
    const result = await saveWeeklyBudget(weekInfo.weekKey, amount);
    if (result.success) {
      setWeeklyBudget(result.data);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-white p-6 pb-4">
        <div className="flex items-center gap-4 mb-2">
          <button onClick={onBack} className="text-gray-600 active:scale-95">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-gray-800">预算设置</h1>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* 每月日常预算 */}
        <div className="bg-white rounded-2xl p-5">
          <h2 className="text-base font-semibold text-gray-800 mb-4">每月日常预算</h2>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-gray-400">¥</span>
            <input
              type="number"
              value={localMonthlyBudget}
              onChange={(e) => handleMonthlyBudgetChange(e.target.value)}
              className="w-full pl-10 pr-4 py-4 border-2 border-gray-200 rounded-xl text-2xl font-bold text-gray-800 focus:border-cyan-400 focus:outline-none bg-gray-50"
              placeholder="3000"
            />
          </div>
          <p className="text-sm text-gray-400 mt-3">用于日常开销的每月总预算</p>
        </div>

        {/* 固定支出 */}
        <div className="bg-white rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800">固定支出</h2>
            <button 
              onClick={openAddExpenseModal}
              className="text-cyan-500 flex items-center gap-1 text-sm active:scale-95"
            >
              <Plus size={16} />添加
            </button>
          </div>
          
          {fixedExpenses.length === 0 ? (
            <div className="py-8 text-center text-gray-400">
              <p>暂无固定支出</p>
              <p className="text-sm mt-1">添加房租、水电等每月固定开销</p>
            </div>
          ) : (
            <div className="space-y-3">
              {fixedExpenses.map(expense => (
                <div 
                  key={expense.id} 
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">{expense.name}</div>
                    {expense.expireDate && (
                      <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                        <Calendar size={12} />
                        到期：{expense.expireDate}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-800">¥{expense.amount}</span>
                    <button 
                      onClick={() => openEditExpenseModal(expense)}
                      className="text-gray-400 p-1 active:scale-95"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={() => confirmDeleteExpense(expense.id)}
                      className="text-gray-400 p-1 active:scale-95"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
            <span className="text-gray-500">固定支出合计</span>
            <span className="text-lg font-bold text-gray-800">¥{totalFixedExpenses.toLocaleString()}</span>
          </div>
        </div>

        {/* 周预算建议 */}
        <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-5">
          <h2 className="text-base font-semibold text-gray-800 mb-3">周预算建议</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">月预算</span>
              <span className="text-gray-800">¥{monthlyBudget.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">- 固定支出</span>
              <span className="text-gray-800">¥{totalFixedExpenses.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">= 可支配金额</span>
              <span className="text-gray-800">¥{availableForWeekly.toLocaleString()}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-cyan-200">
              <span className="text-gray-500">÷ 4周</span>
              <span className="text-lg font-bold text-cyan-600">¥{suggestedWeeklyBudget.toLocaleString()}/周</span>
            </div>
          </div>
          {weeklyBudget && weeklyBudget.amount !== suggestedWeeklyBudget && (
            <button
              onClick={() => handleSetWeeklyBudget(suggestedWeeklyBudget)}
              className="mt-4 w-full py-2 bg-cyan-500 text-white rounded-xl text-sm font-medium active:scale-95"
            >
              应用到本周
            </button>
          )}
        </div>

        {/* 远航计划 */}
        <div className="bg-white rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Anchor size={18} className="text-cyan-500" />
              <h2 className="text-base font-semibold text-gray-800">远航计划</h2>
            </div>
            <button 
              onClick={() => navigateTo('editSpecialBudget', { editingSpecialBudget: {} })}
              className="text-cyan-500 flex items-center gap-1 text-sm active:scale-95"
            >
              <Plus size={16} />新建
            </button>
          </div>
          
          {specialBudgets.length === 0 ? (
            <div className="py-8 text-center text-gray-400">
              <p>暂无远航计划</p>
              <p className="text-sm mt-1">为旅行、大件购物等创建专项预算</p>
            </div>
          ) : (
            <div className="space-y-3">
              {specialBudgets.map(budget => {
                const iconConfig = BUDGET_ICONS[budget.icon] || BUDGET_ICONS.other;
                const IconComponent = iconConfig.icon;
                const items = specialBudgetItems[budget.id] || [];
                const totalSpent = items.reduce((sum, item) => sum + (item.actualAmount || 0), 0);
                const totalBudget = items.reduce((sum, item) => sum + (item.budgetAmount || 0), 0);
                
                return (
                  <div 
                    key={budget.id}
                    onClick={() => navigateTo('specialBudgetDetail', { editingSpecialBudget: budget })}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer active:bg-gray-100"
                  >
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: iconConfig.color + '15' }}
                    >
                      <IconComponent size={20} style={{ color: iconConfig.color }} />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-800 flex items-center gap-2">
                        {budget.name}
                        {budget.pinnedToHome && (
                          <span className="text-xs bg-cyan-100 text-cyan-600 px-1.5 py-0.5 rounded">首页</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-400">
                        预算 ¥{totalBudget.toLocaleString()} · 已用 ¥{totalSpent.toLocaleString()}
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-gray-300" />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 固定支出编辑弹窗 */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl p-6 mx-4 w-full max-w-sm">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {editingExpense ? '编辑固定支出' : '添加固定支出'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-600 mb-2">名称</label>
                <input
                  type="text"
                  value={expenseName}
                  onChange={(e) => setExpenseName(e.target.value)}
                  placeholder="例如：房租、水电费"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-cyan-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-600 mb-2">金额</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-gray-400">¥</span>
                  <input
                    type="number"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    placeholder="0"
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl text-lg focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-gray-600 mb-2">到期日期（可选）</label>
                <input
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowExpenseModal(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium active:scale-95"
                disabled={isSaving}
              >
                取消
              </button>
              <button
                onClick={handleSaveExpense}
                disabled={!expenseName || !expenseAmount || isSaving}
                className="flex-1 py-3 bg-gray-800 text-white rounded-xl font-medium active:scale-95 disabled:bg-gray-400"
              >
                {isSaving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认弹窗 */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="删除固定支出"
        message="确定要删除这项固定支出吗？"
        onConfirm={handleDeleteExpense}
        onCancel={() => { setShowDeleteConfirm(false); setDeletingExpenseId(null); }}
      />

      {/* 全局加载遮罩 */}
      {isSaving && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-2xl p-6 flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
            <p className="text-gray-600 mt-3">处理中...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetSetupView;