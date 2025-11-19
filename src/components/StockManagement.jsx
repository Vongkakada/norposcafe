// src/components/StockManagement.jsx
import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';

function StockManagement({ stockData, onUpdateStock, transactions = [], onAddTransaction }) {
    const [showAddForm, setShowAddForm] = useState(false);
    const [showTransactionForm, setShowTransactionForm] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [showDailyReport, setShowDailyReport] = useState(false);
    const [showItemDetail, setShowItemDetail] = useState(false);
    const [selectedItemDetail, setSelectedItemDetail] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [transactionType, setTransactionType] = useState('IN');
    const [selectedItem, setSelectedItem] = useState(null);
    const [transactionData, setTransactionData] = useState({
        quantity: 0,
        pricePerUnit: 0,
        note: ''
    });
    const [newStockItem, setNewStockItem] = useState({
        khmerName: '',
        category: 'COLD DRINKS',
        priceKHR: 0,
        quantity: 0,
        minStockAlert: 5
    });

    // Calculate daily statistics
    const getDailyStats = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        const todayTransactions = transactions.filter(txn => 
            txn.createdAt && txn.createdAt.startsWith(today)
        );

        const stockIn = todayTransactions
            .filter(t => t.type === 'IN')
            .reduce((sum, t) => sum + t.quantity, 0);

        const stockOut = todayTransactions
            .filter(t => t.type === 'OUT')
            .reduce((sum, t) => sum + t.quantity, 0);

        const revenue = todayTransactions
            .filter(t => t.type === 'OUT')
            .reduce((sum, t) => sum + t.totalAmount, 0);

        const expense = todayTransactions
            .filter(t => t.type === 'IN')
            .reduce((sum, t) => sum + t.totalAmount, 0);

        return { stockIn, stockOut, revenue, expense, todayTransactions };
    }, [transactions]);

    // Get item history
    const getItemHistory = (itemKey) => {
        return transactions
            .filter(txn => txn.itemKey === itemKey)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    };

    // Get item statistics
    const getItemStats = (itemKey) => {
        const history = getItemHistory(itemKey);
        const totalIn = history.filter(t => t.type === 'IN').reduce((s, t) => s + t.quantity, 0);
        const totalOut = history.filter(t => t.type === 'OUT').reduce((s, t) => s + t.quantity, 0);
        const totalRevenue = history.filter(t => t.type === 'OUT').reduce((s, t) => s + t.totalAmount, 0);
        const totalExpense = history.filter(t => t.type === 'IN').reduce((s, t) => s + t.totalAmount, 0);
        
        return { totalIn, totalOut, totalRevenue, totalExpense, transactionCount: history.length };
    };

    const handleOpenItemDetail = (item) => {
        setSelectedItemDetail(item);
        setShowItemDetail(true);
    };

    // Calculate stock movement for selected date
    const getDateStockMovement = (date) => {
        const dateTransactions = transactions.filter(txn => 
            txn.createdAt && txn.createdAt.startsWith(date)
        );

        const itemMovements = {};
        dateTransactions.forEach(txn => {
            if (!itemMovements[txn.itemKey]) {
                itemMovements[txn.itemKey] = {
                    itemName: txn.itemName,
                    stockIn: 0,
                    stockOut: 0,
                    opening: 0,
                    closing: 0
                };
            }
            if (txn.type === 'IN') {
                itemMovements[txn.itemKey].stockIn += txn.quantity;
            } else {
                itemMovements[txn.itemKey].stockOut += txn.quantity;
            }
        });

        return itemMovements;
    };

    const filteredStock = Object.values(stockData)
        .filter(item => item.quantity > 0)
        .sort((a, b) => new Date(b.lastUpdated || 0) - new Date(a.lastUpdated || 0));

    const lowStockItems = Object.values(stockData).filter(
        item => item.quantity > 0 && item.quantity <= (item.minStockAlert || 5)
    );

    const formatDateTime = (dateString) => {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `${day}/${month}/${year} ${hours}:${minutes}`;
        } catch (error) {
            return '-';
        }
    };

    const handleExportExcel = () => {
        if (Object.keys(stockData).length === 0) {
            alert('មិនមានទិន្នន័យដែលត្រូវនាំចេញ។');
            return;
        }

        const excelData = Object.values(stockData).map(item => {
            const key = `${item.khmerName}_${item.category}`;
            const history = getItemHistory(key);
            const todayTxn = history.filter(t => t.createdAt.startsWith(new Date().toISOString().split('T')[0]));
            const todayIn = todayTxn.filter(t => t.type === 'IN').reduce((s, t) => s + t.quantity, 0);
            const todayOut = todayTxn.filter(t => t.type === 'OUT').reduce((s, t) => s + t.quantity, 0);

            return {
                'ឈ្មោះទំនិញ': item.khmerName,
                'តម្លៃ (KHR)': item.priceKHR,
                'ទិញចូលថ្ងៃនេះ': todayIn,
                'លក់ចេញថ្ងៃនេះ': todayOut,
                'សល់ក្នុងស្តុក': item.quantity,
                'ស្តុកអប្បបរមា': item.minStockAlert || 5,
                'ថ្ងៃខែឆ្នាំ': formatDateTime(item.lastUpdated)
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(excelData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock');
        worksheet['!cols'] = [{ wch: 20 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 20 }];
        XLSX.writeFile(workbook, `stock_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const handleAddNewItem = () => {
        if (!newStockItem.khmerName.trim()) {
            alert('សូមបញ្ចូលឈ្មោះទំនិញ');
            return;
        }

        const key = `${newStockItem.khmerName}_${newStockItem.category}`;
        const updatedStock = {
            ...stockData,
            [key]: {
                ...newStockItem,
                lastUpdated: new Date().toISOString(),
            }
        };
        
        onUpdateStock(updatedStock);
        
        // Add initial stock transaction if quantity > 0
        if (newStockItem.quantity > 0 && onAddTransaction) {
            const transaction = {
                id: `txn_${Date.now()}`,
                itemKey: key,
                itemName: newStockItem.khmerName,
                type: 'IN',
                quantity: newStockItem.quantity,
                pricePerUnit: newStockItem.priceKHR,
                totalAmount: newStockItem.quantity * newStockItem.priceKHR,
                note: 'បន្ថែមទំនិញថ្មី - ស្តុកដំបូង',
                createdAt: new Date().toISOString()
            };
            onAddTransaction(transaction);
        }

        setNewStockItem({
            khmerName: '',
            category: 'COLD DRINKS',
            priceKHR: 0,
            quantity: 0,
            minStockAlert: 5
        });
        setShowAddForm(false);
        alert('ទំនិញថ្មីបានបន្ថែមដោយជោគជ័យ!');
    };

    const handleOpenTransaction = (item, type) => {
        setSelectedItem(item);
        setTransactionType(type);
        setTransactionData({
            quantity: 0,
            pricePerUnit: item.priceKHR,
            note: ''
        });
        setShowTransactionForm(true);
    };

    const handleSubmitTransaction = () => {
        if (!selectedItem || transactionData.quantity <= 0) {
            alert('សូមបញ្ចូលចំនួនត្រឹមត្រូវ');
            return;
        }

        const key = `${selectedItem.khmerName}_${selectedItem.category}`;
        let newQuantity = selectedItem.quantity;

        if (transactionType === 'IN') {
            newQuantity += transactionData.quantity;
        } else {
            if (transactionData.quantity > selectedItem.quantity) {
                alert(`ចំនួនលក់ចេញលើសពីស្តុក!\nស្តុកបច្ចុប្បន្ន: ${selectedItem.quantity}\nចង់លក់: ${transactionData.quantity}`);
                return;
            }
            newQuantity -= transactionData.quantity;
        }

        const updatedStock = {
            ...stockData,
            [key]: {
                ...selectedItem,
                quantity: newQuantity,
                lastUpdated: new Date().toISOString(),
            }
        };
        onUpdateStock(updatedStock);

        if (onAddTransaction) {
            const transaction = {
                id: `txn_${Date.now()}`,
                itemKey: key,
                itemName: selectedItem.khmerName,
                type: transactionType,
                quantity: transactionData.quantity,
                pricePerUnit: transactionData.pricePerUnit,
                totalAmount: transactionData.quantity * transactionData.pricePerUnit,
                note: transactionData.note,
                previousStock: selectedItem.quantity,
                newStock: newQuantity,
                createdAt: new Date().toISOString()
            };
            onAddTransaction(transaction);
        }

        setShowTransactionForm(false);
        setSelectedItem(null);
        alert(transactionType === 'IN' ? 'ទិញចូលបានជោគជ័យ!' : 'លក់ចេញបានជោគជ័យ!');
    };

    const handleDeleteItem = (key) => {
        if (!window.confirm('តើអ្នកពិតជាចង់លុបទំនិញនេះទេ?')) return;
        const updatedStock = { ...stockData };
        delete updatedStock[key];
        onUpdateStock(updatedStock);
        alert('ទំនិញបានលុបចេញ!');
    };

    return (
        <div className="stock-management-panel">
            <style>{`
                .stock-management-panel {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 20px;
                }

                .stock-alerts {
                    background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
                    border-radius: 10px;
                    padding: 16px;
                    margin-bottom: 20px;
                    color: white;
                    box-shadow: 0 4px 12px rgba(251, 191, 36, 0.3);
                }

                .stock-alerts h4 {
                    margin: 0 0 10px 0;
                    font-size: 16px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .alert-items {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }

                .alert-badge {
                    background: rgba(255, 255, 255, 0.3);
                    padding: 6px 12px;
                    border-radius: 6px;
                    font-size: 13px;
                    backdrop-filter: blur(10px);
                }

                .stock-summary {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                    gap: 12px;
                    margin-bottom: 20px;
                }

                .summary-card {
                    background: white;
                    border-radius: 10px;
                    padding: 16px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    border-left: 4px solid #667eea;
                }

                .summary-card h4 {
                    margin: 0 0 8px 0;
                    color: #6b7280;
                    font-size: 12px;
                    font-weight: 600;
                }

                .summary-card .value {
                    font-size: 24px;
                    font-weight: 700;
                    color: #1f2937;
                }

                .summary-card.green { border-left-color: #10b981; }
                .summary-card.orange { border-left-color: #f59e0b; }
                .summary-card.red { border-left-color: #ef4444; }
                .summary-card.blue { border-left-color: #3b82f6; }

                .add-item-form, .transaction-form {
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
                    from { opacity: 0; transform: translateY(-20px); }
                    to { opacity: 1; transform: translateY(0); }
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

                .required {
                    color: #ef4444;
                    font-weight: bold;
                }

                .form-input, .form-textarea {
                    width: 100%;
                    padding: 10px 14px;
                    border: 2px solid #e5e7eb;
                    border-radius: 8px;
                    font-size: 14px;
                    transition: all 0.3s ease;
                    background: #f9fafb;
                    box-sizing: border-box;
                }

                .form-textarea {
                    resize: vertical;
                    min-height: 80px;
                    font-family: inherit;
                }

                .form-input:focus, .form-textarea:focus {
                    outline: none;
                    border-color: #667eea;
                    background: white;
                    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
                }

                .form-actions {
                    display: flex;
                    gap: 10px;
                    padding: 16px 20px;
                    background: #f9fafb;
                    border-top: 1px solid #e5e7eb;
                }

                .btn-submit, .btn-cancel {
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

                .btn-cancel {
                    background: white;
                    color: #6b7280;
                    border: 2px solid #e5e7eb;
                }

                .btn-cancel:hover {
                    background: #f3f4f6;
                    border-color: #d1d5db;
                }

                .btn-add-item, .btn-export, .btn-history, .btn-report {
                    padding: 10px 20px;
                    border: none;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 3px 10px rgba(0,0,0,0.2);
                    color: white;
                }

                .btn-add-item {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                }

                .btn-add-item.active {
                    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                }

                .btn-export {
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                }

                .btn-history {
                    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                }

                .btn-report {
                    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                }

                .btn-add-item:hover, .btn-export:hover, .btn-history:hover, .btn-report:hover {
                    transform: translateY(-2px);
                }

                .stock-actions {
                    display: flex;
                    gap: 10px;
                    flex-wrap: wrap;
                }

                .stock-table {
                    width: 100%;
                    background: white;
                    border-radius: 10px;
                    overflow: hidden;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    margin-top: 20px;
                }

                .stock-table th {
                    background: #f3f4f6;
                    padding: 12px;
                    text-align: left;
                    font-size: 13px;
                    font-weight: 600;
                    color: #374151;
                }

                .stock-table td {
                    padding: 12px;
                    border-top: 1px solid #e5e7eb;
                    font-size: 14px;
                }

                .stock-table .number-cell {
                    text-align: right;
                }

                .action-buttons {
                    display: flex;
                    gap: 6px;
                    flex-wrap: wrap;
                }

                .btn-stock-in, .btn-stock-out, .btn-delete-item, .btn-view-history {
                    padding: 6px 12px;
                    border: none;
                    border-radius: 6px;
                    font-size: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    color: white;
                }

                .btn-stock-in {
                    background: #10b981;
                }

                .btn-stock-out {
                    background: #f59e0b;
                }

                .btn-delete-item {
                    background: #ef4444;
                }

                .btn-view-history {
                    background: #3b82f6;
                }

                .btn-stock-in:hover, .btn-stock-out:hover, .btn-delete-item:hover, .btn-view-history:hover {
                    transform: scale(1.05);
                    opacity: 0.9;
                }

                .history-panel, .report-panel {
                    background: white;
                    border-radius: 10px;
                    padding: 20px;
                    margin-top: 20px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }

                .history-panel h3, .report-panel h3 {
                    margin: 0 0 16px 0;
                    color: #1f2937;
                }

                .transaction-item {
                    padding: 12px;
                    border-left: 4px solid #667eea;
                    background: #f9fafb;
                    margin-bottom: 10px;
                    border-radius: 6px;
                }

                .transaction-item.type-in {
                    border-left-color: #10b981;
                }

                .transaction-item.type-out {
                    border-left-color: #f59e0b;
                }

                .transaction-header {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 6px;
                    font-weight: 600;
                }

                .transaction-details {
                    font-size: 13px;
                    color: #6b7280;
                }

                .stock-movement-badge {
                    display: inline-block;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: 600;
                    margin-left: 8px;
                }

                .stock-movement-badge.in {
                    background: #d1fae5;
                    color: #065f46;
                }

                .stock-movement-badge.out {
                    background: #fed7aa;
                    color: #92400e;
                }

                .item-history-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    padding: 20px;
                    animation: fadeIn 0.2s ease-out;
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                .item-history-content {
                    background: white;
                    border-radius: 12px;
                    max-width: 700px;
                    width: 100%;
                    max-height: 85vh;
                    overflow-y: auto;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                    animation: slideUp 0.3s ease-out;
                }

                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .modal-header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 20px 24px;
                    border-radius: 12px 12px 0 0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .modal-header h3 {
                    margin: 0;
                    font-size: 20px;
                }

                .modal-close {
                    background: rgba(255,255,255,0.2);
                    border: none;
                    color: white;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    cursor: pointer;
                    font-size: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }

                .modal-close:hover {
                    background: rgba(255,255,255,0.3);
                    transform: rotate(90deg);
                }

                .modal-body {
                    padding: 24px;
                }

                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 12px;
                    margin-bottom: 24px;
                }

                .stat-box {
                    padding: 16px;
                    border-radius: 10px;
                    border: 2px solid #e5e7eb;
                }

                .stat-box.primary { border-color: #667eea; background: #f5f7ff; }
                .stat-box.success { border-color: #10b981; background: #f0fdf4; }
                .stat-box.warning { border-color: #f59e0b; background: #fffbeb; }
                .stat-box.info { border-color: #3b82f6; background: #eff6ff; }

                .stat-label {
                    font-size: 12px;
                    color: #6b7280;
                    margin-bottom: 6px;
                    font-weight: 600;
                }

                .stat-value {
                    font-size: 24px;
                    font-weight: 700;
                    color: #1f2937;
                }

                .section-title {
                    font-size: 16px;
                    font-weight: 700;
                    color: #1f2937;
                    margin: 24px 0 12px 0;
                    padding-bottom: 8px;
                    border-bottom: 2px solid #e5e7eb;
                }

                .clickable-row {
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .clickable-row:hover {
                    background: #f9fafb !important;
                    transform: scale(1.01);
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }

                @media (max-width: 768px) {
                    .form-row, .stock-summary {
                        grid-template-columns: 1fr;
                    }
                    .add-item-form, .transaction-form {
                        max-width: 100%;
                    }
                    .stock-table {
                        font-size: 12px;
                    }
                    .stock-actions {
                        flex-direction: column;
                    }
                    .stock-actions button {
                        width: 100%;
                    }
                }
            `}</style>

            <h2>📊 គ្រប់គ្រងស្តុក</h2>

            {/* Low Stock Alerts */}
            {lowStockItems.length > 0 && (
                <div className="stock-alerts">
                    <h4>⚠️ ការព្រមាន: ទំនិញជិតអស់ស្តុក ({lowStockItems.length})</h4>
                    <div className="alert-items">
                        {lowStockItems.map(item => (
                            <span key={`${item.khmerName}_${item.category}`} className="alert-badge">
                                {item.khmerName}: {item.quantity}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Summary Cards */}
            <div className="stock-summary">
                <div className="summary-card">
                    <h4>📦 ទំនិញសរុប</h4>
                    <div className="value">{Object.keys(stockData).length}</div>
                </div>
                <div className="summary-card green">
                    <h4>📥 ទិញចូលថ្ងៃនេះ</h4>
                    <div className="value" style={{color: '#10b981'}}>{getDailyStats.stockIn}</div>
                </div>
                <div className="summary-card orange">
                    <h4>📤 លក់ចេញថ្ងៃនេះ</h4>
                    <div className="value" style={{color: '#f59e0b'}}>{getDailyStats.stockOut}</div>
                </div>
                <div className="summary-card blue">
                    <h4>💰 ចំណូលថ្ងៃនេះ</h4>
                    <div className="value" style={{color: '#3b82f6', fontSize: '18px'}}>
                        {getDailyStats.revenue.toLocaleString()}
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="stock-controls">
                <div className="stock-actions">
                    <button onClick={handleExportExcel} className="btn-export">
                        📊 Excel
                    </button>
                    <button 
                        onClick={() => setShowDailyReport(!showDailyReport)} 
                        className="btn-report"
                    >
                        📋 {showDailyReport ? 'បិទរបាយការណ៍' : 'របាយការណ៍ថ្ងៃ'}
                    </button>
                    <button 
                        onClick={() => setShowHistory(!showHistory)} 
                        className="btn-history"
                    >
                        📜 {showHistory ? 'បិទប្រវត្តិ' : 'ប្រវត្តិ'}
                    </button>
                    <button 
                        onClick={() => setShowAddForm(!showAddForm)} 
                        className={`btn-add-item ${showAddForm ? 'active' : ''}`}
                    >
                        {showAddForm ? '✕ បិទ' : '➕ បន្ថែម'}
                    </button>
                </div>

                {/* Add New Item Form */}
                {showAddForm && (
                    <div className="add-item-form">
                        <div className="form-header">
                            <h3>➕ បន្ថែមទំនិញថ្មី</h3>
                            <p className="form-subtitle">បំពេញព័ត៌មានទំនិញខាងក្រោម</p>
                        </div>
                        <div className="form-body">
                            <div className="form-group full-width">
                                <label className="form-label">
                                    🏷️ ឈ្មោះទំនិញ <span className="required">*</span>
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
                                    <label className="form-label">📦 ចំនួនស្តុកដំបូង</label>
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
                                    <label className="form-label">💵 តម្លៃ (KHR)</label>
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
                            <div className="form-group">
                                <label className="form-label">⚠️ ស្តុកអប្បបរមា</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={newStockItem.minStockAlert || ''}
                                    onChange={(e) => setNewStockItem({...newStockItem, minStockAlert: parseInt(e.target.value) || 5})}
                                    placeholder="5"
                                    className="form-input"
                                />
                            </div>
                        </div>
                        <div className="form-actions">
                            <button onClick={() => { setShowAddForm(false); setNewStockItem({ khmerName: '', category: 'COLD DRINKS', priceKHR: 0, quantity: 0, minStockAlert: 5 }); }} className="btn-cancel">
                                ✕ បោះបង់
                            </button>
                            <button onClick={handleAddNewItem} className="btn-submit">
                                ✓ បន្ថែមទំនិញ
                            </button>
                        </div>
                    </div>
                )}

                {/* Transaction Form */}
                {showTransactionForm && selectedItem && (
                    <div className="transaction-form">
                        <div className="form-header">
                            <h3>{transactionType === 'IN' ? '📥 ទិញចូល' : '📤 លក់ចេញ'}: {selectedItem.khmerName}</h3>
                            <p className="form-subtitle">ស្តុកបច្ចុប្បន្ន: {selectedItem.quantity}</p>
                        </div>
                        <div className="form-body">
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">📦 ចំនួន <span className="required">*</span></label>
                                    <input
                                        type="number"
                                        min="1"
                                        max={transactionType === 'OUT' ? selectedItem.quantity : undefined}
                                        value={transactionData.quantity || ''}
                                        onChange={(e) => setTransactionData({...transactionData, quantity: parseInt(e.target.value) || 0})}
                                        placeholder="0"
                                        className="form-input"
                                    />
                                    {transactionType === 'OUT' && transactionData.quantity > selectedItem.quantity && (
                                        <div style={{color: '#ef4444', fontSize: '12px', marginTop: '4px'}}>
                                            ⚠️ លើសពីស្តុកបច្ចុប្បន្ន!
                                        </div>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label className="form-label">💵 តម្លៃក្នុង 1 ឯកតា</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={transactionData.pricePerUnit || ''}
                                        onChange={(e) => setTransactionData({...transactionData, pricePerUnit: parseFloat(e.target.value) || 0})}
                                        placeholder="0"
                                        className="form-input"
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">📝 កំណត់ចំណាំ</label>
                                <textarea
                                    value={transactionData.note}
                                    onChange={(e) => setTransactionData({...transactionData, note: e.target.value})}
                                    placeholder="បញ្ចូលកំណត់ចំណាំ..."
                                    className="form-textarea"
                                />
                            </div>
                            {transactionData.quantity > 0 && transactionData.pricePerUnit > 0 && (
                                <div style={{padding: '12px', background: '#f3f4f6', borderRadius: '8px'}}>
                                    <div style={{fontWeight: '600', marginBottom: '8px'}}>
                                        💰 តម្លៃសរុប: {(transactionData.quantity * transactionData.pricePerUnit).toLocaleString()} KHR
                                    </div>
                                    <div style={{fontSize: '13px', color: '#6b7280'}}>
                                        {transactionType === 'IN' 
                                            ? `ស្តុកបន្ទាប់ពីទិញ: ${selectedItem.quantity} + ${transactionData.quantity} = ${selectedItem.quantity + transactionData.quantity}`
                                            : `ស្តុកបន្ទាប់ពីលក់: ${selectedItem.quantity} - ${transactionData.quantity} = ${selectedItem.quantity - transactionData.quantity}`
                                        }
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="form-actions">
                            <button onClick={() => { setShowTransactionForm(false); setSelectedItem(null); }} className="btn-cancel">
                                ✕ បោះបង់
                            </button>
                            <button onClick={handleSubmitTransaction} className="btn-submit">
                                ✓ បញ្ជាក់
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Daily Report */}
            {showDailyReport && (
                <div className="report-panel">
                    <h3>📋 របាយការណ៍ប្រចាំថ្ងៃ - {new Date().toLocaleDateString('km-KH')}</h3>
                    <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px'}}>
                        <div style={{padding: '12px', background: '#d1fae5', borderRadius: '8px'}}>
                            <div style={{fontSize: '12px', color: '#065f46', marginBottom: '4px'}}>📥 ទិញចូលសរុប</div>
                            <div style={{fontSize: '24px', fontWeight: '700', color: '#065f46'}}>{getDailyStats.stockIn}</div>
                        </div>
                        <div style={{padding: '12px', background: '#fed7aa', borderRadius: '8px'}}>
                            <div style={{fontSize: '12px', color: '#92400e', marginBottom: '4px'}}>📤 លក់ចេញសរុប</div>
                            <div style={{fontSize: '24px', fontWeight: '700', color: '#92400e'}}>{getDailyStats.stockOut}</div>
                        </div>
                        <div style={{padding: '12px', background: '#dbeafe', borderRadius: '8px'}}>
                            <div style={{fontSize: '12px', color: '#1e40af', marginBottom: '4px'}}>💰 ចំណូល</div>
                            <div style={{fontSize: '20px', fontWeight: '700', color: '#1e40af'}}>{getDailyStats.revenue.toLocaleString()}</div>
                        </div>
                        <div style={{padding: '12px', background: '#fecaca', borderRadius: '8px'}}>
                            <div style={{fontSize: '12px', color: '#991b1b', marginBottom: '4px'}}>💸 ចំណាយ</div>
                            <div style={{fontSize: '20px', fontWeight: '700', color: '#991b1b'}}>{getDailyStats.expense.toLocaleString()}</div>
                        </div>
                    </div>
                    
                    {getDailyStats.todayTransactions.length > 0 && (
                        <div>
                            <h4 style={{marginTop: '16px', marginBottom: '12px', color: '#374151'}}>
                                📝 Transaction ថ្ងៃនេះ ({getDailyStats.todayTransactions.length})
                            </h4>
                            {getDailyStats.todayTransactions.slice().reverse().map(txn => (
                                <div key={txn.id} className={`transaction-item type-${txn.type.toLowerCase()}`}>
                                    <div className="transaction-header">
                                        <span>{txn.type === 'IN' ? '📥' : '📤'} {txn.itemName}</span>
                                        <span style={{color: txn.type === 'IN' ? '#10b981' : '#f59e0b'}}>
                                            {txn.type === 'IN' ? '+' : '-'}{txn.quantity}
                                        </span>
                                    </div>
                                    <div className="transaction-details">
                                        {formatDateTime(txn.createdAt)} | តម្លៃ: {txn.totalAmount.toLocaleString()} KHR
                                        {txn.previousStock !== undefined && (
                                            <> | ស្តុក: {txn.previousStock} → {txn.newStock}</>
                                        )}
                                        {txn.note && <> | {txn.note}</>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Transaction History */}
            {showHistory && transactions && transactions.length > 0 && (
                <div className="history-panel">
                    <h3>📜 ប្រវត្តិ Transaction ទាំងអស់</h3>
                    {transactions.slice().reverse().slice(0, 30).map(txn => (
                        <div key={txn.id} className={`transaction-item type-${txn.type.toLowerCase()}`}>
                            <div className="transaction-header">
                                <span>{txn.type === 'IN' ? '📥' : '📤'} {txn.itemName}</span>
                                <span style={{color: txn.type === 'IN' ? '#10b981' : '#f59e0b'}}>
                                    {txn.type === 'IN' ? '+' : '-'}{txn.quantity}
                                </span>
                            </div>
                            <div className="transaction-details">
                                {formatDateTime(txn.createdAt)} | តម្លៃ: {txn.totalAmount.toLocaleString()} KHR
                                {txn.previousStock !== undefined && (
                                    <> | ស្តុក: {txn.previousStock} → {txn.newStock}</>
                                )}
                                {txn.note && <> | {txn.note}</>}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Stock Table */}
            {filteredStock.length > 0 ? (
                <table className="stock-table">
                    <thead>
                        <tr>
                            <th>ឈ្មោះទំនិញ</th>
                            <th className="number-cell">តម្លៃ (KHR)</th>
                            <th className="number-cell" style={{color: '#10b981'}}>📥 ទិញថ្ងៃនេះ</th>
                            <th className="number-cell" style={{color: '#f59e0b'}}>📤 លក់ថ្ងៃនេះ</th>
                            <th className="number-cell">សល់ស្តុក</th>
                            <th>សកម្មភាព</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredStock.map(item => {
                            const key = `${item.khmerName}_${item.category}`;
                            const isLowStock = item.quantity <= (item.minStockAlert || 5);
                            const itemHistory = getItemHistory(key);
                            const today = new Date().toISOString().split('T')[0];
                            const todayTxn = itemHistory.filter(t => t.createdAt && t.createdAt.startsWith(today));
                            const todayIn = todayTxn.filter(t => t.type === 'IN').reduce((s, t) => s + t.quantity, 0);
                            const todayOut = todayTxn.filter(t => t.type === 'OUT').reduce((s, t) => s + t.quantity, 0);

                            return (
                                <tr 
                                    key={key} 
                                    className="clickable-row"
                                    onClick={() => handleOpenItemDetail(item)}
                                    style={{background: isLowStock ? '#fef3c7' : 'white'}}
                                >
                                    <td>
                                        {item.khmerName}
                                        {isLowStock && <span style={{color: '#f59e0b', marginLeft: '8px'}}>⚠️</span>}
                                    </td>
                                    <td className="number-cell">{item.priceKHR.toLocaleString()}</td>
                                    <td className="number-cell">
                                        {todayIn > 0 ? (
                                            <span className="stock-movement-badge in">+{todayIn}</span>
                                        ) : (
                                            <span style={{color: '#d1d5db'}}>0</span>
                                        )}
                                    </td>
                                    <td className="number-cell">
                                        {todayOut > 0 ? (
                                            <span className="stock-movement-badge out">-{todayOut}</span>
                                        ) : (
                                            <span style={{color: '#d1d5db'}}>0</span>
                                        )}
                                    </td>
                                    <td className="number-cell" style={{fontWeight: '700', fontSize: '16px', color: isLowStock ? '#f59e0b' : '#10b981'}}>
                                        {item.quantity}
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            <button
                                                onClick={() => handleOpenTransaction(item, 'IN')}
                                                className="btn-stock-in"
                                                title="ទិញចូល"
                                            >
                                                📥 ចូល
                                            </button>
                                            <button
                                                onClick={() => handleOpenTransaction(item, 'OUT')}
                                                className="btn-stock-out"
                                                title="លក់ចេញ"
                                            >
                                                📤 ចេញ
                                            </button>
                                            <button
                                                onClick={() => handleDeleteItem(key)}
                                                className="btn-delete-item"
                                                title="លុបទំនិញ"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            ) : (
                <div style={{textAlign: 'center', padding: '40px', color: '#6b7280'}}>
                    <p style={{fontSize: '48px', margin: '0'}}>📦</p>
                    <p>មិនមានទិន្នន័យស្តុក។</p>
                </div>
            )}

            {/* Item Detail Modal */}
            {showItemDetail && selectedItemDetail && (
                <div className="item-history-modal" onClick={() => setShowItemDetail(false)}>
                    <div className="item-history-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>📊 របាយការណ៍លម្អិត: {selectedItemDetail.khmerName}</h3>
                            <button className="modal-close" onClick={() => setShowItemDetail(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            {(() => {
                                const key = `${selectedItemDetail.khmerName}_${selectedItemDetail.category}`;
                                const stats = getItemStats(key);
                                const history = getItemHistory(key);

                                return (
                                    <>
                                        {/* Summary Statistics */}
                                        <div className="stats-grid">
                                            <div className="stat-box primary">
                                                <div className="stat-label">📦 ស្តុកបច្ចុប្បន្ន</div>
                                                <div className="stat-value" style={{color: '#667eea'}}>
                                                    {selectedItemDetail.quantity}
                                                </div>
                                            </div>
                                            <div className="stat-box info">
                                                <div className="stat-label">💵 តម្លៃ (KHR)</div>
                                                <div className="stat-value" style={{color: '#3b82f6', fontSize: '18px'}}>
                                                    {selectedItemDetail.priceKHR.toLocaleString()}
                                                </div>
                                            </div>
                                            <div className="stat-box success">
                                                <div className="stat-label">📥 ទិញចូលសរុប</div>
                                                <div className="stat-value" style={{color: '#10b981'}}>
                                                    +{stats.totalIn}
                                                </div>
                                            </div>
                                            <div className="stat-box warning">
                                                <div className="stat-label">📤 លក់ចេញសរុប</div>
                                                <div className="stat-value" style={{color: '#f59e0b'}}>
                                                    -{stats.totalOut}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Financial Summary */}
                                        <div className="stats-grid">
                                            <div className="stat-box" style={{borderColor: '#10b981', background: '#f0fdf4'}}>
                                                <div className="stat-label">💰 ចំណូលសរុប</div>
                                                <div className="stat-value" style={{color: '#10b981', fontSize: '18px'}}>
                                                    {stats.totalRevenue.toLocaleString()}
                                                </div>
                                            </div>
                                            <div className="stat-box" style={{borderColor: '#ef4444', background: '#fef2f2'}}>
                                                <div className="stat-label">💸 ចំណាយសរុប</div>
                                                <div className="stat-value" style={{color: '#ef4444', fontSize: '18px'}}>
                                                    {stats.totalExpense.toLocaleString()}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Transaction History */}
                                        <h4 className="section-title">📜 ប្រវត្តិ Transaction ({stats.transactionCount})</h4>
                                        {history.length > 0 ? (
                                            <div style={{maxHeight: '300px', overflowY: 'auto'}}>
                                                {history.map(txn => (
                                                    <div key={txn.id} className={`transaction-item type-${txn.type.toLowerCase()}`}>
                                                        <div className="transaction-header">
                                                            <span>
                                                                {txn.type === 'IN' ? '📥 ទិញចូល' : '📤 លក់ចេញ'}
                                                            </span>
                                                            <span style={{color: txn.type === 'IN' ? '#10b981' : '#f59e0b', fontWeight: '700'}}>
                                                                {txn.type === 'IN' ? '+' : '-'}{txn.quantity}
                                                            </span>
                                                        </div>
                                                        <div className="transaction-details">
                                                            {formatDateTime(txn.createdAt)} | តម្លៃ: {txn.totalAmount.toLocaleString()} KHR
                                                            {txn.previousStock !== undefined && (
                                                                <> | ស្តុក: {txn.previousStock} → {txn.newStock}</>
                                                            )}
                                                            {txn.note && (
                                                                <div style={{marginTop: '4px', fontStyle: 'italic'}}>
                                                                    💬 {txn.note}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div style={{textAlign: 'center', padding: '20px', color: '#6b7280'}}>
                                                មិនទាន់មាន Transaction
                                            </div>
                                        )}

                                        {/* Action Buttons */}
                                        <div style={{display: 'flex', gap: '10px', marginTop: '24px', paddingTop: '16px', borderTop: '2px solid #e5e7eb'}}>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setShowItemDetail(false);
                                                    handleOpenTransaction(selectedItemDetail, 'IN');
                                                }}
                                                className="btn-stock-in"
                                                style={{flex: 1, padding: '12px'}}
                                            >
                                                📥 ទិញចូល
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setShowItemDetail(false);
                                                    handleOpenTransaction(selectedItemDetail, 'OUT');
                                                }}
                                                className="btn-stock-out"
                                                style={{flex: 1, padding: '12px'}}
                                            >
                                                📤 លក់ចេញ
                                            </button>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default StockManagement;