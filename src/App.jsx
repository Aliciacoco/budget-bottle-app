// App.jsx - 应用入口
// 集成登录、数据初始化、主应用

import React, { useState, useEffect } from 'react';
import { isLoggedIn, getCurrentUser, logout } from './auth';
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
  
  // 检查登录状态
  useEffect(() => {
    const checkAuth = async () => {
      if (isLoggedIn()) {
        const user = getCurrentUser();
        setCurrentUser(user);
        
        // 检查是否需要初始化引导数据
        if (!isUserInitialized(user.username)) {
          setAuthState('initializing');
          setInitMessage('正在准备您的账号...');
          
          // 初始化引导数据
          const result = await initGuideDataForUser(api, user.username);
          
          if (result.success) {
            setInitMessage('准备完成！');
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
        
        setAuthState('ready');
      } else {
        setAuthState('login');
      }
    };
    
    checkAuth();
  }, []);
  
  // 登录成功回调
  const handleLoginSuccess = async (user) => {
    setCurrentUser(user);
    
    // 检查是否需要初始化
    if (!isUserInitialized(user.username)) {
      setAuthState('initializing');
      setInitMessage('首次登录，正在初始化...');
      
      await new Promise(resolve => setTimeout(resolve, 300));
      setInitMessage('创建示例数据...');
      
      const result = await initGuideDataForUser(api, user.username);
      
      if (result.success) {
        setInitMessage('准备完成！');
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    // 显示欢迎动画
    setShowWelcome(true);
    setAuthState('ready');
  };
  
  // 退出登录
  const handleLogout = () => {
    logout();
    setCurrentUser(null);
    setAuthState('login');
    
    // 清除本地缓存
    localStorage.removeItem('budget_bottle_cache');
  };
  
  // 渲染
  switch (authState) {
    case 'checking':
      return <InitLoadingView message="加载中..." />;
      
    case 'login':
      return <LoginView onLoginSuccess={handleLoginSuccess} />;
      
    case 'initializing':
      return <InitLoadingView message={initMessage} />;
      
    case 'ready':
      return (
        <>
          <BudgetBottleApp 
            currentUser={currentUser}
            onLogout={handleLogout}
          />
          {/* 欢迎动画 */}
          {showWelcome && (
            <WelcomeAnimation
              userName={currentUser?.nickname || currentUser?.username || '用户'}
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