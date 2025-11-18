// src/components/ReceiptModal.jsx - Print Dialog ដូច Desktop នៅ Mobile + បន្ថែមតម្លៃដុល្លារ
import { useEffect } from 'react';
import { KHR_SYMBOL, formatKHR } from '../utils/formatters';
import logo from '../assets/logo.png';
import qrcode from "../assets/qrcode.jpg";

const SHOP_STATIC_DETAILS = {
    address: "ផ្ទះលេខ 137, ផ្លូវ 223, កំពង់ចាម",
    tel: "016 438 555 / 061 91 4444"
};

const EXCHANGE_RATE = 4000; // 1$ = 4000៛
const formatUSD = (khr) => (khr / EXCHANGE_RATE).toFixed(2);

function ReceiptModal({ order, orderId, shopName = "ន កាហ្វេ", triggerPrint }) {

    useEffect(() => {
        if (triggerPrint > 0 && order && order.length > 0) {
            const receiptWindow = window.open('', '_blank', 'width=400,height=800,scrollbars=no,resizable=yes');

            if (!receiptWindow) {
                alert('សូមអនុញ្ញាត Popup ដើម្បីបោះពុម្ពវិក្កយបត្រ');
                return;
            }

            const now = new Date();
            const totalKHR = order.reduce((sum, item) => sum + (item.priceKHR || 0) * item.quantity, 0);
            const totalUSD = formatUSD(totalKHR);

            receiptWindow.document.write(`
<!DOCTYPE html>
<html lang="km">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>វិក្កយបត្រ #${orderId}</title>
    <link href="https://fonts.googleapis.com/css2?family=Kantumruy+Pro:wght@400;500;700&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body, html { 
            height: 100%; 
            background: white; 
            font-family: 'Kantumruy Pro', sans-serif; 
            padding: 10px;
        }
        .receipt { 
            width: 80mm; 
            margin: 0 auto; 
            background: white; 
            padding: 10mm 5mm; 
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        img { width: 65px; height: auto; display: block; margin: 0 auto 10px; }
        h3 { text-align: center; font-size: 18px; margin: 8px 0; font-weight: bold; }
        p { text-align: center; font-size: 13px; margin: 4px 0; line-height: 1.4; }
        .divider { border-top: 2px dashed #000; margin: 12px 0; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 13px; }
        th, td { padding: 5px 2px; }
        th:nth-child(2), td:nth-child(2) { text-align: center; width: 18%; }
        th:last-child, td:last-child { text-align: right; width: 32%; }
        .total { font-weight: bold; font-size: 16px; border-top: 2px solid #000; padding-top: 8px; margin-top: 8px; }

        /* សំខាន់បំផុត: Print Dialog ដូច Desktop */
        @page { 
            size: 80mm auto; 
            margin: 0 !important; 
        }
        @media print {
            body, html { margin: 0 !important; padding: 0 !important; background: white !important; }
            .receipt { padding: 5mm 3mm !important; margin: 0 !important; width: 100% !important; box-shadow: none !important; }
            .no-print { display: none !important; }
        }
    </style>
</head>
<body>
    <div class="receipt">
        <img 
    src="${logo}" 
    alt="Logo" 
    class="receipt-logo"
    style="filter: brightness(0) saturate(100%); width: 70px; height: auto;"
    onerror="this.style.display='none'"
>
        <h3>${shopName}</h3>
        <p>${SHOP_STATIC_DETAILS.address}</p>
        <p>ទូរស័ព្ទ: ${SHOP_STATIC_DETAILS.tel}</p>
        <p>${now.toLocaleDateString('km-KH')} ${now.toLocaleTimeString('km-KH', {hour:'2-digit', minute:'2-digit'})}</p>
        <p><strong>វិក្កយបត្រ #${orderId}</strong></p>
        <div class="divider"></div>
        <table>
            <thead><tr><th>មុខទំនិញ</th><th>ចំនួន</th><th>តម្លៃ</th></tr></thead>
            <tbody>
                ${order.map(item => `
                    <tr>
                        <td>${item.khmerName}${item.englishName ? ` (${item.englishName})` : ''}</td>
                        <td>${item.quantity}</td>
                        <td>
                            ${KHR_SYMBOL}${formatKHR(item.priceKHR * item.quantity)}<br>
                            <span style="font-size:11px; color:#666;">$${formatUSD(item.priceKHR * item.quantity)}</span>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        <div class="divider"></div>
        <div style="text-align:right; font-size:14px;">
            <div>
                សរុបរង: ${KHR_SYMBOL}${formatKHR(totalKHR)} 
                <span style="font-size:12px; color:#666;">($${totalUSD})</span>
            </div>
            <div class="total">
                សរុបត្រូវបង់: ${KHR_SYMBOL}${formatKHR(totalKHR)}
                <div style="font-size:14px; color:#555; margin-top:5px;">
                    💵 $${totalUSD} USD
                </div>
            </div>
        </div>
        <div class="receipt-qr-code" style="text-align:center; margin-top:20px; padding:10px;">
            <p style="font-size:13px; margin-bottom:8px; font-weight:500;">
                សូមស្កេនដើម្បីទូទាត់
            </p>
            <img 
                src="${qrcode}" 
                alt="QR Code" 
                style="width:120px; height:120px; margin:0 auto; display:block; border:2px solid #ddd; padding:5px; background:white; border-radius:5px;"
            />
        </div>
        <div style="text-align:center; margin-top:20px; font-size:14px;">
            សូមអរគុណ! សូមអញ្ជើញមកម្តងទៀត!
        </div>
    </div>

    <!-- ប៊ូតុង Print និង បិទ (ដូច Desktop) -->
    <div class="no-print" style="position:fixed; bottom:20px; left:50%; transform:translateX(-50%); background:white; padding:15px; border-radius:10px; box-shadow:0 4px 12px rgba(0,0,0,0.2);">
        <button onclick="window.close()" style="padding:12px 30px; font-size:16px; background:#D2B48C; color:#4A3B31; border:none; border-radius:5px; margin:0 8px; cursor:pointer;">
            បិទ
        </button>    
        <button onclick="window.print()" style="padding:12px 30px; font-size:16px; background:#A0522D; color:white; border:none; border-radius:5px; margin:0 8px; cursor:pointer;">
            បោះពុម្ព
        </button>

    </div>

    <script>
        // ធានាថា Print Dialog បើកភ្លាមៗនៅ mobile
        window.onload = function() {
            // មិន auto print ទេ → រង់ចាំអ្នកប្រើចុច
            // ប៉ុន្តែ focus ទៅ tab ថ្មី
            window.focus();
        };
    </script>
</body>
</html>
            `);

            receiptWindow.document.close();

            // សំខាន់បំផុត: focus ទៅ tab ថ្មី
            receiptWindow.focus();

            console.log('Receipt window ready! ចុច "បោះពុម្ព" ដើម្បីបើក Print Dialog');
        }
    }, [triggerPrint, order, orderId, shopName]);

    return null;
}

export default ReceiptModal;