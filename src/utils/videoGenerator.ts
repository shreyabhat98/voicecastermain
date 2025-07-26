interface GenerateVideoOptions {
  audioBlob: Blob;
  duration: number;
  userProfile: {
    username: string;
    avatar?: string;
  };
  message: string;
}

export async function generateVideoFromAudio({
  audioBlob,
  duration,
  userProfile,
  //message
}: GenerateVideoOptions): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // Create canvas for video frames
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    // Set canvas size (mobile-friendly aspect ratio)
    canvas.width = 640;
    canvas.height = 640; // Square format works better for social media
    
    // Create video element for audio source
    const audio = document.createElement('audio');
    audio.src = URL.createObjectURL(audioBlob);
    
    // Check for MP4 support first, fallback to WebM
    let mimeType = 'video/mp4;codecs=h264,aac';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm;codecs=vp8,opus';
      console.warn('MP4 not supported, falling back to WebM');
    }
    
    console.log('Using video format:', mimeType);
    
    // Create MediaRecorder for video generation
    const stream = canvas.captureStream(30); // 30 FPS
    
    // Add audio track from the audio blob
    audio.addEventListener('loadedmetadata', () => {
      try {
        // Create audio context to process the audio
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const source = audioContext.createMediaElementSource(audio);
        const destination = audioContext.createMediaStreamDestination();
        
        source.connect(destination);
        source.connect(audioContext.destination);
        
        // Add audio track to video stream
        const audioTrack = destination.stream.getAudioTracks()[0];
        if (audioTrack) {
          stream.addTrack(audioTrack);
        }
        
        // Create MediaRecorder with mobile-compatible options
        const recorder = new MediaRecorder(stream, {
          mimeType,
          videoBitsPerSecond: 1000000, // 1 Mbps for good quality
          audioBitsPerSecond: 128000   // 128 kbps for good audio quality
        });
        
        const chunks: Blob[] = [];
        
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };
        
        recorder.onstop = () => {
          const videoBlob = new Blob(chunks, { 
            type: mimeType.includes('mp4') ? 'video/mp4' : 'video/webm' 
          });
          
          // Cleanup
          URL.revokeObjectURL(audio.src);
          audioContext.close();
          
          resolve(videoBlob);
        };
        
        recorder.onerror = (event) => {
          console.error('MediaRecorder error:', event);
          reject(new Error('Video recording failed'));
        };
        
        // Start recording and draw animated frames
        recorder.start(100); // Collect data every 100ms
        audio.play();
        
        let startTime = Date.now();
        let frame = 0;
        
        const drawFrame = () => {
          const elapsed = (Date.now() - startTime) / 1000;
          
          if (elapsed >= duration) {
            recorder.stop();
            audio.pause();
            return;
          }
          
          // Clear canvas
          ctx.fillStyle = 'linear-gradient(135deg, #8B5CF6, #3B82F6)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Create gradient background
          const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
          gradient.addColorStop(0, '#8B5CF6');
          gradient.addColorStop(1, '#3B82F6');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Draw animated waveform circles
          const centerX = canvas.width / 2;
          const centerY = canvas.height / 2;
          
          // Main circle (pulsing)
          const pulseSize = 60 + Math.sin(elapsed * 4) * 15;
          ctx.beginPath();
          ctx.arc(centerX, centerY, pulseSize, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.fill();
          
          // Outer ring
          ctx.beginPath();
          ctx.arc(centerX, centerY, 80, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.lineWidth = 3;
          ctx.stroke();
          
          // Mic icon (simplified)
          ctx.fillStyle = 'white';
          ctx.fillRect(centerX - 8, centerY - 15, 16, 25);
          ctx.beginPath();
          ctx.arc(centerX, centerY + 15, 12, 0, Math.PI);
          ctx.stroke();
          
          // Voice waves
          for (let i = 0; i < 3; i++) {
            const waveRadius = 100 + i * 25;
            const opacity = 0.4 - i * 0.1;
            const waveOffset = elapsed * 2 + i * 0.5;
            
            ctx.beginPath();
            ctx.arc(centerX, centerY, waveRadius + Math.sin(waveOffset) * 10, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
            ctx.lineWidth = 2;
            ctx.stroke();
          }
          
          // Title text
          ctx.fillStyle = 'white';
          ctx.font = 'bold 24px system-ui';
          ctx.textAlign = 'center';
          ctx.fillText('🎤 Voice Cast', centerX, centerY - 120);
          
          // Username
          ctx.font = '18px system-ui';
          ctx.fillText(`@${userProfile.username}`, centerX, centerY - 95);
          
          // Duration counter
          ctx.font = '16px monospace';
          const timeText = `${Math.floor(elapsed)}s / ${Math.floor(duration)}s`;
          ctx.fillText(timeText, centerX, centerY + 120);
          
          // VoiceCaster branding
          ctx.font = '14px system-ui';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.fillText('Created with VoiceCaster', centerX, canvas.height - 30);
          
          frame++;
          requestAnimationFrame(drawFrame);
        };
        
        drawFrame();
        
      } catch (error) {
        console.error('Audio processing error:', error);
        reject(error);
      }
    });
    
    audio.addEventListener('error', (error) => {
      console.error('Audio loading error:', error);
      reject(new Error('Audio loading failed'));
    });
    
    // Load audio
    audio.load();
  });
}