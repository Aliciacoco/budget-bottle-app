// SpecialBudgetTimelineView.jsx - 独立预算时间轴视图
// 重构：Design System 适配 (电脑端居中)，保留时间轴核心逻辑
// 风格：专项预算使用 Indigo/Purple 色系

import React from 'react';
import { Plus, ChevronRight, Calendar, Target, Sparkles } from 'lucide-react';
import { getFloatingIcon } from '../constants/floatingIcons';

// 导入设计系统组件
import { 
  PageContainer, 
  TransparentNavBar, 
  ContentArea,
  EmptyState,
  DuoButton
} from '../components/design-system';

// ============ 辅助函数 (保持原逻辑) ============

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

// ============ 子组件 ============

// 时间轴项目组件 (适配 Design System 风格)
const TimelineItem = ({ budget, items, onClick, isLast }) => {
  const iconConfig = getFloatingIcon(budget.icon);
  const IconComponent = iconConfig.icon;
  const iconColor = iconConfig.color; // 这里可能需要强制转为 Purple 色系，或者保持原色
  const { status } = getBudgetYearAndStatus(budget);
  
  const totalBudget = (items || []).reduce((sum, item) => sum + (item.budgetAmount || 0), 0);
  const totalActual = (items || []).reduce((sum, item) => sum + (item.actualAmount || 0), 0);
  
  const isHistory = status === 'history';
  const isUpcoming = status === 'upcoming';
  
  return (
    <div className="flex gap-4">
      {/* 左侧：时间轴线和节点 */}
      <div className="flex flex-col items-center">
        <div 
          className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 z-10 transition-colors ${
            isHistory 
              ? 'bg-gray-100' 
              : isUpcoming 
                ? 'bg-indigo-50 border-2 border-indigo-100' 
                : 'bg-indigo-500 shadow-md shadow-indigo-200'
          }`}
        >
          {/* 图标 */}
          <IconComponent 
            size={20} 
            className={isHistory ? 'text-gray-300' : isUpcoming ? 'text-indigo-300' : 'text-white'} 
            strokeWidth={isHistory ? 2 : 2.5}
          />
        </div>
        
        {/* 连接线 */}
        {!isLast && (
          <div className={`w-[2px] flex-1 my-1 rounded-full ${isHistory ? 'bg-gray-100' : 'bg-indigo-100'}`} />
        )}
      </div>
      
      {/* 右侧：内容卡片 */}
      <div 
        onClick={onClick}
        className={`flex-1 mb-6 p-5 rounded-[20px] cursor-pointer active:scale-[0.98] transition-all relative overflow-hidden ${
          isHistory 
            ? 'bg-[#F9F9F9]' // 历史项目灰底
            : isUpcoming
              ? 'bg-white border-2 border-dashed border-indigo-100' // 即将开始
              : 'bg-white shadow-sm border border-indigo-50/50' // 进行中
        }`}
      >
        <div className="flex items-start justify-between mb-3 relative z-10">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={`font-bold text-lg ${isHistory ? 'text-gray-400' : 'text-gray-800'}`}>
                {budget.name}
              </h3>
              
              {/* 状态标签 */}
              {isHistory && (
                <span className="text-[10px] font-bold bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full border border-gray-200">
                  已结束
                </span>
              )}
              {isUpcoming && (
                <span className="text-[10px] font-bold bg-indigo-50 text-indigo-500 px-2 py-0.5 rounded-full border border-indigo-100">
                  即将开始
                </span>
              )}
            </div>
            
            <p className={`text-xs font-medium mt-1 ${isHistory ? 'text-gray-300' : 'text-gray-400'}`}>
              {formatDateRange(budget.startDate, budget.endDate)}
            </p>
          </div>
          
          <ChevronRight size={20} className={isHistory ? 'text-gray-200' : 'text-gray-300'} />
        </div>
        
        {/* 金额信息 */}
        <div className="flex items-baseline gap-3 relative z-10">
          <div className="flex items-baseline gap-0.5">
            <span className={`text-xs font-bold ${isHistory ? 'text-gray-300' : 'text-gray-400'}`}>预算</span>
            <span className={`text-xl font-black font-rounded ${isHistory ? 'text-gray-400' : 'text-gray-800'}`}>
              ¥{totalBudget.toLocaleString()}
            </span>
          </div>
          
          {totalActual > 0 && (
            <div className="flex items-baseline gap-0.5">
              <span className={`text-xs font-bold ${isHistory ? 'text-gray-300' : 'text-gray-400'}`}>已花</span>
              <span className={`text-sm font-bold ${
                isHistory 
                  ? 'text-gray-400' 
                  : totalActual > totalBudget ? 'text-red-500' : 'text-gray-500'
              }`}>
                ¥{totalActual.toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {/* 进度条 (仅进行中显示) */}
        {!isHistory && !isUpcoming && totalBudget > 0 && (
          <div className="mt-3 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${totalActual > totalBudget ? 'bg-red-400' : 'bg-indigo-400'}`} 
              style={{ width: `${Math.min((totalActual / totalBudget) * 100, 100)}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// 年份分隔组件 (保持设计系统风格)
const YearDivider = ({ year, isCurrentYear, totalBudget, totalActual }) => (
  <div className="mb-6 mt-2 pl-14"> {/* pl-14 是为了对齐时间轴右侧 */}
    <div className="flex items-center justify-between">
      <div className={`px-3 py-1 rounded-lg text-xs font-black tracking-wider ${
        isCurrentYear ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-400'
      }`}>
        {year}
      </div>
      
      <div className="text-xs font-bold text-gray-300">
        年度预算 ¥{totalBudget.toLocaleString()}
      </div>
    </div>
  </div>
);

// 使用说明组件 (底部)
const UsageGuide = () => (
  <div className="bg-indigo-50/50 border border-indigo-100 rounded-[20px] p-5 mt-4 mb-20 mx-14">
    <div className="flex items-center gap-2 mb-3">
      <Sparkles size={16} className="text-indigo-400" fill="currentColor" />
      <h4 className="text-indigo-900 font-bold text-sm">独立预算使用指南</h4>
    </div>
    <div className="text-indigo-800/60 text-xs space-y-2 leading-relaxed font-medium">
      <p>1. 适合 <span className="text-indigo-600 font-bold">旅行、装修、大件购物</span> 等非常规支出。</p>
      <p>2. 不占用每月的固定或日常预算额度。</p>
      <p>3. 可以设置起止时间，方便后续复盘。</p>
    </div>
  </div>
);

// ============ 主组件 ============

const SpecialBudgetTimelineView = ({
  specialBudgets = [],
  setSpecialBudgets,
  specialBudgetItems = {},
  navigateTo,
  onBack,
  isDataReady = true
}) => {
  
  // 数据处理逻辑 (保持不变)
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
    
    // 排序逻辑
    const sortedYears = Object.keys(groups).sort((a, b) => b - a);
    sortedYears.forEach(year => {
      groups[year].budgets.sort((a, b) => {
        const statusOrder = { ongoing: 0, upcoming: 1, history: 2 };
        if (statusOrder[a.status] !== statusOrder[b.status]) return statusOrder[a.status] - statusOrder[b.status];
        const dateA = a.startDate ? new Date(a.startDate) : new Date(0);
        const dateB = b.startDate ? new Date(b.startDate) : new Date(0);
        return dateB - dateA;
      });
    });
    
    return { groups, sortedYears, currentYear };
  }, [specialBudgets, specialBudgetItems]);

  // 导航栏配置
  const rightButtons = [
    {
      icon: Plus,
      onClick: () => navigateTo('editSpecialBudget', { editingSpecialBudget: {} }),
      variant: 'primary' // Indigo 色系
    }
  ];

  if (!isDataReady) return <PageContainer><div className="pt-20 text-center text-gray-400">加载中...</div></PageContainer>;

  return (
    <PageContainer>
      {/* 1. 导航栏 */}
      <TransparentNavBar 
        onBack={onBack} 
        rightButtons={rightButtons}
      />
      
      {/* 2. 标题区域 (增加 pt-24 防止遮挡) */}
      <div className="px-[30px] pt-24 pb-6">
        <h1 className="text-2xl font-black text-gray-800">独立预算</h1>
        <p className="text-gray-400 font-bold text-sm mt-1">
          专款专用的时间轴
        </p>
      </div>

      <ContentArea className="pt-0 pb-32"> {/* 底部留白给悬浮按钮 */}
        
        {specialBudgets.length === 0 ? (
          <EmptyState 
            icon={Target}
            message="还没有独立预算"
            action={
              <div className="mt-4">
                <DuoButton 
                  onClick={() => navigateTo('editSpecialBudget', { editingSpecialBudget: {} })}
                  variant="primary" // Indigo/Cyan
                  icon={Plus}
                >
                  创建第一个
                </DuoButton>
              </div>
            }
          />
        ) : (
          <>
            {groupedBudgets.sortedYears.map((year) => {
              const isCurrentYear = parseInt(year) === groupedBudgets.currentYear;
              const yearData = groupedBudgets.groups[year];
              
              return (
                <div key={year}>
                  {/* 年份分隔 */}
                  <YearDivider 
                    year={year} 
                    isCurrentYear={isCurrentYear}
                    totalBudget={yearData.totalBudget}
                    totalActual={yearData.totalActual}
                  />
                  
                  {/* 预算列表 */}
                  <div>
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
            
            {/* 底部说明 */}
            <UsageGuide />
          </>
        )}
      </ContentArea>

    </PageContainer>
  );
};

export default SpecialBudgetTimelineView;