// auth.js - 账号认证模块
// 支持匿名用户 + 正式账号

// ==================== 正式账号配置 ====================
export const TEST_ACCOUNTS = [
  { username: 'test01', password: 'cloud2026', nickname: 'Coco' },
  { username: 'test02', password: 'cloud2026', nickname: '波哥' },
  { username: 'test03', password: 'cloud2026', nickname: '测试用户3' },
  { username: 'test04', password: 'cloud2026', nickname: '测试用户4' },
  { username: 'test05', password: 'cloud2026', nickname: '测试用户5' },
  { username: 'test06', password: 'cloud2026', nickname: '测试用户6' },
  { username: 'test07', password: 'cloud2026', nickname: '测试用户7' },
  { username: 'test08', password: 'cloud2026', nickname: '测试用户8' },
  { username: 'test09', password: 'cloud2026', nickname: '测试用户9' },
  { username: 'test10', password: 'cloud2026', nickname: '测试用户10' },
];

// ==================== 本地存储 Key ====================
const AUTH_STORAGE_KEY = 'budget_bottle_auth';
const ANONYMOUS_ID_KEY = 'budget_bottle_anonymous_id';

// ==================== 匿名用户相关 ====================

const generateAnonymousId = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = 'anon_';
  for (let i = 0; i < 8; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
};

export const getOrCreateAnonymousId = () => {
  let anonymousId = localStorage.getItem(ANONYMOUS_ID_KEY);
  
  if (!anonymousId) {
    anonymousId = generateAnonymousId();
    localStorage.setItem(ANONYMOUS_ID_KEY, anonymousId);
  }
  
  return anonymousId;
};

export const createAnonymousSession = () => {
  const anonymousId = getOrCreateAnonymousId();
  
  const user = {
    username: anonymousId,
    nickname: '新朋友',  // 修改：更友好的昵称
    isAnonymous: true,
    loginTime: Date.now()
  };
  
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  
  return { success: true, user };
};

// ==================== 正式账号认证 ====================

export const login = (username, password) => {
  const account = TEST_ACCOUNTS.find(
    acc => acc.username === username.toLowerCase().trim()
  );
  
  if (!account) {
    return { success: false, error: '账号不存在' };
  }
  
  if (account.password !== password) {
    return { success: false, error: '密码错误' };
  }
  
  const user = {
    username: account.username,
    nickname: account.nickname,
    isAnonymous: false,
    loginTime: Date.now()
  };
  
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  
  return { success: true, user };
};

export const logout = () => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
};

export const getCurrentUser = () => {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch {
    return null;
  }
};

export const hasSession = () => {
  return getCurrentUser() !== null;
};

export const isAnonymousUser = () => {
  const user = getCurrentUser();
  return user?.isAnonymous === true;
};

export const isLoggedIn = () => {
  const user = getCurrentUser();
  return user !== null && user.isAnonymous !== true;
};

export const getUserPrefix = () => {
  const user = getCurrentUser();
  return user ? user.username : getOrCreateAnonymousId();
};