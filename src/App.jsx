// App.jsx - 应用入口
// Lazy Login: 自动匿名登录，按需绑定正式账号

import React, { useState, useEffect } from 'react';
import { 
  hasSession, 
  getCurrentUser, 
  logout, 
  createAnonymousSession,
  isAnonymousUser 
} from './auth';
import { isUserInitialized, initGuideDataForUser } from './initGuideData';
import * as api from './api';

// 页面组件
import LoginView from './views/LoginView';
import BudgetBottleApp from './BudgetBottleApp';
import WelcomeAnimation from './components/WelcomeAnimation';

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
  const [authState, setAuthState] = useState('checking'); // checking | login | initializing | ready
  const [currentUser, setCurrentUser] = useState(null);
  const [initMessage, setInitMessage] = useState('');
  const [showWelcome, setShowWelcome] = useState(false);
  
  // 初始化用户会话
  const initializeSession = async (user, isNewUser = false) => {
    setCurrentUser(user);
    
    // 检查是否需要初始化引导数据
    if (!isUserInitialized(user.username)) {
      setAuthState('initializing');
      setInitMessage('正在准备数据...');
      
      const result = await initGuideDataForUser(api, user.username);
      
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
  
  // 检查/创建会话
  useEffect(() => {
    const checkAuth = async () => {
      if (hasSession()) {
        // 已有会话（匿名或正式），直接使用
        const user = getCurrentUser();
        await initializeSession(user, false);
      } else {
        // 没有会话，创建匿名会话
        setInitMessage('正在进入...');
        const result = createAnonymousSession();
        
        if (result.success) {
          await initializeSession(result.user, true);
        }
      }
    };
    
    checkAuth();
  }, []);
  
  // 登录成功回调（从匿名升级为正式账号）
  const handleLoginSuccess = async (user) => {
    setCurrentUser(user);
    
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
  
  // 退出登录 -> 回到匿名状态
  const handleLogout = async () => {
    logout();
    localStorage.removeItem('budget_bottle_cache');
    
    // 重新创建匿名会话
    setAuthState('checking');
    setInitMessage('正在退出...');
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const result = createAnonymousSession();
    if (result.success) {
      await initializeSession(result.user, false);
    }
  };
  
  // 切换到登录页面（绑定/切换账号）
  const handleSwitchToLogin = () => {
    setAuthState('login');
  };
  
  // 从登录页返回
  const handleBackFromLogin = () => {
    setAuthState('ready');
  };
  
  // 渲染
  switch (authState) {
    case 'checking':
      return <InitLoadingView message="加载中..." />;
      
    case 'login':
      return (
        <LoginView 
          onLoginSuccess={handleLoginSuccess} 
          onBack={handleBackFromLogin}
          isAnonymous={isAnonymousUser()}
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
          />
          {showWelcome && (
            <WelcomeAnimation
              userName={currentUser?.nickname || ''}
              onComplete={() => setShowWelcome(false)}
            />
          )}
        </>
      );
      
    default:
      return <InitLoadingView message="加载中..." />;
  }
};

export default App;