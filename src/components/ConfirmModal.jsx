import React from 'react';

const ConfirmModal = ({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = '确定删除', 
  confirmColor = 'bg-red-500' 
}) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl p-6 mx-4 w-full max-w-sm">
        <h2 className="text-lg font-bold text-gray-800 mb-2">{title}</h2>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex gap-3">
          <button 
            onClick={onCancel} 
            className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium active:scale-95"
          >
            取消
          </button>
          <button 
            onClick={onConfirm} 
            className={`flex-1 py-3 ${confirmColor} text-white rounded-xl font-medium active:scale-95`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;