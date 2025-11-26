import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

function Dashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  // Stats Data - NOW 4 CARDS
  const todayStats = {
    salesProducts: { count: 2341, percentage: 80 },
    stockProducts: { count: 178, percentage: 30 },
    returnProducts: { count: 67, percentage: 20 },
    growthRatio: { count: 28, percentage: 75 }  // NEW 4TH CARD
  };

  // Sales Chart Data
  const salesData = [
    { time: '10am', value: 45 },
    { time: '11am', value: 52 },
    { time: '12am', value: 32 },
    { time: '01am', value: 48 },
    { time: '02am', value: 60 },
    { time: '03am', value: 38 },
    { time: '04am', value: 94, highlight: true, sales: 3672 },
    { time: '05am', value: 50 },
    { time: '06am', value: 42 },
    { time: '07am', value: 78 }
  ];

  // Top Products Data
  const topProducts = [
    {
      id: 1,
      name: 'iPhone 14 Pro',
      category: 'Electronics',
      icon: '📱',
      iconBg: 'blue-bg',
      sales: 45678,
      change: 12.5
    },
    {
      id: 2,
      name: 'Nike Air Max',
      category: 'Fashion',
      icon: '👟',
      iconBg: 'green-bg',
      sales: 32450,
      change: 8.3
    },
    {
      id: 3,
      name: 'MacBook Pro M3',
      category: 'Electronics',
      icon: '💻',
      iconBg: 'red-bg',
      sales: 28990,
      change: 15.7
    },
    {
      id: 4,
      name: 'AirPods Pro',
      category: 'Electronics',
      icon: '🎧',
      iconBg: 'purple-bg',
      sales: 24120,
      change: -3.2
    },
    {
      id: 5,
      name: 'Adidas T-Shirt',
      category: 'Fashion',
      icon: '👕',
      iconBg: 'orange-bg',
      sales: 18540,
      change: 6.8
    }
  ];

  // Analytics Data
  const analyticsData = [
    {
      id: 1,
      title: 'Total Revenue',
      value: '$124,560',
      trend: '+18.2% from last month',
      icon: '💰',
      iconClass: 'revenue-icon',
      isPositive: true
    },
    {
      id: 2,
      title: 'Total Customers',
      value: '8,462',
      trend: '+12.5% from last month',
      icon: '👥',
      iconClass: 'customers-icon',
      isPositive: true
    },
    {
      id: 3,
      title: 'Total Orders',
      value: '3,245',
      trend: '+8.3% from last month',
      icon: '📦',
      iconClass: 'orders-icon',
      isPositive: true
    },
    {
      id: 4,
      title: 'Conversion Rate',
      value: '3.24%',
      trend: '-2.1% from last month',
      icon: '📈',
      iconClass: 'conversion-icon',
      isPositive: false
    }
  ];

  return (
    <div className="crm-dashboard">
      {/* Compact Sidebar */}
      <aside className="crm-sidebar">
        <div className="sidebar-logo">
          <span className="logo-icon">🏪</span>
        </div>

        <nav className="sidebar-nav">
          <button 
            className="nav-item active" 
            onClick={() => navigate('/dashboard')}
            title="Dashboard"
          >
            <span className="nav-icon">📊</span>
          </button>
          
          <button 
            className="nav-item" 
            onClick={() => navigate('/customer')}
            title="Customer Details"
          >
            <span className="nav-icon">👥</span>
          </button>
          
          <button 
            className="nav-item" 
            onClick={() => navigate('/stock')}
            title="Stock Update"
          >
            <span className="nav-icon">📦</span>
          </button>
          
          <button 
            className="nav-item" 
            onClick={() => navigate('/marketing')}
            title="Marketing"
          >
            <span className="nav-icon">📢</span>
          </button>
          
          <button 
            className="nav-item" 
            onClick={() => navigate('/portfolio')}
            title="Portfolio"
          >
            <span className="nav-icon">💼</span>
          </button>
          
          <button 
            className="nav-item" 
            onClick={() => navigate('/settings')}
            title="Settings"
          >
            <span className="nav-icon">⚙️</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="crm-main">
        {/* TOP NAVBAR */}
        <header className="crm-navbar">
          <div className="navbar-left">
            <h1>Dashboard</h1>
          </div>
          <div className="navbar-right">
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="crm-content">
          {/* ROW 1: 4 STAT CARDS - NOW WITH GROWTH RATIO */}
          <div className="stats-row-four">
            <div className="stat-card">
              <div className="stat-left">
                <div className="stat-icon blue-bg">📊</div>
                <div className="stat-info">
                  <h3>{todayStats.salesProducts.count}+</h3>
                  <p>Today's Sale</p>
                </div>
              </div>
              <div className="stat-progress">
                <svg viewBox="0 0 36 36" className="circular-chart">
                  <path
                    className="circle-bg"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="circle blue-circle"
                    strokeDasharray={`${todayStats.salesProducts.percentage}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <text x="18" y="20.35" className="percentage-text">
                    {todayStats.salesProducts.percentage}%
                  </text>
                </svg>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-left">
                <div className="stat-icon green-bg">📦</div>
                <div className="stat-info">
                  <h3>{todayStats.stockProducts.count}+</h3>
                  <p>Top SKU Category</p>
                </div>
              </div>
              <div className="stat-progress">
                <svg viewBox="0 0 36 36" className="circular-chart">
                  <path
                    className="circle-bg"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="circle green-circle"
                    strokeDasharray={`${todayStats.stockProducts.percentage}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <text x="18" y="20.35" className="percentage-text">
                    {todayStats.stockProducts.percentage}%
                  </text>
                </svg>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-left">
                <div className="stat-icon red-bg">↩️</div>
                <div className="stat-info">
                  <h3>{todayStats.returnProducts.count}+</h3>
                  <p>Repeat Customer Rate</p>
                </div>
              </div>
              <div className="stat-progress">
                <svg viewBox="0 0 36 36" className="circular-chart">
                  <path
                    className="circle-bg"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="circle red-circle"
                    strokeDasharray={`${todayStats.returnProducts.percentage}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <text x="18" y="20.35" className="percentage-text">
                    {todayStats.returnProducts.percentage}%
                  </text>
                </svg>
              </div>
            </div>

            {/* NEW 4TH CARD - GROWTH RATIO */}
            <div className="stat-card">
              <div className="stat-left">
                <div className="stat-icon purple-bg">📈</div>
                <div className="stat-info">
                  <h3>{todayStats.growthRatio.count}%</h3>
                  <p>Growth Ratio</p>
                </div>
              </div>
              <div className="stat-progress">
                <svg viewBox="0 0 36 36" className="circular-chart">
                  <path
                    className="circle-bg"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="circle purple-circle"
                    strokeDasharray={`${todayStats.growthRatio.percentage}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <text x="18" y="20.35" className="percentage-text">
                    {todayStats.growthRatio.percentage}%
                  </text>
                </svg>
              </div>
            </div>
          </div>

          {/* ROW 2: Sales Reports + Top Products */}
          <div className="content-row-two">
            {/* Sales Reports Chart */}
            <div className="card sales-chart-card">
              <div className="card-header">
                <h2 className="card-title">Sales Reports</h2>
                <div className="header-controls">
                  <select className="time-select">
                    <option>Weekly</option>
                    <option>Monthly</option>
                    <option>Yearly</option>
                  </select>
                  <button className="menu-btn">⋯</button>
                </div>
              </div>
              <div className="chart-wrapper">
                <svg viewBox="0 0 800 300" className="line-chart" preserveAspectRatio="xMidYMid meet">
                  {/* Grid lines */}
                  {[0, 20, 40, 60, 80, 100].map((y) => (
                    <line
                      key={y}
                      x1="50"
                      y1={280 - y * 2.4}
                      x2="750"
                      y2={280 - y * 2.4}
                      stroke="#F3F4F6"
                      strokeWidth="1"
                    />
                  ))}
                  
                  {/* Y-axis labels */}
                  {[0, 20, 40, 60, 80, 100].map((y) => (
                    <text
                      key={y}
                      x="30"
                      y={285 - y * 2.4}
                      fontSize="12"
                      fill="#9CA3AF"
                    >
                      {y}
                    </text>
                  ))}

                  {/* Area fill gradient */}
                  <defs>
                    <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  <polygon
                    fill="url(#areaGradient)"
                    points={`${salesData
                      .map((d, i) => `${70 + i * 70},${280 - d.value * 2.4}`)
                      .join(' ')} 700,280 70,280`}
                  />

                  {/* Line path */}
                  <polyline
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth="3"
                    points={salesData
                      .map((d, i) => `${70 + i * 70},${280 - d.value * 2.4}`)
                      .join(' ')}
                  />

                  {/* Data points */}
                  {salesData.map((d, i) => (
                    <g key={i}>
                      <circle
                        cx={70 + i * 70}
                        cy={280 - d.value * 2.4}
                        r="5"
                        fill="#3B82F6"
                        stroke="white"
                        strokeWidth="2"
                      />
                      {d.highlight && (
                        <>
                          <rect
                            x={70 + i * 70 - 40}
                            y={280 - d.value * 2.4 - 70}
                            width="80"
                            height="50"
                            rx="8"
                            fill="#1E293B"
                          />
                          <text
                            x={70 + i * 70}
                            y={280 - d.value * 2.4 - 50}
                            fontSize="12"
                            fill="white"
                            textAnchor="middle"
                          >
                            Sales
                          </text>
                          <text
                            x={70 + i * 70}
                            y={280 - d.value * 2.4 - 30}
                            fontSize="18"
                            fontWeight="bold"
                            fill="white"
                            textAnchor="middle"
                          >
                            {d.sales.toLocaleString()}
                          </text>
                        </>
                      )}
                      <text
                        x={70 + i * 70}
                        y="295"
                        fontSize="11"
                        fill="#9CA3AF"
                        textAnchor="middle"
                      >
                        {d.time}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>
            </div>

            {/* Top Products Card */}
            <div className="card top-products-card">
              <div className="card-header">
                <h2 className="card-title">Top Products</h2>
                <button className="see-more-btn">See more</button>
              </div>
              <div className="products-list">
                {topProducts.map((product) => (
                  <div key={product.id} className="product-item">
                    <div className="product-info">
                      <div className={`product-icon-box ${product.iconBg}`}>
                        {product.icon}
                      </div>
                      <div className="product-details">
                        <h4>{product.name}</h4>
                        <p>{product.category}</p>
                      </div>
                    </div>
                    <div className="product-stats">
                      <span className="product-sales">
                        ${product.sales.toLocaleString()}
                      </span>
                      <span className={`product-percentage ${product.change >= 0 ? 'green' : 'red'}`}>
                        {product.change >= 0 ? '+' : ''}{product.change}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ROW 3: Analytics Card - Full Width */}
          <div className="analytics-full-card card">
            <div className="card-header">
              <h2 className="card-title">Analytics Overview</h2>
              <button className="menu-btn">⋯</button>
            </div>
            <div className="analytics-grid">
              {analyticsData.map((item) => (
                <div key={item.id} className="analytics-box">
                  <div className={`analytics-icon ${item.iconClass}`}>
                    {item.icon}
                  </div>
                  <div className="analytics-content">
                    <h4>{item.title}</h4>
                    <h3>{item.value}</h3>
                    <span className={`analytics-trend ${item.isPositive ? 'positive' : 'negative'}`}>
                      {item.trend}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
