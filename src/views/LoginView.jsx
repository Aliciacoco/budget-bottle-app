// LoginView.jsx - 登录页面
// 极简设计系统风格

import React, { useState } from 'react';
import { ArrowLeft, Eye, EyeOff, X, Mail, MessageCircle } from 'lucide-react';
import { login } from '../auth';

// 获取内测账号弹窗
const GetAccountModal = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState('');
  
  const handleCopy = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(''), 2000);
    } catch (err) {
      const input = document.createElement('input');
      input.value = text;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(type);
      setTimeout(() => setCopied(''), 2000);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      <div className="relative bg-white rounded-3xl p-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-extrabold text-gray-800">获取内测账号</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 active:scale-95"
          >
            <X size={18} />
          </button>
        </div>
        
        {/* 邮箱 */}
        <div className="bg-gray-50 rounded-2xl p-4 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center">
              <Mail size={20} className="text-cyan-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-gray-400 text-xs font-bold">邮箱</p>
              <p className="text-gray-700 font-bold truncate">beta@cloudpool.app</p>
            </div>
            <button
              onClick={() => handleCopy('beta@cloudpool.app', 'email')}
              className={`px-3 py-1.5 rounded-xl text-sm font-bold flex-shrink-0 ${
                copied === 'email'
                  ? 'bg-green-500 text-white'
                  : 'bg-white text-gray-600 border-2 border-gray-200 active:scale-95'
              }`}
            >
              {copied === 'email' ? '✓' : '复制'}
            </button>
          </div>
        </div>
        
        {/* 微信 */}
        <div className="bg-gray-50 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <MessageCircle size={20} className="text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-gray-400 text-xs font-bold">微信</p>
              <p className="text-gray-700 font-bold truncate">CloudPool_Beta</p>
            </div>
            <button
              onClick={() => handleCopy('CloudPool_Beta', 'wechat')}
              className={`px-3 py-1.5 rounded-xl text-sm font-bold flex-shrink-0 ${
                copied === 'wechat'
                  ? 'bg-green-500 text-white'
                  : 'bg-white text-gray-600 border-2 border-gray-200 active:scale-95'
              }`}
            >
              {copied === 'wechat' ? '✓' : '复制'}
            </button>
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
    await new Promise(resolve => setTimeout(resolve, 500));
    const result = login(username, password);
    setIsLoading(false);
    
    if (result.success) {
      onLoginSuccess(result.user);
    } else {
      setError(result.error);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@400;500;700;800&display=swap');
        .font-rounded { font-family: 'M PLUS Rounded 1c', sans-serif; }
      `}</style>
      
      {/* 顶部 */}
      <div className="px-6 pt-6 flex items-center justify-between">
        {onBack ? (
          <button 
            onClick={onBack}
            className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-gray-400 active:scale-95"
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
        <p className="text-gray-400 text-sm font-medium mt-1">内测版</p>
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
                跳过登录
              </button>
            )}
          </form>
          
          {/* 获取账号 */}
          <div className="mt-6 text-center">
            <button
              onClick={() => setShowGetAccount(true)}
              className="text-gray-400 font-bold text-sm"
            >
              获取内测账号
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
  );
};

export default LoginView;