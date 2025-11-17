// src/components/ReceiptModal.jsx - Print Dialog ដូច Windows នៅ Mobile
import { useEffect, useRef } from 'react';
import { KHR_SYMBOL, formatKHR } from '../utils/formatters';
import logo from '../assets/logo.png';

const SHOP_STATIC_DETAILS = {
    address: "ផ្ទះលេខ 137, ផ្លូវ 223, កំពង់ចាម",
    tel: "016 438 555 / 061 91 4444"
};

function ReceiptModal({ order, orderId, shopName = "ន កាហ្វេ", triggerPrint }) {
    const iframeRef = useRef(null);

    useEffect(() => {
        if (triggerPrint > 0 && order && order.length > 0) {
            // បង្កើត iframe លាក់
            if (!iframeRef.current) {
                const iframe = document.createElement('iframe');
                iframe.style.position = 'fixed';
                iframe.style.right = '0';
                iframe.style.bottom = '0';
                iframe.style.width = '0';
                iframe.style.height = '0';
                iframe.style.border = 'none';
                iframe.style.visibility = 'hidden';
                document.body.appendChild(iframe);
                iframeRef.current = iframe;
            }

            const iframe = iframeRef.current;
            const doc = iframe.contentDocument || iframe.contentWindow.document;

            const now = new Date();
            const totalKHR = order.reduce((sum, item) => sum + (item.priceKHR || 0) * item.quantity, 0);

            const receiptHTML = `
<!DOCTYPE html>
<html lang="km">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>វិក្កយបត្រ #${orderId}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body, html { background: white; font-family: 'Kantumruy Pro', sans-serif; }
        .receipt { width: 80mm; margin: 0 auto; padding: 8mm 4mm; }
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
            body { margin: 0 !important; padding: 5mm 3mm !important; }
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
        <div style="text-align:center; margin-top:20px;">សូមអរគុណ! សូមអញ្ជើញមកម្តងទៀត!</div>
    </div>

    <script>
        // បើក Print Dialog ភ្លាមៗ + បិទ iframe ក្រោយ Print
        setTimeout(() => {
            window.print();
            window.parent.postMessage('print-complete', '*');
        }, 300);
    </script>
</body>
</html>`;

            doc.open();
            doc.write(receiptHTML);
            doc.close();

            // បើក Print Dialog ភ្លាមៗ
            const win = iframe.contentWindow;
            win.focus();
            setTimeout(() => {
                win.print();
            }, 500);

            // បិទ iframe ក្រោយ Print (ឬ Cancel)
            const handlePrintComplete = () => {
                setTimeout(() => {
                    if (iframeRef.current && iframeRef.current.parentNode) {
                        document.body.removeChild(iframeRef.current);
                        iframeRef.current = null;
                    }
                }, 500);
            };

            // ស្តាប់ពី iframe
            const listener = (event) => {
                if (event.data === 'print-complete') {
                    handlePrintComplete();
                    window.removeEventListener('message', listener);
                }
            };
            window.addEventListener('message', listener);

            // បើ Cancel Print → បិទដដែល
            win.onafterprint = handlePrintComplete;
        }
    }, [triggerPrint, order, orderId, shopName]);

    return null;
}

export default ReceiptModal;