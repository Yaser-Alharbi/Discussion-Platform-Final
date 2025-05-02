// frontend/src/components/authentication/AuthGuard.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter, usePathname } from 'next/navigation';

// paths that are exempt from authentication requirement
const PUBLIC_PATHS = ['/Login', '/Signup', '/Reset-password', '/'];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, syncAuthState } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  
  useEffect(() => {
    syncAuthState();
    
    // auth state initialization with a delay
    const timer = setTimeout(() => {
      setIsChecking(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [syncAuthState]);
  
  useEffect(() => {
    if (!isChecking && !isLoading) {
      // console.log('pathname', pathname);
      const isPublicPath = PUBLIC_PATHS.some(path => pathname === path || pathname?.startsWith(`${path}/`));
      
      if (!isAuthenticated && !isPublicPath && pathname !== '/') {
        // redirect non-authenticated users to the root page
        // console.log('pathname before redirect', pathname);
        // console.log('redirecting to root page');
        router.push('/');
      }
    }
  }, [isAuthenticated, isLoading, isChecking, pathname, router]);
  
  // while checking authentication, show loading indicator
  if (isChecking || isLoading) {
    return <div className="flex justify-center items-center h-full">Loading...</div>;
  }
  
  return children;
}