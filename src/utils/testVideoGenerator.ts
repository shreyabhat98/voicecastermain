// SUPER SIMPLE TEST - Just video, no audio complications
export async function generateTestVideo(): Promise<Blob> {
  return new Promise((resolve, reject) => {
    console.log('🎬 Creating TEST video...');
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = 640;
    canvas.height = 640;
    
    const stream = canvas.captureStream(30);
    const mediaRecorder = new MediaRecorder(stream);
    const chunks: Blob[] = [];
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };
    
    mediaRecorder.onstop = () => {
      const videoBlob = new Blob(chunks, { type: 'video/webm' });
      console.log('✅ TEST video created! Size:', videoBlob.size);
      resolve(videoBlob);
    };
    
    mediaRecorder.onerror = reject;
    
    let frame = 0;
    const animate = () => {
      // Purple background
      ctx.fillStyle = '#8B5CF6';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Pulsing white circle
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = 50 + Math.sin(frame * 0.2) * 10;
      
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();
      
      // Text
      ctx.fillStyle = 'black';
      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('TEST VIDEO', centerX, centerY);
      
      frame++;
      
      if (frame < 150) { // 5 seconds at 30fps
        requestAnimationFrame(animate);
      } else {
        mediaRecorder.stop();
      }
    };
    
    mediaRecorder.start();
    animate();
  });
}

// PROVEN METHOD - Based on working audioToVideo.ts
export async function generateSimpleVoiceVideo({
  audioBlob,
  //duration,
  userProfile
}: {
  audioBlob: Blob;
  duration: number;
  userProfile?: {
    name?: string;
    username?: string;
    avatar?: string;
  };
}): Promise<Blob> {
  const canvas = document.createElement('canvas');
  
  // Check browser support first
  if (typeof canvas.captureStream !== 'function') {
    throw new Error('Your browser does not support canvas.captureStream()');
  }
  if (
    typeof window.MediaRecorder !== 'function' ||
    !(window.AudioContext || (window as any).webkitAudioContext)
  ) {
    throw new Error('This browser does not support MediaRecorder or AudioContext');
  }

  return new Promise(async (resolve, reject) => {
    try {
      console.log('🎬 Using proven audio-to-video method...');
      
      // Setup canvas with your Twitter-style UI
      const ctx = canvas.getContext('2d')!;
      canvas.width = 720;
      canvas.height = 720;
      
      // PROVEN AUDIO METHOD from audioToVideo.ts
      const audioArrayBuffer = await audioBlob.arrayBuffer();
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(audioArrayBuffer);
      const actualDuration = audioBuffer.duration;
      
      console.log('📊 Audio buffer duration:', actualDuration, 'seconds');
      
      // Skip profile image loading for now - focus on getting audio working
      console.log('🖼️ Profile data:', userProfile);
      
      // Draw static frame (will be captured once at low framerate)
      const drawFrame = (timeProgress: number = 0) => {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Purple gradient background
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#a855f7');
        gradient.addColorStop(1, '#9333ea');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        // Animated rings (simple time-based)
        for (let i = 0; i < 3; i++) {
          const radius = 140 + i * 40 + Math.sin(timeProgress * 2 + i) * 15;
          const opacity = 0.3 - i * 0.08;
          
          ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          ctx.stroke();
        }
        
        // Profile circle background
        ctx.fillStyle = '#8B5CF6';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 60, 0, Math.PI * 2);
        ctx.fill();
        
        // Profile circle border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 60, 0, Math.PI * 2);
        ctx.stroke();
        
        // Always use mic emoji for now (no image loading complexity)
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'white';
        ctx.fillText('🎤', centerX, centerY);
        
        // Text at top
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = 'white';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 4;
        ctx.fillText("y'all ready for a story?", centerX, 80);
        ctx.shadowBlur = 0;
        
        // Duration at bottom left
        const currentTime = Math.floor(timeProgress);
        const totalTime = Math.floor(actualDuration);
        const timeText = `${Math.floor(currentTime/60)}:${(currentTime%60).toString().padStart(2,'0')}/${Math.floor(totalTime/60)}:${(totalTime%60).toString().padStart(2,'0')}`;
        
        ctx.font = '24px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillStyle = 'white';
        ctx.fillText(timeText, 80, canvas.height - 80);
        
        // Voice label at top right
        ctx.textAlign = 'right';
        ctx.font = '20px Arial';
        ctx.textBaseline = 'top';
        ctx.fillStyle = 'white';
        ctx.fillText('🔊 🎤 Voice', canvas.width - 80, 80);
      };
      
      // Draw initial frame
      drawFrame(0);
      
      // Create streams
      const canvasStream = canvas.captureStream(1); // Low framerate since it's mostly static
      const audioSource = audioContext.createBufferSource();
      audioSource.buffer = audioBuffer;
      const audioDestination = audioContext.createMediaStreamDestination();
      audioSource.connect(audioDestination);
      
      // Combine video and audio streams
      const combinedStream = new MediaStream();
      canvasStream.getVideoTracks().forEach(track => combinedStream.addTrack(track));
      audioDestination.stream.getAudioTracks().forEach(track => combinedStream.addTrack(track));
      
      // Use MP4 for better mobile compatibility
      const mimeType = MediaRecorder.isTypeSupported('video/mp4;codecs=h264,aac')
        ? 'video/mp4;codecs=h264,aac'
        : MediaRecorder.isTypeSupported('video/mp4')
        ? 'video/mp4'
        : MediaRecorder.isTypeSupported('video/webm')
        ? 'video/webm'
        : 'video/mp4'; // Force MP4 as fallback
      
      console.log('🎵 Using mime type for mobile:', mimeType);
      
      const mediaRecorder = new MediaRecorder(combinedStream, { mimeType });
      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
          console.log('📦 Chunk received:', event.data.size, 'bytes');
        }
      };
      
      mediaRecorder.onstop = () => {
        audioContext.close();
        const videoBlob = new Blob(chunks, { type: mimeType });
        console.log('✅ Video with audio created! Size:', videoBlob.size, 'Duration should be:', actualDuration);
        resolve(videoBlob);
      };
      
      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        audioContext.close();
        reject(new Error('MediaRecorder failed'));
      };
      
      // Add simple animation during recording
      let animationStartTime = Date.now();
      const animateRings = () => {
        const elapsed = (Date.now() - animationStartTime) / 1000;
        if (elapsed < actualDuration) {
          drawFrame(elapsed);
          setTimeout(animateRings, 100); // Update every 100ms
        }
      };
      
      // Start everything
      console.log('🚀 Starting recording and audio playback...');
      mediaRecorder.start(1000); // Collect data every second
      audioSource.start(0);
      animateRings(); // Start animation
      
      // Stop everything when audio ends
      setTimeout(() => {
        audioSource.stop();
        setTimeout(() => {
          if (mediaRecorder.state !== 'inactive') {
            console.log('🛑 Stopping media recorder...');
            mediaRecorder.stop();
          }
        }, 500);
      }, actualDuration * 1000);
      
    } catch (error) {
      console.error('❌ Video generation failed:', error);
      reject(error);
    }
  });
}