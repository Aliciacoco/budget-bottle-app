// src/components/design-system.jsx - 精简版设计系统组件
// 更新：白色背景页面 + 灰色列表 + 面状图标 + 大圆角
// v3: 电脑端居中显示，最大宽度480px，修复导航栏位置

import React, { useRef, useEffect } from 'react';

// ==================== 颜色常量 ====================
// ==================== 颜色常量 ====================
export const colors = {
  // 核心色 (对应“这一周”)
  primary: '#00BFDC',      // Cyan-500: 主色调，用于日常消费、按钮
  primaryDark: '#0891B2',  // Cyan-700: 点击态深色

  // 状态色
  success: '#22C55E',      // Green-500: 成功、余额充足
  danger: '#EF4444',       // Red-500: 删除、赤字
  warning: '#F59E0B',      // Amber-500: 警告、撤销

  // 👇👇👇 新增业务品牌色 👇👇👇
  yellow: '#FFC800',       // 对应“每个月” (固定支出) - 明亮的黄色
  purple: '#CE82FF',       // 对应“这件事” (独立预算) - 柔和的紫色
  
  // 灰色系 (保持不变)
  gray: {
    50: '#F9FAFB',
    100: '#F9F9F9',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
  }
};

// ==================== 极简返回箭头图标 ====================
// 修改：加粗线条(3px)，使用 currentColor 继承颜色，调整路径为更饱满的箭头
const MinimalArrowLeft = ({ size = 24 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="3" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M15 19l-7-7 7-7" />
  </svg>
);

// ==================== 页面容器 ====================
// 默认白色背景，二级页面统一使用白色
// 电脑端内容居中，最大宽度 480px
export const PageContainer = ({ children, bg = 'white', className = '' }) => {
  const bgClass = bg === 'gray' ? 'bg-gray-50' : 'bg-white';
  
  return (
    <div className={`min-h-screen bg-gray-100 overflow-x-hidden ${className}`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@400;500;700;800&display=swap');
        .font-rounded {
          font-family: 'M PLUS Rounded 1c', sans-serif;
        }
        html, body {
          overflow-x: hidden;
          max-width: 100vw;
        }
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
      {/* 内容区域：最大宽度 480px，居中显示 */}
      <div className={`min-h-screen ${bgClass} max-w-[480px] mx-auto relative shadow-sm`}>
        {children}
      </div>
    </div>
  );
};

// ==================== 透明导航栏 ====================
// 修复：导航栏内容也需要限制最大宽度并居中
// src/components/design-system.jsx

// ... 保持 PageContainer 和 MinimalArrowLeft 不变 ...

// ==================== 透明导航栏 ====================
// 更新：支持 variant 属性切换按钮样式
// variant = 'default' | 'white'
export const TransparentNavBar = ({ 
  onBack, 
  rightButtons = [],
  className = '',
  variant = 'default' // 👈 新增这个属性，默认为灰色样式
}) => {
  
  // 1. 定义返回按钮的样式配置
  const backButtonStyles = {
    default: {
      // 原来的样式：灰底、灰箭头、悬停变深
      base: "bg-gray-100 text-gray-400",
      hover: "desktop-hover:hover:text-gray-600 desktop-hover:hover:bg-gray-200", // 电脑悬停
      active: "active:bg-white/30 active:bg-gray-300", // 手机按压
    },
    white: {
      // 新样式：透明底、白箭头
      base: "bg-white/30 text-white",
      hover: "desktop-hover:hover:bg-white/10", // 电脑悬停：微微的白色半透明
      active: "active:text-gray-300", // 
    }
  };

  // 2. 获取当前样式的类名字符串
  const currentStyle = backButtonStyles[variant] || backButtonStyles.default;
  const btnClassName = `w-12 h-12 rounded-2xl flex items-center justify-center pointer-events-auto active:scale-95 transition-all duration-200 ${currentStyle.base} ${currentStyle.hover} ${currentStyle.active}`;

  // 3. 右侧按钮样式生成器 (根据 variant 自动适配)
  const getRightButtonStyle = (btnVariant) => {
    // 如果导航栏是 white 模式，且按钮没有指定特定颜色，则默认也是白色透明风格
    if (variant === 'white' && !btnVariant) {
      return `bg-transparent text-white desktop-hover:hover:bg-white/10 active:bg-white/20`;
    }

    // 否则使用标准的彩色/灰色逻辑
    switch (btnVariant) {
      case 'danger': return 'bg-red-50 text-red-500 desktop-hover:hover:bg-red-100 active:bg-red-200';
      case 'primary': return 'bg-cyan-50 text-cyan-500 desktop-hover:hover:bg-cyan-100 active:bg-cyan-200';
      case 'white': return 'bg-transparent text-white desktop-hover:hover:bg-white/10 active:bg-white/20'; // 强制指定白色
      default: return 'bg-gray-100 text-gray-400 desktop-hover:hover:text-gray-600 desktop-hover:hover:bg-gray-200 active:bg-gray-300';
    }
  };

  return (
    <div className={`fixed top-0 left-0 right-0 z-20 pointer-events-none ${className}`}>
      <div className="max-w-[480px] mx-auto px-[30px] pt-4 pb-2">
        <div className="flex items-center justify-between">
          
          {/* 左侧：返回按钮 */}
          <button 
            onClick={onBack || (() => window.history.back())}
            className={btnClassName} // 👈 使用上面生成的类名
          >
            <MinimalArrowLeft size={22} />
          </button>
          
          {/* 右侧：功能按钮组 */}
          {rightButtons.length > 0 && (
            <div className="flex gap-2 pointer-events-auto">
              {rightButtons.map((btn, index) => {
                const IconComp = btn.icon;
                return (
                  <button 
                    key={index}
                    onClick={btn.onClick}
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center active:scale-95 transition-all duration-200 ${getRightButtonStyle(btn.variant)}`}
                  >
                    <IconComp size={22} strokeWidth={2.5} />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ==================== 按钮 ====================
export const DuoButton = ({ 
  children, 
  onClick, 
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  icon: Icon = null,
  className = ''
}) => {
  const baseClass = 'font-bold rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2';
  
  const variantStyles = {
    primary: 'bg-cyan-500 text-white border-b-4 border-cyan-600 active:border-b-0 active:translate-y-1 hover:bg-cyan-400',
    secondary: 'bg-gray-100 text-gray-600 border-b-4 border-gray-200 active:border-b-2 active:translate-y-[2px] hover:bg-gray-50',
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
  variant = 'default',
  size = 'md',
  className = ''
}) => {
  const variantStyles = {
    default: 'bg-gray-100 text-gray-400 hover:text-gray-600',
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

// ==================== 列表项组件 ====================
// 用于白色背景页面的灰色列表项，大圆角，面状图标无背景
export const ListItem = ({ 
  icon: Icon,
  iconColor = 'text-gray-400',
  title, 
  subtitle,
  onClick, 
  rightElement,
  height = 70,  // 默认高度 70px
  bgColor = 'bg-[#F9F9F9]', 
  className = '' 
}) => {
  // 当指定高度时，使用 h-[Xpx] 类名
  const heightClass = height ? `h-[${height}px]` : '';
  // 当指定高度时不用 py-4，改用 items-center 自动垂直居中
  const paddingClass = height ? 'px-5' : 'px-5 py-4';
  
  return (
    <button
      onClick={onClick}
      style={height ? { height: `${height}px` } : {}}
      className={`w-full ${bgColor} rounded-[20px] ${paddingClass} flex items-center gap-4 active:scale-[0.99] active:bg-gray-150 transition-all ${className}`}
    >
      {Icon && (
        <Icon size={28} className={iconColor} strokeWidth={0} fill="currentColor" />
      )}
      <div className="flex-1 text-left min-w-0">
        <p className="text-gray-700 font-bold">{title}</p>
        {subtitle && <p className="text-gray-400 text-xs mt-0.5">{subtitle}</p>}
      </div>
      {rightElement || (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#DADBDE" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
          <path d="M9 18l6-6-6-6" />
        </svg>
      )}
    </button>
  );
};

// ==================== 列表容器 ====================
// 包裹多个 ListItem，统一间距
export const ListGroup = ({ children, className = '' }) => (
  <div className={`space-y-3 ${className}`}>
    {children}
  </div>
);

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
  multiline = false,
  className = ''
}) => {
  const textareaRef = useRef(null);
  
  const sizeStyles = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-4 py-4 text-base',
    lg: 'px-5 py-5 text-xl',
  };
  
  const baseClass = 'w-full bg-gray-100 border-2 border-transparent rounded-[20px] font-bold text-gray-700 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-cyan-400 transition-colors';
  
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

// ==================== 金额输入框 ====================
export const AmountInput = ({
  value,
  onClick,
  placeholder = '0',
  size = 'md',
  disabled = false,
  className = ''
}) => {
  const sizeConfig = {
    sm: {
      container: 'px-4 py-2',
      prefix: 'text-lg',
      value: 'text-sm',
      height: 'min-h-[40px]'
    },
    md: {
      container: 'px-4 py-4',
      prefix: 'text-xl',
      value: 'text-base',
      height: 'min-h-[56px]'
    },
    lg: {
      container: 'px-5 py-5',
      prefix: 'text-2xl',
      value: 'text-xl font-rounded',
      height: 'min-h-[68px]'
    }
  };
  
  const config = sizeConfig[size];
  
  return (
    <div 
      onClick={disabled ? undefined : onClick}
      className={`w-full bg-gray-100 rounded-[20px] ${config.container} ${config.height} flex items-center transition-colors ${disabled ? 'opacity-50' : 'cursor-pointer hover:bg-gray-50 active:scale-[0.99]'} ${className}`}
    >
      <span className={`${config.prefix} text-gray-300 font-bold mr-2`}>¥</span>
      <span className={`${config.value} font-bold text-gray-700`}>
        {value || placeholder}
      </span>
    </div>
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
            className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-2xl font-bold border-b-4 border-gray-200 active:border-b-2 active:translate-y-[2px] transition-all hover:bg-gray-50"
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
      {Icon && <Icon size={32} className="text-gray-300" fill="currentColor" strokeWidth={0} />}
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
// padding 统一使用 30px
export const ContentArea = ({ children, className = '' }) => {
  return (
    <div className={`px-[30px] py-6 ${className}`}>
      {children}
    </div>
  );
};

// ==================== 卡片 ====================
// 白色背景页面中使用灰色卡片
export const Card = ({ children, className = '', onClick, variant = 'gray' }) => {
  const clickableClass = onClick ? 'cursor-pointer active:scale-[0.99] transition-transform' : '';
  const bgClass = variant === 'white' ? 'bg-white shadow-sm' : 'bg-[#F9F9F9]';
  
  return (
    <div 
      className={`${bgClass} rounded-[20px] p-5 ${clickableClass} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

// 别名
export const DuoCard = Card;