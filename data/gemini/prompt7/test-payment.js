/**
 * Test script for the Payment API Service
 * Note: Requires the server to be running on PORT 3000
 */
const axios = require('axios');

async function testCreatePayment() {
    try {
        console.log('Testing /api/create-payment-intent...');
        const response = await axios.post('http://localhost:3000/api/create-payment-intent', {
            amount: 2000, // $20.00
            currency: 'usd',
            metadata: { order_id: 'ORDER-123' }
        });
        
        console.log('Success!', response.data);
    } catch (error) {
        if (error.response) {
            console.error('Error from server:', error.response.data);
        } else {
            console.error('Connection error:', error.message);
        }
    }
}

// Check if axios is installed before running
try {
    require.resolve('axios');
    testCreatePayment();
} catch (e) {
    console.log('Axios not installed. Please run: npm install axios');
}
