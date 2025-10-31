import AV from 'leancloud-storage';

const APP_ID = 'rU9HlLK7P3cjD0gjn9XLNDFQ-gzGzoHsz';  
const APP_KEY = 'MBJ5kDwwXfzdG1Iz2RpONI4U';
const SERVER_URL = 'https://ru9hllk7.lc-cn-n1-shared.com';

console.log('🔧 初始化 LeanCloud...');
console.log('📍 服务器地址:', SERVER_URL);
console.log('🔑 APP_ID:', APP_ID);

// 初始化 LeanCloud
try {
  AV.init({
    appId: APP_ID,
    appKey: APP_KEY,
    serverURL: SERVER_URL
  });
  console.log('✅ LeanCloud 初始化成功');
} catch (error) {
  console.error('❌ LeanCloud 初始化失败:', error);
}

// 测试连接函数
export const testConnection = async () => {
  try {
    console.log('🔄 开始测试 LeanCloud 连接...');
    const Test = AV.Object.extend('Test');
    const t = new Test();
    t.set('hello', 'world');
    t.set('timestamp', new Date().toISOString());
    await t.save();
    console.log('✅ 成功写入 LeanCloud');
    return true;
  } catch (error) {
    console.error('❌ LeanCloud 写入失败:', error);
    console.error('错误详情:', error.message);
    return false;
  }
};

export default AV;