// src/components/ReceiptModal.jsx
import React, { useRef } from "react";
import { KHR_SYMBOL, formatKHR } from "../utils/formatters";
import qrcode from "../assets/qrcode.jpg";
import logo from "../assets/logo.png";

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

  // Draw receipt on canvas and print via RawBT
  const handlePrintRawBT = async () => {
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      const width = 384; // 80mm printer
      const padding = 12;
      const lineHeight = 20;
      let y = padding;

      const height =
        70 + // logo
        lineHeight * 6 + // header
        order.length * lineHeight * 2.5 + // items
        lineHeight * 3 + // total
        100 + // QR
        lineHeight * 2 + // thank you
        padding * 3;

      canvas.width = width;
      canvas.height = height;

      // White background
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "#000";

      // Load logo
      const logoImg = await loadImage(logo);
      const logoH = 50;
      const logoW = 50;
      ctx.drawImage(logoImg, (width - logoW) / 2, y, logoW, logoH);
      y += logoH + 8;

      // Shop name
      ctx.font = "bold 16px Arial";
      ctx.textAlign = "center";
      ctx.fillText(shopName, width / 2, y);
      y += lineHeight;

      // Address & Tel
      ctx.font = "12px Arial";
      ctx.fillText(SHOP_STATIC_DETAILS.address, width / 2, y);
      y += lineHeight;
      ctx.fillText(`Tel: ${SHOP_STATIC_DETAILS.tel}`, width / 2, y);
      y += lineHeight;

      // Date & Invoice
      ctx.font = "11px Arial";
      ctx.fillText(`${now.toLocaleDateString()} ${now.toLocaleTimeString()}`, width / 2, y);
      y += lineHeight;
      ctx.fillText(`Invoice: ${orderId}`, width / 2, y);
      y += lineHeight + 4;

      // Line
      drawLine(ctx, padding, y, width - padding, y);
      y += 8;

      // Items
      ctx.textAlign = "left";
      ctx.font = "12px Arial";
      order.forEach((item) => {
        const name = `${item.khmerName}`;
        ctx.fillText(name, padding, y);
        y += lineHeight;

        const detail = `${item.englishName || ""} x${item.quantity}`;
        ctx.fillText(detail, padding + 4, y);

        const price = `${KHR_SYMBOL}${formatKHR((item.priceKHR || item.priceUSD) * item.quantity)}`;
        ctx.textAlign = "right";
        ctx.fillText(price, width - padding, y);
        ctx.textAlign = "left";
        y += lineHeight + 2;
      });

      y += 4;
      drawLine(ctx, padding, y, width - padding, y);
      y += lineHeight;

      // Total
      ctx.font = "bold 14px Arial";
      ctx.textAlign = "center";
      ctx.fillText(`Total: ${KHR_SYMBOL}${formatKHR(totalKHR)}`, width / 2, y);
      y += lineHeight + 4;

      drawLine(ctx, padding, y, width - padding, y);
      y += 12;

      // QR Code
      const qrImg = await loadImage(qrcode);
      const qrSize = 90;
      ctx.drawImage(qrImg, (width - qrSize) / 2, y, qrSize, qrSize);
      y += qrSize + 10;

      // Thank you
      ctx.font = "12px Arial";
      ctx.fillText("សូមអរគុណ! សូមអញ្ជើញមកម្តងទៀត!", width / 2, y);

      // Convert to Base64 and send to RawBT
      canvas.toBlob((blob) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result.split(",")[1];
          window.location.href = `rawbt:image,${base64}`;
        };
        reader.readAsDataURL(blob);
      }, "image/png");
    } catch (error) {
      console.error("Print error:", error);
      alert("មានបញ្ហាក្នុងការបោះពុម្ពវិក្កយបត្រ");
    }
  };

  const loadImage = (src) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });

  const drawLine = (ctx, x1, y1, x2, y2) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1;
    ctx.stroke();
  };

  return (
    <div className="modal show" id="receiptModal">
      <div className="modal-content">
        <span className="close-button" onClick={onClose}>
          ×
        </span>

        <div className="receipt-preview" ref={receiptRef}>
          <div className="receipt-logo">
            <img src={logo} alt="logo" style={{ width: 80 }} />
          </div>
          <p>{shopName}</p>
          <p>{SHOP_STATIC_DETAILS.address}</p>
          <p>Tel: {SHOP_STATIC_DETAILS.tel}</p>
          <p>
            Date: {now.toLocaleDateString()} {now.toLocaleTimeString()}
          </p>
          <p>Invoice: {orderId}</p>
          <hr />
          {order.map((item, i) => (
            <div key={i}>
              <p>
                {item.khmerName} ({item.englishName || ""}) x {item.quantity}
              </p>
              <p>
                {KHR_SYMBOL}
                {formatKHR((item.priceKHR || item.priceUSD) * item.quantity)}
              </p>
            </div>
          ))}
          <hr />
          <p>
            Total: {KHR_SYMBOL}
            {formatKHR(totalKHR)}
          </p>
          <img src={qrcode} alt="QR" style={{ width: 80 }} />
          <p>សូមអរគុណ! សូមអញ្ជើញមកម្តងទៀត!</p>
        </div>

        <div className="print-button-container">
          <button className="btn-close-receipt" onClick={onClose}>
            បោះបង់
          </button>
          <button className="btn-print" onClick={handlePrintRawBT}>
            បោះពុម្ពវិក្កយបត្រ
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReceiptModal;
