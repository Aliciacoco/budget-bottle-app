// auth.js - 使用腾讯云身份认证(适配纯数据库场景)
// ✅ 新增：游客模式支持

// ✅ 合并导入,避免重复声明 db
import { 
  signInWithUsername as tcbSignIn, 
  signOut as tcbSignOut, 
  getCurrentUser as getTcbCurrentUser,
  auth,
  db
} from './cloudbase';

// ==================== 本地存储 Key ====================
const AUTH_STORAGE_KEY = 'budget_bottle_auth';
const GUEST_PREFIX = 'guest_';

// ==================== 登录 ====================
export const login = async (username, password) => {
  const result = await tcbSignIn(username, password);
  
  if (result.success) {
    // 保存基础信息用于 UI 快速展示(非认证依据!)
    const user = {
      username: username,
      uid: result.user?.uid,
      isAnonymous: false,
      isGuest: false,  // ✅ 新增：标记非游客
      loginTime: Date.now()
    };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    return { success: true, user };
  }
  
  return { success: false, error: result.error || '登录失败' };
};

// ==================== ✅ 新增：游客登录 ====================
export const loginAsGuest = () => {
  const guestId = `${GUEST_PREFIX}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const user = {
    username: '游客',
    uid: guestId,
    isAnonymous: false,
    isGuest: true,  // ✅ 标记为游客
    loginTime: Date.now()
  };
  
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  console.log('🎭 游客模式登录成功:', guestId);
  
  return { success: true, user };
};

// ==================== 登出 ====================
export const logout = async () => {
  const user = getCurrentUser();
  const wasGuest = user?.isGuest === true;
  const guestId = user?.uid;
  
  // 清除认证信息
  localStorage.removeItem(AUTH_STORAGE_KEY);
  
  // ✅ 如果是游客，清除所有游客数据
  if (wasGuest && guestId) {
    clearGuestData(guestId);
    console.log('🗑️ 游客数据已清除');
  } else {
    // 正式账号登出 CloudBase
    await tcbSignOut();
  }
};

// ==================== ✅ 新增：清除游客数据 ====================
const clearGuestData = (guestId) => {
  console.log('🗑️ 清除游客数据:', guestId);
  
  const keysToRemove = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(guestId)) {
      keysToRemove.push(key);
    }
  }
  
  // 同时清除初始化标记
  keysToRemove.push(`budget_initialized_${guestId}`);
  
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
  });
  
  console.log(`✅ 已清除 ${keysToRemove.length} 条游客数据`);
};

// ==================== 获取当前用户(仅用于 UI 展示)====================
export const getCurrentUser = () => {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

// ==================== 【关键】检查是否真正可访问数据库 ====================
// ⚠️ 这个才是业务逻辑中判断"能否查数据"的唯一标准
export const hasSession = async () => {
  const user = getCurrentUser();
  
  // ✅ 游客模式：不需要云端会话，直接返回 true
  if (user?.isGuest) {
    console.log('✅ 游客模式，使用本地存储');
    return true;
  }
  
  // 正式账号：检查云端会话
  try {
    // 👇 关键:先获取 ticket,触发 SDK 恢复
    const ticket = await auth.getTicket();

    if (!ticket) return false;

    // 然后检查用户是否存在
    const currentUser = auth.currentUser;
    if (!currentUser) return false;

    console.log('✅ 会话恢复成功:', { uid: currentUser.uid, username: currentUser.username });
    return true;
  } catch (err) {
    console.warn('❌ 会话恢复失败:', err.message);
    return false;
  }
};

// ==================== 同步快速检查(仅用于 UI 显示,如"欢迎 XXX")====================
export const hasSessionSync = () => {
  return getCurrentUser() !== null;
};

export const isLoggedIn = () => {
  return getCurrentUser() !== null;
};

// ==================== 获取用户标识(用于数据隔离)====================
// ⚠️ 注意:这个值只能在 hasSession() 为 true 后使用!
export const getUserPrefix = () => {
  const user = getCurrentUser();
  return user?.uid || user?.username || '';
};

// ==================== ✅ 修改：游客用户检查 ====================
export const isAnonymousUser = () => {
  const user = getCurrentUser();
  return user?.isGuest === true;
};

// ==================== ✅ 新增：获取游客存储前缀 ====================
export const getGuestStoragePrefix = () => {
  const user = getCurrentUser();
  if (user?.isGuest) {
    return user.uid;
  }
  return null;
};

export const createAnonymousSession = () => {
  return { success: false, error: '请使用账号登录' };
};

export const getOrCreateAnonymousId = () => {
  return null;
};
