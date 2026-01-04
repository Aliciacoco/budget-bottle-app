// LogoutButton.jsx - 退出登录按钮组件
// 用于预算设置页面底部

import React, { useState } from 'react';
import { LogOut } from 'lucide-react';
import { ConfirmModal } from './design-system';

const LogoutButton = ({ onLogout, currentUser }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  
  if (!currentUser || !onLogout) return null;
  
  return (
    <>
      <div className="mt-8 mb-8">
        {/* 当前账号信息 */}
        <div className="text-center mb-4">
          <p className="text-gray-400 text-sm">
            当前账号：<span className="font-bold text-gray-500">{currentUser.nickname || currentUser.username}</span>
          </p>
        </div>
        
        {/* 退出按钮 */}
        <button
          onClick={() => setShowConfirm(true)}
          className="w-full py-4 bg-white border-2 border-gray-200 rounded-2xl flex items-center justify-center gap-2 text-gray-400 font-bold hover:border-red-200 hover:text-red-400 hover:bg-red-50 transition-all active:scale-[0.98]"
        >
          <LogOut size={20} strokeWidth={2.5} />
          退出登录
        </button>
      </div>
      
      {/* 确认弹窗 */}
      <ConfirmModal
        isOpen={showConfirm}
        title="退出登录"
        message="确定要退出当前账号吗？"
        onConfirm={() => {
          setShowConfirm(false);
          onLogout();
        }}
        onCancel={() => setShowConfirm(false)}
        confirmText="退出"
        confirmVariant="danger"
      />
    </>
  );
};

export default LogoutButton;