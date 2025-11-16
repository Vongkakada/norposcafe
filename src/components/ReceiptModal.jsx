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

        const receiptWindow = window.open('', '_blank', 'width=400,height=600');

        if (receiptWindow) {
            const now = new Date();
            const subtotalKHR = order.reduce((sum, item) => sum + (item.priceKHR || item.priceUSD || 0) * item.quantity, 0);
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

<style>
    body {
        margin: 0;
        padding: 0;
        font-family: sans-serif;
        background: #fff;
    }

    .receipt-container {
        width: 100%;
        max-width: 100%;
        padding: 10px;
        box-sizing: border-box;
    }

    .receipt-print-area {
        width: 100%;
    }

    .receipt-logo-top {
        text-align: center;
        margin-bottom: 6px;
    }
    .receipt-logo {
        width: 55px;
        height: auto;
    }

    .receipt-header {
        text-align: center;
        margin-bottom: 10px;
    }
    .receipt-header h3 {
        margin: 4px 0;
        font-size: 16px;
        font-weight: bold;
    }
    .receipt-header p {
        margin: 2px 0;
        font-size: 12px;
    }

    .receipt-divider {
        border-top: 1px dashed #333;
        margin: 6px 0;
    }

    .receipt-items-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 12px;
    }
    .receipt-items-table th,
    .receipt-items-table td {
        padding: 4px 2px;
        border-bottom: 1px dotted #888;
    }
    .receipt-items-table th:nth-child(2),
    .receipt-items-table td:nth-child(2) {
        text-align: center;
    }
    .receipt-items-table th:last-child,
    .receipt-items-table td:last-child {
        text-align: right;
    }
    .receipt-items-table tr:last-child td {
        border-bottom: none;
    }

    .receipt-summary-line {
        display: flex;
        justify-content: space-between;
        margin-bottom: 5px;
        font-size: 12px;
    }
    .receipt-summary-line.total {
        font-weight: bold;
        padding-top: 4px;
        border-top: 1px solid #000;
        font-size: 13px;
    }

    .receipt-qr-code {
        text-align: center;
        margin: 10px 0;
    }
    .receipt-qr-code img {
        width: 80px;
        height: 80px;
    }
    .receipt-qr-code p {
        font-size: 11px;
        margin-bottom: 6px;
    }

    .receipt-footer {
        text-align: center;
        font-size: 12px;
        margin-top: 10px;
    }

    .button-container {
        display: flex;
        gap: 10px;
        justify-content: center;
        margin-top: 20px;
    }

    button {
        padding: 10px 20px;
        border: none;
        border-radius: 4px;
        font-size: 14px;
        cursor: pointer;
    }
    .btn-close {
        background: #e0e0e0;
    }
    .btn-print {
        background: #000;
        color: #fff;
    }

    /* PRINT MODE — Fix for Mobile + Thermal Printer */
    @page {
        margin: 0;
    }

    @media print {
        body {
            margin: 0;
            padding: 0;
            background: #fff;
        }

        .button-container {
            display: none !important;
        }

        .receipt-container {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0;
            padding: 6px;
        }

        .receipt-logo {
            width: 50px;
        }

        .receipt-header h3 {
            font-size: 15px;
        }
        .receipt-header p {
            font-size: 11px;
        }

        .receipt-items-table {
            font-size: 11px;
        }

        .receipt-qr-code img {
            width: 70px !important;
            height: 70px !important;
        }

        .receipt-footer {
            font-size: 11px;
        }
    }
</style>
</head>

<body>
    <div class="receipt-container">
        <div class="receipt-print-area">
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
                <p>ស្វែងរកព័ត៌មានបន្ថែម</p>
                <img src="${qrCodeUrl}" onerror="this.style.display='none'">
            </div>

            <div class="receipt-footer">
                <p>សូមអរគុណ! សូមអញ្ជើញមកម្តងទៀត!</p>
            </div>
        </div>

        <div class="button-container">
            <button class="btn-close" onclick="window.close()">បោះបង់</button>
            <button class="btn-print" onclick="window.print()">បោះពុម្ព</button>
        </div>
    </div>
</body>
</html>
            `);

            receiptWindow.document.close();

            const checkWindowClosed = setInterval(() => {
                if (receiptWindow.closed) {
                    clearInterval(checkWindowClosed);
                    onClose();
                }
            }, 500);
        }

        onClose();

    }, [show]);

    return null;
}

export default ReceiptModal;
