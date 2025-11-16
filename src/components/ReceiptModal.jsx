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

        // បើក receipt ក្នុង page ថ្មី
        const receiptWindow = window.open('', '_blank', 'width=400,height=600');
        
        if (receiptWindow) {
            const now = new Date();
            const subtotalKHR = order.reduce((sum, item) => sum + (item.priceKHR || item.priceUSD || 0) * item.quantity, 0);
            const totalKHR = subtotalKHR;

            const safeShopNameForQR = shopName.replace(/\s+/g, '_');
            const qrData = `ORDER_ID:${orderId};TOTAL_KHR:${formatKHR(totalKHR)};SHOP_NAME:${safeShopNameForQR}`;
            const qrCodeUrl = qrcode + `?data=${encodeURIComponent(qrData)}`;

            // សរសេរ HTML ទៅក្នុង window ថ្មី
            receiptWindow.document.write(`
<!DOCTYPE html>
<html lang="km">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width">
    <title>វិក្កយបត្រ #${orderId}</title>
    <link href="https://fonts.googleapis.com/css2?family=Kantumruy+Pro:wght@300;400;500;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary-color: #A0522D;
            --secondary-color: #D2B48C;
            --accent-color: #FF8C00;
            --surface-color: #FFFFFF;
            --text-color: #4A3B31;
            --border-color: #E0D6CC;
            --font-family: 'Kantumruy Pro', sans-serif;
        }

        body {
            margin: 0;
            padding: 10px;
            background-color: #f5f5f5;
            font-family: var(--font-family);
        }

        .receipt-container {
            background: white;
            padding: 15px;

        }

        .receipt-print-area {
            font-family: 'Courier New', Courier, monospace;
            font-size: 11pt;
            color: #000;
            width: 100%;
        }

        .receipt-logo-top {
            text-align: center;
            margin-bottom: 8px;
        }

        .receipt-logo {
            width: 60px;
            height: auto;
            max-height: 60px;
        }

        .receipt-header {
            text-align: center;
            margin-bottom: 10px;
        }

        .receipt-header h3 {
            margin: 5px 0;
            font-family: var(--font-family);
            font-size: 1.3em;
            font-weight: bold;
            color: #000;
        }

        .receipt-header p {
            margin: 2px 0;
            font-size: 0.9em;
            line-height: 1.4;
        }

        .receipt-divider {
            border-top: 1px dashed #333;
            margin: 8px 0;
        }

        .receipt-items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
            font-size: 0.95em;
        }

        .receipt-items-table th,
        .receipt-items-table td {
            text-align: left;
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

        .receipt-summary {
            margin-top: 10px;
        }

        .receipt-summary-line {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
            font-size: 0.95em;
        }

        .receipt-summary-line.total {
            font-weight: bold;
            font-size: 1.15em;
            margin-top: 8px;
            padding-top: 8px;
            border-top: 2px solid #333;
        }

        .receipt-qr-code {
            text-align: center;
            margin: 12px 0;
        }

        .receipt-qr-code p {
            font-size: 0.85em;
            margin-bottom: 8px;
            font-family: var(--font-family);
        }

        .receipt-qr-code img {
            width: 100px;
            height: 100px;
            border: 1px solid #ccc;
        }

        .receipt-footer {
            text-align: center;
            font-size: 0.9em;
            margin-top: 10px;
            font-weight: 500;
        }

        .button-container {
            display: flex;
            gap: 10px;
            justify-content: center;
            margin-top: 20px;
            padding: 0 15px;
        }

        button {
            padding: 12px 24px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-family: var(--font-family);
            font-size: 1em;
            font-weight: 600;
            transition: background-color 0.2s ease;
        }

        .btn-close {
            background-color: var(--secondary-color);
            color: var(--text-color);
        }

        .btn-close:hover {
            background-color: #C0A070;
        }

        .btn-print {
            background-color: var(--primary-color);
            color: white;
        }

        .btn-print:hover {
            background-color: #793D1B;
        }

        /* Print Styles - Optimized for 80mm Thermal Printer */
        @page {
            size: 100% auto;
            margin: 0;
        }

        @media print {
            * {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }

            html, body {
                width: 100%;
                background: white;
                padding: 0;
                margin: 0;
            }

            body {
                padding: 0 !important;
            }

            .button-container {
                display: none !important;
            }

            .receipt-container {
                width: 100%;
                max-width: 100%;
                margin: 0;
                box-shadow: none;
                border-radius: 0;
            }

            .receipt-print-area {
                width: 100%;
            }

            /* ធ្វើឲ្យទំហំអក្សរធំជាងបន្តិចសម្រាប់ thermal printer */
            .receipt-header h3 {
                font-size: 1.2em;
            }

            .receipt-header p {
                font-size: 0.85em;
            }

            .receipt-items-table {
                font-size: 0.9em;
            }

            .receipt-items-table th,
            .receipt-items-table td {
                padding: 3px 2px;
            }

            .receipt-summary-line {
                font-size: 0.9em;
            }

            .receipt-summary-line.total {
                font-size: 1.1em;
            }

            .receipt-qr-code img {
                width: 90px !important;
                height: 90px !important;
            }

            .receipt-qr-code p {
                font-size: 0.8em;
            }

            .receipt-footer {
                font-size: 0.85em;
            }

            .receipt-logo {
                width: 55px;
                height: auto;
            }
        }
    </style>
</head>
<body>
    <div class="receipt-container">
        <div class="receipt-print-area">
            <div class="receipt-logo-top">
                <img src="${logo}" alt="Logo" class="receipt-logo" onerror="this.style.display='none'">
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
                        <th>សរុប (${KHR_SYMBOL})</th>
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
            <div class="receipt-summary">
                <div class="receipt-summary-line">
                    <span>សរុបរង:</span>
                    <span>${KHR_SYMBOL}${formatKHR(subtotalKHR || 0)}</span>
                </div>
                <div class="receipt-divider"></div>
                <div class="receipt-summary-line total">
                    <span>សរុប (${KHR_SYMBOL}):</span>
                    <span>${KHR_SYMBOL}${formatKHR(totalKHR || 0)}</span>
                </div>
            </div>
            <div class="receipt-qr-code">
                <p>សូមស្កេនដើម្បីទូទាត់ ឬមើលព័ត៌មានបន្ថែម</p>
                <img src="${qrCodeUrl}" alt="QR Code" onerror="this.style.display='none'">
            </div>
            <div class="receipt-footer">
                <p>សូមអរគុណ! សូមអញ្ជើញមកម្តងទៀត!</p>
            </div>
        </div>
        <div class="button-container">
            <button class="btn-close" onclick="window.close()">បោះបង់</button>
            <button class="btn-print" onclick="window.print()">បោះពុម្ពវិក្កយបត្រ</button>
        </div>
    </div>
</body>
</html>
            `);

            receiptWindow.document.close();

            // ចាំឲ្យ window បិទ រួចហើយ close modal
            const checkWindowClosed = setInterval(() => {
                if (receiptWindow.closed) {
                    clearInterval(checkWindowClosed);
                    onClose();
                }
            }, 500);
        }

        // បិទ modal ភ្លាមៗ ព្រោះបានបើក window ថ្មីហើយ
        onClose();

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [show]);

    // មិនត្រូវការ render អ្វីទេ ព្រោះបើក window ថ្មី
    return null;
}

export default ReceiptModal;