// src/components/ReceiptModal.jsx
import React, { useState, useEffect } from "react";
import { KHR_SYMBOL, formatKHR } from "../utils/formatters";
import jsPDF from "jspdf";
import qrcode from "../assets/qrcode.jpg";
import logo from "../assets/logo.png";

const SHOP_STATIC_DETAILS = {
  address: "ផ្ទះលេខ 137 , ផ្លូវ 223, កំពង់ចាម",
  tel: "016 438 555 / 061 91 4444",
};

function ReceiptModal({ show, onClose, order, orderId, shopName }) {
  const [pdfUrl, setPdfUrl] = useState(null);

  const subtotalKHR = order.reduce(
    (sum, item) => sum + (item.priceKHR || item.priceUSD || 0) * item.quantity,
    0
  );
  const totalKHR = subtotalKHR;

  useEffect(() => {
    if (!show) return;

    const now = new Date();

    const generatePDF = async () => {
      const pdf = new jsPDF({ orientation: "p", unit: "pt", format: [220, 600] });

      // Logo
      const logoImg = new Image();
      logoImg.src = logo;
      await new Promise((res) => { logoImg.onload = res; });
      pdf.addImage(logoImg, "PNG", 80, 10, 50, 50);

      pdf.setFontSize(12);
      pdf.text(shopName, 110, 70, { align: "center" });
      pdf.text(SHOP_STATIC_DETAILS.address, 110, 85, { align: "center" });
      pdf.text(`Tel: ${SHOP_STATIC_DETAILS.tel}`, 110, 100, { align: "center" });
      pdf.setFontSize(10);
      pdf.text(`${now.toLocaleDateString()} ${now.toLocaleTimeString()}`, 110, 115, { align: "center" });
      pdf.text(`Invoice: ${orderId}`, 110, 130, { align: "center" });
      pdf.line(10, 140, 210, 140);

      let y = 155;
      order.forEach((item) => {
        pdf.setFontSize(11);
        pdf.text(`${item.khmerName}`, 12, y);
        pdf.text(`${item.englishName || ""} x${item.quantity}`, 12, y + 12);
        pdf.text(`${KHR_SYMBOL}${formatKHR((item.priceKHR || item.priceUSD) * item.quantity)}`, 208, y + 12, { align: "right" });
        y += 28;
      });

      pdf.line(10, y, 210, y);
      y += 12;
      pdf.setFontSize(12);
      pdf.text(`Total: ${KHR_SYMBOL}${formatKHR(totalKHR)}`, 110, y, { align: "center" });

      y += 20;

      const qrImg = new Image();
      qrImg.src = qrcode;
      await new Promise((res) => { qrImg.onload = res; });
      pdf.addImage(qrImg, "PNG", 65, y, 90, 90);
      y += 100;

      pdf.setFontSize(10);
      pdf.text("សូមអរគុណ! សូមអញ្ជើញមកម្តងទៀត!", 110, y, { align: "center" });

      const pdfBlob = pdf.output("blob");
      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);
    };

    generatePDF();

    // Cleanup URL on close
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
        setPdfUrl(null);
      }
    };
  }, [show, order, shopName, orderId, totalKHR]);

  if (!show) return null;

  return (
    <div className="modal show" id="receiptModal">
      <div className="modal-content">
        <span className="close-button" onClick={onClose}>×</span>

        <div className="receipt-preview">
          {pdfUrl ? (
            <iframe
              title="Receipt PDF"
              src={pdfUrl}
              style={{ width: "100%", height: "400px", border: "none" }}
            />
          ) : (
            <p>Generating PDF...</p>
          )}
        </div>

        <div className="print-button-container" style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
          <button className="btn-close-receipt" onClick={onClose}>បោះបង់</button>
          {pdfUrl && (
            <a href={pdfUrl} download={`Receipt_${orderId}.pdf`}>
              <button className="btn-print">Download / Print PDF</button>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReceiptModal;
