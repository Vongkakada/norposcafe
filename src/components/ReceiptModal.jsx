// src/components/ReceiptModal.jsx
import { useEffect } from 'react';
import { KHR_SYMBOL, formatKHR } from '../utils/formatters';
import logo from '../assets/logo.png';

const SHOP_STATIC_DETAILS = {
    address: "ផ្ទះលេខ 137, ផ្លូវ 223, កំពង់ចាម",
    tel: "016 438 555 / 061 91 4444"
};

function ReceiptModal({ show, onClose, order, orderId, shopName = "ន កាហ្វេ" }) {
    useEffect(() => {
        if (!show || !order || order.length === 0) return;

        const printWindow = window.open('', '_blank', 'width=460,height=800');

        if (!printWindow) {
            alert('សូមអនុញ្ញាត Pop-up ដើម្បីបោះពុម្ភវិក្កយបត្រ');
            onClose();
            return;
        }

        const now = new Date();
        const totalKHR = order.reduce((sum, item) => sum + (item.priceKHR || 0) * item.quantity, 0);

        printWindow.document.write(`
<!DOCTYPE html>
<html lang="km">
<head>
    <meta charset="UTF-8">
    <title>វិក្កយបត្រ #${orderId}</title>
    <style>
        body { font-family: 'Kantumruy Pro', sans-serif; margin:0; padding:10px 6px; width:80mm; background:white; font-size:9.8pt; line-height:1.45; }
        .receipt { width:100%; }
        .logo img { width:62px; height:auto; display:block; margin:0 auto 8px; filter: grayscale(100%) brightness(0); }
        .header { text-align:center; margin-bottom:10px; }
        .header h3 { font-size:14pt; margin:6px 0; font-weight:bold; }
        .header p { font-size:8.8pt; margin:2px 0; color:#444; }
        .divider { border-top:1px dashed #000; margin:10px 0; }
        table { width:100%; border-collapse:collapse; margin:8px 0; font-size:9.3pt; }
        th { background:#f5f5f5; padding:5px 3px; font-weight:bold; font-size:8.8pt; }
        td { padding:4px 3px; border-bottom:1px dotted #aaa; }
        td:nth-child(2) { text-align:center; }
        td:last-child { text-align:right; }
        .total { font-size:13.5pt !important; font-weight:bold; border-top:2px solid #000; padding-top:10px; margin-top:10px; }
        .footer { text-align:center; margin-top:16px; font-weight:bold; font-size:10.2pt; }

        @media print {
            @page { size: 80mm auto; margin:0; }
            body { padding:6px !important; font-size:9.5pt !important; }
            table { font-size:9pt !important; }
            .total { font-size:12.5pt !important; }
        }
    </style>
</head>
<body onload="window.print(); setTimeout(() => window.close(), 1000)">
    <div class="receipt">
        <div class="logo"><img src="${logo}" onerror="this.style.display='none'"></div>
        <div class="header">
            <h3>${shopName}</h3>
            <p>${SHOP_STATIC_DETAILS.address}</p>
            <p>ទូរស័ព្ទ: ${SHOP_STATIC_DETAILS.tel}</p>
            <p>${now.toLocaleDateString('km-KH')} ${now.toLocaleTimeString('km-KH', {hour:'2-digit', minute:'2-digit'})}</p>
            <p><strong>វិក្កយបត្រ: ${orderId}</strong></p>
        </div>
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
        <div style="display:flex; justify-content:space-between; font-size:11.5pt;">
            <span>សរុបរង:</span>
            <span>${KHR_SYMBOL}${formatKHR(totalKHR)}</span>
        </div>
        <div class="total" style="display:flex; justify-content:space-between;">
            <span>សរុបត្រូវបង់:</span>
            <span>${KHR_SYMBOL}${formatKHR(totalKHR)}</span>
        </div>

        <div class="footer">សូមអរគុណ! សូមអញ្ជើញមកម្តងទៀត</div>
    </div>
</body>
</html>
        `);

        printWindow.document.close();
        printWindow.focus();

        // បិទដោយស្វ័យប្រវត្តិ និង reset modal
        const timer = setTimeout(() => {
            if (!printWindow.closed) printWindow.close();
            onClose();
        }, 4000);

        return () => clearTimeout(timer);

    }, [show, order, orderId, shopName, onClose]);

    return null;
}

export default ReceiptModal;