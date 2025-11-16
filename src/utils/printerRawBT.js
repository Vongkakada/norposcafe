// src/utils/printerRawBT.js

import { formatKHR, KHR_SYMBOL } from './formatters';

const SHOP_STATIC_DETAILS = {
  address: "ផ្ទះលេខ 137 , ផ្លូវ 223, កំពង់ចាម",
  tel: "016 438 555 / 061 91 4444",
};

// =========================================================
// ESC/POS COMMANDS (ប្រកាសអថេរមូលដ្ឋានមុនគេ)
// =========================================================
const ESC = '\x1B';
const GS = '\x1D';

const CENTER = `${ESC}\x61\x01`; 
const LEFT = `${ESC}\x61\x00`;
const BOLD_ON = `${ESC}\x45\x01`; 
const BOLD_OFF = `${ESC}\x45\x00`;
const DOUBLE_HEIGHT_WIDTH = `${GS}\x21\x11`; 
const NORMAL_FONT = `${GS}\x21\x00`;
const CUT_PAPER = `${GS}\x56\x01`;

const LINE = '----------------------------------------\n'; // 40 dashes for 80mm printer

/**
 * បង្កើត String វិក័យបត្រជាទ្រង់ទ្រាយ Raw Text (ESC/POS)
 */
function generateRawReceipt(order, orderId, shopName) {
  const now = new Date();
  const totalKHR = order.reduce(
    (sum, item) => sum + (item.priceKHR || item.priceUSD || 0) * item.quantity,
    0
  );
  
  let output = '';

  // 1. HEADER
  output += CENTER;
  output += NORMAL_FONT;
  output += BOLD_ON + shopName + BOLD_OFF + '\n';
  output += SHOP_STATIC_DETAILS.address + '\n';
  output += `Tel: ${SHOP_STATIC_DETAILS.tel}\n`;
  output += `Invoice: #${orderId}\n`;
  output += `${now.toLocaleDateString('km-KH')} ${now.toLocaleTimeString('km-KH')}\n`;
  
  output += LEFT;
  output += LINE;

  // 2. ITEMS TABLE
  output += `ទំនិញ                 Qty  តម្លៃសរុប\n`;
  output += LINE;
  
  order.forEach(item => {
    const itemTotal = (item.priceKHR || item.priceUSD) * item.quantity;
    const formattedTotal = `${KHR_SYMBOL}${formatKHR(itemTotal)}`;
    
    // Logic សម្រាប់ Padding (តម្រឹម)
    let name = item.khmerName.substring(0, 20); 
    let qty = String(item.quantity);
    
    // គណនា padding (សន្មត់ 40 តួអក្សរក្នុងមួយជួរ)
    let paddingLength = 40 - name.length - qty.length - formattedTotal.length - 2; // -2 for spacing
    let padding = ' '.repeat(paddingLength > 0 ? paddingLength : 1);

    output += `${name}${padding}${qty}  ${formattedTotal}\n`;
  });
  
  output += LINE;

  // 3. TOTAL
  output += CENTER;
  output += DOUBLE_HEIGHT_WIDTH; 
  output += `សរុប: ${KHR_SYMBOL}${formatKHR(totalKHR)}\n`;
  output += NORMAL_FONT;
  
  // 4. FOOTER
  output += CENTER;
  output += '\n'; 
  output += 'សូមអរគុណ! សូមអញ្ជើញមកម្តងទៀត!\n';
  output += '\n\n\n'; 
  output += CUT_PAPER;
  
  return output;
}

/**
 * បង្កើត RawBT Intent URL សម្រាប់ការបោះពុម្ព
 */
export function generateRawBTUrl(order, orderId, shopName) {
  const rawText = generateRawReceipt(order, orderId, shopName);
  
  // Base64 encoding នៃទិន្នន័យ UTF-8 (ចាំបាច់សម្រាប់ RawBT ដើម្បីគាំទ្រអក្សរខ្មែរ)
  const utf8Encoder = new TextEncoder();
  const utf8Bytes = utf8Encoder.encode(rawText);
  
  // Convert Uint8Array to Base64 String
  const base64 = btoa(String.fromCharCode.apply(null, utf8Bytes));

  // RawBT Intent URL Format
  const intentUrl = `intent:#Intent;action=ru.a402d.rawbt.action.PRINT_DATA;package=ru.a402d.rawbt;data=${base64};type=text/plain;end`;
  
  return intentUrl;
}