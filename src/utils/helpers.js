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

export const parseWeekKey = (weekKey) => {
  const match = weekKey.match(/(\d{4})-(\d{2})-W(\d+)/);
  if (match) {
    return `${match[1]}年${parseInt(match[2])}月 第${match[3]}周`;
  }
  return weekKey;
};

// ==================== 日期/周工具函数 ====================
export const getWeekInfo = (date = new Date()) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  const firstDayOfMonth = new Date(year, month, 1);
  const firstDayWeekday = firstDayOfMonth.getDay() || 7;
  const weekNumber = Math.ceil((day + firstDayWeekday - 1) / 7);
  const dayOfWeek = date.getDay() || 7;
  const weekStart = new Date(date);
  weekStart.setDate(day - dayOfWeek + 1);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  return {
    year,
    month: month + 1,
    weekNumber,
    weekStart,
    weekEnd,
    weekKey: `${year}-${String(month + 1).padStart(2, '0')}-W${weekNumber}`
  };
};

export const getPreviousWeekInfo = (currentWeekInfo) => {
  const prevWeekStart = new Date(currentWeekInfo.weekStart);
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);
  return getWeekInfo(prevWeekStart);
};