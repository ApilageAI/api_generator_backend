const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TEST_API_KEY = 'apk_test_key_replace_with_real_key'; // Replace with actual API key from dashboard

// Test functions
async function testHealthCheck() {
    console.log('🔍 Testing Health Check...');
    try {
        const response = await axios.get(`${BASE_URL}/api/health`);
        console.log('✅ Health Check:', response.data);
    } catch (error) {
        console.log('❌ Health Check Failed:', error.message);
    }
}

async function testApiDocs() {
    console.log('\n📖 Testing API Documentation...');
    try {
        const response = await axios.get(`${BASE_URL}/api/docs`);
        console.log('✅ API Docs:', response.data);
    } catch (error) {
        console.log('❌ API Docs Failed:', error.message);
    }
}

async function testChatAPI() {
    console.log('\n💬 Testing Chat API...');
    try {
        const response = await axios.post(`${BASE_URL}/api/chat`, {
            message: 'Hello, can you tell me a joke?'
        }, {
            headers: {
                'Authorization': `Bearer ${TEST_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        console.log('✅ Chat API Response:', response.data);
    } catch (error) {
        if (error.response) {
            console.log('❌ Chat API Failed:', error.response.data);
        } else {
            console.log('❌ Chat API Failed:', error.message);
        }
    }
}

async function testStats() {
    console.log('\n📊 Testing Stats API...');
    try {
        const response = await axios.get(`${BASE_URL}/api/stats`, {
            headers: {
                'Authorization': `Bearer ${TEST_API_KEY}`
            }
        });
        console.log('✅ Stats API:', response.data);
    } catch (error) {
        if (error.response) {
            console.log('❌ Stats API Failed:', error.response.data);
        } else {
            console.log('❌ Stats API Failed:', error.message);
        }
    }
}

async function testInvalidApiKey() {
    console.log('\n🔐 Testing Invalid API Key...');
    try {
        const response = await axios.post(`${BASE_URL}/api/chat`, {
            message: 'This should fail'
        }, {
            headers: {
                'Authorization': 'Bearer invalid_key',
                'Content-Type': 'application/json'
            }
        });
        console.log('❌ Should have failed but got:', response.data);
    } catch (error) {
        if (error.response && error.response.status === 401) {
            console.log('✅ Invalid API Key properly rejected:', error.response.data);
        } else {
            console.log('❌ Unexpected error:', error.message);
        }
    }
}

async function testMissingMessage() {
    console.log('\n📝 Testing Missing Message...');
    try {
        const response = await axios.post(`${BASE_URL}/api/chat`, {}, {
            headers: {
                'Authorization': `Bearer ${TEST_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        console.log('❌ Should have failed but got:', response.data);
    } catch (error) {
        if (error.response && error.response.status === 400) {
            console.log('✅ Missing message properly rejected:', error.response.data);
        } else {
            console.log('❌ Unexpected error:', error.message);
        }
    }
}

// cURL Examples
function showCurlExamples() {
    console.log('\n🔧 cURL Examples:');
    console.log('\n1. Test Chat API:');
    console.log(`curl -X POST ${BASE_URL}/api/chat \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${TEST_API_KEY}" \\
  -d '{"message": "Hello, how are you?"}'`);

    console.log('\n2. Get Stats:');
    console.log(`curl -X GET ${BASE_URL}/api/stats \\
  -H "Authorization: Bearer ${TEST_API_KEY}"`);

    console.log('\n3. Health Check:');
    console.log(`curl -X GET ${BASE_URL}/api/health`);
}

// Python Example
function showPythonExample() {
    console.log('\n🐍 Python Example:');
    console.log(`
import requests

# Configuration
BASE_URL = "${BASE_URL}"
API_KEY = "${TEST_API_KEY}"

# Make a request
response = requests.post(f"{BASE_URL}/api/chat", 
    json={"message": "Hello, how are you?"},
    headers={
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
)

result = response.json()
print("Response:", result['response'])
print("Credits Remaining:", result['credits_remaining'])
    `);
}

// JavaScript Example
function showJavaScriptExample() {
    console.log('\n🟨 JavaScript Example:');
    console.log(`
// Using fetch API
const response = await fetch('${BASE_URL}/api/chat', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ${TEST_API_KEY}'
    },
    body: JSON.stringify({
        message: 'Hello, how are you?'
    })
});

const result = await response.json();
console.log('Response:', result.response);
console.log('Credits Remaining:', result.credits_remaining);
    `);
}

// Run all tests
async function runAllTests() {
    console.log('🚀 Starting AI API Platform Tests...\n');
    
    await testHealthCheck();
    await testApiDocs();
    
    if (TEST_API_KEY === 'apk_test_key_replace_with_real_key') {
        console.log('\n⚠️  Warning: Using placeholder API key. Replace TEST_API_KEY with a real API key to test authenticated endpoints.');
        console.log('   1. Start the server: npm start');
        console.log('   2. Go to http://localhost:3000');
        console.log('   3. Create an account and get your API key');
        console.log('   4. Replace TEST_API_KEY in test.js with your real API key');
        console.log('   5. Run tests again: npm test\n');
    } else {
        await testChatAPI();
        await testStats();
        await testInvalidApiKey();
        await testMissingMessage();
    }
    
    showCurlExamples();
    showPythonExample();
    showJavaScriptExample();
    
    console.log('\n✅ Tests completed!');
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    console.log('❌ Uncaught Exception:', error.message);
    process.exit(1);
});

process.on('unhandledRejection', (error) => {
    console.log('❌ Unhandled Rejection:', error.message);
    process.exit(1);
});

// Run tests
runAllTests();