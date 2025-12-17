//编辑消费页

import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { updateTransaction, deleteTransaction } from '../api';
import ConfirmModal from '../components/ConfirmModal';

const EditTransactionView = ({ 
  editingTransaction, 
  weekInfo, 
  transactions, 
  setTransactions, 
  viewingTransactions, 
  setViewingTransactions 
}) => {
  const [amount, setAmount] = useState(editingTransaction?.amount?.toString() || '');
  const [description, setDescription] = useState(editingTransaction?.description || '');
  const [date, setDate] = useState(editingTransaction?.date?.replace(/\//g, '-') || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!editingTransaction) return null;

  const handleSubmit = async () => {
    if (!amount) return;
    const result = await updateTransaction(
      editingTransaction.id, 
      weekInfo.weekKey, 
      parseFloat(amount), 
      description, 
      date.replace(/-/g, '/')
    );
    if (result.success) {
      setTransactions(transactions.map(t => t.id === editingTransaction.id ? result.data : t));
      setViewingTransactions(viewingTransactions.map(t => t.id === editingTransaction.id ? result.data : t));
      window.history.back();
    } else { 
      alert('保存失败: ' + result.error); 
    }
  };

  const handleDelete = async () => {
    const result = await deleteTransaction(editingTransaction.id);
    if (result.success) {
      setTransactions(transactions.filter(t => t.id !== editingTransaction.id));
      setViewingTransactions(viewingTransactions.filter(t => t.id !== editingTransaction.id));
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
        <h1 className="text-2xl font-bold text-gray-800 mb-8">编辑消费</h1>
        <div className="bg-white rounded-2xl p-6 space-y-6">
          <div>
            <label className="block text-gray-600 mb-2">日期</label>
            <input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)} 
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-gray-400 focus:outline-none" 
            />
          </div>
          <div>
            <label className="block text-gray-600 mb-2">金额</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-gray-400">¥</span>
              <input 
                type="number" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)} 
                className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl text-2xl font-bold focus:border-gray-400 focus:outline-none" 
              />
            </div>
          </div>
          <div>
            <label className="block text-gray-600 mb-2">备注</label>
            <input 
              type="text" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="例如：超市、外卖..." 
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-gray-400 focus:outline-none" 
            />
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handleSubmit} 
              disabled={!amount} 
              className="flex-1 py-4 bg-gray-800 text-white rounded-xl font-medium disabled:bg-gray-300 active:scale-95"
            >
              保存
            </button>
            <button 
              onClick={() => setShowDeleteConfirm(true)} 
              className="px-6 py-4 bg-red-500 text-white rounded-xl font-medium active:scale-95"
            >
              删除
            </button>
          </div>
        </div>
      </div>
      <ConfirmModal 
        isOpen={showDeleteConfirm} 
        title="删除消费记录" 
        message="确定要删除这条消费记录吗？此操作无法撤销。" 
        onConfirm={handleDelete} 
        onCancel={() => setShowDeleteConfirm(false)} 
      />
    </div>
  );
};

export default EditTransactionView;