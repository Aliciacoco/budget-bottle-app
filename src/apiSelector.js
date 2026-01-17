// apiSelector.js - API 自动选择器
// ✅ 用法：在组件中用 import * as api from './apiSelector' 替换 import * as api from './api'
// 它会自动根据用户类型选择 cloudApi 或 guestApi

import { isAnonymousUser } from './auth';
import * as cloudApi from './api';
import * as guestApi from './guestApi';

// 获取当前应该使用的 API
const getApi = () => {
  if (isAnonymousUser()) {
    return guestApi;
  }
  return cloudApi;
};

// ==================== 周预算 ====================
export const getWeeklyBudget = (...args) => getApi().getWeeklyBudget(...args);
export const saveWeeklyBudget = (...args) => getApi().saveWeeklyBudget(...args);
export const markWeeklyBudgetSettled = (...args) => getApi().markWeeklyBudgetSettled(...args);

// ==================== 交易记录 ====================
export const getTransactions = (...args) => getApi().getTransactions(...args);
export const createTransaction = (...args) => getApi().createTransaction(...args);
export const updateTransaction = (...args) => getApi().updateTransaction(...args);
export const deleteTransaction = (...args) => getApi().deleteTransaction(...args);

// ==================== 固定支出 ====================
export const getFixedExpenses = (...args) => getApi().getFixedExpenses(...args);
export const createFixedExpense = (...args) => getApi().createFixedExpense(...args);
export const updateFixedExpense = (...args) => getApi().updateFixedExpense(...args);
export const deleteFixedExpense = (...args) => getApi().deleteFixedExpense(...args);

// ==================== 心愿池 ====================
export const getWishPool = (...args) => getApi().getWishPool(...args);
export const updateWishPool = (...args) => getApi().updateWishPool(...args);
export const addToWishPool = (...args) => getApi().addToWishPool(...args);
export const checkWeekSettled = (...args) => getApi().checkWeekSettled(...args);
export const getWishPoolHistory = (...args) => getApi().getWishPoolHistory(...args);
export const createWishPoolHistory = (...args) => getApi().createWishPoolHistory(...args);
export const deleteWishPoolHistory = (...args) => getApi().deleteWishPoolHistory(...args);

// ==================== 愿望清单 ====================
export const getWishes = (...args) => getApi().getWishes(...args);
export const createWish = (...args) => getApi().createWish(...args);
export const updateWish = (...args) => getApi().updateWish(...args);
export const deleteWish = (...args) => getApi().deleteWish(...args);

// ==================== 专项预算 ====================
export const getSpecialBudgets = (...args) => getApi().getSpecialBudgets(...args);
export const createSpecialBudget = (...args) => getApi().createSpecialBudget(...args);
export const updateSpecialBudget = (...args) => getApi().updateSpecialBudget(...args);
export const updateSpecialBudgetIconPosition = (...args) => getApi().updateSpecialBudgetIconPosition(...args);
export const deleteSpecialBudget = (...args) => getApi().deleteSpecialBudget(...args);

// ==================== 专项预算子项 ====================
export const getSpecialBudgetItems = (...args) => getApi().getSpecialBudgetItems(...args);
export const createSpecialBudgetItem = (...args) => getApi().createSpecialBudgetItem(...args);
export const updateSpecialBudgetItem = (...args) => getApi().updateSpecialBudgetItem(...args);
export const deleteSpecialBudgetItem = (...args) => getApi().deleteSpecialBudgetItem(...args);

// ==================== 专项预算消费记录 ====================
export const getSpecialBudgetTransactions = (...args) => getApi().getSpecialBudgetTransactions(...args);
export const createSpecialBudgetTransaction = (...args) => getApi().createSpecialBudgetTransaction(...args);
export const updateSpecialBudgetTransaction = (...args) => getApi().updateSpecialBudgetTransaction(...args);
export const deleteSpecialBudgetTransaction = (...args) => getApi().deleteSpecialBudgetTransaction(...args);
export const getSpecialBudgetItemActualAmount = (...args) => getApi().getSpecialBudgetItemActualAmount(...args);

// ==================== Keepalive 删除函数 ====================
export const deleteTransactionWithKeepAlive = (...args) => getApi().deleteTransactionWithKeepAlive(...args);
export const deleteWishWithKeepAlive = (...args) => getApi().deleteWishWithKeepAlive(...args);
export const deleteFixedExpenseWithKeepAlive = (...args) => getApi().deleteFixedExpenseWithKeepAlive(...args);
export const deleteSpecialBudgetWithKeepAlive = (...args) => getApi().deleteSpecialBudgetWithKeepAlive(...args);
export const deleteSpecialBudgetItemWithKeepAlive = (...args) => getApi().deleteSpecialBudgetItemWithKeepAlive(...args);
export const deleteSpecialBudgetTransactionWithKeepAlive = (...args) => getApi().deleteSpecialBudgetTransactionWithKeepAlive(...args);