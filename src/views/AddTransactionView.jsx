//添加消费页

import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { createTransaction } from '../api';
import { formatDate } from '../utils/helpers';

const AddTransactionView = ({ 
  weekInfo, 
  transactions, 
  setTransactions, 
  viewingTransactions, 
  setViewingTransactions 
}) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async () => {
    if (!amount) return;
    const now = new Date();
    const result = await createTransaction(
      weekInfo.weekKey, 
      formatDate(now), 
      `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`, 
      parseFloat(amount), 
      description
    );
    if (result.success) {
      setTransactions([...transactions, result.data]);
      setViewingTransactions([...viewingTransactions, result.data]);
      window.history.back();
    } else { 
      alert('记录失败: ' + result.error); 
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => window.history.back()} className="flex items-center gap-2 text-gray-600 mb-6 active:scale-95">
          <ArrowLeft size={20} />返回
        </button>
        <h1 className="text-2xl font-bold text-gray-800 mb-8">记录消费</h1>
        <div className="bg-white rounded-2xl p-6 space-y-6">
          <div>
            <label className="block text-gray-600 mb-2">金额</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-gray-400">¥</span>
              <input 
                type="number" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)} 
                placeholder="0.00" 
                className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl text-2xl font-bold focus:border-gray-400 focus:outline-none" 
                autoFocus 
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
          <button 
            onClick={handleSubmit} 
            disabled={!amount} 
            className="w-full py-4 bg-gray-800 text-white rounded-xl font-medium disabled:bg-gray-300 active:scale-95"
          >
            记录消费
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddTransactionView;