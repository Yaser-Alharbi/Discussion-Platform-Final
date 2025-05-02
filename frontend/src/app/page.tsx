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
      <div className="h-screen flex items-center justify-center relative" style={{
        background: 'linear-gradient(140deg, #111827 0%, #131f37 50%, #0f1729 100%)',
        backgroundAttachment: 'fixed'
      }}>
        {/* grid pattern*/}
        <div className="absolute inset-0 opacity-3" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%236b7280' fill-opacity='0.2'%3E%3Cpath opacity='.3' d='M96 95h4v1h-4v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9zm-1 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9z'/%3E%3Cpath d='M6 5V0H5v5H0v1h5v94h1V6h94V5H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '24px 24px'
        }}></div>
        
        <div className="container mx-auto px-4 max-w-xl relative z-10">
          <div className="bg-gray-900/40 backdrop-blur-md rounded-xl p-8 shadow-lg border border-gray-800 overflow-hidden relative w-full">
            <div className="absolute -right-16 -top-16 w-48 h-48 bg-blue-600/5 rounded-full blur-3xl"></div>
            <div className="absolute -left-16 -bottom-16 w-48 h-48 bg-indigo-600/5 rounded-full blur-3xl"></div>
            
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-100 to-blue-100 pb-2 mb-4 text-center">You are not logged in</h1>
            
            <p className="mb-5 text-gray-300 text-center">
              For the security of the platform, we require that you must be logged in to use this platform.
            </p>
            
            <div className="bg-gray-800/30 backdrop-blur rounded-lg p-4 mb-5 border border-gray-700/20">
              <p className="text-center text-gray-300">
                You will be redirected to the <Link href="/Login" className="text-blue-300 hover:text-blue-200 transition-colors font-medium">login</Link> page in <span className="font-mono bg-gray-800 px-2 py-0.5 rounded">{countdown}</span> seconds.
              </p>
            </div>
            
            <p className="text-sm text-gray-400 text-center">
              If you do not have an account please <Link href="/Signup" className="text-blue-300 hover:text-blue-200 transition-colors font-medium">Signup</Link>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex items-center justify-center relative overflow-hidden" style={{
      background: 'linear-gradient(140deg, #111827 0%, #131f37 50%, #0f1729 100%)',
      backgroundAttachment: 'fixed'
    }}>
      {/* grid */}
      <div className="absolute inset-0 opacity-3" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%236b7280' fill-opacity='0.2'%3E%3Cpath opacity='.3' d='M96 95h4v1h-4v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9zm-1 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9z'/%3E%3Cpath d='M6 5V0H5v5H0v1h5v94h1V6h94V5H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        backgroundSize: '24px 24px'
      }}></div>

      {/* nodes pattern overlay */}
      <div className="absolute inset-0 opacity-3" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 800 800'%3E%3Cg fill='none' stroke='%23404040' stroke-width='1'%3E%3Cpath d='M769 229L1037 260.9M927 880L731 737 520 660 309 538 40 599 295 764 126.5 879.5 40 599-197 493 102 382-31 229 126.5 79.5-69-63'/%3E%3Cpath d='M-31 229L237 261 390 382 603 493 308.5 537.5 101.5 381.5M370 905L295 764'/%3E%3Cpath d='M520 660L578 842 731 737 840 599 603 493 520 660 295 764 309 538 390 382 539 269 769 229 577.5 41.5 370 105 295 -36 126.5 79.5 237 261 102 382 40 599 -69 737 127 880'/%3E%3Cpath d='M520-140L578.5 42.5 731-63M603 493L539 269 237 261 370 105M902 382L539 269M390 382L102 382'/%3E%3Cpath d='M-222 42L126.5 79.5 370 105 539 269 577.5 41.5 927 80 769 229 902 382 603 493 731 737M295-36L577.5 41.5M578 842L295 764M40-201L127 80M102 382L-261 269'/%3E%3C/g%3E%3Cg fill='%23303030'%3E%3Ccircle cx='769' cy='229' r='5'/%3E%3Ccircle cx='539' cy='269' r='5'/%3E%3Ccircle cx='603' cy='493' r='5'/%3E%3Ccircle cx='731' cy='737' r='5'/%3E%3Ccircle cx='520' cy='660' r='5'/%3E%3Ccircle cx='309' cy='538' r='5'/%3E%3Ccircle cx='295' cy='764' r='5'/%3E%3Ccircle cx='40' cy='599' r='5'/%3E%3Ccircle cx='102' cy='382' r='5'/%3E%3Ccircle cx='127' cy='80' r='5'/%3E%3Ccircle cx='370' cy='105' r='5'/%3E%3Ccircle cx='578' cy='42' r='5'/%3E%3Ccircle cx='237' cy='261' r='5'/%3E%3Ccircle cx='390' cy='382' r='5'/%3E%3C/g%3E%3C/svg%3E")`,
        backgroundSize: '120% 120%',
        backgroundPosition: 'center'
      }}></div>
      
      <div className="container mx-auto p-4 relative z-10 max-h-screen overflow-y-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-100 pb-1">Welcome, {user?.first_name || user?.email || 'Guest'}</h1>
          <p className="text-gray-400 text-base">Your gateway to scientific literature discussions</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-900/30 backdrop-blur-md rounded-lg p-5 shadow-md border border-gray-800 hover:border-gray-700 transition-all duration-300 group">
            <h2 className="text-lg font-semibold mb-2 flex items-center text-gray-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Platform Overview
            </h2>
            <p className="mb-2 text-sm text-gray-300">You are logged in to the scientific literature discussion platform.</p>
            <p className="text-sm text-gray-300">Use the navigation bar above to traverse the platform.</p>
          </div>
          
          <div className="bg-gray-900/30 backdrop-blur-md rounded-lg p-5 shadow-md border border-gray-800 hover:border-gray-700 transition-all duration-300 group">
            <h2 className="text-lg font-semibold mb-2 flex items-center text-gray-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Profile Management
            </h2>
            <p className="text-sm text-gray-300">The Profile page allows you to manage your account information, such as your email address, password, research interests, and institution.</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-900/30 backdrop-blur-md rounded-lg p-5 shadow-md border border-gray-800 hover:border-gray-700 transition-all duration-300 group">
            <h2 className="text-lg font-semibold mb-2 flex items-center text-gray-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Academic Papers
            </h2>
            <p className="mb-2 text-sm text-gray-300">The Papers page can be used to search for academic papers and access the full text of the papers directly if available.</p>
            <p className="text-sm text-gray-300">If you would like to save an extract from a paper, you can do so by clicking the "Save Extract" button in the results. To see your saved extracts, select the "My Extracts" option in the dropdown menu.</p>
          </div>
          
          <div className="bg-gray-900/30 backdrop-blur-md rounded-lg p-5 shadow-md border border-gray-800 hover:border-gray-700 transition-all duration-300 group">
            <h2 className="text-lg font-semibold mb-2 flex items-center text-gray-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              </svg>
              Discussion Streams
            </h2>
            <p className="mb-2 text-sm text-gray-300">If you would like to engage in discussions, please select the Streams option to either create a new stream or join an existing one.</p>
            <p className="mb-2 text-sm text-gray-300">Once you have joined a stream, you can chat with other users and engage in discussions.</p>
            <p className="text-sm text-gray-300">You can also share the extracts you have saved with the other users in the stream, using the reference tab.</p>
          </div>
        </div>
      </div>
    </div>
  );
}