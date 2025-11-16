// src/components/ReceiptModal.jsx — លឿនបំផុត + បង្ហាឹទាំងអស់ 100% (16 វិច្ឆិកា 2025)
import { useEffect, useRef } from 'react';
import { KHR_SYMBOL, formatKHR } from '../utils/formatters';
import logo from '../assets/logo.png';

const SHOP_STATIC_DETAILS = {
    address: "ផ្ទះលេខ 137, ផ្លូវ 223, កំពង់ចាម",
    tel: "016 438 555 / 061 91 4444"
};

function ReceiptModal({ show, onClose, order, orderId, shopName = "ន កាហ្វេ" }) {
    const printWindowRef = useRef(null);

    useEffect(() => {
        if (!show || !order || order.length === 0) return;

        // បើក Popup ភ្លាមៗ
        printWindowRef.current = window.open('', '_blank', 'width=450,height=800');

        if (!printWindowRef.current) {
            alert('សូមអនុញ្ញាត Pop-up');
            onClose();
            return;
        }

        const win = printWindowRef.current;
        const now = new Date();
        const totalKHR = order.reduce((s, i) => s + i.priceKHR * i.quantity, 0);

        // បង្កើត HTML ពេញលេញ
        const htmlContent = `
<!DOCTYPE html>
<html lang="km">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=80mm">
    <title>វិក្កយបត្រ #${orderId}</title>
    <style>
        body { font-family: 'Kantumruy Pro', sans-serif; margin:0; padding:8px 4px; width:80mm; background:white; font-size:9.5pt; line-height:1.4; }
        .receipt { width:100%; }
        .logo img { width:58px; height:auto; display:block; margin:0 auto 6px; filter: grayscale(100%) brightness(0); }
        .header { text-align:center; margin-bottom:8px; }
        .header h3 { font-size:13pt; margin:4px 0; font-weight:bold; }
        .header p { font-size:8.5pt; margin:2px 0; color:#444; }
        .divider { border-top:1px dashed #000; margin:8px 0; }
        table { width:100%; border-collapse:collapse; margin:8px 0; font-size:9pt; }
        th { background:#f0f0f0; padding:4px 2px; font-weight:bold; font-size:8.5pt; }
        td { padding:3px 2px; border-bottom:1px dotted #999; }
        td:nth-child(2) { text-align:center; }
        td:last-child { text-align:right; }
        .total { font-size:12.5pt !important; font-weight:bold; border-top:2px solid #000; padding-top:8px; margin-top:8px; }
        .footer { text-align:center; margin-top:12px; font-weight:bold; font-size:9.5pt; }

        @media print {
            @page { size: 80mm auto; margin:0; }
            body { padding:4px !important; font-size:9pt !important; }
            table { font-size:8.5pt !important; }
        }
    </style>
</head>
<body>
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
                        <td>${KHR_SYMBOL}${formatKHR(item.priceKHR * item.quantity)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        <div class="divider"></div>
        <div style="display:flex; justify-content:space-between; font-size:10pt;">
            <span>សរុបរង:</span>
            <span>${KHR_SYMBOL}${formatKHR(totalKHR)}</span>
        </div>
        <div class="total" style="display:flex; justify-content:space-between;">
            <span>សរុបត្រូវបង់:</span>
            <span>${KHR_SYMBOL}${formatKHR(totalKHR)}</span>
        </div>

        <div class="footer">សូមអរគុណ! សូមអញ្ជើញមកម្តងទៀត</div>
    </div>

    <script>
        // ធានាថា Print ដំណើរការលឿនបំផុត និងត្រឹមត្រូវ 100%
        window.onload = function() {
            setTimeout(() => {
                window.print();
                // បិទបន្ទាប់ពី Print រួច
                setTimeout(() => window.close(), 500);
            }, 300);
        };
    </script>
</body>
</html>`;

        win.document.write(htmlContent);
        win.document.close();

        // បិទ Modal នៅ App ដើម
        const closeAll = () => {
            onClose();
            if (win && !win.closed) win.close();
        };
        win.addEventListener('afterprint', closeAll);
        setTimeout(closeAll, 5000); // safety

    }, [show, order, orderId, shopName, onClose]);

    return null;
}

export default ReceiptModal;