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
      console.log('TEST video created! Size:', videoBlob.size);
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
      console.log('🎬 Creating video with VoiceMessageCard UI...');
      
      // Load the mic.svg as an image FIRST
      const micImage = new Image();
      micImage.src = '/mic.svg';
      await new Promise((resolveImage) => {
        micImage.onload = () => resolveImage(null);
        micImage.onerror = () => {
          console.warn('Failed to load mic.svg, will use fallback');
          resolveImage(null);
        };
      });
      
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
          await new Promise((resolveProfile, rejectProfile) => {
            profileImage!.onload = () => resolveProfile(null);
            profileImage!.onerror = () => rejectProfile(null);
            profileImage!.src = userProfile.avatar!;
          });
          console.log('Profile image loaded');
        } catch (error) {
          console.log('Profile image failed, using fallback');
          profileImage = null;
        }
      }
      
      // Draw frame function - EXACT VoiceMessageCard styling
      const drawFrame = (timeProgress: number = 0) => {
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
        
        // Calculate pulse scale for the profile image/mic icon
        const pulseScale = 1 + Math.sin(timeProgress * 3) * 0.04; // 4% size pulse, faster

        // Draw glowing halo (faded, blurred outline)
        ctx.save();
        ctx.globalAlpha = 0.18; // subtle glow
        ctx.shadowColor = '#fff';
        ctx.shadowBlur = 25; // thicker glow
        ctx.beginPath();
        ctx.arc(centerX, centerY, 46 * pulseScale, 0, Math.PI * 2); // larger radius for thicker halo
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.restore();

        // Draw profile image or mic icon (pulsing)
        if (profileImage) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(centerX, centerY, 40 * pulseScale, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(
            profileImage,
            centerX - 40 * pulseScale,
            centerY - 40 * pulseScale,
            80 * pulseScale,
            80 * pulseScale
          );
          ctx.restore();

          // Border around profile image
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(centerX, centerY, 40 * pulseScale, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          // Draw SVG-style microphone instead of emoji
          ctx.save();
          ctx.translate(centerX, centerY);
          ctx.scale(pulseScale, pulseScale);
          ctx.fillStyle = 'white';
          
          // Draw mic capsule
          ctx.fillRect(-6, -12, 12, 16);
          ctx.beginPath();
          ctx.roundRect(-6, -12, 12, 16, 4);
          ctx.fill();
          
          // Draw mic stand/arc
          ctx.strokeStyle = 'white';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, 18, 0.2 * Math.PI, 0.8 * Math.PI);
          ctx.stroke();
          
          // Draw mic base
          ctx.fillRect(-6, 15, 12, 3);
          
          ctx.restore();
        }
        
        // Bottom section - time and controls
        const bottomY = canvas.height - 40;
        
        // Voice label with mic icon (right side) - using actual mic.svg
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '500 14px Inter, system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        
        // Draw "Voice" text first to measure it
        const voiceText = 'Voice';
        const textWidth = ctx.measureText(voiceText).width;
        ctx.fillText(voiceText, canvas.width - 24, bottomY);
        
        // Draw the actual mic.svg (scaled down to small icon size)
        if (micImage && micImage.complete) {
          const micSize = 16; // Small size for the icon
          const micX = canvas.width - 24 - textWidth - micSize - 4; // Position with small gap
          const micY = bottomY - micSize;
          
          ctx.drawImage(micImage, micX, micY, micSize, micSize);
        }
      };
      
      // Draw initial frame
      drawFrame(0);
      
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
        console.log('VoiceMessageCard-style video created! Size:', videoBlob.size);
        resolve(videoBlob);
      };
      
      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        audioContext.close();
        reject(new Error('MediaRecorder failed'));
      };
      
      // Animation during recording - toggle play/pause state
      let animationStartTime = Date.now();

      const animateCard = () => {
        const elapsed = (Date.now() - animationStartTime) / 1000;
        if (elapsed < actualDuration) {
          // No need to toggle play/pause, just animate
          drawFrame(elapsed);
          setTimeout(animateCard, 200); // Update every 200ms
        }
      };
      
      // Start everything
      console.log('Starting VoiceMessageCard video recording...');
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
      console.error('VoiceMessageCard video generation failed:', error);
      reject(error);
    }
  });
}

// Generate a PNG preview of the Voice Card UI (for OG image)
export async function generateVoiceCardPreview({
  userProfile
}: {
  userProfile?: {
    name?: string;
    username?: string;
    avatar?: string;
  };
}): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  canvas.width = 400;
  canvas.height = 280;

  // Load profile image if available
  let profileImage: HTMLImageElement | null = null;
  if (userProfile?.avatar) {
    try {
      profileImage = new Image();
      profileImage.crossOrigin = 'anonymous';
      await new Promise((resolve, reject) => {
        profileImage!.onload = () => resolve(null);
        profileImage!.onerror = () => reject(null);
        profileImage!.src = userProfile.avatar!;
      });
    } catch (error) {
      profileImage = null;
    }
  }

  // Draw frame (static, no pulse)
  // Gradient background
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#c084fc'); // purple-400
  gradient.addColorStop(1, '#9333ea'); // purple-600
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Rounded corners
  ctx.globalCompositeOperation = 'destination-in';
  ctx.beginPath();
  ctx.roundRect(0, 0, canvas.width, canvas.height, 16);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';

  // Center area for profile/icon
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2 - 10;

  // Glowing halo (static)
  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.shadowColor = '#fff';
  ctx.shadowBlur = 25;
  ctx.beginPath();
  ctx.arc(centerX, centerY, 46, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.restore();

  // Draw profile image or mic icon
  if (profileImage) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, 40, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(
      profileImage,
      centerX - 40,
      centerY - 40,
      80,
      80
    );
    ctx.restore();
    // Border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 40, 0, Math.PI * 2);
    ctx.stroke();
  }  else {
  // Draw SVG-style microphone instead of emoji
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.fillStyle = 'white';
  
  // Draw mic capsule
  ctx.fillRect(-6, -12, 12, 16);
  ctx.beginPath();
  ctx.roundRect(-6, -12, 12, 16, 4);
  ctx.fill();
  
  // Draw mic stand/arc
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, 18, 0.2 * Math.PI, 0.8 * Math.PI);
  ctx.stroke();
  
  // Draw mic base
  ctx.fillRect(-6, 15, 12, 3);
  
  ctx.restore();
}
  

  // Voice label (right side)
  const bottomY = canvas.height - 40;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.font = '14px Arial';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillText('Voice', canvas.width - 24, bottomY);

  // Return PNG blob
  return await new Promise<Blob>((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob!);
    }, 'image/png');
  });
}