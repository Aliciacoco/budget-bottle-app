import AV from './leancloud';

// ==================== 工具函数 ====================

const setPublicACL = (obj) => {
  const acl = new AV.ACL();
  acl.setPublicReadAccess(true);
  acl.setPublicWriteAccess(true);
  obj.setACL(acl);
  return obj;
};

// 金额精度处理 - 保留2位小数
const fixAmount = (amount) => {
  return Math.round(amount * 100) / 100;
};

// 静默日志（生产环境关闭）
const DEBUG = false;
const log = (...args) => DEBUG && console.log(...args);

// ==================== 防重复提交锁 ====================
const pendingOperations = new Map();

const withLock = async (key, operation) => {
  if (pendingOperations.has(key)) {
    return pendingOperations.get(key);
  }
  
  const promise = operation().finally(() => {
    pendingOperations.delete(key);
  });
  
  pendingOperations.set(key, promise);
  return promise;
};

// ==================== 周预算相关 API ====================

export const getWeeklyBudget = async (weekKey) => {
  try {
    const query = new AV.Query('WeeklyBudget');
    query.equalTo('weekKey', weekKey);
    const budget = await query.first();
    
    if (budget) {
      log('✅ 加载周预算:', weekKey);
      return {
        success: true,
        data: {
          id: budget.id,
          weekKey: budget.get('weekKey'),
          amount: fixAmount(budget.get('amount')),
          settled: budget.get('settled') || false,
          createdAt: budget.get('createdAt')
        }
      };
    }
    
    return { success: true, data: null };
  } catch (error) {
    if (error.code === 101) {
      return { success: true, data: null };
    }
    console.error('加载周预算失败:', error);
    return { success: false, error: error.message };
  }
};

export const saveWeeklyBudget = async (weekKey, amount) => {
  return withLock(`saveWeeklyBudget:${weekKey}`, async () => {
    try {
      let budget = null;
      
      try {
        const query = new AV.Query('WeeklyBudget');
        query.equalTo('weekKey', weekKey);
        budget = await query.first();
      } catch (queryError) {
        if (queryError.code !== 101) throw queryError;
      }
      
      const fixedAmount = fixAmount(amount);
      
      if (budget) {
        budget.set('amount', fixedAmount);
        setPublicACL(budget);
      } else {
        const WeeklyBudget = AV.Object.extend('WeeklyBudget');
        budget = new WeeklyBudget();
        budget.set('weekKey', weekKey);
        budget.set('amount', fixedAmount);
        budget.set('settled', false);
        setPublicACL(budget);
      }
      
      await budget.save(null, { fetchWhenSave: true });
      
      log('✅ 保存周预算:', weekKey, fixedAmount);
      return {
        success: true,
        data: {
          id: budget.id,
          weekKey: budget.get('weekKey'),
          amount: fixAmount(budget.get('amount')),
          settled: budget.get('settled') || false
        }
      };
    } catch (error) {
      console.error('保存周预算失败:', error);
      return { success: false, error: error.message };
    }
  });
};

export const markWeeklyBudgetSettled = async (weekKey) => {
  return withLock(`markSettled:${weekKey}`, async () => {
    try {
      const query = new AV.Query('WeeklyBudget');
      query.equalTo('weekKey', weekKey);
      const budget = await query.first();
      
      if (budget) {
        budget.set('settled', true);
        await budget.save();
        return { success: true };
      }
      
      return { success: false, error: '未找到该周预算' };
    } catch (error) {
      console.error('标记结算失败:', error);
      return { success: false, error: error.message };
    }
  });
};

// ==================== 交易记录相关 API ====================

export const getTransactions = async (weekKey) => {
  try {
    const query = new AV.Query('Transaction');
    query.equalTo('weekKey', weekKey);
    query.descending('createdAt');
    
    const transactions = await query.find();
    
    const transactionData = transactions.map(trans => ({
      id: trans.id,
      weekKey: trans.get('weekKey'),
      date: trans.get('date'),
      time: trans.get('time'),
      amount: fixAmount(trans.get('amount')),
      description: trans.get('description') || '',
      createdAt: trans.get('createdAt')
    }));
    
    log('✅ 加载交易记录:', transactionData.length, '条');
    return { success: true, data: transactionData };
  } catch (error) {
    if (error.code === 101) {
      return { success: true, data: [] };
    }
    console.error('加载交易记录失败:', error);
    return { success: false, error: error.message };
  }
};

export const createTransaction = async (weekKey, date, time, amount, description) => {
  try {
    const Transaction = AV.Object.extend('Transaction');
    const transaction = new Transaction();
    
    const fixedAmount = fixAmount(amount);
    
    transaction.set('weekKey', weekKey);
    transaction.set('date', date);
    transaction.set('time', time);
    transaction.set('amount', fixedAmount);
    transaction.set('description', description);
    setPublicACL(transaction);
    
    await transaction.save();
    
    log('✅ 创建交易记录:', fixedAmount);
    return {
      success: true,
      data: {
        id: transaction.id,
        weekKey: transaction.get('weekKey'),
        date: transaction.get('date'),
        time: transaction.get('time'),
        amount: fixAmount(transaction.get('amount')),
        description: transaction.get('description')
      }
    };
  } catch (error) {
    console.error('创建交易记录失败:', error);
    return { success: false, error: error.message };
  }
};

export const updateTransaction = async (transactionId, weekKey, amount, description, date = null) => {
  try {
    const query = new AV.Query('Transaction');
    const transaction = await query.get(transactionId);
    
    const fixedAmount = fixAmount(amount);
    
    transaction.set('amount', fixedAmount);
    transaction.set('description', description);
    if (date) transaction.set('date', date);
    
    await transaction.save();
    
    return {
      success: true,
      data: {
        id: transaction.id,
        weekKey: transaction.get('weekKey'),
        date: transaction.get('date'),
        time: transaction.get('time'),
        amount: fixAmount(transaction.get('amount')),
        description: transaction.get('description')
      }
    };
  } catch (error) {
    console.error('更新交易记录失败:', error);
    return { success: false, error: error.message };
  }
};

export const deleteTransaction = async (transactionId) => {
  try {
    const query = new AV.Query('Transaction');
    const transaction = await query.get(transactionId);
    await transaction.destroy();
    return { success: true };
  } catch (error) {
    console.error('删除交易记录失败:', error);
    return { success: false, error: error.message };
  }
};

// ==================== 固定支出相关 API ====================

export const getFixedExpenses = async () => {
  try {
    const query = new AV.Query('FixedExpense');
    query.ascending('createdAt');
    const expenses = await query.find();
    
    const expenseData = expenses.map(expense => ({
      id: expense.id,
      name: expense.get('name'),
      amount: fixAmount(expense.get('amount')),
      expireDate: expense.get('expireDate') || '',
      enabled: expense.get('enabled') !== false,
      createdAt: expense.get('createdAt')
    }));
    
    log('✅ 加载固定支出:', expenseData.length, '条');
    return { success: true, data: expenseData };
  } catch (error) {
    if (error.code === 101) {
      return { success: true, data: [] };
    }
    console.error('加载固定支出失败:', error);
    return { success: false, error: error.message };
  }
};

export const createFixedExpense = async (name, amount, expireDate, enabled = true) => {
  try {
    const FixedExpense = AV.Object.extend('FixedExpense');
    const expense = new FixedExpense();
    
    expense.set('name', name);
    expense.set('amount', fixAmount(amount));
    expense.set('expireDate', expireDate);
    expense.set('enabled', enabled);
    setPublicACL(expense);
    
    await expense.save();
    
    return {
      success: true,
      data: {
        id: expense.id,
        name: expense.get('name'),
        amount: fixAmount(expense.get('amount')),
        expireDate: expense.get('expireDate'),
        enabled: expense.get('enabled')
      }
    };
  } catch (error) {
    console.error('创建固定支出失败:', error);
    return { success: false, error: error.message };
  }
};

export const updateFixedExpense = async (expenseId, name, amount, expireDate, enabled) => {
  try {
    const query = new AV.Query('FixedExpense');
    const expense = await query.get(expenseId);
    
    expense.set('name', name);
    expense.set('amount', fixAmount(amount));
    expense.set('expireDate', expireDate);
    expense.set('enabled', enabled);
    
    await expense.save();
    
    return {
      success: true,
      data: {
        id: expense.id,
        name: expense.get('name'),
        amount: fixAmount(expense.get('amount')),
        expireDate: expense.get('expireDate'),
        enabled: expense.get('enabled')
      }
    };
  } catch (error) {
    console.error('更新固定支出失败:', error);
    return { success: false, error: error.message };
  }
};

export const deleteFixedExpense = async (expenseId) => {
  try {
    const query = new AV.Query('FixedExpense');
    const expense = await query.get(expenseId);
    await expense.destroy();
    return { success: true };
  } catch (error) {
    console.error('删除固定支出失败:', error);
    return { success: false, error: error.message };
  }
};

// ==================== 心愿池历史 API ====================

export const getWishPoolHistory = async () => {
  try {
    const query = new AV.Query('WishPoolHistory');
    query.descending('settledAt');
    query.limit(100);
    const histories = await query.find();
    
    const historyData = histories.map(h => ({
      id: h.id,
      weekKey: h.get('weekKey'),
      budgetAmount: fixAmount(h.get('budgetAmount') || 0),
      spentAmount: fixAmount(h.get('spentAmount') || 0),
      savedAmount: fixAmount(h.get('savedAmount') || 0),
      isDeduction: h.get('isDeduction') === true,
      wishName: h.get('wishName') || '',
      wishId: h.get('wishId') || '',
      settledAt: h.get('settledAt'),
      createdAt: h.get('createdAt')
    }));
    
    log('✅ 加载积攒历史:', historyData.length, '条');
    return { success: true, data: historyData };
  } catch (error) {
    if (error.code === 101) {
      return { success: true, data: [] };
    }
    console.error('加载积攒历史失败:', error);
    return { success: false, error: error.message };
  }
};

// ==================== 心愿池相关 API ====================

export const getWishPool = async () => {
  try {
    const historyResult = await getWishPoolHistory();
    if (!historyResult.success) {
      return { success: true, data: { amount: 0 } };
    }
    
    const totalAmount = historyResult.data.reduce((sum, h) => sum + (h.savedAmount || 0), 0);
    const fixedTotal = fixAmount(totalAmount);
    
    log('✅ 心愿池余额:', fixedTotal);
    return { success: true, data: { amount: fixedTotal } };
  } catch (error) {
    console.error('计算心愿池余额失败:', error);
    return { success: false, error: error.message };
  }
};

export const updateWishPool = async (amount) => {
  return { success: true, data: { amount: fixAmount(amount) } };
};

export const addToWishPool = async (addAmount) => {
  return { success: true, data: { amount: fixAmount(addAmount) } };
};

export const checkWeekSettled = async (weekKey) => {
  try {
    const query = new AV.Query('WishPoolHistory');
    query.equalTo('weekKey', weekKey);
    query.notEqualTo('isDeduction', true);
    const result = await query.first();
    
    return { success: true, settled: !!result };
  } catch (error) {
    if (error.code === 101) {
      return { success: true, settled: false };
    }
    console.error('检查结算状态失败:', error);
    return { success: false, error: error.message };
  }
};

export const createWishPoolHistory = async (weekKey, budgetAmount, spentAmount, savedAmount, isDeduction = false, wishName = '', wishId = '') => {
  return withLock(`createHistory:${weekKey}`, async () => {
    try {
      if (!isDeduction) {
        try {
          const checkQuery = new AV.Query('WishPoolHistory');
          checkQuery.equalTo('weekKey', weekKey);
          checkQuery.notEqualTo('isDeduction', true);
          const existing = await checkQuery.first();
          
          if (existing) {
            return {
              success: true,
              isNew: false,
              data: {
                id: existing.id,
                weekKey: existing.get('weekKey'),
                savedAmount: fixAmount(existing.get('savedAmount'))
              }
            };
          }
        } catch (queryError) {
          if (queryError.code !== 101) throw queryError;
        }
      }
      
      const WishPoolHistory = AV.Object.extend('WishPoolHistory');
      const history = new WishPoolHistory();
      
      history.set('weekKey', weekKey);
      history.set('budgetAmount', fixAmount(budgetAmount));
      history.set('spentAmount', fixAmount(spentAmount));
      history.set('savedAmount', fixAmount(savedAmount));
      history.set('isDeduction', isDeduction);
      history.set('wishName', wishName);
      history.set('wishId', wishId);
      history.set('settledAt', new Date());
      setPublicACL(history);
      
      await history.save();
      
      return {
        success: true,
        isNew: true,
        data: {
          id: history.id,
          weekKey: history.get('weekKey'),
          savedAmount: fixAmount(history.get('savedAmount'))
        }
      };
    } catch (error) {
      console.error('创建积攒历史失败:', error);
      return { success: false, error: error.message };
    }
  });
};

export const deleteWishPoolHistory = async (historyId) => {
  try {
    const query = new AV.Query('WishPoolHistory');
    const history = await query.get(historyId);
    await history.destroy();
    return { success: true };
  } catch (error) {
    console.error('删除心愿池历史失败:', error);
    return { success: false, error: error.message };
  }
};

// ==================== 愿望清单相关 API ====================

export const getWishes = async () => {
  try {
    const query = new AV.Query('Wish');
    query.ascending('createdAt');
    const wishes = await query.find();
    
    const wishData = wishes.map(wish => ({
      id: wish.id,
      description: wish.get('description'),
      amount: fixAmount(wish.get('amount')),
      image: wish.get('image') || null,
      icon: wish.get('icon') || 'star',
      fulfilled: wish.get('fulfilled') || false,
      createdAt: wish.get('createdAt')
    }));
    
    log('✅ 加载愿望清单:', wishData.length, '个');
    return { success: true, data: wishData };
  } catch (error) {
    if (error.code === 101) {
      return { success: true, data: [] };
    }
    console.error('加载愿望清单失败:', error);
    return { success: false, error: error.message };
  }
};

export const createWish = async (description, amount, image, fulfilled = false, icon = 'star') => {
  try {
    const Wish = AV.Object.extend('Wish');
    const wish = new Wish();
    
    wish.set('description', description);
    wish.set('amount', fixAmount(amount));
    wish.set('fulfilled', fulfilled);
    wish.set('icon', icon || 'star');
    if (image) wish.set('image', image);
    else wish.unset('image');
    setPublicACL(wish);
    
    await wish.save();
    
    return {
      success: true,
      data: {
        id: wish.id,
        description: wish.get('description'),
        amount: fixAmount(wish.get('amount')),
        image: wish.get('image') || null,
        icon: wish.get('icon') || 'star',
        fulfilled: wish.get('fulfilled')
      }
    };
  } catch (error) {
    console.error('创建愿望失败:', error);
    return { success: false, error: error.message };
  }
};

export const updateWish = async (wishId, description, amount, image, fulfilled = false, icon = 'star') => {
  try {
    const query = new AV.Query('Wish');
    const wish = await query.get(wishId);
    
    wish.set('description', description);
    wish.set('amount', fixAmount(amount));
    wish.set('fulfilled', fulfilled);
    wish.set('icon', icon || 'star');
    if (image) wish.set('image', image);
    else wish.unset('image');
    
    await wish.save();
    
    return {
      success: true,
      data: {
        id: wish.id,
        description: wish.get('description'),
        amount: fixAmount(wish.get('amount')),
        image: wish.get('image') || null,
        icon: wish.get('icon') || 'star',
        fulfilled: wish.get('fulfilled')
      }
    };
  } catch (error) {
    console.error('更新愿望失败:', error);
    return { success: false, error: error.message };
  }
};

export const deleteWish = async (wishId) => {
  try {
    const query = new AV.Query('Wish');
    const wish = await query.get(wishId);
    await wish.destroy();
    return { success: true };
  } catch (error) {
    console.error('删除愿望失败:', error);
    return { success: false, error: error.message };
  }
};

// ==================== 专项预算相关 API ====================

export const getSpecialBudgets = async () => {
  try {
    const query = new AV.Query('SpecialBudget');
    query.descending('createdAt');
    const budgets = await query.find();
    
    const budgetData = budgets.map(budget => ({
      id: budget.id,
      name: budget.get('name'),
      icon: budget.get('icon') || 'travel',
      totalBudget: fixAmount(budget.get('totalBudget') || 0),
      startDate: budget.get('startDate') || '',
      endDate: budget.get('endDate') || '',
      pinnedToHome: budget.get('pinnedToHome') || false,
      // 新增：图标位置和缩放（云端存储）
      iconOffsetX: budget.get('iconOffsetX') || 0,
      iconOffsetY: budget.get('iconOffsetY') || 0,
      iconScale: budget.get('iconScale') || 1,
      createdAt: budget.get('createdAt')
    }));
    
    log('✅ 加载专项预算:', budgetData.length, '个');
    return { success: true, data: budgetData };
  } catch (error) {
    if (error.code === 101) {
      return { success: true, data: [] };
    }
    console.error('加载专项预算失败:', error);
    return { success: false, error: error.message };
  }
};

export const createSpecialBudget = async (name, icon, totalBudget, startDate, endDate, pinnedToHome = false) => {
  try {
    const SpecialBudget = AV.Object.extend('SpecialBudget');
    const budget = new SpecialBudget();
    
    budget.set('name', name);
    budget.set('icon', icon);
    budget.set('totalBudget', fixAmount(totalBudget));
    budget.set('startDate', startDate);
    budget.set('endDate', endDate);
    budget.set('pinnedToHome', pinnedToHome);
    // 默认位置
    budget.set('iconOffsetX', 0);
    budget.set('iconOffsetY', 0);
    budget.set('iconScale', 1);
    setPublicACL(budget);
    
    await budget.save();
    
    return {
      success: true,
      data: {
        id: budget.id,
        name: budget.get('name'),
        icon: budget.get('icon'),
        totalBudget: fixAmount(budget.get('totalBudget')),
        startDate: budget.get('startDate'),
        endDate: budget.get('endDate'),
        pinnedToHome: budget.get('pinnedToHome'),
        iconOffsetX: budget.get('iconOffsetX') || 0,
        iconOffsetY: budget.get('iconOffsetY') || 0,
        iconScale: budget.get('iconScale') || 1
      }
    };
  } catch (error) {
    console.error('创建专项预算失败:', error);
    return { success: false, error: error.message };
  }
};

export const updateSpecialBudget = async (budgetId, name, icon, totalBudget, startDate, endDate, pinnedToHome) => {
  try {
    const query = new AV.Query('SpecialBudget');
    const budget = await query.get(budgetId);
    
    budget.set('name', name);
    budget.set('icon', icon);
    budget.set('totalBudget', fixAmount(totalBudget));
    budget.set('startDate', startDate);
    budget.set('endDate', endDate);
    budget.set('pinnedToHome', pinnedToHome);
    
    await budget.save();
    
    return {
      success: true,
      data: {
        id: budget.id,
        name: budget.get('name'),
        icon: budget.get('icon'),
        totalBudget: fixAmount(budget.get('totalBudget')),
        startDate: budget.get('startDate'),
        endDate: budget.get('endDate'),
        pinnedToHome: budget.get('pinnedToHome'),
        iconOffsetX: budget.get('iconOffsetX') || 0,
        iconOffsetY: budget.get('iconOffsetY') || 0,
        iconScale: budget.get('iconScale') || 1
      }
    };
  } catch (error) {
    console.error('更新专项预算失败:', error);
    return { success: false, error: error.message };
  }
};

// 新增：更新专项预算图标位置（云端同步）
export const updateSpecialBudgetIconPosition = async (budgetId, offsetX, offsetY, scale) => {
  try {
    const query = new AV.Query('SpecialBudget');
    const budget = await query.get(budgetId);
    
    budget.set('iconOffsetX', offsetX);
    budget.set('iconOffsetY', offsetY);
    budget.set('iconScale', scale);
    
    await budget.save();
    
    log('✅ 更新图标位置:', budgetId, offsetX, offsetY, scale);
    return {
      success: true,
      data: {
        id: budget.id,
        iconOffsetX: budget.get('iconOffsetX'),
        iconOffsetY: budget.get('iconOffsetY'),
        iconScale: budget.get('iconScale')
      }
    };
  } catch (error) {
    console.error('更新图标位置失败:', error);
    return { success: false, error: error.message };
  }
};

export const deleteSpecialBudget = async (budgetId) => {
  try {
    try {
      const itemQuery = new AV.Query('SpecialBudgetItem');
      itemQuery.equalTo('budgetId', budgetId);
      const items = await itemQuery.find();
      if (items.length > 0) await AV.Object.destroyAll(items);
    } catch (itemError) {
      if (itemError.code !== 101) throw itemError;
    }
    
    const query = new AV.Query('SpecialBudget');
    const budget = await query.get(budgetId);
    await budget.destroy();
    
    return { success: true };
  } catch (error) {
    console.error('删除专项预算失败:', error);
    return { success: false, error: error.message };
  }
};

// ==================== 专项预算子项 API ====================

export const getSpecialBudgetItems = async (budgetId) => {
  try {
    const query = new AV.Query('SpecialBudgetItem');
    query.equalTo('budgetId', budgetId);
    query.ascending('createdAt');
    const items = await query.find();
    
    const itemData = items.map(item => ({
      id: item.id,
      budgetId: item.get('budgetId'),
      name: item.get('name'),
      budgetAmount: fixAmount(item.get('budgetAmount') || 0),
      actualAmount: fixAmount(item.get('actualAmount') || 0),
      createdAt: item.get('createdAt')
    }));
    
    log('✅ 加载专项预算子项:', itemData.length, '个');
    return { success: true, data: itemData };
  } catch (error) {
    if (error.code === 101) {
      return { success: true, data: [] };
    }
    console.error('加载专项预算子项失败:', error);
    return { success: false, error: error.message };
  }
};

export const createSpecialBudgetItem = async (budgetId, name, budgetAmount, actualAmount = 0) => {
  try {
    const SpecialBudgetItem = AV.Object.extend('SpecialBudgetItem');
    const item = new SpecialBudgetItem();
    
    item.set('budgetId', budgetId);
    item.set('name', name);
    item.set('budgetAmount', fixAmount(budgetAmount));
    item.set('actualAmount', fixAmount(actualAmount));
    setPublicACL(item);
    
    await item.save();
    
    return {
      success: true,
      data: {
        id: item.id,
        budgetId: item.get('budgetId'),
        name: item.get('name'),
        budgetAmount: fixAmount(item.get('budgetAmount')),
        actualAmount: fixAmount(item.get('actualAmount'))
      }
    };
  } catch (error) {
    console.error('创建专项预算子项失败:', error);
    return { success: false, error: error.message };
  }
};

export const updateSpecialBudgetItem = async (itemId, name, budgetAmount, actualAmount) => {
  try {
    const query = new AV.Query('SpecialBudgetItem');
    const item = await query.get(itemId);
    
    item.set('name', name);
    item.set('budgetAmount', fixAmount(budgetAmount));
    item.set('actualAmount', fixAmount(actualAmount));
    
    await item.save();
    
    return {
      success: true,
      data: {
        id: item.id,
        budgetId: item.get('budgetId'),
        name: item.get('name'),
        budgetAmount: fixAmount(item.get('budgetAmount')),
        actualAmount: fixAmount(item.get('actualAmount'))
      }
    };
  } catch (error) {
    console.error('更新专项预算子项失败:', error);
    return { success: false, error: error.message };
  }
};

export const deleteSpecialBudgetItem = async (itemId) => {
  try {
    const query = new AV.Query('SpecialBudgetItem');
    const item = await query.get(itemId);
    await item.destroy();
    return { success: true };
  } catch (error) {
    console.error('删除专项预算子项失败:', error);
    return { success: false, error: error.message };
  }
};