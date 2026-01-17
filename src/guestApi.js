// guestApi.js - 游客模式本地数据存储 API
// 接口与 api.js (云端版本) 完全一致，方便切换

import { getGuestStoragePrefix } from './auth';

// ==========================================
// 工具函数
// ==========================================

const getStoragePrefix = () => {
  return getGuestStoragePrefix() || 'guest';
};

const getStorage = (key) => {
  const prefix = getStoragePrefix();
  const fullKey = `${prefix}_${key}`;
  try {
    const data = localStorage.getItem(fullKey);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

const setStorage = (key, value) => {
  const prefix = getStoragePrefix();
  const fullKey = `${prefix}_${key}`;
  localStorage.setItem(fullKey, JSON.stringify(value));
};

const generateId = () => {
  return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const fixAmount = (amount) => Math.round(amount * 100) / 100;

// ==================== 周预算 ====================

export const getWeeklyBudget = async (weekKey) => {
  const budgets = getStorage('weekly_budgets') || {};
  const budget = budgets[weekKey];
  
  if (budget) {
    return {
      success: true,
      data: {
        id: budget.id,
        weekKey: budget.weekKey,
        amount: fixAmount(budget.amount),
        settled: budget.settled || false,
        createdAt: budget.createdAt
      }
    };
  }
  return { success: true, data: null };
};

export const saveWeeklyBudget = async (weekKey, amount) => {
  const budgets = getStorage('weekly_budgets') || {};
  const now = new Date().toISOString();
  
  const existing = budgets[weekKey];
  const budget = {
    id: existing?.id || generateId(),
    weekKey,
    amount: fixAmount(amount),
    settled: existing?.settled || false,
    createdAt: existing?.createdAt || now,
    updatedAt: now
  };
  
  budgets[weekKey] = budget;
  setStorage('weekly_budgets', budgets);
  
  return { success: true, data: budget };
};

export const markWeeklyBudgetSettled = async (weekKey) => {
  const budgets = getStorage('weekly_budgets') || {};
  
  if (budgets[weekKey]) {
    budgets[weekKey].settled = true;
    budgets[weekKey].updatedAt = new Date().toISOString();
    setStorage('weekly_budgets', budgets);
    return { success: true };
  }
  return { success: false, error: '未找到该周预算' };
};

// ==================== 交易记录 ====================

export const getTransactions = async (weekKey) => {
  const transactions = getStorage('transactions') || [];
  const filtered = transactions
    .filter(t => t.weekKey === weekKey)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  return {
    success: true,
    data: filtered.map(t => ({
      id: t.id,
      weekKey: t.weekKey,
      date: t.date,
      time: t.time,
      amount: fixAmount(t.amount),
      description: t.description || '',
      createdAt: t.createdAt
    }))
  };
};

export const createTransaction = async (weekKey, date, time, amount, description) => {
  const transactions = getStorage('transactions') || [];
  const now = new Date().toISOString();
  
  const transaction = {
    id: generateId(),
    weekKey,
    date,
    time,
    amount: fixAmount(amount),
    description: description || '',
    createdAt: now
  };
  
  transactions.unshift(transaction);
  setStorage('transactions', transactions);
  
  return { success: true, data: transaction };
};

export const updateTransaction = async (transactionId, weekKey, amount, description, date = null) => {
  const transactions = getStorage('transactions') || [];
  const index = transactions.findIndex(t => t.id === transactionId);
  
  if (index === -1) {
    return { success: false, error: '记录不存在' };
  }
  
  const updated = {
    ...transactions[index],
    amount: fixAmount(amount),
    description: description || '',
    updatedAt: new Date().toISOString()
  };
  if (date) updated.date = date;
  
  transactions[index] = updated;
  setStorage('transactions', transactions);
  
  return { success: true, data: updated };
};

export const deleteTransaction = async (transactionId) => {
  const transactions = getStorage('transactions') || [];
  const filtered = transactions.filter(t => t.id !== transactionId);
  setStorage('transactions', filtered);
  return { success: true };
};

// ==================== 固定支出 ====================

export const getFixedExpenses = async () => {
  const expenses = getStorage('fixed_expenses') || [];
  return {
    success: true,
    data: expenses.map(e => ({
      id: e.id,
      name: e.name,
      amount: fixAmount(e.amount),
      expireDate: e.expireDate || '',
      enabled: e.enabled !== false,
      createdAt: e.createdAt
    }))
  };
};

export const createFixedExpense = async (name, amount, expireDate, enabled = true) => {
  const expenses = getStorage('fixed_expenses') || [];
  const now = new Date().toISOString();
  
  const expense = {
    id: generateId(),
    name,
    amount: fixAmount(amount),
    expireDate: expireDate || '',
    enabled,
    createdAt: now
  };
  
  expenses.push(expense);
  setStorage('fixed_expenses', expenses);
  
  return { success: true, data: expense };
};

export const updateFixedExpense = async (expenseId, name, amount, expireDate, enabled) => {
  const expenses = getStorage('fixed_expenses') || [];
  const index = expenses.findIndex(e => e.id === expenseId);
  
  if (index === -1) {
    return { success: false, error: '固定支出不存在' };
  }
  
  expenses[index] = {
    ...expenses[index],
    name,
    amount: fixAmount(amount),
    expireDate: expireDate || '',
    enabled,
    updatedAt: new Date().toISOString()
  };
  
  setStorage('fixed_expenses', expenses);
  return { success: true, data: expenses[index] };
};

export const deleteFixedExpense = async (expenseId) => {
  const expenses = getStorage('fixed_expenses') || [];
  const filtered = expenses.filter(e => e.id !== expenseId);
  setStorage('fixed_expenses', filtered);
  return { success: true };
};

// ==================== 心愿池历史 ====================

export const getWishPoolHistory = async () => {
  const history = getStorage('wish_pool_history') || [];
  return {
    success: true,
    data: history.map(h => ({
      id: h.id,
      weekKey: h.weekKey,
      budgetAmount: fixAmount(h.budgetAmount || 0),
      spentAmount: fixAmount(h.spentAmount || 0),
      savedAmount: fixAmount(h.savedAmount || 0),
      isDeduction: h.isDeduction === true,
      wishName: h.wishName || '',
      wishId: h.wishId || '',
      settledAt: h.settledAt,
      createdAt: h.createdAt
    }))
  };
};

export const createWishPoolHistory = async (weekKey, budgetAmount, spentAmount, savedAmount, isDeduction = false, wishName = '', wishId = '') => {
  const history = getStorage('wish_pool_history') || [];
  const now = new Date().toISOString();
  
  // 检查是否已存在（非扣除类型的）
  if (!isDeduction) {
    const existing = history.find(h => h.weekKey === weekKey && !h.isDeduction);
    if (existing) {
      return {
        success: true,
        isNew: false,
        data: { id: existing.id, weekKey: existing.weekKey, savedAmount: fixAmount(existing.savedAmount) }
      };
    }
  }
  
  const record = {
    id: generateId(),
    weekKey,
    budgetAmount: fixAmount(budgetAmount),
    spentAmount: fixAmount(spentAmount),
    savedAmount: fixAmount(savedAmount),
    isDeduction,
    wishName,
    wishId,
    settledAt: now,
    createdAt: now
  };
  
  history.unshift(record);
  setStorage('wish_pool_history', history);
  
  return { success: true, isNew: true, data: record };
};

export const deleteWishPoolHistory = async (historyId) => {
  const history = getStorage('wish_pool_history') || [];
  const filtered = history.filter(h => h.id !== historyId);
  setStorage('wish_pool_history', filtered);
  return { success: true };
};

// ==================== 心愿池 ====================

export const getWishPool = async () => {
  const historyResult = await getWishPoolHistory();
  if (!historyResult.success) return { success: true, data: { amount: 0 } };
  
  const total = historyResult.data.reduce((sum, h) => sum + (h.savedAmount || 0), 0);
  return { success: true, data: { amount: fixAmount(total) } };
};

export const updateWishPool = async (amount) => {
  return { success: true, data: { amount: fixAmount(amount) } };
};

export const addToWishPool = async (addAmount) => {
  return { success: true, data: { amount: fixAmount(addAmount) } };
};

export const checkWeekSettled = async (weekKey) => {
  const history = getStorage('wish_pool_history') || [];
  const found = history.some(h => h.weekKey === weekKey && !h.isDeduction);
  return { success: true, settled: found };
};

// ==================== 愿望清单 ====================

export const getWishes = async () => {
  const wishes = getStorage('wishes') || [];
  return {
    success: true,
    data: wishes.map(w => ({
      id: w.id,
      description: w.description,
      amount: fixAmount(w.amount),
      image: w.image || null,
      icon: w.icon || 'star',
      fulfilled: w.fulfilled || false,
      createdAt: w.createdAt
    }))
  };
};

export const createWish = async (description, amount, image, fulfilled = false, icon = 'star') => {
  const wishes = getStorage('wishes') || [];
  const now = new Date().toISOString();
  
  const wish = {
    id: generateId(),
    description,
    amount: fixAmount(amount),
    image: image || null,
    icon: icon || 'star',
    fulfilled,
    createdAt: now
  };
  
  wishes.push(wish);
  setStorage('wishes', wishes);
  
  return { success: true, data: wish };
};

export const updateWish = async (wishId, description, amount, image, fulfilled = false, icon = 'star') => {
  const wishes = getStorage('wishes') || [];
  const index = wishes.findIndex(w => w.id === wishId);
  
  if (index === -1) {
    return { success: false, error: '心愿不存在' };
  }
  
  wishes[index] = {
    ...wishes[index],
    description,
    amount: fixAmount(amount),
    image: image || null,
    icon: icon || 'star',
    fulfilled,
    updatedAt: new Date().toISOString()
  };
  
  setStorage('wishes', wishes);
  return { success: true, data: wishes[index] };
};

export const deleteWish = async (wishId) => {
  const wishes = getStorage('wishes') || [];
  const filtered = wishes.filter(w => w.id !== wishId);
  setStorage('wishes', filtered);
  return { success: true };
};

// ==================== 专项预算 ====================

export const getSpecialBudgets = async () => {
  const budgets = getStorage('special_budgets') || [];
  return {
    success: true,
    data: budgets.map(b => ({
      id: b.id,
      name: b.name,
      icon: b.icon || 'travel',
      totalBudget: fixAmount(b.totalBudget || 0),
      startDate: b.startDate || '',
      endDate: b.endDate || '',
      pinnedToHome: b.pinnedToHome || false,
      iconOffsetX: b.iconOffsetX || 0,
      iconOffsetY: b.iconOffsetY || 0,
      iconScale: b.iconScale || 1,
      createdAt: b.createdAt
    }))
  };
};

export const createSpecialBudget = async (name, icon, totalBudget, startDate, endDate, pinnedToHome = false) => {
  const budgets = getStorage('special_budgets') || [];
  const now = new Date().toISOString();
  
  const budget = {
    id: generateId(),
    name,
    icon: icon || 'travel',
    totalBudget: fixAmount(totalBudget || 0),
    startDate: startDate || '',
    endDate: endDate || '',
    pinnedToHome,
    iconOffsetX: 0,
    iconOffsetY: 0,
    iconScale: 1,
    createdAt: now
  };
  
  budgets.push(budget);
  setStorage('special_budgets', budgets);
  
  return { success: true, data: budget };
};

export const updateSpecialBudget = async (budgetId, name, icon, totalBudget, startDate, endDate, pinnedToHome) => {
  const budgets = getStorage('special_budgets') || [];
  const index = budgets.findIndex(b => b.id === budgetId);
  
  if (index === -1) {
    return { success: false, error: '专项预算不存在' };
  }
  
  budgets[index] = {
    ...budgets[index],
    name,
    icon,
    totalBudget: fixAmount(totalBudget),
    startDate,
    endDate,
    pinnedToHome,
    updatedAt: new Date().toISOString()
  };
  
  setStorage('special_budgets', budgets);
  return { success: true, data: budgets[index] };
};

export const updateSpecialBudgetIconPosition = async (budgetId, offsetX, offsetY, scale) => {
  const budgets = getStorage('special_budgets') || [];
  const index = budgets.findIndex(b => b.id === budgetId);
  
  if (index === -1) {
    return { success: false, error: '专项预算不存在' };
  }
  
  budgets[index].iconOffsetX = offsetX;
  budgets[index].iconOffsetY = offsetY;
  budgets[index].iconScale = scale;
  budgets[index].updatedAt = new Date().toISOString();
  
  setStorage('special_budgets', budgets);
  return { success: true, data: { id: budgetId, iconOffsetX: offsetX, iconOffsetY: offsetY, iconScale: scale } };
};

export const deleteSpecialBudget = async (budgetId) => {
  // 删除预算
  const budgets = getStorage('special_budgets') || [];
  const filtered = budgets.filter(b => b.id !== budgetId);
  setStorage('special_budgets', filtered);
  
  // 删除关联的 items
  const items = getStorage('special_budget_items') || [];
  const itemIds = items.filter(i => i.budgetId === budgetId).map(i => i.id);
  const filteredItems = items.filter(i => i.budgetId !== budgetId);
  setStorage('special_budget_items', filteredItems);
  
  // 删除关联的 transactions
  const transactions = getStorage('special_budget_transactions') || [];
  const filteredTrans = transactions.filter(t => !itemIds.includes(t.itemId));
  setStorage('special_budget_transactions', filteredTrans);
  
  return { success: true };
};

// ==================== 专项预算子项 ====================

export const getSpecialBudgetItems = async (budgetId) => {
  const items = getStorage('special_budget_items') || [];
  const filtered = items.filter(i => i.budgetId === budgetId);
  
  return {
    success: true,
    data: filtered.map(i => ({
      id: i.id,
      budgetId: i.budgetId,
      name: i.name,
      budgetAmount: fixAmount(i.budgetAmount || 0),
      actualAmount: fixAmount(i.actualAmount || 0),
      createdAt: i.createdAt
    }))
  };
};

export const createSpecialBudgetItem = async (budgetId, name, budgetAmount, actualAmount = 0) => {
  const items = getStorage('special_budget_items') || [];
  const now = new Date().toISOString();
  
  const item = {
    id: generateId(),
    budgetId,
    name,
    budgetAmount: fixAmount(budgetAmount || 0),
    actualAmount: fixAmount(actualAmount || 0),
    createdAt: now
  };
  
  items.push(item);
  setStorage('special_budget_items', items);
  
  return { success: true, data: item };
};

export const updateSpecialBudgetItem = async (itemId, name, budgetAmount, actualAmount) => {
  const items = getStorage('special_budget_items') || [];
  const index = items.findIndex(i => i.id === itemId);
  
  if (index === -1) {
    return { success: false, error: '预算子项不存在' };
  }
  
  items[index] = {
    ...items[index],
    name,
    budgetAmount: fixAmount(budgetAmount),
    actualAmount: fixAmount(actualAmount),
    updatedAt: new Date().toISOString()
  };
  
  setStorage('special_budget_items', items);
  return { success: true, data: items[index] };
};

export const deleteSpecialBudgetItem = async (itemId) => {
  const items = getStorage('special_budget_items') || [];
  const filtered = items.filter(i => i.id !== itemId);
  setStorage('special_budget_items', filtered);
  
  // 删除关联的 transactions
  const transactions = getStorage('special_budget_transactions') || [];
  const filteredTrans = transactions.filter(t => t.itemId !== itemId);
  setStorage('special_budget_transactions', filteredTrans);
  
  return { success: true };
};

// ==================== 专项预算消费记录 ====================

export const getSpecialBudgetTransactions = async (itemId) => {
  const transactions = getStorage('special_budget_transactions') || [];
  const filtered = transactions
    .filter(t => t.itemId === itemId)
    .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
  
  return {
    success: true,
    data: filtered.map(t => ({
      id: t.id,
      itemId: t.itemId,
      amount: fixAmount(t.amount || 0),
      description: t.description || '',
      date: t.date || '',
      createdAt: t.createdAt
    }))
  };
};

export const createSpecialBudgetTransaction = async (itemId, amount, description, date) => {
  const transactions = getStorage('special_budget_transactions') || [];
  const now = new Date().toISOString();
  
  const transaction = {
    id: generateId(),
    itemId,
    amount: fixAmount(amount),
    description: description || '',
    date: date || '',
    createdAt: now
  };
  
  transactions.unshift(transaction);
  setStorage('special_budget_transactions', transactions);
  
  return { success: true, data: transaction };
};

export const updateSpecialBudgetTransaction = async (transactionId, amount, description, date) => {
  const transactions = getStorage('special_budget_transactions') || [];
  const index = transactions.findIndex(t => t.id === transactionId);
  
  if (index === -1) {
    return { success: false, error: '消费记录不存在' };
  }
  
  transactions[index] = {
    ...transactions[index],
    amount: fixAmount(amount),
    description: description || '',
    date: date || '',
    updatedAt: new Date().toISOString()
  };
  
  setStorage('special_budget_transactions', transactions);
  return { success: true, data: transactions[index] };
};

export const deleteSpecialBudgetTransaction = async (transactionId) => {
  const transactions = getStorage('special_budget_transactions') || [];
  const filtered = transactions.filter(t => t.id !== transactionId);
  setStorage('special_budget_transactions', filtered);
  return { success: true };
};

export const getSpecialBudgetItemActualAmount = async (itemId) => {
  const result = await getSpecialBudgetTransactions(itemId);
  if (result.success) {
    const total = result.data.reduce((sum, t) => sum + (t.amount || 0), 0);
    return { success: true, amount: fixAmount(total) };
  }
  return { success: true, amount: 0 };
};

// ===== Keepalive 删除函数（兼容 api.js）=====

export const deleteTransactionWithKeepAlive = (id) => deleteTransaction(id);
export const deleteWishWithKeepAlive = (id) => deleteWish(id);
export const deleteFixedExpenseWithKeepAlive = (id) => deleteFixedExpense(id);
export const deleteSpecialBudgetWithKeepAlive = (id) => deleteSpecialBudget(id);
export const deleteSpecialBudgetItemWithKeepAlive = (id) => deleteSpecialBudgetItem(id);
export const deleteSpecialBudgetTransactionWithKeepAlive = (id) => deleteSpecialBudgetTransaction(id);