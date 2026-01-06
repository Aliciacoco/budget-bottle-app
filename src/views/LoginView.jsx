// LoginView.jsx - 登录页面
// 修改：添加游客模式、获取内测账号弹窗

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
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl p-6 w-full max-w-lg shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800">获取内测账号</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400"
          >
            <X size={18} />
          </button>
        </div>
        
        <p className="text-gray-500 text-sm mb-6 leading-relaxed">
          CloudPool 目前处于内测阶段，如需获取内测账号，请通过以下方式联系我们：
        </p>
        
        {/* 邮箱 */}
        <div className="bg-gray-50 rounded-2xl p-4 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center">
              <Mail size={20} className="text-cyan-500" />
            </div>
            <div className="flex-1">
              <p className="text-gray-400 text-xs mb-0.5">邮箱</p>
              <p className="text-gray-700 font-medium">beta@cloudpool.app</p>
            </div>
            <button
              onClick={() => handleCopy('beta@cloudpool.app', 'email')}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
                copied === 'email'
                  ? 'bg-green-500 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 active:scale-95'
              }`}
            >
              {copied === 'email' ? '已复制' : '复制'}
            </button>
          </div>
        </div>
        
        {/* 微信 */}
        <div className="bg-gray-50 rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <MessageCircle size={20} className="text-green-500" />
            </div>
            <div className="flex-1">
              <p className="text-gray-400 text-xs mb-0.5">微信</p>
              <p className="text-gray-700 font-medium">CloudPool_Beta</p>
            </div>
            <button
              onClick={() => handleCopy('CloudPool_Beta', 'wechat')}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
                copied === 'wechat'
                  ? 'bg-green-500 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 active:scale-95'
              }`}
            >
              {copied === 'wechat' ? '已复制' : '复制'}
            </button>
          </div>
        </div>
        
        <p className="text-gray-300 text-xs text-center">
          发送邮件时请注明「CloudPool 内测申请」
        </p>
      </div>
    </div>
  );
};

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
  
  const handleGuestMode = () => {
    if (onGuestMode) {
      onGuestMode();
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@400;500;700;800&display=swap');
        .font-rounded { font-family: 'M PLUS Rounded 1c', sans-serif; }
      `}</style>
      
      {/* 返回按钮 */}
      {onBack && (
        <div className="px-6 pt-4">
          <button 
            onClick={onBack}
            className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-gray-400 hover:text-gray-600 active:scale-95 transition-all"
          >
            <ArrowLeft size={24} strokeWidth={2.5} />
          </button>
        </div>
      )}
      
      {/* 标题区域 */}
      <div className="flex flex-col items-center justify-center px-6 pt-12 pb-8">
        {/* 云朵图标 */}
        <div className="mb-4">
          <svg width="80" height="60" viewBox="0 0 80 60" fill="none">
            <ellipse cx="50" cy="35" rx="28" ry="22" fill="#06B6D4" opacity="0.9"/>
            <ellipse cx="30" cy="40" rx="22" ry="18" fill="#22D3EE" opacity="0.8"/>
            <ellipse cx="55" cy="42" rx="18" ry="14" fill="#67E8F9" opacity="0.7"/>
          </svg>
        </div>
        <h1 className="text-4xl font-extrabold text-cyan-500 font-rounded mb-2">
          CloudPool
        </h1>
        <p className="text-gray-400 font-medium text-center">
          周预算工具 · 把省下的钱变成心愿
        </p>
      </div>
      
      {/* 登录表单 */}
      <div className="px-6 pb-6 flex-1">
        <div className="bg-white rounded-3xl p-6 shadow-sm max-w-sm mx-auto">
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 账号输入 */}
            <div>
              <label className="block text-gray-400 font-bold uppercase tracking-wider text-xs mb-2 ml-1">
                账号
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入账号"
                className="w-full px-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold text-gray-700 placeholder-gray-300 focus:outline-none focus:bg-white focus:border-cyan-400 transition-all"
                autoComplete="username"
                autoCapitalize="off"
              />
            </div>
            
            {/* 密码输入 */}
            <div>
              <label className="block text-gray-400 font-bold uppercase tracking-wider text-xs mb-2 ml-1">
                密码
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className="w-full px-4 py-4 pr-12 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold text-gray-700 placeholder-gray-300 focus:outline-none focus:bg-white focus:border-cyan-400 transition-all"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 active:scale-95 transition-all"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  {showPassword ? (
                    <EyeOff size={20} strokeWidth={2} />
                  ) : (
                    <Eye size={20} strokeWidth={2} />
                  )}
                </button>
              </div>
            </div>
            
            {/* 错误提示 */}
            {error && (
              <div className="bg-red-50 border-2 border-red-100 rounded-2xl px-4 py-3">
                <p className="text-red-500 font-bold text-sm text-center">{error}</p>
              </div>
            )}
            
            {/* 登录按钮 */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-cyan-500 hover:bg-cyan-600 text-white font-extrabold text-lg rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none border-b-4 border-cyan-600 active:border-b-0 active:translate-y-1"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  登录中...
                </>
              ) : (
                '登录'
              )}
            </button>
          </form>
          
          {/* 游客模式 */}
          {showGuestOption && onGuestMode && (
            <div className="mt-4">
              <button
                onClick={handleGuestMode}
                className="w-full py-4 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-base rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                游客模式
              </button>
              <p className="text-gray-300 text-xs text-center mt-2">
                数据仅保存在本地，不会同步到云端
              </p>
            </div>
          )}
          
          {/* 分隔线 */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <button
              onClick={() => setShowGetAccount(true)}
              className="w-full py-3 text-cyan-500 font-bold text-sm hover:text-cyan-600 transition-all"
            >
              没有账号？获取内测资格 →
            </button>
          </div>
        </div>
      </div>
      
      {/* 底部版本信息 */}
      <div className="px-6 pb-8">
        <p className="text-gray-300 text-xs text-center">
          CloudPool v1.0.0 · 内测版本
        </p>
      </div>
      
      {/* 获取内测账号弹窗 */}
      <GetAccountModal
        isOpen={showGetAccount}
        onClose={() => setShowGetAccount(false)}
      />
    </div>
  );
};

export default LoginView;