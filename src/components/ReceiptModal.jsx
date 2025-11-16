// src/components/ReceiptModal.jsx
import { useEffect } from 'react';
import { KHR_SYMBOL, formatKHR } from '../utils/formatters';
import qrcode from '../assets/qrcode.jpg';
import logo from '../assets/logo.png';

const SHOP_STATIC_DETAILS = {
    address: "ផ្ទះលេខ 137, ផ្លូវ 223, កំពង់ចាម",
    tel: "016 438 555 / 061 91 4444"
};

function ReceiptModal({ show, onClose, order, orderId, shopName = "ន កាហ្វេ" }) {
    useEffect(() => {
        if (!show || !order || order.length === 0) return;

        const receiptWindow = window.open('', '_blank', 'width=420,height=720,scrollbars=no,resizable=no');
        if (!receiptWindow) {
            alert('សូមអនុញ្ញាត Pop-up ដើម្បីបោះពុម្ភវិក្កយបត្រ');
            onClose();
            return;
        }

        const now = new Date();
        const totalKHR = order.reduce((sum, item) => sum + (item.priceKHR || 0) * item.quantity, 0);

        receiptWindow.document.write(`
<!DOCTYPE html>
<html lang="km">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=80mm, initial-scale=1.0">
    <title>វិក្កយបត្រ #${orderId}</title>
    <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family: 'Kantumruy Pro', sans-serif; padding:10px; display:flex; justify-content:center; background:#fff; }
        .receipt { width:80mm; background:white; padding:10px 6px; font-size:9.5pt; line-height:1.4; }
        .logo img { width:60px; height:auto; display:block; margin:0 auto 8px; filter: grayscale(100%) brightness(0); }
        .header { text-align:center; margin-bottom:8px; }
        .header h3 { font-size:13pt; margin:5px 0; font-weight:bold; }
        .header p { font-size:8.5pt; margin:2px 0; color:#444; }
        .divider { border-top:1px dashed #000; margin:6px 0; }
        table { width:100%; border-collapse:collapse; margin:6px 0; font-size:9pt; }
        th { background:#eee; padding:4px 2px; font-weight:bold; font-size:8.5pt; }
        td { padding:3px 2px; border-bottom:1px dotted #999; }
        td:nth-child(2) { text-align:center; }
        td:last-child { text-align:right; }
        .summary { margin:8px 0; font-size:10pt; }
        .total { font-size:12.5pt !important; font-weight:bold; border-top:2px solid #000; padding-top:6px; margin-top:8px; }
        .qr { text-align:center; margin:12px 0; }
        .qr img { width:40mm; height:40mm; padding:3px; border:1px solid #000; background:white; }
        .footer { text-align:center; margin-top:12px; font-weight:bold; font-size:9.5pt; }

        @media print {
            @page { size: 80mm auto; margin: 0; }
            body, .receipt { padding:5px !important; font-size:8.8pt !important; }
            table { font-size:8.5pt !important; }
            .total { font-size:11.5pt !important; }
        }
    </style>
</head>
<body onload="setTimeout(() => window.print(), 800)">
    <div class="receipt">
        <div class="logo"><img src="${logo}" onerror="this.style.display='none'"></div>
        <div class="header">
            <h3>${shopName}</h3>
            <p>${SHOP_STATIC_DETAILS.address}</p>
            <p>ទូរស័ព្ទ: ${SHOP_STATIC_DETAILS.tel}</p>
            <p>${now.toLocaleDateString('km-KH')} ${now.toLocaleTimeString('km-KH', {hour:'2-digit', minute:'2-digit'})}</p>
            <p>វិក្កយបត្រ: ${orderId}</p>
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
        <div class="summary">
            <div style="display:flex; justify-content:space-between;">
                <span>សរុបរង:</span>
                <span>${KHR_SYMBOL}${formatKHR(totalKHR)}</span>
            </div>
            <div class="total" style="display:flex; justify-content:space-between;">
                <span>សរុបត្រូវបង់:</span>
                <span>${KHR_SYMBOL}${formatKHR(totalKHR)}</span>
            </div>
        </div>

        <div class="qr">
            <img src="${qrcode}" alt="QR Code" onerror="this.style.display='none'">
        </div>
        <div class="footer">សូមអរគុណ! សូមអញ្ជើញមកម្តងទៀត</div>
    </div>
</body>
</html>
        `);

        receiptWindow.document.close();

        // បិទ modal បន្ទាប់ពីបោះពុម្ភរួច
        const closeAfterPrint = () => {
            onClose();
            receiptWindow.close();
        };
        receiptWindow.onafterprint = closeAfterPrint;
        setTimeout(closeAfterPrint, 3000); // សុវត្ថិភាពបន្ថែម

    }, [show, order, orderId, shopName, onClose]);

    return null; // មិនបង្ហាញ Modal លើអេក្រង់
}

export default ReceiptModal;