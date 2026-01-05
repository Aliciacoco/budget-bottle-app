// LoginView.jsx - 登录页面
// 支持从匿名状态绑定账号，可返回

import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { login } from '../auth';

const LoginView = ({ onLoginSuccess, onBack, isAnonymous }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
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
    <div className="min-h-screen bg-gradient-to-b from-cyan-50 to-white flex flex-col">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@400;500;700;800&display=swap');
        .font-rounded { font-family: 'M PLUS Rounded 1c', sans-serif; }
      `}</style>
      
      {/* 返回按钮 - 仅在可返回时显示 */}
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
        <h1 className="text-4xl font-extrabold text-cyan-500 font-rounded mb-2">
          CloudPool
        </h1>
        <p className="text-gray-400 font-medium text-center">
          {isAnonymous ? '登录以同步您的数据' : '周预算工具'}
        </p>
      </div>
      
      {/* 登录表单 */}
      <div className="px-6 pb-12">
        <div className="bg-white rounded-3xl p-6 shadow-lg shadow-cyan-100/50 max-w-sm mx-auto">
          
          {/* 匿名用户提示 */}
          {isAnonymous && (
            <div className="mb-4 p-3 bg-cyan-50 rounded-xl">
              <p className="text-cyan-600 text-sm text-center leading-relaxed">
                💡 登录后可在多设备间同步数据<br/>
                当前本地数据将保留在此设备
              </p>
            </div>
          )}
          
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
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                className="w-full px-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold text-gray-700 placeholder-gray-300 focus:outline-none focus:bg-white focus:border-cyan-400 transition-all"
                autoComplete="current-password"
              />
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
          
          {/* 提示信息 */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <p className="text-gray-300 text-xs text-center leading-relaxed">
              内测版本 · 仅限受邀用户使用
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginView;