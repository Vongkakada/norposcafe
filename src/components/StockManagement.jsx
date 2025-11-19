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
            return dateB - dateA;
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

        const excelData = Object.values(stockData).map(item => ({
            'ឈ្មោះទំនិញ (ខ្មែរ)': item.khmerName,
            'ឈ្មោះទំនិញ (អង់គ្លេស)': item.englishName || '-',
            'ប្រភេទ': item.category,
            'តម្លៃ (KHR)': item.priceKHR,
            'ចំនួនស្តុក': item.quantity,
            'ថ្ងៃខែឆ្នាំ': item.lastUpdated || new Date().toISOString(),
        }));

        const worksheet = XLSX.utils.json_to_sheet(excelData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock');

        const colWidths = [
            { wch: 20 },
            { wch: 20 },
            { wch: 15 },
            { wch: 12 },
            { wch: 12 },
            { wch: 20 }
        ];
        worksheet['!cols'] = colWidths;

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
            <style>{`
                .add-item-form {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 12px;
                    margin-top: 16px;
                    box-shadow: 0 8px 24px rgba(102, 126, 234, 0.25);
                    overflow: hidden;
                    animation: slideDown 0.3s ease-out;
                    max-width: 600px;
                    margin-left: auto;
                    margin-right: auto;
                }

                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .form-header {
                    background: rgba(255, 255, 255, 0.15);
                    backdrop-filter: blur(10px);
                    padding: 16px 20px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
                }

                .form-header h3 {
                    margin: 0 0 4px 0;
                    color: white;
                    font-size: 18px;
                    font-weight: 700;
                }

                .form-subtitle {
                    margin: 0;
                    color: rgba(255, 255, 255, 0.9);
                    font-size: 13px;
                }

                .form-body {
                    padding: 20px;
                    background: white;
                }

                .form-group {
                    margin-bottom: 16px;
                }

                .form-group.full-width {
                    width: 100%;
                }

                .form-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 16px;
                }

                .form-label {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    margin-bottom: 6px;
                    color: #374151;
                    font-weight: 600;
                    font-size: 13px;
                }

                .label-icon {
                    font-size: 14px;
                }

                .required {
                    color: #ef4444;
                    font-weight: bold;
                }

                .form-input {
                    width: 100%;
                    padding: 10px 14px;
                    border: 2px solid #e5e7eb;
                    border-radius: 8px;
                    font-size: 14px;
                    transition: all 0.3s ease;
                    background: #f9fafb;
                    box-sizing: border-box;
                }

                .form-input:focus {
                    outline: none;
                    border-color: #667eea;
                    background: white;
                    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
                }

                .form-input::placeholder {
                    color: #9ca3af;
                }

                .form-actions {
                    display: flex;
                    gap: 10px;
                    padding: 16px 20px;
                    background: #f9fafb;
                    border-top: 1px solid #e5e7eb;
                }

                .btn-submit,
                .btn-cancel {
                    flex: 1;
                    padding: 12px 20px;
                    border: none;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                }

                .btn-submit {
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    color: white;
                    box-shadow: 0 3px 10px rgba(16, 185, 129, 0.3);
                }

                .btn-submit:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 5px 16px rgba(16, 185, 129, 0.4);
                }

                .btn-submit:active {
                    transform: translateY(0);
                }

                .btn-cancel {
                    background: white;
                    color: #6b7280;
                    border: 2px solid #e5e7eb;
                }

                .btn-cancel:hover {
                    background: #f3f4f6;
                    border-color: #d1d5db;
                }

                .btn-icon {
                    font-size: 16px;
                    font-weight: bold;
                }

                .btn-add-item {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 10px 20px;
                    border: none;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 3px 10px rgba(102, 126, 234, 0.3);
                }

                .btn-add-item:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 5px 16px rgba(102, 126, 234, 0.4);
                }

                .btn-add-item.active {
                    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                    box-shadow: 0 3px 10px rgba(239, 68, 68, 0.3);
                }

                .btn-export {
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    color: white;
                    padding: 10px 20px;
                    border: none;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 3px 10px rgba(16, 185, 129, 0.3);
                }

                .btn-export:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 5px 16px rgba(16, 185, 129, 0.4);
                }

                @media (max-width: 768px) {
                    .form-row {
                        grid-template-columns: 1fr;
                    }
                    
                    .add-item-form {
                        max-width: 100%;
                    }
                }
            `}</style>

            <h2>គ្រប់គ្រងស្តុក</h2>

            <div className="stock-controls">
                <div className="stock-actions">
                    <button onClick={handleExportExcel} className="btn-export">
                        📊 ទាញទិន្នន័យជា Excel
                    </button>
                    <button 
                        onClick={() => setShowAddForm(!showAddForm)} 
                        className={`btn-add-item ${showAddForm ? 'active' : ''}`}
                    >
                        {showAddForm ? '✕ បិទទម្រង់' : '➕ បន្ថែមទំនិញថ្មី'}
                    </button>
                </div>

                {showAddForm && (
                    <div className="add-item-form">
                        <div className="form-header">
                            <h3>➕ បន្ថែមទំនិញថ្មី</h3>
                            <p className="form-subtitle">បំពេញព័ត៌មានទំនិញខាងក្រោម</p>
                        </div>

                        <div className="form-body">
                            <div className="form-group full-width">
                                <label className="form-label">
                                    <span className="label-icon">🏷️</span>
                                    ឈ្មោះទំនិញ
                                    <span className="required">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={newStockItem.khmerName}
                                    onChange={(e) => setNewStockItem({...newStockItem, khmerName: e.target.value})}
                                    placeholder="ឧ. កាហ្វេខ្មៅ, កូកា..."
                                    className="form-input"
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">
                                        <span className="label-icon">📦</span>
                                        ចំនួនស្តុក
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={newStockItem.quantity || ''}
                                        onChange={(e) => setNewStockItem({...newStockItem, quantity: parseInt(e.target.value) || 0})}
                                        placeholder="0"
                                        className="form-input"
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">
                                        <span className="label-icon">💵</span>
                                        តម្លៃ (KHR)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={newStockItem.priceKHR || ''}
                                        onChange={(e) => setNewStockItem({...newStockItem, priceKHR: parseFloat(e.target.value) || 0})}
                                        placeholder="0"
                                        className="form-input"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="form-actions">
                            <button
                                onClick={() => {
                                    setShowAddForm(false);
                                    setNewStockItem({ khmerName: '', englishName: '', category: 'COLD DRINKS', priceKHR: 0, quantity: 0 });
                                }}
                                className="btn-cancel"
                            >
                                <span className="btn-icon">✕</span>
                                បោះបង់
                            </button>
                            <button onClick={handleAddNewItem} className="btn-submit">
                                <span className="btn-icon">✓</span>
                                បន្ថែមទំនិញ
                            </button>

                        </div>
                    </div>
                )}
            </div>

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
                                            🗑️
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