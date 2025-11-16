// src/components/ReceiptModal.jsx

import React, { useState, useEffect } from "react";
// លុប KHR_SYMBOL និង formatKHR ដែលមិនបានប្រើ
import { generateRawBTUrl } from "../utils/printerRawBT"; 

function ReceiptModal({ show, onClose, order, orderId, shopName }) {
  const [rawBTLink, setRawBTLink] = useState('');

  useEffect(() => {
    if (!show || order.length === 0) {
        setRawBTLink('');
        return;
    }

    try {
        const url = generateRawBTUrl(order, orderId, shopName);
        setRawBTLink(url);
    } catch (e) {
        console.error("Error generating RawBT URL:", e);
        setRawBTLink(null);
    }
    
  }, [show, order, shopName, orderId]);

  if (!show) return null;

  return (
    <div className="modal show" id="receiptModal">
      <div className="modal-content">
        <span className="close-button" onClick={onClose}>×</span>

        <div style={{ padding: '20px', textAlign: 'center' }}>
            <h3>ត្រៀមខ្លួនសម្រាប់បោះពុម្ព (RawBT)</h3>
            <p style={{fontSize: '14px'}}>សូមប្រាកដថា Bluetooth ត្រូវបានបើក ហើយម៉ាស៊ីនបោះពុម្ពត្រូវបានភ្ជាប់ទៅ RawBT App</p>
            {rawBTLink === null && (
                <p style={{ color: 'red' }}>មានបញ្ហាក្នុងការបង្កើតតំណរ! ពិនិត្យ Console.</p>
            )}
        </div>

        <div className="print-button-container" style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "15px" }}>
          <button className="btn-close-receipt" onClick={onClose}>បោះបង់</button>
          
          {rawBTLink && (
            <a 
              href={rawBTLink} 
              // target="_blank" ត្រូវបានដកចេញព្រោះ intent URL ដំណើរការល្អជាងដោយគ្មានវា
              rel="noopener noreferrer"
              onClick={() => {
                  // បិទ Modal បន្ទាប់ពីប៉ុន្មានវិនាទីដើម្បីបើក RawBT
                  setTimeout(onClose, 500); 
              }}
            >
              <button className="btn-print" style={{ backgroundColor: '#28a745', color: 'white' }}>
                🖨️ បោះពុម្ពតាម RawBT
              </button>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReceiptModal;