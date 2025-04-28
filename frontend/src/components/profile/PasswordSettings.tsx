// frontend/src/components/profile/PasswordSettings.tsx
'use client';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

export default function PasswordSettings() {

  const setPassword = useAuthStore(state => state.setPassword);
  const isLoading = useAuthStore(state => state.isLoading);
  const error = useAuthStore(state => state.error);
  const clearError = useAuthStore(state => state.clearError);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const user = useAuthStore(state => state.user);
  const fetchProfile = useAuthStore(state => state.fetchProfile);
  
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  
  const [successMessage, setSuccessMessage] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [formTouched, setFormTouched] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // // consolelog user data
  // useEffect(() => {
  //   if (user) {
  //     console.log('User data in PasswordSettings:', user);
  //   }
  // }, [user]);

  const hasPasswordSet = 
    user?.password_set || 
    (user?.auth_methods && user.auth_methods.includes('EMAIL'));

  
  useEffect(() => {
    if (localError && error) {
      clearError();
    }
  }, [localError, error, clearError]);

  const refreshUserData = async () => {
    setIsRefreshing(true);
    try {
      await fetchProfile();
    } catch (error) {
      console.error('Error refreshing profile:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const dismissError = () => {
    setLocalError(null);
    clearError();
  };

  const dismissSuccess = () => {
    setSuccessMessage('');
  };

  const handlePasswordChange = (field: string, value: string) => {
    // clear messages if submitting the form
    setFormTouched(true);
    setPasswords({...passwords, [field]: value});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // clear previous messages when submitting
    setLocalError(null);
    clearError();
    setSuccessMessage('');
    setFormTouched(true);
    
    // console.log('Submitting password change form');

    try {
      // client-side validation
      if (passwords.new !== passwords.confirm) {
        const errorMsg = 'New passwords do not match';
        // console.log('Validation error:', errorMsg);
        setLocalError(errorMsg);
        return;
      }

      // validate current password if user has a password set
      if (hasPasswordSet && passwords.new === passwords.current) {
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
      //authStore's setPassword with the current password (only if password is set)
      await setPassword(passwords.new, hasPasswordSet ? passwords.current : undefined);

      // console.log('Password updated successfully');
      setSuccessMessage(hasPasswordSet ? 'Password updated successfully' : 'Password created successfully');
      setPasswords({ current: '', new: '', confirm: '' });
      
      // refresh the profile data after successful password change
      await refreshUserData();
    } catch (error: any) {
      console.error('Password update error:', error);
      
      setLocalError(error.message || 'Failed to update password');
    }
  };

  // displayed error is either from the store or local validation
  const displayError = localError || error;

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-black">
          {!hasPasswordSet ? 'Create Password' : 'Password Settings'}
        </h3>
        <button 
          onClick={refreshUserData} 
          disabled={isRefreshing}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      
      {displayError && (
        <div className="p-3 mb-4 rounded bg-red-50 text-red-700 relative">
          {displayError}
          <button 
            onClick={dismissError}
            className="absolute top-1 right-2 text-red-500 hover:text-red-700" 
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}
      
      {successMessage && (
        <div className="p-3 mb-4 rounded bg-green-50 text-green-700 relative">
          {successMessage}
          <button 
            onClick={dismissSuccess}
            className="absolute top-1 right-2 text-green-500 hover:text-green-700" 
            aria-label="Dismiss success message"
          >
            ×
          </button>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Only show current password field if user has password set */}
        {hasPasswordSet && (
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
            {!hasPasswordSet ? 'Create Password' : 'New Password'}
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
            Confirm {!hasPasswordSet ? 'Password' : 'New Password'}
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
          disabled={isLoading || isRefreshing}
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isLoading ? 'Processing...' : (!hasPasswordSet ? 'Create Password' : 'Update Password')}
        </button>
      </form>
    </div>
  );
}