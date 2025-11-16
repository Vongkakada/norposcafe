// src/utils/formatters.js
export const KHR_SYMBOL = '៛';

export function formatKHR(amount) {
  if (typeof amount !== 'number' || isNaN(amount)) return '0';
  // ប្រើ toLocaleString ដើម្បី Format លេខខ្មែរ
  return amount.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ','); 
}