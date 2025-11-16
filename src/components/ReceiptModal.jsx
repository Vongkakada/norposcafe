// src/components/ReceiptModal.jsx
import React, { useRef, useEffect } from 'react';
import { KHR_SYMBOL, formatKHR } from '../utils/formatters';
import qrcode from '../assets/qrcode.jpg'; // Assuming you have a CSS file for styling
import logo from '../assets/logo.png';

const SHOP_STATIC_DETAILS = {
    address: "ផ្ទះលេខ 137 , ផ្លូវ 223, កំពង់ចាម",
    tel: "016 438 555 / 061 91 4444"
};

function ReceiptModal({ show, onClose, order, orderId, exchangeRate, /* taxRate, */ shopName }) { // << លុប taxRate
    const receiptRef = useRef(null);

    useEffect(() => {
        const cleanup = () => {
            const el = receiptRef.current;
            if (el) {
                el.style.transform = '';
                el.style.transformOrigin = '';
                el.style.width = '';
            }
            window.removeEventListener('afterprint', cleanup);
        };

        window.addEventListener('afterprint', cleanup);
        return () => window.removeEventListener('afterprint', cleanup);
    }, []);

    if (!show) return null;
    const now = new Date();
    const subtotalKHR = order.reduce((sum, item) => sum + (item.priceKHR || item.priceUSD || 0) * item.quantity, 0);
    // const taxKHR = subtotalKHR * taxRate; // tax removed
    const totalKHR = subtotalKHR; // already in KHR

    const safeShopNameForQR = shopName.replace(/\s+/g, '_');
    const qrData = `ORDER_ID:${orderId};TOTAL_KHR:${formatKHR(totalKHR)};SHOP_NAME:${safeShopNameForQR}`;
    const qrCodeUrl = qrcode + `?data=${encodeURIComponent(qrData)}`; // Assuming you have a QR code image


    const handlePrint = () => {
        const el = receiptRef.current;
        if (el && typeof window !== 'undefined') {
            // Convert mm to px (approx at 96dpi): 1mm = 3.7795275591px
            const mmToPx = 3.7795275591;
            const pageHeightMm = 297; // target page height in mm
            const pageMarginMm = 6; // as defined in @page margin
            const printableHeightPx = (pageHeightMm - pageMarginMm * 2) * mmToPx;

            // Measure content height
            const contentHeight = el.scrollHeight;

            // Compute scale to fit content into printable height (cap at 1)
            const scale = Math.min(1, printableHeightPx / contentHeight);

            if (scale < 1) {
                el.style.transformOrigin = 'top left';
                el.style.transform = `scale(${scale})`;
                // Ensure the printed width accounts for scale so it stays within 80mm
                el.style.width = `${80 / scale}mm`;
            } else {
                // Ensure width is set to 80mm when no scaling
                el.style.width = '70mm';
                el.style.transform = '';
                el.style.transformOrigin = '';
            }
        }

        // Add a one-time afterprint handler to close the modal automatically
        const handleAfterPrint = () => {
            try {
                // restore styles (in case cleanup didn't run yet)
                if (el) {
                    el.style.transform = '';
                    el.style.transformOrigin = '';
                    el.style.width = '';
                }
                if (typeof onClose === 'function') onClose();
            } finally {
                window.removeEventListener('afterprint', handleAfterPrint);
            }
        };
        window.addEventListener('afterprint', handleAfterPrint);

        // Trigger print. afterprint listener will cleanup styles and close modal.
        window.print();
    };

    return (
        <div className="modal show" id="receiptModal">
            <div className="modal-content">
                <span className="close-button" onClick={onClose}>×</span>
                <div className="receipt-print-area" ref={receiptRef}>
                    <div className="receipt-logo-top">
                        <img src={logo} alt="Logo" className="receipt-logo" />
                    </div>
                    <div className="receipt-header">
                        <h3>{shopName}</h3>
                        <p>{SHOP_STATIC_DETAILS.address}</p>
                        <p>Tel: {SHOP_STATIC_DETAILS.tel}</p>
                        <p>កាលបរិច្ឆេទ: {now.toLocaleDateString('km-KH')} {now.toLocaleTimeString('km-KH')}</p>
                        <p>លេខវិក្កយបត្រ: {orderId}</p>
                    </div>
                    <div className="receipt-divider"></div>
                    <table className="receipt-items-table">
                        <thead>
                            <tr>
                                <th>មុខទំនិញ</th>
                                <th>ចំនួន</th>
                                <th>សរុប ({KHR_SYMBOL})</th>
                            </tr>
                        </thead>
                        <tbody>
                            {order.map(item => (
                                <tr key={item.khmerName + (item.priceKHR || item.priceUSD || 0)}>
                                    <td>{item.khmerName} ({item.englishName || ''})</td>
                                    <td>{item.quantity}</td>
                                    <td>{KHR_SYMBOL}{formatKHR((item.priceKHR || item.priceUSD) * item.quantity)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="receipt-divider"></div>
                    <div className="receipt-summary">
                        <div className="receipt-summary-line">
                            <span>សរុបរង:</span>
                            <span>
                                {KHR_SYMBOL}{formatKHR(subtotalKHR || 0)}
                            </span>
                        </div>
                        <div className="receipt-divider"></div>
                        <div className="receipt-summary-line total">
                            <span>សរុប ({KHR_SYMBOL}):</span>
                            <span>{KHR_SYMBOL}{formatKHR(totalKHR || 0)}</span>
                        </div>
                    </div>
                    <div className="receipt-qr-code">
                        <p style={{fontSize:'0.8em', marginBottom:'5px', fontFamily: 'var(--font-family)'}}>សូមស្កេនដើម្បីទូទាត់ ឬមើលព័ត៌មានបន្ថែម</p>
                        <img src={qrCodeUrl} alt="QR Code" />
                    </div>
                    <div className="receipt-footer">
                        <p>សូមអរគុណ! សូមអញ្ជើញមកម្តងទៀត!</p>
                    </div>
                </div>
                <div className="print-button-container">
                    <button className="btn-close-receipt" onClick={onClose}>បោះបង់</button>
                    <button className="btn-print" onClick={handlePrint}>បោះពុម្ពវិក្កយបត្រ</button>
                    
                </div>
            </div>
        </div>
    );
}

export default ReceiptModal;