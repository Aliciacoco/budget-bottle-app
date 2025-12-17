//编辑固定支出

import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { createFixedExpense, updateFixedExpense, deleteFixedExpense, getFixedExpenses } from '../api';
import ConfirmModal from '../components/ConfirmModal';

const EditExpenseView = ({ 
  editingExpense, 
  fixedExpenses, 
  setFixedExpenses, 
  refreshFixedExpenses 
}) => {
  const isNew = !editingExpense?.id;
  const [name, setName] = useState(editingExpense?.name || '');
  const [amount, setAmount] = useState(editingExpense?.amount?.toString() || '');
  const [expireDate, setExpireDate] = useState(editingExpense?.expireDate || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSubmit = async () => {
    if (!name || !amount) return;
    let result;
    if (isNew) { 
      result = await createFixedExpense(name, parseFloat(amount), expireDate, true); 
    } else { 
      result = await updateFixedExpense(editingExpense.id, name, parseFloat(amount), expireDate, true); 
    }
    if (result.success) {
      if (refreshFixedExpenses) {
        await refreshFixedExpenses();
      } else { 
        const expenseResult = await getFixedExpenses(); 
        if (expenseResult.success) setFixedExpenses(expenseResult.data); 
      }
      window.history.back();
    } else { 
      alert('保存失败: ' + result.error); 
    }
  };

  const handleDelete = async () => {
    const result = await deleteFixedExpense(editingExpense.id);
    if (result.success) {
      if (refreshFixedExpenses) {
        await refreshFixedExpenses();
      } else {
        setFixedExpenses(fixedExpenses.filter(e => e.id !== editingExpense.id));
      }
      window.history.back();
    } else { 
      alert('删除失败: ' + result.error); 
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => window.history.back()} className="flex items-center gap-2 text-gray-600 mb-6 active:scale-95">
          <ArrowLeft size={20} />返回
        </button>
        <h1 className="text-2xl font-bold text-gray-800 mb-8">
          {isNew ? '添加固定支出' : '编辑固定支出'}
        </h1>
        <div className="bg-white rounded-2xl p-6 space-y-6">
          <div>
            <label className="block text-gray-600 mb-2">名称</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="例如：Claude会员" 
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-gray-400 focus:outline-none" 
            />
          </div>
          <div>
            <label className="block text-gray-600 mb-2">每月金额</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-gray-400">¥</span>
              <input 
                type="number" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)} 
                placeholder="0" 
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl text-lg focus:border-gray-400 focus:outline-none" 
              />
            </div>
          </div>
          <div>
            <label className="block text-gray-600 mb-2">到期日期（可选）</label>
            <input 
              type="text" 
              value={expireDate} 
              onChange={(e) => setExpireDate(e.target.value)} 
              placeholder="例如：2025/12/25" 
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-gray-400 focus:outline-none" 
            />
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handleSubmit} 
              disabled={!name || !amount} 
              className="flex-1 py-4 bg-gray-800 text-white rounded-xl font-medium disabled:bg-gray-300 active:scale-95"
            >
              保存
            </button>
            {!isNew && (
              <button 
                onClick={() => setShowDeleteConfirm(true)} 
                className="px-6 py-4 bg-red-500 text-white rounded-xl font-medium active:scale-95"
              >
                删除
              </button>
            )}
          </div>
        </div>
      </div>
      <ConfirmModal 
        isOpen={showDeleteConfirm} 
        title="删除固定支出" 
        message={`确定要删除"${name}"吗？此操作无法撤销。`} 
        onConfirm={handleDelete} 
        onCancel={() => setShowDeleteConfirm(false)} 
      />
    </div>
  );
};

export default EditExpenseView;