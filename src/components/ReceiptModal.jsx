import React, { useState, useEffect } from "react";
import { KHR_SYMBOL, formatKHR } from "../utils/formatters";
import { generateRawBTUrl } from "../utils/printerRawBT"; // នាំចូល Utility ថ្មី

function ReceiptModal({ show, onClose, order, orderId, shopName }) {
  const [rawBTLink, setRawBTLink] = useState('');

  // ជំនួស jsPDF ដោយការបង្កើត RawBT URL
  useEffect(() => {
    if (!show || order.length === 0) return;

    try {
        // បង្កើត URL រាល់ពេលដែល modal បើក
        const url = generateRawBTUrl(order, orderId, shopName);
        setRawBTLink(url);
    } catch (e) {
        console.error("Error generating RawBT URL:", e);
        setRawBTLink(null);
    }
    
  }, [show, order, shopName, orderId]);

  if (!show) return null;

  // យើងលែងត្រូវការ Preview ជា PDF ទៀតហើយ ព្រោះការបោះពុម្ព Raw Text មិនបង្ហាញ Preview ទេ
  return (
    <div className="modal show" id="receiptModal">
      <div className="modal-content">
        <span className="close-button" onClick={onClose}>×</span>

        <div style={{ padding: '20px', textAlign: 'center' }}>
            <h3>ត្រៀមខ្លួនសម្រាប់បោះពុម្ព (RawBT)</h3>
            <p>សូមប្រាកដថា Bluetooth ត្រូវបានបើក ហើយម៉ាស៊ីនបោះពុម្ពត្រូវបានភ្ជាប់ទៅ RawBT App</p>
        </div>

        <div className="print-button-container" style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "15px" }}>
          <button className="btn-close-receipt" onClick={onClose}>បោះបង់</button>
          
          {rawBTLink ? (
            // ប្រើ Link Tag ដើម្បី Redirect ទៅ RawBT App
            <a 
              href={rawBTLink} 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={() => {
                  // អាចបន្ថែម logic សម្រាប់ការបិទ modal ភ្លាមៗ
                  setTimeout(onClose, 500); 
              }}
            >
              <button className="btn-print" style={{ backgroundColor: '#28a745', color: 'white' }}>
                🖨️ បោះពុម្ពតាម RawBT
              </button>
            </a>
          ) : (
            <p>កំពុងបង្កើតតំណរ... (ពិនិត្យ Error ក្នុង Console)</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReceiptModal;