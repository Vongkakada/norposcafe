// src/components/Header.jsx
import React, { useState, useEffect } from 'react';
import '../style/Header.css';
import appLogo from '../assets/logo.png';

function Header({ shopName, currentExchangeRate, onExchangeRateChange }) {
    const [inputValue, setInputValue] = useState(currentExchangeRate.toString());

    useEffect(() => {
        setInputValue(currentExchangeRate.toString());
    }, [currentExchangeRate]);

    const handleInputChange = (e) => {
        setInputValue(e.target.value);
    };

    const handleInputBlur = () => {
        const newRate = parseFloat(inputValue);
        if (!isNaN(newRate) && newRate > 0) {
            onExchangeRateChange(newRate);
        } else {
            setInputValue(currentExchangeRate.toString());
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleInputBlur();
            e.target.blur(); 
        }
    };

    return (
        <header className="app-main-header">
            <div className="header-left">
                <img src={appLogo} alt="Shop Logo" className="header-logo" />
                <span className="header-shop-name">{shopName}</span>
            </div>
            <div className="header-right">
                <label htmlFor="exchangeRateInput" className="exchange-rate-label">
                    1$=
                </label>
                <input
                    type="number"
                    id="exchangeRateInput"
                    className="exchange-rate-input"
                    value={inputValue}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    onKeyPress={handleKeyPress}
                    step="50" // ជំហានសម្រាប់ KHR
                />
                <span className="exchange-rate-currency">KHR</span>
            </div>
        </header>
    );
}

export default Header;