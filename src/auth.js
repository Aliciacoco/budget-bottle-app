// auth.js - 账号认证模块
// 支持10个固定测试账号，数据隔离

// ==================== 测试账号配置 ====================
// 可以根据需要修改账号名和密码
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

// ==================== 认证函数 ====================

/**
 * 登录验证
 * @param {string} username 用户名
 * @param {string} password 密码
 * @returns {{ success: boolean, user?: object, error?: string }}
 */
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
    loginTime: Date.now()
  };
  
  // 保存登录状态
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  
  return { success: true, user };
};

/**
 * 退出登录
 */
export const logout = () => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
};

/**
 * 获取当前登录用户
 * @returns {object|null}
 */
export const getCurrentUser = () => {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch {
    return null;
  }
};

/**
 * 检查是否已登录
 * @returns {boolean}
 */
export const isLoggedIn = () => {
  return getCurrentUser() !== null;
};

/**
 * 获取当前用户的数据前缀（用于数据隔离）
 * @returns {string}
 */
export const getUserPrefix = () => {
  const user = getCurrentUser();
  return user ? user.username : 'guest';
};