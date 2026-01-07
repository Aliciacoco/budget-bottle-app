// FixedExpenseListView.jsx - 固定支出列表页面
// 修改：删除底部说明文字

import React, { useState } from 'react';
import { ArrowLeft, Plus, ChevronRight, Calendar } from 'lucide-react';

const FixedExpenseListView = ({ 
  fixedExpenses = [],
  onBack,
  navigateTo
}) => {
  const enabledExpenses = fixedExpenses.filter(e => e.enabled !== false);
  const totalAmount = enabledExpenses.reduce((sum, e) => sum + e.amount, 0);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700;900&display=swap');
        .font-chinese { 
          font-family: 'Noto Sans SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
        }
      `}</style>
      
      {/* 导航栏 */}
      <div className="bg-white border-b-2 border-gray-200 px-4 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <button 
            onClick={onBack}
            className="w-12 h-12 bg-white border-2 border-gray-200 rounded-2xl flex items-center justify-center text-gray-400 hover:text-gray-600 active:scale-95 transition-all"
          >
            <ArrowLeft size={24} strokeWidth={2.5} />
          </button>
          <h1 className="text-xl font-black text-gray-700 font-chinese">每个月</h1>
          <button 
            onClick={() => navigateTo('editFixedExpense', { editingExpense: {} })}
            className="w-12 h-12 bg-amber-500 border-b-4 border-amber-600 rounded-2xl flex items-center justify-center text-white active:border-b-0 active:translate-y-1 transition-all"
          >
            <Plus size={24} strokeWidth={2.5} />
          </button>
        </div>
      </div>
      
      <div className="px-4 pt-6">
        {/* 汇总卡片 - 多邻国风格 */}
        <div className="bg-amber-500 rounded-2xl border-b-4 border-amber-600 p-5 mb-6">
          <p className="text-white/70 text-sm font-bold mb-1 font-chinese">每月固定支出</p>
          <div className="flex items-baseline gap-1">
            <span className="text-white/60 text-2xl font-bold">¥</span>
            <span className="text-white text-4xl font-black">
              {totalAmount.toLocaleString()}
            </span>
          </div>
          <p className="text-white/50 text-xs mt-2 font-chinese">
            {enabledExpenses.length} 个项目
          </p>
        </div>
        
        {/* 支出列表 */}
        {enabledExpenses.length > 0 ? (
          <div className="bg-white rounded-2xl border-2 border-gray-200 border-b-4 overflow-hidden">
            {enabledExpenses.map((expense, index) => (
              <div 
                key={expense.id}
                onClick={() => navigateTo('editFixedExpense', { editingExpense: expense })}
                className={`p-4 flex items-center justify-between cursor-pointer active:bg-gray-50 transition-all ${
                  index !== enabledExpenses.length - 1 ? 'border-b-2 border-gray-100' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                    <Calendar size={20} className="text-amber-500" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-700 font-chinese">{expense.name}</p>
                    {expense.expireDate && (
                      <p className="text-gray-400 text-xs mt-0.5 font-chinese">
                        到期：{expense.expireDate}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-amber-600 font-bold">¥{expense.amount.toLocaleString()}</span>
                  <ChevronRight size={20} className="text-gray-300" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border-2 border-gray-200 border-b-4 p-8 text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Calendar size={32} className="text-amber-400" />
            </div>
            <p className="text-gray-700 font-bold mb-1 font-chinese">还没有固定支出</p>
            <p className="text-gray-400 text-sm mb-4 font-chinese">
              添加房租、订阅等每月必付项目
            </p>
            <button
              onClick={() => navigateTo('editFixedExpense', { editingExpense: {} })}
              className="px-6 py-3 bg-amber-500 border-b-4 border-amber-600 text-white font-bold rounded-xl active:border-b-0 active:translate-y-1 transition-all"
            >
              添加第一个
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FixedExpenseListView;