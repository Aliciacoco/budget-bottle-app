// EditSpecialBudgetItemView.jsx - 编辑预算明细
// 修复：夸克浏览器删除问题 - 使用乐观更新

import React, { useState, useEffect, useCallback } from 'react';
import { Trash2, Plus } from 'lucide-react';
import { 
  createSpecialBudgetItem, 
  updateSpecialBudgetItem, 
  deleteSpecialBudgetItem,
  getSpecialBudgetTransactions,
  createSpecialBudgetTransaction,
  updateSpecialBudgetTransaction,
  deleteSpecialBudgetTransaction
} from '../apiSelector';
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

const formatDisplayDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}月${day}日`;
};

const getTodayString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const EditSpecialBudgetItemView = ({ 
  editingItem = null,
  budgetId,
  iconColor = '#06B6D4',
  onBack
}) => {
  const isEditing = !!editingItem?.id;
  
  const [name, setName] = useState(editingItem?.name || '');
  const [budgetAmount, setBudgetAmount] = useState(editingItem?.budgetAmount || 0);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const [transactions, setTransactions] = useState([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  
  const [showBudgetCalculator, setShowBudgetCalculator] = useState(false);
  const [showTransactionCalculator, setShowTransactionCalculator] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [transactionNote, setTransactionNote] = useState('');
  
  const [showDeleteTransactionConfirm, setShowDeleteTransactionConfirm] = useState(false);
  const [deletingTransaction, setDeletingTransaction] = useState(null);
  
  const actualAmount = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  const remaining = budgetAmount - actualAmount;
  
  const loadTransactions = useCallback(async () => {
    if (!editingItem?.id) return;
    
    setIsLoadingTransactions(true);
    try {
      const result = await getSpecialBudgetTransactions(editingItem.id);
      if (result.success) {
        setTransactions(result.data);
      }
    } catch (error) {
      console.error('加载消费记录失败:', error);
    } finally {
      setIsLoadingTransactions(false);
    }
  }, [editingItem?.id]);
  
  useEffect(() => {
    if (isEditing) {
      loadTransactions();
    }
  }, [isEditing, loadTransactions]);
  
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
          budgetAmount || 0,
          actualAmount
        );
      } else {
        result = await createSpecialBudgetItem(
          budgetId,
          name.trim(),
          budgetAmount || 0,
          0
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
  
  // 【核心修复】乐观更新删除明细
  const handleDelete = async () => {
    if (!editingItem?.id) return;
    
    const itemId = editingItem.id;
    
    setShowDeleteConfirm(false);
    
    // 立即返回
    handleBack();
    
    // 后台静默删除
    try {
      for (const t of transactions) {
        await deleteSpecialBudgetTransaction(t.id);
      }
      await deleteSpecialBudgetItem(itemId);
      console.log('✅ 明细删除成功');
    } catch (error) {
      console.warn('删除请求未完成:', error);
    }
  };
  
  const openAddTransaction = () => {
    setEditingTransaction(null);
    setTransactionNote('');
    setShowTransactionCalculator(true);
  };
  
  const openEditTransaction = (transaction) => {
    setEditingTransaction(transaction);
    setTransactionNote(transaction.description || '');
    setShowTransactionCalculator(true);
  };
  
  const handleSaveTransaction = async (amount, note) => {
    if (!amount || amount <= 0) return;
    
    setIsSaving(true);
    try {
      let result;
      const today = getTodayString();
      
      if (editingTransaction) {
        result = await updateSpecialBudgetTransaction(
          editingTransaction.id,
          amount,
          note || '',
          editingTransaction.date || today
        );
        if (result.success) {
          setTransactions(transactions.map(t => 
            t.id === editingTransaction.id ? result.data : t
          ));
        }
      } else {
        result = await createSpecialBudgetTransaction(
          editingItem.id,
          amount,
          note || '',
          today
        );
        if (result.success) {
          setTransactions([result.data, ...transactions]);
        }
      }
      
      if (!result.success) {
        alert('保存失败: ' + result.error);
      }
      
      const newActual = editingTransaction
        ? transactions.reduce((sum, t) => sum + (t.id === editingTransaction.id ? amount : t.amount), 0)
        : actualAmount + amount;
      
      await updateSpecialBudgetItem(
        editingItem.id,
        name.trim(),
        budgetAmount,
        newActual
      );
      
    } finally {
      setIsSaving(false);
      setShowTransactionCalculator(false);
      setEditingTransaction(null);
    }
  };
  
  // 【核心修复】乐观更新删除消费记录
  const handleDeleteTransaction = async () => {
    if (!deletingTransaction) return;
    
    const transactionId = deletingTransaction.id;
    const transactionAmount = deletingTransaction.amount || 0;
    
    setShowDeleteTransactionConfirm(false);
    setDeletingTransaction(null);
    
    // 1. 立即更新本地状态
    const newTransactions = transactions.filter(t => t.id !== transactionId);
    setTransactions(newTransactions);
    
    // 2. 后台静默删除
    try {
      await deleteSpecialBudgetTransaction(transactionId);
      
      const newActual = newTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
      await updateSpecialBudgetItem(
        editingItem.id,
        name.trim(),
        budgetAmount,
        newActual
      );
      console.log('✅ 消费记录删除成功');
    } catch (error) {
      console.warn('删除请求未完成:', error);
    }
  };
  
  const handleBudgetAmountChange = (newAmount) => {
    setBudgetAmount(newAmount);
    setShowBudgetCalculator(false);
  };
  
  return (
    <PageContainer bg="gray">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@400;500;700;800&display=swap');
        .font-rounded { font-family: 'M PLUS Rounded 1c', sans-serif; }
      `}</style>

      <TransparentNavBar
        onBack={handleBack}
        rightButtons={isEditing ? [
          { icon: Trash2, onClick: () => setShowDeleteConfirm(true), variant: 'danger' }
        ] : []}
      />

      <div className="pt-20 px-6 max-w-lg mx-auto space-y-6 pb-32">
        
        <div className="text-center mb-2">
          <h1 className="text-2xl font-extrabold text-gray-800">
            {isEditing ? '编辑明细' : '添加明细'}
          </h1>
          <p className="text-gray-400 font-medium text-sm mt-1">
            {isEditing ? '记录每笔消费，清晰掌握花销' : '添加一项新的预算明细'}
          </p>
        </div>
        
        <div className="bg-white rounded-3xl p-6 shadow-sm space-y-5">
          
          <div>
            <label className="block text-gray-400 font-bold uppercase tracking-wider text-xs mb-3 ml-1">
              明细名称
            </label>
            <DuoInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：机票、酒店、门票..."
              autoFocus={!isEditing}
              multiline={true}
            />
          </div>
          
          <div>
            <label className="block text-gray-400 font-bold uppercase tracking-wider text-xs mb-3 ml-1">
              预算金额
            </label>
            <AmountInput
              value={budgetAmount}
              onClick={() => setShowBudgetCalculator(true)}
            />
          </div>
          
          {isEditing && (
            <div 
              className="rounded-2xl p-4"
              style={{ backgroundColor: iconColor + '10' }}
            >
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-gray-400 font-bold mb-1">预算</p>
                  <p className="text-lg font-extrabold font-rounded" style={{ color: iconColor }}>
                    ¥{budgetAmount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold mb-1">已花</p>
                  <p className="text-lg font-extrabold font-rounded text-amber-500">
                    ¥{actualAmount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold mb-1">剩余</p>
                  <p className={`text-lg font-extrabold font-rounded ${remaining >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    ¥{remaining.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {isEditing && (
          <div className="bg-white rounded-3xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-extrabold text-gray-700">消费记录</h2>
              <button 
                onClick={openAddTransaction}
                className="font-bold text-sm flex items-center gap-1 active:scale-95 transition-all"
                style={{ color: iconColor }}
              >
                <Plus size={18} strokeWidth={3} /> 记一笔
              </button>
            </div>
            
            {isLoadingTransactions ? (
              <div className="flex justify-center py-8">
                <div 
                  className="animate-spin rounded-full h-6 w-6 border-3 border-t-transparent"
                  style={{ borderColor: iconColor + '40', borderTopColor: iconColor }}
                />
              </div>
            ) : transactions.length === 0 ? (
              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center">
                <p className="text-gray-400 font-bold mb-1">还没有消费记录</p>
                <p className="text-gray-300 text-sm">点击"记一笔"添加消费</p>
              </div>
            ) : (
              <div className="space-y-2">
                {transactions.map(transaction => (
                  <div 
                    key={transaction.id}
                    className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between cursor-pointer active:bg-gray-100 active:scale-[0.99] transition-all"
                    onClick={() => openEditTransaction(transaction)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-700 truncate">
                          {transaction.description || '消费'}
                        </span>
                        <span className="text-xs text-gray-300 flex-shrink-0">
                          {formatDisplayDate(transaction.date)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-extrabold font-rounded" style={{ color: iconColor }}>
                        ¥{transaction.amount.toLocaleString()}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingTransaction(transaction);
                          setShowDeleteTransactionConfirm(true);
                        }}
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={16} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-gray-50 via-gray-50 to-transparent">
        <div className="max-w-lg mx-auto">
          <DuoButton 
            onClick={handleSave}
            disabled={!name.trim() || isSaving}
            fullWidth
            size="lg"
          >
            {isSaving ? '保存中...' : '保存'}
          </DuoButton>
        </div>
      </div>
      
      {showBudgetCalculator && (
        <Calculator
          value={budgetAmount}
          onChange={handleBudgetAmountChange}
          onClose={() => setShowBudgetCalculator(false)}
          title="预算金额"
          showNote={false}
        />
      )}
      
      {showTransactionCalculator && (
        <Calculator
          value={editingTransaction?.amount || 0}
          onChange={handleSaveTransaction}
          onClose={() => {
            setShowTransactionCalculator(false);
            setEditingTransaction(null);
          }}
          title={editingTransaction ? '编辑消费' : '记一笔消费'}
          showNote={true}
          noteValue={transactionNote}
          onNoteChange={setTransactionNote}
        />
      )}
      
      <ConfirmModal 
        isOpen={showDeleteConfirm} 
        title="删除明细" 
        message="确定要删除这项预算明细吗？所有消费记录也会被删除，此操作无法撤销。" 
        onConfirm={handleDelete} 
        onCancel={() => setShowDeleteConfirm(false)}
        confirmText="删除"
        confirmVariant="danger"
      />
      
      <ConfirmModal 
        isOpen={showDeleteTransactionConfirm} 
        title="删除消费记录" 
        message={`确定要删除这笔 ¥${deletingTransaction?.amount || 0} 的消费记录吗？`}
        onConfirm={handleDeleteTransaction} 
        onCancel={() => {
          setShowDeleteTransactionConfirm(false);
          setDeletingTransaction(null);
        }}
        confirmText="删除"
        confirmVariant="danger"
      />
      
      <LoadingOverlay isLoading={isSaving} />
    </PageContainer>
  );
};

export default EditSpecialBudgetItemView;