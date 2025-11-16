// src/App.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import './App.css';
import Header from './components/Header';
import MenuPanel from './components/MenuPanel';
import OrderPanel from './components/OrderPanel';
import ReceiptModal from './components/ReceiptModal';
import SalesReport from './components/SalesReport';
import StockManagement from './components/StockManagement';
import { menuData } from './data/menuData';
import { initializeStock } from './data/stockData';
import { generateOrderId } from './utils/helpers';

// Import Firebase instances and functions
import { db, serverTimestamp } from './firebase'; // Import db និង serverTimestamp
import { collection, addDoc, getDocs, query, orderBy, doc, updateDoc } from "firebase/firestore";

const DEFAULT_EXCHANGE_RATE = 4000;
const SHOP_NAME = "ន កាហ្វេ"; // កែឈ្មោះហាងរបស់អ្នកឲ្យត្រឹមត្រូវ

function App() {
    const [currentOrder, setCurrentOrder] = useState([]);
    const [orderIdCounter, setOrderIdCounter] = useState(() => {
        const savedCounter = localStorage.getItem('orderIdCounter');
        return savedCounter ? parseInt(savedCounter, 10) : 1;
    });
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [allOrders, setAllOrders] = useState([]);
    const [isLoadingOrders, setIsLoadingOrders] = useState(true);
    const [view, setView] = useState('pos');
    const [exchangeRate, setExchangeRate] = useState(() => {
        const savedRate = localStorage.getItem('exchangeRate');
        return savedRate ? parseFloat(savedRate) : DEFAULT_EXCHANGE_RATE;
    });
    const [stockData, setStockData] = useState(() => {
        const savedStock = localStorage.getItem('stockData');
        return savedStock ? JSON.parse(savedStock) : initializeStock(menuData);
    });

    const currentDisplayOrderId = useMemo(() => generateOrderId(orderIdCounter), [orderIdCounter]);

    useEffect(() => {
        const fetchOrdersFromFirestore = async () => {
            setIsLoadingOrders(true);
            try {
                const ordersRef = collection(db, "orders");
                const q = query(ordersRef, orderBy("date", "desc"));
                const querySnapshot = await getDocs(q);
                const fetchedOrders = querySnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        firestoreId: doc.id,
                        ...data,
                        date: data.date?.toDate ? data.date.toDate().toISOString() : data.date,
                    };
                });
                setAllOrders(fetchedOrders);
            } catch (error) {
                console.error("Error fetching orders from Firestore: ", error);
                alert("Error fetching orders. Please check console for details.");
            } finally {
                setIsLoadingOrders(false);
            }
        };
        fetchOrdersFromFirestore();
    }, []);

    useEffect(() => {
        localStorage.setItem('orderIdCounter', orderIdCounter.toString());
    }, [orderIdCounter]);

    // Function to add stock item to Firebase
    const addStockItemToFirebase = async (item) => {
        try {
            const docRef = await addDoc(collection(db, 'stock'), {
                khmerName: item.khmerName,
                englishName: item.englishName,
                category: item.category,
                priceKHR: item.priceKHR,
                quantity: item.quantity,
                lastUpdated: item.lastUpdated,
                updatedAt: new Date(),
            });
            console.log("Stock item saved with ID: ", docRef.id);
        } catch (error) {
            console.error("Error adding stock item to Firebase: ", error);
        }
    };

    useEffect(() => {
        localStorage.setItem('exchangeRate', exchangeRate.toString());
    }, [exchangeRate]);

    useEffect(() => {
        localStorage.setItem('stockData', JSON.stringify(stockData));
        
        // Save stock data to Firebase
        const saveStockToFirebase = async () => {
            try {
                const stockItems = Object.values(stockData);
                
                // Save each stock item as a separate document
                for (const item of stockItems) {
                    await addStockItemToFirebase(item);
                }
            } catch (error) {
                console.error('Error saving stock to Firebase:', error);
            }
        };
        
        saveStockToFirebase();
    }, [stockData]);

    const handleExchangeRateChange = useCallback((newRate) => {
        if (!isNaN(newRate) && newRate > 0) {
            setExchangeRate(newRate);
        }
    }, []);

    const addItemToOrder = useCallback((itemData) => {
        setCurrentOrder(prevOrder => {
            const existingItem = prevOrder.find(
                orderItem => orderItem.khmerName === itemData.khmerName && (orderItem.priceKHR || orderItem.priceUSD) === (itemData.priceKHR || itemData.priceUSD)
            );
            if (existingItem) {
                return prevOrder.map(orderItem =>
                    orderItem.khmerName === itemData.khmerName && (orderItem.priceKHR || orderItem.priceUSD) === (itemData.priceKHR || itemData.priceUSD)
                        ? { ...orderItem, quantity: orderItem.quantity + 1 }
                        : orderItem
                );
            } else {
                return [...prevOrder, { ...itemData, quantity: 1 }];
            }
        });
    }, []);

    const updateItemQuantity = useCallback((itemName, delta) => {
        setCurrentOrder(prevOrder => {
            const itemInOrder = prevOrder.find(orderItem => orderItem.khmerName === itemName);
            if (!itemInOrder) return prevOrder;
            const newQuantity = itemInOrder.quantity + delta;
            if (newQuantity <= 0) {
                return prevOrder.filter(orderItem => orderItem.khmerName !== itemName);
            } else {
                return prevOrder.map(orderItem =>
                    orderItem.khmerName === itemName
                        ? { ...orderItem, quantity: newQuantity }
                        : orderItem
                );
            }
        });
    }, []);

    const clearOrder = useCallback(() => {
        setCurrentOrder([]);
    }, []);

    const processPayment = useCallback(() => {
        if (currentOrder.length === 0) {
            alert('សូមបន្ថែមទំនិញទៅក្នុងបញ្ជីជាមុនសិន!');
            return;
        }
        const modalElement = document.getElementById('receiptModal');
        if (modalElement) modalElement.classList.add('printing-receipt');
        setShowReceiptModal(true);
    }, [currentOrder]);

    const closeReceiptModalAndFinalizeOrder = useCallback(async () => {
        if (currentOrder.length === 0) { // Double check, though processPayment should prevent this
            setShowReceiptModal(false);
            return;
        }
        const subtotalKHR = currentOrder.reduce((sum, item) => sum + (item.priceKHR || item.priceUSD || 0) * item.quantity, 0);
        const totalKHR = subtotalKHR;

        const completedOrderDataToSave = {
            orderIdString: currentDisplayOrderId,
            items: currentOrder.map(item => ({ // រក្សាទុកតែ field ដែលចាំបាច់សម្រាប់ items
                khmerName: item.khmerName,
                englishName: item.englishName || '',
                priceKHR: item.priceKHR || item.priceUSD || 0,
                quantity: item.quantity,
                category: item.category // អាចរក្សាទុក category ដែរ បើត្រូវការសម្រាប់ការវិភាគ
            })),
            subtotalKHR,
            totalKHR,
            date: serverTimestamp(), // ប្រើ serverTimestamp របស់ Firebase
            exchangeRateAtPurchase: exchangeRate, // រក្សាទុកអត្រាប្តូរប្រាក់ពេល Order
        };

        try {
            const docRef = await addDoc(collection(db, "orders"), completedOrderDataToSave);
            console.log("Order written to Firestore with ID: ", docRef.id);

            // សម្រាប់ UI update ភ្លាមៗ, បង្កើត object ថ្មីជាមួយ date ជា ISO string
            const newOrderForState = {
                ...completedOrderDataToSave,
                firestoreId: docRef.id,
                date: new Date().toISOString(), // ប្រើ new Date() សម្រាប់ UI update ភ្លាមៗ
            };
            // បន្ថែម order ថ្មីទៅខាងដើមនៃ array (សម្រាប់តម្រៀបថ្មីមុន)
            setAllOrders(prevOrders => [newOrderForState, ...prevOrders]);

        } catch (e) {
            console.error("Error adding document to Firestore: ", e);
            alert("មានបញ្ហាក្នុងការរក្សាទុក Order។ សូមព្យាយាមម្តងទៀត។ Error: " + e.message);
            // មិន clear order ឬ increment counter បើ save បរាជ័យ
            setShowReceiptModal(false); // បិទ modal វិញ បើ save បរាជ័យ
            return;
        }

        setShowReceiptModal(false);
        const modalElement = document.getElementById('receiptModal');
        if (modalElement) modalElement.classList.remove('printing-receipt');

        setCurrentOrder([]);
        setOrderIdCounter(prevCounter => prevCounter + 1);
    }, [currentOrder, currentDisplayOrderId, exchangeRate]);

    const handleSoftDeleteOrder = useCallback(async (firestoreId, deleteReason) => {
        try {
            const orderRef = doc(db, "orders", firestoreId);
            await updateDoc(orderRef, {
                isDeleted: true,
                deleteReason: deleteReason,
                deletedAt: serverTimestamp(),
            });
            // Update state to reflect the deleted order
            setAllOrders(prevOrders =>
                prevOrders.map(order =>
                    order.firestoreId === firestoreId
                        ? { ...order, isDeleted: true, deleteReason: deleteReason }
                        : order
                )
            );
            alert("Order ត្រូវបានលុបដោយជោគជ័យ។");
        } catch (error) {
            console.error("Error deleting order: ", error);
            alert("មានបញ្ហាក្នុងការលុប Order: " + error.message);
        }
    }, []);

    return (
        <>
            <Header
                shopName={SHOP_NAME}
                currentExchangeRate={exchangeRate}
                onExchangeRateChange={handleExchangeRateChange}
            />

            <div className="app-navigation">
                <button
                    onClick={() => setView('pos')}
                    className={view === 'pos' ? 'active-view' : ''}
                >
                    <span role="img" aria-label="pos system">🛒</span> ប្រព័ន្ធលក់ (POS)
                </button>
                <button
                    onClick={() => setView('report')}
                    className={view === 'report' ? 'active-view' : ''}
                >
                    <span role="img" aria-label="sales report">📊</span> របាយការណ៍លក់
                </button>
                <button
                    onClick={() => setView('stock')}
                    className={view === 'stock' ? 'active-view' : ''}
                >
                    <span role="img" aria-label="stock management">📦</span> គ្រប់គ្រងស្តុក
                </button>
            </div>

            {isLoadingOrders && ( // Show a general loading indicator if still loading initial data
                <div className="loading-indicator full-page-loader">
                    <p>កំពុងទាញយកទិន្នន័យ...</p>
                    {/* You can add a spinner here */}
                </div>
            )}

            {!isLoadingOrders && view === 'pos' && (
                <div className="pos-container pos-view-container">
                    <MenuPanel onAddItemToOrder={addItemToOrder} />
                    <OrderPanel
                        currentOrder={currentOrder}
                        orderId={currentDisplayOrderId}
                        onUpdateQuantity={updateItemQuantity}
                        onClearOrder={clearOrder}
                        onProcessPayment={processPayment}   // បន្ថែម prop នេះ
                        shopName={SHOP_NAME}
                    />
                </div>
            )}

            {!isLoadingOrders && view === 'report' && (
                <div className="pos-container report-view-container">
                     <SalesReport
                        allOrders={allOrders}
                        exchangeRate={exchangeRate}
                        onSoftDeleteOrder={handleSoftDeleteOrder}
                    />
                </div>
            )}

            {!isLoadingOrders && view === 'stock' && (
                <div className="pos-container report-view-container">
                    <StockManagement
                        stockData={stockData}
                        onUpdateStock={setStockData}
                    />
                </div>
            )}

            <ReceiptModal
                id="receiptModal"
                show={showReceiptModal}
                onClose={closeReceiptModalAndFinalizeOrder}
                order={currentOrder} // currentOrder សម្រាប់បង្ហាញក្នុង Receipt
                orderId={currentDisplayOrderId}
                exchangeRate={exchangeRate} // exchangeRate បច្ចុប្បន្នសម្រាប់បង្ហាញក្នុង Receipt
                shopName={SHOP_NAME}
            />
        </>
    );
}

export default App;