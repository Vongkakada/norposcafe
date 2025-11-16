// src/components/OrderItemEntry.jsx
import React from 'react';
import { KHR_SYMBOL, formatKHR } from '../utils/formatters';

function OrderItemEntry({ item, onUpdateQuantity }) {
    // Removed unused variable itemTotalKHR

    return (
        <div className="order-item-entry">
            <div className="order-item-details">
                <span className="order-item-name">{item.khmerName}</span>
                <span className="order-item-price-single">
                    {KHR_SYMBOL}{formatKHR(item.priceKHR || (item.priceUSD || 0))}
                </span>
            </div>
            <div className="order-item-controls">
                <button
                    aria-label={`Decrease quantity of ${item.khmerName}`}
                    title={`Decrease quantity of ${item.khmerName}`}
                    onClick={() => onUpdateQuantity(item.khmerName, -1)}
                >-</button>
                <span className="order-item-qty">{item.quantity}</span>
                <button
                    aria-label={`Increase quantity of ${item.khmerName}`}
                    title={`Increase quantity of ${item.khmerName}`}
                    onClick={() => onUpdateQuantity(item.khmerName, 1)}
                >+</button>
            </div>
            <span className="order-item-total-price">{KHR_SYMBOL}{formatKHR((item.priceKHR || item.priceUSD) * item.quantity)}</span>
        </div>
    );
}

export default OrderItemEntry;