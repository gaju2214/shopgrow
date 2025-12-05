import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Home from './pages/auth/login'
import Dashboard from './pages/Dashboard'
import Customer from './pages/Customer'
import Stock from './pages/Stock'
import Settings from './pages/Settings'
import Portfolio from './pages/Portfolio'
import Marketing from './pages/Marketing'   // <-- add this import

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/customer" element={<Customer />} />
          <Route path="/stock" element={<Stock />} />
          <Route path="/marketing" element={<Marketing />} />   {/* <-- new route */}
          <Route path="/settings" element={<Settings/>} />
          <Route path="/Portfolio" element={<Portfolio/>} />
        </Routes>
      </div>
    </Router>
  )
}

export default App;