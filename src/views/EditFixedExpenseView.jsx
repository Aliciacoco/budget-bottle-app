// EditFixedExpenseView.jsx - 编辑固定支出页面
// 修复：日期选择器格式

import React, { useState } from 'react';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { createFixedExpense, updateFixedExpense, deleteFixedExpense } from '../api';

// 导入设计系统组件
import { 
  PageContainer,
  DuoButton,
  DuoInput,
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
  const [amount, setAmount] = useState(editingExpense?.amount?.toString() || '');
  const [expireDate, setExpireDate] = useState(editingExpense?.expireDate || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
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
      const amountNum = parseFloat(amount);
      let result;
      
      if (isNew) {
        result = await createFixedExpense(name, amountNum, expireDate, true);
      } else {
        result = await updateFixedExpense(editingExpense.id, name, amountNum, expireDate, true);
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
            />
          </div>
          
          {/* 金额输入 */}
          <div>
            <label className="block text-gray-400 font-bold uppercase tracking-wider text-xs mb-3 ml-1">金额</label>
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-2xl text-gray-300 font-bold">¥</span>
              <input 
                type="number" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)} 
                placeholder="0"
                className="w-full pl-12 pr-4 py-5 bg-gray-100 border-2 border-gray-200 rounded-2xl text-3xl font-extrabold text-gray-700 font-rounded focus:outline-none focus:bg-white focus:border-cyan-400 transition-colors"
              />
            </div>
          </div>
          
          {/* 到期日期 - 修复格式问题 */}
          <div>
            <label className="block text-gray-400 font-bold uppercase tracking-wider text-xs mb-3 ml-1">到期日期（可选）</label>
            <input 
              type="date" 
              value={expireDate} 
              onChange={(e) => setExpireDate(e.target.value)} 
              className="w-full bg-gray-100 border-2 border-gray-200 rounded-2xl px-4 py-4 font-bold text-gray-700 focus:outline-none focus:bg-white focus:border-cyan-400 transition-colors"
            />
            <p className="text-xs text-gray-300 mt-2 ml-1">留空表示无限期</p>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="space-y-3">
          <DuoButton 
            onClick={handleSave}
            disabled={!name || !amount || isLoading}
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
              删除这笔支出
            </DuoButton>
          )}
        </div>
      </div>

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