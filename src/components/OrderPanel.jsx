// src/components/OrderPanel.jsx
import React, { useState } from 'react';
import OrderItemEntry from './OrderItemEntry';
import { KHR_SYMBOL, formatKHR } from '../utils/formatters';
import jsPDF from 'jspdf';

function OrderPanel({
    currentOrder,
    orderId,
    onUpdateQuantity,
    onClearOrder,
    shopName = "ហាងលក់ទំនិញ",
}) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [pdfUrl, setPdfUrl] = useState(null);

    const subtotalKHR = currentOrder.reduce(
        (sum, item) => sum + (item.priceKHR || item.priceUSD || 0) * item.quantity, 
        0
    );
    const totalKHR = subtotalKHR;

    const handleGeneratePDF = () => {
        setIsGenerating(true);
        const doc = new jsPDF();

        let y = 10;
        doc.setFontSize(16);
        doc.text(shopName, 10, y);
        y += 10;
        doc.setFontSize(12);
        doc.text(`Order ID: #${orderId}`, 10, y);
        y += 10;
        doc.text('-------------------------------', 10, y);
        y += 10;

        currentOrder.forEach(item => {
            const line = `${item.khmerName} x${item.quantity} = ${KHR_SYMBOL}${formatKHR((item.priceKHR || item.priceUSD) * item.quantity)}`;
            doc.text(line, 10, y);
            y += 8;
        });

        y += 5;
        doc.text('-------------------------------', 10, y);
        y += 8;
        doc.text(`Subtotal: ${KHR_SYMBOL}${formatKHR(subtotalKHR)}`, 10, y);
        y += 8;
        doc.text(`Total: ${KHR_SYMBOL}${formatKHR(totalKHR)}`, 10, y);

        // Generate PDF blob and create URL for preview
        const pdfBlob = doc.output('blob');
        const url = URL.createObjectURL(pdfBlob);
        setPdfUrl(url);
        setIsGenerating(false);
    };

    const handlePrintPDF = () => {
        if (!pdfUrl) return;
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = pdfUrl;
        document.body.appendChild(iframe);
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
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

            <div className="action-buttons" style={{ marginTop: '12px', display: 'flex', gap: '10px' }}>
                <button 
                    className="btn-preview"
                    onClick={handleGeneratePDF}
                    disabled={currentOrder.length === 0 || isGenerating}
                >
                    {isGenerating ? '⏳ កំពុងបង្កើត PDF...' : '💰 គិតលុយ'}
                </button>

                <button 
                    className="btn-print"
                    onClick={handlePrintPDF}
                    disabled={!pdfUrl}
                >
                    🖨️ Print
                </button>
            </div>

            {pdfUrl && (
                <div style={{ marginTop: '20px' }}>
                    <iframe 
                        src={pdfUrl} 
                        width="100%" 
                        height="400px" 
                        title="PDF Preview"
                        style={{ border: '1px solid #ccc' }}
                    />
                </div>
            )}
        </div>
    );
}

export default OrderPanel;
