import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './portfolio.css'


function Portfolio() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  // Portfolio Stats - 4 Cards matching dashboard
  const portfolioStats = {
    totalProducts: { count: 156, percentage: 85 },
    activeCategories: { count: 12, percentage: 60 },
    featuredItems: { count: 24, percentage: 45 },
    monthlyViews: { count: 8947, percentage: 92 }
  };

  // Sample Products Data
  const products = [
    { id: 1, name: 'iPhone 14 Pro Max', category: 'electronics', image: '📱', price: '₹1,29,900', stock: 45, views: 2341, rating: 4.8 },
    { id: 2, name: 'Nike Air Jordan', category: 'fashion', image: '👟', price: '₹12,995', stock: 78, views: 1876, rating: 4.6 },
    { id: 3, name: 'MacBook Pro M3', category: 'electronics', image: '💻', price: '₹1,99,900', stock: 23, views: 3421, rating: 4.9 },
    { id: 4, name: 'Sony Headphones', category: 'electronics', image: '🎧', price: '₹24,990', stock: 12, views: 1542, rating: 4.5 },
    { id: 5, name: 'Designer Watch', category: 'fashion', image: '⌚', price: '₹45,000', stock: 8, views: 987, rating: 4.7 },
    { id: 6, name: 'Gaming Console', category: 'electronics', image: '🎮', price: '₹49,990', stock: 34, views: 2156, rating: 4.8 },
    { id: 7, name: 'Leather Jacket', category: 'fashion', image: '🧥', price: '₹8,999', stock: 56, views: 1234, rating: 4.4 },
    { id: 8, name: 'Smart TV 55"', category: 'electronics', image: '📺', price: '₹54,999', stock: 19, views: 2890, rating: 4.6 }
  ];

  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  return (
    <div className="crm-dashboard">
      {/* Sidebar - Same as Dashboard */}
      <aside className="crm-sidebar">
        <div className="sidebar-logo">
          <span className="logo-icon">🏪</span>
        </div>
        <nav className="sidebar-nav">
          <button className="nav-item" onClick={() => navigate('/dashboard')} title="Dashboard">
            <span className="nav-icon">📊</span>
          </button>
          <button className="nav-item" onClick={() => navigate('/customer')} title="Customer">
            <span className="nav-icon">👥</span>
          </button>
          <button className="nav-item" onClick={() => navigate('/stock')} title="Stock">
            <span className="nav-icon">📦</span>
          </button>
          <button className="nav-item" onClick={() => navigate('/marketing')} title="Marketing">
            <span className="nav-icon">📢</span>
          </button>
          <button className="nav-item active" onClick={() => navigate('/portfolio')} title="Portfolio">
            <span className="nav-icon">💼</span>
          </button>
          <button className="nav-item" onClick={() => navigate('/settings')} title="Settings">
            <span className="nav-icon">⚙️</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="crm-main">
        {/* Navbar */}
        <header className="crm-navbar">
          <div className="navbar-left">
            <h1>Portfolio</h1>
          </div>
          <div className="navbar-right">
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="crm-content">
          {/* ROW 1: 4 STAT CARDS */}
          <div className="stats-row-four">
            <div className="stat-card">
              <div className="stat-left">
                <div className="stat-icon blue-bg">📦</div>
                <div className="stat-info">
                  <h3>{portfolioStats.totalProducts.count}+</h3>
                  <p>Total Products</p>
                </div>
              </div>
              <div className="stat-progress">
                <svg viewBox="0 0 36 36" className="circular-chart">
                  <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="circle blue-circle" strokeDasharray={`${portfolioStats.totalProducts.percentage}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <text x="18" y="20.35" className="percentage-text">{portfolioStats.totalProducts.percentage}%</text>
                </svg>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-left">
                <div className="stat-icon green-bg">📂</div>
                <div className="stat-info">
                  <h3>{portfolioStats.activeCategories.count}+</h3>
                  <p>Active Categories</p>
                </div>
              </div>
              <div className="stat-progress">
                <svg viewBox="0 0 36 36" className="circular-chart">
                  <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="circle green-circle" strokeDasharray={`${portfolioStats.activeCategories.percentage}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <text x="18" y="20.35" className="percentage-text">{portfolioStats.activeCategories.percentage}%</text>
                </svg>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-left">
                <div className="stat-icon purple-bg">⭐</div>
                <div className="stat-info">
                  <h3>{portfolioStats.featuredItems.count}+</h3>
                  <p>Featured Items</p>
                </div>
              </div>
              <div className="stat-progress">
                <svg viewBox="0 0 36 36" className="circular-chart">
                  <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="circle purple-circle" strokeDasharray={`${portfolioStats.featuredItems.percentage}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <text x="18" y="20.35" className="percentage-text">{portfolioStats.featuredItems.percentage}%</text>
                </svg>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-left">
                <div className="stat-icon orange-bg">👁️</div>
                <div className="stat-info">
                  <h3>{portfolioStats.monthlyViews.count.toLocaleString()}</h3>
                  <p>Monthly Views</p>
                </div>
              </div>
              <div className="stat-progress">
                <svg viewBox="0 0 36 36" className="circular-chart">
                  <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="circle red-circle" strokeDasharray={`${portfolioStats.monthlyViews.percentage}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <text x="18" y="20.35" className="percentage-text">{portfolioStats.monthlyViews.percentage}%</text>
                </svg>
              </div>
            </div>
          </div>

          {/* ROW 2: Category Filters Card */}
          <div className="card portfolio-filters-card">
            <div className="card-header">
              <h2 className="card-title">Product Categories</h2>
              <button className="menu-btn">⋯</button>
            </div>
            <div className="portfolio-filter-buttons">
              <button 
                className={selectedCategory === 'all' ? 'filter-pill active' : 'filter-pill'}
                onClick={() => setSelectedCategory('all')}
              >
                All Products ({products.length})
              </button>
              <button 
                className={selectedCategory === 'electronics' ? 'filter-pill active' : 'filter-pill'}
                onClick={() => setSelectedCategory('electronics')}
              >
                📱 Electronics ({products.filter(p => p.category === 'electronics').length})
              </button>
              <button 
                className={selectedCategory === 'fashion' ? 'filter-pill active' : 'filter-pill'}
                onClick={() => setSelectedCategory('fashion')}
              >
                👕 Fashion ({products.filter(p => p.category === 'fashion').length})
              </button>
            </div>
          </div>

          {/* ROW 3: Product Grid */}
          <div className="portfolio-products-grid">
            {filteredProducts.map((product) => (
              <div key={product.id} className="portfolio-product-card">
                <div className="product-card-header">
                  <div className="product-image-box">
                    <span className="product-emoji">{product.image}</span>
                  </div>
                  {product.stock < 15 && (
                    <span className="stock-badge low">Low Stock</span>
                  )}
                  {product.stock >= 15 && product.stock < 30 && (
                    <span className="stock-badge medium">In Stock</span>
                  )}
                  {product.stock >= 30 && (
                    <span className="stock-badge high">High Stock</span>
                  )}
                </div>
                <div className="product-card-body">
                  <h3 className="product-title">{product.name}</h3>
                  <p className="product-category-tag">{product.category}</p>
                  <div className="product-metrics">
                    <div className="metric-item">
                      <span className="metric-label">Price</span>
                      <span className="metric-value">{product.price}</span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-label">Stock</span>
                      <span className="metric-value">{product.stock} units</span>
                    </div>
                  </div>
                  <div className="product-footer">
                    <div className="product-rating">
                      <span>⭐</span>
                      <span>{product.rating}</span>
                    </div>
                    <div className="product-views">
                      <span>👁️</span>
                      <span>{product.views.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Portfolio;
