// CalculatorModal.jsx - 计算器弹窗组件
// 使用设计系统优化

import React, { useState } from 'react';

// 设计系统颜色
const colors = {
  primary: '#06B6D4',
  primaryDark: '#0891B2',
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
  }
};

const Calculator = ({ 
  value, 
  onChange, 
  onClose, 
  showNote = false,
  noteValue = '',
  onNoteChange,
  title = '输入金额'
}) => {
  const [display, setDisplay] = useState(value ? value.toString() : '');
  const [hasOperator, setHasOperator] = useState(false);
  const [note, setNote] = useState(noteValue);
  
  const handleNumber = (num) => {
    setDisplay(prev => {
      if (prev === '' || prev === '0') return num === '.' ? '0.' : num;
      if (num === '.') {
        const parts = prev.split(/[\+\-×÷]/);
        const lastPart = parts[parts.length - 1].trim();
        if (lastPart.includes('.')) return prev;
      }
      return prev + num;
    });
  };
  
  const handleOperator = (op) => {
    if (display && !hasOperator) {
      setDisplay(prev => prev + ' ' + op + ' ');
      setHasOperator(true);
    }
  };
  
  const handleBackspace = () => {
    setDisplay(prev => {
      const newVal = prev.trim().slice(0, -1).trim();
      if (!newVal.includes('+') && !newVal.includes('-') && !newVal.includes('×') && !newVal.includes('÷')) {
        setHasOperator(false);
      }
      return newVal;
    });
  };
  
  const calculate = () => {
    try {
      let expr = display.replace(/×/g, '*').replace(/÷/g, '/').replace(/\s/g, '');
      if (!expr) return 0;
      const result = eval(expr);
      return isNaN(result) ? 0 : Math.round(result * 100) / 100;
    } catch { return 0; }
  };
  
  const handleConfirm = () => {
    const result = calculate();
    if (result <= 0) return;
    
    if (showNote && onNoteChange) {
      onNoteChange(note);
    }
    onChange(result, note);
    onClose();
  };
  
  const displayResult = calculate();
  
  // 按键样式
  const numberKeyClass = "py-4 rounded-2xl text-xl font-bold bg-white border-2 border-gray-200 text-gray-700 active:scale-95 active:bg-gray-50 transition-all";
  const operatorKeyClass = "py-4 rounded-2xl text-xl font-bold bg-gray-100 border-2 border-gray-200 text-gray-500 active:scale-95 active:bg-gray-200 transition-all";
  
  return (
    <div 
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm" 
      onClick={onClose}
    >
      {/* 引入字体 */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@400;500;700;800&display=swap');
        .font-rounded {
          font-family: 'M PLUS Rounded 1c', sans-serif;
        }
        @keyframes slide-up { 
          from { transform: translateY(100%); } 
          to { transform: translateY(0); } 
        }
        .animate-slide-up { 
          animation: slide-up 0.3s ease-out; 
        }
      `}</style>

      <div 
        className="bg-white rounded-t-3xl w-full max-w-md overflow-hidden animate-slide-up shadow-2xl" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* 显示区域 */}
        <div className="p-6 bg-gray-50 border-b-2 border-gray-100">
          <div className="text-sm text-gray-400 font-bold uppercase tracking-wider mb-2">{title}</div>
          <div className="text-right">
            <div className="text-3xl font-extrabold font-rounded" style={{ color: colors.primary }}>
              <span className="text-xl text-gray-300 mr-1">¥</span>
              {display || '0'}
            </div>
            {hasOperator && (
              <div className="text-sm text-gray-400 font-bold mt-1 font-rounded">
                = ¥{displayResult}
              </div>
            )}
          </div>
        </div>
        
        {/* 备注输入框 */}
        {showNote && (
          <div className="px-4 pt-4 pb-2">
            <input 
              type="text" 
              value={note} 
              onChange={(e) => setNote(e.target.value)} 
              placeholder="备注：超市、外卖..." 
              className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-200 rounded-2xl text-gray-700 font-bold placeholder-gray-400 focus:outline-none focus:bg-white focus:border-cyan-400 transition-colors"
            />
          </div>
        )}
        
        {/* 数字键盘 */}
        <div className="p-4 grid grid-cols-4 gap-3">
          {/* 第一行 */}
          <button onClick={() => handleNumber('1')} className={numberKeyClass}>1</button>
          <button onClick={() => handleNumber('2')} className={numberKeyClass}>2</button>
          <button onClick={() => handleNumber('3')} className={numberKeyClass}>3</button>
          <button onClick={() => handleOperator('+')} className={operatorKeyClass}>+</button>
          
          {/* 第二行 */}
          <button onClick={() => handleNumber('4')} className={numberKeyClass}>4</button>
          <button onClick={() => handleNumber('5')} className={numberKeyClass}>5</button>
          <button onClick={() => handleNumber('6')} className={numberKeyClass}>6</button>
          <button onClick={() => handleOperator('-')} className={operatorKeyClass}>-</button>
          
          {/* 第三行 */}
          <button onClick={() => handleNumber('7')} className={numberKeyClass}>7</button>
          <button onClick={() => handleNumber('8')} className={numberKeyClass}>8</button>
          <button onClick={() => handleNumber('9')} className={numberKeyClass}>9</button>
          <button onClick={() => handleOperator('×')} className={operatorKeyClass}>×</button>
          
          {/* 第四行 */}
          <button onClick={() => handleNumber('.')} className={numberKeyClass}>.</button>
          <button onClick={() => handleNumber('0')} className={numberKeyClass}>0</button>
          <button onClick={handleBackspace} className={operatorKeyClass}>⌫</button>
          <button 
            onClick={handleConfirm} 
            disabled={displayResult <= 0}
            className="py-4 rounded-2xl text-xl font-extrabold text-white active:scale-95 transition-all border-b-4 active:border-b-0 active:translate-y-1 disabled:opacity-50 disabled:pointer-events-none"
            style={{ 
              backgroundColor: colors.primary,
              borderColor: colors.primaryDark
            }}
          >
            {showNote ? '记录' : '完成'}
          </button>
        </div>
        
        {/* 取消按钮 */}
        <div className="px-4 pb-6">
          <button 
            onClick={onClose} 
            className="w-full py-3 text-gray-400 font-bold text-center hover:text-gray-600 active:scale-98 transition-all"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
};

export default Calculator;