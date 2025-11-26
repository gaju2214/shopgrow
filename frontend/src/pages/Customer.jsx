import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import './Customer.css';


function Customer() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [salesHistory, setSalesHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    mobileNumber: '',
    paymentMethod: '',
    selling_price: '',
    productId: '',
    productName: '',
    quantity: '1'
  });

  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  useEffect(() => {
    loadProducts();
    loadSalesHistory();
  }, []);

  const getMockSalesData = () => {
    return [
      { 
        id: 1, 
        invoice_id: '#001', 
        customer: 'Rajesh Kumar', 
        mobileNumber: '9876543210',
        product: 'iPhone 14', 
        quantity: 1, 
        amount: 79999, 
        payment_method: 'UPI',
        date: '2025-11-15',
        status: 'Completed' 
      },
      { 
        id: 2, 
        invoice_id: '#002', 
        customer: 'Priya Sharma', 
        mobileNumber: '9123456789',
        product: 'Samsung TV', 
        quantity: 1, 
        amount: 45000, 
        payment_method: 'Cash',
        date: '2025-11-15',
        status: 'Completed' 
      },
      { 
        id: 3, 
        invoice_id: '#003', 
        customer: 'Amit Patel', 
        mobileNumber: '9988776655',
        product: 'Laptop HP', 
        quantity: 2, 
        amount: 89998, 
        payment_method: 'Card',
        date: '2025-11-14',
        status: 'Pending' 
      },
      { 
        id: 4, 
        invoice_id: '#004', 
        customer: 'Sneha Singh', 
        mobileNumber: '9001122334',
        product: 'Headphones', 
        quantity: 3, 
        amount: 8997, 
        payment_method: 'UPI',
        date: '2025-11-14',
        status: 'Failed' 
      }
    ];
  }

  const loadSalesHistory = async () => {
    try {
      setLoading(true);
      const response = await api.getSalesHistory();

      let sales = [];
      if (response?.data?.success) {
        sales = response.data.data || [];
      } else {
        sales = getMockSalesData();
      }
      
      const normalized = (sales && sales.length > 0)
        ? sales.map(sale => ({
            invoice_id: sale.sale_number || sale.invoice_id || '-',
            mobileNumber: sale.customer?.mobile_number || sale.customer_mobile || sale.mobileNumber || sale.mobile_number || sale.mobile || '-',
            name: sale.customer?.name || sale.customer_name || sale.customer || '-',
            product: (sale.items && sale.items[0] && (sale.items[0].product?.name || sale.items[0].product_name)) || sale.product || '-',
            quantity: (sale.items && sale.items[0] && sale.items[0].quantity) || sale.quantity || '-',
            payment_method: sale.payment_method || '-',
            date: sale.sale_date ? new Date(sale.sale_date).toLocaleDateString('en-IN') : (sale.date ? new Date(sale.date).toLocaleDateString('en-IN') : 'Invalid Date'),
            status: (sale.status || 'completed'),
            amount: sale.total_amount !== undefined ? Number(sale.total_amount) : (sale.amount !== undefined ? Number(sale.amount) : 0)
          }) )
        : [];
      setSalesHistory(normalized);
    } catch (error) {
      console.error('Error loading sales history:', error);
      const sales = getMockSalesData();
      const normalized = sales.map(sale => ({
        invoice_id: sale.invoice_id || '-',
        mobileNumber: sale.mobileNumber || '-',
        name: sale.customer || '-',
        product: sale.product || '-',
        quantity: sale.quantity || '-',
        payment_method: sale.payment_method || '-',
        date: sale.date ? new Date(sale.date).toLocaleDateString('en-IN') : 'Invalid Date',
        status: (sale.status || 'completed'),
        amount: sale.amount ? Number(sale.amount) : 0
      }));
      setSalesHistory(normalized);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const resp = await api.getAllProducts();

      let products = [];
      if (resp?.data?.data?.products) {
        products = resp.data.data.products;
      } else if (Array.isArray(resp?.data?.data)) {
        products = resp.data.data;
      } else if (Array.isArray(resp?.data)) {
        products = resp.data;
      }

      setAllProducts(products || []);
    } catch (err) {
      console.error('Failed to load products:', err);
      const mockProducts = [
        { id: '1', name: 'Samsung Galaxy S23', price: 55000, selling_price: 55000 },
        { id: '2', name: 'iPhone 14 Pro', price: 99000, selling_price: 99000 },
      ];
      setAllProducts(mockProducts);
    }
  };

  const handleChange = async (e) => {
    const { name, value } = e.target;
    let updated = { ...formData, [name]: value };

    // Auto-fill customer name when mobile number is entered
    if (name === 'mobileNumber') {
      // Clear name if mobile is being deleted
      if (value.length < 10) {
        updated.name = '';
      }
      
      // Check when exactly 10 digits are entered
      if (value.length === 10) {
        try {
          // First try API lookup
          const response = await api.lookupCustomer(value);
          if (response?.data?.success && response.data.data) {
            const customer = response.data.data;
            const customerName = customer.name || customer.customer_name || '';
            if (customerName && customerName !== '-') {
              updated.name = customerName;
            } else {
              // API returned empty name, check local history
              const found = salesHistory.find(sale => 
                sale.mobileNumber === value && 
                sale.name && 
                sale.name !== '-'
              );
              if (found) {
                updated.name = found.name;
              }
            }
          } else {
            // API returned no data, check local history
            const found = salesHistory.find(sale => 
              sale.mobileNumber === value && 
              sale.name && 
              sale.name !== '-'
            );
            if (found) {
              updated.name = found.name;
            }
          }
        } catch (error) {
          console.log('API lookup failed, checking local history...');
          // API call failed, check local sales history
          const found = salesHistory.find(sale => 
            sale.mobileNumber === value && 
            sale.name && 
            sale.name !== '-'
          );
          if (found) {
            updated.name = found.name;
          }
        }
      }
    }

    setFormData(updated);

    // Product search dropdown logic
    if (name === 'productName') {
      if (value.trim().length > 0) {
        const matches = searchProducts(value);
        setFilteredProducts(matches);
        setShowProductDropdown(matches.length > 0);
      } else {
        setShowProductDropdown(false);
      }
    }
  };

  const searchProducts = (searchTerm) => {
    if (!searchTerm?.trim()) return allProducts;
    const term = searchTerm.toLowerCase().trim();
    return allProducts.filter(product => 
      product?.name?.toLowerCase().includes(term)
    );
  };

  const selectProduct = (product) => {
    const price = product.selling_price || product.price || '';
    setFormData(prev => ({
      ...prev,
      productId: product.id,
      productName: product.name,
      selling_price: String(price)
    }));
    setShowProductDropdown(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitMessage('');
    setSubmitError('');

    if (!formData.name?.trim() || formData.name.length < 2) {
      setSubmitError('❌ Name required');
      return;
    }

    if (!formData.mobileNumber || formData.mobileNumber.length !== 10) {
      setSubmitError('❌ Valid mobile required');
      return;
    }

    if (!formData.paymentMethod) {
      setSubmitError('❌ Select payment method');
      return;
    }

    if (!formData.productId) {
      setSubmitError('❌ Select product');
      return;
    }

    const payload = {
      customer_mobile: formData.mobileNumber.trim(),
      customer_name: formData.name.trim(),
      payment_method: formData.paymentMethod,
      items: [{
        product_id: formData.productId,
        quantity: parseInt(formData.quantity, 10) || 1
      }]
    };

    setSubmitLoading(true);

    try {
      const resp = await api.createSale(payload);

      if (resp?.data?.success) {
        setSubmitMessage('✅ Sale recorded successfully!');
        const newSale = {
          invoice_id: resp.data.data?.sale?.sale_number || resp.data.data?.sale?.invoice_id || '-',
          mobileNumber: formData.mobileNumber,
          name: formData.name,
          product: formData.productName,
          quantity: formData.quantity,
          payment_method: formData.paymentMethod,
          date: new Date().toLocaleDateString('en-IN'),
          status: 'Completed',
          amount: Number(formData.selling_price) || 0
        };
        setSalesHistory(prev => [newSale, ...prev]);

        setTimeout(() => {
          setFormData({
            name: '',
            mobileNumber: '',
            paymentMethod: '',
            selling_price: '',
            productId: '',
            productName: '',
            quantity: '1'
          });
          setSubmitMessage('');
          setShowModal(false);
        }, 1500);
      }
    } catch (err) {
      console.error('Error:', err);
      const errMsg = err.response?.data?.error?.message || err.response?.data?.message || err.message;
      setSubmitError(`❌ ${errMsg}`);
      setTimeout(() => setSubmitError(''), 3000);
    } finally {
      setSubmitLoading(false);
    }
  };

  const calculateStats = () => {
    const completed = salesHistory.filter(s => s.status === 'Completed').length;
    const pending = salesHistory.filter(s => s.status === 'Pending').length;
    const failed = salesHistory.filter(s => s.status === 'Failed').length;
    
    return { completed, pending, failed };
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
          <button className="nav-item active" onClick={() => navigate('/customer')} title="Customer">
            <span className="nav-icon">👥</span>
          </button>
          <button className="nav-item" onClick={() => navigate('/stock')} title="Stock">
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
            <h1>Customer</h1>
          </div>
          <div className="navbar-right">
            <button className="add-product-btn" onClick={() => setShowModal(true)}>
              + Add Sale
            </button>
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>

        <div className="crm-content">
          {/* Stats Cards - 3 IN ROW */}
          <div className="stats-row-three">
            <div className="stat-card">
              <div className="stat-left">
                <div className="stat-icon green-bg">✅</div>
                <div className="stat-info">
                  <h3>{stats.completed}</h3>
                  <p>Completed Sales</p>
                </div>
              </div>
              <div className="stat-badge green">Available</div>
            </div>
            <div className="stat-card">
              <div className="stat-left">
                <div className="stat-icon orange-bg">⏳</div>
                <div className="stat-info">
                  <h3>{stats.pending}</h3>
                  <p>Pending Sales</p>
                </div>
              </div>
              <div className="stat-badge orange">Alert</div>
            </div>
            <div className="stat-card">
              <div className="stat-left">
                <div className="stat-icon red-bg">❌</div>
                <div className="stat-info">
                  <h3>{stats.failed}</h3>
                  <p>Failed Sales</p>
                </div>
              </div>
              <div className="stat-badge red">Urgent</div>
            </div>
          </div>

          {/* Sale History Table */}
          <div className="card sales-table-card">
            <div className="card-header">
              <h2 className="card-title">Sale History</h2>
              <div className="card-actions">
                <input type="text" className="search-input" placeholder="Search sales..." />
                <select className="filter-select">
                  <option value="">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="loading-state">Loading sales history...</div>
            ) : salesHistory.length === 0 ? (
              <div className="empty-state">No sales history found</div>
            ) : (
              <div className="table-container">
                <table className="sales-table">
                  <thead>
                    <tr>
                      <th>INVOICE ID</th>
                      <th>CUSTOMER</th>
                      <th>PRODUCT</th>
                      <th>QUANTITY</th>
                      <th>PAYMENT</th>
                      <th>DATE</th>
                      <th>STATUS</th>
                      <th>AMOUNT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesHistory.map((sale, idx) => {
                      const statusClass = (sale.status || '').toLowerCase().replace(/\s+/g, '-');
                      const amountText = sale.amount ? sale.amount.toLocaleString('en-IN') : '0';
                      return (
                        <tr key={idx}>
                          <td className="invoice-id">{sale.invoice_id || '-'}</td>
                          <td>{sale.name || '-'}</td>
                          <td>{sale.product || '-'}</td>
                          <td>{sale.quantity ?? '-'}</td>
                          <td>{sale.payment_method || '-'}</td>
                          <td>{sale.date}</td>
                          <td>
                            <span className={`status-badge status-${statusClass}`}>
                              {(sale.status || 'Unknown').charAt(0).toUpperCase() + (sale.status || 'Unknown').slice(1).toLowerCase()}
                            </span>
                          </td>
                          <td className="amount">₹{amountText}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="table-footer">
              <span>Page 1 of 1</span>
              <div className="pagination">
                <button>Previous</button>
                <button>Next</button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ADD SALE MODAL */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Sale</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>

            {submitError && <div className="error-message">{submitError}</div>}
            {submitMessage && <div className="success-message">{submitMessage}</div>}

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="mobileNumber">Mobile Number *</label>
                  <input
                    type="tel"
                    id="mobileNumber"
                    name="mobileNumber"
                    placeholder="10-digit mobile"
                    value={formData.mobileNumber}
                    onChange={handleChange}
                    maxLength="10"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="name">Customer Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    placeholder="Enter customer name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="paymentMethod">Payment Method *</label>
                  <select
                    id="paymentMethod"
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select payment method</option>
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="upi">UPI</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="quantity">Quantity *</label>
                  <input
                    type="number"
                    id="quantity"
                    name="quantity"
                    placeholder="Enter quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="form-group full-width" style={{ position: 'relative' }}>
                <label htmlFor="productName">Product Name *</label>
                <input
                  type="text"
                  id="productName"
                  name="productName"
                  placeholder="Search product"
                  value={formData.productName}
                  onChange={handleChange}
                  autoComplete="off"
                  required
                />
                {showProductDropdown && (
                  <div className="product-dropdown">
                    {filteredProducts.map((product) => (
                      <div
                        key={product.id}
                        className="product-item"
                        onClick={() => selectProduct(product)}
                      >
                        {product.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group full-width">
                <label htmlFor="selling_price">Selling Price *</label>
                <input
                  type="number"
                  id="selling_price"
                  name="selling_price"
                  placeholder="Price"
                  value={formData.selling_price}
                  onChange={handleChange}
                  readOnly
                  required
                />
              </div>

              <button type="submit" className="submit-btn" disabled={submitLoading}>
                {submitLoading ? 'Processing...' : 'Submit Sale'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Customer;
