// src/utils/escposBitmapPrinter.js
import { KHR_SYMBOL, formatKHR } from './formatters';
import logo from '../assets/logo.png';
import qrcode from '../assets/qrcode.jpg';

const SHOP_STATIC_DETAILS = {
  address: "ផ្ទះលេខ 137 , ផ្លូវ 223, កំពង់ចាម",
  tel: "016 438 555 / 061 91 4444",
};

// ESC/POS Commands
const ESC = '\x1B';
const GS = '\x1D';

const CMD = {
  INIT: `${ESC}@`,
  ALIGN_CENTER: `${ESC}a1`,
  ALIGN_LEFT: `${ESC}a0`,
  FEED_LINE: '\n',
  CUT_PAPER: `${GS}V1`,
};

const loadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
};

/**
 * Convert canvas to monochrome bitmap
 */
const convertToMonochrome = (imageData, width, height) => {
  const data = imageData.data;
  const threshold = 128;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const gray = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
      const newGray = gray < threshold ? 0 : 255;
      data[idx] = data[idx + 1] = data[idx + 2] = newGray;
    }
  }
  
  return imageData;
};

/**
 * Convert bitmap to ESC/POS raster format
 */
const imageDataToRaster = (imageData, width, height) => {
  const bytesPerLine = Math.ceil(width / 8);
  const raster = new Uint8Array(bytesPerLine * height);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const pixel = imageData.data[idx]; // grayscale value
      
      if (pixel < 128) { // black pixel
        const byteIndex = y * bytesPerLine + Math.floor(x / 8);
        const bitIndex = 7 - (x % 8);
        raster[byteIndex] |= (1 << bitIndex);
      }
    }
  }
  
  return raster;
};

/**
 * Generate receipt as bitmap image
 */
const generateReceiptCanvas = async ({ shopName, orderId, order, totalKHR }) => {
  return new Promise(async (resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // 384px width for 58mm printer (8 dots/mm * 58mm = 464, but 384 is standard)
      const width = 384;
      const padding = 16;
      const lineHeight = 24;
      let y = padding;

      let estimatedHeight = 
        80 + // logo
        lineHeight * 7 + 
        order.length * lineHeight * 2.5 + 
        lineHeight * 3 + 
        120 + // QR
        lineHeight * 2 + 
        padding * 2;

      canvas.width = width;
      canvas.height = estimatedHeight;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, canvas.height);
      ctx.fillStyle = '#000000';

      // Logo
      const logoImg = await loadImage(logo);
      if (logoImg) {
        const logoSize = 60;
        ctx.drawImage(logoImg, (width - logoSize) / 2, y, logoSize, logoSize);
        y += logoSize + 8;
      }

      // Shop name
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(shopName, width / 2, y);
      y += lineHeight;

      // Address
      ctx.font = '14px Arial';
      ctx.fillText(SHOP_STATIC_DETAILS.address, width / 2, y);
      y += lineHeight;
      ctx.font = '12px Arial';
      ctx.fillText(`Tel: ${SHOP_STATIC_DETAILS.tel}`, width / 2, y);
      y += lineHeight;

      // Date
      const now = new Date();
      ctx.font = '11px Arial';
      ctx.fillText(`${now.toLocaleDateString()} ${now.toLocaleTimeString()}`, width / 2, y);
      y += lineHeight;
      ctx.font = 'bold 13px Arial';
      ctx.fillText(`Invoice #${orderId}`, width / 2, y);
      y += lineHeight + 4;

      // Line
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.stroke();
      y += 8;

      // Items
      ctx.textAlign = 'left';
      ctx.font = 'bold 13px Arial';
      order.forEach((item) => {
        const khmerName = item.khmerName || '';
        ctx.fillText(khmerName, padding, y);
        y += lineHeight;
        
        ctx.font = '11px Arial';
        const englishName = item.englishName || '';
        const itemTotal = (item.priceKHR || item.priceUSD || 0) * item.quantity;
        const line = `${englishName} x${item.quantity}`;
        ctx.fillText(line, padding + 4, y);
        
        const price = `${KHR_SYMBOL}${formatKHR(itemTotal)}`;
        ctx.textAlign = 'right';
        ctx.fillText(price, width - padding, y);
        ctx.textAlign = 'left';
        
        y += lineHeight;
        ctx.font = 'bold 13px Arial';
      });

      // Line
      y += 4;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
      y += 16;

      // Total
      ctx.textAlign = 'center';
      ctx.font = 'bold 18px Arial';
      ctx.fillText('TOTAL', width / 2, y);
      y += lineHeight;
      ctx.font = 'bold 24px Arial';
      ctx.fillText(`${KHR_SYMBOL}${formatKHR(totalKHR)}`, width / 2, y);
      y += lineHeight + 8;

      // Line
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
      y += 12;

      // QR Code
      const qrImg = await loadImage(qrcode);
      if (qrImg) {
        const qrSize = 100;
        ctx.drawImage(qrImg, (width - qrSize) / 2, y, qrSize, qrSize);
        y += qrSize + 12;
      }

      // Thank you
      ctx.font = '14px Arial';
      ctx.fillText('សូមអរគុណ!', width / 2, y);
      y += lineHeight;
      ctx.fillText('សូមអញ្ជើញមកម្តងទៀត!', width / 2, y);
      y += lineHeight + 16;

      // Final canvas
      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = width;
      finalCanvas.height = y;
      const finalCtx = finalCanvas.getContext('2d');
      finalCtx.fillStyle = '#ffffff';
      finalCtx.fillRect(0, 0, width, y);
      finalCtx.drawImage(canvas, 0, 0);

      // Convert to monochrome
      const imageData = finalCtx.getImageData(0, 0, width, y);
      const monoData = convertToMonochrome(imageData, width, y);
      finalCtx.putImageData(monoData, 0, 0);

      resolve({ canvas: finalCanvas, width, height: y });

    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generate ESC/POS commands with bitmap raster data
 */
export const generateESCPOSWithBitmap = async (receiptData) => {
  try {
    // Generate canvas
    const { canvas, width, height } = await generateReceiptCanvas(receiptData);
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, width, height);
    
    // Convert to raster
    const rasterData = imageDataToRaster(imageData, width, height);
    
    // Build ESC/POS command string
    let commands = '';
    
    // Initialize printer
    commands += CMD.INIT;
    commands += CMD.ALIGN_CENTER;
    
    // ESC/POS bitmap command: ESC * m nL nH [data]
    // m = mode (0=normal, 1=double width, 32=double height, 33=quad)
    const bytesPerLine = Math.ceil(width / 8);
    const nL = bytesPerLine & 0xFF;
    const nH = (bytesPerLine >> 8) & 0xFF;
    
    // Send image line by line
    for (let y = 0; y < height; y++) {
      const lineStart = y * bytesPerLine;
      const lineEnd = lineStart + bytesPerLine;
      const lineData = rasterData.slice(lineStart, lineEnd);
      
      // ESC * 0 nL nH [line data]
      commands += ESC + '*' + String.fromCharCode(0, nL, nH);
      commands += String.fromCharCode(...lineData);
      commands += CMD.FEED_LINE;
    }
    
    // Feed and cut
    commands += '\n\n\n';
    commands += CMD.CUT_PAPER;
    
    return commands;
    
  } catch (error) {
    console.error('Error generating ESC/POS bitmap:', error);
    throw error;
  }
};

/**
 * Print to RawBT with ESC/POS bitmap
 */
export const printBitmapViaRawBT = async (receiptData) => {
  try {
    const escposCommands = await generateESCPOSWithBitmap(receiptData);
    const encodedCommands = encodeURIComponent(escposCommands);
    window.location.href = `rawbt:${encodedCommands}`;
    return { success: true };
  } catch (error) {
    console.error('RawBT print error:', error);
    throw error;
  }
};