// src/components/ReceiptModal.jsx - កែតិចតួច ប៉ុន្តែ Print ស្អាត 100% នៅលើទូ
import { useEffect } from 'react';
import { KHR_SYMBOL, formatKHR } from '../utils/formatters';
import logo from '../assets/logo.png';

const SHOP_STATIC_DETAILS = {
    address: "ផ្ទះលេខ 137, ផ្លូវ 223, កំពង់ចាម",
    tel: "016 438 555 / 061 91 4444"
};

function ReceiptModal({ order, orderId, shopName = "ន កាហ្វេ", triggerPrint }) {

    useEffect(() => {
        if (triggerPrint > 0 && order && order.length > 0) {
            const receiptWindow = window.open('', '_blank', 'width=400,height=800,scrollbars=no');

            if (!receiptWindow) {
                alert('សូមអនុញ្ញាត Popup ដើម្បីបោះពុម្ពវិក្កយបត្រ');
                return;
            }

            const now = new Date();
            const totalKHR = order.reduce((sum, item) => sum + (item.priceKHR || 0) * item.quantity, 0);

            receiptWindow.document.write(`
<!DOCTYPE html>
<html lang="km">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>វិក្កយបត្រ #${orderId}</title>
    <link href="https://fonts.googleapis.com/css2?family=Kantumruy+Pro:wght@400;500;700&display=swap" rel="stylesheet">
    <style>
        body, html {
            margin: 0;
            padding: 0;
            height: 100%;
            background: white;
            font-family: 'Kantumruy Pro', sans-serif;
        }

        .receipt {
            width: 80mm;
            min-height: 100vh;
            margin: 0 auto;
            padding: 8mm 4mm;
            background: white;
            box-sizing: border-box;
        }

        img {
            display: block;
            margin: 0 auto 8px;
            width: 65px;
            height: auto;
        }

        h3 {
            text-align: center;
            margin: 8px 0;
            font-size: 18px;
            font-weight: bold;
        }

        p {
            text-align: center;
            margin: 4px 0;
            font-size: 13px;
            line-height: 1.4;
        }

        .divider {
            border-top: 2px dashed #000;
            margin: 10px 0;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
            font-size: 13px;
        }

        th, td {
            padding: 5px 2px;
            text-align: left;
        }

        th:nth-child(2), td:nth-child(2) { text-align: center; width: 18%; }
        th:last-child, td:last-child { text-align: right; width: 32%; }

        .total {
            font-weight: bold;
            font-size: 16px;
            border-top: 2px solid #000;
            padding-top: 8px;
            margin-top: 8px;
        }

        .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 14px;
        }

        /* សំខាន់បំផុតសម្រាប់ Mobile */
        @page {
            size: 80mm 297mm;   /* ឬ auto ក៏បាន */
            margin: 0 !important;
        }

        @media print {
            body, html {
                margin: 0 !important;
                padding: 0 !important;
                background: white !important;
            }

            .no-print { display: none !important; }

            .receipt {
                padding: 5mm 3mm !important;
                margin: 0 !important;
                width: 100% !important;
                max-width: none !important;
            }
        }
    </style>
</head>
<body onload="setTimeout(() => window.print(), 800)">
    <div class="receipt">
        <img src="${logo}" alt="Logo" onerror="this.style.display='none'">
        <h3>${shopName}</h3>
        <p>${SHOP_STATIC_DETAILS.address}</p>
        <p>ទូរស័ព្ទ: ${SHOP_STATIC_DETAILS.tel}</p>
        <p>${now.toLocaleDateString('km-KH')} ${now.toLocaleTimeString('km-KH', {hour:'2-digit', minute:'2-digit'})}</p>
        <p><strong>វិក្កយបត្រ #${orderId}</strong></p>
        
        <div class="divider"></div>
        
        <table>
            <thead>
                <tr>
                    <th>មុខទំនិញ</th>
                    <th>ចំនួន</th>
                    <th>តម្លៃ</th>
                </tr>
            </thead>
            <tbody>
                ${order.map(item => `
                    <tr>
                        <td>${item.khmerName}${item.englishName ? ` (${item.englishName})` : ''}</td>
                        <td>${item.quantity}</td>
                        <td>${KHR_SYMBOL}${formatKHR(item.priceKHR * item.quantity)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        
        <div class="divider"></div>
        <div style="text-align: right; font-size: 14px;">
            <div>សរុបរង: ${KHR_SYMBOL}${formatKHR(totalKHR)}</div>
            <div class="total">សរុបត្រូវបង់: ${KHR_SYMBOL}${formatKHR(totalKHR)}</div>
        </div>
        
        <div class="footer">សូមអរគុណ! សូមអញ្ជើញមកម្តងទៀត!</div>
    </div>

    <!-- ប៊ូតុងសម្រាប់ Desktop ប៉ុណ្ណោះ -->
    <div class="no-print" style="position:fixed; bottom:20px; left:50%; transform:translateX(-50%); text-align:center;">
        <button onclick="window.print()" style="padding:12px 30px; font-size:16px; margin:0 10px;">បោះពុម្ព</button>
        <button onclick="window.close()" style="padding:12px 30px; font-size:16px; margin:0 10px;">បិទ</button>
    </div>

    <script>
        // Auto print នៅលើទូរស័ព្ទ (បើក 800ms ដើម្បីឲ្យ render ចប់)
        setTimeout(() => window.print(), 800);
        
        // បិទដោយស្វ័យប្រវត្តិក្រោយ Print (សម្រាប់ mobile)
        window.onafterprint = () => setTimeout(() => window.close(), 600);
    </script>
</body>
</html>
            `);

            receiptWindow.document.close();
            receiptWindow.focus(); // សំខាន់ណាស់នៅ mobile
        }
    }, [triggerPrint, order, orderId, shopName]);

    return null;
}

export default ReceiptModal;