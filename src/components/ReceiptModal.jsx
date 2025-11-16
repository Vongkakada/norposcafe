// src/components/ReceiptModal.jsx
import { useEffect } from 'react';
import { KHR_SYMBOL, formatKHR } from '../utils/formatters';
import qrcode from '../assets/qrcode.jpg';
import logo from '../assets/logo.png'; // រក្សា logo ដើម (អាចជា logo ពណ៌)

const SHOP_STATIC_DETAILS = {
    address: "ផ្ទះលេខ 137 , ផ្លូវ 223, កំពង់ចាម",
    tel: "016 438 555 / 061 91 4444"
};

function ReceiptModal({ show, onClose, order, orderId, shopName }) {
    useEffect(() => {
        if (!show) return;

        const now = new Date();
        const subtotalKHR = order.reduce((sum, item) => sum + (item.priceKHR || item.priceUSD || 0) * item.quantity, 0);
        const totalKHR = subtotalKHR;

        const safeShopNameForQR = shopName.replace(/\s+/g, '_');
        const qrData = `ORDER_ID:${orderId};TOTAL_KHR:${formatKHR(totalKHR)};SHOP_NAME:${safeShopNameForQR}`;
        const qrCodeUrl = qrcode + `?data=${encodeURIComponent(qrData)}`;

        // បង្កើត invisible iframe ដើម្បី print ដោយមិនបង្ហាញ Tab
        const printFrame = document.createElement('iframe');
        printFrame.style.position = 'fixed';
        printFrame.style.right = '0';
        printFrame.style.bottom = '0';
        printFrame.style.width = '0px';
        printFrame.style.height = '0px';
        printFrame.style.border = 'none';
        printFrame.style.visibility = 'hidden';
        document.body.appendChild(printFrame);

        printFrame.onload = () => {
            setTimeout(() => {
                printFrame.contentWindow.focus();
                printFrame.contentWindow.print();
            }, 500);
        };

        printFrame.srcdoc = `
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
            width:80mm;
            padding:10px 6px;
            font-size:9.5pt;
            line-height:1.4;
            background:white;
        }
        .logo { text-align:center; margin-bottom:10px; }
        .logo img {
            width:50px;
            height:auto;
            filter: brightness(0) invert(0); /* បង្ខំឲ្យ Logo ខ្មៅ 100% (Black Overlay) */
            -webkit-filter: brightness(0) invert(0);
        }
        .header { text-align:center; margin-bottom:8px; }
        .header h3 { font-size:13pt; margin:5px 0; font-weight:bold; }
        .header p { font-size:8.5pt; margin:2px 0; color:#333; }
        .divider { border-top:1px dashed #000; margin:6px 0; }
        table { width:100%; border-collapse:collapse; margin:6px 0; font-size:9pt; }
        th { background:#f0f0f0; padding:4px 2px; font-weight:bold; font-size:8.5pt; }
        td { padding:3px 2px; border-bottom:1px dotted #999; }
        td:nth-child(2) { text-align:center; }
        td:last-child { text-align:right; }
        .total {
            font-size:12.5pt !important;
            font-weight:bold;
            border-top:2px solid #000;
            padding-top:6px;
            margin-top:8px;
        }
        .qr { text-align:center; margin:10px 0; }
        .qr img { width:50mm; height:50mm; padding:3px; border:1px solid #000; background:white; }
        .footer { text-align:center; margin-top:10px; font-weight:bold; }

        @page { size: 80mm auto; margin:0; }
        @media print {
            body, html { background:white; margin:0; padding:0; }
        }
    </style>
</head>
<body>
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
        <thead><tr><th>មុខទំនិញ</th><th »ចំ.</th><th »តម្លៃ</th></tr></thead>
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
    <div style="display:flex;justify-content:space-between;margin:6px 0">
        <span>សរុបរង:</span>
        <span>${KHR_SYMBOL}${formatKHR(subtotalKHR)}</span>
    </div>
    <div class="total" style="display:flex;justify-content:space-between">
        <span>សរុបត្រូវបង់:</span>
        <span>${KHR_SYMBOL}${formatKHR(totalKHR)}</span>
    </div>

    <div class="qr"><img src="${qrCodeUrl}" onerror="this.style.display='none'"></div>
    <div class="footer">សូមអរគុណ! សូមអញ្ជើញមកម្តងទៀត!</div>
</body>
</html>`;

        // បិទ modal និង clear iframe ក្រោយ print រួច (ប្រហែល 3 វិនាទី)
        const timer = setTimeout(() => {
            if (printFrame.parentNode) {
                printFrame.parentNode.removeChild(printFrame);
            }
            onClose();
        }, 3000);

        return () => {
            clearTimeout(timer);
            if (printFrame.parentNode) {
                printFrame.parentNode.removeChild(printFrame);
            }
        };

    }, [show, order, orderId, shopName, onClose]);

    return null;
}

export default ReceiptModal;