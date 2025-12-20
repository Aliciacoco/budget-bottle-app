// EditSpecialBudgetItemView.jsx - 编辑独立预算明细页面
// 修复：移除onSave依赖，保存后直接返回

import React, { useState } from 'react';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { 
  createSpecialBudgetItem, 
  updateSpecialBudgetItem, 
  deleteSpecialBudgetItem 
} from '../api';

// 导入设计系统组件
import { 
  PageContainer,
  DuoButton,
  DuoInput,
  ConfirmModal,
  LoadingOverlay
} from '../components/design-system';

import Calculator from '../components/CalculatorModal';

const EditSpecialBudgetItemView = ({ 
  editingItem,
  budgetId,
  iconColor = '#06B6D4',
  onBack
}) => {
  const isNew = !editingItem?.id;
  
  const [name, setName] = useState(editingItem?.name || '');
  const [budgetAmount, setBudgetAmount] = useState(editingItem?.budgetAmount || 0);
  const [actualAmount, setActualAmount] = useState(editingItem?.actualAmount || 0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showBudgetCalculator, setShowBudgetCalculator] = useState(false);
  const [showActualCalculator, setShowActualCalculator] = useState(false);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.back();
    }
  };

  const handleSave = async () => {
    if (!name) return;
    
    setIsLoading(true);
    try {
      let result;
      
      if (isNew) {
        result = await createSpecialBudgetItem(budgetId, name, budgetAmount, actualAmount);
      } else {
        result = await updateSpecialBudgetItem(editingItem.id, name, budgetAmount, actualAmount);
      }
      
      if (result.success) {
        // 直接返回，详情页会自动刷新数据
        handleBack();
      } else {
        alert('保存失败: ' + result.error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!editingItem?.id) return;
    
    setShowDeleteConfirm(false);
    setIsLoading(true);
    try {
      const result = await deleteSpecialBudgetItem(editingItem.id);
      if (result.success) {
        handleBack();
      } else {
        alert('删除失败: ' + result.error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 计算剩余
  const remaining = budgetAmount - actualAmount;
  const progress = budgetAmount > 0 ? Math.min((actualAmount / budgetAmount) * 100, 100) : 0;

  return (
    <PageContainer bg="gray">
      {/* 引入 M PLUS Rounded 1c 字体 */}
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
            onClick={handleBack}
            className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm hover:shadow-md transition-shadow text-gray-400 hover:text-gray-600 pointer-events-auto active:scale-95"
          >
            <ArrowLeft size={24} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="pt-20 px-6 max-w-lg mx-auto space-y-6">
        
        {/* 页面标题 */}
        <div className="text-center mb-2">
          <h1 className="text-2xl font-extrabold text-gray-800">
            {isNew ? '添加预算明细' : '编辑预算明细'}
          </h1>
          <p className="text-gray-400 font-medium text-sm mt-1">
            {isNew ? '添加一项预算明细' : '修改这项预算明细'}
          </p>
        </div>

        {/* 进度预览卡片 - 只在编辑模式且有预算时显示 */}
        {!isNew && budgetAmount > 0 && (
          <div 
            className="rounded-2xl p-4"
            style={{ backgroundColor: iconColor + '15' }}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-gray-600">{name || '预算明细'}</span>
              <span className={`font-bold font-rounded ${remaining < 0 ? 'text-red-500' : 'text-green-500'}`}>
                {remaining >= 0 ? '剩余' : '超支'} ¥{Math.abs(remaining).toLocaleString()}
              </span>
            </div>
            <div className="h-2 bg-white rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${progress}%`,
                  backgroundColor: progress > 100 ? '#EF4444' : iconColor
                }}
              />
            </div>
          </div>
        )}

        {/* 表单卡片 */}
        <div className="bg-white rounded-3xl p-6 shadow-sm space-y-5">
          
          {/* 名称输入 */}
          <div>
            <label className="block text-gray-400 font-bold uppercase tracking-wider text-xs mb-3 ml-1">名称</label>
            <DuoInput
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="例如：机票、酒店..."
              autoFocus={isNew}
            />
          </div>
          
          {/* 预算金额 */}
          <div>
            <label className="block text-gray-400 font-bold uppercase tracking-wider text-xs mb-3 ml-1">预算金额</label>
            <button
              onClick={() => setShowBudgetCalculator(true)}
              className="w-full bg-gray-100 border-2 border-gray-200 rounded-2xl px-5 py-4 font-bold text-left text-gray-700 hover:border-cyan-400 transition-colors flex items-center active:scale-[0.99]"
            >
              <span className="text-xl text-gray-300 mr-2">¥</span>
              <span className="text-2xl font-extrabold font-rounded">
                {budgetAmount > 0 ? budgetAmount.toLocaleString() : '0'}
              </span>
            </button>
          </div>
          
          {/* 实际花费 */}
          <div>
            <label className="block text-gray-400 font-bold uppercase tracking-wider text-xs mb-3 ml-1">实际花费</label>
            <button
              onClick={() => setShowActualCalculator(true)}
              className="w-full bg-gray-100 border-2 border-gray-200 rounded-2xl px-5 py-4 font-bold text-left text-gray-700 hover:border-cyan-400 transition-colors flex items-center active:scale-[0.99]"
            >
              <span className="text-xl text-gray-300 mr-2">¥</span>
              <span className="text-2xl font-extrabold font-rounded">
                {actualAmount > 0 ? actualAmount.toLocaleString() : '0'}
              </span>
            </button>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="space-y-3">
          <DuoButton 
            onClick={handleSave}
            disabled={!name || isLoading}
            fullWidth
            size="lg"
          >
            {isLoading ? '保存中...' : '保存'}
          </DuoButton>
          
          {/* 只有编辑模式才显示删除按钮 */}
          {!isNew && (
            <DuoButton 
              onClick={() => setShowDeleteConfirm(true)}
              variant="danger"
              fullWidth
              size="lg"
              icon={Trash2}
            >
              删除这项明细
            </DuoButton>
          )}
        </div>
      </div>

      {/* 预算金额计算器 */}
      {showBudgetCalculator && (
        <Calculator
          value={budgetAmount}
          onChange={(amount) => {
            setBudgetAmount(amount);
            setShowBudgetCalculator(false);
          }}
          onClose={() => setShowBudgetCalculator(false)}
          title="预算金额"
        />
      )}
      
      {/* 实际花费计算器 */}
      {showActualCalculator && (
        <Calculator
          value={actualAmount}
          onChange={(amount) => {
            setActualAmount(amount);
            setShowActualCalculator(false);
          }}
          onClose={() => setShowActualCalculator(false)}
          title="实际花费"
        />
      )}

      {/* 删除确认弹窗 */}
      <ConfirmModal 
        isOpen={showDeleteConfirm} 
        title="删除预算明细" 
        message="确定要删除这项预算明细吗？此操作无法撤销。" 
        onConfirm={handleDelete} 
        onCancel={() => setShowDeleteConfirm(false)}
        confirmText="删除"
        confirmVariant="danger"
      />
      
      <LoadingOverlay isLoading={isLoading} />
    </PageContainer>
  );
};

export default EditSpecialBudgetItemView;