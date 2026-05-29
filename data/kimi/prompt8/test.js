// Simple test script for the contact form API
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/contact',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

// Test data
const testData = {
  name: 'Test User',
  email: 'test@example.com',
  subject: 'Test Message',
  message: 'This is a test message from the contact form test script. It should be at least 10 characters.'
};

function makeRequest(data, description) {
  return new Promise((resolve, reject) => {
    console.log(`\n=== ${description} ===`);
    
    const req = http.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        try {
          const response = JSON.parse(body);
          console.log('Response:', JSON.stringify(response, null, 2));
          resolve(response);
        } catch (e) {
          console.log('Body:', body);
          resolve(body);
        }
      });
    });
    
    req.on('error', (e) => {
      console.error('Request error:', e.message);
      reject(e);
    });
    
    req.write(JSON.stringify(data));
    req.end();
  });
}

async function runTests() {
  console.log('Starting Contact Form API Tests...\n');
  
  // Test 1: Valid request (will fail email sending without SMTP config, but validation should pass)
  try {
    await makeRequest(testData, 'Test 1: Valid contact form submission');
  } catch (e) {
    console.log('Test 1 completed (SMTP not configured is expected)');
  }
  
  // Test 2: Invalid email
  await makeRequest({
    ...testData,
    email: 'invalid-email'
  }, 'Test 2: Invalid email format');
  
  // Test 3: Missing required fields
  await makeRequest({
    name: '',
    email: '',
    message: ''
  }, 'Test 3: Missing required fields');
  
  // Test 4: Message too short
  await makeRequest({
    ...testData,
    message: 'Short'
  }, 'Test 4: Message too short');
  
  // Test 5: XSS attempt (should be sanitized)
  await makeRequest({
    ...testData,
    message: '<script>alert("xss")</script> This is a test message with HTML tags that should be escaped.'
  }, 'Test 5: XSS attempt (should be sanitized)');
  
  console.log('\n=== All tests completed ===');
  process.exit(0);
}

// Wait a moment for server to be ready, then run tests
setTimeout(runTests, 1000);
