
// =====================================================
// 2. ReceiptModal.jsx (កែសម្រួល - លុប onConfirmed)
// =====================================================
// src/components/ReceiptModal.jsx
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

        // បើក Popup ថ្មី
        printWindowRef.current = window.open('', '_blank', 'width=460,height=800,scrollbars=yes,resizable=yes');

        if (!printWindowRef.current) {
            alert('សូមអនុញ្ញាត Pop-up ដើម្បីបង្ហាញវិក្កយបត្រ');
            onClose();
            return;
        }

        const win = printWindowRef.current;
        const now = new Date();
        const totalKHR = order.reduce((sum, item) => sum + (item.priceKHR || 0) * item.quantity, 0);

        win.document.write(`
<!DOCTYPE html>
<html lang="km">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>វិក្កយបត្រ #${orderId}</title>
    <style>
        body {
            font-family: 'Kantumruy Pro', sans-serif;
            background: #f9f9f9;
            padding: 20px;
            display: flex;
            justify-content: center;
        }
        .receipt {
            width: 80mm;
            background: white;
            padding: 15px 10px;
            border-radius: 10px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
            font-size: 10pt;
            line-height: 1.5;
        }
        .logo img {
            width: 65px;
            height: auto;
            display: block;
            margin: 0 auto 10px;
            filter: grayscale(100%) brightness(0);
        }
        .header { text-align: center; margin-bottom: 12px; }
        .header h3 { font-size: 15pt; margin: 6px 0; font-weight: bold; }
        .header p { font-size: 9pt; margin: 3px 0; color: #444; }
        .divider { border-top: 2px dashed #333; margin: 10px 0; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 9.5pt; }
        th { background: #f0f0f0; padding: 6px 4px; font-weight: bold; font-size: 9pt; }
        td { padding: 5px 4px; border-bottom: 1px dotted #999; }
        td:nth-child(2) { text-align: center; }
        td:last-child { text-align: right; }
        .total {
            font-size: 13pt !important;
            font-weight: bold;
            border-top: 3px double #000;
            padding-top: 10px;
            margin-top: 10px;
        }
        .footer { text-align: center; margin-top: 15px; font-weight: bold; font-size: 10pt; }
        .print-btn {
            display: block;
            width: 80%;
            margin: 20px auto 10px;
            padding: 12px;
            background: #A0522D;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 12pt;
            font-weight: bold;
            cursor: pointer;
            font-family: 'Kantumruy Pro', sans-serif;
        }
        .close-btn {
            display: block;
            width: 80%;
            margin: 10px auto;
            padding: 10px;
            background: #999;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-family: 'Kantumruy Pro', sans-serif;
        }

        @media print {
            @page { size: 80mm auto; margin: 0; }
            body { padding: 5px !important; background: white !important; }
            .print-btn, .close-btn { display: none !important; }
            .receipt { box-shadow: none; border-radius: 0; }
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
        <div style="display:flex; justify-content:space-between; font-size:11pt;">
            <span>សរុបរង:</span>
            <span>${KHR_SYMBOL}${formatKHR(totalKHR)}</span>
        </div>
        <div class="total" style="display:flex; justify-content:space-between;">
            <span>សរុបត្រូវបង់:</span>
            <span>${KHR_SYMBOL}${formatKHR(totalKHR)}</span>
        </div>

        <div class="footer">សូមអរគុណ! សូមអញ្ជើញមកម្តងទៀត</div>

        <button class="print-btn" onclick="window.print()">បោះពុម្ភវិក្កយបត្រ</button>
        <button class="close-btn" onclick="window.close()">បិទ</button>
    </div>
</body>
</html>
        `);

        win.document.close();
        win.focus();

        // Cleanup នៅពេលបិទ modal
        return () => {
            if (printWindowRef.current && !printWindowRef.current.closed) {
                printWindowRef.current.close();
            }
        };

    }, [show, order, orderId, shopName, onClose]);

    return null;
}

export default ReceiptModal;