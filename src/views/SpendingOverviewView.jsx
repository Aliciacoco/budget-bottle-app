// SpendingOverviewView.jsx - 消费全景页
// v12: 修复进行中标签旋转、正确计算进行中数量

import React, { useState, useEffect } from 'react';
import { 
  Cloud,          
  House,          
  Sailboat,       
  Lightbulb, 
  PiggyBank, 
  Rocket,
  ChevronRight,
  BookOpen        
} from 'lucide-react';
import { 
  PageContainer, 
  TransparentNavBar, 
  ContentArea,
  colors 
} from '../components/design-system';
import { getSpecialBudgets } from '../api';

// ==========================================
// 判断预算是否进行中
// ==========================================
const isOngoing = (budget) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // 没有日期设置的默认为进行中
  if (!budget.startDate && !budget.endDate) {
    return true;
  }
  
  const startDate = budget.startDate ? new Date(budget.startDate) : null;
  const endDate = budget.endDate ? new Date(budget.endDate) : null;
  
  // 已结束
  if (endDate && endDate < today) {
    return false;
  }
  
  // 还未开始
  if (startDate && startDate > today) {
    return false;
  }
  
  // 进行中
  return true;
};

// ==========================================
// 1. 游戏化卡片组件 (保持不变)
// ==========================================
const GameCard = ({ 
  title, 
  subtitle, 
  value, 
  valuePrefix = '¥',
  valueSuffix = '',
  valueColor, 
  icon: Icon,
  progress = null,
  badge = null,
  onClick,
  layout = 'row'
}) => (
  <button
    onClick={onClick}
    className={`w-full bg-white rounded-[32px] p-6 text-left relative overflow-hidden transition-transform active:scale-[0.98] shadow-sm ${
      layout === 'col' ? 'flex flex-col justify-between h-[180px]' : 'flex flex-col'
    }`}
    style={{
      boxShadow: '0 6px 0 rgba(0,0,0,0.06)', 
    }}
  >
    {/* 布局逻辑 */}
    {layout === 'row' ? (
      // === 横向布局 ===
      <>
        <div className="flex justify-between items-start w-full mb-3">
          <div className="flex items-center gap-4">
             <Icon size={44} style={{ color: valueColor }} fill="currentColor" strokeWidth={0} />
             <div>
               <h3 className="text-2xl font-black text-gray-800 tracking-tight">{title}</h3>
               <p className="text-gray-400 text-xs font-bold mt-1 tracking-wide pr-4">{subtitle}</p>
             </div>
          </div>
          <ChevronRight size={24} className="text-gray-300/50" strokeWidth={3} />
        </div>
        
        <div className="mt-1 mb-3">
          <div className="flex items-baseline gap-1.5">
             {valuePrefix && <span className="text-xl font-black opacity-80" style={{ color: valueColor }}>{valuePrefix}</span>}
             <span className="text-3xl font-black font-rounded " style={{ color: valueColor }}>
               {typeof value === 'number' ? value.toLocaleString() : value}
             </span>
          </div>
        </div>
      </>
    ) : (
      // === 纵向布局 ===
      <>
        <div className="w-full">
          <div className="flex justify-between items-start mb-4">
             <Icon size={38} style={{ color: valueColor }} fill="currentColor" strokeWidth={0} />
             <ChevronRight size={20} className="text-gray-200" strokeWidth={3} />
          </div>
          <h3 className="text-lg font-black text-gray-800 leading-tight mb-1">{title}</h3>
          <p className="text-gray-400 text-xs font-bold line-clamp-1">{subtitle}</p>
        </div>
        
        <div className="flex items-center gap-2 mt-auto">
          <div className="flex items-baseline gap-1">
            {valuePrefix && <span className="text-base font-black" style={{ color: valueColor }}>{valuePrefix}</span>}
            <span className="text-2xl font-black font-rounded tracking-tight" style={{ color: valueColor }}>
              {typeof value === 'number' ? value.toLocaleString() : value}
            </span>
            {valueSuffix && <span className="text-xs font-bold text-gray-400 ml-0.5">{valueSuffix}</span>}
          </div>
          
          {/* 修复：移除 rotate-2 旋转 */}
          {badge && (
            <span 
              className="text-[10px] px-1.5 py-0.5 rounded-md font-black border"
              style={{ 
                backgroundColor: badge.bg, 
                color: badge.color,
                borderColor: badge.borderColor || badge.color
              }}
            >
              {badge.text}
            </span>
          )}
        </div>
      </>
    )}

  </button>
);

// ==========================================
// 2. 底部游戏风格按钮 (无图标版)
// ==========================================
const GameListButton = ({ title, subtitle, onClick }) => (
  <button
    onClick={onClick}
    className="w-full mb-3 group active:scale-[0.98] transition-all"
  >
    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-[24px] px-5 py-5 flex items-center justify-between relative overflow-hidden hover:bg-white/15 transition-colors">
       <div className="text-left flex-1 min-w-0 pr-4">
         <p className="text-white font-extrabold text-base leading-tight truncate">{title}</p>
         <p className="text-cyan-100 text-xs font-bold mt-1.5 opacity-90 line-clamp-1">{subtitle}</p>
       </div>
       <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors shrink-0">
         <ChevronRight size={16} className="text-white" strokeWidth={3} />
       </div>
    </div>
  </button>
);

// ==========================================
// 文章数据
// ==========================================
const articles = [
  {
    id: 1,
    title: '周预算的哲学',
    subtitle: '为什么"一周"是控制欲望的最佳单位？',
    icon: Lightbulb,
    content: `很多人觉得，按月看钱，应该更理性。但现实是：我们每天做决定，用的不是"理性"，而是精力。\n\n心理学研究发现，人对"短周期的剩余感"更敏感。当你知道这周还能花多少，大脑更容易判断「要不要」。\n\n周预算的意义不是限制，而是把"判断负担"缩小到一个当下能承受的尺度。`,
  },
  {
    id: 2,
    title: '看不见的心理账户',
    subtitle: '如何利用大脑的"偷懒机制"管理固定支出？',
    icon: PiggyBank,
    content: `房租、订阅、水电、保险——这些钱，本来就会发生。\n\n心理学里有一个概念叫"心理账户"：人会自动把某些支出放进「不用再想的账户」。\n\nCloudPool 把固定支出放在「每个月」，不是忽略它们，而是尊重一个事实：有些钱，不需要你每天为它们做决定。`,
  },
  {
    id: 3,
    title: '重要之事的特权',
    subtitle: '给热爱一个位置，让花钱名正言顺',
    icon: Rocket,
    content: `旅行、过年、搬家、进修——这些不是日常消费，而是阶段性的决定。\n\n如果把它们塞进周预算，会发生两件事：周预算被一次性击穿，或者日常消费被错误地"惩罚"。\n\n心理学发现，当一笔钱有明确的名字和边界，人反而花得更安心。这不是纵容，而是让每一种花钱，都名正言顺。`,
  }
];

// ==========================================
// 文章弹窗
// ==========================================
const ArticleModal = ({ article, isOpen, onClose }) => {
  if (!isOpen || !article) return null;
  const IconComponent = article.icon;
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-md" onClick={onClose}>
      <div className="bg-white rounded-t-[32px] w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()} style={{ animation: 'slideUp 0.3s ease-out' }}>
        <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
        <div className="sticky top-0 bg-white pt-3 pb-2 flex justify-center rounded-t-[32px]">
          <div className="w-12 h-1.5 bg-gray-200 rounded-full" />
        </div>
        <div className="pt-8 px-8 pb-10">
          <h2 className="text-2xl font-black text-gray-800 mb-2 text-center">{article.title}</h2>
          <p className="text-gray-400 text-sm font-bold mb-8 text-center">{article.subtitle}</p>
          <div className="text-gray-600 text-base leading-relaxed whitespace-pre-line font-medium bg-gray-50 p-6 rounded-2xl">
              {article.content}
          </div>
          <button onClick={onClose} className="w-full mt-8 py-4 bg-[#00C2E0] text-white rounded-2xl font-black text-lg  shadow-cyan-200 active:scale-95 transition-all">
              我明白了
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 主页面
// ==========================================
const SpendingOverviewView = ({ 
  onBack,
  navigateTo,
  weeklySpent = 0,
  weeklyBudget = 0,
  weeklyRemaining,
  fixedExpensesTotal = 0,
  specialBudgetsCount = 0,
}) => {
  const [selectedArticle, setSelectedArticle] = useState(null);
  
  // 新增：进行中的独立预算数量
  const [ongoingCount, setOngoingCount] = useState(specialBudgetsCount);
  
  // 新增：加载独立预算数据并计算进行中数量
  useEffect(() => {
    const loadOngoingCount = async () => {
      try {
        const result = await getSpecialBudgets();
        if (result.success && result.data) {
          const ongoing = result.data.filter(budget => isOngoing(budget));
          setOngoingCount(ongoing.length);
        }
      } catch (error) {
        console.error('加载独立预算失败:', error);
        setOngoingCount(specialBudgetsCount);
      }
    };
    
    loadOngoingCount();
  }, [specialBudgetsCount]);
  
  const displayRemaining = weeklyRemaining !== undefined ? weeklyRemaining : (weeklyBudget - weeklySpent);
  
  const progressPercent = weeklyBudget > 0 
    ? Math.min(Math.max((weeklySpent / weeklyBudget) * 100, 0), 100) 
    : 0;
  
  return (
    <PageContainer>
      <div 
        className="min-h-screen pb-10 font-sans"
        style={{ backgroundColor: '#00C2E0' }} 
      >
        
        <TransparentNavBar onBack={onBack} variant="white" />
        
        <ContentArea className="pt-24 pb-10">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-black text-white tracking-tight">我的消费全景</h1>
            <p className="text-cyan-100 font-bold text-sm mt-2 opacity-90">用三种时间尺度，托住你所有的消费。</p>
          </div>
          
          <div className="space-y-4">
            
            {/* 1. 本周挑战 */}
            <GameCard
              title="这一周"
              subtitle="剩余预算将自动存入心愿池"
              value={displayRemaining}
              valueColor={colors.primary} 
              icon={Cloud}
              layout="row"
              onClick={() => navigateTo('transactionList')}
            />
            
            {/* 2. 双列卡片 */}
            <div className="grid grid-cols-2 gap-4">
              <GameCard
                title="这个月"
                subtitle="房租/订阅等固定项"
                value={fixedExpensesTotal}
                valueSuffix="/月"
                valueColor={colors.yellow}
                icon={House}
                layout="col"
                onClick={() => navigateTo('fixedExpenseList')}
              />
              
              {/* 修复：使用 ongoingCount 而不是 specialBudgetsCount */}
              <GameCard
                title="这件事"
                subtitle="旅行/大件等大事"
                value={ongoingCount}
                valuePrefix=""
                valueColor={colors.purple}
                icon={Sailboat}
                layout="col"
                badge={{ 
                  text: '进行中', 
                  bg: '#F3E8FF', 
                  color: colors.purple,
                  borderColor: '#E9D5FF'
                }}
                onClick={() => navigateTo('specialBudgetTimeline')}
              />
            </div>

          </div>
          
          {/* 底部锦囊 */}
          <div className="mt-10">
            <div className="flex items-center justify-center gap-2 mb-6 opacity-80">
               <p className="text-white text-xs font-black tracking-wider">为何这样设计</p>
            </div>
            
            <div>
              {articles.map(article => (
                <GameListButton
                  key={article.id}
                  title={article.title}
                  subtitle={article.subtitle}
                  onClick={() => setSelectedArticle(article)}
                />
              ))}
            </div>
          </div>
        </ContentArea>
        
        <ArticleModal 
          article={selectedArticle}
          isOpen={!!selectedArticle}
          onClose={() => setSelectedArticle(null)}
        />
      </div>
    </PageContainer>
  );
};

export default SpendingOverviewView;