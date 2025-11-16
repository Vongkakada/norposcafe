// src/data/stockData.js
// Initialize stock data structure with default quantities

export const initializeStock = (menuData) => {
    // Return empty stock - users will add items manually
    return {};
};

// Export stock data to CSV
export const exportStockToCSV = (stockData) => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ឈ្មោះទំនិញ (Khmer),ឈ្មោះទំនិញ (English),ប្រភេទ,តម្លៃ (KHR),ចំនួនស្តុក,ថ្ងៃលើបច្ចុប្បន្ន\r\n";
    
    Object.values(stockData).forEach(item => {
        const lastUpdated = new Date(item.lastUpdated).toLocaleDateString('km-KH');
        const row = [
            `"${item.khmerName}"`,
            `"${item.englishName}"`,
            `"${item.category}"`,
            item.priceKHR,
            item.quantity,
            lastUpdated
        ];
        csvContent += row.join(",") + "\r\n";
    });
    
    return csvContent;
};

// Export stock data to JSON
export const exportStockToJSON = (stockData) => {
    return JSON.stringify(stockData, null, 2);
};

// Import stock data from CSV
export const importStockFromCSV = (csvText) => {
    const lines = csvText.trim().split('\n');
    const stock = {};
    
    // Skip header row
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;
        
        // Simple CSV parsing (handles quoted fields)
        const matches = line.match(/"([^"]*)"|([^,]+)/g);
        if (!matches || matches.length < 5) continue;
        
        const khmerName = matches[0].replace(/^"|"$/g, '');
        const englishName = matches[1].replace(/^"|"$/g, '');
        const category = matches[2].replace(/^"|"$/g, '');
        const priceKHR = parseInt(matches[3]) || 0;
        const quantity = parseInt(matches[4]) || 0;
        
        const key = `${khmerName}_${category}`;
        stock[key] = {
            khmerName,
            englishName,
            category,
            priceKHR,
            quantity,
            lastUpdated: new Date().toISOString(),
        };
    }
    
    return stock;
};

// Import stock data from JSON
export const importStockFromJSON = (jsonText) => {
    try {
        const stock = JSON.parse(jsonText);
        // Validate structure
        Object.values(stock).forEach(item => {
            if (!item.khmerName || !item.category || typeof item.quantity !== 'number') {
                throw new Error('Invalid stock data structure');
            }
        });
        return stock;
    } catch (error) {
        throw new Error('Invalid JSON format: ' + error.message);
    }
};
