// frontend/src/app/profile/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import PasswordSettings from '@/components/profile/PasswordSettings';

export default function ProfilePage() {
  const { user, fetchProfile, isLoading, error, updateProfile } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [editMode, setEditMode] = useState(false);
  const [notification, setNotification] = useState({ message: '', isError: false, show: false });
  const [editableUser, setEditableUser] = useState({
    email: '',
    institution: '',
    bio: '',
    research_interests: [] as string[]
  });
  const [newInterest, setNewInterest] = useState('');

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (user) {
      setEditableUser({
        email: user.email,
        institution: user.institution || '',
        bio: user.bio || '',
        research_interests: user.research_interests || []
      });
    }
  }, [user]);

  const handleEdit = () => {
    setEditMode(true);
  };

  const handleCancelEdit = () => {
    if (user) {
      setEditableUser({
        email: user.email,
        institution: user.institution || '',
        bio: user.bio || '',
        research_interests: user.research_interests || []
      });
    }
    setEditMode(false);
  };

  const handleSave = async () => {
    try {
      console.log('Updating profile with data:', editableUser);
      
      await updateProfile(editableUser);
      
      console.log('Profile updated, refreshing data');
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

  const addInterest = () => {
    if (newInterest.trim()) {
      setEditableUser({
        ...editableUser,
        research_interests: [...editableUser.research_interests, newInterest.trim()]
      });
      setNewInterest('');
    }
  };

  const removeInterest = (index: number) => {
    setEditableUser({
      ...editableUser,
      research_interests: editableUser.research_interests.filter((_, i) => i !== index)
    });
  };

  if (isLoading) return <div>Loading...</div>;

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
                    <label className="block text-sm font-medium mb-2">Institution</label>
                    <input
                      type="text"
                      value={editableUser.institution}
                      onChange={(e) => setEditableUser({...editableUser, institution: e.target.value})}
                      className="w-full p-2 border rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Bio</label>
                    <textarea
                      value={editableUser.bio}
                      onChange={(e) => setEditableUser({...editableUser, bio: e.target.value})}
                      className="w-full p-2 border rounded-md"
                      rows={4}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Research Interests</label>
                    <div className="flex space-x-2 mb-2">
                      <input
                        type="text"
                        value={newInterest}
                        onChange={(e) => setNewInterest(e.target.value)}
                        className="flex-1 p-2 border rounded-md"
                        placeholder="Add a research interest"
                      />
                      <button
                        type="button"
                        onClick={addInterest}
                        className="py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Add
                      </button>
                    </div>
                    
                    <ul className="space-y-2">
                      {editableUser.research_interests.map((interest, index) => (
                        <li key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span>{interest}</span>
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