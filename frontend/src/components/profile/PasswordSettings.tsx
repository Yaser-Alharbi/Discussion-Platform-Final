// frontend/src/components/profile/PasswordSettings.tsx
'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { auth } from '@/lib/firebase';

export default function PasswordSettings() {
  // Use individual selectors to prevent unnecessary re-renders
  const setPassword = useAuthStore(state => state.setPassword);
  const isLoading = useAuthStore(state => state.isLoading);
  const error = useAuthStore(state => state.error);
  const clearError = useAuthStore(state => state.clearError);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  
  // Check if user is a Google user directly from Firebase
  const [isGoogleUser, setIsGoogleUser] = useState(false);
  
  // Load the Google user status once on mount
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const isGoogle = currentUser.providerData.some(
        provider => provider.providerId === 'google.com'
      );
      setIsGoogleUser(isGoogle);
    }
  }, []);
  
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  
  const [successMessage, setSuccessMessage] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [formTouched, setFormTouched] = useState(false);

  
  useEffect(() => {
    if (localError && error) {
      clearError();
    }
  }, [localError, error, clearError]);

  const handlePasswordChange = (field: string, value: string) => {
    // clear message if the form has been touched
    if (formTouched) {
      setLocalError(null);
      clearError();
      setSuccessMessage('');
      setFormTouched(false);
    }
    
    setPasswords({...passwords, [field]: value});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();
    setSuccessMessage('');
    setFormTouched(true);
    
    // console.log('Submitting password change form');

    try {
      // Client-side validation
      if (passwords.new !== passwords.confirm) {
        const errorMsg = 'New passwords do not match';
        // console.log('Validation error:', errorMsg);
        setLocalError(errorMsg);
        return;
      }

      if (!isGoogleUser && passwords.new === passwords.current) {
        const errorMsg = 'New password must be different from current password';
        // console.log('Validation error:', errorMsg);
        setLocalError(errorMsg);
        return;
      }

      if (!isAuthenticated) {
        const errorMsg = 'You must be logged in';
        // console.log('Validation error:', errorMsg);
        setLocalError(errorMsg);
        return;
      }

      // console.log('Attempting to set password with authStore');
      // Use authStore's setPassword with the current password
      await setPassword(passwords.new, passwords.current);

      // console.log('Password updated successfully');
      setSuccessMessage('Password updated successfully');
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (error: any) {
      console.error('Password update error:', error);
      // Set local error for client-side errors, backend errors come from the store
      setLocalError(error.message || 'Failed to update password');
    }
  };

  // displayed error is either from the store or local validation
  const displayError = localError || error;

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-xl font-semibold mb-4 text-black">Password Settings</h3>
      
      {displayError && (
        <div className="p-3 mb-4 rounded bg-red-50 text-red-700">
          {displayError}
        </div>
      )}
      
      {successMessage && (
        <div className="p-3 mb-4 rounded bg-green-50 text-green-700">
          {successMessage}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Only show current password field for non-Google users */}
        {!isGoogleUser && (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Current Password
            </label>
            <input
              type="password"
              value={passwords.current}
              onChange={e => handlePasswordChange('current', e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border text-black"
              required
            />
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-gray-700">
            New Password
          </label>
          <input
            type="password"
            value={passwords.new}
            onChange={e => handlePasswordChange('new', e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border text-black"
            required
            minLength={6}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 text-black">
            Confirm New Password
          </label>
          <input
            type="password"
            value={passwords.confirm}
            onChange={e => handlePasswordChange('confirm', e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border text-black"
            required
            minLength={6}
          />
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isLoading ? 'Updating...' : 'Update Password'}
        </button>
      </form>
    </div>
  );
}