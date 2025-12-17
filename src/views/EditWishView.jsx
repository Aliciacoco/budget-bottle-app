//查看/编辑心愿页面

import React, { useState } from 'react';
import { ArrowLeft, Edit, Trash2, Check, Undo2, Heart } from 'lucide-react';
import { createWish, updateWish, deleteWish, getWishes, getWishPool, createWishPoolHistory, getWishPoolHistory, deleteWishPoolHistory } from '../api';
import ConfirmModal from '../components/ConfirmModal';

const EditWishView = ({ 
  editingWish, 
  wishes, 
  setWishes, 
  wishPoolAmount, 
  setWishPoolAmount, 
  onWishFulfilled, 
  onWishRevoked 
}) => {
  const isNew = !editingWish?.id;
  const [isEditMode, setIsEditMode] = useState(isNew);
  const [description, setDescription] = useState(editingWish?.description || '');
  const [amount, setAmount] = useState(editingWish?.amount?.toString() || '');
  const [image, setImage] = useState(editingWish?.image || null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showFulfillConfirm, setShowFulfillConfirm] = useState(false);
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const wishAmount = parseFloat(amount || 0);
  const canFulfill = wishPoolAmount >= wishAmount && wishAmount > 0;
  const isFulfilled = editingWish?.fulfilled || false;

  const handleSave = async () => {
    if (!description || !amount) return;
    setIsLoading(true);
    try {
      let result;
      if (isNew) {
        result = await createWish(description, parseFloat(amount), image, false);
      } else {
        result = await updateWish(editingWish.id, description, parseFloat(amount), image, isFulfilled);
      }
      if (result.success) {
        const wishResult = await getWishes();
        if (wishResult.success) setWishes(wishResult.data);
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
      const result = await deleteWish(editingWish.id);
      if (result.success) {
        setWishes(wishes.filter(w => w.id !== editingWish.id));
        window.history.back();
      } else {
        alert('删除失败: ' + result.error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const confirmFulfill = async () => {
    if (!canFulfill) return;
    setShowFulfillConfirm(false);
    setIsLoading(true);
    try {
      // 创建扣除记录
      const historyKey = 'WISH-' + editingWish.id + '-' + Date.now();
      await createWishPoolHistory(historyKey, 0, 0, -wishAmount, true, description, editingWish.id);
      
      // 更新心愿状态
      const result = await updateWish(editingWish.id, description, wishAmount, image, true);
      if (result.success) {
        // 重新加载心愿池余额
        const poolResult = await getWishPool();
        if (poolResult.success) setWishPoolAmount(poolResult.data.amount);
        
        // 重新加载心愿列表
        const wishResult = await getWishes();
        if (wishResult.success) setWishes(wishResult.data);
        
        window.history.back();
      }
    } catch (error) {
      alert('操作失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const confirmRevoke = async () => {
    setShowRevokeConfirm(false);
    setIsLoading(true);
    try {
      // 找到并删除扣除记录
      const historyResult = await getWishPoolHistory();
      if (historyResult.success) {
        const targetRecord = historyResult.data.find(h => h.wishId === editingWish.id && h.isDeduction);
        if (targetRecord) {
          await deleteWishPoolHistory(targetRecord.id);
        }
      }
      
      // 更新心愿状态为未实现
      const result = await updateWish(editingWish.id, description, wishAmount, image, false);
      if (result.success) {
        // 重新加载心愿池余额
        const poolResult = await getWishPool();
        if (poolResult.success) setWishPoolAmount(poolResult.data.amount);
        
        // 重新加载心愿列表
        const wishResult = await getWishes();
        if (wishResult.success) setWishes(wishResult.data);
        
        window.history.back();
      }
    } catch (error) {
      alert('操作失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // 查看模式
  if (!isEditMode && !isNew) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <div className="bg-white p-6">
          <div className="flex items-center justify-between">
            <button onClick={() => window.history.back()} className="text-gray-600 active:scale-95">
              <ArrowLeft size={24} />
            </button>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsEditMode(true)} 
                className="p-2 text-gray-500 active:scale-95"
              >
                <Edit size={20} />
              </button>
              <button 
                onClick={() => setShowDeleteConfirm(true)} 
                className="p-2 text-red-400 active:scale-95"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        </div>
        
        {/* 心愿内容 */}
        <div className="flex-1 p-6">
          {/* 图片 */}
          {image && (
            <div className="mb-6">
              <img src={image} alt="" className="w-full h-48 object-cover rounded-2xl" />
            </div>
          )}
          
          {/* 心愿信息 */}
          <div className="bg-white rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className={'w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ' + (isFulfilled ? 'bg-green-100' : 'bg-pink-100')}>
                <Heart size={28} className={isFulfilled ? 'text-green-500' : 'text-pink-400'} />
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-bold text-gray-800">{description}</h1>
                <p className="text-2xl font-bold text-gray-800 mt-2">¥{wishAmount.toLocaleString()}</p>
                {isFulfilled ? (
                  <div className="mt-3 flex items-center gap-2 text-green-600">
                    <Check size={18} />
                    <span className="font-medium">已实现 🎉</span>
                  </div>
                ) : canFulfill ? (
                  <p className="mt-3 text-green-600 text-sm">心愿池余额充足，可以实现啦！</p>
                ) : (
                  <p className="mt-3 text-gray-400 text-sm">还差 ¥{(wishAmount - wishPoolAmount).toLocaleString()}</p>
                )}
              </div>
            </div>
          </div>
          
          {/* 心愿池状态 */}
          <div className="mt-4 bg-cyan-50 rounded-2xl p-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">心愿池余额</span>
              <span className="text-lg font-bold text-cyan-600">¥{wishPoolAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>
        
        {/* 底部按钮 */}
        <div className="p-6 bg-white border-t border-gray-100">
          {isFulfilled ? (
            <button
              onClick={() => setShowRevokeConfirm(true)}
              className="w-full py-4 bg-amber-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 active:scale-95"
            >
              <Undo2 size={20} />
              撤销实现
            </button>
          ) : (
            <button
              onClick={() => setShowFulfillConfirm(true)}
              disabled={!canFulfill}
              className={'w-full py-4 rounded-xl font-medium flex items-center justify-center gap-2 active:scale-95 ' + (canFulfill ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white' : 'bg-gray-200 text-gray-400')}
            >
              <Heart size={20} />
              实现心愿
            </button>
          )}
        </div>

        {/* 弹窗 */}
        <ConfirmModal 
          isOpen={showDeleteConfirm} 
          title="删除心愿" 
          message={'确定要删除"' + description + '"吗？此操作无法撤销。'} 
          onConfirm={handleDelete} 
          onCancel={() => setShowDeleteConfirm(false)} 
        />
        
        {showFulfillConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-2xl p-6 mx-4 w-full max-w-sm">
              <h2 className="text-lg font-bold text-gray-800 mb-2">✨ 实现心愿</h2>
              <p className="text-gray-600 mb-4">确定要实现「{description}」吗？</p>
              <div className="bg-cyan-50 rounded-xl p-4 mb-4">
                <p className="text-cyan-700 text-sm">心愿池将扣除 <span className="font-bold">¥{wishAmount}</span></p>
                <p className="text-cyan-600 text-xs mt-1">扣除后余额：¥{(wishPoolAmount - wishAmount).toFixed(2)}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowFulfillConfirm(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium active:scale-95">取消</button>
                <button onClick={confirmFulfill} className="flex-1 py-3 bg-green-500 text-white rounded-xl font-medium active:scale-95">确认实现</button>
              </div>
            </div>
          </div>
        )}
        
        {showRevokeConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-2xl p-6 mx-4 w-full max-w-sm">
              <h2 className="text-lg font-bold text-gray-800 mb-2">↩️ 撤销心愿实现</h2>
              <p className="text-gray-600 mb-4">确定要撤销「{description}」的实现状态吗？</p>
              <div className="bg-amber-50 rounded-xl p-4 mb-4">
                <p className="text-amber-700 text-sm">心愿池将返还 <span className="font-bold">¥{wishAmount}</span></p>
                <p className="text-amber-600 text-xs mt-1">返还后余额：¥{(wishPoolAmount + wishAmount).toFixed(2)}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowRevokeConfirm(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium active:scale-95">取消</button>
                <button onClick={confirmRevoke} className="flex-1 py-3 bg-amber-500 text-white rounded-xl font-medium active:scale-95">确认撤销</button>
              </div>
            </div>
          </div>
        )}

        {/* 加载遮罩 */}
        {isLoading && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black bg-opacity-30">
            <div className="bg-white rounded-2xl p-6 flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
              <p className="text-gray-600 mt-3">处理中...</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 编辑模式
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => isNew ? window.history.back() : setIsEditMode(false)} className="flex items-center gap-2 text-gray-600 mb-6 active:scale-95">
          <ArrowLeft size={20} />返回
        </button>
        <h1 className="text-2xl font-bold text-gray-800 mb-8">{isNew ? '添加心愿' : '编辑心愿'}</h1>
        <div className="bg-white rounded-2xl p-6 space-y-6">
          <div>
            <label className="block text-gray-600 mb-2">心愿描述</label>
            <input 
              type="text" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="例如：羽绒服"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-400 focus:outline-none" 
            />
          </div>
          <div>
            <label className="block text-gray-600 mb-2">金额</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-gray-400">¥</span>
              <input 
                type="number" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)} 
                placeholder="0"
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl text-lg focus:border-pink-400 focus:outline-none" 
              />
            </div>
          </div>
          <div>
            <label className="block text-gray-600 mb-2">图片（可选）</label>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleImageUpload} 
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl" 
            />
            {image && (
              <div className="mt-4 relative">
                <img src={image} alt="" className="w-full h-40 object-cover rounded-xl" />
                <button 
                  onClick={() => setImage(null)} 
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full active:scale-95"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>
          <button 
            onClick={handleSave} 
            disabled={!description || !amount || isLoading}
            className="w-full py-4 bg-gray-800 text-white rounded-xl font-medium disabled:bg-gray-300 active:scale-95"
          >
            {isLoading ? '保存中...' : '保存'}
          </button>
        </div>
      </div>

      {/* 加载遮罩 */}
      {isLoading && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-2xl p-6 flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
            <p className="text-gray-600 mt-3">处理中...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditWishView;