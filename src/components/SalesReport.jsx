// src/components/SalesReport.jsx
import React, { useState, useMemo, useRef } from 'react';
import { KHR_SYMBOL, formatKHR } from '../utils/formatters';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

function SalesReport({ allOrders, exchangeRate, onSoftDeleteOrder }) {
    // Authentication state
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authUsername, setAuthUsername] = useState("");
    const [authPassword, setAuthPassword] = useState("");
    const [authError, setAuthError] = useState("");

    // Default credentials (should be changed to your actual credentials)
    const REPORT_USERNAME = "vathanak";
    const REPORT_PASSWORD = "123";

    // VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
    // DECLARE MISSING STATE VARIABLES HERE
    // VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
    const [reportType, setReportType] = useState('daily');
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
    const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));
    const [showDeleted, setShowDeleted] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteReason, setDeleteReason] = useState("");
    const reasonInputRef = useRef(null);
    // ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // END OF MISSING STATE VARIABLE DECLARATIONS
    // ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

    // ALL HOOKS MUST BE CALLED HERE (before any conditional returns)
    const salesData = useMemo(() => {
        if (!allOrders || allOrders.length === 0) {
            return { grandTotalKHR: 0, count: 0, orders: [], deletedTotalKHR: 0, notDeletedTotalKHR: 0 };
        }

        let processedOrders = allOrders;
        if (!showDeleted) {
            processedOrders = allOrders.filter(order => !order.isDeleted);
        }

        let filteredOrders = [];
        if (reportType === 'daily') {
            filteredOrders = processedOrders.filter(order => order.date && order.date.startsWith(filterDate));
        } else if (reportType === 'monthly') {
            filteredOrders = processedOrders.filter(order => order.date && order.date.startsWith(filterMonth));
        } else if (reportType === 'all') {
            filteredOrders = processedOrders;
        }

        const grandTotalKHR = filteredOrders.reduce((sum, order) => sum + ((order.totalKHR || ((order.totalUSD || 0) * (order.exchangeRateAtPurchase || exchangeRate))) || 0), 0);
        const count = filteredOrders.length;

        let displayOrders = [];
        if (reportType === 'daily') {
            displayOrders = allOrders.filter(order => order.date && order.date.startsWith(filterDate));
        } else if (reportType === 'monthly') {
            displayOrders = allOrders.filter(order => order.date && order.date.startsWith(filterMonth));
        } else if (reportType === 'all') {
            displayOrders = allOrders;
        }
        if (!showDeleted) {
            displayOrders = displayOrders.filter(order => !order.isDeleted);
        }

        // Calculate deleted and non-deleted totals
        const notDeletedTotalKHR = displayOrders.filter(o => !o.isDeleted).reduce((sum, order) => sum + ((order.totalKHR || ((order.totalUSD || 0) * (order.exchangeRateAtPurchase || exchangeRate))) || 0), 0);
        const deletedTotalKHR = displayOrders.filter(o => o.isDeleted).reduce((sum, order) => sum + ((order.totalKHR || ((order.totalUSD || 0) * (order.exchangeRateAtPurchase || exchangeRate))) || 0), 0);

        return {
            grandTotalKHR,
            count,
            orders: displayOrders,
            notDeletedTotalKHR,
            deletedTotalKHR,
        };
    }, [allOrders, reportType, filterDate, filterMonth, showDeleted, exchangeRate]);
    // END OF HOOKS

    const handleLogin = () => {
        setAuthError("");
        if (!authUsername.trim()) {
            setAuthError("សូមបញ្ចូលឈ្មោះ");
            return;
        }
        if (!authPassword.trim()) {
            setAuthError("សូមបញ្ចូលលេខសម្ងាត់");
            return;
        }
        if (authUsername === REPORT_USERNAME && authPassword === REPORT_PASSWORD) {
            setIsAuthenticated(true);
        } else {
            setAuthError("ឈ្មោះ ឬលេខសម្ងាត់មិនត្រឹមត្រូវ");
        }
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        setAuthUsername("");
        setAuthPassword("");
        setAuthError("");
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter") {
            handleLogin();
        }
    };

    // Show login form if not authenticated
    if (!isAuthenticated) {
        return (
            <div className="sales-report-panel">
                <div className="auth-container">
                    <h2>វាលរបាយការណ៍លក់</h2>
                    <div className="auth-form">
                        <div className="auth-input-group">
                            <label>ឈ្មោះ:</label>
                            <input
                                type="text"
                                value={authUsername}
                                onChange={(e) => setAuthUsername(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="បញ្ចូលឈ្មោះ"
                                className="auth-input"
                            />
                        </div>
                        <div className="auth-input-group">
                            <label>លេខសម្ងាត់:</label>
                            <input
                                type="password"
                                value={authPassword}
                                onChange={(e) => setAuthPassword(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="បញ្ចូលលេខសម្ងាត់"
                                className="auth-input"
                            />
                        </div>
                        {authError && <div className="auth-error">{authError}</div>}
                        <button onClick={handleLogin} className="btn-login">ចូលប្រើប្រាស់</button>
                    </div>
                </div>
            </div>
        );
    }

    // Render the report if authenticated
    const getReportTitle = () => {
        if (reportType === 'daily') return `របាយការណ៍ថ្ងៃទី ${new Date(filterDate + 'T00:00:00').toLocaleDateString('km-KH', { day: '2-digit', month: 'long', year: 'numeric' })}`;
        if (reportType === 'monthly') return `របាយការណ៍ខែ ${new Date(filterMonth + '-01T00:00:00').toLocaleDateString('km-KH', { month: 'long', year: 'numeric' })}`;
        return 'របាយការណ៍លក់សរុប';
    };

    const handlePrintReport = () => { // This function should now be defined
        const reportPanel = document.querySelector('.sales-report-panel');
        const appContainer = document.querySelector('.pos-container.report-view-container');

        if (reportPanel && appContainer) {
            appContainer.classList.add('printing-sales-report');
            reportPanel.classList.add('print-this-report');
            window.print();
            reportPanel.classList.remove('print-this-report');
            appContainer.classList.remove('printing-sales-report');
        } else {
            console.error("Report panel or app container not found for printing.");
        }
    };

    // ... (handleDownloadCSV and handleExportToExcel should be fine as they use salesData and defined states) ...
    const handleDownloadCSV = () => {
        if (salesData.orders.length === 0) { alert("មិនមានទិន្នន័យសម្រាប់ទាញយក។"); return; }
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Order ID (Display),Firestore ID,Date,Time,Items Count,Total KHR (at Purchase),Exchange Rate (at Purchase),Is Deleted,Delete Reason\r\n";
        salesData.orders.forEach(order => {
            const orderDate = new Date(order.date);
            const dateStr = orderDate.toLocaleDateString('en-CA');
            const timeStr = orderDate.toLocaleTimeString('en-GB');
            const itemsCount = Array.isArray(order.items) ? order.items.reduce((sum, item) => sum + (item.quantity || 0), 0) : 0;
            const totalKHRatPurchase = (order.totalKHR || ((order.totalUSD || 0) * (order.exchangeRateAtPurchase || exchangeRate))) || 0;
            csvContent += `${order.orderIdString || 'N/A'},${order.firestoreId || 'N/A'},${dateStr},${timeStr},${itemsCount},${formatKHR(totalKHRatPurchase)},${order.exchangeRateAtPurchase || 'N/A'},${order.isDeleted ? 'Yes' : 'No'},"${(order.deleteReason || '').replace(/"/g, '""')}"\r\n`;
        });
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `sales_report_${reportType}_${new Date().toISOString().split('T')[0]}.csv`); // reportType is defined
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
    };

    const handleExportToExcel = () => {
        if (salesData.orders.length === 0) { alert("មិនមានទិន្នន័យសម្រាប់ Export ទេ។"); return; }
        const dataForExcel = salesData.orders.map(order => {
            const orderDate = new Date(order.date);
            const itemsCount = Array.isArray(order.items) ? order.items.reduce((sum, item) => sum + (item.quantity || 0), 0) : 0;
            const itemsString = Array.isArray(order.items) ? order.items.map(i => `${i.khmerName || ''} (x${i.quantity || 0})`).join(', ') : '';
            const totalKHRatPurchase = (order.totalKHR || ((order.totalUSD || 0) * (order.exchangeRateAtPurchase || exchangeRate))) || 0;
            return {
                'លេខវិក្កយបត្រ (Display)': order.orderIdString || 'N/A',
                'Firestore ID': order.firestoreId || 'N/A',
                'កាលបរិច្ឆេទ': orderDate.toLocaleDateString('km-KH'),
                'ម៉ោង': orderDate.toLocaleTimeString('km-KH'),
                'មុខទំនិញសរុប': itemsCount,
                'បញ្ជីផលិតផល': itemsString,
                'សរុប (KHR @ទិញ)': totalKHRatPurchase,
                'អត្រាប្តូរប្រាក់ (@ទិញ)': order.exchangeRateAtPurchase || 'N/A',
                'បានលុប': order.isDeleted ? 'បាទ' : 'ទេ',
                'មូលហេតុលុប': order.deleteReason || ''
            };
        });
        const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
        const columnWidths = [ { wch: 20 }, { wch: 25 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 50 }, { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 10 }, {wch: 30} ];
        worksheet['!cols'] = columnWidths;
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sales Report");
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const dataBlob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8" });
        saveAs(dataBlob, `sales_report_${reportType}_${new Date().toISOString().split('T')[0]}.xlsx`); // reportType is defined
    };


    const openDeleteModal = (order, event) => {
        event.preventDefault();
        if (order.isDeleted) return;
        setDeleteTarget({
            orderId: order.firestoreId,
            displayId: order.orderIdString || order.firestoreId.substring(0,6) + "...",
        });
        setDeleteReason("");
        setTimeout(() => reasonInputRef.current?.focus(), 0);
    };

    const closeDeleteModal = () => {
        setDeleteTarget(null);
        setDeleteReason("");
    };

    const confirmSoftDelete = () => {
        if (!deleteTarget) return;
        if (deleteReason.trim() === "") {
            alert("សូមបញ្ចូលមូលហេតុសម្រាប់ការលុប។");
            reasonInputRef.current?.focus();
            return;
        }
        onSoftDeleteOrder(deleteTarget.orderId, deleteReason);
        closeDeleteModal();
    };

    return (
        <div className="sales-report-panel">
            <div className="report-header">
                <h2>របាយការណ៍លក់</h2>
                <button onClick={handleLogout} className="btn-logout">ចាកចេញ</button>
            </div>
            <div className="report-controls">
                <button
                    onClick={() => setReportType('daily')} // setReportType is defined
                    className={reportType === 'daily' ? 'active' : ''} // reportType is defined
                >ប្រចាំថ្ងៃ</button>
                {reportType === 'daily' && ( // reportType is defined
                    <input
                        type="date"
                        value={filterDate} // filterDate is defined
                        onChange={(e) => setFilterDate(e.target.value)} // setFilterDate is defined
                        style={{padding: '7px', borderRadius:'5px', border: '1px solid var(--border-color)'}}
                    />
                )}
                <button
                    onClick={() => setReportType('monthly')} // setReportType is defined
                    className={reportType === 'monthly' ? 'active' : ''} // reportType is defined
                >ប្រចាំខែ</button>
                {reportType === 'monthly' && ( // reportType is defined
                     <input
                        type="month"
                        value={filterMonth} // filterMonth is defined
                        onChange={(e) => setFilterMonth(e.target.value)} // setFilterMonth is defined
                        style={{padding: '7px', borderRadius:'5px', border: '1px solid var(--border-color)'}}
                    />
                )}
                 <button
                    onClick={() => setReportType('all')} // setReportType is defined
                    className={reportType === 'all' ? 'active' : ''} // reportType is defined
                >ទាំងអស់</button>
                <label style={{marginLeft: '20px'}}>
                    <input type="checkbox" checked={showDeleted} onChange={(e) => setShowDeleted(e.target.checked)}/>
                    បង្ហាញបញ្ជីដែលបានលុប
                </label>
            </div>
            <div className="report-actions">
                <button onClick={handlePrintReport} disabled={salesData.orders.length === 0 && !showDeleted}><span role="img" aria-label="print">🖨️</span> បោះពុម្ព</button> {/* handlePrintReport is defined */}
                <button onClick={handleDownloadCSV} disabled={salesData.orders.length === 0 && !showDeleted}><span role="img" aria-label="download">💾</span> CSV</button>
                <button onClick={handleExportToExcel} disabled={!salesData || (salesData.orders.length === 0 && !showDeleted)}><span role="img" aria-label="excel">📄</span> Excel</button>
            </div>

            <div className="report-section" id="salesReportPrintSection">
                <h3>{getReportTitle()}</h3> {/* getReportTitle is defined */}
                <div className="report-summary-card">
                    <div className="summary-item">
                        <div className="summary-label">Orders</div>
                        <div className="summary-value">{salesData.count}</div>
                    </div>
                    <div className="summary-item">
                        <div className="summary-label">Grand Total (KHR)</div>
                        <div className="summary-value">{KHR_SYMBOL}{formatKHR(salesData.grandTotalKHR || 0)}</div>
                    </div>
                </div>
                {/* ... (rest of the JSX, table structure should be fine now) ... */}
                <p>ចំនួនបញ្ជាទិញ{showDeleted ? "" : " (មិនរួមបញ្ចូលបានលុប)"}: {salesData.count}</p>
                <p style={{fontWeight: 'bold', marginTop: '10px', color: 'var(--primary-color)'}}>
                    ប្រាក់ចំណូលសរុប (KHR){showDeleted ? "" : " (មិនរួមបញ្ចូលបានលុប)"}: {KHR_SYMBOL}{formatKHR(salesData.grandTotalKHR || 0)}
                </p>

                {salesData.orders.length > 0 ? (
                    <table className="report-data-table">
                        <thead>
                            <tr>
                                <th>ID បង្ហាញ</th>
                                <th>កាលបរិច្ឆេទ</th>
                                <th>ម៉ោង</th>
                                <th className="number-cell">ចំនួនមុខ</th>
                                <th className="number-cell">សរុប (KHR)</th>
                                <th className="number-cell">សរុប (KHR @ទិញ)</th>
                                <th>មូលហេតុលុប</th>
                                <th style={{width: '120px'}}>សកម្មភាព</th>
                            </tr>
                        </thead>
                        <tbody>
                            {salesData.orders.map(order => {
                                const orderDate = new Date(order.date || new Date());
                                const itemsCount = Array.isArray(order.items) ? order.items.reduce((sum, item) => sum + (item.quantity || 0), 0) : 0;
                                const khrAtPurchase = (order.totalKHR || ((order.totalUSD || 0) * (order.exchangeRateAtPurchase || exchangeRate))) || 0;
                                const rowClass = order.isDeleted ? 'deleted-row' : '';

                                return (
                                    <tr
                                        key={order.firestoreId || order.orderIdString}
                                        className={rowClass}
                                        onContextMenu={(e) => openDeleteModal(order, e)}
                                    >
                                        <td>{order.orderIdString || 'N/A'}</td>
                                        <td>{orderDate.toLocaleDateString('km-KH')}</td>
                                        <td>{orderDate.toLocaleTimeString('km-KH')}</td>
                                        <td className="number-cell">{itemsCount}</td>
                                        <td className="number-cell">{KHR_SYMBOL}{formatKHR(khrAtPurchase)}</td>
                                        <td className="number-cell">{KHR_SYMBOL}{formatKHR(khrAtPurchase)}</td>
                                        <td>
                                            {order.isDeleted && order.deleteReason ? (
                                                <span className="delete-reason-cell">{order.deleteReason}</span>
                                            ) : (
                                                <span style={{color: '#999'}}>-</span>
                                            )}
                                        </td>
                                        <td className="actions-cell">
                                            {!order.isDeleted && (
                                                <button
                                                    className="btn-delete-order"
                                                    onClick={(e) => openDeleteModal(order, e)}
                                                    title="សម្គាល់ថាលុប"
                                                >
                                                    🗑️ លុប
                                                </button>
                                            )}
                                            {order.isDeleted && (
                                                <div className="status-deleted">
                                                    <p style={{margin: 0, fontSize: '0.9em'}}>(បានលុប)</p>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan="4" style={{textAlign: 'right', fontWeight: 'bold'}}>មិនបានលុប:</td>
                                <td className="number-cell" style={{fontWeight: 'bold'}}>
                                    {salesData.orders.filter(o => !o.isDeleted).reduce((acc, currOrder) => {
                                        const currentItemsCount = Array.isArray(currOrder.items) ? currOrder.items.reduce((s, i) => s + (i.quantity || 0), 0) : 0;
                                        return acc + currentItemsCount;
                                    }, 0)}
                                </td>
                          <td className="number-cell" style={{fontWeight: 'bold'}}>{KHR_SYMBOL}{formatKHR(salesData.notDeletedTotalKHR || 0)}</td>
                          <td></td>
                          <td></td>
                            </tr>
                            {showDeleted && salesData.deletedTotalKHR > 0 && (
                                <tr style={{backgroundColor: '#ffe6e6'}}>
                                    <td colSpan="4" style={{textAlign: 'right', fontWeight: 'bold'}}>បានលុប:</td>
                                    <td className="number-cell" style={{fontWeight: 'bold'}}>
                                        {salesData.orders.filter(o => o.isDeleted).reduce((acc, currOrder) => {
                                            const currentItemsCount = Array.isArray(currOrder.items) ? currOrder.items.reduce((s, i) => s + (i.quantity || 0), 0) : 0;
                                            return acc + currentItemsCount;
                                        }, 0)}
                                    </td>
                          <td className="number-cell" style={{fontWeight: 'bold'}}>{KHR_SYMBOL}{formatKHR(salesData.deletedTotalKHR || 0)}</td>
                          <td></td>
                          <td></td>
                                </tr>
                            )}
                            <tr style={{backgroundColor: '#f0f0f0'}}>
                                <td colSpan="4" style={{textAlign: 'right', fontWeight: 'bold'}}>សរុប:</td>
                                <td className="number-cell" style={{fontWeight: 'bold'}}>
                                    {salesData.orders.reduce((acc, currOrder) => {
                                        const currentItemsCount = Array.isArray(currOrder.items) ? currOrder.items.reduce((s, i) => s + (i.quantity || 0), 0) : 0;
                                        return acc + currentItemsCount;
                                    }, 0)}
                                </td>
                          <td className="number-cell" style={{fontWeight: 'bold'}}>{KHR_SYMBOL}{formatKHR((salesData.notDeletedTotalKHR || 0) + (salesData.deletedTotalKHR || 0))}</td>
                          <td></td>
                          <td></td>
                            </tr>
                        </tfoot>
                    </table>
                ) : (
                    <p>មិនទាន់មានទិន្នន័យលក់សម្រាប់តម្រងនេះទេ។</p>
                )}
            </div>

            {deleteTarget && (
                <div className="modal show delete-reason-modal" onClick={closeDeleteModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <span className="close-button" onClick={closeDeleteModal}>×</span>
                        <h4>សម្គាល់ Order #{deleteTarget.displayId} ថាលុប</h4>
                        <p>សូមបញ្ចូលមូលហេតុសម្រាប់ការលុប (ជាជម្រើស ប៉ុន្តែត្រូវបានណែនាំ):</p>
                        <textarea
                            ref={reasonInputRef}
                            rows="3"
                            value={deleteReason}
                            onChange={(e) => setDeleteReason(e.target.value)}
                            placeholder="ឧ. អតិថិជនប្តូរចិត្ត, បញ្ចូលខុស..."
                            style={{ width: '95%', marginBottom: '15px', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                        ></textarea>
                        <div style={{ textAlign: 'right' }}>
                            <button
                                onClick={closeDeleteModal}
                                style={{ marginRight: '10px', padding: '8px 15px', background: '#ccc' }}
                            >បោះបង់</button>
                            <button
                                onClick={confirmSoftDelete}
                                style={{ padding: '8px 15px', background: 'var(--accent-color)', color: 'white' }}
                            >បញ្ជាក់ការលុប</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SalesReport;