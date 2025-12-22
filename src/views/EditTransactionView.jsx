// EditTransactionView.jsx - 编辑消费页面
// 修复：删除按钮移到页面右上角

import React, { useState } from 'react';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { updateTransaction, deleteTransaction } from '../api';

// 导入设计系统组件
import { 
  PageContainer,
  TransparentNavBar,
  DuoButton,
  DuoInput,
  ConfirmModal,
  LoadingOverlay
} from '../components/design-system';

const EditTransactionView = ({ 
  editingTransaction, 
  weekInfo, 
  transactions, 
  setTransactions, 
  viewingTransactions, 
  setViewingTransactions 
}) => {
  const [amount, setAmount] = useState(editingTransaction?.amount?.toString() || '');
  const [description, setDescription] = useState(editingTransaction?.description || '');
  const [date, setDate] = useState(editingTransaction?.date?.replace(/\//g, '-') || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!editingTransaction) return null;

  const handleSubmit = async () => {
    if (!amount) return;
    setIsLoading(true);
    try {
      const result = await updateTransaction(
        editingTransaction.id, 
        weekInfo.weekKey, 
        parseFloat(amount), 
        description, 
        date.replace(/-/g, '/')
      );
      if (result.success) {
        setTransactions(transactions.map(t => t.id === editingTransaction.id ? result.data : t));
        setViewingTransactions(viewingTransactions.map(t => t.id === editingTransaction.id ? result.data : t));
        window.history.back();
      } else { 
        alert('保存失败: ' + result.error); 
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setShowDeleteConfirm(false);
    setIsLoading(true);
    try {
      const result = await deleteTransaction(editingTransaction.id);
      if (result.success) {
        setTransactions(transactions.filter(t => t.id !== editingTransaction.id));
        setViewingTransactions(viewingTransactions.filter(t => t.id !== editingTransaction.id));
        window.history.back();
      } else { 
        alert('删除失败: ' + result.error); 
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageContainer bg="gray">
      {/* 导航栏 - 删除按钮在右上角 */}
      <TransparentNavBar
        onBack={() => window.history.back()}
        rightButtons={[
          { icon: Trash2, onClick: () => setShowDeleteConfirm(true), variant: 'danger' }
        ]}
      />

      {/* 主内容区 */}
      <div className="pt-20 px-6 max-w-lg mx-auto space-y-6 pb-8">
        
        {/* 页面标题 */}
        <div className="text-center mb-2">
          <h1 className="text-2xl font-extrabold text-gray-800">编辑消费</h1>
          <p className="text-gray-400 font-medium text-sm mt-1">修改这笔消费记录</p>
        </div>

        {/* 表单卡片 */}
        <div className="bg-white rounded-3xl p-6 shadow-sm space-y-5">
          
          {/* 金额输入 - 突出显示 */}
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
          
          {/* 备注输入 */}
          <div>
            <label className="block text-gray-400 font-bold uppercase tracking-wider text-xs mb-3 ml-1">备注</label>
            <DuoInput
              type="text" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="例如：超市、外卖..."
            />
          </div>
          
          {/* 日期选择 */}
          <div>
            <label className="block text-gray-400 font-bold uppercase tracking-wider text-xs mb-3 ml-1">日期</label>
            <input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)} 
              className="w-full bg-gray-100 border-2 border-gray-200 rounded-2xl px-4 py-3 font-bold text-gray-700 focus:outline-none focus:bg-white focus:border-cyan-400 transition-colors"
              style={{ colorScheme: 'light' }}
            />
          </div>
        </div>

        {/* 保存按钮 */}
        <DuoButton 
          onClick={handleSubmit}
          disabled={!amount || isLoading}
          fullWidth
          size="lg"
        >
          {isLoading ? '保存中...' : '保存修改'}
        </DuoButton>
      </div>

      {/* 删除确认弹窗 */}
      <ConfirmModal 
        isOpen={showDeleteConfirm} 
        title="删除消费记录" 
        message="确定要删除这条消费记录吗？此操作无法撤销。" 
        onConfirm={handleDelete} 
        onCancel={() => setShowDeleteConfirm(false)}
        confirmText="删除"
        confirmVariant="danger"
      />
      
      <LoadingOverlay isLoading={isLoading} />
    </PageContainer>
  );
};

export default EditTransactionView;