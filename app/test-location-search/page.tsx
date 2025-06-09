'use client';

import { useState } from 'react';

export default function TestLocationSearchPage() {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testAPI = async (type: string, keyword?: string) => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      let url = '';
      switch (type) {
        case 'prefecture':
          url = '/api/location/prefectures';
          break;
        case 'line':
          url = `/api/location/search?type=line&keyword=${encodeURIComponent(keyword || '東海道')}`;
          break;
        case 'municipality':
          url = `/api/location/search?type=municipality&keyword=${encodeURIComponent(keyword || '新宿')}`;
          break;
        case 'station':
          url = `/api/location/search?type=station&keyword=${encodeURIComponent(keyword || '新宿')}`;
          break;
      }

      console.log('Testing URL:', url);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('API Response:', data);
      setResults(data);
    } catch (err) {
      console.error('API Error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Location Search API Test</h1>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <button
          onClick={() => testAPI('prefecture')}
          className="p-3 bg-blue-500 text-white rounded hover:bg-blue-600"
          disabled={loading}
        >
          都道府県を取得
        </button>
        
        <button
          onClick={() => testAPI('line')}
          className="p-3 bg-green-500 text-white rounded hover:bg-green-600"
          disabled={loading}
        >
          路線検索（東海道）
        </button>
        
        <button
          onClick={() => testAPI('municipality')}
          className="p-3 bg-yellow-500 text-white rounded hover:bg-yellow-600"
          disabled={loading}
        >
          市区町村検索（新宿）
        </button>
        
        <button
          onClick={() => testAPI('station')}
          className="p-3 bg-purple-500 text-white rounded hover:bg-purple-600"
          disabled={loading}
        >
          駅検索（新宿）
        </button>
      </div>

      {loading && <div className="text-blue-500">Loading...</div>}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error: {error}
        </div>
      )}
      
      {results && (
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Results:</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 