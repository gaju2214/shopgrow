import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import './Stock.css';

function Stock() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState(null);
  
  const [formData, setFormData] = useState({
    productName: '',
    category: '',
    categoryId: '',
    newCategory: '',
    description: '',
    skuId: '',
    steeQuantity: '',
    costPrice: '',
    sellingPrice: '',
    lowStockAlert: '',
    image: null
  });

  const [categories, setCategories] = useState([]);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [categoryError, setCategoryError] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const BASE_URL = 'http://localhost:5000';
  const getAuthToken = () => api.getToken();

  const generateSKU = (productName) => {
    if (!productName) return '';
    const productCode = productName.substring(0, 5).toUpperCase();
    const randomNumbers = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
    return `${productCode}${randomNumbers}`;
  };

  const getProductSKU = (product) => {
    return product.sku || '—';
  };

  const getProductCategory = (product) => {
    if (!product.category) {
      return '—';
    }
    
    if (typeof product.category === 'object' && product.category !== null) {
      return product.category.name || product.category.category_name || '—';
    }
    
    if (typeof product.category === 'string') {
      return product.category;
    }
    
    return '—';
  };

  const getProductName = (product) => {
    return product.name || product.product_name || '—';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    let updatedFormData = {
      ...formData,
      [name]: value
    };

    if (name === 'productName') {
      if (updatedFormData.productName) {
        updatedFormData.skuId = generateSKU(updatedFormData.productName);
      }
    }

    if (name === 'categoryId') {
      const sel = categories.find(c => (c.id || c._id) === value);
      if (sel) {
        updatedFormData.category = sel.name;
      }
    }

    setFormData(updatedFormData);
    if (error) setError('');
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        alert('Please upload a valid image file (JPEG, PNG, or GIF)');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('File size should be less than 5MB');
        return;
      }

      setFormData(prevState => ({ ...prevState, image: file }));

      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setFormData(prevState => ({ ...prevState, image: null }));
    setImagePreview(null);
  };

  const fetchCategories = async () => {
    try {
      const token = getAuthToken();

      const predefinedCategories = [
        { id: 'electronics', name: 'Electronics' },
        { id: 'books', name: 'Books' },
        { id: 'tabs', name: 'Tabs' },
        { id: 'laptops', name: 'Laptops' }
      ];

      if (!token) {
        setCategories(predefinedCategories);
        return;
      }

      try {
        const resp = await api.client.get(`${BASE_URL}/api/categories`, {
          headers: api.authHeaders()
        });

        let backendCategories = [];
        if (Array.isArray(resp.data?.data?.categories)) backendCategories = resp.data.data.categories;
        else if (Array.isArray(resp.data?.categories)) backendCategories = resp.data.categories;
        else if (Array.isArray(resp.data?.data)) backendCategories = resp.data.data;

        const normalized = backendCategories.map(c => ({ 
          id: c.id || c._id || c.name, 
          name: c.name || c.label || String(c) 
        }));

        const merged = [...predefinedCategories, ...normalized];
        const unique = merged.filter((v, i, a) => i === a.findIndex(x => x.name.toLowerCase() === v.name.toLowerCase()));

        setCategories(unique);

      } catch (categoryErr) {
        setCategories(predefinedCategories);
      }
    } catch (err) {
      console.error('Error fetching categories:', err.message);
    }
  };

  const loadProducts = async (page = 1, search = '', category = '') => {
    try {
      setLoading(true);
      const token = getAuthToken();
      
      if (!token) {
        setProducts([]);
        setLoading(false);
        return;
      }

      let url = `${BASE_URL}/api/products`;
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', 10);
      if (search) params.append('search', search);
      if (category) params.append('category_id', category);
      
      url += `?${params.toString()}`;

      const response = await api.client.get(url, {
        headers: api.authHeaders(),
        timeout: 5000
      });

      if (response?.data?.success) {
        const productsData = response.data.data?.products || response.data.data || [];
        setProducts(productsData);
        
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.totalPages || 1);
        }
      }
    } catch (error) {
      console.error('Error loading products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    loadProducts(currentPage, searchTerm, selectedCategory);
  }, [currentPage, searchTerm, selectedCategory]);

  const handleAddCategory = async (event) => {
    event.preventDefault();
    
    if (!formData.newCategory.trim()) {
      setCategoryError('Category name is required');
      return;
    }

    try {
      setCategoryLoading(true);
      setCategoryError('');

      const payload = { name: formData.newCategory.trim() };

      const response = await api.client.post(`${BASE_URL}/api/categories`, payload, {
        headers: api.authHeaders()
      });

      const d = response.data || {};
      const created = d.data || d;
      const newCat = created?.category || created || d.category || { 
        id: d.id || d._id || d.name, 
        name: formData.newCategory 
      };
      
      setCategories(prev => [...prev, newCat]);

      setFormData(prev => ({
        ...prev,
        category: newCat.name,
        categoryId: String(newCat.id || newCat._id || ''),
        newCategory: ''
      }));

      setShowNewCategory(false);
      setSuccessMessage('✅ Category created successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);

    } catch (error) {
      setCategoryError(error.response?.data?.message || 'Failed to create category');
    } finally {
      setCategoryLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setError('');
    setSuccessMessage('');

    if (!formData.productName || !formData.categoryId || !formData.description || !formData.skuId || 
        !formData.steeQuantity || !formData.costPrice || !formData.sellingPrice) {
      setError('❌ Please fill all required fields!');
      setSubmitLoading(false);
      return;
    }

    try {
      const token = getAuthToken();
      if (!token) {
        setError('Authorization token missing. Please login.');
        setSubmitLoading(false);
        return;
      }

      const productData = {
        name: formData.productName.trim(),
        category_id: formData.categoryId,
        description: formData.description.trim(),
        sku: formData.skuId.trim(),
        stock_quantity: parseInt(formData.steeQuantity),
        cost_price: parseFloat(formData.costPrice),
        selling_price: parseFloat(formData.sellingPrice),
        low_stock_threshold: parseInt(formData.lowStockAlert) || 5
      };

      const response = await api.client.post(
        `${BASE_URL}/api/products`,
        productData,
        {
          headers: {
            ...api.authHeaders(),
            'Content-Type': 'application/json'
          }
        }
      );

      if (response?.data?.success || response?.status === 201 || response?.status === 200) {
        setSuccessMessage('✅ Product added successfully!');

        setFormData({
          productName: '',
          category: '',
          categoryId: '',
          newCategory: '',
          description: '',
          skuId: '',
          steeQuantity: '',
          costPrice: '',
          sellingPrice: '',
          lowStockAlert: '',
          image: null
        });
        setImagePreview(null);

        setTimeout(() => {
          setSuccessMessage('');
          setShowModal(false);
          loadProducts(currentPage, searchTerm, selectedCategory);
        }, 1500);
      }
    } catch (err) {
      console.error('❌ Add Error:', err.response?.data);
      
      let errorMsg = 'Failed to add product';
      if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMsg = typeof err.response.data.error === 'string' 
          ? err.response.data.error 
          : err.response.data.error.message || 'Invalid request';
      }
      
      setError('❌ ' + errorMsg);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      productName: getProductName(product),
      category: getProductCategory(product),
      categoryId: String(product.category_id || product.category || ''),
      newCategory: '',
      description: product.description || '',
      skuId: getProductSKU(product),
      steeQuantity: String(product.stock_quantity || 0),
      costPrice: String(product.cost_price || 0),
      sellingPrice: String(product.selling_price || 0),
      lowStockAlert: String(product.low_stock_threshold || product.low_stock_alert || 5),
      image: null
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setError('');

    try {
      const token = getAuthToken();
      if (!token) {
        setError('❌ Authorization token missing');
        setSubmitLoading(false);
        return;
      }

      const productId = editingProduct.id || editingProduct._id || editingProduct.product_id;
      
      if (!productId) {
        setError('❌ Product ID not found');
        setSubmitLoading(false);
        return;
      }

      if (!formData.costPrice || parseFloat(formData.costPrice) <= 0) {
        setError('❌ Cost price is required');
        setSubmitLoading(false);
        return;
      }

      const updateData = {
        name: formData.productName.trim(),
        selling_price: Number(formData.sellingPrice),
        stock_quantity: Number(formData.steeQuantity),
        cost_price: Number(formData.costPrice)
      };

      const response = await api.client.put(
        `${BASE_URL}/api/products/${productId}`,
        updateData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response?.data?.success || response?.status === 200) {
        setSuccessMessage('✅ Product updated successfully!');
        
        setProducts(prevProducts => 
          prevProducts.map(p => {
            const pId = p.id || p._id || p.product_id;
            if (pId === productId) {
              return {
                ...p,
                name: formData.productName.trim(),
                selling_price: Number(formData.sellingPrice),
                stock_quantity: Number(formData.steeQuantity),
                cost_price: Number(formData.costPrice)
              };
            }
            return p;
          })
        );
        
        setTimeout(() => {
          setSuccessMessage('');
          setShowEditModal(false);
          setEditingProduct(null);
          setFormData({
            productName: '',
            category: '',
            categoryId: '',
            newCategory: '',
            description: '',
            skuId: '',
            steeQuantity: '',
            costPrice: '',
            sellingPrice: '',
            lowStockAlert: '',
            image: null
          });
        }, 1500);
      }
    } catch (err) {
      console.error('❌ Update Error:', err.response?.data);
      
      let errorMsg = 'Failed to update product';
      if (err.response?.data?.error?.message) {
        errorMsg = err.response.data.error.message;
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      }
      
      setError('❌ ' + errorMsg);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (product) => {
    const productName = getProductName(product);
    
    if (!window.confirm(`Are you sure you want to delete "${productName}"?`)) {
      return;
    }

    try {
      const token = getAuthToken();
      if (!token) {
        setError('❌ Authorization token missing');
        return;
      }

      const productId = product.id || product._id || product.product_id || product.uuid;
      
      if (!productId) {
        console.error('❌ Product:', product);
        setError('❌ Product ID not found');
        return;
      }

      console.log('🗑️ Attempting to delete product:', productId);

      const response = await api.client.delete(
        `${BASE_URL}/api/products/${productId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response?.data?.success || response?.status === 200 || response?.status === 204 || response?.status === 202) {
        setSuccessMessage('✅ Product deleted successfully!');
        
        setProducts(prevProducts => prevProducts.filter(p => {
          const pId = p.id || p._id || p.product_id || p.uuid;
          return pId !== productId;
        }));
        
        setTimeout(() => {
          setSuccessMessage('');
        }, 2000);
      }
    } catch (err) {
      console.error('❌ DELETE ERROR:', err);
      
      let errorMsg = 'Failed to delete product';
      
      if (err.response?.status === 404) {
        errorMsg = 'Product not found (404)';
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      }
      
      setError('❌ ' + errorMsg);
      setTimeout(() => setError(''), 4000);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleCategoryFilter = (e) => {
    setSelectedCategory(e.target.value);
    setCurrentPage(1);
  };

  const calculateStats = () => {
    const inStock = products.filter(p => p.stock_quantity > (p.low_stock_threshold || p.low_stock_alert || 5)).length;
    const lowStock = products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= (p.low_stock_threshold || p.low_stock_alert || 5)).length;
    const outOfStock = products.filter(p => p.stock_quantity === 0).length;
    
    return { inStock, lowStock, outOfStock };
  };

  const stats = calculateStats();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
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
          <button className="nav-item active" onClick={() => navigate('/stock')} title="Stock">
            <span className="nav-icon">📦</span>
          </button>
          <button className="nav-item" onClick={() => navigate('/marketing')} title="Marketing">
            <span className="nav-icon">📢</span>
          </button>
          <button className="nav-item" onClick={() => navigate('/portfolio')} title="Portfolio">
            <span className="nav-icon">💼</span>
          </button>
          <button className="nav-item" onClick={() => navigate('/settings')} title="Settings">
            <span className="nav-icon">⚙️</span>
          </button>
        </nav>
      </aside>

      <main className="crm-main">
        <header className="crm-navbar">
          <div className="navbar-left">
            <h1>Stock Update</h1>
          </div>
          <div className="navbar-right">
            <button className="add-product-btn" onClick={() => setShowModal(true)}>
              + Add Product
            </button>
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>

        <div className="crm-content">
          {successMessage && <div className="success-message">{successMessage}</div>}
          {error && <div className="error-message">{error}</div>}

          <div className="stats-row-three">
            <div className="stat-card">
              <div className="stat-left">
                <div className="stat-icon green-bg">✅</div>
                <div className="stat-info">
                  <h3>{stats.inStock}</h3>
                  <p>In Stock</p>
                </div>
              </div>
              <div className="stat-badge green">Available</div>
            </div>

            <div className="stat-card">
              <div className="stat-left">
                <div className="stat-icon orange-bg">⚠️</div>
                <div className="stat-info">
                  <h3>{stats.lowStock}</h3>
                  <p>Low Stock</p>
                </div>
              </div>
              <div className="stat-badge orange">Alert</div>
            </div>

            <div className="stat-card">
              <div className="stat-left">
                <div className="stat-icon red-bg">❌</div>
                <div className="stat-info">
                  <h3>{stats.outOfStock}</h3>
                  <p>Out of Stock</p>
                </div>
              </div>
              <div className="stat-badge red">Urgent</div>
            </div>
          </div>

          <div className="card products-table-card">
            <div className="card-header">
              <h2 className="card-title">Product History</h2>
              <div className="card-actions">
                <input 
                  type="text" 
                  className="search-input" 
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={handleSearch}
                />
                <select 
                  className="filter-select"
                  value={selectedCategory}
                  onChange={handleCategoryFilter}
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? (
              <div className="loading-state">Loading products...</div>
            ) : products.length === 0 ? (
              <div className="empty-state">No products found</div>
            ) : (
              <div className="table-container">
                <table className="products-table">
                  <thead>
                    <tr>
                      <th>SKU ID</th>
                      <th>Product Name</th>
                      <th>Category</th>
                      <th>Stock</th>
                      <th>Cost Price</th>
                      <th>Selling Price</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => {
                      const stockStatus = product.stock_quantity === 0 
                        ? 'Out of Stock' 
                        : product.stock_quantity <= (product.low_stock_threshold || product.low_stock_alert || 5) 
                        ? 'Low Stock' 
                        : 'In Stock';
                      
                      return (
                        <tr key={product.id || product._id}>
                          <td className="sku-id">{getProductSKU(product)}</td>
                          <td>{getProductName(product)}</td>
                          <td>{getProductCategory(product)}</td>
                          <td>{product.stock_quantity || 0}</td>
                          <td className="amount">₹{(product.cost_price || 0).toLocaleString('en-IN')}</td>
                          <td className="amount">₹{(product.selling_price || 0).toLocaleString('en-IN')}</td>
                          <td>
                            <span className={`status-badge status-${stockStatus.toLowerCase().replace(' ', '-')}`}>
                              {stockStatus}
                            </span>
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button 
                                type="button"
                                className="btn-edit" 
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleEdit(product);
                                }}
                                title="Edit"
                              >
                                ✏️
                              </button>
                              <button 
                                type="button"
                                className="btn-delete" 
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleDelete(product);
                                }}
                                title="Delete"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="table-footer">
              <span>Page {currentPage} of {totalPages}</span>
              <div className="pagination">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ADD PRODUCT MODAL */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Product</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>

            {error && <div className="error-message">{error}</div>}
            {successMessage && <div className="success-message">{successMessage}</div>}

            <form onSubmit={handleSubmit} className="modal-form">
              <button 
                type="button" 
                onClick={() => setShowNewCategory(!showNewCategory)}
                className="btn-add-category"
              >
                + ADD NEW CATEGORY
              </button>

              {showNewCategory && (
                <div className="new-category-section">
                  <div className="form-group full-width">
                    <label htmlFor="newCategory">New Category Name</label>
                    <div className="category-input-group">
                      <input 
                        type="text" 
                        id="newCategory" 
                        name="newCategory" 
                        placeholder="Enter category name" 
                        value={formData.newCategory} 
                        onChange={handleChange} 
                      />
                      <button 
                        type="button" 
                        onClick={handleAddCategory} 
                        className="btn-add" 
                        disabled={categoryLoading}
                      >
                        {categoryLoading ? '...' : 'Add'}
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setShowNewCategory(false)} 
                        className="btn-cancel"
                      >
                        Cancel
                      </button>
                    </div>
                    {categoryError && <div className="error-text">{categoryError}</div>}
                  </div>
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="productName">Product Name *</label>
                  <input 
                    type="text" 
                    id="productName" 
                    name="productName" 
                    placeholder="Enter product name" 
                    value={formData.productName} 
                    onChange={handleChange} 
                    required 
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="categoryId">Category *</label>
                  <select 
                    id="categoryId" 
                    name="categoryId" 
                    value={formData.categoryId} 
                    onChange={handleChange} 
                    required
                  >
                    <option value="">Select category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group full-width">
                <label htmlFor="description">Description *</label>
                <textarea 
                  id="description" 
                  name="description" 
                  placeholder="Enter product description" 
                  value={formData.description} 
                  onChange={handleChange} 
                  rows="3"
                  required 
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="skuId">SKU ID *</label>
                  <input 
                    type="text" 
                    id="skuId" 
                    name="skuId" 
                    placeholder="Auto-generated" 
                    value={formData.skuId} 
                    readOnly
                    required 
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="steeQuantity">Stock Quantity *</label>
                  <input 
                    type="number" 
                    id="steeQuantity" 
                    name="steeQuantity" 
                    placeholder="Enter quantity" 
                    value={formData.steeQuantity} 
                    onChange={handleChange}
                    min="1"
                    required 
                  />
                </div>
              </div>

              <div className="form-row-3">
                <div className="form-group">
                  <label htmlFor="costPrice">Cost Price *</label>
                  <input 
                    type="number" 
                    id="costPrice" 
                    name="costPrice" 
                    placeholder="Enter cost price" 
                    value={formData.costPrice} 
                    onChange={handleChange} 
                    min="0"
                    step="0.01"
                    required 
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="sellingPrice">Selling Price *</label>
                  <input 
                    type="number" 
                    id="sellingPrice" 
                    name="sellingPrice" 
                    placeholder="Enter selling price" 
                    value={formData.sellingPrice} 
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    required 
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="lowStockAlert">Low Stock Alert</label>
                  <input 
                    type="number" 
                    id="lowStockAlert" 
                    name="lowStockAlert" 
                    placeholder="Alert level" 
                    value={formData.lowStockAlert} 
                    onChange={handleChange} 
                    min="0"
                  />
                </div>
              </div>

              <div className="form-group full-width">
                <label>Upload Image</label>
                {imagePreview ? (
                  <div className="image-preview">
                    <img src={imagePreview} alt="Product Preview" />
                    <button type="button" className="btn-remove" onClick={handleRemoveImage}>✕</button>
                  </div>
                ) : (
                  <label className="upload-area">
                    <input type="file" accept="image/*" onChange={handleImageChange} hidden />
                    <div className="upload-content">
                      <span className="upload-icon">📁</span>
                      <span>Click to upload image</span>
                      <span className="upload-hint">JPG, PNG, GIF (Max 5MB)</span>
                    </div>
                  </label>
                )}
              </div>

              <button type="submit" className="modal-submit-btn" disabled={submitLoading}>
                {submitLoading ? 'Adding Product...' : 'Add Product'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PRODUCT MODAL */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Product</h2>
              <button className="close-btn" onClick={() => setShowEditModal(false)}>×</button>
            </div>

            {error && <div className="error-message">{error}</div>}
            {successMessage && <div className="success-message">{successMessage}</div>}

            <form onSubmit={handleUpdate} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="productName">Product Name *</label>
                  <input 
                    type="text" 
                    id="productName" 
                    name="productName" 
                    placeholder="Enter product name" 
                    value={formData.productName} 
                    onChange={handleChange} 
                    required 
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="steeQuantity">Stock Quantity *</label>
                  <input 
                    type="number" 
                    id="steeQuantity" 
                    name="steeQuantity" 
                    placeholder="Enter quantity" 
                    value={formData.steeQuantity} 
                    onChange={handleChange}
                    min="0"
                    required 
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="sellingPrice">Selling Price *</label>
                  <input 
                    type="number" 
                    id="sellingPrice" 
                    name="sellingPrice" 
                    placeholder="Enter selling price" 
                    value={formData.sellingPrice} 
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    required 
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="costPrice">Cost Price *</label>
                  <input 
                    type="number" 
                    id="costPrice" 
                    name="costPrice" 
                    placeholder="Enter cost price" 
                    value={formData.costPrice} 
                    onChange={handleChange} 
                    min="0"
                    step="0.01"
                    required 
                  />
                </div>
              </div>

              <button type="submit" className="modal-submit-btn" disabled={submitLoading}>
                {submitLoading ? 'Updating...' : 'Update Product'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Stock;
