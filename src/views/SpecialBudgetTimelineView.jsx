// SpecialBudgetTimelineView.jsx - 独立预算时间轴视图
// 修改：移除弹窗介绍，底部简单说明，每年下方显示总额

import React, { useRef } from 'react';
import { ArrowLeft, Plus, ChevronRight, Calendar } from 'lucide-react';
import { getFloatingIcon } from '../constants/floatingIcons';

// 判断专项预算状态和年份
const getBudgetYearAndStatus = (budget) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const currentYear = today.getFullYear();
  
  let budgetYear = currentYear;
  if (budget.startDate) {
    budgetYear = new Date(budget.startDate).getFullYear();
  } else if (budget.endDate) {
    budgetYear = new Date(budget.endDate).getFullYear();
  } else if (budget.createdAt) {
    budgetYear = new Date(budget.createdAt).getFullYear();
  }
  
  let status = 'ongoing';
  if (!budget.startDate && !budget.endDate) {
    status = 'ongoing';
  } else {
    const endDate = budget.endDate ? new Date(budget.endDate) : null;
    const startDate = budget.startDate ? new Date(budget.startDate) : null;
    
    if (endDate && endDate < today) {
      status = 'history';
    } else if (startDate && startDate > today) {
      status = 'upcoming';
    } else {
      status = 'ongoing';
    }
  }
  
  return { year: budgetYear, status };
};

// 格式化日期范围
const formatDateRange = (startDate, endDate) => {
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };
  
  if (startDate && endDate) {
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  } else if (startDate) {
    return `${formatDate(startDate)} 起`;
  } else if (endDate) {
    return `至 ${formatDate(endDate)}`;
  }
  return '长期';
};

// 时间轴项目组件
const TimelineItem = ({ budget, items, onClick, isLast }) => {
  const iconConfig = getFloatingIcon(budget.icon);
  const IconComponent = iconConfig.icon;
  const iconColor = iconConfig.color;
  const { status } = getBudgetYearAndStatus(budget);
  
  const totalBudget = (items || []).reduce((sum, item) => sum + (item.budgetAmount || 0), 0);
  const totalActual = (items || []).reduce((sum, item) => sum + (item.actualAmount || 0), 0);
  
  const isHistory = status === 'history';
  const isUpcoming = status === 'upcoming';
  
  return (
    <div className="flex gap-4">
      {/* 时间轴线和节点 */}
      <div className="flex flex-col items-center">
        <div 
          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            isHistory ? 'bg-gray-200' : isUpcoming ? 'bg-cyan-100' : 'bg-cyan-500'
          }`}
        >
          <div className="w-6 h-6" style={{ opacity: isHistory ? 0.5 : 1 }}>
            <IconComponent className="w-full h-full" style={{ color: isHistory ? '#9CA3AF' : (isUpcoming ? iconColor : 'white') }} />
          </div>
        </div>
        {!isLast && (
          <div className={`w-0.5 flex-1 min-h-[20px] ${isHistory ? 'bg-gray-200' : 'bg-cyan-200'}`} />
        )}
      </div>
      
      {/* 内容卡片 */}
      <div 
        onClick={onClick}
        className={`flex-1 mb-4 p-4 rounded-2xl cursor-pointer active:scale-[0.99] transition-all ${
          isHistory 
            ? 'bg-gray-100 opacity-70' 
            : isUpcoming
            ? 'bg-cyan-50 border-2 border-dashed border-cyan-200'
            : 'bg-white shadow-sm'
        }`}
      >
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`font-bold ${isHistory ? 'text-gray-500' : 'text-gray-800'}`}>
                {budget.name}
              </h3>
              {isHistory && (
                <span className="text-xs bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded">已结束</span>
              )}
              {isUpcoming && (
                <span className="text-xs bg-cyan-200 text-cyan-600 px-1.5 py-0.5 rounded">即将开始</span>
              )}
            </div>
            <p className={`text-xs mt-1 ${isHistory ? 'text-gray-400' : 'text-gray-400'}`}>
              {formatDateRange(budget.startDate, budget.endDate)}
            </p>
          </div>
          <ChevronRight size={18} className={isHistory ? 'text-gray-300' : 'text-gray-300'} />
        </div>
        
        <div className="flex items-baseline gap-2">
          <span className={`text-xl font-extrabold font-rounded ${isHistory ? 'text-gray-500' : 'text-gray-800'}`}>
            ¥{totalBudget.toLocaleString()}
          </span>
          {totalActual > 0 && (
            <span className={`text-sm ${totalActual > totalBudget ? 'text-red-500' : 'text-gray-400'}`}>
              已花 ¥{totalActual.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// 年份分隔组件（含总额）
const YearDivider = ({ year, isCurrentYear, totalBudget, totalActual }) => (
  <div className="my-4">
    <div className="flex items-center gap-3 mb-2">
      <div className={`px-3 py-1 rounded-full text-sm font-bold ${
        isCurrentYear ? 'bg-cyan-500 text-white' : 'bg-gray-200 text-gray-500'
      }`}>
        {year}年
      </div>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
    
    {/* 年度总额 */}
    <div className="flex items-center gap-4 ml-1 text-sm">
      <span className="text-gray-400">
        预算 <span className="font-bold text-gray-600">¥{totalBudget.toLocaleString()}</span>
      </span>
      {totalActual > 0 && (
        <span className="text-gray-400">
          实际 <span className={`font-bold ${totalActual > totalBudget ? 'text-red-500' : 'text-gray-600'}`}>
            ¥{totalActual.toLocaleString()}
          </span>
        </span>
      )}
    </div>
  </div>
);

// 使用说明组件
const UsageGuide = () => (
  <div className="bg-cyan-50 rounded-2xl p-4 mt-6 mb-4">
    <h4 className="text-cyan-700 font-bold text-sm mb-2">💡 如何使用独立预算</h4>
    <div className="text-cyan-600 text-xs space-y-1.5 leading-relaxed">
      <p><span className="font-medium">1.</span> 为旅行、大件购物、节日等创建专属预算</p>
      <p><span className="font-medium">2.</span> 添加预算明细，如机票、住宿、礼物等</p>
      <p><span className="font-medium">3.</span> 记录实际消费，对比预算执行情况</p>
      <p><span className="font-medium">4.</span> 可置顶到首页，快速记录消费</p>
    </div>
  </div>
);

const SpecialBudgetTimelineView = ({
  specialBudgets = [],
  setSpecialBudgets,
  specialBudgetItems = {},
  navigateTo,
  onBack,
  isDataReady
}) => {
  const scrollRef = useRef(null);
  
  // 按年份分组预算，并计算每年总额
  const groupedBudgets = React.useMemo(() => {
    const groups = {};
    const currentYear = new Date().getFullYear();
    
    specialBudgets.forEach(budget => {
      const { year, status } = getBudgetYearAndStatus(budget);
      if (!groups[year]) {
        groups[year] = { budgets: [], totalBudget: 0, totalActual: 0 };
      }
      
      const items = specialBudgetItems[budget.id] || [];
      const budgetTotal = items.reduce((sum, item) => sum + (item.budgetAmount || 0), 0);
      const actualTotal = items.reduce((sum, item) => sum + (item.actualAmount || 0), 0);
      
      groups[year].budgets.push({ ...budget, status });
      groups[year].totalBudget += budgetTotal;
      groups[year].totalActual += actualTotal;
    });
    
    // 按年份排序（从新到旧）
    const sortedYears = Object.keys(groups).sort((a, b) => b - a);
    
    // 对每年内的预算按状态和日期排序
    sortedYears.forEach(year => {
      groups[year].budgets.sort((a, b) => {
        const statusOrder = { ongoing: 0, upcoming: 1, history: 2 };
        if (statusOrder[a.status] !== statusOrder[b.status]) {
          return statusOrder[a.status] - statusOrder[b.status];
        }
        const dateA = a.startDate ? new Date(a.startDate) : new Date(0);
        const dateB = b.startDate ? new Date(b.startDate) : new Date(0);
        return dateB - dateA;
      });
    });
    
    return { groups, sortedYears, currentYear };
  }, [specialBudgets, specialBudgetItems]);
  
  if (!isDataReady) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@400;500;700;800&display=swap');
        .font-rounded { font-family: 'M PLUS Rounded 1c', sans-serif; }
      `}</style>
      
      {/* 顶部导航 */}
      <div className="sticky top-0 z-20 bg-gray-50/95 backdrop-blur-sm">
        <div className="px-6 pt-4 pb-3">
          <div className="flex items-center justify-between">
            <button 
              onClick={onBack}
              className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-gray-400 hover:text-gray-600 active:scale-95 transition-all"
            >
              <ArrowLeft size={24} strokeWidth={2.5} />
            </button>
            
            <h1 className="text-lg font-bold text-gray-800">独立预算</h1>
            
            <div className="w-12" />
          </div>
        </div>
      </div>
      
      {/* 内容区域 */}
      <div ref={scrollRef} className="px-6 pb-24">
        {specialBudgets.length === 0 ? (
          /* 空状态 */
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-20 h-20 bg-cyan-100 rounded-2xl flex items-center justify-center mb-4">
              <Calendar size={40} className="text-cyan-500" />
            </div>
            <h2 className="text-lg font-bold text-gray-700 mb-2">还没有独立预算</h2>
            <p className="text-gray-400 text-sm text-center mb-6">
              为旅行、大件购物等特殊支出<br/>创建专属预算
            </p>
            <button
              onClick={() => navigateTo('editSpecialBudget', { editingSpecialBudget: {} })}
              className="px-6 py-3 bg-cyan-500 text-white font-bold rounded-xl flex items-center gap-2 active:scale-95 transition-all shadow-lg shadow-cyan-500/30"
            >
              <Plus size={20} />
              创建独立预算
            </button>
            
            {/* 使用说明 */}
            <UsageGuide />
          </div>
        ) : (
          /* 时间轴 */
          <>
            {groupedBudgets.sortedYears.map((year) => {
              const isCurrentYear = parseInt(year) === groupedBudgets.currentYear;
              const yearData = groupedBudgets.groups[year];
              
              return (
                <div key={year}>
                  <YearDivider 
                    year={year} 
                    isCurrentYear={isCurrentYear}
                    totalBudget={yearData.totalBudget}
                    totalActual={yearData.totalActual}
                  />
                  
                  <div className="ml-1">
                    {yearData.budgets.map((budget, index) => (
                      <TimelineItem
                        key={budget.id}
                        budget={budget}
                        items={specialBudgetItems[budget.id]}
                        onClick={() => navigateTo('specialBudgetDetail', { editingSpecialBudget: budget })}
                        isLast={index === yearData.budgets.length - 1}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
            
            {/* 底部使用说明 */}
            <UsageGuide />
          </>
        )}
      </div>
      
      {/* 底部添加按钮 */}
      {specialBudgets.length > 0 && (
        <div className="fixed bottom-6 left-0 right-0 flex justify-center z-10">
          <button
            onClick={() => navigateTo('editSpecialBudget', { editingSpecialBudget: {} })}
            className="px-6 py-3 bg-cyan-500 text-white font-bold rounded-full flex items-center gap-2 active:scale-95 transition-all shadow-lg shadow-cyan-500/30"
          >
            <Plus size={20} />
            新建独立预算
          </button>
        </div>
      )}
    </div>
  );
};

export default SpecialBudgetTimelineView;