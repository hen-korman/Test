/**
 * Test script for the webhook handler
 * Run this to test the webhook endpoints locally
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Test data
const testEmployeeData = {
    employeeId: 'EMP12345',
    employeeName: 'John Doe',
    employeeEmail: 'john.doe@company.com',
    hrRepresentative: 'Jane Smith'
};

const testBabyFormData = {
    employeeId: 'EMP12345',
    employeeName: 'John Doe',
    employeeEmail: 'john.doe@company.com',
    babyName: 'Emma Rose Doe',
    babyGender: 'female',
    babyBirthDate: '2025-09-25',
    babyWeight: '7 lbs 5 oz',
    babyLength: '20 inches',
    relationship: 'father',
    requestMaternityPaternity: 'yes',
    requestBenefitsInfo: 'yes',
    additionalNotes: 'Excited to be a new parent!',
    submissionTime: new Date().toISOString(),
    formType: 'baby_congratulations'
};

async function testHealthCheck() {
    try {
        console.log('🏥 Testing health check...');
        const response = await axios.get(`${BASE_URL}/health`);
        console.log('✅ Health check passed:', response.data);
        return true;
    } catch (error) {
        console.error('❌ Health check failed:', error.message);
        return false;
    }
}

async function testHRTrigger() {
    try {
        console.log('\n👩‍💼 Testing HR trigger...');
        const response = await axios.post(`${BASE_URL}/api/hr-trigger`, testEmployeeData);
        console.log('✅ HR trigger test passed:', response.data);
        return true;
    } catch (error) {
        console.error('❌ HR trigger test failed:', error.response?.data || error.message);
        return false;
    }
}

async function testFormSubmission() {
    try {
        console.log('\n📝 Testing form submission...');
        const response = await axios.post(`${BASE_URL}/api/baby-form-submission`, testBabyFormData);
        console.log('✅ Form submission test passed:', response.data);
        return true;
    } catch (error) {
        console.error('❌ Form submission test failed:', error.response?.data || error.message);
        return false;
    }
}

async function testInvalidData() {
    try {
        console.log('\n🚫 Testing invalid data handling...');
        
        // Test missing required fields
        const invalidData = {
            employeeName: 'John Doe'
            // Missing employeeId and employeeEmail
        };
        
        await axios.post(`${BASE_URL}/api/hr-trigger`, invalidData);
        console.log('❌ Invalid data test failed - should have rejected invalid data');
        return false;
    } catch (error) {
        if (error.response?.status === 400) {
            console.log('✅ Invalid data test passed - correctly rejected invalid data');
            return true;
        } else {
            console.error('❌ Invalid data test failed with unexpected error:', error.message);
            return false;
        }
    }
}

async function runAllTests() {
    console.log('🧪 Starting webhook handler tests...\n');
    
    const tests = [
        testHealthCheck,
        testHRTrigger,
        testFormSubmission,
        testInvalidData
    ];
    
    let passed = 0;
    let total = tests.length;
    
    for (const test of tests) {
        const result = await test();
        if (result) passed++;
        
        // Wait a bit between tests
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`\n📊 Test Results: ${passed}/${total} tests passed`);
    
    if (passed === total) {
        console.log('🎉 All tests passed!');
        process.exit(0);
    } else {
        console.log('💥 Some tests failed. Check the logs above.');
        process.exit(1);
    }
}

// Check if server is running before starting tests
async function checkServerRunning() {
    try {
        await axios.get(`${BASE_URL}/health`);
        return true;
    } catch (error) {
        return false;
    }
}

async function main() {
    console.log('Checking if webhook server is running...');
    
    const isRunning = await checkServerRunning();
    
    if (!isRunning) {
        console.log('❌ Webhook server is not running!');
        console.log('Please start the server first with: npm start');
        console.log('Then run this test script in another terminal with: npm test');
        process.exit(1);
    }
    
    console.log('✅ Server is running, starting tests...\n');
    await runAllTests();
}

if (require.main === module) {
    main().catch(error => {
        console.error('Test runner error:', error);
        process.exit(1);
    });
}

module.exports = {
    testHealthCheck,
    testHRTrigger,
    testFormSubmission,
    testInvalidData
};