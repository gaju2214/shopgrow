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

  // Separate handler for file inputs
  const handleFileChange = (e) => {
    const { name, files } = e.target;

    if (files[0]) {
      const maxSize = name === "logo" ? 5 * 1024 * 1024 : 50 * 1024 * 1024;
      if (files[0].size > maxSize) {
        setError(
          `${name === "logo" ? "Logo" : "Video"} file size should be less than ${
            maxSize / (1024 * 1024)
          }MB`
        );
        return;
      }
    }

    setFormData((prev) => ({ ...prev, [name]: files[0] }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validation checks
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

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long!");
      setLoading(false);
      return;
    }

    try {
      const registrationData = new FormData();

      // Append all form fields to FormData
      Object.keys(formData).forEach((key) => {
        if (formData[key] && key !== "confirmPassword") {
          registrationData.append(key, formData[key]);
        }
      });

      // ✅ FIXED: Use api.register() helper method instead of api.client.post()
      const response = await api.register(registrationData);

      if (response.data.success) {
        alert("Registration Successful! Please login.");
        // Clear form
        setFormData({
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
        navigate("/login");
      }
    } catch (err) {
      console.error("Registration error:", err);
      
      // Better error handling
      if (err.code === "ERR_NETWORK" || !err.response) {
        setError("Cannot connect to server. Please ensure backend is running on http://localhost:5000");
      } else {
        const errorMessage =
          err.response?.data?.error?.message ||
          err.response?.data?.message ||
          "Registration failed. Please try again.";
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
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
                  disabled={loading}
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
                  disabled={loading}
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
                  disabled={loading}
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
                  disabled={loading}
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
                  disabled={loading}
                />
              </div>

              <div className="input-group">
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  disabled={loading}
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
                  disabled={loading}
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
                  disabled={loading}
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
                  disabled={loading}
                />
              </div>

              <div className="input-group">
                <input
                  type="text"
                  name="gstNo"
                  placeholder="GST Number (Optional)"
                  value={formData.gstNo}
                  onChange={handleChange}
                  disabled={loading}
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
                  minLength={6}
                  required
                  disabled={loading}
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
                  disabled={loading}
                />
              </div>
            </div>

            {/* UPLOAD ROW */}
            <div className="upload-row">
              <label className="file-upload">
                <span>
                  📁 Upload Logo {formData.logo && `(${formData.logo.name})`}
                </span>
                <input
                  type="file"
                  name="logo"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={loading}
                />
              </label>

              <label className="file-upload">
                <span>
                  🎥 Upload Video {formData.video && `(${formData.video.name})`}
                </span>
                <input
                  type="file"
                  name="video"
                  accept="video/*"
                  onChange={handleFileChange}
                  disabled={loading}
                />
              </label>
            </div>

            <button className="signup-btn" type="submit" disabled={loading}>
              {loading ? "Registering..." : "Sign Up"}
            </button>
          </form>

          <div className="bottom-links">
            <p>
              Already have an account? <Link to="/login">Login</Link>
            </p>
            <p>
              <Link to="/">Back to Home</Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div className="signup-right">
        <h1>Welcome to ShopGrow</h1>
        {/* ✅ FIXED: Use correct image path from public folder */}
        <img
          src="/abc.webp"
          className="signup-illustration"
          alt="signup-screen"
          onError={(e) => {
            e.target.style.display = 'none';
            console.error('Image failed to load');
          }}
        />
      </div>
    </div>
  );
}

export default Register;
