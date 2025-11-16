// src/components/OrderPanel.jsx
import React from 'react';
import OrderItemEntry from './OrderItemEntry';
import { KHR_SYMBOL, formatKHR } from '../utils/formatters';
function OrderPanel({
  currentOrder,
  orderId,
  onUpdateQuantity,
  onClearOrder,
  shopName = "ន កាហ្វេ",
  onProcessPayment, // ថ្មី: ប្រើ function ពី App.jsx
}) {
  const subtotalKHR = currentOrder.reduce(
    (sum, item) => sum + (item.priceKHR || item.priceUSD || 0) * item.quantity,
    0
  );
  const totalKHR = subtotalKHR;

  return (
    <div className="order-panel">
      <h2>បញ្ជីកម្ម៉ង់បច្ចុប្បន្ន #{orderId}</h2>

      <div className="current-order-items">
        {currentOrder.length === 0 ? (
          <p className="empty-cart">មិនទាន់មានទំនិញក្នុងបញ្ជីទេ។</p>
        ) : (
          currentOrder.map(item => (
            <OrderItemEntry
              key={item.khmerName + (item.priceKHR || item.priceUSD || 0)}
              item={item}
              onUpdateQuantity={onUpdateQuantity}
            />
          ))
        )}
      </div>

      <div className="order-summary">
        <div className="summary-line">
          <span>សរុបរង (Subtotal):</span>
          <span className="currency-value">
            {KHR_SYMBOL}{formatKHR(subtotalKHR || 0)}
          </span>
        </div>
        <div className="summary-line total order-total">
          <span>សរុប (Total):</span>
          <span className="currency-value">
            {KHR_SYMBOL}{formatKHR(totalKHR || 0)}
          </span>
        </div>
      </div>

      <div className="action-buttons">
        <button 
          className="btn-clear" 
          onClick={onClearOrder} 
          disabled={currentOrder.length === 0}
        >
          លុបការកម្ម៉ង់
        </button>

        <button 
          className="btn-pay" 
          onClick={onProcessPayment} // ប្រើ function ពី App.jsx (ដែលមាន save + print)
          disabled={currentOrder.length === 0}
        >
          គិតលុយ
        </button>
      </div>
    </div>
  );
}

export default OrderPanel;