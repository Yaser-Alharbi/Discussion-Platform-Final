// frontend/src/app/auth/Login/page.tsx

'use client';

import SignupForm from '@/components/authentication/SignupForm';
import { useSearchParams } from 'next/navigation';


export default function SignupPage() {
  const searchParams = useSearchParams();
  const provider = searchParams?.get('provider');
  const email = searchParams?.get('email');



    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center">
        <SignupForm provider={provider} email={email} />
      </div>
    );
  }