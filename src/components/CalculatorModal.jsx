import React, { useState } from 'react';

const Calculator = ({ value, onChange, onClose }) => {
  const [display, setDisplay] = useState(value ? value.toString() : '');
  const [hasOperator, setHasOperator] = useState(false);
  
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
      const result = eval(expr);
      return isNaN(result) ? 0 : Math.round(result * 100) / 100;
    } catch { return 0; }
  };
  
  const handleConfirm = () => {
    const result = calculate();
    onChange(result);
    onClose();
  };
  
  const displayResult = calculate();
  
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div className="bg-white rounded-t-3xl w-full max-w-md overflow-hidden animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 bg-gray-50">
          <div className="text-right">
            <div className="text-2xl text-cyan-500 font-bold mb-1">¥{display || '0'}</div>
            {hasOperator && <div className="text-sm text-gray-400">= ¥{displayResult}</div>}
          </div>
        </div>
        <div className="p-4 grid grid-cols-4 gap-3">
          {['1', '2', '3', '+'].map(key => (
            <button 
              key={key} 
              onClick={() => key === '+' ? handleOperator('+') : handleNumber(key)}
              className={`py-4 rounded-xl text-xl font-medium active:scale-95 ${key === '+' ? 'bg-gray-100 text-gray-600' : 'bg-white border border-gray-200'}`}
            >
              {key}
            </button>
          ))}
          {['4', '5', '6', '-'].map(key => (
            <button 
              key={key} 
              onClick={() => key === '-' ? handleOperator('-') : handleNumber(key)}
              className={`py-4 rounded-xl text-xl font-medium active:scale-95 ${key === '-' ? 'bg-gray-100 text-gray-600' : 'bg-white border border-gray-200'}`}
            >
              {key}
            </button>
          ))}
          {['7', '8', '9', '×'].map(key => (
            <button 
              key={key} 
              onClick={() => key === '×' ? handleOperator('×') : handleNumber(key)}
              className={`py-4 rounded-xl text-xl font-medium active:scale-95 ${key === '×' ? 'bg-gray-100 text-gray-600' : 'bg-white border border-gray-200'}`}
            >
              {key}
            </button>
          ))}
          <button onClick={() => handleNumber('.')} className="py-4 rounded-xl text-xl font-medium bg-white border border-gray-200 active:scale-95">.</button>
          <button onClick={() => handleNumber('0')} className="py-4 rounded-xl text-xl font-medium bg-white border border-gray-200 active:scale-95">0</button>
          <button onClick={handleBackspace} className="py-4 rounded-xl text-xl font-medium bg-gray-100 text-gray-600 active:scale-95">⌫</button>
          <button onClick={handleConfirm} className="py-4 rounded-xl text-xl font-medium bg-cyan-500 text-white active:scale-95">完成</button>
        </div>
        <div className="px-4 pb-6">
          <button onClick={onClose} className="w-full py-3 text-gray-500 text-center">取消</button>
        </div>
      </div>
      <style>{`
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
      `}</style>
    </div>
  );
};

export default Calculator;