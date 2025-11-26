import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Settings.css';

function Settings() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    storeName: '',
    email: '',
    mobileNumber: '',
    whatsappNumber: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    gstn: '',
    pan: '',
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const mockData = {
      // storeName: 'My Store',
      // email: 'store@example.com',
      // mobileNumber: '9876543210',
      // whatsappNumber: '9876543210',
      // address: '123 Main Street',
      // city: 'Mumbai',
      // state: 'Maharashtra',
      // pincode: '400001',
      // gstn: '27AAAAA0000A1Z5',
      // pan: 'ABCDE1234F'
    };
    setFormData(prev => ({
      ...prev,
      ...mockData
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setError('❌ New passwords do not match!');
      setLoading(false);
      return;
    }
    if (formData.newPassword && !formData.oldPassword) {
      setError('❌ Please enter old password to change password!');
      setLoading(false);
      return;
    }

    setTimeout(() => {
      setSuccess('✅ Settings updated successfully!');
      setLoading(false);
      setFormData((prev) => ({
        ...prev,
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    }, 1000);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="crm-dashboard">
      <aside className="crm-sidebar">
        <div className="sidebar-logo">
          <span className="logo-icon">⚙️</span>
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
          <button className="nav-item" onClick={() => navigate('/portfolio')} title="Portfolio">
            <span className="nav-icon">💼</span>
          </button>
          <button className="nav-item active" onClick={() => navigate('/settings')} title="Settings">
            <span className="nav-icon">⚙️</span>
          </button>
        </nav>
      </aside>

      <main className="crm-main">
        <div className="crm-navbar">
          <div className="navbar-left">
            <h1>Store Settings</h1>
            <p className="header-date">
              {new Date().toLocaleDateString('en-IN', { 
                day: '2-digit', 
                month: 'short', 
                year: 'numeric', 
                weekday: 'long' 
              })}
            </p>
          </div>
          <div className="navbar-right">
            <button onClick={handleLogout} className="logout-btn" title="Logout">
              Logout
            </button>
          </div>
        </div>

        <div className="crm-content">
          <div className="settings-panel">
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <form onSubmit={handleSubmit} className="settings-form">
              {/* Store Information - 2 Column Layout */}
              <div className="form-section">
                <h2 className="section-title">Store Information</h2>
                <div className="form-row-2col">
                  <div className="form-group">
                    <label>Product Name *</label>
                    <input 
                      name="storeName" 
                      value={formData.storeName} 
                      onChange={handleChange} 
                      disabled={loading} 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label>Email *</label>
                    <input 
                      type="email" 
                      name="email" 
                      value={formData.email} 
                      onChange={handleChange} 
                      disabled={loading} 
                      required 
                    />
                  </div>
                </div>

                <div className="form-row-2col">
                  <div className="form-group">
                    <label>Mobile *</label>
                    <input 
                      type="tel" 
                      name="mobileNumber" 
                      maxLength={10} 
                      value={formData.mobileNumber} 
                      onChange={handleChange} 
                      disabled={loading} 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label>WhatsApp</label>
                    <input 
                      type="tel" 
                      name="whatsappNumber" 
                      maxLength={10} 
                      value={formData.whatsappNumber} 
                      onChange={handleChange} 
                      disabled={loading} 
                    />
                  </div>
                </div>

                <div className="form-row-2col">
                  <div className="form-group">
                    <label>Address *</label>
                    <input 
                      name="address" 
                      value={formData.address} 
                      onChange={handleChange} 
                      disabled={loading} 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label>City *</label>
                    <input 
                      name="city" 
                      value={formData.city} 
                      onChange={handleChange} 
                      disabled={loading} 
                      required 
                    />
                  </div>
                </div>

                <div className="form-row-2col">
                  <div className="form-group">
                    <label>State *</label>
                    <input 
                      name="state" 
                      value={formData.state} 
                      onChange={handleChange} 
                      disabled={loading} 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label>Pincode *</label>
                    <input 
                      name="pincode" 
                      maxLength={6} 
                      value={formData.pincode} 
                      onChange={handleChange} 
                      disabled={loading} 
                      required 
                    />
                  </div>
                </div>

                <div className="form-row-2col">
                  <div className="form-group">
                    <label>GST *</label>
                    <input 
                      name="gstn" 
                      maxLength={15} 
                      value={formData.gstn} 
                      onChange={handleChange} 
                      disabled={loading} 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label>Instagram *</label>
                    <input 
                      name="pan" 
                      maxLength={10} 
                      value={formData.pan} 
                      onChange={handleChange} 
                      disabled={loading} 
                      required 
                    />
                  </div>
                </div>
              </div>

              {/* Change Password Section */}
              <div className="form-section">
                <h2 className="section-title">Change Password</h2>
                <div className="form-group full-width">
                  <label>Old Password</label>
                  <div className="password-input-group">
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      name="oldPassword" 
                      value={formData.oldPassword} 
                      onChange={handleChange} 
                      disabled={loading} 
                    />
                    <button 
                      type="button" 
                      className="toggle-password" 
                      onClick={() => setShowPassword(!showPassword)} 
                      disabled={loading}
                    >
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>

                <div className="form-row-2col">
                  <div className="form-group">
                    <label>New Password</label>
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      name="newPassword" 
                      value={formData.newPassword} 
                      onChange={handleChange} 
                      disabled={loading} 
                    />
                  </div>
                  <div className="form-group">
                    <label>Confirm Password</label>
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      name="confirmPassword" 
                      value={formData.confirmPassword} 
                      onChange={handleChange} 
                      disabled={loading} 
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="form-submit">
                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? '⏳ Updating...' : '✅ Update Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Settings;
