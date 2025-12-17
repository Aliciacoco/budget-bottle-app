//编辑专项预算页

import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { createSpecialBudget, updateSpecialBudget, deleteSpecialBudget } from '../api';
import { BUDGET_ICONS } from '../constants/icons';
import ConfirmModal from '../components/ConfirmModal';

const EditSpecialBudgetView = ({ 
  budget, 
  specialBudgets, 
  setSpecialBudgets, 
  refreshBudgets 
}) => {
  const isNew = !budget?.id;
  const [name, setName] = useState(budget?.name || '');
  const [icon, setIcon] = useState(budget?.icon || 'travel');
  const [totalBudget, setTotalBudget] = useState(budget?.totalBudget?.toString() || '');
  const [pinnedToHome, setPinnedToHome] = useState(budget?.pinnedToHome || false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSubmit = async () => {
    if (!name) return;
    let result;
    if (isNew) { 
      result = await createSpecialBudget(name, icon, parseFloat(totalBudget) || 0, '', '', pinnedToHome); 
    } else { 
      result = await updateSpecialBudget(
        budget.id, 
        name, 
        icon, 
        parseFloat(totalBudget) || budget.totalBudget || 0, 
        budget.startDate || '', 
        budget.endDate || '', 
        pinnedToHome
      ); 
    }
    if (result.success) { 
      await refreshBudgets(); 
      window.history.back(); 
    } else { 
      alert('保存失败: ' + result.error); 
    }
  };

  const handleDelete = async () => {
    const result = await deleteSpecialBudget(budget.id);
    if (result.success) { 
      await refreshBudgets(); 
      window.history.go(-2); 
    } else { 
      alert('删除失败: ' + result.error); 
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => window.history.back()} className="flex items-center gap-2 text-gray-600 mb-6 active:scale-95">
          <ArrowLeft size={20} />返回
        </button>
        <h1 className="text-2xl font-bold text-gray-800 mb-8">
          {isNew ? '新建远航计划' : '修改计划信息'}
        </h1>
        <div className="bg-white rounded-2xl p-6 space-y-6">
          {/* 图标选择 */}
          <div>
            <label className="block text-gray-600 mb-3">图标</label>
            <div className="flex gap-3 flex-wrap">
              {Object.entries(BUDGET_ICONS).map(([key, config]) => {
                const IconComp = config.icon;
                return (
                  <button 
                    key={key} 
                    onClick={() => setIcon(key)} 
                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${icon === key ? 'ring-2 ring-offset-2' : 'hover:scale-105'}`} 
                    style={{ 
                      backgroundColor: `${config.color}15`, 
                      ringColor: icon === key ? config.color : 'transparent' 
                    }}
                  >
                    <IconComp size={24} style={{ color: config.color }} />
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* 名称 */}
          <div>
            <label className="block text-gray-600 mb-2">计划名称</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="例如：泰国游" 
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-cyan-400 focus:outline-none" 
            />
          </div>
          
          {/* 目标金额 */}
          <div>
            <label className="block text-gray-600 mb-2">目标金额</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-gray-400">¥</span>
              <input 
                type="number" 
                value={totalBudget} 
                onChange={(e) => setTotalBudget(e.target.value)} 
                placeholder="0" 
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl text-lg focus:border-cyan-400 focus:outline-none" 
              />
            </div>
          </div>
          
          {/* 固定到首页 */}
          <div 
            className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer" 
            onClick={() => setPinnedToHome(!pinnedToHome)}
          >
            <span className="text-gray-700">在首页固定</span>
            <div className={`w-12 h-7 rounded-full transition-colors ${pinnedToHome ? 'bg-cyan-500' : 'bg-gray-300'}`}>
              <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform mt-1 ${pinnedToHome ? 'translate-x-6' : 'translate-x-1'}`} />
            </div>
          </div>
          
          {/* 按钮 */}
          <div className="flex gap-3 pt-4">
            <button 
              onClick={handleSubmit} 
              disabled={!name} 
              className="flex-1 py-4 bg-gray-800 text-white rounded-xl font-medium disabled:bg-gray-300 active:scale-95"
            >
              确认
            </button>
            {!isNew && (
              <button 
                onClick={() => setShowDeleteConfirm(true)} 
                className="px-6 py-4 bg-red-500 text-white rounded-xl font-medium active:scale-95"
              >
                删除
              </button>
            )}
          </div>
        </div>
      </div>
      
      <ConfirmModal 
        isOpen={showDeleteConfirm} 
        title="删除远航计划" 
        message={`确定要删除"${name}"吗？所有子项记录也将被删除，此操作无法撤销。`} 
        onConfirm={handleDelete} 
        onCancel={() => setShowDeleteConfirm(false)} 
      />
    </div>
  );
};

export default EditSpecialBudgetView;