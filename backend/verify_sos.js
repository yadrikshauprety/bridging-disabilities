import axios from 'axios';

async function testSOS() {
  const email = 'yadrikshak.23.becs@acharya.ac.in'; // One of the existing emails
  console.log(`Testing SOS for ${email}...`);
  try {
    const res = await axios.post(`http://localhost:5000/api/user/sos/${encodeURIComponent(email)}`);
    console.log('Response:', res.data);
  } catch (err) {
    console.error('Error:', err.response?.data || err.message);
  }
}

testSOS();
