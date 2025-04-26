// frontend/src/app/profile/page.tsx
'use client';
import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import PasswordSettings from '@/components/profile/PasswordSettings';

export default function ProfilePage() {
  const { user, fetchProfile, isLoading, error, updateProfile, fetchResearchInterests} = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [editMode, setEditMode] = useState(false);
  const [notification, setNotification] = useState({ message: '', isError: false, show: false });
  const [editableUser, setEditableUser] = useState({
    email: '',
    institution: '',
    bio: '',
    research_interests: [] as string[],
    first_name: '',
    last_name: ''
  });
  const [newInterest, setNewInterest] = useState('');
  const [availableInterests, setAvailableInterests] = useState<string[]>([]);
  const [filteredInterests, setFilteredInterests] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchProfile();
    loadResearchInterests();
  }, [fetchProfile]);

  useEffect(() => {
    if (user) {
      setEditableUser({
        email: user.email,
        institution: user.institution || '',
        bio: user.bio || '',
        research_interests: user.research_interests || [],
        first_name: user.first_name || '',
        last_name: user.last_name || ''
      });
    }
    loadResearchInterests();
  }, [user]);

  // Load research interests from the backend
  const loadResearchInterests = async () => {
    const interests = await fetchResearchInterests();
    setAvailableInterests(interests);
  };

  // Filter interests based on user input
  useEffect(() => {
    if (newInterest.trim() === '') {
      setFilteredInterests(availableInterests);
    } else {
      const filtered = availableInterests.filter(interest =>
        interest.toLowerCase().includes(newInterest.toLowerCase())
      );
      setFilteredInterests(filtered);
    }
  }, [newInterest, availableInterests]);

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

  const handleEdit = () => {
    setEditMode(true);
  };

  const handleCancelEdit = () => {
    if (user) {
      setEditableUser({
        email: user.email,
        institution: user.institution || '',
        bio: user.bio || '',
        research_interests: user.research_interests || [],
        first_name: user.first_name || '',
        last_name: user.last_name || ''
      });
    }
    setEditMode(false);
  };

  const handleSave = async () => {
    try {
      // console.log('Updating profile with data:', editableUser);
      
      await updateProfile(editableUser);
      
      // console.log('Profile updated, refreshing data');
      await fetchProfile();
      
      setNotification({ message: 'Profile updated successfully!', isError: false, show: true });
      setEditMode(false);
      
      setTimeout(() => {
        setNotification(prev => ({ ...prev, show: false }));
      }, 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setNotification({ message: 'Failed to update profile.', isError: true, show: true });
    }
  };

  const addInterest = (interest: string = newInterest.trim()) => {
    if (interest && !editableUser.research_interests.includes(interest)) {
      setEditableUser({
        ...editableUser,
        research_interests: [...editableUser.research_interests, interest]
      });
      setNewInterest('');
      setShowDropdown(false);
    }
  };

  const removeInterest = (index: number) => {
    setEditableUser({
      ...editableUser,
      research_interests: editableUser.research_interests.filter((_, i) => i !== index)
    });
  };


  return (
    <div className="max-w-5xl mx-auto mt-10 p-6">
      <div className="flex mb-6 space-x-4 border-b pb-2">
        <button 
          onClick={() => setActiveTab('profile')}
          className={`pb-2 px-1 ${activeTab === 'profile' ? 'border-b-2 border-blue-500 font-medium' : ''}`}
        >
          Profile
        </button>
        <button 
          onClick={() => setActiveTab('security')}
          className={`pb-2 px-1 ${activeTab === 'security' ? 'border-b-2 border-blue-500 font-medium' : ''}`}
        >
          Security
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="bg-white rounded-lg shadow">
          {notification.show && (
            <div className={`p-4 mb-4 ${notification.isError ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'} rounded-t-lg`}>
              {notification.message}
            </div>
          )}
          
          {user ? (
            <div className="space-y-4 p-6 text-black">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-black">Profile</h2>
                {!editMode && (
                  <button
                    onClick={handleEdit}
                    className="py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Edit Profile
                  </button>
                )}
              </div>
              
              <p className="text-black"><strong>Email:</strong> {user.email}</p>
              
              {!editMode ? (
                <>
                  <p className="text-black"><strong>First Name:</strong> {user.first_name || ''}</p>
                  <p className="text-black"><strong>Last Name:</strong> {user.last_name || ''}</p>
                  <p className="text-black"><strong>Institution:</strong> {user.institution || ''}</p>
                  <p className="text-black"><strong>Bio:</strong> {user.bio || ''}</p>
                  <div className="text-black">
                    <strong>Research Interests:</strong>
                    {user.research_interests && user.research_interests.length > 0 ? (
                      <ul className="list-disc pl-5 mt-2">
                        {user.research_interests.map((interest, index) => (
                          <li key={index} className="text-black">{interest}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2">None specified</p>
                    )}
                  </div>
                </>
              ) : (
                <div className="space-y-4">

                  <div>
                    <label className="block text-sm font-medium mb-2 text-black">First Name</label>
                    <input
                      type="text"
                      value={editableUser.first_name}
                      onChange={(e) => setEditableUser({...editableUser, first_name: e.target.value})}
                      className="w-full p-2 border rounded-md text-black"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-black">Last Name</label>
                    <input
                      type="text"
                      value={editableUser.last_name}
                      onChange={(e) => setEditableUser({...editableUser, last_name: e.target.value})}
                      className="w-full p-2 border rounded-md text-black"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-black">Institution</label>
                    <input
                      type="text"
                      value={editableUser.institution}
                      onChange={(e) => setEditableUser({...editableUser, institution: e.target.value})}
                      className="w-full p-2 border rounded-md text-black"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2 text-black">Bio</label>
                    <textarea
                      value={editableUser.bio}
                      onChange={(e) => setEditableUser({...editableUser, bio: e.target.value})}
                      className="w-full p-2 border rounded-md text-black"
                      rows={4}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2 text-black">Research Interests</label>
                    <div className="relative" ref={dropdownRef}>
                      <div className="flex space-x-2 mb-2">
                        <input
                          type="text"
                          value={newInterest}
                          onChange={(e) => {
                            setNewInterest(e.target.value);
                            setShowDropdown(true);
                          }}
                          onFocus={() => setShowDropdown(true)}
                          className="flex-1 p-2 border rounded-md text-black"
                          placeholder="Add a research interest"
                        />
                        <button
                          type="button"
                          onClick={() => addInterest()}
                          className="py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          Add
                        </button>
                      </div>
                      
                      {showDropdown && (
                        <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto text-black">
                          {filteredInterests.length > 0 ? (
                            <ul>
                              {filteredInterests.slice(0, 5).map((interest, index) => (
                                <li 
                                  key={index}
                                  className={`p-2 hover:bg-gray-100 cursor-pointer ${
                                    editableUser.research_interests.includes(interest) ? 'bg-blue-50' : ''
                                  }`}
                                  onClick={() => addInterest(interest)}
                                >
                                  {interest}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <div className="p-2 text-center text-black">
                              No matching interests found. Type to add a new interest.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <ul className="space-y-2">
                      {editableUser.research_interests.map((interest, index) => (
                        <li key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-black">{interest}</span>
                          <button
                            type="button"
                            onClick={() => removeInterest(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="flex space-x-2 mt-6">
                    <button
                      type="button"
                      onClick={handleSave}
                      className="py-2 px-6 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="py-2 px-6 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 text-black">No user data found</div>
          )}
        </div>
      )}

      {activeTab === 'security' && (
        <PasswordSettings />
      )}
    </div>
  );
}