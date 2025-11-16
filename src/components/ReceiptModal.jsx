// src/components/ReceiptModal.jsx
import { useEffect } from 'react';
import { KHR_SYMBOL, formatKHR } from '../utils/formatters';
import qrcode from '../assets/qrcode.jpg';
import logo from '../assets/logo.png';

const SHOP_STATIC_DETAILS = {
    address: "ផ្ទះលេខ 137 , ផ្លូវ 223, កំពង់ចាម",
    tel: "016 438 555 / 061 91 4444"
};

function ReceiptModal({ show, onClose, order, orderId, shopName }) {
    useEffect(() => {
        if (!show) return;

        // បើក Tab ថ្មីតូចខ្លី (400x600px) ដើម្បីមើល Preview ស្អាត
        const receiptWindow = window.open(
            '',
            '_blank',
            'width=420,height=700,scrollbars=no,resizable=yes'
        );

        if (!receiptWindow) {
            alert('សូមអនុញ្ញាត Pop-up ដើម្បីបោះពុម្ពវិក្កយបត្រ');
            onClose();
            return;
        }

        const now = new Date();
        const subtotalKHR = order.reduce(
            (sum, item) => sum + (item.priceKHR || item.priceUSD || 0) * item.quantity,
            0
        );
        const totalKHR = subtotalKHR;

        const safeShopNameForQR = shopName.replace(/\s+/g, '_');
        const qrData = `ORDER_ID:${orderId};TOTAL_KHR:${formatKHR(totalKHR)};SHOP_NAME:${safeShopNameForQR}`;
        const qrCodeUrl = qrcode + `?data=${encodeURIComponent(qrData)}`;

        receiptWindow.document.write(`
<!DOCTYPE html>
<html lang="km">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=80mm, initial-scale=1.0">
    <title>វិក្កយបត្រ #${orderId}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Kantumruy Pro', sans-serif;
            background: #f9f9f9;
            padding: 8px;
            display: flex;
            justify-content: center;
            align-items: flex-start;
            min-height: 100vh;
        }
        .receipt {
            width: 80mm;
            background: white;
            padding: 12px 8px;
            border: 2px solid #ddd;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            font-size: 10pt;
            line-height: 1.45;
        }
        .logo { text-align: center; margin-bottom: 10px; }
        .logo img { width: 50px; height: auto; }
        .header { text-align: center; margin-bottom: 10px; }
        .header h3 { font-size: 14pt; margin: 6px 0 4px; font-weight: bold; }
        .header p { font-size: 9pt; margin: 3px 0; color: #444; }
        .divider { border-top: 1px dashed #000; margin: 8px 0; }
        table { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 9.5pt; }
        th { background: #f0f0f0; padding: 5px 3px; font-weight: bold; font-size: 9pt; }
        td { padding: 4px 3px; border-bottom: 1px dotted #aaa; }
        td:nth-child(2) { text-align: center; }
        td:last-child { text-align: right; }
        .summary { margin: 8px 0; font-size: 10.5pt; }
        .total {
            font-size: 13pt !important;
            font-weight: bold;
            border-top: 2px solid #000;
            padding-top: 6px;
            margin-top: 8px;
        }
        .qr { text-align: center; margin: 12px 0; }
        .qr img { width: 55mm; height: 55mm; padding: 4px; border: 1px solid #000; background: white; }
        .footer { text-align: center; margin-top: 12px; font-weight: bold; font-size: 10pt; }

        /* Print ចេញមកត្រឹមត្រូវ 80mm */
        @media print {
            @page { size: 80mm auto; margin: 0; }
            body { background: white; padding: 0; margin: 0; }
            .receipt {
                width: 80mm;
                border: none;
                box-shadow: none;
                padding: 10px 6px;
            }
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
    </style>
</head>
<body onload="setTimeout(() => window.print(), 600)">
    <div class="receipt">
        <div class="logo">
            <img src="${logo}" onerror="this.style.display='none'">
        </div>
        <div class="header">
            <h3>${shopName}</h3>
            <p>${SHOP_STATIC_DETAILS.address}</p>
            <p>ទូរស័ព្ទ: ${SHOP_STATIC_DETAILS.tel}</p>
            <p>កាលបរិច្ឆេទ: ${now.toLocaleDateString('km-KH')} ${now.toLocaleTimeString('km-KH', {hour: '2-digit', minute: '2-digit'})}</p>
            <p>លេខវិក្កយបត្រ: ${orderId}</p>
        </div>
        <div class="divider"></div>

        <table>
            <thead>
                <tr><th>មុខទំនិញ</th><th>ចំនួន</th><th>តម្លៃ</th></tr>
            </thead>
            <tbody>
                ${order.map(item => `
                    <tr>
                        <td>${item.khmerName}${item.englishName ? ` (${item.englishName})` : ''}</td>
                        <td>${item.quantity}</td>
                        <td>${KHR_SYMBOL}${formatKHR((item.priceKHR || item.priceUSD) * item.quantity)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        <div class="divider"></div>
        <div class="summary">
            <div style="display:flex;justify-content:space-between">
                <span>សរុបរង:</span>
                <span>${KHR_SYMBOL}${formatKHR(subtotalKHR)}</span>
            </div>
            <div class="total" style="display:flex;justify-content:space-between">
                <span>សរុបត្រូវបង់:</span>
                <span>${KHR_SYMBOL}${formatKHR(totalKHR)}</span>
            </div>
        </div>

        <div class="qr">
            <img src="${qrCodeUrl}" onerror="this.style.display='none'">
        </div>

        <div class="footer">
            សូមអរគុណច្រើន! សូមអញ្ជើញមកម្តងទៀត!
        </div>
    </div>
</body>
</html>
        `);

        receiptWindow.document.close();

        // បិទ modal ដើម
        setTimeout(() => onClose(), 1000);

    }, [show, order, orderId, shopName, onClose]);

    return null;
}

export default ReceiptModal;