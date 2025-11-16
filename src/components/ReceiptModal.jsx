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

        const receiptWindow = window.open(
            '',
            '_blank',
            'width=420,height=720,scrollbars=no,resizable=no'
        );

        if (!receiptWindow) {
            alert('សូមអនុញ្ញាត Pop-up');
            onClose();
            return;
        }

        const now = new Date();
        const subtotalKHR = order.reduce((sum, item) => sum + (item.priceKHR || item.priceUSD || 0) * item.quantity, 0);
        const totalKHR = subtotalKHR;

        const safeShopNameForQR = shopName.replace(/\s+/g, '_');
        const qrData = `ORDER_ID:${orderId};TOTAL_KHR:${formatKHR(totalKHR)};SHOP_NAME:${safeShopNameForQR}`;
        const qrCodeUrl = qrcode + `?data=${encodeURIComponent(qrData)}`;

        receiptWindow.document.write(`
<!DOCTYPE html>
<html lang="km">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=80mm, initial-scale=1.0">
    <title>វិក្កយបត្រ #${orderId}</title>
    <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body {
            font-family: 'Kantumruy Pro', sans-serif;
            background:#f8f8f8;
            padding:10px;
            display:flex;
            justify-content:center;
        }
        .receipt {
            width:80mm;
            background:white;
            padding:10px 6px;
            border-radius:8px;
            box-shadow:0 4px 15px rgba(0,0,0,0.2);
            font-size:9.5pt;
            line-height:1.4;
        }
        .logo img { 
                    width:60px; 
                    height:auto; 
                    display:block; 
                    margin:0 auto 8px; 
                    filter: grayscale(100%) brightness(0) contrast(1000%);
                    -webkit-filter: grayscale(100%) brightness(0) contrast(1000%);
                }
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
        .total {
            font-size:12.5pt !important;
            font-weight:bold;
            border-top:2px solid #000;
            padding-top:6px;
            margin-top:8px;
        }
        .qr { text-align:center; margin:10px 0; }
        .qr img { width:40mm; height:40mm; padding:3px; border:1px solid #000; background:white; }
        .footer { text-align:center; margin-top:10px; font-weight:bold; font-size:9.5pt; }

        /* សំខាន់បំផុត: បង្ខំឲ្យ Print ចេញតែ 1 Page គត់ */
        @media print {
            @page {
                size: 80mm auto;   /* ក្រដាស 80mm */
                margin: 0;
            }
            html, body {
                height: auto !important;
                overflow: visible !important;
            }
            .receipt {
                page-break-after: avoid;
                page-break-before: avoid;
                page-break-inside: avoid;
                height: auto;
                min-height: auto;
                padding: 8px 5px;
                border: none;
                box-shadow: none;
            }
            /* បង្ខំឲ្យ table មិន break ទំព័រ */
            table, tr, td, th { page-break-inside: avoid; }
            /* បើ order វែងខ្លាំង → បង្រួញអក្សរបន្តិចដើម្បី fit 1 page */
            .receipt { font-size: 8.5pt !important; line-height: 1.3 !important; }
            table { font-size: 8pt !important; }
            .total { font-size: 11pt !important; }
        }
    </style>
</head>
<body onload="setTimeout(() => window.print(), 600)">
    <div class="receipt">
        <div class="logo"><img src="${logo}" onerror="this.style.display='none'"></div>
        <div class="header">
            <h3>${shopName}</h3>
            <p>${SHOP_STATIC_DETAILS.address}</p>
            <p>ទូរស័ព្ទ: ${SHOP_STATIC_DETAILS.tel}</p>
            <p>${now.toLocaleDateString('km-KH')} ${now.toLocaleTimeString('km-KH', {hour:'2-digit',minute:'2-digit'})}</p>
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
                        <td>${KHR_SYMBOL}${formatKHR((item.priceKHR || item.priceUSD) * item.quantity)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        <div class="divider"></div>
        <div class="summary">
            <div style="display:flex;justify-content:space-between">
                <span>សរុបរង:</span>
                <span>${KHR_SYMBOL}${formatKHR(subtotalKHR)}</span>
            </div>
            <div class="total" style="display:flex;justify-content:space-between">
                <span>សរុបត្រូវបង់:</span>
                <span>${KHR_SYMBOL}${formatKHR(totalKHR)}</span>
            </div>
        </div>

        <div class="qr"><img src="${qrCodeUrl}" onerror="this.style.display='none'"></div>
        <div class="footer">សូមអរគុណ! សូមអញ្ជើញមកម្តងទៀត!</div>
    </div>
</body>
</html>
        `);

        receiptWindow.document.close();
        setTimeout(() => {
        onClose(); // បិទ modal ដោយស្វ័យប្រវត្តិបន្ទាប់ពី Print
                        }, 1500);

    }, [show, order, orderId, shopName, onClose]);

    return null;
}

export default ReceiptModal;