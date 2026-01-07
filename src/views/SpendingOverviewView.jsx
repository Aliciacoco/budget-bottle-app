// SpendingOverviewView.jsx - 消费全景页（全新设计）
import React, { useState } from 'react';
import { PageContainer } from '../components/design-system';

// 极简返回箭头
const BackArrow = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 18l-6-6 6-6" />
  </svg>
);

// 右箭头
const RightArrow = ({ color = '#D1D5DB' }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18l6-6-6-6" />
  </svg>
);

// ==========================================
// 简约 SVG 插图
// ==========================================

// 周卡片 - 简约折线图
const WeeklyChart = ({ data = [30, 45, 20, 60, 35, 80, 50] }) => {
  const maxVal = Math.max(...data);
  const points = data.map((val, i) => {
    const x = 20 + (i * 40);
    const y = 80 - (val / maxVal) * 50;
    return `${x},${y}`;
  }).join(' ');
  
  // 填充区域
  const areaPoints = `20,80 ${points} 260,80`;
  
  return (
    <svg width="100%" height="100" viewBox="0 0 280 100" preserveAspectRatio="xMidYMid meet">
      {/* 渐变定义 */}
      <defs>
        <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      
      {/* 填充区域 */}
      <polygon points={areaPoints} fill="url(#chartGradient)" />
      
      {/* 折线 */}
      <polyline 
        points={points} 
        fill="none" 
        stroke="#06B6D4" 
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* 数据点 */}
      {data.map((val, i) => {
        const x = 20 + (i * 40);
        const y = 80 - (val / maxVal) * 50;
        return (
          <circle 
            key={i} 
            cx={x} 
            cy={y} 
            r="4" 
            fill="white" 
            stroke="#06B6D4" 
            strokeWidth="2"
          />
        );
      })}
      
      {/* 底部日期标签 */}
      {['一', '二', '三', '四', '五', '六', '日'].map((day, i) => (
        <text 
          key={i} 
          x={20 + (i * 40)} 
          y="96" 
          textAnchor="middle" 
          fontSize="10" 
          fill="#9CA3AF"
        >
          {day}
        </text>
      ))}
    </svg>
  );
};

// 月卡片 - 房子和树插图
const MonthlyIllustration = () => (
  <svg width="120" height="80" viewBox="0 0 120 80" fill="none">
    {/* 树 */}
    <circle cx="25" cy="45" r="15" fill="#86EFAC" />
    <circle cx="20" cy="38" r="10" fill="#4ADE80" />
    <rect x="22" y="55" width="6" height="15" rx="2" fill="#A16207" />
    
    {/* 房子 */}
    <path d="M70 35L95 55H45L70 35Z" fill="#FDE047" />
    <rect x="50" y="55" width="40" height="25" rx="2" fill="#FEF08A" />
    <rect x="62" y="62" width="16" height="18" rx="1" fill="#FBBF24" />
    <circle cx="65" cy="71" r="1.5" fill="#92400E" />
    
    {/* 窗户 */}
    <rect x="54" y="60" width="6" height="6" rx="1" fill="#FEF9C3" />
    <rect x="80" y="60" width="6" height="6" rx="1" fill="#FEF9C3" />
  </svg>
);

// 这件事卡片 - 目标/旅行插图
const GoalIllustration = () => (
  <svg width="140" height="90" viewBox="0 0 140 90" fill="none">
    {/* 云朵 */}
    <ellipse cx="100" cy="20" rx="20" ry="12" fill="#F3E8FF" />
    <ellipse cx="115" cy="22" rx="12" ry="8" fill="#E9D5FF" />
    
    {/* 山 */}
    <path d="M0 90L40 40L60 60L100 20L140 90H0Z" fill="#E9D5FF" />
    <path d="M20 90L60 50L80 70L120 30L140 90H20Z" fill="#D8B4FE" />
    
    {/* 旗帜 */}
    <rect x="98" y="15" width="2" height="30" fill="#A855F7" />
    <path d="M100 15L115 22L100 29V15Z" fill="#C084FC" />
    
    {/* 小蜜蜂装饰 */}
    <ellipse cx="50" cy="35" rx="6" ry="4" fill="#FDE047" />
    <circle cx="45" cy="35" r="3" fill="#1F2937" />
    <path d="M56 33Q60 30 58 35" stroke="#D1D5DB" strokeWidth="1" fill="none" />
    <path d="M56 37Q60 40 58 35" stroke="#D1D5DB" strokeWidth="1" fill="none" />
  </svg>
);

// ==========================================
// 卡片组件
// ==========================================

// 周卡片
const WeekCard = ({ amount = 0, onClick, chartData }) => (
  <div 
    onClick={onClick}
    className="bg-white rounded-[24px] p-5 shadow-sm active:scale-[0.98] transition-transform cursor-pointer"
  >
    <div className="flex items-start justify-between mb-2">
      <div>
        <h3 className="text-lg font-extrabold text-gray-800">这一周</h3>
        <p className="text-gray-400 text-xs mt-0.5">正在发生的生活</p>
      </div>
      <div className="flex items-center">
        <span className="text-[#06B6D4] text-xs font-bold mr-1">¥</span>
        <span className="text-[#06B6D4] text-3xl font-extrabold font-rounded">{amount.toLocaleString()}</span>
      </div>
    </div>
    
    <div className="mt-2">
      <WeeklyChart data={chartData} />
    </div>
  </div>
);

// 月卡片
const MonthCard = ({ amount = 0, onClick }) => (
  <div 
    onClick={onClick}
    className="bg-white rounded-[24px] p-5 shadow-sm active:scale-[0.98] transition-transform cursor-pointer"
  >
    <div className="flex items-start justify-between">
      <div>
        <h3 className="text-lg font-extrabold text-gray-800">每个月</h3>
        <p className="text-gray-400 text-xs mt-0.5">已锁定的成本</p>
      </div>
      <div className="flex items-center">
        <span className="text-[#FFC500] text-xs font-bold mr-1">¥</span>
        <span className="text-[#FFC500] text-3xl font-extrabold font-rounded">{amount.toLocaleString()}</span>
      </div>
    </div>
    
    <div className="flex justify-center mt-2">
      <MonthlyIllustration />
    </div>
  </div>
);

// 这件事卡片
const GoalCard = ({ count = 0, onClick }) => (
  <div 
    onClick={onClick}
    className="bg-white rounded-[24px] p-5 shadow-sm active:scale-[0.98] transition-transform cursor-pointer"
  >
    <div className="flex items-start justify-between">
      <div>
        <h3 className="text-lg font-extrabold text-gray-800">这件事</h3>
        <p className="text-gray-400 text-xs mt-0.5">重要的大事</p>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[#CE82FF] text-3xl font-extrabold font-rounded">{count}</span>
        <span className="text-xs px-2 py-1 rounded-full font-bold bg-purple-100 text-[#CE82FF]">
          进行中
        </span>
      </div>
    </div>
    
    <div className="flex justify-center mt-2">
      <GoalIllustration />
    </div>
  </div>
);

// ==========================================
// 设计理念数据
// ==========================================
const articles = [
  {
    id: 1,
    title: '周预算的哲学',
    subtitle: '判断负担的最小单位',
    content: `很多人觉得，按月看钱，应该更理性。但现实是：我们每天做决定，用的不是"理性"，而是精力。

心理学研究发现，人对"短周期的剩余感"更敏感。当你知道这周还能花多少，大脑更容易判断「要不要」。

周预算的意义不是限制，而是把"判断负担"缩小到一个当下能承受的尺度。`,
  },
  {
    id: 2,
    title: '固定支出的秘密',
    subtitle: '无需决策的心理账户',
    content: `房租、订阅、水电、保险——这些钱，本来就会发生。

心理学里有一个概念叫"心理账户"：人会自动把某些支出放进「不用再想的账户」。

CloudPool 把固定支出放在「每个月」，不是忽略它们，而是尊重一个事实：有些钱，不需要你每天为它们做决定。`,
  },
  {
    id: 3,
    title: '重要之事的特权',
    subtitle: '给热爱一个位置',
    content: `旅行、过年、搬家、进修——这些不是日常消费，而是阶段性的决定。

如果把它们塞进周预算，会发生两件事：周预算被一次性击穿，或者日常消费被错误地"惩罚"。

心理学发现，当一笔钱有明确的名字和边界，人反而花得更安心。这不是纵容，而是让每一种花钱，都名正言顺。`,
  }
];

// 文章详情弹窗
const ArticleModal = ({ article, isOpen, onClose }) => {
  if (!isOpen || !article) return null;
  
  return (
    <div 
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-t-[28px] w-full max-w-lg max-h-[80vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
        style={{ animation: 'slideUp 0.3s ease-out' }}
      >
        <style>{`
          @keyframes slideUp {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
          }
        `}</style>
        
        {/* 拖拽条 */}
        <div className="sticky top-0 bg-white pt-3 pb-2 flex justify-center rounded-t-[28px]">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>
        
        <div className="px-8 pb-10">
          <h2 className="text-2xl font-extrabold text-gray-800 mb-2">{article.title}</h2>
          <p className="text-gray-400 text-sm mb-6">{article.subtitle}</p>
          
          <div className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
            {article.content}
          </div>
          
          <button 
            onClick={onClose}
            className="w-full mt-8 py-3.5 bg-[#06B6D4] text-white rounded-2xl font-bold active:scale-[0.98] transition-transform"
          >
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
  weeklyRemaining = 555,
  fixedExpensesTotal = 618,
  specialBudgetsCount = 4,
  weeklyChartData = [30, 45, 20, 60, 35, 80, 50]
}) => {
  const [selectedArticle, setSelectedArticle] = useState(null);
  
  return (
    <div className="min-h-screen bg-[#06B6D4] overflow-x-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@400;500;700;800&display=swap');
        .font-rounded {
          font-family: 'M PLUS Rounded 1c', sans-serif;
        }
      `}</style>
      
      {/* 导航栏 */}
      <div className="px-[30px] pt-4 pb-2">
        <button 
          onClick={onBack}
          className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center active:scale-95 transition-all shadow-sm"
        >
          <BackArrow />
        </button>
      </div>
      
      {/* 标题 */}
      <div className="text-center py-4">
        <h1 className="text-xl font-extrabold text-white">我的消费全景</h1>
        <p className="text-white/70 text-sm mt-1">用三种时间尺度，托住你所有的消费。</p>
      </div>
      
      {/* 卡片区域 */}
      <div className="px-[30px] space-y-4">
        <WeekCard 
          amount={weeklyRemaining} 
          onClick={() => navigateTo('transactionList')}
          chartData={weeklyChartData}
        />
        
        <MonthCard 
          amount={fixedExpensesTotal} 
          onClick={() => navigateTo('fixedExpenseList')}
        />
        
        <GoalCard 
          count={specialBudgetsCount} 
          onClick={() => navigateTo('specialBudgetTimeline')}
        />
      </div>
      
      {/* 设计理念区域 - 透明背景 */}
      <div className="px-[30px] pt-8 pb-10">
        <p className="text-white/50 text-xs font-bold text-center mb-4 tracking-wider">设计理念</p>
        
        <div className="space-y-3">
          {articles.map(article => (
            <button
              key={article.id}
              onClick={() => setSelectedArticle(article)}
              className="w-full bg-white/15 backdrop-blur-sm rounded-[20px] px-5 py-4 flex items-center justify-between active:scale-[0.99] transition-transform"
            >
              <div className="text-left">
                <p className="text-white font-bold">{article.title}</p>
                <p className="text-white/60 text-xs mt-0.5">{article.subtitle}</p>
              </div>
              <RightArrow color="rgba(255,255,255,0.4)" />
            </button>
          ))}
        </div>
        
        {/* 底部品牌 */}
        <div className="mt-8 text-center">
          <p className="text-white/30 text-xs font-medium">CloudPool</p>
        </div>
      </div>
      
      {/* 文章弹窗 */}
      <ArticleModal 
        article={selectedArticle}
        isOpen={!!selectedArticle}
        onClose={() => setSelectedArticle(null)}
      />
    </div>
  );
};

export default SpendingOverviewView;