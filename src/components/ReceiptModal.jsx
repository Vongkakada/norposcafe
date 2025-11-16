// ReceiptModal.jsx
import React, { useEffect, useState } from "react";
import { KHR_SYMBOL, formatKHR } from "../utils/formatters";
import qrcode from "../assets/qrcode.jpg";
import logo from "../assets/logo.png";
import jsPDF from "jspdf"; // make sure to npm install jspdf

const SHOP_STATIC_DETAILS = {
  address: "ផ្ទះលេខ 137 , ផ្លូវ 223, កំពង់ចាម",
  tel: "016 438 555 / 061 91 4444",
};

function ReceiptModal({ show, onClose, order, orderId, shopName }) {
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);

  useEffect(() => {
    if (!show) return;

    const generatePDF = async () => {
      const doc = new jsPDF({ unit: "px", format: [384, 600] }); // 58mm width ~384px
      const now = new Date();
      const padding = 12;
      let y = padding;

      // logo
      const loadImage = (src) =>
        new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = src;
        });

      const logoImg = await loadImage(logo);
      doc.addImage(logoImg, "PNG", (384 - 50) / 2, y, 50, 50);
      y += 50 + 8;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text(shopName, 384 / 2, y, { align: "center" });
      y += 20;

      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(SHOP_STATIC_DETAILS.address, 384 / 2, y, { align: "center" });
      y += 16;
      doc.text(`Tel: ${SHOP_STATIC_DETAILS.tel}`, 384 / 2, y, { align: "center" });
      y += 16;

      doc.setFontSize(11);
      doc.text(`${now.toLocaleDateString()} ${now.toLocaleTimeString()}`, 384 / 2, y, { align: "center" });
      y += 16;
      doc.text(`Invoice: ${orderId}`, 384 / 2, y, { align: "center" });
      y += 16;

      doc.setLineWidth(0.5);
      doc.line(padding, y, 384 - padding, y);
      y += 8;

      // Items
      doc.setFontSize(12);
      order.forEach((item) => {
        doc.text(`${item.khmerName}`, padding, y);
        y += 16;
        doc.text(`${item.englishName || ""} x${item.quantity}`, padding + 4, y);
        const priceText = `${KHR_SYMBOL}${formatKHR((item.priceKHR || item.priceUSD) * item.quantity)}`;
        doc.text(priceText, 384 - padding, y, { align: "right" });
        y += 20;
      });

      // Total
      const subtotalKHR = order.reduce(
        (sum, item) => sum + (item.priceKHR || item.priceUSD || 0) * item.quantity,
        0
      );
      doc.setFont("helvetica", "bold");
      doc.text(`Total: ${KHR_SYMBOL}${formatKHR(subtotalKHR)}`, 384 / 2, y, { align: "center" });
      y += 20;

      // QR code
      const qrImg = await loadImage(qrcode);
      doc.addImage(qrImg, "PNG", (384 - 90) / 2, y, 90, 90);
      y += 90 + 10;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      doc.text("សូមអរគុណ! សូមអញ្ជើញមកម្តងទៀត!", 384 / 2, y, { align: "center" });

      const pdfBlob = doc.output("blob");
      const pdfUrl = URL.createObjectURL(pdfBlob);
      setPdfBlobUrl(pdfUrl);
    };

    generatePDF();
  }, [show, order, orderId, shopName]);

  const handlePrintRawBT = () => {
    if (!pdfBlobUrl) return;
    // RawBT URL for PDF
    window.location.href = `rawbt:pdf,${pdfBlobUrl}`;
    // revoke after short delay
    setTimeout(() => URL.revokeObjectURL(pdfBlobUrl), 5000);
  };

  if (!show) return null;

  return (
    <div className="modal show">
      <div className="modal-content">
        <span className="close-button" onClick={onClose}>
          ×
        </span>

        <h3>Receipt Preview (PDF)</h3>
        {pdfBlobUrl ? (
          <iframe src={pdfBlobUrl} title="Receipt PDF" style={{ width: "100%", height: 400 }} />
        ) : (
          <p>កំពុងបង្កើត PDF...</p>
        )}

        <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
          <button onClick={onClose}>បោះបង់</button>
          <button onClick={handlePrintRawBT} disabled={!pdfBlobUrl}>
            🖨️ Print via RawBT
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReceiptModal;
