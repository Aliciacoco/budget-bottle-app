// FixedExpenseListView.jsx - 固定支出列表页面
// 从消费全景-每个月入口进入

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
          <h1 className="text-lg font-bold text-gray-800">每个月</h1>
          <button 
            onClick={() => navigateTo('editFixedExpense', { editingExpense: {} })}
            className="w-12 h-12 bg-cyan-500 rounded-2xl flex items-center justify-center shadow-sm text-white hover:bg-cyan-600 active:scale-95 transition-all"
          >
            <Plus size={24} strokeWidth={2.5} />
          </button>
        </div>
      </div>
      
      <div className="px-6 pt-4">
        {/* 汇总卡片 */}
        <div className="bg-amber-500 rounded-3xl p-5 mb-6 relative overflow-hidden">
          {/* 背景装饰 */}
          <div className="absolute top-0 right-0 opacity-20">
            <svg width="100" height="80" viewBox="0 0 100 80" fill="none">
              <rect x="40" y="10" width="50" height="60" rx="8" fill="white"/>
              <rect x="50" y="20" width="30" height="4" rx="2" fill="white"/>
              <rect x="50" y="30" width="20" height="4" rx="2" fill="white"/>
            </svg>
          </div>
          
          <div className="relative z-10">
            <p className="text-white/70 text-sm font-medium mb-1">每月固定支出</p>
            <div className="flex items-baseline gap-1">
              <span className="text-white/60 text-2xl font-bold">¥</span>
              <span className="text-white text-4xl font-extrabold font-rounded">
                {totalAmount.toLocaleString()}
              </span>
            </div>
            <p className="text-white/50 text-xs mt-2">
              {enabledExpenses.length} 个项目
            </p>
          </div>
        </div>
        
        {/* 支出列表 */}
        {enabledExpenses.length > 0 ? (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {enabledExpenses.map((expense, index) => (
              <div 
                key={expense.id}
                onClick={() => navigateTo('editFixedExpense', { editingExpense: expense })}
                className={`p-4 flex items-center justify-between cursor-pointer active:bg-gray-50 transition-all ${
                  index !== enabledExpenses.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                    <Calendar size={20} className="text-amber-500" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">{expense.name}</p>
                    {expense.expireDate && (
                      <p className="text-gray-400 text-xs mt-0.5">
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
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Calendar size={32} className="text-amber-400" />
            </div>
            <p className="text-gray-800 font-bold mb-1">还没有固定支出</p>
            <p className="text-gray-400 text-sm mb-4">
              添加房租、订阅等每月必付项目
            </p>
            <button
              onClick={() => navigateTo('editFixedExpense', { editingExpense: {} })}
              className="px-6 py-3 bg-amber-500 text-white font-bold rounded-xl active:scale-95 transition-all"
            >
              添加第一个
            </button>
          </div>
        )}
        
        {/* 说明文字 */}
        <div className="mt-6 text-center">
          <p className="text-gray-300 text-xs leading-relaxed">
            固定支出会自动从月预算中扣除<br/>
            剩余金额才会分配到每周预算
          </p>
        </div>
      </div>
    </div>
  );
};

export default FixedExpenseListView;