//专项预算详情页
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Edit, Plus, Trash2 } from 'lucide-react';
import { 
  getSpecialBudgetItems, 
  createSpecialBudgetItem, 
  updateSpecialBudgetItem, 
  deleteSpecialBudgetItem 
} from '../api';
import { BUDGET_ICONS } from '../constants/icons';
import Calculator from '../components/CalculatorModal';
import ConfirmModal from '../components/ConfirmModal';

const SpecialBudgetDetailView = ({ 
  budget, 
  items, 
  setItems, 
  navigateTo, 
  refreshBudgets 
}) => {
  const [localItems, setLocalItems] = useState(items || []);
  const [editingItemId, setEditingItemId] = useState(null);
  const [editingItemName, setEditingItemName] = useState('');
  const [showCalculator, setShowCalculator] = useState(false);
  const [calculatorTarget, setCalculatorTarget] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteItemConfirm, setShowDeleteItemConfirm] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState(null);
  
  const iconConfig = BUDGET_ICONS[budget.icon] || BUDGET_ICONS.other;
  const IconComponent = iconConfig.icon;
  const totalBudget = localItems.reduce((sum, item) => sum + (item.budgetAmount || 0), 0);
  const totalSpent = localItems.reduce((sum, item) => sum + (item.actualAmount || 0), 0);

  useEffect(() => { loadItems(); }, [budget.id]);

  const loadItems = async () => {
    setIsLoading(true);
    const result = await getSpecialBudgetItems(budget.id);
    if (result.success) { 
      setLocalItems(result.data); 
      setItems(prev => ({ ...prev, [budget.id]: result.data })); 
    }
    setIsLoading(false);
  };

  const handleAddItem = async () => {
    const result = await createSpecialBudgetItem(budget.id, '新项目', 0, 0);
    if (result.success) {
      const newItems = [...localItems, result.data];
      setLocalItems(newItems);
      setItems(prev => ({ ...prev, [budget.id]: newItems }));
      setEditingItemId(result.data.id);
      setEditingItemName(result.data.name);
    }
  };

  const handleUpdateItem = async (itemId, field, value) => {
    const item = localItems.find(i => i.id === itemId);
    if (!item) return;
    const updates = { ...item, [field]: value };
    const result = await updateSpecialBudgetItem(itemId, updates.name, updates.budgetAmount, updates.actualAmount);
    if (result.success) {
      const newItems = localItems.map(i => i.id === itemId ? result.data : i);
      setLocalItems(newItems);
      setItems(prev => ({ ...prev, [budget.id]: newItems }));
    }
  };

  const handleDeleteItem = async (itemId) => {
    const result = await deleteSpecialBudgetItem(itemId);
    if (result.success) {
      const newItems = localItems.filter(i => i.id !== itemId);
      setLocalItems(newItems);
      setItems(prev => ({ ...prev, [budget.id]: newItems }));
    }
    setShowDeleteItemConfirm(false);
    setDeletingItemId(null);
  };

  const openCalculator = (itemId, field, currentValue) => { 
    setCalculatorTarget({ itemId, field, currentValue }); 
    setShowCalculator(true); 
  };
  
  const handleCalculatorConfirm = (value) => { 
    if (calculatorTarget) handleUpdateItem(calculatorTarget.itemId, calculatorTarget.field, value); 
  };
  
  const startEditingName = (item) => { 
    setEditingItemId(item.id); 
    setEditingItemName(item.name); 
  };
  
  const saveItemName = (itemId) => { 
    if (editingItemName.trim()) handleUpdateItem(itemId, 'name', editingItemName.trim()); 
    setEditingItemId(null); 
    setEditingItemName(''); 
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white p-6 pb-4">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => window.history.back()} className="text-gray-600 active:scale-95">
            <ArrowLeft size={24} />
          </button>
          <div className="flex-1 flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center" 
              style={{ backgroundColor: `${iconConfig.color}15` }}
            >
              <IconComponent size={20} style={{ color: iconConfig.color }} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                {budget.name}
                <button 
                  onClick={() => navigateTo('editSpecialBudget', { editingSpecialBudget: budget })} 
                  className="text-gray-400"
                >
                  <Edit size={16} />
                </button>
              </h1>
              <p className="text-sm text-gray-400">
                预算 ¥{totalBudget.toLocaleString()}，已用 ¥{totalSpent.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* 项目列表 */}
      <div className="p-6">
        {isLoading ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800 mx-auto"></div>
            <p className="text-gray-400 mt-4">加载中...</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl overflow-hidden">
            <div className="grid grid-cols-4 px-5 py-3 bg-gray-50 text-sm text-gray-500">
              <span>项目</span>
              <span className="text-center">预算</span>
              <span className="text-center">支出</span>
              <span className="text-right">操作</span>
            </div>
            {localItems.map(item => (
              <div key={item.id} className="grid grid-cols-4 items-center px-5 py-4 border-b border-gray-100">
                {editingItemId === item.id ? (
                  <>
                    <input 
                      type="text" 
                      value={editingItemName} 
                      onChange={(e) => setEditingItemName(e.target.value)} 
                      onBlur={() => saveItemName(item.id)} 
                      onKeyDown={(e) => { if (e.key === 'Enter') saveItemName(item.id); }} 
                      className="border-b border-cyan-500 focus:outline-none text-gray-800 bg-transparent" 
                      autoFocus 
                    />
                    <div 
                      className="text-center text-gray-400 cursor-pointer" 
                      onClick={() => openCalculator(item.id, 'budgetAmount', item.budgetAmount)}
                    >
                      ¥{item.budgetAmount || 0}
                    </div>
                    <div 
                      className="text-center text-red-500 font-medium cursor-pointer" 
                      onClick={() => openCalculator(item.id, 'actualAmount', item.actualAmount)}
                    >
                      ¥{item.actualAmount || 0}
                    </div>
                    <div className="flex items-center justify-end">
                      <button 
                        onClick={() => { setDeletingItemId(item.id); setShowDeleteItemConfirm(true); }} 
                        className="text-red-400 p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <span 
                      className="text-gray-800 cursor-pointer" 
                      onClick={() => startEditingName(item)}
                    >
                      {item.name}
                    </span>
                    <span 
                      className="text-center text-gray-400 cursor-pointer" 
                      onClick={() => openCalculator(item.id, 'budgetAmount', item.budgetAmount)}
                    >
                      ¥{item.budgetAmount || '-'}
                    </span>
                    <span 
                      className={`text-center font-medium cursor-pointer ${item.actualAmount ? 'text-red-500' : 'text-gray-300'}`} 
                      onClick={() => openCalculator(item.id, 'actualAmount', item.actualAmount)}
                    >
                      {item.actualAmount ? `¥${item.actualAmount}` : '-'}
                    </span>
                    <div className="flex items-center justify-end">
                      <button 
                        onClick={() => { setDeletingItemId(item.id); setShowDeleteItemConfirm(true); }} 
                        className="text-gray-300 hover:text-red-400 p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
            <button 
              onClick={handleAddItem} 
              className="w-full py-4 text-gray-400 flex items-center justify-center gap-2 active:bg-gray-50"
            >
              <Plus size={18} />添加项目
            </button>
          </div>
        )}
      </div>
      
      {showCalculator && (
        <Calculator 
          value={calculatorTarget?.currentValue || 0} 
          onChange={handleCalculatorConfirm} 
          onClose={() => setShowCalculator(false)} 
        />
      )}
      
      <ConfirmModal 
        isOpen={showDeleteItemConfirm} 
        title="删除项目" 
        message="确定要删除这个项目吗？此操作无法撤销。" 
        onConfirm={() => handleDeleteItem(deletingItemId)} 
        onCancel={() => { setShowDeleteItemConfirm(false); setDeletingItemId(null); }} 
      />
    </div>
  );
};

export default SpecialBudgetDetailView;