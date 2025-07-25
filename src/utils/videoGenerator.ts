export interface VideoGenerationOptions {
  audioBlob: Blob;
  duration: number;
  userProfile?: {
    avatar?: string;
    username?: string;
  };
  message?: string;
}

export const generateVideoFromAudio = async (options: VideoGenerationOptions): Promise<Blob> => {
  console.log('🎬 Video generation started with options:', options);
  
  const { audioBlob, duration, message = "" } = options;
  
  try {
    // Create canvas for video frames
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Canvas 2D context not supported');
    }
    
    console.log('✅ Canvas created');
    console.log('📊 Audio blob size:', audioBlob.size);
    console.log('⏱️ Duration:', duration);
    
    // Set video dimensions
    canvas.width = 720;
    canvas.height = 720;
    
    // Create audio element from your recorded audio
    const audio = document.createElement('audio');
    audio.src = URL.createObjectURL(audioBlob);
    audio.muted = false; // Make sure audio is not muted
    
    // Wait for audio to load
    await new Promise((resolve, reject) => {
      audio.onloadedmetadata = resolve;
      audio.onerror = reject;
      audio.load();
    });
    
    console.log('✅ Audio loaded, duration:', audio.duration);
    
    // Create video stream from canvas
    const canvasStream = (canvas as any).captureStream(30) as MediaStream;
    console.log('✅ Canvas stream created');
    
    // Create audio context to capture audio
    const audioContext = new AudioContext();
    const source = audioContext.createMediaElementSource(audio);
    const destination = audioContext.createMediaStreamDestination();
    
    // Connect audio source to destination (for recording) and to speakers (for monitoring)
    source.connect(destination);
    source.connect(audioContext.destination);
    
    // Combine video and audio streams
    const combinedStream = new MediaStream();
    
    // Add video tracks from canvas
    canvasStream.getVideoTracks().forEach(track => {
      combinedStream.addTrack(track);
    });
    
    // Add audio tracks from your recording
    destination.stream.getAudioTracks().forEach(track => {
      combinedStream.addTrack(track);
    });
    
    console.log('✅ Combined stream created with tracks:', combinedStream.getTracks().length);
    
    // Check MediaRecorder support
    const supportedTypes = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=vp9', 
      'video/webm;codecs=vp8',
      'video/webm',
      'video/mp4'
    ];
    
    let mimeType = '';
    for (const type of supportedTypes) {
      if (MediaRecorder.isTypeSupported(type)) {
        mimeType = type;
        break;
      }
    }
    
    if (!mimeType) {
      throw new Error('No supported video MIME types found');
    }
    
    console.log('✅ Using MIME type:', mimeType);
    
    // Set up MediaRecorder with combined stream
    const mediaRecorder = new MediaRecorder(combinedStream, { mimeType });
    console.log('✅ MediaRecorder created');
    
    const chunks: Blob[] = [];
    
    return new Promise((resolve, reject) => {
      mediaRecorder.ondataavailable = (event) => {
        console.log('📦 Video chunk received, size:', event.data.size);
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        console.log('🎬 Recording stopped, total chunks:', chunks.length);
        const videoBlob = new Blob(chunks, { type: mimeType });
        console.log('📹 Final video blob size:', videoBlob.size);
        
        // Clean up
        combinedStream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
        audioContext.close();
        URL.revokeObjectURL(audio.src);
        
        resolve(videoBlob);
      };
      
      mediaRecorder.onerror = (event) => {
        console.error('❌ MediaRecorder error:', event);
        reject(new Error('Video recording failed'));
      };
      
      // Start recording
      console.log('🎬 Starting MediaRecorder...');
      mediaRecorder.start(100);
      
      // Start audio playback (this drives the timing)
      audio.play().then(() => {
        console.log('🔊 Audio playback started');
        
        // Draw frames while audio is playing
        let frameCount = 0;
        const fps = 30;
        const totalFrames = Math.ceil(duration * fps);
        
        const drawFrame = () => {
          // Clear canvas with gradient background
          const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
          gradient.addColorStop(0, '#a855f7');
          gradient.addColorStop(0.5, '#8b5cf6');
          gradient.addColorStop(1, '#6366f1');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Draw message at top
          ctx.fillStyle = 'white';
          ctx.font = 'bold 24px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(message, canvas.width / 2, 100);
          
          // Draw mic icon with pulsing effect
          const centerX = canvas.width / 2;
          const centerY = canvas.height / 2;
          const currentTime = audio.currentTime;
          const progress = currentTime / duration;
          
          // Pulsing circle
          const pulseRadius = 80 + Math.sin(currentTime * 10) * 15;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
          ctx.beginPath();
          ctx.arc(centerX, centerY, pulseRadius, 0, 2 * Math.PI);
          ctx.fill();
          
          // Mic icon background
          ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.beginPath();
          ctx.arc(centerX, centerY, 60, 0, 2 * Math.PI);
          ctx.fill();
          
          // Simple mic shape
          ctx.fillStyle = 'white';
          ctx.fillRect(centerX - 8, centerY - 20, 16, 30);
          ctx.beginPath();
          ctx.arc(centerX, centerY - 5, 8, Math.PI, 0);
          ctx.fill();
          ctx.fillRect(centerX - 2, centerY + 15, 4, 10);
          ctx.fillRect(centerX - 15, centerY + 23, 30, 4);
          
          // Progress bar
          const barWidth = 200;
          const barHeight = 6;
          const barX = (canvas.width - barWidth) / 2;
          const barY = canvas.height - 80;
          
          ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.fillRect(barX, barY, barWidth, barHeight);
          
          ctx.fillStyle = 'white';
          ctx.fillRect(barX, barY, barWidth * progress, barHeight);
          
          // Time display
          const formatTime = (seconds: number) => {
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins}:${secs.toString().padStart(2, '0')}`;
          };
          
          ctx.fillStyle = 'white';
          ctx.font = '18px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(
            `${formatTime(currentTime)} / ${formatTime(duration)}`,
            canvas.width / 2,
            canvas.height - 50
          );
          
          frameCount++;
          
          // Continue drawing frames while audio is playing
          if (!audio.ended && frameCount < totalFrames * 2) { // Give some buffer
            requestAnimationFrame(drawFrame);
          }
        };
        
        // Start drawing frames
        drawFrame();
        
        // Stop recording when audio ends
        audio.onended = () => {
          console.log('🔊 Audio ended, stopping recording...');
          setTimeout(() => {
            mediaRecorder.stop();
          }, 500); // Small delay to ensure last frames are captured
        };
        
      }).catch(reject);
    });
    
  } catch (error) {
    console.error('❌ Video generation error:', error);
    throw error;
  }
};