'use client';

import { useState, useEffect, useRef } from 'react';
import { useLivestreamStore } from '@/store/livestreamStore';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function RoomsPage() {
  const [roomTitle, setRoomTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchInterest, setSearchInterest] = useState('');
  const [filteredInterests, setFilteredInterests] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { 
    fetchRooms, 
    availableRooms, 
    isLoadingRooms, 
    createRoom,
    fetchResearchInterests,
    availableInterests,
    isLoadingInterests
  } = useLivestreamStore();
  
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  
  useEffect(() => {
    console.log('Fetching available rooms');
    fetchRooms();
    loadResearchInterests();
  }, [fetchRooms]);
  
  // Load research interests from the backend
  const loadResearchInterests = async () => {
    try {
      await fetchResearchInterests();
    } catch (error) {
      console.error('Failed to load research interests:', error);
    }
  };

  // Filter interests based on user input
  useEffect(() => {
    if (searchInterest.trim() === '') {
      setFilteredInterests(availableInterests);
    } else {
      const filtered = availableInterests.filter(interest =>
        interest.toLowerCase().includes(searchInterest.toLowerCase())
      );
      setFilteredInterests(filtered);
    }
  }, [searchInterest, availableInterests]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated || !user) {
      setError('You must be logged in to create a room');
      console.error('Cannot create room: User not logged in');
      return;
    }
    
    if (!roomTitle.trim()) {
      setError('Room title is required');
      console.error('Cannot create room: Title is empty');
      return;
    }
    
    try {
      setIsCreating(true);
      setError(null);
      console.log(`Creating room with title: ${roomTitle} and interests: ${selectedInterests.join(', ')}`);
      
      const room = await createRoom(roomTitle, selectedInterests);
      
      if (room) {
        console.log(`Room created or found successfully:`, room);
        router.push(`/room/${room.room_id}`);
      } else {
        setError('Failed to create or find room');
        console.error('Room creation returned null result');
      }
    } catch (err: any) {
      // Special case for when a user already has a room but we couldn't find it
      if (err.message && err.message.includes('already have an active room')) {
        setError('You already have an active room. Please find it in the list below or delete it first.');
        
        // Refresh the room list to help them find their room
        fetchRooms();
      } else {
        setError(err.message || 'Failed to create room');
      }
      console.error('Error creating room:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const addInterest = (interest: string) => {
    if (interest && !selectedInterests.includes(interest)) {
      setSelectedInterests([...selectedInterests, interest]);
      setSearchInterest('');
      setShowDropdown(false);
    }
  };

  const removeInterest = (interest: string) => {
    setSelectedInterests(selectedInterests.filter(item => item !== interest));
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">LiveStream Rooms</h1>
      
      <div className="bg-gray-800 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Create a New Room</h2>
        <form onSubmit={handleCreateRoom} className="flex flex-col">
          <div className="mb-4">
            <label htmlFor="roomTitle" className="block text-sm font-medium mb-2">
              Room Title
            </label>
            <input
              type="text"
              id="roomTitle"
              value={roomTitle}
              onChange={(e) => setRoomTitle(e.target.value)}
              className="w-full p-3 bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter room title"
              disabled={isCreating}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Research Interests
            </label>
            <div className="relative" ref={dropdownRef}>
              <input
                type="text"
                value={searchInterest}
                onChange={(e) => {
                  setSearchInterest(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                className="w-full p-3 bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search research interests"
                disabled={isCreating}
              />
              
              {showDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-gray-700 border border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {filteredInterests.length > 0 ? (
                    <ul>
                      {filteredInterests.slice(0, 5).map((interest, index) => (
                        <li 
                          key={index}
                          className={`p-2 hover:bg-gray-600 cursor-pointer ${
                            selectedInterests.includes(interest) ? 'bg-blue-600' : ''
                          }`}
                          onClick={() => addInterest(interest)}
                        >
                          {interest}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-2 text-center">
                      No matching interests found.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {selectedInterests.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Selected Interests
              </label>
              <div className="flex flex-wrap gap-2">
                {selectedInterests.map((interest, index) => (
                  <div key={index} className="flex items-center bg-blue-600 px-3 py-1 rounded-full">
                    <span>{interest}</span>
                    <button
                      type="button"
                      onClick={() => removeInterest(interest)}
                      className="ml-2 text-sm hover:text-red-300"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {error && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <button
            type="submit"
            disabled={isCreating || !roomTitle.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? 'Creating...' : 'Create Room'}
          </button>
        </form>
      </div>
      
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Available Rooms</h2>
        
        {isLoadingRooms ? (
          <p className="text-gray-400">Loading rooms...</p>
        ) : availableRooms.length === 0 ? (
          <p className="text-gray-400">No rooms available</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableRooms.map((room) => (
              <div key={room.id} className="bg-gray-700 rounded-lg p-4">
                <h3 className="font-medium mb-2">{room.title}</h3>
                <h4 className="font-medium mb-2">Host: {room.hostName}</h4>
                
                {room.research_interests && room.research_interests.length > 0 && (
                  <div className="my-2">
                    <p className="text-sm text-gray-400 mb-1">Research Interests:</p>
                    <div className="flex flex-wrap gap-1">
                      {room.research_interests.map((interest, idx) => (
                        <span key={idx} className="bg-blue-900 text-xs px-2 py-1 rounded-full">
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex justify-between items-center mt-4">
                  <span className="text-sm text-gray-400">
                    Activity: {room.numParticipants || 0} total participant/s have joined this room
                  </span>   
                  <button
                    onClick={() => router.push(`/room/${room.room_id}`)}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                  >
                    Join
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 