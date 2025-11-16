import { formatKHR, KHR_SYMBOL } from './formatters';

const SHOP_STATIC_DETAILS = {
  address: "ផ្ទះលេខ 137 , ផ្លូវ 223, កំពង់ចាម",
  tel: "016 438 555 / 061 91 4444",
};

// =========================================================
// ESC/POS COMMANDS (ប្រើសម្រាប់ការកំណត់ទ្រង់ទ្រាយអក្សរ)
// RawBT នឹងបកប្រែអក្សរខ្មែរ ហើយបញ្ជូនទៅ printer ជា bitmap
// \x1B, \x1D, \x1C, \x0A, etc., are ESC/POS codes
// =========================================================

// បញ្ហាត្រូវបានដោះស្រាយនៅទីនេះ
const CENTER = `${ESC}\x61\x01`; 
const LEFT = `${ESC}\x61\x00`;
const BOLD_ON = `${ESC}\x45\x01`; 
const BOLD_OFF = `${ESC}\x45\x00`;
const DOUBLE_HEIGHT_WIDTH = `${GS}\x21\x11`; 
const NORMAL_FONT = `${GS}\x21\x00`;
const CUT_PAPER = `${GS}\x56\x01`;

const LINE = '----------------------------------------\n'; 

/**
 * បង្កើត String វិក័យបត្រជាទ្រង់ទ្រាយ Raw Text (ESC/POS)
 * @param {Array} order បញ្ជីទំនិញ
 * @param {string} orderId លេខវិក័យបត្រ
 * @param {string} shopName ឈ្មោះហាង
 * @returns {string} Raw text data 
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
    
    // បង្កើតបន្ទាត់ដោយដាក់ចន្លោះ (Padding) ដើម្បីតម្រឹមអក្សរ
    let name = item.khmerName.substring(0, 20); // កំណត់អក្សរត្រឹម 20 តួ
    let qty = String(item.quantity);
    
    // គណនា padding (សន្មត់ 40 តួអក្សរក្នុងមួយជួរសម្រាប់ Font ធម្មតា)
    let paddingLength = 40 - name.length - qty.length - formattedTotal.length;
    let padding = ' '.repeat(paddingLength > 0 ? paddingLength : 1);

    output += `${name}${padding}${qty}  ${formattedTotal}\n`;
  });
  
  output += LINE;

  // 3. TOTAL
  output += CENTER;
  output += DOUBLE_HEIGHT_WIDTH; // ពង្រីកអក្សរធំ
  output += `សរុប: ${KHR_SYMBOL}${formatKHR(totalKHR)}\n`;
  output += NORMAL_FONT;
  
  // 4. FOOTER
  output += CENTER;
  output += '\n'; // ដាក់បន្ទាត់ទំនេរ
  output += 'សូមអរគុណ! សូមអញ្ជើញមកម្តងទៀត!\n';
  output += '\n\n\n'; // ដាក់ចន្លោះដើម្បីកាត់ក្រដាស
  output += CUT_PAPER;
  
  return output;
}

/**
 * បង្កើត RawBT Intent URL សម្រាប់ការបោះពុម្ព
 * @param {string} rawData Raw ESC/POS text
 * @returns {string} Intent URL
 */
export function generateRawBTUrl(order, orderId, shopName) {
  const rawText = generateRawReceipt(order, orderId, shopName);
  
  // ត្រូវបម្លែង Raw Text ទៅជា Base64 encoded string
  // Note: នៅក្នុង browsers មួយចំនួន (esp. mobile), btoa() អាចមានបញ្ហាជាមួយ Unicode (Khmer).
  // ដំណោះស្រាយល្អបំផុតគឺត្រូវប្រើ TextEncoder/btoa combination ឬ library ដូចជា base64-js.
  
  // សម្រាប់ភាពងាយស្រួល, យើងប្រើ btoa() សន្មតថាមិនមានតួអក្សរក្រៅ ASCII នៅក្នុង ESC codes
  // ប៉ុន្តែ RawBT ត្រូវការ Base64 នៃ UTF-8 encoded data សម្រាប់ការគាំទ្រ Unicode (Khmer)។

  const utf8Encoder = new TextEncoder();
  const utf8Bytes = utf8Encoder.encode(rawText);
  
  // Function to convert Uint8Array to Base64 String
  const base64 = btoa(String.fromCharCode.apply(null, utf8Bytes));

  // RawBT Intent URL Format (Android specific)
  const intentUrl = `intent:#Intent;action=ru.a402d.rawbt.action.PRINT_DATA;package=ru.a402d.rawbt;data=${base64};type=text/plain;end`;
  
  return intentUrl;
}