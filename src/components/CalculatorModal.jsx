// CalculatorModal.jsx - 计算器弹窗组件
// 修复：passive event listener 警告 + 底部安全区域

import React, { useState, useCallback, useRef, useEffect } from 'react';

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
  
  const panelRef = useRef(null);
  const overlayRef = useRef(null);
  
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
  
  // 只阻止冒泡，不阻止默认行为（避免 passive event listener 警告）
  const stopPropagationOnly = useCallback((e) => {
    e.stopPropagation();
  }, []);
  
  // 按钮点击处理器 - 只用于 onClick，不用于 touch 事件
  const createButtonHandler = useCallback((handler, ...args) => {
    return (e) => {
      e.stopPropagation();
      handler(...args);
    };
  }, []);
  
  const displayResult = calculate();
  
  const baseKeyClass = "py-4 rounded-2xl text-xl font-bold active:scale-95 transition-all select-none touch-manipulation";
  const numberKeyClass = `${baseKeyClass} bg-white border-2 border-gray-200 text-gray-700 active:bg-gray-50`;
  const operatorKeyClass = `${baseKeyClass} bg-gray-100 border-2 border-gray-200 text-gray-500 active:bg-gray-200`;
  
  // 关闭处理 - 只用于 onClick
  const handleClose = useCallback((e) => {
    e.stopPropagation();
    onClose();
  }, [onClose]);

  // 点击遮罩层关闭
  const handleOverlayClick = useCallback((e) => {
    // 只有点击遮罩层本身才关闭，点击面板内部不关闭
    if (e.target === overlayRef.current) {
      onClose();
    }
  }, [onClose]);

  // 使用 useEffect 添加非 passive 的 touch 事件监听器（如果真的需要阻止默认行为）
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    
    // 阻止面板上的 touchmove 滚动穿透
    const preventScroll = (e) => {
      // 只在面板内部阻止，允许输入框等可滚动元素正常工作
      const target = e.target;
      if (target.tagName === 'INPUT' || target.closest('.calc-content')) {
        return;
      }
      e.preventDefault();
    };
    
    panel.addEventListener('touchmove', preventScroll, { passive: false });
    
    return () => {
      panel.removeEventListener('touchmove', preventScroll);
    };
  }, []);

  return (
    <div 
      ref={overlayRef}
      className="calc-overlay fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm" 
      onClick={handleOverlayClick}
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
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          user-select: none;
          padding-bottom: env(safe-area-inset-bottom, 0px);
          max-height: 90vh;
          max-height: 90dvh;
        }
        .calc-panel button {
          -webkit-tap-highlight-color: transparent;
        }
        .calc-panel input {
          -webkit-user-select: text;
          user-select: text;
        }
      `}</style>

      <div 
        ref={panelRef}
        className="calc-panel bg-white rounded-t-3xl w-full max-w-md overflow-hidden animate-slide-up shadow-2xl" 
        onClick={stopPropagationOnly}
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
              />
            </div>
          )}
          
          {/* 数字键盘 - 4列布局 */}
          <div className="p-3 grid grid-cols-4 gap-2">
            {/* 第一行: 1 2 3 ÷ */}
            <button onClick={createButtonHandler(handleNumber, '1')} className={numberKeyClass}>1</button>
            <button onClick={createButtonHandler(handleNumber, '2')} className={numberKeyClass}>2</button>
            <button onClick={createButtonHandler(handleNumber, '3')} className={numberKeyClass}>3</button>
            <button onClick={createButtonHandler(handleOperator, '÷')} className={operatorKeyClass}>÷</button>
            
            {/* 第二行: 4 5 6 × */}
            <button onClick={createButtonHandler(handleNumber, '4')} className={numberKeyClass}>4</button>
            <button onClick={createButtonHandler(handleNumber, '5')} className={numberKeyClass}>5</button>
            <button onClick={createButtonHandler(handleNumber, '6')} className={numberKeyClass}>6</button>
            <button onClick={createButtonHandler(handleOperator, '×')} className={operatorKeyClass}>×</button>
            
            {/* 第三行: 7 8 9 − */}
            <button onClick={createButtonHandler(handleNumber, '7')} className={numberKeyClass}>7</button>
            <button onClick={createButtonHandler(handleNumber, '8')} className={numberKeyClass}>8</button>
            <button onClick={createButtonHandler(handleNumber, '9')} className={numberKeyClass}>9</button>
            <button onClick={createButtonHandler(handleOperator, '-')} className={operatorKeyClass}>−</button>
            
            {/* 第四行: . 0 ⌫ + */}
            <button onClick={createButtonHandler(handleNumber, '.')} className={numberKeyClass}>.</button>
            <button onClick={createButtonHandler(handleNumber, '0')} className={numberKeyClass}>0</button>
            <button onClick={createButtonHandler(handleBackspace)} className={operatorKeyClass}>⌫</button>
            <button onClick={createButtonHandler(handleOperator, '+')} className={operatorKeyClass}>+</button>
            
            {/* 第五行: 取消 = 确认(占2格) */}
            <button 
              onClick={handleClose}
              className={`${baseKeyClass} bg-gray-50 border-2 border-gray-200 text-gray-400 active:bg-gray-100`}
            >
              取消
            </button>
            <button 
              onClick={createButtonHandler(handleEquals)} 
              className={`${baseKeyClass} bg-amber-50 border-2 border-amber-200 text-amber-500 active:bg-amber-100`}
            >
              =
            </button>
            <button 
              onClick={createButtonHandler(handleConfirm)}
              disabled={displayResult <= 0}
              className="col-span-2 py-4 rounded-2xl text-xl font-extrabold text-white active:scale-95 transition-all border-b-4 active:border-b-0 active:translate-y-1 disabled:opacity-50 disabled:pointer-events-none select-none"
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