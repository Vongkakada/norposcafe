// ReceiptModal.jsx
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
      const width = 384; // 58mm ~ 384px
      const padding = 12;
      const lineHeight = 20;
      let y = padding;

      const height =
        70 + // logo
        lineHeight * 6 +
        order.length * lineHeight * 2.5 +
        lineHeight * 3 +
        100 +
        lineHeight * 2 +
        padding * 3;
      canvas.width = width;
      canvas.height = height;

      // white background
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "#000";

      // load image helper
      const loadImage = (src) =>
        new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = src;
        });

      // logo
      const logoImg = await loadImage(logo);
      ctx.drawImage(logoImg, (width - 50) / 2, y, 50, 50);
      y += 50 + 8;

      // shop name
      ctx.font = "bold 16px Arial";
      ctx.textAlign = "center";
      ctx.fillText(shopName, width / 2, y);
      y += lineHeight;

      ctx.font = "12px Arial";
      ctx.fillText(SHOP_STATIC_DETAILS.address, width / 2, y);
      y += lineHeight;
      ctx.fillText(`Tel: ${SHOP_STATIC_DETAILS.tel}`, width / 2, y);
      y += lineHeight;

      const now = new Date();
      ctx.font = "11px Arial";
      ctx.fillText(`${now.toLocaleDateString()} ${now.toLocaleTimeString()}`, width / 2, y);
      y += lineHeight;
      ctx.fillText(`Invoice: ${orderId}`, width / 2, y);
      y += lineHeight + 4;

      // line
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.lineWidth = 1;
      ctx.stroke();
      y += 8;

      // items
      ctx.textAlign = "left";
      ctx.font = "12px Arial";
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

      y += 4;
      // line
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
      y += lineHeight;

      // total
      const subtotalKHR = order.reduce(
        (sum, item) => sum + (item.priceKHR || item.priceUSD || 0) * item.quantity,
        0
      );
      ctx.font = "bold 14px Arial";
      ctx.textAlign = "center";
      ctx.fillText(`Total: ${KHR_SYMBOL}${formatKHR(subtotalKHR)}`, width / 2, y);
      y += lineHeight + 4;

      // QR code
      const qrImg = await loadImage(qrcode);
      ctx.drawImage(qrImg, (width - 90) / 2, y, 90, 90);
      y += 90 + 10;

      // thank you
      ctx.font = "12px Arial";
      ctx.fillText("សូមអរគុណ! សូមអញ្ជើញមកម្តងទៀត!", width / 2, y);

      // convert to base64
      const base64 = canvas.toDataURL("image/png");
      setImageUrl(base64);
    };

    generateReceiptImage();
  }, [show, order, orderId, shopName]);

  const handlePrintRawBT = () => {
    if (!imageUrl) return;
    // Send direct to RawBT
    window.location.href = `rawbt:image,${imageUrl.split(",")[1]}`;
  };

  if (!show) return null;

  return (
    <div className="modal show">
      <div className="modal-content">
        <span className="close-button" onClick={onClose}>×</span>

        <h3>Receipt Preview (Image)</h3>
        {imageUrl ? (
          <img src={imageUrl} alt="Receipt" style={{ width: "100%" }} />
        ) : (
          <p>កំពុងបង្កើត receipt...</p>
        )}

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
