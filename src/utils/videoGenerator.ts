interface GenerateVideoOptions {
  audioBlob: Blob;
  duration: number;
  userProfile?: {
    name?: string;
    username?: string;
    avatar?: string;
  };
}

export async function generateVideoWithWaveform({
  audioBlob,
  duration,
  userProfile
}: GenerateVideoOptions): Promise<Blob> {
  return new Promise((resolve, reject) => {
    console.log('🎬 Starting video generation with waveforms...');
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    // Set canvas size (square format like the UI)
    canvas.width = 720;
    canvas.height = 720;
    
    const audio = document.createElement('audio');
    audio.src = URL.createObjectURL(audioBlob);
    audio.crossOrigin = 'anonymous';
    
    audio.addEventListener('loadedmetadata', async () => {
      try {
        // Force basic WebM format that's widely supported
        let mimeType = 'video/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/mp4';
        }
        
        console.log('🎵 Using video format:', mimeType);
        
        // Create video stream from canvas at 30fps
        const stream = canvas.captureStream(30);
        
        // Simple approach - just add the original audio blob to the stream
        // Convert audio blob to audio element for playback sync
        const audioTrack = await createAudioTrack(audioBlob);
        if (audioTrack) {
          stream.addTrack(audioTrack);
        }
        
        // Create media recorder with basic settings
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: mimeType
        });
        
        const chunks: Blob[] = [];
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };
        
        mediaRecorder.onstop = () => {
          const videoBlob = new Blob(chunks, { type: mimeType });
          URL.revokeObjectURL(audio.src);
          console.log('✅ Video generation complete! Size:', videoBlob.size);
          resolve(videoBlob);
        };
        
        mediaRecorder.onerror = (event) => {
          console.error('❌ MediaRecorder error:', event);
          reject(new Error('Video recording failed'));
        };
        
        // Simple animation without complex audio analysis
        let animationId: number;
        let startTime = Date.now();
        let profileImg: HTMLImageElement | null = null;
        
        // Preload profile image
        if (userProfile?.avatar) {
          profileImg = new Image();
          profileImg.crossOrigin = 'anonymous';
          profileImg.src = userProfile.avatar;
        }
        
        const drawFrame = () => {
          // Clear canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Draw purple gradient background
          const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
          gradient.addColorStop(0, '#a855f7'); // purple-400
          gradient.addColorStop(1, '#9333ea'); // purple-600
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          const centerX = canvas.width / 2;
          const centerY = canvas.height / 2;
          
          // Simple animated rings (time-based, not audio-reactive)
          const time = (Date.now() - startTime) / 1000;
          const baseRadius = 140;
          
          // Multiple rings with different phases
          for (let i = 0; i < 3; i++) {
            const phase = i * 0.7;
            const radius = baseRadius + Math.sin(time * 2 + phase) * 20;
            const opacity = 0.3 - (i * 0.1);
            
            ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.stroke();
          }
          
          // Draw profile picture circle
          const profileRadius = 50;
          ctx.save();
          
          // Create circular clipping path
          ctx.beginPath();
          ctx.arc(centerX, centerY, profileRadius, 0, Math.PI * 2);
          ctx.clip();
          
          // Draw profile image or fallback
          if (profileImg && profileImg.complete) {
            ctx.drawImage(profileImg, centerX - profileRadius, centerY - profileRadius, profileRadius * 2, profileRadius * 2);
          } else {
            // Fallback: purple circle with mic emoji
            ctx.fillStyle = '#8B5CF6';
            ctx.fillRect(centerX - profileRadius, centerY - profileRadius, profileRadius * 2, profileRadius * 2);
            ctx.font = '40px system-ui';
            ctx.textAlign = 'center';
            ctx.fillStyle = 'white';
            ctx.fillText('🎤', centerX, centerY + 15);
          }
          
          ctx.restore();
          
          // Draw profile picture border
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(centerX, centerY, profileRadius, 0, Math.PI * 2);
          ctx.stroke();
          
          // Draw text overlay at top
          ctx.fillStyle = 'white';
          ctx.font = 'bold 28px system-ui';
          ctx.textAlign = 'center';
          ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
          ctx.shadowBlur = 4;
          ctx.fillText("y'all ready for a story?", centerX, 100);
          ctx.shadowBlur = 0;
          
          // Draw duration at bottom left
          const currentTime = audio.currentTime;
          const totalTime = audio.duration || duration;
          const timeText = `${formatTime(currentTime)}/${formatTime(totalTime)}`;
          
          ctx.font = '20px monospace';
          ctx.fillStyle = 'white';
          ctx.textAlign = 'left';
          ctx.fillText(timeText, 80, canvas.height - 100);
          
          // Draw speaker and voice on TOP RIGHT
          ctx.textAlign = 'right';
          ctx.font = '18px system-ui';
          ctx.fillText('🔊 🎤 Voice', canvas.width - 80, 80);
          
          // Continue animation while recording
          if (mediaRecorder.state === 'recording') {
            animationId = requestAnimationFrame(drawFrame);
          }
        };
        
        // Helper function to format time
        const formatTime = (seconds: number): string => {
          if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
          const mins = Math.floor(seconds / 60);
          const secs = Math.floor(seconds % 60);
          return `${mins}:${secs.toString().padStart(2, '0')}`;
        };
        
        // Helper function to create audio track
        async function createAudioTrack(audioBlob: Blob): Promise<MediaStreamTrack | null> {
          try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const arrayBuffer = await audioBlob.arrayBuffer();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            
            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            
            const destination = audioContext.createMediaStreamDestination();
            source.connect(destination);
            
            return destination.stream.getAudioTracks()[0];
          } catch (error) {
            console.error('Failed to create audio track:', error);
            return null;
          }
        }
        
        // Start recording
        console.log('🎬 Starting video recording...');
        mediaRecorder.start(500);
        
        // Start animation
        startTime = Date.now();
        drawFrame();
        
        // Stop recording after the duration
        setTimeout(() => {
          if (mediaRecorder.state === 'recording') {
            console.log('⏰ Duration reached, stopping recording');
            cancelAnimationFrame(animationId);
            mediaRecorder.stop();
          }
        }, duration * 1000);
        
      } catch (error) {
        console.error('❌ Video generation setup failed:', error);
        reject(error);
      }
    });
    
    audio.addEventListener('error', (error) => {
      console.error('❌ Audio loading failed:', error);
      reject(new Error('Audio loading failed'));
    });
    
    // Load the audio
    audio.load();
  });
}