// UserMenu.jsx - 用户菜单组件
// 显示当前用户信息和退出登录按钮

import React, { useState } from 'react';
import { User, LogOut, ChevronDown } from 'lucide-react';

const UserMenu = ({ currentUser, onLogout, isNight = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  if (!currentUser) return null;
  
  return (
    <div className="relative">
      {/* 用户头像按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-2xl transition-all active:scale-95 ${
          isNight
            ? 'bg-white/10 text-white/70 hover:text-white'
            : 'bg-white text-gray-500 hover:text-gray-700 shadow-sm'
        }`}
      >
        <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
          isNight ? 'bg-white/20' : 'bg-cyan-100'
        }`}>
          <User size={16} className={isNight ? 'text-white' : 'text-cyan-600'} strokeWidth={2.5} />
        </div>
        <span className="font-bold text-sm hidden sm:block">
          {currentUser.nickname || currentUser.username}
        </span>
        <ChevronDown size={16} strokeWidth={2.5} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {/* 下拉菜单 */}
      {isOpen && (
        <>
          {/* 点击外部关闭 */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* 菜单面板 */}
          <div className={`absolute right-0 top-full mt-2 w-48 rounded-2xl shadow-lg overflow-hidden z-50 ${
            isNight ? 'bg-[#0a0b2e] border border-white/10' : 'bg-white'
          }`}>
            {/* 用户信息 */}
            <div className={`px-4 py-3 border-b ${isNight ? 'border-white/10' : 'border-gray-100'}`}>
              <p className={`font-bold ${isNight ? 'text-white' : 'text-gray-700'}`}>
                {currentUser.nickname || '用户'}
              </p>
              <p className={`text-xs ${isNight ? 'text-white/50' : 'text-gray-400'}`}>
                {currentUser.username}
              </p>
            </div>
            
            {/* 退出按钮 */}
            <button
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              className={`w-full px-4 py-3 flex items-center gap-3 transition-colors ${
                isNight
                  ? 'text-red-400 hover:bg-white/5'
                  : 'text-red-500 hover:bg-red-50'
              }`}
            >
              <LogOut size={18} strokeWidth={2.5} />
              <span className="font-bold">退出登录</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default UserMenu;