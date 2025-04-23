'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

interface SignupFormProps {
  provider?: string | null;
  email?: string | null;
}

export default function SignupForm({ provider, email }: SignupFormProps) {
  const {
    register,
    registerGoogleUser,
    isLoading,
    error: authError,
    clearError,
  } = useAuthStore();

  const router = useRouter();

  const [formData, setFormData] = useState({
    email: email || '',
    password: '',
    confirmPassword: '',
  });
  const [isGoogleUser, setIsGoogleUser] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (provider === 'google') {
      setIsGoogleUser(true);
      setFormData(prev => ({ ...prev, email: email || '' }));
    }
  }, [provider, email]);

  useEffect(() => {
    if (authError) {
      setError(authError);
    }
    return () => {
      clearError();
    };
  }, [authError, clearError]);

  // Handle Google signup
  const handleGoogleSignup = async () => {
    try {
      // First, authenticate with Google Firebase
      await useAuthStore.getState().googleLogin();
      
      // Then register the authenticated user in the backend
      await useAuthStore.getState().registerGoogleUser();
      
      // After successful authentication and registration, redirect to profile page
      router.push('/profile?provider=google&newUser=true');
    } catch (error) {
      console.error(error);
      setError("Google authentication failed");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear any previous errors
    setError(null);
    clearError();
    
    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      // Register the user
      await register(formData.email, formData.password, {});
      
      // Redirect to profile page
      router.push('/profile');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto p-8 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Create Account
      </h2>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Password</label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Confirm Password</label>
          <input
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <button 
          type="submit" 
          disabled={isLoading}
          className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Processing...' : 'Sign Up'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <span className="text-gray-500">or</span>
      </div>

      <button
        onClick={handleGoogleSignup}
        disabled={isLoading}
        className="mt-4 w-full py-3 px-4 border border-gray-300 rounded-lg flex items-center justify-center space-x-2 hover:bg-gray-50 transition-colors disabled:opacity-50"
      >
        <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
        <span className="text-gray-700 font-medium">Sign up with Google</span>
      </button>
    </div>
  );
}