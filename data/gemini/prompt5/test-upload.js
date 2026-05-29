import fs from 'fs';
import path from 'path';

const API_URL = 'http://localhost:3000/upload';

async function runTests() {
  console.log('🚀 Starting API Security Tests...\n');

  // 1. Test Valid Image (Dummy PNG)
  // PNG Magic Number: 89 50 4E 47 0D 0A 1A 0A
  const dummyPng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x00]);
  await testUpload('Valid PNG Buffer', dummyPng, 'test.png', 'image/png', 200);

  // 2. Test Invalid Content (Text file disguised as JPG)
  const fakeJpg = Buffer.from('this is just text, not an image');
  await testUpload('Fake JPG (Text Content)', fakeJpg, 'malicious.jpg', 'image/jpeg', 400);

  // 3. Test File Too Large (6MB)
  const largeBuffer = Buffer.alloc(6 * 1024 * 1024);
  await testUpload('File Too Large (6MB)', largeBuffer, 'huge.png', 'image/png', 400);

  console.log('\n✅ Tests Completed.');
}

async function testUpload(description, buffer, filename, type, expectedStatus) {
  process.stdout.write(`Testing: ${description}... `);

  const formData = new FormData();
  const blob = new Blob([buffer], { type });
  formData.append('profileImage', blob, filename);

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (response.status === expectedStatus) {
      console.log('✅ PASS');
    } else {
      console.log(`❌ FAIL (Status: ${response.status})`);
      console.log('   Response:', JSON.stringify(result));
    }
  } catch (error) {
    console.log('❌ ERROR');
    console.error('   ', error.message);
  }
}

runTests();
