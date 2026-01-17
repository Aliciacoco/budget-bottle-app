// EditWishView.jsx - 查看/编辑心愿页面
// ✅ 修复：游客模式使用 base64 存储图片，正式账号上传到云端

import app from '../cloudbase';
import React, { useState, useRef, useEffect } from 'react';
import { Edit2, Trash2, Heart, Undo2, ImagePlus, Palette, X, Camera } from 'lucide-react';
import { 
  createWish, 
  updateWish, 
  deleteWish, 
  getWishes, 
  getWishPool, 
  createWishPoolHistory, 
  getWishPoolHistory, 
  deleteWishPoolHistory 
} from '../apiSelector';
import { isAnonymousUser } from '../auth';  // ✅ 新增：判断是否游客
import { WISH_ICONS, getWishIcon, WISH_ICON_KEYS } from '../constants/wishIcons.jsx';
import Calculator from '../components/CalculatorModal';
import { CelebrationAnimation } from '../components/animations';

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

const formatAmount = (amount) => Math.round(amount * 100) / 100;

// ✅ 压缩图片为 base64（游客模式使用）
const compressImageToBase64 = (file, maxWidth = 800, quality = 0.7) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        
        // 按比例缩放
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // 转换为 base64
        const base64 = canvas.toDataURL('image/jpeg', quality);
        resolve(base64);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const EditWishView = ({ 
  editingWish, 
  wishes, 
  setWishes, 
  wishPoolAmount: propWishPoolAmount, 
  setWishPoolAmount
}) => {
  const isNew = !editingWish?.id;
  const [isEditMode, setIsEditMode] = useState(isNew);
  const [description, setDescription] = useState(editingWish?.description || '');
  const [amount, setAmount] = useState(editingWish?.amount || 0);
  const [selectedIcon, setSelectedIcon] = useState(editingWish?.icon || 'ball1');
  const [imageMode, setImageMode] = useState(editingWish?.image ? 'image' : 'icon');
  // 存储 fileID（cloud:// 格式）或 base64
  const [imageFileId, setImageFileId] = useState(editingWish?.image || '');
  // 存储可访问的临时URL（用于预览）
  const [imagePreview, setImagePreview] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showFulfillConfirm, setShowFulfillConfirm] = useState(false);
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // ✅ 判断是否游客模式
  const isGuest = isAnonymousUser();
  
  // 本地心愿池余额状态 - 确保有最新值
  const [localPoolAmount, setLocalPoolAmount] = useState(formatAmount(propWishPoolAmount || 0));

  // 组件挂载时获取最新心愿池余额
  useEffect(() => {
    const fetchPoolAmount = async () => {
      try {
        const result = await getWishPool();
        if (result.success) {
          const amount = formatAmount(result.data.amount);
          setLocalPoolAmount(amount);
          console.log('✅ 获取心愿池余额:', amount);
        }
      } catch (error) {
        console.error('获取心愿池余额失败:', error);
      }
    };
    fetchPoolAmount();
  }, []);

  // 加载已有图片的临时URL
  useEffect(() => {
    const loadImagePreview = async () => {
      if (editingWish?.image) {
        try {
          // ✅ 如果是 base64 格式（游客模式），直接使用
          if (editingWish.image.startsWith('data:')) {
            setImagePreview(editingWish.image);
            return;
          }
          
          // 如果是 cloud:// 格式，需要转换
          if (editingWish.image.startsWith('cloud://')) {
            const result = await app.getTempFileURL({
              fileList: [editingWish.image]
            });
            if (result.fileList && result.fileList[0] && result.fileList[0].tempFileURL) {
              setImagePreview(result.fileList[0].tempFileURL);
            }
          } else {
            // 如果是 https:// 格式，直接使用
            setImagePreview(editingWish.image);
          }
        } catch (error) {
          console.error('加载图片预览失败:', error);
        }
      }
    };
    loadImagePreview();
  }, [editingWish?.image]);

  // 同步 prop 变化
  useEffect(() => {
    if (propWishPoolAmount !== undefined && propWishPoolAmount !== null) {
      setLocalPoolAmount(formatAmount(propWishPoolAmount));
    }
  }, [propWishPoolAmount]);

  const wishAmount = amount || editingWish?.amount || 0;
  const canFulfill = localPoolAmount >= wishAmount && wishAmount > 0;
  const isFulfilled = editingWish?.fulfilled || false;
  const progressPercent = wishAmount > 0 ? Math.min((localPoolAmount / wishAmount) * 100, 100) : 0;
  const remainingAmount = Math.max(0, wishAmount - localPoolAmount);

  // 处理金额变更
  const handleAmountChange = (newAmount) => { 
    setAmount(newAmount); 
    setShowCalculator(false); 
  };

  // ✅ 处理图片选择 - 根据用户类型选择存储方式
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
    
    setIsUploading(true);
    
    try {
      if (isGuest) {
        // ✅ 游客模式：压缩后存储为 base64
        console.log('🎭 游客模式：使用 base64 存储图片');
        const base64 = await compressImageToBase64(file, 600, 0.6);
        setImageFileId(base64);
        setImagePreview(base64);
        setImageMode('image');
        console.log('✅ 图片压缩完成，大小:', Math.round(base64.length / 1024), 'KB');
      } else {
        // ✅ 正式账号：上传到腾讯云
        console.log('☁️ 正式账号：上传到腾讯云');
        
        // 先显示本地预览
        const reader = new FileReader();
        reader.onload = (e) => { 
          setImagePreview(e.target.result); 
        };
        reader.readAsDataURL(file);
        
        const cloudPath = `wishes/${Date.now()}_${file.name}`;
        const result = await app.uploadFile({
          cloudPath: cloudPath,
          filePath: file,
        });
        
        console.log('📤 上传结果:', result);
        
        // 保存 fileID（cloud:// 格式）
        if (result.fileID) {
          setImageFileId(result.fileID);
          setImageMode('image');
          console.log('✅ 图片上传成功, fileID:', result.fileID);
          
          // 获取临时URL用于预览
          const tempResult = await app.getTempFileURL({
            fileList: [result.fileID]
          });
          if (tempResult.fileList && tempResult.fileList[0] && tempResult.fileList[0].tempFileURL) {
            setImagePreview(tempResult.fileList[0].tempFileURL);
          }
        } else {
          throw new Error('上传返回结果中没有 fileID');
        }
      }
    } catch (error) { 
      console.error('图片处理失败:', error); 
      alert(isGuest ? '图片处理失败，请重试' : '图片上传失败，请重试'); 
      setImagePreview(''); 
    } finally { 
      setIsUploading(false); 
    }
  };

  // 移除图片
  const handleRemoveImage = () => { 
    setImageFileId(''); 
    setImagePreview(''); 
    setImageMode('icon'); 
    if (fileInputRef.current) fileInputRef.current.value = ''; 
  };

  // 保存心愿
  const handleSave = async () => {
    if (!description || !amount) return;
    setIsLoading(true);
    try {
      let result;
      // 保存 fileID 或 base64 到数据库
      const finalImage = imageMode === 'image' ? imageFileId : null;
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
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败');
    } finally { 
      setIsLoading(false); 
    }
  };

  // 删除心愿
  const handleDelete = async () => {
    if (!editingWish?.id) return;
    const wishId = editingWish.id;
    setShowDeleteConfirm(false);
    setWishes(prev => prev.filter(w => w.id !== wishId));
    window.history.back();
    
    try { 
      await deleteWish(wishId); 
      console.log('✅ 心愿删除成功'); 
    } catch (error) { 
      console.warn('删除请求未完成:', error); 
    }
  };

  // 实现心愿
  const confirmFulfill = async () => {
    if (!canFulfill) {
      console.log('❌ 无法实现心愿: canFulfill =', canFulfill, 'localPoolAmount =', localPoolAmount, 'wishAmount =', wishAmount);
      return;
    }
    
    setShowFulfillConfirm(false); 
    setIsLoading(true);
    
    try {
      console.log('🎯 开始实现心愿:', description, '金额:', wishAmount);
      
      // 1. 创建扣款记录
      const historyKey = 'WISH-' + editingWish.id + '-' + Date.now();
      const historyResult = await createWishPoolHistory(
        historyKey, 
        0, 
        0, 
        -wishAmount,  // 负数表示扣款
        true,         // isDeduction = true
        description, 
        editingWish.id
      );
      console.log('📝 创建扣款记录:', historyResult);
      
      // 2. 更新心愿状态为已实现
      const finalImage = imageMode === 'image' ? imageFileId : null;
      const finalIcon = imageMode === 'icon' ? selectedIcon : 'ball1';
      const result = await updateWish(
        editingWish.id, 
        description, 
        wishAmount, 
        finalImage, 
        true,  // fulfilled = true
        finalIcon
      );
      console.log('📝 更新心愿状态:', result);
      
      if (result.success) {
        // 3. 刷新心愿池余额
        const poolResult = await getWishPool();
        if (poolResult.success) {
          const newAmount = formatAmount(poolResult.data.amount);
          setLocalPoolAmount(newAmount);
          setWishPoolAmount(newAmount);
          console.log('💰 新心愿池余额:', newAmount);
        }
        
        // 4. 刷新心愿列表
        const wishResult = await getWishes();
        if (wishResult.success) {
          setWishes(wishResult.data);
        }
        
        setIsLoading(false);
        // 5. 显示庆祝动画
        setShowCelebration(true);
      } else {
        throw new Error(result.error || '更新失败');
      }
    } catch (e) { 
      console.error('❌ 实现心愿失败:', e);
      alert('操作失败: ' + e.message); 
      setIsLoading(false); 
    }
  };

  // 庆祝动画完成后返回
  const handleCelebrationComplete = () => { 
    setShowCelebration(false); 
    window.history.back(); 
  };

  // 撤销实现
  const confirmRevoke = async () => {
    setShowRevokeConfirm(false); 
    setIsLoading(true);
    
    try {
      console.log('↩️ 开始撤销心愿:', editingWish.id);
      
      // 1. 查找并删除扣款记录
      const historyResult = await getWishPoolHistory();
      if (historyResult.success) {
        const targetRecord = historyResult.data.find(
          h => h.wishId === editingWish.id && h.isDeduction
        );
        if (targetRecord) {
          await deleteWishPoolHistory(targetRecord.id);
          console.log('🗑️ 删除扣款记录:', targetRecord.id);
        } else {
          console.log('⚠️ 未找到扣款记录');
        }
      }
      
      // 2. 更新心愿状态为未实现
      const finalImage = imageMode === 'image' ? imageFileId : null;
      const finalIcon = imageMode === 'icon' ? selectedIcon : 'ball1';
      const result = await updateWish(
        editingWish.id, 
        description, 
        wishAmount, 
        finalImage, 
        false,  // fulfilled = false
        finalIcon
      );
      console.log('📝 更新心愿状态:', result);
      
      if (result.success) {
        // 3. 刷新心愿池余额
        const poolResult = await getWishPool();
        if (poolResult.success) {
          const newAmount = formatAmount(poolResult.data.amount);
          setLocalPoolAmount(newAmount);
          setWishPoolAmount(newAmount);
          console.log('💰 新心愿池余额:', newAmount);
        }
        
        // 4. 刷新心愿列表
        const wishResult = await getWishes();
        if (wishResult.success) {
          setWishes(wishResult.data);
        }
        
        window.history.back();
      } else {
        throw new Error(result.error || '更新失败');
      }
    } catch (e) { 
      console.error('❌ 撤销失败:', e);
      alert('操作失败: ' + e.message); 
    } finally { 
      setIsLoading(false); 
    }
  };

  // --- 查看模式 (View Mode) ---
  if (!isEditMode && !isNew) {
    const hasImage = imagePreview;
    const viewIconConfig = getWishIcon(editingWish?.icon || selectedIcon);
    const IconComponent = viewIconConfig.icon;
    
    return (
      <PageContainer>
        <TransparentNavBar 
          onBack={() => window.history.back()}
          rightButtons={[
            { icon: Edit2, onClick: () => setIsEditMode(true), variant: 'primary' },
            { icon: Trash2, onClick: () => setShowDeleteConfirm(true), variant: 'danger' }
          ]}
          variant={hasImage ? "white" : "default"} 
        />
        
        <div className={hasImage ? "" : "pt-20 px-6 max-w-lg mx-auto"}>
          
          {hasImage ? (
            <div className="relative w-full aspect-square bg-gray-100">
              <img 
                src={imagePreview}
                alt={description}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
              
              <div className="absolute bottom-6 left-6 text-white">
                <div className="text-3xl font-extrabold font-rounded mb-1">¥{wishAmount.toLocaleString()}</div>
                <div className="text-white/80 font-medium text-sm">{isFulfilled ? '已达成' : '心愿金额'}</div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 mb-6">
              <div className="w-32 h-32 text-cyan-500 mb-6">
                <IconComponent className="w-full h-full" strokeWidth={1.5} />
              </div>
              <div className="text-4xl font-black text-gray-800 font-rounded">
                ¥{wishAmount.toLocaleString()}
              </div>
            </div>
          )}

          <div className={`px-6 pb-20 max-w-lg mx-auto ${hasImage ? "pt-6" : ""}`}>
            <h1 className="text-3xl font-extrabold text-gray-800 leading-tight mb-8">
              {description}
            </h1>
            
            {!isFulfilled && (
              <div className="bg-gray-50 rounded-3xl p-6 mb-8">
                <div className="flex justify-between text-sm font-bold text-gray-400 mb-3 uppercase tracking-wide">
                  <span>存钱进度</span>
                  <span className={`font-rounded ${canFulfill ? "text-green-500" : "text-gray-400"}`}>
                    {Math.round(progressPercent)}%
                  </span>
                </div>
                <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${canFulfill ? 'bg-green-500' : 'bg-cyan-400'}`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="mt-4 text-center">
                  {canFulfill ? (
                    <span className="text-green-500 font-bold text-base">🎉 钱够啦，快去买！</span>
                  ) : (
                    <span className="text-red-400 font-bold text-base font-rounded">
                      还差 ¥{remainingAmount.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            )}

            <div>
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
                  onClick={() => {
                    console.log('点击实现心愿按钮, canFulfill:', canFulfill);
                    if (canFulfill) {
                      setShowFulfillConfirm(true);
                    }
                  }}
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
          </div>
        </div>

        {/* 实现心愿确认弹窗 */}
        <Modal 
          isOpen={showFulfillConfirm} 
          onClose={() => setShowFulfillConfirm(false)} 
          title="✨ 梦想成真时刻"
        >
          <p className="text-gray-500 font-bold text-center mb-6">
            确定要花费 <span className="text-cyan-500 font-rounded">¥{wishAmount}</span> 吗？
          </p>
          <div className="flex gap-3">
            <DuoButton 
              onClick={() => setShowFulfillConfirm(false)} 
              variant="secondary" 
              fullWidth
            >
              再等等
            </DuoButton>
            <DuoButton 
              onClick={confirmFulfill} 
              variant="success" 
              fullWidth
            >
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
            <DuoButton 
              onClick={() => setShowRevokeConfirm(false)} 
              variant="secondary" 
              fullWidth
            >
              取消
            </DuoButton>
            <DuoButton 
              onClick={confirmRevoke} 
              variant="warning" 
              fullWidth
            >
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
        
        {showCelebration && (
          <CelebrationAnimation 
            wishName={description} 
            amount={wishAmount} 
            wishIcon={selectedIcon} 
            wishImage={imagePreview} 
            onComplete={handleCelebrationComplete} 
          />
        )}
      </PageContainer>
    );
  }

  // --- 编辑模式 (Edit Mode) ---
  return (
    <PageContainer>
      <TransparentNavBar 
        onBack={() => isNew ? window.history.back() : setIsEditMode(false)}
      />

      <ContentArea className="pt-20 space-y-8 max-w-lg mx-auto">
        <div className="text-center px-4">
          <h1 className="text-2xl font-extrabold text-gray-800">
            {isNew ? '许个愿望' : '编辑心愿'}
          </h1>
        </div>
        
        <div className="space-y-6">
          <div>
            <label className="block text-gray-400 font-bold uppercase tracking-wider text-xs mb-3 ml-1">
              心愿名称
            </label>
            <DuoInput 
              type="text" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="例如：Switch 游戏机"
              autoFocus={isNew}
              size="lg"
            />
          </div>
          
          <div>
            <label className="block text-gray-400 font-bold uppercase tracking-wider text-xs mb-3 ml-1">
              需要多少钱
            </label>
            <AmountInput
              value={amount}
              onClick={() => setShowCalculator(true)}
              size="lg"
            />
          </div>
        </div>
        
        {/* 图片/图标选择区域 */}
        <div>
          <div className="flex items-center justify-between mb-4 px-1">
            <label className="block text-gray-400 font-bold uppercase tracking-wider text-xs">
              展示方式
            </label>
            
            <div className="flex bg-gray-100 rounded-full p-1">
              <button
                onClick={() => setImageMode('icon')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
                  imageMode === 'icon' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Palette size={14} /> 图标
              </button>
              <button
                onClick={() => setImageMode('image')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
                  imageMode === 'image' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <ImagePlus size={14} /> 图片
              </button>
            </div>
          </div>
          
          {imageMode === 'icon' ? (
            <div className="grid grid-cols-4 gap-3">
              {WISH_ICON_KEYS.map((key) => {
                const config = WISH_ICONS[key];
                const IconComponent = config.icon;
                const isSelected = selectedIcon === key;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedIcon(key)}
                    className={`aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 transition-all p-2 ${
                      isSelected 
                        ? 'bg-cyan-50 border-2 border-cyan-400 text-cyan-600' 
                        : 'bg-gray-50 border-2 border-transparent text-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    <div className="w-8 h-8">
                      <IconComponent className="w-full h-full" strokeWidth={isSelected ? 2 : 1.5} />
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              
              {imagePreview ? (
                <div className="relative group">
                  <div className="aspect-video w-full rounded-2xl overflow-hidden bg-gray-100 shadow-sm border-2 border-gray-100">
                    <img src={imagePreview} alt="预览" className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute bottom-3 right-3 flex gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="w-10 h-10 bg-white/90 backdrop-blur text-gray-600 rounded-full flex items-center justify-center shadow-lg active:scale-95"
                    >
                      <Camera size={20} />
                    </button>
                    <button
                      onClick={handleRemoveImage}
                      className="w-10 h-10 bg-white/90 backdrop-blur text-red-500 rounded-full flex items-center justify-center shadow-lg active:scale-95"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-4 border-white border-t-transparent"></div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full aspect-[2/1] rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-3 hover:border-cyan-300 hover:bg-cyan-50/50 transition-all active:scale-[0.99] disabled:opacity-50 text-gray-400 hover:text-cyan-500"
                >
                  {isUploading ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-current border-t-transparent"></div>
                  ) : (
                    <>
                      <ImagePlus size={32} strokeWidth={1.5} />
                      <span className="font-bold text-sm">
                        {isGuest ? '上传心愿图片（本地存储）' : '上传心愿图片'}
                      </span>
                    </>
                  )}
                </button>
              )}
              
              {/* 游客模式提示 */}
              {isGuest && (
                <p className="text-xs text-gray-400 text-center mt-2">
                  游客模式下图片保存在本地，建议图片小于 2MB
                </p>
              )}
            </div>
          )}
        </div>
        
        <div className="pt-4 pb-10">
          <DuoButton 
            onClick={handleSave} 
            disabled={!description || !amount || isLoading || isUploading} 
            fullWidth
            size="lg"
            className="shadow-xl shadow-cyan-500/20"
          >
            {isLoading ? '保存中...' : '保存心愿'}
          </DuoButton>
        </div>
      </ContentArea>
      
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