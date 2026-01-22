// initGuideData.js - 新用户引导数据初始化
// ✅ 支持：正式账号用 username，游客用 uid

import { getWeekInfo } from './utils/helpers';

const INIT_FLAG_PREFIX = 'budget_initialized_';
const initializingUsers = new Set();

export const isUserInitialized = (userKey) => {
  return localStorage.getItem(INIT_FLAG_PREFIX + userKey) === 'true';
};

export const markUserInitialized = (userKey) => {
  localStorage.setItem(INIT_FLAG_PREFIX + userKey, 'true');
};

export const resetUserInitFlag = (userKey) => {
  localStorage.removeItem(INIT_FLAG_PREFIX + userKey);
};

// ==================== 引导数据模板 ====================

const GUIDE_WISHES = [
  { description: 'AirPods(示例)', amount: 1399, icon: 'ball1' },
];

const GUIDE_SPECIAL_BUDGETS = [
  {
    name: '云南旅游(示例)',
    icon: 'travel',
    totalBudget: 5000,
    startDate: '',
    endDate: '',
    pinnedToHome: false,
    items: [
      { name: '交通费用(示例)', budgetAmount: 1500, actualAmount: 0 },
    ]
  }
];

const GUIDE_FIXED_EXPENSES = [
  { name: '房租(示例)', amount: 2000, enabled: true },
];

// ==================== 初始化函数 ====================

/**
 * 为用户初始化引导数据
 * @param {Object} api - API 对象（cloudApi 或 guestApi）
 * @param {string} userKey - 用户标识（正式账号用 username，游客用 uid）
 */
export const initGuideDataForUser = async (api, userKey) => {
  if (isUserInitialized(userKey)) {
    console.log('用户已初始化,跳过:', userKey);
    return { success: true, skipped: true };
  }
  
  if (initializingUsers.has(userKey)) {
    console.log('用户正在初始化中,跳过:', userKey);
    return { success: true, skipped: true };
  }
  
  initializingUsers.add(userKey);
  markUserInitialized(userKey);
  
  console.log('🎯 开始为用户初始化引导数据:', userKey);
  
  try {
    // ✅ 初始化周预算为 500
    const weekInfo = getWeekInfo(new Date());
    console.log('📌 设置初始周预算 500...');
    await api.saveWeeklyBudget(weekInfo.weekKey, 500);
    
    // 1. 创建心愿清单
    console.log('📌 创建示例心愿...');
    for (const wish of GUIDE_WISHES) {
      await api.createWish(wish.description, wish.amount, null, false, wish.icon);
    }
    
    // 2. 创建固定支出
    console.log('📌 创建示例固定支出...');
    for (const expense of GUIDE_FIXED_EXPENSES) {
      await api.createFixedExpense(expense.name, expense.amount, '', expense.enabled);
    }
    
    // 3. 创建专项预算
    console.log('📌 创建示例专项预算...');
    for (const budget of GUIDE_SPECIAL_BUDGETS) {
      const result = await api.createSpecialBudget(
        budget.name,
        budget.icon,
        budget.totalBudget,
        budget.startDate,
        budget.endDate,
        budget.pinnedToHome
      );
      
      if (result.success && budget.items) {
        for (const item of budget.items) {
          await api.createSpecialBudgetItem(
            result.data.id,
            item.name,
            item.budgetAmount,
            item.actualAmount
          );
        }
      }
    }
    
    console.log('✅ 引导数据初始化完成');
    return { success: true };
    
  } catch (error) {
    console.error('❌ 初始化引导数据失败:', error);
    // 初始化失败时清除标记以便重试
    resetUserInitFlag(userKey);
    return { success: false, error: error.message };
  } finally {
    initializingUsers.delete(userKey);
  }
};