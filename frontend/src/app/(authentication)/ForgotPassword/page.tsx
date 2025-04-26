'use client';
import { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Link from 'next/link';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-center text-black">Reset Your Password</h1>
      
      {sent ? (
        <div className="text-center">
          <div className="text-green-600 mb-4 p-3 bg-green-50 rounded">
            Password reset email sent! Check your inbox for further instructions.
          </div>
          <Link href="/Login" className="text-blue-600 hover:underline">
            Back to login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              We'll send a password reset link to this email
            </p>
          </div>
          
          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white p-3 rounded font-medium hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </button>
          
          {error && (
            <div className="text-red-600 mt-4 p-3 bg-red-50 rounded text-sm">
              {error}
            </div>
          )}
          
          <div className="text-center mt-4">
            <Link href="/Login" className="text-blue-600 hover:underline text-sm">
              Back to login
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}