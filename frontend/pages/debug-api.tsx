import { useState } from 'react';
import { apiClient } from '@/lib/api';

const DebugAPIPage = () => {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testBackendConnection = async () => {
    setLoading(true);
    try {
      console.log('Testing backend connection...');
      const response = await fetch('http://localhost:8000/health');
      const data = await response.text();
      setResult(`✅ Backend health check successful: ${data}`);
    } catch (error: any) {
      console.error('Backend connection error:', error);
      setResult(`❌ Backend connection failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testAPIAuth = async () => {
    setLoading(true);
    try {
      console.log('Testing API auth endpoint...');
      const response = await apiClient.get('/auth/me');
      setResult(`✅ API auth test successful: ${JSON.stringify(response.data)}`);
    } catch (error: any) {
      console.error('API auth error:', error);
      const errorDetail = error.response?.data?.detail || error.message || 'Unknown error';
      setResult(`🔒 API auth test (expected to fail): ${errorDetail}`);
    } finally {
      setLoading(false);
    }
  };

  const testRegistration = async () => {
    setLoading(true);
    try {
      console.log('Testing registration...');
      const testEmail = `test${Date.now()}@example.com`;
      const response = await apiClient.post('/auth/register', {
        email: testEmail,
        password: 'testpassword123'
      });
      setResult(`✅ Registration test successful: ${JSON.stringify(response.data)}`);
    } catch (error: any) {
      console.error('Registration error:', error);
      const errorDetail = error.response?.data?.detail || error.message || 'Unknown error';
      setResult(`❌ Registration test failed: ${errorDetail}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>API Debug Page</h1>
      
      <div style={{ marginBottom: '2rem' }}>
        <p><strong>API Base URL:</strong> {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}</p>
        <p><strong>Current Time:</strong> {new Date().toISOString()}</p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button 
          onClick={testBackendConnection} 
          disabled={loading}
          style={{ padding: '0.5rem 1rem', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          Test Backend Health
        </button>
        
        <button 
          onClick={testAPIAuth} 
          disabled={loading}
          style={{ padding: '0.5rem 1rem', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          Test API Auth
        </button>
        
        <button 
          onClick={testRegistration} 
          disabled={loading}
          style={{ padding: '0.5rem 1rem', backgroundColor: '#ffc107', color: 'black', border: 'none', borderRadius: '4px' }}
        >
          Test Registration
        </button>
      </div>

      {loading && <p>Loading...</p>}
      
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '1rem', 
        borderRadius: '4px', 
        border: '1px solid #dee2e6',
        whiteSpace: 'pre-wrap',
        fontFamily: 'monospace'
      }}>
        {result || 'Click a button to test the API connection'}
      </div>
    </div>
  );
};

export default DebugAPIPage;