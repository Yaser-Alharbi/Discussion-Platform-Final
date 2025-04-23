// frontend/src/app/page.tsx

'use client';
import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';

export default function Home() {
 const [email, setEmail] = useState<string | null>(null);

 useEffect(() => {
   return auth.onAuthStateChanged((user) => {
     setEmail(user?.email || null);
   });
 }, []);

 return (<div>Welcome, {email || 'Guest'}</div>);
}