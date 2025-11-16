// ReceiptModal.jsx
import React, { useEffect, useState } from "react";
import { KHR_SYMBOL, formatKHR } from "../utils/formatters";
import qrcode from "../assets/qrcode.jpg";
import logo from "../assets/logo.png";

const SHOP_STATIC_DETAILS = {
  address: "ផ្ទះលេខ 137 , ផ្លូវ 223, កំពង់ចាម",
  tel: "016 438 555 / 061 91 4444",
};

function ReceiptModal({ show, onClose, order, orderId, shopName }) {
  const [receiptDataUrl, setReceiptDataUrl] = useState(null);

  useEffect(() => {
    if (!show) return;

    const generateReceiptImage = async () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const width = 384;
      const padding = 12;
      const lineHeight = 20;
      const now = new Date();
      let y = padding;

      // estimate height
      const height = 70 + lineHeight * 6 + order.length * lineHeight * 2.5 + 100 + padding * 3;
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

      const drawLine = (ctx, x1, y1, x2, y2) => {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 1;
        ctx.stroke();
      };

      // logo
      const logoImg = await loadImage(logo);
      const logoW = 50,
        logoH = 50;
      ctx.drawImage(logoImg, (width - logoW) / 2, y, logoW, logoH);
      y += logoH + 8;

      ctx.font = "bold 16px Arial";
      ctx.textAlign = "center";
      ctx.fillText(shopName, width / 2, y);
      y += lineHeight;

      ctx.font = "12px Arial";
      ctx.fillText(SHOP_STATIC_DETAILS.address, width / 2, y);
      y += lineHeight;
      ctx.fillText(`Tel: ${SHOP_STATIC_DETAILS.tel}`, width / 2, y);
      y += lineHeight;

      ctx.font = "11px Arial";
      ctx.fillText(`${now.toLocaleDateString()} ${now.toLocaleTimeString()}`, width / 2, y);
      y += lineHeight;
      ctx.fillText(`Invoice: ${orderId}`, width / 2, y);
      y += lineHeight + 4;

      drawLine(ctx, padding, y, width - padding, y);
      y += 8;

      ctx.textAlign = "left";
      ctx.font = "12px Arial";
      order.forEach((item) => {
        ctx.fillText(`${item.khmerName}`, padding, y);
        y += lineHeight;
        ctx.fillText(`${item.englishName || ""} x${item.quantity}`, padding + 4, y);
        ctx.textAlign = "right";
        ctx.fillText(
          `${KHR_SYMBOL}${formatKHR((item.priceKHR || item.priceUSD) * item.quantity)}`,
          width - padding,
          y
        );
        ctx.textAlign = "left";
        y += lineHeight + 2;
      });

      y += 4;
      drawLine(ctx, padding, y, width - padding, y);
      y += lineHeight;

      const subtotalKHR = order.reduce(
        (sum, item) => sum + (item.priceKHR || item.priceUSD || 0) * item.quantity,
        0
      );

      ctx.font = "bold 14px Arial";
      ctx.textAlign = "center";
      ctx.fillText(`Total: ${KHR_SYMBOL}${formatKHR(subtotalKHR)}`, width / 2, y);
      y += lineHeight + 4;

      drawLine(ctx, padding, y, width - padding, y);
      y += 12;

      // QR
      const qrImg = await loadImage(qrcode);
      const qrSize = 90;
      ctx.drawImage(qrImg, (width - qrSize) / 2, y, qrSize, qrSize);
      y += qrSize + 10;

      ctx.font = "12px Arial";
      ctx.fillText("សូមអរគុណ! សូមអញ្ជើញមកម្តងទៀត!", width / 2, y);

      const dataUrl = canvas.toDataURL("image/png");
      setReceiptDataUrl(dataUrl);
    };

    generateReceiptImage();
  }, [show, order, orderId, shopName]);

  const handlePrint = () => {
    if (!receiptDataUrl) return;
    const win = window.open();
    win.document.write(`<img src="${receiptDataUrl}" onload="window.print();window.close()" />`);
    win.document.close();
  };

  if (!show) return null;

  return (
    <div className="modal show">
      <div className="modal-content">
        <span className="close-button" onClick={onClose}>
          ×
        </span>

        <h3>Receipt Preview</h3>
        {receiptDataUrl ? (
          <img src={receiptDataUrl} alt="Receipt Preview" style={{ width: "100%", maxWidth: 400 }} />
        ) : (
          <p>កំពុងបង្កើត...</p>
        )}

        <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
          <button onClick={onClose}>បោះបង់</button>
          <button onClick={handlePrint} disabled={!receiptDataUrl}>
            🖨️ Print
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReceiptModal;
