// cloudbase.js
import cloudbase from '@cloudbase/js-sdk';

const app = cloudbase.init({
  env: 'cloud1-7gfasqln75458697'
});

const auth = app.auth({
  persistence: 'local'
});

// ✅ 只声明一次 db
const db = app.database();

// ✅ 导出所有需要的对象
export { auth, db };
export const _ = db.command;

// ✅ 其他函数保持不变
export const signInWithUsername = async (username, password) => {
  try {
    const result = await auth.signIn({ username, password });
    console.log('✅ 登录成功:', result.user?.uid);
    return { success: true, user: result.user };
  } catch (error) {
    console.error('❌ 登录失败:', error);
    return { success: false, error: error.message };
  }
};

export const signOut = async () => {
  try {
    await auth.signOut();
    return { success: true };
  } catch (error) {
    console.error('登出失败:', error);
    return { success: false, error: error.message };
  }
};

export const getCurrentUser = () => auth.currentUser;

export const hasSession = () => {
  return !!auth.currentUser;
};


export default app;