// src/components/ReceiptModal.jsx - Mobile & Desktop Compatible
import { useEffect } from 'react';
import { KHR_SYMBOL, formatKHR } from '../utils/formatters';
import logo from '../assets/logo.png';

const SHOP_STATIC_DETAILS = {
    address: "ផ្ទះលេខ 137, ផ្លូវ 223, កំពង់ចាម",
    tel: "016 438 555 / 061 91 4444"
};

function ReceiptModal({ order, orderId, shopName = "ន កាហ្វេ", triggerPrint }) {

    useEffect(() => {
        console.log('📄 [ReceiptModal] useEffect triggered:', {
            triggerPrint,
            hasOrder: order && order.length > 0,
            orderLength: order?.length,
            orderId
        });

        // Trigger ពេល triggerPrint > 0 និងមាន order
        if (triggerPrint > 0 && order && order.length > 0) {
            console.log('🖨️ [ReceiptModal] Opening print window...');
            
            // បើក receipt ក្នុង window/tab ថ្មី
            const receiptWindow = window.open('', '_blank', 'width=400,height=700');
            
            if (!receiptWindow) {
                console.error('❌ [ReceiptModal] Failed to open window - popup blocked!');
                alert('សូមអនុញ្ញាត popup សម្រាប់ print receipt');
                return;
            }

            console.log('✅ [ReceiptModal] Window opened successfully');

            const now = new Date();
            const totalKHR = order.reduce((sum, item) => sum + (item.priceKHR || 0) * item.quantity, 0);

            console.log('📊 [ReceiptModal] Receipt details:', {
                now,
                totalKHR,
                itemCount: order.length
            });

            // សរសេរ HTML ទៅក្នុង window ថ្មី
            receiptWindow.document.write(`
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

        body {
            font-family: var(--font-family);
            background: #f5f5f5;
            padding: 10px;
        }

        .receipt-container {
            max-width: 80mm;
            margin: 0 auto;
            background: white;
            padding: 15px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
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
            width: 15%;
        }

        .receipt-items-table th:last-child,
        .receipt-items-table td:last-child {
            text-align: right;
            width: 30%;
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

        .receipt-footer {
            text-align: center;
            font-size: 1em;
            margin-top: 12px;
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
            flex: 1;
            padding: 12px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-family: var(--font-family);
            font-size: 1em;
            font-weight: 600;
            transition: background-color 0.2s ease;
        }

        .btn-close {
            background-color: #D2B48C;
            color: #4A3B31;
        }

        .btn-print {
            background-color: #A0522D;
            color: white;
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

            body {
                background: white;
                padding: 0;
            }

            .button-container {
                display: none !important;
            }

            .receipt-container {
                box-shadow: none;
                padding: 3mm;
                margin: 0;
                width: 80mm;
                max-width: 80mm;
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
                <p>ទូរស័ព្ទ: ${SHOP_STATIC_DETAILS.tel}</p>
                <p>${now.toLocaleDateString('km-KH')} ${now.toLocaleTimeString('km-KH', {hour:'2-digit', minute:'2-digit'})}</p>
                <p><strong>វិក្កយបត្រ: ${orderId}</strong></p>
            </div>
            <div class="receipt-divider"></div>
            <table class="receipt-items-table">
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
                            <td>
                                ${item.khmerName}
                                ${item.englishName ? ` (${item.englishName})` : ''}
                            </td>
                            <td>${item.quantity}</td>
                            <td>${KHR_SYMBOL}${formatKHR(item.priceKHR * item.quantity)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div class="receipt-divider"></div>
            <div class="receipt-summary">
                <div class="receipt-summary-line">
                    <span>សរុបរង:</span>
                    <span>${KHR_SYMBOL}${formatKHR(totalKHR)}</span>
                </div>
                <div class="receipt-divider"></div>
                <div class="receipt-summary-line total">
                    <span>សរុបត្រូវបង់:</span>
                    <span>${KHR_SYMBOL}${formatKHR(totalKHR)}</span>
                </div>
            </div>
            <div class="receipt-footer">
                <p>សូមអរគុណ! សូមអញ្ជើញមកម្តងទៀត!</p>
            </div>
        </div>
        <div class="button-container">
            <button class="btn-close" onclick="window.close()">បិទ</button>
            <button class="btn-print" onclick="window.print()">បោះពុម្ព</button>
        </div>
    </div>
    
    <script>
        // Auto print when page loads (optional - uncomment if needed)
        // window.onload = function() {
        //     setTimeout(function() {
        //         window.print();
        //     }, 500);
        // };
    </script>
</body>
</html>
            `);

            receiptWindow.document.close();
            
            console.log('🎉 [ReceiptModal] Receipt window ready!');
        } else {
            console.log('⏸️ [ReceiptModal] Not printing - conditions not met:', {
                triggerPrint,
                hasOrder: order && order.length > 0
            });
        }
    }, [triggerPrint, order, orderId, shopName]);

    // Component មិន render អ្វីនៅលើ main page ទេ
    return null;
}

export default ReceiptModal;