// SpecialBudgetTimelineView.jsx - 独立预算列表页面
// 更新：按年份分组、移除大卡片、修复图标显示
// 更新：图标底色使用各自的 bgColor

import React from 'react';
import { Plus, Target, ChevronRight, Plane } from 'lucide-react';
import { getFloatingIcon } from '../constants/floatingIcons';

// 导入设计系统组件
import { 
  PageContainer, 
  TransparentNavBar, 
  ContentArea,
  ListGroup,
  EmptyState,
  DuoButton
} from '../components/design-system';

// 主题色常量
const THEME_COLOR = '#CE82FF';

// ============ 辅助函数 ============

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
  return '长期有效';
};

// 获取状态标签
const getStatusLabel = (status) => {
  switch (status) {
    case 'ongoing': return { text: '进行中', color: 'bg-[#F5E6FF] text-[#CE82FF]' };
    case 'upcoming': return { text: '即将开始', color: 'bg-gray-100 text-gray-400' };
    case 'history': return { text: '已结束', color: 'bg-gray-100 text-gray-400' };
    default: return { text: '进行中', color: 'bg-[#F5E6FF] text-[#CE82FF]' };
  }
};

// ============ 子组件 ============

// 年份分隔组件
const YearDivider = ({ year, isCurrentYear, totalBudget, totalActual }) => (
  <div className="mb-4 mt-2">
    <div className="flex items-center gap-3">
      <span className={`text-lg font-black ${isCurrentYear ? 'text-[#CE82FF]' : 'text-gray-400'}`}>
        {year}
      </span>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
    <p className="text-xs text-gray-400 mt-1">
      预算 ¥{totalBudget.toLocaleString()}，已花 ¥{totalActual.toLocaleString()}
    </p>
  </div>
);

// 预算列表项
const BudgetItem = ({ budget, items, onClick, status }) => {
  // 获取图标配置，提供默认值
  const iconConfig = getFloatingIcon(budget.icon) || { 
    icon: Plane, 
    color: THEME_COLOR,
    bgColor: '#F5E6FF'  // 默认浅紫色
  };
  const IconComponent = iconConfig.icon || Plane;
  const statusLabel = getStatusLabel(status);
  const isHistory = status === 'history';
  
  // 使用图标自己的 bgColor，如果没有则用默认浅紫色
  const iconBgColor = iconConfig.bgColor || '#F5E6FF';
  
  const totalBudget = (items || []).reduce((sum, item) => sum + (item.budgetAmount || 0), 0);
  const totalActual = (items || []).reduce((sum, item) => sum + (item.actualAmount || 0), 0);
  
  return (
    <button
      onClick={onClick}
      className={`w-full bg-[#F9F9F9] rounded-[20px] px-4 py-4 flex items-center gap-4 active:scale-[0.99] transition-all ${
        isHistory ? 'opacity-60' : ''
      }`}
    >
      {/* 图标 - 48x48 容器，图标 24px，使用各自的 bgColor */}
      <div 
        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: isHistory ? '#F3F4F6' : iconBgColor }}
      >
        <IconComponent 
          size={24} 
          style={{ color: isHistory ? '#9CA3AF' : iconConfig.color }}
          strokeWidth={1.5}
        />
      </div>
      
      {/* 内容 */}
      <div className="flex-1 text-left min-w-0">
        <div className="flex items-center gap-2">
          <p className={`font-bold ${isHistory ? 'text-gray-400' : 'text-gray-700'}`}>
            {budget.name}
          </p>
          {/* 状态标签 */}
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusLabel.color}`}>
            {statusLabel.text}
          </span>
        </div>
        <p className="text-gray-400 text-xs mt-0.5">
          {formatDateRange(budget.startDate, budget.endDate)}
        </p>
      </div>
      
      {/* 右侧金额 */}
      <div className="text-right flex-shrink-0">
        <p className={`font-black text-base ${isHistory ? 'text-gray-400' : 'text-gray-700'}`}>
          ¥{totalBudget.toLocaleString()}
        </p>
        {totalActual > 0 && (
          <p className={`text-xs font-bold ${
            totalActual > totalBudget ? 'text-red-500' : 'text-gray-400'
          }`}>
            已花 ¥{totalActual.toLocaleString()}
          </p>
        )}
      </div>
      
      {/* 箭头 */}
      <ChevronRight size={20} className="text-gray-300 flex-shrink-0" />
    </button>
  );
};

// ============ 主组件 ============

const SpecialBudgetTimelineView = ({
  specialBudgets = [],
  setSpecialBudgets,
  specialBudgetItems = {},
  navigateTo,
  onBack,
  isDataReady = true
}) => {
  
  // 按年份分组数据
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
    
    // 排序：年份倒序
    const sortedYears = Object.keys(groups).sort((a, b) => b - a);
    
    // 每年内排序：进行中 > 即将开始 > 已结束
    sortedYears.forEach(year => {
      groups[year].budgets.sort((a, b) => {
        const statusOrder = { ongoing: 0, upcoming: 1, history: 2 };
        if (statusOrder[a.status] !== statusOrder[b.status]) {
          return statusOrder[a.status] - statusOrder[b.status];
        }
        // 同状态按开始日期倒序
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
      variant: 'purple'
    }
  ];

  if (!isDataReady) {
    return (
      <PageContainer>
        <div className="pt-20 text-center text-gray-400">加载中...</div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* 1. 导航栏 */}
      <TransparentNavBar 
        onBack={onBack} 
        rightButtons={rightButtons}
      />
      
      {/* 2. 标题区域 */}
      <div className="px-[30px] pt-24 pb-6">
        <h1 className="text-2xl font-black text-gray-800">这件事</h1>
        <p className="text-gray-400 font-bold text-sm mt-1">旅行/大件等大事</p>
      </div>

      <ContentArea className="pt-0">
        
        {/* 预算列表 - 按年份分组 */}
        {specialBudgets.length > 0 ? (
          <>
            {groupedBudgets.sortedYears.map((year) => {
              const isCurrentYear = parseInt(year) === groupedBudgets.currentYear;
              const yearData = groupedBudgets.groups[year];
              
              return (
                <div key={year} className="mb-6">
                  {/* 年份分隔 */}
                  <YearDivider 
                    year={year} 
                    isCurrentYear={isCurrentYear}
                    totalBudget={yearData.totalBudget}
                    totalActual={yearData.totalActual}
                  />
                  
                  {/* 该年度的预算列表 */}
                  <ListGroup>
                    {yearData.budgets.map((budget) => (
                      <BudgetItem
                        key={budget.id}
                        budget={budget}
                        items={specialBudgetItems[budget.id]}
                        status={budget.status}
                        onClick={() => navigateTo('specialBudgetDetail', { editingSpecialBudget: budget })}
                      />
                    ))}
                  </ListGroup>
                </div>
              );
            })}
          </>
        ) : (
          <EmptyState 
            icon={Target}
            message="还没有独立预算"
            action={
              <div className="mt-2">
                <p className="text-sm text-gray-400 mb-6 max-w-[200px] mx-auto leading-relaxed">
                  适合旅行、装修、大件购物等<br/>非常规的专项支出
                </p>
                <DuoButton 
                  onClick={() => navigateTo('editSpecialBudget', { editingSpecialBudget: {} })}
                  variant="purple"
                  icon={Plus}
                >
                  创建第一个
                </DuoButton>
              </div>
            }
          />
        )}
      </ContentArea>
    </PageContainer>
  );
};

export default SpecialBudgetTimelineView;