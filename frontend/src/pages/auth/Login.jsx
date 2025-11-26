import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import './Auth.css';

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.postLogin({
        email: formData.email,
        password: formData.password
      });

      if (response.data.success) {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userEmail', response.data.user.email);
        localStorage.setItem('userName', response.data.user.name);
        localStorage.setItem(
          'authToken',
          response.data.token || response.data.authToken
        );

        navigate('/dashboard');
      }
    } catch (err) {
      setLoading(false);

      if (!err.response) {
        setError('No server response. Check your connection.');
      } else if (err.response.status === 401) {
        setError('Invalid email or password.');
      } else if (err.response.status === 404) {
        setError('User not found.');
      } else {
        setError(err.response.data.message || 'Login failed. Try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-card">
          <h2>Sign In</h2>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="login-form">
            <input
              type="email"
              name="email"
              placeholder="Email address"
              value={formData.email}
              onChange={handleChange}
              required
            />

            <input
              type="password"
              name="password"
              placeholder="Password"
              minLength={6}
              value={formData.password}
              onChange={handleChange}
              required
            />

            <button type="submit" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <p className="small-link">
            Don’t have an account? <Link to="/register">Register</Link>
          </p>

          <p className="small-link">
            <Link to="/">Back to Home</Link>
          </p>
        </div>
      </div>

      <div className="login-right">
        <h1>Welcome to the ShopGrow</h1>
        <img
          className="illustration"
          src="abc.webp"
          alt="trading"
        />
      </div>
    </div>
  );
}

export default Login;
