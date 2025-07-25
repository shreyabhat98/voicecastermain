import { sdk } from "@farcaster/frame-sdk";
import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Send, Trash2, Volume2, RotateCcw } from 'lucide-react';
import { uploadAudioFile } from './utils/supabase';
import { generateVideoFromAudio } from './utils/videoGenerator';

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

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedDuration, setRecordedDuration] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    sdk.actions.ready();
    
    // Show loading bounce for 2 seconds
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  }, []);

  // Debug function to test browser support
  const testBrowserSupport = () => {
    console.log('🔍 Testing browser support...');
    
    // Check MediaRecorder support
    console.log('MediaRecorder supported:', !!window.MediaRecorder);
    
    // Check Canvas support
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    console.log('Canvas 2D supported:', !!ctx);
    
    // Check captureStream support
    console.log('Canvas captureStream supported:', !!(canvas as any).captureStream);
    
    // Check AudioContext support
    console.log('AudioContext supported:', !!(window.AudioContext || (window as any).webkitAudioContext));
    
    // Check supported MIME types
    const mimeTypes = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
      'video/mp4'
    ];
    
    mimeTypes.forEach(type => {
      console.log(`${type} supported:`, MediaRecorder.isTypeSupported(type));
    });
  };

  // Add this function to test mobile capabilities
  const testMobileCapabilities = () => {
    console.log('📱 Testing mobile capabilities...');
    console.log('User agent:', navigator.userAgent);
    console.log('Is mobile:', /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    console.log('getUserMedia supported:', !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia));
    console.log('MediaRecorder supported:', !!window.MediaRecorder);
    
    // Test supported audio formats on mobile
    const audioFormats = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/wav',
      'audio/ogg'
    ];
    
    audioFormats.forEach(format => {
      console.log(`${format} supported:`, MediaRecorder.isTypeSupported(format));
    });
  };

  // Start recording - mobile-friendly version
  const startRecording = async () => {
    try {
      console.log('🎤 Starting recording...');
      
      // Mobile-friendly audio constraints
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          // Remove any advanced constraints that might fail on mobile
          sampleRate: undefined,
          channelCount: undefined,
          sampleSize: undefined
        }
      };
      
      console.log('📱 Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('✅ Microphone access granted');
      
      // Check if MediaRecorder supports the audio stream
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        console.log('audio/webm not supported, trying audio/mp4');
        if (!MediaRecorder.isTypeSupported('audio/mp4')) {
          console.log('audio/mp4 not supported, using default');
        }
      }
      
      // Use supported audio format
      const options: MediaRecorderOptions = {};
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        options.mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        options.mimeType = 'audio/webm';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        options.mimeType = 'audio/mp4';
      }
      
      console.log('🎵 Using MIME type:', options.mimeType || 'default');
      
      mediaRecorderRef.current = new MediaRecorder(stream, options);
      chunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        console.log('📦 Audio chunk received, size:', event.data.size);
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        console.log('🛑 Recording stopped, chunks:', chunksRef.current.length);
        const mimeType = options.mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: mimeType });
        console.log('📊 Final audio blob size:', blob.size);
        
        if (blob.size === 0) {
          alert('⚠️ Recording failed - no audio data captured. Please check microphone permissions and try again.');
          return;
        }
        
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.onerror = (event) => {
        console.error('❌ MediaRecorder error:', event);
        alert('Recording failed. Please try again.');
      };

      mediaRecorderRef.current.start(100); // Capture every 100ms for better mobile compatibility
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      console.log('🔴 Recording started successfully');
      
    } catch (error) {
      console.error('❌ Error accessing microphone:', error);
      
      // More specific error messages
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          alert('🚫 Microphone access denied. Please allow microphone permissions and try again.');
        } else if (error.name === 'NotFoundError') {
          alert('🎤 No microphone found. Please connect a microphone and try again.');
        } else if (error.name === 'NotSupportedError') {
          alert('📱 Audio recording not supported on this device/browser.');
        } else {
          alert(`❌ Recording error: ${error.message}`);
        }
      } else {
        alert('❌ Unknown recording error. Please try again.');
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
        // Save the recorded duration AFTER stopping the timer
        setRecordedDuration(recordingTime);
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
      console.log('Audio duration loaded:', audio.duration);
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleLoadedData = () => {
      // Another event that fires when audio data is loaded
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    // Force the audio to load
    audio.load();

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioUrl]);

  // Format time
  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Function to open Farcaster app with the video - Mini App compatible
  const openFarcasterWithVideo = (videoUrl: string) => {
    console.log('🚀 Opening Farcaster with video:', videoUrl);
    console.log('📱 User agent:', navigator.userAgent);
    console.log('🔍 Parent window:', window.parent !== window ? 'Mini App' : 'Standalone');
    
    // Check if we're running inside Farcaster Mini App
    const isInMiniApp = window.parent !== window || 
                       navigator.userAgent.includes('Farcaster') ||
                       window.location.href.includes('farcaster.xyz');
    
    console.log('🔍 Is in Mini App:', isInMiniApp);
    
    if (isInMiniApp) {
      // We're in a Farcaster Mini App - use SDK methods
      try {
        console.log('📱 Using Farcaster Mini App SDK...');
        
        // Method 1: Try to close mini app and open composer
        const castText = `🎤 Voice Cast\n\nCheck out my voice note!\n\n${videoUrl}`;
        
        // Try different SDK approaches
        if (sdk.actions.close) {
          console.log('🔄 Closing mini app...');
          sdk.actions.close();
          
          // Try to open compose after closing
          setTimeout(() => {
            const composeUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(castText)}`;
            window.open(composeUrl, '_parent');
          }, 500);
        } else if (sdk.actions.openUrl) {
          console.log('🔗 Opening URL via SDK...');
          const composeUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(castText)}`;
          sdk.actions.openUrl(composeUrl);
        } else {
          // Fallback: try to navigate parent window
          console.log('🔄 Fallback: navigating parent...');
          const castText = `🎤 Voice Cast\n\nCheck out my voice note!\n\n${videoUrl}`;
          const composeUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(castText)}`;
          window.parent.location.href = composeUrl;
        }
        
        // Show success message
        setTimeout(() => {
          alert(`🎉 Video ready to cast!\n\nVideo URL: ${videoUrl}\n\nThe Farcaster composer should open with your video ready to share!`);
        }, 1000);
        
      } catch (error) {
        console.error('❌ Mini App SDK failed:', error);
        
        // Fallback for mini app
        navigator.clipboard.writeText(videoUrl).then(() => {
          alert(`🎉 Video uploaded!\n\nVideo URL copied to clipboard: ${videoUrl}\n\n1. Close this mini app\n2. Start a new cast\n3. Paste the video URL\n4. Add your caption and cast!`);
        }).catch(() => {
          alert(`🎉 Video uploaded!\n\nVideo URL: ${videoUrl}\n\n1. Copy this URL\n2. Close this mini app\n3. Start a new cast\n4. Paste the URL and add your caption!`);
        });
      }
    } else {
      // We're in a standalone browser - use regular URL opening
      console.log('💻 Using standalone browser method...');
      
      const castText = `🎤 Voice Cast\n\nCheck out my voice note!`;
      const composeUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(castText)}&embeds=${encodeURIComponent(videoUrl)}`;
      
      try {
        window.open(composeUrl, '_blank');
        
        // Copy URL to clipboard as backup
        navigator.clipboard.writeText(videoUrl).then(() => {
          setTimeout(() => {
            alert(`🎉 Farcaster opened!\n\nVideo URL: ${videoUrl}\n\nIf the video didn't embed automatically, paste the URL in your cast!`);
          }, 1000);
        }).catch(() => {
          console.log('Could not copy to clipboard');
        });
        
      } catch (error) {
        console.error('❌ Failed to open Farcaster:', error);
        navigator.clipboard.writeText(videoUrl).then(() => {
          alert(`🎉 Video ready!\n\nVideo URL copied: ${videoUrl}\n\n1. Open Farcaster\n2. Start a new cast\n3. Paste the URL\n4. Add caption and cast!`);
        }).catch(() => {
          alert(`🎉 Video ready!\n\nVideo URL: ${videoUrl}\n\nCopy this and paste it in a new Farcaster cast!`);
        });
      }
    }
  };

  // Post to Farcaster (generates video and opens Farcaster app)
  const postToFarcaster = async () => {
    if (!audioBlob) return;
    
    setIsUploading(true);
    setIsProcessing(true);
    
    try {
      // Show bouncing mic for 2 seconds
      setTimeout(() => {
        setIsProcessing(false);
      }, 2000);
      
      console.log('🎬 Generating video...');
      
      // Generate video from audio
      const videoBlob = await generateVideoFromAudio({
        audioBlob,
        duration: duration > 0 ? duration : recordedDuration,
        userProfile: {
          username: 'user',
          avatar: undefined
        },
        message: "Check out my voice note!"
      });
      
      console.log('✅ Video generated!');
      console.log('📤 Uploading to Supabase...');
      
      // Upload video to Supabase
      const timestamp = Date.now();
      const videoFileName = `voice-video-${timestamp}.webm`;
      const videoUrl = await uploadAudioFile(videoBlob, videoFileName);
      
      setUploadedUrl(videoUrl);
      
      console.log('🎉 Upload complete!');
      console.log('🔗 Video URL:', videoUrl);
      
      // Open Farcaster with the video
      console.log('🚀 Opening Farcaster...');
      openFarcasterWithVideo(videoUrl);
      
    } catch (error) {
      console.error('❌ Process failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed: ${errorMessage}\n\nCheck the browser console for details.`);
    } finally {
      setIsUploading(false);
    }
  };

  // Clear recording and start over
  const redoRecording = () => {
    setAudioBlob(null);
    setAudioUrl('');
    setIsPlaying(false);
    setDuration(0);
    setCurrentTime(0);
    setUploadedUrl('');
    setRecordingTime(0);
    setRecordedDuration(0);
  };

  // Loading screen - just bouncing mic on gradient
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-purple-500 to-indigo-600 flex items-center justify-center">
        <BouncingMic />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-purple-500 to-indigo-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white drop-shadow-lg mb-2">Voice Caster</h1>
          <p className="text-white/90 text-sm font-medium drop-shadow">Record and share on Farcaster</p>
        </div>

        {/* Recording Section */}
        <div className="mb-8">
          {!audioBlob ? (
            <div className="text-center">
              {/* Debug buttons - remove after testing */}
              {!isRecording && (
                <div className="flex gap-2 mb-4 justify-center">
                  <button 
                    onClick={testBrowserSupport}
                    className="px-3 py-2 bg-blue-500 text-white rounded text-xs"
                  >
                   
                  </button>
                  <button 
                    onClick={testMobileCapabilities}
                    className="px-3 py-2 bg-green-500 text-white rounded text-xs"
                  >
                   
                  </button>
                </div>
              )}

              <div className="relative mb-6">
                {/* Main mic circle */}
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
                  <div className="text-white/70 text-sm">Recording...</div>
                </div>
              )}

              <div className="flex justify-center">
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={isRecording ? 'recording-button-active' : 'recording-button text-purple-700'}
                >
                  {isRecording ? (
                    <>
                      <Square className="w-5 h-5" style={{ marginRight: '8px' }} />
                      Stop Recording
                    </>
                  ) : (
                    <>
                      <Mic className="w-5 h-5" style={{ marginRight: '8px' }} />
                      Start Recording
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Audio Preview Section */
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold">Preview</h3>
                <button
                  onClick={redoRecording}
                  className="delete-button"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Audio Player */}
              <div className="flex items-center space-x-4 mb-6">
                <button
                  onClick={togglePlayback}
                  className="play-button rounded-full"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 text-white" />
                  ) : (
                    <Play className="w-5 h-5 text-white ml-1" />
                  )}
                </button>

                <div className="flex-1">
                  <div className="flex justify-between time-display mb-1">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration > 0 ? duration : recordedDuration)}</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${(duration > 0 ? duration : recordedDuration) > 0 ? (currentTime / (duration > 0 ? duration : recordedDuration)) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>

                <Volume2 className="w-5 h-5 text-white/70" />
              </div>

              <audio
                ref={audioRef}
                src={audioUrl}
                className="hidden"
              />

              {/* Action Buttons */}
              <div className="space-y-6">
                {/* Cast Button */}
                <button
                  onClick={postToFarcaster}
                  disabled={isUploading}
                  className="action-button disabled:opacity-50 text-white w-full"
                >
                  {isProcessing ? (
                    <>
                      <BouncingMic />
                      <span className="ml-2">Generating video...</span>
                    </>
                  ) : isUploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Cast to Farcaster
                    </>
                  )}
                </button>

                {/* Redo Button */}
                <button
                  onClick={redoRecording}
                  className="w-full bg-white/10 hover:bg-white/20 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center border border-white/20"
                >
                  <RotateCcw className="w-5 h-5 mr-2" />
                  Record Again
                </button>
              </div>

              {uploadedUrl && (
                <div className="mt-4 p-3 bg-green-500/10 border border-green-400/20 rounded-xl">
                  <div className="text-green-400 text-sm font-semibold mb-1">✓ Opening Farcaster...</div>
                  <div className="text-green-300 text-xs truncate">Your video is ready to cast!</div>
                </div>
              )}
            </div>
          )}
        </div>

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