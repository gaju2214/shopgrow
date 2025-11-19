const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
let accessToken = '';

async function testAPI() {
  try {
    console.log('🧪 Testing Retail Automation API\n');

    // 1. Health check
    console.log('1️⃣ Health Check...');
    const health = await axios.get('http://localhost:5000/health');
    console.log('✅', health.data.message, '\n');

    // 2. Register
    // console.log('2️⃣ Registering store...');
    // const register = await axios.post(`${BASE_URL}/auth/register`, {
    //   store_name: 'Test Store',
    //   mobile_number: '9876543210',
    //   email: `test${Date.now()}@example.com`,
    //   password: 'Test@123',
    //   store_city: 'Mumbai'
    // });
    // console.log('✅', register.data.message, '\n');

    // 3. Login
    console.log('3️⃣ Logging in...');
    const login = await axios.post(`${BASE_URL}/auth/login`, {
      email: register.data.data.store.email,
      password: 'Test@123'
    });
    accessToken = login.data.data.accessToken;
    console.log('✅', login.data.message, '\n');

    // 4. Get profile
    console.log('4️⃣ Getting profile...');
    const profile = await axios.get(`${BASE_URL}/auth/profile`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    console.log('✅ Profile:', profile.data.data.store.store_name, '\n');

    console.log('🎉 All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testAPI();
