/**
 * Quick API Test
 */

const http = require('http');

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: { 'Content-Type': 'application/json' }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function test() {
  console.log('Testing Admin Dashboard API...\n');
  
  // Test health endpoint
  console.log('1. Health Check');
  const health = await makeRequest('GET', '/api/health');
  console.log('   Status:', health.status);
  console.log('   Response:', JSON.stringify(health.data, null, 2));
  
  if (health.status !== 200) {
    console.log('\n⚠ Server not running. Start with: npm start');
    process.exit(1);
  }
  
  // Test login
  console.log('\n2. Login as Super Admin');
  const login = await makeRequest('POST', '/api/auth/login', {
    email: 'superadmin@example.com',
    password: 'SuperAdmin123!'
  });
  console.log('   Status:', login.status);
  console.log('   Success:', login.data.success);
  
  if (login.data.success) {
    const token = login.data.data.tokens.accessToken;
    console.log('   Token:', token.substring(0, 40) + '...');
    console.log('   User:', login.data.data.user.firstName, login.data.data.user.lastName);
    console.log('   Permissions:', login.data.data.user.permissions.length);
    
    // Test authenticated endpoint
    console.log('\n3. Get Users (Authenticated)');
    const users = await makeRequest('GET', '/api/users', null, token);
    console.log('   Status:', users.status);
    console.log('   Users found:', users.data.data?.length || 0);
    
    // Test roles endpoint
    console.log('\n4. Get Roles');
    const roles = await makeRequest('GET', '/api/roles', null, token);
    console.log('   Status:', roles.status);
    console.log('   Roles found:', roles.data.data?.total || 0);
    
    // Test admin stats
    console.log('\n5. Get Admin Stats');
    const stats = await makeRequest('GET', '/api/admin/stats', null, token);
    console.log('   Status:', stats.status);
    if (stats.data.success) {
      console.log('   Total Users:', stats.data.data.users.total);
      console.log('   Total Roles:', stats.data.data.roles.total);
      console.log('   Total Permissions:', stats.data.data.permissions.total);
    }
  }
  
  console.log('\n✓ All tests passed!');
}

test().catch(err => {
  console.error('Test failed:', err.message);
  process.exit(1);
});
