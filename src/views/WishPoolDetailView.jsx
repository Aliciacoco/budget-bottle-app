//心愿池详情页

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Heart, Plus, Check, X, ChevronRight, History, Info, PiggyBank, TrendingUp, TrendingDown, Undo2 } from 'lucide-react';
import { getWishPoolHistory } from '../api';
import { parseWeekKey } from '../utils/helpers';

const WishPoolDetailView = ({ 
  wishPoolAmount, 
  wishes, 
  onWishClick, 
  onAddWishClick, 
  refreshData 
}) => {
  const [activeTab, setActiveTab] = useState('pending');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [history, setHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const pendingWishes = wishes.filter(w => !w.fulfilled);
  const fulfilledWishes = wishes.filter(w => w.fulfilled);

  // 累计积攒（只统计非扣除记录中的正数）
  const totalSaved = history.filter(h => !h.isDeduction && h.savedAmount > 0).reduce((sum, h) => sum + h.savedAmount, 0);
  // 累计扣除（扣除记录的金额取绝对值）
  const totalSpent = history.filter(h => h.isDeduction).reduce((sum, h) => sum + Math.abs(h.savedAmount || 0), 0);

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    const result = await getWishPoolHistory();
    if (result.success) setHistory(result.data);
    setIsLoadingHistory(false);
  };

  useEffect(() => { loadHistory(); }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-cyan-400 to-blue-500 px-6 pt-12 pb-8 text-white">
        <button onClick={() => window.history.back()} className="mb-4 active:scale-95">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold mb-2">心愿池</h1>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold">¥{wishPoolAmount.toLocaleString()}</span>
          <span className="text-white text-opacity-70">当前余额</span>
        </div>
      </div>
      
      <div className="px-4 -mt-4 space-y-4 pb-8">
        {/* 积攒记录按钮 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <button 
            onClick={() => setShowHistoryModal(true)} 
            className="w-full flex items-center justify-between py-2 active:bg-gray-50 rounded-xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-cyan-50 flex items-center justify-center">
                <History size={20} className="text-cyan-500" />
              </div>
              <div className="text-left">
                <div className="text-sm font-medium text-gray-800">积攒记录与流水</div>
                <div className="text-xs text-gray-400">
                  累计积攒 <span className="text-green-500">+¥{totalSaved.toLocaleString()}</span>
                  {' · '}已实现 <span className="text-pink-500">-¥{totalSpent.toLocaleString()}</span>
                </div>
              </div>
            </div>
            <ChevronRight size={20} className="text-gray-400" />
          </button>
        </div>
        
        {/* 心愿列表 - 标签页 */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex border-b border-gray-100">
            <button 
              onClick={() => setActiveTab('pending')}
              className={`flex-1 py-4 text-center font-medium transition-colors ${activeTab === 'pending' ? 'text-cyan-500 border-b-2 border-cyan-500' : 'text-gray-400'}`}
            >
              未实现 ({pendingWishes.length})
            </button>
            <button 
              onClick={() => setActiveTab('fulfilled')}
              className={`flex-1 py-4 text-center font-medium transition-colors ${activeTab === 'fulfilled' ? 'text-green-500 border-b-2 border-green-500' : 'text-gray-400'}`}
            >
              已实现 ({fulfilledWishes.length})
            </button>
          </div>
          
          <div className="p-4">
            {activeTab === 'pending' ? (
              pendingWishes.length === 0 ? (
                <div className="py-12 text-center">
                  <Heart size={48} className="mx-auto text-gray-200 mb-4" />
                  <p className="text-gray-400">暂无未实现的心愿</p>
                  <button 
                    onClick={onAddWishClick} 
                    className="mt-4 px-6 py-2 bg-cyan-500 text-white rounded-full text-sm font-medium active:scale-95"
                  >
                    添加心愿
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingWishes.map(wish => (
                    <div 
                      key={wish.id} 
                      onClick={() => onWishClick(wish)} 
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer active:bg-gray-100"
                    >
                      <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {wish.image ? (
                          <img src={wish.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Heart size={20} className="text-pink-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-800 truncate">{wish.description}</div>
                        <div className="text-sm text-gray-400">¥{wish.amount?.toLocaleString()}</div>
                      </div>
                      {wishPoolAmount >= wish.amount ? (
                        <span className="px-2 py-1 bg-green-100 text-green-600 text-xs rounded-full">可实现</span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                          还差 ¥{(wish.amount - wishPoolAmount).toLocaleString()}
                        </span>
                      )}
                    </div>
                  ))}
                  <button 
                    onClick={onAddWishClick} 
                    className="w-full py-3 text-gray-400 flex items-center justify-center gap-2 border border-dashed border-gray-200 rounded-xl hover:border-cyan-400 hover:text-cyan-500 active:scale-[0.99]"
                  >
                    <Plus size={18} />添加心愿
                  </button>
                </div>
              )
            ) : (
              fulfilledWishes.length === 0 ? (
                <div className="py-12 text-center">
                  <Check size={48} className="mx-auto text-gray-200 mb-4" />
                  <p className="text-gray-400">还没有实现的心愿</p>
                  <p className="text-sm text-gray-300 mt-2">努力积攒，心愿终会实现 ✨</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {fulfilledWishes.map(wish => (
                    <div 
                      key={wish.id} 
                      onClick={() => onWishClick(wish)} 
                      className="flex items-center gap-3 p-3 bg-green-50 rounded-xl cursor-pointer active:bg-green-100"
                    >
                      <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                        {wish.image ? (
                          <img src={wish.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Heart size={20} className="text-green-500" />
                        )}
                        <div className="absolute inset-0 bg-green-500 bg-opacity-30 flex items-center justify-center">
                          <Check size={20} className="text-white" strokeWidth={3} />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-800 truncate">{wish.description}</div>
                        <div className="text-sm text-green-600">已实现 · ¥{wish.amount?.toLocaleString()}</div>
                      </div>
                      <Undo2 size={16} className="text-gray-400" />
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>
        
        {/* 积攒规则说明 */}
        <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center flex-shrink-0">
              <Info size={20} className="text-cyan-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">积攒规则</h3>
              <ul className="text-sm text-gray-600 space-y-1.5">
                <li>• 每周日 24:00 自动结算本周预算</li>
                <li>• 周预算 - 本周支出 = 本周节省金额</li>
                <li>• 节省金额自动流入心愿池</li>
                <li>• 心愿实现时扣除对应金额</li>
                <li>• 撤销实现可返还扣除金额</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      {/* 历史记录弹窗 */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black bg-opacity-50">
          <div 
            className="bg-white rounded-t-3xl w-full max-w-md max-h-[80vh] overflow-hidden animate-slide-up" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-800">积攒记录与流水</h2>
                <button onClick={() => setShowHistoryModal(false)} className="text-gray-400 active:scale-95">
                  <X size={24} />
                </button>
              </div>
              <div className="flex gap-4 mt-4">
                <div className="flex-1 bg-green-50 rounded-xl p-3 text-center">
                  <div className="flex items-center justify-center gap-1 text-xs text-green-600 mb-1">
                    <TrendingUp size={12} />累计积攒
                  </div>
                  <div className="text-lg font-bold text-green-500">+¥{totalSaved.toLocaleString()}</div>
                </div>
                <div className="flex-1 bg-pink-50 rounded-xl p-3 text-center">
                  <div className="flex items-center justify-center gap-1 text-xs text-pink-600 mb-1">
                    <TrendingDown size={12} />已实现心愿
                  </div>
                  <div className="text-lg font-bold text-pink-500">-¥{totalSpent.toLocaleString()}</div>
                </div>
              </div>
            </div>
            <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(80vh - 180px)' }}>
              {isLoadingHistory ? (
                <div className="py-12 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800 mx-auto"></div>
                  <p className="text-gray-400 mt-4">加载中...</p>
                </div>
              ) : history.length === 0 ? (
                <div className="py-12 text-center">
                  <PiggyBank size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-400">暂无记录</p>
                  <p className="text-sm text-gray-300 mt-2">每周日结算后会自动记录</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((item) => (
                    <div key={item.id} className="bg-gray-50 rounded-xl p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          {item.isDeduction ? (
                            <>
                              <Heart size={16} className="text-pink-500" />
                              <span className="font-medium text-gray-800">实现心愿：{item.wishName || '心愿'}</span>
                            </>
                          ) : (
                            <>
                              <PiggyBank size={16} className="text-cyan-500" />
                              <span className="font-medium text-gray-800">{parseWeekKey(item.weekKey)}</span>
                            </>
                          )}
                        </div>
                        <span className={`font-semibold ${item.isDeduction || item.savedAmount < 0 ? 'text-pink-500' : 'text-green-500'}`}>
                          {item.isDeduction || item.savedAmount < 0 ? '-' : '+'}¥{Math.abs(item.savedAmount || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-400">
                        {item.isDeduction ? (
                          <span>心愿实现扣除</span>
                        ) : (
                          <span>预算 ¥{item.budgetAmount} · 支出 ¥{item.spentAmount}</span>
                        )}
                        <span>{new Date(item.settledAt || item.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <style>{`
            @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
            .animate-slide-up { animation: slide-up 0.3s ease-out; }
          `}</style>
        </div>
      )}
    </div>
  );
};

export default WishPoolDetailView;