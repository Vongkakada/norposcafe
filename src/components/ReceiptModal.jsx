// ReceiptModal80mm.jsx
import React, { useState, useEffect } from "react";
import { KHR_SYMBOL, formatKHR } from "../utils/formatters";
import qrcode from "../assets/qrcode.jpg";
import logo from "../assets/logo.png";

const SHOP_STATIC_DETAILS = {
  address: "ផ្ទះលេខ 137 , ផ្លូវ 223, កំពង់ចាម",
  tel: "016 438 555 / 061 91 4444",
};

function ReceiptModal({ show, onClose, order, orderId, shopName }) {
  const [imageUrl, setImageUrl] = useState(null);

  useEffect(() => {
    if (!show) return;

    const generateReceiptImage = async () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const width = 576; // 80mm thermal printer
      const padding = 16;
      const lineHeight = 24;
      let y = padding;

      const height =
        90 + // logo
        lineHeight * 6 +
        order.length * lineHeight * 2.5 +
        lineHeight * 3 +
        120 +
        lineHeight * 2 +
        padding * 3;
      canvas.width = width;
      canvas.height = height;

      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "#000";

      const loadImage = (src) =>
        new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = src;
        });

      const logoImg = await loadImage(logo);
      ctx.drawImage(logoImg, (width - 70) / 2, y, 70, 70);
      y += 70 + 12;

      ctx.font = "bold 18px Arial";
      ctx.textAlign = "center";
      ctx.fillText(shopName, width / 2, y);
      y += lineHeight;

      ctx.font = "14px Arial";
      ctx.fillText(SHOP_STATIC_DETAILS.address, width / 2, y);
      y += lineHeight;
      ctx.fillText(`Tel: ${SHOP_STATIC_DETAILS.tel}`, width / 2, y);
      y += lineHeight;

      const now = new Date();
      ctx.font = "12px Arial";
      ctx.fillText(`${now.toLocaleDateString()} ${now.toLocaleTimeString()}`, width / 2, y);
      y += lineHeight;
      ctx.fillText(`Invoice: ${orderId}`, width / 2, y);
      y += lineHeight + 6;

      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.lineWidth = 1;
      ctx.stroke();
      y += 10;

      ctx.textAlign = "left";
      ctx.font = "14px Arial";
      order.forEach((item) => {
        ctx.fillText(`${item.khmerName}`, padding, y);
        y += lineHeight;
        ctx.fillText(`${item.englishName || ""} x${item.quantity}`, padding + 4, y);
        const price = `${KHR_SYMBOL}${formatKHR((item.priceKHR || item.priceUSD) * item.quantity)}`;
        ctx.textAlign = "right";
        ctx.fillText(price, width - padding, y);
        ctx.textAlign = "left";
        y += lineHeight + 2;
      });

      y += 6;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
      y += lineHeight;

      const subtotalKHR = order.reduce(
        (sum, item) => sum + (item.priceKHR || item.priceUSD || 0) * item.quantity,
        0
      );
      ctx.font = "bold 16px Arial";
      ctx.textAlign = "center";
      ctx.fillText(`Total: ${KHR_SYMBOL}${formatKHR(subtotalKHR)}`, width / 2, y);
      y += lineHeight + 6;

      const qrImg = await loadImage(qrcode);
      ctx.drawImage(qrImg, (width - 100) / 2, y, 100, 100);
      y += 100 + 12;

      ctx.font = "14px Arial";
      ctx.fillText("សូមអរគុណ! សូមអញ្ជើញមកម្តងទៀត!", width / 2, y);

      const base64 = canvas.toDataURL("image/png");
      setImageUrl(base64);
    };

    generateReceiptImage();
  }, [show, order, orderId, shopName]);

  const handlePrintRawBT = () => {
    if (!imageUrl) return;

    // 1. create temporary download link
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `receipt_${orderId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // 2. open RawBT (Android) for printing
    // rawbt will detect last downloaded image
    setTimeout(() => {
      window.location.href = "rawbt:"; 
    }, 500);
  };

  if (!show) return null;

  return (
    <div className="modal show">
      <div className="modal-content">
        <span className="close-button" onClick={onClose}>×</span>

        <h3>Receipt Preview (80mm)</h3>
        {imageUrl ? <img src={imageUrl} alt="Receipt" style={{ width: "100%" }} /> : <p>កំពុងបង្កើត receipt...</p>}

        <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
          <button onClick={onClose}>បោះបង់</button>
          <button onClick={handlePrintRawBT} disabled={!imageUrl}>
            🖨️ Print via RawBT
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReceiptModal;
