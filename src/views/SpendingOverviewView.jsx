// SpendingOverviewView.jsx - 消费全景页面
// 展示这一周、每个月、这件事三个入口 + 文章卡片

import React, { useState } from 'react';
import { ArrowLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';

// 文章数据
const articles = [
  {
    id: 1,
    emoji: '🧠',
    title: '为什么用「周预算」，而不是月预算？',
    content: `很多人觉得，按月看钱，应该更理性。

但现实是：我们每天做决定，用的不是"理性"，而是精力。

心理学研究发现，人对"短周期的剩余感"更敏感。当你知道这周还能花多少，大脑更容易判断「要不要」。

而当数字变成"这个月还剩 ¥4,000"，它太大、太远，反而会让人失去边界感。

周预算的意义不是限制，而是把"判断负担"缩小到一个当下能承受的尺度。

你不是不自律，只是不适合每天面对一个月的重量。`
  },
  {
    id: 2,
    emoji: '🧠',
    title: '为什么固定支出，不需要每天提醒你？',
    content: `房租、订阅、水电、保险——这些钱，本来就会发生。

心理学里有一个概念叫"心理账户"：人会自动把某些支出放进「不用再想的账户」。

如果你每天都看到这些数字，大脑只会做一件事：产生持续的无力感。

CloudPool 把固定支出放在「每个月」，不是忽略它们，而是尊重一个事实：

有些钱，不需要你每天为它们做决定。

你真正需要关心的，是正在发生的生活。`
  },
  {
    id: 3,
    emoji: '🧠',
    title: '为什么「重要的事」，不该挤进每一周？',
    content: `旅行、过年、搬家、进修——这些不是日常消费，而是阶段性的决定。

如果把它们塞进周预算，会发生两件事：
• 周预算被一次性击穿
• 日常消费被错误地"惩罚"

心理学发现，当一笔钱有明确的名字和边界，人反而花得更安心。

这不是纵容，而是让每一种花钱，都名正言顺。

重要的事，值得一个单独的位置。`
  }
];

// 文章卡片组件
const ArticleCard = ({ article }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-start gap-3 text-left active:bg-white/5 transition-all"
      >
        <span className="text-xl flex-shrink-0 mt-0.5">{article.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-white font-medium text-sm leading-relaxed pr-2">
            {article.title}
          </p>
        </div>
        <div className="flex-shrink-0 mt-0.5">
          {isExpanded ? (
            <ChevronUp size={20} className="text-white/40" />
          ) : (
            <ChevronDown size={20} className="text-white/40" />
          )}
        </div>
      </button>
      
      {isExpanded && (
        <div className="px-4 pb-4">
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-white/70 text-sm leading-relaxed whitespace-pre-line">
              {article.content}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

const SpendingOverviewView = ({ 
  onBack,
  navigateTo,
  weeklyRemaining = 0,
  fixedExpensesTotal = 0,
  fixedExpensesCount = 0,
  specialBudgetsCount = 0
}) => {
  return (
    <div className="min-h-screen bg-cyan-500 relative overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@400;500;700;800&display=swap');
        .font-rounded { font-family: 'M PLUS Rounded 1c', sans-serif; }
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-12px) translateX(6px); }
        }
        .floating { animation: float 7s ease-in-out infinite; }
        .floating-delay { animation: float 7s ease-in-out infinite; animation-delay: -3.5s; }
      `}</style>
      
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* 云朵装饰 */}
        <div className="floating absolute top-16 left-0 opacity-90">
          <svg width="120" height="80" viewBox="0 0 120 80" fill="none">
            <ellipse cx="60" cy="45" rx="45" ry="30" fill="white" fillOpacity="0.95"/>
            <ellipse cx="35" cy="50" rx="30" ry="22" fill="white" fillOpacity="0.9"/>
            <ellipse cx="85" cy="52" rx="25" ry="18" fill="white" fillOpacity="0.85"/>
          </svg>
        </div>
        <div className="floating-delay absolute top-32 right-4 opacity-60">
          <svg width="70" height="50" viewBox="0 0 70 50" fill="none">
            <ellipse cx="35" cy="28" rx="26" ry="18" fill="white" fillOpacity="0.9"/>
            <ellipse cx="20" cy="32" rx="18" ry="14" fill="white" fillOpacity="0.85"/>
            <ellipse cx="50" cy="33" rx="14" ry="11" fill="white" fillOpacity="0.8"/>
          </svg>
        </div>
        
        {/* 几何装饰 */}
        <div className="absolute top-48 right-8 w-14 h-14 bg-white/10 rounded-2xl rotate-12" />
        <div className="absolute bottom-48 left-6 w-10 h-10 bg-white/10 rounded-xl -rotate-12" />
      </div>
      
      {/* 返回按钮 */}
      <div className="relative z-10 px-6 pt-4">
        <button 
          onClick={onBack}
          className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white hover:bg-white/30 active:scale-95 transition-all"
        >
          <ArrowLeft size={24} strokeWidth={2.5} />
        </button>
      </div>
      
      {/* 主内容 */}
      <div className="relative z-10 px-6 pt-6">
        {/* 标题 */}
        <h1 className="text-2xl font-extrabold text-white text-center mb-2 font-rounded">
          这是你的消费全景
        </h1>
        
        {/* 小字说明 */}
        <p className="text-white/60 text-sm text-center leading-relaxed mb-6">
          CloudPool 用三种时间尺度，<br/>
          托住你所有的消费。
        </p>
        
        {/* 三个入口卡片 */}
        <div className="space-y-4">
          {/* 这一周 */}
          <button
            onClick={() => navigateTo('transactionList')}
            className="w-full bg-gradient-to-r from-cyan-100 to-cyan-50 rounded-3xl p-5 flex items-center gap-4 active:scale-[0.98] transition-all shadow-lg"
          >
            <div className="w-14 h-14 bg-cyan-200 rounded-2xl flex items-center justify-center relative overflow-hidden">
              {/* 云朵图标 */}
              <svg width="36" height="28" viewBox="0 0 36 28" fill="none">
                <ellipse cx="18" cy="16" rx="14" ry="10" fill="#06B6D4"/>
                <ellipse cx="11" cy="18" rx="9" ry="7" fill="#22D3EE"/>
                <ellipse cx="25" cy="18" rx="8" ry="6" fill="#67E8F9"/>
              </svg>
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-gray-800 font-bold text-lg">这一周</h3>
              <p className="text-cyan-600 font-extrabold text-xl font-rounded">
                ¥{weeklyRemaining.toLocaleString()} <span className="text-gray-400 font-medium text-sm">可用</span>
              </p>
              <p className="text-gray-400 text-xs mt-0.5">每周，照顾正在发生的生活</p>
            </div>
            <ChevronRight size={24} className="text-gray-300" />
          </button>
          
          {/* 每个月 */}
          <button
            onClick={() => navigateTo('fixedExpenseList')}
            className="w-full bg-white rounded-3xl p-5 flex items-center gap-4 active:scale-[0.98] transition-all shadow-lg"
          >
            <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center">
              {/* 日历图标 */}
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <rect x="4" y="6" width="24" height="22" rx="4" fill="#FCD34D"/>
                <rect x="4" y="6" width="24" height="8" rx="4" fill="#F59E0B"/>
                <circle cx="21" cy="20" r="4" fill="#10B981" stroke="white" strokeWidth="2"/>
                <path d="M19.5 20L20.5 21L22.5 19" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-gray-800 font-bold text-lg">每个月</h3>
              <p className="text-amber-600 font-extrabold text-xl font-rounded">
                ¥{fixedExpensesTotal.toLocaleString()} <span className="text-gray-400 font-medium text-sm">已锁定</span>
              </p>
              <p className="text-gray-400 text-xs mt-0.5">每月，安放已经确定的成本</p>
            </div>
            <ChevronRight size={24} className="text-gray-300" />
          </button>
          
          {/* 这件事 */}
          <button
            onClick={() => navigateTo('specialBudgetTimeline')}
            className="w-full bg-white rounded-3xl p-5 flex items-center gap-4 active:scale-[0.98] transition-all shadow-lg"
          >
            <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center">
              {/* 箱子图标 */}
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <path d="M6 12L16 6L26 12V24L16 30L6 24V12Z" fill="#FDBA74"/>
                <path d="M6 12L16 18L26 12" stroke="#F97316" strokeWidth="2"/>
                <path d="M16 18V30" stroke="#F97316" strokeWidth="2"/>
                <rect x="12" y="8" width="8" height="6" rx="1" fill="#F97316"/>
                <path d="M14 8V6H18V8" stroke="#F97316" strokeWidth="1.5"/>
              </svg>
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-gray-800 font-bold text-lg">这件事</h3>
              <p className="text-orange-600 font-extrabold text-xl font-rounded">
                {specialBudgetsCount} <span className="text-gray-400 font-medium text-sm">项进行中</span>
              </p>
              <p className="text-gray-400 text-xs mt-0.5">每一次，留给重要的事</p>
            </div>
            <ChevronRight size={24} className="text-gray-300" />
          </button>
        </div>
        
        {/* 文章卡片区域 */}
        <div className="mt-8 mb-8">
          <p className="text-white/40 text-xs text-center mb-4 tracking-wider">
            💡 为什么这样设计
          </p>
          <div className="space-y-3">
            {articles.map(article => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </div>
        
        {/* 底部留白 */}
        <div className="h-8" />
      </div>
    </div>
  );
};

export default SpendingOverviewView;