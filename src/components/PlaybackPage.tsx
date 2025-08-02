// src/PlaybackPage.tsx - NEW FILE (create this in your src folder)

import { sdk } from "@farcaster/frame-sdk";
import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Mic, Volume2, RotateCcw } from 'lucide-react';

// Bouncing Mic SVG Component - same as your App.tsx
const BouncingMic = () => {
  return (
    <div className="flex justify-center items-center">
      <svg 
        width="48" 
        height="48" 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="text-white animate-bounce"
        style={{ animationDuration: '0.6s' }}
      >
        <path
          d="M12 2C10.9 2 10 2.9 10 4V12C10 13.1 10.9 14 12 14C13.1 14 14 13.1 14 12V4C14 2.9 13.1 2 12 2Z"
          fill="currentColor"
        />
        <path
          d="M19 10V12C19 15.9 15.9 19 12 19C8.1 19 5 15.9 5 12V10H7V12C7 14.8 9.2 17 12 17C14.8 17 17 14.8 17 12V10H19Z"
          fill="currentColor"
        />
        <path
          d="M12 19V22H8V24H16V22H12V19Z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
};

// Voice Message Card Component - EXACT COPY from your App.tsx
const VoiceMessageCard = ({ 
  isPlaying, 
  duration, 
  currentTime, 
  onPlayPause,
  userProfile,
  recordedDuration
}: { 
  isPlaying: boolean; 
  duration: number; 
  currentTime: number; 
  onPlayPause: () => void;
  userProfile?: {
    name?: string;
    username?: string;
    avatar?: string;
  };
  recordedDuration: number;
}) => {
  const [imgError, setImgError] = useState(false);

  const formatTime = (seconds: number) => {
    if (typeof seconds !== 'number' || isNaN(seconds) || !isFinite(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Always prefer duration if available, else recordedDuration
  const totalDuration = (duration && duration > 0)
    ? duration
    : (recordedDuration && recordedDuration > 0)
      ? recordedDuration
      : undefined;

  return (
    <div className="bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl p-6 relative overflow-hidden">
      {/* Speaker icon in top right corner */}
      <div className="absolute top-4 right-4">
        <Volume2 className="w-5 h-5 text-white/70" />
      </div>
      <div className="text-white mb-4">
        <p className="text-lg font-medium"></p>
      </div>
      <div className="relative">
        <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
          {/* Avatar or fallback */}
          <div className="flex items-center justify-center w-20 h-20 mx-auto">
            {(!imgError && userProfile?.avatar) ? (
              <img
                src={userProfile.avatar}
                alt={userProfile.name || 'User Profile'}
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <svg 
                width="64" 
                height="64" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                className="text-purple-500"
              >
                <path
                  d="M12 2C10.9 2 10 2.9 10 4V12C10 13.1 10.9 14 12 14C13.1 14 14 13.1 14 12V4C14 2.9 13.1 2 12 2Z"
                  fill="currentColor"
                />
                <path
                  d="M19 10V12C19 15.9 15.9 19 12 19C8.1 19 5 15.9 5 12V10H7V12C7 14.8 9.2 17 12 17C14.8 17 17 14.8 17 12V10H19Z"
                  fill="currentColor"
                />
                <path
                  d="M12 19V22H8V24H16V22H12V19Z"
                  fill="currentColor"
                />
              </svg>
            )}
          </div>
          {/* Play/Pause button overlay */}
          <button
            onClick={onPlayPause}
            className="absolute inset-0 flex items-center justify-center focus:outline-none bg-white/10 hover:bg-white/20 transition-all rounded-full"
            style={{ border: 'none' }}
          >
            {isPlaying ? (
              <div className="bg-white/20 rounded-full p-4">
                <div className="flex space-x-1">
                  <div className="w-1.5 h-6 bg-white rounded-full"></div>
                  <div className="w-1.5 h-6 bg-white rounded-full"></div>
                </div>
              </div>
            ) : (
              <div className="bg-white/20 rounded-full p-4">
                <div className="w-0 h-0 border-l-[12px] border-l-white border-y-[8px] border-y-transparent ml-1"></div>
              </div>
            )}
          </button>
        </div>
        <div className="flex items-center justify-between mt-4 text-white">
          <div className="flex items-center space-x-2">
            <span className="text-lg font-mono">
              {formatTime(currentTime)}
              {totalDuration && totalDuration > 0 ? `/${formatTime(totalDuration)}` : ''}
            </span>
          </div>
          <div className="flex items-center space-x-2 text-white/80">
            <Mic className="w-4 h-4" />
            <span className="text-sm font-medium">Voice</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function PlaybackPage() {
  const [searchParams] = useSearchParams();
  const audioUrl = searchParams.get('audio');
  const previewUrl = searchParams.get('preview');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [recordedDuration, setRecordedDuration] = useState(0);
  const [userProfile, setUserProfile] = useState<{name?: string; username?: string; avatar?: string} | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Get user profile from Farcaster SDK - same as your App.tsx
  useEffect(() => {
    const initializePlayback = async () => {
      try {
        await sdk.actions.ready();
        
        // Get user profile from Farcaster
        const context = await sdk.context;
        if (context.user) {
          setUserProfile({
            name: context.user.displayName || context.user.username,
            username: context.user.username,
            avatar: context.user.pfpUrl
          });
        }
        
        // Show loading for 2 seconds - same as main app
        setTimeout(() => {
          setIsLoading(false);
        }, 2000);
        
      } catch (error) {
        console.error('Failed to initialize playback:', error);
        // Fallback to mock data
        setUserProfile({
          name: "Voice Message",
          username: "@voicecaster",
          avatar: "https://via.placeholder.com/64x64/8B5CF6/FFFFFF?text=Voice"
        });
        setTimeout(() => {
          setIsLoading(false);
        }, 2000);
      }
    };

    initializePlayback();
  }, [previewUrl]);

  // Handle audio events - EXACT COPY from your App.tsx
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    const handleLoadedMetadata = () => {
      console.log('Audio metadata loaded, duration:', audio.duration);
      if (
        audio.duration &&
        !isNaN(audio.duration) &&
        isFinite(audio.duration) &&
        audio.duration !== Infinity
      ) {
        setDuration(audio.duration);
        setRecordedDuration(audio.duration);
      } else {
        // Fallback: use recorded duration if audio duration is invalid
        console.log('Using recorded duration as fallback:', recordedDuration);
        setDuration(recordedDuration);
        setRecordedDuration(recordedDuration);
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleCanPlayThrough = () => {
      // Additional check when audio is fully loaded
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
        setRecordedDuration(audio.duration);
      }
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('canplaythrough', handleCanPlayThrough);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.load();

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('canplaythrough', handleCanPlayThrough);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioUrl, duration]);

  // Play/pause audio - EXACT COPY from your App.tsx
  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Go back to main app
  const goToMainApp = () => {
    window.location.href = '/';
  };

  // Loading screen - EXACT SAME as your main app
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-purple-500 to-indigo-600 flex items-center justify-center">
        <BouncingMic />
      </div>
    );
  }

  // Error state if no audio URL
  if (!audioUrl) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-purple-500 to-indigo-600 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20 text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Audio Not Found</h1>
          <p className="text-white/90 mb-6">The voice message could not be loaded.</p>
          <button
            onClick={goToMainApp}
            className="bg-white text-purple-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-all"
          >
            Go to VoiceCaster
          </button>
        </div>
      </div>
    );
  }

  // Main UI - EXACT SAME structure as your App.tsx but for playback
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-purple-500 to-indigo-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20">
        {/* Header - same style as main app */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white drop-shadow-lg mb-2">Voice Message</h1>
          <p className="text-white/90 text-sm font-medium drop-shadow">Shared via VoiceCaster</p>
        </div>

        {/* Voice Preview Section - EXACT SAME as your App.tsx preview */}
        <div className="mb-8">
          <VoiceMessageCard 
            isPlaying={isPlaying}
            duration={duration}
            currentTime={currentTime}
            onPlayPause={togglePlayback}
            userProfile={userProfile || undefined}
            recordedDuration={recordedDuration}
          />
        </div>

        {/* Create Your Own CTA - same style as your main app */}
        <button
          onClick={goToMainApp}
          className="w-full bg-white text-purple-700 py-3 px-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center hover:bg-gray-100"
        >
          <RotateCcw className="w-5 h-5 mr-2" />
          Create Your Own Voice Message
        </button>

        {/* Hidden audio element - same as main app */}
        <audio
          ref={audioRef}
          src={audioUrl}
          className="hidden"
        />

        {/* Footer - same as main app */}
        <div className="text-center mt-4">
          <p className="text-white/70 text-xs">
            Yap away!
          </p>
        </div>
      </div>
    </div>
  );
}