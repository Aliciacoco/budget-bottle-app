// src/utils/url.js - URL 相关工具函数

/**
 * 确保 URL 使用 HTTPS 协议
 * 用于解决 Mixed Content 警告问题
 * 
 * @param {string} url - 原始 URL
 * @returns {string} - HTTPS URL
 */
export const ensureHttps = (url) => {
  if (!url) return url;
  // 将 http:// 替换为 https://
  return url.replace(/^http:\/\//i, 'https://');
};

/**
 * 批量处理对象中的 URL 字段
 * 
 * @param {Object} obj - 包含 URL 字段的对象
 * @param {string[]} urlFields - 需要处理的字段名数组
 * @returns {Object} - 处理后的对象
 */
export const ensureHttpsInObject = (obj, urlFields = ['image', 'url', 'imageUrl']) => {
  if (!obj) return obj;
  
  const result = { ...obj };
  urlFields.forEach(field => {
    if (result[field]) {
      result[field] = ensureHttps(result[field]);
    }
  });
  
  return result;
};

/**
 * 批量处理数组中对象的 URL 字段
 * 
 * @param {Object[]} arr - 对象数组
 * @param {string[]} urlFields - 需要处理的字段名数组
 * @returns {Object[]} - 处理后的数组
 */
export const ensureHttpsInArray = (arr, urlFields = ['image', 'url', 'imageUrl']) => {
  if (!arr || !Array.isArray(arr)) return arr;
  return arr.map(item => ensureHttpsInObject(item, urlFields));
};