// ConfirmModal.jsx - 确认弹窗组件
// 使用设计系统优化

import React from 'react';

const ConfirmModal = ({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = '确定删除',
  cancelText = '取消',
  confirmVariant = 'danger'  // danger | primary | warning
}) => {
  if (!isOpen) return null;
  
  // 确认按钮样式
  const confirmStyles = {
    danger: 'bg-red-500 border-red-600 hover:bg-red-400',
    primary: 'bg-cyan-500 border-cyan-600 hover:bg-cyan-400',
    warning: 'bg-amber-500 border-amber-600 hover:bg-amber-400',
  };
  
  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onCancel}
    >
      <div 
        className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-extrabold text-gray-700 mb-2 text-center">{title}</h2>
        {message && <p className="text-gray-500 font-medium text-center mb-6">{message}</p>}
        <div className="flex gap-3">
          <button 
            onClick={onCancel} 
            className="flex-1 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-2xl font-bold border-b-4 active:border-b-2 active:translate-y-[2px] transition-all hover:bg-gray-50"
          >
            {cancelText}
          </button>
          <button 
            onClick={onConfirm} 
            className={`flex-1 py-3 text-white rounded-2xl font-bold border-b-4 active:border-b-0 active:translate-y-1 transition-all ${confirmStyles[confirmVariant]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
      
      <style>{`
        @keyframes zoom-in-95 {
          from { 
            opacity: 0;
            transform: scale(0.95);
          }
          to { 
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-in {
          animation: zoom-in-95 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ConfirmModal;