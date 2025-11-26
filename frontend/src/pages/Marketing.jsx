import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './Marketing.css';


export default function Marketing() {
  const navigate = useNavigate();
  const location = useLocation();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [shareMessage, setShareMessage] = useState('');

  useEffect(() => {
    fetchProducts();
  }, [location.pathname]);

  useEffect(() => {
    const handleProductsUpdate = () => fetchProducts();
    window.addEventListener('productsUpdated', handleProductsUpdate);
    const handleStorageChange = (e) => e.key === 'productsUpdated' && fetchProducts();
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('productsUpdated', handleProductsUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('authToken');
      if (!token) { navigate('/login'); return; }

      const response = await axios.get('http://localhost:5000/api/products', {
        headers: { Authorization: `Bearer ${token}` }
      });
      let productsList = [];
      if (response?.data?.success && response?.data?.products) {
        productsList = response.data.products;
      } else if (response?.data?.data?.products) {
        productsList = response.data.data.products;
      } else if (Array.isArray(response?.data?.products)) {
        productsList = response.data.products;
      } else if (Array.isArray(response?.data)) {
        productsList = response.data;
      }
      setProducts(productsList);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.clear();
        navigate('/login');
      } else {
        setError('Failed to load products. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => fetchProducts();

  const handleProductSelect = (productId) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const getSelectedProductsDetails = () =>
    products.filter((p) => selectedProducts.includes(p._id || p.id));

  const generateShareMessage = () => {
    const selected = getSelectedProductsDetails();
    if (selected.length === 0) return 'Select products to generate share message...';
    let message = '🛍️ *Check out our amazing products!* 🛍️\n\n';
    selected.forEach((product, index) => {
      const name = product.name || product.product_name || product.description;
      const description = product.description || product.specification || '';
      const price = product.selling_price || product.cost_price || 0;
      const quantity = product.stock_quantity || product.unitQuantity || 0;
      message += `${index + 1}. *${name}*\n`;
      if (description) message += `   📝 ${description}\n`;
      message += `   💰 Price: ₹${price}\n`;
      message += `   📦 Available: ${quantity} units\n\n`;
    });
    message += '📞 Contact us for more details!\n';
    message += '🌐 Visit our store today!';
    return message;
  };

  const handleWhatsAppShare = () => {
    if (selectedProducts.length === 0) {
      alert('⚠️ Please select at least one product to share');
      return;
    }
    const message = shareMessage || generateShareMessage();
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  const handleInstagramShare = () => {
    if (selectedProducts.length === 0) {
      alert('⚠️ Please select at least one product to share');
      return;
    }
    const message = shareMessage || generateShareMessage();
    navigator.clipboard.writeText(message);
    alert('📸 Message copied! Share it on Instagram.');
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="crm-dashboard">
      <aside className="crm-sidebar">
        <div className="sidebar-logo">
          <span className="logo-icon">📢</span>
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
          <button className="nav-item active" onClick={() => navigate('/marketing')} title="Marketing">
            <span className="nav-icon">📢</span>
          </button>
          <button className="nav-item" onClick={() => navigate('/portfolio')} title="Portfolio">
            <span className="nav-icon">💼</span>
          </button>
        </nav>
        <div className="sidebar-footer">
          <button className="nav-item" onClick={() => navigate('/settings')} title="Settings">
            <span className="nav-icon">⚙️</span>
          </button>
        </div>
      </aside>

      <main className="crm-main">
        <div className="crm-navbar">
          <div className="navbar-left">
            <h1>Marketing</h1>
          </div>
          <div className="navbar-right">
            <button onClick={handleRefresh} className="refresh-btn" title="Refresh">
              🔄
            </button>
            <button onClick={handleLogout} className="logout-btn" title="Logout">
              Logout
            </button>
          </div>
        </div>
        <div className="crm-content">
          <div className="marketing-2col">
            {/* Stock Column */}
            <div className="marketing-panel">
              <div className="panel-header">
                <h2>📦 Stock</h2>
              </div>
              {error && <div className="error-message">{error}</div>}
              {loading ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Loading products...</p>
                </div>
              ) : (
                <div className="products-list">
                  {products.length === 0 ? (
                    <div className="empty-state">
                      <p>No products available</p>
                      <button onClick={() => navigate('/stock')} className="btn-add-product">+ Add Products</button>
                    </div>
                  ) : (
                    products.map((product) => {
                      const productId = product._id || product.id;
                      const name = product.name || product.product_name || product.description;
                      const description = product.description || product.specification || '';
                      const imagePath = product.image;
                      return (
                        <div key={productId} className="product-card">
                          <div className="product-checkbox">
                            <input
                              type="checkbox"
                              id={`product-${productId}`}
                              checked={selectedProducts.includes(productId)}
                              onChange={() => handleProductSelect(productId)}
                            />
                          </div>
                          <div className="product-content">
                            <div className="product-image">
                              {imagePath ? (
                                <img
                                  src={`http://localhost:5000/uploads/${imagePath}`}
                                  alt={name}
                                  onError={(e) => { e.target.src = 'https://via.placeholder.com/80x80?text=No+Image'; }}
                                />
                              ) : (
                                <div className="image-placeholder">📦</div>
                              )}
                            </div>
                            <div className="product-details">
                              <h3>{name}</h3>
                              <p>{description}</p>
                            </div>
                          </div>
                          <div className="product-actions">
                            <button className="btn-instagram" onClick={handleInstagramShare} title="Share on Instagram">📸</button>
                            <button className="btn-whatsapp" onClick={handleWhatsAppShare} title="Share on WhatsApp">💬</button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
            {/* Instagram Column */}
            <div className="marketing-panel">
              <div className="panel-header">
                <h2>📱 Instagram</h2>
              </div>
              <div className="instagram-section">
                <div className="upload-section">
                  <h3>Uploading</h3>
                  <div className="upload-buttons">
                    <button className="btn-upload" onClick={handleInstagramShare}>📸 Post to Instagram</button>
                  </div>
                </div>
                <div className="description-section">
                  <label>Description</label>
                  <textarea
                    value={shareMessage || generateShareMessage()}
                    onChange={(e) => setShareMessage(e.target.value)}
                    placeholder="Select products to generate message..."
                    rows="8"
                  />
                </div>
                <div className="hashtags-section">
                  <label>Marketing Hashtags</label>
                  <div className="hashtags">
                    <span className="hashtag">#ProductLaunch</span>
                    <span className="hashtag">#ShopNow</span>
                    <span className="hashtag">#BestDeals</span>
                    <span className="hashtag">#NewArrivals</span>
                    <span className="hashtag">#TrendingNow</span>
                    <span className="hashtag">#OnlineShopping</span>
                  </div>
                </div>
                <button className="btn-instagram-share" onClick={handleInstagramShare}>📸 Share on Instagram</button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
