// src/utils/receiptGenerator.js
import { KHR_SYMBOL, formatKHR } from './formatters';
import logo from '../assets/logo.png';
import qrcode from '../assets/qrcode.jpg';

const SHOP_STATIC_DETAILS = {
  address: "ផ្ទះលេខ 137 , ផ្លូវ 223, កំពង់ចាម",
  tel: "016 438 555 / 061 91 4444",
};

const loadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => {
      console.warn(`Failed to load image: ${src}`);
      resolve(null);
    };
    img.src = src;
  });
};

const drawLine = (ctx, x1, y1, x2, y2, thickness = 2) => {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = thickness;
  ctx.stroke();
};

const wrapText = (ctx, text, maxWidth) => {
  if (!text) return [''];
  const words = text.split(' ');
  const lines = [];
  let currentLine = words[0] || '';

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + " " + word).width;
    if (width < maxWidth) {
      currentLine += " " + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
};

/**
 * Convert image data to 1-bit monochrome bitmap (Floyd-Steinberg dithering)
 * This creates crisp black & white image perfect for thermal printers
 */
const convertToMonochrome = (imageData, width, height) => {
  const data = imageData.data;
  const threshold = 128;
  
  // Floyd-Steinberg dithering for better quality
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      
      // Convert to grayscale
      const gray = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
      
      // Apply threshold
      const newGray = gray < threshold ? 0 : 255;
      const error = gray - newGray;
      
      // Set pixel to pure black or white
      data[idx] = data[idx + 1] = data[idx + 2] = newGray;
      
      // Distribute error to neighboring pixels (Floyd-Steinberg)
      if (x + 1 < width) {
        const nextIdx = idx + 4;
        data[nextIdx] += error * 7 / 16;
        data[nextIdx + 1] += error * 7 / 16;
        data[nextIdx + 2] += error * 7 / 16;
      }
      if (y + 1 < height) {
        if (x > 0) {
          const belowLeftIdx = ((y + 1) * width + (x - 1)) * 4;
          data[belowLeftIdx] += error * 3 / 16;
          data[belowLeftIdx + 1] += error * 3 / 16;
          data[belowLeftIdx + 2] += error * 3 / 16;
        }
        const belowIdx = ((y + 1) * width + x) * 4;
        data[belowIdx] += error * 5 / 16;
        data[belowIdx + 1] += error * 5 / 16;
        data[belowIdx + 2] += error * 5 / 16;
        
        if (x + 1 < width) {
          const belowRightIdx = ((y + 1) * width + (x + 1)) * 4;
          data[belowRightIdx] += error * 1 / 16;
          data[belowRightIdx + 1] += error * 1 / 16;
          data[belowRightIdx + 2] += error * 1 / 16;
        }
      }
    }
  }
  
  return imageData;
};

/**
 * Generate high-quality monochrome bitmap receipt
 * Perfect for thermal printers - no blur, crisp text
 */
export const generateReceiptBitmap = async ({ shopName, orderId, order, totalKHR }) => {
  return new Promise(async (resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // High resolution for thermal printer (384px for 58mm, 576px for 80mm)
      const width = 576;
      const padding = 24;
      const lineHeight = 32;
      let y = padding;

      // Estimate height
      let estimatedHeight = 
        100 + // logo
        lineHeight * 8 + // header
        order.length * lineHeight * 3 + // items
        lineHeight * 4 + // total
        140 + // QR code
        lineHeight * 3 + // footer
        padding * 3;

      canvas.width = width;
      canvas.height = estimatedHeight;

      // White background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, canvas.height);
      ctx.fillStyle = '#000000';

      // Enable better text rendering
      ctx.imageSmoothingEnabled = false;
      ctx.textBaseline = 'top';

      // Load and draw logo (will be converted to bitmap)
      const logoImg = await loadImage(logo);
      if (logoImg) {
        const logoSize = 80;
        const logoX = (width - logoSize) / 2;
        ctx.drawImage(logoImg, logoX, y, logoSize, logoSize);
        y += logoSize + 12;
      }

      // Shop name (bold, large, center)
      ctx.font = 'bold 28px Arial, "Noto Sans Khmer", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(shopName, width / 2, y);
      y += lineHeight + 4;

      // Address (Khmer)
      ctx.font = '18px Arial, "Noto Sans Khmer", sans-serif';
      ctx.fillText(SHOP_STATIC_DETAILS.address, width / 2, y);
      y += lineHeight;
      
      // Phone
      ctx.font = '16px Arial, sans-serif';
      ctx.fillText(`Tel: ${SHOP_STATIC_DETAILS.tel}`, width / 2, y);
      y += lineHeight + 4;

      // Date and time
      const now = new Date();
      ctx.font = '15px Arial, sans-serif';
      const dateStr = `${now.toLocaleDateString('en-GB')} ${now.toLocaleTimeString('en-GB')}`;
      ctx.fillText(dateStr, width / 2, y);
      y += lineHeight;

      // Invoice
      ctx.font = 'bold 18px Arial, sans-serif';
      ctx.fillText(`Invoice #${orderId}`, width / 2, y);
      y += lineHeight + 8;

      // Top divider
      drawLine(ctx, padding, y, width - padding, y, 3);
      y += 16;

      // Items header
      ctx.textAlign = 'left';
      ctx.font = 'bold 17px Arial, "Noto Sans Khmer", sans-serif';
      ctx.fillText('Item', padding, y);
      ctx.textAlign = 'right';
      ctx.fillText('Amount', width - padding, y);
      y += lineHeight;
      
      drawLine(ctx, padding, y, width - padding, y, 1);
      y += 12;

      // Items list
      ctx.textAlign = 'left';
      order.forEach((item) => {
        // Khmer name (bold)
        ctx.font = 'bold 18px Arial, "Noto Sans Khmer", sans-serif';
        const khmerName = item.khmerName || '';
        const khmerLines = wrapText(ctx, khmerName, width - padding * 2 - 120);
        
        khmerLines.forEach((line, idx) => {
          ctx.fillText(line, padding, y);
          if (idx < khmerLines.length - 1) y += lineHeight;
        });
        y += lineHeight;
        
        // English name and quantity
        ctx.font = '16px Arial, sans-serif';
        const englishName = item.englishName || '';
        const qtyText = `${englishName} × ${item.quantity}`;
        ctx.fillText(qtyText, padding + 8, y);
        
        // Price (right align)
        const itemTotal = (item.priceKHR || item.priceUSD || 0) * item.quantity;
        const priceText = `${KHR_SYMBOL}${formatKHR(itemTotal)}`;
        ctx.textAlign = 'right';
        ctx.font = 'bold 17px Arial, "Noto Sans Khmer", sans-serif';
        ctx.fillText(priceText, width - padding, y);
        ctx.textAlign = 'left';
        
        y += lineHeight + 6;
      });

      // Bottom divider
      y += 8;
      drawLine(ctx, padding, y, width - padding, y, 3);
      y += 24;

      // Total section
      ctx.textAlign = 'center';
      ctx.font = 'bold 24px Arial, sans-serif';
      ctx.fillText('TOTAL', width / 2, y);
      y += lineHeight + 4;
      
      ctx.font = 'bold 36px Arial, "Noto Sans Khmer", sans-serif';
      ctx.fillText(`${KHR_SYMBOL}${formatKHR(totalKHR)}`, width / 2, y);
      y += lineHeight + 12;

      // Divider
      drawLine(ctx, padding, y, width - padding, y, 3);
      y += 20;

      // QR Code (will be converted to bitmap)
      const qrImg = await loadImage(qrcode);
      if (qrImg) {
        const qrSize = 120;
        ctx.drawImage(qrImg, (width - qrSize) / 2, y, qrSize, qrSize);
        y += qrSize + 16;
      }

      // Thank you message (Khmer)
      ctx.font = 'bold 20px Arial, "Noto Sans Khmer", sans-serif';
      ctx.fillText('សូមអរគុណ!', width / 2, y);
      y += lineHeight;
      ctx.fillText('សូមអញ្ជើញមកម្តងទៀត!', width / 2, y);
      y += lineHeight + 20;

      // Create final canvas with exact height
      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = width;
      finalCanvas.height = y;
      const finalCtx = finalCanvas.getContext('2d');
      
      // Fill white background
      finalCtx.fillStyle = '#ffffff';
      finalCtx.fillRect(0, 0, width, y);
      
      // Draw the receipt
      finalCtx.drawImage(canvas, 0, 0);

      // Convert to monochrome bitmap (1-bit black & white)
      const imageData = finalCtx.getImageData(0, 0, width, y);
      const monochromeData = convertToMonochrome(imageData, width, y);
      finalCtx.putImageData(monochromeData, 0, 0);

      // Convert to high-quality PNG
      const dataURL = finalCanvas.toDataURL('image/png', 1.0);
      resolve(dataURL);

    } catch (error) {
      reject(error);
    }
  });
};