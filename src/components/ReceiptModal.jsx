// src/components/ReceiptModal.jsx
import { useEffect } from 'react';
import { KHR_SYMBOL, formatKHR } from '../utils/formatters';
import logo from '../assets/logo.png';

const SHOP_STATIC_DETAILS = {
    address: "ផ្ទះលេខ 137, ផ្លូវ 223, កំពង់ចាម",
    tel: "016 438 555 / 061 91 4444"
};

function ReceiptModal({ order, orderId, shopName = "ន កាហ្វេ", triggerPrint }) {

    useEffect(() => {
        // Trigger ពេល triggerPrint > 0 និងមាន order
        if (triggerPrint > 0 && order && order.length > 0) {
            // រង់ចាំ DOM render រួច ទើប print
            const timer = setTimeout(() => {
                window.print();
            }, 300);
            
            return () => clearTimeout(timer);
        }
    }, [triggerPrint, order]);

    if (!order || order.length === 0) return null;

    const now = new Date();
    const totalKHR = order.reduce((sum, item) => sum + (item.priceKHR || 0) * item.quantity, 0);

    return (
        <div className="receipt-hidden-container">
            <div className="receipt-print-only">
                <div className="receipt-logo-top">
                    <img 
                        src={logo} 
                        alt="Logo" 
                        className="receipt-logo" 
                        onError={(e) => e.target.style.display = 'none'} 
                    />
                </div>
                
                <div className="receipt-header">
                    <h3>{shopName}</h3>
                    <p>{SHOP_STATIC_DETAILS.address}</p>
                    <p>ទូរស័ព្ទ: {SHOP_STATIC_DETAILS.tel}</p>
                    <p>
                        {now.toLocaleDateString('km-KH')} {' '}
                        {now.toLocaleTimeString('km-KH', {hour:'2-digit', minute:'2-digit'})}
                    </p>
                    <p><strong>វិក្កយបត្រ: {orderId}</strong></p>
                </div>

                <div className="receipt-divider"></div>

                <table className="receipt-items-table">
                    <thead>
                        <tr>
                            <th>មុខទំនិញ</th>
                            <th>ចំនួន</th>
                            <th>តម្លៃ ({KHR_SYMBOL})</th>
                        </tr>
                    </thead>
                    <tbody>
                        {order.map((item, index) => (
                            <tr key={index}>
                                <td>
                                    {item.khmerName}
                                    {item.englishName && ` (${item.englishName})`}
                                </td>
                                <td>{item.quantity}</td>
                                <td>{KHR_SYMBOL}{formatKHR(item.priceKHR * item.quantity)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="receipt-divider"></div>

                <div className="receipt-summary">
                    <div className="receipt-summary-line">
                        <span>សរុបរង:</span>
                        <span>{KHR_SYMBOL}{formatKHR(totalKHR)}</span>
                    </div>
                    <div className="receipt-divider"></div>
                    <div className="receipt-summary-line total">
                        <span>សរុបត្រូវបង់:</span>
                        <span>{KHR_SYMBOL}{formatKHR(totalKHR)}</span>
                    </div>
                </div>

                <div className="receipt-footer">
                    <p>សូមអរគុណ! សូមអញ្ជើញមកម្តងទៀត!</p>
                </div>
            </div>
        </div>
    );
}

export default ReceiptModal;