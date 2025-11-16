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

        // eslint-disable-next-line react-hooks/exhaustive-deps
        const receiptWindow = window.open('', '_blank', 'width=400,height=600');

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
<meta name="viewport" content="width=device-width">
<title>វិក្កយបត្រ #${orderId}</title>

<style>
    body {
        margin: 0;
        font-family: 'Kantumruy Pro', sans-serif;
        background: white;
    }

    .receipt-container {
        box-sizing: border-box;
    }

    .receipt-logo-top {
        text-align: center;
        margin-bottom: 6px;
    }

    .receipt-logo {
        width: 60px;
        height: auto;
    }

    .receipt-header {
        text-align: center;
        margin-bottom: 6px;
    }

    .receipt-header h3 {
        margin: 5px 0;
        font-size: 1.2em;
        font-weight: bold;
    }

    .receipt-header p {
        margin: 2px 0;
        font-size: 0.9em;
    }

    .receipt-divider {
        border-top: 1px dashed #333;
        margin: 8px 0;
    }

    table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.9em;
    }

    th, td {
        padding: 4px 2px;
        border-bottom: 1px dotted #888;
    }

    th:nth-child(2), td:nth-child(2) {
        text-align: center;
    }

    th:last-child, td:last-child {
        text-align: right;
    }

    .receipt-summary-line {
        display: flex;
        justify-content: space-between;
        margin: 4px 0;
    }

    .receipt-summary-line.total {
        font-weight: bold;
        margin-top: 6px;
        padding-top: 6px;
        border-top: 2px solid #000;
    }

    .receipt-qr-code {
        text-align: center;
        margin: 12px 0;
    }

    .receipt-qr-code img {
        width: 100px;
        height: 100px;
        border: 1px solid #ccc;
    }

    .receipt-footer {
        text-align: center;
        margin-top: 10px;
        font-size: 0.9em;
        font-weight: 500;
    }

    /* ❌ គ្មាន @media print, scale, 80mm, print-color-adjust */
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

    <div class="receipt-divider"></div>

    <table>
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
                    <td>${item.khmerName} (${item.englishName || ''})</td>
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
        <span>សរុប:</span>
        <span>${KHR_SYMBOL}${formatKHR(totalKHR)}</span>
    </div>

    <div class="receipt-qr-code">
        <img src="${qrCodeUrl}" onerror="this.style.display='none'">
    </div>

    <div class="receipt-footer">
        សូមអរគុណ! សូមអញ្ជើញមកម្តងទៀត!
    </div>
</div>

<script>
    setTimeout(() => window.print(), 300);
</script>

</body>
</html>
            `);

            receiptWindow.document.close();
        }

        onClose();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [show]);

    return null;
}

export default ReceiptModal;
