// src/components/OrderPanel.jsx
import React, { useState } from 'react';
import OrderItemEntry from './OrderItemEntry';
import { KHR_SYMBOL, formatKHR } from '../utils/formatters';
import logo from '../assets/logo.png';
import qrcode from '../assets/qrcode.jpg';

const SHOP_STATIC_DETAILS = {
  address: "ផ្ទះលេខ 137 , ផ្លូវ 223, កំពង់ចាម",
  tel: "016 438 555 / 061 91 4444",
};

function OrderPanel({
    currentOrder,
    orderId,
    onUpdateQuantity,
    onClearOrder,
    shopName = "ហាងលក់ទំនិញ",
}) {
    const [isPrinting, setIsPrinting] = useState(false);
    const [showReceiptPreview, setShowReceiptPreview] = useState(false);

    const subtotalKHR = currentOrder.reduce(
        (sum, item) => sum + (item.priceKHR || item.priceUSD || 0) * item.quantity, 
        0
    );

    const totalKHR = subtotalKHR;

    // --------------------------
    // Generate receipt canvas
    // --------------------------
    const generateReceiptCanvas = async () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const width = 576; // 80mm
        const padding = 16;
        const lineHeight = 24;
        let y = padding;

        const height = 90 + lineHeight * 6 + currentOrder.length * lineHeight * 2.5 + lineHeight * 3 + 120 + lineHeight * 2 + padding * 3;
        canvas.width = width;
        canvas.height = height;

        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#000';

        const loadImage = (src) => new Promise((resolve, reject) => {
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
        currentOrder.forEach((item) => {
            ctx.fillText(`${item.khmerName}`, padding, y);
            y += lineHeight;
            ctx.fillText(`${item.englishName || ""} x${item.quantity}`, padding + 4, y);
            ctx.textAlign = "right";
            ctx.fillText(`${KHR_SYMBOL}${formatKHR((item.priceKHR || item.priceUSD) * item.quantity)}`, width - padding, y);
            ctx.textAlign = "left";
            y += lineHeight + 2;
        });

        y += 6;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
        y += lineHeight;

        ctx.font = "bold 16px Arial";
        ctx.textAlign = "center";
        ctx.fillText(`Total: ${KHR_SYMBOL}${formatKHR(totalKHR)}`, width / 2, y);
        y += lineHeight + 6;

        const qrImg = await loadImage(qrcode);
        ctx.drawImage(qrImg, (width - 100) / 2, y, 100, 100);
        y += 100 + 12;

        ctx.font = "14px Arial";
        ctx.fillText("សូមអរគុណ! សូមអញ្ជើញមកម្តងទៀត!", width / 2, y);

        return canvas;
    };

    // --------------------------
    // Convert canvas to raster bytes (ESC/POS)
    // --------------------------
    const canvasToRaster = (canvas) => {
        const ctx = canvas.getContext("2d");
        const w = canvas.width;
        const h = canvas.height;
        const imageData = ctx.getImageData(0, 0, w, h);
        const pixels = imageData.data;

        const bytes = [];
        const ESC = 0x1B;
        const GS = 0x1D;

        bytes.push(ESC, 0x40); // initialize printer

        const widthL = w % 256;
        const widthH = Math.floor(w / 256);

        for (let y = 0; y < h; y += 24) {
            bytes.push(GS, 0x76, 0x30, 0x00, widthL, widthH, 24, 0);

            for (let x = 0; x < w; x++) {
                for (let k = 0; k < 3; k++) {
                    let byte = 0;
                    for (let b = 0; b < 8; b++) {
                        const yy = y + k * 8 + b;
                        const idx = (yy * w + x) * 4;
                        if (yy >= h) continue;
                        const r = pixels[idx];
                        const g = pixels[idx + 1];
                        const b_ = pixels[idx + 2];
                        const avg = (r + g + b_) / 3;
                        if (avg < 128) byte |= 1 << (7 - b);
                    }
                    bytes.push(byte);
                }
            }
        }

        bytes.push(GS, 0x56, 0x00); // cut
        return new Uint8Array(bytes);
    };

    // --------------------------
    // Print via Web Bluetooth
    // --------------------------
    const handlePrintBluetooth = async () => {
        if (!navigator.bluetooth) {
            alert("សូមប្រើ Chrome/Edge Android ដើម្បីប្រើ Bluetooth");
            return;
        }

        setIsPrinting(true);
        try {
            const canvas = await generateReceiptCanvas();
            setShowReceiptPreview(true); // Show preview

            const rasterBytes = canvasToRaster(canvas);

            const device = await navigator.bluetooth.requestDevice({
                filters: [{ namePrefix: "Sawoo" }],
                optionalServices: [0xFFE0],
            });

            const server = await device.gatt.connect();
            const service = await server.getPrimaryService(0xFFE0);
            const characteristic = await service.getCharacteristic(0xFFE1);

            await characteristic.writeValue(rasterBytes);
            alert("✅ Printed successfully!");

        } catch (err) {
            console.error(err);
            alert("❌ មានបញ្ហាក្នុងការបោះពុម្ព");
        }
        setIsPrinting(false);
    };

    return (
        <div className="order-panel">
            <h2>បញ្ជីកម្ម៉ង់ #{orderId}</h2>

            <div className="current-order-items">
                {currentOrder.length === 0 ? (
                    <p className="empty-cart">មិនទាន់មានទំនិញក្នុងបញ្ជីទេ។</p>
                ) : (
                    currentOrder.map(item => (
                        <OrderItemEntry
                            key={item.khmerName + (item.priceKHR || item.priceUSD || 0)}
                            item={item}
                            onUpdateQuantity={onUpdateQuantity}
                        />
                    ))
                )}
            </div>

            <div className="order-summary">
                <div className="summary-line">
                    <span>សរុបរង (Subtotal):</span>
                    <span className="currency-value">{KHR_SYMBOL}{formatKHR(subtotalKHR)}</span>
                </div>
                <div className="summary-line total order-total">
                    <span>សរុប (Total):</span>
                    <span className="currency-value">{KHR_SYMBOL}{formatKHR(totalKHR)}</span>
                </div>
            </div>

            <div className="action-buttons">
                <button onClick={onClearOrder} disabled={currentOrder.length === 0 || isPrinting}>
                    🗑️ លុបការកម្ម៉ង់
                </button>
                <button onClick={handlePrintBluetooth} disabled={currentOrder.length === 0 || isPrinting}>
                    {isPrinting ? "⏳ កំពុង Print..." : "💰 គិតលុយ & Print"}
                </button>
            </div>

            {showReceiptPreview && (
                <div className="receipt-preview-modal" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex',
                    justifyContent: 'center', alignItems: 'center', zIndex: 9999
                }}>
                    <div style={{ background: '#fff', padding: 20, borderRadius: 12 }}>
                        <img src={document.querySelector('canvas').toDataURL()} alt="Receipt Preview" style={{ maxWidth: 300 }} />
                        <button onClick={() => setShowReceiptPreview(false)} style={{ marginTop: 10 }}>Close Preview</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default OrderPanel;
