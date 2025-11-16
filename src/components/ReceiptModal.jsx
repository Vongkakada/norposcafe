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

        const receiptWindow = window.open('', '_blank', 'width=800,height=900');

        if (receiptWindow) {
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
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>វិក្កយបត្រ #${orderId}</title>

    <style>
        body {
            margin: 0;
            padding: 20mm;
            font-family: 'Kantumruy Pro', sans-serif;
            background: white;
            color: black;
        }

        .receipt-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 30px 40px;
            border: 3px double #333;
            border-radius: 12px;
            background: white;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }

        .receipt-logo-top {
            text-align: center;
            margin-bottom: 20px;
        }

        .receipt-logo {
            width: 100px;
            height: auto;
            border-radius: 10px;
        }

        .receipt-header h3 {
            text-align: center;
            font-size: 2.2em;
            margin: 10px 0;
            font-weight: bold;
            color: #A0522D;
        }

        .receipt-header p {
            text-align: center;
            font-size: 1.3em;
            margin: 6px 0;
            color: #333;
        }

        .receipt-divider {
            border-top: 3px double #333;
            margin: 20px 0;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 1.4em;
        }

        th {
            background: #A0522D;
            color: white;
            padding: 12px 8px;
            font-weight: bold;
        }

        td {
            padding: 12px 8px;
            border-bottom: 1px solid #ccc;
        }

        th:nth-child(2), td:nth-child(2) { text-align: center; }
        th:last-child, td:last-child { text-align: right; }

        .receipt-summary-line {
            display: flex;
            justify-content: space-between;
            font-size: 1.6em;
            margin: 10px 0;
            font-weight: 500;
        }

        .receipt-summary-line.total {
            font-size: 2em !important;
            font-weight: bold;
            color: #A0522D;
            border-top: 3px double #333;
            padding-top: 12px;
            margin-top: 20px;
        }

        .receipt-qr-code {
            text-align: center;
            margin: 30px 0;
        }

        .receipt-qr-code img {
            width: 180px;
            height: 180px;
            padding: 15px;
            border: 3px solid #A0522D;
            border-radius: 15px;
            background: white;
        }

        .receipt-footer {
            text-align: center;
            margin-top: 40px;
            font-size: 1.5em;
            font-weight: bold;
            color: #A0522D;
            font-style: italic;
        }

        /* ==================== សំខាន់បំផុត: Print ធំស្អាត ==================== */
        @media print {
            @page {
                size: A4;           /* ឬ Letter */
                margin: 10mm;
            }

            body {
                padding: 10mm;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }

            .receipt-container {
                border: 4px double #333;
                padding: 40px;
                box-shadow: none;
            }

            /* បើចង់ឲ្យធំជាង 50% ទៀត អាចប្រើ transform */
            /* .receipt-container { transform: scale(1.5); transform-origin: top left; } */
        }
    </style>
</head>

<body onload="window.print()">
<div class="receipt-container">
    <div class="receipt-logo-top">
        <img src="${logo}" class="receipt-logo" onerror="this.style.display='none'">
    </div>

    <div class="receipt-header">
        <h3>${shopName}</h3>
        <p>${SHOP_STATIC_DETAILS.address}</p>
        <p>ទូរស័ព្ទ: ${SHOP_STATIC_DETAILS.tel}</p>
        <p>កាលបរិច្ឆេទ: ${now.toLocaleDateString('km-KH')} ${now.toLocaleTimeString('km-KH', {hour: '2-digit', minute: '2-digit'})}</p>
        <p>លេខវិក្កយបត្រ: ${orderId}</p>
    </div>

    <div class="receipt-divider"></div>

    <table>
        <thead>
            <tr>
                <th>មុខទំនិញ</th>
                <th>ចំនួន</th>
                <th>តម្លៃ (${KHR_SYMBOL})</th>
            </tr>
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

    <div class="receipt-divider"></div>

    <div class="receipt-summary-line">
        <span>សរុបរង:</span>
        <span>${KHR_SYMBOL}${formatKHR(subtotalKHR)}</span>
    </div>

    <div class="receipt-summary-line total">
        <span>សរុបត្រូវបង់:</span>
        <span>${KHR_SYMBOL}${formatKHR(totalKHR)}</span>
    </div>

    <div class="receipt-qr-code">
        <img src="${qrCodeUrl}" onerror="this.style.display='none'">
    </div>

    <div class="receipt-footer">
        សូមអរគុណច្រើន! សូមអញ្ជើញមកម្តងទៀត!
    </div>
</div>
</body>
</html>
            `);

            receiptWindow.document.close();
        }

        // បិទ modal ដើម (បើមិនចង់បិទ អាចលុបចោល)
        setTimeout(() => onClose(), 500);

    }, [show, order, orderId, shopName, onClose]);

    return null;
}

export default ReceiptModal;