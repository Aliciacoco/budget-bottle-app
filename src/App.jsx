import React, { useState, useEffect } from 'react';
import { Plus, Settings, ArrowLeft, TrendingUp, X, Heart, Calendar, Edit, Trash2 } from 'lucide-react';
import './leancloud.js'
import { 
  getBottles, 
  createBottle, 
  updateBottle, 
  deleteBottle,
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getWishes,
  createWish,
  updateWish,
  deleteWish
} from './api';

const BudgetBottleApp = () => {
  // 计算日期相关信息
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
  const currentDay = today.getDate();
  const daysUntilSettlement = lastDayOfMonth - currentDay;
  const todayString = `${year}/${String(month + 1).padStart(2, '0')}/${String(currentDay).padStart(2, '0')}`;
  
  const [currentView, setCurrentView] = useState('home');
  const [selectedBottleIndex, setSelectedBottleIndex] = useState(0);
  const [bottles, setBottles] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [wishes, setWishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingBottle, setEditingBottle] = useState(null);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [editingWish, setEditingWish] = useState(null);
  const [newTransaction, setNewTransaction] = useState({ amount: '', description: '' });

  // 初始化加载所有数据
  useEffect(() => {
    loadAllData();
  }, []);

  // 加载所有数据
  const loadAllData = async () => {
    setLoading(true);
    try {
      // 加载瓶子
      const bottlesResult = await getBottles();
      if (bottlesResult.success) {
        if (bottlesResult.data.length > 0) {
          setBottles(bottlesResult.data);
        } else {
          // 如果没有瓶子，创建默认瓶子
          await createDefaultBottles();
        }
      } else if (bottlesResult.isTableNotExist) {
        // Bottle 表不存在，创建默认瓶子
        await createDefaultBottles();
      }

      // 加载愿望清单
      const wishesResult = await getWishes();
      if (wishesResult.success) {
        setWishes(wishesResult.data);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 创建默认瓶子（首次使用）
  const createDefaultBottles = async () => {
    const defaultBottles = [
      { name: 'Monarchy旅行—蒙波利埃古老镇', target: 10000, color: 'bg-blue-400' },
      { name: '一年多游戏啦', target: 5000, color: 'bg-purple-400' },
      { name: '洗发', target: 1000, color: 'bg-green-400' },
      { name: '王字服', target: 10000, color: 'bg-pink-400' }
    ];

    const createdBottles = [];
    for (const bottle of defaultBottles) {
      const result = await createBottle(bottle.name, bottle.target, bottle.color);
      if (result.success) {
        createdBottles.push(result.data);
      }
    }
    setBottles(createdBottles);
  };

  // 当选择的瓶子改变时，加载该瓶子的交易记录
  useEffect(() => {
    if (bottles.length > 0 && bottles[selectedBottleIndex]) {
      loadTransactionsForBottle(bottles[selectedBottleIndex].id);
    }
  }, [selectedBottleIndex, bottles]);

  // 加载指定瓶子的交易记录
  const loadTransactionsForBottle = async (bottleId) => {
    const result = await getTransactions(bottleId);
    if (result.success) {
      setTransactions(result.data);
    }
  };

  const selectedBottle = bottles[selectedBottleIndex];

  // 加载状态
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-xl text-gray-600">加载中...</div>
        </div>
      </div>
    );
  }

  // 如果没有瓶子，显示空状态
  if (!selectedBottle) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-xl text-gray-600 mb-4">还没有创建瓶子</div>
          <button
            onClick={() => setCurrentView('newBottle')}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
          >
            创建第一个瓶子
          </button>
        </div>
      </div>
    );
  }

  // 首页视图
  const HomeView = () => {
    const remaining = selectedBottle.target - selectedBottle.spent;
    const percentage = (remaining / selectedBottle.target) * 100;
    
    return (
      <>
        <style>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
            -webkit-overflow-scrolling: touch;
          }
        `}</style>
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col relative">
        
        {/* 悬浮愿望清单按钮 */}
        <button
          onClick={() => setCurrentView('wishlist')}
          className="fixed left-6 top-1/2 transform -translate-y-1/2 bg-pink-500 text-white p-4 rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all z-50"
          title="愿望清单"
        >
          <Heart size={24} fill="white" />
        </button>
        
        {/* 日期和倒计时 */}
        <div className="px-6 pt-4 pb-2 text-center">
          <p className="text-sm text-gray-600">
            今日 {todayString}，距离结算日还有 <span className="font-semibold text-blue-600">{daysUntilSettlement}</span> 天
          </p>
        </div>
        
        {/* 顶部标题栏 */}
        <div className="px-6 pb-4">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-800">{selectedBottle.name}</h1>
              <div className="flex items-center gap-4 mt-2">
                <p className="text-sm text-gray-600">预算 <span className="font-semibold text-gray-800">¥{selectedBottle.target.toLocaleString()}</span></p>
                <p className="text-sm text-gray-600">已花费 <span className="font-semibold text-red-600">¥{selectedBottle.spent.toLocaleString()}</span></p>
              </div>
            </div>
            <button
              onClick={() => {
                setEditingBottle({ ...selectedBottle, index: selectedBottleIndex });
                setCurrentView('editBottle');
              }}
              className="p-2.5 bg-white rounded-full shadow-md hover:shadow-lg transition-all flex-shrink-0"
            >
              <Settings size={20} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* 瓶子展示区域 */}
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="relative" style={{ width: '240px', height: '420px' }}>
            {/* 瓶盖 */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-40 h-14 bg-gray-300 rounded-t-xl shadow-lg z-10">
              <div className="absolute inset-x-0 top-0 h-4 bg-gray-400 rounded-t-xl" />
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className="absolute top-4 h-10 w-3 bg-gray-400"
                  style={{ left: `${i * 16 + 10}px` }}
                />
              ))}
            </div>
            
            {/* 瓶身 */}
            <div
              onClick={() => setCurrentView('transactionList')}
              className="absolute top-14 left-1/2 transform -translate-x-1/2 w-48 h-80 bg-gradient-to-b from-gray-100 to-gray-200 rounded-3xl border-4 border-gray-300 overflow-hidden shadow-xl hover:shadow-2xl transition-shadow cursor-pointer"
            >
              {/* 瓶子表情 */}
              <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
                <div className="flex gap-10 mb-6">
                  <div className="w-4 h-4 bg-gray-400 rounded-full" />
                  <div className="w-4 h-4 bg-gray-400 rounded-full" />
                </div>
                {/* 可点击的嘴巴 */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentView('addTransaction');
                  }}
                  className="w-16 h-2 bg-gray-400 rounded-full mx-auto block hover:bg-gray-500 hover:scale-110 transition-all active:scale-95 cursor-pointer"
                  title="点击记录消费"
                />
              </div>
              
              {/* 填充液体 */}
              <div
                className={`absolute bottom-0 left-0 right-0 ${selectedBottle.color} transition-all duration-500 opacity-70`}
                style={{ height: `${percentage}%` }}
              />
              
              {/* 波浪效果 */}
              <div
                className={`absolute left-0 right-0 ${selectedBottle.color} h-8 opacity-50`}
                style={{ 
                  bottom: `${percentage}%`,
                  clipPath: 'polygon(0% 50%, 10% 40%, 20% 50%, 30% 60%, 40% 50%, 50% 40%, 60% 50%, 70% 60%, 80% 50%, 90% 40%, 100% 50%, 100% 100%, 0% 100%)'
                }}
              />
            </div>

            {/* 金额显示 */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-center w-full">
              <div className="text-4xl font-bold text-gray-800 mb-2">¥ {remaining.toLocaleString()}</div>
              <div className="text-sm text-gray-500">
                剩余 {percentage.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        {/* 底部瓶子选择器 */}
        <div className="bg-white rounded-t-3xl shadow-2xl p-6 mt-auto">
          <div className="flex items-center gap-4 overflow-x-auto pb-4 scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
            {bottles.map((bottle, index) => {
              const isSelected = index === selectedBottleIndex;
              const bottleRemaining = bottle.target - bottle.spent;
              const bottlePercentage = (bottleRemaining / bottle.target) * 100;
              
              return (
                <button
                  key={bottle.id}
                  onClick={() => setSelectedBottleIndex(index)}
                  className={`flex-shrink-0 transition-all ${
                    isSelected ? 'scale-110' : 'scale-90 opacity-60'
                  }`}
                >
                  <div className="relative" style={{ width: '80px', height: '180px' }}>
                    {/* 小瓶盖 */}
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-12 h-4 bg-gray-300 rounded-t">
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className="absolute top-1 h-3 w-2 bg-gray-400"
                          style={{ left: `${i * 10 + 4}px` }}
                        />
                      ))}
                    </div>
                    
                    {/* 小瓶身 */}
                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-16 h-20 bg-gradient-to-b from-gray-100 to-gray-200 rounded-2xl border-2 border-gray-300 overflow-hidden">
                      <div
                        className={`absolute bottom-0 left-0 right-0 ${bottle.color} transition-all`}
                        style={{ height: `${bottlePercentage}%` }}
                      />
                    </div>
                    
                    {/* 瓶子名称 */}
                    <div className="absolute top-24 left-1/2 transform -translate-x-1/2 w-24 text-center px-1">
                      <div className="text-xs text-gray-600 leading-relaxed" style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        wordBreak: 'break-word'
                      }}>
                        {bottle.name}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
            
            {/* 添加新瓶子按钮 */}
            <button
              onClick={() => setCurrentView('newBottle')}
              className="flex-shrink-0 flex flex-col items-center justify-center w-20 h-36 bg-gray-100 rounded-2xl border-2 border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-200 transition-all"
            >
              <Plus size={32} className="text-gray-400" />
              <span className="text-xs text-gray-500 mt-2">新建</span>
            </button>
          </div>
        </div>
      </div>
      </>
    );
  };

  // 编辑瓶子视图
  const EditBottleView = () => {
    if (!editingBottle) return null;
    
    // 使用本地状态，避免输入卡顿
    const [localName, setLocalName] = useState(editingBottle.name || '');
    const [localTarget, setLocalTarget] = useState(editingBottle.target || '');
    
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => {
              setEditingBottle(null);
              setCurrentView('home');
            }}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
          >
            <ArrowLeft size={20} />
            返回
          </button>

          <h1 className="text-3xl font-bold text-gray-800 mb-8">编辑瓶子</h1>

          <div className="bg-white rounded-2xl p-8 shadow-lg space-y-6">
            <div>
              <label className="block text-gray-700 mb-2 font-medium">瓶子名称</label>
              <input
                type="text"
                value={localName}
                onChange={(e) => setLocalName(e.target.value)}
                placeholder="例如：旅行基金"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2 font-medium">预算金额</label>
              <input
                type="number"
                value={localTarget}
                onChange={(e) => setLocalTarget(e.target.value)}
                placeholder="0"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-lg"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={async () => {
                  const result = await updateBottle(editingBottle.id, {
                    name: localName,
                    target: parseFloat(localTarget) || 0
                  });
                  
                  if (result.success) {
                    // 更新本地状态
                    const updatedBottles = [...bottles];
                    updatedBottles[editingBottle.index] = result.data;
                    setBottles(updatedBottles);
                    setEditingBottle(null);
                    setCurrentView('home');
                  } else {
                    alert('保存失败: ' + result.error);
                  }
                }}
                className="flex-1 bg-gray-800 text-white py-4 rounded-xl font-medium hover:bg-gray-700 transition-colors"
              >
                保存
              </button>
              
              <button
                onClick={async () => {
                  if (confirm('确定要删除这个瓶子吗？')) {
                    const result = await deleteBottle(editingBottle.id);
                    if (result.success) {
                      const updatedBottles = bottles.filter((_, i) => i !== editingBottle.index);
                      setBottles(updatedBottles);
                      setSelectedBottleIndex(Math.max(0, editingBottle.index - 1));
                      setEditingBottle(null);
                      setCurrentView('home');
                    } else {
                      alert('删除失败: ' + result.error);
                    }
                  }
                }}
                className="px-6 bg-red-500 text-white py-4 rounded-xl font-medium hover:bg-red-600 transition-colors"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 消费记录列表视图
  const TransactionListView = () => {
    const bottleTransactions = transactions.sort((a, b) => 
      new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time)
    );
    
    // 按日期分组
    const groupedByDate = bottleTransactions.reduce((acc, trans) => {
      if (!acc[trans.date]) {
        acc[trans.date] = [];
      }
      acc[trans.date].push(trans);
      return acc;
    }, {});

    // 删除交易
    const handleDeleteTransaction = async (transId, amount) => {
      if (confirm('确定要删除这条消费记录吗？')) {
        const result = await deleteTransaction(transId, selectedBottle.id, amount);
        if (result.success) {
          // 重新加载数据
          await loadTransactionsForBottle(selectedBottle.id);
          await loadAllData();
        } else {
          alert('删除失败: ' + result.error);
        }
      }
    };
    
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => setCurrentView('home')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
          >
            <ArrowLeft size={20} />
            返回
          </button>

          <h1 className="text-3xl font-bold text-gray-800 mb-2">消费记录</h1>
          <p className="text-gray-500 mb-8">{selectedBottle.name}</p>

          {Object.keys(groupedByDate).length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
              <p className="text-gray-400">暂无消费记录</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.keys(groupedByDate).map(date => (
                <div key={date}>
                  <div className="flex items-center gap-3 mb-3">
                    <Calendar size={18} className="text-gray-400" />
                    <h2 className="text-lg font-semibold text-gray-700">{date}</h2>
                  </div>
                  <div className="space-y-2">
                    {groupedByDate[date].map(trans => (
                      <div key={trans.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-gray-500">{trans.time}</span>
                              {trans.description && (
                                <>
                                  <span className="text-gray-300">·</span>
                                  <span className="text-gray-700">{trans.description}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-lg font-bold text-red-600">-¥ {trans.amount}</div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setEditingTransaction(trans);
                                  setCurrentView('editTransaction');
                                }}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="编辑"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteTransaction(trans.id, trans.amount)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="删除"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // 编辑交易视图
  const EditTransactionView = () => {
    if (!editingTransaction) return null;
    
    // 使用独立的状态管理，避免输入问题
    const [localAmount, setLocalAmount] = useState(editingTransaction.amount.toString());
    const [localDescription, setLocalDescription] = useState(editingTransaction.description || '');
    
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => {
              setEditingTransaction(null);
              setCurrentView('transactionList');
            }}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
          >
            <ArrowLeft size={20} />
            返回
          </button>

          <h1 className="text-3xl font-bold text-gray-800 mb-2">编辑消费记录</h1>
          <p className="text-gray-500 mb-8">{selectedBottle.name}</p>

          <div className="bg-white rounded-2xl p-8 shadow-lg space-y-6">
            <div>
              <label className="block text-gray-700 mb-2 font-medium">消费金额</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-2xl text-gray-400">¥</span>
                <input
                  type="number"
                  value={localAmount}
                  onChange={(e) => setLocalAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-2xl font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 mb-2 font-medium">备注说明</label>
              <input
                type="text"
                value={localDescription}
                onChange={(e) => setLocalDescription(e.target.value)}
                placeholder="添加备注（可选）"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={async () => {
                  if (localAmount) {
                    const newAmount = parseFloat(localAmount);
                    const result = await updateTransaction(
                      editingTransaction.id,
                      selectedBottle.id,
                      newAmount,
                      localDescription
                    );
                    
                    if (result.success) {
                      // 重新加载数据
                      await loadTransactionsForBottle(selectedBottle.id);
                      await loadAllData();
                      setEditingTransaction(null);
                      setCurrentView('transactionList');
                    } else {
                      alert('保存失败: ' + result.error);
                    }
                  }
                }}
                disabled={!localAmount}
                className="flex-1 bg-blue-600 text-white py-4 rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-lg"
              >
                保存修改
              </button>
              
              <button
                onClick={() => {
                  setEditingTransaction(null);
                  setCurrentView('transactionList');
                }}
                className="px-6 bg-gray-200 text-gray-700 py-4 rounded-xl font-medium hover:bg-gray-300 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 愿望清单视图
  const WishlistView = () => {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => setCurrentView('home')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
          >
            <ArrowLeft size={20} />
            返回
          </button>

          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">愿望清单</h1>
              <p className="text-gray-500 mt-1">记录你的梦想</p>
            </div>
            <button
              onClick={() => {
                setEditingWish({ id: null, description: '', amount: '', image: null });
                setCurrentView('editWish');
              }}
              className="bg-pink-500 text-white px-6 py-3 rounded-xl hover:bg-pink-600 transition-colors flex items-center gap-2"
            >
              <Plus size={20} />
              添加愿望
            </button>
          </div>

          {wishes.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
              <Heart size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-400">还没有添加愿望</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {wishes.map(wish => (
                <div key={wish.id} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  {wish.image && (
                    <img src={wish.image} alt={wish.description} className="w-full h-40 object-cover rounded-lg mb-4" />
                  )}
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">{wish.description}</h3>
                  <p className="text-2xl font-bold text-pink-600 mb-4">¥ {wish.amount.toLocaleString()}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingWish(wish);
                        setCurrentView('editWish');
                      }}
                      className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                    >
                      编辑
                    </button>
                    <button
                      onClick={async () => {
                        if (confirm('确定要删除这个愿望吗？')) {
                          const result = await deleteWish(wish.id);
                          if (result.success) {
                            await loadAllData();
                          } else {
                            alert('删除失败: ' + result.error);
                          }
                        }
                      }}
                      className="flex-1 bg-red-50 text-red-600 py-2 rounded-lg hover:bg-red-100 transition-colors text-sm"
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const EditWishView = () => {
    if (!editingWish) return null;
    const isNew = !editingWish.id;
    
    // 使用本地状态，避免输入卡顿
    const [localDescription, setLocalDescription] = useState(editingWish.description || '');
    const [localAmount, setLocalAmount] = useState(editingWish.amount || '');
    const [localImage, setLocalImage] = useState(editingWish.image || null);
    
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => {
              setEditingWish(null);
              setCurrentView('wishlist');
            }}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
          >
            <ArrowLeft size={20} />
            返回
          </button>

          <h1 className="text-3xl font-bold text-gray-800 mb-8">{isNew ? '添加愿望' : '编辑愿望'}</h1>

          <div className="bg-white rounded-2xl p-8 shadow-lg space-y-6">
            <div>
              <label className="block text-gray-700 mb-2 font-medium">愿望描述</label>
              <input
                type="text"
                value={localDescription}
                onChange={(e) => setLocalDescription(e.target.value)}
                placeholder="例如：去日本旅行"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2 font-medium">所需金额</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-xl text-gray-400">¥</span>
                <input
                  type="number"
                  value={localAmount}
                  onChange={(e) => setLocalAmount(e.target.value)}
                  placeholder="0"
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:outline-none text-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 mb-2 font-medium">图片 (可选)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setLocalImage(reader.result);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:outline-none"
              />
              {localImage && (
                <div className="mt-4 relative">
                  <img src={localImage} alt="预览" className="w-full h-40 object-cover rounded-lg" />
                  <button
                    onClick={() => setLocalImage(null)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={async () => {
                if (localDescription && localAmount) {
                  let result;
                  if (isNew) {
                    result = await createWish(
                      localDescription,
                      parseFloat(localAmount),
                      localImage
                    );
                  } else {
                    result = await updateWish(
                      editingWish.id,
                      localDescription,
                      parseFloat(localAmount),
                      localImage
                    );
                  }
                  
                  if (result.success) {
                    await loadAllData();
                    setEditingWish(null);
                    setCurrentView('wishlist');
                  } else {
                    alert('保存失败: ' + result.error);
                  }
                }
              }}
              disabled={!localDescription || !localAmount}
              className="w-full bg-pink-600 text-white py-4 rounded-xl font-medium hover:bg-pink-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-lg"
            >
              {isNew ? '添加愿望' : '保存修改'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const AddTransactionView = () => {
    // 使用本地状态管理，避免输入卡顿
    const [localAmount, setLocalAmount] = useState('');
    const [localDescription, setLocalDescription] = useState('');
    
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => setCurrentView('home')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
          >
            <ArrowLeft size={20} />
            返回
          </button>

          <h1 className="text-3xl font-bold text-gray-800 mb-2">记录消费</h1>
          <p className="text-gray-500 mb-8">{selectedBottle.name}</p>

          <div className="bg-white rounded-2xl p-8 shadow-lg space-y-6">
            <div>
              <label className="block text-gray-700 mb-2 font-medium">消费金额</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-2xl text-gray-400">¥</span>
                <input
                  type="number"
                  value={localAmount}
                  onChange={(e) => setLocalAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-2xl font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 mb-2 font-medium">备注说明</label>
              <input
                type="text"
                value={localDescription}
                onChange={(e) => setLocalDescription(e.target.value)}
                placeholder="添加备注（可选）"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
              />
            </div>

            <button
              onClick={async () => {
                if (localAmount && selectedBottle) {
                  const amount = parseFloat(localAmount);
                  const now = new Date();
                  const dateStr = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;
                  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                  
                  const result = await createTransaction(
                    selectedBottle.id,
                    dateStr,
                    timeStr,
                    amount,
                    localDescription || ''
                  );
                  
                  if (result.success) {
                    // 重新加载数据
                    await loadTransactionsForBottle(selectedBottle.id);
                    await loadAllData();
                    setLocalAmount('');
                    setLocalDescription('');
                    setCurrentView('home');
                  } else {
                    alert('记录失败: ' + result.error);
                  }
                }
              }}
              disabled={!localAmount}
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-lg"
            >
              记录消费
            </button>
          </div>
        </div>
      </div>
    );
  };

  const NewBottleView = () => {
    // 使用本地状态，避免输入卡顿
    const [localName, setLocalName] = useState('');
    const [localTarget, setLocalTarget] = useState('');
    
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => setCurrentView('home')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
          >
            <ArrowLeft size={20} />
            返回
          </button>

          <h1 className="text-3xl font-bold text-gray-800 mb-8">创建新瓶子</h1>

          <div className="bg-white rounded-2xl p-8 shadow-lg space-y-6">
            <div>
              <label className="block text-gray-700 mb-2 font-medium">瓶子名称</label>
              <input
                type="text"
                value={localName}
                onChange={(e) => setLocalName(e.target.value)}
                placeholder="例如：旅行基金、换新电脑"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2 font-medium">目标金额</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-xl text-gray-400">¥</span>
                <input
                  type="number"
                  value={localTarget}
                  onChange={(e) => setLocalTarget(e.target.value)}
                  placeholder="0"
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-lg"
                />
              </div>
            </div>

            <button
              onClick={async () => {
                if (localName && localTarget) {
                  const colors = ['bg-blue-400', 'bg-purple-400', 'bg-green-400', 'bg-pink-400', 'bg-yellow-400', 'bg-red-400', 'bg-indigo-400', 'bg-teal-400'];
                  const color = colors[bottles.length % colors.length];
                  
                  const result = await createBottle(
                    localName,
                    parseFloat(localTarget),
                    color
                  );
                  
                  if (result.success) {
                    await loadAllData();
                    setSelectedBottleIndex(bottles.length);
                    setCurrentView('home');
                  } else {
                    alert('创建失败: ' + result.error);
                  }
                }
              }}
              disabled={!localName || !localTarget}
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-lg"
            >
              创建瓶子
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="font-sans">
      {currentView === 'home' && <HomeView />}
      {currentView === 'addTransaction' && <AddTransactionView />}
      {currentView === 'transactionList' && <TransactionListView />}
      {currentView === 'editTransaction' && <EditTransactionView />}
      {currentView === 'newBottle' && <NewBottleView />}
      {currentView === 'editBottle' && <EditBottleView />}
      {currentView === 'wishlist' && <WishlistView />}
      {currentView === 'editWish' && <EditWishView />}
    </div>
  );
};

export default BudgetBottleApp;