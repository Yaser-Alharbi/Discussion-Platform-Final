import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  UserCredential,
  GoogleAuthProvider,
  signInWithPopup,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth';
import { auth } from '@/lib/firebase';


// Add this token handler function to your file
async function getAuthToken(forceRefresh = false): Promise<string | null> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) return null;
    
    return await currentUser.getIdToken(forceRefresh);
  } catch (error: any) {
    // Handle token timing errors with retry
    if (error.message?.includes('Token used too early')) {
      // Wait 1.5 seconds to allow clocks to synchronize
      await new Promise(resolve => setTimeout(resolve, 1500));
      const user = auth.currentUser;
      if (!user) return null;
      return user.getIdToken(true);
    }
    
    throw error;
  }
}

// User interface defining the structure of user data
interface User {
  email: string;
  institution?: string;
  bio?: string;
  research_interests?: string[];
  provider?: string;
}

// AuthState interface defining the structure of the authentication state
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// AuthActions interface defining the available actions
interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  googleLogin: () => Promise<void>;
  registerGoogleUser: (userData?: Partial<User>) => Promise<void>;
  register: (email: string, password: string, userData?: Partial<User>) => Promise<void>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  setPassword: (password: string, currentPassword?: string) => Promise<void>;
  clearError: () => void;
  refreshToken: () => Promise<void>;
  syncAuthState: () => void;
}

// Combined interface for state and actions
interface AuthStore extends AuthState, AuthActions {}

// API endpoint URLs
const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const AUTH_ENDPOINTS = {
  VERIFY_TOKEN: `${API_URL}/api/verify-token`,
  USER_PROFILE: `${API_URL}/api/user-profile`,
  REGISTER: `${API_URL}/api/register`,
  SET_PASSWORD: `${API_URL}/api/set-password`,
  UPDATE_PROFILE: `${API_URL}/api/update-profile`,
};

// Create the auth store with Zustand
export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Action to clear any error messages
      clearError: () => set({ error: null }),

      // Login action - authenticates a user with Firebase and stores the token
      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null });
          
          // Use the auth instance from lib/firebase
          
          // login in with Firebase
          const userCredential: UserCredential = await signInWithEmailAndPassword(auth, email, password);
          const token = await userCredential.user.getIdToken();
          
          if (!token) {
            throw new Error('Failed to get authentication token');
          }
          
          set({ token, isAuthenticated: true, isLoading: false });
          
          // Fetch user profile after successful login
          await get().fetchProfile();
        } catch (error: any) {
          set({ 
            isLoading: false, 
            error: error.message || 'Failed to login'
          });
        }
      },

      // Google Login action - authenticates with Google via Firebase and stores the token
      googleLogin: async () => {
        try {
          set({ isLoading: true, error: null });
          
          // Use the auth instance from lib/firebase
          const provider = new GoogleAuthProvider();
          
          // Sign in with Google popup
          const userCredential: UserCredential = await signInWithPopup(auth, provider);
          
          const token = await userCredential.user.getIdToken();
          
          if (!token) {
            throw new Error('Failed to get authentication token');
          }
          
          set({ token, isAuthenticated: true, isLoading: false });
          
          // Fetch user profile after successful login
          await get().fetchProfile();
        } catch (error: any) {
          set({ 
            isLoading: false, 
            error: error.message || 'Failed to login with Google'
          });
        }
      },

      // Register Google user action - registers a Google-authenticated user in the backend
      registerGoogleUser: async (userData?: Partial<User>) => {
        try {
          const { token } = get();
          
          if (!token) {
            throw new Error('No authentication token available. Please login with Google first.');
          }

          set({ isLoading: true, error: null });
          
          // Register Google user in backend
          const response = await fetch(AUTH_ENDPOINTS.REGISTER, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              ...userData,
              is_google_user: true
            })
          });
          
          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to register Google user');
          }
          
          // Fetch user profile to update state with user data
          await get().fetchProfile();
          
          set({ isLoading: false });
        } catch (error: any) {
          set({ 
            isLoading: false, 
            error: error.message || 'Failed to register Google user'
          });
          throw error;
        }
      },

      // Register action - creates a new user in Firebase and the backend
      register: async (email: string, password: string, userData?: Partial<User>) => {
        try {
          set({ isLoading: true, error: null });
          
          // Use the auth instance from lib/firebase
          
          // Create user in Firebase
          const userCredential: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
          const token = await userCredential.user.getIdToken();
          
          if (!token) {
            throw new Error('Failed to get authentication token');
          }
          
          // Register user in backend
          const response = await fetch(AUTH_ENDPOINTS.REGISTER, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              ...userData,
              password
            })
          });
          
          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to register user');
          }
          
          set({ token, isAuthenticated: true, isLoading: false });
          
          // Fetch user profile after successful registration
          await get().fetchProfile();
        } catch (error: any) {
          set({ 
            isLoading: false, 
            error: error.message || 'Failed to register'
          });
        }
      },

      // Logout action - signs out the user and clears the state
      logout: () => {
        try {
          // Use the auth instance from lib/firebase
          
          // Sign out from Firebase
          signOut(auth);
          
          // Clear state
          set({ 
            user: null, 
            token: null, 
            isAuthenticated: false 
          });
        } catch (error: any) {
          set({ error: error.message || 'Failed to logout' });
        }
      },

      // Fetch profile action - gets the user profile from the backend
      // fetchProfile: async () => {
      //   const { token } = get();
        
      //   if (!token) {
      //     set({ error: 'No authentication token available' });
      //     return;
      //   }
        
      //   try {
      //     set({ isLoading: true, error: null });
          
      //     const response = await fetch(AUTH_ENDPOINTS.USER_PROFILE, {
      //       headers: {
      //         'Authorization': `Bearer ${token}`
      //       }
      //     });
          
      //     if (!response.ok) {
      //       const data = await response.json();
      //       throw new Error(data.error || 'Failed to fetch user profile');
      //     }
          
      //     const userData = await response.json();

      //     const providerData = auth.currentUser?.providerData || [];
      //     const provider = providerData.find(p => p.providerId === 'google.com')
      //       ? 'google.com'
      //       : 'password';
          
      //     set({
      //       user: userData,
      //       isLoading: false
      //     });
      //   } catch (error: any) {
      //     set({ 
      //       isLoading: false, 
      //       error: error.message || 'Failed to fetch profile'
      //     });
      //   }
      // },

      // new fetchProfile action - fetches the user profile from the backend
      fetchProfile: async () => {
        try {
          const { token } = get();
          let currentToken = token;
          
          // If no token or token error occurred previously, try to get a fresh one
          if (!currentToken || get().error?.includes('Token used too early')) {
            currentToken = await getAuthToken();
          }
          
          if (!currentToken) {
            set({ error: 'No authentication token available' });
            return;
          }
          
          set({ isLoading: true, error: null });
          
          const response = await fetch(AUTH_ENDPOINTS.USER_PROFILE, {
            headers: {
              'Authorization': `Bearer ${currentToken}`
            }
          });
          
          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to fetch user profile');
          }
          
          const userData = await response.json();
          
          const providerData = auth.currentUser?.providerData || [];
          const provider = providerData.find(p => p.providerId === 'google.com')
            ? 'google.com'
            : 'password';
          
          set({
            user: userData,
            isLoading: false,
            token: currentToken
          });
        } catch (error: any) {
          // If token timing error, try to refresh the token
          if (error.message?.includes('Token used too early')) {
            await get().refreshToken();
          } else {
            set({ 
              isLoading: false, 
              error: error.message || 'Failed to fetch profile'
            });
          }
        }
      },

      // Update profile action - updates the user profile in the backend
      updateProfile: async (userData: Partial<User>) => {
        const { token } = get();
        
        if (!token) {
          set({ error: 'No authentication token available' });
          return;
        }
        
        try {
          set({ isLoading: true, error: null });
          
          console.log('AuthStore: Sending profile update with data:', userData);
          
          // Use UPDATE_PROFILE endpoint instead of REGISTER endpoint
          const response = await fetch(AUTH_ENDPOINTS.UPDATE_PROFILE, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(userData)
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            console.error('Update profile response error:', errorData);
            throw new Error(errorData.error || 'Failed to update profile');
          }
          
          // Re-fetch the profile to get the updated data
          await get().fetchProfile();
        } catch (error: any) {
          console.error('Error in updateProfile action:', error);
          set({ 
            isLoading: false, 
            error: error.message || 'Failed to update profile'
          });
          throw error; // Re-throw to allow component to catch it
        }
      },

    // Updated setPassword action
      setPassword: async (newPassword: string, currentPassword?: string) => {
        const { token } = get();
        
        if (!token) {
          set({ error: 'No authentication token available' });
          return;
        }
        
        try {
          set({ isLoading: true, error: null });
          
          const currentUser = auth.currentUser;
          if (!currentUser) {
            throw new Error('No authenticated user found');
          }
          
          // Determine if user is a Google user
          const isGoogleUser = currentUser.providerData.some(
            provider => provider.providerId === 'google.com'
          );
          
          // For non-Google users, require reauthentication
          if (!isGoogleUser && currentPassword) {
            try {
              const credential = EmailAuthProvider.credential(
                currentUser.email || '', 
                currentPassword
              );
              await reauthenticateWithCredential(currentUser, credential);
            } catch (error) {
              throw new Error('Current password is incorrect');
            }
          }
          
          // Update Firebase password
          await updatePassword(currentUser, newPassword);
          
          // Update password in backend
          const response = await fetch(AUTH_ENDPOINTS.SET_PASSWORD, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
              password: newPassword,
              is_google_user: isGoogleUser 
            })
          });
          
          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to update password');
          }
          
          set({ isLoading: false });
        } catch (error: any) {
          set({ 
            isLoading: false, 
            error: error.message || 'Failed to set password'
          });
          throw error;
        }
      },

      // Refresh token action - refreshes the user's token and updates the state
      refreshToken: async () => {
        try {
          set({ isLoading: true, error: null });
          
        const token = await getAuthToken(true);
        
        if (!token) {
          throw new Error('No authenticated user found');
        }
        
        set({ token, error: null, isLoading: false });
        
        // Fetch profile after token refresh
        await get().fetchProfile();
      } catch (error: any) {
        set({ 
          isLoading: false, 
          error: error.message || 'Failed to refresh token'
        });
      }
      },

      // Sync auth state action - syncs the auth state with the backend
      syncAuthState: () => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
          try {
            const { isAuthenticated } = get();
            
            if (user && !isAuthenticated) {
              // User is signed in with Firebase but not in our store
              const token = await getAuthToken(true);
              if (token) {
                set({ token, isAuthenticated: true });
                get().fetchProfile();
              }
            } 
            else if (!user && isAuthenticated) {
              // User is signed out of Firebase but still in our store
              get().logout();
            }
            else if (user && isAuthenticated) {
              // User is signed in both places, but might need profile data
              const { user: storeUser } = get();
              if (!storeUser) {
                get().fetchProfile();
              }
            }
          } catch (error: any) {
            console.error('Auth sync error:', error);
          }
        });
        
        // Store the unsubscribe function in window to prevent memory leaks
        // @ts-ignore
        if (typeof window !== 'undefined') {
          // Cleanup previous listener if exists
          // @ts-ignore
          if (window._authUnsubscribe) window._authUnsubscribe();
          // @ts-ignore
          window._authUnsubscribe = unsubscribe;
        }
      },

    }),
    {
      name: 'auth-storage', // Name for localStorage
      partialize: (state) => ({ 
        // Only persist these fields
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        user: state.user
      })
    }
  )
); 


if (typeof window !== 'undefined') {
  // Initialize auth sync after store is created
  setTimeout(() => {
    useAuthStore.getState().syncAuthState();
  }, 100);
  
  // Add this new error monitoring code here
  setInterval(() => {
    const { error, refreshToken } = useAuthStore.getState();
    if (error && error.includes('Token used too early')) {
      console.log('[Auth] Detected timing error, refreshing token...');
      refreshToken();
    }
  }, 2000);
}
