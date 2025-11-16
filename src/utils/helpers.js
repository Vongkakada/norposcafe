// src/utils/helpers.js
export function generateOrderId(counter) {
    return String(counter).padStart(5, '0');
}