'use client';
import { useState, useEffect } from 'react';
import { confirmPasswordReset, verifyPasswordResetCode, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [oobCode, setOobCode] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(true);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    async function verifyCode() {
      // get the parameters from URL
      const mode = searchParams?.get('mode');
      const code = searchParams?.get('oobCode');
      
      console.log('URL Parameters:', { mode, code });
      
      if (mode === 'resetPassword' && code) {
        setOobCode(code);
        
        try {
          // get email from Firebase using the reset code
          setVerifying(true);
          console.log('Verifying reset code with Firebase');
          const emailFromCode = await verifyPasswordResetCode(auth, code);
          setEmail(emailFromCode);
          console.log('Email retrieved from reset code:', emailFromCode);
          setVerifying(false);
        } catch (err: any) {
          console.error('Error verifying reset code:', err);
          setError('Invalid or expired reset code. Please request a new reset link.');
          setVerifying(false);
        }
      } else {
        setError('Invalid request type or missing code');
        console.error('Invalid parameters:', { mode, code });
        setVerifying(false);
      }
    }
    
    verifyCode();
  }, [searchParams]);
  
  const validatePasswords = () => {
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      console.error('Password validation failed: passwords do not match');
      return false;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      console.error('Password validation failed: password too short');
      return false;
    }
    console.log('Password validation passed');
    return true;
  };
  
  const syncPasswordWithBackend = async (newPassword: string, userEmail: string) => {
    console.log('Attempting to sync password with backend for email:', userEmail);
    try {
      // log in to get a fresh token
      console.log('signing in with new password to get token');
      const userCredential = await signInWithEmailAndPassword(auth, userEmail, newPassword);
      const token = await userCredential.user.getIdToken();
      console.log('got token successfully');
      
      // call backend to sync the password
      console.log('calling backend API to sync password');
      const response = await fetch(`${API_URL}/api/sync-reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: userEmail,
          password: newPassword
        })
      });
      
      const responseData = await response.json();
      console.log('Backend response:', responseData);
      
      if (!response.ok) {
        console.error('Backend sync failed:', responseData);
        throw new Error('Failed to sync password with server');
      }
      
      console.log('Password synced successfully with backend');
      return true;
    } catch (error: any) {
      console.error('Password sync error:', error);
      return false;
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePasswords() || !oobCode) {
      console.error('Form validation failed');
      return;
    }
    
    if (!email) {
      console.error('Email is required but missing');
      setError('Email address could not be verified. Please try requesting a new reset link.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    console.log('Starting password reset process', { email, oobCode });
    
    try {
      // 1. update password in Firebase
      console.log('confirming password reset with Firebase');
      await confirmPasswordReset(auth, oobCode, password);
      console.log('Firebase password reset successful');
      
      // 2. sync with backend
      console.log('syncing password with backend');
      const syncSuccess = await syncPasswordWithBackend(password, email);
      
      if (syncSuccess) {
        console.log('Password reset complete and synced successfully');
        setSuccess(true);
        // redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/Login');
        }, 3000);
      } else {
        console.error('Backend sync failed after successful Firebase reset');
        setError('Password reset in Firebase succeeded but failed to sync with our system. Please contact support.');
      }
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError(err.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setIsLoading(false);
    }
  };
  
  if (verifying) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold mb-6 text-black">Verifying Reset Link</h1>
        <div className="animate-pulse flex justify-center">
          <div className="h-8 w-8 bg-blue-400 rounded-full"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-center text-black">Set New Password</h1>
      
      {error && (
            <div className="text-red-600 mt-4 p-3 bg-red-50 rounded text-sm">
              {error}
            </div>
      )}
      {success ? (
        <div className="text-center">
          <div className="text-green-600 mb-4 p-3 bg-green-50 rounded text-black">
            Password has been reset successfully! You'll be redirected to login.
          </div>
          <Link href="/Login" className="text-blue-600 hover:underline text-black">
            Go to login now
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {email && (
            <div className="mb-4 p-3 bg-gray-50 rounded">
              <p className="text-sm text-gray-700">
                Resetting password for: <span className="font-medium text-black">{email}</span>
              </p>
            </div>
          )}
          
          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1 text-black">
              New Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
              className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              required
              minLength={8}
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1 text-black">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              required
              minLength={8}
            />
          </div>
          
          <button 
            type="submit"
            disabled={isLoading || !oobCode || !email}
            className="w-full bg-blue-600 text-white p-3 rounded font-medium hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Resetting...' : 'Reset Password'}
          </button>
          
        </form>
      )}
    </div>
  );
}