import { logger } from '@/lib/utils/logger';
// 完全な機能テストスクリプト
const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

const DEEPL_API_KEY = process.env.DEEPL_API_KEY;
const DEEPL_API_URL = 'https://api.deepl.com/v2';

async function testDeepLDirectly() {
  logger.debug('\n=== Testing DeepL API Directly ===');
  
  // 1. Test language detection
  logger.debug('\n1. Testing language detection:');
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
      logger.debug('✅ Language detected:', result.translations[0].detected_source_language);
      logger.debug('✅ Translation:', result.translations[0].text);
    } else {
      logger.debug('❌ Failed:', { response: response.status, await: await response.text( }));
    }
  } catch (error) {
    logger.debug('❌ Error:', error.message);
  }
  
  // 2. Test translation
  logger.debug('\n2. Testing translation (JA to EN):');
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
      logger.debug('✅ Translation:', result.translations[0].text);
    } else {
      logger.debug('❌ Failed:', { response: response.status, await: await response.text( }));
    }
  } catch (error) {
    logger.debug('❌ Error:', error.message);
  }
}

async function testApplicationAPI() {
  logger.debug('\n=== Testing Application API ===');
  
  // Assuming the server is running on port 3001
  const baseUrl = 'http://localhost:3001';
  
  // First, we need to get a session token
  // This is a placeholder - you'll need actual auth
  logger.debug('\n⚠️  Note: Application API tests require authentication');
  logger.debug('Please test manually by creating a new listing with English text');
}

// Run tests
testDeepLDirectly().then(() => {
  logger.debug('\n=== Tests Complete ===');
  logger.debug('\nNext steps:');
  logger.debug('1. Restart the development server: npm run dev');
  logger.debug('2. Create a new listing with English text');
  logger.debug('3. Check if:');
  logger.debug('   - Language is detected as "en" (not "ja")');
  logger.debug('   - Translations are created for all other languages');
  logger.debug('   - Language badge shows "en"');
  logger.debug('   - Auto-translated badge appears when viewing in other languages');
});