// テスト用の新規投稿を作成するスクリプト
const testEnglishPost = async () => {
  const response = await fetch('http://localhost:3001/api/listings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: 'Test English Post for Language Detection',
      body: 'This is a test post written entirely in English to verify that the language detection system is working correctly.',
      category: 'Items for Sale',
      price: 5000
    })
  });
  
  const result = await response.json();
  console.log('Response:', result);
};

testEnglishPost().catch(console.error);