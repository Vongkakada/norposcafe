// src/components/ReceiptModal.jsx
import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import { KHR_SYMBOL, formatKHR } from "../utils/formatters";
import qrcode from "../assets/qrcode.jpg";
import logo from "../assets/logo.png";

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

  // ---------------------------
  // Generate PDF for preview
  // ---------------------------
  useEffect(() => {
    if (!show) return;

    const generatePDF = async () => {
      const pdf = new jsPDF({
        orientation: "p",
        unit: "pt",
        format: [220, 600], // width ~ 80mm
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

    generatePDF();

    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
    // dependencies safe for ESLint
  }, [show, order, shopName, orderId, totalKHR, pdfUrl]);

  // ---------------------------
  // Print to RawBT (PNG)
  // ---------------------------
  const handlePrintRawBT = async () => {
    try {
      if (!pdfUrl) return;

      // Load PDF blob into image for RawBT
      const pdfBlob = await fetch(pdfUrl).then((r) => r.blob());
      const imgUrl = URL.createObjectURL(pdfBlob);

      window.location.href = `rawbt:${imgUrl}`;

      setTimeout(() => URL.revokeObjectURL(imgUrl), 5000);
    } catch (err) {
      console.error(err);
      alert("មានបញ្ហាក្នុងការបោះពុម្ពទៅ RawBT");
    }
  };

  if (!show) return null;

  return (
    <div className="modal show" id="receiptModal">
      <div className="modal-content">
        <span className="close-button" onClick={onClose}>
          ×
        </span>

        <div className="receipt-preview" style={{ overflowY: "auto", maxHeight: "80vh" }}>
          {pdfUrl ? (
            <iframe
              title="Receipt PDF Preview"
              src={pdfUrl}
              width="220"
              height="600"
              style={{ border: "none" }}
            />
          ) : (
            <p>កំពុងបង្កើតវិក្កយបត្រ...</p>
          )}
        </div>

        <div className="print-button-container" style={{ marginTop: "12px", textAlign: "center" }}>
          <button
            className="btn-close-receipt"
            onClick={onClose}
            style={{ marginRight: "10px" }}
          >
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
