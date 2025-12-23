// EditWishView.jsx - 查看/编辑心愿页面
// 功能：金额计算器、Mixed Content 修复、心愿实现庆祝动画

import React, { useState, useRef } from 'react';
import { Edit2, Trash2, Heart, Undo2, ImagePlus, Palette, X } from 'lucide-react';
import AV from '../leancloud';
import { createWish, updateWish, deleteWish, getWishes, getWishPool, createWishPoolHistory, getWishPoolHistory, deleteWishPoolHistory } from '../api';
import { WISH_ICONS, getWishIcon, WISH_ICON_KEYS } from '../constants/wishIcons.jsx';
import Calculator from '../components/CalculatorModal';

// 导入庆祝动画
import { CelebrationAnimation } from '../components/animations';

// 导入设计系统组件
import { 
  PageContainer,
  TransparentNavBar,
  DuoButton,
  DuoInput,
  AmountInput,
  Modal,
  ConfirmModal,
  LoadingOverlay,
  ContentArea
} from '../components/design-system';

// ===== 工具函数：确保 URL 使用 HTTPS =====
const ensureHttps = (url) => {
  if (!url) return url;
  return url.replace(/^http:\/\//i, 'https://');
};

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
  const [amount, setAmount] = useState(editingWish?.amount || 0);
  const [selectedIcon, setSelectedIcon] = useState(editingWish?.icon || 'ball1');
  
  // 图片相关状态 - 确保使用 HTTPS
  const [imageMode, setImageMode] = useState(editingWish?.image ? 'image' : 'icon');
  const [imageUrl, setImageUrl] = useState(ensureHttps(editingWish?.image) || '');
  const [imagePreview, setImagePreview] = useState(ensureHttps(editingWish?.image) || '');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  
  // 计算器状态
  const [showCalculator, setShowCalculator] = useState(false);
  
  // 庆祝动画状态
  const [showCelebration, setShowCelebration] = useState(false);
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showFulfillConfirm, setShowFulfillConfirm] = useState(false);
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const wishAmount = amount || 0;
  const canFulfill = wishPoolAmount >= wishAmount && wishAmount > 0;
  const isFulfilled = editingWish?.fulfilled || false;
  
  const progressPercent = Math.min((wishPoolAmount / wishAmount) * 100, 100);
  const remainingAmount = Math.max(0, wishAmount - wishPoolAmount);

  // --- 计算器回调 ---
  const handleAmountChange = (newAmount) => {
    setAmount(newAmount);
    setShowCalculator(false);
  };

  // --- 图片上传处理 ---
  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      alert('图片大小不能超过 5MB');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
    
    setIsUploading(true);
    try {
      const avFile = new AV.File(file.name, file);
      const savedFile = await avFile.save();
      const secureUrl = ensureHttps(savedFile.url());
      setImageUrl(secureUrl);
      setImageMode('image');
    } catch (error) {
      console.error('图片上传失败:', error);
      alert('图片上传失败，请重试');
      setImagePreview('');
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleRemoveImage = () => {
    setImageUrl('');
    setImagePreview('');
    setImageMode('icon');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // --- API 逻辑 ---
  const handleSave = async () => {
    if (!description || !amount) return;
    setIsLoading(true);
    try {
      let result;
      const finalImage = imageMode === 'image' ? ensureHttps(imageUrl) : null;
      const finalIcon = imageMode === 'icon' ? selectedIcon : 'ball1';
      
      if (isNew) {
        result = await createWish(description, amount, finalImage, false, finalIcon);
      } else {
        result = await updateWish(editingWish.id, description, amount, finalImage, isFulfilled, finalIcon);
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
      const finalImage = imageMode === 'image' ? ensureHttps(imageUrl) : null;
      const finalIcon = imageMode === 'icon' ? selectedIcon : 'ball1';
      const result = await updateWish(editingWish.id, description, wishAmount, finalImage, true, finalIcon);
      if (result.success) {
        const poolResult = await getWishPool();
        if (poolResult.success) setWishPoolAmount(poolResult.data.amount);
        const wishResult = await getWishes();
        if (wishResult.success) setWishes(wishResult.data);
        
        // 显示庆祝动画，而不是直接返回
        setIsLoading(false);
        setShowCelebration(true);
      }
    } catch (e) { alert('操作失败'); setIsLoading(false); }
  };
  
  // 庆祝动画结束后返回
  const handleCelebrationComplete = () => {
    setShowCelebration(false);
    window.history.back();
  };

  const confirmRevoke = async () => {
    setShowRevokeConfirm(false); setIsLoading(true);
    try {
      const historyResult = await getWishPoolHistory();
      if (historyResult.success) {
        const targetRecord = historyResult.data.find(h => h.wishId === editingWish.id && h.isDeduction);
        if (targetRecord) await deleteWishPoolHistory(targetRecord.id);
      }
      const finalImage = imageMode === 'image' ? ensureHttps(imageUrl) : null;
      const finalIcon = imageMode === 'icon' ? selectedIcon : 'ball1';
      const result = await updateWish(editingWish.id, description, wishAmount, finalImage, false, finalIcon);
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
    const hasImage = editingWish?.image;
    const secureImageUrl = ensureHttps(editingWish?.image);
    const viewIconConfig = getWishIcon(editingWish?.icon || selectedIcon);
    const IconComponent = viewIconConfig.icon;
    
    return (
      <PageContainer bg="gray">
        <TransparentNavBar 
          onBack={() => window.history.back()}
          rightButtons={[
            { icon: Edit2, onClick: () => setIsEditMode(true), variant: 'primary' },
            { icon: Trash2, onClick: () => setShowDeleteConfirm(true), variant: 'danger' }
          ]}
        />
        
        <ContentArea className="pt-20 max-w-lg mx-auto">
          <div className="bg-white rounded-3xl overflow-hidden shadow-sm border-b-4 border-gray-200 mb-6">
            <div className="aspect-[4/3] w-full bg-gradient-to-br from-cyan-50 to-gray-100 flex items-center justify-center overflow-hidden relative">
              {hasImage ? (
                <img 
                  src={secureImageUrl}
                  alt={description}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-32 h-32">
                  <IconComponent className="w-full h-full" />
                </div>
              )}
              
              <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-md text-white px-4 py-2 rounded-xl font-extrabold font-rounded text-lg shadow-lg border-2 border-white/20">
                ¥{wishAmount.toLocaleString()}
              </div>
              
              {isFulfilled && (
                <div className="absolute top-4 left-4 bg-amber-400 text-white px-4 py-1.5 rounded-xl font-extrabold text-sm shadow-lg rotate-[-5deg] border-2 border-amber-500">
                  🏆 已达成
                </div>
              )}
            </div>
            
            <div className="p-6">
              <h1 className="text-2xl font-extrabold text-gray-700 leading-tight mb-4">
                {description}
              </h1>
              
              {!isFulfilled && (
                <div>
                  <div className="flex justify-between text-sm font-bold text-gray-400 mb-2 uppercase tracking-wide">
                    <span>存钱进度</span>
                    <span className={`font-rounded ${canFulfill ? "text-green-500" : "text-gray-400"}`}>
                      {Math.round(progressPercent)}%
                    </span>
                  </div>
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
        
        {/* 庆祝动画 */}
        {showCelebration && (
          <CelebrationAnimation
            wishName={description}
            amount={wishAmount}
            wishIcon={selectedIcon}
            wishImage={imageMode === 'image' ? ensureHttps(imageUrl) : null}
            onComplete={handleCelebrationComplete}
          />
        )}
      </PageContainer>
    );
  }

  // --- 编辑模式 ---
  return (
    <PageContainer bg="gray">
      <TransparentNavBar 
        onBack={() => isNew ? window.history.back() : setIsEditMode(false)}
      />

      <ContentArea className="pt-20 space-y-6 max-w-lg mx-auto">
        <div className="text-center mb-2">
          <h1 className="text-2xl font-extrabold text-gray-800">
            {isNew ? '添加新心愿' : '编辑心愿'}
          </h1>
          <p className="text-gray-400 font-medium text-sm mt-1">
            {isNew ? '写下你想要的东西' : '修改心愿内容'}
          </p>
        </div>
        
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
          
          {/* 金额输入 - 计算器模式 */}
          <div>
            <label className="block text-gray-400 font-bold uppercase tracking-wider text-xs mb-3 ml-1">需要多少钱</label>
            <AmountInput
              value={amount}
              onClick={() => setShowCalculator(true)}
            />
          </div>
        </div>
        
        {/* 图标/图片选择卡片 */}
        <div className="bg-white rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-gray-400 font-bold uppercase tracking-wider text-xs ml-1">选择展示方式</label>
            <div className="flex bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setImageMode('icon')}
                className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
                  imageMode === 'icon' 
                    ? 'bg-white text-cyan-500 shadow-sm' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Palette size={16} />
                图标
              </button>
              <button
                onClick={() => setImageMode('image')}
                className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
                  imageMode === 'image' 
                    ? 'bg-white text-cyan-500 shadow-sm' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <ImagePlus size={16} />
                图片
              </button>
            </div>
          </div>
          
          {imageMode === 'icon' ? (
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
          ) : (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              
              {imagePreview ? (
                <div className="relative">
                  <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100">
                    <img 
                      src={imagePreview} 
                      alt="预览" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    onClick={handleRemoveImage}
                    className="absolute top-3 right-3 w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg active:scale-95"
                  >
                    <X size={20} strokeWidth={3} />
                  </button>
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
                      <div className="animate-spin rounded-full h-10 w-10 border-4 border-white border-t-transparent"></div>
                    </div>
                  )}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="mt-3 w-full py-3 bg-gray-100 rounded-xl text-gray-500 font-bold text-sm hover:bg-gray-200 active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    重新选择图片
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full aspect-square rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center gap-3 hover:border-cyan-400 hover:bg-cyan-50 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-10 w-10 border-4 border-cyan-200 border-t-cyan-500"></div>
                      <span className="text-gray-400 font-bold">上传中...</span>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                        <ImagePlus size={32} className="text-gray-400" />
                      </div>
                      <span className="text-gray-400 font-bold">点击上传图片</span>
                      <span className="text-gray-300 text-sm">支持 JPG、PNG，最大 5MB</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
        
        <div className="pb-6">
          <DuoButton 
            onClick={handleSave} 
            disabled={!description || !amount || isLoading || isUploading} 
            fullWidth
            size="lg"
          >
            {isLoading ? '保存中...' : '保存'}
          </DuoButton>
        </div>
      </ContentArea>
      
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
      
      <LoadingOverlay isLoading={isLoading} />
    </PageContainer>
  );
};

export default EditWishView;