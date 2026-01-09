// FixedExpenseListView.jsx - 固定支出列表页面
// 修复：1. 增加顶部 padding 解决标题被遮挡问题 2. 移除列表项图标

import React from 'react';
import { Plus, Calendar } from 'lucide-react';

// 导入设计系统组件
import { 
  PageContainer, 
  TransparentNavBar, 
  ContentArea,
  ListItem,
  ListGroup,
  EmptyState,
  DuoButton
} from '../components/design-system';

const FixedExpenseListView = ({ 
  fixedExpenses = [],
  onBack,
  navigateTo
}) => {
  const enabledExpenses = fixedExpenses.filter(e => e.enabled !== false);
  const totalAmount = enabledExpenses.reduce((sum, e) => sum + e.amount, 0);

  // 导航栏右侧按钮：添加
  const rightButtons = [
    {
      icon: Plus,
      onClick: () => navigateTo('editFixedExpense', { editingExpense: {} }),
      variant: 'primary'
    }
  ];

  return (
    <PageContainer>
      {/* 1. 导航栏 (Fixed 定位) */}
      <TransparentNavBar 
        onBack={onBack} 
        rightButtons={rightButtons} 
      />
      
      {/* 2. 标题区域 */}
      {/* 👇 修改点 1：将 pt-2 改为 pt-24 (96px)，给固定导航栏留出空间 */}
      <div className="px-[30px] pt-24 pb-6">
        <h1 className="text-2xl font-black text-gray-800">每个月</h1>
        <p className="text-gray-400 font-bold text-sm mt-1">管理你的固定支出</p>
      </div>
      
      <ContentArea className="pt-0">
        
        {/* 3. 汇总卡片 */}
        <div className="bg-amber-500 rounded-[24px] border-b-[6px] border-amber-600 p-6 mb-8 text-white shadow-sm relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
          <p className="text-amber-100 font-bold mb-1">每月固定支出</p>
          <div className="flex items-baseline gap-1">
            <span className="text-amber-200 text-2xl font-bold">¥</span>
            <span className="text-white text-5xl font-black tracking-tight">
              {totalAmount.toLocaleString()}
            </span>
          </div>
          <div className="mt-4 inline-flex items-center bg-black/10 rounded-lg px-3 py-1 text-sm font-bold text-amber-50">
             {enabledExpenses.length} 个项目
          </div>
        </div>
        
        {/* 4. 支出列表 */}
        {enabledExpenses.length > 0 ? (
          <ListGroup>
            {enabledExpenses.map((expense) => (
              <ListItem
                key={expense.id}
                title={expense.name}
                subtitle={expense.expireDate ? `到期: ${expense.expireDate}` : '长期有效'}
                // 👇 修改点 2：删除了 icon={Calendar} 和 iconColor="..."
                onClick={() => navigateTo('editFixedExpense', { editingExpense: expense })}
                rightElement={
                  <span className="font-black text-gray-700 text-lg">
                    ¥{expense.amount.toLocaleString()}
                  </span>
                }
              />
            ))}
          </ListGroup>
        ) : (
          <EmptyState 
            icon={Calendar}
            message="还没有固定支出"
            action={
              <div className="mt-2">
                <p className="text-sm text-gray-400 mb-6 max-w-[200px] mx-auto leading-relaxed">
                  添加房租、订阅会员、宽带费等<br/>每月必付的项目
                </p>
                <DuoButton 
                  onClick={() => navigateTo('editFixedExpense', { editingExpense: {} })}
                  variant="warning"
                  icon={Plus}
                >
                  添加第一个
                </DuoButton>
              </div>
            }
          />
        )}
      </ContentArea>
    </PageContainer>
  );
};

export default FixedExpenseListView;