// src/components/ReceiptModal.jsx - លាក់ Window + លោត Print Dialog ភ្លាមៗ
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
            // បើក window លាក់ (គ្មានឃើញសោះ)
            const printWindow = window.open(
                '', 
                '_blank', 
                'width=100,height=100,left=-1000,top=-1000,toolbar=no,location=no,menubar=no,scrollbars=no,resizable=no'
            );

            if (!printWindow) {
                alert('សូមអនុញ្ញាត Popup ដើម្បីបោះពុម្ពវិក្កយបត្រ');
                return;
            }

            const now = new Date();
            const totalKHR = order.reduce((sum, item) => sum + (item.priceKHR || 0) * item.quantity, 0);

            printWindow.document.write(`
<!DOCTYPE html>
<html lang="km">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>វិក្កយបត្រ #${orderId}</title>
    <style>
        body, html { 
            margin: 0; padding: 0; background: white; 
            font-family: 'Khmer', 'Kantumruy Pro', sans-serif;
        }
        .receipt { 
            width: 80mm; 
            margin: 0 auto; 
            padding: 8mm 4mm; 
            box-sizing: border-box;
        }
        img { 
            width: 65px; height: auto; display: block; margin: 0 auto 8px;
            filter: brightness(0) saturate(100%);
        }
        h3 { text-align: center; font-size: 18px; margin: 8px 0; font-weight: bold; }
        p { text-align: center; font-size: 13px; margin: 4px 0; }
        .divider { border-top: 2px dashed #000; margin: 12px 0; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; margin: 10px 0; }
        th, td { padding: 4px 2px; }
        th:nth-child(2), td:nth-child(2) { text-align: center; }
        th:last-child, td:last-child { text-align: right; }
        .total { font-weight: bold; font-size: 16px; border-top: 2px solid #000; padding-top: 8px; margin-top: 8px; }

        @page { size: 80mm auto; margin: 0 !important; }
        @media print {
            body, html { margin: 0 !important; padding: 0 !100; }
            .receipt { padding: 5mm 3mm !important; }
        }
    </style>
</head>
<body>
    <div class="receipt">
        <img src="${logo}" alt="Logo" onerror="this.style.display='none'">
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
                        <td>${KHR_SYMBOL}${formatKHR(item.priceKHR * item.quantity)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        <div class="divider"></div>
        <div style="text-align:right; font-size:14px;">
            <div>សរុបរង: ${KHR_SYMBOL}${formatKHR(totalKHR)}</div>
            <div class="total">សរុបត្រូវបង់: ${KHR_SYMBOL}${formatKHR(totalKHR)}</div>
        </div>
        <div style="text-align:center; margin-top:20px; font-size:14px;">
            សូមអរគុណ! សូមអញ្ជើញមកម្តងទៀត!
        </div>
    </div>

    <script>
        // លោត Print Dialog ភ្លាមៗ + បិទ Window ដោយស្វ័យប្រវត្តិ
        setTimeout(() => {
            window.print();
            // បិទ window ក្រោយ Print (ឬ Cancel)
            window.onafterprint = () => setTimeout(() => window.close(), 300);
            window.onfocus = () => setTimeout(() => window.close(), 500); // បើគេ Cancel
        }, 300);
    </script>
</body>
</html>
            `);

            printWindow.document.close();
            printWindow.focus();

            console.log('បោះពុម្ពភ្លាមៗ! Print Dialog បានបើកហើយ');
        }
    }, [triggerPrint, order, orderId, shopName]);

    return null;
}

export default ReceiptModal;