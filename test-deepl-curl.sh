#!/bin/bash

# Load environment variables
source .env.local

echo "Testing DeepL API with curl..."
echo "API Key ends with: ${DEEPL_API_KEY: -4}"

# Test translation
echo -e "\n1. Testing translation (EN to JA):"
curl -X POST 'https://api.deepl.com/v2/translate' \
  -H "Authorization: DeepL-Auth-Key $DEEPL_API_KEY" \
  -d "text=Hello%20world" \
  -d "target_lang=JA"

echo -e "\n\n2. Testing language detection (with EN target):"
curl -X POST 'https://api.deepl.com/v2/translate' \
  -H "Authorization: DeepL-Auth-Key $DEEPL_API_KEY" \
  -d "text=Hello%20world" \
  -d "target_lang=JA"

echo -e "\n\n3. Testing with FormData style:"
curl -X POST 'https://api.deepl.com/v2/translate' \
  -H "Authorization: DeepL-Auth-Key $DEEPL_API_KEY" \
  -F "text=Hello world" \
  -F "target_lang=JA"

echo -e "\n"