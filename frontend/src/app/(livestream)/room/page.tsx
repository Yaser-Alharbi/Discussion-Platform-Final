'use client';

import {
  ControlBar,
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  useTracks,
  RoomContext,
  useLocalParticipant
} from '@livekit/components-react';
import { Room, Track, LocalTrack, RoomEvent, TrackPublication, createLocalAudioTrack } from 'livekit-client';
import '@livekit/components-styles';
import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { User as FirebaseUser } from 'firebase/auth';

export default function Page() {
  // TODO: get user input for room and name
  const room = 'quickstart-room';
  const name = 'quickstart-user';
  const [token, setToken] = useState('');
  const [audioInitialized, setAudioInitialized] = useState(false);
  const [roomInstance] = useState(() => new Room({
    // Optimize video quality for each participant's screen
    adaptiveStream: true,
    // Enable automatic audio/video quality optimization
    dynacast: true,
  }));

  useEffect(() => {
    const getCurrentUser = async () => {
      return new Promise<FirebaseUser | null>((resolve) => {
        const unsubscribe = auth.onAuthStateChanged(user => {
          unsubscribe();
          resolve(user);
        });
      });
    };

    let mounted = true;
    (async () => {
      try {
        // Get current user from Firebase
        const user = await getCurrentUser();
        let userEmail = name;
        
        // If user is authenticated, use their email
        if (user) {
          userEmail = user.email || user.uid;
        }
        
        // Fetch token with user identity
        const resp = await fetch(`/api/token?room=${room}&username=${userEmail}`);
        const data = await resp.json();
        if (!mounted) return;
        if (data.token) {
          setToken(data.token);
        }
      } catch (e) {
        console.error(e);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // Connect to the room when the user initializes audio
  useEffect(() => {
    if (audioInitialized && token) {
      roomInstance.connect(process.env.NEXT_PUBLIC_LIVEKIT_URL as string, token)
        .catch(e => console.error('Failed to connect to room:', e));
      
      return () => {
        roomInstance.disconnect();
      };
    }
  }, [audioInitialized, token, roomInstance]);

  if (token === '') {
    return <div>Getting token...</div>;
  }

  if (!audioInitialized) {
    return (
      <div className="flex items-center justify-center h-screen">
        <button 
          className="px-4 py-2 bg-blue-500 text-white rounded"
          onClick={() => setAudioInitialized(true)}
        >
          Click to Join Room
        </button>
      </div>
    );
  }

  return (
    <RoomContext.Provider value={roomInstance}>
      <div data-lk-theme="default" style={{ height: '100dvh' }}>
        {/* Your custom component with basic video conferencing functionality. */}
        <MyVideoConference />
        {/* The RoomAudioRenderer takes care of room-wide audio for you. */}
        <RoomAudioRenderer />
        {/* Controls for the user to start/stop audio, video, and screen share tracks */}
        <CustomControlBar />
      </div>
    </RoomContext.Provider>
  );
}

function CustomControlBar() {
  const { localParticipant } = useLocalParticipant();
  const [isMicrophoneEnabled, setIsMicrophoneEnabled] = useState(false);
  const [audioTrack, setAudioTrack] = useState<LocalTrack | null>(null);
  
  // Clean up audio track on unmount
  useEffect(() => {
    return () => {
      if (audioTrack) {
        audioTrack.stop();
      }
    };
  }, [audioTrack]);
  
  const toggleMicrophone = async () => {
    try {
      if (!audioTrack) {
        // Create and publish the audio track
        const track = await createLocalAudioTrack({
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        });
        
        setAudioTrack(track);
        
        if (localParticipant) {
          await localParticipant.publishTrack(track);
        }
        
        setIsMicrophoneEnabled(true);
      } else if (isMicrophoneEnabled) {
        // Mute the track
        audioTrack.mute();
        setIsMicrophoneEnabled(false);
      } else {
        // Unmute the track
        audioTrack.unmute();
        setIsMicrophoneEnabled(true);
      }
    } catch (error) {
      console.error('Error toggling microphone:', error);
    }
  };

  return (
    <div className="lk-control-bar">
      <div className="lk-button-group">
        <button 
          className={`lk-button ${isMicrophoneEnabled ? 'lk-button-active' : ''}`} 
          onClick={toggleMicrophone}
          style={{ 
            padding: '8px 16px',
            marginRight: '10px',
            backgroundColor: isMicrophoneEnabled ? '#4caf50' : '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {isMicrophoneEnabled ? 'Mute' : 'Unmute'} Microphone
        </button>
        <ControlBar controls={{ microphone: false }} />
      </div>
    </div>
  );
}

function MyVideoConference() {
  // `useTracks` returns all camera and screen share tracks. If a user
  // joins without a published camera track, a placeholder track is returned.
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
      { source: Track.Source.Microphone, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );
  
  return (
    <GridLayout 
      tracks={tracks} 
      style={{ height: 'calc(100vh - var(--lk-control-bar-height))' }}
      className="spotlight-grid"
    >
      {/* The GridLayout accepts zero or one child. The child is used
      as a template to render all passed in tracks. */}
      <ParticipantTile />
    </GridLayout>
  );
}