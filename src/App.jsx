// src/App.jsx — Print Receipt ដំណើរការលើទូរស័ព្ទ Chrome (16 វិច្ឆិកា 2025)
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import './App.css';
import Header from './components/Header';
import MenuPanel from './components/MenuPanel';
import OrderPanel from './components/OrderPanel';
import SalesReport from './components/SalesReport';
import StockManagement from './components/StockManagement';
import { generateOrderId } from './utils/helpers';
import { KHR_SYMBOL, formatKHR } from '../utils/formatters';

// Firebase
import { db, serverTimestamp } from './firebase';
import { collection, addDoc, getDocs, query, orderBy, doc, updateDoc, writeBatch } from "firebase/firestore";

const DEFAULT_EXCHANGE_RATE = 4000;
const SHOP_NAME = "ន កាហ្វេ";
const SHOP_STATIC_DETAILS = {
    address: "ផ្ទះលេខ 137, ផ្លូវ 223, កំពង់ចាម",
    tel: "016 438 555 / 061 91 4444"
};

function App() {
    const [currentOrder, setCurrentOrder] = useState([]);
    const [orderIdCounter, setOrderIdCounter] = useState(() => {
        const saved = localStorage.getItem('orderIdCounter');
        return saved ? parseInt(saved, 10) : 1;
    });
    const [allOrders, setAllOrders] = useState([]);
    const [isLoadingOrders, setIsLoadingOrders] = useState(true);
    const [view, setView] = useState('pos');
    const [exchangeRate, setExchangeRate] = useState(() => {
        const saved = localStorage.getItem('exchangeRate');
        return saved ? parseFloat(saved) : DEFAULT_EXCHANGE_RATE;
    });
    const [stockData, setStockData] = useState(() => {
        const saved = localStorage.getItem('stockData');
        return saved ? JSON.parse(saved) : {};
    });

    const currentDisplayOrderId = useMemo(() => generateOrderId(orderIdCounter), [orderIdCounter]);

    // === ទាញ Stock & Orders ===
    useEffect(() => {
        const fetchStock = async () => {
            try {
                const snapshot = await getDocs(collection(db, "stock"));
                if (snapshot.empty) return;
                const fetched = {};
                snapshot.forEach(doc => {
                    const d = doc.data();
                    const key = `${d.khmerName}_${d.category}`;
                    fetched[key] = {
                        khmerName: d.khmerName,
                        englishName: d.englishName || '',
                        category: d.category,
                        priceKHR: d.priceKHR || 0,
                        quantity: d.quantity || 0,
                        lastUpdated: d.lastUpdated || new Date().toISOString(),
                        firestoreId: doc.id
                    };
                });
                setStockData(fetched);
            } catch (err) { console.error("Fetch stock error:", err); }
        };
        fetchStock();
    }, []);

    useEffect(() => {
        const fetchOrders = async () => {
            setIsLoadingOrders(true);
            try {
                const q = query(collection(db, "orders"), orderBy("date", "desc"));
                const snapshot = await getDocs(q);
                const orders = snapshot.docs.map(doc => ({
                    firestoreId: doc.id,
                    ...doc.data(),
                    date: doc.data().date?.toDate?.()?.toISOString() || doc.data().date
                }));
                setAllOrders(orders);
            } catch (err) { console.error("Fetch orders error:", err); }
            finally { setIsLoadingOrders(false); }
        };
        fetchOrders();
    }, []);

    // === Sync Stock ===
    const updateStockAndSync = async (newStockData) => {
        setStockData(newStockData);
        localStorage.setItem('stockData', JSON.stringify(newStockData));

        try {
            const batch = writeBatch(db);
            const currentIds = new Set();

            Object.entries(newStockData).forEach(([key, item]) => {
                const data = {
                    khmerName: item.khmerName,
                    englishName: item.englishName || '',
                    category: item.category,
                    priceKHR: item.priceKHR || 0,
                    quantity: item.quantity || 0,
                    lastUpdated: item.lastUpdated || new Date().toISOString(),
                };

                if (item.firestoreId) {
                    batch.set(doc(db, "stock", item.firestoreId), data);
                    currentIds.add(item.firestoreId);
                } else {
                    const ref = doc(collection(db, "stock"));
                    batch.set(ref, data);
                    newStockData[key] = { ...item, firestoreId: ref.id };
                }
            });

            const snapshot = await getDocs(collection(db, "stock"));
            snapshot.forEach(d => {
                if (!currentIds.has(d.id)) batch.delete(d.ref);
            });

            await batch.commit();
            setStockData({ ...newStockData });
        } catch (err) {
            console.error("Sync stock error:", err);
            alert("មានបញ្ហាក្នុងការធ្វើសមកាលកម្មស្តុក។");
        }
    };

    useEffect(() => localStorage.setItem('orderIdCounter', orderIdCounter.toString()), [orderIdCounter]);
    useEffect(() => localStorage.setItem('exchangeRate', exchangeRate.toString()), [exchangeRate]);

    const handleExchangeRateChange = useCallback((rate) => {
        if (!isNaN(rate) && rate > 0) setExchangeRate(rate);
    }, []);

    const addItemToOrder = useCallback((item) => {
        setCurrentOrder(prev => {
            const existing = prev.find(i => i.khmerName === item.khmerName && i.priceKHR === item.priceKHR);
            if (existing) {
                return prev.map(i => i === existing ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { ...item, quantity: 1 }];
        });
    }, []);

    const updateItemQuantity = useCallback((name, delta) => {
        setCurrentOrder(prev => prev
            .map(item => item.khmerName === name ? { ...item, quantity: item.quantity + delta } : item)
            .filter(item => item.quantity > 0)
        );
    }, []);

    const clearOrder = useCallback(() => setCurrentOrder([]), []);

    // === ចុច "គិតលុយ" → បង្កើត Receipt HTML និងបើក Tab/Window ថ្មី ===
    const processPayment = useCallback(async () => {
        if (currentOrder.length === 0) {
            alert('សូមបន្ថែមទំនិញជាមុន!');
            return;
        }

        const orderToSave = [...currentOrder];
        const orderIdToShow = currentDisplayOrderId;
        const totalKHR = orderToSave.reduce((sum, i) => sum + i.priceKHR * i.quantity, 0);
        const now = new Date();

        // បង្កើត Receipt HTML
        const receiptHTML = `
<!DOCTYPE html>
<html lang="km">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>វិក្កយបត្រ #${orderIdToShow}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Kantumruy Pro', 'Khmer OS Battambang', sans-serif;
            background: #f5f5f5;
            padding: 15px;
            font-size: 14px;
            line-height: 1.5;
        }
        .receipt {
            max-width: 400px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 15px;
            border-bottom: 2px dashed #333;
            padding-bottom: 15px;
        }
        .header h2 {
            font-size: 20px;
            margin-bottom: 8px;
            color: #2c3e50;
        }
        .header p {
            font-size: 12px;
            color: #666;
            margin: 3px 0;
        }
        .order-id {
            background: #3498db;
            color: white;
            padding: 8px;
            border-radius: 6px;
            margin: 10px 0;
            font-weight: bold;
            text-align: center;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }
        th {
            background: #ecf0f1;
            padding: 10px 8px;
            text-align: left;
            font-weight: bold;
            font-size: 13px;
            border-bottom: 2px solid #bdc3c7;
        }
        td {
            padding: 10px 8px;
            border-bottom: 1px solid #ecf0f1;
            font-size: 13px;
        }
        td:nth-child(2) { text-align: center; }
        td:last-child { text-align: right; font-weight: 500; }
        .summary {
            margin-top: 15px;
            padding-top: 15px;
            border-top: 2px dashed #333;
        }
        .summary-line {
            display: flex;
            justify-content: space-between;
            margin: 8px 0;
            font-size: 14px;
        }
        .total {
            font-size: 18px;
            font-weight: bold;
            color: #2c3e50;
            background: #ecf0f1;
            padding: 12px;
            border-radius: 8px;
            margin-top: 10px;
        }
        .footer {
            text-align: center;
            margin-top: 20px;
            padding-top: 15px;
            border-top: 2px dashed #333;
            font-weight: bold;
            color: #27ae60;
            font-size: 14px;
        }
        .actions {
            margin-top: 20px;
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }
        button {
            flex: 1;
            min-width: 120px;
            padding: 12px 20px;
            font-size: 14px;
            font-weight: bold;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-family: 'Kantumruy Pro', sans-serif;
            transition: all 0.3s;
        }
        .btn-print {
            background: #3498db;
            color: white;
        }
        .btn-print:active {
            background: #2980b9;
            transform: scale(0.98);
        }
        .btn-close {
            background: #95a5a6;
            color: white;
        }
        .btn-close:active {
            background: #7f8c8d;
            transform: scale(0.98);
        }
        
        @media print {
            body { background: white; padding: 0; }
            .receipt { box-shadow: none; max-width: none; }
            .actions { display: none !important; }
            @page { size: 80mm auto; margin: 5mm; }
        }
    </style>
</head>
<body>
    <div class="receipt">
        <div class="header">
            <h2>${SHOP_NAME}</h2>
            <p>${SHOP_STATIC_DETAILS.address}</p>
            <p>ទូរស័ព្ទ: ${SHOP_STATIC_DETAILS.tel}</p>
            <p>${now.toLocaleDateString('km-KH', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            })}</p>
            <p>${now.toLocaleTimeString('km-KH', {
                hour: '2-digit',
                minute: '2-digit'
            })}</p>
        </div>

        <div class="order-id">វិក្កយបត្រ: ${orderIdToShow}</div>

        <table>
            <thead>
                <tr>
                    <th>មុខទំនិញ</th>
                    <th>ចំនួន</th>
                    <th>តម្លៃ</th>
                </tr>
            </thead>
            <tbody>
                ${orderToSave.map(item => `
                    <tr>
                        <td>${item.khmerName}${item.englishName ? `<br><small style="color:#7f8c8d;">${item.englishName}</small>` : ''}</td>
                        <td>${item.quantity}</td>
                        <td>${KHR_SYMBOL}${formatKHR(item.priceKHR * item.quantity)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        <div class="summary">
            <div class="summary-line">
                <span>សរុបរង:</span>
                <span>${KHR_SYMBOL}${formatKHR(totalKHR)}</span>
            </div>
            <div class="summary-line total">
                <span>សរុបត្រូវបង់:</span>
                <span>${KHR_SYMBOL}${formatKHR(totalKHR)}</span>
            </div>
        </div>

        <div class="footer">
            សូមអរគុណ! សូមអញ្ជើញមកម្តងទៀត 🙏
        </div>

        <div class="actions">
            <button class="btn-print" onclick="window.print()">
                🖨️ បោះពុម្ភ
            </button>
            <button class="btn-close" onclick="window.close()">
                ✖️ បិទ
            </button>
        </div>
    </div>
</body>
</html>`;

        // បើក tab/window ថ្មី
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('សូមអនុញ្ញាត Pop-up ដើម្បីបង្ហាញវិក្កយបត្រ');
            return;
        }

        printWindow.document.write(receiptHTML);
        printWindow.document.close();

        // Save ទៅ Firebase
        try {
            const docRef = await addDoc(collection(db, "orders"), {
                orderIdString: orderIdToShow,
                items: orderToSave.map(i => ({
                    khmerName: i.khmerName,
                    englishName: i.englishName || '',
                    priceKHR: i.priceKHR,
                    quantity: i.quantity,
                    category: i.category
                })),
                subtotalKHR: totalKHR,
                totalKHR,
                date: serverTimestamp(),
                exchangeRateAtPurchase: exchangeRate
            });

            setAllOrders(prev => [{
                firestoreId: docRef.id,
                orderIdString: orderIdToShow,
                items: orderToSave,
                totalKHR,
                date: new Date().toISOString()
            }, ...prev]);

        } catch (err) {
            console.error(err);
            alert("មានបញ្ហារក្សាទុក Order: " + err.message);
        }

        // Clear order
        setCurrentOrder([]);
        setOrderIdCounter(c => c + 1);

    }, [currentOrder, currentDisplayOrderId, exchangeRate]);

    const handleSoftDeleteOrder = useCallback(async (id, reason) => {
        try {
            await updateDoc(doc(db, "orders", id), {
                isDeleted: true,
                deleteReason: reason,
                deletedAt: serverTimestamp()
            });
            setAllOrders(prev => prev.map(o => o.firestoreId === id ? { ...o, isDeleted: true, deleteReason: reason } : o));
            alert("Order បានលុបដោយជោគជ័យ");
        } catch (err) {
            alert("មានបញ្ហាលុប Order");
        }
    }, []);

    return (
        <>
            <Header shopName={SHOP_NAME} currentExchangeRate={exchangeRate} onExchangeRateChange={handleExchangeRateChange} />

            <div className="app-navigation">
                <button onClick={() => setView('pos')} className={view === 'pos' ? 'active-view' : ''}>ប្រព័ន្ធលក់ (POS)</button>
                <button onClick={() => setView('report')} className={view === 'report' ? 'active-view' : ''}>របាយការណ៍លក់</button>
                <button onClick={() => setView('stock')} className={view === 'stock' ? 'active-view' : ''}>គ្រប់គ្រងស្តុក</button>
            </div>

            {isLoadingOrders && <div className="loading-indicator full-page-loader"><p>កំពុងទាញយកទិន្នន័យ...</p></div>}

            {!isLoadingOrders && view === 'pos' && (
                <div className="pos-container pos-view-container">
                    <MenuPanel onAddItemToOrder={addItemToOrder} />
                    <OrderPanel
                        currentOrder={currentOrder}
                        orderId={currentDisplayOrderId}
                        onUpdateQuantity={updateItemQuantity}
                        onClearOrder={clearOrder}
                        onProcessPayment={processPayment}
                        shopName={SHOP_NAME}
                    />
                </div>
            )}

            {!isLoadingOrders && view === 'report' && (
                <div className="pos-container report-view-container">
                    <SalesReport allOrders={allOrders} exchangeRate={exchangeRate} onSoftDeleteOrder={handleSoftDeleteOrder} />
                </div>
            )}

            {!isLoadingOrders && view === 'stock' && (
                <div className="pos-container report-view-container">
                    <StockManagement stockData={stockData} onUpdateStock={updateStockAndSync} />
                </div>
            )}
        </>
    );
}

export default App;
