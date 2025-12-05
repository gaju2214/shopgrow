import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './Marketing.css';


export default function Marketing() {
  const [instagramToken, setInstagramToken] = useState('');
  const [instagramTokenId, setInstagramTokenId] = useState('');
  const [showReelModal, setShowReelModal] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [reelForm, setReelForm] = useState({
    caption: '',
    video: null,
    tags: '',
    people: '',
    location: ''
  });
  const [postForm, setPostForm] = useState({
    caption: '',
    image: null,
    tags: '',
    people: '',
    location: ''
  });
  const [reelPreview, setReelPreview] = useState(null);
  const [postPreview, setPostPreview] = useState(null);
  const [reelLoading, setReelLoading] = useState(false);
  const [postLoading, setPostLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [shareMessage, setShareMessage] = useState('');

  // ✅ Helper function to get product image
  const getProductImage = (product) => {
    // Check if image_urls array exists and has items
    if (product.image_urls && Array.isArray(product.image_urls) && product.image_urls.length > 0) {
      return product.image_urls[0]; // Get first image from array
    }
    // Fallback to image field if exists
    if (product.image) {
      return product.image;
    }
    // No image available
    return null;
  };

  const handleInstagramProductPost = async () => {
    const token = localStorage.getItem('authToken');
    const storeId = localStorage.getItem('storeId');
    if (!storeId || !token) {
      alert('Store or token missing! Please login again.');
      return;
    }
    if (selectedProducts.length === 0) {
      alert('Please select at least one product to post.');
      return;
    }
    if (!instagramToken) {
      alert('Instagram token not found. Please connect your Instagram account in Settings.');
      return;
    }
    const productsToPost = products
      .filter(p => selectedProducts.includes(p.id || p._id))
      .map(p => ({
        ...p,
        image_url: getProductImage(p) || '' // Always send image_url for backend
      }));
    try {
      const res = await fetch('http://localhost:5000/api/instagram/post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          store_id: storeId,
          instagram_token: instagramToken,
          products: productsToPost
        })
      });
      if (res.ok) {
        alert('Posted to Instagram!');
      } else {
        const data = await res.json();
        alert('Error posting to Instagram: ' + (data.message || 'Unknown error'));
      }
    } catch (err) {
      alert('Error posting to Instagram');
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const storeId = localStorage.getItem('storeId');
    if (!storeId || !token) return;
    fetch(`http://localhost:5000/api/tokens/store/${storeId}/platform/instagram`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setInstagramToken(data.long_token || '');
        setInstagramTokenId(data.id || '');
      })
      .catch(() => {
        setInstagramToken('');
        setInstagramTokenId('');
      });
  }, []);

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
      
      console.log('📦 Fetched products:', productsList); // Debug log
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

  // Handlers for Add Reel/Post
  const handleOpenReelModal = () => {
    setShowReelModal(true);
    setReelForm({ caption: '', video: null });
    setReelPreview(null);
  };
  const handleOpenPostModal = () => {
    setShowPostModal(true);
    setPostForm({ caption: '', image: null });
    setPostPreview(null);
  };
  const handleReelFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setReelForm(prev => ({ ...prev, video: file }));
      const reader = new FileReader();
      reader.onloadend = () => setReelPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };
  const handlePostFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPostForm(prev => ({ ...prev, image: file }));
      const reader = new FileReader();
      reader.onloadend = () => setPostPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };
  const handleReelFormChange = (e) => {
    setReelForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };
  const handlePostFormChange = (e) => {
    setPostForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };
  // Dummy submit handlers
  const handleReelSubmit = (e) => {
    e.preventDefault();
    setReelLoading(true);
    setTimeout(() => {
      setReelLoading(false);
      setShowReelModal(false);
      alert('Reel submitted!');
    }, 1200);
  };
  const handlePostSubmit = (e) => {
    e.preventDefault();
    setPostLoading(true);
    setTimeout(() => {
      setPostLoading(false);
      setShowPostModal(false);
      alert('Post submitted!');
    }, 1200);
  };

  return (
    <div className="crm-dashboard">
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
            <button className="add-reel-btn" title="Add Reel" onClick={handleOpenReelModal}>
              🎬 Add Reel
            </button>
            <button className="add-post-btn" title="Add Post" onClick={handleOpenPostModal}>
              📝 Add Post
            </button>
      {/* ADD REEL MODAL */}
      {showReelModal && (
        <div className="modal-overlay" onClick={() => setShowReelModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Instagram Reel</h2>
              <button className="close-btn" onClick={() => setShowReelModal(false)}>×</button>
            </div>
            <form onSubmit={handleReelSubmit} className="modal-form">
              <div className="form-group full-width">
                <label htmlFor="reelCaption">Caption</label>
                <textarea
                  id="reelCaption"
                  name="caption"
                  placeholder="Enter reel caption"
                  value={reelForm.caption || ''}
                  onChange={handleReelFormChange}
                  rows="2"
                  required
                />
              </div>
              <div className="form-group full-width">
                <label htmlFor="reelTags">Tags</label>
                <input
                  type="text"
                  id="reelTags"
                  name="tags"
                  placeholder="e.g. #fashion #sale"
                  value={reelForm.tags || ''}
                  onChange={handleReelFormChange}
                />
              </div>
              <div className="form-group full-width">
                <label htmlFor="reelPeople">Tag People</label>
                <input
                  type="text"
                  id="reelPeople"
                  name="people"
                  placeholder="@username1, @username2"
                  value={reelForm.people || ''}
                  onChange={handleReelFormChange}
                />
              </div>
              <div className="form-group full-width">
                <label htmlFor="reelLocation">Location</label>
                <input
                  type="text"
                  id="reelLocation"
                  name="location"
                  placeholder="Add location"
                  value={reelForm.location || ''}
                  onChange={handleReelFormChange}
                />
              </div>
              <div className="form-group full-width">
                <label>Upload Reel Video</label>
                {reelPreview ? (
                  <div className="image-preview">
                    <video src={reelPreview} controls width="100%" />
                    <button type="button" className="btn-remove" onClick={() => { setReelForm(prev => ({ ...prev, video: null })); setReelPreview(null); }}>✕</button>
                  </div>
                ) : (
                  <label className="upload-area">
                    <input type="file" accept="video/*" onChange={handleReelFileChange} hidden />
                    <div className="upload-content">
                      <span className="upload-icon">🎬</span>
                      <span>Click to upload video</span>
                      <span className="upload-hint">MP4, MOV (Max 50MB)</span>
                    </div>
                  </label>
                )}
              </div>
              <button type="submit" className="modal-submit-btn" disabled={reelLoading}>
                {reelLoading ? 'Uploading...' : 'Add Reel'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ADD POST MODAL */}
      {showPostModal && (
        <div className="modal-overlay" onClick={() => setShowPostModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Instagram Post</h2>
              <button className="close-btn" onClick={() => setShowPostModal(false)}>×</button>
            </div>
            <form onSubmit={handlePostSubmit} className="modal-form">
              <div className="form-group full-width">
                <label htmlFor="postCaption">Caption</label>
                <textarea
                  id="postCaption"
                  name="caption"
                  placeholder="Enter post caption"
                  value={postForm.caption || ''}
                  onChange={handlePostFormChange}
                  rows="2"
                  required
                />
              </div>
              <div className="form-group full-width">
                <label htmlFor="postTags">Tags</label>
                <input
                  type="text"
                  id="postTags"
                  name="tags"
                  placeholder="e.g. #fashion #sale"
                  value={postForm.tags || ''}
                  onChange={handlePostFormChange}
                />
              </div>
              <div className="form-group full-width">
                <label htmlFor="postPeople">Tag People</label>
                <input
                  type="text"
                  id="postPeople"
                  name="people"
                  placeholder="@username1, @username2"
                  value={postForm.people || ''}
                  onChange={handlePostFormChange}
                />
              </div>
              <div className="form-group full-width">
                <label htmlFor="postLocation">Location</label>
                <input
                  type="text"
                  id="postLocation"
                  name="location"
                  placeholder="Add location"
                  value={postForm.location || ''}
                  onChange={handlePostFormChange}
                />
              </div>
              <div className="form-group full-width">
                <label>Upload Image</label>
                {postPreview ? (
                  <div className="image-preview">
                    <img src={postPreview} alt="Post Preview" />
                    <button type="button" className="btn-remove" onClick={() => { setPostForm(prev => ({ ...prev, image: null })); setPostPreview(null); }}>✕</button>
                  </div>
                ) : (
                  <label className="upload-area">
                    <input type="file" accept="image/*" onChange={handlePostFileChange} hidden />
                    <div className="upload-content">
                      <span className="upload-icon">🖼️</span>
                      <span>Click to upload image</span>
                      <span className="upload-hint">JPG, PNG, GIF (Max 10MB)</span>
                    </div>
                  </label>
                )}
              </div>
              <button type="submit" className="modal-submit-btn" disabled={postLoading}>
                {postLoading ? 'Uploading...' : 'Add Post'}
              </button>
            </form>
          </div>
        </div>
      )}
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
                      <button onClick={() => navigate('/stock')} className="btn-add-product">
                        + Add Products
                      </button>
                    </div>
                  ) : (
                    products.map((product) => {
                      const productId = product._id || product.id;
                      const name = product.name || product.product_name || product.description;
                      const description = product.description || product.specification || '';
                      
                      // ✅ Use the helper function to get image
                      const imageUrl = getProductImage(product);
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
                              <img
                                src={imageUrl || 'https://placehold.co/80x80?text=No+Image'}
                                alt={name}
                                onError={(e) => { 
                                  console.log('❌ Image load error for:', imageUrl);
                                  e.target.src = 'https://placehold.co/80x80?text=No+Image'; 
                                }}
                                onLoad={() => {
                                  if (imageUrl) console.log('✅ Image loaded successfully:', imageUrl);
                                }}
                              />
                            </div>
                            <div className="product-details">
                              <h3>{name}</h3>
                              <p>{description}</p>
                            </div>
                          </div>
                          <div className="product-actions">
                            <button 
                              className="btn-instagram" 
                              onClick={handleInstagramShare} 
                              title="Share on Instagram"
                            >
                              📸
                            </button>
                            <button 
                              className="btn-whatsapp" 
                              onClick={handleWhatsAppShare} 
                              title="Share on WhatsApp"
                            >
                              💬
                            </button>
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
                <button 
                  className="btn-upload" 
                  onClick={handleInstagramProductPost}
                  disabled={!instagramToken || selectedProducts.length === 0}
                  title={
                    !instagramToken
                      ? 'Connect Instagram in Settings'
                      : selectedProducts.length === 0
                      ? 'Select products first'
                      : 'Post to Instagram'
                  }
                >
                  📸 Post to Instagram
                </button>
              </div>

              <div className="instagram-section">
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

                <button 
                  className="btn-instagram-share" 
                  onClick={handleInstagramShare}
                  disabled={selectedProducts.length === 0}
                >
                  📸 Share on Instagram
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
