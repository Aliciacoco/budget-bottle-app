// EditFixedExpenseView.jsx - 编辑固定支出页面
// 修复：使用统一的 AmountInput 组件

import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { createFixedExpense, updateFixedExpense, deleteFixedExpense } from '../api';
import Calculator from '../components/CalculatorModal';

// 导入设计系统组件
import { 
  PageContainer,
  TransparentNavBar,
  DuoButton,
  DuoInput,
  AmountInput,  // 新增：统一的金额输入组件
  ConfirmModal,
  LoadingOverlay
} from '../components/design-system';

const EditFixedExpenseView = ({ 
  editingExpense,
  fixedExpenses,
  setFixedExpenses,
  onBack
}) => {
  const isNew = !editingExpense?.id;
  
  const [name, setName] = useState(editingExpense?.name || '');
  const [amount, setAmount] = useState(editingExpense?.amount || 0);
  const [expireDate, setExpireDate] = useState(editingExpense?.expireDate || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.back();
    }
  };

  const handleSave = async () => {
    if (!name || !amount) return;
    
    setIsLoading(true);
    try {
      let result;
      
      if (isNew) {
        result = await createFixedExpense(name, amount, expireDate, true);
      } else {
        result = await updateFixedExpense(editingExpense.id, name, amount, expireDate, true);
      }
      
      if (result.success) {
        if (isNew) {
          setFixedExpenses([...fixedExpenses, result.data]);
        } else {
          setFixedExpenses(fixedExpenses.map(e => e.id === editingExpense.id ? result.data : e));
        }
        handleBack();
      } else {
        alert('保存失败: ' + result.error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!editingExpense?.id) return;
    
    setShowDeleteConfirm(false);
    setIsLoading(true);
    try {
      const result = await deleteFixedExpense(editingExpense.id);
      if (result.success) {
        setFixedExpenses(fixedExpenses.filter(e => e.id !== editingExpense.id));
        handleBack();
      } else {
        alert('删除失败: ' + result.error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAmountChange = (newAmount) => {
    setAmount(newAmount);
    setShowCalculator(false);
  };

  return (
    <PageContainer bg="gray">
      {/* 导航栏 - 编辑模式显示删除按钮在右上角 */}
      <TransparentNavBar
        onBack={handleBack}
        rightButtons={!isNew ? [
          { icon: Trash2, onClick: () => setShowDeleteConfirm(true), variant: 'danger' }
        ] : []}
      />

      {/* 主内容区 */}
      <div className="pt-20 px-6 max-w-lg mx-auto space-y-6 pb-8">
        
        {/* 页面标题 */}
        <div className="text-center mb-2">
          <h1 className="text-2xl font-extrabold text-gray-800">
            {isNew ? '添加固定支出' : '编辑固定支出'}
          </h1>
          <p className="text-gray-400 font-medium text-sm mt-1">
            {isNew ? '添加每月固定的支出项目' : '修改这笔固定支出'}
          </p>
        </div>

        {/* 表单卡片 */}
        <div className="bg-white rounded-3xl p-6 shadow-sm space-y-5">
          
          {/* 名称输入 */}
          <div>
            <label className="block text-gray-400 font-bold uppercase tracking-wider text-xs mb-3 ml-1">名称</label>
            <DuoInput
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="例如：房租、水电费..."
              autoFocus={isNew}
              multiline={true}
            />
          </div>
          
          {/* 金额输入 - 使用统一的 AmountInput 组件（计算器模式） */}
          <div>
            <label className="block text-gray-400 font-bold uppercase tracking-wider text-xs mb-3 ml-1">金额</label>
            <AmountInput
              value={amount || 0}
              onClick={() => setShowCalculator(true)}
            />
          </div>
          
          {/* 到期日期 */}
          <div>
            <label className="block text-gray-400 font-bold uppercase tracking-wider text-xs mb-3 ml-1">到期日期（可选）</label>
            <input 
              type="date" 
              value={expireDate} 
              onChange={(e) => setExpireDate(e.target.value)} 
              className="w-full bg-gray-100 border-2 border-gray-200 rounded-2xl px-4 py-4 font-bold text-gray-700 focus:outline-none focus:bg-white focus:border-cyan-400 transition-colors text-base"
              style={{ 
                colorScheme: 'light',
                maxWidth: '100%',
                boxSizing: 'border-box',
                minHeight: '56px'
              }}
            />
            <p className="text-xs text-gray-300 mt-2 ml-1">留空表示无限期</p>
          </div>
        </div>

        {/* 保存按钮 */}
        <DuoButton 
          onClick={handleSave}
          disabled={!name || !amount || isLoading}
          fullWidth
          size="lg"
        >
          {isLoading ? '保存中...' : '保存'}
        </DuoButton>
      </div>

      {/* 计算器弹窗 */}
      {showCalculator && (
        <Calculator
          value={amount}
          onChange={handleAmountChange}
          onClose={() => setShowCalculator(false)}
          title="输入金额"
          showNote={false}
        />
      )}

      {/* 删除确认弹窗 */}
      <ConfirmModal 
        isOpen={showDeleteConfirm} 
        title="删除固定支出" 
        message="确定要删除这笔固定支出吗？此操作无法撤销。" 
        onConfirm={handleDelete} 
        onCancel={() => setShowDeleteConfirm(false)}
        confirmText="删除"
        confirmVariant="danger"
      />
      
      <LoadingOverlay isLoading={isLoading} />
    </PageContainer>
  );
};

export default EditFixedExpenseView;