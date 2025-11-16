import React, { useState, useEffect } from "react";
import { KHR_SYMBOL, formatKHR } from "../utils/formatters";
import qrcode from "../assets/qrcode.jpg";
import logo from "../assets/logo.png";
import jsPDF from "jspdf";

const SHOP_STATIC_DETAILS = {
  address: "ផ្ទះលេខ 137 , ផ្លូវ 223, កំពង់ចាម",
  tel: "016 438 555 / 061 91 4444",
};

function ReceiptModal({ show, onClose, order, orderId, shopName }) {
  const [pdfUrl, setPdfUrl] = useState(null);

  const now = new Date();
  const subtotalKHR = order.reduce(
    (sum, item) => sum + (item.priceKHR || item.priceUSD || 0) * item.quantity,
    0
  );
  const totalKHR = subtotalKHR;

  const loadImage = (src) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  const generatePDF = async () => {
    if (!show) return; // only generate when modal is shown

    const pdf = new jsPDF({
      orientation: "p",
      unit: "pt",
      format: [220, 600],
    });

    let y = 20;

    const logoImg = await loadImage(logo);
    pdf.addImage(logoImg, "PNG", 85, y, 50, 50);
    y += 60;

    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text(shopName, 110, y, { align: "center" });
    y += 18;

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.text(SHOP_STATIC_DETAILS.address, 110, y, { align: "center" });
    y += 14;
    pdf.text(`Tel: ${SHOP_STATIC_DETAILS.tel}`, 110, y, { align: "center" });
    y += 18;

    pdf.text(
      `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`,
      110,
      y,
      { align: "center" }
    );
    y += 14;
    pdf.text(`Invoice: ${orderId}`, 110, y, { align: "center" });
    y += 18;

    pdf.setLineWidth(0.5);
    pdf.line(10, y, 210, y);
    y += 12;

    pdf.setFontSize(10);
    order.forEach((item) => {
      pdf.text(`${item.khmerName}`, 12, y);
      y += 12;
      pdf.text(`${item.englishName || ""} x${item.quantity}`, 12, y);
      pdf.text(
        `${KHR_SYMBOL}${formatKHR((item.priceKHR || item.priceUSD) * item.quantity)}`,
        210 - 12,
        y,
        { align: "right" }
      );
      y += 16;
    });

    y += 4;
    pdf.line(10, y, 210, y);
    y += 12;

    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.text(`Total: ${KHR_SYMBOL}${formatKHR(totalKHR)}`, 110, y, { align: "center" });
    y += 20;
    pdf.line(10, y, 210, y);
    y += 20;

    const qrImg = await loadImage(qrcode);
    pdf.addImage(qrImg, "PNG", 65, y, 90, 90);
    y += 100;

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.text("សូមអរគុណ! សូមអញ្ជើញមកម្តងទៀត!", 110, y, { align: "center" });

    const blob = pdf.output("blob");
    const url = URL.createObjectURL(blob);
    setPdfUrl(url);
  };

  useEffect(() => {
    generatePDF();
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [show, order]); // always call hook at top level

  const handlePrintRawBT = () => {
    if (!pdfUrl) return;
    window.open(pdfUrl, "_blank");
  };

  if (!show) return null;

  return (
    <div className="modal show">
      <div className="modal-content">
        <span className="close-button" onClick={onClose}>×</span>

        <div className="receipt-preview">
          {pdfUrl ? (
            <iframe
              src={pdfUrl}
              title="Receipt Preview"
              style={{ width: "100%", height: "400px", border: "none" }}
            />
          ) : (
            <p>Generating PDF...</p>
          )}
        </div>

        <div className="print-button-container">
          <button className="btn-close-receipt" onClick={onClose}>បោះបង់</button>
          <button className="btn-print" onClick={handlePrintRawBT}>បោះពុម្ពវិក្កយបត្រ</button>
        </div>
      </div>
    </div>
  );
}

export default ReceiptModal;
