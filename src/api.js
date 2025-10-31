import AV from './leancloud';

// ==================== 瓶子相关 API ====================

/**
 * 获取所有瓶子
 */
export const getBottles = async () => {
  try {
    const query = new AV.Query('Bottle');
    query.ascending('createdAt');
    const bottles = await query.find();
    
    const bottleData = bottles.map(bottle => ({
      id: bottle.id,
      name: bottle.get('name'),
      spent: bottle.get('spent') || 0,
      target: bottle.get('target'),
      color: bottle.get('color'),
      createdAt: bottle.get('createdAt')
    }));
    
    console.log('✅ 成功加载瓶子:', bottleData.length, '个');
    return { success: true, data: bottleData };
  } catch (error) {
    console.error('❌ 加载瓶子失败:', error);
    
    // 检查是否是 404 错误（表不存在）
    if (error.code === 101 || error.message?.includes("doesn't exist")) {
      console.log('ℹ️ Bottle 表不存在（这在首次运行时是正常的）');
      return { 
        success: false, 
        error: "Class or object doesn't exist",
        isTableNotExist: true 
      };
    }
    
    return { success: false, error: error.message };
  }
};

/**
 * 创建瓶子
 */
export const createBottle = async (name, target, color) => {
  try {
    const Bottle = AV.Object.extend('Bottle');
    const bottle = new Bottle();
    
    bottle.set('name', name);
    bottle.set('spent', 0);
    bottle.set('target', target);
    bottle.set('color', color);
    
    await bottle.save();
    
    console.log('✅ 成功创建瓶子:', name);
    return {
      success: true,
      data: {
        id: bottle.id,
        name: bottle.get('name'),
        spent: bottle.get('spent'),
        target: bottle.get('target'),
        color: bottle.get('color')
      }
    };
  } catch (error) {
    console.error('❌ 创建瓶子失败:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 更新瓶子
 */
export const updateBottle = async (bottleId, updates) => {
  try {
    const query = new AV.Query('Bottle');
    const bottle = await query.get(bottleId);
    
    if (updates.name !== undefined) bottle.set('name', updates.name);
    if (updates.spent !== undefined) bottle.set('spent', updates.spent);
    if (updates.target !== undefined) bottle.set('target', updates.target);
    if (updates.color !== undefined) bottle.set('color', updates.color);
    
    await bottle.save();
    
    console.log('✅ 成功更新瓶子:', bottleId);
    return {
      success: true,
      data: {
        id: bottle.id,
        name: bottle.get('name'),
        spent: bottle.get('spent'),
        target: bottle.get('target'),
        color: bottle.get('color')
      }
    };
  } catch (error) {
    console.error('❌ 更新瓶子失败:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 删除瓶子
 */
export const deleteBottle = async (bottleId) => {
  try {
    const query = new AV.Query('Bottle');
    const bottle = await query.get(bottleId);
    await bottle.destroy();
    
    console.log('✅ 成功删除瓶子:', bottleId);
    return { success: true };
  } catch (error) {
    console.error('❌ 删除瓶子失败:', error);
    return { success: false, error: error.message };
  }
};

// ==================== 交易记录相关 API ====================

/**
 * 获取指定瓶子的交易记录
 */
export const getTransactions = async (bottleId) => {
  try {
    const query = new AV.Query('Transaction');
    
    // 创建 Bottle 对象引用
    const Bottle = AV.Object.createWithoutData('Bottle', bottleId);
    query.equalTo('bottle', Bottle);
    query.descending('createdAt');
    
    const transactions = await query.find();
    
    const transactionData = transactions.map(trans => ({
      id: trans.id,
      bottleId: bottleId,
      date: trans.get('date'),
      time: trans.get('time'),
      amount: trans.get('amount'),
      description: trans.get('description') || '',
      createdAt: trans.get('createdAt')
    }));
    
    console.log('✅ 成功加载交易记录:', transactionData.length, '条');
    return { success: true, data: transactionData };
  } catch (error) {
    // 如果表不存在，静默返回空数组（首次使用时正常）
    if (error.code === 101 || error.message?.includes("doesn't exist")) {
      return { success: true, data: [] };
    }
    
    // 其他错误才输出日志
    console.error('❌ 加载交易记录失败:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 创建交易记录
 */
export const createTransaction = async (bottleId, date, time, amount, description) => {
  try {
    const Transaction = AV.Object.extend('Transaction');
    const transaction = new Transaction();
    
    // 创建 Bottle 对象引用
    const Bottle = AV.Object.createWithoutData('Bottle', bottleId);
    
    transaction.set('bottle', Bottle);
    transaction.set('date', date);
    transaction.set('time', time);
    transaction.set('amount', amount);
    transaction.set('description', description);
    
    await transaction.save();
    
    // 更新瓶子的 spent 金额
    const bottleQuery = new AV.Query('Bottle');
    const bottle = await bottleQuery.get(bottleId);
    const currentSpent = bottle.get('spent') || 0;
    bottle.set('spent', currentSpent + amount);
    await bottle.save();
    
    console.log('✅ 成功创建交易记录:', amount, '元');
    return {
      success: true,
      data: {
        id: transaction.id,
        bottleId: bottleId,
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
export const updateTransaction = async (transactionId, bottleId, amount, description) => {
  try {
    // 获取旧的交易记录
    const query = new AV.Query('Transaction');
    const transaction = await query.get(transactionId);
    const oldAmount = transaction.get('amount');
    
    // 更新交易记录
    transaction.set('amount', amount);
    transaction.set('description', description);
    await transaction.save();
    
    // 更新瓶子的 spent 金额
    const bottleQuery = new AV.Query('Bottle');
    const bottle = await bottleQuery.get(bottleId);
    const currentSpent = bottle.get('spent') || 0;
    const amountDiff = amount - oldAmount;
    bottle.set('spent', currentSpent + amountDiff);
    await bottle.save();
    
    console.log('✅ 成功更新交易记录:', transactionId);
    return {
      success: true,
      data: {
        id: transaction.id,
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
export const deleteTransaction = async (transactionId, bottleId, amount) => {
  try {
    // 删除交易记录
    const query = new AV.Query('Transaction');
    const transaction = await query.get(transactionId);
    await transaction.destroy();
    
    // 更新瓶子的 spent 金额
    const bottleQuery = new AV.Query('Bottle');
    const bottle = await bottleQuery.get(bottleId);
    const currentSpent = bottle.get('spent') || 0;
    bottle.set('spent', currentSpent - amount);
    await bottle.save();
    
    console.log('✅ 成功删除交易记录:', transactionId);
    return { success: true };
  } catch (error) {
    console.error('❌ 删除交易记录失败:', error);
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
    // 如果表不存在，静默返回空数组（首次使用时正常）
    if (error.code === 101 || error.message?.includes("doesn't exist")) {
      return { success: true, data: [] };
    }
    
    // 其他错误才输出日志
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
    if (image) {
      wish.set('image', image);
    }
    
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