'use client';
import { useAuthStore } from '@/store/authStore'; // Update path

export default function AuthStateDebugger() {
  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    error, 
    token 
  } = useAuthStore();

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-gray-800 text-white rounded shadow-lg max-w-sm overflow-auto text-sm opacity-75 hover:opacity-100 transition-opacity">
      <h3 className="font-bold mb-2">Auth Store Debug</h3>
      <p><span className="font-semibold">User:</span> {JSON.stringify(user)}</p>
      <p><span className="font-semibold">Authenticated:</span> {isAuthenticated ? '✅' : '❌'}</p>
      <p><span className="font-semibold">Loading:</span> {isLoading ? '⏳' : '✓'}</p>
      <p><span className="font-semibold">Error:</span> {error || 'None'}</p>
      <p><span className="font-semibold">Token:</span> {token ? '🔑 Present' : '🔒 None'}</p>
      {user && (
        <>
          <p><span className="font-semibold">User Email:</span> {user.email}</p>
          {user.institution && <p><span className="font-semibold">Institution:</span> {user.institution}</p>}
          {user.research_interests && <p><span className="font-semibold">Research:</span> {user.research_interests.join(', ')}</p>}
        </>
      )}
    </div>
  );
}