// src/components/OrderPanel.jsx
import React, { useState } from 'react';
import OrderItemEntry from './OrderItemEntry';
import { KHR_SYMBOL, formatKHR } from '../utils/formatters';

function OrderPanel({
    currentOrder,
    orderId,
    onUpdateQuantity,
    onClearOrder,
    onProcessPayment,
    exchangeRate,
    shopName = "ហាងលក់ទំនិញ",
}) {
    const [isProcessing, setIsProcessing] = useState(false);

    const subtotalKHR = currentOrder.reduce(
        (sum, item) => sum + (item.priceKHR || item.priceUSD || 0) * item.quantity, 
        0
    );
    const totalKHR = subtotalKHR;

    const handleProcessPayment = async () => {
        setIsProcessing(true);
        try {
            // Simulate processing payment
            setTimeout(() => {
                onProcessPayment();
                setIsProcessing(false);
            }, 1000);
        } catch (error) {
            console.error('Payment error:', error);
            alert('មានបញ្ហាក្នុងការការបង់លុយ: ' + error.message);
            setIsProcessing(false);
        }
    };

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
                    disabled={currentOrder.length === 0 || isProcessing}
                    style={{
                        opacity: (currentOrder.length === 0 || isProcessing) ? 0.5 : 1,
                        cursor: (currentOrder.length === 0 || isProcessing) ? 'not-allowed' : 'pointer'
                    }}
                >
                    🗑️ លុបការកម្ម៉ង់
                </button>
                <button 
                    className="btn-pay" 
                    onClick={handleProcessPayment} 
                    disabled={currentOrder.length === 0 || isProcessing}
                    style={{
                        opacity: (currentOrder.length === 0 || isProcessing) ? 0.5 : 1,
                        cursor: (currentOrder.length === 0 || isProcessing) ? 'not-allowed' : 'pointer',
                        background: isProcessing ? '#ccc' : undefined
                    }}
                >
                    {isProcessing ? (
                        <>
                            <span style={{ 
                                display: 'inline-block', 
                                animation: 'spin 1s linear infinite',
                                marginRight: '8px'
                            }}>⏳</span>
                            កំពុងដំណើរការ...
                        </>
                    ) : (
                        <>💰 គិតលុយ</>
                    )}
                </button>
            </div>

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

export default OrderPanel;
