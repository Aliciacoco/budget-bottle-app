// api.js - 腾讯云开发版本
// ✅ 新增数据：不手动添加 userId，让 CloudBase 自动注入 _openid
// ✅ 查询数据：兼容旧数据的 userId 字段
// ✅ 修复：getWishes 时自动转换图片 fileID 为临时URL

import app from './cloudbase';
import { db, _ } from './cloudbase';
import { getUserPrefix } from './auth';

// ==================== 工具函数 ====================

const fixAmount = (amount) => Math.round(amount * 100) / 100;

// 获取当前用户ID（仅用于查询兼容旧数据）
const getCurrentUserId = () => getUserPrefix();

// ✅ 查询时兼容：同时匹配 _openid 和旧的 userId
const getUserCondition = () => {
  const uid = getCurrentUserId();
  return _.or([{ _openid: uid }, { userId: uid }]);
};

// 复合查询条件（用户条件 + 其他条件）
const withUserCondition = (otherConditions) => {
  return _.and([getUserCondition(), otherConditions]);
};

// ✅ 将 fileID (cloud://) 转换为临时访问URL
const convertFileIdsToUrls = async (fileIds) => {
  if (!fileIds || fileIds.length === 0) return {};
  
  try {
    const result = await app.getTempFileURL({
      fileList: fileIds
    });
    
    const urlMap = {};
    if (result.fileList) {
      result.fileList.forEach(item => {
        if (item.fileID && item.tempFileURL) {
          urlMap[item.fileID] = item.tempFileURL;
        }
      });
    }
    return urlMap;
  } catch (error) {
    console.error('转换文件URL失败:', error);
    return {};
  }
};

// ==================== 防重复提交锁 ====================
const pendingOperations = new Map();

const withLock = async (key, operation) => {
  if (pendingOperations.has(key)) return pendingOperations.get(key);
  const promise = operation().finally(() => pendingOperations.delete(key));
  pendingOperations.set(key, promise);
  return promise;
};

// ==================== 周预算 ====================

export const getWeeklyBudget = async (weekKey) => {
  try {
    const { data } = await db.collection('WeeklyBudget')
      .where(withUserCondition({ weekKey }))
      .limit(1).get();
    
    if (data.length > 0) {
      const budget = data[0];
      return {
        success: true,
        data: {
          id: budget._id,
          weekKey: budget.weekKey,
          amount: fixAmount(budget.amount),
          settled: budget.settled || false,
          createdAt: budget.createdAt
        }
      };
    }
    return { success: true, data: null };
  } catch (error) {
    console.error('加载周预算失败:', error);
    return { success: false, error: error.message };
  }
};

export const saveWeeklyBudget = async (weekKey, amount) => {
  return withLock(`saveWeeklyBudget:${weekKey}`, async () => {
    try {
      const fixedAmount = fixAmount(amount);
      const { data: existing } = await db.collection('WeeklyBudget')
        .where(withUserCondition({ weekKey }))
        .limit(1).get();
      
      if (existing.length > 0) {
        await db.collection('WeeklyBudget').doc(existing[0]._id)
          .update({ amount: fixedAmount, updatedAt: db.serverDate() });
        return { success: true, data: { id: existing[0]._id, weekKey, amount: fixedAmount, settled: existing[0].settled || false } };
      } else {
        // ✅ 不手动添加 userId，CloudBase 会自动注入 _openid
        const { id } = await db.collection('WeeklyBudget').add({
          weekKey, amount: fixedAmount, settled: false, createdAt: db.serverDate()
        });
        return { success: true, data: { id, weekKey, amount: fixedAmount, settled: false } };
      }
    } catch (error) {
      console.error('保存周预算失败:', error);
      return { success: false, error: error.message };
    }
  });
};

export const markWeeklyBudgetSettled = async (weekKey) => {
  return withLock(`markSettled:${weekKey}`, async () => {
    try {
      const { data } = await db.collection('WeeklyBudget')
        .where(withUserCondition({ weekKey }))
        .limit(1).get();
      
      if (data.length > 0) {
        await db.collection('WeeklyBudget').doc(data[0]._id)
          .update({ settled: true, updatedAt: db.serverDate() });
        return { success: true };
      }
      return { success: false, error: '未找到该周预算' };
    } catch (error) {
      console.error('标记结算失败:', error);
      return { success: false, error: error.message };
    }
  });
};

// ==================== 交易记录 ====================

export const getTransactions = async (weekKey) => {
  try {
    const { data } = await db.collection('Transaction')
      .where(withUserCondition({ weekKey }))
      .orderBy('createdAt', 'desc').get();
    
    return {
      success: true,
      data: data.map(t => ({
        id: t._id, weekKey: t.weekKey, date: t.date, time: t.time,
        amount: fixAmount(t.amount), description: t.description || '', createdAt: t.createdAt
      }))
    };
  } catch (error) {
    console.error('加载交易记录失败:', error);
    return { success: false, error: error.message };
  }
};

export const createTransaction = async (weekKey, date, time, amount, description) => {
  try {
    // ✅ 不手动添加 userId
    const { id } = await db.collection('Transaction').add({
      weekKey, date, time, amount: fixAmount(amount), description, createdAt: db.serverDate()
    });
    return { success: true, data: { id, weekKey, date, time, amount: fixAmount(amount), description } };
  } catch (error) {
    console.error('创建交易记录失败:', error);
    return { success: false, error: error.message };
  }
};

export const updateTransaction = async (transactionId, weekKey, amount, description, date = null) => {
  try {
    const updateData = { amount: fixAmount(amount), description, updatedAt: db.serverDate() };
    if (date) updateData.date = date;
    await db.collection('Transaction').doc(transactionId).update(updateData);
    
    const { data } = await db.collection('Transaction').doc(transactionId).get();
    const t = Array.isArray(data) ? data[0] : data;
    return { success: true, data: { id: t._id, weekKey: t.weekKey, date: t.date, time: t.time, amount: fixAmount(t.amount), description: t.description } };
  } catch (error) {
    console.error('更新交易记录失败:', error);
    return { success: false, error: error.message };
  }
};

export const deleteTransaction = async (transactionId) => {
  try {
    await db.collection('Transaction').doc(transactionId).remove();
    return { success: true };
  } catch (error) {
    console.error('删除交易记录失败:', error);
    return { success: false, error: error.message };
  }
};

// ==================== 固定支出 ====================

export const getFixedExpenses = async () => {
  try {
    const { data } = await db.collection('FixedExpense')
      .where(getUserCondition())
      .orderBy('createdAt', 'asc').get();
    
    return {
      success: true,
      data: data.map(e => ({
        id: e._id, name: e.name, amount: fixAmount(e.amount),
        expireDate: e.expireDate || '', enabled: e.enabled !== false, createdAt: e.createdAt
      }))
    };
  } catch (error) {
    console.error('加载固定支出失败:', error);
    return { success: false, error: error.message };
  }
};

export const createFixedExpense = async (name, amount, expireDate, enabled = true) => {
  try {
    // ✅ 不手动添加 userId
    const { id } = await db.collection('FixedExpense').add({
      name, amount: fixAmount(amount), expireDate, enabled, createdAt: db.serverDate()
    });
    return { success: true, data: { id, name, amount: fixAmount(amount), expireDate, enabled } };
  } catch (error) {
    console.error('创建固定支出失败:', error);
    return { success: false, error: error.message };
  }
};

export const updateFixedExpense = async (expenseId, name, amount, expireDate, enabled) => {
  try {
    await db.collection('FixedExpense').doc(expenseId).update({
      name, amount: fixAmount(amount), expireDate, enabled, updatedAt: db.serverDate()
    });
    return { success: true, data: { id: expenseId, name, amount: fixAmount(amount), expireDate, enabled } };
  } catch (error) {
    console.error('更新固定支出失败:', error);
    return { success: false, error: error.message };
  }
};

export const deleteFixedExpense = async (expenseId) => {
  try {
    await db.collection('FixedExpense').doc(expenseId).remove();
    return { success: true };
  } catch (error) {
    console.error('删除固定支出失败:', error);
    return { success: false, error: error.message };
  }
};

// ==================== 心愿池历史 ====================

export const getWishPoolHistory = async () => {
  try {
    const { data } = await db.collection('WishPoolHistory')
      .where(getUserCondition())
      .orderBy('settledAt', 'desc').limit(100).get();
    
    return {
      success: true,
      data: data.map(h => ({
        id: h._id, weekKey: h.weekKey,
        budgetAmount: fixAmount(h.budgetAmount || 0),
        spentAmount: fixAmount(h.spentAmount || 0),
        savedAmount: fixAmount(h.savedAmount || 0),
        isDeduction: h.isDeduction === true,
        wishName: h.wishName || '', wishId: h.wishId || '',
        settledAt: h.settledAt, createdAt: h.createdAt
      }))
    };
  } catch (error) {
    console.error('加载积攒历史失败:', error);
    return { success: false, error: error.message };
  }
};

// ==================== 心愿池 ====================

export const getWishPool = async () => {
  try {
    const historyResult = await getWishPoolHistory();
    if (!historyResult.success) return { success: true, data: { amount: 0 } };
    const total = historyResult.data.reduce((sum, h) => sum + (h.savedAmount || 0), 0);
    return { success: true, data: { amount: fixAmount(total) } };
  } catch (error) {
    console.error('计算心愿池余额失败:', error);
    return { success: false, error: error.message };
  }
};

export const updateWishPool = async (amount) => ({ success: true, data: { amount: fixAmount(amount) } });
export const addToWishPool = async (addAmount) => ({ success: true, data: { amount: fixAmount(addAmount) } });

export const checkWeekSettled = async (weekKey) => {
  try {
    const { data } = await db.collection('WishPoolHistory')
      .where(withUserCondition({ weekKey, isDeduction: _.neq(true) }))
      .limit(1).get();
    return { success: true, settled: data.length > 0 };
  } catch (error) {
    console.error('检查结算状态失败:', error);
    return { success: false, error: error.message };
  }
};

export const createWishPoolHistory = async (weekKey, budgetAmount, spentAmount, savedAmount, isDeduction = false, wishName = '', wishId = '') => {
  return withLock(`createHistory:${getCurrentUserId()}:${weekKey}`, async () => {
    try {
      if (!isDeduction) {
        const { data: existing } = await db.collection('WishPoolHistory')
          .where(withUserCondition({ weekKey, isDeduction: _.neq(true) }))
          .limit(1).get();
        if (existing.length > 0) {
          return { success: true, isNew: false, data: { id: existing[0]._id, weekKey: existing[0].weekKey, savedAmount: fixAmount(existing[0].savedAmount) } };
        }
      }
      // ✅ 不手动添加 userId
      const { id } = await db.collection('WishPoolHistory').add({
        weekKey, budgetAmount: fixAmount(budgetAmount), spentAmount: fixAmount(spentAmount), savedAmount: fixAmount(savedAmount),
        isDeduction, wishName, wishId, settledAt: db.serverDate(), createdAt: db.serverDate()
      });
      return { success: true, isNew: true, data: { id, weekKey, savedAmount: fixAmount(savedAmount) } };
    } catch (error) {
      console.error('创建积攒历史失败:', error);
      return { success: false, error: error.message };
    }
  });
};

export const deleteWishPoolHistory = async (historyId) => {
  try {
    await db.collection('WishPoolHistory').doc(historyId).remove();
    return { success: true };
  } catch (error) {
    console.error('删除心愿池历史失败:', error);
    return { success: false, error: error.message };
  }
};

// ==================== 愿望清单 ====================

export const getWishes = async () => {
  try {
    const { data } = await db.collection('Wish')
      .where(getUserCondition())
      .orderBy('createdAt', 'asc').get();
    
    // ✅ 收集所有需要转换的 fileID (cloud:// 格式)
    const fileIds = data
      .filter(w => w.image && w.image.startsWith('cloud://'))
      .map(w => w.image);
    
    // ✅ 批量转换 fileID 为临时URL
    const urlMap = await convertFileIdsToUrls(fileIds);
    
    return {
      success: true,
      data: data.map(w => {
        let imageUrl = w.image || null;
        
        // 如果是 cloud:// 格式，转换为临时URL
        if (imageUrl && imageUrl.startsWith('cloud://')) {
          imageUrl = urlMap[imageUrl] || imageUrl;
        }
        
        return {
          id: w._id, 
          description: w.description, 
          amount: fixAmount(w.amount),
          image: imageUrl,  // ✅ 返回可访问的URL
          icon: w.icon || 'star', 
          fulfilled: w.fulfilled || false, 
          createdAt: w.createdAt
        };
      })
    };
  } catch (error) {
    console.error('加载愿望清单失败:', error);
    return { success: false, error: error.message };
  }
};

export const createWish = async (description, amount, image, fulfilled = false, icon = 'star') => {
  try {
    // ✅ 不手动添加 userId
    const wishData = { description, amount: fixAmount(amount), fulfilled, icon: icon || 'star', createdAt: db.serverDate() };
    if (image) wishData.image = image;  // 保存 fileID
    const { id } = await db.collection('Wish').add(wishData);
    
    // 如果有图片，转换URL返回
    let imageUrl = image;
    if (image && image.startsWith('cloud://')) {
      const urlMap = await convertFileIdsToUrls([image]);
      imageUrl = urlMap[image] || image;
    }
    
    return { success: true, data: { id, description, amount: fixAmount(amount), image: imageUrl, icon: icon || 'star', fulfilled } };
  } catch (error) {
    console.error('创建愿望失败:', error);
    return { success: false, error: error.message };
  }
};

export const updateWish = async (wishId, description, amount, image, fulfilled = false, icon = 'star') => {
  try {
    const updateData = { description, amount: fixAmount(amount), fulfilled, icon: icon || 'star', updatedAt: db.serverDate() };
    updateData.image = image ? image : _.remove();  // 保存 fileID 或删除
    await db.collection('Wish').doc(wishId).update(updateData);
    
    // 如果有图片，转换URL返回
    let imageUrl = image;
    if (image && image.startsWith('cloud://')) {
      const urlMap = await convertFileIdsToUrls([image]);
      imageUrl = urlMap[image] || image;
    }
    
    return { success: true, data: { id: wishId, description, amount: fixAmount(amount), image: imageUrl, icon: icon || 'star', fulfilled } };
  } catch (error) {
    console.error('更新愿望失败:', error);
    return { success: false, error: error.message };
  }
};

export const deleteWish = async (wishId) => {
  try {
    await db.collection('Wish').doc(wishId).remove();
    return { success: true };
  } catch (error) {
    console.error('删除愿望失败:', error);
    return { success: false, error: error.message };
  }
};

// ==================== 专项预算 ====================

export const getSpecialBudgets = async () => {
  try {
    const { data } = await db.collection('SpecialBudget')
      .where(getUserCondition())
      .orderBy('createdAt', 'desc').get();
    
    return {
      success: true,
      data: data.map(b => ({
        id: b._id, name: b.name, icon: b.icon || 'travel', totalBudget: fixAmount(b.totalBudget || 0),
        startDate: b.startDate || '', endDate: b.endDate || '', pinnedToHome: b.pinnedToHome || false,
        iconOffsetX: b.iconOffsetX || 0, iconOffsetY: b.iconOffsetY || 0, iconScale: b.iconScale || 1, createdAt: b.createdAt
      }))
    };
  } catch (error) {
    console.error('加载专项预算失败:', error);
    return { success: false, error: error.message };
  }
};

export const createSpecialBudget = async (name, icon, totalBudget, startDate, endDate, pinnedToHome = false) => {
  try {
    // ✅ 不手动添加 userId
    const { id } = await db.collection('SpecialBudget').add({
      name, icon, totalBudget: fixAmount(totalBudget), startDate, endDate, pinnedToHome,
      iconOffsetX: 0, iconOffsetY: 0, iconScale: 1, createdAt: db.serverDate()
    });
    return { success: true, data: { id, name, icon, totalBudget: fixAmount(totalBudget), startDate, endDate, pinnedToHome, iconOffsetX: 0, iconOffsetY: 0, iconScale: 1 } };
  } catch (error) {
    console.error('创建专项预算失败:', error);
    return { success: false, error: error.message };
  }
};

export const updateSpecialBudget = async (budgetId, name, icon, totalBudget, startDate, endDate, pinnedToHome) => {
  try {
    await db.collection('SpecialBudget').doc(budgetId).update({
      name, icon, totalBudget: fixAmount(totalBudget), startDate, endDate, pinnedToHome, updatedAt: db.serverDate()
    });
    const { data } = await db.collection('SpecialBudget').doc(budgetId).get();
    const b = Array.isArray(data) ? data[0] : data;
    return { success: true, data: { id: b._id, name: b.name, icon: b.icon, totalBudget: fixAmount(b.totalBudget), startDate: b.startDate, endDate: b.endDate, pinnedToHome: b.pinnedToHome, iconOffsetX: b.iconOffsetX || 0, iconOffsetY: b.iconOffsetY || 0, iconScale: b.iconScale || 1 } };
  } catch (error) {
    console.error('更新专项预算失败:', error);
    return { success: false, error: error.message };
  }
};

export const updateSpecialBudgetIconPosition = async (budgetId, offsetX, offsetY, scale) => {
  try {
    await db.collection('SpecialBudget').doc(budgetId).update({ iconOffsetX: offsetX, iconOffsetY: offsetY, iconScale: scale, updatedAt: db.serverDate() });
    return { success: true, data: { id: budgetId, iconOffsetX: offsetX, iconOffsetY: offsetY, iconScale: scale } };
  } catch (error) {
    console.error('更新图标位置失败:', error);
    return { success: false, error: error.message };
  }
};

export const deleteSpecialBudget = async (budgetId) => {
  try {
    const { data: items } = await db.collection('SpecialBudgetItem')
      .where(withUserCondition({ budgetId })).get();
    for (const item of items) {
      const { data: trans } = await db.collection('SpecialBudgetTransaction').where({ itemId: item._id }).get();
      for (const t of trans) await db.collection('SpecialBudgetTransaction').doc(t._id).remove();
      await db.collection('SpecialBudgetItem').doc(item._id).remove();
    }
    await db.collection('SpecialBudget').doc(budgetId).remove();
    return { success: true };
  } catch (error) {
    console.error('删除专项预算失败:', error);
    return { success: false, error: error.message };
  }
};

// ==================== 专项预算子项 ====================

export const getSpecialBudgetItems = async (budgetId) => {
  try {
    const { data } = await db.collection('SpecialBudgetItem')
      .where(withUserCondition({ budgetId }))
      .orderBy('createdAt', 'asc').get();
    return { success: true, data: data.map(i => ({ id: i._id, budgetId: i.budgetId, name: i.name, budgetAmount: fixAmount(i.budgetAmount || 0), actualAmount: fixAmount(i.actualAmount || 0), createdAt: i.createdAt })) };
  } catch (error) {
    console.error('加载专项预算子项失败:', error);
    return { success: false, error: error.message };
  }
};

export const createSpecialBudgetItem = async (budgetId, name, budgetAmount, actualAmount = 0) => {
  try {
    // ✅ 不手动添加 userId
    const { id } = await db.collection('SpecialBudgetItem').add({ 
      budgetId, name, budgetAmount: fixAmount(budgetAmount), actualAmount: fixAmount(actualAmount), createdAt: db.serverDate() 
    });
    return { success: true, data: { id, budgetId, name, budgetAmount: fixAmount(budgetAmount), actualAmount: fixAmount(actualAmount) } };
  } catch (error) {
    console.error('创建专项预算子项失败:', error);
    return { success: false, error: error.message };
  }
};

export const updateSpecialBudgetItem = async (itemId, name, budgetAmount, actualAmount) => {
  try {
    await db.collection('SpecialBudgetItem').doc(itemId).update({ name, budgetAmount: fixAmount(budgetAmount), actualAmount: fixAmount(actualAmount), updatedAt: db.serverDate() });
    const { data } = await db.collection('SpecialBudgetItem').doc(itemId).get();
    const i = Array.isArray(data) ? data[0] : data;
    return { success: true, data: { id: i._id, budgetId: i.budgetId, name: i.name, budgetAmount: fixAmount(i.budgetAmount), actualAmount: fixAmount(i.actualAmount) } };
  } catch (error) {
    console.error('更新专项预算子项失败:', error);
    return { success: false, error: error.message };
  }
};

export const deleteSpecialBudgetItem = async (itemId) => {
  try {
    const { data: trans } = await db.collection('SpecialBudgetTransaction')
      .where(withUserCondition({ itemId })).get();
    for (const t of trans) await db.collection('SpecialBudgetTransaction').doc(t._id).remove();
    await db.collection('SpecialBudgetItem').doc(itemId).remove();
    return { success: true };
  } catch (error) {
    console.error('删除专项预算子项失败:', error);
    return { success: false, error: error.message };
  }
};

// ==================== 专项预算消费记录 ====================

export const getSpecialBudgetTransactions = async (itemId) => {
  try {
    const { data } = await db.collection('SpecialBudgetTransaction')
      .where(withUserCondition({ itemId }))
      .orderBy('date', 'desc').orderBy('createdAt', 'desc').get();
    return { success: true, data: data.map(t => ({ id: t._id, itemId: t.itemId, amount: fixAmount(t.amount || 0), description: t.description || '', date: t.date || '', createdAt: t.createdAt })) };
  } catch (error) {
    console.error('加载消费记录失败:', error);
    return { success: false, error: error.message };
  }
};

export const createSpecialBudgetTransaction = async (itemId, amount, description, date) => {
  try {
    // ✅ 不手动添加 userId
    const { id } = await db.collection('SpecialBudgetTransaction').add({ 
      itemId, amount: fixAmount(amount), description: description || '', date, createdAt: db.serverDate() 
    });
    return { success: true, data: { id, itemId, amount: fixAmount(amount), description, date } };
  } catch (error) {
    console.error('创建消费记录失败:', error);
    return { success: false, error: error.message };
  }
};

export const updateSpecialBudgetTransaction = async (transactionId, amount, description, date) => {
  try {
    await db.collection('SpecialBudgetTransaction').doc(transactionId).update({ amount: fixAmount(amount), description: description || '', date, updatedAt: db.serverDate() });
    const { data } = await db.collection('SpecialBudgetTransaction').doc(transactionId).get();
    const t = Array.isArray(data) ? data[0] : data;
    return { success: true, data: { id: t._id, itemId: t.itemId, amount: fixAmount(t.amount), description: t.description, date: t.date } };
  } catch (error) {
    console.error('更新消费记录失败:', error);
    return { success: false, error: error.message };
  }
};

export const deleteSpecialBudgetTransaction = async (transactionId) => {
  try {
    await db.collection('SpecialBudgetTransaction').doc(transactionId).remove();
    return { success: true };
  } catch (error) {
    console.error('删除消费记录失败:', error);
    return { success: false, error: error.message };
  }
};

export const getSpecialBudgetItemActualAmount = async (itemId) => {
  try {
    const result = await getSpecialBudgetTransactions(itemId);
    if (result.success) {
      const total = result.data.reduce((sum, t) => sum + (t.amount || 0), 0);
      return { success: true, amount: fixAmount(total) };
    }
    return { success: true, amount: 0 };
  } catch (error) {
    console.error('计算实际金额失败:', error);
    return { success: false, error: error.message };
  }
};

// ===== Keepalive 删除函数 =====

export const deleteTransactionWithKeepAlive = (id) => deleteTransaction(id).catch(err => console.warn('删除失败:', err));
export const deleteWishWithKeepAlive = (id) => deleteWish(id).catch(err => console.warn('删除失败:', err));
export const deleteFixedExpenseWithKeepAlive = (id) => deleteFixedExpense(id).catch(err => console.warn('删除失败:', err));
export const deleteSpecialBudgetWithKeepAlive = (id) => deleteSpecialBudget(id).catch(err => console.warn('删除失败:', err));
export const deleteSpecialBudgetItemWithKeepAlive = (id) => deleteSpecialBudgetItem(id).catch(err => console.warn('删除失败:', err));
export const deleteSpecialBudgetTransactionWithKeepAlive = (id) => deleteSpecialBudgetTransaction(id).catch(err => console.warn('删除失败:', err));