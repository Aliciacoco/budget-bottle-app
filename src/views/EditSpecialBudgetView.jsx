// EditSpecialBudgetView.jsx - 新增/编辑独立预算
// 修复：支持自定义SVG图标渲染

import React, { useState } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { FLOATING_ICONS, getFloatingIcon } from '../constants/floatingIcons';
import { createSpecialBudget, updateSpecialBudget } from '../api';

// 导入设计系统组件
import { 
  PageContainer,
  DuoButton,
  DuoInput,
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
  
  // 获取当前选中的图标配置
  const selectedIconConfig = getFloatingIcon(icon);
  const SelectedIconComponent = selectedIconConfig.icon;
  
  // 图标列表
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
      <div className="pt-20 px-6 max-w-lg mx-auto space-y-6 pb-8">
        
        {/* 页面标题 */}
        <div className="text-center mb-2">
          <h1 className="text-2xl font-extrabold text-gray-800">
            {isEditing ? '编辑预算' : '新建预算'}
          </h1>
          <p className="text-gray-400 font-medium text-sm mt-1">
            {isEditing ? '修改预算信息' : '创建一个新的专项预算'}
          </p>
        </div>

        {/* 预览卡片 */}
        <div 
          className="rounded-3xl p-6 text-white relative overflow-hidden shadow-sm"
          style={{ 
            background: `linear-gradient(135deg, ${selectedIconConfig.color}dd, ${selectedIconConfig.color})`
          }}
        >
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/20 rounded-full"></div>
          <div className="flex items-center gap-4 relative z-10">
            {/* 自定义 SVG 图标 */}
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-white/20">
              <div className="w-10 h-10">
                <SelectedIconComponent className="w-full h-full" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-extrabold">{name || '预算名称'}</h2>
              {(startDate || endDate) && (
                <p className="text-white/70 text-sm mt-1 font-rounded">
                  {startDate || '开始'} ~ {endDate || '结束'}
                </p>
              )}
            </div>
          </div>
        </div>
        
        {/* 表单卡片 */}
        <div className="bg-white rounded-3xl p-6 shadow-sm space-y-6">
          
          {/* 名称输入 */}
          <div>
            <label className="block text-gray-400 font-bold uppercase tracking-wider text-xs mb-3 ml-1">
              预算名称
            </label>
            <DuoInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：滑雪游"
              autoFocus
            />
          </div>
          
          {/* 图标选择 - 修复：使用自定义SVG渲染方式 */}
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
                    {/* 自定义 SVG 图标 */}
                    <div className="w-8 h-8">
                      <IconComponent className="w-full h-full" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* 日期范围 */}
          <div>
            <label className="block text-gray-400 font-bold uppercase tracking-wider text-xs mb-3 ml-1">
              日期范围（可选）
            </label>
            <div className="flex gap-3">
              <div className="flex-1">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-gray-100 border-2 border-gray-200 rounded-2xl px-4 py-3 font-bold text-gray-700 focus:outline-none focus:bg-white focus:border-cyan-400 transition-colors"
                  style={{ colorScheme: 'light' }}
                />
                <p className="text-xs text-gray-300 mt-1 ml-1">开始日期</p>
              </div>
              <div className="flex-1">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-gray-100 border-2 border-gray-200 rounded-2xl px-4 py-3 font-bold text-gray-700 focus:outline-none focus:bg-white focus:border-cyan-400 transition-colors"
                  style={{ colorScheme: 'light' }}
                />
                <p className="text-xs text-gray-300 mt-1 ml-1">结束日期</p>
              </div>
            </div>
          </div>
          
          {/* 固定到首页 */}
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
      
      <LoadingOverlay isLoading={isSaving} />
    </PageContainer>
  );
};

export default EditSpecialBudgetView;