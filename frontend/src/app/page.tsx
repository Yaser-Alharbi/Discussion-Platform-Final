// frontend/src/app/page.tsx

'use client';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const { user, isAuthenticated, isLoading, syncAuthState } = useAuthStore();
  const router = useRouter();
  const [countdown, setCountdown] = useState(15); // countdown time in seconds
  
  useEffect(() => {
    // initialize auth synchronization
    syncAuthState();
  }, [syncAuthState]);

  // redirection with countdown
  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            router.push('/Login');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [isAuthenticated, isLoading, router]);

  // show loading state while checking authentication
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  // if not authenticated, show message with the countdown
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <h1 className="text-3xl font-bold mb-4">You are not logged in</h1>
        
        <p className="mb-6 max-w-md">
          For the security of the platform, we require that you must be logged in to use this platform.
        </p>
        
        <p className="mb-4">
          You will be redirected to the <Link href="/Login" className="underline">login</Link> page in {countdown} seconds.
        </p>
        
        <p className="text-sm text-gray-500 max-w-md">
          If you do not have an account <Link href="/Signup" className="underline">Signup</Link>.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Welcome, {user?.first_name || user?.email || 'Guest'}</h1>
      <p>You are successfully logged in to the scientific literature discussion platform.</p>
    </div>
  );
}