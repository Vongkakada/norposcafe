// src/utils/escposPrinter.js
import { KHR_SYMBOL, formatKHR } from './formatters';

const SHOP_STATIC_DETAILS = {
  address: "ផ្ទះលេខ 137 , ផ្លូវ 223, កំពង់ចាម",
  tel: "016 438 555 / 061 91 4444",
};

// ESC/POS Commands for thermal printer
const ESC = '\x1B';
const GS = '\x1D';

const CMD = {
  INIT: `${ESC}@`,                    // Initialize printer
  ALIGN_CENTER: `${ESC}a1`,           // Center align
  ALIGN_LEFT: `${ESC}a0`,             // Left align
  ALIGN_RIGHT: `${ESC}a2`,            // Right align
  BOLD_ON: `${ESC}E1`,                // Bold on
  BOLD_OFF: `${ESC}E0`,               // Bold off
  UNDERLINE_ON: `${ESC}-1`,           // Underline on
  UNDERLINE_OFF: `${ESC}-0`,          // Underline off
  SIZE_NORMAL: `${GS}!0`,             // Normal size
  SIZE_DOUBLE_HEIGHT: `${GS}!1`,      // Double height
  SIZE_DOUBLE_WIDTH: `${GS}!16`,      // Double width
  SIZE_DOUBLE: `${GS}!17`,            // Double height + width
  SIZE_LARGE: `${GS}!34`,             // Large (3x height, 2x width)
  FEED_LINE: '\n',                     // Line feed
  FEED_3_LINES: '\n\n\n',             // Feed 3 lines
  CUT_PAPER: `${GS}V1`,               // Cut paper (partial)
  CUT_PAPER_FULL: `${GS}VA0`,         // Cut paper (full)
};

/**
 * Generate ESC/POS commands for receipt
 * This is the BEST method for thermal printers - NO BLUR, crisp text
 */
export function generateESCPOSCommands({ shopName, orderId, order, totalKHR }) {
  let receipt = '';
  
  // Initialize printer
  receipt += CMD.INIT;
  
  // ==================== HEADER ====================
  // Shop Logo (using text art - optional)
  receipt += CMD.ALIGN_CENTER;
  receipt += CMD.SIZE_DOUBLE;
  receipt += '🏪\n';
  receipt += CMD.SIZE_NORMAL;
  
  // Shop Name (large, bold, centered)
  receipt += CMD.BOLD_ON;
  receipt += CMD.SIZE_LARGE;
  receipt += shopName + '\n';
  receipt += CMD.SIZE_NORMAL;
  receipt += CMD.BOLD_OFF;
  
  // Address (centered, normal size)
  receipt += SHOP_STATIC_DETAILS.address + '\n';
  receipt += 'Tel: ' + SHOP_STATIC_DETAILS.tel + '\n';
  
  // Date and Time
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB');
  const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  receipt += dateStr + ' ' + timeStr + '\n';
  
  // Invoice number (bold)
  receipt += CMD.BOLD_ON;
  receipt += 'Invoice: #' + orderId + '\n';
  receipt += CMD.BOLD_OFF;
  
  // Separator line
  receipt += '--------------------------------\n';
  
  // ==================== ITEMS ====================
  receipt += CMD.ALIGN_LEFT;
  
  order.forEach((item) => {
    // Item name (Khmer, bold)
    receipt += CMD.BOLD_ON;
    receipt += item.khmerName + '\n';
    receipt += CMD.BOLD_OFF;
    
    // English name, quantity, and price
    const englishName = item.englishName || '';
    const qty = 'x' + item.quantity;
    const itemTotal = (item.priceKHR || item.priceUSD || 0) * item.quantity;
    const price = KHR_SYMBOL + formatKHR(itemTotal);
    
    // Format: "English Name x2        1,000៛"
    // Calculate spaces for alignment (48 chars for 80mm, 32 for 58mm)
    const lineWidth = 32; // Adjust based on your printer
    const leftPart = `  ${englishName} ${qty}`;
    const spacesNeeded = Math.max(1, lineWidth - leftPart.length - price.length);
    const line = leftPart + ' '.repeat(spacesNeeded) + price;
    
    receipt += line + '\n';
  });
  
  // Separator line
  receipt += '--------------------------------\n';
  
  // ==================== TOTAL ====================
  receipt += CMD.ALIGN_CENTER;
  receipt += CMD.BOLD_ON;
  receipt += CMD.SIZE_DOUBLE;
  receipt += 'TOTAL\n';
  receipt += KHR_SYMBOL + formatKHR(totalKHR) + '\n';
  receipt += CMD.SIZE_NORMAL;
  receipt += CMD.BOLD_OFF;
  
  // Separator line
  receipt += '--------------------------------\n';
  
  // ==================== QR CODE (optional) ====================
  // Note: QR code requires special ESC/POS commands
  // For simplicity, we'll add a text placeholder
  receipt += '\n[QR CODE PLACEHOLDER]\n\n';
  
  // ==================== FOOTER ====================
  receipt += 'សូមអរគុណ!\n';
  receipt += 'សូមអញ្ជើញមកម្តងទៀត!\n';
  
  // Feed paper and cut
  receipt += CMD.FEED_3_LINES;
  receipt += CMD.CUT_PAPER;
  
  return receipt;
}

/**
 * Method 1: Print via RawBT (Android app)
 * Most reliable for Android phones + Bluetooth thermal printers
 */
export function printViaRawBT(receiptData) {
  const escposText = generateESCPOSCommands(receiptData);
  
  // RawBT URL scheme - sends raw ESC/POS commands
  const encodedText = encodeURIComponent(escposText);
  window.location.href = `rawbt:${encodedText}`;
}

/**
 * Method 2: Print via Web Bluetooth API
 * Works on Chrome/Edge for direct Bluetooth printing
 */
export async function printViaWebBluetooth(receiptData) {
  try {
    // Check if Web Bluetooth is supported
    if (!navigator.bluetooth) {
      throw new Error('Bluetooth មិនគាំទ្រលើកម្មវិធីរុករករបស់អ្នកទេ។ សូមប្រើ Chrome ឬ Edge។');
    }

    // Request Bluetooth device (thermal printer)
    const device = await navigator.bluetooth.requestDevice({
      filters: [
        { namePrefix: 'Sawoo' },
        { namePrefix: 'LK-P34' },
        { namePrefix: 'BlueTooth Printer' },
        { namePrefix: 'MTP' },
        { namePrefix: 'RONGTA' },
        { namePrefix: 'RPP' }
      ],
      optionalServices: [
        '000018f0-0000-1000-8000-00805f9b34fb',  // Common printer service
        '49535343-fe7d-4ae5-8fa9-9fafd205e455'   // Alternative service UUID
      ]
    });

    console.log('Connected to:', device.name);

    // Connect to GATT server
    const server = await device.gatt.connect();
    
    // Try to get service and characteristic
    let characteristic;
    try {
      const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
      characteristic = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb');
    } catch (e) {
      // Try alternative UUID
      const service = await server.getPrimaryService('49535343-fe7d-4ae5-8fa9-9fafd205e455');
      characteristic = await service.getCharacteristic('49535343-8841-43f4-a8d4-ecbe34729bb3');
    }
    
    // Generate ESC/POS commands
    const escposText = generateESCPOSCommands(receiptData);
    
    // Convert string to bytes
    const encoder = new TextEncoder();
    const data = encoder.encode(escposText);
    
    // Send data in chunks (max 512 bytes per write for most printers)
    const chunkSize = 512;
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      await characteristic.writeValue(chunk);
      // Small delay between chunks to prevent buffer overflow
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    console.log('Print command sent successfully!');
    
    // Disconnect
    await device.gatt.disconnect();
    
    return { success: true, message: 'បោះពុម្ពបានជោគជ័យ!' };
    
  } catch (error) {
    console.error('Bluetooth printing error:', error);
    throw error;
  }
}

/**
 * Method 3: Print via TCP/IP (Network printer)
 * For WiFi-enabled thermal printers
 */
export async function printViaNetwork(receiptData, printerIP, printerPort = 9100) {
  // Note: This requires a backend server as browsers can't make raw TCP connections
  // You would need to send the ESC/POS commands to your server, which then forwards to printer
  
  const escposText = generateESCPOSCommands(receiptData);
  
  try {
    const response = await fetch('http://your-server.com/print', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        printerIP,
        printerPort,
        data: escposText
      })
    });
    
    if (!response.ok) {
      throw new Error('Network printing failed');
    }
    
    return { success: true, message: 'បោះពុម្ពបានជោគជ័យ!' };
  } catch (error) {
    console.error('Network printing error:', error);
    throw error;
  }
}

/**
 * Helper: Get plain text receipt (for testing/preview)
 */
export function generatePlainTextReceipt(receiptData) {
  const commands = generateESCPOSCommands(receiptData);
  // eslint-disable-next-line no-control-regex
  const withoutESC = commands.replace(/\x1B/g, ''); // Remove ESC
  // eslint-disable-next-line no-control-regex
  const withoutGS = withoutESC.replace(/\x1D/g, ''); // Remove GS
  // eslint-disable-next-line no-control-regex
  return withoutGS.replace(/[\x00-\x1F]/g, ''); // Remove other control chars
}