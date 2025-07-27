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

// UPDATED - Matches VoiceMessageCard UI exactly
export async function generateSimpleVoiceVideo({
  audioBlob,
 // duration,
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
      console.log('🎬 Creating video with VoiceMessageCard UI...');
      
      // Setup canvas - match your card proportions
      const ctx = canvas.getContext('2d')!;
      canvas.width = 400;  // Adjusted for card proportions
      canvas.height = 280; // Adjusted for card proportions
      
      // PROVEN AUDIO METHOD
      const audioArrayBuffer = await audioBlob.arrayBuffer();
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(audioArrayBuffer);
      const actualDuration = audioBuffer.duration;
      
      console.log('📊 Audio buffer duration:', actualDuration, 'seconds');
      
      // Load profile image if available
      let profileImage: HTMLImageElement | null = null;
      if (userProfile?.avatar) {
        try {
          profileImage = new Image();
          profileImage.crossOrigin = 'anonymous';
          await new Promise((resolve, reject) => {
            profileImage!.onload = resolve;
            profileImage!.onerror = reject;
            profileImage!.src = userProfile.avatar!;
          });
          console.log('✅ Profile image loaded');
        } catch (error) {
          console.log('❌ Profile image failed, using fallback');
          profileImage = null;
        }
      }
      
      // Draw frame function - EXACT VoiceMessageCard styling
      const drawFrame = (timeProgress: number = 0, isPlaying: boolean = true) => {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // EXACT same gradient as VoiceMessageCard: from-purple-400 to-purple-600
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#c084fc'); // purple-400
        gradient.addColorStop(1, '#9333ea'); // purple-600
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Round corners (simulate rounded-2xl)
        ctx.globalCompositeOperation = 'destination-in';
        ctx.beginPath();
        ctx.roundRect(0, 0, canvas.width, canvas.height, 16);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
        
        // Speaker icon in top right (Volume2 icon)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '16px Arial';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';
        //ctx.fillText('🔊', canvas.width - 16, 16);
        
        // Title text - "y'all ready for a story?"
        ctx.fillStyle = 'white';
        ctx.font = '500 18px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        //ctx.fillText("y'all ready for a story?", 24, 24);
        
        // Center area for profile/icon
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2 - 10; // Slightly up
        
        // Profile image or mic icon (w-20 h-20 = 80px)
        if (profileImage) {
          // Draw circular profile image
          ctx.save();
          ctx.beginPath();
          ctx.arc(centerX, centerY, 40, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(profileImage, centerX - 40, centerY - 40, 80, 80);
          ctx.restore();
          
          // Border around profile image
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(centerX, centerY, 40, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          // Mic icon fallback (same as VoiceMessageCard)
          ctx.fillStyle = 'white';
          ctx.font = '48px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🎤', centerX, centerY);
        }
        
        // Play/pause controls overlay
        if (isPlaying) {
          // Pause bars (same as VoiceMessageCard)
          ctx.fillStyle = 'white';
          const barWidth = 6;  // w-1.5 = 6px
          const barHeight = 24; // h-6 = 24px
          const barSpacing = 4;  // space-x-1 = 4px
          
          ctx.fillRect(centerX - barSpacing/2 - barWidth, centerY - barHeight/2, barWidth, barHeight);
          ctx.fillRect(centerX + barSpacing/2, centerY - barHeight/2, barWidth, barHeight);
        } else {
          // Play triangle (same as VoiceMessageCard)
          ctx.fillStyle = 'white';
          ctx.beginPath();
          ctx.moveTo(centerX - 6, centerY - 8);
          ctx.lineTo(centerX + 6, centerY);
          ctx.lineTo(centerX - 6, centerY + 8);
          ctx.closePath();
          ctx.fill();
        }
        
        // Bottom section - time and controls
        const bottomY = canvas.height - 40;
        
        // Time display (left side)
        const currentTime = Math.floor(timeProgress);
        const totalTime = Math.floor(actualDuration);
        const timeText = `${Math.floor(currentTime/60)}:${(currentTime%60).toString().padStart(2,'0')}/${Math.floor(totalTime/60)}:${(totalTime%60).toString().padStart(2,'0')}`;
        
        ctx.fillStyle = 'white';
        ctx.font = '18px monospace'; // text-lg font-mono
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText(timeText, 24, bottomY);
        
        // Voice label (right side)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '14px Arial'; // text-sm
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.fillText('VoiceCaster', canvas.width - 24, bottomY);
      };
      
      // Draw initial frame
      drawFrame(0, true);
      
      // Create streams
      const canvasStream = canvas.captureStream(2); // Slightly higher for smooth animation
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
        : 'video/webm';
      
      console.log('🎵 Using mime type:', mimeType);
      
      const mediaRecorder = new MediaRecorder(combinedStream, { mimeType });
      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        audioContext.close();
        const videoBlob = new Blob(chunks, { type: mimeType });
        console.log('✅ VoiceMessageCard-style video created! Size:', videoBlob.size);
        resolve(videoBlob);
      };
      
      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        audioContext.close();
        reject(new Error('MediaRecorder failed'));
      };
      
      // Animation during recording - toggle play/pause state
      let animationStartTime = Date.now();
      let isPlaying = true;
      
      const animateCard = () => {
        const elapsed = (Date.now() - animationStartTime) / 1000;
        if (elapsed < actualDuration) {
          // Toggle play/pause every 2 seconds for demo
          isPlaying = Math.floor(elapsed / 2) % 2 === 0;
          drawFrame(elapsed, isPlaying);
          setTimeout(animateCard, 200); // Update every 200ms
        }
      };
      
      // Start everything
      console.log('🚀 Starting VoiceMessageCard video recording...');
      mediaRecorder.start(1000);
      audioSource.start(0);
      animateCard();
      
      // Stop when audio ends
      setTimeout(() => {
        audioSource.stop();
        setTimeout(() => {
          if (mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
          }
        }, 500);
      }, actualDuration * 1000);
      
    } catch (error) {
      console.error('❌ VoiceMessageCard video generation failed:', error);
      reject(error);
    }
  });
}