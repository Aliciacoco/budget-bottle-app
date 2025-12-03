import AV from './leancloud';

// ==================== 工具函数 ====================

/**
 * 设置对象的公开读写权限
 */
const setPublicACL = (obj) => {
  const acl = new AV.ACL();
  acl.setPublicReadAccess(true);
  acl.setPublicWriteAccess(true);
  obj.setACL(acl);
  return obj;
};

// ==================== 周预算相关 API ====================

/**
 * 获取指定周的预算
 * @param {string} weekKey - 周标识，格式：YYYY-MM-WN
 */
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
          settled: budget.get('settled') || false, // 是否已结算
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

/**
 * 保存周预算
 */
export const saveWeeklyBudget = async (weekKey, amount) => {
  try {
    let budget = null;
    
    // 先尝试查找是否存在
    try {
      const query = new AV.Query('WeeklyBudget');
      query.equalTo('weekKey', weekKey);
      budget = await query.first();
    } catch (queryError) {
      // 表不存在时忽略错误，继续创建新记录
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
    
    await budget.save();
    
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
};

/**
 * 标记周预算已结算
 */
export const markWeeklyBudgetSettled = async (weekKey) => {
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
};

// ==================== 交易记录相关 API ====================

/**
 * 获取指定周的交易记录
 * @param {string} weekKey - 周标识
 */
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

/**
 * 创建交易记录
 */
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

/**
 * 更新交易记录
 */
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

/**
 * 删除交易记录
 */
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

/**
 * 获取所有固定支出
 */
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

/**
 * 创建固定支出
 */
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

/**
 * 更新固定支出
 */
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

/**
 * 删除固定支出
 */
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

// ==================== 心愿池相关 API ====================

/**
 * 获取心愿池金额
 */
export const getWishPool = async () => {
  try {
    const query = new AV.Query('WishPool');
    const pool = await query.first();
    
    if (pool) {
      return {
        success: true,
        data: {
          id: pool.id,
          amount: pool.get('amount') || 0
        }
      };
    }
    
    return { success: true, data: { amount: 0 } };
  } catch (error) {
    if (error.code === 101) {
      return { success: true, data: { amount: 0 } };
    }
    console.error('❌ 加载心愿池失败:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 更新心愿池金额
 */
export const updateWishPool = async (amount) => {
  try {
    let pool = null;
    
    // 先尝试查找
    try {
      const query = new AV.Query('WishPool');
      pool = await query.first();
    } catch (queryError) {
      // 表不存在时忽略
      if (queryError.code !== 101) {
        throw queryError;
      }
    }
    
    if (pool) {
      pool.set('amount', amount);
    } else {
      const WishPool = AV.Object.extend('WishPool');
      pool = new WishPool();
      pool.set('amount', amount);
      setPublicACL(pool);
    }
    
    await pool.save();
    
    console.log('✅ 成功更新心愿池:', amount);
    return {
      success: true,
      data: {
        id: pool.id,
        amount: pool.get('amount')
      }
    };
  } catch (error) {
    console.error('❌ 更新心愿池失败:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 添加到心愿池（周结算时调用）
 */
export const addToWishPool = async (addAmount) => {
  try {
    const poolResult = await getWishPool();
    const currentAmount = poolResult.data?.amount || 0;
    return await updateWishPool(currentAmount + addAmount);
  } catch (error) {
    console.error('❌ 添加到心愿池失败:', error);
    return { success: false, error: error.message };
  }
};

// ==================== 心愿池积攒历史 API ====================

/**
 * 获取心愿池积攒历史
 */
export const getWishPoolHistory = async () => {
  try {
    const query = new AV.Query('WishPoolHistory');
    query.descending('settledAt');
    query.limit(100); // 最多获取100条记录
    const histories = await query.find();
    
    const historyData = histories.map(h => ({
      id: h.id,
      weekKey: h.get('weekKey'),
      budgetAmount: h.get('budgetAmount'),
      spentAmount: h.get('spentAmount'),
      savedAmount: h.get('savedAmount'),
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

/**
 * 创建积攒历史记录
 */
export const createWishPoolHistory = async (weekKey, budgetAmount, spentAmount, savedAmount) => {
  try {
    const WishPoolHistory = AV.Object.extend('WishPoolHistory');
    const history = new WishPoolHistory();
    
    history.set('weekKey', weekKey);
    history.set('budgetAmount', budgetAmount);
    history.set('spentAmount', spentAmount);
    history.set('savedAmount', savedAmount);
    history.set('settledAt', new Date());
    setPublicACL(history);
    
    await history.save();
    
    console.log('✅ 成功创建积攒历史:', weekKey, savedAmount);
    return {
      success: true,
      data: {
        id: history.id,
        weekKey: history.get('weekKey'),
        budgetAmount: history.get('budgetAmount'),
        spentAmount: history.get('spentAmount'),
        savedAmount: history.get('savedAmount'),
        settledAt: history.get('settledAt')
      }
    };
  } catch (error) {
    console.error('❌ 创建积攒历史失败:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 检查指定周是否已结算
 */
export const checkWeekSettled = async (weekKey) => {
  try {
    const query = new AV.Query('WishPoolHistory');
    query.equalTo('weekKey', weekKey);
    const history = await query.first();
    
    return { success: true, settled: !!history };
  } catch (error) {
    if (error.code === 101) {
      return { success: true, settled: false };
    }
    console.error('❌ 检查结算状态失败:', error);
    return { success: false, error: error.message };
  }
};

// ==================== 愿望清单相关 API ====================

/**
 * 获取愿望清单
 */
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

/**
 * 创建愿望
 */
export const createWish = async (description, amount, image) => {
  try {
    const Wish = AV.Object.extend('Wish');
    const wish = new Wish();
    
    wish.set('description', description);
    wish.set('amount', amount);
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
        image: wish.get('image')
      }
    };
  } catch (error) {
    console.error('❌ 创建愿望失败:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 更新愿望
 */
export const updateWish = async (wishId, description, amount, image) => {
  try {
    const query = new AV.Query('Wish');
    const wish = await query.get(wishId);
    
    wish.set('description', description);
    wish.set('amount', amount);
    wish.set('image', image);
    
    await wish.save();
    
    console.log('✅ 成功更新愿望:', wishId);
    return {
      success: true,
      data: {
        id: wish.id,
        description: wish.get('description'),
        amount: wish.get('amount'),
        image: wish.get('image')
      }
    };
  } catch (error) {
    console.error('❌ 更新愿望失败:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 删除愿望
 */
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

// ==================== 兼容旧版 API（可选删除） ====================

/** @deprecated 请使用新的周预算系统 */
export const getBottles = async () => {
  console.warn('⚠️ getBottles 已废弃，请使用 getWeeklyBudget');
  return { success: true, data: [] };
};

/** @deprecated 请使用新的周预算系统 */
export const createBottle = async () => {
  console.warn('⚠️ createBottle 已废弃，请使用 saveWeeklyBudget');
  return { success: false, error: '此 API 已废弃' };
};

/** @deprecated 请使用新的周预算系统 */
export const updateBottle = async () => {
  console.warn('⚠️ updateBottle 已废弃，请使用 saveWeeklyBudget');
  return { success: false, error: '此 API 已废弃' };
};

/** @deprecated 请使用新的周预算系统 */
export const deleteBottle = async () => {
  console.warn('⚠️ deleteBottle 已废弃');
  return { success: false, error: '此 API 已废弃' };
};