// src/utils/formatters.js
export const KHR_SYMBOL = '៛';

export function formatKHR(amount) {
    const n = Number(amount);
    if (!isFinite(n)) return '';
    return Math.round(n).toLocaleString('km-KH');
}