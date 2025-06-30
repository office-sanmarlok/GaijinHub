// DeepL API のテストスクリプト
const DEEPL_API_KEY = process.env.DEEPL_API_KEY;

async function testDeepLAPI() {
  console.log('Testing DeepL API...');
  console.log('API Key ending:', DEEPL_API_KEY?.slice(-4));
  
  // Test 1: Usage endpoint (Free API)
  try {
    const usageResponse = await fetch('https://api-free.deepl.com/v2/usage', {
      method: 'GET',
      headers: {
        'Authorization': `DeepL-Auth-Key ${DEEPL_API_KEY}`
      }
    });
    
    console.log('Usage endpoint status:', usageResponse.status);
    if (usageResponse.ok) {
      const usage = await usageResponse.json();
      console.log('API Usage:', usage);
    } else {
      console.log('Usage error:', await usageResponse.text());
    }
  } catch (error) {
    console.error('Usage request failed:', error);
  }
  
  // Test 2: Translation endpoint
  try {
    const formData = new FormData();
    formData.append('text', 'Hello world');
    formData.append('target_lang', 'JA');
    formData.append('auth_key', DEEPL_API_KEY);
    
    const translateResponse = await fetch('https://api-free.deepl.com/v2/translate', {
      method: 'POST',
      body: formData
    });
    
    console.log('Translate endpoint status:', translateResponse.status);
    if (translateResponse.ok) {
      const result = await translateResponse.json();
      console.log('Translation result:', result);
    } else {
      console.log('Translation error:', await translateResponse.text());
    }
  } catch (error) {
    console.error('Translation request failed:', error);
  }
}

// Load environment variables
require('dotenv').config({ path: '.env.local' });
testDeepLAPI();