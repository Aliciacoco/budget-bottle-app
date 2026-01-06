// BrandMenuView.jsx - 品牌菜单页面
// 点击首页左上角logo后展示的页面

import React, { useState } from 'react';
import { ArrowLeft, Share2, LogOut, MessageCircle, Heart, X, Mail, ChevronRight } from 'lucide-react';
import { isAnonymousUser } from '../auth';

// 分享弹窗组件
const ShareModal = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const shareUrl = 'https://cloudpool.app';
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'CloudPool - 周预算工具',
          text: '一个帮你养成储蓄习惯的预算工具，把省下的钱变成心愿池的水滴 💧',
          url: shareUrl
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl p-6 w-full max-w-lg shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800">分享给朋友</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400"
          >
            <X size={18} />
          </button>
        </div>
        
        <p className="text-gray-500 text-sm mb-4">
          邀请朋友一起使用 CloudPool，一起养成储蓄好习惯 ✨
        </p>
        
        <div className="flex items-center gap-2 p-3 bg-gray-100 rounded-xl mb-4">
          <span className="flex-1 text-gray-600 text-sm truncate">{shareUrl}</span>
          <button
            onClick={handleCopy}
            className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
              copied 
                ? 'bg-green-500 text-white' 
                : 'bg-white text-gray-600 active:scale-95'
            }`}
          >
            {copied ? '已复制' : '复制'}
          </button>
        </div>
        
        <button
          onClick={handleShare}
          className="w-full py-3 bg-cyan-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
        >
          <Share2 size={18} />
          分享
        </button>
      </div>
    </div>
  );
};

// 反馈弹窗组件
const FeedbackModal = ({ isOpen, onClose }) => {
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
          <h3 className="text-lg font-bold text-gray-800">联系我们</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400"
          >
            <X size={18} />
          </button>
        </div>
        
        <p className="text-gray-500 text-sm mb-6 leading-relaxed">
          有任何问题、建议或想法，欢迎随时联系我们 💬
        </p>
        
        {/* 邮箱 */}
        <div className="bg-gray-50 rounded-2xl p-4 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center">
              <Mail size={20} className="text-cyan-500" />
            </div>
            <div className="flex-1">
              <p className="text-gray-400 text-xs mb-0.5">邮箱</p>
              <p className="text-gray-700 font-medium">feedback@cloudpool.app</p>
            </div>
            <button
              onClick={() => handleCopy('feedback@cloudpool.app', 'email')}
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
        <div className="bg-gray-50 rounded-2xl p-4 mb-4">
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
      </div>
    </div>
  );
};

// 退出确认弹窗
const LogoutConfirmModal = ({ isOpen, onConfirm, onCancel, isAnonymous }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl">
        <h3 className="text-lg font-bold text-gray-800 mb-2">
          {isAnonymous ? '退出游客模式' : '退出登录'}
        </h3>
        <p className="text-gray-500 text-sm mb-6">
          {isAnonymous 
            ? '退出后本地数据将被清除，确定要退出吗？'
            : '退出后将回到登录页，当前账号数据仍会保留在云端。'
          }
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl active:scale-[0.98] transition-all"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl active:scale-[0.98] transition-all"
          >
            退出
          </button>
        </div>
      </div>
    </div>
  );
};

const BrandMenuView = ({ 
  onBack, 
  onLogout,
  onSwitchToLogin,
  currentUser 
}) => {
  const [showShareModal, setShowShareModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  const isAnonymous = isAnonymousUser();
  
  const handleLogout = () => {
    setShowLogoutConfirm(false);
    if (onLogout) onLogout();
  };
  
  return (
    <div className="min-h-screen bg-cyan-500 relative overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@400;500;700;800&display=swap');
        .font-rounded { font-family: 'M PLUS Rounded 1c', sans-serif; }
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-15px) translateX(8px); }
        }
        .floating { animation: float 8s ease-in-out infinite; }
        .floating-delay { animation: float 8s ease-in-out infinite; animation-delay: -4s; }
      `}</style>
      
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* 云朵装饰 */}
        <div className="floating absolute top-20 left-4 opacity-90">
          <svg width="100" height="70" viewBox="0 0 100 70" fill="none">
            <ellipse cx="50" cy="40" rx="35" ry="25" fill="white" fillOpacity="0.95"/>
            <ellipse cx="30" cy="45" rx="25" ry="18" fill="white" fillOpacity="0.9"/>
            <ellipse cx="70" cy="47" rx="20" ry="15" fill="white" fillOpacity="0.85"/>
          </svg>
        </div>
        <div className="floating-delay absolute top-40 right-8 opacity-70">
          <svg width="60" height="45" viewBox="0 0 60 45" fill="none">
            <ellipse cx="30" cy="25" rx="22" ry="16" fill="white" fillOpacity="0.9"/>
            <ellipse cx="18" cy="28" rx="15" ry="12" fill="white" fillOpacity="0.85"/>
            <ellipse cx="42" cy="29" rx="12" ry="10" fill="white" fillOpacity="0.8"/>
          </svg>
        </div>
        <div className="floating absolute bottom-40 left-8 opacity-60">
          <svg width="80" height="55" viewBox="0 0 80 55" fill="none">
            <ellipse cx="40" cy="30" rx="28" ry="20" fill="white" fillOpacity="0.9"/>
            <ellipse cx="24" cy="34" rx="20" ry="15" fill="white" fillOpacity="0.85"/>
            <ellipse cx="56" cy="35" rx="16" ry="12" fill="white" fillOpacity="0.8"/>
          </svg>
        </div>
        
        {/* 几何装饰 */}
        <div className="absolute top-32 right-4 w-16 h-16 bg-white/10 rounded-2xl rotate-12" />
        <div className="absolute bottom-60 right-12 w-12 h-12 bg-white/10 rounded-xl -rotate-12" />
        <div className="absolute bottom-32 left-4 w-20 h-20 bg-white/10 rounded-3xl rotate-45" />
      </div>
      
      {/* 返回按钮 */}
      <div className="relative z-10 px-6 pt-4">
        <button 
          onClick={onBack}
          className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white hover:bg-white/30 active:scale-95 transition-all"
        >
          <ArrowLeft size={24} strokeWidth={2.5} />
        </button>
      </div>
      
      {/* 主内容 */}
      <div className="relative z-10 px-6 pt-8">
        {/* Logo 和标题 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-white font-rounded mb-2">
            CloudPool
          </h1>
          <p className="text-white/70 text-sm">
            把省下的钱变成心愿池的水滴 💧
          </p>
        </div>
        
        {/* 产品理念 */}
        <div className="bg-white/15 backdrop-blur-sm rounded-3xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Heart size={20} className="text-white" />
            </div>
            <h2 className="text-white font-bold text-lg">产品理念</h2>
          </div>
          <div className="space-y-3 text-white/80 text-sm leading-relaxed">
            <p>
              💭 <strong className="text-white">CloudPool</strong> 相信，储蓄不应该是痛苦的克制，而是一种愉悦的积累。
            </p>
            <p>
              ☁️ 每周省下的钱，会像雨水一样从云朵落入心愿池。看着水位慢慢上涨，直到某一天，你可以实现一个小心愿。
            </p>
            <p>
              🎯 我们不追求复杂的记账，只专注于一件事：帮你养成「先存后花」的习惯。
            </p>
          </div>
        </div>
        
        {/* 账户状态 */}
        <div className="bg-white/10 rounded-2xl p-4 mb-4">
          <p className="text-white font-medium">
            {isAnonymous ? '游客模式' : `@${currentUser?.username || '用户'}`}
          </p>
          <p className="text-white/50 text-sm mt-0.5">
            {isAnonymous ? '数据仅保存在此设备' : '数据已同步到云端'}
          </p>
        </div>
        
        {/* 操作列表 */}
        <div className="space-y-3">
          {/* 分享给朋友 */}
          <button
            onClick={() => setShowShareModal(true)}
            className="w-full bg-white/15 backdrop-blur-sm rounded-2xl p-4 flex items-center gap-3 active:bg-white/20 transition-all"
          >
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Share2 size={20} className="text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-white font-medium">分享给朋友</p>
              <p className="text-white/50 text-xs">邀请好友一起养成储蓄习惯</p>
            </div>
            <ChevronRight size={20} className="text-white/40" />
          </button>
          
          {/* 反馈 */}
          <button
            onClick={() => setShowFeedbackModal(true)}
            className="w-full bg-white/15 backdrop-blur-sm rounded-2xl p-4 flex items-center gap-3 active:bg-white/20 transition-all"
          >
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <MessageCircle size={20} className="text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-white font-medium">反馈与建议</p>
              <p className="text-white/50 text-xs">告诉我们你的想法</p>
            </div>
            <ChevronRight size={20} className="text-white/40" />
          </button>
          
          {/* 游客模式下显示登录按钮 */}
          {isAnonymous && onSwitchToLogin && (
            <button
              onClick={onSwitchToLogin}
              className="w-full bg-white rounded-2xl p-4 flex items-center gap-3 active:scale-[0.99] transition-all"
            >
              <div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#06B6D4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                  <polyline points="10 17 15 12 10 7"/>
                  <line x1="15" y1="12" x2="3" y2="12"/>
                </svg>
              </div>
              <div className="flex-1 text-left">
                <p className="text-cyan-600 font-bold">登录账号</p>
                <p className="text-gray-400 text-xs">同步数据到云端</p>
              </div>
              <ChevronRight size={20} className="text-gray-300" />
            </button>
          )}
          
          {/* 退出登录 / 离开这朵云 */}
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full bg-white/10 rounded-2xl p-4 flex items-center gap-3 active:bg-white/15 transition-all"
          >
            <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
              <LogOut size={20} className="text-red-300" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-red-300 font-medium">离开这朵云</p>
              <p className="text-white/40 text-xs">
                {isAnonymous ? '退出游客模式' : '退出当前账号'}
              </p>
            </div>
          </button>
        </div>
        
        {/* 版本信息 */}
        <div className="text-center py-8">
          <p className="text-white/30 text-xs">CloudPool v1.0.0</p>
        </div>
      </div>
      
      {/* 弹窗 */}
      <ShareModal 
        isOpen={showShareModal} 
        onClose={() => setShowShareModal(false)} 
      />
      <FeedbackModal 
        isOpen={showFeedbackModal} 
        onClose={() => setShowFeedbackModal(false)} 
      />
      <LogoutConfirmModal
        isOpen={showLogoutConfirm}
        isAnonymous={isAnonymous}
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </div>
  );
};

export default BrandMenuView;