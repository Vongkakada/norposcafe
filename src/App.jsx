// src/App.jsx — ចុងក្រោយបំផុត (16 វិច្ឆិកា 2025)
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import './App.css';
import Header from './components/Header';
import MenuPanel from './components/MenuPanel';
import OrderPanel from './components/OrderPanel';
import ReceiptModal from './components/ReceiptModal';
import SalesReport from './components/SalesReport';
import StockManagement from './components/StockManagement';
import { generateOrderId } from './utils/helpers';

import { db, serverTimestamp } from './firebase';
import { collection, addDoc, getDocs, query, orderBy, doc, updateDoc, writeBatch } from "firebase/firestore";

const DEFAULT_EXCHANGE_RATE = 4000;
const SHOP_NAME = "ន កាហ្វេ";

function App() {
    const [currentOrder, setCurrentOrder] = useState([]);
    const [orderIdCounter, setOrderIdCounter] = useState(() => Number(localStorage.getItem('orderIdCounter') || 1));
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [allOrders, setAllOrders] = useState([]);
    const [isLoadingOrders, setIsLoadingOrders] = useState(true);
    const [view, setView] = useState('pos');
    const [exchangeRate] = useState(DEFAULT_EXCHANGE_RATE);
    const [stockData] = useState({});

    const currentDisplayOrderId = useMemo(() => generateOrderId(orderIdCounter), [orderIdCounter]);

    // Fetch orders
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
            } catch (err) { console.error(err); }
            finally { setIsLoadingOrders(false); }
        };
        fetchOrders();
    }, []);

    useEffect(() => localStorage.setItem('orderIdCounter', orderIdCounter.toString()), [orderIdCounter]);

    const addItemToOrder = useCallback((item) => {
        setCurrentOrder(prev => {
            const existing = prev.find(i => i.khmerName === item.khmerName && i.priceKHR === item.priceKHR);
            if (existing) return prev.map(i => i === existing ? { ...i, quantity: i.quantity + 1 } : i);
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

    // សំខាន់បំផុត: Save + Print
    const processPayment = useCallback(async () => {
        if (currentOrder.length === 0) {
            alert('សូមបន្ថែមទំនិញជាមុន!');
            return;
        }

        const orderToSave = [...currentOrder];
        const totalKHR = orderToSave.reduce((s, i) => s + i.priceKHR * i.quantity, 0);

        try {
            await addDoc(collection(db, "orders"), {
                orderIdString: currentDisplayOrderId,
                items: orderToSave.map(i => ({
                    khmerName: i.khmerName,
                    englishName: i.englishName || '',
                    priceKHR: i.priceKHR,
                    quantity: i.quantity,
                    category: i.category
                })),
                totalKHR,
                date: serverTimestamp()
            });

            setAllOrders(prev => [{ orderIdString: currentDisplayOrderId, items: orderToSave, totalKHR, date: new Date().toISOString() }, ...prev]);
            setCurrentOrder([]);
            setOrderIdCounter(c => c + 1);
            setShowReceiptModal(true); // → បើក Print ភ្លាមៗ!

        } catch (err) {
            alert("មានបញ្ហា: " + err.message);
        }
    }, [currentOrder, currentDisplayOrderId]);

    return (
        <>
            <Header shopName={SHOP_NAME} />

            <div className="app-navigation">
                <button onClick={() => setView('pos')} className={view === 'pos' ? 'active-view' : ''}>POS</button>
                <button onClick={() => setView('report')} className={view === 'report' ? 'active-view' : ''}>របាយការណ៍</button>
                <button onClick={() => setView('stock')} className={view === 'stock' ? 'active-view' : ''}>ស្តុក</button>
            </div>

            {isLoadingOrders && <div className="loading-indicator full-page-loader"><p>កំពុងទាញយក...</p></div>}

            {view === 'pos' && (
                <div className="pos-container">
                    <MenuPanel onAddItemToOrder={addItemToOrder} />
                    <OrderPanel
                        currentOrder={currentOrder}
                        orderId={currentDisplayOrderId}
                        onUpdateQuantity={updateItemQuantity}
                        onClearOrder={clearOrder}
                        onProcessPayment={processPayment}
                    />
                </div>
            )}

            {view === 'report' && <SalesReport allOrders={allOrders} />}
            {view === 'stock' && <StockManagement stockData={stockData} onUpdateStock={() => {}} />}

            <ReceiptModal
                show={showReceiptModal}
                onClose={() => setShowReceiptModal(false)}
                order={currentOrder}
                orderId={currentDisplayOrderId}
                shopName={SHOP_NAME}
            />
        </>
    );
}

export default App;