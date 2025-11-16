// src/components/StockManagement.jsx
import React, { useState } from 'react';
import * as XLSX from 'xlsx';

function StockManagement({ stockData, onUpdateStock }) {
    const [showAddForm, setShowAddForm] = useState(false);
    const [newStockItem, setNewStockItem] = useState({
        khmerName: '',
        englishName: '',
        category: 'COLD DRINKS',
        priceKHR: 0,
        quantity: 0,
        });

 
    
    // Filter out items with zero quantity and sort by lastUpdated (newest first)
    const filteredStock = Object.values(stockData)
        .filter(item => item.quantity > 0)
        .sort((a, b) => {
            const dateA = new Date(a.lastUpdated || 0).getTime();
            const dateB = new Date(b.lastUpdated || 0).getTime();
            return dateB - dateA; // Newest first
        });

    const formatDateTime = (dateString) => {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `${day}/${month}/${year} ${hours}:${minutes}`;
        } catch (error) {
            return '-';
        }
    };

    const handleExportExcel = () => {
        if (Object.keys(stockData).length === 0) {
            alert('មិនមានទិន្នន័យដែលត្រូវលុប។');
            return;
        }

        // Prepare data for Excel
        const excelData = Object.values(stockData).map(item => ({
            'ឈ្មោះទំនិញ (ខ្មែរ)': item.khmerName,
            'ឈ្មោះទំនិញ (អង់គ្លេស)': item.englishName || '-',
            'ប្រភេទ': item.category,
            'តម្លៃ (KHR)': item.priceKHR,
            'ចំនួនស្តុក': item.quantity,
            'ថ្ងៃខែឆ្នាំ': item.lastUpdated || new Date().toISOString(),
        }));

        // Create worksheet and workbook
        const worksheet = XLSX.utils.json_to_sheet(excelData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock');

        // Set column widths
        const colWidths = [
            { wch: 20 },
            { wch: 20 },
            { wch: 15 },
            { wch: 12 },
            { wch: 12 },
            { wch: 20 }
        ];
        worksheet['!cols'] = colWidths;

        // Write to file
        XLSX.writeFile(workbook, `stock_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const handleUpdateQuantity = (key, newQuantity) => {
        const stock = Object.values(stockData).find(item => 
            `${item.khmerName}_${item.category}` === key
        );
        
        if (stock) {
            const updatedStock = {
                ...stockData,
                [key]: {
                    ...stock,
                    quantity: Math.max(0, newQuantity),
                    lastUpdated: new Date().toISOString(),
                }
            };
            onUpdateStock(updatedStock);
        }
    };

    const handleAddNewItem = async () => {
        if (!newStockItem.khmerName.trim()) {
            alert('សូមបញ្ចូលឈ្មោះទំនិញ');
            return;
        }

        const key = `${newStockItem.khmerName}_${newStockItem.category}`;
        const updatedStock = {
            ...stockData,
            [key]: {
                khmerName: newStockItem.khmerName,
                englishName: newStockItem.englishName,
                category: newStockItem.category,
                priceKHR: newStockItem.priceKHR,
                quantity: newStockItem.quantity,
                lastUpdated: new Date().toISOString(),
            }
        };
        
        onUpdateStock(updatedStock);
        
        setNewStockItem({
            khmerName: '',
            englishName: '',
            category: 'COLD DRINKS',
            priceKHR: 0,
            quantity: 0,
        });
        setShowAddForm(false);
        alert('ទំនិញថ្មីបានបន្ថែមដោយជោគជ័យ!');
    };

    const handleDeleteItem = (key) => {
        const confirmDelete = window.confirm('តើអ្នកពិតជាចង់លុបទំនិញនេះទេ?');
        if (!confirmDelete) return;

        const updatedStock = { ...stockData };
        delete updatedStock[key];
        onUpdateStock(updatedStock);
        alert('ទំនិញបានលុបចេញ!');
    };
    
    return (
        <div className="stock-management-panel">
            <h2>គ្រប់គ្រងស្តុក</h2>

            {/* Import/Export Controls */}
            <div className="stock-controls">
                <div className="stock-actions">
                    <button onClick={handleExportExcel} className="btn-export">ទាញទិន្នន័យជា Excel</button>
                    <button onClick={() => setShowAddForm(!showAddForm)} className="btn-add-item">➕ បន្ថែមទំនិញថ្មី</button>
                </div>

                {/* Add New Item Button - moved here */}
                {/* Add New Item Form */}
                {showAddForm && (
                    <div className="add-item-form">
                        <h3>បន្ថែមទំនិញថ្មី</h3>
                        <div className="form-row">
                            <div className="form-group">
                                <label>ឈ្មោះទំនិញ</label>
                                <input
                                    type="text"
                                    value={newStockItem.khmerName}
                                    onChange={(e) => setNewStockItem({...newStockItem, khmerName: e.target.value})}
                                    placeholder="ឧ. កាហ្វេ"
                                    className="form-input"
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>ចំនួនស្តុក:</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={newStockItem.quantity}
                                    onChange={(e) => setNewStockItem({...newStockItem, quantity: parseInt(e.target.value) || 0})}
                                    placeholder="0"
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <label>តម្លៃ (KHR):</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={newStockItem.priceKHR}
                                    onChange={(e) => setNewStockItem({...newStockItem, priceKHR: parseFloat(e.target.value) || 0})}
                                    placeholder="0"
                                    className="form-input"
                                />
                            </div>
                        </div>

                        <div className="form-actions">
                            <button
                                onClick={handleAddNewItem}
                                className="btn-submit"
                            >
                                ➕ បន្ថែម
                            </button>
                            <button
                                onClick={() => {
                                    setShowAddForm(false);
                                    setNewStockItem({ khmerName: '', englishName: '', category: 'COLD DRINKS', priceKHR: 0, quantity: 0 });
                                }}
                                className="btn-cancel"
                            >
                                បោះបង់
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Stock Table */}
            {filteredStock.length > 0 ? (
                <table className="stock-table">
                    <thead>
                        <tr>
                            <th>ឈ្មោះទំនិញ (ខ្មែរ)</th>
                            <th className="number-cell">តម្លៃ (KHR)</th>
                            <th className="number-cell">ចំនួនស្តុក</th>
                            <th>ថ្ងៃខែឆ្នាំ ម៉ោង</th>
                            <th>សកម្មភាព</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredStock.map(item => {
                            const key = `${item.khmerName}_${item.category}`;
                            return (
                                <tr key={key}>
                                    <td data-label="ឈ្មោះទំនិញ">{item.khmerName}</td>
                                    <td className="number-cell" data-label="តម្លៃ (KHR)">{item.priceKHR.toLocaleString()}</td>
                                    <td className="number-cell" data-label="ចំនួនស្តុក">
                                        <input
                                            type="number"
                                            min="0"
                                            value={item.quantity}
                                            onChange={(e) => handleUpdateQuantity(key, parseInt(e.target.value) || 0)}
                                            className="stock-input"
                                        />
                                    </td>
                                    <td data-label="ថ្ងៃខែឆ្នាំ">{formatDateTime(item.lastUpdated)}</td>
                                    <td data-label="សកម្មភាព">
                                        <button
                                            onClick={() => handleUpdateQuantity(key, Math.max(0, item.quantity - 1))}
                                            className="btn-adjust"
                                            title="ថយចុះ"
                                        >
                                            -
                                        </button>
                                        <button
                                            onClick={() => handleUpdateQuantity(key, item.quantity + 1)}
                                            className="btn-adjust"
                                            title="កើនឡើង"
                                        >
                                            +
                                        </button>
                                        <button
                                            onClick={() => handleDeleteItem(key)}
                                            className="btn-delete-item"
                                            title="លុបទំនិញ"
                                        >
                                            🗑️ លុប
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            ) : (
                <p>មិនមានទិន្នន័យស្តុក។</p>
            )}
        </div>
    );
}

export default StockManagement;
