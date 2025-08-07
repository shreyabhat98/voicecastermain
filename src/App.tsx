import { sdk } from "@farcaster/frame-sdk";
import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Volume2, RotateCcw, Link, Download, Copy, ExternalLink } from 'lucide-react';
import { generateSimpleVoiceVideo, generateVoiceCardPreview } from './utils/testVideoGenerator';
import { generateShareableLink } from './utils/linkGenerator';

// Bouncing Mic SVG Component
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

// Voice Message Card Component
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
        <div className="relative w-32 h-32 mx-auto flex items-center justify-center group">
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
                className="text-white"
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
          {/* Play/Pause button overlay - custom style */}
          <div
            className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${isPlaying ? 'opacity-0' : 'opacity-100 group-hover:opacity-100'}`}
            style={{ pointerEvents: 'none' }}
          >
            <div
              className="w-0 h-0 border-l-[24px] border-l-white border-y-[16px] border-y-transparent ml-1 drop-shadow-lg"
              style={{ pointerEvents: 'auto' }}
            ></div>
          </div>
          <button
            onClick={onPlayPause}
            className="absolute inset-0 flex items-center justify-center focus:outline-none"
            style={{ background: 'transparent', border: 'none', zIndex: 10 }}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying && (
              <div className="flex space-x-1">
                <div className="w-1.5 h-6 bg-white rounded-full"></div>
                <div className="w-1.5 h-6 bg-white rounded-full"></div>
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
           {/*} <Mic className="w-4 h-4" />*/}
              <img 
            src="/mic-white.svg" 
            alt="Microphone" 
            width="20" 
            height="20"
          />
            <span className="text-sm font-medium">Voice</span>
          </div>
        </div>
      </div>
    </div>
  );
};

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedDuration, setRecordedDuration] = useState(0);
  const [shareOption, setShareOption] = useState<'link' | 'video' | null>(null);
  const [generatedLink, setGeneratedLink] = useState('');
  const [userProfile, setUserProfile] = useState<{name?: string; username?: string; avatar?: string} | null>(null);
  const [generatedVideoBlob, setGeneratedVideoBlob] = useState<Blob | null>(null); // NEW: Store generated video
  const [farcasterSuccess, setFarcasterSuccess] = useState(false);
  
  const MAX_RECORDING_TIME = 90;
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  // Get user profile from Farcaster SDK
  useEffect(() => {
    const initializeApp = async () => {
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
        
        // Show loading for 2 seconds
        setTimeout(() => {
          setIsLoading(false);
        }, 2000);
        
      } catch (error) {
        console.error('Failed to initialize app:', error);
        // Fallback to mock data
        setUserProfile({
          name: "You",
          username: "@voicecaster",
          avatar: "https://via.placeholder.com/64x64/8B5CF6/FFFFFF?text=🎤"
        });
        setTimeout(() => {
          setIsLoading(false);
        }, 2000);
      }
    };

    initializeApp();
  }, []);

  // Start recording
  const startRecording = async () => {
    try {
      console.log('🎤 Starting recording...');
      
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      const options: MediaRecorderOptions = {};
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        options.mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        options.mimeType = 'audio/webm';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        options.mimeType = 'audio/mp4';
      }
      
      mediaRecorderRef.current = new MediaRecorder(stream, options);
      chunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const mimeType = options.mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: mimeType });
        
        if (blob.size === 0) {
          alert('Recording failed - no audio data captured.');
          return;
        }
        
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        setRecordedDuration(recordingTime);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start(100);
      setIsRecording(true);
      setRecordingTime(0);
      
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          if (newTime >= MAX_RECORDING_TIME) {
            stopRecording();
            return MAX_RECORDING_TIME;
          }
          return newTime;
        });
      }, 1000);
      
    } catch (error) {
      console.error('Recording failed:', error);
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          alert('Microphone access denied. Please allow microphone permissions.');
        } else if (error.name === 'NotFoundError') {
          alert('No microphone found. Please connect a microphone.');
        } else {
          alert(`Recording error: ${error.message}`);
        }
      }
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  // Play/pause audio
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

  // Handle audio events
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
      } else {
        // Fallback: use recorded duration if audio duration is invalid
        console.log('Using recorded duration as fallback:', recordedDuration);
        setDuration(recordedDuration);
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
  }, [audioUrl, recordedDuration]);

  // Format time
  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Clear recording
  const redoRecording = () => {
    setAudioBlob(null);
    setAudioUrl('');
    setIsPlaying(false);
    setDuration(0);
    setCurrentTime(0);
    setShareOption(null);
    setGeneratedLink('');
    setRecordingTime(0);
    setRecordedDuration(0);
    setGeneratedVideoBlob(null); // Clear generated video
    setFarcasterSuccess(false);
  };

  // Web Share API function - INSTANT (no async delays)
  const saveToPhotos = async () => {
    if (!generatedVideoBlob) {
      alert('❌ No video ready. Please generate video first.');
      return;
    }

    const timestamp = Date.now();
    const filename = `voice-message-${timestamp}.mp4`;
    const sizeMB = generatedVideoBlob.size / 1024 / 1024;
    
    console.log('📱 INSTANT Web Share API call - blob size:', generatedVideoBlob.size);
    
    if (!navigator.share) {
      alert('❌ Web Share not supported in this browser.\n\nPlease use Safari or Chrome for direct saving to Photos.');
      return;
    }

    try {
      const file = new File([generatedVideoBlob], filename, { type: 'video/mp4' });
      
      console.log('📱 Web Share API - IMMEDIATE call with preserved gesture');
      
      await navigator.share({
        title: 'Voice Message',
        text: 'Voice message created with VoiceCaster',
        files: [file]
      });
      
      console.log('✅ Web Share API SUCCESS!');
      
    } catch (error) {
      console.error('❌ Web Share API failed:', error);

      if (error instanceof Error && error.name === 'AbortError') {
        console.log('User cancelled share');
        return;
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`❌ Share failed: ${errorMessage}\n\n💡 Try:\n• Make sure you have storage space\n• Try in Safari/Chrome\n• Check file size: ${sizeMB.toFixed(1)}MB`);
    }
  };

  // Copy link function
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`https://${generatedLink}`);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  // Handle share options - TWO STEP PROCESS for video
  const handleShareOption = async (option: 'link' | 'video') => {
    if (!audioBlob) return;
    
    setShareOption(option);
    setIsProcessing(true);
    
    try {
      if (option === 'link') {
        // Generate preview image
        console.log('🖼️ Generating preview image...');
        const previewImageBlob = await generateVoiceCardPreview({
          userProfile: userProfile || undefined
        });
        console.log('✅ Preview image generated, size:', previewImageBlob.size);
        
        // Generate shareable link with preview
        //const shareUrl = await generateShareableLink(audioBlob, previewImageBlob);
        const shareUrl = await generateShareableLink(audioBlob, previewImageBlob, userProfile || undefined);
        setGeneratedLink(shareUrl.replace('https://', ''));
        
        // Auto-open Farcaster compose with the link
        try {
          await sdk.actions.composeCast({
            text: `Voice message via VoiceCaster`,
            embeds: [shareUrl],
          });
          setFarcasterSuccess(true);
          console.log('✅ Farcaster compose opened successfully');
        } catch (error) {
          console.error('Farcaster compose failed:', error);
          setFarcasterSuccess(false);
          // Fallback to manual copy
        }
      } else {
        // STEP 1: Generate video and store it (preserve for instant Web Share later)
        console.log('🎬 STEP 1: Generating video...');
        console.log('Audio blob size:', audioBlob.size, 'Duration:', duration > 0 ? duration : recordedDuration);
        
        try {
          const videoBlob = await generateSimpleVoiceVideo({
            audioBlob,
            duration: duration > 0 ? duration : recordedDuration,
            userProfile: userProfile || undefined
          });
          
          console.log('✅ Video generated successfully, size:', videoBlob.size);
          
          // CRITICAL: Store the video blob for instant Web Share API
          setGeneratedVideoBlob(videoBlob);
          
          console.log('🎯 Video ready for INSTANT Web Share API call!');
          
        } catch (videoError) {
          console.error('Video generation failed:', videoError);
          alert('Video generation failed. The audio might be too long or the file too large. Try the Share Link option instead.');
        }
      }
    } catch (error) {
      console.error('Share failed:', error);
      alert('Share failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsProcessing(false);
    }
  };

  // Loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-purple-500 to-indigo-600 flex items-center justify-center">
        <BouncingMic />
      </div>
    );
  }

  console.log('VoiceMessageCard props:', { duration, recordedDuration });
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-purple-500 to-indigo-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white drop-shadow-lg mb-2">VoiceCaster</h1>
          <p className="text-white/90 text-sm font-medium drop-shadow">Record and share on Farcaster</p>
        </div>

        {/* Recording Section */}
        <div className="mb-8">
          {!audioBlob ? (
            <div className="text-center">
              <div className="relative mb-6">
                <div className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center transition-all duration-300 ${
                  isRecording 
                    ? 'bg-red-500/20 border-4 border-red-400 animate-pulse' 
                    : 'bg-white/10 border-4 border-white/30 hover:border-white/50'
                }`}>
                  <Mic className={`w-12 h-12 ${isRecording ? 'text-red-400' : 'text-white'}`} />
                  
                </div>
                
                {isRecording && (
                  <div className="absolute inset-0 w-32 h-32 mx-auto rounded-full border-4 border-red-400/30 animate-ping"></div>
                )}
              </div>

              {isRecording && (
                <div className="mb-4">
                  <div className="text-white text-lg font-mono">
                    {formatTime(recordingTime)}
                  </div>
                  <div className="text-white/70 text-sm">
                    {recordingTime >= MAX_RECORDING_TIME ? 'Maximum length reached' : `${MAX_RECORDING_TIME - recordingTime}s remaining`}
                  </div>
                </div>
              )}

              <div className="flex justify-center">
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`px-8 py-3 rounded-full font-semibold transition-all duration-200 flex items-center justify-center ${
                    isRecording 
                      ? 'bg-red-500 hover:bg-red-600 text-white' 
                      : 'bg-white hover:bg-gray-100 text-purple-700'
                  }`}
                >
                  {isRecording ? (
                    <>
                      <Square className="w-5 h-5 mr-2" />
                      Stop Recording
                    </>
                  ) : (
                    <>
                      <Mic className="w-5 h-5 mr-2" />
                      Start Recording
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : shareOption ? (
            /* Share Options Result */
            <div className="space-y-6">
              <VoiceMessageCard 
                isPlaying={isPlaying}
                duration={duration}
                currentTime={currentTime}
                onPlayPause={togglePlayback}
                userProfile={userProfile || undefined}
                recordedDuration={recordedDuration}
              />

              {shareOption === 'link' && (
                <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                  {isProcessing ? (
                    <div className="text-center">
                      <BouncingMic />
                      <p className="text-white mt-4">Creating shareable link...</p>
                    </div>
                  ) 
                  : farcasterSuccess ? (
                    <div>
                      {/*
                      <h3 className="text-white font-semibold mb-4">✅ Farcaster Compose Opened!</h3>
                      <div className="bg-green-500/10 border border-green-400/20 rounded-xl p-4 mb-4">
                        <div className="text-green-400 text-sm font-semibold mb-1">🎉 Success!</div>
                        <div className="text-green-300 text-xs">Your voice message link has been added to Farcaster compose. Just hit send!</div>
                      </div> 
                      */}
                      <div className="bg-white/10 rounded-xl p-4 mb-4">
                        <div className="flex items-center justify-between">
                          <span className="text-white/90 font-mono text-sm truncate mr-2">{generatedLink}</span>
                          <button
                            onClick={copyLink}
                            className="p-2 rounded-lg transition-all focus:outline-none group"
                            style={{ background: 'transparent' }}
                            aria-label="Copy to clipboard"
                          >
                            <Copy className="w-4 h-4 text-white/70 group-hover:text-white group-active:text-black transition-colors" />
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={() => window.open(`https://${generatedLink}`, '_blank')}
                        className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center mb-4"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Preview Link
                      </button>
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-white font-semibold mb-4">✓ Shareable Link Ready</h3>
                      <div className="bg-yellow-500/10 border border-yellow-400/20 rounded-xl p-4 mb-4">
                        <div className="text-yellow-400 text-sm font-semibold mb-1"> Manual Share Required</div>
                        <div className="text-yellow-300 text-xs">Farcaster compose didn't open automatically. Copy the link below and paste it in Farcaster.</div>
                      </div>
                      <div className="bg-white/10 rounded-xl p-4 mb-4">
                        <div className="flex items-center justify-between">
                          <span className="text-white/90 font-mono text-sm truncate mr-2">{generatedLink}</span>
                          <button
                            onClick={copyLink}
                            className="p-2 rounded-lg transition-all focus:outline-none group"
                            style={{ background: 'transparent' }}
                            aria-label="Copy to clipboard"
                          >
                            <Copy className="w-4 h-4 text-white/70 group-hover:text-white group-active:text-black transition-colors" />
                          </button>
                        </div>
                      </div>
                      <p className="text-white/70 text-sm mb-4">Copy this link and paste it in your Farcaster cast. It will show a beautiful audio preview!</p>
                      <button
                        onClick={() => window.open(`https://${generatedLink}`, '_blank')}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Preview Link
                      </button>
                    </div>
                  )
                  }
                </div>
              )} 

              {shareOption === 'video' && (
                <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                  {isProcessing ? (
                    <div className="text-center">
                      <BouncingMic />
                      <p className="text-white mt-4">Generating video</p>
                    </div>
                  ) : generatedVideoBlob ? (
                    <div>
                      <h3 className="text-white font-semibold mb-4"> Video Ready for saving!</h3>
                      <p className="text-white/70 text-sm mb-4">
                        Video generated successfully! Click below to save directly to Gallery.
                      </p>
                      <button
                        onClick={saveToPhotos}
                        className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center mb-4"
                      >
                        <Download className="w-5 h-5 mr-2" />
                         Save to Gallery
                      </button>
                      <button
                        onClick={() => handleShareOption('video')}
                        className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center"
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Regenerate Video
                      </button>
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-white font-semibold mb-4">Video Generation Failed</h3>
                      <p className="text-white/70 text-sm mb-4">
                        Something went wrong during video generation. Please try again or use Share Link instead.
                      </p>
                      <button
                        onClick={() => handleShareOption('video')}
                        className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center"
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Try Again
                      </button>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={() => setShareOption(null)}
                className="w-full bg-white/10 hover:bg-white/20 text-white py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center border border-white/20"
              >
                ← Back to Options
              </button>
            </div>
          ) : (
            /* Audio Preview Section */
            <div className="space-y-6">
              <VoiceMessageCard 
                isPlaying={isPlaying}
                duration={duration}
                currentTime={currentTime}
                onPlayPause={togglePlayback}
                userProfile={userProfile || undefined}
                recordedDuration={recordedDuration}
              />

              <div className="space-y-4">
                <h3 className="text-white font-semibold text-center">Choose how to share:</h3>
                
                {/* Detect mini app and show recommendation */}
                {(window.location !== window.parent.location || navigator.userAgent.includes('Farcaster')) && (
                  <div className="bg-blue-500/10 border border-blue-400/20 rounded-xl p-3 mb-4">
                    <div className="text-blue-400 text-sm font-semibold mb-1">📱 Mini App Detected</div>
                    <div className="text-blue-300 text-xs">Recommended: Use "Share Link" for best experience in Farcaster mini apps</div>
                  </div>
                )}
                
                <div className="space-y-6">
                  <button
                    onClick={() => handleShareOption('link')}
                    className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white p-4 rounded-xl transition-all text-center"
                  >
                    <Link className="w-6 h-6 mx-auto mb-2" />
                    <div className="font-semibold text-sm">Share Link</div>
                    <div className="text-xs text-white/70 mt-1">Copy & paste with preview (link redirects to audio)</div>
                  </button>

                  <button
                    onClick={() => handleShareOption('video')}
                    className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white p-4 rounded-xl transition-all text-left"
                  >
                    <Download className="w-6 h-6 mx-auto mb-2" />
                    <div className="font-semibold text-sm text-left">Download Video</div>
                    <div className="text-xs text-white/70 mt-2">Save to device and upload manually as a video</div>
                  </button>
                </div>
              </div>

              <button
                onClick={redoRecording}
                className="w-full bg-white/10 hover:bg-white/20 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center border border-white/20"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                Record Again
              </button>
            </div>
          )}
        </div>

        {/* Hidden audio element */}
        <audio
          ref={audioRef}
          src={audioUrl}
          className="hidden"
        />

        {/* Footer */}
        <div className="text-center">
          <p className="text-white/70 text-xs">
            Yap away!
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;