// src/components/OrderPanel.jsx
import React, { useState } from 'react';
import OrderItemEntry from './OrderItemEntry';
import { KHR_SYMBOL, formatKHR } from '../utils/formatters';
import { printBitmapViaRawBT } from '../utils/escposBitmapPrinter';

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
            const receiptData = {
                shopName,
                orderId,
                order: currentOrder,
                totalKHR,
            };

            // Print using ESC/POS with bitmap raster
            await printBitmapViaRawBT(receiptData);

            // Success - process payment
            setTimeout(() => {
                onProcessPayment();
                setIsPrinting(false);
            }, 1000);

        } catch (error) {
            console.error('Print error:', error);
            alert(
                '❌ មានបញ្ហាក្នុងការបោះពុម្ព!\n\n' +
                'សូមពិនិត្យ:\n' +
                '• RawBT app installed\n' +
                '• Printer connected via Bluetooth\n' +
                '• Printer turned on\n\n' +
                error.message
            );
            setIsPrinting(false);
        }
    };

    return (
        <div className="order-panel">
            <h2>បញ្ជីកម្ម៉ង់បច្ចុប្បន្ន #{orderId}</h2>

            {/* ESC/POS Info Banner */}
            <div style={{
                marginBottom: '12px',
                padding: '14px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '10px',
                color: 'white',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
            }}>
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    gap: '8px',
                    marginBottom: '6px'
                }}>
                    <span style={{ fontSize: '20px' }}>🖨️</span>
                    <span style={{ fontSize: '16px', fontWeight: 'bold' }}>
                        ESC/POS Bitmap Raster
                    </span>
                </div>
                <div style={{ 
                    fontSize: '11px', 
                    opacity: 0.95,
                    textAlign: 'center',
                    lineHeight: '1.4'
                }}>
                    ✓ Khmer Font ✓ QR Code ✓ Logo<br/>
                    ✓ Monochrome Bitmap ✓ RawBT Compatible
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
                        opacity: (currentOrder.length === 0 || isPrinting) ? 0.5 : 1,
                        cursor: (currentOrder.length === 0 || isPrinting) ? 'not-allowed' : 'pointer'
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
                        cursor: (currentOrder.length === 0 || isPrinting) ? 'not-allowed' : 'pointer',
                        background: isPrinting ? '#ccc' : undefined
                    }}
                >
                    {isPrinting ? (
                        <>
                            <span style={{ 
                                display: 'inline-block', 
                                animation: 'spin 1s linear infinite',
                                marginRight: '8px'
                            }}>⏳</span>
                            កំពុង Print...
                        </>
                    ) : (
                        <>💰 គិតលុយ & Print</>
                    )}
                </button>
            </div>

            {/* Loading Overlay */}
            {isPrinting && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.85)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    backdropFilter: 'blur(4px)'
                }}>
                    <div style={{
                        background: 'white',
                        padding: '40px 60px',
                        borderRadius: '20px',
                        textAlign: 'center',
                        boxShadow: '0 20px 80px rgba(0,0,0,0.6)',
                        maxWidth: '90%'
                    }}>
                        <div style={{
                            fontSize: '64px',
                            marginBottom: '20px',
                            animation: 'spin 2s linear infinite'
                        }}>
                            🖨️
                        </div>
                        <div style={{
                            fontSize: '20px',
                            fontWeight: 'bold',
                            color: '#333',
                            marginBottom: '12px'
                        }}>
                            កំពុងបង្កើត ESC/POS Bitmap...
                        </div>
                        <div style={{
                            fontSize: '14px',
                            color: '#666',
                            lineHeight: '1.6'
                        }}>
                            Converting to monochrome raster<br/>
                            Sending to RawBT app...
                        </div>
                        
                        {/* Progress dots */}
                        <div style={{
                            marginTop: '24px',
                            display: 'flex',
                            gap: '8px',
                            justifyContent: 'center'
                        }}>
                            {[0, 1, 2].map(i => (
                                <div
                                    key={i}
                                    style={{
                                        width: '10px',
                                        height: '10px',
                                        borderRadius: '50%',
                                        background: '#667eea',
                                        animation: `bounce 1.4s ease-in-out ${i * 0.2}s infinite`
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                
                @keyframes bounce {
                    0%, 80%, 100% {
                        transform: scale(0);
                        opacity: 0.5;
                    }
                    40% {
                        transform: scale(1);
                        opacity: 1;
                    }
                }
            `}</style>
        </div>
    );
}

export default OrderPanel;