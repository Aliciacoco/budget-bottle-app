// EditTransactionView.jsx - 编辑消费页面

import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { updateTransaction, deleteTransaction } from '../api';
import Calculator from '../components/CalculatorModal';

import { 
  PageContainer,
  TransparentNavBar,
  DuoButton,
  DuoInput,
  AmountInput,
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
  const [amount, setAmount] = useState(editingTransaction?.amount || 0);
  const [description, setDescription] = useState(editingTransaction?.description || '');
  const [date, setDate] = useState(editingTransaction?.date?.replace(/\//g, '-') || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  
  // 统一 Loading 状态，避免混乱
  const [isLoading, setIsLoading] = useState(false); 
  const [loadingText, setLoadingText] = useState(''); // 新增：用于显示是“保存中”还是“删除中”

  if (!editingTransaction) return null;

  // --- 修改保存逻辑 ---
  const handleSubmit = async () => {
    if (!amount) return;
    setIsLoading(true);
    setLoadingText('保存中...');
    
    try {
      const result = await updateTransaction(
        editingTransaction.id, 
        weekInfo.weekKey, 
        amount, 
        description, 
        date.replace(/-/g, '/')
      );
      
      if (result.success) {
        // 更新本地列表
        const updater = t => t.id === editingTransaction.id ? result.data : t;
        setTransactions(prev => prev.map(updater));
        setViewingTransactions(prev => prev.map(updater));
        
        // 成功后返回
        window.history.back();
      } else { 
        alert('保存失败: ' + (result.error || '未知错误')); 
      }
    } catch (error) {
      alert('网络错误，请检查连接');
    } finally {
      setIsLoading(false);
    }
  };

  // --- 【关键修复】删除逻辑：改为等待服务器响应 ---
  const handleDelete = async () => {
    if (!editingTransaction?.id) return;
    const transactionId = editingTransaction.id;
    
    // 1. 关闭确认弹窗，开启全屏 Loading
    setShowDeleteConfirm(false);
    setIsLoading(true);
    setLoadingText('正在删除...'); // 给用户明确反馈，正在和服务器通信
    
    try {
      // 2. 【关键】等待服务器真正的响应 (Await)
      // 注意：确保你的 api.js 中 deleteTransaction 返回了 { success: true/false }
      const result = await deleteTransaction(transactionId);
      
      // 3. 只有服务器说 OK 了，我们才更新界面
      if (result && result.success) {
        
        // 更新父组件状态（让上一页的列表移除这项）
        setTransactions(prev => prev.filter(t => t.id !== transactionId));
        setViewingTransactions(prev => prev.filter(t => t.id !== transactionId));

        // 4. (可选) 给一个极其短暂的延迟确保 React 状态更新完毕，然后跳转
        // 这里的延迟是为了视觉平滑，而不是为了等待请求
        setTimeout(() => {
          window.history.back();
        }, 100);

      } else {
        // 服务器返回了错误（比如 500 或 403）
        throw new Error(result.error || '删除失败');
      }
    } catch (error) {
      // 5. 异常处理：如果不幸失败，不仅不跳转，还要告诉用户
      console.error('删除请求失败:', error);
      setIsLoading(false); // 关闭 Loading，让用户留在页面上
      alert('删除失败：服务器未响应或网络中断，请重试。');
    }
  };

  const handleAmountChange = (newAmount) => {
    setAmount(newAmount);
    setShowCalculator(false);
  };

  return (
    <PageContainer bg="gray">
      <TransparentNavBar
        onBack={() => window.history.back()}
        rightButtons={[
          { icon: Trash2, onClick: () => setShowDeleteConfirm(true), variant: 'danger' }
        ]}
      />

      <div className="pt-20 px-6 max-w-lg mx-auto space-y-6 pb-8">
        
        <div className="text-center mb-2">
          <h1 className="text-2xl font-extrabold text-gray-800">编辑消费</h1>
          <p className="text-gray-400 font-medium text-sm mt-1">修改这笔消费记录</p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm space-y-5">
          
          <div>
            <label className="block text-gray-400 font-bold uppercase tracking-wider text-xs mb-3 ml-1">金额</label>
            <AmountInput
              value={amount}
              onClick={() => setShowCalculator(true)}
            />
          </div>
          
          <div>
            <label className="block text-gray-400 font-bold uppercase tracking-wider text-xs mb-3 ml-1">备注</label>
            <DuoInput
              type="text" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="例如：超市、外卖..."
            />
          </div>
          
          <div>
            <label className="block text-gray-400 font-bold uppercase tracking-wider text-xs mb-3 ml-1">日期</label>
            <input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)} 
              className="w-full bg-gray-100 border-2 border-gray-200 rounded-2xl px-4 py-4 font-bold text-gray-700 focus:outline-none focus:bg-white focus:border-cyan-400 transition-colors min-h-[56px]"
              style={{ colorScheme: 'light' }}
            />
          </div>
        </div>

        <DuoButton 
          onClick={handleSubmit}
          disabled={!amount || isLoading}
          fullWidth
          size="lg"
        >
          保存修改
        </DuoButton>
      </div>

      {showCalculator && (
        <Calculator
          value={amount}
          onChange={handleAmountChange}
          onClose={() => setShowCalculator(false)}
          title="输入金额"
          showNote={false}
        />
      )}

      <ConfirmModal 
        isOpen={showDeleteConfirm} 
        title="删除消费记录" 
        message="确定要删除这条消费记录吗？此操作无法撤销。" 
        onConfirm={handleDelete} 
        onCancel={() => setShowDeleteConfirm(false)}
        confirmText="删除"
        confirmVariant="danger"
      />
      
      {/* 统一的 Loading 遮罩，既用于保存也用于删除 */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl px-8 py-6 flex flex-col items-center gap-4 shadow-xl">
            <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-600 font-bold text-sm">{loadingText}</span>
          </div>
        </div>
      )}
      
    </PageContainer>
  );
};

export default EditTransactionView;