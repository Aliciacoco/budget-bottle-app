// App.jsx - 应用入口
// ✅ 修改：支持游客模式（数据保存本地）

import React, { useState, useEffect } from 'react';
import { 
  hasSession, 
  getCurrentUser, 
  signOut as signOutCloud,
  auth
} from './cloudbase';

// ✅ 新增：从 auth.js 导入游客相关函数
import { 
  loginAsGuest, 
  isAnonymousUser, 
  logout as authLogout 
} from './auth';

import { isUserInitialized, initGuideDataForUser } from './initGuideData';
import * as cloudApi from './api';           // 云端 API
import * as guestApi from './guestApi';       // ✅ 新增：游客本地 API

// 页面组件
import LoginView from './views/LoginView';
import BudgetBottleApp from './BudgetBottleApp';
import WelcomeAnimation from './components/WelcomeAnimation';


// ✅ 根据用户类型获取对应的 API
const getApi = () => {
  if (isAnonymousUser()) {
    return guestApi;
  }
  return cloudApi;
};

// 初始化加载组件
const InitLoadingView = ({ message }) => (
  <div className="min-h-screen bg-gradient-to-b from-cyan-50 to-white flex flex-col items-center justify-center px-6">
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@400;500;700;800&display=swap');
      .font-rounded { font-family: 'M PLUS Rounded 1c', sans-serif; }
    `}</style>
    <div className="w-16 h-16 border-4 border-cyan-200 border-t-cyan-500 rounded-full animate-spin mb-6" />
    <p className="text-gray-500 font-bold font-rounded">{message}</p>
  </div>
);

const App = () => {
  // checking: 检查会话中
  // login: 显示登录页
  // initializing: 初始化数据中
  // ready: 主应用
  const [authState, setAuthState] = useState('checking');
  const [currentUser, setCurrentUser] = useState(null);
  const [initMessage, setInitMessage] = useState('');
  const [showWelcome, setShowWelcome] = useState(false);
  
  // 初始化用户会话
  const initializeSession = async (user, isNewUser = false) => {
    setCurrentUser(user);
    
    // ✅ 使用正确的 API（游客用 guestApi，正式账号用 cloudApi）
    const api = getApi();
    
    // ✅ 游客用 uid 作为标识，正式账号用 username
    const userKey = user.isGuest ? user.uid : user.username;
    
    // 检查是否需要初始化引导数据
    if (!isUserInitialized(userKey)) {
      setAuthState('initializing');
      setInitMessage('正在准备数据...');
      
      const result = await initGuideDataForUser(api, userKey);
      
      if (result.success) {
        setInitMessage('准备完成！');
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      // 新用户显示欢迎动画
      if (isNewUser) {
        setShowWelcome(true);
      }
    }
    
    setAuthState('ready');
  };
  
  // 检查会话状态
  useEffect(() => {
    const checkAuth = async () => {
      console.log('🔍 开始检查登录状态...');
      
      try {
        const isAuthenticated = await hasSession();
        
        if (!isAuthenticated) {
          setAuthState('login');
          return;
        }

        const user = getCurrentUser();
        console.log('👤 当前用户:', user);

        if (!user) {
          setAuthState('login');
          return;
        }

        await initializeSession(user, false);
      } catch (err) {
        console.error('❌ 检查登录时出错:', err);
        setAuthState('login');
      }
    };

    checkAuth();
  }, []);
  
  // 登录成功回调（正式账号）
  const handleLoginSuccess = async (user) => {
    setCurrentUser(user);
    
    const api = cloudApi;  // 正式账号用云端 API
    
    // 检查新账号是否需要初始化
    if (!isUserInitialized(user.username)) {
      setAuthState('initializing');
      setInitMessage('正在加载您的数据...');
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const result = await initGuideDataForUser(api, user.username);
      
      if (result.success) {
        setInitMessage('准备完成！');
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    setShowWelcome(true);
    setAuthState('ready');
  };
  
  // ✅ 修改：游客模式 - 真正创建游客会话
  const handleGuestMode = async () => {
    console.log('🎭 进入游客模式...');
    
    try {
      const result = loginAsGuest();
      
      if (result.success) {
        const user = result.user;
        setCurrentUser(user);
        
        // 游客用 guestApi
        const api = guestApi;
        
        // 初始化游客数据
        setAuthState('initializing');
        setInitMessage('正在准备体验数据...');
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const initResult = await initGuideDataForUser(api, user.uid);
        
        if (initResult.success) {
          setInitMessage('准备完成！');
          await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        setShowWelcome(true);
        setAuthState('ready');
      }
    } catch (err) {
      console.error('❌ 游客模式启动失败:', err);
      alert('进入游客模式失败，请重试');
    }
  };
  
  // ✅ 修改：退出登录 -> 回到登录页
  const handleLogout = async () => {
    const wasGuest = isAnonymousUser();
    
    // 使用 auth.js 的 logout（会自动处理游客数据清除）
    await authLogout();
    
    localStorage.removeItem('budget_bottle_cache');
    
    // 清空状态，回到登录页
    setCurrentUser(null);
    setShowWelcome(false);
    setAuthState('login');
    
    console.log('👋 已退出', wasGuest ? '(游客数据已清除)' : '');
  };
  
  // 切换到登录页面（从主应用跳转）
  const handleSwitchToLogin = () => {
    setAuthState('login');
  };
  
  // 从登录页返回（仅当已有会话时可用）
  const handleBackFromLogin = () => {
    if (currentUser) {
      setAuthState('ready');
    }
  };
  
  // 渲染
  switch (authState) {
    case 'checking':
      return <InitLoadingView message="加载中..." />;
      
    case 'login':
      return (
        <LoginView 
          onLoginSuccess={handleLoginSuccess} 
          onBack={currentUser ? handleBackFromLogin : null}
          onGuestMode={handleGuestMode}
          showGuestOption={true}
        />
      );
      
    case 'initializing':
      return <InitLoadingView message={initMessage} />;
      
    case 'ready':
      return (
        <>
          <BudgetBottleApp 
            currentUser={currentUser}
            onLogout={handleLogout}
            onSwitchAccount={handleSwitchToLogin}
            api={getApi()}  // ✅ 传入正确的 API
          />
          {showWelcome && (
            <WelcomeAnimation
              userName={currentUser?.username || ''}
              onComplete={() => setShowWelcome(false)}
              isGuest={currentUser?.isGuest === true}  // ✅ 添加：传入游客标识
            />
          )}
        </>
      );
      
    default:
      return <InitLoadingView message="加载中..." />;
  }
};

export default App;