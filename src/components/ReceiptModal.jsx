// src/components/ReceiptModal.jsx
import React, { useRef } from "react";
import { KHR_SYMBOL, formatKHR } from "../utils/formatters";
import qrcode from "../assets/qrcode.jpg";
import logo from "../assets/logo.png";
import html2canvas from "html2canvas";

const SHOP_STATIC_DETAILS = {
  address: "ផ្ទះលេខ 137 , ផ្លូវ 223, កំពង់ចាម",
  tel: "016 438 555 / 061 91 4444",
};

function ReceiptModal({ show, onClose, order, orderId, shopName }) {
  const receiptRef = useRef(null);

  if (!show) return null;

  const now = new Date();
  const subtotalKHR = order.reduce(
    (sum, item) => sum + (item.priceKHR || item.priceUSD || 0) * item.quantity,
    0
  );
  const totalKHR = subtotalKHR;

  const handlePrintRawBT = async () => {
    if (!receiptRef.current) return;
    const canvas = await html2canvas(receiptRef.current, { scale: 2 });
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      // Open in RawBT
      window.location.href = `rawbt:${url}`;
      // Clean up
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    }, "image/png");
  };

  return (
    <div className="modal show" id="receiptModal">
      <div className="modal-content">
        <span className="close-button" onClick={onClose}>×</span>

        <div className="receipt-preview" ref={receiptRef} style={{ padding: 20, background: "#fff", width: 384 }}>
          <div style={{ textAlign: "center" }}>
            <img src={logo} alt="logo" style={{ width: 80 }} />
          </div>
          <p style={{ textAlign: "center", fontWeight: "bold" }}>{shopName}</p>
          <p style={{ textAlign: "center" }}>{SHOP_STATIC_DETAILS.address}</p>
          <p style={{ textAlign: "center" }}>Tel: {SHOP_STATIC_DETAILS.tel}</p>
          <p>Date: {now.toLocaleDateString()} {now.toLocaleTimeString()}</p>
          <p>Invoice: {orderId}</p>
          <hr />
          {order.map((item, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                {item.khmerName} ({item.englishName || ""}) x {item.quantity}
              </div>
              <div>{KHR_SYMBOL}{formatKHR((item.priceKHR || item.priceUSD) * item.quantity)}</div>
            </div>
          ))}
          <hr />
          <div style={{ textAlign: "center", fontWeight: "bold" }}>
            Total: {KHR_SYMBOL}{formatKHR(totalKHR)}
          </div>
          <div style={{ textAlign: "center", marginTop: 10 }}>
            <img src={qrcode} alt="QR" style={{ width: 80 }} />
          </div>
          <p style={{ textAlign: "center" }}>សូមអរគុណ! សូមអញ្ជើញមកម្តងទៀត!</p>
        </div>

        <div className="print-button-container" style={{ marginTop: 12, display: "flex", gap: 10 }}>
          <button className="btn-close-receipt" onClick={onClose}>បោះបង់</button>
          <button className="btn-print" onClick={handlePrintRawBT}>បោះពុម្ពវិក្កយបត្រ</button>
        </div>
      </div>
    </div>
  );
}

export default ReceiptModal;
