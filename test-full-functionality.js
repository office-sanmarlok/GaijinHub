// 完全な機能テストスクリプト
const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

const DEEPL_API_KEY = process.env.DEEPL_API_KEY;
const DEEPL_API_URL = 'https://api.deepl.com/v2';

async function testDeepLDirectly() {
  console.log('\n=== Testing DeepL API Directly ===');
  
  // 1. Test language detection
  console.log('\n1. Testing language detection:');
  const detectParams = new URLSearchParams();
  detectParams.append('text', 'This is a test in English');
  detectParams.append('target_lang', 'JA');
  
  try {
    const response = await fetch(`${DEEPL_API_URL}/translate`, {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${DEEPL_API_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: detectParams.toString()
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Language detected:', result.translations[0].detected_source_language);
      console.log('✅ Translation:', result.translations[0].text);
    } else {
      console.log('❌ Failed:', response.status, await response.text());
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  
  // 2. Test translation
  console.log('\n2. Testing translation (JA to EN):');
  const translateParams = new URLSearchParams();
  translateParams.append('text', 'これはテストです');
  translateParams.append('source_lang', 'JA');
  translateParams.append('target_lang', 'EN');
  
  try {
    const response = await fetch(`${DEEPL_API_URL}/translate`, {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${DEEPL_API_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: translateParams.toString()
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Translation:', result.translations[0].text);
    } else {
      console.log('❌ Failed:', response.status, await response.text());
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

async function testApplicationAPI() {
  console.log('\n=== Testing Application API ===');
  
  // Assuming the server is running on port 3001
  const baseUrl = 'http://localhost:3001';
  
  // First, we need to get a session token
  // This is a placeholder - you'll need actual auth
  console.log('\n⚠️  Note: Application API tests require authentication');
  console.log('Please test manually by creating a new listing with English text');
}

// Run tests
testDeepLDirectly().then(() => {
  console.log('\n=== Tests Complete ===');
  console.log('\nNext steps:');
  console.log('1. Restart the development server: npm run dev');
  console.log('2. Create a new listing with English text');
  console.log('3. Check if:');
  console.log('   - Language is detected as "en" (not "ja")');
  console.log('   - Translations are created for all other languages');
  console.log('   - Language badge shows "en"');
  console.log('   - Auto-translated badge appears when viewing in other languages');
});