// src/App.jsx — Print Receipt ភ្លាមដោយ Hidden Modal (កែប្រែថ្មី)
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import './App.css';
import Header from './components/Header';
import MenuPanel from './components/MenuPanel';
import OrderPanel from './components/OrderPanel';
import ReceiptModal from './components/ReceiptModal';
import SalesReport from './components/SalesReport';
import StockManagement from './components/StockManagement';
import { generateOrderId } from './utils/helpers';

// Firebase
import { db, serverTimestamp } from './firebase';
import { collection, addDoc, getDocs, query, orderBy, doc, updateDoc, writeBatch } from "firebase/firestore";

const DEFAULT_EXCHANGE_RATE = 4000;
const SHOP_NAME = "ន កាហ្វេ";

function App() {
    const [currentOrder, setCurrentOrder] = useState([]);
    const [orderIdCounter, setOrderIdCounter] = useState(() => {
        const saved = localStorage.getItem('orderIdCounter');
        return saved ? parseInt(saved, 10) : 1;
    });
    
    // State សម្រាប់ Receipt (លាក់ពីអ្នកប្រើប្រាស់)
    const [receiptData, setReceiptData] = useState({ order: [], orderId: '' });
    const [triggerPrint, setTriggerPrint] = useState(0); // ប្រើ counter ជំនួស boolean
    
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

    // === ចុច "គិតលុយ" → រៀបចំទិន្នន័យ និង Trigger Print ===
    const processPayment = useCallback(async () => {
        if (currentOrder.length === 0) {
            alert('សូមបន្ថែមទំនិញជាមុន!');
            return;
        }

        const orderToSave = [...currentOrder];
        const orderIdToShow = currentDisplayOrderId;
        const totalKHR = orderToSave.reduce((sum, i) => sum + i.priceKHR * i.quantity, 0);

        // Save ទៅ Firebase ជាមុន
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

            // រក្សាទុកទិន្នន័យសម្រាប់ Receipt
            setReceiptData({ 
                order: orderToSave, 
                orderId: orderIdToShow 
            });

            // Trigger Print (ប្រើ counter ដើម្បី trigger useEffect គ្រប់ពេល)
            setTriggerPrint(prev => prev + 1);

            // Clear order
            setCurrentOrder([]);
            setOrderIdCounter(c => c + 1);

        } catch (err) {
            console.error(err);
            alert("មានបញ្ហារក្សាទុក Order: " + err.message);
        }

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

            {/* Receipt Modal ដែលលាក់ពីអ្នកប្រើប្រាស់ */}
            <ReceiptModal
                order={receiptData.order}
                orderId={receiptData.orderId}
                shopName={SHOP_NAME}
                triggerPrint={triggerPrint}
            />
        </>
    );
}

export default App;