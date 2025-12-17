import AV from './leancloud';

// ==================== 工具函数 ====================

const setPublicACL = (obj) => {
  const acl = new AV.ACL();
  acl.setPublicReadAccess(true);
  acl.setPublicWriteAccess(true);
  obj.setACL(acl);
  return obj;
};

// ==================== 防重复提交锁 ====================
const pendingOperations = new Map();

const withLock = async (key, operation) => {
  if (pendingOperations.has(key)) {
    console.log(`⏳ 操作 "${key}" 正在进行中，等待完成...`);
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
      console.log('✅ 成功加载周预算:', weekKey);
      return {
        success: true,
        data: {
          id: budget.id,
          weekKey: budget.get('weekKey'),
          amount: budget.get('amount'),
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
    console.error('❌ 加载周预算失败:', error);
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
        if (queryError.code !== 101) {
          throw queryError;
        }
      }
      
      if (budget) {
        budget.set('amount', amount);
        setPublicACL(budget);
      } else {
        const WeeklyBudget = AV.Object.extend('WeeklyBudget');
        budget = new WeeklyBudget();
        budget.set('weekKey', weekKey);
        budget.set('amount', amount);
        budget.set('settled', false);
        setPublicACL(budget);
      }
      
      await budget.save(null, { fetchWhenSave: true });
      
      console.log('✅ 成功保存周预算:', weekKey, amount);
      return {
        success: true,
        data: {
          id: budget.id,
          weekKey: budget.get('weekKey'),
          amount: budget.get('amount'),
          settled: budget.get('settled') || false
        }
      };
    } catch (error) {
      console.error('❌ 保存周预算失败:', error);
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
        console.log('✅ 成功标记周预算已结算:', weekKey);
        return { success: true };
      }
      
      return { success: false, error: '未找到该周预算' };
    } catch (error) {
      console.error('❌ 标记周预算结算失败:', error);
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
      amount: trans.get('amount'),
      description: trans.get('description') || '',
      createdAt: trans.get('createdAt')
    }));
    
    console.log('✅ 成功加载交易记录:', transactionData.length, '条');
    return { success: true, data: transactionData };
  } catch (error) {
    if (error.code === 101) {
      return { success: true, data: [] };
    }
    console.error('❌ 加载交易记录失败:', error);
    return { success: false, error: error.message };
  }
};

export const createTransaction = async (weekKey, date, time, amount, description) => {
  try {
    const Transaction = AV.Object.extend('Transaction');
    const transaction = new Transaction();
    
    transaction.set('weekKey', weekKey);
    transaction.set('date', date);
    transaction.set('time', time);
    transaction.set('amount', amount);
    transaction.set('description', description);
    setPublicACL(transaction);
    
    await transaction.save();
    
    console.log('✅ 成功创建交易记录:', amount, '元');
    return {
      success: true,
      data: {
        id: transaction.id,
        weekKey: transaction.get('weekKey'),
        date: transaction.get('date'),
        time: transaction.get('time'),
        amount: transaction.get('amount'),
        description: transaction.get('description')
      }
    };
  } catch (error) {
    console.error('❌ 创建交易记录失败:', error);
    return { success: false, error: error.message };
  }
};

export const updateTransaction = async (transactionId, weekKey, amount, description, date = null) => {
  try {
    const query = new AV.Query('Transaction');
    const transaction = await query.get(transactionId);
    
    transaction.set('amount', amount);
    transaction.set('description', description);
    if (date) transaction.set('date', date);
    
    await transaction.save();
    
    console.log('✅ 成功更新交易记录:', transactionId);
    return {
      success: true,
      data: {
        id: transaction.id,
        weekKey: transaction.get('weekKey'),
        date: transaction.get('date'),
        time: transaction.get('time'),
        amount: transaction.get('amount'),
        description: transaction.get('description')
      }
    };
  } catch (error) {
    console.error('❌ 更新交易记录失败:', error);
    return { success: false, error: error.message };
  }
};

export const deleteTransaction = async (transactionId) => {
  try {
    const query = new AV.Query('Transaction');
    const transaction = await query.get(transactionId);
    await transaction.destroy();
    
    console.log('✅ 成功删除交易记录:', transactionId);
    return { success: true };
  } catch (error) {
    console.error('❌ 删除交易记录失败:', error);
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
      amount: expense.get('amount'),
      expireDate: expense.get('expireDate') || '',
      enabled: expense.get('enabled') !== false,
      createdAt: expense.get('createdAt')
    }));
    
    console.log('✅ 成功加载固定支出:', expenseData.length, '条');
    return { success: true, data: expenseData };
  } catch (error) {
    if (error.code === 101) {
      return { success: true, data: [] };
    }
    console.error('❌ 加载固定支出失败:', error);
    return { success: false, error: error.message };
  }
};

export const createFixedExpense = async (name, amount, expireDate, enabled = true) => {
  try {
    const FixedExpense = AV.Object.extend('FixedExpense');
    const expense = new FixedExpense();
    
    expense.set('name', name);
    expense.set('amount', amount);
    expense.set('expireDate', expireDate);
    expense.set('enabled', enabled);
    setPublicACL(expense);
    
    await expense.save();
    
    console.log('✅ 成功创建固定支出:', name);
    return {
      success: true,
      data: {
        id: expense.id,
        name: expense.get('name'),
        amount: expense.get('amount'),
        expireDate: expense.get('expireDate'),
        enabled: expense.get('enabled')
      }
    };
  } catch (error) {
    console.error('❌ 创建固定支出失败:', error);
    return { success: false, error: error.message };
  }
};

export const updateFixedExpense = async (expenseId, name, amount, expireDate, enabled) => {
  try {
    const query = new AV.Query('FixedExpense');
    const expense = await query.get(expenseId);
    
    expense.set('name', name);
    expense.set('amount', amount);
    expense.set('expireDate', expireDate);
    expense.set('enabled', enabled);
    
    await expense.save();
    
    console.log('✅ 成功更新固定支出:', expenseId);
    return {
      success: true,
      data: {
        id: expense.id,
        name: expense.get('name'),
        amount: expense.get('amount'),
        expireDate: expense.get('expireDate'),
        enabled: expense.get('enabled')
      }
    };
  } catch (error) {
    console.error('❌ 更新固定支出失败:', error);
    return { success: false, error: error.message };
  }
};

export const deleteFixedExpense = async (expenseId) => {
  try {
    const query = new AV.Query('FixedExpense');
    const expense = await query.get(expenseId);
    await expense.destroy();
    
    console.log('✅ 成功删除固定支出:', expenseId);
    return { success: true };
  } catch (error) {
    console.error('❌ 删除固定支出失败:', error);
    return { success: false, error: error.message };
  }
};

// ==================== 心愿池积攒历史 API ====================

export const getWishPoolHistory = async () => {
  try {
    const query = new AV.Query('WishPoolHistory');
    query.descending('settledAt');
    query.limit(100);
    const histories = await query.find();
    
    const historyData = histories.map(h => ({
      id: h.id,
      weekKey: h.get('weekKey'),
      budgetAmount: h.get('budgetAmount'),
      spentAmount: h.get('spentAmount'),
      savedAmount: h.get('savedAmount'),
      isDeduction: h.get('isDeduction') === true,
      wishName: h.get('wishName') || '',
      wishId: h.get('wishId') || '',
      settledAt: h.get('settledAt'),
      createdAt: h.get('createdAt')
    }));
    
    console.log('✅ 成功加载积攒历史:', historyData.length, '条');
    return { success: true, data: historyData };
  } catch (error) {
    if (error.code === 101) {
      return { success: true, data: [] };
    }
    console.error('❌ 加载积攒历史失败:', error);
    return { success: false, error: error.message };
  }
};

// ==================== 心愿池相关 API ====================

/**
 * 获取心愿池余额 - 直接从历史记录计算
 * 余额 = 所有 savedAmount 的总和（积攒为正，扣除为负）
 */
export const getWishPool = async () => {
  try {
    const historyResult = await getWishPoolHistory();
    if (!historyResult.success) {
      return { success: true, data: { amount: 0 } };
    }
    
    // 直接累加所有 savedAmount（正数为积攒，负数为扣除）
    const totalAmount = historyResult.data.reduce((sum, h) => sum + (h.savedAmount || 0), 0);
    
    console.log('✅ 心愿池余额(从历史计算):', totalAmount);
    return {
      success: true,
      data: { amount: totalAmount }
    };
  } catch (error) {
    console.error('❌ 计算心愿池余额失败:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 更新心愿池金额 - 已废弃，余额直接从历史计算
 */
export const updateWishPool = async (amount) => {
  console.log('ℹ️ updateWishPool 已废弃，余额从历史记录计算');
  return { success: true, data: { amount } };
};

/**
 * 添加到心愿池 - 已废弃
 */
export const addToWishPool = async (addAmount) => {
  console.log('ℹ️ addToWishPool 已废弃，金额通过历史记录自动计算');
  return { success: true, data: { amount: addAmount } };
};

/**
 * 检查某周是否已结算
 */
export const checkWeekSettled = async (weekKey) => {
  try {
    const query = new AV.Query('WishPoolHistory');
    query.equalTo('weekKey', weekKey);
    // 使用 notEqualTo(true) 而不是 equalTo(false)，因为有些旧数据可能是 undefined
    query.notEqualTo('isDeduction', true);
    const result = await query.first();
    
    const settled = !!result;
    console.log(`🔍 检查周 ${weekKey} 是否已结算:`, settled ? '是' : '否');
    return { success: true, settled };
  } catch (error) {
    if (error.code === 101) {
      return { success: true, settled: false };
    }
    console.error('❌ 检查结算状态失败:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 创建积攒历史记录
 */
export const createWishPoolHistory = async (weekKey, budgetAmount, spentAmount, savedAmount, isDeduction = false, wishName = '', wishId = '') => {
  return withLock(`createHistory:${weekKey}`, async () => {
    try {
      // 对于周结算记录，先检查是否已存在
      if (!isDeduction) {
        try {
          const checkQuery = new AV.Query('WishPoolHistory');
          checkQuery.equalTo('weekKey', weekKey);
          checkQuery.notEqualTo('isDeduction', true);
          const existing = await checkQuery.first();
          
          if (existing) {
            console.log('⏭️ 该周积攒历史已存在，跳过创建:', weekKey);
            return {
              success: true,
              isNew: false,
              data: {
                id: existing.id,
                weekKey: existing.get('weekKey'),
                savedAmount: existing.get('savedAmount')
              }
            };
          }
        } catch (queryError) {
          if (queryError.code !== 101) {
            throw queryError;
          }
        }
      }
      
      const WishPoolHistory = AV.Object.extend('WishPoolHistory');
      const history = new WishPoolHistory();
      
      history.set('weekKey', weekKey);
      history.set('budgetAmount', budgetAmount);
      history.set('spentAmount', spentAmount);
      history.set('savedAmount', savedAmount);
      history.set('isDeduction', isDeduction);
      history.set('wishName', wishName);
      history.set('wishId', wishId);
      history.set('settledAt', new Date());
      setPublicACL(history);
      
      await history.save();
      
      console.log('✅ 成功创建积攒历史:', isDeduction ? `心愿扣除: ${wishName}` : weekKey, savedAmount);
      return {
        success: true,
        isNew: true,
        data: {
          id: history.id,
          weekKey: history.get('weekKey'),
          savedAmount: history.get('savedAmount')
        }
      };
    } catch (error) {
      console.error('❌ 创建积攒历史失败:', error);
      return { success: false, error: error.message };
    }
  });
};

export const deleteWishPoolHistory = async (historyId) => {
  try {
    const query = new AV.Query('WishPoolHistory');
    const history = await query.get(historyId);
    await history.destroy();
    
    console.log('✅ 成功删除心愿池历史记录:', historyId);
    return { success: true };
  } catch (error) {
    console.error('❌ 删除心愿池历史记录失败:', error);
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
      amount: wish.get('amount'),
      image: wish.get('image'),
      fulfilled: wish.get('fulfilled') || false,
      createdAt: wish.get('createdAt')
    }));
    
    console.log('✅ 成功加载愿望清单:', wishData.length, '个');
    return { success: true, data: wishData };
  } catch (error) {
    if (error.code === 101) {
      return { success: true, data: [] };
    }
    console.error('❌ 加载愿望清单失败:', error);
    return { success: false, error: error.message };
  }
};

export const createWish = async (description, amount, image, fulfilled = false) => {
  try {
    const Wish = AV.Object.extend('Wish');
    const wish = new Wish();
    
    wish.set('description', description);
    wish.set('amount', amount);
    wish.set('fulfilled', fulfilled);
    if (image) wish.set('image', image);
    setPublicACL(wish);
    
    await wish.save();
    
    console.log('✅ 成功创建愿望:', description);
    return {
      success: true,
      data: {
        id: wish.id,
        description: wish.get('description'),
        amount: wish.get('amount'),
        image: wish.get('image'),
        fulfilled: wish.get('fulfilled')
      }
    };
  } catch (error) {
    console.error('❌ 创建愿望失败:', error);
    return { success: false, error: error.message };
  }
};

export const updateWish = async (wishId, description, amount, image, fulfilled = false) => {
  try {
    const query = new AV.Query('Wish');
    const wish = await query.get(wishId);
    
    wish.set('description', description);
    wish.set('amount', amount);
    wish.set('image', image);
    wish.set('fulfilled', fulfilled);
    
    await wish.save();
    
    console.log('✅ 成功更新愿望:', wishId);
    return {
      success: true,
      data: {
        id: wish.id,
        description: wish.get('description'),
        amount: wish.get('amount'),
        image: wish.get('image'),
        fulfilled: wish.get('fulfilled')
      }
    };
  } catch (error) {
    console.error('❌ 更新愿望失败:', error);
    return { success: false, error: error.message };
  }
};

export const deleteWish = async (wishId) => {
  try {
    const query = new AV.Query('Wish');
    const wish = await query.get(wishId);
    await wish.destroy();
    
    console.log('✅ 成功删除愿望:', wishId);
    return { success: true };
  } catch (error) {
    console.error('❌ 删除愿望失败:', error);
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
      totalBudget: budget.get('totalBudget') || 0,
      startDate: budget.get('startDate') || '',
      endDate: budget.get('endDate') || '',
      pinnedToHome: budget.get('pinnedToHome') || false,
      createdAt: budget.get('createdAt')
    }));
    
    console.log('✅ 成功加载专项预算:', budgetData.length, '个');
    return { success: true, data: budgetData };
  } catch (error) {
    if (error.code === 101) {
      return { success: true, data: [] };
    }
    console.error('❌ 加载专项预算失败:', error);
    return { success: false, error: error.message };
  }
};

export const createSpecialBudget = async (name, icon, totalBudget, startDate, endDate, pinnedToHome = false) => {
  try {
    const SpecialBudget = AV.Object.extend('SpecialBudget');
    const budget = new SpecialBudget();
    
    budget.set('name', name);
    budget.set('icon', icon);
    budget.set('totalBudget', totalBudget);
    budget.set('startDate', startDate);
    budget.set('endDate', endDate);
    budget.set('pinnedToHome', pinnedToHome);
    setPublicACL(budget);
    
    await budget.save();
    
    console.log('✅ 成功创建专项预算:', name);
    return {
      success: true,
      data: {
        id: budget.id,
        name: budget.get('name'),
        icon: budget.get('icon'),
        totalBudget: budget.get('totalBudget'),
        startDate: budget.get('startDate'),
        endDate: budget.get('endDate'),
        pinnedToHome: budget.get('pinnedToHome')
      }
    };
  } catch (error) {
    console.error('❌ 创建专项预算失败:', error);
    return { success: false, error: error.message };
  }
};

export const updateSpecialBudget = async (budgetId, name, icon, totalBudget, startDate, endDate, pinnedToHome) => {
  try {
    const query = new AV.Query('SpecialBudget');
    const budget = await query.get(budgetId);
    
    budget.set('name', name);
    budget.set('icon', icon);
    budget.set('totalBudget', totalBudget);
    budget.set('startDate', startDate);
    budget.set('endDate', endDate);
    budget.set('pinnedToHome', pinnedToHome);
    
    await budget.save();
    
    console.log('✅ 成功更新专项预算:', budgetId);
    return {
      success: true,
      data: {
        id: budget.id,
        name: budget.get('name'),
        icon: budget.get('icon'),
        totalBudget: budget.get('totalBudget'),
        startDate: budget.get('startDate'),
        endDate: budget.get('endDate'),
        pinnedToHome: budget.get('pinnedToHome')
      }
    };
  } catch (error) {
    console.error('❌ 更新专项预算失败:', error);
    return { success: false, error: error.message };
  }
};

export const deleteSpecialBudget = async (budgetId) => {
  try {
    try {
      const itemQuery = new AV.Query('SpecialBudgetItem');
      itemQuery.equalTo('budgetId', budgetId);
      const items = await itemQuery.find();
      if (items.length > 0) {
        await AV.Object.destroyAll(items);
      }
    } catch (itemError) {
      if (itemError.code !== 101) {
        throw itemError;
      }
    }
    
    const query = new AV.Query('SpecialBudget');
    const budget = await query.get(budgetId);
    await budget.destroy();
    
    console.log('✅ 成功删除专项预算:', budgetId);
    return { success: true };
  } catch (error) {
    console.error('❌ 删除专项预算失败:', error);
    return { success: false, error: error.message };
  }
};

// ==================== 专项预算子项相关 API ====================

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
      budgetAmount: item.get('budgetAmount') || 0,
      actualAmount: item.get('actualAmount') || 0,
      createdAt: item.get('createdAt')
    }));
    
    console.log('✅ 成功加载专项预算子项:', itemData.length, '个');
    return { success: true, data: itemData };
  } catch (error) {
    if (error.code === 101) {
      return { success: true, data: [] };
    }
    console.error('❌ 加载专项预算子项失败:', error);
    return { success: false, error: error.message };
  }
};

export const createSpecialBudgetItem = async (budgetId, name, budgetAmount, actualAmount = 0) => {
  try {
    const SpecialBudgetItem = AV.Object.extend('SpecialBudgetItem');
    const item = new SpecialBudgetItem();
    
    item.set('budgetId', budgetId);
    item.set('name', name);
    item.set('budgetAmount', budgetAmount);
    item.set('actualAmount', actualAmount);
    setPublicACL(item);
    
    await item.save();
    
    console.log('✅ 成功创建专项预算子项:', name);
    return {
      success: true,
      data: {
        id: item.id,
        budgetId: item.get('budgetId'),
        name: item.get('name'),
        budgetAmount: item.get('budgetAmount'),
        actualAmount: item.get('actualAmount')
      }
    };
  } catch (error) {
    console.error('❌ 创建专项预算子项失败:', error);
    return { success: false, error: error.message };
  }
};

export const updateSpecialBudgetItem = async (itemId, name, budgetAmount, actualAmount) => {
  try {
    const query = new AV.Query('SpecialBudgetItem');
    const item = await query.get(itemId);
    
    item.set('name', name);
    item.set('budgetAmount', budgetAmount);
    item.set('actualAmount', actualAmount);
    
    await item.save();
    
    console.log('✅ 成功更新专项预算子项:', itemId);
    return {
      success: true,
      data: {
        id: item.id,
        budgetId: item.get('budgetId'),
        name: item.get('name'),
        budgetAmount: item.get('budgetAmount'),
        actualAmount: item.get('actualAmount')
      }
    };
  } catch (error) {
    console.error('❌ 更新专项预算子项失败:', error);
    return { success: false, error: error.message };
  }
};

export const deleteSpecialBudgetItem = async (itemId) => {
  try {
    const query = new AV.Query('SpecialBudgetItem');
    const item = await query.get(itemId);
    await item.destroy();
    
    console.log('✅ 成功删除专项预算子项:', itemId);
    return { success: true };
  } catch (error) {
    console.error('❌ 删除专项预算子项失败:', error);
    return { success: false, error: error.message };
  }
};