import React, { useState, useMemo } from 'react';
import { menuData as allMenuItems } from '../data/menuData';
import MenuItem from './MenuItem';

function MenuPanel({ onAddItemToOrder }) {
    // Get unique categories from menuData
    const uniqueCategories = useMemo(() => {
        const categorySet = new Set(allMenuItems.map(item => item.category));
        return Array.from(categorySet);
    }, []); // allMenuItems is from a static import

    // State for the currently active category tab
    // Default to the first category in the list if available
    const [activeCategory, setActiveCategory] = useState(() => {
        return uniqueCategories.length > 0 ? uniqueCategories[0] : null;
    });

    // Filter menu items based on the active category
    const filteredMenuItems = useMemo(() => {
        if (!activeCategory) {
            return []; // If no category is active (e.g., no categories exist)
        }
        return allMenuItems.filter(item => item.category === activeCategory);
    }, [activeCategory]); // Re-filter when activeCategory changes

    return (
        <div className="menu-panel">
            <h2>ម៉ឺនុយភេសជ្ជៈ</h2>

            {/* Category Tabs */}
            {uniqueCategories.length > 0 ? (
                <div className="category-tabs">
                    {uniqueCategories.map(categoryName => (
                        <button
                            key={categoryName}
                            className={`category-tab ${activeCategory === categoryName ? 'active' : ''}`}
                            onClick={() => setActiveCategory(categoryName)}
                        >
                            {categoryName}
                        </button>
                    ))}
                </div>
            ) : (
                <p className="empty-category-message">មិនមានប្រភេទភេសជ្ជៈទេ។</p>
            )}


            {/* Menu Items Grid */}
            {activeCategory && filteredMenuItems.length > 0 ? (
                <div className="menu-items-grid">
                    {filteredMenuItems.map(item => (
                        <MenuItem key={item.khmerName} item={item} onAddItemToOrder={onAddItemToOrder} />
                    ))}
                </div>
            ) : activeCategory && filteredMenuItems.length === 0 ? (
                 <p className="empty-category-message">គ្មានទំនិញក្នុងប្រភេទ "{activeCategory}" នេះទេ។</p>
            ) : null}
        </div>
    );
}

export default MenuPanel;