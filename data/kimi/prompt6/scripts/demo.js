/**
 * API Test Script
 * Simple demonstration of the RBAC system
 */

const http = require('http');

const API_BASE = 'localhost';
const API_PORT = 3000;

// Helper function to make HTTP requests
function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: API_BASE,
      port: API_PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Store tokens
let tokens = {};

async function runTests() {
  console.log('===============================================');
  console.log('  Admin Dashboard API - RBAC Test Demo');
  console.log('===============================================\n');

  // Test 1: Health Check
  console.log('1. Health Check');
  console.log('   GET /api/health');
  const health = await makeRequest('GET', '/api/health');
  console.log(`   Status: ${health.status}`);
  console.log(`   Response: ${JSON.stringify(health.data)}\n`);

  // Test 2: Login as different users
  const users = [
    { email: 'superadmin@example.com', password: 'SuperAdmin123!', role: 'Super Admin' },
    { email: 'admin@example.com', password: 'Admin123!', role: 'Admin' },
    { email: 'editor@example.com', password: 'Editor123!', role: 'Editor' },
    { email: 'viewer@example.com', password: 'Viewer123!', role: 'Viewer' }
  ];

  console.log('2. Login Tests');
  for (const user of users) {
    console.log(`   \n   Login as ${user.role} (${user.email})`);
    const login = await makeRequest('POST', '/api/auth/login', {
      email: user.email,
      password: user.password
    });
    console.log(`   Status: ${login.status}`);
    
    if (login.data.success) {
      tokens[user.role] = login.data.data.tokens.accessToken;
      console.log(`   Access Token: ${login.data.data.tokens.accessToken.substring(0, 30)}...`);
      console.log(`   Permissions: ${login.data.data.user.permissions.length}`);
    } else {
      console.log(`   Error: ${login.data.error}`);
    }
  }

  // Test 3: Access Control Tests
  console.log('\n\n3. Access Control Tests');
  console.log('   Testing different permission levels\n');

  // Test 3a: List Users (requires users:read)
  console.log('   3a. GET /api/users (requires users:read)');
  for (const [role, token] of Object.entries(tokens)) {
    const response = await makeRequest('GET', '/api/users', null, token);
    const hasAccess = response.status === 200;
    console.log(`       ${role}: ${hasAccess ? '✓ ACCESS GRANTED' : '✗ ACCESS DENIED'} (${response.status})`);
  }

  // Test 3b: Create User (requires users:write)
  console.log('\n   3b. POST /api/users (requires users:write)');
  for (const [role, token] of Object.entries(tokens)) {
    const response = await makeRequest('POST', '/api/users', {
      email: 'test@example.com',
      password: 'Test123!',
      firstName: 'Test',
      lastName: 'User'
    }, token);
    const hasAccess = response.status === 201 || response.status === 409; // 409 if email exists
    console.log(`       ${role}: ${hasAccess ? '✓ ACCESS GRANTED' : '✗ ACCESS DENIED'} (${response.status})`);
  }

  // Test 3c: List Roles (requires roles:read)
  console.log('\n   3c. GET /api/roles (requires roles:read)');
  for (const [role, token] of Object.entries(tokens)) {
    const response = await makeRequest('GET', '/api/roles', null, token);
    const hasAccess = response.status === 200;
    console.log(`       ${role}: ${hasAccess ? '✓ ACCESS GRANTED' : '✗ ACCESS DENIED'} (${response.status})`);
  }

  // Test 3d: Create Role (requires roles:write)
  console.log('\n   3d. POST /api/roles (requires roles:write)');
  for (const [role, token] of Object.entries(tokens)) {
    const response = await makeRequest('POST', '/api/roles', {
      name: `Test Role ${Date.now()}`,
      description: 'Test role'
    }, token);
    const hasAccess = response.status === 201 || response.status === 409;
    console.log(`       ${role}: ${hasAccess ? '✓ ACCESS GRANTED' : '✗ ACCESS DENIED'} (${response.status})`);
  }

  // Test 3e: Admin Dashboard Stats (requires system:admin)
  console.log('\n   3e. GET /api/admin/stats (requires system:admin)');
  for (const [role, token] of Object.entries(tokens)) {
    const response = await makeRequest('GET', '/api/admin/stats', null, token);
    const hasAccess = response.status === 200;
    console.log(`       ${role}: ${hasAccess ? '✓ ACCESS GRANTED' : '✗ ACCESS DENIED'} (${response.status})`);
  }

  // Test 4: Get Current User
  console.log('\n\n4. Get Current User');
  console.log('   GET /api/auth/me\n');
  for (const [role, token] of Object.entries(tokens)) {
    const response = await makeRequest('GET', '/api/auth/me', null, token);
    if (response.data.success) {
      const user = response.data.data;
      console.log(`   ${role}:`);
      console.log(`      Name: ${user.firstName} ${user.lastName}`);
      console.log(`      Email: ${user.email}`);
      console.log(`      Roles: ${user.roles.map(r => r.name).join(', ')}`);
      console.log(`      Permissions: ${user.permissions.length}`);
    }
  }

  // Test 5: List Permissions (Super Admin)
  console.log('\n\n5. List All Permissions');
  console.log('   GET /api/permissions\n');
  const permResponse = await makeRequest('GET', '/api/permissions', null, tokens['Super Admin']);
  if (permResponse.data.success) {
    const grouped = permResponse.data.data.grouped;
    for (const [resource, perms] of Object.entries(grouped)) {
      console.log(`   ${resource}:`);
      perms.forEach(p => console.log(`      - ${p.action}`));
    }
  }

  console.log('\n===============================================');
  console.log('  Test Demo Complete!');
  console.log('===============================================');
}

// Check if server is running before starting tests
console.log('Checking if server is running...');
makeRequest('GET', '/api/health')
  .then((response) => {
    if (response.status === 200) {
      runTests().catch(console.error);
    } else {
      console.error('Server is not responding correctly. Please start the server first:');
      console.error('  npm run seed');
      console.error('  npm start');
      process.exit(1);
    }
  })
  .catch(() => {
    console.error('Server is not running. Please start the server first:');
    console.error('  npm run seed');
    console.error('  npm start');
    process.exit(1);
  });
