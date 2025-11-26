import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <nav className="navbar">
        <div className="navbar-brand">
          <h2>ShopGrow</h2>
        </div>
      </nav>

      <div className="auth-section">
        <h1 className="welcome-text">Welcome to ShopGrow</h1>
        <div className="auth-buttons">
          <button 
            className="auth-button login-button" 
            onClick={() => navigate('/login')}
          >
            Login
          </button>
          <button 
            className="auth-button register-button" 
            onClick={() => navigate('/register')}
          >
            Register
          </button>
        </div>
      </div>
    </div>
  );
}

export default Home;
