// initGuideData.js - 新用户引导数据初始化
// 为新账号创建示例数据，帮助用户了解功能

import { getUserPrefix } from './auth';
import { getWeekInfo, formatDate } from './utils/helpers';

// 检查用户是否已初始化
const INIT_FLAG_PREFIX = 'budget_initialized_';

export const isUserInitialized = (username) => {
  return localStorage.getItem(INIT_FLAG_PREFIX + username) === 'true';
};

export const markUserInitialized = (username) => {
  localStorage.setItem(INIT_FLAG_PREFIX + username, 'true');
};

// ==================== 引导数据模板 ====================

// 心愿清单引导数据（带示例标识）
const GUIDE_WISHES = [
  { description: 'AirPods Pro 🎧（示例）', amount: 1899, icon: 'star' },
  { description: '周末短途旅行 ✈️（示例）', amount: 800, icon: 'star' },
];

// 专项预算引导数据（旅游主题，简化明细）
const GUIDE_SPECIAL_BUDGETS = [
  {
    name: '云南旅游（示例）',
    icon: 'travel',
    totalBudget: 5000,
    startDate: '',
    endDate: '',
    pinnedToHome: true,
    items: [
      { name: '交通费用（示例）', budgetAmount: 1500, actualAmount: 0 },
    ]
  }
];

// 固定支出引导数据（带示例标识）
const GUIDE_FIXED_EXPENSES = [
  { name: '房租（示例）', amount: 2000, enabled: true },
  { name: '话费（示例）', amount: 58, enabled: true },
];

// ==================== 初始化函数 ====================

/**
 * 为新用户初始化引导数据
 * @param {object} api - API 模块
 * @param {string} username - 用户名
 */
export const initGuideDataForUser = async (api, username) => {
  // 检查是否已初始化
  if (isUserInitialized(username)) {
    console.log('用户已初始化，跳过:', username);
    return { success: true, skipped: true };
  }
  
  console.log('🎯 开始为新用户初始化引导数据:', username);
  
  try {
    const weekInfo = getWeekInfo(new Date());
    
    // 1. 创建本周预算（示例金额）
    console.log('📌 创建周预算...');
    await api.saveWeeklyBudget(weekInfo.weekKey, 500);
    
    // 2. 创建心愿清单（带示例标识）
    console.log('📌 创建示例心愿...');
    for (const wish of GUIDE_WISHES) {
      await api.createWish(wish.description, wish.amount, null, false, wish.icon);
    }
    
    // 3. 创建固定支出（带示例标识）
    console.log('📌 创建示例固定支出...');
    for (const expense of GUIDE_FIXED_EXPENSES) {
      await api.createFixedExpense(expense.name, expense.amount, '', expense.enabled);
    }
    
    // 4. 创建专项预算（旅游主题，带示例标识）
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
    
    // 标记已初始化
    markUserInitialized(username);
    
    console.log('✅ 引导数据初始化完成');
    return { success: true };
    
  } catch (error) {
    console.error('❌ 初始化引导数据失败:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 重置用户数据（用于测试）
 * @param {string} username - 用户名
 */
export const resetUserInitFlag = (username) => {
  localStorage.removeItem(INIT_FLAG_PREFIX + username);
};