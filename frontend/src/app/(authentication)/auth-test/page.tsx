'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
// import { auth } from '@/lib/firebase';

export default function AuthTest() {
  const [logs, setLogs] = useState<string[]>([]);
  const { user, isAuthenticated, token, error, refreshToken } = useAuthStore();

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Test refresh token
  const handleRefreshToken = async () => {
    addLog("⏳ Refreshing token...");
    try {
      await refreshToken();
      addLog("✅ Token refreshed successfully");
    } catch (err: any) {
      addLog(`❌ Error: ${err.message}`);
    }
  };

  // Simulate token timing error
  const simulateTokenError = () => {
    addLog("⏳ Simulating 'Token used too early' error...");
    useAuthStore.setState({ 
      error: "Token used too early, 1744820017 < 1744820018. Check that your computer's clock is set correctly." 
    });
    
    // Check if auto-recovery works
    setTimeout(() => {
      const { error } = useAuthStore.getState();
      if (!error || !error.includes('Token used too early')) {
        addLog("✅ Auto-recovery worked! Error was cleared.");
      } else {
        addLog("❌ Auto-recovery failed. Error still present.");
      }
    }, 3000);
  };

  // Log current state
  const logCurrentState = () => {
    addLog("📊 Current state:");
    addLog(`- User: ${user ? JSON.stringify(user.email) : 'null'}`);
    addLog(`- Authenticated: ${isAuthenticated ? 'yes' : 'no'}`);
    addLog(`- Token: ${token ? 'present' : 'null'}`);
    addLog(`- Error: ${error || 'none'}`);
  };

  // Display current state when component loads
  useEffect(() => {
    logCurrentState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Auth Recovery Test</h1>
      
      <div className="flex space-x-4 mb-6">
        <button 
          onClick={handleRefreshToken}
          className="bg-blue-500 text-black px-4 py-2 rounded hover:bg-blue-600"
        >
          Refresh Token
        </button>
        
        <button 
          onClick={simulateTokenError}
          className="bg-yellow-500 text-black px-4 py-2 rounded hover:bg-yellow-600"
        >
          Simulate Token Error
        </button>
        
        <button 
          onClick={logCurrentState}
          className="bg-green-500 text-black px-4 py-2 rounded hover:bg-green-600"
        >
          Log Current State
        </button>
      </div>
      
      <div className="bg-gray-100 p-4 rounded-lg max-h-96 overflow-y-auto">
        {logs.length === 0 && (
          <p className="text-black-500 italic">No logs yet. Click a button above to start testing.</p>
        )}
        {logs.map((log, index) => (
          <div key={index} className="mb-1 font-mono text-sm text-black">{log}</div>
        ))}
      </div>
    </div>
  );
}