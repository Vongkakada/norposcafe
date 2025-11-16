// src/components/MenuItem.js
import React from 'react';
import { KHR_SYMBOL, formatKHR } from '../utils/formatters';

function MenuItem({ item, onAddItemToOrder }) {
    return (
        <div className="menu-item" onClick={() => onAddItemToOrder(item)}>
            <div className="item-icon">{item.icon || '☕️'}</div>
            <div className="item-name-km">{item.khmerName}</div>
            <div className="item-name-en">{item.englishName || ''}</div>
            <div>
                <div className="item-price-khr">{KHR_SYMBOL}{formatKHR(item.priceKHR)}</div>
            </div>
        </div>
    );
}

export default MenuItem;