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

        // បង្កើត hidden iframe សម្រាប់ print
        const printFrame = document.createElement('iframe');
        printFrame.style.position = 'fixed';
        printFrame.style.right = '0';
        printFrame.style.bottom = '0';
        printFrame.style.width = '0';
        printFrame.style.height = '0';
        printFrame.style.border = '0';
        document.body.appendChild(printFrame);

        const now = new Date();
        const subtotalKHR = order.reduce((sum, item) => sum + (item.priceKHR || item.priceUSD || 0) * item.quantity, 0);
        const totalKHR = subtotalKHR;

        const safeShopNameForQR = shopName.replace(/\s+/g, '_');
        const qrData = `ORDER_ID:${orderId};TOTAL_KHR:${formatKHR(totalKHR)};SHOP_NAME:${safeShopNameForQR}`;
        const qrCodeUrl = qrcode + `?data=${encodeURIComponent(qrData)}`;

        // សរសេរ HTML ទៅក្នុង iframe
        const frameDoc = printFrame.contentDocument || printFrame.contentWindow.document;
        frameDoc.open();
        frameDoc.write(`
<!DOCTYPE html>
<html lang="km">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>វិក្កយបត្រ #${orderId}</title>
    <link href="https://fonts.googleapis.com/css2?family=Kantumruy+Pro:wght@300;400;500;700&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        :root {
            --font-family: 'Kantumruy Pro', sans-serif;
        }

        html, body {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            background: white;
        }

        body {
            font-family: var(--font-family);
            display: flex;
            justify-content: center;
            align-items: flex-start;
            padding: 10mm 0;
        }

        .receipt-container {
            width: 80mm;
            padding: 5mm;
            background: white;
        }

        .receipt-print-area {
            font-family: 'Courier New', Courier, monospace;
            font-size: 13pt;
            color: #000;
            width: 100%;
        }

        .receipt-logo-top {
            text-align: center;
            margin-bottom: 10px;
        }

        .receipt-logo {
            width: 70px;
            height: auto;
            max-height: 70px;
        }

        .receipt-header {
            text-align: center;
            margin-bottom: 12px;
        }

        .receipt-header h3 {
            margin: 6px 0;
            font-family: var(--font-family);
            font-size: 1.5em;
            font-weight: bold;
            color: #000;
        }

        .receipt-header p {
            margin: 3px 0;
            font-size: 1em;
            line-height: 1.5;
        }

        .receipt-divider {
            border-top: 2px dashed #333;
            margin: 10px 0;
        }

        .receipt-items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12px;
            font-size: 1.05em;
        }

        .receipt-items-table th,
        .receipt-items-table td {
            text-align: left;
            padding: 5px 2px;
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
            margin-bottom: 6px;
            font-size: 1.05em;
        }

        .receipt-summary-line.total {
            font-weight: bold;
            font-size: 1.3em;
            margin-top: 10px;
            padding-top: 10px;
            border-top: 2px solid #333;
        }

        .receipt-qr-code {
            text-align: center;
            margin: 15px 0;
        }

        .receipt-qr-code p {
            font-size: 0.95em;
            margin-bottom: 10px;
            font-family: var(--font-family);
        }

        .receipt-qr-code img {
            width: 120px;
            height: 120px;
            border: 1px solid #ccc;
        }

        .receipt-footer {
            text-align: center;
            font-size: 1em;
            margin-top: 12px;
            font-weight: 500;
        }

        /* Print Styles */
        @page {
            size: 80mm auto;
            margin: 0;
        }

        @media print {
            * {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }

            html, body {
                width: 80mm;
                height: auto;
                margin: 0;
                padding: 0;
            }

            body {
                padding: 0;
                display: block;
            }

            .receipt-container {
                width: 80mm;
                padding: 3mm;
            }

            .receipt-print-area {
                font-size: 12pt;
            }

            .receipt-header h3 {
                font-size: 1.4em;
            }

            .receipt-header p {
                font-size: 0.95em;
            }

            .receipt-items-table {
                font-size: 1em;
            }

            .receipt-items-table th,
            .receipt-items-table td {
                padding: 4px 2px;
            }

            .receipt-summary-line {
                font-size: 1em;
            }

            .receipt-summary-line.total {
                font-size: 1.25em;
            }

            .receipt-qr-code img {
                width: 110px !important;
                height: 110px !important;
            }

            .receipt-qr-code p {
                font-size: 0.9em;
            }

            .receipt-footer {
                font-size: 0.95em;
            }

            .receipt-logo {
                width: 65px;
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
    </div>
</body>
</html>
        `);
        frameDoc.close();

        // ចាំឲ្យ content load រួច រួចហើយ print
        printFrame.onload = function() {
            setTimeout(() => {
                try {
                    printFrame.contentWindow.focus();
                    printFrame.contentWindow.print();
                    
                    // លុប iframe បន្ទាប់ពី print dialog បើក
                    setTimeout(() => {
                        document.body.removeChild(printFrame);
                    }, 1000);
                } catch (e) {
                    console.error('Print error:', e);
                    document.body.removeChild(printFrame);
                }
            }, 500);
        };

        // បិទ modal ភ្លាមៗ
        onClose();

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [show]);

    // មិនត្រូវការ render អ្វីទេ
    return null;
}

export default ReceiptModal;