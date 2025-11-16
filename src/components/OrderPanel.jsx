// src/components/OrderPanel.jsx
import React, { useState } from 'react';
import OrderItemEntry from './OrderItemEntry';
import { KHR_SYMBOL, formatKHR } from '../utils/formatters';
import ReceiptModal from './ReceiptModal';

function OrderPanel({
  currentOrder,
  orderId,
  onUpdateQuantity,
  onClearOrder,
  shopName = "ហាងលក់ទំនិញ",
}) {
  const [showReceipt, setShowReceipt] = useState(false);

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
          style={{
            opacity: currentOrder.length === 0 ? 0.5 : 1,
            cursor: currentOrder.length === 0 ? 'not-allowed' : 'pointer'
          }}
        >
          🗑️ លុបការកម្ម៉ង់
        </button>

        <button 
          className="btn-pay" 
          onClick={() => setShowReceipt(true)} 
          disabled={currentOrder.length === 0}
          style={{
            opacity: currentOrder.length === 0 ? 0.5 : 1,
            cursor: currentOrder.length === 0 ? 'not-allowed' : 'pointer'
          }}
        >
          💰 គិតលុយ & Preview
        </button>
      </div>

      {showReceipt && (
        <ReceiptModal
          show={showReceipt}
          onClose={() => setShowReceipt(false)}
          order={currentOrder}
          orderId={orderId}
          shopName={shopName}
        />
      )}
    </div>
  );
}

export default OrderPanel;
