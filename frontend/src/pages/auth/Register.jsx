import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../utils/api";
import "./Auth.css";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    address: "",
    city: "",
    storeName: "",
    category: "",
    storeId: "",
    url: "",
    gstNo: "",
    password: "",
    confirmPassword: "",
    logo: null,
    video: null,
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match!");
      setLoading(false);
      return;
    }

    if (!/^[0-9]{10}$/.test(formData.mobile)) {
      setError("Enter a valid 10-digit mobile number!");
      setLoading(false);
      return;
    }

    try {
      const registrationData = new FormData();
      Object.keys(formData).forEach((key) => {
        if (formData[key]) registrationData.append(key, formData[key]);
      });

      const response = await api.client.post(
        "/api/auth/register",
        registrationData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (response.data.success) {
        alert("Registration Successful!");
        navigate("/login");
      }
    } catch (err) {
      setError("Registration failed. Try again.");
    }

    setLoading(false);
  };

  return (
    <div className="signup-page">

      {/* Left Form Section */}
      <div className="signup-left">
        <div className="signup-card">

          <h2 className="signup-title">Sign Up</h2>

          {error && <div className="error-box">{error}</div>}

          <form onSubmit={handleSubmit} className="signup-form">

            {/* ROW 1 */}
            <div className="form-row-2">
              <div className="input-group">
               
                <input
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="input-group">
            
                <input
                  type="tel"
                  name="mobile"
                  placeholder="Mobile Number (10 digits)"
                  value={formData.mobile}
                  maxLength={10}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* ROW 2 */}
            <div className="form-row-2">
              <div className="input-group">
               
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="input-group">
                
                <input
                  type="text"
                  name="address"
                  placeholder="Address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* ROW 3 */}
            <div className="form-row-2">
              <div className="input-group">
          
                <input
                  type="text"
                  name="city"
                  placeholder="City"
                  value={formData.city}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="input-group">
               
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Category</option>
                  <option value="ElectraPoint">ElectraPoint</option>
                  <option value="SmartPhone Hub">SmartPhone Hub</option>
                  <option value="PC Hub">PC Hub</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* ROW 4 */}
            <div className="form-row-2">
              <div className="input-group">
               
                <input
                  type="text"
                  name="storeName"
                  placeholder="Store Name"
                  value={formData.storeName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="input-group">
                
                <input
                  type="text"
                  name="storeId"
                  placeholder="Store ID"
                  value={formData.storeId}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* ROW 5 */}
            <div className="form-row-2">
              <div className="input-group">
           
                <input
                  type="url"
                  name="url"
                  placeholder="Website / Webpage URL (Optional)"
                  value={formData.url}
                  onChange={handleChange}
                />
              </div>

              <div className="input-group">
             
                <input
                  type="text"
                  name="gstNo"
                  placeholder="GST Number (Optional)"
                  value={formData.gstNo}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* ROW 6 */}
            <div className="form-row-2">
              <div className="input-group">
            
                <input
                  type="password"
                  name="password"
                  placeholder="Password (Min 6 characters)"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="input-group">
                
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* UPLOAD ROW (with gap) */}
            <div className="upload-row">
              <label className="file-upload">
                <span>📁 Upload Logo</span>
                <input type="file" accept="image/*" />
              </label>

              <label className="file-upload">
                <span>🎥 Upload Video</span>
                <input type="file" accept="video/*" />
              </label>
            </div>

            <button className="signup-btn" disabled={loading}>
              {loading ? "Registering..." : "Sign Up"}
            </button>
          </form>

          <div className="bottom-links">
            <p>
              Already have an account? <Link to="/login">Login</Link>
            </p>
            <p><Link to="/">Back to Home</Link></p>
          </div>

        </div>
      </div>

      {/* Right Section */}
      <div className="signup-right">
        <h1>Welcome to the ShopGrow</h1>
        <img
          src="abc.webp"
          className="signup-illustration"
          alt="signup-screen"
        />
      </div>

    </div>
  );
}

export default Register;
