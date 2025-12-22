// WishPoolDetailView.jsx - 心愿池详情页
// 支持显示图标或用户上传的图片

import React, { useState, useEffect } from 'react';
import { Plus, Check, History, ArrowLeft, Droplets, Sparkles, Waves } from 'lucide-react';
import { getWishPoolHistory, getWishPool } from '../api';
import { parseWeekKey } from '../utils/helpers';
import { getWishIcon, WISH_ICONS } from '../constants/wishIcons.jsx';

// 导入设计系统组件
import { 
  PageContainer, 
  Modal,
  LoadingOverlay
} from '../components/design-system';

// 金额格式化（修复精度问题）
const formatAmount = (amount) => {
  return Math.round(amount * 100) / 100;
};

// --- 心愿卡片组件 ---
const WishCard = ({ wish, currentAmount, onClick, isFulfilled = false }) => {
  const percent = Math.min(100, (currentAmount / wish.amount) * 100);
  const isAffordable = currentAmount >= wish.amount;
  
  // 进度条颜色
  let barColor = isAffordable ? 'bg-green-400' : 'bg-cyan-400';
  if (isFulfilled) barColor = 'bg-gray-300';

  // 获取图标
  const hasImage = wish.image;
  const iconConfig = getWishIcon(wish.icon || 'ball1');
  const IconComponent = iconConfig.icon;

  return (
    <div 
      onClick={onClick}
      className="group relative bg-transparent cursor-pointer select-none transition-transform duration-200 hover:-translate-y-1 active:translate-y-0 active:scale-[0.98]"
    >
      {/* 主卡片区域 */}
      <div className="relative z-10 bg-white rounded-t-3xl rounded-b-lg p-5 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* 图标/图片 */}
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden ${
            isFulfilled ? 'bg-gray-100' : 'bg-cyan-50'
          }`}>
            {hasImage ? (
              <img 
                src={wish.image} 
                alt={wish.description}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-9 h-9">
                <IconComponent className="w-full h-full" />
              </div>
            )}
          </div>
          
          {/* 标题和价格 */}
          <div>
            <h3 className={`font-bold text-lg text-gray-800 leading-tight ${
              isFulfilled ? 'line-through decoration-2 decoration-gray-200 opacity-60' : ''
            }`}>
              {wish.description}
            </h3>
            <div className={`text-sm font-semibold font-rounded ${
              isAffordable && !isFulfilled ? 'text-green-500' : 'text-gray-400'
            }`}>
              ¥{formatAmount(wish.amount).toLocaleString()}
            </div>
          </div>
        </div>

        {/* 右侧状态 */}
        <div className="text-right">
          {!isFulfilled ? (
            isAffordable ? (
              // 100% 时显示绿色对号图标
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <Check size={20} className="text-white" strokeWidth={3} />
              </div>
            ) : (
              <span className="text-2xl font-black text-gray-200 font-rounded">
                {Math.floor(percent)}<span className="text-xs ml-0.5">%</span>
              </span>
            )
          ) : (
            <Check size={24} className="text-gray-300" strokeWidth={4} />
          )}
        </div>
      </div>

      {/* 底部进度条 */}
      <div className="relative h-2.5 w-full bg-gray-200 rounded-b-3xl overflow-hidden -mt-1 z-0">
        <div 
          className={`h-full ${barColor} transition-all duration-700 ease-out`} 
          style={{ width: `${isFulfilled ? 100 : percent}%` }}
        />
      </div>
    </div>
  );
};

const WishPoolDetailView = ({ 
  wishPoolAmount: propWishPoolAmount, 
  wishes, 
  onWishClick, 
  onAddWishClick, 
  refreshData 
}) => {
  const [activeTab, setActiveTab] = useState('pending');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [history, setHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [localWishPoolAmount, setLocalWishPoolAmount] = useState(formatAmount(propWishPoolAmount || 0));

  const pendingWishes = wishes.filter(w => !w.fulfilled);
  const fulfilledWishes = wishes.filter(w => w.fulfilled);

  const totalSaved = formatAmount(history.filter(h => !h.isDeduction && h.savedAmount > 0).reduce((sum, h) => sum + h.savedAmount, 0));
  const totalSpent = formatAmount(history.filter(h => h.isDeduction).reduce((sum, h) => sum + Math.abs(h.savedAmount || 0), 0));

  const displayAmount = formatAmount(localWishPoolAmount);

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const result = await getWishPoolHistory();
      if (result.success) {
        setHistory(result.data);
        const calculatedAmount = formatAmount(result.data.reduce((sum, h) => sum + (h.savedAmount || 0), 0));
        setLocalWishPoolAmount(calculatedAmount);
      }
    } catch (error) {
      console.error('加载历史记录失败:', error);
    }
    setIsLoadingHistory(false);
  };

  useEffect(() => {
    const fetchPoolAmount = async () => {
      const result = await getWishPool();
      if (result.success) {
        setLocalWishPoolAmount(formatAmount(result.data.amount));
      }
    };
    fetchPoolAmount();
    loadHistory();
  }, []);

  useEffect(() => {
    if (propWishPoolAmount !== undefined && propWishPoolAmount !== null) {
      setLocalWishPoolAmount(formatAmount(propWishPoolAmount));
    }
  }, [propWishPoolAmount]);

  return (
    <PageContainer bg="gray" className="relative pb-32">
      {/* 引入 Google Fonts - M PLUS Rounded 1c */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@400;500;700;800&display=swap');
        .font-rounded {
          font-family: 'M PLUS Rounded 1c', sans-serif;
        }
      `}</style>

      {/* 固定透明导航栏 */}
      <div className="fixed top-0 left-0 right-0 z-20 px-6 pt-4 pb-2 pointer-events-none">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <button 
            onClick={() => window.history.back()}
            className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm hover:shadow-md transition-shadow text-gray-400 hover:text-gray-600 pointer-events-auto active:scale-95"
          >
            <ArrowLeft size={24} strokeWidth={2.5} />
          </button>
          {/* 历史记录按钮 */}
          <button 
            onClick={() => setShowHistoryModal(true)}
            className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm hover:shadow-md transition-shadow text-gray-400 hover:text-gray-600 pointer-events-auto active:scale-95"
          >
            <History size={24} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="pt-20 px-6 max-w-lg mx-auto">
        {/* 余额展示 */}
        <div className="text-center py-6 mb-6">
          <div className="inline-flex items-center gap-2 bg-white px-4 py-1.5 rounded-full shadow-sm mb-3">
            <Waves size={16} className="text-cyan-500" />
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">当前余额</span>
          </div>
          <h1 className="text-6xl font-extrabold text-gray-800 tracking-tight font-rounded">
            <span className="text-3xl text-gray-300 mr-1">¥</span>
            {displayAmount.toLocaleString()}
          </h1>
        </div>

        {/* Tab 切换 */}
        <div className="flex justify-center gap-8 mb-6 text-lg font-bold">
          <button 
            onClick={() => setActiveTab('pending')}
            className={`relative px-2 transition-colors ${
              activeTab === 'pending' ? 'text-gray-800' : 'text-gray-300 hover:text-gray-500'
            }`}
          >
            心愿单
            {activeTab === 'pending' && (
              <div className="absolute -bottom-1 left-0 right-0 h-1 bg-cyan-400 rounded-full"></div>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('fulfilled')}
            className={`relative px-2 transition-colors ${
              activeTab === 'fulfilled' ? 'text-gray-800' : 'text-gray-300 hover:text-gray-500'
            }`}
          >
            已完成
            {activeTab === 'fulfilled' && (
              <div className="absolute -bottom-1 left-0 right-0 h-1 bg-green-400 rounded-full"></div>
            )}
          </button>
        </div>

        {/* 心愿列表 */}
        <div className="space-y-5">
          {activeTab === 'pending' ? (
            pendingWishes.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-4 bg-white rounded-full flex items-center justify-center shadow-sm">
                  <Droplets size={40} className="text-gray-300" />
                </div>
                <p className="text-gray-400 font-bold text-lg mb-2">还没有心愿</p>
                <p className="text-gray-300 text-sm mb-6">点击下方按钮添加第一个心愿</p>
              </div>
            ) : (
              pendingWishes.map(wish => (
                <WishCard 
                  key={wish.id}
                  wish={wish}
                  currentAmount={displayAmount}
                  onClick={() => onWishClick(wish)}
                />
              ))
            )
          ) : (
            fulfilledWishes.length === 0 ? (
              <div className="text-center py-16 text-gray-300 font-bold text-xl">
                还没有完成的心愿...
              </div>
            ) : (
              fulfilledWishes.map(wish => (
                <WishCard 
                  key={wish.id}
                  wish={wish}
                  currentAmount={displayAmount}
                  onClick={() => onWishClick(wish)}
                  isFulfilled
                />
              ))
            )
          )}
        </div>
      </div>

      {/* 底部悬浮添加按钮 */}
      <div className="fixed bottom-8 left-0 right-0 flex justify-center pointer-events-none z-20">
        <button 
          onClick={onAddWishClick}
          className="pointer-events-auto group relative active:scale-95 transition-transform"
        >
          <div className="absolute inset-0 bg-gray-800 rounded-full translate-y-1 group-active:translate-y-0 transition-transform duration-100"></div>
          <div className="relative bg-gray-900 text-white w-16 h-16 rounded-full flex items-center justify-center -translate-y-0.5 group-active:translate-y-0.5 transition-transform duration-100 border-4 border-gray-100">
            <Plus size={32} strokeWidth={3} />
          </div>
        </button>
      </div>

      {/* 历史记录弹窗 */}
      <Modal 
        isOpen={showHistoryModal} 
        onClose={() => setShowHistoryModal(false)}
        title="水位变动记录"
      >
        {/* 规则说明 - 小字 */}
        <div className="mb-5 p-4 bg-gray-50 rounded-2xl">
          <p className="text-xs text-gray-400 leading-relaxed">
            <span className="text-gray-500 font-medium">规则说明：</span>每周自动结算预算，本周预算 - 本周支出 = 节省的钱，节省的钱自动流入心愿池，累积金额可兑换心愿清单中的物品。
          </p>
        </div>
        
        {/* 统计卡片 */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 bg-cyan-50 rounded-2xl p-4 text-center border-2 border-cyan-100">
            <div className="text-xs font-bold text-cyan-600 mb-1">总注入</div>
            <div className="text-xl font-extrabold text-cyan-500 font-rounded">+¥{totalSaved.toLocaleString()}</div>
          </div>
          <div className="flex-1 bg-orange-50 rounded-2xl p-4 text-center border-2 border-orange-100">
            <div className="text-xs font-bold text-orange-600 mb-1">总流出</div>
            <div className="text-xl font-extrabold text-orange-500 font-rounded">-¥{totalSpent.toLocaleString()}</div>
          </div>
        </div>

        {/* 历史列表 */}
        <div className="space-y-3 max-h-[40vh] overflow-y-auto">
          {isLoadingHistory ? (
            <div className="py-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-cyan-200 border-t-cyan-500 mx-auto"></div>
              <p className="text-gray-400 font-bold mt-4">加载中...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-gray-400 font-bold">暂无记录</div>
          ) : (
            history.map((item) => (
              <div key={item.id} className="flex justify-between items-center py-3 border-b-2 border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    item.isDeduction ? 'bg-orange-100 text-orange-500' : 'bg-cyan-100 text-cyan-500'
                  }`}>
                    {item.isDeduction ? <Sparkles size={18} /> : <Droplets size={18} />}
                  </div>
                  <div>
                    <div className="font-bold text-gray-700">
                      {item.isDeduction ? (item.wishName || '心愿兑换') : parseWeekKey(item.weekKey)}
                    </div>
                    <div className="text-xs text-gray-400 font-medium">
                      {new Date(item.settledAt || item.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className={`font-extrabold text-lg font-rounded ${
                  item.isDeduction || item.savedAmount < 0 ? 'text-orange-500' : 'text-cyan-500'
                }`}>
                  {item.isDeduction || item.savedAmount < 0 ? '-' : '+'}¥{formatAmount(Math.abs(item.savedAmount || 0)).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>

      <LoadingOverlay isLoading={isLoadingHistory && history.length === 0} />
    </PageContainer>
  );
};

export default WishPoolDetailView;