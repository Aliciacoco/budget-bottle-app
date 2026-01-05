// CalculatorModal.jsx - 计算器弹窗组件
// 修复：底部安全区域 + 备注输入框点击问题

import React, { useState, useCallback } from 'react';

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
  
  // 运算符列表
  const operators = ['+', '-', '×', '÷'];
  
  const handleNumber = useCallback((num) => {
    setDisplay(prev => {
      if (prev === '' || prev === '0') return num === '.' ? '0.' : num;
      if (num === '.') {
        const parts = prev.split(/[\+\-×÷]/);
        const lastPart = parts[parts.length - 1].trim();
        if (lastPart.includes('.')) return prev;
      }
      return prev + num;
    });
  }, []);
  
  const handleOperator = useCallback((op) => {
    setDisplay(prev => {
      if (!prev) return prev;
      
      const trimmed = prev.trim();
      const lastChar = trimmed.slice(-1);
      const isLastCharOperator = operators.includes(lastChar);
      
      if (isLastCharOperator) {
        return trimmed.slice(0, -1) + op + ' ';
      }
      
      if (hasOperator) return prev;
      
      setHasOperator(true);
      return trimmed + ' ' + op + ' ';
    });
  }, [hasOperator, operators]);
  
  const handleBackspace = useCallback(() => {
    setDisplay(prev => {
      let newVal = prev;
      if (prev.endsWith(' ')) {
        newVal = prev.slice(0, -3).trim();
      } else {
        newVal = prev.slice(0, -1);
      }
      
      const hasOp = operators.some(op => newVal.includes(op));
      setHasOperator(hasOp);
      
      return newVal;
    });
  }, [operators]);
  
  const calculate = useCallback(() => {
    try {
      let expr = display.replace(/×/g, '*').replace(/÷/g, '/').replace(/\s/g, '');
      if (!expr) return 0;
      
      if (['+', '-', '*', '/'].includes(expr.slice(-1))) {
        expr = expr.slice(0, -1);
      }
      
      const result = Function('"use strict"; return (' + expr + ')')();
      return isNaN(result) || !isFinite(result) ? 0 : Math.round(result * 100) / 100;
    } catch { 
      return 0; 
    }
  }, [display]);
  
  const handleEquals = useCallback(() => {
    const result = calculate();
    if (result !== 0 || display) {
      setDisplay(result.toString());
      setHasOperator(false);
    }
  }, [calculate, display]);
  
  const handleConfirm = useCallback(() => {
    const result = calculate();
    if (result <= 0) return;
    
    if (showNote && onNoteChange) {
      onNoteChange(note);
    }
    onChange(result, note);
    onClose();
  }, [calculate, showNote, onNoteChange, note, onChange, onClose]);
  
  const stopPropagation = useCallback((e) => {
    e.stopPropagation();
    e.preventDefault();
  }, []);
  
  const stopPropagationOnly = useCallback((e) => {
    e.stopPropagation();
  }, []);
  
  const createButtonHandler = useCallback((handler, ...args) => {
    return (e) => {
      e.stopPropagation();
      e.preventDefault();
      handler(...args);
    };
  }, []);
  
  const displayResult = calculate();
  
  const baseKeyClass = "py-4 rounded-2xl text-xl font-bold active:scale-95 transition-all select-none touch-manipulation";
  const numberKeyClass = `${baseKeyClass} bg-white border-2 border-gray-200 text-gray-700 active:bg-gray-50`;
  const operatorKeyClass = `${baseKeyClass} bg-gray-100 border-2 border-gray-200 text-gray-500 active:bg-gray-200`;
  
  const handleClose = useCallback((e) => {
    e.stopPropagation();
    e.preventDefault();
    setTimeout(() => {
      onClose();
    }, 50);
  }, [onClose]);

  return (
    <div 
      className="calc-overlay fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm" 
      onClick={handleClose}
      onTouchStart={stopPropagation}
      onTouchEnd={handleClose}
      onTouchMove={stopPropagation}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@400;500;700;800&display=swap');
        .font-rounded { font-family: 'M PLUS Rounded 1c', sans-serif; }
        @keyframes slide-up { 
          from { transform: translateY(100%); } 
          to { transform: translateY(0); } 
        }
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
        .calc-panel {
          touch-action: none;
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          user-select: none;
          /* 关键修复：底部安全区域 */
          padding-bottom: env(safe-area-inset-bottom, 0px);
          /* 限制最大高度，防止超出屏幕 */
          max-height: 90vh;
          max-height: 90dvh;
        }
        .calc-panel button {
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
        }
        .calc-panel input {
          touch-action: auto;
          -webkit-user-select: text;
          user-select: text;
        }
        .calc-overlay {
          touch-action: none;
        }
        /* 确保内容可滚动 */
        .calc-content {
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }
      `}</style>

      <div 
        className="calc-panel bg-white rounded-t-3xl w-full max-w-md overflow-hidden animate-slide-up shadow-2xl" 
        onClick={stopPropagation}
        onTouchEnd={stopPropagation}
        onTouchStart={stopPropagation}
        onTouchMove={stopPropagation}
      >
        <div className="calc-content">
          {/* 显示区域 */}
          <div className="p-5 bg-gray-50 border-b-2 border-gray-100">
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
            <div className="px-4 pt-3 pb-2">
              <input 
                type="text" 
                value={note} 
                onChange={(e) => setNote(e.target.value)} 
                placeholder="备注：超市、外卖..." 
                className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-200 rounded-2xl text-gray-700 font-bold placeholder-gray-400 focus:outline-none focus:bg-white focus:border-cyan-400 transition-colors"
                onClick={stopPropagationOnly}
                onTouchStart={stopPropagationOnly}
                onTouchEnd={stopPropagationOnly}
                onFocus={stopPropagationOnly}
              />
            </div>
          )}
          
          {/* 数字键盘 - 4列布局，减小间距 */}
          <div className="p-3 grid grid-cols-4 gap-2">
            {/* 第一行: 1 2 3 ÷ */}
            <button onTouchEnd={createButtonHandler(handleNumber, '1')} onClick={createButtonHandler(handleNumber, '1')} className={numberKeyClass}>1</button>
            <button onTouchEnd={createButtonHandler(handleNumber, '2')} onClick={createButtonHandler(handleNumber, '2')} className={numberKeyClass}>2</button>
            <button onTouchEnd={createButtonHandler(handleNumber, '3')} onClick={createButtonHandler(handleNumber, '3')} className={numberKeyClass}>3</button>
            <button onTouchEnd={createButtonHandler(handleOperator, '÷')} onClick={createButtonHandler(handleOperator, '÷')} className={operatorKeyClass}>÷</button>
            
            {/* 第二行: 4 5 6 × */}
            <button onTouchEnd={createButtonHandler(handleNumber, '4')} onClick={createButtonHandler(handleNumber, '4')} className={numberKeyClass}>4</button>
            <button onTouchEnd={createButtonHandler(handleNumber, '5')} onClick={createButtonHandler(handleNumber, '5')} className={numberKeyClass}>5</button>
            <button onTouchEnd={createButtonHandler(handleNumber, '6')} onClick={createButtonHandler(handleNumber, '6')} className={numberKeyClass}>6</button>
            <button onTouchEnd={createButtonHandler(handleOperator, '×')} onClick={createButtonHandler(handleOperator, '×')} className={operatorKeyClass}>×</button>
            
            {/* 第三行: 7 8 9 − */}
            <button onTouchEnd={createButtonHandler(handleNumber, '7')} onClick={createButtonHandler(handleNumber, '7')} className={numberKeyClass}>7</button>
            <button onTouchEnd={createButtonHandler(handleNumber, '8')} onClick={createButtonHandler(handleNumber, '8')} className={numberKeyClass}>8</button>
            <button onTouchEnd={createButtonHandler(handleNumber, '9')} onClick={createButtonHandler(handleNumber, '9')} className={numberKeyClass}>9</button>
            <button onTouchEnd={createButtonHandler(handleOperator, '-')} onClick={createButtonHandler(handleOperator, '-')} className={operatorKeyClass}>−</button>
            
            {/* 第四行: . 0 ⌫ + */}
            <button onTouchEnd={createButtonHandler(handleNumber, '.')} onClick={createButtonHandler(handleNumber, '.')} className={numberKeyClass}>.</button>
            <button onTouchEnd={createButtonHandler(handleNumber, '0')} onClick={createButtonHandler(handleNumber, '0')} className={numberKeyClass}>0</button>
            <button onTouchEnd={createButtonHandler(handleBackspace)} onClick={createButtonHandler(handleBackspace)} className={operatorKeyClass}>⌫</button>
            <button onTouchEnd={createButtonHandler(handleOperator, '+')} onClick={createButtonHandler(handleOperator, '+')} className={operatorKeyClass}>+</button>
            
            {/* 第五行: 取消 = 确认(占2格) */}
            <button 
              onTouchEnd={handleClose}
              onClick={handleClose}
              className={`${baseKeyClass} bg-gray-50 border-2 border-gray-200 text-gray-400 active:bg-gray-100`}
            >
              取消
            </button>
            <button 
              onTouchEnd={createButtonHandler(handleEquals)} 
              onClick={createButtonHandler(handleEquals)} 
              className={`${baseKeyClass} bg-amber-50 border-2 border-amber-200 text-amber-500 active:bg-amber-100`}
            >
              =
            </button>
            <button 
              onTouchEnd={createButtonHandler(handleConfirm)}
              onClick={createButtonHandler(handleConfirm)}
              disabled={displayResult <= 0}
              className="col-span-2 py-4 rounded-2xl text-xl font-extrabold text-white active:scale-95 transition-all border-b-4 active:border-b-0 active:translate-y-1 disabled:opacity-50 disabled:pointer-events-none select-none touch-manipulation"
              style={{ 
                backgroundColor: colors.primary,
                borderColor: colors.primaryDark
              }}
            >
              {showNote ? '记录' : '完成'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calculator;