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

        const receiptWindow = window.open('', '_blank');
        
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
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>វិក្កយបត្រ #${orderId}</title>
    <link href="https://fonts.googleapis.com/css2?family=Kantumruy+Pro:wght@300;400;500;700&display=swap" rel="stylesheet">

    <style>
        body {
            margin: 10px;
            font-family: 'Kantumruy Pro', sans-serif;
        }

        .receipt-container {
            background: white;
            padding: 10px;
        }

        .receipt-logo-top {
            text-align: center;
            margin-bottom: 10px;
        }

        .receipt-logo {
            width: 70px;
            height: auto;
        }

        .receipt-header {
            text-align: center;
            margin-bottom: 10px;
        }

        .receipt-header h3 {
            margin: 0;
            font-size: 1.2em;
        }

        .receipt-items-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            font-size: 0.95em;
        }

        .receipt-items-table th,
        .receipt-items-table td {
            padding: 5px 0;
            border-bottom: 1px dashed #999;
        }

        .receipt-items-table th:nth-child(2),
        .receipt-items-table td:nth-child(2) {
            text-align: center;
        }

        .receipt-items-table th:last-child,
        .receipt-items-table td:last-child {
            text-align: right;
        }

        .receipt-summary {
            margin-top: 10px;
            font-size: 1em;
        }

        .receipt-summary-line {
            display: flex;
            justify-content: space-between;
            margin-top: 6px;
        }

        .receipt-summary-line.total {
            font-weight: bold;
            font-size: 1.1em;
            border-top: 2px solid #222;
            padding-top: 6px;
        }

        .receipt-qr-code {
            text-align: center;
            margin-top: 12px;
        }

        .receipt-qr-code img {
            width: 110px;
            height: 110px;
        }

        .receipt-footer {
            text-align: center;
            margin-top: 10px;
            font-size: 0.95em;
        }

        .button-container {
            display: flex;
            justify-content: center;
            gap: 10px;
            margin-top: 20px;
        }

        button {
            padding: 10px 20px;
            font-size: 1em;
            cursor: pointer;
        }
    </style>
</head>

<body>
    <div class="receipt-container">
        <div class="receipt-logo-top">
            <img src="${logo}" class="receipt-logo" onerror="this.style.display='none'">
        </div>

        <div class="receipt-header">
            <h3>${shopName}</h3>
            <p>${SHOP_STATIC_DETAILS.address}</p>
            <p>Tel: ${SHOP_STATIC_DETAILS.tel}</p>
            <p>កាលបរិច្ឆេទ: ${now.toLocaleDateString('km-KH')} ${now.toLocaleTimeString('km-KH')}</p>
            <p>លេខវិក្កយបត្រ: ${orderId}</p>
        </div>

        <table class="receipt-items-table">
            <thead>
                <tr>
                    <th>មុខទំនិញ</th>
                    <th>ចំនួន</th>
                    <th>${KHR_SYMBOL}</th>
                </tr>
            </thead>
            <tbody>
                ${order.map(item => `
                    <tr>
                        <td>${item.khmerName}</td>
                        <td>${item.quantity}</td>
                        <td>${formatKHR((item.priceKHR || item.priceUSD) * item.quantity)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        <div class="receipt-summary">
            <div class="receipt-summary-line">
                <span>សរុបរង:</span>
                <span>${formatKHR(subtotalKHR)}</span>
            </div>

            <div class="receipt-summary-line total">
                <span>សរុប:</span>
                <span>${formatKHR(totalKHR)}</span>
            </div>
        </div>

        <div class="receipt-qr-code">
            <img src="${qrCodeUrl}" onerror="this.style.display='none'">
        </div>

        <div class="receipt-footer">
            <p>សូមអរគុណ! សូមអញ្ជើញមកម្តងទៀត!</p>
        </div>

        <div class="button-container">
            <button onclick="window.print()">Print</button>
            <button onclick="window.close()">Close</button>
        </div>
    </div>
</body>
</html>
            `);

            receiptWindow.document.close();

            const check = setInterval(() => {
                if (receiptWindow.closed) {
                    clearInterval(check);
                    onClose();
                }
            }, 400);
        }

        onClose();

    }, [show]);

    return null;
}

export default ReceiptModal;
