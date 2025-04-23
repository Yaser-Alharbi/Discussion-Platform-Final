'use client';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore'; 
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const router = useRouter();
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  
  // Get auth store state and actions
  const { 
    login, 
    googleLogin,
    isAuthenticated, 
    isLoading, 
    error: storeError, 
    clearError,
    token
  } = useAuthStore();
  
  const [localError, setLocalError] = useState('');
  
  // Clear errors when component mounts/unmounts
  useEffect(() => {
    clearError();
    return () => clearError();
  }, [clearError]);
  
  // Handle successful login with redirection to the home page
  useEffect(() => {
    if (isAuthenticated && token) {
      router.push('/');
    }
  }, [isAuthenticated, token, router]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    
    try {
      // Use the auth store login function
      await login(credentials.email, credentials.password);
      
      // The redirection will happen in the useEffect when isAuthenticated becomes true
    } catch (error: any) {
      setLocalError('Login failed. Please try again.');
    }
  };

  const handleGoogleLogin = async () => {
    setLocalError('');
    
    try {
      // Use the auth store googleLogin function
      await googleLogin();
      
      // The redirection will happen in the useEffect when isAuthenticated becomes true
    } catch (error: any) {
      console.error('Google login error:', error);
      setLocalError('Google login failed. Please try again.');
    }
  };

  // Show any errors from the store or local state
  const displayError = storeError || localError;

  return (
    // Error message
    <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow">
      {displayError && (
        <div className="bg-red-50 text-red-700 p-3 rounded">
          {displayError}
        </div>
      )}
      {/* Email login form */}
      <form onSubmit={handleEmailLogin} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={credentials.email}
          onChange={e => setCredentials({...credentials, email: e.target.value})}
          className="w-full p-3 border rounded text-gray-900"
          disabled={isLoading}
          required
        />
        {/* Password input */}
        <input
          type="password"
          placeholder="Password"
          value={credentials.password}
          onChange={e => setCredentials({...credentials, password: e.target.value})}
          className="w-full p-3 border rounded text-gray-900"
          disabled={isLoading}
          required
        />
        {/* Login button */}
        <button 
          type="submit"
          className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700 disabled:bg-blue-400"
          disabled={isLoading}
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      {/* "Or continue with" text and line */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or continue with</span>
        </div>
      </div>

      {/* Google login button */}
      <button
        onClick={handleGoogleLogin}
        disabled={isLoading}
        className="w-full border border-gray-300 p-3 rounded flex items-center justify-center space-x-2 hover:bg-gray-50 disabled:bg-gray-100"
      >
        <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
        <span className="text-gray-700">{isLoading ? 'Processing...' : 'Log in with Google'}</span>
      </button>

      {/* Signup link */}
      <div className="text-center text-sm text-gray-500">
        <Link href="/Signup" className="text-blue-600 hover:underline">
          Don't have an account? Sign up
        </Link>
      </div>
    </div>
  );
}