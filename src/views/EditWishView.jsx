// EditWishView.jsx - 查看/编辑心愿页面
// 使用设计系统 + lucide-react 图标

import React, { useState } from 'react';
import { Edit2, Trash2, Heart, Undo2 } from 'lucide-react';
import { createWish, updateWish, deleteWish, getWishes, getWishPool, createWishPoolHistory, getWishPoolHistory, deleteWishPoolHistory } from '../api';
import { WISH_ICONS, getWishIcon, WISH_ICON_KEYS } from '../constants/wishIcons.jsx';

// 导入设计系统组件
import { 
  PageContainer,
  TransparentNavBar,
  DuoButton,
  DuoInput,
  Modal,
  ConfirmModal,
  LoadingOverlay,
  ContentArea
} from '../components/design-system';

const EditWishView = ({ 
  editingWish, 
  wishes, 
  setWishes, 
  wishPoolAmount, 
  setWishPoolAmount
}) => {
  const isNew = !editingWish?.id;
  const [isEditMode, setIsEditMode] = useState(isNew);
  const [description, setDescription] = useState(editingWish?.description || '');
  const [amount, setAmount] = useState(editingWish?.amount?.toString() || '');
  const [selectedIcon, setSelectedIcon] = useState(editingWish?.icon || 'ball1');
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showFulfillConfirm, setShowFulfillConfirm] = useState(false);
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const wishAmount = parseFloat(amount || 0);
  const canFulfill = wishPoolAmount >= wishAmount && wishAmount > 0;
  const isFulfilled = editingWish?.fulfilled || false;
  
  const progressPercent = Math.min((wishPoolAmount / wishAmount) * 100, 100);
  const remainingAmount = Math.max(0, wishAmount - wishPoolAmount);

  // --- API 逻辑 ---
  const handleSave = async () => {
    if (!description || !amount) return;
    setIsLoading(true);
    try {
      let result;
      
      if (isNew) {
        result = await createWish(description, parseFloat(amount), null, false, selectedIcon);
      } else {
        result = await updateWish(editingWish.id, description, parseFloat(amount), null, isFulfilled, selectedIcon);
      }
      if (result.success) {
        const wishResult = await getWishes();
        if (wishResult.success) setWishes(wishResult.data);
        window.history.back();
      } else {
        alert('保存失败: ' + result.error);
      }
    } finally { setIsLoading(false); }
  };

  const handleDelete = async () => {
    setShowDeleteConfirm(false); setIsLoading(true);
    try {
      const result = await deleteWish(editingWish.id);
      if (result.success) {
        setWishes(wishes.filter(w => w.id !== editingWish.id));
        window.history.back();
      }
    } finally { setIsLoading(false); }
  };

  const confirmFulfill = async () => {
    if (!canFulfill) return;
    setShowFulfillConfirm(false); setIsLoading(true);
    try {
      const historyKey = 'WISH-' + editingWish.id + '-' + Date.now();
      await createWishPoolHistory(historyKey, 0, 0, -wishAmount, true, description, editingWish.id);
      const result = await updateWish(editingWish.id, description, wishAmount, null, true, selectedIcon);
      if (result.success) {
        const poolResult = await getWishPool();
        if (poolResult.success) setWishPoolAmount(poolResult.data.amount);
        const wishResult = await getWishes();
        if (wishResult.success) setWishes(wishResult.data);
        window.history.back();
      }
    } catch (e) { alert('操作失败'); } finally { setIsLoading(false); }
  };

  const confirmRevoke = async () => {
    setShowRevokeConfirm(false); setIsLoading(true);
    try {
      const historyResult = await getWishPoolHistory();
      if (historyResult.success) {
        const targetRecord = historyResult.data.find(h => h.wishId === editingWish.id && h.isDeduction);
        if (targetRecord) await deleteWishPoolHistory(targetRecord.id);
      }
      const result = await updateWish(editingWish.id, description, wishAmount, null, false, selectedIcon);
      if (result.success) {
        const poolResult = await getWishPool();
        if (poolResult.success) setWishPoolAmount(poolResult.data.amount);
        const wishResult = await getWishes();
        if (wishResult.success) setWishes(wishResult.data);
        window.history.back();
      }
    } catch (e) { alert('操作失败'); } finally { setIsLoading(false); }
  };

  // --- 查看模式 ---
  if (!isEditMode && !isNew) {
    const viewIconConfig = getWishIcon(editingWish?.icon || selectedIcon);
    const IconComponent = viewIconConfig.icon;
    
    return (
      <PageContainer bg="gray">
        {/* 透明导航栏 */}
        <TransparentNavBar 
          onBack={() => window.history.back()}
          rightButtons={[
            { icon: Edit2, onClick: () => setIsEditMode(true), variant: 'primary' },
            { icon: Trash2, onClick: () => setShowDeleteConfirm(true), variant: 'danger' }
          ]}
        />
        
        <ContentArea className="pt-20 max-w-lg mx-auto">
          {/* 心愿卡片 */}
          <div className="bg-white rounded-3xl overflow-hidden shadow-sm border-b-4 border-gray-200 mb-6">
            {/* 图标区域 */}
            <div className="aspect-[4/3] w-full bg-gradient-to-br from-cyan-50 to-gray-100 flex items-center justify-center overflow-hidden relative">
              {/* 自定义SVG图标 */}
              <div className="w-32 h-32">
                <IconComponent className="w-full h-full" />
              </div>
              
              {/* 价格标签 */}
              <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-md text-white px-4 py-2 rounded-xl font-extrabold font-rounded text-lg shadow-lg border-2 border-white/20">
                ¥{wishAmount.toLocaleString()}
              </div>
              
              {/* 已实现标记 */}
              {isFulfilled && (
                <div className="absolute top-4 left-4 bg-amber-400 text-white px-4 py-1.5 rounded-xl font-extrabold text-sm shadow-lg rotate-[-5deg] border-2 border-amber-500">
                  🏆 已达成
                </div>
              )}
            </div>
            
            {/* 卡片内容 */}
            <div className="p-6">
              <h1 className="text-2xl font-extrabold text-gray-700 leading-tight mb-4">
                {description}
              </h1>
              
              {/* 进度条 (仅未实现时) */}
              {!isFulfilled && (
                <div>
                  <div className="flex justify-between text-sm font-bold text-gray-400 mb-2 uppercase tracking-wide">
                    <span>存钱进度</span>
                    <span className={`font-rounded ${canFulfill ? "text-green-500" : "text-gray-400"}`}>
                      {Math.round(progressPercent)}%
                    </span>
                  </div>
                  {/* 进度条 */}
                  <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${canFulfill ? 'bg-green-500' : 'bg-cyan-400'}`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className="mt-3 text-center">
                    {canFulfill ? (
                      <span className="text-green-500 font-bold text-sm">🎉 钱够啦，快去买！</span>
                    ) : (
                      <span className="text-red-400 font-bold text-sm font-rounded">还差 ¥{remainingAmount.toLocaleString()}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 底部按钮 */}
          <div className="pb-6">
            {isFulfilled ? (
              <DuoButton 
                onClick={() => setShowRevokeConfirm(true)}
                variant="warning"
                fullWidth
                size="lg"
                icon={Undo2}
              >
                撤销实现状态
              </DuoButton>
            ) : (
              <DuoButton 
                onClick={() => setShowFulfillConfirm(true)}
                disabled={!canFulfill}
                variant={canFulfill ? 'success' : 'secondary'}
                fullWidth
                size="lg"
                icon={Heart}
              >
                {canFulfill ? '立即实现心愿' : '余额不足，继续加油'}
              </DuoButton>
            )}
          </div>
        </ContentArea>

        {/* 实现确认弹窗 */}
        <Modal
          isOpen={showFulfillConfirm}
          onClose={() => setShowFulfillConfirm(false)}
          title="✨ 梦想成真时刻"
        >
          <p className="text-gray-500 font-bold text-center mb-6">
            确定要花费 <span className="text-cyan-500 font-rounded">¥{wishAmount}</span> 吗？
          </p>
          <div className="flex gap-3">
            <DuoButton onClick={() => setShowFulfillConfirm(false)} variant="secondary" fullWidth>
              再等等
            </DuoButton>
            <DuoButton onClick={confirmFulfill} variant="success" fullWidth>
              买买买！
            </DuoButton>
          </div>
        </Modal>
        
        {/* 撤销确认弹窗 */}
        <Modal
          isOpen={showRevokeConfirm}
          onClose={() => setShowRevokeConfirm(false)}
          title="↩️ 撤销操作"
        >
          <p className="text-gray-500 font-bold text-center mb-6">
            <span className="text-cyan-500 font-rounded">¥{wishAmount}</span> 将退回心愿池。
          </p>
          <div className="flex gap-3">
            <DuoButton onClick={() => setShowRevokeConfirm(false)} variant="secondary" fullWidth>
              取消
            </DuoButton>
            <DuoButton onClick={confirmRevoke} variant="warning" fullWidth>
              确认撤销
            </DuoButton>
          </div>
        </Modal>

        <ConfirmModal 
          isOpen={showDeleteConfirm} 
          title="删除心愿" 
          message="删除后无法恢复，确定要放弃这个心愿吗？" 
          onConfirm={handleDelete} 
          onCancel={() => setShowDeleteConfirm(false)} 
        />
        
        <LoadingOverlay isLoading={isLoading} />
      </PageContainer>
    );
  }

  // --- 编辑模式 ---
  return (
    <PageContainer bg="gray">
      {/* 透明导航栏 */}
      <TransparentNavBar 
        onBack={() => isNew ? window.history.back() : setIsEditMode(false)}
      />

      <ContentArea className="pt-20 space-y-6 max-w-lg mx-auto">
        {/* 页面标题 */}
        <div className="text-center mb-2">
          <h1 className="text-2xl font-extrabold text-gray-800">
            {isNew ? '添加新心愿' : '编辑心愿'}
          </h1>
          <p className="text-gray-400 font-medium text-sm mt-1">
            {isNew ? '写下你想要的东西' : '修改心愿内容'}
          </p>
        </div>
        
        {/* 表单卡片 */}
        <div className="bg-white rounded-3xl p-6 shadow-sm space-y-5">
          {/* 名称输入 */}
          <div>
            <label className="block text-gray-400 font-bold uppercase tracking-wider text-xs mb-3 ml-1">心愿名称</label>
            <DuoInput 
              type="text" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="例如：Switch 游戏机"
              autoFocus={isNew}
            />
          </div>
          
          {/* 金额输入 */}
          <div>
            <label className="block text-gray-400 font-bold uppercase tracking-wider text-xs mb-3 ml-1">需要多少钱</label>
            <DuoInput 
              type="number" 
              prefix="¥"
              value={amount} 
              onChange={(e) => setAmount(e.target.value)} 
              placeholder="0"
            />
          </div>
        </div>
        
        {/* 图标选择卡片 */}
        <div className="bg-white rounded-3xl p-6 shadow-sm space-y-4">
          <label className="block text-gray-400 font-bold uppercase tracking-wider text-xs ml-1">选择图标</label>
          
          {/* 图标网格 */}
          <div className="grid grid-cols-3 gap-3">
            {WISH_ICON_KEYS.map((key) => {
              const config = WISH_ICONS[key];
              const IconComponent = config.icon;
              const isSelected = selectedIcon === key;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedIcon(key)}
                  className={`aspect-square rounded-2xl flex flex-col items-center justify-center gap-2 transition-all p-3 border-2 ${isSelected ? 'bg-cyan-50 border-cyan-400 ring-2 ring-cyan-400 ring-offset-2' : 'bg-gray-50 border-gray-200 hover:border-gray-300'}`}
                >
                  {/* 自定义 SVG 图标 */}
                  <div className="w-10 h-10">
                    <IconComponent className="w-full h-full" />
                  </div>
                  <span className={`text-xs font-bold ${isSelected ? 'text-cyan-600' : 'text-gray-400'}`}>
                    {config.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        
        {/* 保存按钮 */}
        <div className="pb-6">
          <DuoButton 
            onClick={handleSave} 
            disabled={!description || !amount || isLoading} 
            fullWidth
            size="lg"
          >
            {isLoading ? '保存中...' : '保存'}
          </DuoButton>
        </div>
      </ContentArea>
      
      <LoadingOverlay isLoading={isLoading} />
    </PageContainer>
  );
};

export default EditWishView;