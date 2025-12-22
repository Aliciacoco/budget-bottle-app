// EditSpecialBudgetItemView.jsx - 编辑预算明细
// 修复：1. 删除按钮移到右上角 2. 名称输入支持多行自动增高

import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { 
  createSpecialBudgetItem, 
  updateSpecialBudgetItem, 
  deleteSpecialBudgetItem,
  getSpecialBudgetItems
} from '../api';

// 导入设计系统组件
import { 
  PageContainer,
  TransparentNavBar,
  DuoButton,
  DuoInput,
  ConfirmModal,
  LoadingOverlay
} from '../components/design-system';

const EditSpecialBudgetItemView = ({ 
  editingItem = null,
  budgetId,
  iconColor = '#06B6D4',
  onBack
}) => {
  const isEditing = !!editingItem?.id;
  
  const [name, setName] = useState(editingItem?.name || '');
  const [budgetAmount, setBudgetAmount] = useState(editingItem?.budgetAmount?.toString() || '');
  const [actualAmount, setActualAmount] = useState(editingItem?.actualAmount?.toString() || '');
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.back();
    }
  };
  
  const handleSave = async () => {
    if (!name.trim()) {
      alert('请输入明细名称');
      return;
    }
    
    setIsSaving(true);
    try {
      let result;
      if (isEditing) {
        result = await updateSpecialBudgetItem(
          editingItem.id,
          name.trim(),
          parseFloat(budgetAmount) || 0,
          parseFloat(actualAmount) || 0
        );
      } else {
        result = await createSpecialBudgetItem(
          budgetId,
          name.trim(),
          parseFloat(budgetAmount) || 0,
          parseFloat(actualAmount) || 0
        );
      }
      
      if (result.success) {
        handleBack();
      } else {
        alert('保存失败: ' + result.error);
      }
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleDelete = async () => {
    setShowDeleteConfirm(false);
    setIsSaving(true);
    try {
      const result = await deleteSpecialBudgetItem(editingItem.id);
      if (result.success) {
        handleBack();
      } else {
        alert('删除失败: ' + result.error);
      }
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <PageContainer bg="gray">
      {/* 导航栏 - 编辑模式显示删除按钮 */}
      <TransparentNavBar
        onBack={handleBack}
        rightButtons={isEditing ? [
          { icon: Trash2, onClick: () => setShowDeleteConfirm(true), variant: 'danger' }
        ] : []}
      />

      {/* 主内容区 */}
      <div className="pt-20 px-6 max-w-lg mx-auto space-y-6 pb-8">
        
        {/* 页面标题 */}
        <div className="text-center mb-2">
          <h1 className="text-2xl font-extrabold text-gray-800">
            {isEditing ? '编辑明细' : '添加明细'}
          </h1>
          <p className="text-gray-400 font-medium text-sm mt-1">
            {isEditing ? '修改这项预算明细' : '添加一项新的预算明细'}
          </p>
        </div>
        
        {/* 表单卡片 */}
        <div className="bg-white rounded-3xl p-6 shadow-sm space-y-5">
          
          {/* 名称输入 - 支持多行自动增高 */}
          <div>
            <label className="block text-gray-400 font-bold uppercase tracking-wider text-xs mb-3 ml-1">
              明细名称
            </label>
            <DuoInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：机票、酒店、门票..."
              autoFocus
              multiline={true}
            />
          </div>
          
          {/* 预算金额 */}
          <div>
            <label className="block text-gray-400 font-bold uppercase tracking-wider text-xs mb-3 ml-1">
              预算金额
            </label>
            <DuoInput
              type="number"
              value={budgetAmount}
              onChange={(e) => setBudgetAmount(e.target.value)}
              placeholder="0"
              prefix="¥"
              size="lg"
            />
            <p className="text-xs text-gray-300 mt-1 ml-1">计划花费的金额</p>
          </div>
          
          {/* 实际金额 */}
          <div>
            <label className="block text-gray-400 font-bold uppercase tracking-wider text-xs mb-3 ml-1">
              实际金额
            </label>
            <DuoInput
              type="number"
              value={actualAmount}
              onChange={(e) => setActualAmount(e.target.value)}
              placeholder="0"
              prefix="¥"
              size="lg"
            />
            <p className="text-xs text-gray-300 mt-1 ml-1">实际花费的金额（可后续填写）</p>
          </div>
        </div>

        {/* 保存按钮 */}
        <DuoButton 
          onClick={handleSave}
          disabled={!name.trim() || isSaving}
          fullWidth
          size="lg"
        >
          {isSaving ? '保存中...' : '保存'}
        </DuoButton>
      </div>
      
      {/* 删除确认弹窗 */}
      <ConfirmModal 
        isOpen={showDeleteConfirm} 
        title="删除明细" 
        message="确定要删除这项预算明细吗？此操作无法撤销。" 
        onConfirm={handleDelete} 
        onCancel={() => setShowDeleteConfirm(false)}
        confirmText="删除"
        confirmVariant="danger"
      />
      
      <LoadingOverlay isLoading={isSaving} />
    </PageContainer>
  );
};

export default EditSpecialBudgetItemView;