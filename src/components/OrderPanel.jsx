// src/components/OrderPanel.jsx
import React, { useState } from 'react';
import OrderItemEntry from './OrderItemEntry';
import { KHR_SYMBOL, formatKHR } from '../utils/formatters';
import { generateReceiptBitmap } from '../utils/receiptGenerator';

function OrderPanel({
    currentOrder,
    orderId,
    onUpdateQuantity,
    onClearOrder,
    onProcessPayment,
    exchangeRate,
    shopName = "ហាងលក់ទំនិញ",
}) {
    const [isPrinting, setIsPrinting] = useState(false);

    const subtotalKHR = currentOrder.reduce(
        (sum, item) => sum + (item.priceKHR || item.priceUSD || 0) * item.quantity, 
        0
    );
    const totalKHR = subtotalKHR;

    const handlePrintReceipt = async () => {
        setIsPrinting(true);

        try {
            // Generate monochrome bitmap receipt
            const bitmapURL = await generateReceiptBitmap({
                shopName,
                orderId,
                order: currentOrder,
                totalKHR,
            });

            // Extract base64 data
            const base64Data = bitmapURL.split(',')[1];

            // Send directly to RawBT app
            // Try multiple URL schemes for compatibility
            window.location.href = `rawbt:base64,${base64Data}`;
            
            // Alternative formats (uncomment if above doesn't work):
            // window.location.href = `rawbt:image,${base64Data}`;
            // window.location.href = `rawbt://print?image=${base64Data}`;

            // Process payment after short delay
            setTimeout(() => {
                onProcessPayment();
                setIsPrinting(false);
            }, 1000);

        } catch (error) {
            console.error('Print error:', error);
            alert('❌ មានបញ្ហាក្នុងការបោះពុម្ព!\n\n' + error.message);
            setIsPrinting(false);
        }
    };

    return (
        <div className="order-panel">
            <h2>បញ្ជីកម្ម៉ង់បច្ចុប្បន្ន #{orderId}</h2>

            {/* Print Info Banner */}
            <div style={{
                marginBottom: '12px',
                padding: '12px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '13px',
                fontWeight: '500',
                textAlign: 'center',
                boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
            }}>
                <div style={{ marginBottom: '4px', fontSize: '16px' }}>
                    🖨️ Bitmap Printing Mode
                </div>
                <div style={{ fontSize: '11px', opacity: 0.9 }}>
                    ✓ អក្សរខ្មែរច្បាស់ល្អ ✓ QR Code ✓ Logo ✓ មិនរាល
                </div>
            </div>

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
                    disabled={currentOrder.length === 0 || isPrinting}
                    style={{
                        opacity: (currentOrder.length === 0 || isPrinting) ? 0.5 : 1
                    }}
                >
                    🗑️ លុបការកម្ម៉ង់
                </button>
                <button 
                    className="btn-pay" 
                    onClick={handlePrintReceipt} 
                    disabled={currentOrder.length === 0 || isPrinting}
                    style={{
                        opacity: (currentOrder.length === 0 || isPrinting) ? 0.5 : 1,
                        position: 'relative'
                    }}
                >
                    {isPrinting ? (
                        <>
                            <span style={{ 
                                display: 'inline-block', 
                                animation: 'spin 1s linear infinite',
                                marginRight: '8px'
                            }}>⏳</span>
                            កំពុងបង្កើត Bitmap...
                        </>
                    ) : (
                        <>💰 គិតលុយ & Print</>
                    )}
                </button>
            </div>

            {/* Loading overlay */}
            {isPrinting && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                }}>
                    <div style={{
                        background: 'white',
                        padding: '32px 48px',
                        borderRadius: '16px',
                        textAlign: 'center',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
                    }}>
                        <div style={{
                            fontSize: '48px',
                            marginBottom: '16px',
                            animation: 'spin 2s linear infinite'
                        }}>
                            🖨️
                        </div>
                        <div style={{
                            fontSize: '18px',
                            fontWeight: 'bold',
                            color: '#333',
                            marginBottom: '8px'
                        }}>
                            កំពុងបង្កើត Receipt Bitmap...
                        </div>
                        <div style={{
                            fontSize: '13px',
                            color: '#666'
                        }}>
                            សូមរង់ចាំបន្តិច
                        </div>
                    </div>
                </div>
            )}

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