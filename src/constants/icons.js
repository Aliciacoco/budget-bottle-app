import { Plane, Gift, Car, Home, ShoppingBag, Utensils, Music, Gamepad, Book, Briefcase, CreditCard, DollarSign } from 'lucide-react';

// 专项预算图标配置
export const BUDGET_ICONS = {
  travel: { icon: Plane, label: '旅行', color: '#3B82F6' },
  gift: { icon: Gift, label: '礼物', color: '#EC4899' },
  car: { icon: Car, label: '交通', color: '#10B981' },
  home: { icon: Home, label: '家居', color: '#F59E0B' },
  shopping: { icon: ShoppingBag, label: '购物', color: '#8B5CF6' },
  food: { icon: Utensils, label: '餐饮', color: '#EF4444' },
  music: { icon: Music, label: '娱乐', color: '#06B6D4' },
  game: { icon: Gamepad, label: '游戏', color: '#84CC16' },
  book: { icon: Book, label: '学习', color: '#6366F1' },
  work: { icon: Briefcase, label: '工作', color: '#78716C' },
  credit: { icon: CreditCard, label: '账单', color: '#F97316' },
  other: { icon: DollarSign, label: '其他', color: '#64748B' }
};