// helpers.js - 工具函数
// 修复：保持weekKey格式兼容，同时提供ISO周号用于显示

// ==================== 本地缓存工具函数 ====================
const CACHE_KEY = 'budget_bottle_cache';
const CACHE_EXPIRY = 5 * 60 * 1000;

export const saveToCache = (data) => {
  try {
    const cacheData = {
      ...data,
      wishes: data.wishes?.map(w => ({ ...w, image: null })) || [],
      timestamp: Date.now()
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      try {
        localStorage.removeItem(CACHE_KEY);
        const minimalData = {
          weekKey: data.weekKey,
          weeklyBudget: data.weeklyBudget,
          transactions: data.transactions || [],
          wishPoolAmount: data.wishPoolAmount || 0,
          timestamp: Date.now()
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(minimalData));
      } catch (e2) {
        console.warn('缓存保存失败:', e2);
      }
    }
  }
};

export const loadFromCache = () => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    const data = JSON.parse(cached);
    if (Date.now() - data.timestamp > CACHE_EXPIRY) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return data;
  } catch (e) {
    localStorage.removeItem(CACHE_KEY);
    return null;
  }
};

// ==================== 格式化工具函数 ====================
export const formatAmount = (num) => {
  if (typeof num !== 'number' || isNaN(num)) return '0';
  return parseFloat(num.toFixed(2)).toString();
};

export const formatDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}/${m}/${d}`;
};

export const formatShortDate = (date) => {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return `${m}/${d}`;
};

// ==================== ISO 8601 周数计算（仅用于显示）====================

/**
 * 获取某一天是当年的第几周（ISO 8601 标准）
 * ISO 8601 规定：每年的第一周是包含该年第一个星期四的那一周
 * 周一为每周的第一天
 */
export const getISOWeekNumber = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  
  // 设置到最近的周四
  const dayOfWeek = d.getDay();
  const daysToThursday = (dayOfWeek === 0) ? -3 : (4 - dayOfWeek);
  d.setDate(d.getDate() + daysToThursday);
  
  // 获取周四所在年份的1月1日
  const yearStart = new Date(d.getFullYear(), 0, 1);
  
  // 计算周数
  const daysSinceYearStart = Math.floor((d - yearStart) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.floor(daysSinceYearStart / 7) + 1;
  
  return {
    weekNumber,
    year: d.getFullYear()
  };
};

// ==================== 日期/周工具函数 ====================

/**
 * 获取周信息
 * weekKey 保持原有格式（按月内周数）确保数据库兼容
 * isoWeekNumber 用于UI显示（按年的自然周）
 */
export const getWeekInfo = (date = new Date()) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = d.getMonth();
  const day = d.getDate();
  
  // 计算月内周数（用于 weekKey，保持兼容）
  const firstDayOfMonth = new Date(year, month, 1);
  const firstDayWeekday = firstDayOfMonth.getDay() || 7;
  const monthWeekNumber = Math.ceil((day + firstDayWeekday - 1) / 7);
  
  // 计算周一和周日
  const dayOfWeek = d.getDay() || 7;
  const weekStart = new Date(d);
  weekStart.setDate(day - dayOfWeek + 1);
  weekStart.setHours(0, 0, 0, 0);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  
  // 获取 ISO 周号（用于显示）
  const isoWeek = getISOWeekNumber(d);
  
  // weekKey 使用原有格式：年-月-W月内周数
  const weekKey = `${year}-${String(month + 1).padStart(2, '0')}-W${monthWeekNumber}`;
  
  return {
    year: year,
    month: month + 1,
    weekNumber: monthWeekNumber,      // 月内周数（用于weekKey）
    isoWeekNumber: isoWeek.weekNumber, // ISO年周数（用于显示）
    isoYear: isoWeek.year,             // ISO周所属年份
    weekStart,
    weekEnd,
    weekKey
  };
};

export const getPreviousWeekInfo = (currentWeekInfo) => {
  const prevWeekStart = new Date(currentWeekInfo.weekStart);
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);
  return getWeekInfo(prevWeekStart);
};

export const parseWeekKey = (weekKey) => {
  const match = weekKey.match(/(\d{4})-(\d{2})-W(\d+)/);
  if (match) {
    return `${match[1]}年${parseInt(match[2])}月 第${match[3]}周`;
  }
  return weekKey;
};