// src/components/ReceiptModal.jsx - កែប្រែឲ្យដំណើរល្អលើ Mobile 100%
import { useEffect, useRef } from 'react';
import { KHR_SYMBOL, formatKHR } from '../utils/formatters';
import logo from '../assets/logo.png';

const SHOP_STATIC_DETAILS = {
    address: "ផ្ទះលេខ 137, ផ្លូវ 223, កំពង់ចាម",
    tel: "016 438 555 / 061 91 4444"
};

function ReceiptModal({ order, orderId, shopName = "ន កាហ្វេ", triggerPrint, onClose }) {
    const iframeRef = useRef(null);

    useEffect(() => {
        if (triggerPrint > 0 && order && order.length > 0) {
            const now = new Date();
            const totalKHR = order.reduce((sum, item) => sum + (item.priceKHR || 0) * item.quantity, 0);

            const receiptHTML = `
<!DOCTYPE html>
<html lang="km">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>វិក្កយបត្រ #${orderId}</title>
    <link href="https://fonts.googleapis.com/css2?family=Kantumruy+Pro:wght@300;400;500;700&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Kantumruy Pro', sans-serif;
            padding: 5mm 3mm;
            background: white;
            width: 80mm;
            margin: 0 auto;
        }
        .receipt { max-width: 80mm; margin: 0 auto; background: white; }
        img { width: 70px; height: auto; display: block; margin: 0 auto 10px; }
        h3 { text-align: center; font-size: 18pt; margin: 8px 0; }
        p { text-align: center; font-size: 12pt; margin: 4px 0; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 12pt; }
        th, td { padding: 4px 2px; border-bottom: 1px dotted #000; }
        th:nth-child(2), td:nth-child(2) { text-align: center; }
        th:last-child, td:last-child { text-align: right; }
        .total { font-weight: bold; font-size: 14pt; border-top: 2px solid #000; padding-top: 8px; margin-top: 8px; }
        .divider { border-top: 2px dashed #000; margin: 10px 0; }
        .footer { text-align: center; margin-top: 15px; font-size: 12pt; }

        @media print {
            @page { size: 80mm 1000mm; margin: 0; } /* សំខាន់បំផុត */
            body { padding: 3mm; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
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
        <p><strong>វិក្កយបត្រ: ${orderId}</strong></p>
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
        <div style="text-align:right; font-size:13pt;">
            <div>សរុបរង: ${KHR_SYMBOL}${formatKHR(totalKHR)}</div>
            <div class="total">សរុបត្រូវបង់: ${KHR_SYMBOL}${formatKHR(totalKHR)}</div>
        </div>
        <div class="footer">សូមអរគុណ! សូមអញ្ជើញមកម្តងទៀត!</div>
    </div>

    <script>
        // Auto print ភ្លាមៗនៅលើ mobile (អាចបិទបើមិនចង់)
        setTimeout(() => window.print(), 600);
        
        // បិទ tab ដោយស្វ័យប្រវត្តិក្រោយ Print (សម្រាប់ mobile)
        window.onafterprint = () => setTimeout(() => window.close(), 500);
    </script>
</body>
</html>`;

            // បង្កើត iframe លាក់
            if (!iframeRef.current) {
                const iframe = document.createElement('iframe');
                iframe.style.position = 'fixed';
                iframe.style.right = '0';
                iframe.style.bottom = '0';
                iframe.style.width = '0';
                iframe.style.height = '0';
                iframe.style.border = 'none';
                document.body.appendChild(iframe);
                iframeRef.current = iframe;
            }

            const doc = iframeRef.current.contentDocument || iframeRef.current.contentWindow.document;
            doc.open();
            doc.write(receiptHTML);
            doc.close();

            // Focus ទៅ iframe ដើម្បីឲ្យ print dialog លេចឡើង (សំខាន់ណាស់នៅ mobile)
            iframeRef.current.contentWindow.focus();

            // Auto print ភ្លាមៗ (ដំណើរការល្អបំផុតនៅ mobile)
            setTimeout(() => {
                iframeRef.current.contentWindow.print();
            }, 800);

            // បិទ iframe ក្រោយ Print
            iframeRef.current.contentWindow.onafterprint = () => {
                setTimeout(() => {
                    if (iframeRef.current) {
                        document.body.removeChild(iframeRef.current);
                        iframeRef.current = null;
                    }
                    onClose?.();
                }, 500);
            };
        }
    }, [triggerPrint, order, orderId, shopName]);

    return null;
}

export default ReceiptModal;