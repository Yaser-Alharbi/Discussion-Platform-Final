'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

const navigation = [
    { name: 'Dashboard', href: '/' },
    { name: 'Papers', href: '/papers' },
    { name: 'Streams', href: '/streams' }
];

export default function Navbar() {
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);
    const router = useRouter();
    const { user, logout, isAuthenticated, token, isLoading } = useAuthStore();

    // Handle click outside to close dropdown
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !(dropdownRef.current as HTMLElement).contains(event.target as Node)) {
                setShowDropdown(false);
            }
        }
        
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dropdownRef]);

    const handleLogout = async () => {
        logout();
        router.push('/Login');
    };

    // Show loading state while checking authentication
    if (isLoading) {
        return (
            <nav className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex justify-between h-16 items-center">
                        <Link href="/" className="text-black font-medium">Home</Link>
                        <div className="animate-pulse bg-gray-200 h-4 w-20 rounded"></div>
                    </div>
                </div>
            </nav>
        );
    }
   
    if (!isAuthenticated || !user) {
        return (
            <nav className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex justify-between h-16 items-center">
                        <Link href="/" className="text-black font-medium">Home</Link>
                        <div className="flex space-x-4">
                            <Link href="/Login" className="text-black font-medium">Login</Link>
                            <Link href="/Signup" className="text-black font-medium">Sign Up</Link>
                        </div>
                    </div>
                </div>
            </nav>
        );
    }
   
    return (
        <nav className="bg-white shadow">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex justify-between h-16 items-center">
                    <div className="flex space-x-8">
                        {navigation.map((item) => (
                            <Link 
                                key={item.name} 
                                href={item.href}
                                className="text-black font-medium"
                            >
                                {item.name}
                            </Link>
                        ))}
                    </div>
                    <div className="relative" ref={dropdownRef}>
                        <button 
                            onClick={() => setShowDropdown(!showDropdown)} 
                            className="text-black font-medium flex items-center"
                        >
                            {user?.email}
                            <svg className="ml-1 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                        {showDropdown && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
                                <Link href="/profile" className="block px-4 py-2 text-black hover:bg-gray-100">
                                    Profile
                                </Link>
                                <Link href="/settings" className="block px-4 py-2 text-black hover:bg-gray-100">
                                    Settings
                                </Link>
                                <button 
                                    onClick={handleLogout} 
                                    className="block w-full text-left px-4 py-2 text-black hover:bg-gray-100"
                                >
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}