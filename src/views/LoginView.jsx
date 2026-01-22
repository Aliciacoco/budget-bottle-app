// LoginView.jsx - 登录页面
// 修复：按钮状态切换导致的屏幕闪烁问题
// 修复：电脑端居中显示，最大宽度480px

import React, { useState, useCallback } from 'react';
import { ArrowLeft, Eye, EyeOff, X, Mail, MessageCircle } from 'lucide-react';
import { login } from '../auth';

// 安全的复制到剪贴板函数（防止页面滚动）
const copyToClipboard = async (text) => {
  // 优先使用现代 API（不会导致滚动）
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      // 继续尝试 fallback
    }
  }
  
  // 保存当前滚动位置
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;
  
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  // 关键：使用 fixed 定位并放在视口内但不可见的位置
  textarea.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 2px;
    height: 2px;
    padding: 0;
    border: none;
    outline: none;
    box-shadow: none;
    background: transparent;
    opacity: 0;
    z-index: -1;
  `;
  
  document.body.appendChild(textarea);
  
  // 使用 preventScroll 选项（如果支持）
  try {
    textarea.focus({ preventScroll: true });
  } catch (e) {
    textarea.focus();
  }
  
  textarea.select();
  textarea.setSelectionRange(0, text.length);
  
  let success = false;
  try {
    success = document.execCommand('copy');
  } catch (err) {
    console.error('复制失败:', err);
  }
  
  document.body.removeChild(textarea);
  
  // 恢复滚动位置（以防万一）
  window.scrollTo(scrollX, scrollY);
  
  return success;
};

// 复制按钮组件 - 独立出来避免父组件重渲染
const CopyButton = ({ text, type, copied, onCopy }) => {
  const isCopied = copied === type;
  
  return (
    <button
      onClick={() => onCopy(text, type)}
      className="w-14 h-8 rounded-xl text-sm font-bold flex-shrink-0 flex items-center justify-center border-2 transition-colors duration-150"
      style={{
        backgroundColor: isCopied ? '#22C55E' : 'white',
        color: isCopied ? 'white' : '#4B5563',
        borderColor: isCopied ? '#22C55E' : '#E5E7EB',
      }}
    >
      {isCopied ? '✓' : '复制'}
    </button>
  );
};

// 获取内测账号弹窗
const GetAccountModal = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState('');
  
  const handleCopy = useCallback(async (text, type) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(type);
      setTimeout(() => setCopied(''), 2000);
    }
  }, []);
  
  if (!isOpen) return null;
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50" />
      
      <div 
        className="relative bg-white rounded-3xl p-6 w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-extrabold text-gray-800">获取内测账号</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 active:bg-gray-200"
          >
            <X size={18} />
          </button>
        </div>
        
        {/* 邮箱 */}
        <div className="bg-gray-50 rounded-2xl p-4 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Mail size={20} className="text-cyan-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-gray-400 text-xs font-bold">邮箱</p>
              <p className="text-gray-700 font-bold truncate">745018040@qq.com</p>
            </div>
            <CopyButton 
              text="745018040@qq.com" 
              type="email" 
              copied={copied} 
              onCopy={handleCopy} 
            />
          </div>
        </div>
        
        {/* 微信 */}
        <div className="bg-gray-50 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <MessageCircle size={20} className="text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-gray-400 text-xs font-bold">微信</p>
              <p className="text-gray-700 font-bold truncate">zkx062811</p>
            </div>
            <CopyButton 
              text="zkx062811" 
              type="wechat" 
              copied={copied} 
              onCopy={handleCopy} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// 主登录页面
const LoginView = ({ onLoginSuccess, onBack, onGuestMode, showGuestOption = true }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showGetAccount, setShowGetAccount] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!username.trim()) {
      setError('请输入账号');
      return;
    }
    
    if (!password) {
      setError('请输入密码');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await login(username, password);
      
      if (result.success) {
        onLoginSuccess(result.user);
      } else {
        setError(result.error || '登录失败');
      }
    } catch (err) {
      setError('网络错误，请重试');
      console.error('登录异常:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    // 外层容器：灰色背景，用于电脑端显示
    <div className="min-h-screen bg-gray-100 overflow-x-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@400;500;700;800&display=swap');
        .font-rounded { font-family: 'M PLUS Rounded 1c', sans-serif; }
      `}</style>
      
      {/* 内层容器：白色背景，最大宽度480px，居中显示 */}
      <div className="min-h-screen bg-gray-50 max-w-[480px] mx-auto relative shadow-sm flex flex-col">
        
        {/* 顶部 */}
        <div className="px-6 pt-6 flex items-center justify-between">
          {onBack ? (
            <button 
              onClick={onBack}
              className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-gray-400 active:bg-gray-100"
            >
              <ArrowLeft size={24} strokeWidth={2.5} />
            </button>
          ) : (
            <div className="w-12" />
          )}
          <div className="w-12" />
        </div>
        
        {/* Logo 区域 */}
        <div className="flex flex-col items-center px-6 pt-8 pb-6">
          <h1 className="text-3xl font-extrabold text-cyan-500 font-rounded">
            CloudPool
          </h1>
          <p className="text-gray-400 text-sm font-medium mt-1">周预算工具 · 内测版</p>
        </div>
        
        {/* 表单卡片 */}
        <div className="px-6 flex-1">
          <div className="bg-white rounded-3xl p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 账号 */}
              <div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="账号"
                  className="w-full px-4 py-4 bg-gray-100 border-2 border-gray-200 rounded-2xl font-bold text-gray-700 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-cyan-400 transition-colors"
                  autoComplete="username"
                  autoCapitalize="off"
                />
              </div>
              
              {/* 密码 */}
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="密码"
                  className="w-full px-4 py-4 pr-12 bg-gray-100 border-2 border-gray-200 rounded-2xl font-bold text-gray-700 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-cyan-400 transition-colors"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-gray-400"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              
              {/* 错误提示 */}
              {error && (
                <p className="text-red-500 font-bold text-sm text-center">{error}</p>
              )}
              
              {/* 登录按钮 */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-cyan-500 text-white font-extrabold text-lg rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-70 border-b-4 border-cyan-600 active:border-b-2 active:translate-y-[2px] transition-all"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  '登录'
                )}
              </button>
              
              {/* 游客模式 */}
              {showGuestOption && onGuestMode && (
                <button
                  type="button"
                  onClick={onGuestMode}
                  className="w-full py-4 bg-white text-gray-600 font-bold rounded-2xl border-2 border-gray-200 border-b-4 active:border-b-2 active:translate-y-[2px] transition-all"
                >
                  以游客身份体验
                </button>
              )}
            </form>
            
            {/* 获取账号 */}
            <div className="mt-6 text-center">
              <button
                onClick={() => setShowGetAccount(true)}
                className="text-gray-400 font-bold text-sm"
              >
                获取内测账号，随时同步数据
              </button>
            </div>
          </div>
        </div>
        
        {/* 底部 */}
        <div className="px-6 py-6">
          <p className="text-gray-300 text-xs text-center">
            v1.0 Beta
          </p>
        </div>
        
        {/* 弹窗 */}
        <GetAccountModal
          isOpen={showGetAccount}
          onClose={() => setShowGetAccount(false)}
        />
      </div>
    </div>
  );
};

export default LoginView;