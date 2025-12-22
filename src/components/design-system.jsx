// src/components/design-system.jsx - 精简版设计系统组件
// 修复：1. 禁止左右滑动 2. 支持自动增高的输入框

import React, { useRef, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';

// ==================== 颜色常量 ====================
export const colors = {
  primary: '#00BFDC',
  primaryDark: '#0891B2',
  success: '#22C55E',
  danger: '#EF4444',
  warning: '#F59E0B',
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
  }
};

// ==================== 页面容器 ====================
export const PageContainer = ({ children, bg = 'white', className = '' }) => {
  const bgClass = bg === 'gray' ? 'bg-gray-50' : 'bg-white';
  
  return (
    <div className={`min-h-screen ${bgClass} overflow-x-hidden ${className}`}>
      {/* 字体引入 + 全局禁止左右滑动 + iOS日期选择器修复 */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@400;500;700;800&display=swap');
        .font-rounded {
          font-family: 'M PLUS Rounded 1c', sans-serif;
        }
        html, body {
          overflow-x: hidden;
          max-width: 100vw;
        }
        /* iOS 日期选择器修复 */
        input[type="date"] {
          -webkit-appearance: none;
          appearance: none;
          min-height: 48px;
          max-width: 100%;
          box-sizing: border-box;
        }
        input[type="date"]::-webkit-date-and-time-value {
          text-align: left;
        }
      `}</style>
      {children}
    </div>
  );
};

// ==================== 透明导航栏 ====================
export const TransparentNavBar = ({ 
  onBack, 
  rightButtons = [],  // [{ icon: Component, onClick: fn, variant: 'default'|'danger'|'primary' }]
  className = ''
}) => {
  const getButtonStyle = (variant) => {
    switch (variant) {
      case 'danger':
        return 'text-red-400 hover:text-red-500';
      case 'primary':
        return 'text-cyan-500 hover:text-cyan-600';
      default:
        return 'text-gray-400 hover:text-gray-600';
    }
  };

  return (
    <div className={`fixed top-0 left-0 right-0 z-20 px-4 pt-4 pb-2 pointer-events-none ${className}`}>
      <div className="flex items-center justify-between max-w-lg mx-auto">
        {/* 返回按钮 */}
        <button 
          onClick={onBack || (() => window.history.back())}
          className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm hover:shadow-md transition-shadow text-gray-400 hover:text-gray-600 pointer-events-auto active:scale-95"
        >
          <ArrowLeft size={24} strokeWidth={2.5} />
        </button>
        
        {/* 右侧按钮组 */}
        {rightButtons.length > 0 && (
          <div className="flex gap-2 pointer-events-auto">
            {rightButtons.map((btn, index) => {
              const IconComp = btn.icon;
              return (
                <button 
                  key={index}
                  onClick={btn.onClick}
                  className={`w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm hover:shadow-md transition-shadow active:scale-95 ${getButtonStyle(btn.variant)}`}
                >
                  <IconComp size={22} strokeWidth={2.5} />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ==================== 按钮 ====================
export const DuoButton = ({ 
  children, 
  onClick, 
  variant = 'primary',  // primary | secondary | danger | success | warning | ghost
  size = 'md',          // sm | md | lg
  fullWidth = false,
  disabled = false,
  icon: Icon = null,
  className = ''
}) => {
  const baseClass = 'font-bold rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2';
  
  const variantStyles = {
    primary: 'bg-cyan-500 text-white border-b-4 border-cyan-600 active:border-b-0 active:translate-y-1 hover:bg-cyan-400',
    secondary: 'bg-white text-gray-600 border-2 border-gray-200 border-b-4 active:border-b-2 active:translate-y-[2px] hover:bg-gray-50',
    danger: 'bg-red-500 text-white border-b-4 border-red-600 active:border-b-0 active:translate-y-1 hover:bg-red-400',
    success: 'bg-green-500 text-white border-b-4 border-green-600 active:border-b-0 active:translate-y-1 hover:bg-green-400',
    warning: 'bg-amber-500 text-white border-b-4 border-amber-600 active:border-b-0 active:translate-y-1 hover:bg-amber-400',
    ghost: 'bg-transparent text-gray-500 hover:bg-gray-100',
  };
  
  const sizeStyles = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };
  
  const disabledClass = disabled ? 'opacity-50 pointer-events-none' : '';
  const widthClass = fullWidth ? 'w-full' : '';
  
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`${baseClass} ${variantStyles[variant]} ${sizeStyles[size]} ${disabledClass} ${widthClass} ${className}`}
    >
      {Icon && <Icon size={size === 'lg' ? 22 : 18} strokeWidth={2.5} />}
      {children}
    </button>
  );
};

// ==================== 图标按钮 ====================
export const IconButton = ({ 
  icon: Icon, 
  onClick, 
  variant = 'default', // default | primary | danger
  size = 'md',         // sm | md | lg
  className = ''
}) => {
  const variantStyles = {
    default: 'bg-white text-gray-400 hover:text-gray-600 shadow-sm hover:shadow-md',
    primary: 'bg-cyan-100 text-cyan-500 hover:bg-cyan-200',
    danger: 'bg-red-100 text-red-500 hover:bg-red-200',
  };

  const sizeStyles = {
    sm: 'w-8 h-8 rounded-lg',
    md: 'w-10 h-10 rounded-xl',
    lg: 'w-12 h-12 rounded-2xl',
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  return (
    <button 
      onClick={onClick}
      className={`flex items-center justify-center transition-all active:scale-95 ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      <Icon size={iconSizes[size]} strokeWidth={2.5} />
    </button>
  );
};

// ==================== 输入框 ====================
export const DuoInput = ({ 
  type = 'text',
  value,
  onChange,
  placeholder = '',
  prefix = '',
  size = 'md',
  disabled = false,
  autoFocus = false,
  multiline = false,  // 新增：是否自动多行
  className = ''
}) => {
  const textareaRef = useRef(null);
  
  const sizeStyles = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-4 py-4 text-base',
    lg: 'px-5 py-5 text-xl',
  };
  
  const baseClass = 'w-full bg-gray-100 border-2 border-gray-200 rounded-2xl font-bold text-gray-700 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-cyan-400 transition-colors';
  
  // 自动调整高度
  useEffect(() => {
    if (multiline && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [value, multiline]);
  
  if (prefix) {
    return (
      <div className="relative">
        <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 font-bold ${size === 'lg' ? 'text-2xl' : 'text-xl'}`}>
          {prefix}
        </span>
        <input 
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          className={`${baseClass} ${sizeStyles[size]} ${size === 'lg' ? 'pl-12 font-rounded' : 'pl-10'} ${className}`}
        />
      </div>
    );
  }
  
  // 多行自动增高模式
  if (multiline) {
    return (
      <textarea 
        ref={textareaRef}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        rows={1}
        className={`${baseClass} ${sizeStyles[size]} resize-none overflow-hidden ${className}`}
        style={{ minHeight: size === 'lg' ? '68px' : size === 'md' ? '56px' : '40px' }}
      />
    );
  }
  
  return (
    <input 
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      autoFocus={autoFocus}
      className={`${baseClass} ${sizeStyles[size]} ${className}`}
    />
  );
};

// ==================== 确认弹窗 ====================
export const ConfirmModal = ({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = '确定',
  cancelText = '取消',
  confirmVariant = 'danger'
}) => {
  if (!isOpen) return null;
  
  const confirmStyles = {
    danger: 'bg-red-500 border-red-600 hover:bg-red-400',
    primary: 'bg-cyan-500 border-cyan-600 hover:bg-cyan-400',
    success: 'bg-green-500 border-green-600 hover:bg-green-400',
    warning: 'bg-amber-500 border-amber-600 hover:bg-amber-400',
  };
  
  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onCancel}
    >
      <div 
        className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'zoom-in 0.2s ease-out' }}
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
        @keyframes zoom-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

// ==================== 通用弹窗 ====================
export const Modal = ({ 
  isOpen, 
  onClose, 
  title,
  children,
  showCloseButton = true
}) => {
  if (!isOpen) return null;
  
  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'zoom-in 0.2s ease-out' }}
      >
        {title && <h2 className="text-xl font-extrabold text-gray-700 mb-4 text-center">{title}</h2>}
        {children}
      </div>
      
      <style>{`
        @keyframes zoom-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

// ==================== 空状态组件 ====================
export const EmptyState = ({ icon: Icon, message, action }) => (
  <div className="py-12 text-center flex flex-col items-center justify-center">
    <div className="w-16 h-16 mb-4 bg-gray-100 rounded-full flex items-center justify-center">
      {Icon && <Icon size={32} className="text-gray-300" />}
    </div>
    <p className="text-gray-400 font-bold mb-4">{message}</p>
    {action}
  </div>
);

// ==================== 加载遮罩 ====================
export const LoadingOverlay = ({ isLoading }) => {
  if (!isLoading) return null;
  
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-cyan-200 border-t-cyan-500"></div>
        <span className="text-gray-500 font-bold">加载中...</span>
      </div>
    </div>
  );
};

// ==================== 内容区域 ====================
export const ContentArea = ({ children, className = '' }) => {
  return (
    <div className={`px-6 py-6 ${className}`}>
      {children}
    </div>
  );
};

// ==================== 卡片 ====================
export const Card = ({ children, className = '', onClick }) => {
  const clickableClass = onClick ? 'cursor-pointer active:scale-[0.99] transition-transform' : '';
  
  return (
    <div 
      className={`bg-white rounded-3xl p-5 shadow-sm ${clickableClass} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

// 别名，保持向后兼容
export const DuoCard = Card;