// src/components/ReceiptModal.jsx - Direct Print Dialog via Invisible Iframe
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

            // --- START: ផ្នែកដែលបានកែប្រែ ---

            // 1. បង្កើត Iframe មួយ
            const iframe = document.createElement('iframe');
            iframe.id = 'receipt-print-frame'; // ដាក់ ID ងាយស្រួលគ្រប់គ្រង

            // 2. លាក់ Iframe នេះពីការបង្ហាញ (សំខាន់បំផុត)
            iframe.style.position = 'fixed';
            iframe.style.left = '-9999px'; // រុញវាទៅឆ្វេងสุดៗឲ្យបាត់ពីអេក្រង់
            iframe.style.width = '0';
            iframe.style.height = '0';
            iframe.style.border = 'none';

            // 3. បញ្ចូល Iframe ទៅក្នុងទំព័របច្ចុប្បន្ន
            document.body.appendChild(iframe);

            const now = new new Date();
            const totalKHR = order.reduce((sum, item) => sum + (item.priceKHR || 0) * item.quantity, 0);

            // 4. ត្រៀម HTML សម្រាប់វិក្កយបត្រ (កូដ HTML ដូចដើម)
            const receiptHTML = `
            <!DOCTYPE html>
            <html lang="km">
            <head>
                <meta charset="UTF-8">
                <title>វិក្កយបត្រ #${orderId}</title>
                <link href="https://fonts.googleapis.com/css2?family=Kantumruy+Pro:wght@400;500;700&display=swap" rel="stylesheet">
                <style>
                    /* Style ទាំងអស់នៅរក្សាដដែល... */
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { 
                        font-family: 'Kantumruy Pro', sans-serif; 
                        margin: 0;
                        padding: 0;
                        width: 80mm; /* កំណត់ទំហំក្រដាស Print */
                    }
                    .receipt { 
                        width: 100%; 
                        padding: 3mm; 
                    }
                    img { width: 65px; display: block; margin: 0 auto 10px; }
                    h3 { text-align: center; font-size: 16px; margin: 5px 0; font-weight: bold; }
                    p { text-align: center; font-size: 12px; margin: 3px 0; line-height: 1.4; }
                    .divider { border-top: 1px dashed #000; margin: 8px 0; }
                    table { width: 100%; border-collapse: collapse; font-size: 12px; }
                    th, td { padding: 4px 0px; }
                    th:nth-child(2), td:nth-child(2) { text-align: center; }
                    th:last-child, td:last-child { text-align: right; }
                    .total-line { display: flex; justify-content: space-between; font-size: 12px; }
                    .grand-total { font-weight: bold; font-size: 14px; border-top: 1px solid #000; padding-top: 5px; margin-top: 5px; }
                    
                    @page { 
                        size: 80mm auto; 
                        margin: 0; 
                    }
                    @media print {
                        body {
                           -webkit-print-color-adjust: exact;
                           print-color-adjust: exact;
                        }
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
                        <thead><tr><th style="text-align:left;">មុខទំនិញ</th><th>ចំនួន</th><th>តម្លៃ</th></tr></thead>
                        <tbody>
                            ${order.map(item => `
                                <tr>
                                    <td>${item.khmerName}</td>
                                    <td>${item.quantity}</td>
                                    <td>${KHR_SYMBOL}${formatKHR(item.priceKHR * item.quantity)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <div class="divider"></div>
                    <div class="summary">
                         <div class="total-line">
                            <span>សរុបរង:</span>
                            <span>${KHR_SYMBOL}${formatKHR(totalKHR)}</span>
                        </div>
                        <div class="total-line grand-total">
                            <span>សរុបត្រូវបង់:</span>
                            <span>${KHR_SYMBOL}${formatKHR(totalKHR)}</span>
                        </div>
                    </div>
                    <p style="margin-top:15px;">សូមអរគុណ! សូមអញ្ជើញមកម្តងទៀត!</p>
                </div>
            </body>
            </html>`;

            // 5. សរសេរ HTML ចូលទៅក្នុង Iframe
            const doc = iframe.contentDocument || iframe.contentWindow.document;
            doc.open();
            doc.write(receiptHTML);
            doc.close();

            // 6. ហៅ Print Dialog ហើយបន្ទាប់មកលុប Iframe ចោល
            iframe.onload = function() {
                // ធានាថា content បាន load រួចរាល់
                iframe.contentWindow.focus(); // Focus ទៅ iframe
                iframe.contentWindow.print(); // បង្ហាញ Print Dialog
                
                // ពេល Print Dialog បិទ (Print/Cancel), លុប iframe ចេញពីទំព័រ
                setTimeout(() => {
                    document.body.removeChild(iframe);
                }, 100); 
            };
            
            // --- END: ផ្នែកដែលបានកែប្រែ ---

        }
    }, [triggerPrint, order, orderId, shopName]);

    // Component នេះមិន render អ្វីចេញមកទេ ព្រោះវាគ្រាន់តែគ្រប់គ្រងការ print
    return null;
}

export default ReceiptModal;