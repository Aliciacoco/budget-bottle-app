// EditSpecialBudgetView.jsx - 新增/编辑独立预算
// 修复：夸克浏览器删除问题 - 使用乐观更新

import React, { useState } from 'react';
import { Check, Trash2 } from 'lucide-react';
import { FLOATING_ICONS, getFloatingIcon } from '../constants/floatingIcons';
import { createSpecialBudget, updateSpecialBudget, deleteSpecialBudget } from '../api';

import { 
  PageContainer,
  TransparentNavBar,
  DuoButton,
  DuoInput,
  ConfirmModal,
  LoadingOverlay
} from '../components/design-system';

const EditSpecialBudgetView = ({ 
  editingSpecialBudget = {}, 
  specialBudgets = [], 
  setSpecialBudgets,
  onBack
}) => {
  const isEditing = !!editingSpecialBudget?.id;
  
  const [name, setName] = useState(editingSpecialBudget?.name || '');
  const [icon, setIcon] = useState(editingSpecialBudget?.icon || 'travel');
  const [startDate, setStartDate] = useState(editingSpecialBudget?.startDate || '');
  const [endDate, setEndDate] = useState(editingSpecialBudget?.endDate || '');
  const [pinnedToHome, setPinnedToHome] = useState(editingSpecialBudget?.pinnedToHome || false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const selectedIconConfig = getFloatingIcon(icon);
  const iconKeys = Object.keys(FLOATING_ICONS);
  
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.back();
    }
  };
  
  const handleSave = async () => {
    if (!name.trim()) {
      alert('请输入预算名称');
      return;
    }
    
    setIsSaving(true);
    try {
      let result;
      if (isEditing) {
        result = await updateSpecialBudget(
          editingSpecialBudget.id,
          name.trim(),
          icon,
          editingSpecialBudget.totalBudget || 0,
          startDate,
          endDate,
          pinnedToHome
        );
      } else {
        result = await createSpecialBudget(
          name.trim(),
          icon,
          0,
          startDate,
          endDate,
          pinnedToHome
        );
      }
      
      if (result.success) {
        if (isEditing) {
          setSpecialBudgets(specialBudgets.map(b => 
            b.id === editingSpecialBudget.id ? result.data : b
          ));
        } else {
          setSpecialBudgets([...specialBudgets, result.data]);
        }
        handleBack();
      } else {
        alert('保存失败: ' + result.error);
      }
    } finally {
      setIsSaving(false);
    }
  };
  
  // 【核心修复】乐观更新
  const handleDelete = async () => {
    if (!editingSpecialBudget?.id) return;
    
    const budgetId = editingSpecialBudget.id;
    
    setShowDeleteConfirm(false);
    
    // 1. 立即更新本地状态
    setSpecialBudgets(prev => prev.filter(b => b.id !== budgetId));
    
    // 2. 立即返回
    handleBack();
    
    // 3. 后台静默删除
    try {
      await deleteSpecialBudget(budgetId);
      console.log('✅ 专项预算删除成功');
    } catch (error) {
      console.warn('删除请求未完成:', error);
    }
  };
  
  return (
    <PageContainer bg="gray">
      <TransparentNavBar
        onBack={handleBack}
        rightButtons={isEditing ? [
          { icon: Trash2, onClick: () => setShowDeleteConfirm(true), variant: 'danger' }
        ] : []}
      />

      <div className="pt-20 px-6 max-w-lg mx-auto space-y-6 pb-8">
        
        <div className="text-center mb-2">
          <h1 className="text-2xl font-extrabold text-gray-800">
            {isEditing ? '编辑预算' : '新建预算'}
          </h1>
          <p className="text-gray-400 font-medium text-sm mt-1">
            {isEditing ? '修改预算信息' : '创建一个新的专项预算'}
          </p>
        </div>
        
        <div className="bg-white rounded-3xl p-6 shadow-sm space-y-6">
          
          <div>
            <label className="block text-gray-400 font-bold uppercase tracking-wider text-xs mb-3 ml-1">
              预算名称
            </label>
            <DuoInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：滑雪游"
              autoFocus
              multiline={true}
            />
          </div>
          
          <div>
            <label className="block text-gray-400 font-bold uppercase tracking-wider text-xs mb-3 ml-1">
              选择图标
            </label>
            <div className="grid grid-cols-6 gap-3">
              {iconKeys.map(key => {
                const config = FLOATING_ICONS[key];
                const IconComponent = config.icon;
                const isSelected = icon === key;
                
                return (
                  <button
                    key={key}
                    onClick={() => setIcon(key)}
                    className={`aspect-square rounded-2xl flex items-center justify-center transition-all active:scale-95 ${
                      isSelected 
                        ? 'ring-2 ring-offset-2 ring-cyan-500 scale-110' 
                        : 'hover:scale-105'
                    }`}
                    style={{ 
                      backgroundColor: config.color + '15',
                      borderWidth: 2,
                      borderColor: isSelected ? config.color : 'transparent'
                    }}
                  >
                    <div className="w-8 h-8">
                      <IconComponent className="w-full h-full" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          
          <div>
            <label className="block text-gray-400 font-bold uppercase tracking-wider text-xs mb-3 ml-1">
              日期范围（可选）
            </label>
            <div className="space-y-3">
              <div>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-gray-100 border-2 border-gray-200 rounded-2xl px-4 py-4 font-bold text-gray-700 text-base focus:outline-none focus:bg-white focus:border-cyan-400 transition-colors"
                  style={{ colorScheme: 'light', minHeight: '56px' }}
                />
                <p className="text-xs text-gray-300 mt-1 ml-1">开始日期</p>
              </div>
              
              <div>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-gray-100 border-2 border-gray-200 rounded-2xl px-4 py-4 font-bold text-gray-700 text-base focus:outline-none focus:bg-white focus:border-cyan-400 transition-colors"
                  style={{ colorScheme: 'light', minHeight: '56px' }}
                />
                <p className="text-xs text-gray-300 mt-1 ml-1">结束日期</p>
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-gray-400 font-bold uppercase tracking-wider text-xs mb-3 ml-1">
              首页显示
            </label>
            <button
              onClick={() => setPinnedToHome(!pinnedToHome)}
              className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all active:scale-[0.99] ${
                pinnedToHome 
                  ? 'border-cyan-500 bg-cyan-50' 
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <span className={`font-bold ${pinnedToHome ? 'text-cyan-600' : 'text-gray-600'}`}>
                固定到首页
              </span>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                pinnedToHome ? 'bg-cyan-500' : 'bg-gray-300'
              }`}>
                {pinnedToHome && <Check size={16} className="text-white" strokeWidth={3} />}
              </div>
            </button>
            <p className="text-xs text-gray-300 mt-2 ml-1">
              开启后，此预算将显示在首页，方便快速查看和记录
            </p>
          </div>
        </div>

        <DuoButton 
          onClick={handleSave}
          disabled={!name.trim() || isSaving}
          fullWidth
          size="lg"
        >
          {isSaving ? '保存中...' : '保存'}
        </DuoButton>
      </div>
      
      <ConfirmModal 
        isOpen={showDeleteConfirm} 
        title="删除预算" 
        message="确定要删除这个预算吗？所有明细记录也会被删除，此操作无法撤销。" 
        onConfirm={handleDelete} 
        onCancel={() => setShowDeleteConfirm(false)}
        confirmText="删除"
        confirmVariant="danger"
      />
      
      <LoadingOverlay isLoading={isSaving} />
    </PageContainer>
  );
};

export default EditSpecialBudgetView;