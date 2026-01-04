// SpecialBudgetDetailView.jsx - 专项预算详情页
// 修复：从 specialBudgets 中获取最新数据，确保编辑后图标更新

import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Plus, Settings, Trash2, ChevronRight } from 'lucide-react';
import { getFloatingIcon } from '../constants/floatingIcons';
import { 
  getSpecialBudgetItems, 
  deleteSpecialBudget
} from '../api';

// 导入设计系统组件
import { 
  PageContainer,
  DuoButton,
  ConfirmModal,
  LoadingOverlay
} from '../components/design-system';

const SpecialBudgetDetailView = ({ 
  editingSpecialBudget, 
  specialBudgets, 
  setSpecialBudgets,
  navigateTo
}) => {
  // 从 specialBudgets 中获取最新数据，确保编辑后能看到更新
  const budget = specialBudgets?.find(b => b.id === editingSpecialBudget?.id) || editingSpecialBudget || {};
  
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteBudgetConfirm, setShowDeleteBudgetConfirm] = useState(false);
  
  const iconKey = budget.icon || 'travel';
  const iconConfig = getFloatingIcon(iconKey);
  const IconComponent = iconConfig?.icon;
  const iconColor = iconConfig?.color || '#8B5CF6';
  
  const totalBudget = items.reduce((sum, item) => sum + (item.budgetAmount || 0), 0);
  const totalActual = items.reduce((sum, item) => sum + (item.actualAmount || 0), 0);
  const remaining = totalBudget - totalActual;
  
  // 加载数据函数
  const loadItems = useCallback(async () => {
    if (!budget.id) {
      setIsLoading(false);
      return;
    }
    
    try {
      const result = await getSpecialBudgetItems(budget.id);
      if (result.success) {
        setItems(result.data);
      }
    } catch (error) {
      console.error('加载子项失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, [budget.id]);
  
  // 初始加载 - 防止自动滚动
  useEffect(() => {
    // 保存当前滚动位置并强制回到顶部
    window.scrollTo(0, 0);
    loadItems();
  }, [loadItems]);
  
  // 监听页面可见性变化
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadItems();
      }
    };
    
    const handlePopState = () => {
      loadItems();
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [loadItems]);
  
  // 监听 focus 事件
  useEffect(() => {
    const handleFocus = () => {
      loadItems();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loadItems]);
  
  const handleDeleteBudget = async () => {
    if (!budget.id) return;
    
    setIsSaving(true);
    try {
      const result = await deleteSpecialBudget(budget.id);
      if (result.success) {
        setSpecialBudgets(specialBudgets.filter(b => b.id !== budget.id));
        window.history.back();
      } else {
        alert('删除失败: ' + result.error);
      }
    } finally {
      setIsSaving(false);
      setShowDeleteBudgetConfirm(false);
    }
  };
  
  const goToEdit = () => {
    if (navigateTo) {
      navigateTo('editSpecialBudget', { editingSpecialBudget: budget });
    }
  };

  const handleItemClick = (item) => {
    if (navigateTo) {
      navigateTo('editSpecialBudgetItem', { 
        editingItem: item,
        budgetId: budget.id,
        iconColor: iconColor
      });
    }
  };
  
  const handleAddItem = () => {
    if (navigateTo) {
      navigateTo('editSpecialBudgetItem', { 
        editingItem: {},
        budgetId: budget.id,
        iconColor: iconColor
      });
    }
  };
  
  if (!budget.id) {
    return (
      <PageContainer bg="gray" className="flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">未找到预算信息</p>
          <DuoButton onClick={() => window.history.back()} variant="ghost">
            返回
          </DuoButton>
        </div>
      </PageContainer>
    );
  }
  
  return (
    <PageContainer bg="gray" className="pb-safe">
      {/* 引入 Google Fonts */}
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
          <div className="flex gap-2 pointer-events-auto">
            <button 
              onClick={goToEdit}
              className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm hover:shadow-md transition-shadow text-gray-400 hover:text-gray-600 active:scale-95"
            >
              <Settings size={22} strokeWidth={2.5} />
            </button>
            <button 
              onClick={() => setShowDeleteBudgetConfirm(true)}
              className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm hover:shadow-md transition-shadow text-red-400 hover:text-red-500 active:scale-95"
            >
              <Trash2 size={22} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="pt-20 px-6 max-w-lg mx-auto space-y-6">
        
        {/* 预算信息卡片 */}
        <div 
          className="rounded-3xl p-6 text-white relative overflow-hidden shadow-sm"
          style={{ 
            background: `linear-gradient(135deg, ${iconColor}dd, ${iconColor})`
          }}
        >
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/20 rounded-full"></div>
          
          <div className="flex items-center gap-4 mb-5 relative z-10">
            {/* 自定义 SVG 图标 */}
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-white/20">
              {IconComponent && (
                <div className="w-9 h-9">
                  <IconComponent className="w-full h-full" />
                </div>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-extrabold">{budget.name}</h1>
              {budget.startDate && budget.endDate && (
                <p className="text-white/70 text-sm mt-1 font-rounded">
                  {budget.startDate} ~ {budget.endDate}
                </p>
              )}
              {budget.pinnedToHome && (
                <span className="inline-block mt-1 px-2 py-0.5 bg-white/20 rounded-full text-xs font-bold">
                  已固定首页
                </span>
              )}
            </div>
          </div>
          
          {/* 汇总数据 */}
          <div className="bg-white/15 rounded-2xl p-4 backdrop-blur-sm relative z-10">
            <div className="grid grid-cols-3 divide-x divide-white/20">
              <div className="text-center px-2">
                <p className="text-white/60 text-xs font-bold mb-2">预算</p>
                <p className="text-lg font-extrabold font-rounded text-white">
                  ¥{Math.floor(totalBudget).toLocaleString()}
                </p>
              </div>
              <div className="text-center px-2">
                <p className="text-white/60 text-xs font-bold mb-2">已花</p>
                <p className="text-lg font-extrabold font-rounded text-amber-200">
                  ¥{Math.floor(totalActual).toLocaleString()}
                </p>
              </div>
              <div className="text-center px-2">
                <p className="text-white/60 text-xs font-bold mb-2">剩余</p>
                <p className={`text-lg font-extrabold font-rounded ${remaining < 0 ? 'text-red-300' : 'text-green-300'}`}>
                  ¥{Math.floor(remaining).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* 预算明细 */}
        <div className="bg-white rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-extrabold text-gray-700">预算明细</h2>
            <button 
              onClick={handleAddItem}
              className="text-cyan-500 font-bold text-sm flex items-center gap-1 hover:text-cyan-600 active:scale-95 transition-all"
            >
              <Plus size={18} strokeWidth={3} /> 添加
            </button>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-cyan-200 border-t-cyan-500"></div>
            </div>
          ) : items.length === 0 ? (
            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center">
              <p className="text-gray-400 font-bold mb-2">还没有预算明细</p>
              <p className="text-gray-300 text-sm">点击"添加"创建第一项</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map(item => {
                const itemRemaining = (item.budgetAmount || 0) - (item.actualAmount || 0);
                const progress = item.budgetAmount > 0 
                  ? Math.min((item.actualAmount / item.budgetAmount) * 100, 100) 
                  : 0;
                
                return (
                  <div 
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className="bg-gray-50 rounded-2xl p-4 cursor-pointer active:bg-gray-100 active:scale-[0.99] transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-gray-700">{item.name}</span>
                      <ChevronRight size={20} className="text-gray-300" strokeWidth={2.5} />
                    </div>
                    
                    {/* 进度条 */}
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: `${progress}%`,
                          backgroundColor: progress > 100 ? '#EF4444' : iconColor
                        }}
                      />
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400 font-rounded">
                        ¥{(item.actualAmount || 0).toLocaleString()} / ¥{(item.budgetAmount || 0).toLocaleString()}
                      </span>
                      <span className={`font-bold font-rounded ${itemRemaining < 0 ? 'text-red-500' : 'text-green-500'}`}>
                        {itemRemaining >= 0 ? '剩余' : '超支'} ¥{Math.abs(itemRemaining).toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      
      {/* 删除预算确认 */}
      <ConfirmModal 
        isOpen={showDeleteBudgetConfirm}
        title="删除整个预算？"
        message={`将删除"${budget.name}"及其所有明细，此操作无法撤销。`}
        onConfirm={handleDeleteBudget}
        onCancel={() => setShowDeleteBudgetConfirm(false)}
        confirmText="删除"
        confirmVariant="danger"
      />
      
      <LoadingOverlay isLoading={isSaving} />
    </PageContainer>
  );
};

export default SpecialBudgetDetailView;