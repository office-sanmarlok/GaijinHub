import { logger } from '@/lib/utils/logger';
// DeepL API のテストスクリプト
const DEEPL_API_KEY = process.env.DEEPL_API_KEY;

async function testDeepLAPI() {
  logger.debug('Testing DeepL API...');
  logger.debug('API Key ending:', DEEPL_API_KEY?.slice(-4));
  
  // Test 1: Usage endpoint (Free API)
  try {
    const usageResponse = await fetch('https://api-free.deepl.com/v2/usage', {
      method: 'GET',
      headers: {
        'Authorization': `DeepL-Auth-Key ${DEEPL_API_KEY}`
      }
    });
    
    logger.debug('Usage endpoint status:', usageResponse.status);
    if (usageResponse.ok) {
      const usage = await usageResponse.json();
      logger.debug('API Usage:', usage);
    } else {
      logger.debug('Usage error:', await usageResponse.text());
    }
  } catch (error) {
    logger.error('Usage request failed:', error);
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
    
    logger.debug('Translate endpoint status:', translateResponse.status);
    if (translateResponse.ok) {
      const result = await translateResponse.json();
      logger.debug('Translation result:', result);
    } else {
      logger.debug('Translation error:', await translateResponse.text());
    }
  } catch (error) {
    logger.error('Translation request failed:', error);
  }
}

// Load environment variables
require('dotenv').config({ path: '.env.local' });
testDeepLAPI();